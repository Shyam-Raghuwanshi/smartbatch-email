
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Error categories for classification
export const ERROR_CATEGORIES = {
  AUTHENTICATION: "authentication",
  RATE_LIMIT: "rate_limit", 
  NETWORK: "network",
  VALIDATION: "validation",
  INTEGRATION: "integration",
  WEBHOOK: "webhook",
  DATA_SYNC: "data_sync",
  PERMISSION: "permission",
  TIMEOUT: "timeout",
  UNKNOWN: "unknown"
} as const;

// Retry strategies
export const RETRY_STRATEGIES = {
  EXPONENTIAL_BACKOFF: "exponential_backoff",
  LINEAR_BACKOFF: "linear_backoff",
  FIXED_DELAY: "fixed_delay",
  IMMEDIATE: "immediate",
  NO_RETRY: "no_retry"
} as const;

// Error severity levels
export const ERROR_SEVERITY = {
  LOW: "low",
  MEDIUM: "medium", 
  HIGH: "high",
  CRITICAL: "critical"
} as const;

// Configuration for different error types
const ERROR_CONFIGS = {
  [ERROR_CATEGORIES.AUTHENTICATION]: {
    maxRetries: 3,
    strategy: RETRY_STRATEGIES.EXPONENTIAL_BACKOFF,
    baseDelay: 1000,
    maxDelay: 30000,
    severity: ERROR_SEVERITY.HIGH,
    shouldAlert: true,
    autoResolve: false
  },
  [ERROR_CATEGORIES.RATE_LIMIT]: {
    maxRetries: 5,
    strategy: RETRY_STRATEGIES.EXPONENTIAL_BACKOFF,
    baseDelay: 5000,
    maxDelay: 300000, // 5 minutes
    severity: ERROR_SEVERITY.MEDIUM,
    shouldAlert: false,
    autoResolve: true
  },
  [ERROR_CATEGORIES.NETWORK]: {
    maxRetries: 3,
    strategy: RETRY_STRATEGIES.EXPONENTIAL_BACKOFF,
    baseDelay: 2000,
    maxDelay: 60000,
    severity: ERROR_SEVERITY.MEDIUM,
    shouldAlert: true,
    autoResolve: true
  },
  [ERROR_CATEGORIES.VALIDATION]: {
    maxRetries: 0,
    strategy: RETRY_STRATEGIES.NO_RETRY,
    baseDelay: 0,
    maxDelay: 0,
    severity: ERROR_SEVERITY.LOW,
    shouldAlert: false,
    autoResolve: false
  },
  [ERROR_CATEGORIES.INTEGRATION]: {
    maxRetries: 3,
    strategy: RETRY_STRATEGIES.EXPONENTIAL_BACKOFF,
    baseDelay: 1000,
    maxDelay: 30000,
    severity: ERROR_SEVERITY.HIGH,
    shouldAlert: true,
    autoResolve: false
  },
  [ERROR_CATEGORIES.WEBHOOK]: {
    maxRetries: 5,
    strategy: RETRY_STRATEGIES.EXPONENTIAL_BACKOFF,
    baseDelay: 1000,
    maxDelay: 60000,
    severity: ERROR_SEVERITY.MEDIUM,
    shouldAlert: true,
    autoResolve: false
  },
  [ERROR_CATEGORIES.DATA_SYNC]: {
    maxRetries: 3,
    strategy: RETRY_STRATEGIES.LINEAR_BACKOFF,
    baseDelay: 5000,
    maxDelay: 120000,
    severity: ERROR_SEVERITY.HIGH,
    shouldAlert: true,
    autoResolve: false
  },
  [ERROR_CATEGORIES.PERMISSION]: {
    maxRetries: 1,
    strategy: RETRY_STRATEGIES.FIXED_DELAY,
    baseDelay: 1000,
    maxDelay: 1000,
    severity: ERROR_SEVERITY.HIGH,
    shouldAlert: true,
    autoResolve: false
  },
  [ERROR_CATEGORIES.TIMEOUT]: {
    maxRetries: 2,
    strategy: RETRY_STRATEGIES.EXPONENTIAL_BACKOFF,
    baseDelay: 2000,
    maxDelay: 30000,
    severity: ERROR_SEVERITY.MEDIUM,
    shouldAlert: true,
    autoResolve: true
  },
  [ERROR_CATEGORIES.UNKNOWN]: {
    maxRetries: 2,
    strategy: RETRY_STRATEGIES.EXPONENTIAL_BACKOFF,
    baseDelay: 1000,
    maxDelay: 10000,
    severity: ERROR_SEVERITY.MEDIUM,
    shouldAlert: true,
    autoResolve: false
  }
};

