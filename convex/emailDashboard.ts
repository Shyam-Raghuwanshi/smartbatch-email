import { query, mutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/**
 * Email Dashboard Service
 * Provides comprehensive analytics and monitoring for email operations
 */

/**
 * Get comprehensive email dashboard data
 */
export const getDashboardData: any = query({
  args: {
    timeRange: v.optional(v.string()), // "24h", "7d", "30d", "90d"
  },
  handler: async (ctx: any, args: any): Promise<any> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .filter((q: any) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const timeRange = args.timeRange || "30d";
    const timeRangeMs = getTimeRangeMs(timeRange);
    const startTime = Date.now() - timeRangeMs;

    // Get email statistics
    const emailStats = await getEmailStats(ctx, user._id, startTime);
    
    // Get campaign statistics
    const campaignStats = await getCampaignStats(ctx, user._id, startTime);
    
    // Get recent activity
    const recentActivity = await getRecentActivity(ctx, user._id, 10);
    
    // Get rate limit status
    const rateLimitStatus: any = await ctx.runQuery(internal.rateLimiter.checkRateLimit, {
      userId: user._id,
      emailCount: 0,
    });

    // Get top performing campaigns
    const topCampaigns: any = await getTopPerformingCampaigns(ctx, user._id, startTime);

    // Get email trends (daily breakdown)
    const emailTrends = await getEmailTrends(ctx, user._id, startTime);

    return {
      emailStats,
      campaignStats,
      recentActivity,
      rateLimitStatus,
      topCampaigns,
      emailTrends,
      timeRange,
    };
  },
});

/**
 * Get detailed email analytics for a specific campaign
 */
export const getCampaignAnalytics = internalQuery({
  args: {
    campaignId: v.id("campaigns"),
  },
  handler: async (ctx: any, args: any): Promise<any> => {
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }

    // Get email queue data
    const emails = await ctx.db
      .query("emailQueue")
      .filter((q: any) => q.eq(q.field("campaignId"), args.campaignId))
      .collect();

    // Get tracking events
    const trackingEvents = [];
    for (const email of emails) {
      const events = await ctx.db
        .query("emailTracking")
        .filter((q: any) => q.eq(q.field("emailQueueId"), email._id))
        .collect();
      trackingEvents.push(...events);
    }

    // Calculate metrics
    const totalSent = emails.filter((e: any) => e.status === "sent").length;
    const totalFailed = emails.filter((e: any) => e.status === "failed").length;
    const totalQueued = emails.filter((e: any) => e.status === "queued").length;
    const totalCancelled = emails.filter((e: any) => e.status === "cancelled").length;

    const opens = trackingEvents.filter(e => e.event === "opened");
    const clicks = trackingEvents.filter(e => e.event === "clicked");
    const bounces = trackingEvents.filter(e => e.event === "bounced");
    const deliveries = trackingEvents.filter(e => e.event === "delivered");

    const uniqueOpens = [...new Set(opens.map(e => e.recipient))].length;
    const uniqueClicks = [...new Set(clicks.map(e => e.recipient))].length;

    // Calculate rates
    const openRate = totalSent > 0 ? (uniqueOpens / totalSent) * 100 : 0;
    const clickRate = totalSent > 0 ? (uniqueClicks / totalSent) * 100 : 0;
    const bounceRate = totalSent > 0 ? (bounces.length / totalSent) * 100 : 0;
    const deliveryRate = totalSent > 0 ? (deliveries.length / totalSent) * 100 : 0;

    // Get hourly breakdown for the last 24 hours
    const hourlyBreakdown = getHourlyBreakdown(trackingEvents);

    // Get top performing recipients
    const recipientStats = getRecipientStats(emails, trackingEvents);

    return {
      campaign,
      summary: {
        totalEmails: emails.length,
        totalSent,
        totalFailed,
        totalQueued,
        totalCancelled,
        openRate: Math.round(openRate * 100) / 100,
        clickRate: Math.round(clickRate * 100) / 100,
        bounceRate: Math.round(bounceRate * 100) / 100,
        deliveryRate: Math.round(deliveryRate * 100) / 100,
        uniqueOpens,
        uniqueClicks,
        totalOpens: opens.length,
        totalClicks: clicks.length,
      },
      hourlyBreakdown,
      recipientStats: recipientStats.slice(0, 10), // Top 10
      recentEvents: trackingEvents
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 20),
    };
  },
});

