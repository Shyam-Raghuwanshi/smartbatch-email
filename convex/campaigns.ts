import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Check if user can create a campaign with the given recipient count
 */
export const canCreateCampaign = query({
  args: {
    targetTags: v.array(v.string()),
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

    // Count potential recipients
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const recipientCount = args.targetTags.length === 0 
      ? contacts.length 
      : contacts.filter(contact => 
          contact.tags?.some(tag => args.targetTags.includes(tag))
        ).length;

    // Check monthly usage
    return {
      canCreate: true,
      recipientCount,
      message: `Campaign can be sent to ${recipientCount} recipients`
    };
  },
});

// Create campaign
export const createCampaign = mutation({
  args: {
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
    settings: v.object({
      subject: v.string(),
      templateId: v.optional(v.id("templates")),
      customContent: v.optional(v.string()),
      targetTags: v.array(v.string()),
      sendDelay: v.optional(v.number()),
      trackOpens: v.boolean(),
      trackClicks: v.boolean(),
      emailConfig: v.optional(v.object({
        emailSettingsId: v.optional(v.id("emailSettings")),
        customFromName: v.optional(v.string()),
        customFromEmail: v.optional(v.string()),
        replyToEmail: v.optional(v.string()),
      })),
    }),
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
    })),
  },
  handler: async (ctx, args) => {
    // Check if user has any email settings configured
    const emailSettings = await ctx.db
      .query("emailSettings")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    if (!emailSettings || emailSettings.length === 0) {
      throw new Error("Email settings not configured. Please set up your email configuration in settings before creating campaigns.");
    }

    const campaignId = await ctx.db.insert("campaigns", {
      ...args,
      createdAt: Date.now(),
    });
    
    // If campaign is scheduled, create a schedule entry
    if (args.scheduledAt && args.status === "scheduled") {
      // Get recipient count for this campaign
      const contacts = await ctx.db
        .query("contacts")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect();

      const recipientCount = contacts.filter(contact => 
        contact.tags?.some(tag => args.settings.targetTags.includes(tag))
      ).length;

      await ctx.db.insert("campaignSchedules", {
        campaignId,
        userId: args.userId,
        scheduledAt: args.scheduledAt,
        status: "pending",
        recipientCount,
        createdAt: Date.now(),
      });
    }
    
    return campaignId;
  },
});

