import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Real-time campaign monitoring queries
export const getCampaignRealTimeStats = query({
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
    
    // Get email queue stats for this campaign
    const queuedEmails = await ctx.db
      .query("emailQueue")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .collect();
    
    // Get real-time analytics
    const analytics = await ctx.db
      .query("analytics")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .collect();
    
    // Get email tracking events
    const emailQueueIds = queuedEmails.map(e => e._id);
    const trackingEvents = [];
    for (const queueId of emailQueueIds) {
      const events = await ctx.db
        .query("emailTracking")
        .withIndex("by_email_queue", (q) => q.eq("emailQueueId", queueId))
        .collect();
      trackingEvents.push(...events);
    }
    
    // Calculate real-time stats
    const now = Date.now();
    const last5Minutes = now - (5 * 60 * 1000);
    const lastHour = now - (60 * 60 * 1000);
    
    const queueStats = {
      total: queuedEmails.length,
      queued: queuedEmails.filter(e => e.status === "queued").length,
      processing: queuedEmails.filter(e => e.status === "processing").length,
      sent: queuedEmails.filter(e => e.status === "sent").length,
      failed: queuedEmails.filter(e => e.status === "failed").length,
      cancelled: queuedEmails.filter(e => e.status === "cancelled").length,
    };
    
    const recentActivity = {
      last5Minutes: {
        sent: queuedEmails.filter(e => e.sentAt && e.sentAt >= last5Minutes).length,
        failed: queuedEmails.filter(e => e.status === "failed" && e.lastAttemptAt && e.lastAttemptAt >= last5Minutes).length,
      },
      lastHour: {
        sent: queuedEmails.filter(e => e.sentAt && e.sentAt >= lastHour).length,
        failed: queuedEmails.filter(e => e.status === "failed" && e.lastAttemptAt && e.lastAttemptAt >= lastHour).length,
      }
    };
    
    const engagementStats = {
      opens: {
        total: trackingEvents.filter(e => e.event === "opened").length,
        last5Minutes: trackingEvents.filter(e => e.event === "opened" && e.timestamp >= last5Minutes).length,
        lastHour: trackingEvents.filter(e => e.event === "opened" && e.timestamp >= lastHour).length,
      },
      clicks: {
        total: trackingEvents.filter(e => e.event === "clicked").length,
        last5Minutes: trackingEvents.filter(e => e.event === "clicked" && e.timestamp >= last5Minutes).length,
        lastHour: trackingEvents.filter(e => e.event === "clicked" && e.timestamp >= lastHour).length,
      },
      bounces: {
        total: trackingEvents.filter(e => e.event === "bounced").length,
        last5Minutes: trackingEvents.filter(e => e.event === "bounced" && e.timestamp >= last5Minutes).length,
        lastHour: trackingEvents.filter(e => e.event === "bounced" && e.timestamp >= lastHour).length,
      },
      complaints: {
        total: trackingEvents.filter(e => e.event === "complained").length,
        last5Minutes: trackingEvents.filter(e => e.event === "complained" && e.timestamp >= last5Minutes).length,
        lastHour: trackingEvents.filter(e => e.event === "complained" && e.timestamp >= lastHour).length,
      }
    };
    
    // Calculate progress and rates
    const progress = queueStats.total > 0 ? ((queueStats.sent + queueStats.failed) / queueStats.total) * 100 : 0;
    const deliveryRate = queueStats.sent > 0 ? ((queueStats.sent - engagementStats.bounces.total) / queueStats.sent) * 100 : 0;
    const openRate = queueStats.sent > 0 ? (engagementStats.opens.total / queueStats.sent) * 100 : 0;
    const clickRate = engagementStats.opens.total > 0 ? (engagementStats.clicks.total / engagementStats.opens.total) * 100 : 0;
    const bounceRate = queueStats.sent > 0 ? (engagementStats.bounces.total / queueStats.sent) * 100 : 0;
    const complaintRate = queueStats.sent > 0 ? (engagementStats.complaints.total / queueStats.sent) * 100 : 0;
    
    // Get sending rate (emails per hour)
    const currentSendingRate = recentActivity.lastHour.sent;
    const estimatedCompletion = queueStats.queued > 0 && currentSendingRate > 0 
      ? now + ((queueStats.queued / currentSendingRate) * 60 * 60 * 1000)
      : null;
    
    return {
      campaignStatus: campaign.status,
      lastUpdated: now,
      progress,
      queueStats,
      recentActivity,
      engagementStats,
      rates: {
        delivery: deliveryRate,
        open: openRate,
        click: clickRate,
        bounce: bounceRate,
        complaint: complaintRate,
      },
      sendingRate: {
        current: currentSendingRate,
        estimatedCompletion,
      },
      health: {
        status: bounceRate > 10 || complaintRate > 0.5 ? "critical" : 
                bounceRate > 5 || complaintRate > 0.1 ? "warning" : "good",
        issues: [
          ...(bounceRate > 10 ? ["High bounce rate"] : []),
          ...(complaintRate > 0.5 ? ["High complaint rate"] : []),
          ...(queueStats.failed > queueStats.sent * 0.1 ? ["High failure rate"] : []),
        ]
      }
    };
  },
});

