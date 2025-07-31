import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

/**
 * Integration Management System
 * Handles external service integrations including OAuth, webhooks, and API keys
 */

// Get all integrations for a user
export const getUserIntegrations = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const integrations = await ctx.db
      .query("integrations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Strip sensitive data before returning
    return integrations.map(integration => ({
      ...integration,
      configuration: {
        ...integration.configuration,
        accessToken: integration.configuration.accessToken ? "***" : undefined,
        refreshToken: integration.configuration.refreshToken ? "***" : undefined,
        apiKey: integration.configuration.apiKey ? "***" : undefined,
        apiSecret: integration.configuration.apiSecret ? "***" : undefined,
        webhookSecret: integration.configuration.webhookSecret ? "***" : undefined,
      }
    }));
  },
});

// Get a single integration by ID
export const getById = query({
  args: {
    integrationId: v.id("integrations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const integration = await ctx.db.get(args.integrationId);
    
    if (!integration) {
      throw new Error("Integration not found");
    }

    // Check if the integration belongs to the user
    if (integration.userId !== user._id) {
      throw new Error("Access denied");
    }

    // Return integration with sensitive data masked
    return {
      ...integration,
      configuration: {
        ...integration.configuration,
        accessToken: integration.configuration.accessToken ? "***" : undefined,
        refreshToken: integration.configuration.refreshToken ? "***" : undefined,
        apiKey: integration.configuration.apiKey ? "***" : undefined,
        apiSecret: integration.configuration.apiSecret ? "***" : undefined,
        webhookSecret: integration.configuration.webhookSecret ? "***" : undefined,
      }
    };
  },
});

// Create a new integration
export const createIntegration = mutation({
  args: {
    type: v.union(
      v.literal("google_sheets"),
      v.literal("zapier"),
      v.literal("webhook"),
      v.literal("salesforce"),
      v.literal("hubspot"),
      v.literal("mailchimp"),
      v.literal("api_key"),
      v.literal("api_endpoint"),
      v.literal("custom")
    ),
    name: v.string(),
    description: v.optional(v.string()),
    configuration: v.record(v.string(), v.any()),
    permissions: v.array(v.union(
      v.literal("read_contacts"),
      v.literal("write_contacts"),
      v.literal("trigger_campaigns"),
      v.literal("read_analytics"),
      v.literal("webhook_events")
    )),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const integrationId = await ctx.db.insert("integrations", {
      userId: user._id,
      type: args.type,
      name: args.name,
      description: args.description,
      status: "configuring",
      configuration: args.configuration,
      permissions: args.permissions,
      healthStatus: "unknown",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Log audit event
    await ctx.scheduler.runAfter(0, internal.auditLogging.createAuditLog, {
      userId: user._id,
      integrationId,
      eventType: "integration_created",
      resourceType: "integrations",
      resourceId: integrationId,
      action: `Created ${args.type} integration: ${args.name}`,
      description: `Created ${args.type} integration: ${args.name}`,
      details: {
        integrationType: args.type,
        integrationName: args.name,
        permissions: args.permissions,
        configurationKeys: Object.keys(args.configuration),
      },
      riskLevel: "medium",
      tags: ["integration_management", "new_integration"],
    });

    return integrationId;
  },
});

// Update integration configuration
export const updateIntegration = mutation({
  args: {
    integrationId: v.id("integrations"),
    configuration: v.optional(v.record(v.string(), v.any())),
    status: v.optional(v.union(
      v.literal("connected"),
      v.literal("disconnected"),
      v.literal("error"),
      v.literal("pending"),
      v.literal("configuring"),
      v.literal("active")
    )),
    permissions: v.optional(v.array(v.union(
      v.literal("read_contacts"),
      v.literal("write_contacts"),
      v.literal("trigger_campaigns"),
      v.literal("read_analytics"),
      v.literal("webhook_events")
    ))),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const integration = await ctx.db.get(args.integrationId);
    if (!integration || integration.userId !== user._id) {
      throw new Error("Integration not found");
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.configuration) {
      updates.configuration = { ...integration.configuration, ...args.configuration };
    }

    if (args.status) {
      updates.status = args.status;
    }

    if (args.permissions) {
      updates.permissions = args.permissions;
    }

    if (args.isActive !== undefined) {
      updates.isActive = args.isActive;
    }

    await ctx.db.patch(args.integrationId, updates);

    // If status changed to "connected" and it's a Google Sheets integration, 
    // create default polling settings
    if (args.status === "connected" && integration.type === "google_sheets") {
      // Check if polling settings already exist
      const existingSettings = await ctx.db
        .query("integrationPollingSettings")
        .withIndex("by_integration", (q) => q.eq("integrationId", args.integrationId))
        .unique();

      if (!existingSettings) {
        // Create default polling settings for Google Sheets (1 hour interval)
        await ctx.db.insert("integrationPollingSettings", {
          userId: user._id,
          integrationId: args.integrationId,
          enabled: true,
          frequency: "hourly",
          intervalMinutes: 60,
          nextPollAt: Date.now() + (60 * 60 * 1000), // Next poll in 1 hour
          retryCount: 0,
          maxRetries: 3,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    }

    // Log audit event
    const changes = [];
    if (args.configuration) changes.push("configuration");
    if (args.status) changes.push("status");
    if (args.permissions) changes.push("permissions");
    if (args.isActive !== undefined) changes.push("isActive");

    await ctx.scheduler.runAfter(0, internal.auditLogging.createAuditLog, {
      userId: user._id,
      integrationId: args.integrationId,
      eventType: "integration_updated",
      resourceType: "integrations",
      resourceId: args.integrationId,
      action: `Updated integration: ${integration.name}`,
      description: `Updated integration: ${integration.name}`,
      details: {
        integrationName: integration.name,
        integrationType: integration.type,
        changedFields: changes,
        previousStatus: integration.status,
        newStatus: args.status,
        configurationChanged: !!args.configuration,
        permissionsChanged: !!args.permissions,
        isActiveChanged: args.isActive !== undefined,
        newIsActive: args.isActive,
      },
      riskLevel: args.status === "disconnected" ? "high" : "medium",
      tags: ["integration_management", "configuration_change"],
    });

    return args.integrationId;
  },
});

// Delete an integration
export const deleteIntegration = mutation({
  args: {
    integrationId: v.id("integrations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const integration = await ctx.db.get(args.integrationId);
    if (!integration || integration.userId !== user._id) {
      throw new Error("Integration not found");
    }

    // Delete related sync records
    const syncs = await ctx.db
      .query("integrationSyncs")
      .withIndex("by_integration", (q) => q.eq("integrationId", args.integrationId))
      .collect();

    for (const sync of syncs) {
      await ctx.db.delete(sync._id);
    }

    // Delete related webhook endpoints
    const webhooks = await ctx.db
      .query("webhookEndpoints")
      .withIndex("by_integration", (q) => q.eq("integrationId", args.integrationId))
      .collect();

    for (const webhook of webhooks) {
      await ctx.db.delete(webhook._id);
    }

    await ctx.db.delete(args.integrationId);
    return true;
  },
});

// Test integration connection
export const testIntegrationConnection = mutation({
  args: {
    integrationId: v.id("integrations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const integration = await ctx.db.get(args.integrationId);
    if (!integration || integration.userId !== user._id) {
      throw new Error("Integration not found");
    }

    try {
      // Perform connection test based on integration type
      let testResult = false;
      let errorMessage = "";

      switch (integration.type) {
        case "google_sheets":
          testResult = await testGoogleSheetsConnection(integration.configuration);
          break;
        case "webhook":
          testResult = await testWebhookConnection(integration.configuration);
          break;
        case "api_key":
          testResult = await testApiKeyConnection(integration.configuration);
          break;
        case "zapier":
          testResult = await testZapierConnection(integration.configuration);
          break;
        default:
          testResult = true; // For unsupported types, assume success
      }

      const healthStatus = testResult ? "healthy" : "error";
      const status = testResult ? "connected" : "error";

      await ctx.db.patch(args.integrationId, {
        status,
        healthStatus,
        lastHealthCheck: Date.now(),
        errorMessage: testResult ? undefined : errorMessage,
        updatedAt: Date.now(),
      });

      return {
        success: testResult,
        healthStatus,
        errorMessage: testResult ? undefined : errorMessage,
      };
    } catch (error) {
      await ctx.db.patch(args.integrationId, {
        status: "error",
        healthStatus: "error",
        lastHealthCheck: Date.now(),
        errorMessage: error instanceof Error ? error.message : "Connection test failed",
        updatedAt: Date.now(),
      });

      return {
        success: false,
        healthStatus: "error",
        errorMessage: error instanceof Error ? error.message : "Connection test failed",
      };
    }
  },
});

// Get integration sync history
export const getIntegrationSyncs = query({
  args: {
    integrationId: v.optional(v.id("integrations")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    let query = ctx.db.query("integrationSyncs").withIndex("by_user", (q) => q.eq("userId", user._id));

    if (args.integrationId) {
      query = ctx.db.query("integrationSyncs").withIndex("by_integration", (q) => q.eq("integrationId", args.integrationId!));
    }

    const syncs = await query
      .order("desc")
      .take(args.limit || 50);

    // Get integration details for each sync
    const syncsWithIntegrations = await Promise.all(
      syncs.map(async (sync) => {
        const integration = await ctx.db.get(sync.integrationId);
        return {
          ...sync,
          integration: integration ? {
            name: integration.name,
            type: integration.type,
          } : null,
        };
      })
    );

    return syncsWithIntegrations;
  },
});

// Start a sync operation
export const startSync = mutation({
  args: {
    integrationId: v.id("integrations"),
    type: v.union(
      v.literal("contacts_import"),
      v.literal("contacts_export"),
      v.literal("bidirectional_sync"),
      v.literal("campaign_trigger"),
      v.literal("analytics_export"),
      v.literal("webhook_delivery")
    ),
    direction: v.union(
      v.literal("inbound"),
      v.literal("outbound"),
      v.literal("bidirectional")
    ),
    options: v.optional(v.record(v.string(), v.any())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const integration = await ctx.db.get(args.integrationId);
    if (!integration || integration.userId !== user._id) {
      throw new Error("Integration not found");
    }

    if (integration.status !== "connected" && integration.status !== "active") {
      throw new Error("Integration is not connected or active");
    }

    const syncId = await ctx.db.insert("integrationSyncs", {
      userId: user._id,
      integrationId: args.integrationId,
      type: args.type,
      status: "pending",
      direction: args.direction,
      data: {
        source: {
          type: args.direction === "inbound" ? integration.type : "smartbatch",
          identifier: args.options?.sourceId,
        },
        destination: {
          type: args.direction === "outbound" ? integration.type : "smartbatch",
          identifier: args.options?.destinationId,
        },
        metadata: args.options || {},
      },
      progress: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Schedule the sync to be processed
    await ctx.scheduler.runAfter(0, internal.integrations.processSync, { syncId });

    return syncId;
  },
});

// Update a sync operation
export const updateSync = mutation({
  args: {
    syncId: v.id("integrationSyncs"),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled")
    )),
    progress: v.optional(v.number()),
    data: v.optional(v.record(v.string(), v.any())),
    error: v.optional(v.string()),
    completedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const sync = await ctx.db.get(args.syncId);
    if (!sync || sync.userId !== user._id) {
      throw new Error("Sync not found");
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.status) {
      updates.status = args.status;
    }

    if (args.progress !== undefined) {
      updates.progress = args.progress;
    }

    if (args.data) {
      updates.data = { ...sync.data, ...args.data };
    }

    if (args.error) {
      updates.data = { 
        ...sync.data, 
        errors: [
          ...(sync.data.errors || []),
          {
            error: args.error,
            timestamp: Date.now(),
          },
        ],
      };
    }

    if (args.completedAt) {
      updates.completedAt = args.completedAt;
    }

    await ctx.db.patch(args.syncId, updates);

    return args.syncId;
  },
});

// Internal function to process sync operations
export const processSync = internalMutation({
  args: {
    syncId: v.id("integrationSyncs"),
  },
  handler: async (ctx, args) => {
    const sync = await ctx.db.get(args.syncId);
    if (!sync) return;

    const integration = await ctx.db.get(sync.integrationId);
    if (!integration) return;

    try {
      await ctx.db.patch(args.syncId, {
        status: "running",
        startedAt: Date.now(),
        updatedAt: Date.now(),
      });

      let result;
      switch (sync.type) {
        case "contacts_import":
          result = await processContactsImport(ctx, integration, sync);
          break;
        case "contacts_export":
          result = await processContactsExport(ctx, integration, sync);
          break;
        case "bidirectional_sync":
          result = await processBidirectionalSync(ctx, integration, sync);
          break;
        default:
          throw new Error(`Unsupported sync type: ${sync.type}`);
      }

      await ctx.db.patch(args.syncId, {
        status: "completed",
        data: { ...sync.data, ...result },
        progress: 100,
        completedAt: Date.now(),
        updatedAt: Date.now(),
      });

    } catch (error) {
      await ctx.db.patch(args.syncId, {
        status: "failed",
        data: {
          ...sync.data,
          errors: [
            ...(sync.data.errors || []),
            {
              error: error instanceof Error ? error.message : "Unknown error",
              timestamp: Date.now(),
            },
          ],
        },
        completedAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  },
});

// Helper functions for testing connections
async function testGoogleSheetsConnection(config: any): Promise<boolean> {
  // TODO: Implement Google Sheets API test
  // For now, return true if required fields are present
  return !!(config.accessToken && config.spreadsheetId);
}

async function testWebhookConnection(config: any): Promise<boolean> {
  // TODO: Implement webhook ping test
  // For now, return true if URL is present
  return !!config.webhookUrl;
}

async function testApiKeyConnection(config: any): Promise<boolean> {
  // TODO: Implement API key validation
  // For now, return true if API key is present
  return !!config.apiKey;
}

async function testZapierConnection(config: any): Promise<boolean> {
  // TODO: Implement Zapier webhook test
  // For now, return true if hook URL is present
  return !!config.zapierHookUrl;
}

// Helper functions for sync processing
async function processContactsImport(ctx: any, integration: any, sync: any): Promise<any> {
  // TODO: Implement contacts import logic based on integration type
  return {
    totalRecords: 0,
    processedRecords: 0,
    successfulRecords: 0,
    failedRecords: 0,
  };
}

async function processContactsExport(ctx: any, integration: any, sync: any): Promise<any> {
  // TODO: Implement contacts export logic based on integration type
  return {
    totalRecords: 0,
    processedRecords: 0,
    successfulRecords: 0,
    failedRecords: 0,
  };
}

async function processBidirectionalSync(ctx: any, integration: any, sync: any): Promise<any> {
  // TODO: Implement bidirectional sync logic
  return {
    totalRecords: 0,
    processedRecords: 0,
    successfulRecords: 0,
    failedRecords: 0,
  };
}

// Internal function to get integration with full sensitive data (for Actions)
export const getByIdInternal = internalQuery({
  args: {
    integrationId: v.id("integrations"),
  },
  handler: async (ctx, args) => {
    const integration = await ctx.db.get(args.integrationId);
    
    if (!integration) {
      throw new Error("Integration not found");
    }

    // Return integration with full data (no masking) for internal use
    return integration;
  },
});

// Internal function to update integration status
export const updateIntegrationStatus = internalMutation({
  args: {
    integrationId: v.id("integrations"),
    status: v.optional(v.union(
      v.literal("connected"),
      v.literal("disconnected"),
      v.literal("error"),
      v.literal("pending"),
      v.literal("configuring"),
      v.literal("active")
    )),
    healthStatus: v.optional(v.union(
      v.literal("healthy"),
      v.literal("warning"),
      v.literal("error"),
      v.literal("unknown")
    )),
    errorMessage: v.optional(v.string()),
    lastSyncAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.status !== undefined) updates.status = args.status;
    if (args.healthStatus !== undefined) updates.healthStatus = args.healthStatus;
    if (args.errorMessage !== undefined) updates.errorMessage = args.errorMessage;
    if (args.lastSyncAt !== undefined) updates.lastSyncAt = args.lastSyncAt;

    await ctx.db.patch(args.integrationId, updates);
  },
});
