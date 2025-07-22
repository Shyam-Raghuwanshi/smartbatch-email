
import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Audit event types
export const AUDIT_EVENTS = {
  // Integration events
  INTEGRATION_CREATED: "integration_created",
  INTEGRATION_UPDATED: "integration_updated",
  INTEGRATION_DELETED: "integration_deleted",
  INTEGRATION_CONNECTED: "integration_connected",
  INTEGRATION_DISCONNECTED: "integration_disconnected",
  
  // Configuration events
  CONFIG_UPDATED: "config_updated",
  SETTINGS_CHANGED: "settings_changed",
  CREDENTIALS_ROTATED: "credentials_rotated",
  
  // Security events
  AUTH_SUCCESS: "auth_success",
  AUTH_FAILURE: "auth_failure",
  PERMISSION_GRANTED: "permission_granted",
  PERMISSION_DENIED: "permission_denied",
  SECURITY_SCAN_STARTED: "security_scan_started",
  SECURITY_ALERT_CREATED: "security_alert_created",
  
  // Data events
  DATA_SYNC_STARTED: "data_sync_started",
  DATA_SYNC_COMPLETED: "data_sync_completed",
  DATA_SYNC_FAILED: "data_sync_failed",
  DATA_EXPORTED: "data_exported",
  DATA_IMPORTED: "data_imported",
  DATA_DELETED: "data_deleted",
  
  // Webhook events
  WEBHOOK_CREATED: "webhook_created",
  WEBHOOK_UPDATED: "webhook_updated",
  WEBHOOK_DELETED: "webhook_deleted",
  WEBHOOK_DELIVERED: "webhook_delivered",
  WEBHOOK_FAILED: "webhook_failed",
  
  // Version events
  VERSION_DEPLOYED: "version_deployed",
  VERSION_ROLLED_BACK: "version_rolled_back",
  
  // Error events
  ERROR_OCCURRED: "error_occurred",
  ERROR_RESOLVED: "error_resolved",
  
  // Performance events
  PERFORMANCE_ALERT: "performance_alert",
  AUTO_TUNING_APPLIED: "auto_tuning_applied",
  
  // Admin events
  USER_CREATED: "user_created",
  USER_UPDATED: "user_updated",
  USER_DELETED: "user_deleted",
  ROLE_ASSIGNED: "role_assigned",
  ROLE_REVOKED: "role_revoked"
} as const;

// Risk levels for audit events
export const RISK_LEVELS = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical"
} as const;