// Get sending queue status across all campaigns
export const getSendingQueueOverview = query({
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
    
    // Get all email queue items for this user
    const allQueueItems = await ctx.db
      .query("emailQueue")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    
    // Get active campaigns
    const activeCampaigns = await ctx.db
      .query("campaigns")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => 
        q.or(
          q.eq(q.field("status"), "sending"),
          q.eq(q.field("status"), "scheduled")
        )
      )
      .collect();
    
    const now = Date.now();
    const last5Minutes = now - (5 * 60 * 1000);
    
    // Overall queue stats
    const queueOverview = {
      total: allQueueItems.length,
      queued: allQueueItems.filter(e => e.status === "queued").length,
      processing: allQueueItems.filter(e => e.status === "processing").length,
      sent: allQueueItems.filter(e => e.status === "sent").length,
      failed: allQueueItems.filter(e => e.status === "failed").length,
      recentlySent: allQueueItems.filter(e => e.sentAt && e.sentAt >= last5Minutes).length,
    };
    
    // Per-campaign breakdown
    const campaignBreakdown = await Promise.all(
      activeCampaigns.map(async (campaign) => {
        const campaignQueue = allQueueItems.filter(e => e.campaignId === campaign._id);
        return {
          campaignId: campaign._id,
          campaignName: campaign.name,
          status: campaign.status,
          total: campaignQueue.length,
          queued: campaignQueue.filter(e => e.status === "queued").length,
          processing: campaignQueue.filter(e => e.status === "processing").length,
          sent: campaignQueue.filter(e => e.status === "sent").length,
          failed: campaignQueue.filter(e => e.status === "failed").length,
        };
      })
    );
    
    return {
      overview: queueOverview,
      activeCampaigns: campaignBreakdown,
      lastUpdated: now,
    };
  },
});

// Get engagement heatmap data
export const getCampaignEngagementHeatmap = query({
  args: { 
    campaignId: v.id("campaigns"),
    days: v.optional(v.number()) // defaults to 7 days
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
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
    
    const days = args.days || 7;
    const now = Date.now();
    const startTime = now - (days * 24 * 60 * 60 * 1000);
    
    // Get email queue items for this campaign
    const emailQueue = await ctx.db
      .query("emailQueue")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .collect();
    
    // Get tracking events
    const emailQueueIds = emailQueue.map(e => e._id);
    const allTrackingEvents = [];
    
    for (const queueId of emailQueueIds) {
      const events = await ctx.db
        .query("emailTracking")
        .withIndex("by_email_queue", (q) => q.eq("emailQueueId", queueId))
        .filter((q) => q.gte(q.field("timestamp"), startTime))
        .collect();
      allTrackingEvents.push(...events);
    }
    
    // Create heatmap data structure
    const heatmapData = [];
    
    for (let day = 0; day < days; day++) {
      const dayStart = now - ((day + 1) * 24 * 60 * 60 * 1000);
      const dayEnd = now - (day * 24 * 60 * 60 * 1000);
      
      for (let hour = 0; hour < 24; hour++) {
        const hourStart = dayStart + (hour * 60 * 60 * 1000);
        const hourEnd = dayStart + ((hour + 1) * 60 * 60 * 1000);
        
        const hourEvents = allTrackingEvents.filter(e => 
          e.timestamp >= hourStart && e.timestamp < hourEnd
        );
        
        const opens = hourEvents.filter(e => e.event === "opened").length;
        const clicks = hourEvents.filter(e => e.event === "clicked").length;
        const sent = emailQueue.filter(e => 
          e.sentAt && e.sentAt >= hourStart && e.sentAt < hourEnd
        ).length;
        
        heatmapData.push({
          day,
          hour,
          date: new Date(hourStart).toISOString().split('T')[0],
          opens,
          clicks,
          sent,
          engagement: sent > 0 ? (opens + clicks) / sent : 0,
        });
      }
    }
    
    return heatmapData;
  },
});

