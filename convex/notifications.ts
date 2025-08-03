import { v } from "convex/values";
import { query, mutation, internalMutation, action } from "./_generated/server";
import { internal } from "./_generated/api";

// Get user notifications
export const getUserNotifications = query({
  args: { 
    limit: v.optional(v.number()),
    unreadOnly: v.optional(v.boolean())
  },
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
    
    let query = ctx.db
      .query("notifications")
      .withIndex("by_user_created_at", (q) => q.eq("userId", user._id))
      .order("desc");
    
    if (args.unreadOnly) {
      query = ctx.db
        .query("notifications")
        .withIndex("by_user_read", (q) => q.eq("userId", user._id).eq("read", false))
        .order("desc");
    }
    
    const notifications = await query.take(args.limit || 20);
    
    return notifications.map(notification => ({
      ...notification,
      time: formatRelativeTime(notification.createdAt),
    }));
  },
});

// Get unread notification count
export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return 0;
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    
    if (!user) {
      return 0;
    }
    
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => q.eq("userId", user._id).eq("read", false))
      .collect();
    
    return unreadNotifications.length;
  },
});

// Mark notification as read
export const markAsRead = mutation({
  args: { notificationId: v.id("notifications") },
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
    
    const notification = await ctx.db.get(args.notificationId);
    if (!notification || notification.userId !== user._id) {
      throw new Error("Notification not found or unauthorized");
    }
    
    await ctx.db.patch(args.notificationId, {
      read: true,
      readAt: Date.now(),
    });
  },
});

// Mark all notifications as read
export const markAllAsRead = mutation({
  args: {},
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
    
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => q.eq("userId", user._id).eq("read", false))
      .collect();
    
    for (const notification of unreadNotifications) {
      await ctx.db.patch(notification._id, {
        read: true,
        readAt: Date.now(),
      });
    }
  },
});

// Delete notification
export const deleteNotification = mutation({
  args: { notificationId: v.id("notifications") },
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
    
    const notification = await ctx.db.get(args.notificationId);
    if (!notification || notification.userId !== user._id) {
      throw new Error("Notification not found or unauthorized");
    }
    
    await ctx.db.delete(args.notificationId);
  },
});

// Delete all notifications
export const deleteAllNotifications = mutation({
  args: {},
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
    
    const allNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    
    for (const notification of allNotifications) {
      await ctx.db.delete(notification._id);
    }
  },
});

// Internal function to create notifications (called from other functions)
export const createNotification = internalMutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    message: v.string(),
    type: v.union(
      v.literal("success"),
      v.literal("info"),
      v.literal("warning"),
      v.literal("error")
    ),
    category: v.union(
      v.literal("campaign"),
      v.literal("contact"),
      v.literal("system"),
      v.literal("alert"),
      v.literal("integration")
    ),
    data: v.optional(v.object({
      campaignId: v.optional(v.id("campaigns")),
      contactCount: v.optional(v.number()),
      alertLevel: v.optional(v.string()),
      integrationId: v.optional(v.id("integrations")),
      url: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("notifications", {
      userId: args.userId,
      title: args.title,
      message: args.message,
      type: args.type,
      category: args.category,
      read: false,
      data: args.data,
      createdAt: Date.now(),
    });
  },
});

// Action to handle campaign completion notifications
export const notifyCampaignCompletion = action({
  args: { campaignId: v.id("campaigns") },
  handler: async (ctx, args) => {
    const campaign = await ctx.runQuery(internal.campaigns.getCampaignById, {
      campaignId: args.campaignId,
    });
    
    if (!campaign) {
      return;
    }
    
    // Get campaign stats
    const emailQueue = await ctx.runQuery(internal.emailQueue.getByCampaign, {
      campaignId: args.campaignId,
    });
    
    const sentCount = emailQueue?.filter(e => e.status === "sent").length || 0;
    
    await ctx.runMutation(internal.notifications.createNotification, {
      userId: campaign.userId,
      title: "Campaign Completed",
      message: `Your "${campaign.name}" campaign has finished sending to ${sentCount} contacts`,
      type: "success",
      category: "campaign",
      data: {
        campaignId: args.campaignId,
        contactCount: sentCount,
      },
    });
  },
});

// Action to handle contact import notifications
export const notifyContactImport = action({
  args: { 
    userId: v.id("users"),
    importedCount: v.number(),
    source: v.string()
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.notifications.createNotification, {
      userId: args.userId,
      title: "Contacts Imported",
      message: `${args.importedCount} new contacts were imported from ${args.source}`,
      type: "success",
      category: "contact",
      data: {
        contactCount: args.importedCount,
      },
    });
  },
});

// Action to handle alert notifications
export const notifyAlert = action({
  args: {
    userId: v.id("users"),
    alertType: v.string(),
    message: v.string(),
    severity: v.union(
      v.literal("info"),
      v.literal("warning"),
      v.literal("error")
    ),
    campaignId: v.optional(v.id("campaigns")),
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.notifications.createNotification, {
      userId: args.userId,
      title: `${args.severity.charAt(0).toUpperCase() + args.severity.slice(1)} Alert`,
      message: args.message,
      type: args.severity === "info" ? "info" : args.severity,
      category: "alert",
      data: {
        alertLevel: args.severity,
        campaignId: args.campaignId,
      },
    });
  },
});

// Utility function to format relative time
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day;
  
  if (diff < minute) {
    return 'Just now';
  } else if (diff < hour) {
    const minutes = Math.floor(diff / minute);
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diff < day) {
    const hours = Math.floor(diff / hour);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diff < week) {
    const days = Math.floor(diff / day);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  } else if (diff < month) {
    const weeks = Math.floor(diff / week);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  } else {
    const months = Math.floor(diff / month);
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  }
}
