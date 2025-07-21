import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Intelligent Email Scheduling Service
 * Provides advanced scheduling capabilities with timezone awareness,
 * ISP throttling, and optimal send time algorithms
 */

/**
 * Create or update schedule settings for a campaign
 */
export const updateCampaignScheduleSettings = mutation({
  args: {
    campaignId: v.id("campaigns"),
    scheduleSettings: v.object({
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
        interval: v.number(),
        daysOfWeek: v.optional(v.array(v.number())),
        dayOfMonth: v.optional(v.number()),
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
          ispDomain: v.string(),
          maxPerHour: v.number(),
          maxPerDay: v.number(),
        })),
      })),
    }),
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

    // Verify user owns this campaign
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || campaign.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.campaignId, {
      scheduleSettings: args.scheduleSettings,
    });

    // If this is a recurring campaign, generate schedule instances
    if (args.scheduleSettings.type === "recurring" && args.scheduleSettings.recurring) {
      await ctx.runMutation(internal.emailScheduler.generateRecurringSchedules, {
        campaignId: args.campaignId,
        recurringSettings: args.scheduleSettings.recurring,
        timezone: args.scheduleSettings.timezone || "UTC",
      });
    }

    return args.campaignId;
  },
});

/**
 * Generate optimal send times based on recipient engagement data
 */
export const calculateOptimalSendTimes = internalQuery({
  args: {
    campaignId: v.id("campaigns"),
    timezone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }

    // Get contacts for this campaign based on target tags
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_user", (q) => q.eq("userId", campaign.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const targetContacts = contacts.filter(contact => 
      campaign.settings.targetTags.some(tag => contact.tags.includes(tag))
    );

    // Analyze engagement patterns by timezone
    const timezoneAnalysis: Record<string, {
      count: number;
      optimalHours: number[];
      avgEngagement: number;
    }> = {};

    for (const contact of targetContacts) {
      const tz = contact.timezone || args.timezone || "UTC";
      
      if (!timezoneAnalysis[tz]) {
        timezoneAnalysis[tz] = {
          count: 0,
          optimalHours: [],
          avgEngagement: 0,
        };
      }

      timezoneAnalysis[tz].count++;
      
      if (contact.engagementProfile) {
        timezoneAnalysis[tz].optimalHours.push(...contact.engagementProfile.preferredHours);
        
        // Calculate engagement score based on recent activity
        const recentEngagement = contact.lastEngagement && 
          (Date.now() - contact.lastEngagement) < (30 * 24 * 60 * 60 * 1000); // 30 days
        
        if (recentEngagement) {
          timezoneAnalysis[tz].avgEngagement += 1;
        }
      }
    }

    // Calculate optimal send windows for each timezone
    const optimalSendTimes = Object.entries(timezoneAnalysis).map(([timezone, data]) => {
      const hourCounts: Record<number, number> = {};
      
      // Count preferred hours
      data.optimalHours.forEach(hour => {
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });

      // Find top 3 hours
      const topHours = Object.entries(hourCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([hour]) => parseInt(hour));

      return {
        timezone,
        recipientCount: data.count,
        optimalHours: topHours.length > 0 ? topHours : [9, 14, 16], // Default business hours
        avgEngagement: data.avgEngagement / data.count,
      };
    });

    return optimalSendTimes;
  },
});

/**
 * Generate recurring schedule instances
 */
