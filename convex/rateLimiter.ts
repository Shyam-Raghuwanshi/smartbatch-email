import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/**
 * Rate limiting for email sending
 */

const RATE_LIMITS = {
  free: {
    emailsPerHour: 50,
    emailsPerDay: 100,
    batchSize: 10,
  },
  pro: {
    emailsPerHour: 500,
    emailsPerDay: 2000,
    batchSize: 50,
  },
  enterprise: {
    emailsPerHour: 2000,
    emailsPerDay: 10000,
    batchSize: 100,
  },
};

/**
 * Check if user can send emails based on rate limits
 */
export const checkRateLimit = internalQuery({
  args: {
    userId: v.id("users"),
    emailCount: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const plan = user.subscription?.plan || "free";
    const limits = RATE_LIMITS[plan as keyof typeof RATE_LIMITS] || RATE_LIMITS.free;

    const now = Date.now();
    const hourAgo = now - (60 * 60 * 1000);
    const dayAgo = now - (24 * 60 * 60 * 1000);

    // Count emails sent in the last hour
    const emailsThisHour = await ctx.db
      .query("emailQueue")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .filter((q) => q.gte(q.field("sentAt"), hourAgo))
      .filter((q) => q.eq(q.field("status"), "sent"))
      .collect();

    // Count emails sent in the last day
    const emailsToday = await ctx.db
      .query("emailQueue")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .filter((q) => q.gte(q.field("sentAt"), dayAgo))
      .filter((q) => q.eq(q.field("status"), "sent"))
      .collect();

    const hourlyUsage = emailsThisHour.length;
    const dailyUsage = emailsToday.length;

    // Check limits
    const canSendHourly = (hourlyUsage + args.emailCount) <= limits.emailsPerHour;
    const canSendDaily = (dailyUsage + args.emailCount) <= limits.emailsPerDay;

    return {
      canSend: canSendHourly && canSendDaily,
      limits,
      usage: {
        hourly: hourlyUsage,
        daily: dailyUsage,
      },
      remaining: {
        hourly: Math.max(0, limits.emailsPerHour - hourlyUsage),
        daily: Math.max(0, limits.emailsPerDay - dailyUsage),
      },
      recommendedBatchSize: Math.min(
        limits.batchSize,
        limits.emailsPerHour - hourlyUsage,
        limits.emailsPerDay - dailyUsage
      ),
    };
  },
});

/**
 * Log email sending for rate limiting
 */
export const logEmailSending = internalMutation({
  args: {
    userId: v.id("users"),
    emailCount: v.number(),
    timestamp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // This is handled automatically when emails are marked as sent
    // This function exists for future rate limiting enhancements
    return;
  },
});

/**
 * Get user's current rate limit status
 */
export const getRateLimitStatus: any = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx: any, args: any): Promise<any> => {
    return await ctx.runQuery(internal.rateLimiter.checkRateLimit, {
      userId: args.userId,
      emailCount: 0,
    });
  },
});

/**
 * Calculate optimal batch configuration
 */
export const calculateOptimalBatch: any = internalQuery({
  args: {
    userId: v.id("users"),
    totalEmails: v.number(),
  },
  handler: async (ctx: any, args: any): Promise<any> => {
    const rateLimit: any = await ctx.runQuery(internal.rateLimiter.checkRateLimit, {
      userId: args.userId,
      emailCount: 0,
    });

    const maxBatchSize = rateLimit.recommendedBatchSize;
    const remainingHourly: any = rateLimit.remaining.hourly;
    const remainingDaily = rateLimit.remaining.daily;

    // Calculate number of batches needed
    const batchCount = Math.ceil(args.totalEmails / maxBatchSize);
    
    // Calculate delay between batches to respect hourly limits
    const emailsPerBatch = Math.min(maxBatchSize, args.totalEmails);
    const batchesPerHour = Math.floor(remainingHourly / emailsPerBatch);
    
    let delayBetweenBatches = 0;
    if (batchCount > batchesPerHour && batchesPerHour > 0) {
      // Need to spread batches over multiple hours
      delayBetweenBatches = Math.ceil((60 * 60 * 1000) / batchesPerHour); // milliseconds
    } else {
      // Can send all batches within an hour, use minimum delay
      delayBetweenBatches = 1000; // 1 second
    }

    return {
      batchSize: emailsPerBatch,
      batchCount,
      delayBetweenBatches,
      estimatedDuration: batchCount * delayBetweenBatches,
      canSendImmediately: remainingHourly >= args.totalEmails && remainingDaily >= args.totalEmails,
      needsScheduling: !rateLimit.canSend,
    };
  },
});
