import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/**
 * Data Retention and Cleanup Implementation
 * Automated data lifecycle management for GDPR compliance
 */

// Data retention periods in milliseconds
const RETENTION_PERIODS = {
  // Core data retention
  emailTracking: 2 * 365 * 24 * 60 * 60 * 1000, // 2 years
  inactiveContacts: 3 * 365 * 24 * 60 * 60 * 1000, // 3 years
  campaignData: 5 * 365 * 24 * 60 * 60 * 1000, // 5 years
  auditLogs: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years
  
  // GDPR specific retention
  withdrawnConsents: 1 * 365 * 24 * 60 * 60 * 1000, // 1 year after withdrawal
  processingLogs: 3 * 365 * 24 * 60 * 60 * 1000, // 3 years
  dataSubjectRequests: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years
  
  // Security data retention
  securityIncidents: 5 * 365 * 24 * 60 * 60 * 1000, // 5 years
  rateLimitViolations: 90 * 24 * 60 * 60 * 1000, // 90 days
  failedLogins: 1 * 365 * 24 * 60 * 60 * 1000, // 1 year
  
  // Email compliance retention
  bounceRecords: 2 * 365 * 24 * 60 * 60 * 1000, // 2 years
  spamComplaints: 5 * 365 * 24 * 60 * 60 * 1000, // 5 years (regulatory requirement)
  suppressionList: 10 * 365 * 24 * 60 * 60 * 1000, // 10 years (permanent unless removed)
  
  // Temporary data retention
  unsubscribeTokens: 30 * 24 * 60 * 60 * 1000, // 30 days
  passwordResetTokens: 24 * 60 * 60 * 1000, // 24 hours
  sessionData: 30 * 24 * 60 * 60 * 1000, // 30 days
} as const;

// Daily cleanup job
export const performDailyCleanup = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    let totalDeleted = 0;
    const cleanupResults: Record<string, number> = {};

    console.log("Starting daily data retention cleanup...");

    try {
      // Clean up expired unsubscribe tokens
      const expiredTokens = await ctx.db
        .query("unsubscribeTokens")
        .filter((q) => q.lt(q.field("expiresAt"), now))
        .collect();

      for (const token of expiredTokens) {
        await ctx.db.delete(token._id);
      }
      cleanupResults.unsubscribeTokens = expiredTokens.length;
      totalDeleted += expiredTokens.length;

      // Clean up old rate limit violations
      const oldViolations = await ctx.db
        .query("rateLimitViolations")
        .filter((q) => q.lt(q.field("createdAt"), now - RETENTION_PERIODS.rateLimitViolations))
        .collect();

      for (const violation of oldViolations) {
        await ctx.db.delete(violation._id);
      }
      cleanupResults.rateLimitViolations = oldViolations.length;
      totalDeleted += oldViolations.length;

      // Clean up old session data (if exists)
      // This would depend on your session storage implementation

      // Clean up withdrawn consents that are past retention period
      const oldWithdrawnConsents = await ctx.db
        .query("gdprConsents")
        .filter((q) => q.eq(q.field("consentStatus"), false))
        .filter((q) => q.lt(q.field("withdrawalDate"), now - RETENTION_PERIODS.withdrawnConsents))
        .collect();

      for (const consent of oldWithdrawnConsents) {
        await ctx.db.delete(consent._id);
      }
      cleanupResults.withdrawnConsents = oldWithdrawnConsents.length;
      totalDeleted += oldWithdrawnConsents.length;

      // Log cleanup results
      await ctx.db.insert("auditLogs", {
        eventType: "data_retention_policy",
        resourceType: "system",
        action: "daily_cleanup",
        description: `Daily cleanup completed: ${totalDeleted} records deleted`,
        details: {
          cleanupResults,
          totalDeleted,
          retentionPeriods: RETENTION_PERIODS,
        },
        riskLevel: "low",
        tags: ["cleanup", "retention", "gdpr"],
        timestamp: now,
        createdAt: now,
      });

      console.log(`Daily cleanup completed: ${totalDeleted} records deleted`);
      return { success: true, totalDeleted, cleanupResults };

    } catch (error) {
      console.error("Daily cleanup failed:", error);
      
      // Log cleanup failure
      await ctx.db.insert("auditLogs", {
        eventType: "error_occurred",
        resourceType: "system",
        action: "daily_cleanup_failed",
        description: "Daily data retention cleanup failed",
        details: { error: error.message },
        riskLevel: "high",
        tags: ["cleanup", "error", "retention"],
        timestamp: now,
        createdAt: now,
      });

      throw error;
    }
  },
});

