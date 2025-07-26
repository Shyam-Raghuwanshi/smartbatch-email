import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api, internal } from "./_generated/api";

// Scheduled task runner for integration automation
export const runScheduledTasks = action({
  args: {},
  handler: async (ctx) => {
    const results = {
      healthChecks: null,
      triggeredEmails: null,
      eventCampaigns: null,
      webhookCleanup: null,
      oauthCleanup: null
    };

    try {
      // Run health checks for all integrations
      results.healthChecks = await ctx.runAction(api.monitoring.runAllHealthChecks, {});
    } catch (error) {
      console.error("Health checks failed:", error);
    }

    try {
      // Process scheduled triggered emails
      results.triggeredEmails = await ctx.runAction(api.emailTriggers.processScheduledTriggerEmails, {});
    } catch (error) {
      console.error("Triggered emails processing failed:", error);
    }

    try {
      // Process scheduled event campaign actions
      results.eventCampaigns = await ctx.runAction(api.eventCampaigns.processScheduledActions, {});
    } catch (error) {
      console.error("Event campaigns processing failed:", error);
    }

    try {
      // Clean up old webhook logs (older than 30 days)
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      results.webhookCleanup = await ctx.runMutation(internal.scheduler.cleanupOldWebhookLogs, {
        before: thirtyDaysAgo
      });
    } catch (error) {
      console.error("Webhook cleanup failed:", error);
    }

    try {
      // Clean up expired OAuth states
      results.oauthCleanup = await ctx.runMutation(api.oauth.cleanupExpiredOAuthStates, {});
    } catch (error) {
      console.error("OAuth cleanup failed:", error);
    }

    return {
      timestamp: Date.now(),
      results
    };
  }
});

export const cleanupOldWebhookLogs = mutation({
  args: {
    before: v.number()
  },
  handler: async (ctx, args) => {
    const oldLogs = await ctx.runQuery(internal.scheduler.getOldWebhookLogs, {
      before: args.before
    });

    let deletedCount = 0;
    for (const log of oldLogs) {
      await ctx.runMutation(internal.scheduler.deleteWebhookLog, {
        id: log._id
      });
      deletedCount++;
    }

    return { deletedCount };
  }
});

export const getOldWebhookLogs = query({
  args: {
    before: v.number()
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("webhookLogs")
      .filter(q => q.lt(q.field("timestamp"), args.before))
      .collect();
  }
});

export const deleteWebhookLog = mutation({
  args: {
    id: v.id("webhookLogs")
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  }
});

// Rate limiting for API endpoints
export const checkRateLimit = action({
  args: {
    apiKeyId: v.id("apiKeys"),
    endpoint: v.string()
  },
  handler: async (ctx, args) => {
    const apiKey = await ctx.runQuery(api.apiKeys.getApiKey, {
      id: args.apiKeyId
    });

    if (!apiKey || !apiKey.isActive) {
      return { allowed: false, reason: "Invalid or inactive API key" };
    }

    const rateLimitConfig = apiKey.rateLimitConfig;
    if (!rateLimitConfig) {
      return { allowed: true };
    }

    const now = Date.now();
    const oneMinute = 60 * 1000;
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * 60 * 60 * 1000;

    // Check requests in the last minute
    const recentRequests = await ctx.runQuery(internal.scheduler.getRecentRequests, {
      apiKeyId: args.apiKeyId,
      since: now - oneMinute
    });

    if (recentRequests.length >= rateLimitConfig.requestsPerMinute) {
      return { 
        allowed: false, 
        reason: "Rate limit exceeded: requests per minute",
        resetTime: now + oneMinute
      };
    }

    // Check requests in the last hour
    const hourlyRequests = await ctx.runQuery(internal.scheduler.getRecentRequests, {
      apiKeyId: args.apiKeyId,
      since: now - oneHour
    });

    if (hourlyRequests.length >= rateLimitConfig.requestsPerHour) {
      return { 
        allowed: false, 
        reason: "Rate limit exceeded: requests per hour",
        resetTime: now + oneHour
      };
    }

    // Check requests in the last day
    const dailyRequests = await ctx.runQuery(internal.scheduler.getRecentRequests, {
      apiKeyId: args.apiKeyId,
      since: now - oneDay
    });

    if (dailyRequests.length >= rateLimitConfig.requestsPerDay) {
      return { 
        allowed: false, 
        reason: "Rate limit exceeded: requests per day",
        resetTime: now + oneDay
      };
    }

    // Log the request
    await ctx.runMutation(internal.scheduler.logApiRequest, {
      apiKeyId: args.apiKeyId,
      endpoint: args.endpoint,
      timestamp: now
    });

    return { allowed: true };
  }
});

