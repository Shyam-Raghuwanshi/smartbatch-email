import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Test function to create sample scheduled campaigns for testing the Schedule page
 */
export const createTestScheduledCampaigns = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    console.log("Creating test scheduled campaigns...");
    
    // Create test campaigns with different statuses and schedule times
    const testCampaigns = [
      {
        name: "Weekly Newsletter - Test",
        status: "scheduled" as const,
        scheduledAt: Date.now() + 30 * 60 * 1000, // 30 minutes from now
        settings: {
          subject: "Weekly Newsletter - Latest Updates",
          customContent: "Hello! Here are this week's updates...",
          targetTags: ["newsletter", "subscribers"],
          sendDelay: 5,
          trackOpens: true,
          trackClicks: true,
        },
        scheduleSettings: {
          type: "scheduled" as const,
          timezone: "America/New_York",
          sendRate: {
            emailsPerHour: 100,
            emailsPerDay: 1000,
            respectTimeZones: true,
          },
        },
      },
      {
        name: "Product Announcement - Test",
        status: "scheduled" as const,
        scheduledAt: Date.now() + 2 * 60 * 60 * 1000, // 2 hours from now
        settings: {
          subject: "Exciting New Product Launch!",
          customContent: "We're thrilled to announce our latest product...",
          targetTags: ["customers", "product-updates"],
          sendDelay: 10,
          trackOpens: true,
          trackClicks: true,
        },
        scheduleSettings: {
          type: "scheduled" as const,
          timezone: "America/New_York",
          sendRate: {
            emailsPerHour: 50,
            emailsPerDay: 500,
            respectTimeZones: true,
          },
        },
      },
      {
        name: "Welcome Series - Part 1 - Test",
        status: "scheduled" as const,
        scheduledAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours from now
        settings: {
          subject: "Welcome to SmartBatch!",
          customContent: "Welcome to SmartBatch! We're excited to have you...",
          targetTags: ["new-users", "welcome-series"],
          sendDelay: 15,
          trackOpens: true,
          trackClicks: true,
        },
        scheduleSettings: {
          type: "scheduled" as const,
          timezone: "America/New_York",
          sendRate: {
            emailsPerHour: 30,
            emailsPerDay: 300,
            respectTimeZones: true,
          },
        },
      },
    ];

    const createdCampaigns = [];
    
    for (const campaignData of testCampaigns) {
      // Create the campaign
      const campaignId = await ctx.db.insert("campaigns", {
        userId: args.userId,
        ...campaignData,
        createdAt: Date.now(),
      });
      
      // Create corresponding schedule entry
      const scheduleId = await ctx.db.insert("campaignSchedules", {
        campaignId,
        userId: args.userId,
        scheduledAt: campaignData.scheduledAt,
        status: "pending",
        recipientCount: Math.floor(Math.random() * 500) + 50, // Random recipient count between 50-550
        createdAt: Date.now(),
      });
      
      createdCampaigns.push({
        campaignId,
        scheduleId,
        name: campaignData.name,
      });
    }
    
    console.log(`Created ${createdCampaigns.length} test scheduled campaigns`);
    return createdCampaigns;
  },
});