// Weekly comprehensive cleanup
export const performWeeklyCleanup = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    let totalDeleted = 0;
    const cleanupResults: Record<string, number> = {};

    console.log("Starting weekly comprehensive cleanup...");

    try {
      // Clean up old email tracking data
      const oldTrackingData = await ctx.db
        .query("emails")
        .filter((q) => q.lt(q.field("sentAt"), now - RETENTION_PERIODS.emailTracking))
        .collect();

      for (const record of oldTrackingData) {
        await ctx.db.delete(record._id);
      }
      cleanupResults.emailTracking = oldTrackingData.length;
      totalDeleted += oldTrackingData.length;

      // Clean up old bounce records
      const oldBounces = await ctx.db
        .query("emailBounces")
        .filter((q) => q.lt(q.field("createdAt"), now - RETENTION_PERIODS.bounceRecords))
        .collect();

      for (const bounce of oldBounces) {
        await ctx.db.delete(bounce._id);
      }
      cleanupResults.bounceRecords = oldBounces.length;
      totalDeleted += oldBounces.length;

      // Identify inactive contacts for archival warning
      const inactiveContacts = await ctx.db
        .query("contacts")
        .filter((q) => q.lt(q.field("lastEngagement"), now - RETENTION_PERIODS.inactiveContacts))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();

      // Mark contacts for archival (don't delete yet, just flag)
      for (const contact of inactiveContacts) {
        await ctx.db.patch(contact._id, {
          flaggedForArchival: true,
          archivalNoticeDate: now,
        });
      }
      cleanupResults.contactsMarkedForArchival = inactiveContacts.length;

      // Clean up old audit logs (except security incidents)
      const oldAuditLogs = await ctx.db
        .query("auditLogs")
        .filter((q) => q.lt(q.field("createdAt"), now - RETENTION_PERIODS.auditLogs))
        .filter((q) => q.neq(q.field("eventType"), "security_incident"))
        .collect();

      for (const log of oldAuditLogs) {
        await ctx.db.delete(log._id);
      }
      cleanupResults.auditLogs = oldAuditLogs.length;
      totalDeleted += oldAuditLogs.length;

      // Log weekly cleanup results
      await ctx.db.insert("auditLogs", {
        eventType: "data_retention_policy",
        resourceType: "system",
        action: "weekly_cleanup",
        description: `Weekly cleanup completed: ${totalDeleted} records deleted`,
        details: {
          cleanupResults,
          totalDeleted,
          retentionPeriods: RETENTION_PERIODS,
        },
        riskLevel: "low",
        tags: ["cleanup", "retention", "gdpr", "weekly"],
        timestamp: now,
        createdAt: now,
      });

      console.log(`Weekly cleanup completed: ${totalDeleted} records deleted`);
      return { success: true, totalDeleted, cleanupResults };

    } catch (error) {
      console.error("Weekly cleanup failed:", error);
      
      await ctx.db.insert("auditLogs", {
        eventType: "error_occurred",
        resourceType: "system",
        action: "weekly_cleanup_failed",
        description: "Weekly data retention cleanup failed",
        details: { error: error.message },
        riskLevel: "high",
        tags: ["cleanup", "error", "retention", "weekly"],
        timestamp: now,
        createdAt: now,
      });

      throw error;
    }
  },
});

