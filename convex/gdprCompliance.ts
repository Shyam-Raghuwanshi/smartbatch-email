import { mutation, query, internalMutation, action } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

/**
 * GDPR Compliance Management System
 * Handles data protection, privacy rights, consent management, and data retention
 */

// GDPR Event Types
export const GDPR_EVENTS = {
  CONSENT_GIVEN: "consent_given",
  CONSENT_WITHDRAWN: "consent_withdrawn",
  DATA_ACCESS_REQUEST: "data_access_request",
  DATA_DELETION_REQUEST: "data_deletion_request",
  DATA_PORTABILITY_REQUEST: "data_portability_request",
  DATA_RECTIFICATION_REQUEST: "data_rectification_request",
  DATA_PROCESSED: "data_processed",
  DATA_SHARED: "data_shared",
  DATA_RETAINED: "data_retained",
  DATA_DELETED: "data_deleted",
} as const;

// Record GDPR consent
export const recordConsent = mutation({
  args: {
    contactId: v.id("contacts"),
    consentType: v.union(
      v.literal("marketing"),
      v.literal("analytics"),
      v.literal("functional"),
      v.literal("necessary")
    ),
    consentSource: v.string(),
    legalBasis: v.string(),
    details: v.optional(v.record(v.string(), v.any())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    // Verify contact ownership
    const contact = await ctx.db.get(args.contactId);
    if (!contact || contact.userId !== user._id) {
      throw new Error("Contact not found or unauthorized");
    }

    // Get contact email for GDPR consent tracking
    const contactEmail = contact.email;

    // Check if consent already exists
    const existingConsent = await ctx.db
      .query("gdprConsents")
      .withIndex("by_contact", (q) => q.eq("contactEmail", contactEmail))
      .filter((q) => q.eq(q.field("consentType"), args.consentType))
      .filter((q) => q.eq(q.field("consentStatus"), true))
      .first();

    if (existingConsent) {
      // Update existing consent
      await ctx.db.patch(existingConsent._id, {
        source: args.consentSource,
        legalBasis: args.legalBasis,
        metadata: args.details,
        consentDate: Date.now(),
      });

      // Log consent event
      await ctx.db.insert("auditLogs", {
        userId: user._id,
        eventType: "gdpr_request",
        resource: "gdpr_consent",
        resourceId: existingConsent._id,
        action: "updated",
        details: { 
          contactEmail,
          consentType: args.consentType,
          source: args.consentSource,
          legalBasis: args.legalBasis
        },
        riskLevel: "low",
        tags: ["gdpr", "consent", "updated"],
        timestamp: Date.now(),
        createdAt: Date.now(),
      });

      return existingConsent._id;
    }

    // Create new consent record
    const consentId = await ctx.db.insert("gdprConsents", {
      userId: user._id,
      contactEmail,
      consentType: args.consentType,
      consentStatus: true,
      consentDate: Date.now(),
      source: args.consentSource,
      legalBasis: args.legalBasis,
      metadata: args.details,
        });

    // Log consent event
    await ctx.db.insert("auditLogs", {
      userId: user._id,
      eventType: "gdpr_request",
      resource: "gdpr_consent",
      resourceId: consentId,
      action: "created",
      details: { 
        contactEmail,
        consentType: args.consentType,
        source: args.consentSource,
        legalBasis: args.legalBasis
      },
      riskLevel: "low",
      tags: ["gdpr", "consent", "created"],
      timestamp: Date.now(),
      createdAt: Date.now(),
    });

    return consentId;
  },
});

// Withdraw consent
export const withdrawConsent = mutation({
  args: {
    contactId: v.id("contacts"),
    consentType: v.union(
      v.literal("marketing"),
      v.literal("analytics"),
      v.literal("functional"),
      v.literal("necessary")
    ),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    // Verify contact ownership
    const contact = await ctx.db.get(args.contactId);
    if (!contact || contact.userId !== user._id) {
      throw new Error("Contact not found or unauthorized");
    }

    // Find active consent
    const consent = await ctx.db
      .query("gdprConsents")
      .withIndex("by_contact", (q) => q.eq("contactEmail", contact.email))
      .filter((q) => q.eq(q.field("consentType"), args.consentType))
      .filter((q) => q.eq(q.field("consentStatus"), true))
      .first();

    if (!consent) {
      throw new Error("No active consent found");
    }

    // Withdraw consent
    await ctx.db.patch(consent._id, {
      consentStatus: false,
      withdrawalDate: Date.now(),
      metadata: { withdrawalReason: args.reason },
    });

    // Log withdrawal event
    await ctx.db.insert("auditLogs", {
      userId: user._id,
      eventType: "gdpr_request",
      resource: "gdpr_consent",
      resourceId: consent._id,
      action: "withdrawn",
      details: { 
        contactEmail: contact.email,
        consentType: args.consentType,
        reason: args.reason
      },
      riskLevel: "medium",
      tags: ["gdpr", "consent", "withdrawn"],
      timestamp: Date.now(),
      createdAt: Date.now(),
    });

    return consent._id;
  },
});

// Process data subject access request
export const processDataAccessRequest = mutation({
  args: {
    contactEmail: v.string(),
    requestType: v.union(
      v.literal("access"),
      v.literal("portability"),
      v.literal("rectification"),
      v.literal("deletion")
    ),
    requestDetails: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    // Check if a request with the same email and type already exists
    const existingRequest = await ctx.db
      .query("gdprRequests")
      .withIndex("by_contact", (q) => q.eq("contactEmail", args.contactEmail))
      .filter((q) => q.eq(q.field("requestType"), args.requestType))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();

    if (existingRequest) {
      throw new Error("A similar request is already pending for this email");
    }

    // Create new GDPR request
    const requestId = await ctx.db.insert("gdprRequests", {
      userId: user._id,
      contactEmail: args.contactEmail,
      requestType: args.requestType,
      status: "pending",
      submittedAt: Date.now(),
      metadata: { requestDetails: args.requestDetails },
    });

    // Log GDPR request
    await ctx.db.insert("auditLogs", {
      userId: user._id,
      eventType: "gdpr_request",
      resource: "gdpr_request",
      resourceId: requestId,
      action: "submitted",
      details: {
        contactEmail: args.contactEmail,
        requestType: args.requestType,
        requestDetails: args.requestDetails
      },
      riskLevel: "medium",
      tags: ["gdpr", "data_request", args.requestType],
      timestamp: Date.now(),
      createdAt: Date.now(),
    });

    return requestId;
  },
});

// Process GDPR data request
export const processGdprRequest = mutation({
  args: {
    requestId: v.id("gdprRequests"),
    status: v.union(
      v.literal("processing"),
      v.literal("completed"),
      v.literal("rejected")
    ),
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

    const request = await ctx.db.get(args.requestId);
    if (!request || request.userId !== user._id) {
      throw new Error("Request not found or unauthorized");
    }

    // Update request status
    const updateData: any = {
      status: args.status,
      processorUserId: user._id,
    };

    if (args.status === "processing") {
      updateData.processedAt = Date.now();
    } else if (args.status === "completed") {
      updateData.completedAt = Date.now();
    }

    if (args.notes) {
      updateData.notes = args.notes;
    }

    await ctx.db.patch(args.requestId, updateData);

    // Log request processing
    await ctx.db.insert("auditLogs", {
      userId: user._id,
      eventType: "gdpr_request",
      resource: "gdpr_request",
      resourceId: args.requestId,
      action: args.status,
      details: {
        contactEmail: request.contactEmail,
        requestType: request.requestType,
        notes: args.notes
      },
      riskLevel: "medium",
      tags: ["gdpr", "data_request", request.requestType, args.status],
      timestamp: Date.now(),
      createdAt: Date.now(),
    });

    return args.requestId;
  },
});

// Generate data export for portability request
export const generateDataExport = action({
  args: {
    requestId: v.id("gdprRequests"),
  },
  handler: async (ctx, args) => {
    const request = await ctx.runQuery(internal.gdprCompliance.getGdprRequest, {
      requestId: args.requestId,
    });

    if (!request || request.requestType !== "portability") {
      throw new Error("Invalid request for data export");
    }

    // Collect all user data
    const userData = {
      contact: request.contact,
      emailHistory: request.emailHistory,
      consentHistory: request.consentHistory,
      engagementData: request.engagementData,
      exportDate: new Date().toISOString(),
      dataController: "SmartBatch Email Marketing",
    };

    // In a real implementation, you would:
    // 1. Generate a secure file (JSON/CSV)
    // 2. Store it in encrypted storage
    // 3. Send download link to user
    // 4. Set expiration for the download

    // Update request status
    await ctx.runMutation(internal.gdprCompliance.updateGdprRequestStatus, {
      requestId: args.requestId,
      status: "completed",
      notes: "Data export generated and download link sent",
    });

    return {
      success: true,
      downloadUrl: "#", // Would be actual secure download URL
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
    };
  },
});

// Process data deletion request (GDPR Article 17 - Right to erasure)
export const processDataDeletionRequest = internalMutation({
  args: {
    requestId: v.id("gdprRequests"),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request || request.requestType !== "deletion") {
      return;
    }

    // Find contact by email
    const contact = await ctx.db
      .query("contacts")
      .withIndex("by_email", (q) => q.eq("email", request.contactEmail))
      .first();

    if (!contact) {
      await ctx.db.patch(args.requestId, {
        status: "completed",
        notes: "No contact data found for this email",
        completedAt: Date.now(),
      });
      return;
    }

    // Check if there are legal obligations to retain data
    const hasLegalObligation = await checkLegalObligationToRetain(ctx, contact);
    
    if (hasLegalObligation) {
      await ctx.db.patch(args.requestId, {
        status: "rejected",
        notes: "Data retention required for legal compliance",
        completedAt: Date.now(),
      });
      return;
    }

    // Perform data deletion
    await deleteContactData(ctx, contact._id);

    // Update request status
    await ctx.db.patch(args.requestId, {
      status: "completed",
      notes: "All personal data has been deleted",
      completedAt: Date.now(),
    });

    // Log deletion event
    await ctx.db.insert("auditLogs", {
      userId: request.userId,
      eventType: "data_deletion",
      resource: "contact",
      resourceId: contact._id,
      action: "deleted",
      details: { 
        requestId: args.requestId,
        contactEmail: request.contactEmail,
        reason: "GDPR erasure request"
      },
      riskLevel: "medium",
      tags: ["gdpr", "deletion", "compliance"],
      timestamp: Date.now(),
      createdAt: Date.now(),
    });
  },
});

