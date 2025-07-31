import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Google Sheets Integration Functions

export const syncContactsToSheets = action({
  args: {
    integrationId: v.id("integrations"),
  },
  handler: async (ctx, { integrationId }) => {
    const integration = await ctx.runQuery(internal.integrations.getByIdInternal, { integrationId });
    
    if (!integration || integration.type !== "google_sheets") {
      throw new Error("Invalid Google Sheets integration");
    }

    const { spreadsheetId, sheetName, columnMapping, accessToken } = integration.configuration;
    
    // Get all contacts
    const contacts = await ctx.runQuery(api.contacts_enhanced.getContacts, {});
    
    // Start sync record
    const syncId = await ctx.runMutation(api.integrations.startSync, {
      integrationId,
      type: "contacts_export",
      direction: "outbound",
      options: {
        destinationId: spreadsheetId,
        sheetName: sheetName || "Sheet1",
      },
    });

    try {
      // Prepare data for Google Sheets
      const sheetsData = contacts.map((contact:any) => [
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
        data: {
          recordsCreated: contacts.length,
          recordsUpdated: 0,
          recordsDeleted: 0,
          totalRecords: contacts.length,
        },
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
    console.log("syncContactsFromSheets called with integrationId:", integrationId);
    
    const integration = await ctx.runQuery(internal.integrations.getByIdInternal, { integrationId });
    
    if (!integration || integration.type !== "google_sheets") {
      console.error("Invalid Google Sheets integration");
      throw new Error("Invalid Google Sheets integration");
    }

    console.log("Integration found:", integration.name);

    const { spreadsheetId, sheetName, columnMapping, accessToken } = integration.configuration;
    
    console.log("Configuration:", { spreadsheetId, sheetName, hasAccessToken: !!accessToken });
    
    // Start sync record
    const syncId = await ctx.runMutation(api.integrations.startSync, {
      integrationId,
      type: "contacts_import",
      direction: "inbound",
      options: {
        sourceId: spreadsheetId,
        sheetName: sheetName || "Sheet1",
      },
    });

    console.log("Sync started with ID:", syncId);

    try {
      console.log("Fetching data from Google Sheets...");
      // Fetch data from Google Sheets
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName || "Sheet1"}!A:G`,
        {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
          },
        }
      );

      console.log("Google Sheets API response status:", response.status);

      if (!response.ok) {
        throw new Error(`Google Sheets API error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Fetched sheet data:", { rowCount: data.values?.length, firstRow: data.values?.[0] });
      const rows = data.values || [];
      
      if (rows.length === 0) {
        throw new Error("No data found in the spreadsheet");
      }

      // Skip header row
      const dataRows = rows.slice(1);
      
      // Transform data to the format expected by importContacts
      const contactsData = dataRows
        .map((row:any) => {
          const [email, firstName, lastName, company, phone, tags] = row;
          
          if (!email || !email.includes("@")) {
            return null; // Skip invalid emails
          }

          return {
            email,
            firstName: firstName || undefined,
            lastName: lastName || undefined,
            company: company || undefined,
            phone: phone || undefined,
            tags: tags ? tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
          };
        })
        .filter((contact:any): contact is NonNullable<typeof contact> => contact !== null); // Remove null entries with proper typing

      // Use the enhanced import function that handles duplicates properly
      const importResult = await ctx.runMutation(api.contacts_enhanced.importContacts, {
        contacts: contactsData,
        fileName: `Google Sheets Import - ${sheetName || "Sheet1"}`,
        skipDuplicates: false, // Update existing contacts instead of skipping
      });

      // Update sync record with success
      await ctx.runMutation(api.integrations.updateSync, {
        syncId,
        status: "completed",
        data: {
          recordsCreated: importResult.successful,
          recordsUpdated: 0, // The import function doesn't track updates vs creates
          recordsDeleted: 0,
          totalRecords: importResult.successful + importResult.failed + importResult.duplicatesSkipped,
          errorCount: importResult.failed,
        },
        completedAt: Date.now(),
      });

      return {
        success: true,
        message: `Successfully processed ${importResult.successful} contacts from Google Sheets`,
        created: importResult.successful,
        updated: 0, // The enhanced import doesn't update existing contacts
        errors: importResult.failed,
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
    const integration = await ctx.runQuery(internal.integrations.getByIdInternal, { integrationId });
    
    if (!integration || integration.type !== "google_sheets") {
      throw new Error("Invalid Google Sheets integration");
    }

    const { spreadsheetId, sheetName, accessToken } = integration.configuration;
    
    // Start sync record
    const syncId = await ctx.runMutation(api.integrations.startSync, {
      integrationId,
      type: "bidirectional_sync",
      direction: "bidirectional",
      options: {
        sourceId: spreadsheetId,
        destinationId: spreadsheetId,
        sheetName: sheetName || "Sheet1",
      },
    });

    try {
      // First, get data from both sides
      const [localContacts, sheetsResponse] = await Promise.all([
        ctx.runQuery(api.contacts_enhanced.getContacts, {}),
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
        localContacts.map((contact:any) => [
          contact.email.toLowerCase(),
          {
            ...contact,
            lastModified: contact._creationTime, // Use creation time as proxy for last modified
          }
        ])
      );

      const sheetsContactsMap = new Map();
      sheetsContacts.forEach((row:any, index:number) => {
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
          // Create new local contact using enhanced API
          try {
            await ctx.runMutation(api.contacts_enhanced.createContact, {
              email: sheetsContact.email,
              firstName: sheetsContact.firstName || undefined,
              lastName: sheetsContact.lastName || undefined,
              company: sheetsContact.company || undefined,
              phone: sheetsContact.phone || undefined,
              tags: sheetsContact.tags,
            });
            localCreated++;
          } catch (error) {
            console.error(`Error creating contact ${email}:`, error);
          }
        } else if (sheetsContact.lastModified > localContact.lastModified) {
          // Update local contact (Sheets version is newer)
          try {
            await ctx.runMutation(api.contacts_enhanced.updateContact, {
              contactId: localContact._id,
              firstName: sheetsContact.firstName || undefined,
              lastName: sheetsContact.lastName || undefined,
              company: sheetsContact.company || undefined,
              phone: sheetsContact.phone || undefined,
              tags: sheetsContact.tags,
            });
            localUpdated++;
          } catch (error) {
            console.error(`Error updating contact ${email}:`, error);
          }
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

      // Filter updates for processing
      const newRows = sheetsUpdates.filter(update => Array.isArray(update));
      const rowUpdates = sheetsUpdates.filter(update => !Array.isArray(update));

      // Apply updates to Google Sheets
      if (sheetsUpdates.length > 0) {
        // Handle new rows (append)
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
        data: {
          recordsCreated: localCreated + newRows.length,
          recordsUpdated: localUpdated + sheetsUpdated,
          recordsDeleted: 0,
          totalRecords: localCreated + newRows.length + localUpdated + sheetsUpdated,
          localCreated,
          localUpdated,
          sheetsUpdated,
        },
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
    integrationId: v.id("integrations"),
  },
  handler: async (ctx, { integrationId }) => {
    try {
      const integration = await ctx.runQuery(internal.integrations.getByIdInternal, { integrationId });
      
      if (!integration || integration.type !== "google_sheets") {
        return {
          success: false,
          message: "Invalid Google Sheets integration",
        };
      }

      const { accessToken, spreadsheetId } = integration.configuration;

      if (!accessToken) {
        return {
          success: false,
          message: "No access token found for this integration",
        };
      }

      // If no spreadsheet ID, we'll try to get user's first accessible spreadsheet
      let targetSpreadsheetId = spreadsheetId;
      let spreadsheetTitle = "";
      let sheets: any[] = [];

      if (!targetSpreadsheetId) {
        // Get user's spreadsheets from Drive API
        const driveResponse = await fetch(
          `https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.spreadsheet'&pageSize=10`,
          {
            headers: {
              "Authorization": `Bearer ${accessToken}`,
            },
          }
        );

        if (driveResponse.ok) {
          const driveData = await driveResponse.json();
          if (driveData.files && driveData.files.length > 0) {
            targetSpreadsheetId = driveData.files[0].id;
            spreadsheetTitle = driveData.files[0].name;
          }
        }
      }

      if (targetSpreadsheetId) {
        const response = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${targetSpreadsheetId}`,
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
        spreadsheetTitle = spreadsheet.properties?.title || spreadsheetTitle;
        sheets = spreadsheet.sheets?.map((sheet: any) => ({
          title: sheet.properties?.title,
          sheetId: sheet.properties?.sheetId,
        })) || [];

        // Update integration with spreadsheet info if it wasn't set
        if (!spreadsheetId) {
          await ctx.runMutation(api.integrations.updateIntegration, {
            integrationId,
            configuration: {
              ...integration.configuration,
              spreadsheetId: targetSpreadsheetId,
            },
          });
        }
      }
      
      return {
        success: true,
        message: "Successfully connected to Google Sheets",
        spreadsheetTitle,
        sheets,
        spreadsheetId: targetSpreadsheetId,
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
      events: ["contact_created", "contact_updated"],
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
      (integration:any) => integration.type === "google_sheets" && integration.isActive
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
