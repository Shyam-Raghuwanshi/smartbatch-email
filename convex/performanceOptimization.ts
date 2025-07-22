
import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

// Performance monitoring categories
export const PERFORMANCE_CATEGORIES = {
  API_RESPONSE_TIME: "api_response_time",
  DATA_SYNC_DURATION: "data_sync_duration", 
  WEBHOOK_LATENCY: "webhook_latency",
  RATE_LIMIT_EFFICIENCY: "rate_limit_efficiency",
  ERROR_RATE: "error_rate",
  THROUGHPUT: "throughput",
  MEMORY_USAGE: "memory_usage",
  CONNECTION_POOL: "connection_pool"
} as const;

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  [PERFORMANCE_CATEGORIES.API_RESPONSE_TIME]: {
    good: 200,
    warning: 1000,
    critical: 5000
  },
  [PERFORMANCE_CATEGORIES.DATA_SYNC_DURATION]: {
    good: 5000,
    warning: 30000,
    critical: 120000
  },
  [PERFORMANCE_CATEGORIES.WEBHOOK_LATENCY]: {
    good: 500,
    warning: 2000,
    critical: 10000
  },
  [PERFORMANCE_CATEGORIES.RATE_LIMIT_EFFICIENCY]: {
    good: 80,
    warning: 60,
    critical: 40
  },
  [PERFORMANCE_CATEGORIES.ERROR_RATE]: {
    good: 1,
    warning: 5,
    critical: 10
  },
  [PERFORMANCE_CATEGORIES.THROUGHPUT]: {
    good: 100,
    warning: 50,
    critical: 25
  }
};

// Record performance metric
export const recordPerformanceMetric = mutation({
  args: {
    integrationId: v.optional(v.id("integrations")),
    category: v.string(),
    operation: v.string(),
    value: v.number(),
    unit: v.string(),
    metadata: v.optional(v.any()),
    tags: v.optional(v.array(v.string()))
  },
  handler: async (ctx, args) => {
    const thresholds = PERFORMANCE_THRESHOLDS[args.category as keyof typeof PERFORMANCE_THRESHOLDS];
    
    let status = "good";
    if (thresholds) {
      if (args.value >= thresholds.critical) {
        status = "critical";
      } else if (args.value >= thresholds.warning) {
        status = "warning";
      }
    }

    return await ctx.db.insert("performanceMetrics", {
      integrationId: args.integrationId,
      category: args.category,
      operation: args.operation,
      value: args.value,
      unit: args.unit,
      status,
      metadata: args.metadata,
      tags: args.tags || [],
      timestamp: Date.now()
    });
  }
});

// Get performance metrics with aggregation
export const getPerformanceMetrics = query({
  args: {
    integrationId: v.optional(v.id("integrations")),
    category: v.optional(v.string()),
    operation: v.optional(v.string()),
    timeRange: v.optional(v.string()),
    aggregation: v.optional(v.string()) // "avg", "sum", "max", "min", "count"
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
    
    let query = ctx.db.query("performanceMetrics")
      .filter(q => q.gte(q.field("timestamp"), startTime));
    
    if (args.integrationId) {
      query = query.filter(q => q.eq(q.field("integrationId"), args.integrationId));
    }
    if (args.category) {
      query = query.filter(q => q.eq(q.field("category"), args.category));
    }
    if (args.operation) {
      query = query.filter(q => q.eq(q.field("operation"), args.operation));
    }

    const metrics = await query.collect();
    
    if (!args.aggregation || args.aggregation === "raw") {
      return metrics;
    }

    // Group by time buckets for trend analysis
    const bucketSize = Math.floor(timeMap[timeRange as keyof typeof timeMap] / 24); // 24 data points
    const buckets = new Map<string, number[]>();
    
    for (const metric of metrics) {
      const bucket = new Date(Math.floor(metric.timestamp / bucketSize) * bucketSize).toISOString();
      if (!buckets.has(bucket)) {
        buckets.set(bucket, []);
      }
      buckets.get(bucket)!.push(metric.value);
    }
    
    const aggregatedData = Array.from(buckets.entries()).map(([time, values]) => {
      let aggregatedValue = 0;
      
      switch (args.aggregation) {
        case "avg":
          aggregatedValue = values.reduce((sum, val) => sum + val, 0) / values.length;
          break;
        case "sum":
          aggregatedValue = values.reduce((sum, val) => sum + val, 0);
          break;
        case "max":
          aggregatedValue = Math.max(...values);
          break;
        case "min":
          aggregatedValue = Math.min(...values);
          break;
        case "count":
          aggregatedValue = values.length;
          break;
        default:
          aggregatedValue = values.reduce((sum, val) => sum + val, 0) / values.length;
      }
      
      return {
        time,
        value: Math.round(aggregatedValue * 100) / 100,
        count: values.length
      };
    }).sort((a, b) => a.time.localeCompare(b.time));

    return aggregatedData;
  }
});

