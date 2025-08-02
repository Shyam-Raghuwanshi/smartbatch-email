import { query, internalQuery } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get comprehensive analytics dashboard data for a user
 */
export const getDashboardAnalytics = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
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

    // Get user campaigns
    const campaigns = await ctx.db
      .query("campaigns")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const campaignIds = campaigns.map(c => c._id);

    // Get email queue data in date range
    const emails = await ctx.db
      .query("emailQueue")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter(q => q.gte(q.field("createdAt"), args.startDate))
      .filter(q => q.lte(q.field("createdAt"), args.endDate))
      .collect();

    // Get tracking events
    const trackingEvents = [];
    for (const email of emails) {
      const events = await ctx.db
        .query("emailTracking")
        .filter(q => q.eq(q.field("emailQueueId"), email._id))
        .collect();
      trackingEvents.push(...events);
    }

    // Calculate metrics
    const totalSent = emails.filter(e => e.status === "sent").length;
    const totalQueued = emails.filter(e => e.status === "queued").length;
    const totalFailed = emails.filter(e => e.status === "failed").length;
    const totalOpened = trackingEvents.filter(e => e.event === "opened").length;
    const totalClicked = trackingEvents.filter(e => e.event === "clicked").length;

    // Calculate rates
    const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
    const clickRate = totalSent > 0 ? (totalClicked / totalSent) * 100 : 0;
    const deliveryRate = emails.length > 0 ? (totalSent / emails.length) * 100 : 0;
    const failureRate = emails.length > 0 ? (totalFailed / emails.length) * 100 : 0;

    // Get active subscribers
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter(q => q.eq(q.field("isActive"), true))
      .collect();

    // Get campaign metrics
    const campaignMetrics = [];
    for (const campaign of campaigns) {
      const campaignEmails = emails.filter(e => e.campaignId === campaign._id);
      const campaignSent = campaignEmails.filter(e => e.status === "sent").length;
      
      const campaignTrackingEvents = [];
      for (const email of campaignEmails) {
        const events = trackingEvents.filter(e => e.emailQueueId === email._id);
        campaignTrackingEvents.push(...events);
      }
      
      const campaignOpened = campaignTrackingEvents.filter(e => e.event === "opened").length;
      const campaignClicked = campaignTrackingEvents.filter(e => e.event === "clicked").length;
      
      campaignMetrics.push({
        id: campaign._id,
        name: campaign.name,
        status: campaign.status,
        totalSent: campaignSent,
        totalOpened: campaignOpened,
        totalClicked: campaignClicked,
        openRate: campaignSent > 0 ? (campaignOpened / campaignSent) * 100 : 0,
        clickRate: campaignSent > 0 ? (campaignClicked / campaignSent) * 100 : 0,
        createdAt: campaign.createdAt,
      });
    }

    // Recent activity
    const recentEmails = emails
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 10);

    const recentCampaigns = campaigns
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5);

    return {
      overview: {
        totalEmails: emails.length,
        totalSent,
        totalQueued,
        totalFailed,
        totalOpened,
        totalClicked,
        openRate,
        clickRate,
        deliveryRate,
        failureRate,
        totalSubscribers: contacts.length,
        activeCampaigns: campaigns.filter(c => c.status === "sending" || c.status === "scheduled").length,
      },
      campaigns: campaignMetrics,
      recentActivity: {
        emails: recentEmails,
        campaigns: recentCampaigns,
      },
      contacts: {
        total: contacts.length,
        active: contacts.filter(c => c.isActive).length,
        recentlyAdded: contacts.filter(c => c.createdAt >= args.startDate).length,
      }
    };
  },
});

/**
 * Get performance trends over time
 */
export const getPerformanceTrends = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
    granularity: v.union(v.literal("hour"), v.literal("day"), v.literal("week")),
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

    // Get emails in date range
    const emails = await ctx.db
      .query("emailQueue")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter(q => q.gte(q.field("createdAt"), args.startDate))
      .filter(q => q.lte(q.field("createdAt"), args.endDate))
      .collect();

    // Get tracking events
    const trackingEvents = [];
    for (const email of emails) {
      const events = await ctx.db
        .query("emailTracking")
        .filter(q => q.eq(q.field("emailQueueId"), email._id))
        .collect();
      trackingEvents.push(...events);
    }

    // Group data by time period
    const timeGroups = new Map();
    
    // Helper function to get time bucket
    const getTimeBucket = (timestamp: number) => {
      const date = new Date(timestamp);
      switch (args.granularity) {
        case "hour":
          return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()).getTime();
        case "day":
          return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
        case "week":
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          return new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate()).getTime();
        default:
          return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
      }
    };

    // Initialize time buckets
    let current = args.startDate;
    const increment = args.granularity === "hour" ? 3600000 : 
                     args.granularity === "day" ? 86400000 : 
                     604800000; // week

    while (current <= args.endDate) {
      const bucket = getTimeBucket(current);
      if (!timeGroups.has(bucket)) {
        timeGroups.set(bucket, {
          timestamp: bucket,
          sent: 0,
          opened: 0,
          clicked: 0,
          failed: 0,
        });
      }
      current += increment;
    }

    // Group emails by time
    emails.forEach(email => {
      const bucket = getTimeBucket(email.createdAt);
      const group = timeGroups.get(bucket);
      if (group) {
        if (email.status === "sent") group.sent++;
        if (email.status === "failed") group.failed++;
      }
    });

    // Group tracking events by time
    trackingEvents.forEach(event => {
      const bucket = getTimeBucket(event.timestamp);
      const group = timeGroups.get(bucket);
      if (group) {
        if (event.event === "opened") group.opened++;
        if (event.event === "clicked") group.clicked++;
      }
    });

    // Convert to array and calculate rates
    const trends = Array.from(timeGroups.values())
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(group => ({
        ...group,
        openRate: group.sent > 0 ? (group.opened / group.sent) * 100 : 0,
        clickRate: group.sent > 0 ? (group.clicked / group.sent) * 100 : 0,
        date: new Date(group.timestamp).toISOString().split('T')[0],
      }));

    return trends;
  },
});

