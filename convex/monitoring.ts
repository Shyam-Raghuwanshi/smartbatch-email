import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api, internal } from "./_generated/api";

// Health monitoring system for integrations
export const createHealthCheck = mutation({
  args: {
    integrationId: v.id("integrations"),
    name: v.string(),
    type: v.union(
      v.literal("connectivity"),
      v.literal("authentication"),
      v.literal("rate_limit"),
      v.literal("data_sync"),
      v.literal("webhook_delivery"),
      v.literal("api_response"),
      v.literal("custom")
    ),
    config: v.object({
      endpoint: v.optional(v.string()),
      method: v.optional(v.string()),
      expectedResponse: v.optional(v.any()),
      timeout: v.optional(v.number()), // milliseconds
      retries: v.optional(v.number()),
      interval: v.number(), // minutes between checks
      alertThreshold: v.optional(v.number()), // consecutive failures before alert
      criticalThreshold: v.optional(v.number())
    }),
    isActive: v.boolean(),
    tags: v.optional(v.array(v.string()))
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("healthChecks", {
      ...args,
      status: "pending",
      lastCheck: 0,
      consecutiveFailures: 0,
      statistics: {
        totalChecks: 0,
        successfulChecks: 0,
        failedChecks: 0,
        averageResponseTime: 0,
        uptime: 100
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  }
});

export const runHealthCheck = action({
  args: {
    healthCheckId: v.id("healthChecks")
  },
  handler: async (ctx, args) => {
    const healthCheck = await ctx.runQuery(api.monitoring.getHealthCheck, {
      id: args.healthCheckId
    });

    if (!healthCheck || !healthCheck.isActive) {
      return { error: "Health check not found or inactive" };
    }

    const integration = await ctx.runQuery(api.integrations.getIntegration, {
      id: healthCheck.integrationId
    });

    if (!integration) {
      return { error: "Integration not found" };
    }

    const startTime = Date.now();
    let result: any;

    try {
      result = await performHealthCheck(healthCheck, integration);
    } catch (error) {
      result = {
        success: false,
        error: error.message,
        responseTime: Date.now() - startTime
      };
    }

    // Record the check result
    const checkResultId = await ctx.runMutation(internal.monitoring.recordHealthCheckResult, {
      healthCheckId: args.healthCheckId,
      success: result.success,
      responseTime: result.responseTime,
      error: result.error,
      details: result.details
    });

    // Update health check statistics
    await ctx.runMutation(internal.monitoring.updateHealthCheckStats, {
      healthCheckId: args.healthCheckId,
      success: result.success,
      responseTime: result.responseTime
    });

    // Check if alerts need to be triggered
    if (!result.success) {
      await ctx.runAction(internal.monitoring.checkAlertThresholds, {
        healthCheckId: args.healthCheckId
      });
    }

    return {
      success: result.success,
      responseTime: result.responseTime,
      checkResultId,
      error: result.error
    };
  }
});

export const recordHealthCheckResult = mutation({
  args: {
    healthCheckId: v.id("healthChecks"),
    success: v.boolean(),
    responseTime: v.number(),
    error: v.optional(v.string()),
    details: v.optional(v.any())
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("healthCheckResults", {
      healthCheckId: args.healthCheckId,
      success: args.success,
      responseTime: args.responseTime,
      error: args.error,
      details: args.details,
      timestamp: Date.now()
    });
  }
});

export const updateHealthCheckStats = mutation({
  args: {
    healthCheckId: v.id("healthChecks"),
    success: v.boolean(),
    responseTime: v.number()
  },
  handler: async (ctx, args) => {
    const healthCheck = await ctx.db.get(args.healthCheckId);
    if (!healthCheck) return;

    const stats = healthCheck.statistics;
    const totalChecks = stats.totalChecks + 1;
    const successfulChecks = stats.successfulChecks + (args.success ? 1 : 0);
    const failedChecks = stats.failedChecks + (args.success ? 0 : 1);
    
    // Calculate new average response time
    const averageResponseTime = 
      (stats.averageResponseTime * stats.totalChecks + args.responseTime) / totalChecks;
    
    // Calculate uptime percentage
    const uptime = (successfulChecks / totalChecks) * 100;

    // Update consecutive failures
    const consecutiveFailures = args.success ? 0 : healthCheck.consecutiveFailures + 1;

    await ctx.db.patch(args.healthCheckId, {
      status: args.success ? "healthy" : "unhealthy",
      lastCheck: Date.now(),
      consecutiveFailures,
      statistics: {
        totalChecks,
        successfulChecks,
        failedChecks,
        averageResponseTime,
        uptime
      },
      updatedAt: Date.now()
    });
  }
});

export const checkAlertThresholds = action({
  args: {
    healthCheckId: v.id("healthChecks")
  },
  handler: async (ctx, args) => {
    const healthCheck = await ctx.runQuery(api.monitoring.getHealthCheck, {
      id: args.healthCheckId
    });

    if (!healthCheck) return;

    const { consecutiveFailures, config } = healthCheck;
    const alertThreshold = config.alertThreshold || 3;
    const criticalThreshold = config.criticalThreshold || 5;

    let alertLevel: string | null = null;

    if (consecutiveFailures >= criticalThreshold) {
      alertLevel = "critical";
    } else if (consecutiveFailures >= alertThreshold) {
      alertLevel = "warning";
    }

    if (alertLevel) {
      // Check if alert already exists for this threshold
      const existingAlert = await ctx.runQuery(internal.monitoring.getActiveAlert, {
        healthCheckId: args.healthCheckId,
        level: alertLevel
      });

      if (!existingAlert) {
        await ctx.runMutation(internal.monitoring.createAlert, {
          healthCheckId: args.healthCheckId,
          level: alertLevel as any,
          message: `Health check "${healthCheck.name}" has failed ${consecutiveFailures} consecutive times`,
          metadata: {
            consecutiveFailures,
            lastError: await ctx.runQuery(internal.monitoring.getLastCheckError, {
              healthCheckId: args.healthCheckId
            })
          }
        });

        // Send alert notifications
        await ctx.runAction(internal.monitoring.sendAlertNotifications, {
          healthCheckId: args.healthCheckId,
          level: alertLevel,
          consecutiveFailures
        });
      }
    }
  }
});

export const createAlert = mutation({
  args: {
    healthCheckId: v.id("healthChecks"),
    level: v.union(
      v.literal("info"),
      v.literal("warning"),
      v.literal("error"),
      v.literal("critical")
    ),
    message: v.string(),
    metadata: v.optional(v.any()),
    resolvedAt: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("monitoringAlerts", {
      ...args,
      isActive: args.resolvedAt ? false : true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  }
});

export const getActiveAlert = query({
  args: {
    healthCheckId: v.id("healthChecks"),
    level: v.string()
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("monitoringAlerts")
      .filter(q => q.eq(q.field("healthCheckId"), args.healthCheckId))
      .filter(q => q.eq(q.field("level"), args.level))
      .filter(q => q.eq(q.field("isActive"), true))
      .first();
  }
});

export const getLastCheckError = query({
  args: {
    healthCheckId: v.id("healthChecks")
  },
  handler: async (ctx, args) => {
    const lastFailedCheck = await ctx.db
      .query("healthCheckResults")
      .filter(q => q.eq(q.field("healthCheckId"), args.healthCheckId))
      .filter(q => q.eq(q.field("success"), false))
      .order("desc")
      .first();

    return lastFailedCheck?.error;
  }
});

export const sendAlertNotifications = action({
  args: {
    healthCheckId: v.id("healthChecks"),
    level: v.string(),
    consecutiveFailures: v.number()
  },
  handler: async (ctx, args) => {
    const healthCheck = await ctx.runQuery(api.monitoring.getHealthCheck, {
      id: args.healthCheckId
    });

    if (!healthCheck) return;

    const integration = await ctx.runQuery(api.integrations.getIntegration, {
      id: healthCheck.integrationId
    });

    if (!integration) return;

    // Get notification preferences for the user
    const notificationPrefs = await ctx.runQuery(internal.monitoring.getNotificationPreferences, {
      userId: integration.userId
    });

    const alertMessage = `
🚨 Integration Alert - ${args.level.toUpperCase()}

Integration: ${integration.name}
Health Check: ${healthCheck.name}
Status: ${args.consecutiveFailures} consecutive failures
Time: ${new Date().toISOString()}

Please check your integration settings and resolve any issues.
    `.trim();

    // Send email notification if enabled
    if (notificationPrefs?.email?.enabled) {
      try {
        await ctx.runAction(api.campaigns.sendSingleEmail, {
          to: notificationPrefs.email.address,
          subject: `🚨 Integration Alert: ${integration.name}`,
          content: alertMessage,
          userId: integration.userId,
          trackOpens: false,
          trackClicks: false,
          metadata: {
            type: "monitoring_alert",
            healthCheckId: args.healthCheckId,
            level: args.level
          }
        });
      } catch (error) {
        console.error("Failed to send alert email:", error);
      }
    }

    // Send webhook notification if enabled
    if (notificationPrefs?.webhook?.enabled && notificationPrefs?.webhook?.url) {
      try {
        await fetch(notificationPrefs.webhook.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(notificationPrefs.webhook.headers || {})
          },
          body: JSON.stringify({
            type: "monitoring_alert",
            level: args.level,
            integration: {
              id: integration._id,
              name: integration.name,
              type: integration.type
            },
            healthCheck: {
              id: healthCheck._id,
              name: healthCheck.name,
              type: healthCheck.type
            },
            consecutiveFailures: args.consecutiveFailures,
            timestamp: Date.now(),
            message: alertMessage
          })
        });
      } catch (error) {
        console.error("Failed to send alert webhook:", error);
      }
    }

    return { sent: true };
  }
});

export const runAllHealthChecks = action({
  args: {},
  handler: async (ctx) => {
    // Get all active health checks that are due for a check
    const healthChecks = await ctx.runQuery(internal.monitoring.getHealthChecksDue, {
      before: Date.now()
    });

    const results = [];

    for (const healthCheck of healthChecks) {
      try {
        const result = await ctx.runAction(api.monitoring.runHealthCheck, {
          healthCheckId: healthCheck._id
        });
        results.push({
          healthCheckId: healthCheck._id,
          name: healthCheck.name,
          result
        });
      } catch (error) {
        results.push({
          healthCheckId: healthCheck._id,
          name: healthCheck.name,
          result: { success: false, error: error.message }
        });
      }
    }

    return { processed: results.length, results };
  }
});

export const getHealthChecksDue = query({
  args: {
    before: v.number()
  },
  handler: async (ctx, args) => {
    const healthChecks = await ctx.db
      .query("healthChecks")
      .filter(q => q.eq(q.field("isActive"), true))
      .collect();

    // Filter checks that are due
    return healthChecks.filter(check => {
      const intervalMs = check.config.interval * 60 * 1000;
      const nextCheckTime = check.lastCheck + intervalMs;
      return nextCheckTime <= args.before;
    });
  }
});

export const getHealthCheck = query({
  args: {
    id: v.id("healthChecks")
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  }
});

export const getHealthChecks = query({
  args: {
    userId: v.id("users"),
    integrationId: v.optional(v.id("integrations"))
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("healthChecks");

    if (args.integrationId) {
      const healthChecks = await query
        .filter(q => q.eq(q.field("integrationId"), args.integrationId))
        .collect();
      return healthChecks;
    }

    // Get all integrations for the user first
    const integrations = await ctx.db
      .query("integrations")
      .filter(q => q.eq(q.field("userId"), args.userId))
      .collect();

    const integrationIds = integrations.map(i => i._id);
    const allHealthChecks = [];

    for (const integrationId of integrationIds) {
      const healthChecks = await ctx.db
        .query("healthChecks")
        .filter(q => q.eq(q.field("integrationId"), integrationId))
        .collect();
      allHealthChecks.push(...healthChecks);
    }

    return allHealthChecks;
  }
});

export const getHealthCheckHistory = query({
  args: {
    healthCheckId: v.id("healthChecks"),
    limit: v.optional(v.number()),
    timeRange: v.optional(v.object({
      start: v.number(),
      end: v.number()
    }))
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    
    let query = ctx.db
      .query("healthCheckResults")
      .filter(q => q.eq(q.field("healthCheckId"), args.healthCheckId))
      .order("desc");

    if (args.timeRange) {
      query = query
        .filter(q => q.gte(q.field("timestamp"), args.timeRange!.start))
        .filter(q => q.lte(q.field("timestamp"), args.timeRange!.end));
    }

    return await query.take(limit);
  }
});

export const getMonitoringDashboard = query({
  args: {
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    // Get all health checks for user
    const healthChecks = await ctx.runQuery(api.monitoring.getHealthChecks, {
      userId: args.userId
    });

    // Get active alerts
    const alerts = await ctx.runQuery(internal.monitoring.getActiveAlerts, {
      userId: args.userId
    });

    // Calculate overall statistics
    const totalChecks = healthChecks.length;
    const healthyChecks = healthChecks.filter(hc => hc.status === "healthy").length;
    const unhealthyChecks = healthChecks.filter(hc => hc.status === "unhealthy").length;
    const pendingChecks = healthChecks.filter(hc => hc.status === "pending").length;

    // Calculate average uptime
    const totalUptime = healthChecks.reduce((sum, hc) => sum + hc.statistics.uptime, 0);
    const averageUptime = totalChecks > 0 ? totalUptime / totalChecks : 100;

    // Group alerts by level
    const alertsByLevel = {
      critical: alerts.filter(a => a.level === "critical").length,
      error: alerts.filter(a => a.level === "error").length,
      warning: alerts.filter(a => a.level === "warning").length,
      info: alerts.filter(a => a.level === "info").length
    };

    return {
      overview: {
        totalChecks,
        healthyChecks,
        unhealthyChecks,
        pendingChecks,
        averageUptime: Math.round(averageUptime * 100) / 100
      },
      alerts: {
        total: alerts.length,
        byLevel: alertsByLevel,
        recent: alerts.slice(0, 5) // Last 5 alerts
      },
      healthChecks: healthChecks.map(hc => ({
        id: hc._id,
        name: hc.name,
        type: hc.type,
        status: hc.status,
        uptime: hc.statistics.uptime,
        lastCheck: hc.lastCheck,
        consecutiveFailures: hc.consecutiveFailures
      }))
    };
  }
});

export const getActiveAlerts = query({
  args: {
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    // Get all integrations for the user
    const integrations = await ctx.db
      .query("integrations")
      .filter(q => q.eq(q.field("userId"), args.userId))
      .collect();

    const integrationIds = integrations.map(i => i._id);
    const allAlerts = [];

    for (const integrationId of integrationIds) {
      const healthChecks = await ctx.db
        .query("healthChecks")
        .filter(q => q.eq(q.field("integrationId"), integrationId))
        .collect();

      for (const healthCheck of healthChecks) {
        const alerts = await ctx.db
          .query("monitoringAlerts")
          .filter(q => q.eq(q.field("healthCheckId"), healthCheck._id))
          .filter(q => q.eq(q.field("isActive"), true))
          .collect();
        
        allAlerts.push(...alerts);
      }
    }

    return allAlerts.sort((a, b) => b.createdAt - a.createdAt);
  }
});

export const resolveAlert = mutation({
  args: {
    alertId: v.id("monitoringAlerts"),
    resolution: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.alertId, {
      isActive: false,
      resolvedAt: Date.now(),
      resolution: args.resolution,
      updatedAt: Date.now()
    });
  }
});

export const getNotificationPreferences = query({
  args: {
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    const prefs = await ctx.db
      .query("notificationPreferences")
      .filter(q => q.eq(q.field("userId"), args.userId))
      .first();

    // Return default preferences if none exist
    return prefs || {
      email: {
        enabled: true,
        address: null // Will be filled from user profile
      },
      webhook: {
        enabled: false,
        url: null,
        headers: {}
      },
      levels: ["critical", "error", "warning"]
    };
  }
});

export const updateNotificationPreferences = mutation({
  args: {
    userId: v.id("users"),
    preferences: v.object({
      email: v.object({
        enabled: v.boolean(),
        address: v.optional(v.string())
      }),
      webhook: v.object({
        enabled: v.boolean(),
        url: v.optional(v.string()),
        headers: v.optional(v.record(v.string(), v.string()))
      }),
      levels: v.array(v.string())
    })
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("notificationPreferences")
      .filter(q => q.eq(q.field("userId"), args.userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args.preferences,
        updatedAt: Date.now()
      });
      return existing._id;
    } else {
      return await ctx.db.insert("notificationPreferences", {
        userId: args.userId,
        ...args.preferences,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    }
  }
});

// Helper function to perform different types of health checks
async function performHealthCheck(healthCheck: any, integration: any): Promise<any> {
  const { type, config } = healthCheck;
  const startTime = Date.now();

  switch (type) {
    case "connectivity":
      return await performConnectivityCheck(config, integration, startTime);
    case "authentication":
      return await performAuthenticationCheck(config, integration, startTime);
    case "api_response":
      return await performApiResponseCheck(config, integration, startTime);
    case "webhook_delivery":
      return await performWebhookDeliveryCheck(config, integration, startTime);
    default:
      throw new Error(`Unsupported health check type: ${type}`);
  }
}

async function performConnectivityCheck(config: any, integration: any, startTime: number): Promise<any> {
  const endpoint = config.endpoint || getDefaultEndpoint(integration);
  const timeout = config.timeout || 30000;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(endpoint, {
      method: config.method || "GET",
      signal: controller.signal,
      headers: {
        "User-Agent": "SmartBatch-Monitor/1.0"
      }
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    return {
      success: response.ok,
      responseTime,
      details: {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      },
      error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      success: false,
      responseTime,
      error: error.message,
      details: { type: error.name }
    };
  }
}

async function performAuthenticationCheck(config: any, integration: any, startTime: number): Promise<any> {
  // This would test authentication by making an authenticated request
  const endpoint = config.endpoint || getAuthTestEndpoint(integration);
  
  try {
    const authHeaders = getAuthHeaders(integration);
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        ...authHeaders,
        "User-Agent": "SmartBatch-Monitor/1.0"
      }
    });

    const responseTime = Date.now() - startTime;

    return {
      success: response.status !== 401 && response.status !== 403,
      responseTime,
      details: {
        status: response.status,
        authenticated: response.status !== 401 && response.status !== 403
      },
      error: (response.status === 401 || response.status === 403) 
        ? "Authentication failed" 
        : undefined
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      success: false,
      responseTime,
      error: error.message
    };
  }
}

async function performApiResponseCheck(config: any, integration: any, startTime: number): Promise<any> {
  const endpoint = config.endpoint;
  const expectedResponse = config.expectedResponse;

  try {
    const response = await fetch(endpoint, {
      method: config.method || "GET",
      headers: getAuthHeaders(integration)
    });

    const responseTime = Date.now() - startTime;
    const responseData = await response.json();

    let success = response.ok;
    
    // Check expected response if provided
    if (expectedResponse && success) {
      success = JSON.stringify(responseData).includes(JSON.stringify(expectedResponse));
    }

    return {
      success,
      responseTime,
      details: {
        status: response.status,
        responseMatched: expectedResponse ? success : undefined,
        responseSize: JSON.stringify(responseData).length
      },
      error: success ? undefined : "Response validation failed"
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      success: false,
      responseTime,
      error: error.message
    };
  }
}

async function performWebhookDeliveryCheck(config: any, integration: any, startTime: number): Promise<any> {
  // This would test webhook delivery by sending a test webhook
  const testPayload = {
    type: "health_check",
    timestamp: Date.now(),
    test: true
  };

  try {
    const webhookUrl = integration.settings?.webhookUrl || config.endpoint;
    
    if (!webhookUrl) {
      throw new Error("No webhook URL configured");
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "SmartBatch-Monitor/1.0"
      },
      body: JSON.stringify(testPayload)
    });

    const responseTime = Date.now() - startTime;

    return {
      success: response.ok,
      responseTime,
      details: {
        status: response.status,
        webhookUrl
      },
      error: response.ok ? undefined : `Webhook delivery failed: ${response.status}`
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      success: false,
      responseTime,
      error: error.message
    };
  }
}

