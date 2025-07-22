import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api, internal } from "./_generated/api";

// Email trigger types based on contact events
export const createEmailTrigger = mutation({
  args: {
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
      // Tag conditions
      tags: v.optional(v.object({
        include: v.optional(v.array(v.string())),
        exclude: v.optional(v.array(v.string())),
        operation: v.optional(v.union(v.literal("any"), v.literal("all")))
      })),
      // Field conditions
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
      // Time-based conditions
      timing: v.optional(v.object({
        delay: v.optional(v.number()), // minutes after trigger
        timeWindow: v.optional(v.object({
          start: v.string(), // HH:MM format
          end: v.string(),
          timezone: v.string(),
          daysOfWeek: v.optional(v.array(v.number())) // 0-6 (Sunday-Saturday)
        })),
        dateCondition: v.optional(v.object({
          field: v.string(), // field name for date comparison
          daysAfter: v.optional(v.number()),
          daysBefore: v.optional(v.number())
        }))
      })),
      // Engagement conditions
      engagement: v.optional(v.object({
        emailsOpened: v.optional(v.number()),
        emailsClicked: v.optional(v.number()),
        lastActivity: v.optional(v.number()), // days since last activity
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
    priority: v.optional(v.number()), // 1-10, higher = more priority
    maxSendsPerContact: v.optional(v.number()), // prevent spam
    cooldownPeriod: v.optional(v.number()) // hours between sends for same contact
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("emailTriggers", {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      statistics: {
        totalTriggers: 0,
        totalSent: 0,
        totalOpened: 0,
        totalClicked: 0,
        lastTriggered: 0
      }
    });
  }
});

export const getEmailTriggers = query({
  args: {
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("emailTriggers")
      .filter(q => q.eq(q.field("userId"), args.userId))
      .order("desc")
      .collect();
  }
});

export const updateEmailTrigger = mutation({
  args: {
    id: v.id("emailTriggers"),
    updates: v.object({
      name: v.optional(v.string()),
      description: v.optional(v.string()),
      conditions: v.optional(v.any()),
      emailTemplate: v.optional(v.any()),
      isActive: v.optional(v.boolean()),
      priority: v.optional(v.number()),
      maxSendsPerContact: v.optional(v.number()),
      cooldownPeriod: v.optional(v.number())
    })
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      ...args.updates,
      updatedAt: Date.now()
    });
  }
});

export const processContactEvent = action({
  args: {
    eventType: v.string(),
    contactId: v.id("contacts"),
    eventData: v.any()
  },
  handler: async (ctx, args) => {
    // Get contact details
    const contact = await ctx.runQuery(api.contacts.getContact, {
      id: args.contactId
    });

    if (!contact) {
      return { error: "Contact not found" };
    }

    // Get all active triggers for this user
    const triggers = await ctx.runQuery(internal.emailTriggers.getActiveTriggers, {
      userId: contact.userId,
      triggerType: args.eventType
    });

    const triggeredEmails = [];

    for (const trigger of triggers) {
      // Check if trigger conditions are met
      const shouldTrigger = await evaluateTriggerConditions(
        ctx,
        trigger,
        contact,
        args.eventData
      );

      if (shouldTrigger) {
        // Check cooldown and send limits
        const canSend = await checkSendLimits(ctx, trigger._id, args.contactId);
        
        if (canSend) {
          // Schedule email send
          const emailJob = await ctx.runMutation(internal.emailTriggers.scheduleTriggeredEmail, {
            triggerId: trigger._id,
            contactId: args.contactId,
            delay: trigger.conditions.timing?.delay || 0
          });

          triggeredEmails.push({
            triggerId: trigger._id,
            triggerName: trigger.name,
            emailJobId: emailJob
          });

          // Update trigger statistics
          await ctx.runMutation(internal.emailTriggers.updateTriggerStats, {
            triggerId: trigger._id,
            increment: "triggered"
          });
        }
      }
    }

    return { triggeredEmails };
  }
});

export const getActiveTriggers = query({
  args: {
    userId: v.id("users"),
    triggerType: v.string()
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("emailTriggers")
      .filter(q => q.eq(q.field("userId"), args.userId))
      .filter(q => q.eq(q.field("triggerType"), args.triggerType))
      .filter(q => q.eq(q.field("isActive"), true))
      .collect();
  }
});

export const scheduleTriggeredEmail = mutation({
  args: {
    triggerId: v.id("emailTriggers"),
    contactId: v.id("contacts"),
    delay: v.number() // minutes
  },
  handler: async (ctx, args) => {
    const scheduledAt = Date.now() + (args.delay * 60 * 1000);
    
    return await ctx.db.insert("triggeredEmails", {
      triggerId: args.triggerId,
      contactId: args.contactId,
      scheduledAt,
      status: "scheduled",
      createdAt: Date.now(),
      attempts: 0
    });
  }
});

export const updateTriggerStats = mutation({
  args: {
    triggerId: v.id("emailTriggers"),
    increment: v.union(
      v.literal("triggered"),
      v.literal("sent"),
      v.literal("opened"),
      v.literal("clicked")
    )
  },
  handler: async (ctx, args) => {
    const trigger = await ctx.db.get(args.triggerId);
    if (!trigger) return;

    const stats = trigger.statistics;
    const updates: any = { updatedAt: Date.now() };

    switch (args.increment) {
      case "triggered":
        updates.statistics = {
          ...stats,
          totalTriggers: stats.totalTriggers + 1,
          lastTriggered: Date.now()
        };
        break;
      case "sent":
        updates.statistics = {
          ...stats,
          totalSent: stats.totalSent + 1
        };
        break;
      case "opened":
        updates.statistics = {
          ...stats,
          totalOpened: stats.totalOpened + 1
        };
        break;
      case "clicked":
        updates.statistics = {
          ...stats,
          totalClicked: stats.totalClicked + 1
        };
        break;
    }

    await ctx.db.patch(args.triggerId, updates);
  }
});

export const processScheduledTriggerEmails = action({
  args: {},
  handler: async (ctx) => {
    // Get emails scheduled for now or earlier
    const scheduledEmails = await ctx.runQuery(internal.emailTriggers.getScheduledEmails, {
      before: Date.now()
    });

    const results = [];

    for (const email of scheduledEmails) {
      try {
        // Get trigger and contact details
        const trigger = await ctx.runQuery(api.emailTriggers.getTrigger, {
          id: email.triggerId
        });
        const contact = await ctx.runQuery(api.contacts.getContact, {
          id: email.contactId
        });

        if (!trigger || !contact || !trigger.isActive) {
          await ctx.runMutation(internal.emailTriggers.updateTriggeredEmailStatus, {
            id: email._id,
            status: "failed",
            error: "Trigger or contact not found or inactive"
          });
          continue;
        }

        // Personalize email content
        const personalizedContent = personalizeEmailContent(
          trigger.emailTemplate.content,
          contact,
          trigger.emailTemplate.personalizeFields || []
        );

        const personalizedSubject = personalizeEmailContent(
          trigger.emailTemplate.subject,
          contact,
          trigger.emailTemplate.personalizeFields || []
        );

        // Send email via campaign system
        const emailResult = await ctx.runAction(api.campaigns.sendSingleEmail, {
          to: contact.email,
          subject: personalizedSubject,
          content: personalizedContent,
          userId: trigger.userId,
          trackOpens: true,
          trackClicks: true,
          metadata: {
            type: "triggered",
            triggerId: trigger._id,
            contactId: contact._id
          }
        });

        if (emailResult.success) {
          await ctx.runMutation(internal.emailTriggers.updateTriggeredEmailStatus, {
            id: email._id,
            status: "sent",
            sentAt: Date.now(),
            messageId: emailResult.messageId
          });

          // Update trigger stats
          await ctx.runMutation(internal.emailTriggers.updateTriggerStats, {
            triggerId: trigger._id,
            increment: "sent"
          });

          results.push({ success: true, emailId: email._id });
        } else {
          await ctx.runMutation(internal.emailTriggers.updateTriggeredEmailStatus, {
            id: email._id,
            status: "failed",
            error: emailResult.error,
            attempts: email.attempts + 1
          });

          results.push({ success: false, emailId: email._id, error: emailResult.error });
        }
      } catch (error) {
        await ctx.runMutation(internal.emailTriggers.updateTriggeredEmailStatus, {
          id: email._id,
          status: "failed",
          error: error.message,
          attempts: email.attempts + 1
        });

        results.push({ success: false, emailId: email._id, error: error.message });
      }
    }

    return { processed: results.length, results };
  }
});

export const getScheduledEmails = query({
  args: {
    before: v.number()
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("triggeredEmails")
      .filter(q => q.eq(q.field("status"), "scheduled"))
      .filter(q => q.lte(q.field("scheduledAt"), args.before))
      .collect();
  }
});

export const updateTriggeredEmailStatus = mutation({
  args: {
    id: v.id("triggeredEmails"),
    status: v.union(
      v.literal("scheduled"),
      v.literal("sent"),
      v.literal("failed"),
      v.literal("cancelled")
    ),
    sentAt: v.optional(v.number()),
    error: v.optional(v.string()),
    messageId: v.optional(v.string()),
    attempts: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now()
    });
  }
});

