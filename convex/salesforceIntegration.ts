import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api, internal } from "./_generated/api";

// Salesforce integration for CRM sync
export const createSalesforceIntegration = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    credentials: v.object({
      instanceUrl: v.string(),
      accessToken: v.string(),
      refreshToken: v.optional(v.string()),
      clientId: v.string(),
      clientSecret: v.string()
    }),
    settings: v.object({
      syncContacts: v.boolean(),
      syncLeads: v.boolean(),
      syncOpportunities: v.boolean(),
      syncCampaigns: v.boolean(),
      autoCreateContacts: v.boolean(),
      bidirectionalSync: v.boolean(),
      fieldMappings: v.array(v.object({
        salesforceField: v.string(),
        smartbatchField: v.string(),
        direction: v.union(
          v.literal("import"),
          v.literal("export"), 
          v.literal("bidirectional")
        )
      })),
      syncFrequency: v.number(), // minutes
      webhookEvents: v.optional(v.array(v.string()))
    })
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("integrations", {
      userId: args.userId,
      name: args.name,
      type: "salesforce",
      status: "connected",
      credentials: args.credentials,
      settings: args.settings,
      lastSync: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  }
});

export const syncSalesforceContacts = action({
  args: {
    integrationId: v.id("integrations"),
    direction: v.optional(v.union(
      v.literal("import"),
      v.literal("export"),
      v.literal("bidirectional")
    ))
  },
  handler: async (ctx, args) => {
    const integration = await ctx.runQuery(api.integrations.getIntegration, {
      id: args.integrationId
    });

    if (!integration || integration.type !== "salesforce") {
      throw new Error("Invalid Salesforce integration");
    }

    const direction = args.direction || "import";
    const results = {
      imported: 0,
      exported: 0,
      errors: [] as string[]
    };

    try {
      // Start sync process
      const syncId = await ctx.runMutation(api.integrations.startSync, {
        integrationId: args.integrationId,
        type: `contacts_${direction}` as any,
        direction: direction === "bidirectional" ? "bidirectional" : direction === "import" ? "inbound" : "outbound",
        options: {},
      });

      if (direction === "import" || direction === "bidirectional") {
        const importResult = await importSalesforceContacts(ctx, integration);
        results.imported = importResult.count;
        results.errors.push(...importResult.errors);
      }

      if (direction === "export" || direction === "bidirectional") {
        const exportResult = await exportContactsToSalesforce(ctx, integration);
        results.exported = exportResult.count;
        results.errors.push(...exportResult.errors);
      }

      // Update sync status
      await ctx.runMutation(api.integrations.updateSync, {
        syncId: syncId,
        status: results.errors.length > 0 ? "failed" : "completed",
        progress: 100,
        data: {
          imported: results.imported,
          exported: results.exported,
          errors: results.errors,
          totalRecords: results.imported + results.exported,
        },
        completedAt: Date.now(),
      });

      // Update integration last sync
      await ctx.runMutation(api.integrations.updateIntegration, {
        id: args.integrationId,
        updates: { lastSync: Date.now() }
      });

      return results;

    } catch (error) {
      results.errors.push(error.message);
      return results;
    }
  }
});

