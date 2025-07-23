import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

/**
 * Email Compliance Management System
 * Handles bounce management, spam complaints, suppression lists, and unsubscribe automation
 */

// Bounce handling types
export const BOUNCE_TYPES = {
  SOFT: "soft",
  HARD: "hard",
  UNDETERMINED: "undetermined",
} as const;

export const BOUNCE_REASONS = {
  MAILBOX_FULL: "mailbox_full",
  MESSAGE_TOO_LARGE: "message_too_large",
  CONTENT_REJECTED: "content_rejected",
  INVALID_ADDRESS: "invalid_address",
  NO_MAILBOX: "no_mailbox",
  DOMAIN_NOT_FOUND: "domain_not_found",
  NETWORK_ERROR: "network_error",
  POLICY_VIOLATION: "policy_violation",
} as const;

// Process email bounce
export const processBounce = mutation({
  args: {
    emailId: v.string(), // External email service ID
    bounceType: v.union(v.literal("soft"), v.literal("hard"), v.literal("undetermined")),
    bounceSubtype: v.optional(v.string()),
    diagnosticCode: v.optional(v.string()),
    timestamp: v.optional(v.number()),
    metadata: v.optional(v.record(v.string(), v.any())),
  },
  handler: async (ctx, args) => {
    // Find the email queue entry
    const emailQueue = await ctx.db
      .query("emailQueue")
      .filter((q) => q.eq(q.field("resendEmailId"), args.emailId))
      .first();

    if (!emailQueue) {
      throw new Error("Email not found");
    }

    const timestamp = args.timestamp || Date.now();

    // Create bounce record
    const bounceId = await ctx.db.insert("emailBounces", {
      emailQueueId: emailQueue._id,
      userId: emailQueue.userId,
      recipient: emailQueue.recipient,
      bounceType: args.bounceType,
      bounceSubtype: args.bounceSubtype,
      diagnosticCode: args.diagnosticCode,
      timestamp,
      metadata: args.metadata || {},
      processed: false,
      createdAt: timestamp,
    });

    // Update email queue status
    await ctx.db.patch(emailQueue._id, {
      status: "failed",
      errorMessage: `Bounced: ${args.bounceType} - ${args.diagnosticCode || 'No diagnostic code'}`,
      updatedAt: timestamp,
    });

    // Handle bounce based on type
    if (args.bounceType === BOUNCE_TYPES.HARD) {
      await handleHardBounce(ctx, emailQueue.recipient, emailQueue.userId, bounceId);
    } else if (args.bounceType === BOUNCE_TYPES.SOFT) {
      await handleSoftBounce(ctx, emailQueue.recipient, emailQueue.userId, bounceId);
    }

    // Log bounce event
    await ctx.runMutation(internal.auditLogging.createAuditLog, {
      eventType: "email_bounced",
      userId: emailQueue.userId,
      resourceType: "email",
      resourceId: emailQueue._id,
      action: "bounced",
      description: `Email bounced: ${args.bounceType} bounce`,
      details: {
        recipient: emailQueue.recipient,
        bounceType: args.bounceType,
        bounceSubtype: args.bounceSubtype,
        diagnosticCode: args.diagnosticCode,
      },
      riskLevel: args.bounceType === "hard" ? "medium" : "low",
      tags: ["email", "bounce", "compliance"],
    });

    return bounceId;
  },
});