// Monthly archival process
export const performMonthlyArchival = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    let totalArchived = 0;
    const archivalResults: Record<string, number> = {};

    console.log("Starting monthly data archival...");

    try {
      // Archive old campaign data (keep metadata, remove detailed logs)
      const oldCampaigns = await ctx.db
        .query("campaigns")
        .filter((q) => q.lt(q.field("createdAt"), now - RETENTION_PERIODS.campaignData))
        .collect();

      for (const campaign of oldCampaigns) {
        // Create archived version with minimal data
        await ctx.db.insert("archivedCampaigns", {
          originalId: campaign._id,
          userId: campaign.userId,
          name: campaign.name,
          status: campaign.status,
          createdAt: campaign.createdAt,
          archivedAt: now,
          metadata: {
            totalRecipients: 0, // Would be calculated from actual data
            deliveryRate: 0,
            openRate: 0,
            clickRate: 0,
          },
        });

        // Delete original campaign
        await ctx.db.delete(campaign._id);
      }
      archivalResults.campaigns = oldCampaigns.length;
      totalArchived += oldCampaigns.length;

      // Archive contacts flagged for archival (after grace period)
      const contactsToArchive = await ctx.db
        .query("contacts")
        .filter((q) => q.eq(q.field("flaggedForArchival"), true))
        .filter((q) => q.lt(q.field("archivalNoticeDate"), now - (30 * 24 * 60 * 60 * 1000))) // 30 days grace
        .collect();

      for (const contact of contactsToArchive) {
        // Create archived version
        await ctx.db.insert("archivedContacts", {
          originalId: contact._id,
          userId: contact.userId,
          email: contact.email,
          createdAt: contact.createdAt,
          lastEngagement: contact.lastEngagement,
          archivedAt: now,
          reason: "inactivity",
        });

        // Delete original contact
        await ctx.db.delete(contact._id);
      }
      archivalResults.contacts = contactsToArchive.length;
      totalArchived += contactsToArchive.length;

      // Log archival results
      await ctx.db.insert("auditLogs", {
        eventType: "data_retention_policy",
        resourceType: "system",
        action: "monthly_archival",
        description: `Monthly archival completed: ${totalArchived} records archived`,
        details: {
          archivalResults,
          totalArchived,
          retentionPeriods: RETENTION_PERIODS,
        },
        riskLevel: "medium",
        tags: ["archival", "retention", "gdpr", "monthly"],
        timestamp: now,
        createdAt: now,
      });

      console.log(`Monthly archival completed: ${totalArchived} records archived`);
      return { success: true, totalArchived, archivalResults };

    } catch (error) {
      console.error("Monthly archival failed:", error);
      
      await ctx.db.insert("auditLogs", {
        eventType: "error_occurred",
        resourceType: "system",
        action: "monthly_archival_failed",
        description: "Monthly data archival failed",
        details: { error: error.message },
        riskLevel: "high",
        tags: ["archival", "error", "retention", "monthly"],
        timestamp: now,
        createdAt: now,
      });

      throw error;
    }
  },
});

// Quarterly compliance audit
export const performQuarterlyAudit = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const quarterStart = now - (90 * 24 * 60 * 60 * 1000); // 90 days ago

    console.log("Starting quarterly compliance audit...");

    try {
      // Audit data retention compliance
      const retentionAudit = {
        totalRecords: 0,
        recordsByType: {} as Record<string, number>,
        complianceIssues: [] as string[],
        recommendations: [] as string[],
      };

      // Count records by type and check for compliance issues
      const tables = [
        "contacts", "campaigns", "emails", "auditLogs", 
        "gdprConsents", "emailBounces", "spamComplaints", "suppressionList"
      ];

      for (const table of tables) {
        const records = await ctx.db.query(table as any).collect();
        retentionAudit.recordsByType[table] = records.length;
        retentionAudit.totalRecords += records.length;

        // Check for potential compliance issues
        const retentionPeriod = RETENTION_PERIODS[table as keyof typeof RETENTION_PERIODS];
        if (retentionPeriod) {
          const oldRecords = records.filter((r: any) => 
            r.createdAt && (now - r.createdAt > retentionPeriod)
          );
          
          if (oldRecords.length > 0) {
            retentionAudit.complianceIssues.push(
              `${oldRecords.length} ${table} records exceed retention period`
            );
          }
        }
      }

      // Audit GDPR consent compliance
      const consents = await ctx.db.query("gdprConsents").collect();
      const consentAudit = {
        totalConsents: consents.length,
        activeConsents: consents.filter(c => c.consentStatus).length,
        withdrawnConsents: consents.filter(c => !c.consentStatus).length,
        consentsByType: {} as Record<string, number>,
      };

      for (const consent of consents) {
        const type = consent.consentType;
        consentAudit.consentsByType[type] = (consentAudit.consentsByType[type] || 0) + 1;
      }

      // Audit data subject requests
      const dataSubjectRequests = await ctx.db.query("gdprRequests").collect();
      const requestAudit = {
        totalRequests: dataSubjectRequests.length,
        pendingRequests: dataSubjectRequests.filter(r => r.status === "pending").length,
        overdueRequests: dataSubjectRequests.filter(r => 
          r.status === "pending" && now > (r.submittedAt + 30 * 24 * 60 * 60 * 1000)
        ).length,
      };

      if (requestAudit.overdueRequests > 0) {
        retentionAudit.complianceIssues.push(
          `${requestAudit.overdueRequests} data subject requests are overdue`
        );
      }

      // Generate recommendations
      if (retentionAudit.complianceIssues.length === 0) {
        retentionAudit.recommendations.push("All data retention policies are being followed correctly");
      } else {
        retentionAudit.recommendations.push("Review and address identified compliance issues");
        retentionAudit.recommendations.push("Consider increasing cleanup frequency for problem areas");
      }

      // Calculate compliance score
      const maxScore = 100;
      const issueDeduction = Math.min(retentionAudit.complianceIssues.length * 10, 50);
      const complianceScore = maxScore - issueDeduction;

      // Create audit report
      const auditReport = {
        reportId: `audit-${now}`,
        quarterStart,
        quarterEnd: now,
        complianceScore,
        retentionAudit,
        consentAudit,
        requestAudit,
        generatedAt: now,
      };

      // Store audit report
      await ctx.db.insert("auditReports", {
        userId: undefined, // System report
        reportType: "compliance",
        title: "Quarterly Data Retention Compliance Audit",
        description: "Automated quarterly review of data retention and GDPR compliance",
        filters: { type: "quarterly_audit", quarter: Math.floor((new Date().getMonth() + 3) / 3) },
        dateRange: { startDate: quarterStart, endDate: now },
        eventCount: retentionAudit.totalRecords,
        riskMetrics: {
          lowRisk: Math.max(0, 100 - retentionAudit.complianceIssues.length * 20),
          mediumRisk: Math.min(retentionAudit.complianceIssues.length * 10, 50),
          highRisk: Math.min(retentionAudit.complianceIssues.length * 10, 50),
          criticalRisk: requestAudit.overdueRequests * 10,
        },
        reportData: auditReport,
        status: "generated",
        createdAt: now,
        updatedAt: now,
      });

      // Log audit completion
      await ctx.db.insert("auditLogs", {
        eventType: "compliance_check",
        resourceType: "system",
        action: "quarterly_audit",
        description: `Quarterly compliance audit completed. Score: ${complianceScore}%`,
        details: auditReport,
        riskLevel: complianceScore >= 90 ? "low" : complianceScore >= 70 ? "medium" : "high",
        tags: ["audit", "compliance", "gdpr", "quarterly"],
        timestamp: now,
        createdAt: now,
      });

      console.log(`Quarterly audit completed. Compliance score: ${complianceScore}%`);
      return { success: true, complianceScore, auditReport };

    } catch (error) {
      console.error("Quarterly audit failed:", error);
      
      await ctx.db.insert("auditLogs", {
        eventType: "error_occurred",
        resourceType: "system",
        action: "quarterly_audit_failed",
        description: "Quarterly compliance audit failed",
        details: { error: error.message },
        riskLevel: "critical",
        tags: ["audit", "error", "compliance", "quarterly"],
        timestamp: now,
        createdAt: now,
      });

      throw error;
    }
  },
});

