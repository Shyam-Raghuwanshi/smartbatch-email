import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create email
export const createEmail = mutation({
  args: {
    campaignId: v.id("campaigns"),
    recipient: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("opened"),
      v.literal("clicked"),
      v.literal("bounced"),
      v.literal("failed")
    ),
    sentAt: v.optional(v.number()),
    openedAt: v.optional(v.number()),
    clickedAt: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
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

    const emailId = await ctx.db.insert("emails", args);
    return emailId;
  },
});

// Get emails by campaign
export const getEmailsByCampaign = query({
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
      .query("emails")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .collect();
  },
});

// Get email by ID
export const getEmailById = query({
  args: { id: v.id("emails") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const email = await ctx.db.get(args.id);
    if (!email) {
      return null;
    }
    
    // Verify user owns the campaign
    const campaign = await ctx.db.get(email.campaignId);
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
    
    return email;
  },
});

// Update email status
export const updateEmailStatus = mutation({
  args: {
    id: v.id("emails"),
    status: v.union(
      v.literal("pending"),
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("opened"),
      v.literal("clicked"),
      v.literal("bounced"),
      v.literal("failed")
    ),
    sentAt: v.optional(v.number()),
    openedAt: v.optional(v.number()),
    clickedAt: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return id;
  },
});

// Mark email as opened (public endpoint for tracking)
export const markEmailOpened = mutation({
  args: { id: v.id("emails") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "opened",
      openedAt: Date.now(),
    });
  },
});

// Mark email as clicked (public endpoint for tracking)
export const markEmailClicked = mutation({
  args: { id: v.id("emails") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "clicked",
      clickedAt: Date.now(),
    });
  },
});

// Get emails by recipient (authenticated)
export const getEmailsByRecipient = query({
  args: { recipient: v.string() },
  handler: async (ctx, args) => {
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

    // Get all user's campaigns
    const campaigns = await ctx.db
      .query("campaigns")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    
    const campaignIds = campaigns.map(c => c._id);
    
    // Filter emails by recipient for user's campaigns only
    const emails = await ctx.db
      .query("emails")
      .withIndex("by_recipient", (q) => q.eq("recipient", args.recipient))
      .collect();
    
    return emails.filter(email => campaignIds.includes(email.campaignId));
  },
});

// Get emails by status (system function)
export const getEmailsByStatus = query({
  args: { 
    status: v.union(
      v.literal("pending"),
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("opened"),
      v.literal("clicked"),
      v.literal("bounced"),
      v.literal("failed")
    )
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("emails")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();
  },
});

// Delete email
export const deleteEmail = mutation({
  args: { id: v.id("emails") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const email = await ctx.db.get(args.id);
    if (!email) {
      throw new Error("Email not found");
    }
    
    // Verify user owns the campaign
    const campaign = await ctx.db.get(email.campaignId);
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

// Bulk create emails for campaign
export const bulkCreateEmails = mutation({
  args: {
    campaignId: v.id("campaigns"),
    recipients: v.array(v.string()),
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

    const emailIds = [];
    for (const recipient of args.recipients) {
      const emailId = await ctx.db.insert("emails", {
        campaignId: args.campaignId,
        recipient,
        status: "pending",
      });
      emailIds.push(emailId);
    }
    return emailIds;
  },
});
