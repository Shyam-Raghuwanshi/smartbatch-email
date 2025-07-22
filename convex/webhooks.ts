import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Webhook Management System
 * Handles webhook endpoints, delivery, and logging
 */

// Get all webhook endpoints for a user
export const getUserWebhooks = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const webhooks = await ctx.db
      .query("webhookEndpoints")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Get integration details for each webhook
    const webhooksWithIntegrations = await Promise.all(
      webhooks.map(async (webhook) => {
        let integration = null;
        if (webhook.integrationId) {
          integration = await ctx.db.get(webhook.integrationId);
        }
        
        return {
          ...webhook,
          integration: integration ? {
            name: integration.name,
            type: integration.type,
            status: integration.status,
          } : null,
          // Strip sensitive authentication data
          authentication: webhook.authentication ? {
            type: webhook.authentication.type,
            credentials: webhook.authentication.credentials ? "***" : undefined,
          } : undefined,
        };
      })
    );

    return webhooksWithIntegrations;
  },
});

// Create a new webhook endpoint
export const createWebhook = mutation({
  args: {
    integrationId: v.optional(v.id("integrations")),
    name: v.string(),
    url: v.string(),
    method: v.union(v.literal("GET"), v.literal("POST"), v.literal("PUT"), v.literal("DELETE")),
    events: v.array(v.union(
      v.literal("contact_created"),
      v.literal("contact_updated"),
      v.literal("campaign_sent"),
      v.literal("email_opened"),
      v.literal("email_clicked"),
      v.literal("unsubscribe"),
      v.literal("bounce"),
      v.literal("ab_test_complete")
    )),
    headers: v.optional(v.record(v.string(), v.string())),
    authentication: v.optional(v.object({
      type: v.union(v.literal("bearer"), v.literal("basic"), v.literal("api_key"), v.literal("none")),
      credentials: v.optional(v.record(v.string(), v.string())),
    })),
    retryPolicy: v.optional(v.object({
      maxRetries: v.number(),
      retryDelay: v.number(),
      exponentialBackoff: v.boolean(),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    // Validate integration if provided
    if (args.integrationId) {
      const integration = await ctx.db.get(args.integrationId);
      if (!integration || integration.userId !== user._id) {
        throw new Error("Integration not found");
      }
    }

    // Validate URL format
    try {
      new URL(args.url);
    } catch {
      throw new Error("Invalid URL format");
    }

    const webhookId = await ctx.db.insert("webhookEndpoints", {
      userId: user._id,
      integrationId: args.integrationId,
      name: args.name,
      url: args.url,
      method: args.method,
      isActive: true,
      events: args.events,
      headers: args.headers,
      authentication: args.authentication,
      retryPolicy: args.retryPolicy || {
        maxRetries: 3,
        retryDelay: 1000,
        exponentialBackoff: true,
      },
      successCount: 0,
      failureCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return webhookId;
  },
});

// Update webhook endpoint
export const updateWebhook = mutation({
  args: {
    webhookId: v.id("webhookEndpoints"),
    name: v.optional(v.string()),
    url: v.optional(v.string()),
    method: v.optional(v.union(v.literal("GET"), v.literal("POST"), v.literal("PUT"), v.literal("DELETE"))),
    isActive: v.optional(v.boolean()),
    events: v.optional(v.array(v.union(
      v.literal("contact_created"),
      v.literal("contact_updated"),
      v.literal("campaign_sent"),
      v.literal("email_opened"),
      v.literal("email_clicked"),
      v.literal("unsubscribe"),
      v.literal("bounce"),
      v.literal("ab_test_complete")
    ))),
    headers: v.optional(v.record(v.string(), v.string())),
    authentication: v.optional(v.object({
      type: v.union(v.literal("bearer"), v.literal("basic"), v.literal("api_key"), v.literal("none")),
      credentials: v.optional(v.record(v.string(), v.string())),
    })),
    retryPolicy: v.optional(v.object({
      maxRetries: v.number(),
      retryDelay: v.number(),
      exponentialBackoff: v.boolean(),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const webhook = await ctx.db.get(args.webhookId);
    if (!webhook || webhook.userId !== user._id) {
      throw new Error("Webhook not found");
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.url !== undefined) {
      try {
        new URL(args.url);
        updates.url = args.url;
      } catch {
        throw new Error("Invalid URL format");
      }
    }
    if (args.method !== undefined) updates.method = args.method;
    if (args.isActive !== undefined) updates.isActive = args.isActive;
    if (args.events !== undefined) updates.events = args.events;
    if (args.headers !== undefined) updates.headers = args.headers;
    if (args.authentication !== undefined) updates.authentication = args.authentication;
    if (args.retryPolicy !== undefined) updates.retryPolicy = args.retryPolicy;

    await ctx.db.patch(args.webhookId, updates);
    return args.webhookId;
  },
});

// Delete webhook endpoint
export const deleteWebhook = mutation({
  args: {
    webhookId: v.id("webhookEndpoints"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const webhook = await ctx.db.get(args.webhookId);
    if (!webhook || webhook.userId !== user._id) {
      throw new Error("Webhook not found");
    }

    // Delete related logs
    const logs = await ctx.db
      .query("webhookLogs")
      .withIndex("by_webhook", (q) => q.eq("webhookEndpointId", args.webhookId))
      .collect();

    for (const log of logs) {
      await ctx.db.delete(log._id);
    }

    await ctx.db.delete(args.webhookId);
    return true;
  },
});

// Test webhook endpoint
export const testWebhook = mutation({
  args: {
    webhookId: v.id("webhookEndpoints"),
    testPayload: v.optional(v.record(v.string(), v.any())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const webhook = await ctx.db.get(args.webhookId);
    if (!webhook || webhook.userId !== user._id) {
      throw new Error("Webhook not found");
    }

    const testPayload = args.testPayload || {
      event: "test",
      timestamp: Date.now(),
      data: {
        message: "This is a test webhook delivery from SmartBatch",
      },
    };

    try {
      const result = await deliverWebhook(webhook, "test", testPayload);
      
      // Log the test
      await ctx.db.insert("webhookLogs", {
        userId: user._id,
        webhookEndpointId: args.webhookId,
        event: "test",
        payload: testPayload,
        response: result.response,
        success: result.success,
        error: result.error,
        attempt: 1,
        timestamp: Date.now(),
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      await ctx.db.insert("webhookLogs", {
        userId: user._id,
        webhookEndpointId: args.webhookId,
        event: "test",
        payload: testPayload,
        success: false,
        error: errorMessage,
        attempt: 1,
        timestamp: Date.now(),
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  },
});

// Get webhook logs
export const getWebhookLogs = query({
  args: {
    webhookId: v.optional(v.id("webhookEndpoints")),
    event: v.optional(v.string()),
    success: v.optional(v.boolean()),
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

    let query = ctx.db.query("webhookLogs").withIndex("by_user", (q) => q.eq("userId", user._id));

    if (args.webhookId) {
      query = ctx.db.query("webhookLogs").withIndex("by_webhook", (q) => q.eq("webhookEndpointId", args.webhookId));
    }

    let logs = await query.order("desc").take(args.limit || 100);

    if (args.event) {
      logs = logs.filter(log => log.event === args.event);
    }

    if (args.success !== undefined) {
      logs = logs.filter(log => log.success === args.success);
    }

    // Get webhook details for each log
    const logsWithWebhooks = await Promise.all(
      logs.map(async (log) => {
        const webhook = await ctx.db.get(log.webhookEndpointId);
        return {
          ...log,
          webhook: webhook ? {
            name: webhook.name,
            url: webhook.url,
          } : null,
        };
      })
    );

    return logsWithWebhooks;
  },
});

// Internal function to deliver webhook (called by other parts of the system)
export const deliverWebhookInternal = internalMutation({
  args: {
    webhookId: v.id("webhookEndpoints"),
    event: v.string(),
    payload: v.record(v.string(), v.any()),
  },
  handler: async (ctx, args) => {
    const webhook = await ctx.db.get(args.webhookId);
    if (!webhook || !webhook.isActive) return;

    // Check if this webhook listens to this event
    if (!webhook.events.includes(args.event as any)) return;

    try {
      const result = await deliverWebhook(webhook, args.event, args.payload);
      
      // Update webhook stats
      if (result.success) {
        await ctx.db.patch(args.webhookId, {
          successCount: webhook.successCount + 1,
          lastTriggered: Date.now(),
        });
      } else {
        await ctx.db.patch(args.webhookId, {
          failureCount: webhook.failureCount + 1,
          lastTriggered: Date.now(),
        });
      }

      // Log the delivery
      await ctx.db.insert("webhookLogs", {
        userId: webhook.userId,
        webhookEndpointId: args.webhookId,
        event: args.event,
        payload: args.payload,
        response: result.response,
        success: result.success,
        error: result.error,
        attempt: 1,
        timestamp: Date.now(),
      });

      // If failed and retries are configured, schedule retries
      if (!result.success && webhook.retryPolicy.maxRetries > 0) {
        await scheduleWebhookRetry(ctx, webhook, args.event, args.payload, 1);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      await ctx.db.patch(args.webhookId, {
        failureCount: webhook.failureCount + 1,
        lastTriggered: Date.now(),
      });

      await ctx.db.insert("webhookLogs", {
        userId: webhook.userId,
        webhookEndpointId: args.webhookId,
        event: args.event,
        payload: args.payload,
        success: false,
        error: errorMessage,
        attempt: 1,
        timestamp: Date.now(),
      });
    }
  },
});

// Helper function to deliver webhook
async function deliverWebhook(webhook: any, event: string, payload: any): Promise<{
  success: boolean;
  response?: any;
  error?: string;
}> {
  try {
    const startTime = Date.now();
    
    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'SmartBatch-Webhook/1.0',
      'X-SmartBatch-Event': event,
      'X-SmartBatch-Timestamp': Date.now().toString(),
      ...webhook.headers,
    };

    // Add authentication headers
    if (webhook.authentication) {
      switch (webhook.authentication.type) {
        case 'bearer':
          if (webhook.authentication.credentials?.token) {
            headers['Authorization'] = `Bearer ${webhook.authentication.credentials.token}`;
          }
          break;
        case 'basic':
          if (webhook.authentication.credentials?.username && webhook.authentication.credentials?.password) {
            const auth = btoa(`${webhook.authentication.credentials.username}:${webhook.authentication.credentials.password}`);
            headers['Authorization'] = `Basic ${auth}`;
          }
          break;
        case 'api_key':
          if (webhook.authentication.credentials?.key && webhook.authentication.credentials?.value) {
            headers[webhook.authentication.credentials.key] = webhook.authentication.credentials.value;
          }
          break;
      }
    }

    // Make the request
    const response = await fetch(webhook.url, {
      method: webhook.method,
      headers,
      body: webhook.method !== 'GET' ? JSON.stringify(payload) : undefined,
    });

    const responseTime = Date.now() - startTime;
    const responseBody = await response.text();

    return {
      success: response.ok,
      response: {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseBody,
        responseTime,
      },
      error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

// Helper function to schedule webhook retries
async function scheduleWebhookRetry(ctx: any, webhook: any, event: string, payload: any, attempt: number) {
  if (attempt >= webhook.retryPolicy.maxRetries) return;

  let delay = webhook.retryPolicy.retryDelay;
  if (webhook.retryPolicy.exponentialBackoff) {
    delay = delay * Math.pow(2, attempt - 1);
  }

  // Schedule the retry
  await ctx.scheduler.runAfter(delay, "webhooks:retryDelivery", {
    webhookId: webhook._id,
    event,
    payload,
    attempt: attempt + 1,
  });
}

// Internal function for webhook retries
export const retryDelivery = internalMutation({
  args: {
    webhookId: v.id("webhookEndpoints"),
    event: v.string(),
    payload: v.record(v.string(), v.any()),
    attempt: v.number(),
  },
  handler: async (ctx, args) => {
    const webhook = await ctx.db.get(args.webhookId);
    if (!webhook || !webhook.isActive) return;

    try {
      const result = await deliverWebhook(webhook, args.event, args.payload);
      
      // Update webhook stats
      if (result.success) {
        await ctx.db.patch(args.webhookId, {
          successCount: webhook.successCount + 1,
        });
      } else {
        await ctx.db.patch(args.webhookId, {
          failureCount: webhook.failureCount + 1,
        });
      }

      // Log the retry
      await ctx.db.insert("webhookLogs", {
        userId: webhook.userId,
        webhookEndpointId: args.webhookId,
        event: args.event,
        payload: args.payload,
        response: result.response,
        success: result.success,
        error: result.error,
        attempt: args.attempt,
        timestamp: Date.now(),
      });

      // If still failed and more retries available, schedule next retry
      if (!result.success && args.attempt < webhook.retryPolicy.maxRetries) {
        await scheduleWebhookRetry(ctx, webhook, args.event, args.payload, args.attempt);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      await ctx.db.patch(args.webhookId, {
        failureCount: webhook.failureCount + 1,
      });

      await ctx.db.insert("webhookLogs", {
        userId: webhook.userId,
        webhookEndpointId: args.webhookId,
        event: args.event,
        payload: args.payload,
        success: false,
        error: errorMessage,
        attempt: args.attempt,
        timestamp: Date.now(),
      });
    }
  },
});
