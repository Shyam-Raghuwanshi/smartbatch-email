import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api, internal } from "./_generated/api";

// HubSpot integration for CRM and marketing automation sync
export const createHubSpotIntegration = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    credentials: v.object({
      accessToken: v.string(),
      refreshToken: v.optional(v.string()),
      portalId: v.string(),
      clientId: v.string(),
      clientSecret: v.string()
    }),
    settings: v.object({
      syncContacts: v.boolean(),
      syncCompanies: v.boolean(),
      syncDeals: v.boolean(),
      syncLists: v.boolean(),
      syncForms: v.boolean(),
      autoCreateContacts: v.boolean(),
      bidirectionalSync: v.boolean(),
      fieldMappings: v.array(v.object({
        hubspotProperty: v.string(),
        smartbatchField: v.string(),
        direction: v.union(
          v.literal("import"),
          v.literal("export"),
          v.literal("bidirectional")
        )
      })),
      syncFrequency: v.number(), // minutes
      listMappings: v.optional(v.array(v.object({
        hubspotListId: v.string(),
        smartbatchTag: v.string()
      }))),
      webhookEvents: v.optional(v.array(v.string()))
    })
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("integrations", {
      userId: args.userId,
      name: args.name,
      type: "hubspot",
      status: "connected",
      credentials: args.credentials,
      settings: args.settings,
      lastSync: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  }
});

