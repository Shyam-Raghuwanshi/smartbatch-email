import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create analytics entry
export const createAnalyticsEntry = mutation({
  args: {
    campaignId: v.id("campaigns"),
    metric: v.union(
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("opened"),
      v.literal("clicked"),
      v.literal("bounced"),
      v.literal("unsubscribed")
    ),
    value: v.number(),
    metadata: v.optional(v.object({
      recipientEmail: v.optional(v.string()),
      userAgent: v.optional(v.string()),
      ipAddress: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    // Verify user owns the campaign
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    
    if (!user || campaign.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    const analyticsId = await ctx.db.insert("analytics", {
      ...args,
      timestamp: Date.now(),
    });
    return analyticsId;
  },
});

// Get analytics by campaign
export const getAnalyticsByCampaign = query({
  args: { campaignId: v.id("campaigns") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    // Verify user owns the campaign
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    
    if (!user || campaign.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    return await ctx.db
      .query("analytics")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .order("desc")
      .collect();
  },
});

// Get analytics by metric (system function)
export const getAnalyticsByMetric = query({
  args: { 
    metric: v.union(
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("opened"),
      v.literal("clicked"),
      v.literal("bounced"),
      v.literal("unsubscribed")
    )
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("analytics")
      .withIndex("by_metric", (q) => q.eq("metric", args.metric))
      .collect();
  },
});

// Get campaign summary analytics
export const getCampaignSummary = query({
  args: { campaignId: v.id("campaigns") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    // Verify user owns the campaign
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    
    if (!user || campaign.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    const analytics = await ctx.db
      .query("analytics")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .collect();

    const summary = {
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
      unsubscribed: 0,
    };

    analytics.forEach(entry => {
      summary[entry.metric] += entry.value;
    });

    // Calculate rates
    const rates = {
      deliveryRate: summary.sent > 0 ? (summary.delivered / summary.sent) * 100 : 0,
      openRate: summary.delivered > 0 ? (summary.opened / summary.delivered) * 100 : 0,
      clickRate: summary.delivered > 0 ? (summary.clicked / summary.delivered) * 100 : 0,
      bounceRate: summary.sent > 0 ? (summary.bounced / summary.sent) * 100 : 0,
      unsubscribeRate: summary.delivered > 0 ? (summary.unsubscribed / summary.delivered) * 100 : 0,
    };

    return {
      ...summary,
      ...rates,
    };
  },
});

// Get analytics in time range
export const getAnalyticsInTimeRange = query({
  args: {
    campaignId: v.id("campaigns"),
    startTime: v.number(),
    endTime: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    // Verify user owns the campaign
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    
    if (!user || campaign.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    return await ctx.db
      .query("analytics")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .filter((q) => 
        q.and(
          q.gte(q.field("timestamp"), args.startTime),
          q.lte(q.field("timestamp"), args.endTime)
        )
      )
      .collect();
  },
});

// Increment metric (public endpoint for tracking)
export const incrementMetric = mutation({
  args: {
    campaignId: v.id("campaigns"),
    metric: v.union(
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("opened"),
      v.literal("clicked"),
      v.literal("bounced"),
      v.literal("unsubscribed")
    ),
    recipientEmail: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { campaignId, metric, recipientEmail, userAgent, ipAddress } = args;
    
    const analyticsId = await ctx.db.insert("analytics", {
      campaignId,
      metric,
      value: 1,
      timestamp: Date.now(),
      metadata: {
        recipientEmail,
        userAgent,
        ipAddress,
      },
    });
    
    return analyticsId;
  },
});

// Get user analytics across all campaigns
export const getUserAnalytics = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    
    if (!user) {
      throw new Error("User not found");
    }

    // First get all campaigns for the user
    const campaigns = await ctx.db
      .query("campaigns")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const campaignIds = campaigns.map(c => c._id);
    
    // Get analytics for all user campaigns
    const allAnalytics = [];
    for (const campaignId of campaignIds) {
      const analytics = await ctx.db
        .query("analytics")
        .withIndex("by_campaign", (q) => q.eq("campaignId", campaignId))
        .collect();
      allAnalytics.push(...analytics);
    }

    // Aggregate totals
    const totals = {
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
      unsubscribed: 0,
    };

    allAnalytics.forEach(entry => {
      totals[entry.metric] += entry.value;
    });

    return totals;
  },
});

// Delete analytics entry
export const deleteAnalyticsEntry = mutation({
  args: { id: v.id("analytics") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const analytics = await ctx.db.get(args.id);
    if (!analytics) {
      throw new Error("Analytics entry not found");
    }
    
    // Verify user owns the campaign
    const campaign = await ctx.db.get(analytics.campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    
    if (!user || campaign.userId !== user._id) {
      throw new Error("Unauthorized");
    }
    
    await ctx.db.delete(args.id);
  },
});

// Get campaign analytics summary
export const getCampaignAnalytics = query({
  args: {
    campaignId: v.id("campaigns"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    // Verify user owns the campaign
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) {
      return null;
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    
    if (!user || campaign.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    // Get all analytics for this campaign
    const analytics = await ctx.db
      .query("analytics")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .collect();

    // Aggregate the metrics
    const summary = {
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
      unsubscribed: 0,
    };

    for (const entry of analytics) {
      summary[entry.metric] += entry.value;
    }

    return summary;
  },
});