export const getRecentRequests = query({
  args: {
    apiKeyId: v.id("apiKeys"),
    since: v.number()
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("apiRequestLogs")
      .filter(q => q.eq(q.field("apiKeyId"), args.apiKeyId))
      .filter(q => q.gte(q.field("timestamp"), args.since))
      .collect();
  }
});

export const logApiRequest = mutation({
  args: {
    apiKeyId: v.id("apiKeys"),
    endpoint: v.string(),
    timestamp: v.number()
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("apiRequestLogs", {
      apiKeyId: args.apiKeyId,
      endpoint: args.endpoint,
      timestamp: args.timestamp
    });
  }
});

// Integration analytics aggregation
export const generateIntegrationAnalytics = action({
  args: {
    userId: v.id("users"),
    timeRange: v.optional(v.object({
      start: v.number(),
      end: v.number()
    }))
  },
  handler: async (ctx, args) => {
    const timeRange = args.timeRange || {
      start: Date.now() - (30 * 24 * 60 * 60 * 1000), // 30 days ago
      end: Date.now()
    };

    // Get all integrations for the user
    const integrations = await ctx.runQuery(api.integrations.getIntegrations, {
      userId: args.userId
    });

    const analytics = {
      overview: {
        totalIntegrations: integrations.length,
        activeIntegrations: integrations.filter(i => i.status === "connected").length,
        totalSyncs: 0,
        totalWebhooks: 0,
        totalApiCalls: 0
      },
      integrationMetrics: [],
      syncHistory: [],
      webhookMetrics: [],
      healthMetrics: []
    };

    for (const integration of integrations) {
      try {
        // Get sync history
        const syncs = await ctx.runQuery(api.integrations.getSyncHistory, {
          integrationId: integration._id,
          timeRange
        });

        // Get webhook metrics
        const webhooks = await ctx.runQuery(api.webhooks.getWebhooksByIntegration, {
          integrationId: integration._id
        });

        let webhookDeliveries = 0;
        for (const webhook of webhooks) {
          const logs = await ctx.runQuery(api.webhooks.getWebhookLogs, {
            webhookId: webhook._id,
            timeRange
          });
          webhookDeliveries += logs.length;
        }

        // Get health metrics
        const healthChecks = await ctx.runQuery(api.monitoring.getHealthChecks, {
          userId: args.userId,
          integrationId: integration._id
        });

        const integrationMetric = {
          integrationId: integration._id,
          name: integration.name,
          type: integration.type,
          status: integration.status,
          totalSyncs: syncs.length,
          successfulSyncs: syncs.filter(s => s.status === "completed").length,
          failedSyncs: syncs.filter(s => s.status === "failed").length,
          webhookDeliveries,
          healthScore: calculateHealthScore(healthChecks),
          lastSync: integration.lastSync,
          uptime: healthChecks.length > 0 
            ? healthChecks.reduce((sum, hc) => sum + hc.statistics.uptime, 0) / healthChecks.length 
            : 100
        };

        analytics.integrationMetrics.push(integrationMetric);
        analytics.overview.totalSyncs += syncs.length;
        analytics.overview.totalWebhooks += webhookDeliveries;

      } catch (error) {
        console.error(`Analytics error for integration ${integration._id}:`, error);
      }
    }

    return analytics;
  }
});

function calculateHealthScore(healthChecks: any[]): number {
  if (healthChecks.length === 0) return 100;

  const totalScore = healthChecks.reduce((sum, hc) => {
    let score = hc.statistics.uptime;
    
    // Penalize for consecutive failures
    if (hc.consecutiveFailures > 0) {
      score -= Math.min(hc.consecutiveFailures * 10, 50);
    }

    // Bonus for recent successful checks
    if (hc.lastCheck > Date.now() - (60 * 60 * 1000) && hc.status === "healthy") {
      score += 5;
    }

    return sum + Math.max(score, 0);
  }, 0);

  return Math.min(totalScore / healthChecks.length, 100);
}

// Auto-tune integrations based on performance data
export const autoTuneIntegrations = mutation({
  args: {},
  handler: async (ctx) => {
    const integrations = await ctx.db.query("integrations")
      .filter(q => q.eq(q.field("status"), "connected"))
      .collect();

    const results = [];

    for (const integration of integrations) {
      try {
        // Schedule auto-tuning for each integration
        const tuningResult = await ctx.scheduler.runAfter(0, internal.performanceOptimization.autoTuneIntegration, {
          integrationId: integration._id,
          categories: ["rate_limiting", "timeouts", "retries"]
        });
        
        results.push({ 
          integrationId: integration._id, 
          status: "scheduled",
          tuningJobId: tuningResult
        });
      } catch (error) {
        results.push({ 
          integrationId: integration._id, 
          status: "failed", 
          error: error.message 
        });
      }
    }

    return { processed: results.length, results };
  }
});