export const generateRecurringSchedules = internalMutation({
  args: {
    campaignId: v.id("campaigns"),
    recurringSettings: v.object({
      pattern: v.union(
        v.literal("daily"),
        v.literal("weekly"), 
        v.literal("monthly")
      ),
      interval: v.number(),
      daysOfWeek: v.optional(v.array(v.number())),
      dayOfMonth: v.optional(v.number()),
      endDate: v.optional(v.number()),
      maxOccurrences: v.optional(v.number()),
    }),
    timezone: v.string(),
  },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }

    // Clear existing schedules
    const existingSchedules = await ctx.db
      .query("campaignSchedules")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .collect();

    for (const schedule of existingSchedules) {
      await ctx.db.delete(schedule._id);
    }

    const startDate = campaign.scheduledAt || Date.now();
    const endDate = args.recurringSettings.endDate || (Date.now() + (365 * 24 * 60 * 60 * 1000)); // 1 year
    const maxOccurrences = args.recurringSettings.maxOccurrences || 100;

    let currentDate = new Date(startDate);
    let occurrenceCount = 0;
    const schedules = [];

    while (currentDate.getTime() <= endDate && occurrenceCount < maxOccurrences) {
      let shouldSchedule = false;

      switch (args.recurringSettings.pattern) {
        case "daily":
          shouldSchedule = true;
          currentDate.setDate(currentDate.getDate() + args.recurringSettings.interval);
          break;

        case "weekly":
          if (args.recurringSettings.daysOfWeek?.includes(currentDate.getDay())) {
            shouldSchedule = true;
          }
          currentDate.setDate(currentDate.getDate() + 1);
          break;

        case "monthly":
          if (args.recurringSettings.dayOfMonth === currentDate.getDate()) {
            shouldSchedule = true;
          }
          if (currentDate.getDate() === args.recurringSettings.dayOfMonth) {
            currentDate.setMonth(currentDate.getMonth() + args.recurringSettings.interval);
          } else {
            currentDate.setDate(currentDate.getDate() + 1);
          }
          break;
      }

      if (shouldSchedule && currentDate.getTime() > Date.now()) {
        schedules.push({
          campaignId: args.campaignId,
          userId: campaign.userId,
          scheduledAt: currentDate.getTime(),
          status: "pending" as const,
          createdAt: Date.now(),
        });
        occurrenceCount++;
      }

      // Safety break to prevent infinite loops
      if (schedules.length > 1000) break;
    }

    // Insert all schedules
    for (const schedule of schedules) {
      await ctx.db.insert("campaignSchedules", schedule);
    }

    return schedules.length;
  },
});

/**
 * Get ISP-based send rate recommendations
 */
export const getISPSendRates = query({
  args: {
    contactEmails: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Analyze email domains
    const domainCounts: Record<string, number> = {};
    
    args.contactEmails.forEach(email => {
      const domain = email.split('@')[1]?.toLowerCase();
      if (domain) {
        domainCounts[domain] = (domainCounts[domain] || 0) + 1;
      }
    });

    // ISP-specific recommendations
    const ispRecommendations = {
      'gmail.com': { maxPerHour: 100, maxPerDay: 2000, delayMs: 1000 },
      'yahoo.com': { maxPerHour: 50, maxPerDay: 1000, delayMs: 2000 },
      'hotmail.com': { maxPerHour: 50, maxPerDay: 1000, delayMs: 2000 },
      'outlook.com': { maxPerHour: 50, maxPerDay: 1000, delayMs: 2000 },
      'aol.com': { maxPerHour: 20, maxPerDay: 500, delayMs: 3000 },
    };

    const recommendations = Object.entries(domainCounts).map(([domain, count]) => {
      const defaultRates = { maxPerHour: 200, maxPerDay: 4000, delayMs: 500 };
      const rates = ispRecommendations[domain as keyof typeof ispRecommendations] || defaultRates;
      
      return {
        domain,
        recipientCount: count,
        ...rates,
      };
    });

    // Calculate overall recommended send rate
    const totalRecipients = Object.values(domainCounts).reduce((sum, count) => sum + count, 0);
    const avgMaxPerHour = recommendations.reduce((sum, rec) => sum + rec.maxPerHour, 0) / recommendations.length;
    
    return {
      totalRecipients,
      recommendedRate: Math.min(avgMaxPerHour, totalRecipients),
      ispBreakdown: recommendations,
      estimatedDuration: Math.ceil(totalRecipients / avgMaxPerHour), // hours
    };
  },
});

/**
 * Get all scheduled campaigns for management
 */