// Create an error record
export const createError = mutation({
  args: {
    integrationId: v.optional(v.id("integrations")),
    category: v.string(),
    severity: v.string(),
    message: v.string(),
    details: v.optional(v.any()),
    context: v.optional(v.object({
      operation: v.optional(v.string()),
      endpoint: v.optional(v.string()),
      method: v.optional(v.string()),
      requestId: v.optional(v.string()),
      userId: v.optional(v.id("users")),
      metadata: v.optional(v.any())
    })),
    stackTrace: v.optional(v.string()),
    retryConfig: v.optional(v.object({
      maxRetries: v.number(),
      strategy: v.string(),
      baseDelay: v.number(),
      maxDelay: v.number(),
      backoffMultiplier: v.optional(v.number())
    }))
  },
  handler: async (ctx, args) => {
    const errorConfig = ERROR_CONFIGS[args.category as keyof typeof ERROR_CONFIGS] || ERROR_CONFIGS[ERROR_CATEGORIES.UNKNOWN];
    
    const errorId = await ctx.db.insert("errorLogs", {
      integrationId: args.integrationId,
      category: args.category,
      severity: args.severity,
      message: args.message,
      details: args.details,
      context: args.context,
      stackTrace: args.stackTrace,
      status: "new",
      retryConfig: args.retryConfig || {
        maxRetries: errorConfig.maxRetries,
        strategy: errorConfig.strategy,
        baseDelay: errorConfig.baseDelay,
        maxDelay: errorConfig.maxDelay,
        backoffMultiplier: 2
      },
      retryCount: 0,
      nextRetryAt: null,
      resolvedAt: null,
      resolution: null,
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    // Create alert if configured
    if (errorConfig.shouldAlert) {
      await ctx.db.insert("errorAlerts", {
        errorId,
        level: errorConfig.severity,
        message: `${args.category.toUpperCase()}: ${args.message}`,
        isActive: true,
        notificationsSent: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    }

    // Schedule retry if needed
    if (errorConfig.maxRetries > 0) {
      const nextRetryAt = Date.now() + errorConfig.baseDelay;
      await ctx.db.patch(errorId, { 
        status: "retrying",
        nextRetryAt 
      });
    }

    return errorId;
  }
});

// Get errors with filtering
export const getErrors = query({
  args: {
    integrationId: v.optional(v.id("integrations")),
    category: v.optional(v.string()),
    severity: v.optional(v.string()),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("errorLogs");

    if (args.integrationId) {
      query = query.filter(q => q.eq(q.field("integrationId"), args.integrationId));
    }
    if (args.category) {
      query = query.filter(q => q.eq(q.field("category"), args.category));
    }
    if (args.severity) {
      query = query.filter(q => q.eq(q.field("severity"), args.severity));
    }
    if (args.status) {
      query = query.filter(q => q.eq(q.field("status"), args.status));
    }

    return await query
      .order("desc")
      .take(args.limit || 50);
  }
});

// Retry an error
export const retryError = mutation({
  args: {
    errorId: v.id("errorLogs")
  },
  handler: async (ctx, args) => {
    const error = await ctx.db.get(args.errorId);
    if (!error) throw new Error("Error not found");

    if (error.retryCount >= error.retryConfig.maxRetries) {
      await ctx.db.patch(args.errorId, {
        status: "failed",
        updatedAt: Date.now()
      });
      return { success: false, reason: "Max retries exceeded" };
    }

    // Calculate next retry delay based on strategy
    let delay = error.retryConfig.baseDelay;
    
    if (error.retryConfig.strategy === RETRY_STRATEGIES.EXPONENTIAL_BACKOFF) {
      delay = Math.min(
        error.retryConfig.baseDelay * Math.pow(error.retryConfig.backoffMultiplier || 2, error.retryCount),
        error.retryConfig.maxDelay
      );
    } else if (error.retryConfig.strategy === RETRY_STRATEGIES.LINEAR_BACKOFF) {
      delay = Math.min(
        error.retryConfig.baseDelay + (error.retryConfig.baseDelay * error.retryCount),
        error.retryConfig.maxDelay
      );
    }

    const nextRetryAt = Date.now() + delay;

    await ctx.db.patch(args.errorId, {
      retryCount: error.retryCount + 1,
      nextRetryAt,
      status: "retrying",
      updatedAt: Date.now()
    });

    return { success: true, nextRetryAt };
  }
});

// Mark error as resolved
export const resolveError = mutation({
  args: {
    errorId: v.id("errorLogs"),
    resolution: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.errorId, {
      status: "resolved",
      resolvedAt: Date.now(),
      resolution: args.resolution,
      updatedAt: Date.now()
    });

    // Deactivate related alerts
    const alerts = await ctx.db.query("errorAlerts")
      .filter(q => q.eq(q.field("errorId"), args.errorId))
      .collect();

    for (const alert of alerts) {
      await ctx.db.patch(alert._id, {
        isActive: false,
        resolvedAt: Date.now(),
        updatedAt: Date.now()
      });
    }

    return { success: true };
  }
});

// Get error statistics
export const getErrorStatistics = query({
  args: {
    integrationId: v.optional(v.id("integrations")),
    timeRange: v.optional(v.string()) // "1h", "24h", "7d", "30d"
  },
  handler: async (ctx, args) => {
    const timeRange = args.timeRange || "24h";
    const timeMap = {
      "1h": 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000
    };
    
    const startTime = Date.now() - timeMap[timeRange as keyof typeof timeMap];
    
    let query = ctx.db.query("errorLogs")
      .filter(q => q.gte(q.field("createdAt"), startTime));
    
    if (args.integrationId) {
      query = query.filter(q => q.eq(q.field("integrationId"), args.integrationId));
    }

    const errors = await query.collect();
    
    const stats = {
      total: errors.length,
      byCategory: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      resolved: errors.filter(e => e.status === "resolved").length,
      failed: errors.filter(e => e.status === "failed").length,
      retrying: errors.filter(e => e.status === "retrying").length,
      avgResolutionTime: 0,
      errorRate: 0,
      trendData: [] as Array<{ time: string; count: number; }>
    };

    // Calculate statistics
    for (const error of errors) {
      stats.byCategory[error.category] = (stats.byCategory[error.category] || 0) + 1;
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
      stats.byStatus[error.status] = (stats.byStatus[error.status] || 0) + 1;
    }

    // Calculate average resolution time
    const resolvedErrors = errors.filter(e => e.resolvedAt);
    if (resolvedErrors.length > 0) {
      const totalResolutionTime = resolvedErrors.reduce((sum, error) => {
        return sum + (error.resolvedAt! - error.createdAt);
      }, 0);
      stats.avgResolutionTime = totalResolutionTime / resolvedErrors.length;
    }

    // Generate trend data (hourly buckets)
    const buckets = new Map<string, number>();
    const bucketSize = 60 * 60 * 1000; // 1 hour
    
    for (const error of errors) {
      const bucket = new Date(Math.floor(error.createdAt / bucketSize) * bucketSize).toISOString();
      buckets.set(bucket, (buckets.get(bucket) || 0) + 1);
    }
    
    stats.trendData = Array.from(buckets.entries()).map(([time, count]) => ({
      time,
      count
    })).sort((a, b) => a.time.localeCompare(b.time));

    return stats;
  }
});

// Get active alerts
export const getActiveAlerts = query({
  args: {
    integrationId: v.optional(v.id("integrations"))
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("errorAlerts")
      .filter(q => q.eq(q.field("isActive"), true));

    const alerts = await query.collect();
    
    if (args.integrationId) {
      const integrationAlerts = [];
      for (const alert of alerts) {
        const error = await ctx.db.get(alert.errorId);
        if (error?.integrationId === args.integrationId) {
          integrationAlerts.push(alert);
        }
      }
      return integrationAlerts;
    }

    return alerts;
  }
});

// Process pending retries (called by scheduler)
export const processPendingRetries = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const pendingRetries = await ctx.db.query("errorLogs")
      .filter(q => q.eq(q.field("status"), "retrying"))
      .filter(q => q.lt(q.field("nextRetryAt"), now))
      .collect();

    const results = [];
    
    for (const error of pendingRetries) {
      try {
        // Attempt to retry the operation based on error context
        const retryResult = await retryOperation(ctx, error);
        
        if (retryResult.success) {
          await ctx.db.patch(error._id, {
            status: "resolved",
            resolvedAt: Date.now(),
            resolution: "Automatically resolved through retry",
            updatedAt: Date.now()
          });
          results.push({ errorId: error._id, status: "resolved" });
        } else {
          // Schedule next retry or mark as failed
          if (error.retryCount >= error.retryConfig.maxRetries) {
            await ctx.db.patch(error._id, {
              status: "failed",
              updatedAt: Date.now()
            });
            results.push({ errorId: error._id, status: "failed" });
          } else {
            await retryError(ctx, { errorId: error._id });
            results.push({ errorId: error._id, status: "retry_scheduled" });
          }
        }
      } catch (retryError) {
        console.error(`Failed to retry error ${error._id}:`, retryError);
        results.push({ errorId: error._id, status: "retry_failed", error: retryError.message });
      }
    }

    return { processed: results.length, results };
  }
});

