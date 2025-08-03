import { internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

// Create sample notifications for testing
export const createSampleNotifications = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Sample notifications to demonstrate the system
    const sampleNotifications = [
      {
        title: "Welcome to SmartBatch",
        message: "Your account has been successfully set up. Start by creating your first email campaign!",
        type: "success" as const,
        category: "system" as const,
        createdAt: now - (5 * 60 * 1000), // 5 minutes ago
      },
      {
        title: "Campaign Template Available",
        message: "We've created a welcome email template to help you get started with your email campaigns.",
        type: "info" as const,
        category: "system" as const,
        createdAt: now - (2 * 60 * 60 * 1000), // 2 hours ago
      },
      {
        title: "System Maintenance",
        message: "Scheduled maintenance will occur tonight from 2-4 AM EST. No service interruption expected.",
        type: "info" as const,
        category: "system" as const,
        createdAt: now - (6 * 60 * 60 * 1000), // 6 hours ago
      },
    ];

    for (const notification of sampleNotifications) {
      await ctx.db.insert("notifications", {
        userId: args.userId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        category: notification.category,
        read: false,
        createdAt: notification.createdAt,
      });
    }
  },
});

// Check if user has any notifications
export const userHasNotifications = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    
    return !!notifications;
  },
});

// Automatically create sample notifications for new users
export const initializeUserNotifications = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Check if user already has notifications
    const hasNotifications = await ctx.runQuery(internal.notificationSeeder.userHasNotifications, {
      userId: args.userId,
    });
    
    if (!hasNotifications) {
      await ctx.runMutation(internal.notificationSeeder.createSampleNotifications, {
        userId: args.userId,
      });
    }
  },
});
