import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Optimized contact queries with proper pagination and filtering
export const getContactsPaginated = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
    search: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
    sortBy: v.optional(v.string()),
    sortOrder: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 100); // Cap at 100 items
    
    // Use proper index for userId
    let query = ctx.db
      .query("contacts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId));

    // Apply active filter using compound index
    if (args.isActive !== undefined) {
      query = ctx.db
        .query("contacts") 
        .withIndex("by_user_active", (q) => 
          q.eq("userId", args.userId).eq("isActive", args.isActive)
        );
    }

    // Apply cursor-based pagination
    if (args.cursor) {
      query = query.filter((q) => q.gt(q.field("_creationTime"), args.cursor));
    }

    let contacts = await query
      .order(args.sortOrder === "asc" ? "asc" : "desc")
      .take(limit + 1); // Take one extra to determine if there's more

    // Client-side filtering for search (consider moving to server-side search index)
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      contacts = contacts.filter(contact => 
        contact.email.toLowerCase().includes(searchLower) ||
        contact.firstName?.toLowerCase().includes(searchLower) ||
        contact.lastName?.toLowerCase().includes(searchLower) ||
        contact.company?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by tags
    if (args.tags && args.tags.length > 0) {
      contacts = contacts.filter(contact =>
        args.tags!.some(tag => contact.tags.includes(tag))
      );
    }

    const hasMore = contacts.length > limit;
    const items = hasMore ? contacts.slice(0, -1) : contacts;
    const nextCursor = hasMore ? items[items.length - 1]._creationTime : null;

    return {
      items,
      nextCursor,
      hasMore,
      total: items.length // For infinite scroll, we don't need exact total
    };
  }
});

// Optimized campaign queries
export const getCampaignsPaginated = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
    status: v.optional(v.array(v.string())),
    search: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 12, 50);
    
    let query = ctx.db
      .query("campaigns")
      .withIndex("by_user", (q) => q.eq("userId", args.userId));

    // Filter by status using compound index
    if (args.status && args.status.length === 1) {
      query = ctx.db
        .query("campaigns")
        .withIndex("by_user_status", (q) => 
          q.eq("userId", args.userId).eq("status", args.status[0] as any)
        );
    }

    if (args.cursor) {
      query = query.filter((q) => q.gt(q.field("_creationTime"), args.cursor));
    }

    let campaigns = await query
      .order("desc")
      .take(limit + 1);

    // Multi-status filtering (client-side for complex queries)
    if (args.status && args.status.length > 1) {
      campaigns = campaigns.filter(campaign => 
        args.status!.includes(campaign.status)
      );
    }

    // Search filtering
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      campaigns = campaigns.filter(campaign =>
        campaign.name.toLowerCase().includes(searchLower)
      );
    }

    const hasMore = campaigns.length > limit;
    const items = hasMore ? campaigns.slice(0, -1) : campaigns;
    const nextCursor = hasMore ? items[items.length - 1]._creationTime : null;

    return {
      items,
      nextCursor,
      hasMore
    };
  }
});

// Optimized analytics query with caching
export const getCampaignAnalytics = query({
  args: {
    campaignId: v.id("campaigns"),
    timeRange: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Use compound index for efficient email lookup
    const emails = await ctx.db
      .query("emails")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .collect();

    // Aggregate stats efficiently
    let totalSent = 0;
    let totalDelivered = 0;
    let totalOpened = 0;
    let totalClicked = 0;
    let totalBounced = 0;
    let totalUnsubscribed = 0;

    for (const email of emails) {
      totalSent++;
      if (email.status === "delivered") totalDelivered++;
      if (email.analytics?.opened) totalOpened++;
      if (email.analytics?.clicked) totalClicked++;
      if (email.status === "bounced") totalBounced++;
      if (email.analytics?.unsubscribed) totalUnsubscribed++;
    }

    // Calculate rates
    const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
    const openRate = totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0;
    const clickRate = totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0;
    const bounceRate = totalSent > 0 ? (totalBounced / totalSent) * 100 : 0;
    const unsubscribeRate = totalSent > 0 ? (totalUnsubscribed / totalSent) * 100 : 0;

    return {
      sent: totalSent,
      delivered: totalDelivered,
      opened: totalOpened,
      clicked: totalClicked,
      bounced: totalBounced,
      unsubscribed: totalUnsubscribed,
      deliveryRate,
      openRate,
      clickRate,
      bounceRate,
      unsubscribeRate
    };
  }
});