// Process spam complaint
export const processSpamComplaint = mutation({
  args: {
    emailId: v.string(),
    feedbackType: v.string(),
    userAgent: v.optional(v.string()),
    complaintDate: v.optional(v.number()),
    metadata: v.optional(v.record(v.string(), v.any())),
  },
  handler: async (ctx, args) => {
    // Find the email queue entry
    const emailQueue = await ctx.db
      .query("emailQueue")
      .filter((q) => q.eq(q.field("resendEmailId"), args.emailId))
      .first();

    if (!emailQueue) {
      throw new Error("Email not found");
    }

    const complaintDate = args.complaintDate || Date.now();

    // Create complaint record
    const complaintId = await ctx.db.insert("spamComplaints", {
      emailQueueId: emailQueue._id,
      userId: emailQueue.userId,
      recipient: emailQueue.recipient,
      feedbackType: args.feedbackType,
      userAgent: args.userAgent,
      complaintDate,
      metadata: args.metadata || {},
      processed: false,
      createdAt: complaintDate,
    });

    // Add to suppression list immediately
    await addToSuppressionList(
      ctx, 
      emailQueue.recipient, 
      emailQueue.userId, 
      "spam_complaint",
      `Spam complaint received: ${args.feedbackType}`
    );

    // Update contact with complaint flag
    const contact = await ctx.db
      .query("contacts")
      .withIndex("by_email", (q) => q.eq("email", emailQueue.recipient))
      .filter((q) => q.eq(q.field("userId"), emailQueue.userId))
      .first();

    if (contact) {
      await ctx.db.patch(contact._id, {
        hasComplained: true,
        lastComplaintDate: complaintDate,
        emailStats: {
          ...contact.emailStats,
          complaints: (contact.emailStats?.complaints || 0) + 1,
        },
        updatedAt: complaintDate,
      });
    }

    // Log complaint event
    await ctx.runMutation(internal.auditLogging.createAuditLog, {
      eventType: "spam_complaint_received",
      userId: emailQueue.userId,
      resourceType: "email",
      resourceId: emailQueue._id,
      action: "complained",
      description: "Spam complaint received",
      details: {
        recipient: emailQueue.recipient,
        feedbackType: args.feedbackType,
        userAgent: args.userAgent,
      },
      riskLevel: "high",
      tags: ["email", "spam", "complaint", "compliance"],
    });

    return complaintId;
  },
});

// Add email to suppression list
export const addToSuppressionList = mutation({
  args: {
    email: v.string(),
    reason: v.union(
      v.literal("unsubscribe"),
      v.literal("bounce_hard"),
      v.literal("bounce_soft_permanent"),
      v.literal("spam_complaint"),
      v.literal("manual"),
      v.literal("list_hygiene")
    ),
    notes: v.optional(v.string()),
    permanent: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    return await addToSuppressionList(
      ctx,
      args.email,
      user._id,
      args.reason,
      args.notes,
      args.permanent
    );
  },
});

// Remove email from suppression list
export const removeFromSuppressionList = mutation({
  args: {
    email: v.string(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const suppression = await ctx.db
      .query("suppressionList")
      .withIndex("by_user_email", (q) => q.eq("userId", user._id).eq("email", args.email))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!suppression) {
      throw new Error("Email not found in suppression list");
    }

    // Only allow removal if not permanent and not due to spam complaint
    if (suppression.permanent || suppression.reason === "spam_complaint") {
      throw new Error("Cannot remove permanent suppression or spam complaints");
    }

    await ctx.db.patch(suppression._id, {
      isActive: false,
      removedAt: Date.now(),
      removalReason: args.reason,
      updatedAt: Date.now(),
    });

    // Log removal event
    await ctx.runMutation(internal.auditLogging.createAuditLog, {
      eventType: "suppression_removed",
      userId: user._id,
      resourceType: "suppression",
      resourceId: suppression._id,
      action: "removed",
      description: "Email removed from suppression list",
      details: {
        email: args.email,
        originalReason: suppression.reason,
        removalReason: args.reason,
      },
      riskLevel: "low",
      tags: ["email", "suppression", "compliance"],
    });

    return suppression._id;
  },
});

// Check if email is suppressed
export const checkSuppression = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const suppression = await ctx.db
      .query("suppressionList")
      .withIndex("by_user_email", (q) => q.eq("userId", user._id).eq("email", args.email))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    return {
      isSuppressed: !!suppression,
      suppression: suppression ? {
        reason: suppression.reason,
        suppressedAt: suppression.suppressedAt,
        permanent: suppression.permanent,
        notes: suppression.notes,
      } : null,
    };
  },
});