// Campaign control functions
export const pauseCampaign = mutation({
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
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    
    if (!user || campaign.userId !== user._id) {
      throw new Error("Unauthorized");
    }
    
    if (campaign.status !== "sending") {
      throw new Error("Campaign is not currently sending");
    }
    
    // Update campaign status
    await ctx.db.patch(args.campaignId, { status: "paused" });
    
    // Cancel queued emails
    const queuedEmails = await ctx.db
      .query("emailQueue")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .filter((q) => q.eq(q.field("status"), "queued"))
      .collect();
    
    for (const email of queuedEmails) {
      await ctx.db.patch(email._id, { 
        status: "cancelled",
        updatedAt: Date.now()
      });
    }
    
    return { success: true, pausedEmails: queuedEmails.length };
  },
});

export const resumeCampaign = mutation({
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
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    
    if (!user || campaign.userId !== user._id) {
      throw new Error("Unauthorized");
    }
    
    if (campaign.status !== "paused") {
      throw new Error("Campaign is not paused");
    }
    
    // Update campaign status
    await ctx.db.patch(args.campaignId, { status: "sending" });
    
    // Requeue cancelled emails
    const cancelledEmails = await ctx.db
      .query("emailQueue")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .filter((q) => q.eq(q.field("status"), "cancelled"))
      .collect();
    
    for (const email of cancelledEmails) {
      await ctx.db.patch(email._id, { 
        status: "queued",
        updatedAt: Date.now()
      });
    }
    
    return { success: true, resumedEmails: cancelledEmails.length };
  },
});

export const emergencyStopCampaign = mutation({
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
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    
    if (!user || campaign.userId !== user._id) {
      throw new Error("Unauthorized");
    }
    
    // Update campaign status
    await ctx.db.patch(args.campaignId, { status: "cancelled" });
    
    // Cancel all queued and processing emails
    const activeEmails = await ctx.db
      .query("emailQueue")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .filter((q) => 
        q.or(
          q.eq(q.field("status"), "queued"),
          q.eq(q.field("status"), "processing")
        )
      )
      .collect();
    
    for (const email of activeEmails) {
      await ctx.db.patch(email._id, { 
        status: "cancelled",
        updatedAt: Date.now()
      });
    }
    
    return { success: true, stoppedEmails: activeEmails.length };
  },
});

// Get comparative campaign analytics
export const getComparativeCampaignAnalytics = query({
  args: { 
    campaignIds: v.array(v.id("campaigns")),
    timeRange: v.optional(v.number()) // days to look back, defaults to 30
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
    
    const timeRange = args.timeRange || 30;
    const startTime = Date.now() - (timeRange * 24 * 60 * 60 * 1000);
    
    const comparativeData = [];
    
    for (const campaignId of args.campaignIds) {
      const campaign = await ctx.db.get(campaignId);
      if (!campaign || campaign.userId !== user._id) {
        continue; // Skip unauthorized campaigns
      }
      
      // Get campaign analytics
      const analytics = await ctx.db
        .query("analytics")
        .withIndex("by_campaign", (q) => q.eq("campaignId", campaignId))
        .filter((q) => q.gte(q.field("timestamp"), startTime))
        .collect();
      
      // Get email queue data
      const emailQueue = await ctx.db
        .query("emailQueue")
        .withIndex("by_campaign", (q) => q.eq("campaignId", campaignId))
        .collect();
      
      const stats = {
        sent: emailQueue.filter(e => e.status === "sent").length,
        delivered: analytics.filter(a => a.metric === "delivered").length,
        opened: analytics.filter(a => a.metric === "opened").length,
        clicked: analytics.filter(a => a.metric === "clicked").length,
        bounced: analytics.filter(a => a.metric === "bounced").length,
        unsubscribed: analytics.filter(a => a.metric === "unsubscribed").length,
      };
      
      const rates = {
        deliveryRate: stats.sent > 0 ? (stats.delivered / stats.sent) * 100 : 0,
        openRate: stats.delivered > 0 ? (stats.opened / stats.delivered) * 100 : 0,
        clickRate: stats.delivered > 0 ? (stats.clicked / stats.delivered) * 100 : 0,
        bounceRate: stats.sent > 0 ? (stats.bounced / stats.sent) * 100 : 0,
        unsubscribeRate: stats.delivered > 0 ? (stats.unsubscribed / stats.delivered) * 100 : 0,
      };
      
      comparativeData.push({
        campaignId,
        campaignName: campaign.name,
        status: campaign.status,
        createdAt: campaign.createdAt,
        stats,
        rates,
        targetTags: campaign.settings.targetTags,
        subject: campaign.settings.subject,
      });
    }
    
    return comparativeData;
  },
});