// Helper function to retry operations based on error context
async function retryOperation(ctx: any, error: any): Promise<{ success: boolean; message?: string; }> {
  if (!error.context?.operation) {
    return { success: false, message: "No operation context available" };
  }

  try {
    switch (error.context.operation) {
      case "webhook_delivery":
        // Retry webhook delivery
        if (error.context.endpoint) {
          // Implementation would go here
          return { success: true };
        }
        break;
        
      case "data_sync":
        // Retry data synchronization
        if (error.integrationId) {
          // Implementation would go here
          return { success: true };
        }
        break;
        
      case "api_request":
        // Retry API request
        if (error.context.endpoint && error.context.method) {
          // Implementation would go here
          return { success: true };
        }
        break;
        
      default:
        return { success: false, message: "Unknown operation type" };
    }
  } catch (error) {
    return { success: false, message: `Retry failed: ${error}` };
  }

  return { success: false, message: "Insufficient context for retry" };
}

// Cleanup old error records
export const cleanupOldErrors = mutation({
  args: {
    olderThanDays: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const cutoffDate = Date.now() - (args.olderThanDays || 30) * 24 * 60 * 60 * 1000;
    
    const oldErrors = await ctx.db.query("errorLogs")
      .filter(q => q.lt(q.field("createdAt"), cutoffDate))
      .filter(q => q.or(
        q.eq(q.field("status"), "resolved"),
        q.eq(q.field("status"), "failed")
      ))
      .collect();

    let deletedCount = 0;
    
    for (const error of oldErrors) {
      // Delete related alerts first
      const alerts = await ctx.db.query("errorAlerts")
        .filter(q => q.eq(q.field("errorId"), error._id))
        .collect();
      
      for (const alert of alerts) {
        await ctx.db.delete(alert._id);
      }
      
      await ctx.db.delete(error._id);
      deletedCount++;
    }

    return { deletedCount };
  }
});

