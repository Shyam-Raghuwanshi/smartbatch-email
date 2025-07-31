import { mutation, query, action, internalMutation, internalQuery, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { internal, api } from "./_generated/api";

/**
 * Integration Polling Management
 * Handles automated sync polling for connected integrations
 */

// Get polling settings for an integration
export const getPollingSettings = query({
  args: {
    integrationId: v.id("integrations"),
  },
  handler: async (ctx, { integrationId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const settings = await ctx.db
      .query("integrationPollingSettings")
      .withIndex("by_integration", (q) => q.eq("integrationId", integrationId))
      .unique();

    if (settings && settings.userId !== user._id) {
      throw new Error("Access denied");
    }

    return settings;
  },
});

// Get all polling settings for a user
export const getUserPollingSettings = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const settings = await ctx.db
      .query("integrationPollingSettings")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Get integration details for each setting
    const settingsWithIntegrations = await Promise.all(
      settings.map(async (setting) => {
        const integration = await ctx.db.get(setting.integrationId);
        return {
          ...setting,
          integration: integration ? {
            name: integration.name,
            type: integration.type,
            status: integration.status,
          } : null,
        };
      })
    );

    return settingsWithIntegrations;
  },
});

// Create or update polling settings
export const updatePollingSettings = mutation({
  args: {
    integrationId: v.id("integrations"),
    enabled: v.boolean(),
    frequency: v.union(
      v.literal("15min"),
      v.literal("30min"),
      v.literal("hourly"),
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("custom")
    ),
    intervalMinutes: v.optional(v.number()),
    timezone: v.optional(v.string()),
  },
  handler: async (ctx, { integrationId, enabled, frequency, intervalMinutes, timezone }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    // Verify the integration belongs to the user
    const integration = await ctx.db.get(integrationId);
    if (!integration || integration.userId !== user._id) {
      throw new Error("Integration not found or access denied");
    }

    // Convert frequency to minutes
    let minutes = intervalMinutes || 60; // Default to 1 hour
    switch (frequency) {
      case "15min":
        minutes = 15;
        break;
      case "30min":
        minutes = 30;
        break;
      case "hourly":
        minutes = 60;
        break;
      case "daily":
        minutes = 24 * 60;
        break;
      case "weekly":
        minutes = 7 * 24 * 60;
        break;
      case "custom":
        if (!intervalMinutes || intervalMinutes < 15) {
          throw new Error("Custom interval must be at least 15 minutes");
        }
        minutes = intervalMinutes;
        break;
    }

    // Calculate next poll time
    const now = Date.now();
    const nextPollAt = enabled ? now + (minutes * 60 * 1000) : undefined;

    // Check if settings already exist
    const existingSettings = await ctx.db
      .query("integrationPollingSettings")
      .withIndex("by_integration", (q) => q.eq("integrationId", integrationId))
      .unique();

    if (existingSettings) {
      // Update existing settings
      await ctx.db.patch(existingSettings._id, {
        enabled,
        frequency,
        intervalMinutes: minutes,
        nextPollAt,
        timezone,
        retryCount: 0, // Reset retry count
        updatedAt: now,
      });

      return existingSettings._id;
    } else {
      // Create new settings
      const settingsId = await ctx.db.insert("integrationPollingSettings", {
        userId: user._id,
        integrationId,
        enabled,
        frequency,
        intervalMinutes: minutes,
        nextPollAt,
        timezone,
        retryCount: 0,
        maxRetries: 3,
        createdAt: now,
        updatedAt: now,
      });

      return settingsId;
    }
  },
});

// Internal function to get integrations ready for polling
export const getIntegrationsForPolling = internalQuery({
  handler: async (ctx) => {
    const now = Date.now();
    
    // Get all enabled polling settings where nextPollAt is due
    const dueSettings = await ctx.db
      .query("integrationPollingSettings")
      .withIndex("by_enabled", (q) => q.eq("enabled", true))
      .filter((q) => q.and(
        q.neq(q.field("nextPollAt"), undefined),
        q.lte(q.field("nextPollAt"), now)
      ))
      .collect();

    // Get integration details for each setting
    const integrationsWithSettings = await Promise.all(
      dueSettings.map(async (setting) => {
        const integration = await ctx.db.get(setting.integrationId);
        if (!integration || integration.status !== "connected") {
          return null;
        }

        return {
          integration,
          settings: setting,
        };
      })
    );

    return integrationsWithSettings.filter((item): item is NonNullable<typeof item> => item !== null);
  },
});

