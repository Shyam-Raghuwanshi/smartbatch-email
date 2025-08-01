import { api, internal } from "./_generated/api";
import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { components } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Import and export the resend component
export const { resend } = components;

/**
 * Handle email events (placeholder for Resend webhook)
 */
export const handleEmailEvent = internalMutation({
  args: {
    id: v.string(),
    event: v.object({
      type: v.string(),
      data: v.optional(v.any()),
    }),
  },
  handler: async (ctx, args) => {
    console.log("Email event received:", args.id, args.event);
    
    // Find the email queue entry by resend email ID
    const emailQueue = await ctx.db
      .query("emailQueue")
      .filter((q) => q.eq(q.field("resendEmailId"), args.id))
      .first();

    if (!emailQueue) {
      console.warn("Email queue entry not found for resend ID:", args.id);
      return;
    }

    // Create tracking record
    await ctx.db.insert("emailTracking", {
      emailQueueId: emailQueue._id,
      resendEmailId: args.id,
      recipient: emailQueue.recipient,
      event: args.event.type as any,
      timestamp: Date.now(),
      data: args.event.data || {},
      userAgent: args.event.data?.userAgent,
      ipAddress: args.event.data?.ipAddress,
    });

    // Update email queue status based on event
    let updateData: any = {
      updatedAt: Date.now(),
    };

    switch (args.event.type) {
      case "sent":
        updateData.status = "sent";
        updateData.sentAt = Date.now();
        break;
      case "delivered":
        // Keep status as sent, but track delivery
        break;
      case "bounced":
      case "complained":
        updateData.status = "failed";
        updateData.errorMessage = `Email ${args.event.type}: ${JSON.stringify(args.event.data)}`;
        break;
    }

    await ctx.db.patch(emailQueue._id, updateData);

    // Update campaign analytics and status if this email is part of a campaign
    if (emailQueue.campaignId) {
      // Update campaign status based on email queue state
      await ctx.runMutation(internal.campaignTasks.updateCampaignStatus, {
        campaignId: emailQueue.campaignId
      });
      
      // Record analytics for this event
      await ctx.db.insert("analytics", {
        campaignId: emailQueue.campaignId,
        metric: args.event.type as any,
        value: 1,
        timestamp: Date.now(),
        metadata: {
          recipientEmail: emailQueue.recipient,
          userAgent: args.event.data?.userAgent,
          ipAddress: args.event.data?.ipAddress,
        },
      });
    }

    // Update contact email stats
    const contact = await ctx.db
      .query("contacts")
      .filter((q) => q.eq(q.field("email"), emailQueue.recipient))
      .first();

    if (contact) {
      const stats = contact.emailStats || {
        totalSent: 0,
        totalOpened: 0,
        totalClicked: 0,
      };

      if (args.event.type === "sent") {
        stats.totalSent++;
      } else if (args.event.type === "opened") {
        stats.totalOpened++;
        stats.lastOpenedAt = Date.now();
      } else if (args.event.type === "clicked") {
        stats.totalClicked++;
        stats.lastClickedAt = Date.now();
      }

      await ctx.db.patch(contact._id, {
        emailStats: stats,
        lastEngagement: Date.now(),
        updatedAt: Date.now(),
      });
    }

    // Handle A/B test tracking if this is an A/B test email
    if (emailQueue.metadata?.abTestId && emailQueue.metadata?.variantId) {
      const trackingEvent = args.event.type as "delivered" | "opened" | "clicked" | "bounced" | "complained";
      
      // Only track events that are relevant to A/B testing
      if (["delivered", "opened", "clicked", "bounced", "complained"].includes(trackingEvent)) {
        await ctx.runMutation(internal.emailService.trackABTestEvent, {
          emailQueueId: emailQueue._id,
          event: trackingEvent,
          metadata: args.event.data,
        });
      }
    }
  },
});

/**
 * Send a single email
 */