// Get suppression list with filtering
export const getSuppressionList = query({
  args: {
    reason: v.optional(v.string()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    let query = ctx.db
      .query("suppressionList")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("isActive"), true));

    if (args.reason) {
      query = query.filter((q) => q.eq(q.field("reason"), args.reason));
    }

    const suppressions = await query
      .order("desc")
      .take(args.limit || 100);

    const total = await ctx.db
      .query("suppressionList")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return {
      suppressions,
      total: total.length,
      hasMore: suppressions.length === (args.limit || 100),
    };
  },
});

// Automated unsubscribe link generation
export const generateUnsubscribeLink = mutation({
  args: {
    emailQueueId: v.id("emailQueue"),
    trackingEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const emailQueue = await ctx.db.get(args.emailQueueId);
    if (!emailQueue) {
      throw new Error("Email not found");
    }

    // Generate secure unsubscribe token
    const unsubscribeToken = generateSecureToken();
    
    // Store unsubscribe token in email metadata
    const metadata = emailQueue.metadata || {};
    metadata.unsubscribeToken = unsubscribeToken;
    metadata.unsubscribeTracking = args.trackingEnabled ?? true;

    await ctx.db.patch(args.emailQueueId, {
      metadata,
      updatedAt: Date.now(),
    });

    // Generate unsubscribe URL
    const baseUrl = process.env.CONVEX_SITE_URL || "https://your-domain.com";
    const unsubscribeUrl = `${baseUrl}/unsubscribe?token=${unsubscribeToken}`;

    return {
      unsubscribeUrl,
      token: unsubscribeToken,
    };
  },
});

// Process unsubscribe via token
export const processUnsubscribeToken = mutation({
  args: {
    token: v.string(),
    reason: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Find email by unsubscribe token
    const emailQueue = await ctx.db
      .query("emailQueue")
      .filter((q) => q.eq(q.field("metadata.unsubscribeToken"), args.token))
      .first();

    if (!emailQueue) {
      throw new Error("Invalid unsubscribe token");
    }

    // Add to suppression list
    await addToSuppressionList(
      ctx,
      emailQueue.recipient,
      emailQueue.userId,
      "unsubscribe",
      args.reason
    );

    // Create unsubscribe record
    const unsubscribeId = await ctx.db.insert("unsubscribes", {
      email: emailQueue.recipient,
      userId: emailQueue.userId,
      campaignId: emailQueue.campaignId,
      reason: args.reason,
      method: "link",
      userAgent: args.userAgent,
      ipAddress: args.ipAddress,
      unsubscribedAt: Date.now(),
      token: args.token,
    });

    // Log unsubscribe event
    await ctx.runMutation(internal.auditLogging.createAuditLog, {
      eventType: "unsubscribe_processed",
      userId: emailQueue.userId,
      resourceType: "unsubscribe",
      resourceId: unsubscribeId,
      action: "unsubscribed",
      description: "Email unsubscribe processed via link",
      details: {
        email: emailQueue.recipient,
        reason: args.reason,
        method: "link",
        campaignId: emailQueue.campaignId,
      },
      riskLevel: "low",
      tags: ["email", "unsubscribe", "compliance"],
    });

    return {
      success: true,
      email: emailQueue.recipient,
      unsubscribeId,
    };
  },
});

// Bounce analytics and insights
export const getBounceAnalytics = query({
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

    // Get bounces in time range
    const bounces = await ctx.db
      .query("emailBounces")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.gte(q.field("timestamp"), startTime))
      .collect();

    // Get total emails sent for bounce rate calculation
    const totalSent = await ctx.db
      .query("emailQueue")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("status"), "sent"))
      .filter((q) => q.gte(q.field("sentAt"), startTime))
      .collect();

    const analytics = {
      totalBounces: bounces.length,
      totalSent: totalSent.length,
      bounceRate: totalSent.length > 0 ? (bounces.length / totalSent.length) * 100 : 0,
      bouncesByType: {
        hard: bounces.filter(b => b.bounceType === "hard").length,
        soft: bounces.filter(b => b.bounceType === "soft").length,
        undetermined: bounces.filter(b => b.bounceType === "undetermined").length,
      },
      topBounceReasons: getBounceReasonStats(bounces),
      timeline: generateBounceTimeline(bounces, timeRange),
    };

    return analytics;
  },
});