export const getScheduledCampaigns = query({
  args: {
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("processed"),
      v.literal("skipped"),
      v.literal("failed")
    )),
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

    let query = ctx.db
      .query("campaignSchedules")
      .withIndex("by_user", (q) => q.eq("userId", user._id));

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    const schedules = await query
      .order("desc")
      .take(100);

    // Get campaign details for each schedule
    const schedulesWithCampaigns = await Promise.all(
      schedules.map(async (schedule) => {
        const campaign = await ctx.db.get(schedule.campaignId);
        return {
          ...schedule,
          campaign,
        };
      })
    );

    return schedulesWithCampaigns;
  },
});

/**
 * Update campaign schedule status (pause/resume/cancel)
 */
export const updateScheduleStatus = mutation({
  args: {
    scheduleId: v.id("campaignSchedules"),
    status: v.union(
      v.literal("pending"),
      v.literal("processed"),
      v.literal("skipped"),
      v.literal("failed")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const schedule = await ctx.db.get(args.scheduleId);
    if (!schedule) {
      throw new Error("Schedule not found");
    }

    // Verify user owns this schedule
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || schedule.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.scheduleId, {
      status: args.status,
    });

    return args.scheduleId;
  },
});

/**
 * Calculate timezone-aware send times for a list of recipients
 */
export const calculateTimezoneSendTimes = internalQuery({
  args: {
    recipientEmails: v.array(v.string()),
    baseTime: v.number(), // timestamp
    targetHour: v.number(), // 0-23, hour in recipient's timezone
  },
  handler: async (ctx, args) => {
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_email", (q) => q.eq("email", args.recipientEmails[0]))
      .collect();

    const contactMap = new Map(contacts.map(c => [c.email, c]));
    
    const sendTimes = args.recipientEmails.map(email => {
      const contact = contactMap.get(email);
      const timezone = contact?.timezone || "UTC";
      
      // Calculate send time in recipient's timezone
      const recipientTime = new Date(args.baseTime);
      recipientTime.setHours(args.targetHour, 0, 0, 0);
      
      // This is a simplified calculation - in production you'd use a proper timezone library
      const timezoneOffset = getTimezoneOffset(timezone);
      const adjustedTime = new Date(recipientTime.getTime() - timezoneOffset);
      
      return {
        email,
        timezone,
        sendAt: adjustedTime.getTime(),
        localHour: args.targetHour,
      };
    });

    return sendTimes;
  },
});

/**
 * Analyze recipient engagement patterns for optimal timing
 */
export const analyzeRecipientEngagement = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get all contacts for the user
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Get email tracking data for analysis
    const allTracking = await ctx.db
      .query("emailTracking")
      .collect();

    // Analyze engagement patterns for each contact
    for (const contact of contacts) {
      const contactTracking = allTracking.filter(t => t.recipient === contact.email);
      
      if (contactTracking.length > 0) {
        const engagementHours: number[] = [];
        const engagementDays: number[] = [];
        
        contactTracking.forEach(event => {
          if (event.event === "opened" || event.event === "clicked") {
            const date = new Date(event.timestamp);
            engagementHours.push(date.getHours());
            engagementDays.push(date.getDay());
          }
        });

        // Calculate preferred hours and days
        const hourCounts: Record<number, number> = {};
        const dayCounts: Record<number, number> = {};

        engagementHours.forEach(hour => {
          hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });

        engagementDays.forEach(day => {
          dayCounts[day] = (dayCounts[day] || 0) + 1;
        });

        const preferredHours = Object.entries(hourCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([hour]) => parseInt(hour));

        const preferredDays = Object.entries(dayCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([day]) => parseInt(day));

        // Update contact with engagement profile
        await ctx.db.patch(contact._id, {
          engagementProfile: {
            preferredHours,
            preferredDays,
            avgResponseTime: calculateAvgResponseTime(contactTracking),
            lastCalculated: Date.now(),
          },
        });
      }
    }

    return contacts.length;
  },
});

/**
 * Update timezone profiles for contacts (internal function for cron)
 */
