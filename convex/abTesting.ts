import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Create A/B Test
export const createABTest = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    type: v.union(
      v.literal("subject_line"),
      v.literal("content"),
      v.literal("send_time"),
      v.literal("from_name"),
      v.literal("multivariate")
    ),
    testConfiguration: v.object({
      audienceSettings: v.object({
        totalAudience: v.number(),
        testPercentage: v.number(),
        segmentFilters: v.object({
          tags: v.optional(v.array(v.string())),
          companies: v.optional(v.array(v.string())),
          engagementRange: v.optional(v.object({
            min: v.optional(v.number()),
            max: v.optional(v.number()),
          })),
        }),
      }),
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
      statisticalSettings: v.object({
        confidenceLevel: v.number(),
        minimumDetectableEffect: v.number(),
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

    const testId = await ctx.db.insert("abTests", {
      userId: user._id,
      name: args.name,
      description: args.description,
      type: args.type,
      status: "draft",
      testConfiguration: args.testConfiguration,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return testId;
  },
});

// Create A/B Test Variant
export const createABTestVariant = mutation({
  args: {
    testId: v.id("abTests"),
    name: v.string(),
    isControl: v.boolean(),
    trafficAllocation: v.number(),
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
      multivariateElements: v.optional(v.object({
        subjectLineVariants: v.optional(v.array(v.string())),
        contentVariants: v.optional(v.array(v.string())),
        ctaVariants: v.optional(v.array(v.string())),
        imageVariants: v.optional(v.array(v.string())),
      })),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const test = await ctx.db.get(args.testId);
    if (!test) {
      throw new Error("Test not found");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || test.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    // Validate traffic allocation
    const existingVariants = await ctx.db
      .query("abTestVariants")
      .withIndex("by_test", (q) => q.eq("testId", args.testId))
      .collect();

    const totalAllocation = existingVariants.reduce((sum, v) => sum + v.trafficAllocation, 0) + args.trafficAllocation;
    if (totalAllocation > 100) {
      throw new Error("Total traffic allocation cannot exceed 100%");
    }

    const variantId = await ctx.db.insert("abTestVariants", {
      testId: args.testId,
      name: args.name,
      isControl: args.isControl,
      trafficAllocation: args.trafficAllocation,
      campaignConfig: args.campaignConfig,
      assignedRecipients: [],
      createdAt: Date.now(),
    });

    return variantId;
  },
});

// Start A/B Test
export const startABTest = mutation({
  args: { testId: v.id("abTests") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const test = await ctx.db.get(args.testId);
    if (!test) {
      throw new Error("Test not found");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || test.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    if (test.status !== "draft") {
      throw new Error("Test can only be started from draft status");
    }

    // Validate test configuration
    const variants = await ctx.db
      .query("abTestVariants")
      .withIndex("by_test", (q) => q.eq("testId", args.testId))
      .collect();

    if (variants.length < 2) {
      throw new Error("Test must have at least 2 variants");
    }

    const totalAllocation = variants.reduce((sum, v) => sum + v.trafficAllocation, 0);
    if (Math.abs(totalAllocation - 100) > 0.01) {
      throw new Error("Total traffic allocation must equal 100%");
    }

    const controlVariants = variants.filter(v => v.isControl);
    if (controlVariants.length !== 1) {
      throw new Error("Test must have exactly one control variant");
    }

    // Update test status and assign recipients
    await ctx.db.patch(args.testId, {
      status: "active",
      startedAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Schedule recipient assignment
    await ctx.scheduler.runAfter(0, internal.abTesting.assignRecipientsToVariants, {
      testId: args.testId,
    });

    return args.testId;
  },
});

// Internal function to assign recipients to variants
export const assignRecipientsToVariants = internalMutation({
  args: { testId: v.id("abTests") },
  handler: async (ctx, args) => {
    const test = await ctx.db.get(args.testId);
    if (!test) return;

    const variants = await ctx.db
      .query("abTestVariants")
      .withIndex("by_test", (q) => q.eq("testId", args.testId))
      .collect();

    // Get eligible contacts based on test configuration
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_user", (q) => q.eq("userId", test.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Apply segment filters
    let eligibleContacts = contacts;
    const filters = test.testConfiguration.audienceSettings.segmentFilters;

    if (filters.tags && filters.tags.length > 0) {
      eligibleContacts = eligibleContacts.filter(contact => 
        filters.tags!.some(tag => contact.tags.includes(tag))
      );
    }

    if (filters.companies && filters.companies.length > 0) {
      eligibleContacts = eligibleContacts.filter(contact => 
        contact.company && filters.companies!.includes(contact.company)
      );
    }

    if (filters.engagementRange) {
      eligibleContacts = eligibleContacts.filter(contact => {
        const engagementScore = calculateEngagementScore(contact);
        const min = filters.engagementRange?.min ?? 0;
        const max = filters.engagementRange?.max ?? 100;
        return engagementScore >= min && engagementScore <= max;
      });
    }

    // Calculate test audience size
    const testAudienceSize = Math.min(
      Math.floor(eligibleContacts.length * (test.testConfiguration.audienceSettings.testPercentage / 100)),
      eligibleContacts.length
    );

    // Randomly select test audience
    const shuffled = [...eligibleContacts].sort(() => Math.random() - 0.5);
    const testAudience = shuffled.slice(0, testAudienceSize);

    // Assign recipients to variants based on traffic allocation
    let currentIndex = 0;
    for (const variant of variants) {
      const variantSize = Math.floor(testAudienceSize * (variant.trafficAllocation / 100));
      const variantRecipients = testAudience.slice(currentIndex, currentIndex + variantSize);
      
      // Update variant with assigned recipients
      await ctx.db.patch(variant._id, {
        assignedRecipients: variantRecipients.map(c => c.email),
      });

      // Create segment records
      for (const recipient of variantRecipients) {
        await ctx.db.insert("abTestSegments", {
          testId: args.testId,
          recipientEmail: recipient.email,
          variantId: variant._id,
          assignedAt: Date.now(),
          events: [{
            type: "assigned",
            timestamp: Date.now(),
            metadata: {},
          }],
        });
      }

      currentIndex += variantSize;
    }

    // Initialize results for each variant
    for (const variant of variants) {
      await ctx.db.insert("abTestResults", {
        testId: args.testId,
        variantId: variant._id,
        metrics: {
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          conversions: 0,
          revenue: 0,
          unsubscribes: 0,
          bounces: 0,
        },
        rates: {
          deliveryRate: 0,
          openRate: 0,
          clickRate: 0,
          conversionRate: 0,
          unsubscribeRate: 0,
          bounceRate: 0,
        },
        statisticalAnalysis: {
          sampleSize: variant.assignedRecipients.length,
          confidenceInterval: {
            lower: 0,
            upper: 0,
            metric: test.testConfiguration.successMetrics.primary,
          },
          statisticalSignificance: false,
        },
        updatedAt: Date.now(),
      });
    }
  },
});

// Get A/B Tests by User
export const getABTestsByUser = query({
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

    return await ctx.db
      .query("abTests")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

// Get A/B Test Details
export const getABTestDetails = query({
  args: { testId: v.id("abTests") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const test = await ctx.db.get(args.testId);
    if (!test) {
      throw new Error("Test not found");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || test.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    const variants = await ctx.db
      .query("abTestVariants")
      .withIndex("by_test", (q) => q.eq("testId", args.testId))
      .collect();

    const results = await ctx.db
      .query("abTestResults")
      .withIndex("by_test", (q) => q.eq("testId", args.testId))
      .collect();

    const insights = await ctx.db
      .query("abTestInsights")
      .withIndex("by_test", (q) => q.eq("testId", args.testId))
      .order("desc")
      .collect();

    return {
      test,
      variants,
      results,
      insights,
    };
  },
});

// Update A/B Test Results (called by email tracking system)
export const updateABTestResults = internalMutation({
  args: {
    recipientEmail: v.string(),
    event: v.union(
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("opened"),
      v.literal("clicked"),
      v.literal("converted"),
      v.literal("unsubscribed"),
      v.literal("bounced"),
      v.literal("complained")
    ),
    metadata: v.optional(v.record(v.string(), v.any())),
  },
  handler: async (ctx, args) => {
    // Find all active A/B test segments for this recipient
    const segments = await ctx.db
      .query("abTestSegments")
      .withIndex("by_recipient", (q) => q.eq("recipientEmail", args.recipientEmail))
      .collect();

    for (const segment of segments) {
      const test = await ctx.db.get(segment.testId);
      if (!test || test.status !== "active") continue;

      // Update segment events
      const events = segment.events || [];
      events.push({
        type: args.event,
        timestamp: Date.now(),
        metadata: args.metadata || {},
      });

      await ctx.db.patch(segment._id, { events });

      // Update test results
      const result = await ctx.db
        .query("abTestResults")
        .withIndex("by_variant", (q) => q.eq("variantId", segment.variantId))
        .unique();

      if (result) {
        const updatedMetrics = { ...result.metrics };
        updatedMetrics[args.event as keyof typeof updatedMetrics]++;

        // Recalculate rates
        const rates = calculateRates(updatedMetrics);

        await ctx.db.patch(result._id, {
          metrics: updatedMetrics,
          rates,
          updatedAt: Date.now(),
        });

        // Check for statistical significance
        await ctx.scheduler.runAfter(0, internal.abTesting.analyzeStatisticalSignificanceInternal, {
          testId: segment.testId,
        });
      }
    }
  },
});

// Analyze Statistical Significance (Internal)
export const analyzeStatisticalSignificanceInternal = internalMutation({
  args: { testId: v.id("abTests") },
  handler: async (ctx, args) => {
    const test = await ctx.db.get(args.testId);
    if (!test || test.status !== "active") {
      return;
    }

    // Get all variants and results
    const variants = await ctx.db
      .query("abTestVariants")
      .withIndex("by_test", (q) => q.eq("testId", args.testId))
      .collect();

    const results = await ctx.db
      .query("abTestResults")
      .withIndex("by_test", (q) => q.eq("testId", args.testId))
      .collect();

    if (results.length < 2) {
      return;
    }

    // Find control variant
    const controlVariant = variants.find(v => v.isControl);
    const controlResult = results.find(r => r.variantId === controlVariant?._id);

    if (!controlResult) {
      return;
    }

    const primaryMetric = test.testConfiguration.successMetrics.primary;
    const confidenceLevel = test.testConfiguration.statisticalSettings.confidenceLevel;

    // Analyze each variant against control
    for (const result of results) {
      if (result.variantId === controlResult.variantId) {
        continue;
      }

      const significance = calculateStatisticalSignificance(
        controlResult,
        result,
        primaryMetric,
        confidenceLevel
      );

      // Update the result with latest analysis
      await ctx.db.patch(result._id, {
        statisticalAnalysis: {
          ...result.statisticalAnalysis,
          ...significance,
        },
        updatedAt: Date.now(),
      });

      // Check if test should be completed
      if (significance.statisticalSignificance && test.testConfiguration.statisticalSettings.automaticWinner) {
        await declareWinner(ctx, args.testId, result.variantId);
        break;
      }
    }
  },
});

// Analyze Statistical Significance (Public)
export const analyzeStatisticalSignificance = mutation({
  args: { testId: v.id("abTests") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const test = await ctx.db.get(args.testId);
    if (!test) {
      throw new Error("Test not found");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || test.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    if (test.status !== "active") {
      throw new Error("Test must be active to analyze significance");
    }

    // Get all variants and results
    const variants = await ctx.db
      .query("abTestVariants")
      .withIndex("by_test", (q) => q.eq("testId", args.testId))
      .collect();

    const results = await ctx.db
      .query("abTestResults")
      .withIndex("by_test", (q) => q.eq("testId", args.testId))
      .collect();

    if (results.length < 2) {
      throw new Error("Need at least 2 variants to analyze significance");
    }

    // Find control variant
    const controlVariant = variants.find(v => v.isControl);
    const controlResult = results.find(r => r.variantId === controlVariant?._id);

    if (!controlResult) {
      throw new Error("Control variant result not found");
    }

    const primaryMetric = test.testConfiguration.successMetrics.primary;
    const confidenceLevel = test.testConfiguration.statisticalSettings.confidenceLevel;
    const analysis: any[] = [];

    // Analyze each variant against control
    for (const result of results) {
      if (result.variantId === controlResult.variantId) {
        analysis.push({
          variantId: result.variantId,
          variantName: variants.find(v => v._id === result.variantId)?.name || "Unknown",
          isControl: true,
          sampleSize: result.statisticalAnalysis.sampleSize,
          metricValue: getMetricRate(result, primaryMetric),
          significance: null,
        });
        continue;
      }

      const significance = calculateStatisticalSignificance(
        controlResult,
        result,
        primaryMetric,
        confidenceLevel
      );

      analysis.push({
        variantId: result.variantId,
        variantName: variants.find(v => v._id === result.variantId)?.name || "Unknown",
        isControl: false,
        sampleSize: result.statisticalAnalysis.sampleSize,
        metricValue: getMetricRate(result, primaryMetric),
        significance,
      });

      // Update the result with latest analysis
      await ctx.db.patch(result._id, {
        statisticalAnalysis: {
          ...result.statisticalAnalysis,
          ...significance,
        },
        updatedAt: Date.now(),
      });
    }

    // Check if any variant has achieved significance
    const significantVariants = analysis.filter(a => 
      a.significance?.statisticalSignificance && a.significance.lift > 0
    );

    if (significantVariants.length > 0 && test.testConfiguration.statisticalSettings.automaticWinner) {
      // Find the best performing significant variant
      const winner = significantVariants.reduce((best, current) => 
        current.metricValue > best.metricValue ? current : best
      );

      await declareWinner(ctx, args.testId, winner.variantId);

      // Create insight
      await ctx.db.insert("abTestInsights", {
        testId: args.testId,
        insightType: "statistical_significance",
        title: "Statistical Significance Achieved",
        description: `${winner.variantName} achieved ${winner.significance.lift.toFixed(1)}% improvement with ${(100 - winner.significance.pValue * 100).toFixed(1)}% confidence`,
        severity: "info",
        data: {
          winnerVariantId: winner.variantId,
          lift: winner.significance.lift,
          pValue: winner.significance.pValue,
        },
        actionRequired: false,
        createdAt: Date.now(),
      });
    }

    return {
      testId: args.testId,
      analysis,
      hasSignificantResults: significantVariants.length > 0,
      recommendedAction: significantVariants.length > 0 ? "declare_winner" : "continue_test",
    };
  },
});

// Automated Winner Rollout
export const rolloutWinner = mutation({
  args: { 
    testId: v.id("abTests"),
    rolloutPercentage: v.optional(v.number()) // 0-100, defaults to 100
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const test = await ctx.db.get(args.testId);
    if (!test) {
      throw new Error("Test not found");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || test.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    if (test.status !== "completed" || !test.winningVariantId) {
      throw new Error("Test must be completed with a declared winner");
    }

    const winningVariant = await ctx.db.get(test.winningVariantId);
    if (!winningVariant) {
      throw new Error("Winning variant not found");
    }

    const rolloutPercentage = args.rolloutPercentage || 100;

    // Get remaining audience (those not in the A/B test)
    const testSegments = await ctx.db
      .query("abTestSegments")
      .withIndex("by_test", (q) => q.eq("testId", args.testId))
      .collect();

    const testedEmails = new Set(testSegments.map(s => s.recipientEmail));

    // Get all contacts for this user
    const allContacts = await ctx.db
      .query("contacts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Filter to get remaining audience
    let remainingContacts = allContacts.filter(contact => !testedEmails.has(contact.email));

    // Apply segment filters from original test
    const filters = test.testConfiguration.audienceSettings.segmentFilters;
    if (filters.tags && filters.tags.length > 0) {
      remainingContacts = remainingContacts.filter(contact => 
        contact.tags?.some(tag => filters.tags!.includes(tag))
      );
    }
    if (filters.companies && filters.companies.length > 0) {
      remainingContacts = remainingContacts.filter(contact =>
        filters.companies!.includes(contact.company || "")
      );
    }

    // Apply rollout percentage
    if (rolloutPercentage < 100) {
      const rolloutSize = Math.floor(remainingContacts.length * (rolloutPercentage / 100));
      remainingContacts = remainingContacts.slice(0, rolloutSize);
    }

    // Create campaign with winning variant configuration
    const campaignId = await ctx.db.insert("campaigns", {
      userId: user._id,
      name: `${test.name} - Winner Rollout`,
      status: "draft",
      createdAt: Date.now(),
      settings: {
        subject: winningVariant.campaignConfig.subject,
        templateId: winningVariant.campaignConfig.templateId,
        customContent: winningVariant.campaignConfig.customContent,
        targetTags: [], // Will be handled by direct recipient list
        sendDelay: 0,
        trackOpens: true,
        trackClicks: true,
      },
    });

    // Create email queue entries for rollout
    const emailQueueIds: Id<"emailQueue">[] = [];
    for (const contact of remainingContacts) {
      const emailQueueId = await ctx.db.insert("emailQueue", {
        userId: user._id,
        campaignId,
        recipient: contact.email,
        subject: winningVariant.campaignConfig.subject,
        htmlContent: winningVariant.campaignConfig.customContent || "",
        textContent: winningVariant.campaignConfig.customContent || "",
        fromEmail: winningVariant.campaignConfig.fromEmail || user.email,
        fromName: winningVariant.campaignConfig.fromName || user.name,
        status: "queued",
        priority: 5,
        attemptCount: 0,
        maxAttempts: 3,
        scheduledAt: Date.now(),
        metadata: {
          templateId: winningVariant.campaignConfig.templateId,
          trackOpens: true,
          trackClicks: true,
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      emailQueueIds.push(emailQueueId);
    }

    // Create batch for processing
    const batchId = await ctx.db.insert("emailBatches", {
      userId: user._id,
      campaignId,
      name: `Winner Rollout: ${test.name}`,
      status: "pending",
      totalEmails: emailQueueIds.length,
      processedEmails: 0,
      successfulEmails: 0,
      failedEmails: 0,
      batchSize: 50,
      delayBetweenBatches: 30000,
      emailQueueIds,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update test with rollout information
    await ctx.db.patch(args.testId, {
      status: "completed",
      updatedAt: Date.now(),
    });

    // Create insight about the rollout
    await ctx.db.insert("abTestInsights", {
      testId: args.testId,
      insightType: "winner_declared",
      title: "Winner Rolled Out",
      description: `Winning variant rolled out to ${remainingContacts.length} additional recipients (${rolloutPercentage}% of remaining audience)`,
      severity: "info",
      data: {
        rolloutCampaignId: campaignId,
        rolloutBatchId: batchId,
        recipientCount: remainingContacts.length,
        rolloutPercentage,
      },
      actionRequired: false,
      createdAt: Date.now(),
    });

    return { 
      campaignId, 
      batchId, 
      recipientCount: remainingContacts.length,
      rolloutPercentage 
    };
  },
});

// Get A/B Test Performance Summary
export const getABTestPerformanceSummary = query({
  args: { timeRange: v.optional(v.number()) }, // days
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

    const tests = await ctx.db
      .query("abTests")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.gte(q.field("createdAt"), startTime))
      .collect();

    const summary = {
      totalTests: tests.length,
      completedTests: tests.filter(t => t.status === "completed").length,
      activeTests: tests.filter(t => t.status === "active").length,
      averageTestDuration: 0,
      totalParticipants: 0,
      testsWithWinners: tests.filter(t => t.winningVariantId).length,
      topPerformingTests: [] as any[],
    };

    // Calculate average test duration
    const completedTests = tests.filter(t => t.status === "completed" && t.completedAt);
    if (completedTests.length > 0) {
      const totalDuration = completedTests.reduce((sum, test) => {
        return sum + ((test.completedAt! - test.startedAt!) / (24 * 60 * 60 * 1000));
      }, 0);
      summary.averageTestDuration = totalDuration / completedTests.length;
    }

    // Get participant counts and top performing tests
    for (const test of tests) {
      const segments = await ctx.db
        .query("abTestSegments")
        .withIndex("by_test", (q) => q.eq("testId", test._id))
        .collect();
      
      summary.totalParticipants += segments.length;

      if (test.status === "completed") {
        const results = await ctx.db
          .query("abTestResults")
          .withIndex("by_test", (q) => q.eq("testId", test._id))
          .collect();

        const bestResult = results.reduce((best, current) => {
          const metric = test.testConfiguration.successMetrics.primary;
          const bestRate = getMetricRate(best, metric);
          const currentRate = getMetricRate(current, metric);
          return currentRate > bestRate ? current : best;
        });

        summary.topPerformingTests.push({
          testId: test._id,
          name: test.name,
          improvement: bestResult ? getMetricRate(bestResult, test.testConfiguration.successMetrics.primary) : 0,
          participants: segments.length,
        });
      }
    }

    // Sort top performing tests
    summary.topPerformingTests = summary.topPerformingTests
      .sort((a, b) => b.improvement - a.improvement)
      .slice(0, 5);

    return summary;
  },
});

function getMetricRate(result: any, metric: string): number {
  if (!result || !result.rates) return 0;
  
  switch (metric) {
    case "open_rate": return result.rates.openRate;
    case "click_rate": return result.rates.clickRate;
    case "conversion_rate": return result.rates.conversionRate;
    default: return 0;
  }
}

// Pause A/B Test
export const pauseABTest = mutation({
  args: { testId: v.id("abTests") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const test = await ctx.db.get(args.testId);
    if (!test) {
      throw new Error("Test not found");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || test.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.testId, {
      status: "paused",
      updatedAt: Date.now(),
    });

    return args.testId;
  },
});

// Resume A/B Test
export const resumeABTest = mutation({
  args: { testId: v.id("abTests") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const test = await ctx.db.get(args.testId);
    if (!test) {
      throw new Error("Test not found");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || test.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    if (test.status !== "paused") {
      throw new Error("Test is not paused");
    }

    await ctx.db.patch(args.testId, {
      status: "active",
      updatedAt: Date.now(),
    });

    return args.testId;
  },
});

// Manually Declare Winner
export const declareWinnerManually = mutation({
  args: {
    testId: v.id("abTests"),
    winnerVariantId: v.id("abTestVariants"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const test = await ctx.db.get(args.testId);
    if (!test) {
      throw new Error("Test not found");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || test.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    await declareWinner(ctx, args.testId, args.winnerVariantId);

    return args.testId;
  },
});

// Helper Functions
function calculateEngagementScore(contact: any): number {
  const stats = contact.emailStats;
  if (!stats || stats.totalSent === 0) return 0;
  
  const openRate = stats.totalOpened / stats.totalSent;
  const clickRate = stats.totalClicked / stats.totalSent;
  
  return Math.min(100, (openRate * 50) + (clickRate * 50));
}

function calculateRates(metrics: any) {
  return {
    deliveryRate: metrics.sent > 0 ? (metrics.delivered / metrics.sent) * 100 : 0,
    openRate: metrics.delivered > 0 ? (metrics.opened / metrics.delivered) * 100 : 0,
    clickRate: metrics.delivered > 0 ? (metrics.clicked / metrics.delivered) * 100 : 0,
    conversionRate: metrics.delivered > 0 ? (metrics.conversions / metrics.delivered) * 100 : 0,
    unsubscribeRate: metrics.delivered > 0 ? (metrics.unsubscribes / metrics.delivered) * 100 : 0,
    bounceRate: metrics.sent > 0 ? (metrics.bounces / metrics.sent) * 100 : 0,
  };
}

function calculateStatisticalSignificance(control: any, variant: any, metric: string, confidenceLevel: number) {
  // Simplified statistical calculation - in production, use proper statistical libraries
  const controlRate = control.rates[`${metric.replace('_rate', '')}Rate` as keyof typeof control.rates] / 100;
  const variantRate = variant.rates[`${metric.replace('_rate', '')}Rate` as keyof typeof variant.rates] / 100;
  
  const controlSample = control.statisticalAnalysis.sampleSize;
  const variantSample = variant.statisticalAnalysis.sampleSize;
  
  if (controlSample < 30 || variantSample < 30) {
    return {
      pValue: undefined,
      statisticalSignificance: false,
      lift: ((variantRate - controlRate) / controlRate) * 100,
      confidenceInterval: { lower: 0, upper: 0, metric },
    };
  }
  
  // Calculate Z-score for proportion comparison
  const pooledRate = (controlRate * controlSample + variantRate * variantSample) / (controlSample + variantSample);
  const standardError = Math.sqrt(pooledRate * (1 - pooledRate) * (1/controlSample + 1/variantSample));
  const zScore = Math.abs(variantRate - controlRate) / standardError;
  
  // Critical values for different confidence levels
  const criticalValues: { [key: number]: number } = {
    90: 1.645,
    95: 1.96,
    99: 2.576,
  };
  
  const critical = criticalValues[confidenceLevel] || 1.96;
  const isSignificant = zScore > critical;
  
  // Calculate p-value (simplified)
  const pValue = 2 * (1 - normalCDF(Math.abs(zScore)));
  
  // Calculate confidence interval for lift
  const lift = controlRate > 0 ? ((variantRate - controlRate) / controlRate) * 100 : 0;
  const liftSE = Math.sqrt((variantRate * (1 - variantRate) / variantSample) + (controlRate * (1 - controlRate) / controlSample)) / controlRate * 100;
  
  return {
    pValue,
    statisticalSignificance: isSignificant,
    lift,
    confidenceInterval: {
      lower: variantRate * 100 - critical * Math.sqrt(variantRate * (1 - variantRate) / variantSample) * 100,
      upper: variantRate * 100 + critical * Math.sqrt(variantRate * (1 - variantRate) / variantSample) * 100,
      metric,
    },
    liftConfidenceInterval: {
      lower: lift - critical * liftSE,
      upper: lift + critical * liftSE,
    },
  };
}

function normalCDF(x: number): number {
  // Approximation of the cumulative distribution function for standard normal distribution
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - p : p;
}

async function declareWinner(ctx: any, testId: Id<"abTests">, winnerVariantId: Id<"abTestVariants">) {
  await ctx.db.patch(testId, {
    status: "completed",
    completedAt: Date.now(),
    winnerDeclaredAt: Date.now(),
    winningVariantId: winnerVariantId,
    updatedAt: Date.now(),
  });

  // Create insight
  await ctx.db.insert("abTestInsights", {
    testId,
    insightType: "winner_declared",
    title: "Test Winner Declared",
    description: "Statistical significance achieved - winner selected automatically",
    severity: "info",
    data: { winnerVariantId },
    actionRequired: false,
    createdAt: Date.now(),
  });
}