export const getSalesforceObjects = action({
  args: {
    integrationId: v.id("integrations"),
    objectType: v.string() // "Contact", "Lead", "Opportunity", etc.
  },
  handler: async (ctx, args) => {
    const integration = await ctx.runQuery(api.integrations.getIntegration, {
      id: args.integrationId
    });

    if (!integration || integration.type !== "salesforce") {
      throw new Error("Invalid Salesforce integration");
    }

    const { instanceUrl, accessToken } = integration.credentials;

    try {
      const response = await fetch(
        `${instanceUrl}/services/data/v57.0/sobjects/${args.objectType}`,
        {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Salesforce API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data;

    } catch (error) {
      throw new Error(`Failed to fetch Salesforce objects: ${error.message}`);
    }
  }
});

export const createSalesforceWebhook = action({
  args: {
    integrationId: v.id("integrations"),
    objectType: v.string(),
    events: v.array(v.string()) // ["created", "updated", "deleted"]
  },
  handler: async (ctx, args) => {
    const integration = await ctx.runQuery(api.integrations.getIntegration, {
      id: args.integrationId
    });

    if (!integration || integration.type !== "salesforce") {
      throw new Error("Invalid Salesforce integration");
    }

    // Create webhook endpoint for Salesforce events
    const webhookId = await ctx.runMutation(api.webhooks.createEndpoint, {
      integrationId: args.integrationId,
      name: `Salesforce ${args.objectType} Webhook`,
      events: args.events.map(event => `salesforce.${args.objectType.toLowerCase()}.${event}`),
      isActive: true
    });

    return { webhookId };
  }
});

export const processSalesforceWebhook = action({
  args: {
    integrationId: v.id("integrations"),
    payload: v.any(),
    event: v.string()
  },
  handler: async (ctx, args) => {
    const integration = await ctx.runQuery(api.integrations.getIntegration, {
      id: args.integrationId
    });

    if (!integration || integration.type !== "salesforce") {
      throw new Error("Invalid Salesforce integration");
    }

    try {
      const { payload, event } = args;
      
      if (event.includes("Contact")) {
        await processSalesforceContactEvent(ctx, integration, payload, event);
      } else if (event.includes("Lead")) {
        await processSalesforceLeadEvent(ctx, integration, payload, event);
      }

      return { success: true };

    } catch (error) {
      throw new Error(`Failed to process Salesforce webhook: ${error.message}`);
    }
  }
});

// Helper functions for Salesforce
async function importSalesforceContacts(ctx: any, integration: any) {
  const { instanceUrl, accessToken } = integration.credentials;
  const fieldMappings = integration.settings.fieldMappings;
  
  let imported = 0;
  const errors: string[] = [];

  try {
    // Query Salesforce contacts
    const soql = buildContactQuery(fieldMappings);
    const response = await fetch(
      `${instanceUrl}/services/data/v57.0/query?q=${encodeURIComponent(soql)}`,
      {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Salesforce query failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    for (const sfContact of data.records) {
      try {
        // Map Salesforce fields to SmartBatch fields
        const mappedContact = mapSalesforceToSmartBatch(sfContact, fieldMappings);
        
        // Check if contact already exists
        const existingContact = await ctx.runQuery(api.contacts.getContactByEmail, {
          email: mappedContact.email
        });

        if (existingContact) {
          // Update existing contact
          await ctx.runMutation(api.contacts.updateContact, {
            id: existingContact._id,
            updates: mappedContact
          });
        } else {
          // Create new contact
          await ctx.runMutation(api.contacts.createContact, {
            ...mappedContact,
            userId: integration.userId,
            source: "salesforce_import"
          });
        }

        imported++;
      } catch (error) {
        errors.push(`Failed to import contact ${sfContact.Id}: ${error.message}`);
      }
    }

    return { count: imported, errors };

  } catch (error) {
    throw new Error(`Salesforce import failed: ${error.message}`);
  }
}

async function exportContactsToSalesforce(ctx: any, integration: any) {
  const { instanceUrl, accessToken } = integration.credentials;
  const fieldMappings = integration.settings.fieldMappings;
  
  let exported = 0;
  const errors: string[] = [];

  try {
    // Get contacts to export (modified since last sync)
    const contacts = await ctx.runQuery(api.contacts.getContactsUpdatedAfter, {
      userId: integration.userId,
      after: integration.lastSync
    });

    for (const contact of contacts) {
      try {
        // Map SmartBatch fields to Salesforce fields
        const mappedContact = mapSmartBatchToSalesforce(contact, fieldMappings);
        
        // Check if contact exists in Salesforce
        const existingId = contact.integrationIds?.salesforce;
        
        if (existingId) {
          // Update existing Salesforce contact
          const response = await fetch(
            `${instanceUrl}/services/data/v57.0/sobjects/Contact/${existingId}`,
            {
              method: "PATCH",
              headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify(mappedContact)
            }
          );

          if (!response.ok) {
            throw new Error(`Salesforce update failed: ${response.statusText}`);
          }
        } else {
          // Create new Salesforce contact
          const response = await fetch(
            `${instanceUrl}/services/data/v57.0/sobjects/Contact`,
            {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify(mappedContact)
            }
          );

          if (!response.ok) {
            throw new Error(`Salesforce create failed: ${response.statusText}`);
          }

          const result = await response.json();
          
          // Store Salesforce ID in contact
          await ctx.runMutation(api.contacts.updateContactIntegrationId, {
            contactId: contact._id,
            integration: "salesforce",
            integrationId: result.id
          });
        }

        exported++;
      } catch (error) {
        errors.push(`Failed to export contact ${contact._id}: ${error.message}`);
      }
    }

    return { count: exported, errors };

  } catch (error) {
    throw new Error(`Salesforce export failed: ${error.message}`);
  }
}

async function processSalesforceContactEvent(ctx: any, integration: any, payload: any, event: string) {
  const contactData = payload.sobject || payload;
  
  if (event.includes("created") || event.includes("updated")) {
    // Map and sync contact to SmartBatch
    const mappedContact = mapSalesforceToSmartBatch(contactData, integration.settings.fieldMappings);
    
    const existingContact = await ctx.runQuery(api.contacts.getContactByIntegrationId, {
      integration: "salesforce",
      integrationId: contactData.Id
    });

    if (existingContact) {
      await ctx.runMutation(api.contacts.updateContact, {
        id: existingContact._id,
        updates: mappedContact
      });
    } else if (integration.settings.autoCreateContacts) {
      await ctx.runMutation(api.contacts.createContact, {
        ...mappedContact,
        userId: integration.userId,
        source: "salesforce_webhook",
        integrationIds: { salesforce: contactData.Id }
      });
    }

    // Trigger any event campaigns
    await ctx.runAction(api.eventCampaigns.processEvent, {
      eventType: event.includes("created") ? "contact_created" : "contact_updated",
      contactId: existingContact?._id,
      eventData: {
        source: "salesforce",
        contactData: mappedContact,
        originalData: contactData
      }
    });
  }
}

async function processSalesforceLeadEvent(ctx: any, integration: any, payload: any, event: string) {
  // Handle lead events - similar to contact events but for leads
  const leadData = payload.sobject || payload;
  
  // Convert lead to contact format if configured
  if (integration.settings.syncLeads) {
    const mappedContact = {
      email: leadData.Email,
      name: `${leadData.FirstName || ""} ${leadData.LastName || ""}`.trim(),
      phone: leadData.Phone,
      customFields: {
        leadSource: leadData.LeadSource,
        company: leadData.Company,
        title: leadData.Title,
        status: leadData.Status
      },
      tags: ["lead", leadData.Status?.toLowerCase()].filter(Boolean)
    };

    // Create or update contact
    const existingContact = await ctx.runQuery(api.contacts.getContactByEmail, {
      email: mappedContact.email
    });

    if (existingContact) {
      await ctx.runMutation(api.contacts.updateContact, {
        id: existingContact._id,
        updates: mappedContact
      });
    } else if (integration.settings.autoCreateContacts) {
      await ctx.runMutation(api.contacts.createContact, {
        ...mappedContact,
        userId: integration.userId,
        source: "salesforce_lead",
        integrationIds: { salesforce_lead: leadData.Id }
      });
    }
  }
}

function buildContactQuery(fieldMappings: any[]): string {
  const salesforceFields = fieldMappings
    .filter(mapping => mapping.direction !== "export")
    .map(mapping => mapping.salesforceField);
  
  // Always include essential fields
  const essentialFields = ["Id", "Email", "FirstName", "LastName", "Phone", "CreatedDate", "LastModifiedDate"];
  const allFields = [...new Set([...essentialFields, ...salesforceFields])];
  
  return `SELECT ${allFields.join(", ")} FROM Contact WHERE Email != null ORDER BY LastModifiedDate DESC LIMIT 1000`;
}

function mapSalesforceToSmartBatch(sfContact: any, fieldMappings: any[]): any {
  const mapped: any = {
    email: sfContact.Email,
    name: `${sfContact.FirstName || ""} ${sfContact.LastName || ""}`.trim(),
    phone: sfContact.Phone,
    customFields: {},
    tags: []
  };

  // Apply field mappings
  for (const mapping of fieldMappings) {
    if (mapping.direction !== "export" && sfContact[mapping.salesforceField]) {
      if (mapping.smartbatchField === "email") {
        mapped.email = sfContact[mapping.salesforceField];
      } else if (mapping.smartbatchField === "name") {
        mapped.name = sfContact[mapping.salesforceField];
      } else if (mapping.smartbatchField === "phone") {
        mapped.phone = sfContact[mapping.salesforceField];
      } else {
        mapped.customFields[mapping.smartbatchField] = sfContact[mapping.salesforceField];
      }
    }
  }

  return mapped;
}

function mapSmartBatchToSalesforce(contact: any, fieldMappings: any[]): any {
  const mapped: any = {
    Email: contact.email,
    FirstName: contact.name.split(" ")[0] || "",
    LastName: contact.name.split(" ").slice(1).join(" ") || contact.name,
    Phone: contact.phone
  };

  // Apply field mappings
  for (const mapping of fieldMappings) {
    if (mapping.direction !== "import") {
      if (mapping.smartbatchField === "email") {
        mapped[mapping.salesforceField] = contact.email;
      } else if (mapping.smartbatchField === "name") {
        mapped[mapping.salesforceField] = contact.name;
      } else if (mapping.smartbatchField === "phone") {
        mapped[mapping.salesforceField] = contact.phone;
      } else if (contact.customFields?.[mapping.smartbatchField]) {
        mapped[mapping.salesforceField] = contact.customFields[mapping.smartbatchField];
      }
    }
  }

  return mapped;
}