// Internal function to update polling status after sync
export const updatePollingStatus = internalMutation({
  args: {
    settingsId: v.id("integrationPollingSettings"),
    success: v.boolean(),
    error: v.optional(v.string()),
  },
  handler: async (ctx, { settingsId, success, error }) => {
    const settings = await ctx.db.get(settingsId);
    if (!settings) return;

    const now = Date.now();
    let retryCount = settings.retryCount || 0;
    let nextPollAt: number | undefined;

    if (success) {
      // Reset retry count and schedule next poll
      retryCount = 0;
      nextPollAt = now + (settings.intervalMinutes * 60 * 1000);
    } else {
      // Increment retry count
      retryCount += 1;
      
      if (retryCount >= (settings.maxRetries || 3)) {
        // Disable polling after max retries
        await ctx.db.patch(settingsId, {
          enabled: false,
          retryCount,
          lastPolledAt: now,
          updatedAt: now,
        });
        
        // Log the error
        console.error(`Polling disabled for integration ${settings.integrationId} after ${retryCount} failed attempts: ${error}`);
        return;
      } else {
        // Schedule retry with exponential backoff
        const backoffMinutes = Math.min(30, 5 * Math.pow(2, retryCount - 1)); // 5, 10, 20, 30 minutes max
        nextPollAt = now + (backoffMinutes * 60 * 1000);
      }
    }

    await ctx.db.patch(settingsId, {
      retryCount,
      nextPollAt,
      lastPolledAt: now,
      updatedAt: now,
    });
  },
});

// Action to perform polling sync for a specific integration
export const performPollingSync = action({
  args: {
    integrationId: v.id("integrations"),
    settingsId: v.id("integrationPollingSettings"),
  },
  handler: async (ctx, { integrationId, settingsId }) => {
    try {
      const integration = await ctx.runQuery(internal.integrations.getByIdInternal, { integrationId });
      
      if (!integration) {
        throw new Error("Integration not found");
      }

      // Currently only handle Google Sheets
      if (integration.type === "google_sheets") {
        console.log(`Performing auto-sync for Google Sheets integration: ${integration.name}`);
        
        // Use the existing sync function
        await ctx.runAction(api.googleSheetsIntegration.syncContactsFromSheets, {
          integrationId,
        });

        // Update polling status as successful
        await ctx.runMutation(internal.integrationPolling.updatePollingStatus, {
          settingsId,
          success: true,
        });

        console.log(`Auto-sync completed successfully for integration: ${integration.name}`);
      } else {
        throw new Error(`Auto-sync not supported for integration type: ${integration.type}`);
      }
    } catch (error) {
      console.error(`Auto-sync failed for integration ${integrationId}:`, error);
      
      // Update polling status as failed
      await ctx.runMutation(internal.integrationPolling.updatePollingStatus, {
        settingsId,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      throw error;
    }
  },
});

// Get sync history for an integration
export const getSyncHistory = query({
  args: {
    integrationId: v.id("integrations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { integrationId, limit = 10 }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    // Verify the integration belongs to the user
    const integration = await ctx.db.get(integrationId);
    if (!integration || integration.userId !== user._id) {
      throw new Error("Integration not found or access denied");
    }

    const syncs = await ctx.db
      .query("integrationSyncs")
      .withIndex("by_integration", (q) => q.eq("integrationId", integrationId))
      .order("desc")
      .take(limit);

    return syncs;
  },
});

// Internal action to process the polling queue
export const processPollingQueue = internalAction({
  handler: async (ctx) => {
    try {
      // Get all integrations that are due for polling
      const dueIntegrations = await ctx.runQuery(internal.integrationPolling.getIntegrationsForPolling);

      console.log(`Found ${dueIntegrations.length} integrations due for polling`);

      // Process each integration
      for (const { integration, settings } of dueIntegrations) {
        try {
          console.log(`Processing polling for integration: ${integration.name} (${integration.type})`);
          
          await ctx.runAction(internal.integrationPolling.performPollingSync, {
            integrationId: integration._id,
            settingsId: settings._id,
          });
        } catch (error) {
          console.error(`Failed to process polling for integration ${integration.name}:`, error);
          // Individual integration failures shouldn't stop processing others
        }
      }
    } catch (error) {
      console.error("Error processing polling queue:", error);
    }
  },
});