/**
 * Get email performance comparison
 */
export const getEmailPerformanceComparison: any = query({
  args: {
    campaignIds: v.array(v.id("campaigns")),
  },
  handler: async (ctx: any, args: any): Promise<any> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const comparisons = [];

    for (const campaignId of args.campaignIds) {
      const analytics: any = await ctx.runQuery(internal.emailDashboard.getCampaignAnalytics, {
        campaignId,
      });
      
      comparisons.push({
        campaignId,
        campaignName: analytics.campaign.name,
        summary: analytics.summary,
      });
    }

    return comparisons;
  },
});

/**
 * Get unsubscribe analytics
 */
export const getUnsubscribeAnalytics = query({
  args: {
    timeRange: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const timeRange = args.timeRange || "30d";
    const timeRangeMs = getTimeRangeMs(timeRange);
    const startTime = Date.now() - timeRangeMs;

    const unsubscribes = await ctx.db
      .query("unsubscribes")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .filter((q) => q.gte(q.field("unsubscribedAt"), startTime))
      .collect();

    // Group by campaign
    const byCampaign: any = {};
    for (const unsub of unsubscribes) {
      if (unsub.campaignId) {
        const campaign = await ctx.db.get(unsub.campaignId);
        const key = campaign?.name || "Unknown Campaign";
        byCampaign[key] = (byCampaign[key] || 0) + 1;
      }
    }

    // Group by day
    const byDay: any = {};
    for (const unsub of unsubscribes) {
      const day = new Date(unsub.unsubscribedAt).toISOString().split('T')[0];
      byDay[day] = (byDay[day] || 0) + 1;
    }

    return {
      total: unsubscribes.length,
      byCampaign,
      byDay,
      recentUnsubscribes: unsubscribes
        .sort((a, b) => b.unsubscribedAt - a.unsubscribedAt)
        .slice(0, 10),
    };
  },
});

// Helper functions
async function getEmailStats(ctx: any, userId: any, startTime: number) {
  const emails = await ctx.db
    .query("emailQueue")
    .filter((q: any) => q.eq(q.field("userId"), userId))
    .filter((q: any) => q.gte(q.field("createdAt"), startTime))
    .collect();

  const sent = emails.filter((e: any) => e.status === "sent").length;
  const failed = emails.filter((e: any) => e.status === "failed").length;
  const queued = emails.filter((e: any) => e.status === "queued").length;

  return {
    total: emails.length,
    sent,
    failed,
    queued,
    successRate: emails.length > 0 ? (sent / emails.length) * 100 : 0,
  };
}

async function getCampaignStats(ctx: any, userId: any, startTime: number) {
  const campaigns = await ctx.db
    .query("campaigns")
    .filter((q: any) => q.eq(q.field("userId"), userId))
    .filter((q: any) => q.gte(q.field("createdAt"), startTime))
    .collect();

  const active = campaigns.filter((c: any) => c.status === "sending" || c.status === "scheduled").length;
  const completed = campaigns.filter((c: any) => c.status === "sent").length;
  const draft = campaigns.filter((c: any) => c.status === "draft").length;

  return {
    total: campaigns.length,
    active,
    completed,
    draft,
  };
}

async function getRecentActivity(ctx: any, userId: any, limit: number) {
  const recentEmails = await ctx.db
    .query("emailQueue")
    .filter((q: any) => q.eq(q.field("userId"), userId))
    .order("desc")
    .take(limit);

  const recentCampaigns = await ctx.db
    .query("campaigns")
    .filter((q: any) => q.eq(q.field("userId"), userId))
    .order("desc")
    .take(limit);

  return {
    recentEmails,
    recentCampaigns,
  };
}

