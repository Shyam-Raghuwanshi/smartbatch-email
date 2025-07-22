import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Google Sheets Integration Functions

export const syncContactsToSheets = action({
  args: {
    integrationId: v.id("integrations"),
  },
  handler: async (ctx, { integrationId }) => {
    const integration = await ctx.runQuery(api.integrations.getById, { integrationId });
    
    if (!integration || integration.type !== "google_sheets") {
      throw new Error("Invalid Google Sheets integration");
    }

    const { spreadsheetId, sheetName, columnMapping, accessToken } = integration.configuration;
    
    // Get all contacts
    const contacts = await ctx.runQuery(api.contacts.list, {});
    
    // Start sync record
    const syncId = await ctx.runMutation(api.integrations.createSync, {
      integrationId,
      syncType: "manual",
      direction: "export",
      status: "running",
    });

    try {
      // Prepare data for Google Sheets
      const sheetsData = contacts.map(contact => [
        contact.email,
        contact.firstName || "",
        contact.lastName || "",
        contact.company || "",
        contact.phone || "",
        contact.tags?.join(", ") || "",
        new Date(contact._creationTime).toISOString(),
      ]);

      // Add header row
      const headers = ["Email", "First Name", "Last Name", "Company", "Phone", "Tags", "Created Date"];
      const dataWithHeaders = [headers, ...sheetsData];

      // Simulate Google Sheets API call
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName || "Sheet1"}!A1:G${dataWithHeaders.length}?valueInputOption=RAW`,
        {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            values: dataWithHeaders,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Google Sheets API error: ${response.statusText}`);
      }

      // Update sync record with success
      await ctx.runMutation(api.integrations.updateSync, {
        syncId,
        status: "completed",
        recordsCreated: contacts.length,
        recordsUpdated: 0,
        recordsDeleted: 0,
        completedAt: Date.now(),
      });

      return {
        success: true,
        message: `Successfully synced ${contacts.length} contacts to Google Sheets`,
        syncedCount: contacts.length,
      };
    } catch (error) {
      // Update sync record with failure
      await ctx.runMutation(api.integrations.updateSync, {
        syncId,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
        completedAt: Date.now(),
      });

      throw error;
    }
  },
});

export const syncContactsFromSheets = action({
  args: {
    integrationId: v.id("integrations"),
  },
  handler: async (ctx, { integrationId }) => {
    const integration = await ctx.runQuery(api.integrations.getById, { integrationId });
    
    if (!integration || integration.type !== "google_sheets") {
      throw new Error("Invalid Google Sheets integration");
    }

    const { spreadsheetId, sheetName, columnMapping, accessToken } = integration.configuration;
    
    // Start sync record
    const syncId = await ctx.runMutation(api.integrations.createSync, {
      integrationId,
      syncType: "manual",
      direction: "import",
      status: "running",
    });

    try {
      // Fetch data from Google Sheets
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName || "Sheet1"}!A:G`,
        {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Google Sheets API error: ${response.statusText}`);
      }

      const data = await response.json();
      const rows = data.values || [];
      
      if (rows.length === 0) {
        throw new Error("No data found in the spreadsheet");
      }

      // Skip header row
      const dataRows = rows.slice(1);
      
      let created = 0;
      let updated = 0;
      let errors = 0;

      // Process each row
      for (const row of dataRows) {
        const [email, firstName, lastName, company, phone, tags] = row;
        
        if (!email || !email.includes("@")) {
          errors++;
          continue;
        }

        try {
          // Check if contact exists
          const existingContact = await ctx.runQuery(api.contacts.getByEmail, { email });
          
          const contactData = {
            email,
            firstName: firstName || undefined,
            lastName: lastName || undefined,
            company: company || undefined,
            phone: phone || undefined,
            tags: tags ? tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
          };

          if (existingContact) {
            // Update existing contact
            await ctx.runMutation(api.contacts.update, {
              contactId: existingContact._id,
              ...contactData,
            });
            updated++;
          } else {
            // Create new contact
            await ctx.runMutation(api.contacts.create, contactData);
            created++;
          }
        } catch (error) {
          console.error(`Error processing contact ${email}:`, error);
          errors++;
        }
      }

      // Update sync record with success
      await ctx.runMutation(api.integrations.updateSync, {
        syncId,
        status: "completed",
        recordsCreated: created,
        recordsUpdated: updated,
        recordsDeleted: 0,
        completedAt: Date.now(),
      });

      return {
        success: true,
        message: `Successfully processed ${created + updated} contacts from Google Sheets`,
        created,
        updated,
        errors,
      };
    } catch (error) {
      // Update sync record with failure
      await ctx.runMutation(api.integrations.updateSync, {
        syncId,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
        completedAt: Date.now(),
      });

      throw error;
    }
  },
});