export const getTrigger = query({
  args: {
    id: v.id("emailTriggers")
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  }
});

export const getTriggeredEmailHistory = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    const triggeredEmails = await ctx.db
      .query("triggeredEmails")
      .order("desc")
      .take(limit);

    // Join with trigger and contact data
    const enrichedEmails = [];
    for (const email of triggeredEmails) {
      const trigger = await ctx.db.get(email.triggerId);
      const contact = await ctx.db.get(email.contactId);
      
      if (trigger && contact && trigger.userId === args.userId) {
        enrichedEmails.push({
          ...email,
          trigger: {
            name: trigger.name,
            triggerType: trigger.triggerType
          },
          contact: {
            email: contact.email,
            name: contact.name
          }
        });
      }
    }

    return enrichedEmails;
  }
});

// Helper functions
async function evaluateTriggerConditions(
  ctx: any,
  trigger: any,
  contact: any,
  eventData: any
): Promise<boolean> {
  const conditions = trigger.conditions;

  // Check tag conditions
  if (conditions.tags) {
    const contactTags = contact.tags || [];
    
    if (conditions.tags.include && conditions.tags.include.length > 0) {
      const operation = conditions.tags.operation || "any";
      const hasRequiredTags = operation === "any" 
        ? conditions.tags.include.some((tag: string) => contactTags.includes(tag))
        : conditions.tags.include.every((tag: string) => contactTags.includes(tag));
      
      if (!hasRequiredTags) return false;
    }

    if (conditions.tags.exclude && conditions.tags.exclude.length > 0) {
      const hasExcludedTags = conditions.tags.exclude.some((tag: string) => contactTags.includes(tag));
      if (hasExcludedTags) return false;
    }
  }

  // Check field conditions
  if (conditions.fields && conditions.fields.length > 0) {
    for (const fieldCondition of conditions.fields) {
      const fieldValue = contact.customFields?.[fieldCondition.field] || "";
      const conditionValue = fieldCondition.value || "";

      const passes = evaluateFieldCondition(
        fieldValue,
        fieldCondition.operator,
        conditionValue
      );

      if (!passes) return false;
    }
  }

  // Check timing conditions
  if (conditions.timing?.timeWindow) {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    const currentDay = now.getDay();

    const { start, end, daysOfWeek } = conditions.timing.timeWindow;

    if (daysOfWeek && !daysOfWeek.includes(currentDay)) {
      return false;
    }

    if (currentTime < start || currentTime > end) {
      return false;
    }
  }

  return true;
}