// Get retention policy status
export const getRetentionPolicyStatus = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    // Get recent cleanup logs
    const recentCleanups = await ctx.db
      .query("auditLogs")
      .withIndex("by_event_type", (q) => q.eq("eventType", "data_retention_policy"))
      .order("desc")
      .take(10);

    // Calculate next cleanup times
    const nextCleanups = {
      daily: getNextRunTime("daily", 2, 0), // 2 AM UTC
      weekly: getNextRunTime("weekly", 3, 0), // Sunday 3 AM UTC
      monthly: getNextRunTime("monthly", 4, 0), // 1st at 4 AM UTC
      quarterly: getNextRunTime("quarterly", 5, 0), // Quarterly at 5 AM UTC
    };

    return {
      retentionPeriods: RETENTION_PERIODS,
      recentCleanups,
      nextCleanups,
      status: "active",
      lastUpdate: now,
    };
  },
});

// Helper function to calculate next run time
function getNextRunTime(frequency: string, hour: number, minute: number): number {
  const now = new Date();
  const next = new Date();
  
  next.setUTCHours(hour, minute, 0, 0);
  
  switch (frequency) {
    case "daily":
      if (next <= now) {
        next.setUTCDate(next.getUTCDate() + 1);
      }
      break;
    case "weekly":
      // Set to next Sunday
      const daysUntilSunday = (7 - now.getUTCDay()) % 7;
      next.setUTCDate(next.getUTCDate() + (daysUntilSunday || 7));
      if (next <= now) {
        next.setUTCDate(next.getUTCDate() + 7);
      }
      break;
    case "monthly":
      next.setUTCDate(1);
      if (next <= now) {
        next.setUTCMonth(next.getUTCMonth() + 1);
      }
      break;
    case "quarterly":
      const currentQuarter = Math.floor(now.getUTCMonth() / 3);
      const nextQuarterMonth = (currentQuarter + 1) * 3;
      next.setUTCMonth(nextQuarterMonth, 1);
      if (next <= now) {
        next.setUTCMonth(nextQuarterMonth + 3, 1);
      }
      break;
  }
  
  return next.getTime();
}