// Create audit log entry
export const createAuditLog = mutation({
  args: {
    eventType: v.string(),
    userId: v.optional(v.id("users")),
    integrationId: v.optional(v.id("integrations")),
    resourceType: v.optional(v.string()),
    resourceId: v.optional(v.string()),
    action: v.string(),
    description: v.string(),
    details: v.optional(v.any()),
    metadata: v.optional(v.object({
      userAgent: v.optional(v.string()),
      ipAddress: v.optional(v.string()),
      sessionId: v.optional(v.string()),
      requestId: v.optional(v.string()),
      source: v.optional(v.string()),
      apiVersion: v.optional(v.string())
    })),
    riskLevel: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    relatedEvents: v.optional(v.array(v.id("auditLogs")))
  },
  handler: async (ctx, args) => {
    // Determine risk level if not provided
    const riskLevel = args.riskLevel || determineRiskLevel(args.eventType, args.action);
    
    // Create audit log entry
    const auditLogId = await ctx.db.insert("auditLogs", {
      eventType: args.eventType,
      userId: args.userId,
      integrationId: args.integrationId,
      resourceType: args.resourceType,
      resourceId: args.resourceId,
      action: args.action,
      description: args.description,
      details: args.details,
      metadata: args.metadata,
      riskLevel,
      tags: args.tags || [],
      relatedEvents: args.relatedEvents || [],
      timestamp: Date.now(),
      indexed: false
    });

    // Create alert for high-risk events
    if (riskLevel === RISK_LEVELS.HIGH || riskLevel === RISK_LEVELS.CRITICAL) {
      await ctx.db.insert("auditAlerts", {
        auditLogId,
        eventType: args.eventType,
        riskLevel,
        message: `High-risk event: ${args.description}`,
        details: args.details,
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    }

    return auditLogId;
  }
});

// Get audit logs with filtering
export const getAuditLogs = query({
  args: {
    userId: v.optional(v.id("users")),
    integrationId: v.optional(v.id("integrations")),
    eventType: v.optional(v.string()),
    action: v.optional(v.string()),
    riskLevel: v.optional(v.string()),
    resourceType: v.optional(v.string()),
    timeRange: v.optional(v.object({
      start: v.number(),
      end: v.number()
    })),
    tags: v.optional(v.array(v.string())),
    limit: v.optional(v.number()),
    offset: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("auditLogs");

    // Apply filters
    if (args.userId) {
      query = query.filter(q => q.eq(q.field("userId"), args.userId));
    }
    if (args.integrationId) {
      query = query.filter(q => q.eq(q.field("integrationId"), args.integrationId));
    }
    if (args.eventType) {
      query = query.filter(q => q.eq(q.field("eventType"), args.eventType));
    }
    if (args.action) {
      query = query.filter(q => q.eq(q.field("action"), args.action));
    }
    if (args.riskLevel) {
      query = query.filter(q => q.eq(q.field("riskLevel"), args.riskLevel));
    }
    if (args.resourceType) {
      query = query.filter(q => q.eq(q.field("resourceType"), args.resourceType));
    }
    if (args.timeRange) {
      query = query.filter(q => q.gte(q.field("timestamp"), args.timeRange!.start));
      query = query.filter(q => q.lte(q.field("timestamp"), args.timeRange!.end));
    }

    const logs = await query
      .order("desc")
      .take(args.limit || 100);

    // Filter by tags if provided
    if (args.tags && args.tags.length > 0) {
      return logs.filter(log => 
        args.tags!.some(tag => log.tags.includes(tag))
      );
    }

    return logs;
  }
});

// Get audit statistics
export const getAuditStatistics = query({
  args: {
    timeRange: v.optional(v.object({
      start: v.number(),
      end: v.number()
    })),
    userId: v.optional(v.id("users")),
    integrationId: v.optional(v.id("integrations"))
  },
  handler: async (ctx, args) => {
    const timeRange = args.timeRange || {
      start: Date.now() - (30 * 24 * 60 * 60 * 1000), // 30 days ago
      end: Date.now()
    };

    let query = ctx.db.query("auditLogs")
      .filter(q => q.gte(q.field("timestamp"), timeRange.start))
      .filter(q => q.lte(q.field("timestamp"), timeRange.end));

    if (args.userId) {
      query = query.filter(q => q.eq(q.field("userId"), args.userId));
    }
    if (args.integrationId) {
      query = query.filter(q => q.eq(q.field("integrationId"), args.integrationId));
    }

    const logs = await query.collect();

    const stats = {
      totalEvents: logs.length,
      eventsByType: {} as Record<string, number>,
      eventsByRisk: {} as Record<string, number>,
      eventsByAction: {} as Record<string, number>,
      eventsByHour: {} as Record<string, number>,
      topUsers: {} as Record<string, number>,
      topIntegrations: {} as Record<string, number>,
      securityEvents: 0,
      dataEvents: 0,
      configurationEvents: 0,
      errorEvents: 0
    };

    // Process logs to generate statistics
    for (const log of logs) {
      // Count by type
      stats.eventsByType[log.eventType] = (stats.eventsByType[log.eventType] || 0) + 1;
      
      // Count by risk level
      stats.eventsByRisk[log.riskLevel] = (stats.eventsByRisk[log.riskLevel] || 0) + 1;
      
      // Count by action
      stats.eventsByAction[log.action] = (stats.eventsByAction[log.action] || 0) + 1;
      
      // Count by hour
      const hour = new Date(log.timestamp).toISOString().slice(0, 13);
      stats.eventsByHour[hour] = (stats.eventsByHour[hour] || 0) + 1;
      
      // Count by user
      if (log.userId) {
        stats.topUsers[log.userId] = (stats.topUsers[log.userId] || 0) + 1;
      }
      
      // Count by integration
      if (log.integrationId) {
        stats.topIntegrations[log.integrationId] = (stats.topIntegrations[log.integrationId] || 0) + 1;
      }
      
      // Categorize events
      if (log.eventType.includes("auth") || log.eventType.includes("permission") || log.eventType.includes("security")) {
        stats.securityEvents++;
      } else if (log.eventType.includes("data") || log.eventType.includes("sync")) {
        stats.dataEvents++;
      } else if (log.eventType.includes("config") || log.eventType.includes("settings")) {
        stats.configurationEvents++;
      } else if (log.eventType.includes("error")) {
        stats.errorEvents++;
      }
    }

    return stats;
  }
});

// Search audit logs
export const searchAuditLogs = query({
  args: {
    searchQuery: v.string(),
    filters: v.optional(v.object({
      eventType: v.optional(v.string()),
      riskLevel: v.optional(v.string()),
      timeRange: v.optional(v.object({
        start: v.number(),
        end: v.number()
      }))
    })),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("auditLogs");

    // Apply filters
    if (args.filters?.eventType) {
      query = query.filter(q => q.eq(q.field("eventType"), args.filters!.eventType));
    }
    if (args.filters?.riskLevel) {
      query = query.filter(q => q.eq(q.field("riskLevel"), args.filters!.riskLevel));
    }
    if (args.filters?.timeRange) {
      query = query.filter(q => q.gte(q.field("timestamp"), args.filters!.timeRange!.start));
      query = query.filter(q => q.lte(q.field("timestamp"), args.filters!.timeRange!.end));
    }

    const logs = await query.take(args.limit || 1000);

    // Filter by search query
    const searchTerms = args.searchQuery.toLowerCase().split(' ');
    return logs.filter(log => {
      const searchableText = [
        log.description,
        log.action,
        log.eventType,
        JSON.stringify(log.details || {}),
        JSON.stringify(log.metadata || {}),
        ...log.tags
      ].join(' ').toLowerCase();

      return searchTerms.every(term => searchableText.includes(term));
    });
  }
});

// Create audit trail for a sequence of related events
export const createAuditTrail = mutation({
  args: {
    trailName: v.string(),
    description: v.string(),
    eventIds: v.array(v.id("auditLogs")),
    metadata: v.optional(v.any())
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("auditTrails", {
      name: args.trailName,
      description: args.description,
      eventIds: args.eventIds,
      metadata: args.metadata,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  }
});

// Get audit trails
export const getAuditTrails = query({
  args: {
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    return await ctx.db.query("auditTrails")
      .order("desc")
      .take(args.limit || 50);
  }
});

// Get audit trail details
export const getAuditTrailDetails = query({
  args: {
    trailId: v.id("auditTrails")
  },
  handler: async (ctx, args) => {
    const trail = await ctx.db.get(args.trailId);
    if (!trail) return null;

    const events = await Promise.all(
      trail.eventIds.map(id => ctx.db.get(id))
    );

    return {
      ...trail,
      events: events.filter(Boolean).sort((a, b) => a!.timestamp - b!.timestamp)
    };
  }
});

// Export audit logs
export const exportAuditLogs = action({
  args: {
    filters: v.optional(v.object({
      timeRange: v.optional(v.object({
        start: v.number(),
        end: v.number()
      })),
      eventType: v.optional(v.string()),
      riskLevel: v.optional(v.string()),
      userId: v.optional(v.id("users")),
      integrationId: v.optional(v.id("integrations"))
    })),
    format: v.optional(v.string()), // "json", "csv", "xlsx"
    includeDetails: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const logs = await ctx.runQuery(internal.auditLogging.getAuditLogs, {
      ...args.filters,
      limit: 10000 // Large export limit
    });

    const exportData = {
      exportedAt: Date.now(),
      totalRecords: logs.length,
      filters: args.filters,
      format: args.format || "json",
      data: logs.map(log => ({
        timestamp: new Date(log.timestamp).toISOString(),
        eventType: log.eventType,
        action: log.action,
        description: log.description,
        riskLevel: log.riskLevel,
        userId: log.userId,
        integrationId: log.integrationId,
        resourceType: log.resourceType,
        resourceId: log.resourceId,
        tags: log.tags.join(', '),
        ...(args.includeDetails && { 
          details: log.details,
          metadata: log.metadata 
        })
      }))
    };

    // In a real implementation, you would generate the file and return a download URL
    return {
      success: true,
      recordCount: logs.length,
      downloadUrl: `#`, // Would be actual download URL
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    };
  }
});

// Get audit alerts
export const getAuditAlerts = query({
  args: {
    isActive: v.optional(v.boolean()),
    riskLevel: v.optional(v.string()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("auditAlerts");

    if (args.isActive !== undefined) {
      query = query.filter(q => q.eq(q.field("isActive"), args.isActive));
    }
    if (args.riskLevel) {
      query = query.filter(q => q.eq(q.field("riskLevel"), args.riskLevel));
    }

    return await query
      .order("desc")
      .take(args.limit || 50);
  }
});

// Acknowledge audit alert
export const acknowledgeAuditAlert = mutation({
  args: {
    alertId: v.id("auditAlerts"),
    acknowledgedBy: v.id("users"),
    notes: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.alertId, {
      acknowledgedBy: args.acknowledgedBy,
      acknowledgedAt: Date.now(),
      notes: args.notes,
      updatedAt: Date.now()
    });

    return { success: true };
  }
});

// Resolve audit alert
export const resolveAuditAlert = mutation({
  args: {
    alertId: v.id("auditAlerts"),
    resolvedBy: v.id("users"),
    resolution: v.string()
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.alertId, {
      isActive: false,
      resolvedBy: args.resolvedBy,
      resolvedAt: Date.now(),
      resolution: args.resolution,
      updatedAt: Date.now()
    });

    return { success: true };
  }
});

// Compliance reporting
export const generateComplianceReport = action({
  args: {
    timeRange: v.object({
      start: v.number(),
      end: v.number()
    }),
    complianceFramework: v.optional(v.string()),
    includeRecommendations: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const logs = await ctx.runQuery(internal.auditLogging.getAuditLogs, {
      timeRange: args.timeRange,
      limit: 50000
    });

    const report = {
      generatedAt: Date.now(),
      timeRange: args.timeRange,
      framework: args.complianceFramework || "general",
      summary: {
        totalEvents: logs.length,
        securityEvents: logs.filter(l => l.eventType.includes("auth") || l.eventType.includes("security")).length,
        dataEvents: logs.filter(l => l.eventType.includes("data")).length,
        configurationChanges: logs.filter(l => l.eventType.includes("config") || l.eventType.includes("updated")).length,
        highRiskEvents: logs.filter(l => l.riskLevel === RISK_LEVELS.HIGH || l.riskLevel === RISK_LEVELS.CRITICAL).length
      },
      compliance: {
        dataProcessingEvents: logs.filter(l => 
          l.eventType.includes("data_sync") || 
          l.eventType.includes("data_export") || 
          l.eventType.includes("data_import")
        ),
        accessControlEvents: logs.filter(l => 
          l.eventType.includes("auth") || 
          l.eventType.includes("permission")
        ),
        securityIncidents: logs.filter(l => 
          l.riskLevel === RISK_LEVELS.HIGH || 
          l.riskLevel === RISK_LEVELS.CRITICAL
        ),
        configurationChanges: logs.filter(l => 
          l.eventType.includes("config") || 
          l.eventType.includes("settings") ||
          l.eventType.includes("updated")
        )
      },
      recommendations: args.includeRecommendations ? generateComplianceRecommendations(logs) : []
    };

    return report;
  }
});

// Generate compliance recommendations
function generateComplianceRecommendations(logs: any[]): any[] {
  const recommendations = [];
  
  const highRiskEvents = logs.filter(l => l.riskLevel === RISK_LEVELS.HIGH || l.riskLevel === RISK_LEVELS.CRITICAL);
  
  if (highRiskEvents.length > 10) {
    recommendations.push({
      priority: "high",
      category: "security",
      title: "High number of high-risk events",
      description: `Found ${highRiskEvents.length} high-risk events. Review security controls.`,
      actions: [
        "Review and strengthen access controls",
        "Implement additional monitoring",
        "Conduct security assessment",
        "Update security policies"
      ]
    });
  }

  const failedAuthEvents = logs.filter(l => l.eventType === AUDIT_EVENTS.AUTH_FAILURE);
  if (failedAuthEvents.length > 100) {
    recommendations.push({
      priority: "medium",
      category: "authentication",
      title: "High number of authentication failures",
      description: `Detected ${failedAuthEvents.length} failed authentication attempts.`,
      actions: [
        "Implement account lockout policies",
        "Enable multi-factor authentication",
        "Review authentication logs",
        "Consider IP-based restrictions"
      ]
    });
  }

  return recommendations;
}

// Helper function to determine risk level
function determineRiskLevel(eventType: string, action: string): string {
  // Critical risk events
  if (eventType.includes("security") || eventType.includes("auth_failure") || 
      eventType.includes("permission_denied") || action.includes("delete")) {
    return RISK_LEVELS.CRITICAL;
  }
  
  // High risk events
  if (eventType.includes("config") || eventType.includes("credentials") || 
      eventType.includes("data_export") || action.includes("update")) {
    return RISK_LEVELS.HIGH;
  }
  
  // Medium risk events
  if (eventType.includes("data") || eventType.includes("webhook") || 
      eventType.includes("version")) {
    return RISK_LEVELS.MEDIUM;
  }
  
  // Default to low risk
  return RISK_LEVELS.LOW;
}

// Cleanup old audit logs
export const cleanupOldAuditLogs = mutation({
  args: {
    olderThanDays: v.optional(v.number()),
    keepCritical: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const cutoffDate = Date.now() - (args.olderThanDays || 365) * 24 * 60 * 60 * 1000; // Default 1 year
    
    let query = ctx.db.query("auditLogs")
      .filter(q => q.lt(q.field("timestamp"), cutoffDate));
    
    // Option to keep critical events
    if (args.keepCritical) {
      query = query.filter(q => q.neq(q.field("riskLevel"), RISK_LEVELS.CRITICAL));
    }
    
    const oldLogs = await query.collect();

    let deletedCount = 0;
    for (const log of oldLogs) {
      await ctx.db.delete(log._id);
      deletedCount++;
    }

    return { deletedCount };
  }
});