function evaluateFieldCondition(
  fieldValue: string,
  operator: string,
  conditionValue: string
): boolean {
  const lowerFieldValue = fieldValue.toLowerCase();
  const lowerConditionValue = conditionValue.toLowerCase();

  switch (operator) {
    case "equals":
      return fieldValue === conditionValue;
    case "not_equals":
      return fieldValue !== conditionValue;
    case "contains":
      return lowerFieldValue.includes(lowerConditionValue);
    case "not_contains":
      return !lowerFieldValue.includes(lowerConditionValue);
    case "starts_with":
      return lowerFieldValue.startsWith(lowerConditionValue);
    case "ends_with":
      return lowerFieldValue.endsWith(lowerConditionValue);
    case "greater_than":
      return parseFloat(fieldValue) > parseFloat(conditionValue);
    case "less_than":
      return parseFloat(fieldValue) < parseFloat(conditionValue);
    case "is_empty":
      return !fieldValue || fieldValue.trim() === "";
    case "is_not_empty":
      return fieldValue && fieldValue.trim() !== "";
    default:
      return false;
  }
}

async function checkSendLimits(
  ctx: any,
  triggerId: string,
  contactId: string
): Promise<boolean> {
  const trigger = await ctx.runQuery(api.emailTriggers.getTrigger, {
    id: triggerId
  });

  if (!trigger) return false;

  // Check max sends per contact
  if (trigger.maxSendsPerContact) {
    const sentCount = await ctx.runQuery(internal.emailTriggers.getContactSentCount, {
      triggerId,
      contactId
    });

    if (sentCount >= trigger.maxSendsPerContact) {
      return false;
    }
  }

  // Check cooldown period
  if (trigger.cooldownPeriod) {
    const lastSent = await ctx.runQuery(internal.emailTriggers.getLastSentTime, {
      triggerId,
      contactId
    });

    if (lastSent) {
      const cooldownMs = trigger.cooldownPeriod * 60 * 60 * 1000; // hours to ms
      if (Date.now() - lastSent < cooldownMs) {
        return false;
      }
    }
  }

  return true;
}

