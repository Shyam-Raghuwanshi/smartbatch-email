import { mutation, query, internalMutation, action } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

/**
 * Security Monitoring and Alerting System
 * Real-time security monitoring, threat detection, and automated alerting
 */

// Security alert severity levels
export const ALERT_SEVERITY = {
  LOW: "low",
  MEDIUM: "medium", 
  HIGH: "high",
  CRITICAL: "critical",
} as const;

// Security event types for monitoring
export const SECURITY_EVENTS = {
  // Authentication events
  FAILED_LOGIN: "failed_login",
  SUSPICIOUS_LOGIN: "suspicious_login",
  ACCOUNT_LOCKOUT: "account_lockout",
  PASSWORD_BREACH: "password_breach",
  
  // Access control events
  unauthorized_access: "unauthorized_access",
  PRIVILEGE_ESCALATION: "privilege_escalation",
  PERMISSION_DENIED: "permission_denied",
  
  // Data events
  DATA_BREACH: "data_breach",
  UNUSUAL_DATA_ACCESS: "unusual_data_access",
  BULK_DATA_EXPORT: "bulk_data_export",
  DATA_MODIFICATION: "data_modification",
  
  // System events
  SYSTEM_COMPROMISE: "system_compromise",
  MALWARE_DETECTED: "malware_detected",
  DDOS_ATTACK: "ddos_attack",
  
  // Rate limiting events
  RATE_LIMIT_EXCEEDED: "rate_limit_exceeded",
  API_ABUSE: "api_abuse",
  SUSPICIOUS_PATTERN: "suspicious_pattern",
  
  // Email security events
  SPAM_WAVE: "spam_wave",
  BOUNCE_SPIKE: "bounce_spike",
  COMPLAINT_SPIKE: "complaint_spike",
} as const;

// Security monitoring rules
const SECURITY_RULES = {
  failedLoginThreshold: {
    count: 5,
    timeWindow: 15 * 60 * 1000, // 15 minutes
    severity: ALERT_SEVERITY.MEDIUM,
  },
  suspiciousLoginThreshold: {
    count: 3,
    timeWindow: 60 * 60 * 1000, // 1 hour
    severity: ALERT_SEVERITY.HIGH,
  },
  rateLimitThreshold: {
    count: 10,
    timeWindow: 5 * 60 * 1000, // 5 minutes
    severity: ALERT_SEVERITY.MEDIUM,
  },
  dataAccessThreshold: {
    count: 100,
    timeWindow: 60 * 60 * 1000, // 1 hour
    severity: ALERT_SEVERITY.HIGH,
  },
  bounceRateThreshold: {
    rate: 0.05, // 5%
    timeWindow: 60 * 60 * 1000, // 1 hour
    severity: ALERT_SEVERITY.MEDIUM,
  },
  complaintRateThreshold: {
    rate: 0.001, // 0.1%
    timeWindow: 60 * 60 * 1000, // 1 hour
    severity: ALERT_SEVERITY.HIGH,
  },
} as const;

// Create security alert
export const createSecurityAlert = internalMutation({
  args: {
    eventType: v.string(),
    severity: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    ),
    title: v.string(),
    description: v.string(),
    userId: v.optional(v.id("users")),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    metadata: v.optional(v.any()),
    autoResolve: v.optional(v.boolean()),
    resolutionTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if similar alert exists and is still active
    const existingAlert = await ctx.db
      .query("securityAlerts")
      .withIndex("by_event_type", (q) => q.eq("eventType", args.eventType))
      .filter((q) => q.eq(q.field("status"), "active"))
      .filter((q) => q.gte(q.field("createdAt"), now - 60 * 60 * 1000)) // Last hour
      .first();

    if (existingAlert && args.eventType !== SECURITY_EVENTS.FAILED_LOGIN) {
      // Update existing alert count instead of creating new one
      await ctx.db.patch(existingAlert._id, {
        occurrenceCount: (existingAlert.occurrenceCount || 1) + 1,
        lastOccurrence: now,
        updatedAt: now,
      });
      return existingAlert._id;
    }

    // Create new security alert
    const alertId = await ctx.db.insert("securityAlerts", {
      eventType: args.eventType,
      severity: args.severity,
      title: args.title,
      description: args.description,
      status: "active",
      userId: args.userId,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      metadata: args.metadata,
      occurrenceCount: 1,
      acknowledged: false,
      autoResolve: args.autoResolve || false,
      resolutionTime: args.resolutionTime,
      createdAt: now,
      lastOccurrence: now,
      updatedAt: now,
    });

    // Log security event in audit trail
    await ctx.db.insert("auditLogs", {
      userId: args.userId,
      eventType: "security_alert_created",
      resourceType: "security_alert",
      resourceId: alertId,
      action: "created",
      description: `Security alert created: ${args.title}`,
      details: {
        alertId,
        eventType: args.eventType,
        severity: args.severity,
        metadata: args.metadata,
      },
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      riskLevel: args.severity === "critical" ? "critical" : 
                 args.severity === "high" ? "high" : "medium",
      tags: ["security", "alert", args.eventType],
      timestamp: now,
      createdAt: now,
    });

    // Send immediate notification for high/critical alerts
    if (args.severity === "high" || args.severity === "critical") {
      await ctx.scheduler.runAfter(
        0, // Immediate
        internal.securityMonitoring.sendSecurityNotification,
        {
          alertId,
          severity: args.severity,
          title: args.title,
          description: args.description,
        }
      );
    }

    // Schedule auto-resolution if specified
    if (args.autoResolve && args.resolutionTime) {
      await ctx.scheduler.runAfter(
        args.resolutionTime,
        internal.securityMonitoring.autoResolveAlert,
        { alertId }
      );
    }

    return alertId;
  },
});