// Get campaigns by user (authenticated)
export const getCampaignsByUser = query({
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
      .query("campaigns")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

// Alias for getUserCampaigns (for dashboard compatibility)
export const getUserCampaigns = query({
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
      .query("campaigns")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

// Get campaign by ID
export const getCampaignById = query({
  args: { id: v.id("campaigns") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const campaign = await ctx.db.get(args.id);
    if (!campaign) {
      return null;
    }
    
    // Verify user owns this campaign
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    
    if (!user || campaign.userId !== user._id) {
      throw new Error("Unauthorized");
    }
    
    return campaign;
  },
});

// Update campaign
export const updateCampaign = mutation({
  args: {
    id: v.id("campaigns"),
    name: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("scheduled"),
      v.literal("sending"),
      v.literal("sent"),
      v.literal("paused"),
      v.literal("cancelled")
    )),
    scheduledAt: v.optional(v.number()),
    settings: v.optional(v.object({
      subject: v.string(),
      templateId: v.optional(v.id("templates")),
      customContent: v.optional(v.string()),
      targetTags: v.array(v.string()),
      sendDelay: v.optional(v.number()),
      trackOpens: v.boolean(),
      trackClicks: v.boolean(),
      emailConfig: v.optional(v.object({
        emailSettingsId: v.optional(v.id("emailSettings")),
        customFromName: v.optional(v.string()),
        customFromEmail: v.optional(v.string()),
        replyToEmail: v.optional(v.string()),
      })),
    })),
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
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const campaign = await ctx.db.get(args.id);
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

    const { id, ...updates } = args;
    
    // If status is changing to "sending", we need to queue emails
    if (updates.status === "sending" && campaign.status !== "sending") {
      console.log("🚀 Campaign status changing to 'sending', queuing emails for campaign:", id);
      await ctx.runMutation(internal.campaigns.queueCampaignEmails, {
        campaignId: id,
        userId: user._id,
      });
      console.log("✅ Campaign emails queued successfully for campaign:", id);
    }
    
    // If status is changing to "sent", create a completion notification
    if (updates.status === "sent" && campaign.status !== "sent") {
      // Get campaign email stats for the notification
      const emailQueue = await ctx.db
        .query("emailQueue")
        .withIndex("by_campaign", (q) => q.eq("campaignId", id))
        .collect();
      
      const sentCount = emailQueue.filter(e => e.status === "sent").length;
      
      await ctx.runMutation(internal.notifications.createNotification, {
        userId: user._id,
        title: "Campaign Completed",
        message: `Your "${campaign.name}" campaign has finished sending to ${sentCount} contacts`,
        type: "success",
        category: "campaign",
        data: {
          campaignId: id,
          contactCount: sentCount,
        },
      });
    }
    
    await ctx.db.patch(id, updates);
    return id;
  },
});

// Delete campaign
export const deleteCampaign = mutation({
  args: { id: v.id("campaigns") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const campaign = await ctx.db.get(args.id);
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
    
    await ctx.db.delete(args.id);
  },
});

// Get campaigns by status (admin function)
export const getCampaignsByStatus = query({
  args: { 
    status: v.union(
      v.literal("draft"),
      v.literal("scheduled"),
      v.literal("sending"),
      v.literal("sent"),
      v.literal("paused"),
      v.literal("cancelled")
    )
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("campaigns")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();
  },
});

// Get scheduled campaigns (system function)
export const getScheduledCampaigns = query({
  handler: async (ctx) => {
    const now = Date.now();
    return await ctx.db
      .query("campaigns")
      .withIndex("by_scheduled_at")
      .filter((q) => 
        q.and(
          q.eq(q.field("status"), "scheduled"),
          q.lte(q.field("scheduledAt"), now)
        )
      )
      .collect();
  },
});

// Duplicate campaign
export const duplicateCampaign = mutation({
  args: { id: v.id("campaigns") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const originalCampaign = await ctx.db.get(args.id);
    if (!originalCampaign) {
      throw new Error("Campaign not found");
    }
    
    // Verify user owns this campaign
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    
    if (!user || originalCampaign.userId !== user._id) {
      throw new Error("Unauthorized");
    }
    
    // Create duplicate with modified name and draft status
    const duplicatedCampaignId = await ctx.db.insert("campaigns", {
      userId: user._id,
      name: `${originalCampaign.name} (Copy)`,
      status: "draft",
      settings: originalCampaign.settings,
      createdAt: Date.now(),
    });
    
    return duplicatedCampaignId;
  },
});

// Get campaign statistics
export const getCampaignStats = query({
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
    
    // Get emails for this campaign
    const emails = await ctx.db
      .query("emails")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .collect();
    
    // Get analytics for this campaign
    const analytics = await ctx.db
      .query("analytics")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .collect();
    
    // Calculate stats
    const stats = {
      totalEmails: emails.length,
      sent: emails.filter(e => e.status === "sent").length,
      pending: emails.filter(e => e.status === "pending").length,
      failed: emails.filter(e => e.status === "failed").length,
      delivered: analytics.filter(a => a.metric === "delivered").length,
      opened: analytics.filter(a => a.metric === "opened").length,
      clicked: analytics.filter(a => a.metric === "clicked").length,
      bounced: analytics.filter(a => a.metric === "bounced").length,
      unsubscribed: analytics.filter(a => a.metric === "unsubscribed").length,
    };
    
    return {
      ...stats,
      openRate: stats.delivered > 0 ? (stats.opened / stats.delivered * 100) : 0,
      clickRate: stats.delivered > 0 ? (stats.clicked / stats.delivered * 100) : 0,
      bounceRate: stats.sent > 0 ? (stats.bounced / stats.sent * 100) : 0,
    };
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

// Internal function to queue emails when campaign starts
export const queueCampaignEmails = internalMutation({
  args: {
    campaignId: v.id("campaigns"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    console.log("📋 Starting to queue campaign emails for campaign:", args.campaignId);
    
    // Check if user has any email settings configured
    const emailSettings = await ctx.db
      .query("emailSettings")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    if (!emailSettings || emailSettings.length === 0) {
      console.log("❌ No email settings configured for user:", args.userId);
      throw new Error("Email settings not configured. Please set up your email configuration in settings before sending campaigns.");
    }
    
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign || !campaign.settings) {
      console.log("❌ Campaign not found or missing settings:", args.campaignId);
      throw new Error("Campaign not found or missing settings");
    }

    // Get contacts matching the campaign's target tags
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Filter contacts by target tags
    const targetContacts = contacts.filter(contact => {
      return campaign.settings!.targetTags.some(tag => 
        contact.tags && contact.tags.includes(tag)
      );
    });

    const emailQueueIds: string[] = [];
    
    for (const contact of targetContacts) {
      // Check if contact is unsubscribed
      const unsubscribe = await ctx.db
        .query("unsubscribes")
        .filter((q) => q.eq(q.field("email"), contact.email))
        .filter((q) => q.eq(q.field("userId"), args.userId))
        .first();

      if (unsubscribe) continue;

      // Generate unsubscribe token
      const unsubscribeToken = crypto.randomUUID();
      
      let htmlContent = campaign.settings.customContent || "";
      let textContent = campaign.settings.customContent || "";
      let subject = campaign.settings.subject;

      if (campaign.settings.templateId) {
        const template = await ctx.db.get(campaign.settings.templateId);
        if (template) {
          htmlContent = template.content;
          textContent = template.content;
          subject = template.subject;
        }
      }

      // Ensure we have some content - if both are empty, provide fallback
      if (!htmlContent.trim() && !textContent.trim()) {
        const fallbackContent = "This is an email from your SmartBatch campaign.";
        htmlContent = `<p>${fallbackContent}</p>`;
        textContent = fallbackContent;
      }

      // Replace variables with both formats for compatibility
      const name = `${contact.firstName || ""} ${contact.lastName || ""}`.trim();
      
      // Handle {{variable}} format
      htmlContent = htmlContent.replace(/{{name}}/g, name);
      htmlContent = htmlContent.replace(/{{firstName}}/g, contact.firstName || "");
      htmlContent = htmlContent.replace(/{{lastName}}/g, contact.lastName || "");
      htmlContent = htmlContent.replace(/{{email}}/g, contact.email || "");
      htmlContent = htmlContent.replace(/{{company}}/g, contact.company || "");
      htmlContent = htmlContent.replace(/{{companyName}}/g, contact.company || "");
      
      // Handle {variable} format for backward compatibility  
      htmlContent = htmlContent.replace(/{name}/g, name);
      htmlContent = htmlContent.replace(/{firstName}/g, contact.firstName || "");
      htmlContent = htmlContent.replace(/{lastName}/g, contact.lastName || "");
      htmlContent = htmlContent.replace(/{email}/g, contact.email || "");
      htmlContent = htmlContent.replace(/{company}/g, contact.company || "");
      htmlContent = htmlContent.replace(/{companyName}/g, contact.company || "");
      
      // Apply same replacements to text and subject
      textContent = textContent.replace(/{{name}}/g, name);
      textContent = textContent.replace(/{{firstName}}/g, contact.firstName || "");
      textContent = textContent.replace(/{{lastName}}/g, contact.lastName || "");
      textContent = textContent.replace(/{{email}}/g, contact.email || "");
      textContent = textContent.replace(/{{company}}/g, contact.company || "");
      textContent = textContent.replace(/{{companyName}}/g, contact.company || "");
      textContent = textContent.replace(/{name}/g, name);
      textContent = textContent.replace(/{firstName}/g, contact.firstName || "");
      textContent = textContent.replace(/{lastName}/g, contact.lastName || "");
      textContent = textContent.replace(/{email}/g, contact.email || "");
      textContent = textContent.replace(/{company}/g, contact.company || "");
      textContent = textContent.replace(/{companyName}/g, contact.company || "");
      
      subject = subject.replace(/{{name}}/g, name);
      subject = subject.replace(/{{firstName}}/g, contact.firstName || "");
      subject = subject.replace(/{{lastName}}/g, contact.lastName || "");
      subject = subject.replace(/{{email}}/g, contact.email || "");
      subject = subject.replace(/{{company}}/g, contact.company || "");
      subject = subject.replace(/{{companyName}}/g, contact.company || "");
      subject = subject.replace(/{name}/g, name);
      subject = subject.replace(/{firstName}/g, contact.firstName || "");
      subject = subject.replace(/{lastName}/g, contact.lastName || "");
      subject = subject.replace(/{email}/g, contact.email || "");
      subject = subject.replace(/{company}/g, contact.company || "");
      subject = subject.replace(/{companyName}/g, contact.company || "");

      const user = await ctx.db.get(args.userId);
      if (!user) throw new Error("User not found");

      // Get default email settings for the user
      const defaultEmailSettings = await ctx.db
        .query("emailSettings")
        .withIndex("by_user_default", (q) => q.eq("userId", user._id).eq("isDefault", true))
        .first();

      // Determine sender information from campaign settings
      let fromEmail = user.email;
      let fromName = user.name;
      let replyTo = undefined;

      // Use default email settings if available
      if (defaultEmailSettings && defaultEmailSettings.isActive) {
        fromEmail = defaultEmailSettings.configuration.defaultFromEmail;
        fromName = defaultEmailSettings.configuration.defaultFromName;
        replyTo = defaultEmailSettings.configuration.replyToEmail;
      }

      // Allow campaign-specific overrides
      if (campaign.settings.emailConfig) {
        fromEmail = campaign.settings.emailConfig.customFromEmail || fromEmail;
        fromName = campaign.settings.emailConfig.customFromName || fromName;
        replyTo = campaign.settings.emailConfig.replyToEmail || replyTo;
      }

      const emailQueueId = await ctx.db.insert("emailQueue", {
        userId: args.userId,
        campaignId: args.campaignId,
        recipient: contact.email,
        subject,
        htmlContent,
        textContent,
        fromEmail,
        fromName,
        replyTo,
        status: "queued",
        priority: 5,
        scheduledAt: Date.now(),
        attemptCount: 0,
        maxAttempts: 3,
        metadata: {
          templateId: campaign.settings.templateId,
          variables: {
            name,
            email: contact.email,
            firstName: contact.firstName,
            lastName: contact.lastName,
          },
          trackOpens: campaign.settings.trackOpens,
          trackClicks: campaign.settings.trackClicks,
          unsubscribeToken,
          // Email configuration metadata
          emailSettingsId: campaign.settings.emailConfig?.emailSettingsId || defaultEmailSettings?._id,
          originalFromName: fromName,
          originalFromEmail: fromEmail,
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      emailQueueIds.push(emailQueueId);
    }

    console.log("✅ Campaign email queuing completed!");
    console.log("📊 Results:", {
      totalTargetContacts: targetContacts.length,
      emailsQueued: emailQueueIds.length,
      emailsSkipped: targetContacts.length - emailQueueIds.length
    });

    return { emailsQueued: emailQueueIds.length, skippedContacts: targetContacts.length - emailQueueIds.length };
  },
});

// Update campaign status
export const updateCampaignStatus = mutation({
  args: {
    id: v.id("campaigns"),
    status: v.union(
      v.literal("draft"),
      v.literal("scheduled"),
      v.literal("sending"),
      v.literal("sent"),
      v.literal("paused"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const campaign = await ctx.db.get(args.id);
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
    
    await ctx.db.patch(args.id, {
      status: args.status,
    });
    
    // If pausing or cancelling, update any pending schedule entries
    if (args.status === "paused" || args.status === "cancelled") {
      const scheduleEntries = await ctx.db
        .query("campaignSchedules")
        .withIndex("by_campaign", (q) => q.eq("campaignId", args.id))
        .filter((q) => q.eq(q.field("status"), "pending"))
        .collect();
      
      for (const entry of scheduleEntries) {
        await ctx.db.patch(entry._id, {
          status: args.status === "paused" ? "skipped" : "failed",
        });
      }
    }
    
    return { success: true };
  },
});