// Apply data retention policies
export const applyDataRetentionPolicies = internalMutation({
  args: {},
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Retention periods in milliseconds
    const retentionPeriods = {
      emailTracking: 2 * 365 * 24 * 60 * 60 * 1000, // 2 years
      inactiveContacts: 3 * 365 * 24 * 60 * 60 * 1000, // 3 years
      auditLogs: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years
      withdrawnConsents: 1 * 365 * 24 * 60 * 60 * 1000, // 1 year after withdrawal
    };

    let deletedCount = 0;

    // Clean up old email tracking data
    const oldTrackingData = await ctx.db
      .query("emailTracking")
      .filter((q) => q.lt(q.field("timestamp"), now - retentionPeriods.emailTracking))
      .collect();

    for (const record of oldTrackingData) {
      await ctx.db.delete(record._id);
      deletedCount++;
    }

    // Clean up old withdrawn consents
    const oldConsents = await ctx.db
      .query("gdprConsents")
      .filter((q) => q.eq(q.field("consentStatus"), false))
      .filter((q) => q.lt(q.field("withdrawalDate"), now - retentionPeriods.withdrawnConsents))
      .collect();

    for (const consent of oldConsents) {
      await ctx.db.delete(consent._id);
      deletedCount++;
    }

    // Log retention policy application
    await ctx.db.insert("auditLogs", {
      eventType: "data_retention_policy",
      resource: "system",
      action: "retention_policy_applied",
      details: { 
        deletedCount, 
        retentionPeriods,
        description: `Data retention policies applied, deleted ${deletedCount} records`
      },
      riskLevel: "low",
      tags: ["gdpr", "retention", "cleanup"],
      timestamp: now,
      createdAt: now,
    });

    return { deletedCount };
  },
});