// Compliance dashboard
export const getComplianceDashboard = query({
  args: {
    timeRange: v.optional(v.number()),
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

    // Get suppression list stats
    const suppressions = await ctx.db
      .query("suppressionList")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Get recent unsubscribes
    const unsubscribes = await ctx.db
      .query("unsubscribes")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.gte(q.field("unsubscribedAt"), startTime))
      .collect();

    // Get spam complaints
    const complaints = await ctx.db
      .query("spamComplaints")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.gte(q.field("complaintDate"), startTime))
      .collect();

    return {
      suppressionList: {
        total: suppressions.length,
        byReason: getSuppressionReasonStats(suppressions),
      },
      unsubscribes: {
        total: unsubscribes.length,
        recentTrend: generateUnsubscribeTrend(unsubscribes, timeRange),
      },
      spamComplaints: {
        total: complaints.length,
        complaintRate: calculateComplaintRate(complaints, user._id, startTime),
      },
      complianceScore: calculateComplianceScore(suppressions, unsubscribes, complaints),
      recommendations: generateComplianceRecommendations(suppressions, unsubscribes, complaints),
    };
  },
});

// Internal helper functions
async function handleHardBounce(
  ctx: any, 
  email: string, 
  userId: Id<"users">, 
  bounceId: Id<"emailBounces">
): Promise<void> {
  // Immediately add to suppression list for hard bounces
  await addToSuppressionList(ctx, email, userId, "bounce_hard", "Hard bounce received", true);
  
  // Update contact status
  const contact = await ctx.db
    .query("contacts")
    .withIndex("by_email", (q) => q.eq("email", email))
    .filter((q) => q.eq(q.field("userId"), userId))
    .first();

  if (contact) {
    await ctx.db.patch(contact._id, {
      isActive: false,
      bounceStatus: "hard",
      lastBounceDate: Date.now(),
      emailStats: {
        ...contact.emailStats,
        bounces: (contact.emailStats?.bounces || 0) + 1,
      },
      updatedAt: Date.now(),
    });
  }
}

async function handleSoftBounce(
  ctx: any, 
  email: string, 
  userId: Id<"users">, 
  bounceId: Id<"emailBounces">
): Promise<void> {
  // Count soft bounces for this email
  const softBounces = await ctx.db
    .query("emailBounces")
    .withIndex("by_user_email", (q) => q.eq("userId", userId).eq("recipient", email))
    .filter((q) => q.eq(q.field("bounceType"), "soft"))
    .collect();

  // If more than 5 soft bounces, treat as permanent
  if (softBounces.length >= 5) {
    await addToSuppressionList(
      ctx, 
      email, 
      userId, 
      "bounce_soft_permanent", 
      `${softBounces.length} soft bounces received`,
      true
    );
  }

  // Update contact with bounce info
  const contact = await ctx.db
    .query("contacts")
    .withIndex("by_email", (q) => q.eq("email", email))
    .filter((q) => q.eq(q.field("userId"), userId))
    .first();

  if (contact) {
    await ctx.db.patch(contact._id, {
      bounceStatus: softBounces.length >= 5 ? "hard" : "soft",
      lastBounceDate: Date.now(),
      emailStats: {
        ...contact.emailStats,
        bounces: (contact.emailStats?.bounces || 0) + 1,
      },
      updatedAt: Date.now(),
    });
  }
}