export const getContactSentCount = query({
  args: {
    triggerId: v.id("emailTriggers"),
    contactId: v.id("contacts")
  },
  handler: async (ctx, args) => {
    const sentEmails = await ctx.db
      .query("triggeredEmails")
      .filter(q => q.eq(q.field("triggerId"), args.triggerId))
      .filter(q => q.eq(q.field("contactId"), args.contactId))
      .filter(q => q.eq(q.field("status"), "sent"))
      .collect();

    return sentEmails.length;
  }
});

export const getLastSentTime = query({
  args: {
    triggerId: v.id("emailTriggers"),
    contactId: v.id("contacts")
  },
  handler: async (ctx, args) => {
    const lastSent = await ctx.db
      .query("triggeredEmails")
      .filter(q => q.eq(q.field("triggerId"), args.triggerId))
      .filter(q => q.eq(q.field("contactId"), args.contactId))
      .filter(q => q.eq(q.field("status"), "sent"))
      .order("desc")
      .first();

    return lastSent?.sentAt;
  }
});

function personalizeEmailContent(
  content: string,
  contact: any,
  personalizeFields: string[]
): string {
  let personalizedContent = content;

  // Standard personalization
  personalizedContent = personalizedContent.replace(/\{\{name\}\}/g, contact.name || "");
  personalizedContent = personalizedContent.replace(/\{\{email\}\}/g, contact.email || "");

  // Custom field personalization
  for (const field of personalizeFields) {
    const value = contact.customFields?.[field] || "";
    const regex = new RegExp(`\\{\\{${field}\\}\\}`, "g");
    personalizedContent = personalizedContent.replace(regex, value);
  }

  return personalizedContent;
}