// Generate performance insights and recommendations
export const generatePerformanceInsights = action({
  args: {
    integrationId: v.optional(v.id("integrations")),
    timeRange: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const metrics = await ctx.runQuery(internal.performanceOptimization.getPerformanceMetrics, {
      integrationId: args.integrationId,
      timeRange: args.timeRange || "24h",
      aggregation: "avg"
    });

    const insights = [];
    const recommendations = [];

    // Analyze API response times
    const apiMetrics = await ctx.runQuery(internal.performanceOptimization.getPerformanceMetrics, {
      integrationId: args.integrationId,
      category: PERFORMANCE_CATEGORIES.API_RESPONSE_TIME,
      timeRange: args.timeRange || "24h"
    });

    if (apiMetrics.length > 0) {
      const avgResponseTime = apiMetrics.reduce((sum: number, m: any) => sum + m.value, 0) / apiMetrics.length;
      const thresholds = PERFORMANCE_THRESHOLDS[PERFORMANCE_CATEGORIES.API_RESPONSE_TIME];
      
      if (avgResponseTime > thresholds.critical) {
        insights.push({
          type: "critical",
          category: "api_performance",
          title: "Critical API Performance Issue",
          description: `Average API response time (${Math.round(avgResponseTime)}ms) exceeds critical threshold`,
          impact: "high",
          affectedOperations: [...new Set(apiMetrics.map((m: any) => m.operation))]
        });
        
        recommendations.push({
          priority: "high",
          category: "api_optimization",
          title: "Optimize API Response Times",
          description: "Consider implementing caching, optimizing database queries, or scaling infrastructure",
          actions: [
            "Enable response caching for frequently accessed data",
            "Review and optimize database queries",
            "Consider implementing connection pooling",
            "Scale up infrastructure if needed"
          ],
          estimatedImpact: "30-50% response time improvement"
        });
      } else if (avgResponseTime > thresholds.warning) {
        insights.push({
          type: "warning",
          category: "api_performance",
          title: "API Performance Degradation",
          description: `Average API response time (${Math.round(avgResponseTime)}ms) is above optimal range`,
          impact: "medium",
          affectedOperations: [...new Set(apiMetrics.map((m: any) => m.operation))]
        });
        
        recommendations.push({
          priority: "medium",
          category: "api_optimization",
          title: "Improve API Response Times",
          description: "Minor optimizations can improve user experience",
          actions: [
            "Review slow endpoints and optimize",
            "Implement selective field loading",
            "Consider edge caching for static data"
          ],
          estimatedImpact: "15-25% response time improvement"
        });
      }
    }

    // Analyze error rates
    const errorMetrics = await ctx.runQuery(internal.performanceOptimization.getPerformanceMetrics, {
      integrationId: args.integrationId,
      category: PERFORMANCE_CATEGORIES.ERROR_RATE,
      timeRange: args.timeRange || "24h"
    });

    if (errorMetrics.length > 0) {
      const avgErrorRate = errorMetrics.reduce((sum: number, m: any) => sum + m.value, 0) / errorMetrics.length;
      const thresholds = PERFORMANCE_THRESHOLDS[PERFORMANCE_CATEGORIES.ERROR_RATE];
      
      if (avgErrorRate > thresholds.critical) {
        insights.push({
          type: "critical",
          category: "reliability",
          title: "High Error Rate Detected",
          description: `Error rate (${avgErrorRate.toFixed(2)}%) is critically high`,
          impact: "high",
          affectedOperations: [...new Set(errorMetrics.map((m: any) => m.operation))]
        });
        
        recommendations.push({
          priority: "high",
          category: "reliability",
          title: "Reduce Error Rate",
          description: "Immediate action needed to improve system reliability",
          actions: [
            "Investigate root causes of failures",
            "Implement better error handling and retries",
            "Review integration configurations",
            "Monitor third-party service status"
          ],
          estimatedImpact: "Significant reliability improvement"
        });
      }
    }

    // Analyze data sync performance
    const syncMetrics = await ctx.runQuery(internal.performanceOptimization.getPerformanceMetrics, {
      integrationId: args.integrationId,
      category: PERFORMANCE_CATEGORIES.DATA_SYNC_DURATION,
      timeRange: args.timeRange || "24h"
    });

    if (syncMetrics.length > 0) {
      const avgSyncDuration = syncMetrics.reduce((sum: number, m: any) => sum + m.value, 0) / syncMetrics.length;
      const thresholds = PERFORMANCE_THRESHOLDS[PERFORMANCE_CATEGORIES.DATA_SYNC_DURATION];
      
      if (avgSyncDuration > thresholds.warning) {
        recommendations.push({
          priority: "medium",
          category: "sync_optimization",
          title: "Optimize Data Sync Performance",
          description: "Data synchronization is taking longer than optimal",
          actions: [
            "Implement incremental sync instead of full sync",
            "Add parallel processing for large datasets",
            "Optimize data transformation logic",
            "Consider sync scheduling during off-peak hours"
          ],
          estimatedImpact: "40-60% sync time reduction"
        });
      }
    }

    return {
      insights: insights.sort((a, b) => {
        const priorityOrder = { critical: 3, warning: 2, info: 1 };
        return priorityOrder[b.type as keyof typeof priorityOrder] - priorityOrder[a.type as keyof typeof priorityOrder];
      }),
      recommendations: recommendations.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder];
      }),
      summary: {
        totalInsights: insights.length,
        criticalIssues: insights.filter(i => i.type === "critical").length,
        warnings: insights.filter(i => i.type === "warning").length,
        totalRecommendations: recommendations.length,
        highPriorityRecommendations: recommendations.filter(r => r.priority === "high").length
      }
    };
  }
});