export const updateTimezoneProfiles = internalMutation({
  args: {},
  handler: async (ctx) => {
    const contacts = await ctx.db.query("contacts").collect();
    let updatedCount = 0;

    for (const contact of contacts) {
      // Get recent email tracking data for this contact
      const recentTracking = await ctx.db
        .query("emailTracking")
        .filter((q) => q.eq(q.field("recipient"), contact.email))
        .filter((q) => q.gte(q.field("timestamp"), Date.now() - 30 * 24 * 60 * 60 * 1000)) // last 30 days
        .collect();

      if (recentTracking.length > 0) {
        // Analyze timing patterns to infer timezone
        const activityHours = recentTracking
          .filter(t => t.event === "opened" || t.event === "clicked")
          .map(t => new Date(t.timestamp).getUTCHours());

        // Simple timezone inference based on peak activity hours
        const hourCounts: Record<number, number> = {};
        activityHours.forEach(hour => {
          hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });

        const peakHour = Object.entries(hourCounts)
          .sort(([, a], [, b]) => b - a)[0]?.[0];

        if (peakHour) {
          const inferredTimezone = inferTimezoneFromPeakHour(parseInt(peakHour));
          
          await ctx.db.patch(contact._id, {
            timezone: inferredTimezone,
            updatedAt: Date.now(),
          });
          updatedCount++;
        }
      }
    }

    // Update timezone profiles table
    const existingProfile = await ctx.db
      .query("timezoneProfiles")
      .first();

    if (existingProfile) {
      await ctx.db.patch(existingProfile._id, {
        lastAnalyzed: Date.now(),
        recipientCount: contacts.length,
      });
    } else {
      // Create a sample timezone profile (you might want to get the userId properly)
      const sampleUser = await ctx.db.query("users").first();
      if (sampleUser) {
        await ctx.db.insert("timezoneProfiles", {
          userId: sampleUser._id,
          name: "Global Analysis",
          timezone: "UTC",
          optimalSendTimes: [],
          recipientCount: contacts.length,
          lastAnalyzed: Date.now(),
          createdAt: Date.now(),
        });
      }
    }

    return updatedCount;
  },
});

/**
 * Update ISP send rate configurations (internal function for cron)
 */
export const updateISPSendRates = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Get all contacts to analyze ISP distribution
    const contacts = await ctx.db.query("contacts").collect();
    
    // Analyze ISP distribution
    const ispCounts: Record<string, number> = {};
    contacts.forEach(contact => {
      const domain = contact.email.split('@')[1]?.toLowerCase();
      if (domain) {
        const isp = mapDomainToISP(domain);
        ispCounts[isp] = (ispCounts[isp] || 0) + 1;
      }
    });

    // Update or create send rate configs for each ISP
    const defaultRates = {
      gmail: { emailsPerHour: 100, emailsPerDay: 2000, delayBetweenEmails: 1000 },
      outlook: { emailsPerHour: 80, emailsPerDay: 1500, delayBetweenEmails: 1200 },
      yahoo: { emailsPerHour: 60, emailsPerDay: 1000, delayBetweenEmails: 1500 },
      other: { emailsPerHour: 40, emailsPerDay: 800, delayBetweenEmails: 2000 },
    };

    for (const [isp, count] of Object.entries(ispCounts)) {
      const existingConfig = await ctx.db
        .query("sendRateConfigs")
        .filter((q) => q.eq(q.field("name"), `${isp}_limits`))
        .first();

      const rates = defaultRates[isp as keyof typeof defaultRates] || defaultRates.other;

      if (existingConfig) {
        await ctx.db.patch(existingConfig._id, {
          globalLimits: {
            emailsPerHour: rates.emailsPerHour,
            emailsPerDay: rates.emailsPerDay,
            maxConcurrent: 5,
          },
          updatedAt: Date.now(),
        });
      } else {
        // Get a sample user for the config (you might want to create configs per user)
        const sampleUser = await ctx.db.query("users").first();
        if (sampleUser) {
          await ctx.db.insert("sendRateConfigs", {
            userId: sampleUser._id,
            name: `${isp}_limits`,
            description: `Rate limits for ${isp} email provider`,
            globalLimits: {
              emailsPerHour: rates.emailsPerHour,
              emailsPerDay: rates.emailsPerDay,
              maxConcurrent: 5,
            },
            ispLimits: [{
              domain: isp === 'gmail' ? 'gmail.com' : isp === 'outlook' ? 'outlook.com' : isp === 'yahoo' ? 'yahoo.com' : 'other.com',
              emailsPerHour: rates.emailsPerHour,
              emailsPerDay: rates.emailsPerDay,
              delayBetweenEmails: rates.delayBetweenEmails,
            }],
            isDefault: isp === 'other',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        }
      }
    }

    return Object.keys(ispCounts).length;
  },
});