async function addToSuppressionList(
  ctx: any,
  email: string,
  userId: Id<"users">,
  reason: string,
  notes?: string,
  permanent?: boolean
): Promise<Id<"suppressionList">> {
  // Check if already suppressed
  const existing = await ctx.db
    .query("suppressionList")
    .withIndex("by_user_email", (q) => q.eq("userId", userId).eq("email", email))
    .filter((q) => q.eq(q.field("isActive"), true))
    .first();

  if (existing) {
    return existing._id;
  }

  const suppressionId = await ctx.db.insert("suppressionList", {
    userId,
    email,
    reason,
    notes,
    permanent: permanent ?? false,
    suppressedAt: Date.now(),
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  // Log suppression event
  await ctx.db.insert("auditLogs", {
    eventType: "email_suppressed",
    userId,
    resourceType: "suppression",
    resourceId: suppressionId,
    action: "added",
    description: `Email added to suppression list: ${reason}`,
    details: { email, reason, permanent },
    riskLevel: "low",
    tags: ["email", "suppression", "compliance"],
    timestamp: Date.now(),
    createdAt: Date.now(),
  });

  return suppressionId;
}

function generateSecureToken(): string {
  // In a real implementation, use crypto.randomBytes()
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

function getBounceReasonStats(bounces: any[]): Array<{reason: string, count: number}> {
  const reasons: Record<string, number> = {};
  
  bounces.forEach(bounce => {
    const reason = bounce.bounceSubtype || "unknown";
    reasons[reason] = (reasons[reason] || 0) + 1;
  });

  return Object.entries(reasons)
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);
}

function generateBounceTimeline(bounces: any[], timeRange: number): Array<{date: string, count: number}> {
  const timeline: Record<string, number> = {};
  const now = Date.now();
  
  // Initialize timeline
  for (let i = timeRange - 1; i >= 0; i--) {
    const date = new Date(now - (i * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
    timeline[date] = 0;
  }

  // Count bounces by day
  bounces.forEach(bounce => {
    const date = new Date(bounce.timestamp).toISOString().split('T')[0];
    if (timeline[date] !== undefined) {
      timeline[date]++;
    }
  });

  return Object.entries(timeline).map(([date, count]) => ({ date, count }));
}

function getSuppressionReasonStats(suppressions: any[]): Record<string, number> {
  const stats: Record<string, number> = {};
  
  suppressions.forEach(suppression => {
    stats[suppression.reason] = (stats[suppression.reason] || 0) + 1;
  });

  return stats;
}

function generateUnsubscribeTrend(unsubscribes: any[], timeRange: number): Array<{date: string, count: number}> {
  const trend: Record<string, number> = {};
  const now = Date.now();
  
  // Initialize trend
  for (let i = timeRange - 1; i >= 0; i--) {
    const date = new Date(now - (i * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
    trend[date] = 0;
  }

  // Count unsubscribes by day
  unsubscribes.forEach(unsub => {
    const date = new Date(unsub.unsubscribedAt).toISOString().split('T')[0];
    if (trend[date] !== undefined) {
      trend[date]++;
    }
  });

  return Object.entries(trend).map(([date, count]) => ({ date, count }));
}

async function calculateComplaintRate(complaints: any[], userId: Id<"users">, startTime: number): Promise<number> {
  // This would need to calculate complaint rate based on total emails sent
  // For now, return the count
  return complaints.length;
}

function calculateComplianceScore(suppressions: any[], unsubscribes: any[], complaints: any[]): number {
  let score = 100;

  // Deduct points for high complaint rate
  if (complaints.length > 10) {
    score -= 30;
  } else if (complaints.length > 5) {
    score -= 15;
  }

  // Deduct points for high unsubscribe rate (relative to list size)
  const totalSuppressions = suppressions.length;
  if (totalSuppressions > 1000) {
    score -= 20;
  } else if (totalSuppressions > 500) {
    score -= 10;
  }

  return Math.max(0, score);
}

function generateComplianceRecommendations(suppressions: any[], unsubscribes: any[], complaints: any[]): string[] {
  const recommendations = [];

  if (complaints.length > 5) {
    recommendations.push("High spam complaint rate detected - review email content and targeting");
  }

  if (unsubscribes.length > 50) {
    recommendations.push("High unsubscribe rate - consider improving email relevance and frequency");
  }

  const hardBounces = suppressions.filter(s => s.reason === "bounce_hard").length;
  if (hardBounces > 100) {
    recommendations.push("High hard bounce rate - clean your email list and verify addresses");
  }

  return recommendations;
}