// Optimized template search with ranking
export const getTemplatesRanked = query({
  args: {
    userId: v.id("users"),
    category: v.optional(v.string()),
    search: v.optional(v.string()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 50);
    
    // Use category index for efficient filtering
    let query = args.category
      ? ctx.db
          .query("templates")
          .withIndex("by_user_category", (q) => 
            q.eq("userId", args.userId).eq("category", args.category)
          )
      : ctx.db
          .query("templates")
          .withIndex("by_user", (q) => q.eq("userId", args.userId));

    let templates = await query
      .order("desc")
      .take(limit * 2); // Take more for ranking

    // Search filtering
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      templates = templates.filter(template =>
        template.name.toLowerCase().includes(searchLower) ||
        template.subject?.toLowerCase().includes(searchLower)
      );
    }

    // Rank by usage and performance
    const rankedTemplates = templates
      .map(template => ({
        ...template,
        score: calculateTemplateScore(template)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return rankedTemplates;
  }
});

// Helper function for template scoring
function calculateTemplateScore(template: any): number {
  let score = 0;
  
  // Usage frequency (40% weight)
  score += (template.usageCount || 0) * 0.4;
  
  // Recent usage (30% weight)
  const daysSinceLastUsed = template.lastUsedAt 
    ? (Date.now() - template.lastUsedAt) / (1000 * 60 * 60 * 24)
    : 365;
  score += Math.max(0, (30 - daysSinceLastUsed) / 30) * 0.3;
  
  // Performance metrics (30% weight)
  if (template.analytics) {
    const avgOpenRate = template.analytics.averageOpenRate || 0;
    const avgClickRate = template.analytics.averageClickRate || 0;
    score += (avgOpenRate + avgClickRate) * 0.3;
  }
  
  return score;
}

// Bulk operations with batching
export const bulkUpdateContacts = mutation({
  args: {
    userId: v.id("users"),
    contactIds: v.array(v.id("contacts")),
    updates: v.object({
      tags: v.optional(v.array(v.string())),
      isActive: v.optional(v.boolean()),
      customFields: v.optional(v.any())
    })
  },
  handler: async (ctx, args) => {
    const BATCH_SIZE = 100;
    const batches = [];
    
    // Process in batches to avoid timeouts
    for (let i = 0; i < args.contactIds.length; i += BATCH_SIZE) {
      const batch = args.contactIds.slice(i, i + BATCH_SIZE);
      batches.push(batch);
    }
    
    let updatedCount = 0;
    
    for (const batch of batches) {
      const updatePromises = batch.map(async (contactId) => {
        // Verify ownership
        const contact = await ctx.db.get(contactId);
        if (!contact || contact.userId !== args.userId) {
          return false;
        }
        
        const updateData: any = {
          updatedAt: Date.now()
        };
        
        if (args.updates.tags !== undefined) {
          updateData.tags = args.updates.tags;
        }
        if (args.updates.isActive !== undefined) {
          updateData.isActive = args.updates.isActive;
        }
        if (args.updates.customFields !== undefined) {
          updateData.customFields = {
            ...contact.customFields,
            ...args.updates.customFields
          };
        }
        
        await ctx.db.patch(contactId, updateData);
        return true;
      });
      
      const results = await Promise.allSettled(updatePromises);
      updatedCount += results.filter(r => r.status === "fulfilled" && r.value).length;
    }
    
    return { updatedCount };
  }
});

// Real-time subscription for campaign status
export const subscribeCampaignUpdates = query({
  args: {
    userId: v.id("users"),
    campaignIds: v.optional(v.array(v.id("campaigns")))
  },
  handler: async (ctx, args) => {
    const campaigns = await ctx.db
      .query("campaigns")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    // Filter campaigns if specific IDs are requested
    if (args.campaignIds) {
      return campaigns.filter(c => args.campaignIds!.includes(c._id));
    }
    
    // Otherwise return all campaigns for real-time status tracking
    return campaigns;
  }
});

// Optimized search across multiple entities
export const globalSearch = query({
  args: {
    userId: v.id("users"),
    query: v.string(),
    types: v.optional(v.array(v.string())),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 100);
    const searchLower = args.query.toLowerCase();
    const types = args.types || ["contacts", "campaigns", "templates"];
    
    const results: any[] = [];
    
    // Search contacts
    if (types.includes("contacts")) {
      const contacts = await ctx.db
        .query("contacts")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .take(limit);
      
      contacts
        .filter(contact =>
          contact.email.toLowerCase().includes(searchLower) ||
          contact.firstName?.toLowerCase().includes(searchLower) ||
          contact.lastName?.toLowerCase().includes(searchLower) ||
          contact.company?.toLowerCase().includes(searchLower)
        )
        .slice(0, Math.floor(limit / types.length))
        .forEach(contact => {
          results.push({
            type: "contact",
            id: contact._id,
            title: contact.firstName && contact.lastName 
              ? `${contact.firstName} ${contact.lastName}` 
              : contact.email,
            subtitle: contact.email,
            data: contact
          });
        });
    }
    
    // Search campaigns
    if (types.includes("campaigns")) {
      const campaigns = await ctx.db
        .query("campaigns")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .take(limit);
      
      campaigns
        .filter(campaign =>
          campaign.name.toLowerCase().includes(searchLower)
        )
        .slice(0, Math.floor(limit / types.length))
        .forEach(campaign => {
          results.push({
            type: "campaign",
            id: campaign._id,
            title: campaign.name,
            subtitle: `${campaign.status} • Created ${new Date(campaign.createdAt).toLocaleDateString()}`,
            data: campaign
          });
        });
    }
    
    // Search templates
    if (types.includes("templates")) {
      const templates = await ctx.db
        .query("templates")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .take(limit);
      
      templates
        .filter(template =>
          template.name.toLowerCase().includes(searchLower) ||
          template.subject?.toLowerCase().includes(searchLower)
        )
        .slice(0, Math.floor(limit / types.length))
        .forEach(template => {
          results.push({
            type: "template",
            id: template._id,
            title: template.name,
            subtitle: template.subject || "No subject",
            data: template
          });
        });
    }
    
    return results.slice(0, limit);
  }
});

// Performance metrics collection
export const recordPerformanceMetric = mutation({
  args: {
    userId: v.id("users"),
    metric: v.string(),
    value: v.number(),
    context: v.optional(v.any()),
    timestamp: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("performanceMetrics", {
      userId: args.userId,
      metric: args.metric,
      value: args.value,
      context: args.context,
      timestamp: args.timestamp || Date.now()
    });
  }
});

// Get performance insights
export const getPerformanceInsights = query({
  args: {
    userId: v.id("users"),
    timeRange: v.optional(v.string()),
    metrics: v.optional(v.array(v.string()))
  },
  handler: async (ctx, args) => {
    const timeRange = args.timeRange || "24h";
    const cutoffTime = getCutoffTime(timeRange);
    
    const metrics = await ctx.db
      .query("performanceMetrics")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.gte(q.field("timestamp"), cutoffTime))
      .collect();
    
    // Group and aggregate metrics
    const grouped: Record<string, number[]> = {};
    
    metrics.forEach(metric => {
      if (!args.metrics || args.metrics.includes(metric.metric)) {
        if (!grouped[metric.metric]) {
          grouped[metric.metric] = [];
        }
        grouped[metric.metric].push(metric.value);
      }
    });
    
    // Calculate statistics
    const insights: Record<string, any> = {};
    
    Object.entries(grouped).forEach(([metric, values]) => {
      insights[metric] = {
        count: values.length,
        avg: values.reduce((sum, val) => sum + val, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        latest: values[values.length - 1]
      };
    });
    
    return insights;
  }
});

function getCutoffTime(timeRange: string): number {
  const now = Date.now();
  const timeMap: Record<string, number> = {
    "1h": 60 * 60 * 1000,
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000
  };
  
  return now - (timeMap[timeRange] || timeMap["24h"]);
}
