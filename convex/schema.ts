import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    createdAt: v.number(),
    subscription: v.object({
      plan: v.string(),
      status: v.string(),
      expiresAt: v.optional(v.number()),
    }),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"]),

  campaigns: defineTable({
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
    createdAt: v.number(),
    settings: v.object({
      subject: v.string(),
      templateId: v.optional(v.id("templates")),
      customContent: v.optional(v.string()),
      targetTags: v.array(v.string()),
      sendDelay: v.optional(v.number()),
      trackOpens: v.boolean(),
      trackClicks: v.boolean(),
    }),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_scheduled_at", ["scheduledAt"]),

  emails: defineTable({
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
  })
    .index("by_campaign", ["campaignId"])
    .index("by_recipient", ["recipient"])
    .index("by_status", ["status"]),

  templates: defineTable({
    userId: v.id("users"),
    name: v.string(),
    subject: v.string(),
    content: v.string(),
    htmlContent: v.optional(v.string()),
    previewText: v.optional(v.string()),
    category: v.string(),
    tags: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    isDefault: v.optional(v.boolean()),
    isPublic: v.optional(v.boolean()),
    variables: v.array(v.string()),
    thumbnail: v.optional(v.string()),
    description: v.optional(v.string()),
    spamScore: v.optional(v.number()),
    usageCount: v.optional(v.number()),
    settings: v.optional(v.object({
      textColor: v.optional(v.string()),
      backgroundColor: v.optional(v.string()),
      fontFamily: v.optional(v.string()),
      fontSize: v.optional(v.string()),
      linkColor: v.optional(v.string()),
      buttonColor: v.optional(v.string()),
    })),
    analytics: v.optional(v.object({
      opens: v.optional(v.number()),
      clicks: v.optional(v.number()),
      conversions: v.optional(v.number()),
      lastUsed: v.optional(v.number()),
    })),
  })
    .index("by_user", ["userId"])
    .index("by_name", ["name"])
    .index("by_category", ["category"])
    .index("by_tags", ["tags"])
    .index("by_public", ["isPublic"])
    .index("by_updated_at", ["updatedAt"]),

  contacts: defineTable({
    userId: v.id("users"),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phone: v.optional(v.string()),
    company: v.optional(v.string()),
    position: v.optional(v.string()),
    tags: v.array(v.string()),
    customFields: v.optional(v.record(v.string(), v.any())),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    isActive: v.boolean(),
    source: v.optional(v.string()),
    lastEngagement: v.optional(v.number()),
    emailStats: v.optional(v.object({
      totalSent: v.number(),
      totalOpened: v.number(),
      totalClicked: v.number(),
      lastOpenedAt: v.optional(v.number()),
      lastClickedAt: v.optional(v.number()),
    })),
  })
    .index("by_user", ["userId"])
    .index("by_email", ["email"])
    .index("by_tags", ["tags"])
    .index("by_company", ["company"])
    .index("by_updated_at", ["updatedAt"])
    .index("by_last_engagement", ["lastEngagement"]),

  contactSegments: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    filters: v.object({
      tags: v.optional(v.array(v.string())),
      companies: v.optional(v.array(v.string())),
      engagementRange: v.optional(v.object({
        min: v.optional(v.number()),
        max: v.optional(v.number()),
      })),
      customFieldFilters: v.optional(v.array(v.object({
        field: v.string(),
        operator: v.string(),
        value: v.string(),
      }))),
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
    contactCount: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_name", ["name"]),

  contactImports: defineTable({
    userId: v.id("users"),
    fileName: v.string(),
    source: v.union(v.literal("csv"), v.literal("google_sheets"), v.literal("api")),
    status: v.union(
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("partial")
    ),
    totalRecords: v.number(),
    successfulImports: v.number(),
    failedImports: v.number(),
    duplicatesSkipped: v.number(),
    errors: v.optional(v.array(v.string())),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_created_at", ["createdAt"]),

  analytics: defineTable({
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
    timestamp: v.number(),
    metadata: v.optional(v.object({
      recipientEmail: v.optional(v.string()),
      userAgent: v.optional(v.string()),
      ipAddress: v.optional(v.string()),
    })),
  })
    .index("by_campaign", ["campaignId"])
    .index("by_metric", ["metric"])
    .index("by_timestamp", ["timestamp"]),
});