// Monitor for suspicious activity patterns
export const monitorSecurityPatterns = internalMutation({
  args: {
    eventType: v.string(),
    userId: v.optional(v.id("users")),
    ipAddress: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const rules = SECURITY_RULES;

    // Monitor failed login attempts
    if (args.eventType === SECURITY_EVENTS.FAILED_LOGIN) {
      const rule = rules.failedLoginThreshold;
      const recentFailures = await ctx.db
        .query("auditLogs")
        .withIndex("by_event_type", (q) => q.eq("eventType", SECURITY_EVENTS.FAILED_LOGIN))
        .filter((q) => q.eq(q.field("ipAddress"), args.ipAddress))
        .filter((q) => q.gte(q.field("timestamp"), now - rule.timeWindow))
        .collect();

      if (recentFailures.length >= rule.count) {
        await ctx.runMutation(internal.securityMonitoring.createSecurityAlert, {
          eventType: SECURITY_EVENTS.FAILED_LOGIN,
          severity: rule.severity,
          title: "Multiple Failed Login Attempts",
          description: `${recentFailures.length} failed login attempts from IP ${args.ipAddress} in ${rule.timeWindow / 60000} minutes`,
          ipAddress: args.ipAddress,
          metadata: {
            failureCount: recentFailures.length,
            timeWindow: rule.timeWindow,
            recentAttempts: recentFailures.slice(-5),
          },
          autoResolve: true,
          resolutionTime: 60 * 60 * 1000, // Auto-resolve after 1 hour
        });
      }
    }

    // Monitor rate limit violations
    if (args.eventType === SECURITY_EVENTS.RATE_LIMIT_EXCEEDED) {
      const rule = rules.rateLimitThreshold;
      const recentViolations = await ctx.db
        .query("rateLimitViolations")
        .withIndex("by_ip", (q) => q.eq("ipAddress", args.ipAddress))
        .filter((q) => q.gte(q.field("createdAt"), now - rule.timeWindow))
        .collect();

      if (recentViolations.length >= rule.count) {
        await ctx.runMutation(internal.securityMonitoring.createSecurityAlert, {
          eventType: SECURITY_EVENTS.API_ABUSE,
          severity: rule.severity,
          title: "Potential API Abuse Detected",
          description: `${recentViolations.length} rate limit violations from IP ${args.ipAddress} in ${rule.timeWindow / 60000} minutes`,
          ipAddress: args.ipAddress,
          metadata: {
            violationCount: recentViolations.length,
            timeWindow: rule.timeWindow,
            endpoints: [...new Set(recentViolations.map(v => v.endpoint))],
          },
          autoResolve: true,
          resolutionTime: 2 * 60 * 60 * 1000, // Auto-resolve after 2 hours
        });
      }
    }

    // Monitor unusual data access patterns
    if (args.eventType === "data_access" && args.userId) {
      const rule = rules.dataAccessThreshold;
      const recentAccess = await ctx.db
        .query("auditLogs")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .filter((q) => q.eq(q.field("action"), "read"))
        .filter((q) => q.gte(q.field("timestamp"), now - rule.timeWindow))
        .collect();

      if (recentAccess.length >= rule.count) {
        await ctx.runMutation(internal.securityMonitoring.createSecurityAlert, {
          eventType: SECURITY_EVENTS.UNUSUAL_DATA_ACCESS,
          severity: rule.severity,
          title: "Unusual Data Access Pattern",
          description: `User accessed ${recentAccess.length} records in ${rule.timeWindow / 60000} minutes`,
          userId: args.userId,
          metadata: {
            accessCount: recentAccess.length,
            timeWindow: rule.timeWindow,
            resourceTypes: [...new Set(recentAccess.map(a => a.resourceType))],
          },
          autoResolve: false, // Requires manual review
        });
      }
    }
  },
});

