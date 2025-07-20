import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create campaign
export const createCampaign = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("scheduled"),
      v.literal("sending"),
      v.literal("sent"),
      v.literal("paused"),
      v.literal("cancelled")
    ),
    scheduledAt: v.optional(v.number()),
    settings: v.object({
      subject: v.string(),
      templateId: v.optional(v.id("templates")),
      customContent: v.optional(v.string()),
      targetTags: v.array(v.string()),
      sendDelay: v.optional(v.number()),
      trackOpens: v.boolean(),
      trackClicks: v.boolean(),
    }),
  },
  handler: async (ctx, args) => {
    const campaignId = await ctx.db.insert("campaigns", {
      ...args,
      createdAt: Date.now(),
    });
    return campaignId;
  },
});

// Get campaigns by user (authenticated)
export const getCampaignsByUser = query({
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

    return await ctx.db
      .query("campaigns")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

// Get campaign by ID
export const getCampaignById = query({
  args: { id: v.id("campaigns") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const campaign = await ctx.db.get(args.id);
    if (!campaign) {
      return null;
    }
    
    // Verify user owns this campaign
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    
    if (!user || campaign.userId !== user._id) {
      throw new Error("Unauthorized");
    }
    
    return campaign;
  },
});

// Update campaign
export const updateCampaign = mutation({
  args: {
    id: v.id("campaigns"),
    name: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("scheduled"),
      v.literal("sending"),
      v.literal("sent"),
      v.literal("paused"),
      v.literal("cancelled")
    )),
    scheduledAt: v.optional(v.number()),
    settings: v.optional(v.object({
      subject: v.string(),
      templateId: v.optional(v.id("templates")),
      customContent: v.optional(v.string()),
      targetTags: v.array(v.string()),
      sendDelay: v.optional(v.number()),
      trackOpens: v.boolean(),
      trackClicks: v.boolean(),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const campaign = await ctx.db.get(args.id);
    if (!campaign) {
      throw new Error("Campaign not found");
    }
    
    // Verify user owns this campaign
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    
    if (!user || campaign.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return id;
  },
});

// Delete campaign
export const deleteCampaign = mutation({
  args: { id: v.id("campaigns") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const campaign = await ctx.db.get(args.id);
    if (!campaign) {
      throw new Error("Campaign not found");
    }
    
    // Verify user owns this campaign
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

// Get campaigns by status (admin function)
export const getCampaignsByStatus = query({
  args: { 
    status: v.union(
      v.literal("draft"),
      v.literal("scheduled"),
      v.literal("sending"),
      v.literal("sent"),
      v.literal("paused"),
      v.literal("cancelled")
    )
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("campaigns")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();
  },
});

// Get scheduled campaigns (system function)
export const getScheduledCampaigns = query({
  handler: async (ctx) => {
    const now = Date.now();
    return await ctx.db
      .query("campaigns")
      .withIndex("by_scheduled_at")
      .filter((q) => 
        q.and(
          q.eq(q.field("status"), "scheduled"),
          q.lte(q.field("scheduledAt"), now)
        )
      )
      .collect();
  },
});

// Duplicate campaign
export const duplicateCampaign = mutation({
  args: { id: v.id("campaigns") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const originalCampaign = await ctx.db.get(args.id);
    if (!originalCampaign) {
      throw new Error("Campaign not found");
    }
    
    // Verify user owns this campaign
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    
    if (!user || originalCampaign.userId !== user._id) {
      throw new Error("Unauthorized");
    }
    
    // Create duplicate with modified name and draft status
    const duplicatedCampaignId = await ctx.db.insert("campaigns", {
      userId: user._id,
      name: `${originalCampaign.name} (Copy)`,
      status: "draft",
      settings: originalCampaign.settings,
      createdAt: Date.now(),
    });
    
    return duplicatedCampaignId;
  },
});

// Get campaign statistics
export const getCampaignStats = query({
  args: { campaignId: v.id("campaigns") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }
    
    // Verify user owns this campaign
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    
    if (!user || campaign.userId !== user._id) {
      throw new Error("Unauthorized");
    }
    
    // Get emails for this campaign
    const emails = await ctx.db
      .query("emails")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .collect();
    
    // Get analytics for this campaign
    const analytics = await ctx.db
      .query("analytics")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .collect();
    
    // Calculate stats
    const stats = {
      totalEmails: emails.length,
      sent: emails.filter(e => e.status === "sent").length,
      pending: emails.filter(e => e.status === "pending").length,
      failed: emails.filter(e => e.status === "failed").length,
      delivered: analytics.filter(a => a.metric === "delivered").length,
      opened: analytics.filter(a => a.metric === "opened").length,
      clicked: analytics.filter(a => a.metric === "clicked").length,
      bounced: analytics.filter(a => a.metric === "bounced").length,
      unsubscribed: analytics.filter(a => a.metric === "unsubscribed").length,
    };
    
    return {
      ...stats,
      openRate: stats.delivered > 0 ? (stats.opened / stats.delivered * 100) : 0,
      clickRate: stats.delivered > 0 ? (stats.clicked / stats.delivered * 100) : 0,
      bounceRate: stats.sent > 0 ? (stats.bounced / stats.sent * 100) : 0,
    };
  },
});