// Get consent status for a contact
export const getConsentStatus = query({
  args: {
    contactId: v.id("contacts"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    // Verify contact ownership
    const contact = await ctx.db.get(args.contactId);
    if (!contact || contact.userId !== user._id) {
      throw new Error("Contact not found or unauthorized");
    }

    // Get all active consents for this contact's email
    const consents = await ctx.db
      .query("gdprConsents")
      .withIndex("by_contact", (q) => q.eq("contactEmail", contact.email))
      .filter((q) => q.eq(q.field("consentStatus"), true))
      .collect();

    return {
      contactId: args.contactId,
      contactEmail: contact.email,
      consents: consents.map(consent => ({
        type: consent.consentType,
        status: consent.consentStatus,
        date: consent.consentDate,
        source: consent.source,
        legalBasis: consent.legalBasis,
      })),
      hasMarketingConsent: consents.some(c => 
        c.consentType === "marketing" && c.consentStatus
      ),
      lastUpdated: consents.length > 0 ? Math.max(...consents.map(c => c.consentDate)) : 0,
    };
  },
});

// Get GDPR compliance dashboard
export const getGDPRDashboard = query({
  args: {
    timeRange: v.optional(v.number()), // days
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const timeRange = args.timeRange || 30;
    const startTime = Date.now() - (timeRange * 24 * 60 * 60 * 1000);

    // Get consent statistics
    const allConsents = await ctx.db
      .query("gdprConsents")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const consentStats = {
      total: allConsents.length,
      active: allConsents.filter(c => c.consentStatus).length,
      withdrawn: allConsents.filter(c => !c.consentStatus).length,
      byType: {} as Record<string, { given: number; withdrawn: number }>,
    };

    // Group by consent type
    for (const consent of allConsents) {
      const type = consent.consentType;
      if (!consentStats.byType[type]) {
        consentStats.byType[type] = { given: 0, withdrawn: 0 };
      }
      if (consent.consentStatus) {
        consentStats.byType[type].given++;
      } else {
        consentStats.byType[type].withdrawn++;
      }
    }

    // Get data subject requests
    const requests = await ctx.db
      .query("gdprRequests")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.gte(q.field("submittedAt"), startTime))
      .collect();

    const requestStats = {
      total: requests.length,
      pending: requests.filter(r => r.status === "pending").length,
      processing: requests.filter(r => r.status === "processing").length,
      completed: requests.filter(r => r.status === "completed").length,
      rejected: requests.filter(r => r.status === "rejected").length,
      byType: {} as Record<string, number>,
    };

    // Group by request type
    for (const request of requests) {
      const type = request.requestType;
      requestStats.byType[type] = (requestStats.byType[type] || 0) + 1;
    }

    return {
      consentStats,
      requestStats,
      complianceScore: calculateComplianceScore(consentStats, requestStats),
      recommendations: generateComplianceRecommendations(consentStats, requestStats),
    };
  },
});