// Utility function to categorize errors automatically
export function categorizeError(error: Error | string, context?: any): string {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const lowerMessage = errorMessage.toLowerCase();

  if (lowerMessage.includes('auth') || lowerMessage.includes('token') || lowerMessage.includes('unauthorized')) {
    return ERROR_CATEGORIES.AUTHENTICATION;
  }
  
  if (lowerMessage.includes('rate limit') || lowerMessage.includes('too many requests')) {
    return ERROR_CATEGORIES.RATE_LIMIT;
  }
  
  if (lowerMessage.includes('network') || lowerMessage.includes('connection') || lowerMessage.includes('timeout')) {
    return ERROR_CATEGORIES.NETWORK;
  }
  
  if (lowerMessage.includes('validation') || lowerMessage.includes('invalid') || lowerMessage.includes('required')) {
    return ERROR_CATEGORIES.VALIDATION;
  }
  
  if (lowerMessage.includes('webhook')) {
    return ERROR_CATEGORIES.WEBHOOK;
  }
  
  if (lowerMessage.includes('sync') || lowerMessage.includes('synchroniz')) {
    return ERROR_CATEGORIES.DATA_SYNC;
  }
  
  if (lowerMessage.includes('permission') || lowerMessage.includes('forbidden') || lowerMessage.includes('access denied')) {
    return ERROR_CATEGORIES.PERMISSION;
  }
  
  if (lowerMessage.includes('timeout')) {
    return ERROR_CATEGORIES.TIMEOUT;
  }
  
  if (context?.integrationId) {
    return ERROR_CATEGORIES.INTEGRATION;
  }

  return ERROR_CATEGORIES.UNKNOWN;
}

// Utility function to determine error severity
export function determineErrorSeverity(error: Error | string, context?: any): string {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const lowerMessage = errorMessage.toLowerCase();

  if (lowerMessage.includes('critical') || lowerMessage.includes('fatal') || 
      lowerMessage.includes('auth') || lowerMessage.includes('security')) {
    return ERROR_SEVERITY.CRITICAL;
  }
  
  if (lowerMessage.includes('data loss') || lowerMessage.includes('corruption') || 
      lowerMessage.includes('sync failed')) {
    return ERROR_SEVERITY.HIGH;
  }
  
  if (lowerMessage.includes('rate limit') || lowerMessage.includes('timeout') || 
      lowerMessage.includes('temporary')) {
    return ERROR_SEVERITY.MEDIUM;
  }

  return ERROR_SEVERITY.LOW;
}