export const bidirectionalSync = action({
  args: {
    integrationId: v.id("integrations"),
  },
  handler: async (ctx, { integrationId }) => {
    const integration = await ctx.runQuery(api.integrations.getById, { integrationId });
    
    if (!integration || integration.type !== "google_sheets") {
      throw new Error("Invalid Google Sheets integration");
    }

    const { spreadsheetId, sheetName, accessToken } = integration.configuration;
    
    // Start sync record
    const syncId = await ctx.runMutation(api.integrations.createSync, {
      integrationId,
      syncType: "scheduled",
      direction: "bidirectional",
      status: "running",
    });

    try {
      // First, get data from both sides
      const [localContacts, sheetsResponse] = await Promise.all([
        ctx.runQuery(api.contacts.list, {}),
        fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName || "Sheet1"}!A:H`,
          {
            headers: { "Authorization": `Bearer ${accessToken}` },
          }
        ),
      ]);

      if (!sheetsResponse.ok) {
        throw new Error(`Google Sheets API error: ${sheetsResponse.statusText}`);
      }

      const sheetsData = await sheetsResponse.json();
      const sheetsRows = sheetsData.values || [];
      
      // Skip header row
      const sheetsContacts = sheetsRows.slice(1);
      
      // Create maps for comparison
      const localContactsMap = new Map(
        localContacts.map(contact => [
          contact.email.toLowerCase(),
          {
            ...contact,
            lastModified: contact._creationTime, // Use creation time as proxy for last modified
          }
        ])
      );

      const sheetsContactsMap = new Map();
      sheetsContacts.forEach((row, index) => {
        const [email, firstName, lastName, company, phone, tags, createdDate, lastModified] = row;
        if (email && email.includes("@")) {
          sheetsContactsMap.set(email.toLowerCase(), {
            email,
            firstName: firstName || "",
            lastName: lastName || "",
            company: company || "",
            phone: phone || "",
            tags: tags ? tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
            createdDate,
            lastModified: lastModified ? new Date(lastModified).getTime() : Date.now(),
            rowIndex: index + 2, // +2 because we skipped header and arrays are 0-based
          });
        }
      });

      let localCreated = 0;
      let localUpdated = 0;
      let sheetsUpdated = 0;
      const sheetsUpdates: any[] = [];

      // Sync from Sheets to local (import)
      for (const [email, sheetsContact] of sheetsContactsMap) {
        const localContact = localContactsMap.get(email);
        
        if (!localContact) {
          // Create new local contact
          await ctx.runMutation(api.contacts.create, {
            email: sheetsContact.email,
            firstName: sheetsContact.firstName || undefined,
            lastName: sheetsContact.lastName || undefined,
            company: sheetsContact.company || undefined,
            phone: sheetsContact.phone || undefined,
            tags: sheetsContact.tags,
          });
          localCreated++;
        } else if (sheetsContact.lastModified > localContact.lastModified) {
          // Update local contact (Sheets version is newer)
          await ctx.runMutation(api.contacts.update, {
            contactId: localContact._id,
            firstName: sheetsContact.firstName || undefined,
            lastName: sheetsContact.lastName || undefined,
            company: sheetsContact.company || undefined,
            phone: sheetsContact.phone || undefined,
            tags: sheetsContact.tags,
          });
          localUpdated++;
        }
      }

      // Sync from local to Sheets (export)
      for (const [email, localContact] of localContactsMap) {
        const sheetsContact = sheetsContactsMap.get(email);
        
        if (!sheetsContact) {
          // Add new row to Sheets
          sheetsUpdates.push([
            localContact.email,
            localContact.firstName || "",
            localContact.lastName || "",
            localContact.company || "",
            localContact.phone || "",
            localContact.tags?.join(", ") || "",
            new Date(localContact._creationTime).toISOString(),
            new Date().toISOString(), // lastModified
          ]);
        } else if (localContact.lastModified > sheetsContact.lastModified) {
          // Update existing row in Sheets
          const updateRange = `${sheetName || "Sheet1"}!A${sheetsContact.rowIndex}:H${sheetsContact.rowIndex}`;
          sheetsUpdates.push({
            range: updateRange,
            values: [[
              localContact.email,
              localContact.firstName || "",
              localContact.lastName || "",
              localContact.company || "",
              localContact.phone || "",
              localContact.tags?.join(", ") || "",
              sheetsContact.createdDate,
              new Date().toISOString(), // lastModified
            ]],
          });
          sheetsUpdated++;
        }
      }

      // Apply updates to Google Sheets
      if (sheetsUpdates.length > 0) {
        // Handle new rows (append)
        const newRows = sheetsUpdates.filter(update => Array.isArray(update));
        if (newRows.length > 0) {
          await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName || "Sheet1"}!A:H:append?valueInputOption=RAW`,
            {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                values: newRows,
              }),
            }
          );
        }

        // Handle row updates
        const rowUpdates = sheetsUpdates.filter(update => !Array.isArray(update));
        for (const update of rowUpdates) {
          await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${update.range}?valueInputOption=RAW`,
            {
              method: "PUT",
              headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                values: update.values,
              }),
            }
          );
        }
      }

      // Update sync record with success
      await ctx.runMutation(api.integrations.updateSync, {
        syncId,
        status: "completed",
        recordsCreated: localCreated + newRows.length,
        recordsUpdated: localUpdated + sheetsUpdated,
        recordsDeleted: 0,
        completedAt: Date.now(),
      });

      return {
        success: true,
        message: `Bidirectional sync completed`,
        localCreated,
        localUpdated,
        sheetsUpdated,
        sheetsCreated: newRows.length,
      };
    } catch (error) {
      // Update sync record with failure
      await ctx.runMutation(api.integrations.updateSync, {
        syncId,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
        completedAt: Date.now(),
      });

      throw error;
    }
  },
});

export const validateSheetsAccess = action({
  args: {
    accessToken: v.string(),
    spreadsheetId: v.string(),
  },
  handler: async (ctx, { accessToken, spreadsheetId }) => {
    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
        {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        return {
          success: false,
          message: `Unable to access spreadsheet: ${response.statusText}`,
        };
      }

      const spreadsheet = await response.json();
      
      return {
        success: true,
        message: "Successfully connected to Google Sheets",
        spreadsheetTitle: spreadsheet.properties?.title,
        sheets: spreadsheet.sheets?.map((sheet: any) => ({
          title: sheet.properties?.title,
          sheetId: sheet.properties?.sheetId,
        })) || [],
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  },
});

export const setupWebhookForSheets = mutation({
  args: {
    integrationId: v.id("integrations"),
    webhookUrl: v.string(),
  },
  handler: async (ctx, { integrationId, webhookUrl }) => {
    // Create a webhook endpoint specifically for Google Sheets sync triggers
    const webhookId = await ctx.db.insert("webhookEndpoints", {
      integrationId,
      name: "Google Sheets Sync Trigger",
      url: webhookUrl,
      events: ["contact.created", "contact.updated", "contact.deleted"],
      isActive: true,
      secret: Math.random().toString(36).substring(2, 15),
    });

    return webhookId;
  },
});

// Scheduled sync function that can be called by cron job
export const scheduledGoogleSheetsSync = action({
  args: {},
  handler: async (ctx) => {
    // Get all active Google Sheets integrations
    const integrations = await ctx.runQuery(api.integrations.list);
    const googleSheetsIntegrations = integrations.filter(
      integration => integration.type === "google_sheets" && integration.isActive
    );

    const results = [];

    for (const integration of googleSheetsIntegrations) {
      try {
        const result = await ctx.runAction(api.googleSheetsIntegration.bidirectionalSync, {
          integrationId: integration._id,
        });
        results.push({
          integrationId: integration._id,
          integrationName: integration.name,
          ...result,
        });
      } catch (error) {
        results.push({
          integrationId: integration._id,
          integrationName: integration.name,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return {
      totalIntegrations: googleSheetsIntegrations.length,
      results,
    };
  },
});
