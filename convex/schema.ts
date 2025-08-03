import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    createdAt: v.number(),
    tokenIdentifier: v.optional(v.string()), // Added for existing data compatibility
    subscription: v.object({
      plan: v.string(),
      status: v.string(),
      expiresAt: v.optional(v.number()),
    }),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"]),

  // Email Settings - Resend email service configuration
  emailSettings: defineTable({
    userId: v.id("users"),
    name: v.string(), // "Primary Email", "Marketing Email", etc.
    provider: v.literal("resend"), // Only support Resend
    configuration: v.object({
      apiKey: v.string(), // Encrypted API key
      domain: v.string(), // Custom domain like "yourdomain.com"
      defaultFromName: v.string(), // Default sender name
      defaultFromEmail: v.string(), // Default from email like "noreply@yourdomain.com"
      replyToEmail: v.optional(v.string()),
    }),
    isDefault: v.boolean(), // Primary email configuration
    isActive: v.boolean(),
    verificationStatus: v.object({
      domainVerified: v.boolean(),
      dkimSetup: v.boolean(),
      spfSetup: v.boolean(),
      dmarcSetup: v.boolean(),
      lastVerified: v.optional(v.number()),
    }),
    customFromAddresses: v.array(v.object({
      name: v.string(), // "Support", "Marketing", "Welcome", etc.
      email: v.string(), // "support@yourdomain.com"
      description: v.optional(v.string()),
      isDefault: v.boolean(),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_default", ["userId", "isDefault"])
    .index("by_user_active", ["userId", "isActive"]),

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
      // Email configuration for this campaign
      emailConfig: v.optional(v.object({
        emailSettingsId: v.optional(v.id("emailSettings")), // Use specific email config
        customFromName: v.optional(v.string()), // Override from name for this campaign
        customFromEmail: v.optional(v.string()), // Override from email for this campaign
        replyToEmail: v.optional(v.string()), // Custom reply-to for this campaign
      })),
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
    .index("by_user_status", ["userId", "status"])
    .index("by_user_created", ["userId", "createdAt"])
    .index("by_status", ["status"])
    .index("by_scheduled_at", ["scheduledAt"])
    .index("by_created_at", ["createdAt"]),

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
    .index("by_campaign_status", ["campaignId", "status"])
    .index("by_recipient", ["recipient"])
    .index("by_status", ["status"])
    .index("by_sent_at", ["sentAt"])
    .index("by_opened_at", ["openedAt"])
    .index("by_clicked_at", ["clickedAt"]),

  templates: defineTable({
    userId: v.optional(v.id("users")), // Optional for global/system templates
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
    .index("by_user_category", ["userId", "category"])
    .index("by_user_updated", ["userId", "updatedAt"])
    .index("by_name", ["name"])
    .index("by_category", ["category"])
    .index("by_tags", ["tags"])
    .index("by_public", ["isPublic"])
    .index("by_updated_at", ["updatedAt"])
    .index("by_usage_count", ["usageCount"]),

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
    .index("by_user_active", ["userId", "isActive"])
    .index("by_user_created", ["userId", "createdAt"])
    .index("by_user_engagement", ["userId", "lastEngagement"])
    .index("by_email", ["email"])
    .index("by_tags", ["tags"])
    .index("by_company", ["company"])
    .index("by_updated_at", ["updatedAt"])
    .index("by_last_engagement", ["lastEngagement"])
    .index("by_timezone", ["timezone"])
    .index("by_isp_domain", ["ispDomain"])
    .index("by_source", ["source"]),

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
      // A/B testing metadata
      abTestId: v.optional(v.id("abTests")),
      variantId: v.optional(v.id("abTestVariants")),
      // Email configuration metadata
      emailSettingsId: v.optional(v.id("emailSettings")),
      originalFromName: v.optional(v.string()),
      originalFromEmail: v.optional(v.string()),
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

  // A/B Testing System
  abTests: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    type: v.union(
      v.literal("subject_line"),
      v.literal("content"),
      v.literal("send_time"),
      v.literal("from_name"),
      v.literal("multivariate")
    ),
    status: v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("paused"),
      v.literal("cancelled")
    ),
    testConfiguration: v.object({
      // Test audience settings
      audienceSettings: v.object({
        totalAudience: v.number(),
        testPercentage: v.number(), // 10-50% of audience for testing
        segmentFilters: v.object({
          tags: v.optional(v.array(v.string())),
          companies: v.optional(v.array(v.string())),
          engagementRange: v.optional(v.object({
            min: v.optional(v.number()),
            max: v.optional(v.number()),
          })),
        }),
      }),
      // Success metrics
      successMetrics: v.object({
        primary: v.union(
          v.literal("open_rate"),
          v.literal("click_rate"),
          v.literal("conversion_rate"),
          v.literal("revenue"),
          v.literal("engagement_time")
        ),
        secondary: v.optional(v.array(v.union(
          v.literal("open_rate"),
          v.literal("click_rate"),
          v.literal("conversion_rate"),
          v.literal("revenue"),
          v.literal("engagement_time"),
          v.literal("unsubscribe_rate")
        ))),
        conversionGoal: v.optional(v.object({
          url: v.string(),
          value: v.optional(v.number()),
        })),
      }),
      // Statistical settings
      statisticalSettings: v.object({
        confidenceLevel: v.number(), // 90, 95, 99
        minimumDetectableEffect: v.number(), // 5-50%
        testDuration: v.object({
          type: v.union(v.literal("fixed"), v.literal("sequential")),
          maxDays: v.number(),
          minSampleSize: v.number(),
        }),
        automaticWinner: v.boolean(),
        winnerSelectionCriteria: v.optional(v.object({
          significanceThreshold: v.number(),
          minimumImprovement: v.number(),
        })),
      }),
      // Bayesian optimization settings
      bayesianSettings: v.optional(v.object({
        enabled: v.boolean(),
        priorBelief: v.object({
          expectedLift: v.number(),
          confidence: v.number(),
        }),
        dynamicAllocation: v.boolean(),
        explorationRate: v.number(),
      })),
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    winnerDeclaredAt: v.optional(v.number()),
    winningVariantId: v.optional(v.id("abTestVariants")),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_type", ["type"])
    .index("by_created_at", ["createdAt"]),

  abTestVariants: defineTable({
    testId: v.id("abTests"),
    name: v.string(),
    isControl: v.boolean(),
    trafficAllocation: v.number(), // percentage of test audience
    // Campaign configuration for this variant
    campaignConfig: v.object({
      subject: v.string(),
      templateId: v.optional(v.id("templates")),
      customContent: v.optional(v.string()),
      fromName: v.optional(v.string()),
      fromEmail: v.optional(v.string()),
      sendTime: v.optional(v.object({
        type: v.union(v.literal("immediate"), v.literal("scheduled"), v.literal("optimal")),
        scheduledAt: v.optional(v.number()),
        timezone: v.optional(v.string()),
      })),
      // Multivariate specific settings
      multivariateElements: v.optional(v.object({
        subjectLineVariants: v.optional(v.array(v.string())),
        contentVariants: v.optional(v.array(v.string())),
        ctaVariants: v.optional(v.array(v.string())),
        imageVariants: v.optional(v.array(v.string())),
      })),
    }),
    // Results tracking
    assignedRecipients: v.array(v.string()),
    campaignId: v.optional(v.id("campaigns")),
    createdAt: v.number(),
  })
    .index("by_test", ["testId"])
    .index("by_campaign", ["campaignId"]),

  abTestResults: defineTable({
    testId: v.id("abTests"),
    variantId: v.id("abTestVariants"),
    // Raw metrics
    metrics: v.object({
      sent: v.number(),
      delivered: v.number(),
      opened: v.number(),
      clicked: v.number(),
      conversions: v.number(),
      revenue: v.optional(v.number()),
      unsubscribes: v.number(),
      bounces: v.number(),
    }),
    // Calculated rates
    rates: v.object({
      deliveryRate: v.number(),
      openRate: v.number(),
      clickRate: v.number(),
      conversionRate: v.number(),
      unsubscribeRate: v.number(),
      bounceRate: v.number(),
    }),
    // Statistical analysis
    statisticalAnalysis: v.object({
      sampleSize: v.number(),
      confidenceInterval: v.object({
        lower: v.number(),
        upper: v.number(),
        metric: v.string(), // which metric this CI is for
      }),
      pValue: v.optional(v.number()),
      statisticalSignificance: v.boolean(),
      lift: v.optional(v.number()), // compared to control
      liftConfidenceInterval: v.optional(v.object({
        lower: v.number(),
        upper: v.number(),
      })),
    }),
    // Bayesian analysis
    bayesianAnalysis: v.optional(v.object({
      posteriorProbability: v.number(),
      expectedLoss: v.number(),
      probabilityToBeBest: v.number(),
      credibleInterval: v.object({
        lower: v.number(),
        upper: v.number(),
      }),
    })),
    updatedAt: v.number(),
  })
    .index("by_test", ["testId"])
    .index("by_variant", ["variantId"])
    .index("by_updated_at", ["updatedAt"]),

  abTestSegments: defineTable({
    testId: v.id("abTests"),
    recipientEmail: v.string(),
    variantId: v.id("abTestVariants"),
    assignedAt: v.number(),
    // Tracking individual recipient journey
    events: v.optional(v.array(v.object({
      type: v.union(
        v.literal("assigned"),
        v.literal("sent"),
        v.literal("delivered"),
        v.literal("opened"),
        v.literal("clicked"),
        v.literal("converted"),
        v.literal("unsubscribed"),
        v.literal("bounced"),
        v.literal("complained")
      ),
      timestamp: v.number(),
      metadata: v.optional(v.record(v.string(), v.any())),
    }))),
  })
    .index("by_test", ["testId"])
    .index("by_variant", ["variantId"])
    .index("by_recipient", ["recipientEmail"]),

  abTestInsights: defineTable({
    testId: v.id("abTests"),
    insightType: v.union(
      v.literal("winner_declared"),
      v.literal("early_trend"),
      v.literal("statistical_significance"),
      v.literal("anomaly_detected"),
      v.literal("recommendation")
    ),
    title: v.string(),
    description: v.string(),
    severity: v.union(
      v.literal("info"),
      v.literal("warning"),
      v.literal("critical")
    ),
    data: v.optional(v.record(v.string(), v.any())),
    actionRequired: v.optional(v.boolean()),
    createdAt: v.number(),
  })
    .index("by_test", ["testId"])
    .index("by_type", ["insightType"])
    .index("by_severity", ["severity"])
    .index("by_created_at", ["createdAt"]),

  // External Integrations System
  integrations: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("google_sheets"),
      v.literal("zapier"),
      v.literal("webhook"),
      v.literal("salesforce"),
      v.literal("hubspot"),
      v.literal("mailchimp"),
      v.literal("api_key"),
      v.literal("api_endpoint"),
      v.literal("custom")
    ),
    name: v.string(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("connected"),
      v.literal("disconnected"),
      v.literal("error"),
      v.literal("pending"),
      v.literal("configuring"),
      v.literal("active")
    ),
    configuration: v.object({
      // OAuth credentials (encrypted)
      accessToken: v.optional(v.string()),
      refreshToken: v.optional(v.string()),
      expiresAt: v.optional(v.number()),
      // API credentials
      apiKey: v.optional(v.string()),
      apiSecret: v.optional(v.string()),
      // Webhook configuration
      webhookUrl: v.optional(v.string()),
      webhookSecret: v.optional(v.string()),
      // Google Sheets specific
      spreadsheetId: v.optional(v.string()),
      sheetName: v.optional(v.string()),
      columnMapping: v.optional(v.record(v.string(), v.string())),
      integrationId: v.optional(v.string()),
      title: v.optional(v.string()),
      sheets: v.optional(v.array(v.object({
        sheetId: v.number(),
        title: v.string(),
      }))),
      // Zapier specific
      zapierHookUrl: v.optional(v.string()),
      // API endpoint specific
      apiEndpoint: v.optional(v.string()),
      headers: v.optional(v.record(v.string(), v.string())),
      // Custom fields
      customConfig: v.optional(v.record(v.string(), v.any())),
    }),
    permissions: v.array(v.union(
      v.literal("read_contacts"),
      v.literal("write_contacts"),
      v.literal("trigger_campaigns"),
      v.literal("read_analytics"),
      v.literal("webhook_events")
    )),
    lastSyncAt: v.optional(v.number()),
    lastHealthCheck: v.optional(v.number()),
    healthStatus: v.union(
      v.literal("healthy"),
      v.literal("warning"),
      v.literal("error"),
      v.literal("unknown")
    ),
    errorMessage: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_type", ["type"])
    .index("by_status", ["status"])
    .index("by_health", ["healthStatus"])
    .index("by_created_at", ["createdAt"]),

  integrationPollingSettings: defineTable({
    userId: v.id("users"),
    integrationId: v.id("integrations"),
    enabled: v.boolean(),
    frequency: v.union(
      v.literal("15min"),
      v.literal("30min"),
      v.literal("hourly"),
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("custom")
    ),
    intervalMinutes: v.number(), // For custom intervals
    lastPolledAt: v.optional(v.number()),
    nextPollAt: v.optional(v.number()),
    timezone: v.optional(v.string()),
    retryCount: v.optional(v.number()),
    maxRetries: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_integration", ["integrationId"])
    .index("by_next_poll", ["nextPollAt"])
    .index("by_enabled", ["enabled"]),

  integrationSyncs: defineTable({
    userId: v.id("users"),
    integrationId: v.id("integrations"),
    type: v.union(
      v.literal("contacts_import"),
      v.literal("contacts_export"),
      v.literal("bidirectional_sync"),
      v.literal("campaign_trigger"),
      v.literal("analytics_export"),
      v.literal("webhook_delivery")
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled")
    ),
    direction: v.union(
      v.literal("inbound"),
      v.literal("outbound"),
      v.literal("bidirectional")
    ),
    data: v.object({
      // Source and destination info
      source: v.object({
        type: v.string(),
        identifier: v.optional(v.string()),
        recordCount: v.optional(v.number()),
      }),
      destination: v.object({
        type: v.string(),
        identifier: v.optional(v.string()),
      }),
      // Processing stats
      totalRecords: v.optional(v.number()),
      processedRecords: v.optional(v.number()),
      successfulRecords: v.optional(v.number()),
      failedRecords: v.optional(v.number()),
      duplicatesSkipped: v.optional(v.number()),
      // Integration-specific stats
      recordsCreated: v.optional(v.number()),
      recordsUpdated: v.optional(v.number()),
      recordsDeleted: v.optional(v.number()),
      errorCount: v.optional(v.number()),
      // Error tracking
      errors: v.optional(v.array(v.object({
        record: v.optional(v.string()),
        error: v.string(),
        timestamp: v.number(),
      }))),
      // Custom sync data
      metadata: v.optional(v.record(v.string(), v.any())),
    }),
    scheduledAt: v.optional(v.number()),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    progress: v.number(), // 0-100
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_integration", ["integrationId"])
    .index("by_type", ["type"])
    .index("by_status", ["status"])
    .index("by_created_at", ["createdAt"]),

  webhookEndpoints: defineTable({
    userId: v.id("users"),
    integrationId: v.optional(v.id("integrations")),
    name: v.string(),
    url: v.string(),
    method: v.union(v.literal("GET"), v.literal("POST"), v.literal("PUT"), v.literal("DELETE")),
    isActive: v.boolean(),
    events: v.array(v.union(
      v.literal("contact_created"),
      v.literal("contact_updated"),
      v.literal("campaign_sent"),
      v.literal("email_opened"),
      v.literal("email_clicked"),
      v.literal("unsubscribe"),
      v.literal("bounce"),
      v.literal("ab_test_complete")
    )),
    headers: v.optional(v.record(v.string(), v.string())),
    authentication: v.optional(v.object({
      type: v.union(v.literal("bearer"), v.literal("basic"), v.literal("api_key"), v.literal("none")),
      credentials: v.optional(v.record(v.string(), v.string())),
    })),
    retryPolicy: v.object({
      maxRetries: v.number(),
      retryDelay: v.number(), // milliseconds
      exponentialBackoff: v.boolean(),
    }),
    lastTriggered: v.optional(v.number()),
    successCount: v.number(),
    failureCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_integration", ["integrationId"])
    .index("by_active", ["isActive"])
    .index("by_created_at", ["createdAt"]),

  webhookLogs: defineTable({
    userId: v.id("users"),
    webhookEndpointId: v.id("webhookEndpoints"),
    event: v.string(),
    payload: v.record(v.string(), v.any()),
    response: v.optional(v.object({
      status: v.number(),
      headers: v.optional(v.record(v.string(), v.string())),
      body: v.optional(v.string()),
      responseTime: v.number(), // milliseconds
    })),
    success: v.boolean(),
    error: v.optional(v.string()),
    attempt: v.number(),
    timestamp: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_webhook", ["webhookEndpointId"])
    .index("by_event", ["event"])
    .index("by_success", ["success"])
    .index("by_timestamp", ["timestamp"]),

  workflows: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    isActive: v.boolean(),
    trigger: v.object({
      type: v.union(
        v.literal("webhook"),
        v.literal("schedule"),
        v.literal("contact_added"),
        v.literal("tag_added"),
        v.literal("email_event"),
        v.literal("integration_sync"),
        v.literal("custom")
      ),
      configuration: v.record(v.string(), v.any()),
    }),
    actions: v.array(v.object({
      type: v.union(
        v.literal("send_email"),
        v.literal("add_tag"),
        v.literal("update_contact"),
        v.literal("create_campaign"),
        v.literal("webhook_call"),
        v.literal("integration_sync"),
        v.literal("delay"),
        v.literal("conditional"),
        v.literal("custom")
      ),
      configuration: v.record(v.string(), v.any()),
      conditions: v.optional(v.array(v.object({
        field: v.string(),
        operator: v.union(
          v.literal("equals"),
          v.literal("not_equals"),
          v.literal("contains"),
          v.literal("not_contains"),
          v.literal("greater_than"),
          v.literal("less_than"),
          v.literal("exists"),
          v.literal("not_exists")
        ),
        value: v.any(),
      }))),
      order: v.number(),
    })),
    executionCount: v.number(),
    lastExecuted: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_active", ["isActive"])
    .index("by_trigger_type", ["trigger.type"])
    .index("by_created_at", ["createdAt"]),

  workflowExecutions: defineTable({
    userId: v.id("users"),
    workflowId: v.id("workflows"),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled")
    ),
    triggerData: v.record(v.string(), v.any()),
    executionData: v.array(v.object({
      actionType: v.string(),
      status: v.union(v.literal("pending"), v.literal("completed"), v.literal("failed")),
      result: v.optional(v.any()),
      error: v.optional(v.string()),
      executedAt: v.optional(v.number()),
    })),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    error: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_workflow", ["workflowId"])
    .index("by_status", ["status"])
    .index("by_started_at", ["startedAt"]),

  apiKeys: defineTable({
    userId: v.id("users"),
    name: v.string(),
    keyHash: v.string(), // hashed version for security
    prefix: v.string(), // first 8 chars for identification
    permissions: v.array(v.union(
      v.literal("read_contacts"),
      v.literal("write_contacts"),
      v.literal("read_campaigns"),
      v.literal("write_campaigns"),
      v.literal("read_analytics"),
      v.literal("send_emails"),
      v.literal("manage_webhooks"),
      v.literal("manage_integrations")
    )),
    isActive: v.boolean(),
    expiresAt: v.optional(v.number()),
    lastUsed: v.optional(v.number()),
    usageCount: v.number(),
    rateLimitConfig: v.optional(v.object({
      requestsPerMinute: v.number(),
      requestsPerHour: v.number(),
      requestsPerDay: v.number(),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_key_hash", ["keyHash"])
    .index("by_prefix", ["prefix"])
    .index("by_active", ["isActive"])
    .index("by_created_at", ["createdAt"]),

  // OAuth states for secure OAuth flows
  oauthStates: defineTable({
    provider: v.string(), // google, salesforce, hubspot, microsoft
    state: v.string(), // CSRF protection state parameter
    redirectUri: v.string(),
    expiresAt: v.number(),
    used: v.boolean(),
    usedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_state", ["state"])
    .index("by_provider", ["provider"])
    .index("by_expires_at", ["expiresAt"])
    .index("by_used", ["used"]),

  // Email triggers for automated workflows
  emailTriggers: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    triggerType: v.union(
      v.literal("contact_created"),
      v.literal("contact_updated"),
      v.literal("tag_added"),
      v.literal("tag_removed"),
      v.literal("field_changed"),
      v.literal("email_opened"),
      v.literal("email_clicked"),
      v.literal("link_clicked"),
      v.literal("form_submitted"),
      v.literal("date_reached"),
      v.literal("inactivity_period"),
      v.literal("score_threshold"),
      v.literal("custom_event")
    ),
    conditions: v.object({
      tags: v.optional(v.object({
        include: v.optional(v.array(v.string())),
        exclude: v.optional(v.array(v.string())),
        operation: v.optional(v.union(v.literal("any"), v.literal("all")))
      })),
      fields: v.optional(v.array(v.object({
        field: v.string(),
        operator: v.union(
          v.literal("equals"),
          v.literal("not_equals"),
          v.literal("contains"),
          v.literal("not_contains"),
          v.literal("starts_with"),
          v.literal("ends_with"),
          v.literal("greater_than"),
          v.literal("less_than"),
          v.literal("is_empty"),
          v.literal("is_not_empty")
        ),
        value: v.optional(v.string())
      }))),
      timing: v.optional(v.object({
        delay: v.optional(v.number()),
        timeWindow: v.optional(v.object({
          start: v.string(),
          end: v.string(),
          timezone: v.string(),
          daysOfWeek: v.optional(v.array(v.number()))
        })),
        dateCondition: v.optional(v.object({
          field: v.string(),
          daysAfter: v.optional(v.number()),
          daysBefore: v.optional(v.number())
        }))
      })),
      engagement: v.optional(v.object({
        emailsOpened: v.optional(v.number()),
        emailsClicked: v.optional(v.number()),
        lastActivity: v.optional(v.number()),
        scoreRange: v.optional(v.object({
          min: v.optional(v.number()),
          max: v.optional(v.number())
        }))
      }))
    }),
    emailTemplate: v.object({
      templateId: v.optional(v.id("templates")),
      subject: v.string(),
      content: v.string(),
      personalizeFields: v.optional(v.array(v.string()))
    }),
    isActive: v.boolean(),
    priority: v.optional(v.number()),
    maxSendsPerContact: v.optional(v.number()),
    cooldownPeriod: v.optional(v.number()),
    statistics: v.object({
      totalTriggers: v.number(),
      totalSent: v.number(),
      totalOpened: v.number(),
      totalClicked: v.number(),
      lastTriggered: v.number()
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_trigger_type", ["triggerType"])
    .index("by_active", ["isActive"])
    .index("by_priority", ["priority"])
    .index("by_created_at", ["createdAt"]),

  // Scheduled triggered emails
  triggeredEmails: defineTable({
    triggerId: v.id("emailTriggers"),
    contactId: v.id("contacts"),
    scheduledAt: v.number(),
    sentAt: v.optional(v.number()),
    status: v.union(
      v.literal("scheduled"),
      v.literal("sent"),
      v.literal("failed"),
      v.literal("cancelled")
    ),
    error: v.optional(v.string()),
    messageId: v.optional(v.string()),
    attempts: v.number(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_trigger", ["triggerId"])
    .index("by_contact", ["contactId"])
    .index("by_scheduled_at", ["scheduledAt"])
    .index("by_status", ["status"])
    .index("by_sent_at", ["sentAt"]),

  // Event-driven campaigns
  eventCampaigns: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    eventTriggers: v.array(v.object({
      eventType: v.string(),
      conditions: v.any(),
      delay: v.optional(v.number()),
      priority: v.optional(v.number())
    })),
    campaignFlow: v.object({
      emails: v.array(v.object({
        id: v.string(),
        delay: v.number(),
        template: v.object({
          templateId: v.optional(v.id("templates")),
          subject: v.string(),
          content: v.string(),
          personalizeFields: v.optional(v.array(v.string()))
        }),
        conditions: v.optional(v.any()),
        actions: v.optional(v.array(v.any()))
      })),
      branches: v.optional(v.array(v.any())),
      exitConditions: v.optional(v.array(v.any()))
    }),
    settings: v.object({
      isActive: v.boolean(),
      maxDuration: v.optional(v.number()),
      maxEmailsPerContact: v.optional(v.number()),
      respectUnsubscribe: v.boolean(),
      respectOptOut: v.boolean(),
      timeZone: v.optional(v.string()),
      sendingWindow: v.optional(v.object({
        start: v.string(),
        end: v.string(),
        daysOfWeek: v.array(v.number())
      }))
    }),
    goals: v.optional(v.array(v.object({
      name: v.string(),
      type: v.string(),
      config: v.any(),
      weight: v.optional(v.number())
    }))),
    statistics: v.object({
      totalTriggered: v.number(),
      totalEntered: v.number(),
      totalCompleted: v.number(),
      totalExited: v.number(),
      emailsSent: v.number(),
      goalsReached: v.number(),
      conversionRate: v.number()
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_active", ["settings.isActive"])
    .index("by_created_at", ["createdAt"]),

  // Contact journeys through event campaigns
  contactJourneys: defineTable({
    campaignId: v.id("eventCampaigns"),
    contactId: v.id("contacts"),
    triggerId: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("paused"),
      v.literal("failed"),
      v.literal("exited")
    ),
    currentStep: v.string(),
    nextAction: v.string(),
    nextActionAt: v.number(),
    eventData: v.any(),
    progress: v.object({
      emailsSent: v.number(),
      emailsOpened: v.number(),
      emailsClicked: v.number(),
      goalsReached: v.number()
    }),
    metadata: v.any(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_campaign", ["campaignId"])
    .index("by_contact", ["contactId"])
    .index("by_status", ["status"])
    .index("by_next_action_at", ["nextActionAt"])
    .index("by_created_at", ["createdAt"]),

  // Health checks for integration monitoring
  healthChecks: defineTable({
    integrationId: v.id("integrations"),
    name: v.string(),
    type: v.union(
      v.literal("connectivity"),
      v.literal("authentication"),
      v.literal("rate_limit"),
      v.literal("data_sync"),
      v.literal("webhook_delivery"),
      v.literal("api_response"),
      v.literal("custom")
    ),
    config: v.object({
      endpoint: v.optional(v.string()),
      method: v.optional(v.string()),
      expectedResponse: v.optional(v.any()),
      timeout: v.optional(v.number()),
      retries: v.optional(v.number()),
      interval: v.number(),
      alertThreshold: v.optional(v.number()),
      criticalThreshold: v.optional(v.number())
    }),
    isActive: v.boolean(),
    status: v.union(
      v.literal("pending"),
      v.literal("healthy"),
      v.literal("unhealthy")
    ),
    lastCheck: v.number(),
    consecutiveFailures: v.number(),
    statistics: v.object({
      totalChecks: v.number(),
      successfulChecks: v.number(),
      failedChecks: v.number(),
      averageResponseTime: v.number(),
      uptime: v.number()
    }),
    tags: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_integration", ["integrationId"])
    .index("by_status", ["status"])
    .index("by_active", ["isActive"])
    .index("by_last_check", ["lastCheck"]),

  // Health check results history
  healthCheckResults: defineTable({
    healthCheckId: v.id("healthChecks"),
    success: v.boolean(),
    responseTime: v.number(),
    error: v.optional(v.string()),
    details: v.optional(v.any()),
    timestamp: v.number(),
  })
    .index("by_health_check", ["healthCheckId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_success", ["success"]),

  // Monitoring alerts
  monitoringAlerts: defineTable({
    healthCheckId: v.id("healthChecks"),
    level: v.union(
      v.literal("info"),
      v.literal("warning"),
      v.literal("error"),
      v.literal("critical")
    ),
    message: v.string(),
    metadata: v.optional(v.any()),
    isActive: v.boolean(),
    resolvedAt: v.optional(v.number()),
    resolution: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_health_check", ["healthCheckId"])
    .index("by_level", ["level"])
    .index("by_active", ["isActive"])
    .index("by_created_at", ["createdAt"]),

  // Notification preferences for monitoring alerts
  notificationPreferences: defineTable({
    userId: v.id("users"),
    email: v.object({
      enabled: v.boolean(),
      address: v.optional(v.string())
    }),
    webhook: v.object({
      enabled: v.boolean(),
      url: v.optional(v.string()),
      headers: v.optional(v.record(v.string(), v.string()))
    }),
    levels: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"]),

  // User notifications for campaigns, alerts, and system events
  notifications: defineTable({
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
    read: v.boolean(),
    data: v.optional(v.object({
      campaignId: v.optional(v.id("campaigns")),
      contactCount: v.optional(v.number()),
      alertLevel: v.optional(v.string()),
      integrationId: v.optional(v.id("integrations")),
      url: v.optional(v.string()),
    })),
    createdAt: v.number(),
    readAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_read", ["userId", "read"])
    .index("by_user_created_at", ["userId", "createdAt"])
    .index("by_category", ["category"])
    .index("by_type", ["type"]),

  // API request logs for rate limiting
  apiRequestLogs: defineTable({
    apiKeyId: v.id("apiKeys"),
    endpoint: v.string(),
    timestamp: v.number(),
  })
    .index("by_api_key", ["apiKeyId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_api_key_timestamp", ["apiKeyId", "timestamp"]),

  // Integration test suites
  integrationTests: defineTable({
    integrationId: v.id("integrations"),
    name: v.string(),
    description: v.optional(v.string()),
    type: v.union(
      v.literal("connectivity"),
      v.literal("authentication"), 
      v.literal("data_sync"),
      v.literal("webhooks"),
      v.literal("rate_limiting"),
      v.literal("error_handling"),
      v.literal("performance"),
      v.literal("data_integrity"),
      v.literal("security"),
      v.literal("compliance")
    ),
    config: v.object({
      timeout: v.optional(v.number()),
      retries: v.optional(v.number()),
      expectedDuration: v.optional(v.number()),
      testData: v.optional(v.any()),
      assertions: v.optional(v.array(v.any())),
      prerequisites: v.optional(v.array(v.string())),
      cleanup: v.optional(v.boolean())
    }),
    isEnabled: v.boolean(),
    schedule: v.optional(v.object({
      cron: v.string(),
      timezone: v.optional(v.string()),
      nextRun: v.optional(v.number())
    })),
    tags: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_integration", ["integrationId"])
    .index("by_type", ["type"])
    .index("by_enabled", ["isEnabled"])
    .index("by_created_at", ["createdAt"]),

  // Integration test executions
  integrationTestExecutions: defineTable({
    testId: v.id("integrationTests"),
    status: v.union(
      v.literal("running"),
      v.literal("passed"),
      v.literal("failed"),
      v.literal("skipped"),
      v.literal("error")
    ),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    duration: v.optional(v.number()),
    results: v.optional(v.object({
      assertions: v.optional(v.array(v.object({
        name: v.string(),
        passed: v.boolean(),
        message: v.optional(v.string()),
        actual: v.optional(v.any()),
        expected: v.optional(v.any())
      }))),
      metrics: v.optional(v.object({
        responseTime: v.optional(v.number()),
        throughput: v.optional(v.number()),
        errorRate: v.optional(v.number()),
        dataAccuracy: v.optional(v.number())
      })),
      logs: v.optional(v.array(v.string())),
      artifacts: v.optional(v.array(v.object({
        name: v.string(),
        type: v.string(),
        url: v.optional(v.string()),
        data: v.optional(v.any())
      })))
    })),
    error: v.optional(v.string()),
    triggeredBy: v.union(
      v.literal("manual"),
      v.literal("scheduled"),
      v.literal("webhook"),
      v.literal("deployment"),
      v.literal("monitoring")
    ),
    triggeredByUser: v.optional(v.id("users")),
    metadata: v.optional(v.any()),
  })
    .index("by_test", ["testId"])
    .index("by_status", ["status"])
    .index("by_started_at", ["startedAt"])
    .index("by_triggered_by", ["triggeredBy"]),

  // Integration test schedules
  integrationTestSchedules: defineTable({
    testId: v.id("integrationTests"),
    cron: v.string(),
    timezone: v.string(),
    isActive: v.boolean(),
    lastRun: v.optional(v.number()),
    nextRun: v.number(),
    runCount: v.number(),
    successCount: v.number(),
    failureCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_test", ["testId"])
    .index("by_active", ["isActive"])
    .index("by_next_run", ["nextRun"])
    .index("by_last_run", ["lastRun"]),

  // Integration test reports
  integrationTestReports: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    integrationIds: v.optional(v.array(v.id("integrations"))),
    testIds: v.optional(v.array(v.id("integrationTests"))),
    executionIds: v.array(v.id("integrationTestExecutions")),
    summary: v.object({
      totalTests: v.number(),
      passedTests: v.number(),
      failedTests: v.number(),
      skippedTests: v.number(),
      errorTests: v.number(),
      totalDuration: v.number(),
      averageDuration: v.number(),
      successRate: v.number()
    }),
    generatedAt: v.number(),
    generatedBy: v.id("users"),
    format: v.union(
      v.literal("json"),
      v.literal("html"),
      v.literal("pdf"),
      v.literal("csv")
    ),
    url: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  })
    .index("by_generated_at", ["generatedAt"])
    .index("by_generated_by", ["generatedBy"])
    .index("by_expires_at", ["expiresAt"]),

  // Error logs for comprehensive error tracking
  errorLogs: defineTable({
    integrationId: v.optional(v.id("integrations")),
    category: v.string(),
    severity: v.string(),
    message: v.string(),
    details: v.optional(v.any()),
    context: v.optional(v.object({
      operation: v.optional(v.string()),
      endpoint: v.optional(v.string()),
      method: v.optional(v.string()),
      requestId: v.optional(v.string()),
      userId: v.optional(v.id("users")),
      metadata: v.optional(v.any())
    })),
    stackTrace: v.optional(v.string()),
    status: v.union(
      v.literal("new"),
      v.literal("retrying"),
      v.literal("resolved"),
      v.literal("failed")
    ),
    retryConfig: v.object({
      maxRetries: v.number(),
      strategy: v.string(),
      baseDelay: v.number(),
      maxDelay: v.number(),
      backoffMultiplier: v.optional(v.number())
    }),
    retryCount: v.number(),
    nextRetryAt: v.optional(v.number()),
    resolvedAt: v.optional(v.number()),
    resolution: v.optional(v.string()),
    tags: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_integration", ["integrationId"])
    .index("by_category", ["category"])
    .index("by_severity", ["severity"])
    .index("by_status", ["status"])
    .index("by_next_retry", ["nextRetryAt"])
    .index("by_created_at", ["createdAt"]),

  // Error alerts for monitoring critical issues
  errorAlerts: defineTable({
    errorId: v.id("errorLogs"),
    level: v.string(),
    message: v.string(),
    isActive: v.boolean(),
    notificationsSent: v.array(v.object({
      type: v.string(),
      recipient: v.string(),
      sentAt: v.number(),
      success: v.boolean()
    })),
    resolvedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_error", ["errorId"])
    .index("by_level", ["level"])
    .index("by_active", ["isActive"])
    .index("by_created_at", ["createdAt"]),

  // Performance metrics for optimization
  performanceMetrics: defineTable({
    integrationId: v.optional(v.id("integrations")),
    category: v.string(),
    operation: v.string(),
    value: v.number(),
    unit: v.string(),
    status: v.union(
      v.literal("good"),
      v.literal("warning"),
      v.literal("critical")
    ),
    metadata: v.optional(v.any()),
    tags: v.array(v.string()),
    timestamp: v.number(),
  })
    .index("by_integration", ["integrationId"])
    .index("by_category", ["category"])
    .index("by_operation", ["operation"])
    .index("by_status", ["status"])
    .index("by_timestamp", ["timestamp"])
    .index("by_category_timestamp", ["category", "timestamp"]),

  // Optimization plans for performance improvements
  optimizationPlans: defineTable({
    integrationId: v.optional(v.id("integrations")),
    name: v.string(),
    description: v.optional(v.string()),
    recommendations: v.array(v.any()),
    targetMetrics: v.object({
      responseTime: v.optional(v.number()),
      errorRate: v.optional(v.number()),
      throughput: v.optional(v.number()),
      syncDuration: v.optional(v.number())
    }),
    timeline: v.optional(v.string()),
    assignedTo: v.optional(v.id("users")),
    status: v.union(
      v.literal("draft"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    progress: v.number(),
    notes: v.optional(v.string()),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_integration", ["integrationId"])
    .index("by_status", ["status"])
    .index("by_assigned_to", ["assignedTo"])
    .index("by_created_at", ["createdAt"]),

  // Security scans for vulnerability assessment
  securityScans: defineTable({
    integrationId: v.optional(v.id("integrations")),
    name: v.string(),
    description: v.optional(v.string()),
    scanType: v.string(),
    scope: v.object({
      includeIntegrations: v.boolean(),
      includeWebhooks: v.boolean(),
      includeApiKeys: v.boolean(),
      includeDataFlow: v.boolean(),
      includeCompliance: v.boolean(),
      specificEndpoints: v.optional(v.array(v.string()))
    }),
    configuration: v.object({
      depth: v.optional(v.string()),
      timeout: v.optional(v.number()),
      retries: v.optional(v.number()),
      parallelChecks: v.optional(v.number()),
      complianceFrameworks: v.optional(v.array(v.string())),
      customRules: v.optional(v.array(v.any()))
    }),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled")
    ),
    progress: v.number(),
    scheduledFor: v.optional(v.number()),
    recurring: v.optional(v.object({
      enabled: v.boolean(),
      interval: v.string(),
      nextRun: v.number()
    })),
    findings: v.array(v.any()),
    summary: v.object({
      totalChecks: v.number(),
      passedChecks: v.number(),
      failedChecks: v.number(),
      criticalFindings: v.number(),
      highFindings: v.number(),
      mediumFindings: v.number(),
      lowFindings: v.number(),
      riskScore: v.number()
    }),
    error: v.optional(v.string()),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_integration", ["integrationId"])
    .index("by_scan_type", ["scanType"])
    .index("by_status", ["status"])
    .index("by_scheduled_for", ["scheduledFor"])
    .index("by_created_at", ["createdAt"]),

  // Security alerts for critical findings
  securityAlerts: defineTable({
    scanId: v.id("securityScans"),
    findingId: v.string(),
    severity: v.string(),
    message: v.string(),
    title: v.string(),
    description: v.string(),
    recommendation: v.string(),
    isActive: v.boolean(),
    acknowledgedAt: v.optional(v.number()),
    acknowledgedBy: v.optional(v.id("users")),
    notes: v.optional(v.string()),
    resolvedAt: v.optional(v.number()),
    resolvedBy: v.optional(v.id("users")),
    resolution: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_scan", ["scanId"])
    .index("by_severity", ["severity"])
    .index("by_active", ["isActive"])
    .index("by_created_at", ["createdAt"]),

  // Integration versions for version control and rollbacks
  integrationVersions: defineTable({
    integrationId: v.id("integrations"),
    version: v.string(),
    versionType: v.union(
      v.literal("major"),
      v.literal("minor"),
      v.literal("patch"),
      v.literal("hotfix")
    ),
    changelog: v.string(),
    configuration: v.any(),
    dependencies: v.array(v.object({
      name: v.string(),
      version: v.string(),
      required: v.boolean()
    })),
    compatibilityNotes: v.optional(v.string()),
    migrationInstructions: v.optional(v.string()),
    rollbackInstructions: v.optional(v.string()),
    testResults: v.optional(v.any()),
    deploymentStrategy: v.union(
      v.literal("immediate"),
      v.literal("scheduled"),
      v.literal("canary"),
      v.literal("blue_green"),
      v.literal("rolling")
    ),
    scheduledDeployment: v.optional(v.number()),
    canaryConfig: v.optional(v.object({
      percentage: v.number(),
      duration: v.number(),
      successCriteria: v.array(v.string())
    })),
    status: v.union(
      v.literal("pending"),
      v.literal("scheduled"),
      v.literal("deploying"),
      v.literal("deployed"),
      v.literal("superseded"),
      v.literal("failed"),
      v.literal("cancelled")
    ),
    currentSnapshot: v.any(),
    deploymentProgress: v.number(),
    rollbackAvailable: v.boolean(),
    error: v.optional(v.string()),
    deployedAt: v.optional(v.number()),
    supersededAt: v.optional(v.number()),
    deploymentResult: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_integration", ["integrationId"])
    .index("by_version", ["version"])
    .index("by_status", ["status"])
    .index("by_scheduled_deployment", ["scheduledDeployment"])
    .index("by_created_at", ["createdAt"]),

  // Integration rollback history
  integrationRollbacks: defineTable({
    integrationId: v.id("integrations"),
    fromVersionId: v.optional(v.id("integrationVersions")),
    toVersionId: v.id("integrationVersions"),
    reason: v.string(),
    status: v.union(
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("failed")
    ),
    error: v.optional(v.string()),
    initiatedAt: v.number(),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_integration", ["integrationId"])
    .index("by_status", ["status"])
    .index("by_initiated_at", ["initiatedAt"]),

  // Audit logging system
  auditLogs: defineTable({
    userId: v.optional(v.id("users")),
    integrationId: v.optional(v.id("integrations")),
    eventType: v.union(
      // Authentication events
      v.literal("user_login"),
      v.literal("user_logout"),
      v.literal("api_key_created"),
      v.literal("api_key_revoked"),
      v.literal("oauth_token_refreshed"),
      v.literal("permission_granted"),
      v.literal("permission_revoked"),
      // Integration events
      v.literal("integration_created"),
      v.literal("integration_updated"),
      v.literal("integration_deleted"),
      v.literal("integration_enabled"),
      v.literal("integration_disabled"),
      v.literal("integration_sync"),
      v.literal("integration_webhook"),
      // Data events
      v.literal("data_export"),
      v.literal("data_import"),
      v.literal("data_deletion"),
      v.literal("data_modification"),
      v.literal("backup_created"),
      v.literal("backup_restored"),
      // System events
      v.literal("system_config_change"),
      v.literal("security_scan"),
      v.literal("performance_alert"),
      v.literal("error_occurred"),
      v.literal("rate_limit_exceeded"),
      // Compliance events
      v.literal("gdpr_request"),
      v.literal("data_retention_policy"),
      v.literal("audit_report_generated"),
      v.literal("compliance_check"),
      // Campaign events
      v.literal("campaign_created"),
      v.literal("campaign_sent"),
      v.literal("email_delivered"),
      v.literal("email_bounced")
    ),
    resource: v.string(),
    resourceId: v.optional(v.string()),
    action: v.string(),
    description: v.string(),
    details: v.any(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    sessionId: v.optional(v.string()),
    requestId: v.optional(v.string()),
    riskLevel: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    ),
    tags: v.optional(v.array(v.string())),
    metadata: v.optional(v.any()),
    relatedEvents: v.optional(v.array(v.id("auditLogs"))),
    timestamp: v.number(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_integration", ["integrationId"])
    .index("by_event_type", ["eventType"])
    .index("by_resource", ["resource"])
    .index("by_risk_level", ["riskLevel"])
    .index("by_timestamp", ["timestamp"])
    .index("by_created_at", ["createdAt"])
    .index("by_user_timestamp", ["userId", "timestamp"])
    .index("by_integration_timestamp", ["integrationId", "timestamp"]),

  // Audit log reports and compliance
  auditReports: defineTable({
    userId: v.id("users"),
    reportType: v.union(
      v.literal("compliance"),
      v.literal("security"),
      v.literal("data_access"),
      v.literal("system_changes"),
      v.literal("user_activity"),
      v.literal("integration_activity"),
      v.literal("custom")
    ),
    title: v.string(),
    description: v.optional(v.string()),
    filters: v.any(),
    dateRange: v.object({
      startDate: v.number(),
      endDate: v.number(),
    }),
    eventCount: v.number(),
    riskMetrics: v.object({
      lowRisk: v.number(),
      mediumRisk: v.number(),
      highRisk: v.number(),
      criticalRisk: v.number(),
    }),
    complianceFrameworks: v.optional(v.array(v.string())),
    findings: v.optional(v.array(v.any())),
    recommendations: v.optional(v.array(v.string())),
    exportedAt: v.optional(v.number()),
    exportFormat: v.optional(v.union(
      v.literal("json"),
      v.literal("csv"),
      v.literal("pdf")
    )),
    scheduledReport: v.optional(v.object({
      frequency: v.union(
        v.literal("daily"),
        v.literal("weekly"),
        v.literal("monthly"),
        v.literal("quarterly")
      ),
      nextRunAt: v.number(),
      enabled: v.boolean(),
    })),
    status: v.union(
      v.literal("generating"),
      v.literal("completed"),
      v.literal("failed")
    ),
    error: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_type", ["reportType"])
    .index("by_status", ["status"])
    .index("by_created_at", ["createdAt"])
    .index("by_scheduled_next_run", ["scheduledReport.nextRunAt"]),

  // Integration documentation system
  integrationDocumentation: defineTable({
    userId: v.id("users"),
    integrationId: v.id("integrations"),
    title: v.string(),
    content: v.any(),
    format: v.union(
      v.literal("markdown"),
      v.literal("html"),
      v.literal("pdf"),
      v.literal("interactive"),
      v.literal("video_tutorial")
    ),
    version: v.string(),
    status: v.union(
      v.literal("generating"),
      v.literal("generated"),
      v.literal("error")
    ),
    documentationType: v.optional(v.union(
      v.literal("api_reference"),
      v.literal("setup_guide"),
      v.literal("troubleshooting"),
      v.literal("best_practices"),
      v.literal("migration_guide"),
      v.literal("webhook_setup"),
      v.literal("authentication"),
      v.literal("rate_limits"),
      v.literal("error_codes"),
      v.literal("code_examples")
    )),
    tags: v.optional(v.array(v.string())),
    viewCount: v.optional(v.number()),
    lastViewedAt: v.optional(v.number()),
    error: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_integration", ["integrationId"])
    .index("by_format", ["format"])
    .index("by_status", ["status"])
    .index("by_type", ["documentationType"])
    .index("by_created_at", ["createdAt"])
    .index("by_updated_at", ["updatedAt"]),

  // Integration backup and migration system
  integrationBackups: defineTable({
    userId: v.id("users"),
    integrationId: v.id("integrations"),
    backupType: v.union(
      v.literal("full"),
      v.literal("configuration"),
      v.literal("data"),
      v.literal("scheduled")
    ),
    name: v.string(),
    description: v.optional(v.string()),
    backupData: v.any(),
    size: v.number(),
    compression: v.optional(v.string()),
    encryption: v.optional(v.object({
      enabled: v.boolean(),
      algorithm: v.string(),
      keyId: v.string(),
    })),
    storage: v.object({
      location: v.string(),
      provider: v.string(),
      path: v.string(),
    }),
    schedule: v.optional(v.object({
      frequency: v.union(
        v.literal("hourly"),
        v.literal("daily"),
        v.literal("weekly"),
        v.literal("monthly")
      ),
      nextBackupAt: v.number(),
      enabled: v.boolean(),
      retentionDays: v.number(),
    })),
    status: v.union(
      v.literal("creating"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("restoring"),
      v.literal("deleted")
    ),
    progress: v.optional(v.number()),
    error: v.optional(v.string()),
    checksumMD5: v.optional(v.string()),
    checksumSHA256: v.optional(v.string()),
    restoredCount: v.optional(v.number()),
    lastRestoredAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_integration", ["integrationId"])
    .index("by_type", ["backupType"])
    .index("by_status", ["status"])
    .index("by_created_at", ["createdAt"])
    .index("by_next_backup", ["schedule.nextBackupAt"])
    .index("by_expires_at", ["expiresAt"]),

  // Integration migration history
  integrationMigrations: defineTable({
    userId: v.id("users"),
    sourceIntegrationId: v.optional(v.id("integrations")),
    targetIntegrationId: v.id("integrations"),
    migrationType: v.union(
      v.literal("provider_change"),
      v.literal("version_upgrade"),
      v.literal("configuration_update"),
      v.literal("data_migration"),
      v.literal("platform_migration")
    ),
    name: v.string(),
    description: v.optional(v.string()),
    migrationPlan: v.any(),
    dataMapping: v.optional(v.any()),
    validation: v.optional(v.object({
      preChecks: v.array(v.any()),
      postChecks: v.array(v.any()),
      dataIntegrity: v.boolean(),
    })),
    phases: v.array(v.object({
      name: v.string(),
      status: v.union(
        v.literal("pending"),
        v.literal("in_progress"),
        v.literal("completed"),
        v.literal("failed"),
        v.literal("skipped")
      ),
      startedAt: v.optional(v.number()),
      completedAt: v.optional(v.number()),
      error: v.optional(v.string()),
      progress: v.optional(v.number()),
    })),
    rollbackPlan: v.optional(v.any()),
    status: v.union(
      v.literal("planned"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("rolled_back")
    ),
    progress: v.number(),
    error: v.optional(v.string()),
    metrics: v.optional(v.object({
      recordsMigrated: v.number(),
      duration: v.number(),
      downtime: v.number(),
      errorCount: v.number(),
    })),
    rollbackAvailable: v.boolean(),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_source_integration", ["sourceIntegrationId"])
    .index("by_target_integration", ["targetIntegrationId"])
    .index("by_type", ["migrationType"])
    .index("by_status", ["status"])
    .index("by_created_at", ["createdAt"]),

  // Missing tables for audit and testing
  auditAlerts: defineTable({
    severity: v.string(),
    message: v.string(),
    timestamp: v.number(),
    acknowledged: v.boolean(),
    resolvedAt: v.optional(v.number()),
    metadata: v.optional(v.any()),
  }),

  auditTrails: defineTable({
    name: v.string(),
    description: v.string(),
    eventIds: v.array(v.string()),
    createdAt: v.number(),
    userId: v.id("users"),
  }),

  testResults: defineTable({
    testId: v.id("integrationTests"),
    results: v.any(),
    status: v.string(),
    timestamp: v.number(),
    duration: v.number(),
    errors: v.array(v.string()),
  }),

  // Content Library Components
  contentComponents: defineTable({
    userId: v.id("users"),
    name: v.string(),
    type: v.string(), // 'header', 'footer', 'cta', 'text_block', 'image_block', 'social_media'
    content: v.string(),
    htmlContent: v.optional(v.string()),
    category: v.string(),
    tags: v.array(v.string()),
    description: v.optional(v.string()),
    variables: v.optional(v.array(v.string())),
    styles: v.optional(v.object({
      backgroundColor: v.optional(v.string()),
      textColor: v.optional(v.string()),
      fontSize: v.optional(v.string()),
      fontFamily: v.optional(v.string()),
      padding: v.optional(v.string()),
      margin: v.optional(v.string()),
      borderRadius: v.optional(v.string()),
      borderColor: v.optional(v.string()),
      borderWidth: v.optional(v.string())
    })),
    isPublic: v.optional(v.boolean()),
    usageCount: v.optional(v.number()),
    rating: v.optional(v.number()),
    ratingCount: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_user", ["userId"])
    .index("by_category", ["category"])
    .index("by_type", ["type"])
    .index("by_public", ["isPublic"])
    .index("by_tags", ["tags"])
    .index("by_updated_at", ["updatedAt"]),

  // GDPR Compliance and Data Protection
  gdprConsents: defineTable({
    userId: v.id("users"),
    contactEmail: v.string(),
    consentType: v.union(
      v.literal("marketing"),
      v.literal("analytics"),
      v.literal("functional"),
      v.literal("necessary")
    ),
    consentStatus: v.boolean(),
    consentDate: v.number(),
    withdrawalDate: v.optional(v.number()),
    source: v.string(), // form, api, import, etc.
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    legalBasis: v.string(),
    metadata: v.optional(v.any()),
  })
    .index("by_user", ["userId"])
    .index("by_contact", ["contactEmail"])
    .index("by_type", ["consentType"])
    .index("by_status", ["consentStatus"])
    .index("by_date", ["consentDate"]),

  gdprRequests: defineTable({
    userId: v.id("users"),
    contactEmail: v.string(),
    requestType: v.union(
      v.literal("access"),
      v.literal("deletion"),
      v.literal("portability"),
      v.literal("rectification")
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("rejected")
    ),
    submittedAt: v.number(),
    processedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    processorUserId: v.optional(v.id("users")),
    notes: v.optional(v.string()),
    attachments: v.optional(v.array(v.string())),
    metadata: v.optional(v.any()),
  })
    .index("by_user", ["userId"])
    .index("by_contact", ["contactEmail"])
    .index("by_type", ["requestType"])
    .index("by_status", ["status"])
    .index("by_submitted", ["submittedAt"]),

  dataRetentionPolicies: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    dataType: v.string(),
    retentionPeriod: v.number(), // days
    autoDelete: v.boolean(),
    isActive: v.boolean(),
    lastExecuted: v.optional(v.number()),
    nextExecution: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_type", ["dataType"])
    .index("by_active", ["isActive"])
    .index("by_next_execution", ["nextExecution"]),

  // Data Encryption and Security
  encryptionKeys: defineTable({
    userId: v.id("users"),
    keyId: v.string(),
    algorithm: v.string(),
    keySize: v.number(),
    purpose: v.union(
      v.literal("field_encryption"),
      v.literal("file_encryption"),
      v.literal("backup_encryption")
    ),
    isActive: v.boolean(),
    createdAt: v.number(),
    rotatedAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    usageCount: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_key_id", ["keyId"])
    .index("by_purpose", ["purpose"])
    .index("by_active", ["isActive"])
    .index("by_expires", ["expiresAt"]),

  encryptedData: defineTable({
    userId: v.id("users"),
    dataType: v.string(),
    recordId: v.string(),
    fieldName: v.string(),
    encryptedValue: v.string(),
    keyId: v.string(),
    algorithm: v.string(),
    iv: v.string(),
    createdAt: v.number(),
    lastAccessed: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_record", ["recordId", "fieldName"])
    .index("by_key", ["keyId"])
    .index("by_type", ["dataType"]),

  rateLimitViolations: defineTable({
    userId: v.optional(v.id("users")),
    ipAddress: v.string(),
    endpoint: v.string(),
    method: v.string(),
    violationType: v.union(
      v.literal("rate_exceeded"),
      v.literal("burst_exceeded"),
      v.literal("quota_exceeded")
    ),
    requestCount: v.number(),
    windowStart: v.number(),
    windowEnd: v.number(),
    userAgent: v.optional(v.string()),
    blocked: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_ip", ["ipAddress"])
    .index("by_endpoint", ["endpoint"])
    .index("by_violation_type", ["violationType"])
    .index("by_created_at", ["createdAt"]),

  // Email Compliance
  emailBounces: defineTable({
    userId: v.id("users"),
    campaignId: v.optional(v.id("campaigns")),
    emailAddress: v.string(),
    bounceType: v.union(
      v.literal("soft"),
      v.literal("hard")
    ),
    bounceReason: v.string(),
    bounceCode: v.optional(v.string()),
    diagnosticCode: v.optional(v.string()),
    isTransient: v.boolean(),
    retryCount: v.number(),
    lastRetryAt: v.optional(v.number()),
    suppressedAt: v.optional(v.number()),
    createdAt: v.number(),
    metadata: v.optional(v.any()),
  })
    .index("by_user", ["userId"])
    .index("by_email", ["emailAddress"])
    .index("by_campaign", ["campaignId"])
    .index("by_type", ["bounceType"])
    .index("by_suppressed", ["suppressedAt"]),

  spamComplaints: defineTable({
    userId: v.id("users"),
    campaignId: v.optional(v.id("campaigns")),
    emailAddress: v.string(),
    complaintType: v.union(
      v.literal("abuse"),
      v.literal("fraud"),
      v.literal("virus"),
      v.literal("other")
    ),
    feedbackType: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    complaintSource: v.string(), // ISP or feedback loop
    suppressedAt: v.number(),
    createdAt: v.number(),
    metadata: v.optional(v.any()),
  })
    .index("by_user", ["userId"])
    .index("by_email", ["emailAddress"])
    .index("by_campaign", ["campaignId"])
    .index("by_type", ["complaintType"])
    .index("by_source", ["complaintSource"]),

  suppressionList: defineTable({
    userId: v.id("users"),
    emailAddress: v.string(),
    reason: v.union(
      v.literal("hard_bounce"),
      v.literal("soft_bounce_limit"),
      v.literal("spam_complaint"),
      v.literal("unsubscribe"),
      v.literal("manual"),
      v.literal("list_cleaning")
    ),
    source: v.string(),
    suppressedAt: v.number(),
    expiresAt: v.optional(v.number()),
    notes: v.optional(v.string()),
    metadata: v.optional(v.any()),
  })
    .index("by_user", ["userId"])
    .index("by_email", ["emailAddress"])
    .index("by_reason", ["reason"])
    .index("by_suppressed", ["suppressedAt"])
    .index("by_expires", ["expiresAt"]),

  unsubscribeTokens: defineTable({
    userId: v.id("users"),
    campaignId: v.optional(v.id("campaigns")),
    emailAddress: v.string(),
    token: v.string(),
    isUsed: v.boolean(),
    usedAt: v.optional(v.number()),
    createdAt: v.number(),
    expiresAt: v.number(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  })
    .index("by_token", ["token"])
    .index("by_user", ["userId"])
    .index("by_email", ["emailAddress"])
    .index("by_campaign", ["campaignId"])
    .index("by_expires", ["expiresAt"]),

  // Role-Based Access Control
  teams: defineTable({
    ownerId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    settings: v.object({
      allowInvitations: v.boolean(),
      requireApproval: v.boolean(),
      defaultRole: v.string(),
      maxMembers: v.optional(v.number()),
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_name", ["name"]),

  teamMembers: defineTable({
    teamId: v.id("teams"),
    userId: v.id("users"),
    role: v.union(
      v.literal("owner"),
      v.literal("admin"),
      v.literal("manager"),
      v.literal("editor"),
      v.literal("viewer")
    ),
    permissions: v.array(v.string()),
    status: v.union(
      v.literal("active"),
      v.literal("pending"),
      v.literal("suspended")
    ),
    invitedBy: v.optional(v.id("users")),
    joinedAt: v.number(),
    lastActiveAt: v.optional(v.number()),
  })
    .index("by_team", ["teamId"])
    .index("by_user", ["userId"])
    .index("by_role", ["role"])
    .index("by_status", ["status"]),

  teamInvitations: defineTable({
    teamId: v.id("teams"),
    email: v.string(),
    role: v.string(),
    permissions: v.array(v.string()),
    invitedBy: v.id("users"),
    token: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("declined"),
      v.literal("expired")
    ),
    createdAt: v.number(),
    expiresAt: v.number(),
    respondedAt: v.optional(v.number()),
  })
    .index("by_team", ["teamId"])
    .index("by_email", ["email"])
    .index("by_token", ["token"])
    .index("by_status", ["status"])
    .index("by_expires", ["expiresAt"]),

  rolePermissions: defineTable({
    userId: v.id("users"),
    role: v.string(),
    permissions: v.array(v.string()),
    resourceType: v.optional(v.string()),
    resourceId: v.optional(v.string()),
    grantedBy: v.optional(v.id("users")),
    grantedAt: v.number(),
    expiresAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_role", ["role"])
    .index("by_resource", ["resourceType", "resourceId"])
    .index("by_expires", ["expiresAt"]),
});