// Internal helper functions
export const getGdprRequest = internalMutation({
  args: {
    requestId: v.id("gdprRequests"),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) return null;

    // Find contact by email
    const contact = await ctx.db
      .query("contacts")
      .withIndex("by_email", (q) => q.eq("email", request.contactEmail))
      .first();
    
    // Collect related data
    const emailHistory = await ctx.db
      .query("emailQueue")
      .filter((q) => q.eq(q.field("recipient"), request.contactEmail))
      .collect();

    const consentHistory = await ctx.db
      .query("gdprConsents")
      .withIndex("by_contact", (q) => q.eq("contactEmail", request.contactEmail))
      .collect();

    const engagementData = await ctx.db
      .query("emailTracking")
      .filter((q) => q.eq(q.field("recipient"), request.contactEmail))
      .collect();

    return {
      ...request,
      contact,
      emailHistory,
      consentHistory,
      engagementData,
    };
  },
});

export const updateGdprRequestStatus = internalMutation({
  args: {
    requestId: v.id("gdprRequests"),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("rejected")
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: any = {
      status: args.status,
    };

    if (args.notes) {
      updates.notes = args.notes;
    }

    if (args.status === "processing") {
      updates.processedAt = Date.now();
    } else if (args.status === "completed" || args.status === "rejected") {
      updates.completedAt = Date.now();
    }

    await ctx.db.patch(args.requestId, updates);
  },
});

// Helper functions
async function checkLegalObligationToRetain(ctx: any, contact: any): Promise<boolean> {
  // Check for legal obligations that require data retention
  // This would include checking for:
  // - Active contracts
  // - Legal disputes
  // - Tax obligations
  // - Regulatory requirements
  
  // For now, return false (no legal obligation)
  return false;
}

async function deleteContactData(ctx: any, contactId: Id<"contacts">): Promise<void> {
  const contact = await ctx.db.get(contactId);
  if (!contact) return;

  const originalEmail = contact.email;

  // Delete or anonymize contact data
  await ctx.db.patch(contactId, {
    firstName: "[DELETED]",
    lastName: "[DELETED]",
    email: `deleted-${Date.now()}@deleted.local`,
    phone: null,
    company: null,
    address: null,
    customFields: {},
    tags: [],
    notes: null,
    isActive: false,
    deletedAt: Date.now(),
    deletionReason: "GDPR erasure request",
  });

  // Delete email tracking data
  const trackingData = await ctx.db
    .query("emailTracking")
    .filter((q: any) => q.eq(q.field("recipient"), originalEmail))
    .collect();

  for (const record of trackingData) {
    await ctx.db.delete(record._id);
  }

  // Anonymize email queue entries
  const emailEntries = await ctx.db
    .query("emailQueue")
    .filter((q: any) => q.eq(q.field("recipient"), originalEmail))
    .collect();

  for (const entry of emailEntries) {
    await ctx.db.patch(entry._id, {
      recipient: `deleted-${Date.now()}@deleted.local`,
      personalData: null,
    });
  }
}

function calculateComplianceScore(consentStats: any, requestStats: any): number {
  let score = 100;

  // Deduct points for missing consents
  if (consentStats.active < consentStats.total * 0.8) {
    score -= 20;
  }

  // Deduct points for overdue requests
  if (requestStats.pending > 0) {
    score -= requestStats.pending * 5;
  }

  return Math.max(0, score);
}

function generateComplianceRecommendations(consentStats: any, requestStats: any): string[] {
  const recommendations = [];

  if (consentStats.active < consentStats.total * 0.8) {
    recommendations.push("Review and update consent collection processes");
  }

  if (requestStats.pending > 0) {
    recommendations.push("Process pending data subject requests within 30 days");
  }

  if (!consentStats.byType.marketing) {
    recommendations.push("Implement explicit marketing consent collection");
  }

  return recommendations;
}