// Helper functions
function getTimezoneOffset(timezone: string): number {
  // Simplified timezone offset calculation
  // In production, use a proper timezone library like date-fns-tz
  const offsets: Record<string, number> = {
    "UTC": 0,
    "America/New_York": -5 * 60 * 60 * 1000,
    "America/Los_Angeles": -8 * 60 * 60 * 1000,
    "Europe/London": 0,
    "Europe/Paris": 1 * 60 * 60 * 1000,
    "Asia/Tokyo": 9 * 60 * 60 * 1000,
    "Australia/Sydney": 10 * 60 * 60 * 1000,
  };
  
  return offsets[timezone] || 0;
}

function calculateAvgResponseTime(trackingEvents: any[]): number {
  const openEvents = trackingEvents.filter(e => e.event === "opened");
  const clickEvents = trackingEvents.filter(e => e.event === "clicked");
  
  let totalResponseTime = 0;
  let responseCount = 0;
  
  openEvents.forEach(openEvent => {
    const relatedClicks = clickEvents.filter(
      clickEvent => clickEvent.timestamp > openEvent.timestamp &&
      clickEvent.timestamp < openEvent.timestamp + (24 * 60 * 60 * 1000) // within 24 hours
    );
    
    relatedClicks.forEach(clickEvent => {
      totalResponseTime += (clickEvent.timestamp - openEvent.timestamp);
      responseCount++;
    });
  });
  
  return responseCount > 0 ? totalResponseTime / responseCount / (60 * 1000) : 0; // return in minutes
}

function inferTimezoneFromPeakHour(peakHour: number): string {
  // Simple timezone inference based on peak activity hour
  // This assumes peak activity occurs during business hours (9 AM - 5 PM local time)
  const businessHourStart = 9;
  const businessHourEnd = 17;
  const businessHourMid = 13; // 1 PM

  // Calculate offset from UTC based on when business hours would be in UTC
  const offsetFromBusinessHour = peakHour - businessHourMid;
  
  // Map to common timezones
  const timezoneMap: Record<number, string> = {
    '-8': 'America/Los_Angeles',
    '-7': 'America/Denver', 
    '-6': 'America/Chicago',
    '-5': 'America/New_York',
    '0': 'Europe/London',
    '1': 'Europe/Paris',
    '2': 'Europe/Berlin',
    '8': 'Asia/Singapore',
    '9': 'Asia/Tokyo',
    '10': 'Australia/Sydney',
  };

  return timezoneMap[offsetFromBusinessHour] || 'UTC';
}

function mapDomainToISP(domain: string): string {
  const gmailDomains = ['gmail.com', 'googlemail.com'];
  const outlookDomains = ['outlook.com', 'hotmail.com', 'live.com', 'msn.com'];
  const yahooDomains = ['yahoo.com', 'yahoo.co.uk', 'yahoo.ca', 'ymail.com'];

  if (gmailDomains.includes(domain)) return 'gmail';
  if (outlookDomains.includes(domain)) return 'outlook';
  if (yahooDomains.includes(domain)) return 'yahoo';
  
  return 'other';
}
