import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * User Email Usage Tracking
 * Tracks monthly email sending limits for different subscription plans
 */

const PLAN_LIMITS = {
  free: {
    monthlyEmails: 10,
    dailyEmails: 5,
    hourlyEmails: 2,
  },
  pro: {
    monthlyEmails: 10000,
    dailyEmails: 500,
    hourlyEmails: 100,
  },
  enterprise: {
    monthlyEmails: 100000,
    dailyEmails: 5000,
    hourlyEmails: 1000,
  },
};

/**
 * Get user's monthly email usage and limits
 */
export const getMonthlyEmailUsage = query({
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

    const plan = user.subscription?.plan || "free";
    const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;

    // Get current month start and end
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).getTime();

    // Count sent emails this month
    const sentEmailsThisMonth = await ctx.db
      .query("emailQueue")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("status"), "sent"))
      .filter((q) => q.gte(q.field("sentAt"), monthStart))
      .filter((q) => q.lte(q.field("sentAt"), monthEnd))
      .collect();

    const usage = sentEmailsThisMonth.length;
    const remaining = Math.max(0, limits.monthlyEmails - usage);
    const usagePercentage = (usage / limits.monthlyEmails) * 100;

    return {
      plan,
      usage,
      limit: limits.monthlyEmails,
      remaining,
      usagePercentage,
      canSend: remaining > 0,
      monthStart,
      monthEnd,
      dailyLimit: limits.dailyEmails,
      hourlyLimit: limits.hourlyEmails,
    };
  },
});

/**
 * Get user's daily email usage
 */
export const getDailyEmailUsage = query({
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

    const plan = user.subscription?.plan || "free";
    const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;

    // Get current day start and end
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();

    // Count sent emails today
    const sentEmailsToday = await ctx.db
      .query("emailQueue")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("status"), "sent"))
      .filter((q) => q.gte(q.field("sentAt"), dayStart))
      .filter((q) => q.lte(q.field("sentAt"), dayEnd))
      .collect();

    const usage = sentEmailsToday.length;
    const remaining = Math.max(0, limits.dailyEmails - usage);

    return {
      usage,
      limit: limits.dailyEmails,
      remaining,
      canSend: remaining > 0,
    };
  },
});

/**
 * Get user's hourly email usage
 */
export const getHourlyEmailUsage = query({
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

    const plan = user.subscription?.plan || "free";
    const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;

    // Get current hour start
    const now = new Date();
    const hourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours()).getTime();
    const hourEnd = hourStart + (60 * 60 * 1000);

    // Count sent emails this hour
    const sentEmailsThisHour = await ctx.db
      .query("emailQueue")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("status"), "sent"))
      .filter((q) => q.gte(q.field("sentAt"), hourStart))
      .filter((q) => q.lt(q.field("sentAt"), hourEnd))
      .collect();

    const usage = sentEmailsThisHour.length;
    const remaining = Math.max(0, limits.hourlyEmails - usage);

    return {
      usage,
      limit: limits.hourlyEmails,
      remaining,
      canSend: remaining > 0,
    };
  },
});

/**
 * Check if user can send emails (comprehensive check)
 */
export const canUserSendEmails = query({
  args: {
    emailCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const emailCount = args.emailCount || 1;
    
    const monthlyUsage = await ctx.runQuery("userEmailUsage:getMonthlyEmailUsage");
    const dailyUsage = await ctx.runQuery("userEmailUsage:getDailyEmailUsage");
    const hourlyUsage = await ctx.runQuery("userEmailUsage:getHourlyEmailUsage");

    const canSendMonthly = monthlyUsage.remaining >= emailCount;
    const canSendDaily = dailyUsage.remaining >= emailCount;
    const canSendHourly = hourlyUsage.remaining >= emailCount;

    const canSend = canSendMonthly && canSendDaily && canSendHourly;

    let limitingFactor = null;
    if (!canSendMonthly) limitingFactor = "monthly";
    else if (!canSendDaily) limitingFactor = "daily";
    else if (!canSendHourly) limitingFactor = "hourly";

    return {
      canSend,
      limitingFactor,
      monthlyUsage,
      dailyUsage,
      hourlyUsage,
      reasons: [
        !canSendMonthly && `Monthly limit exceeded (${monthlyUsage.usage}/${monthlyUsage.limit})`,
        !canSendDaily && `Daily limit exceeded (${dailyUsage.usage}/${dailyUsage.limit})`,
        !canSendHourly && `Hourly limit exceeded (${hourlyUsage.usage}/${hourlyUsage.limit})`,
      ].filter(Boolean),
    };
  },
});

/**
 * Get email usage breakdown for the last 30 days
 */
export const getEmailUsageHistory = query({
  args: {
    days: v.optional(v.number()),
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

    const days = args.days || 30;
    const now = Date.now();
    const startTime = now - (days * 24 * 60 * 60 * 1000);

    // Get all sent emails in the time range
    const sentEmails = await ctx.db
      .query("emailQueue")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("status"), "sent"))
      .filter((q) => q.gte(q.field("sentAt"), startTime))
      .collect();

    // Group by day
    const dailyUsage: Record<string, number> = {};
    
    // Initialize all days with 0
    for (let i = 0; i < days; i++) {
      const date = new Date(now - (i * 24 * 60 * 60 * 1000));
      const dateString = date.toISOString().split('T')[0];
      dailyUsage[dateString] = 0;
    }

    // Count emails per day
    sentEmails.forEach(email => {
      const date = new Date(email.sentAt!).toISOString().split('T')[0];
      if (dailyUsage[date] !== undefined) {
        dailyUsage[date]++;
      }
    });

    const history = Object.entries(dailyUsage)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      history,
      totalEmails: sentEmails.length,
      averagePerDay: sentEmails.length / days,
    };
  },
});
