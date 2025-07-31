import { mutation, query, action, internalMutation, internalAction, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

/**
 * API Integration Management
 * Handles external API endpoint integrations
 */

// Create API integration
export const createApiIntegration = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    apiEndpoint: v.string(),
    apiKey: v.string(),
    headers: v.optional(v.record(v.string(), v.string())),
    permissions: v.array(v.union(
      v.literal("read_contacts"),
      v.literal("write_contacts")
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

    // Create the integration
    const integrationId = await ctx.db.insert("integrations", {
      userId: user._id,
      type: "api_endpoint",
      name: args.name,
      description: args.description,
      status: "configuring",
      configuration: {
        apiEndpoint: args.apiEndpoint,
        apiKey: args.apiKey,
        headers: args.headers || {},
      },
      permissions: args.permissions,
      healthStatus: "unknown",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create default polling settings (daily)
    await ctx.db.insert("integrationPollingSettings", {
      userId: user._id,
      integrationId,
      enabled: true,
      frequency: "daily",
      intervalMinutes: 1440, // 24 hours
      timezone: "UTC",
      retryCount: 0,
      maxRetries: 3,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Log audit event
    await ctx.scheduler.runAfter(0, internal.auditLogging.createAuditLog, {
      userId: user._id,
      integrationId,
      eventType: "integration_created",
      resourceType: "integrations",
      action: "Created API integration",
      description: `Created API integration: ${args.name}`,
      details: { endpoint: args.apiEndpoint },
      riskLevel: "medium",
    });

    return integrationId;
  },
});

// Test API endpoint connection
export const testApiConnection = action({
  args: {
    apiEndpoint: v.string(),
    apiKey: v.string(),
    headers: v.optional(v.record(v.string(), v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${args.apiKey}`,
        'x-api-key': args.apiKey, // Add x-api-key header for compatibility
        ...args.headers,
      };

      console.log('Testing API connection to:', args.apiEndpoint);
      console.log('Headers:', { ...headers, 'Authorization': '[REDACTED]', 'x-api-key': '[REDACTED]' });

      const response = await fetch(args.apiEndpoint, {
        method: 'GET',
        headers,
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Response data:', data);
      
      // Handle different response formats
      let preview = data;
      let totalRecords = 1;
      
      // If response has a "contacts" property, use that
      if (data.contacts && Array.isArray(data.contacts)) {
        preview = data.contacts.slice(0, 5);
        totalRecords = data.contacts.length;
      } 
      // If response is directly an array
      else if (Array.isArray(data)) {
        preview = data.slice(0, 5);
        totalRecords = data.length;
      }
      // If response is a single object, wrap it in an array for preview
      else if (typeof data === 'object' && data !== null) {
        preview = [data];
        totalRecords = 1;
      }

      return {
        success: true,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        preview,
        totalRecords,
      };
    } catch (error) {
      console.error('API connection test failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

// Fetch data from API endpoint
export const fetchFromApiEndpoint = action({
  args: {
    integrationId: v.id("integrations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.runQuery(internal.users.getByClerkId, {
      clerkId: identity.subject,
    });

    if (!user) throw new Error("User not found");

    const integration = await ctx.runQuery(internal.integrations.getByIdInternal, {
      integrationId: args.integrationId,
    });

    if (!integration || integration.userId !== user._id) {
      throw new Error("Integration not found or access denied");
    }

    if (integration.type !== "api_endpoint") {
      throw new Error("Not an API endpoint integration");
    }

    const config = integration.configuration;
    if (!config.apiEndpoint || !config.apiKey) {
      throw new Error("API endpoint or key not configured");
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'x-api-key': config.apiKey, // Add x-api-key header for compatibility
        ...config.headers,
      };

      console.log('Fetching from API endpoint:', config.apiEndpoint);

      const response = await fetch(config.apiEndpoint, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Fetched data from API:', data);

      // Handle different response formats
      let processedData = data;
      let recordCount = 1;
      
      // If response has a "contacts" property, use that
      if (data.contacts && Array.isArray(data.contacts)) {
        processedData = data.contacts;
        recordCount = data.contacts.length;
      } 
      // If response is directly an array
      else if (Array.isArray(data)) {
        processedData = data;
        recordCount = data.length;
      }
      // If response is a single object
      else if (typeof data === 'object' && data !== null) {
        processedData = [data];
        recordCount = 1;
      }

      // Update integration status
      await ctx.runMutation(internal.integrations.updateIntegrationStatus, {
        integrationId: args.integrationId,
        status: "active",
        healthStatus: "healthy",
        lastSyncAt: Date.now(),
      });

      // Update polling settings
      await ctx.runMutation(internal.apiIntegrations.updateLastPolled, {
        integrationId: args.integrationId,
      });

      return {
        success: true,
        data: processedData,
        recordCount,
        fetchedAt: Date.now(),
      };
    } catch (error) {
      // Update integration status on error
      await ctx.runMutation(internal.integrations.updateIntegrationStatus, {
        integrationId: args.integrationId,
        status: "error",
        healthStatus: "error",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });

      throw error;
    }
  },
});

// Update polling settings
export const updatePollingSettings = mutation({
  args: {
    integrationId: v.id("integrations"),
    enabled: v.boolean(),
    frequency: v.union(
      v.literal("hourly"),
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly")
    ),
    timezone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    // Check if integration belongs to user
    const integration = await ctx.db.get(args.integrationId);
    if (!integration || integration.userId !== user._id) {
      throw new Error("Integration not found or access denied");
    }

    // Find existing polling settings
    const existingSettings = await ctx.db
      .query("integrationPollingSettings")
      .withIndex("by_integration", (q) => q.eq("integrationId", args.integrationId))
      .unique();

    const intervalMinutes = {
      hourly: 60,
      daily: 1440,
      weekly: 10080,
      monthly: 43200,
    }[args.frequency];

    const nextPollAt = args.enabled 
      ? Date.now() + (intervalMinutes * 60 * 1000)
      : undefined;

    if (existingSettings) {
      await ctx.db.patch(existingSettings._id, {
        enabled: args.enabled,
        frequency: args.frequency,
        intervalMinutes,
        timezone: args.timezone,
        nextPollAt,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("integrationPollingSettings", {
        userId: user._id,
        integrationId: args.integrationId,
        enabled: args.enabled,
        frequency: args.frequency,
        intervalMinutes,
        timezone: args.timezone,
        nextPollAt,
        retryCount: 0,
        maxRetries: 3,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    // Log audit event
    await ctx.scheduler.runAfter(0, internal.auditLogging.createAuditLog, {
      userId: user._id,
      integrationId: args.integrationId,
      eventType: "integration_settings_updated",
      resourceType: "integrations",
      action: "Updated polling settings",
      description: `Updated polling settings: ${args.frequency}, enabled: ${args.enabled}`,
      details: { frequency: args.frequency, enabled: args.enabled },
      riskLevel: "low",
    });
  },
});

// Get polling settings for an integration
export const getPollingSettings = query({
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

    // Check if integration belongs to user
    const integration = await ctx.db.get(args.integrationId);
    if (!integration || integration.userId !== user._id) {
      throw new Error("Integration not found or access denied");
    }

    return await ctx.db
      .query("integrationPollingSettings")
      .withIndex("by_integration", (q) => q.eq("integrationId", args.integrationId))
      .unique();
  },
});

// Update last polled timestamp (internal)
export const updateLastPolled = internalMutation({
  args: {
    integrationId: v.id("integrations"),
  },
  handler: async (ctx, args) => {
    const settings = await ctx.db
      .query("integrationPollingSettings")
      .withIndex("by_integration", (q) => q.eq("integrationId", args.integrationId))
      .unique();

    if (settings) {
      const nextPollAt = settings.enabled 
        ? Date.now() + (settings.intervalMinutes * 60 * 1000)
        : undefined;

      await ctx.db.patch(settings._id, {
        lastPolledAt: Date.now(),
        nextPollAt,
        retryCount: 0, // Reset retry count on successful poll
        updatedAt: Date.now(),
      });
    }
  },
});

// Get all user's API integrations with polling settings
export const getUserApiIntegrations = query({
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
      .filter((q) => q.eq(q.field("type"), "api_endpoint"))
      .collect();

    // Get polling settings for each integration
    const integrationsWithSettings = await Promise.all(
      integrations.map(async (integration) => {
        const pollingSettings = await ctx.db
          .query("integrationPollingSettings")
          .withIndex("by_integration", (q) => q.eq("integrationId", integration._id))
          .unique();

        return {
          ...integration,
          configuration: {
            ...integration.configuration,
            apiKey: integration.configuration.apiKey ? "***" : undefined,
          },
          pollingSettings,
        };
      })
    );

    return integrationsWithSettings;
  },
});

// Update API integration credentials
export const updateApiIntegration = mutation({
  args: {
    integrationId: v.id("integrations"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    apiEndpoint: v.optional(v.string()),
    apiKey: v.optional(v.string()),
    headers: v.optional(v.record(v.string(), v.string())),
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
      throw new Error("Integration not found or access denied");
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;

    if (args.apiEndpoint || args.apiKey || args.headers) {
      updates.configuration = {
        ...integration.configuration,
      };
      
      if (args.apiEndpoint) updates.configuration.apiEndpoint = args.apiEndpoint;
      if (args.apiKey) updates.configuration.apiKey = args.apiKey;
      if (args.headers) updates.configuration.headers = args.headers;
    }

    await ctx.db.patch(args.integrationId, updates);

    // Log audit event
    await ctx.scheduler.runAfter(0, internal.auditLogging.createAuditLog, {
      userId: user._id,
      integrationId: args.integrationId,
      eventType: "integration_updated",
      resourceType: "integrations",
      action: "Updated API integration",
      description: `Updated API integration: ${integration.name}`,
      details: { 
        endpointChanged: !!args.apiEndpoint,
        keyChanged: !!args.apiKey,
      },
      riskLevel: "medium",
    });
  },
});

// Internal function to poll all API integrations (called by cron)
export const pollApiIntegrations = internalAction({
  handler: async (ctx) => {
    const now = Date.now();
    
    // Get all enabled polling settings that are due
    const duePollings = await ctx.runQuery(internal.apiIntegrations.getDuePollings, { now });
    
    console.log(`Found ${duePollings.length} integrations due for polling`);
    
    for (const polling of duePollings) {
      try {
        await ctx.runAction(internal.apiIntegrations.pollSingleIntegration, {
          integrationId: polling.integrationId,
        });
      } catch (error) {
        console.error(`Failed to poll integration ${polling.integrationId}:`, error);
        
        // Update retry count
        await ctx.runMutation(internal.apiIntegrations.incrementRetryCount, {
          integrationId: polling.integrationId,
        });
      }
    }
  },
});

// Internal function to get polling settings that are due
export const getDuePollings = internalQuery({
  args: {
    now: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("integrationPollingSettings")
      .withIndex("by_enabled", (q) => q.eq("enabled", true))
      .filter((q) => 
        q.and(
          q.neq(q.field("nextPollAt"), undefined),
          q.lte(q.field("nextPollAt"), args.now)
        )
      )
      .collect();
  },
});

// Internal function to poll a single integration
export const pollSingleIntegration = internalAction({
  args: {
    integrationId: v.id("integrations"),
  },
  handler: async (ctx, args) => {
    const integration = await ctx.runQuery(internal.integrations.getByIdInternal, {
      integrationId: args.integrationId,
    });

    if (!integration || integration.type !== "api_endpoint") {
      throw new Error("Integration not found or not an API endpoint");
    }

    const config = integration.configuration;
    if (!config.apiEndpoint || !config.apiKey) {
      throw new Error("API endpoint or key not configured");
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'x-api-key': config.apiKey, // Add x-api-key header for compatibility
        ...config.headers,
      };

      const response = await fetch(config.apiEndpoint, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Handle different response formats
      let processedData = data;
      let recordCount = 1;
      
      // If response has a "contacts" property, use that
      if (data.contacts && Array.isArray(data.contacts)) {
        processedData = data.contacts;
        recordCount = data.contacts.length;
      } 
      // If response is directly an array
      else if (Array.isArray(data)) {
        processedData = data;
        recordCount = data.length;
      }
      // If response is a single object
      else if (typeof data === 'object' && data !== null) {
        processedData = [data];
        recordCount = 1;
      }

      // Update integration status
      await ctx.runMutation(internal.integrations.updateIntegrationStatus, {
        integrationId: args.integrationId,
        status: "active",
        healthStatus: "healthy",
        lastSyncAt: Date.now(),
      });

      // Update polling settings
      await ctx.runMutation(internal.apiIntegrations.updateLastPolled, {
        integrationId: args.integrationId,
      });

      console.log(`Successfully polled integration ${args.integrationId}, got ${recordCount} records`);

      return {
        success: true,
        data: processedData,
        recordCount,
        fetchedAt: Date.now(),
      };
    } catch (error) {
      // Update integration status on error
      await ctx.runMutation(internal.integrations.updateIntegrationStatus, {
        integrationId: args.integrationId,
        status: "error",
        healthStatus: "error",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });

      throw error;
    }
  },
});

// Internal function to increment retry count
export const incrementRetryCount = internalMutation({
  args: {
    integrationId: v.id("integrations"),
  },
  handler: async (ctx, args) => {
    const settings = await ctx.db
      .query("integrationPollingSettings")
      .withIndex("by_integration", (q) => q.eq("integrationId", args.integrationId))
      .unique();

    if (settings) {
      const newRetryCount = (settings.retryCount || 0) + 1;
      const maxRetries = settings.maxRetries || 3;
      
      // If max retries reached, disable polling
      if (newRetryCount >= maxRetries) {
        await ctx.db.patch(settings._id, {
          retryCount: newRetryCount,
          enabled: false,
          updatedAt: Date.now(),
        });
        
        console.log(`Disabled polling for integration ${args.integrationId} after ${newRetryCount} failed attempts`);
      } else {
        // Calculate next retry time with exponential backoff
        const backoffMinutes = Math.pow(2, newRetryCount) * 5; // 5, 10, 20, 40 minutes
        const nextPollAt = Date.now() + (backoffMinutes * 60 * 1000);
        
        await ctx.db.patch(settings._id, {
          retryCount: newRetryCount,
          nextPollAt,
          updatedAt: Date.now(),
        });
      }
    }
  },
});

// Internal function to clean up old polling logs
export const cleanupPollingLogs = internalAction({
  handler: async (ctx) => {
    // This function could clean up old sync history records
    // Implementation depends on whether you want to store polling history
    console.log("Cleaning up old polling logs...");
    
    // You could implement cleanup logic here for old sync records
    // For now, this is just a placeholder
  },
});