// Get alert triggers
export const getAlertTriggers = query({
  args: { campaignId: v.optional(v.id("campaigns")) },
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
    
    const alerts = [];
    const now = Date.now();
    
    if (args.campaignId) {
      // Check specific campaign
      const campaign = await ctx.db.get(args.campaignId);
      if (!campaign || campaign.userId !== user._id) {
        throw new Error("Campaign not found or unauthorized");
      }
      
      // Get analytics for the campaign to check rates
      const analytics = await ctx.db
        .query("analytics")
        .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId!))
        .filter((q) => q.gte(q.field("timestamp"), Date.now() - (24 * 60 * 60 * 1000))) // Last 24 hours
        .collect();
      
      const emailQueue = await ctx.db
        .query("emailQueue")
        .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId!))
        .collect();
      
      const totalSent = emailQueue.filter(e => e.status === "sent").length;
      const bounces = analytics.filter(a => a.metric === "bounced").length;
      const complaints = analytics.filter(a => a.metric === "unsubscribed").length; // Using unsubscribed as complaints proxy
      
      const bounceRate = totalSent > 0 ? (bounces / totalSent) * 100 : 0;
      const complaintRate = totalSent > 0 ? (complaints / totalSent) * 100 : 0;
      
      // Check for alert conditions
      if (bounceRate > 10) {
        alerts.push({
          type: "critical",
          message: `High bounce rate (${bounceRate.toFixed(1)}%) in campaign "${campaign.name}"`,
          campaignId: args.campaignId,
          timestamp: now,
        });
      }
      
      if (complaintRate > 0.5) {
        alerts.push({
          type: "critical",
          message: `High complaint rate (${complaintRate.toFixed(1)}%) in campaign "${campaign.name}"`,
          campaignId: args.campaignId,
          timestamp: now,
        });
      }
      
      // Check for sending errors
      const failedEmails = emailQueue.filter(e => e.status === "failed").length;
      const errorRate = totalSent > 0 ? (failedEmails / (totalSent + failedEmails)) * 100 : 0;
      
      if (errorRate > 5) {
        alerts.push({
          type: "warning",
          message: `High error rate (${errorRate.toFixed(1)}%) in campaign "${campaign.name}"`,
          campaignId: args.campaignId,
          timestamp: now,
        });
      }
    } else {
      // Check all user campaigns
      const campaigns = await ctx.db
        .query("campaigns")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .filter((q) => 
          q.or(
            q.eq(q.field("status"), "sending"),
            q.eq(q.field("status"), "scheduled")
          )
        )
        .collect();
      
      for (const campaign of campaigns) {
        try {
          // Get analytics for the campaign to check rates
          const analytics = await ctx.db
            .query("analytics")
            .withIndex("by_campaign", (q) => q.eq("campaignId", campaign._id))
            .filter((q) => q.gte(q.field("timestamp"), Date.now() - (24 * 60 * 60 * 1000))) // Last 24 hours
            .collect();
          
          const emailQueue = await ctx.db
            .query("emailQueue")
            .withIndex("by_campaign", (q) => q.eq("campaignId", campaign._id))
            .collect();
          
          const totalSent = emailQueue.filter(e => e.status === "sent").length;
          const bounces = analytics.filter(a => a.metric === "bounced").length;
          const complaints = analytics.filter(a => a.metric === "unsubscribed").length; // Using unsubscribed as complaints proxy
          
          const bounceRate = totalSent > 0 ? (bounces / totalSent) * 100 : 0;
          const complaintRate = totalSent > 0 ? (complaints / totalSent) * 100 : 0;
          
          if (bounceRate > 10) {
            alerts.push({
              type: "critical",
              message: `High bounce rate (${bounceRate.toFixed(1)}%) in campaign "${campaign.name}"`,
              campaignId: campaign._id,
              timestamp: now,
            });
          }
          
          if (complaintRate > 0.5) {
            alerts.push({
              type: "critical",
              message: `High complaint rate (${complaintRate.toFixed(1)}%) in campaign "${campaign.name}"`,
              campaignId: campaign._id,
              timestamp: now,
            });
          }
          
          // Check for sending errors
          const failedEmails = emailQueue.filter(e => e.status === "failed").length;
          const errorRate = totalSent > 0 ? (failedEmails / (totalSent + failedEmails)) * 100 : 0;
          
          if (errorRate > 5) {
            alerts.push({
              type: "warning",
              message: `High error rate (${errorRate.toFixed(1)}%) in campaign "${campaign.name}"`,
              campaignId: campaign._id,
              timestamp: now,
            });
          }
        } catch (error) {
          // Skip campaigns that can't be checked
          console.warn(`Failed to check campaign ${campaign._id}:`, error);
        }
      }
    }
    
    return alerts;
  },
});