// Create performance optimization plan
export const createOptimizationPlan = mutation({
  args: {
    integrationId: v.optional(v.id("integrations")),
    name: v.string(),
    description: v.optional(v.string()),
    recommendations: v.array(v.any()),
    targetMetrics: v.object({
      responseTime: v.optional(v.number()),
      errorRate: v.optional(v.number()),
      throughput: v.optional(v.number()),
      syncDuration: v.optional(v.number())
    }),
    timeline: v.optional(v.string()),
    assignedTo: v.optional(v.id("users"))
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("optimizationPlans", {
      integrationId: args.integrationId,
      name: args.name,
      description: args.description,
      recommendations: args.recommendations,
      targetMetrics: args.targetMetrics,
      timeline: args.timeline,
      assignedTo: args.assignedTo,
      status: "draft",
      progress: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  }
});

// Get optimization plans
export const getOptimizationPlans = query({
  args: {
    integrationId: v.optional(v.id("integrations")),
    status: v.optional(v.string()),
    assignedTo: v.optional(v.id("users"))
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("optimizationPlans");

    if (args.integrationId) {
      query = query.filter(q => q.eq(q.field("integrationId"), args.integrationId));
    }
    if (args.status) {
      query = query.filter(q => q.eq(q.field("status"), args.status));
    }
    if (args.assignedTo) {
      query = query.filter(q => q.eq(q.field("assignedTo"), args.assignedTo));
    }

    return await query.order("desc").collect();
  }
});

// Update optimization plan progress
export const updateOptimizationProgress = mutation({
  args: {
    planId: v.id("optimizationPlans"),
    progress: v.number(),
    status: v.optional(v.string()),
    notes: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const updates: any = {
      progress: Math.max(0, Math.min(100, args.progress)),
      updatedAt: Date.now()
    };

    if (args.status) {
      updates.status = args.status;
    }

    if (args.notes) {
      updates.notes = args.notes;
    }

    // Auto-complete if progress reaches 100%
    if (args.progress >= 100 && !args.status) {
      updates.status = "completed";
      updates.completedAt = Date.now();
    }

    await ctx.db.patch(args.planId, updates);
    
    return { success: true };
  }
});

// Auto-tune integration settings based on performance
export const autoTuneIntegration = action({
  args: {
    integrationId: v.id("integrations"),
    categories: v.optional(v.array(v.string()))
  },
  handler: async (ctx, args) => {
    const integration = await ctx.runQuery(internal.integrations.getIntegration, {
      integrationId: args.integrationId
    });

    if (!integration) {
      throw new Error("Integration not found");
    }

    const insights = await ctx.runAction(internal.performanceOptimization.generatePerformanceInsights, {
      integrationId: args.integrationId,
      timeRange: "7d"
    });

    const tuningResults = [];
    const recommendations = insights.recommendations || [];

    // Auto-tune rate limiting based on error rates and throughput
    if (!args.categories || args.categories.includes("rate_limiting")) {
      const errorRate = await getAverageMetric(ctx, args.integrationId, PERFORMANCE_CATEGORIES.ERROR_RATE);
      const throughput = await getAverageMetric(ctx, args.integrationId, PERFORMANCE_CATEGORIES.THROUGHPUT);
      
      let newRateLimit = integration.settings?.rateLimit?.requestsPerMinute || 60;
      
      if (errorRate > 5) {
        // High error rate - reduce rate limit by 20%
        newRateLimit = Math.max(10, Math.floor(newRateLimit * 0.8));
        tuningResults.push({
          category: "rate_limiting",
          action: "reduced",
          oldValue: integration.settings?.rateLimit?.requestsPerMinute,
          newValue: newRateLimit,
          reason: `High error rate (${errorRate.toFixed(2)}%) detected`
        });
      } else if (errorRate < 1 && throughput > 80) {
        // Low error rate and high throughput - increase rate limit by 10%
        newRateLimit = Math.min(300, Math.floor(newRateLimit * 1.1));
        tuningResults.push({
          category: "rate_limiting",
          action: "increased",
          oldValue: integration.settings?.rateLimit?.requestsPerMinute,
          newValue: newRateLimit,
          reason: `Low error rate (${errorRate.toFixed(2)}%) and high throughput`
        });
      }

      // Update integration settings
      await ctx.runMutation(internal.integrations.updateIntegrationSettings, {
        integrationId: args.integrationId,
        settings: {
          ...integration.settings,
          rateLimit: {
            ...integration.settings?.rateLimit,
            requestsPerMinute: newRateLimit
          }
        }
      });
    }

    // Auto-tune timeout settings based on response times
    if (!args.categories || args.categories.includes("timeouts")) {
      const avgResponseTime = await getAverageMetric(ctx, args.integrationId, PERFORMANCE_CATEGORIES.API_RESPONSE_TIME);
      
      if (avgResponseTime > 0) {
        // Set timeout to 3x average response time, with reasonable bounds
        const newTimeout = Math.max(5000, Math.min(60000, avgResponseTime * 3));
        const oldTimeout = integration.settings?.timeout || 30000;
        
        if (Math.abs(newTimeout - oldTimeout) > 2000) {
          tuningResults.push({
            category: "timeout",
            action: "adjusted",
            oldValue: oldTimeout,
            newValue: newTimeout,
            reason: `Based on average response time of ${Math.round(avgResponseTime)}ms`
          });

          await ctx.runMutation(internal.integrations.updateIntegrationSettings, {
            integrationId: args.integrationId,
            settings: {
              ...integration.settings,
              timeout: newTimeout
            }
          });
        }
      }
    }

    // Auto-tune retry settings based on failure patterns
    if (!args.categories || args.categories.includes("retries")) {
      const errorMetrics = await ctx.runQuery(internal.performanceOptimization.getPerformanceMetrics, {
        integrationId: args.integrationId,
        category: PERFORMANCE_CATEGORIES.ERROR_RATE,
        timeRange: "7d"
      });

      if (errorMetrics.length > 0) {
        const failurePattern = analyzeFailurePattern(errorMetrics);
        
        let maxRetries = integration.settings?.retries?.maxRetries || 3;
        let retryDelay = integration.settings?.retries?.baseDelay || 1000;
        
        if (failurePattern.isIntermittent) {
          // Intermittent failures - increase retries
          maxRetries = Math.min(5, maxRetries + 1);
          tuningResults.push({
            category: "retries",
            action: "increased_retries",
            oldValue: integration.settings?.retries?.maxRetries,
            newValue: maxRetries,
            reason: "Intermittent failure pattern detected"
          });
        }
        
        if (failurePattern.avgRecoveryTime > 5000) {
          // Slow recovery - increase retry delay
          retryDelay = Math.min(10000, retryDelay * 1.5);
          tuningResults.push({
            category: "retries",
            action: "increased_delay",
            oldValue: integration.settings?.retries?.baseDelay,
            newValue: retryDelay,
            reason: `Slow recovery pattern (avg: ${Math.round(failurePattern.avgRecoveryTime)}ms)`
          });
        }

        await ctx.runMutation(internal.integrations.updateIntegrationSettings, {
          integrationId: args.integrationId,
          settings: {
            ...integration.settings,
            retries: {
              ...integration.settings?.retries,
              maxRetries,
              baseDelay: retryDelay
            }
          }
        });
      }
    }

    // Create optimization plan for manual review
    if (tuningResults.length > 0) {
      await ctx.runMutation(internal.performanceOptimization.createOptimizationPlan, {
        integrationId: args.integrationId,
        name: `Auto-tune Results - ${new Date().toISOString().split('T')[0]}`,
        description: "Automatically applied optimizations based on performance analysis",
        recommendations: tuningResults.map(result => ({
          category: result.category,
          title: `Auto-tuned ${result.category}`,
          description: result.reason,
          applied: true,
          oldValue: result.oldValue,
          newValue: result.newValue
        })),
        targetMetrics: {},
        timeline: "immediate"
      });
    }

    return {
      success: true,
      tuningResults,
      summary: {
        categoriesProcessed: args.categories || ["rate_limiting", "timeouts", "retries"],
        optimizationsApplied: tuningResults.length,
        recommendations: recommendations.length
      }
    };
  }
});

// Helper function to get average metric value
async function getAverageMetric(ctx: any, integrationId: Id<"integrations">, category: string): Promise<number> {
  const metrics = await ctx.runQuery(internal.performanceOptimization.getPerformanceMetrics, {
    integrationId,
    category,
    timeRange: "24h"
  });

  if (metrics.length === 0) return 0;
  return metrics.reduce((sum: number, m: any) => sum + m.value, 0) / metrics.length;
}

// Helper function to analyze failure patterns
function analyzeFailurePattern(errorMetrics: any[]): { isIntermittent: boolean; avgRecoveryTime: number; } {
  if (errorMetrics.length < 2) {
    return { isIntermittent: false, avgRecoveryTime: 0 };
  }

  const timestamps = errorMetrics.map(m => m.timestamp).sort();
  const intervals = [];
  
  for (let i = 1; i < timestamps.length; i++) {
    intervals.push(timestamps[i] - timestamps[i - 1]);
  }

  const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
  const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
  const stdDev = Math.sqrt(variance);

  // High variance suggests intermittent failures
  const isIntermittent = stdDev > avgInterval * 0.5;

  return {
    isIntermittent,
    avgRecoveryTime: avgInterval
  };
}

// Cleanup old performance metrics
export const cleanupOldMetrics = mutation({
  args: {
    olderThanDays: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const cutoffDate = Date.now() - (args.olderThanDays || 7) * 24 * 60 * 60 * 1000;
    
    const oldMetrics = await ctx.db.query("performanceMetrics")
      .filter(q => q.lt(q.field("timestamp"), cutoffDate))
      .collect();

    let deletedCount = 0;
    
    for (const metric of oldMetrics) {
      await ctx.db.delete(metric._id);
      deletedCount++;
    }

    return { deletedCount };
  }
});
