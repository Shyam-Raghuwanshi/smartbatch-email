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
    // Enhanced scheduling features
    scheduleSettings: v.optional(v.object({
      type: v.union(
        v.literal("immediate"),
        v.literal("scheduled"),
        v.literal("recurring"),
        v.literal("optimal")
      ),
      timezone: v.optional(v.string()),
      sendRate: v.optional(v.object({
        emailsPerHour: v.number(),
        emailsPerDay: v.number(),
        respectTimeZones: v.boolean(),
      })),
      recurring: v.optional(v.object({
        pattern: v.union(
          v.literal("daily"),
          v.literal("weekly"), 
          v.literal("monthly")
        ),
        interval: v.number(), // every N days/weeks/months
        daysOfWeek: v.optional(v.array(v.number())), // 0-6 for weekly
        dayOfMonth: v.optional(v.number()), // 1-31 for monthly
        endDate: v.optional(v.number()),
        maxOccurrences: v.optional(v.number()),
      })),
      optimal: v.optional(v.object({
        useEngagementData: v.boolean(),
        useTimeZones: v.boolean(),
        preferredTimeSlots: v.array(v.object({
          startHour: v.number(),
          endHour: v.number(),
        })),
        avoidWeekends: v.boolean(),
        minHoursBetweenSends: v.number(),
      })),
      ispThrottling: v.optional(v.object({
        enabled: v.boolean(),
        rules: v.array(v.object({
          ispDomain: v.string(), // gmail.com, yahoo.com, etc.
          maxPerHour: v.number(),
          maxPerDay: v.number(),
        })),
      })),
    })),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_scheduled_at", ["scheduledAt"]),

  // Campaign schedule instances for recurring campaigns
  campaignSchedules: defineTable({
    campaignId: v.id("campaigns"),
    userId: v.id("users"),
    scheduledAt: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("processed"),
      v.literal("skipped"),
      v.literal("failed")
    ),
    actualSentAt: v.optional(v.number()),
    recipientCount: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_campaign", ["campaignId"])
    .index("by_user", ["userId"])
    .index("by_scheduled_at", ["scheduledAt"])
    .index("by_status", ["status"]),

  // Send rate configurations for different ISPs
  sendRateConfigs: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    globalLimits: v.object({
      emailsPerHour: v.number(),
      emailsPerDay: v.number(),
      maxConcurrent: v.number(),
    }),
    ispLimits: v.array(v.object({
      domain: v.string(),
      emailsPerHour: v.number(),
      emailsPerDay: v.number(),
      delayBetweenEmails: v.number(), // milliseconds
    })),
    isDefault: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_default", ["isDefault"]),

  // Timezone configurations and recipient analysis
  timezoneProfiles: defineTable({
    userId: v.id("users"),
    name: v.string(),
    timezone: v.string(),
    optimalSendTimes: v.array(v.object({
      dayOfWeek: v.number(), // 0-6
      hour: v.number(), // 0-23
      engagementScore: v.number(), // 0-100
    })),
    recipientCount: v.number(),
    lastAnalyzed: v.number(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_timezone", ["timezone"]),

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
    // Enhanced timezone and engagement data for smart scheduling
    timezone: v.optional(v.string()),
    detectedTimezoneProbability: v.optional(v.number()), // 0-1 confidence
    engagementProfile: v.optional(v.object({
      preferredHours: v.array(v.number()), // hours when most engagement occurs
      preferredDays: v.array(v.number()), // days of week (0-6)
      avgResponseTime: v.optional(v.number()), // minutes
      lastCalculated: v.number(),
    })),
    ispDomain: v.optional(v.string()), // gmail.com, yahoo.com, etc.
  })
    .index("by_user", ["userId"])
    .index("by_email", ["email"])
    .index("by_tags", ["tags"])
    .index("by_company", ["company"])
    .index("by_updated_at", ["updatedAt"])
    .index("by_last_engagement", ["lastEngagement"])
    .index("by_timezone", ["timezone"])
    .index("by_isp_domain", ["ispDomain"]),

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

  emailQueue: defineTable({
    userId: v.id("users"),
    campaignId: v.optional(v.id("campaigns")),
    recipient: v.string(),
    subject: v.string(),
    htmlContent: v.string(),
    textContent: v.optional(v.string()),
    fromEmail: v.string(),
    fromName: v.optional(v.string()),
    replyTo: v.optional(v.string()),
    status: v.union(
      v.literal("queued"),
      v.literal("processing"),
      v.literal("sent"),
      v.literal("failed"),
      v.literal("cancelled")
    ),
    priority: v.number(), // 1-10, higher = more important
    scheduledAt: v.optional(v.number()),
    attemptCount: v.number(),
    maxAttempts: v.number(),
    lastAttemptAt: v.optional(v.number()),
    sentAt: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
    resendEmailId: v.optional(v.string()),
    metadata: v.optional(v.object({
      templateId: v.optional(v.id("templates")),
      variables: v.optional(v.record(v.string(), v.any())),
      trackOpens: v.optional(v.boolean()),
      trackClicks: v.optional(v.boolean()),
      unsubscribeToken: v.optional(v.string()),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_campaign", ["campaignId"])
    .index("by_status", ["status"])
    .index("by_scheduled_at", ["scheduledAt"])
    .index("by_priority", ["priority"])
    .index("by_created_at", ["createdAt"]),

  emailTracking: defineTable({
    emailQueueId: v.id("emailQueue"),
    resendEmailId: v.string(),
    recipient: v.string(),
    event: v.union(
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("delivery_delayed"),
      v.literal("complained"),
      v.literal("bounced"),
      v.literal("opened"),
      v.literal("clicked")
    ),
    timestamp: v.number(),
    data: v.optional(v.record(v.string(), v.any())),
    userAgent: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    location: v.optional(v.object({
      country: v.optional(v.string()),
      region: v.optional(v.string()),
      city: v.optional(v.string()),
    })),
  })
    .index("by_email_queue", ["emailQueueId"])
    .index("by_resend_id", ["resendEmailId"])
    .index("by_recipient", ["recipient"])
    .index("by_event", ["event"])
    .index("by_timestamp", ["timestamp"]),

  emailBatches: defineTable({
    userId: v.id("users"),
    campaignId: v.optional(v.id("campaigns")),
    name: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled")
    ),
    totalEmails: v.number(),
    processedEmails: v.number(),
    successfulEmails: v.number(),
    failedEmails: v.number(),
    batchSize: v.number(),
    delayBetweenBatches: v.number(), // milliseconds
    scheduledAt: v.optional(v.number()),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    emailQueueIds: v.array(v.id("emailQueue")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_campaign", ["campaignId"])
    .index("by_status", ["status"])
    .index("by_scheduled_at", ["scheduledAt"])
    .index("by_created_at", ["createdAt"]),

  unsubscribes: defineTable({
    email: v.string(),
    userId: v.id("users"),
    campaignId: v.optional(v.id("campaigns")),
    reason: v.optional(v.string()),
    unsubscribedAt: v.number(),
    token: v.string(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  })
    .index("by_email", ["email"])
    .index("by_user", ["userId"])
    .index("by_campaign", ["campaignId"])
    .index("by_token", ["token"])
    .index("by_unsubscribed_at", ["unsubscribedAt"]),
});