// Monitor email compliance metrics
export const monitorEmailCompliance = internalMutation({
  args: {
    userId: v.id("users"),
    campaignId: v.optional(v.id("campaigns")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    // Monitor bounce rate
    const recentEmails = await ctx.db
      .query("emails")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .filter((q) => q.gte(q.field("sentAt"), now - oneHour))
      .collect();

    const bouncedEmails = recentEmails.filter(e => e.status === "bounced");
    const bounceRate = recentEmails.length > 0 ? bouncedEmails.length / recentEmails.length : 0;

    if (bounceRate > SECURITY_RULES.bounceRateThreshold.rate) {
      await ctx.runMutation(internal.securityMonitoring.createSecurityAlert, {
        eventType: SECURITY_EVENTS.BOUNCE_SPIKE,
        severity: SECURITY_RULES.bounceRateThreshold.severity,
        title: "High Bounce Rate Detected",
        description: `Bounce rate of ${(bounceRate * 100).toFixed(2)}% detected for recent sends`,
        userId: args.userId,
        metadata: {
          bounceRate,
          totalEmails: recentEmails.length,
          bouncedEmails: bouncedEmails.length,
          campaignId: args.campaignId,
          threshold: SECURITY_RULES.bounceRateThreshold.rate,
        },
        autoResolve: false,
      });
    }

    // Monitor spam complaint rate
    const recentComplaints = await ctx.db
      .query("spamComplaints")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .filter((q) => q.gte(q.field("createdAt"), now - oneHour))
      .collect();

    const complaintRate = recentEmails.length > 0 ? recentComplaints.length / recentEmails.length : 0;

    if (complaintRate > SECURITY_RULES.complaintRateThreshold.rate) {
      await ctx.runMutation(internal.securityMonitoring.createSecurityAlert, {
        eventType: SECURITY_EVENTS.COMPLAINT_SPIKE,
        severity: SECURITY_RULES.complaintRateThreshold.severity,
        title: "High Spam Complaint Rate Detected",
        description: `Spam complaint rate of ${(complaintRate * 100).toFixed(3)}% detected for recent sends`,
        userId: args.userId,
        metadata: {
          complaintRate,
          totalEmails: recentEmails.length,
          complaints: recentComplaints.length,
          campaignId: args.campaignId,
          threshold: SECURITY_RULES.complaintRateThreshold.rate,
        },
        autoResolve: false,
      });
    }
  },
});

// Send security notification
export const sendSecurityNotification = internalMutation({
  args: {
    alertId: v.id("securityAlerts"),
    severity: v.string(),
    title: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    // In a real implementation, this would:
    // 1. Send email to security team
    // 2. Send SMS for critical alerts
    // 3. Post to Slack/Teams
    // 4. Create incident in incident management system

    console.log(`Security notification sent for alert ${args.alertId}:`);
    console.log(`Severity: ${args.severity}`);
    console.log(`Title: ${args.title}`);
    console.log(`Description: ${args.description}`);

    // Log notification sent
    await ctx.db.insert("auditLogs", {
      eventType: "security_notification_sent",
      resourceType: "security_alert",
      resourceId: args.alertId,
      action: "notification_sent",
      description: `Security notification sent for ${args.severity} alert`,
      details: {
        alertId: args.alertId,
        severity: args.severity,
        title: args.title,
      },
      riskLevel: args.severity === "critical" ? "critical" : "medium",
      tags: ["security", "notification", "alert"],
      timestamp: Date.now(),
      createdAt: Date.now(),
    });
  },
});

// Auto-resolve security alert
export const autoResolveAlert = internalMutation({
  args: {
    alertId: v.id("securityAlerts"),
  },
  handler: async (ctx, args) => {
    const alert = await ctx.db.get(args.alertId);
    if (!alert || alert.status !== "active") {
      return;
    }

    await ctx.db.patch(args.alertId, {
      status: "resolved",
      resolvedAt: Date.now(),
      resolvedBy: "system",
      resolutionNotes: "Auto-resolved after timeout",
      updatedAt: Date.now(),
    });

    // Log resolution
    await ctx.db.insert("auditLogs", {
      eventType: "security_alert_resolved",
      resourceType: "security_alert", 
      resourceId: args.alertId,
      action: "resolved",
      description: "Security alert auto-resolved",
      details: {
        alertId: args.alertId,
        resolutionMethod: "automatic",
      },
      riskLevel: "low",
      tags: ["security", "alert", "resolved"],
      timestamp: Date.now(),
      createdAt: Date.now(),
    });
  },
});

// Get security dashboard metrics
export const getSecurityMetrics = query({
  args: {
    timeRange: v.optional(v.number()), // hours
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const timeRange = args.timeRange || 24; // Default 24 hours
    const startTime = Date.now() - (timeRange * 60 * 60 * 1000);

    // Get active security alerts
    const activeAlerts = await ctx.db
      .query("securityAlerts")
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    // Get recent security events
    const recentEvents = await ctx.db
      .query("auditLogs")
      .filter((q) => q.gte(q.field("timestamp"), startTime))
      .filter((q) => q.eq(q.field("tags"), "security"))
      .order("desc")
      .take(50);

    // Calculate security score
    const criticalAlerts = activeAlerts.filter(a => a.severity === "critical").length;
    const highAlerts = activeAlerts.filter(a => a.severity === "high").length;
    const mediumAlerts = activeAlerts.filter(a => a.severity === "medium").length;

    let securityScore = 100;
    securityScore -= criticalAlerts * 25;
    securityScore -= highAlerts * 10;
    securityScore -= mediumAlerts * 5;
    securityScore = Math.max(0, securityScore);

    // Group alerts by severity
    const alertsBySeverity = {
      critical: criticalAlerts,
      high: highAlerts,
      medium: mediumAlerts,
      low: activeAlerts.filter(a => a.severity === "low").length,
    };

    // Get threat trends
    const threatTrends = await calculateThreatTrends(ctx, startTime);

    return {
      securityScore,
      totalActiveAlerts: activeAlerts.length,
      alertsBySeverity,
      recentEvents: recentEvents.slice(0, 10),
      threatTrends,
      lastScanTime: Date.now() - 2 * 60 * 60 * 1000, // Mock: 2 hours ago
      systemStatus: securityScore >= 90 ? "secure" : 
                   securityScore >= 70 ? "warning" : "critical",
    };
  },
});

// Acknowledge security alert
export const acknowledgeAlert = mutation({
  args: {
    alertId: v.id("securityAlerts"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const alert = await ctx.db.get(args.alertId);
    if (!alert) throw new Error("Alert not found");

    await ctx.db.patch(args.alertId, {
      acknowledged: true,
      acknowledgedBy: user._id,
      acknowledgedAt: Date.now(),
      acknowledgmentNotes: args.notes,
      updatedAt: Date.now(),
    });

    // Log acknowledgment
    await ctx.db.insert("auditLogs", {
      userId: user._id,
      eventType: "security_alert_acknowledged",
      resourceType: "security_alert",
      resourceId: args.alertId,
      action: "acknowledged",
      description: `Security alert acknowledged by ${user.name}`,
      details: {
        alertId: args.alertId,
        notes: args.notes,
      },
      riskLevel: "low",
      tags: ["security", "alert", "acknowledged"],
      timestamp: Date.now(),
      createdAt: Date.now(),
    });

    return true;
  },
});

// Helper function to calculate threat trends
async function calculateThreatTrends(ctx: any, startTime: number) {
  const events = await ctx.db
    .query("auditLogs")
    .filter((q: any) => q.gte(q.field("timestamp"), startTime))
    .collect();

  const trends = {
    failedLogins: 0,
    rateLimitViolations: 0,
    suspiciousActivity: 0,
    dataAccess: 0,
  };

  for (const event of events) {
    switch (event.eventType) {
      case SECURITY_EVENTS.FAILED_LOGIN:
        trends.failedLogins++;
        break;
      case SECURITY_EVENTS.RATE_LIMIT_EXCEEDED:
        trends.rateLimitViolations++;
        break;
      case SECURITY_EVENTS.UNUSUAL_DATA_ACCESS:
        trends.suspiciousActivity++;
        break;
      case "data_access":
        trends.dataAccess++;
        break;
    }
  }

  return trends;
}