export const syncHubSpotContacts = action({
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

    if (!integration || integration.type !== "hubspot") {
      throw new Error("Invalid HubSpot integration");
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
        const importResult = await importHubSpotContacts(ctx, integration);
        results.imported = importResult.count;
        results.errors.push(...importResult.errors);
      }

      if (direction === "export" || direction === "bidirectional") {
        const exportResult = await exportContactsToHubSpot(ctx, integration);
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

export const getHubSpotLists = action({
  args: {
    integrationId: v.id("integrations")
  },
  handler: async (ctx, args) => {
    const integration = await ctx.runQuery(api.integrations.getIntegration, {
      id: args.integrationId
    });

    if (!integration || integration.type !== "hubspot") {
      throw new Error("Invalid HubSpot integration");
    }

    const { accessToken } = integration.credentials;

    try {
      const response = await fetch(
        "https://api.hubapi.com/contacts/v1/lists",
        {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HubSpot API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.lists || [];

    } catch (error) {
      throw new Error(`Failed to fetch HubSpot lists: ${error.message}`);
    }
  }
});

export const getHubSpotProperties = action({
  args: {
    integrationId: v.id("integrations"),
    objectType: v.optional(v.string()) // "contacts", "companies", "deals"
  },
  handler: async (ctx, args) => {
    const integration = await ctx.runQuery(api.integrations.getIntegration, {
      id: args.integrationId
    });

    if (!integration || integration.type !== "hubspot") {
      throw new Error("Invalid HubSpot integration");
    }

    const { accessToken } = integration.credentials;
    const objectType = args.objectType || "contacts";

    try {
      const response = await fetch(
        `https://api.hubapi.com/crm/v3/properties/${objectType}`,
        {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HubSpot API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.results || [];

    } catch (error) {
      throw new Error(`Failed to fetch HubSpot properties: ${error.message}`);
    }
  }
});

export const syncHubSpotLists = action({
  args: {
    integrationId: v.id("integrations")
  },
  handler: async (ctx, args) => {
    const integration = await ctx.runQuery(api.integrations.getIntegration, {
      id: args.integrationId
    });

    if (!integration || integration.type !== "hubspot") {
      throw new Error("Invalid HubSpot integration");
    }

    const { listMappings } = integration.settings;
    if (!listMappings || listMappings.length === 0) {
      return { synced: 0, message: "No list mappings configured" };
    }

    const { accessToken } = integration.credentials;
    let synced = 0;
    const errors: string[] = [];

    try {
      for (const mapping of listMappings) {
        try {
          // Get contacts from HubSpot list
          const response = await fetch(
            `https://api.hubapi.com/contacts/v1/lists/${mapping.hubspotListId}/contacts/all`,
            {
              headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json"
              }
            }
          );

          if (!response.ok) {
            throw new Error(`Failed to fetch list ${mapping.hubspotListId}: ${response.statusText}`);
          }

          const data = await response.json();
          
          // Add tags to contacts
          for (const contact of data.contacts || []) {
            if (contact.properties?.email?.value) {
              const existingContact = await ctx.runQuery(api.contacts.getContactByEmail, {
                email: contact.properties.email.value
              });

              if (existingContact) {
                await ctx.runMutation(api.contacts.addTag, {
                  contactId: existingContact._id,
                  tag: mapping.smartbatchTag
                });
                synced++;
              }
            }
          }
        } catch (error) {
          errors.push(`List mapping ${mapping.hubspotListId}: ${error.message}`);
        }
      }

      return { synced, errors };

    } catch (error) {
      throw new Error(`HubSpot list sync failed: ${error.message}`);
    }
  }
});

export const createHubSpotWebhook = action({
  args: {
    integrationId: v.id("integrations"),
    subscriptionType: v.string(), // "contact.creation", "contact.propertyChange", etc.
    propertyName: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const integration = await ctx.runQuery(api.integrations.getIntegration, {
      id: args.integrationId
    });

    if (!integration || integration.type !== "hubspot") {
      throw new Error("Invalid HubSpot integration");
    }

    const { accessToken } = integration.credentials;

    // Create webhook endpoint for HubSpot events
    const webhookEndpoint = await ctx.runMutation(api.webhooks.createEndpoint, {
      integrationId: args.integrationId,
      name: `HubSpot ${args.subscriptionType} Webhook`,
      events: [`hubspot.${args.subscriptionType}`],
      isActive: true
    });

    const webhookUrl = `${process.env.CONVEX_SITE_URL}/api/webhooks/hubspot/${webhookEndpoint}`;

    try {
      // Create HubSpot webhook subscription
      const subscriptionData = {
        subscriptionDetails: {
          subscriptionType: args.subscriptionType,
          propertyName: args.propertyName
        },
        webhook: {
          targetUrl: webhookUrl,
          maxConcurrentRequests: 10,
          throttling: {
            maxConcurrentRequests: 10,
            period: "SECONDLY"
          }
        },
        enabled: true
      };

      const response = await fetch(
        "https://api.hubapi.com/webhooks/v3/subscriptions",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(subscriptionData)
        }
      );

      if (!response.ok) {
        throw new Error(`HubSpot webhook creation failed: ${response.statusText}`);
      }

      const subscription = await response.json();

      // Store HubSpot subscription ID
      await ctx.runMutation(api.webhooks.updateEndpoint, {
        id: webhookEndpoint,
        updates: {
          externalId: subscription.id,
          metadata: {
            subscriptionType: args.subscriptionType,
            propertyName: args.propertyName
          }
        }
      });

      return { 
        webhookId: webhookEndpoint,
        subscriptionId: subscription.id,
        webhookUrl 
      };

    } catch (error) {
      // Clean up webhook endpoint if HubSpot subscription failed
      await ctx.runMutation(api.webhooks.deleteEndpoint, {
        id: webhookEndpoint
      });
      
      throw new Error(`Failed to create HubSpot webhook: ${error.message}`);
    }
  }
});

export const processHubSpotWebhook = action({
  args: {
    integrationId: v.id("integrations"),
    payload: v.any(),
    subscriptionType: v.string()
  },
  handler: async (ctx, args) => {
    const integration = await ctx.runQuery(api.integrations.getIntegration, {
      id: args.integrationId
    });

    if (!integration || integration.type !== "hubspot") {
      throw new Error("Invalid HubSpot integration");
    }

    try {
      const { payload, subscriptionType } = args;
      
      for (const event of payload) {
        if (subscriptionType.includes("contact")) {
          await processHubSpotContactEvent(ctx, integration, event, subscriptionType);
        } else if (subscriptionType.includes("company")) {
          await processHubSpotCompanyEvent(ctx, integration, event, subscriptionType);
        } else if (subscriptionType.includes("deal")) {
          await processHubSpotDealEvent(ctx, integration, event, subscriptionType);
        }
      }

      return { success: true, processed: payload.length };

    } catch (error) {
      throw new Error(`Failed to process HubSpot webhook: ${error.message}`);
    }
  }
});

export const getHubSpotForms = action({
  args: {
    integrationId: v.id("integrations")
  },
  handler: async (ctx, args) => {
    const integration = await ctx.runQuery(api.integrations.getIntegration, {
      id: args.integrationId
    });

    if (!integration || integration.type !== "hubspot") {
      throw new Error("Invalid HubSpot integration");
    }

    const { accessToken } = integration.credentials;

    try {
      const response = await fetch(
        "https://api.hubapi.com/forms/v2/forms",
        {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HubSpot API error: ${response.statusText}`);
      }

      const forms = await response.json();
      return forms || [];

    } catch (error) {
      throw new Error(`Failed to fetch HubSpot forms: ${error.message}`);
    }
  }
});

// Helper functions for HubSpot
async function importHubSpotContacts(ctx: any, integration: any) {
  const { accessToken } = integration.credentials;
  const fieldMappings = integration.settings.fieldMappings;
  
  let imported = 0;
  const errors: string[] = [];

  try {
    // Get properties to fetch
    const properties = getHubSpotPropertiesFromMappings(fieldMappings);
    
    // Fetch contacts with pagination
    let hasMore = true;
    let after = undefined;

    while (hasMore) {
      const url = new URL("https://api.hubapi.com/crm/v3/objects/contacts");
      url.searchParams.set("properties", properties.join(","));
      url.searchParams.set("limit", "100");
      if (after) url.searchParams.set("after", after);

      const response = await fetch(url.toString(), {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`HubSpot API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      for (const hsContact of data.results) {
        try {
          // Map HubSpot properties to SmartBatch fields
          const mappedContact = mapHubSpotToSmartBatch(hsContact, fieldMappings);
          
          if (!mappedContact.email) continue; // Skip contacts without email
          
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
              source: "hubspot_import",
              integrationIds: { hubspot: hsContact.id }
            });
          }

          imported++;
        } catch (error) {
          errors.push(`Failed to import contact ${hsContact.id}: ${error.message}`);
        }
      }

      hasMore = !!data.paging?.next;
      after = data.paging?.next?.after;
    }

    return { count: imported, errors };

  } catch (error) {
    throw new Error(`HubSpot import failed: ${error.message}`);
  }
}

async function exportContactsToHubSpot(ctx: any, integration: any) {
  const { accessToken } = integration.credentials;
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
        // Map SmartBatch fields to HubSpot properties
        const mappedProperties = mapSmartBatchToHubSpot(contact, fieldMappings);
        
        // Check if contact exists in HubSpot
        const existingId = contact.integrationIds?.hubspot;
        
        if (existingId) {
          // Update existing HubSpot contact
          const response = await fetch(
            `https://api.hubapi.com/crm/v3/objects/contacts/${existingId}`,
            {
              method: "PATCH",
              headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({ properties: mappedProperties })
            }
          );

          if (!response.ok) {
            throw new Error(`HubSpot update failed: ${response.statusText}`);
          }
        } else {
          // Create new HubSpot contact
          const response = await fetch(
            "https://api.hubapi.com/crm/v3/objects/contacts",
            {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({ properties: mappedProperties })
            }
          );

          if (!response.ok) {
            throw new Error(`HubSpot create failed: ${response.statusText}`);
          }

          const result = await response.json();
          
          // Store HubSpot ID in contact
          await ctx.runMutation(api.contacts.updateContactIntegrationId, {
            contactId: contact._id,
            integration: "hubspot",
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
    throw new Error(`HubSpot export failed: ${error.message}`);
  }
}

async function processHubSpotContactEvent(ctx: any, integration: any, event: any, subscriptionType: string) {
  const contactId = event.objectId;
  const { accessToken } = integration.credentials;

  try {
    // Fetch contact details from HubSpot
    const properties = getHubSpotPropertiesFromMappings(integration.settings.fieldMappings);
    const response = await fetch(
      `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}?properties=${properties.join(",")}`,
      {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch HubSpot contact: ${response.statusText}`);
    }

    const hsContact = await response.json();
    const mappedContact = mapHubSpotToSmartBatch(hsContact, integration.settings.fieldMappings);

    if (!mappedContact.email) return; // Skip contacts without email

    // Find existing contact
    const existingContact = await ctx.runQuery(api.contacts.getContactByEmail, {
      email: mappedContact.email
    });

    let contactRecordId = existingContact?._id;

    if (subscriptionType.includes("creation")) {
      if (!existingContact && integration.settings.autoCreateContacts) {
        // Create new contact
        contactRecordId = await ctx.runMutation(api.contacts.createContact, {
          ...mappedContact,
          userId: integration.userId,
          source: "hubspot_webhook",
          integrationIds: { hubspot: contactId }
        });

        // Trigger contact created event
        await ctx.runAction(api.eventCampaigns.processEvent, {
          eventType: "contact_created",
          contactId: contactRecordId,
          eventData: {
            source: "hubspot",
            contactData: mappedContact,
            originalData: hsContact
          }
        });
      }
    } else if (subscriptionType.includes("propertyChange")) {
      if (existingContact) {
        // Update existing contact
        await ctx.runMutation(api.contacts.updateContact, {
          id: existingContact._id,
          updates: mappedContact
        });

        // Trigger contact updated event
        await ctx.runAction(api.eventCampaigns.processEvent, {
          eventType: "contact_updated",
          contactId: existingContact._id,
          eventData: {
            source: "hubspot",
            propertyName: event.propertyName,
            propertyValue: event.propertyValue,
            contactData: mappedContact
          }
        });
      }
    }

  } catch (error) {
    console.error(`Failed to process HubSpot contact event: ${error.message}`);
  }
}

async function processHubSpotCompanyEvent(ctx: any, integration: any, event: any, subscriptionType: string) {
  // Handle company events - could create contacts for company contacts
  // Implementation depends on business logic
}

async function processHubSpotDealEvent(ctx: any, integration: any, event: any, subscriptionType: string) {
  // Handle deal events - could trigger campaigns based on deal stages
  // Implementation depends on business logic
}

function getHubSpotPropertiesFromMappings(fieldMappings: any[]): string[] {
  const hubspotProperties = fieldMappings
    .filter(mapping => mapping.direction !== "export")
    .map(mapping => mapping.hubspotProperty);
  
  // Always include essential properties
  const essentialProperties = ["email", "firstname", "lastname", "phone", "createdate", "lastmodifieddate"];
  return [...new Set([...essentialProperties, ...hubspotProperties])];
}

function mapHubSpotToSmartBatch(hsContact: any, fieldMappings: any[]): any {
  const properties = hsContact.properties || {};
  
  const mapped: any = {
    email: properties.email,
    name: `${properties.firstname || ""} ${properties.lastname || ""}`.trim(),
    phone: properties.phone,
    customFields: {},
    tags: []
  };

  // Apply field mappings
  for (const mapping of fieldMappings) {
    if (mapping.direction !== "export" && properties[mapping.hubspotProperty]) {
      if (mapping.smartbatchField === "email") {
        mapped.email = properties[mapping.hubspotProperty];
      } else if (mapping.smartbatchField === "name") {
        mapped.name = properties[mapping.hubspotProperty];
      } else if (mapping.smartbatchField === "phone") {
        mapped.phone = properties[mapping.hubspotProperty];
      } else {
        mapped.customFields[mapping.smartbatchField] = properties[mapping.hubspotProperty];
      }
    }
  }

  return mapped;
}

function mapSmartBatchToHubSpot(contact: any, fieldMappings: any[]): any {
  const mapped: any = {
    email: contact.email,
    firstname: contact.name.split(" ")[0] || "",
    lastname: contact.name.split(" ").slice(1).join(" ") || "",
    phone: contact.phone
  };

  // Apply field mappings
  for (const mapping of fieldMappings) {
    if (mapping.direction !== "import") {
      if (mapping.smartbatchField === "email") {
        mapped[mapping.hubspotProperty] = contact.email;
      } else if (mapping.smartbatchField === "name") {
        mapped[mapping.hubspotProperty] = contact.name;
      } else if (mapping.smartbatchField === "phone") {
        mapped[mapping.hubspotProperty] = contact.phone;
      } else if (contact.customFields?.[mapping.smartbatchField]) {
        mapped[mapping.hubspotProperty] = contact.customFields[mapping.smartbatchField];
      }
    }
  }

  return mapped;
}