/**
 * Get campaign comparison data
 */
export const getCampaignComparison = query({
  args: {
    campaignIds: v.optional(v.array(v.id("campaigns"))),
    limit: v.optional(v.number()),
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

    // Get campaigns to compare
    let campaigns;
    if (args.campaignIds && args.campaignIds.length > 0) {
      campaigns = [];
      for (const id of args.campaignIds) {
        const campaign = await ctx.db.get(id);
        if (campaign && campaign.userId === user._id) {
          campaigns.push(campaign);
        }
      }
    } else {
      campaigns = await ctx.db
        .query("campaigns")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .order("desc")
        .take(args.limit || 10);
    }

    // Get metrics for each campaign
    const comparison = [];
    for (const campaign of campaigns) {
      const emails = await ctx.db
        .query("emailQueue")
        .filter(q => q.eq(q.field("campaignId"), campaign._id))
        .collect();

      const sent = emails.filter(e => e.status === "sent").length;
      const failed = emails.filter(e => e.status === "failed").length;

      // Get tracking events
      const trackingEvents = [];
      for (const email of emails) {
        const events = await ctx.db
          .query("emailTracking")
          .filter(q => q.eq(q.field("emailQueueId"), email._id))
          .collect();
        trackingEvents.push(...events);
      }

      const opened = trackingEvents.filter(e => e.event === "opened").length;
      const clicked = trackingEvents.filter(e => e.event === "clicked").length;

      comparison.push({
        id: campaign._id,
        name: campaign.name,
        status: campaign.status,
        createdAt: campaign.createdAt,
        totalEmails: emails.length,
        sent,
        failed,
        opened,
        clicked,
        openRate: sent > 0 ? (opened / sent) * 100 : 0,
        clickRate: sent > 0 ? (clicked / sent) * 100 : 0,
        deliveryRate: emails.length > 0 ? (sent / emails.length) * 100 : 0,
      });
    }

    return comparison.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/**
 * Get audience insights
 */
export const getAudienceInsights = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
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

    // Get all contacts
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Get contacts added in date range
    const newContacts = contacts.filter(c => 
      c.createdAt >= args.startDate && c.createdAt <= args.endDate
    );

    // Get engagement data
    const emails = await ctx.db
      .query("emailQueue")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter(q => q.gte(q.field("createdAt"), args.startDate))
      .filter(q => q.lte(q.field("createdAt"), args.endDate))
      .collect();

    // Calculate engagement by contact
    const contactEngagement = new Map();
    
    for (const email of emails.filter(e => e.status === "sent")) {
      const contact = contactEngagement.get(email.recipient) || {
        email: email.recipient,
        sent: 0,
        opened: 0,
        clicked: 0,
      };
      
      contact.sent++;
      contactEngagement.set(email.recipient, contact);
    }

    // Get tracking events for engagement
    for (const email of emails) {
      const events = await ctx.db
        .query("emailTracking")
        .filter(q => q.eq(q.field("emailQueueId"), email._id))
        .collect();
      
      for (const event of events) {
        const contact = contactEngagement.get(email.recipient);
        if (contact) {
          if (event.event === "opened") contact.opened++;
          if (event.event === "clicked") contact.clicked++;
        }
      }
    }

    // Categorize engagement levels
    const engagementLevels = {
      high: 0,    // >50% open rate
      medium: 0,  // 20-50% open rate
      low: 0,     // 5-20% open rate
      inactive: 0 // <5% open rate or no emails
    };

    contactEngagement.forEach(contact => {
      const openRate = contact.sent > 0 ? (contact.opened / contact.sent) * 100 : 0;
      if (openRate > 50) engagementLevels.high++;
      else if (openRate > 20) engagementLevels.medium++;
      else if (openRate > 5) engagementLevels.low++;
      else engagementLevels.inactive++;
    });

    // Top tags
    const tagCounts = new Map();
    contacts.forEach(contact => {
      contact.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    const topTags = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    return {
      totalContacts: contacts.length,
      activeContacts: contacts.filter(c => c.isActive).length,
      newContacts: newContacts.length,
      growthRate: contacts.length > 0 ? (newContacts.length / contacts.length) * 100 : 0,
      engagementLevels,
      topTags,
      avgEmailsPerContact: contactEngagement.size > 0 ? 
        Array.from(contactEngagement.values()).reduce((sum, c) => sum + c.sent, 0) / contactEngagement.size : 0,
    };
  },
});