function getDefaultEndpoint(integration: any): string {
  const endpoints = {
    google_sheets: "https://sheets.googleapis.com/v4/spreadsheets",
    salesforce: "https://login.salesforce.com/services/data",
    hubspot: "https://api.hubapi.com/crm/v3/objects/contacts",
    zapier: "https://hooks.zapier.com",
    webhook: integration.settings?.url || "http://example.com"
  };

  return endpoints[integration.type as keyof typeof endpoints] || "http://example.com";
}

function getAuthTestEndpoint(integration: any): string {
  const endpoints = {
    google_sheets: "https://www.googleapis.com/oauth2/v1/userinfo",
    salesforce: "https://login.salesforce.com/services/oauth2/userinfo",
    hubspot: "https://api.hubapi.com/oauth/v1/access-tokens/",
    zapier: "https://zapier.com/api/v1/me",
    webhook: integration.settings?.url || "http://example.com"
  };

  return endpoints[integration.type as keyof typeof endpoints] || "http://example.com";
}

function getAuthHeaders(integration: any): Record<string, string> {
  const credentials = integration.credentials || {};
  
  switch (integration.type) {
    case "google_sheets":
    case "salesforce":
    case "hubspot":
      return credentials.accessToken 
        ? { "Authorization": `Bearer ${credentials.accessToken}` }
        : {};
    case "webhook":
      return credentials.headers || {};
    default:
      return {};
  }
}