export const sendEmail = mutation({
  args: {
    recipient: v.string(),
    subject: v.string(),
    htmlContent: v.string(),
    textContent: v.optional(v.string()),
    fromEmail: v.string(),
    fromName: v.optional(v.string()),
    replyTo: v.optional(v.string()),
    templateId: v.optional(v.id("templates")),
    variables: v.optional(v.record(v.string(), v.any())),
    campaignId: v.optional(v.id("campaigns")),
    scheduledAt: v.optional(v.number()),
    priority: v.optional(v.number()),
    trackOpens: v.optional(v.boolean()),
    trackClicks: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<string> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check monthly email usage for free plan users
    const monthlyUsage = await ctx.runQuery(internal.userEmailUsage.getMonthlyEmailUsage, {
      userId: user._id,
    });

    const userPlan = user.subscription.plan || "free";
    const monthlyLimit = userPlan === "free" ? 10 : 10000; // Free plan: 10 emails, Pro plan: 10,000 emails

    if (monthlyUsage >= monthlyLimit) {
      throw new Error(`Monthly email limit reached (${monthlyLimit} emails). Please upgrade your plan to send more emails.`);
    }
    console.log("inside sendmail")

    // Check rate limits including monthly limits
    const rateLimit = await ctx.runQuery(internal.rateLimiter.checkRateLimit, {
      userId: user._id,
      emailCount: 1,
    });

    if (!rateLimit.canSend && !args.scheduledAt) {
      let errorMessage = "Rate limit exceeded. ";
      if (rateLimit.remaining.monthly <= 0) {
        errorMessage += `You've reached your monthly limit of ${rateLimit.limits.emailsPerMonth} emails. `;
        if (user.subscription?.plan === "free") {
          errorMessage += "Please upgrade your plan to send more emails.";
        }
      } else if (rateLimit.remaining.daily <= 0) {
        errorMessage += `You can send ${rateLimit.remaining.daily} more emails today.`;
      } else if (rateLimit.remaining.hourly <= 0) {
        errorMessage += `You can send ${rateLimit.remaining.hourly} more emails this hour.`;
      }
      throw new Error(errorMessage);
    }

    // Check if email is unsubscribed
    const unsubscribe = await ctx.db
      .query("unsubscribes")
      .filter((q) => q.eq(q.field("email"), args.recipient))
      .filter((q) => q.eq(q.field("userId"), user._id))
      .first();

    if (unsubscribe) {
      throw new Error("Recipient has unsubscribed");
    }

    // TODO: Re-enable template processing after fixing imports
    // Process template and variables using template processor
    let { htmlContent, textContent, subject } = args;
    
    if (args.templateId && args.variables) {
      // const processedTemplate = await ctx.runMutation(internal.templateProcessor.processEmailTemplate, {
      //   templateId: args.templateId,
      //   recipient: args.recipient,
      //   variables: args.variables,
      //   baseUrl: process.env.CONVEX_SITE_URL || "http://localhost:3000",
      // });
      
      // htmlContent = processedTemplate.htmlContent;
      // textContent = processedTemplate.textContent;
      // subject = processedTemplate.subject;
      
      // Manual template processing for now
      const template = await ctx.db.get(args.templateId);
      if (template) {
        // Get contact information for personalization
        const contact = await ctx.db
          .query("contacts")
          .filter((q) => q.eq(q.field("email"), args.recipient))
          .first();

        console.log("DEBUG: Template found:", template.subject);
        console.log("DEBUG: Contact found:", contact);

        const allVariables = {
          ...args.variables,
          email: args.recipient,
          firstName: contact?.firstName || "",
          lastName: contact?.lastName || "",
          fullName: contact?.firstName && contact?.lastName 
            ? `${contact.firstName} ${contact.lastName}`
            : contact?.firstName || contact?.lastName || "",
          company: contact?.company || "",
          position: contact?.position || "",
          ...contact?.customFields,
        };

        console.log("DEBUG: All variables:", allVariables);
        console.log("DEBUG: Template content before processing:", template.htmlContent || template.content);

        htmlContent = processTemplate(template.htmlContent || template.content, allVariables);
        textContent = processTemplate(template.content, allVariables);
        subject = processTemplate(template.subject, allVariables);

        console.log("DEBUG: Processed content:", { subject, htmlContent: htmlContent.substring(0, 200) });
      }
    } else {
      // Manual template processing for non-template emails
      const contact = await ctx.db
        .query("contacts")
        .filter((q) => q.eq(q.field("email"), args.recipient))
        .first();

      const allVariables = {
        ...args.variables,
        email: args.recipient,
        firstName: contact?.firstName || "",
        lastName: contact?.lastName || "",
        fullName: contact?.firstName && contact?.lastName 
          ? `${contact.firstName} ${contact.lastName}`
          : contact?.firstName || contact?.lastName || "",
        company: contact?.company || "",
        position: contact?.position || "",
        ...contact?.customFields,
      };

      for (const [key, value] of Object.entries(allVariables)) {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        htmlContent = htmlContent.replace(regex, String(value));
        textContent = textContent?.replace(regex, String(value));
        subject = subject.replace(regex, String(value));
      }
    }

    // Generate unsubscribe token
    const unsubscribeToken = crypto.randomUUID();
    
    // Inject unsubscribe link
    const unsubscribeLink = `${process.env.CONVEX_SITE_URL}/unsubscribe?token=${unsubscribeToken}`;
    htmlContent = injectUnsubscribeLink(htmlContent, unsubscribeLink);

    // Create email queue entry
    const emailQueueId = await ctx.db.insert("emailQueue", {
      userId: user._id,
      campaignId: args.campaignId,
      recipient: args.recipient,
      subject,
      htmlContent,
      textContent,
      fromEmail: args.fromEmail,
      fromName: args.fromName,
      replyTo: args.replyTo,
      status: "queued",
      priority: args.priority || 5,
      scheduledAt: args.scheduledAt,
      attemptCount: 0,
      maxAttempts: 3,
      metadata: {
        templateId: args.templateId,
        variables: args.variables,
        trackOpens: args.trackOpens ?? true,
        trackClicks: args.trackClicks ?? true,
        unsubscribeToken,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // If not scheduled, send immediately
    if (!args.scheduledAt) {
      await ctx.scheduler.runAfter(0, internal.emailService.processEmailQueue, {
        emailQueueId,
      });
    }

    return emailQueueId;
  },
});

/**
 * Send batch emails
 */
export const sendBatchEmails = mutation({
  args: {
    emails: v.array(v.object({
      recipient: v.string(),
      subject: v.string(),
      htmlContent: v.string(),
      textContent: v.optional(v.string()),
      variables: v.optional(v.record(v.string(), v.any())),
    })),
    fromEmail: v.string(),
    fromName: v.optional(v.string()),
    replyTo: v.optional(v.string()),
    templateId: v.optional(v.id("templates")),
    campaignId: v.optional(v.id("campaigns")),
    batchName: v.string(),
    batchSize: v.optional(v.number()),
    delayBetweenBatches: v.optional(v.number()),
    scheduledAt: v.optional(v.number()),
    priority: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<{
    batchId: string;
    optimalConfiguration: any;
    emailsQueued: number;
    emailsSkipped: number;
  }> => {
    console.log("inside sendbatchemails")

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check monthly email usage for free plan users
    const monthlyUsage = await ctx.runQuery(internal.userEmailUsage.getMonthlyEmailUsage, {
      userId: user._id,
    });

    const userPlan = user.subscription.plan || "free";
    const monthlyLimit = userPlan === "free" ? 10 : 10000; // Free plan: 10 emails, Pro plan: 10,000 emails
    const remainingEmails = monthlyLimit - monthlyUsage;

    if (remainingEmails <= 0) {
      throw new Error(`Monthly email limit reached (${monthlyLimit} emails). Please upgrade your plan to send more emails.`);
    }

    // Limit batch size to remaining emails for free plan
    const emailsToSend = Math.min(args.emails.length, remainingEmails);
    const emailsToProcess = args.emails.slice(0, emailsToSend);
    const emailsSkipped = args.emails.length - emailsToSend;

    if (emailsSkipped > 0) {
      console.warn(`Skipping ${emailsSkipped} emails due to monthly limit. ${remainingEmails} emails remaining this month.`);
    }

    // Check rate limits and calculate optimal batch configuration
    const rateLimit = await ctx.runQuery(internal.rateLimiter.checkRateLimit, {
      userId: user._id,
      emailCount: args.emails.length,
    });

    if (!rateLimit.canSend && !args.scheduledAt) {
      let errorMessage = "Rate limit exceeded. ";
      if (rateLimit.remaining.monthly < args.emails.length) {
        errorMessage += `You need ${args.emails.length} emails but only have ${rateLimit.remaining.monthly} left this month. `;
        if (user.subscription?.plan === "free") {
          errorMessage += "Please upgrade your plan to send more emails.";
        }
      } else if (rateLimit.remaining.daily < args.emails.length) {
        errorMessage += `You can send ${rateLimit.remaining.daily} more emails today.`;
      } else if (rateLimit.remaining.hourly < args.emails.length) {
        errorMessage += `You can send ${rateLimit.remaining.hourly} more emails this hour.`;
      }
      throw new Error(errorMessage);
    }

    // TODO: Re-enable optimal batch calculation after fixing rateLimiter
    // const optimalBatch: any = await ctx.runQuery(internal.rateLimiter.calculateOptimalBatch, {
    //   userId: user._id,
    //   totalEmails: args.emails.length,
    // });

    const batchSize: number = args.batchSize || 10; // Default batch size
    const delayBetweenBatches = args.delayBetweenBatches || 60000; // Default 1 minute delay
    const emailQueueIds: string[] = [];
    let emailsSkippedInLoop = 0;

    // Create email queue entries for all emails
    for (const email of emailsToProcess) {
      // Check unsubscribe status
      const unsubscribe = await ctx.db
        .query("unsubscribes")
        .filter((q) => q.eq(q.field("email"), email.recipient))
        .filter((q) => q.eq(q.field("userId"), user._id))
        .first();

      if (unsubscribe) {
        emailsSkippedInLoop++;
        continue; // Skip unsubscribed emails
      }

      // Get contact for personalization
      const contact = await ctx.db
        .query("contacts")
        .filter((q) => q.eq(q.field("email"), email.recipient))
        .first();

      // Build allVariables for template replacement
      const allVariables = {
        ...email.variables,
        email: email.recipient,
        firstName: contact?.firstName || "",
        lastName: contact?.lastName || "",
        fullName: contact?.firstName && contact?.lastName 
          ? `${contact.firstName} ${contact.lastName}`
          : contact?.firstName || contact?.lastName || "",
        company: contact?.company || "",
        position: contact?.position || "",
        ...contact?.customFields,
      };
      console.log("DEBUG: All variables for email:", allVariables);
      // Use processTemplate for all variable replacement
      let { htmlContent, textContent, subject } = email;
      if (args.templateId && email.variables) {

        console.log("variables-----", email.variables)
        const template = await ctx.db.get(args.templateId);
        if (template) {
          htmlContent = processTemplate(template.htmlContent || template.content || "", allVariables);
          textContent = processTemplate(template.content || "", allVariables);
          subject = processTemplate(template.subject || subject, allVariables);
        }
      } else {
        htmlContent = processTemplate(htmlContent || "", allVariables);
        textContent = processTemplate(textContent || "", allVariables);
        subject = processTemplate(subject || "", allVariables);
      }

      // Generate unsubscribe token
      const unsubscribeToken = crypto.randomUUID();
      const unsubscribeLink = `${process.env.CONVEX_SITE_URL}/unsubscribe?token=${unsubscribeToken}`;
      htmlContent = injectUnsubscribeLink(htmlContent, unsubscribeLink);

      const emailQueueId = await ctx.db.insert("emailQueue", {
        userId: user._id,
        campaignId: args.campaignId,
        recipient: email.recipient,
        subject,
        htmlContent,
        textContent,
        fromEmail: args.fromEmail,
        fromName: args.fromName,
        replyTo: args.replyTo,
        status: "queued",
        priority: args.priority || 5,
        scheduledAt: args.scheduledAt,
        attemptCount: 0,
        maxAttempts: 3,
        metadata: {
          templateId: args.templateId,
          variables: email.variables,
          trackOpens: true,
          trackClicks: true,
          unsubscribeToken,
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      emailQueueIds.push(emailQueueId);
    }

    // Create batch record
    const batchId: any = await ctx.db.insert("emailBatches", {
      userId: user._id,
      campaignId: args.campaignId,
      name: args.batchName,
      status: "pending",
      totalEmails: emailQueueIds.length,
      processedEmails: 0,
      successfulEmails: 0,
      failedEmails: 0,
      batchSize,
      delayBetweenBatches,
      scheduledAt: args.scheduledAt,
      emailQueueIds: emailQueueIds as any,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Schedule batch processing
    if (!args.scheduledAt) {
      await ctx.scheduler.runAfter(0, internal.emailService.processBatch, {
        batchId,
      });
    }

    return {
      batchId,
      optimalConfiguration: { batchSize, delayBetweenBatches },
      emailsQueued: emailQueueIds.length,
      emailsSkipped: emailsSkipped + emailsSkippedInLoop,
    };
  },
});

/**
 * Send A/B Test Campaign with automatic variant distribution
 */
export const sendABTestCampaign = mutation({
  args: {
    testId: v.id("abTests"),
    batchSize: v.optional(v.number()),
    delayBetweenBatches: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    console.log("inside sendabtestcampaign")
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

    // Get A/B test details
    const test = await ctx.db.get(args.testId);
    if (!test || test.userId !== user._id) {
      throw new Error("A/B test not found or unauthorized");
    }

    if (test.status !== "active") {
      throw new Error("A/B test is not active");
    }

    // Get test variants
    const variants = await ctx.db
      .query("abTestVariants")
      .withIndex("by_test", (q) => q.eq("testId", args.testId))
      .collect();

    if (variants.length === 0) {
      throw new Error("No variants found for A/B test");
    }

    const batchSize = args.batchSize || 10;
    const delayBetweenBatches = args.delayBetweenBatches || 60000;
    const emailQueueIds: Id<"emailQueue">[] = [];

    // Send emails for each variant
    for (const variant of variants) {
      const recipients = variant.assignedRecipients;

      for (const recipient of recipients) {
        // Check unsubscribe status
        const unsubscribe = await ctx.db
          .query("unsubscribes")
          .filter((q) => q.eq(q.field("email"), recipient))
          .filter((q) => q.eq(q.field("userId"), user._id))
          .first();

        if (unsubscribe) {
          continue; // Skip unsubscribed emails
        }

        // Get contact for personalization
        const contact = await ctx.db
          .query("contacts")
          .filter((q) => q.eq(q.field("email"), recipient))
          .first();

        // Process variant configuration
        let { subject, customContent, templateId, fromName, fromEmail } = variant.campaignConfig;
        let htmlContent = customContent || "";
        let textContent = "";

        // Build allVariables for template replacement
        const allVariables = {
          firstName: contact?.firstName || "",
          lastName: contact?.lastName || "",
          email: recipient,
          fullName: contact?.firstName && contact?.lastName 
            ? `${contact.firstName} ${contact.lastName}`
            : contact?.firstName || recipient,
          company: contact?.company || "",
          position: contact?.position || "",
          ...contact?.customFields,
        };

        // Apply template if specified
        if (templateId) {
          const template = await ctx.db.get(templateId);
          if (template) {
            htmlContent = processTemplate(template.htmlContent || template.content || "", allVariables);
            textContent = processTemplate(template.content || "", allVariables);
            subject = processTemplate(subject, allVariables);
          }
        } else {
          htmlContent = processTemplate(htmlContent, allVariables);
          textContent = processTemplate(textContent, allVariables);
          subject = processTemplate(subject, allVariables);
        }

        // Generate unsubscribe token
        const unsubscribeToken = crypto.randomUUID();
        const unsubscribeLink = `${process.env.CONVEX_SITE_URL}/unsubscribe?token=${unsubscribeToken}`;
        htmlContent = injectUnsubscribeLink(htmlContent, unsubscribeLink);

        // Create email queue entry
        const emailQueueId = await ctx.db.insert("emailQueue", {
          userId: user._id,
          campaignId: variant.campaignId,
          recipient,
          subject,
          htmlContent,
          textContent,
          fromEmail: fromEmail || user.email,
          fromName: fromName || user.name,
          status: "queued",
          priority: 5,
          attemptCount: 0,
          maxAttempts: 3,
          scheduledAt: Date.now(),
          metadata: {
            abTestId: args.testId,
            variantId: variant._id,
            trackOpens: true,
            trackClicks: true,
            unsubscribeToken,
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });

        emailQueueIds.push(emailQueueId);

        // Update A/B test segment with sent event
        const segment = await ctx.db
          .query("abTestSegments")
          .withIndex("by_recipient", (q) => q.eq("recipientEmail", recipient))
          .filter((q) => q.eq(q.field("testId"), args.testId))
          .first();

        if (segment) {
          const events = segment.events || [];
          events.push({
            type: "sent",
            timestamp: Date.now(),
            metadata: { emailQueueId },
          });
          await ctx.db.patch(segment._id, { events });
        }
      }
    }

    // Create batch for processing
    const batchId = await ctx.db.insert("emailBatches", {
      userId: user._id,
      name: `A/B Test: ${test.name}`,
      status: "pending",
      totalEmails: emailQueueIds.length,
      processedEmails: 0,
      successfulEmails: 0,
      failedEmails: 0,
      batchSize,
      delayBetweenBatches,
      emailQueueIds,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Schedule batch processing
    await ctx.scheduler.runAfter(0, internal.emailService.processBatch, {
      batchId,
    });

    return { batchId, totalEmails: emailQueueIds.length };
  },
});

/**
 * Process a single email from the queue
 */
export const processEmailQueue = internalMutation({
  args: {
    emailQueueId: v.id("emailQueue"),
  },
  handler: async (ctx, args) => {
    const emailQueue = await ctx.db.get(args.emailQueueId);
    if (!emailQueue) {
      return;
    }

    // Check if email is scheduled for future
    if (emailQueue.scheduledAt && emailQueue.scheduledAt > Date.now()) {
      return;
    }

    // Check if already processed or max attempts reached
    if (emailQueue.status !== "queued" || emailQueue.attemptCount >= emailQueue.maxAttempts) {
      return;
    }

    try {
      // Update status to processing
      await ctx.db.patch(emailQueue._id, {
        status: "processing",
        attemptCount: emailQueue.attemptCount + 1,
        lastAttemptAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Get user's email settings (if specified) or use default
      let emailSettings = null;
      let user = null;
      
      if (emailQueue.userId) {
        user = await ctx.db.get(emailQueue.userId);
        if (user) {
          // Try to get specific email settings or default
          const emailSettingsId = emailQueue.metadata?.emailSettingsId;
          emailSettings = await ctx.runQuery(api.emailSettings.getEmailSettingsForSending, {
            emailSettingsId: emailSettingsId,
            clerkId: user.clerkId,
          });
        }
      }

      // Determine sender information
      let fromEmail, fromName, fromAddress, apiKey;
      
      if (emailSettings && emailSettings.isActive) {
        // Use custom email settings
        fromEmail = emailQueue.fromEmail || emailSettings.configuration.defaultFromEmail;
        fromName = emailQueue.fromName || emailSettings.configuration.defaultFromName;
        fromAddress = fromName ? `${fromName} <${fromEmail}>` : fromEmail;
        apiKey = emailSettings.configuration.apiKey;
      } else {
        // No email settings configured - cannot send email
        throw new Error("Email settings not configured. Please go to Settings → Email Configuration to set up your Resend API key and domain. If you have configurations but see this error, ensure one is marked as 'Default' and 'Active'.");
      }
      
      const emailId = await ctx.runMutation(resend.lib.sendEmail, {
        from: fromAddress,
        to: emailQueue.recipient,
        subject: emailQueue.subject,
        html: emailQueue.htmlContent,
        text: emailQueue.textContent,
        replyTo: emailQueue.replyTo ? [emailQueue.replyTo] : undefined,
        options: {
          apiKey: apiKey,
          initialBackoffMs: 1000,
          retryAttempts: 3,
          testMode: false,
          onEmailEvent: {
            fnHandle: "emailService:handleEmailEvent"
          }
        }
      });

      // Update with Resend email ID
      await ctx.db.patch(emailQueue._id, {
        resendEmailId: emailId,
        status: "sent",
        sentAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Update campaign status if this email is part of a campaign
      if (emailQueue.campaignId) {
        await ctx.runMutation(internal.campaignTasks.updateCampaignStatus, {
          campaignId: emailQueue.campaignId
        });
      }

    } catch (error: any) {
      console.error("Failed to send email:", error);
      
      // Update with error
      await ctx.db.patch(emailQueue._id, {
        status: emailQueue.attemptCount >= emailQueue.maxAttempts ? "failed" : "queued",
        errorMessage: error?.message || "Unknown error",
        updatedAt: Date.now(),
      });

      // Retry if not max attempts
      if (emailQueue.attemptCount < emailQueue.maxAttempts) {
        // Exponential backoff: 1min, 5min, 15min
        const delay = Math.pow(5, emailQueue.attemptCount) * 60 * 1000;
        await ctx.scheduler.runAfter(delay, internal.emailService.processEmailQueue, {
          emailQueueId: args.emailQueueId,
        });
      }
    }
  },
});

/**
 * Process batch emails
 */
export const processBatch = internalMutation({
  args: {
    batchId: v.id("emailBatches"),
  },
  handler: async (ctx, args) => {
    const batch = await ctx.db.get(args.batchId);
    if (!batch) {
      return;
    }

    // Check if batch is scheduled for future
    if (batch.scheduledAt && batch.scheduledAt > Date.now()) {
      return;
    }

    // Update batch status
    await ctx.db.patch(batch._id, {
      status: "processing",
      startedAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Process emails in batches
    const emailQueueIds = batch.emailQueueIds;
    let processedCount = 0;
    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < emailQueueIds.length; i += batch.batchSize) {
      const batchEmails = emailQueueIds.slice(i, i + batch.batchSize);
      
      // Process current batch
      for (const emailQueueId of batchEmails) {
        try {
          await ctx.scheduler.runAfter(0, internal.emailService.processEmailQueue, {
            emailQueueId: emailQueueId as any,
          });
          successCount++;
        } catch (error) {
          failedCount++;
          console.error("Failed to process email in batch:", error);
        }
        processedCount++;
      }

      // Update batch progress
      await ctx.db.patch(batch._id, {
        processedEmails: processedCount,
        successfulEmails: successCount,
        failedEmails: failedCount,
        updatedAt: Date.now(),
      });

      // Delay between batches (except for last batch)
      if (i + batch.batchSize < emailQueueIds.length) {
        await new Promise(resolve => setTimeout(resolve, batch.delayBetweenBatches));
      }
    }

    // Mark batch as completed
    await ctx.db.patch(batch._id, {
      status: "completed",
      completedAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

/**
 * Get email status
 */
export const getEmailStatus = query({
  args: {
    emailQueueId: v.id("emailQueue"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const emailQueue = await ctx.db.get(args.emailQueueId);
    if (!emailQueue) {
      return null;
    }

    // Get tracking events
    const trackingEvents = await ctx.db
      .query("emailTracking")
      .filter((q) => q.eq(q.field("emailQueueId"), args.emailQueueId))
      .order("desc")
      .collect();

    return {
      ...emailQueue,
      trackingEvents,
    };
  },
});

/**
 * Cancel email
 */
export const cancelEmail = mutation({
  args: {
    emailQueueId: v.id("emailQueue"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const emailQueue = await ctx.db.get(args.emailQueueId);
    if (!emailQueue) {
      throw new Error("Email not found");
    }

    // Can only cancel queued emails
    if (emailQueue.status !== "queued") {
      throw new Error("Can only cancel queued emails");
    }

    await ctx.db.patch(emailQueue._id, {
      status: "cancelled",
      updatedAt: Date.now(),
    });

    return true;
  },
});

/**
 * Schedule email processing for queued emails
 */
export const scheduleQueuedEmails = internalMutation({
  args: {},
  handler: async (ctx, args) => {
    // Find emails that are scheduled and ready to send
    const scheduledEmails = await ctx.db
      .query("emailQueue")
      .filter((q) => q.eq(q.field("status"), "queued"))
      .filter((q) => q.lte(q.field("scheduledAt"), Date.now()))
      .collect();

    for (const email of scheduledEmails) {
      await ctx.scheduler.runAfter(0, internal.emailService.processEmailQueue, {
        emailQueueId: email._id,
      });
    }

    // Find batches that are scheduled and ready to process
    const scheduledBatches = await ctx.db
      .query("emailBatches")
      .filter((q) => q.eq(q.field("status"), "pending"))
      .filter((q) => q.lte(q.field("scheduledAt"), Date.now()))
      .collect();

    for (const batch of scheduledBatches) {
      await ctx.scheduler.runAfter(0, internal.emailService.processBatch, {
        batchId: batch._id,
      });
    }
  },
});

/**
 * Process priority email queue (internal function for cron)
 */
export const processPriorityQueue = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Find high-priority emails that are ready to send
    const now = Date.now();
    const priorityEmails = await ctx.db
      .query("emailQueue")
      .filter((q) => q.eq(q.field("status"), "queued"))
      .filter((q) => q.lte(q.field("scheduledAt"), now))
      .filter((q) => q.gte(q.field("priority"), 8)) // High priority (8-10)
      .order("desc")
      .take(10); // Process up to 10 high-priority emails at once

    for (const email of priorityEmails) {
      await ctx.scheduler.runAfter(0, internal.emailService.processEmailQueue, {
        emailQueueId: email._id,
      });
    }

    return priorityEmails.length;
  },
});

// A/B Testing Integration Functions

/**
 * Track A/B test email events
 */
export const trackABTestEvent = internalMutation({
  args: {
    emailQueueId: v.id("emailQueue"),
    event: v.union(
      v.literal("delivered"),
      v.literal("opened"),
      v.literal("clicked"),
      v.literal("bounced"),
      v.literal("complained")
    ),
    metadata: v.optional(v.record(v.string(), v.any())),
  },
  handler: async (ctx, args) => {
    const emailQueue = await ctx.db.get(args.emailQueueId);
    if (!emailQueue || !emailQueue.metadata?.abTestId) {
      return; // Not an A/B test email
    }

    const testId = emailQueue.metadata.abTestId as string;
    const variantId = emailQueue.metadata.variantId as string;

    // Update A/B test results
    await ctx.runMutation(internal.abTesting.updateABTestResults, {
      recipientEmail: emailQueue.recipient,
      event: args.event,
      metadata: args.metadata,
    });

    // Update segment events
    const segment = await ctx.db
      .query("abTestSegments")
      .withIndex("by_recipient", (q) => q.eq("recipientEmail", emailQueue.recipient))
      .filter((q) => q.eq(q.field("testId"), testId))
      .first();

    if (segment) {
      const events = segment.events || [];
      events.push({
        type: args.event,
        timestamp: Date.now(),
        metadata: args.metadata || {},
      });
      await ctx.db.patch(segment._id, { events });
    }
  },
});

// Helper functions
function processTemplate(template: string, variables: Record<string, any>): string {
  let processed = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    processed = processed.replace(regex, String(value));
  }
  
  return processed;
}

function injectUnsubscribeLink(htmlContent: string, unsubscribeLink: string): string {
  const unsubscribeHtml = `
    <div style="text-align: center; margin-top: 20px; padding: 10px; font-size: 12px; color: #666;">
      <p>If you no longer wish to receive these emails, you can <a href="${unsubscribeLink}" style="color: #666;">unsubscribe here</a>.</p>
    </div>
  `;
  
  // Try to inject before closing body tag, otherwise append
  if (htmlContent.includes('</body>')) {
    return htmlContent.replace('</body>', unsubscribeHtml + '</body>');
  } else {
    return htmlContent + unsubscribeHtml;
  }
}

/**
 * Get email by unsubscribe token
 */
export const getEmailByUnsubscribeToken = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const emailQueue = await ctx.db
      .query("emailQueue")
      .filter((q) => q.eq(q.field("metadata.unsubscribeToken"), args.token))
      .first();

    return emailQueue;
  },
});

/**
 * Unsubscribe email
 */
export const unsubscribeEmail = mutation({
  args: {
    email: v.string(),
    userId: v.id("users"),
    campaignId: v.optional(v.id("campaigns")),
    token: v.string(),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if already unsubscribed
    const existing = await ctx.db
      .query("unsubscribes")
      .filter((q) => q.eq(q.field("email"), args.email))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (existing) {
      return existing._id;
    }

    // Add unsubscribe record
    return await ctx.db.insert("unsubscribes", {
      email: args.email,
      userId: args.userId,
      campaignId: args.campaignId,
      unsubscribedAt: Date.now(),
      token: args.token,
      userAgent: args.userAgent,
    });
  },
});

/**
 * Track email open
 */
export const trackEmailOpen = mutation({
  args: {
    emailQueueId: v.id("emailQueue"),
    userAgent: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const emailQueue = await ctx.db.get(args.emailQueueId);
    if (!emailQueue) {
      return;
    }

    // Create tracking record
    await ctx.db.insert("emailTracking", {
      emailQueueId: args.emailQueueId,
      resendEmailId: emailQueue.resendEmailId || "direct-tracking",
      recipient: emailQueue.recipient,
      event: "opened",
      timestamp: Date.now(),
      userAgent: args.userAgent,
      ipAddress: args.ipAddress,
    });

    // Update contact stats
    const contact = await ctx.db
      .query("contacts")
      .filter((q) => q.eq(q.field("email"), emailQueue.recipient))
      .first();

    if (contact) {
      const stats = contact.emailStats || {
        totalSent: 0,
        totalOpened: 0,
        totalClicked: 0,
      };

      stats.totalOpened++;
      stats.lastOpenedAt = Date.now();

      await ctx.db.patch(contact._id, {
        emailStats: stats,
        lastEngagement: Date.now(),
        updatedAt: Date.now(),
      });
    }

    // Update campaign analytics
    if (emailQueue.campaignId) {
      await ctx.db.insert("analytics", {
        campaignId: emailQueue.campaignId,
        metric: "opened",
        value: 1,
        timestamp: Date.now(),
        metadata: {
          recipientEmail: emailQueue.recipient,
          userAgent: args.userAgent,
          ipAddress: args.ipAddress,
        },
      });
    }
  },
});

/**
 * Track email click
 */
export const trackEmailClick = mutation({
  args: {
    emailQueueId: v.id("emailQueue"),
    clickedUrl: v.string(),
    userAgent: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const emailQueue = await ctx.db.get(args.emailQueueId);
    if (!emailQueue) {
      return;
    }

    // Create tracking record
    await ctx.db.insert("emailTracking", {
      emailQueueId: args.emailQueueId,
      resendEmailId: emailQueue.resendEmailId || "direct-tracking",
      recipient: emailQueue.recipient,
      event: "clicked",
      timestamp: Date.now(),
      userAgent: args.userAgent,
      ipAddress: args.ipAddress,
      data: { clickedUrl: args.clickedUrl },
    });

    // Update contact stats
    const contact = await ctx.db
      .query("contacts")
      .filter((q) => q.eq(q.field("email"), emailQueue.recipient))
      .first();

    if (contact) {
      const stats = contact.emailStats || {
        totalSent: 0,
        totalOpened: 0,
        totalClicked: 0,
      };

      stats.totalClicked++;
      stats.lastClickedAt = Date.now();

      await ctx.db.patch(contact._id, {
        emailStats: stats,
        lastEngagement: Date.now(),
        updatedAt: Date.now(),
      });
    }

    // Update campaign analytics
    if (emailQueue.campaignId) {
      await ctx.db.insert("analytics", {
        campaignId: emailQueue.campaignId,
        metric: "clicked",
        value: 1,
        timestamp: Date.now(),
        metadata: {
          recipientEmail: emailQueue.recipient,
          userAgent: args.userAgent,
          ipAddress: args.ipAddress,
        },
      });
    }
  },
});

/**
 * Get batch status
 */
export const getBatchStatus = query({
  args: {
    batchId: v.id("emailBatches"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const batch = await ctx.db.get(args.batchId);
    if (!batch) {
      return null;
    }

    // Get sample of email statuses
    const emailStatuses = await Promise.all(
      batch.emailQueueIds.slice(0, 10).map(async (id) => {
        const email = await ctx.db.get(id as any);
        return email;
      })
    );

    return {
      ...batch,
      sampleEmails: emailStatuses,
    };
  },
});

/**
 * Get user's email queue
 */
export const getUserEmailQueue = query({
  args: {
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    let query = ctx.db
      .query("emailQueue")
      .filter((q) => q.eq(q.field("userId"), user._id));

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    return await query
      .order("desc")
      .take(args.limit || 50);
  },
});

/**
 * Get user's email batches
 */
export const getUserEmailBatches = query({
  args: {
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    let query = ctx.db
      .query("emailBatches")
      .filter((q) => q.eq(q.field("userId"), user._id));

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    return await query
      .order("desc")
      .take(args.limit || 20);
  },
});

/**
 * Get email analytics for campaign
 */
export const getCampaignEmailAnalytics = query({
  args: {
    campaignId: v.id("campaigns"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get email queue stats
    const emailStats = await ctx.db
      .query("emailQueue")
      .filter((q) => q.eq(q.field("campaignId"), args.campaignId))
      .collect();

    const stats = {
      total: emailStats.length,
      queued: emailStats.filter(e => e.status === "queued").length,
      sent: emailStats.filter(e => e.status === "sent").length,
      failed: emailStats.filter(e => e.status === "failed").length,
      cancelled: emailStats.filter(e => e.status === "cancelled").length,
    };

    // Get tracking events
    const emailQueueIds = emailStats.map(e => e._id);
    const trackingEvents = [];
    
    for (const emailId of emailQueueIds) {
      const events = await ctx.db
        .query("emailTracking")
        .filter((q) => q.eq(q.field("emailQueueId"), emailId))
        .collect();
      trackingEvents.push(...events);
    }

    const eventStats = {
      opens: trackingEvents.filter(e => e.event === "opened").length,
      clicks: trackingEvents.filter(e => e.event === "clicked").length,
      bounces: trackingEvents.filter(e => e.event === "bounced").length,
      deliveries: trackingEvents.filter(e => e.event === "delivered").length,
    };

    return {
      ...stats,
      ...eventStats,
      openRate: stats.sent > 0 ? (eventStats.opens / stats.sent * 100) : 0,
      clickRate: stats.sent > 0 ? (eventStats.clicks / stats.sent * 100) : 0,
      bounceRate: stats.sent > 0 ? (eventStats.bounces / stats.sent * 100) : 0,
    };
  },
});

/**
 * Retry failed emails
 */
export const retryFailedEmails = mutation({
  args: {
    campaignId: v.optional(v.id("campaigns")),
    batchId: v.optional(v.id("emailBatches")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Find failed emails
    let query = ctx.db
      .query("emailQueue")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .filter((q) => q.eq(q.field("status"), "failed"));

    if (args.campaignId) {
      query = query.filter((q) => q.eq(q.field("campaignId"), args.campaignId));
    }

    if (args.batchId) {
      const batch = await ctx.db.get(args.batchId);
      if (batch) {
        const batchEmailIds = batch.emailQueueIds;
        const filteredEmails = [];
        
        for (const emailId of batchEmailIds) {
          const email = await ctx.db.get(emailId as any);
          if (email && "status" in email && email.status === "failed" && "userId" in email && email.userId === user._id) {
            filteredEmails.push(email);
          }
        }
        
        // Reset failed emails to queued status
        for (const email of filteredEmails) {
          await ctx.db.patch(email._id, {
            status: "queued",
            attemptCount: 0,
            errorMessage: undefined,
            updatedAt: Date.now(),
          });

          // Schedule for processing
          await ctx.scheduler.runAfter(0, internal.emailService.processEmailQueue, {
            emailQueueId: email._id as any,
          });
        }

        return filteredEmails.length;
      }
    }

    const failedEmails = await query.collect();

    // Reset failed emails to queued status (only for campaign-based retry)
    if (!args.batchId) {
      for (const email of failedEmails) {
        await ctx.db.patch(email._id, {
          status: "queued",
          attemptCount: 0,
          errorMessage: undefined,
          updatedAt: Date.now(),
        });

        // Schedule for processing
        await ctx.scheduler.runAfter(0, internal.emailService.processEmailQueue, {
          emailQueueId: email._id as any,
        });
      }

      return failedEmails.length;
    }

    return 0;
  },
});

/**
 * Clean up old emails and tracking data
 */
export const cleanupOldEmails = internalMutation({
  args: {},
  handler: async (ctx, args) => {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

    // Clean up old completed/failed emails
    const oldEmails = await ctx.db
      .query("emailQueue")
      .filter((q) => q.or(
        q.eq(q.field("status"), "sent"),
        q.eq(q.field("status"), "failed"),
        q.eq(q.field("status"), "cancelled")
      ))
      .filter((q) => q.lt(q.field("updatedAt"), sevenDaysAgo))
      .collect();

    for (const email of oldEmails) {
      // Delete associated tracking records first
      const trackingRecords = await ctx.db
        .query("emailTracking")
        .filter((q) => q.eq(q.field("emailQueueId"), email._id))
        .collect();

      for (const record of trackingRecords) {
        await ctx.db.delete(record._id);
      }

      // Delete the email record
      await ctx.db.delete(email._id);
    }

    // Clean up old completed batches
    const oldBatches = await ctx.db
      .query("emailBatches")
      .filter((q) => q.or(
        q.eq(q.field("status"), "completed"),
        q.eq(q.field("status"), "failed"),
        q.eq(q.field("status"), "cancelled")
      ))
      .filter((q) => q.lt(q.field("updatedAt"), sevenDaysAgo))
      .collect();

    for (const batch of oldBatches) {
      await ctx.db.delete(batch._id);
    }

    console.log(`Cleaned up ${oldEmails.length} old emails and ${oldBatches.length} old batches`);
  },
});