async function getTopPerformingCampaigns(ctx: any, userId: any, startTime: number): Promise<any> {
  const campaigns = await ctx.db
    .query("campaigns")
    .filter((q: any) => q.eq(q.field("userId"), userId))
    .filter((q: any) => q.gte(q.field("createdAt"), startTime))
    .collect();

  const campaignPerformance = [];

  for (const campaign of campaigns) {
    const analytics: any = await ctx.runQuery(internal.emailDashboard.getCampaignAnalytics, {
      campaignId: campaign._id,
    });
    
    campaignPerformance.push({
      ...campaign,
      analytics: analytics.summary,
    });
  }

  return campaignPerformance
    .sort((a, b) => b.analytics.openRate - a.analytics.openRate)
    .slice(0, 5);
}

async function getEmailTrends(ctx: any, userId: any, startTime: number) {
  const emails = await ctx.db
    .query("emailQueue")
    .filter((q: any) => q.eq(q.field("userId"), userId))
    .filter((q: any) => q.gte(q.field("createdAt"), startTime))
    .collect();

  const dailyStats: any = {};

  for (const email of emails) {
    const day = new Date(email.createdAt).toISOString().split('T')[0];
    if (!dailyStats[day]) {
      dailyStats[day] = { sent: 0, failed: 0, total: 0 };
    }
    
    dailyStats[day].total++;
    if (email.status === "sent") {
      dailyStats[day].sent++;
    } else if (email.status === "failed") {
      dailyStats[day].failed++;
    }
  }

  return Object.entries(dailyStats)
    .map(([date, stats]: any) => ({ date, ...stats }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function getTimeRangeMs(timeRange: string): number {
  switch (timeRange) {
    case "24h": return 24 * 60 * 60 * 1000;
    case "7d": return 7 * 24 * 60 * 60 * 1000;
    case "30d": return 30 * 24 * 60 * 60 * 1000;
    case "90d": return 90 * 24 * 60 * 60 * 1000;
    default: return 30 * 24 * 60 * 60 * 1000;
  }
}

function getHourlyBreakdown(trackingEvents: any[]) {
  const hourlyStats: any = {};
  
  for (const event of trackingEvents) {
    const hour = new Date(event.timestamp).getHours();
    if (!hourlyStats[hour]) {
      hourlyStats[hour] = { opens: 0, clicks: 0 };
    }
    
    if (event.event === "opened") {
      hourlyStats[hour].opens++;
    } else if (event.event === "clicked") {
      hourlyStats[hour].clicks++;
    }
  }

  return Object.entries(hourlyStats)
    .map(([hour, stats]: any) => ({ hour: parseInt(hour), ...stats }))
    .sort((a, b) => a.hour - b.hour);
}

function getRecipientStats(emails: any[], trackingEvents: any[]) {
  const recipientStats: any = {};

  for (const email of emails) {
    if (!recipientStats[email.recipient]) {
      recipientStats[email.recipient] = {
        email: email.recipient,
        sent: 0,
        opens: 0,
        clicks: 0,
        lastActivity: null,
      };
    }
    
    if (email.status === "sent") {
      recipientStats[email.recipient].sent++;
    }
  }

  for (const event of trackingEvents) {
    if (recipientStats[event.recipient]) {
      if (event.event === "opened") {
        recipientStats[event.recipient].opens++;
      } else if (event.event === "clicked") {
        recipientStats[event.recipient].clicks++;
      }
      
      if (!recipientStats[event.recipient].lastActivity || 
          event.timestamp > recipientStats[event.recipient].lastActivity) {
        recipientStats[event.recipient].lastActivity = event.timestamp;
      }
    }
  }

  return Object.values(recipientStats)
    .sort((a: any, b: any) => (b.opens + b.clicks) - (a.opens + a.clicks));
}
