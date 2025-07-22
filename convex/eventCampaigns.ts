import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api, internal } from "./_generated/api";

// Event-driven campaign automation system
export const createEventCampaign = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    eventTriggers: v.array(v.object({
      eventType: v.union(
        v.literal("contact_created"),
        v.literal("contact_imported"),
        v.literal("tag_added"),
        v.literal("field_updated"),
        v.literal("email_bounced"),
        v.literal("email_complained"),
        v.literal("form_submitted"),
        v.literal("page_visited"),
        v.literal("purchase_made"),
        v.literal("cart_abandoned"),
        v.literal("trial_started"),
        v.literal("subscription_cancelled"),
        v.literal("api_event"),
        v.literal("webhook_received"),
        v.literal("integration_sync"),
        v.literal("custom_event")
      ),
      conditions: v.object({
        // Basic filters
        tags: v.optional(v.object({
          include: v.optional(v.array(v.string())),
          exclude: v.optional(v.array(v.string())),
          operation: v.optional(v.union(v.literal("any"), v.literal("all")))
        })),
        fields: v.optional(v.array(v.object({
          field: v.string(),
          operator: v.string(),
          value: v.string()
        }))),
        // Event-specific conditions
        eventData: v.optional(v.object({
          source: v.optional(v.string()),
          category: v.optional(v.string()),
          properties: v.optional(v.record(v.string(), v.any()))
        })),
        // Frequency conditions
        frequency: v.optional(v.object({
          type: v.union(
            v.literal("first_time"),
            v.literal("nth_time"),
            v.literal("after_count"),
            v.literal("within_period")
          ),
          count: v.optional(v.number()),
          period: v.optional(v.number()), // days
          window: v.optional(v.number()) // hours
        })),
        // Attribution conditions
        attribution: v.optional(v.object({
          channel: v.optional(v.string()),
          campaign: v.optional(v.string()),
          medium: v.optional(v.string()),
          referrer: v.optional(v.string())
        }))
      }),
      delay: v.optional(v.number()), // minutes to wait after trigger
      priority: v.optional(v.number()) // 1-10 for trigger prioritization
    })),
    campaignFlow: v.object({
      // Email sequence configuration
      emails: v.array(v.object({
        id: v.string(),
        delay: v.number(), // minutes from previous email or trigger
        template: v.object({
          templateId: v.optional(v.id("templates")),
          subject: v.string(),
          content: v.string(),
          personalizeFields: v.optional(v.array(v.string()))
        }),
        conditions: v.optional(v.object({
          tags: v.optional(v.array(v.string())),
          engagement: v.optional(v.object({
            previousEmailOpened: v.optional(v.boolean()),
            previousEmailClicked: v.optional(v.boolean()),
            linkClicked: v.optional(v.string())
          }))
        })),
        actions: v.optional(v.array(v.object({
          type: v.union(
            v.literal("add_tag"),
            v.literal("remove_tag"),
            v.literal("update_field"),
            v.literal("send_webhook"),
            v.literal("create_task"),
            v.literal("trigger_integration")
          ),
          config: v.any()
        })))
      })),
      // Decision points and branching
      branches: v.optional(v.array(v.object({
        id: v.string(),
        condition: v.object({
          type: v.union(
            v.literal("email_engagement"),
            v.literal("field_value"),
            v.literal("tag_presence"),
            v.literal("time_elapsed"),
            v.literal("custom_event")
          ),
          config: v.any()
        }),
        truePath: v.string(), // email ID or branch ID
        falsePath: v.optional(v.string()),
        waitTime: v.optional(v.number()) // minutes to wait before evaluation
      }))),
      // Exit conditions
      exitConditions: v.optional(v.array(v.object({
        type: v.union(
          v.literal("tag_added"),
          v.literal("field_changed"),
          v.literal("goal_reached"),
          v.literal("unsubscribed"),
          v.literal("max_duration")
        ),
        config: v.any()
      })))
    }),
    settings: v.object({
      isActive: v.boolean(),
      maxDuration: v.optional(v.number()), // days
      maxEmailsPerContact: v.optional(v.number()),
      respectUnsubscribe: v.boolean(),
      respectOptOut: v.boolean(),
      timeZone: v.optional(v.string()),
      sendingWindow: v.optional(v.object({
        start: v.string(), // HH:MM
        end: v.string(), // HH:MM
        daysOfWeek: v.array(v.number()) // 0-6
      }))
    }),
    goals: v.optional(v.array(v.object({
      name: v.string(),
      type: v.union(
        v.literal("email_opened"),
        v.literal("email_clicked"),
        v.literal("link_clicked"),
        v.literal("form_submitted"),
        v.literal("purchase_made"),
        v.literal("tag_added"),
        v.literal("field_updated"),
        v.literal("custom_event")
      ),
      config: v.any(),
      weight: v.optional(v.number()) // for scoring
    })))
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("eventCampaigns", {
      ...args,
      statistics: {
        totalTriggered: 0,
        totalEntered: 0,
        totalCompleted: 0,
        totalExited: 0,
        emailsSent: 0,
        goalsReached: 0,
        conversionRate: 0
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  }
});

export const getEventCampaigns = query({
  args: {
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("eventCampaigns")
      .filter(q => q.eq(q.field("userId"), args.userId))
      .order("desc")
      .collect();
  }
});

export const processEvent = action({
  args: {
    eventType: v.string(),
    contactId: v.optional(v.id("contacts")),
    eventData: v.any(),
    source: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // If no contact ID provided, try to identify contact from event data
    let contactId = args.contactId;
    
    if (!contactId && args.eventData?.email) {
      const contact = await ctx.runQuery(api.contacts.getContactByEmail, {
        email: args.eventData.email
      });
      contactId = contact?._id;
    }

    if (!contactId) {
      return { error: "No contact found for event", processed: 0 };
    }

    const contact = await ctx.runQuery(api.contacts.getContact, {
      id: contactId
    });

    if (!contact) {
      return { error: "Contact not found", processed: 0 };
    }

    // Get all active event campaigns for this user
    const campaigns = await ctx.runQuery(internal.eventCampaigns.getActiveCampaignsForEvent, {
      userId: contact.userId,
      eventType: args.eventType
    });

    const triggeredCampaigns = [];

    for (const campaign of campaigns) {
      // Check each trigger in the campaign
      for (const trigger of campaign.eventTriggers) {
        if (trigger.eventType === args.eventType) {
          const shouldTrigger = await evaluateEventTriggerConditions(
            ctx,
            trigger,
            contact,
            args.eventData
          );

          if (shouldTrigger) {
            // Check if contact is already in this campaign
            const existingJourney = await ctx.runQuery(
              internal.eventCampaigns.getContactJourney,
              {
                campaignId: campaign._id,
                contactId: contactId
              }
            );

            if (!existingJourney) {
              // Start new journey for contact
              const journeyId = await ctx.runMutation(
                internal.eventCampaigns.startContactJourney,
                {
                  campaignId: campaign._id,
                  contactId: contactId,
                  triggerId: trigger.eventType,
                  eventData: args.eventData,
                  delay: trigger.delay || 0
                }
              );

              triggeredCampaigns.push({
                campaignId: campaign._id,
                campaignName: campaign.name,
                journeyId
              });

              // Update campaign statistics
              await ctx.runMutation(internal.eventCampaigns.updateCampaignStats, {
                campaignId: campaign._id,
                increment: "triggered"
              });
            }
          }
        }
      }
    }

    return { processed: triggeredCampaigns.length, triggeredCampaigns };
  }
});

export const getActiveCampaignsForEvent = query({
  args: {
    userId: v.id("users"),
    eventType: v.string()
  },
  handler: async (ctx, args) => {
    const campaigns = await ctx.db
      .query("eventCampaigns")
      .filter(q => q.eq(q.field("userId"), args.userId))
      .filter(q => q.eq(q.field("settings.isActive"), true))
      .collect();

    // Filter campaigns that have triggers for this event type
    return campaigns.filter(campaign =>
      campaign.eventTriggers.some(trigger => trigger.eventType === args.eventType)
    );
  }
});

export const startContactJourney = mutation({
  args: {
    campaignId: v.id("eventCampaigns"),
    contactId: v.id("contacts"),
    triggerId: v.string(),
    eventData: v.any(),
    delay: v.number()
  },
  handler: async (ctx, args) => {
    const startAt = Date.now() + (args.delay * 60 * 1000);
    
    return await ctx.db.insert("contactJourneys", {
      campaignId: args.campaignId,
      contactId: args.contactId,
      triggerId: args.triggerId,
      status: "active",
      currentStep: "start",
      nextAction: "send_email",
      nextActionAt: startAt,
      eventData: args.eventData,
      progress: {
        emailsSent: 0,
        emailsOpened: 0,
        emailsClicked: 0,
        goalsReached: 0
      },
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  }
});

export const getContactJourney = query({
  args: {
    campaignId: v.id("eventCampaigns"),
    contactId: v.id("contacts")
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("contactJourneys")
      .filter(q => q.eq(q.field("campaignId"), args.campaignId))
      .filter(q => q.eq(q.field("contactId"), args.contactId))
      .filter(q => q.eq(q.field("status"), "active"))
      .first();
  }
});

export const processScheduledActions = action({
  args: {},
  handler: async (ctx) => {
    // Get all journeys with actions scheduled for now or earlier
    const scheduledJourneys = await ctx.runQuery(
      internal.eventCampaigns.getScheduledJourneys,
      { before: Date.now() }
    );

    const results = [];

    for (const journey of scheduledJourneys) {
      try {
        const campaign = await ctx.runQuery(api.eventCampaigns.getCampaign, {
          id: journey.campaignId
        });

        if (!campaign || !campaign.settings.isActive) {
          await ctx.runMutation(internal.eventCampaigns.updateJourneyStatus, {
            id: journey._id,
            status: "paused",
            reason: "Campaign inactive"
          });
          continue;
        }

        const contact = await ctx.runQuery(api.contacts.getContact, {
          id: journey.contactId
        });

        if (!contact) {
          await ctx.runMutation(internal.eventCampaigns.updateJourneyStatus, {
            id: journey._id,
            status: "failed",
            reason: "Contact not found"
          });
          continue;
        }

        // Process the scheduled action
        const result = await processJourneyAction(
          ctx,
          journey,
          campaign,
          contact
        );

        results.push({
          journeyId: journey._id,
          action: journey.nextAction,
          result
        });

      } catch (error) {
        results.push({
          journeyId: journey._id,
          action: journey.nextAction,
          result: { success: false, error: error.message }
        });
      }
    }

    return { processed: results.length, results };
  }
});

export const getScheduledJourneys = query({
  args: {
    before: v.number()
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("contactJourneys")
      .filter(q => q.eq(q.field("status"), "active"))
      .filter(q => q.lte(q.field("nextActionAt"), args.before))
      .collect();
  }
});

export const updateJourneyStatus = mutation({
  args: {
    id: v.id("contactJourneys"),
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("paused"),
      v.literal("failed"),
      v.literal("exited")
    ),
    reason: v.optional(v.string()),
    nextAction: v.optional(v.string()),
    nextActionAt: v.optional(v.number()),
    currentStep: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now()
    });
  }
});

export const updateCampaignStats = mutation({
  args: {
    campaignId: v.id("eventCampaigns"),
    increment: v.union(
      v.literal("triggered"),
      v.literal("entered"),
      v.literal("completed"),
      v.literal("exited"),
      v.literal("emailSent"),
      v.literal("goalReached")
    )
  },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) return;

    const stats = campaign.statistics;
    const updates: any = { updatedAt: Date.now() };

    switch (args.increment) {
      case "triggered":
        updates.statistics = {
          ...stats,
          totalTriggered: stats.totalTriggered + 1
        };
        break;
      case "entered":
        updates.statistics = {
          ...stats,
          totalEntered: stats.totalEntered + 1
        };
        break;
      case "completed":
        updates.statistics = {
          ...stats,
          totalCompleted: stats.totalCompleted + 1
        };
        break;
      case "exited":
        updates.statistics = {
          ...stats,
          totalExited: stats.totalExited + 1
        };
        break;
      case "emailSent":
        updates.statistics = {
          ...stats,
          emailsSent: stats.emailsSent + 1
        };
        break;
      case "goalReached":
        updates.statistics = {
          ...stats,
          goalsReached: stats.goalsReached + 1
        };
        break;
    }

    // Update conversion rate
    if (stats.totalEntered > 0) {
      updates.statistics.conversionRate = 
        (updates.statistics.goalsReached / stats.totalEntered) * 100;
    }

    await ctx.db.patch(args.campaignId, updates);
  }
});

export const getCampaign = query({
  args: {
    id: v.id("eventCampaigns")
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  }
});

export const getCampaignAnalytics = query({
  args: {
    campaignId: v.id("eventCampaigns"),
    timeRange: v.optional(v.object({
      start: v.number(),
      end: v.number()
    }))
  },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) return null;

    // Get all journeys for this campaign
    let journeysQuery = ctx.db
      .query("contactJourneys")
      .filter(q => q.eq(q.field("campaignId"), args.campaignId));

    if (args.timeRange) {
      journeysQuery = journeysQuery
        .filter(q => q.gte(q.field("createdAt"), args.timeRange!.start))
        .filter(q => q.lte(q.field("createdAt"), args.timeRange!.end));
    }

    const journeys = await journeysQuery.collect();

    // Calculate analytics
    const analytics = {
      overview: campaign.statistics,
      journeys: {
        total: journeys.length,
        active: journeys.filter(j => j.status === "active").length,
        completed: journeys.filter(j => j.status === "completed").length,
        failed: journeys.filter(j => j.status === "failed").length,
        exited: journeys.filter(j => j.status === "exited").length
      },
      engagement: {
        totalEmailsSent: journeys.reduce((sum, j) => sum + j.progress.emailsSent, 0),
        totalEmailsOpened: journeys.reduce((sum, j) => sum + j.progress.emailsOpened, 0),
        totalEmailsClicked: journeys.reduce((sum, j) => sum + j.progress.emailsClicked, 0),
        averageEngagement: 0
      },
      performance: {
        averageJourneyDuration: 0,
        dropOffPoints: [],
        conversionRate: campaign.statistics.conversionRate
      }
    };

    // Calculate engagement rates
    if (analytics.engagement.totalEmailsSent > 0) {
      analytics.engagement.averageEngagement = 
        (analytics.engagement.totalEmailsOpened / analytics.engagement.totalEmailsSent) * 100;
    }

    return analytics;
  }
});

// Helper functions
async function evaluateEventTriggerConditions(
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

  // Check event data conditions
  if (conditions.eventData) {
    if (conditions.eventData.source && eventData.source !== conditions.eventData.source) {
      return false;
    }

    if (conditions.eventData.category && eventData.category !== conditions.eventData.category) {
      return false;
    }

    if (conditions.eventData.properties) {
      for (const [key, value] of Object.entries(conditions.eventData.properties)) {
        if (eventData.properties?.[key] !== value) {
          return false;
        }
      }
    }
  }

  // Check frequency conditions
  if (conditions.frequency) {
    const eventCount = await ctx.runQuery(internal.eventCampaigns.getEventCount, {
      contactId: contact._id,
      eventType: trigger.eventType,
      period: conditions.frequency.period
    });

    switch (conditions.frequency.type) {
      case "first_time":
        if (eventCount > 1) return false;
        break;
      case "nth_time":
        if (eventCount !== conditions.frequency.count) return false;
        break;
      case "after_count":
        if (eventCount <= (conditions.frequency.count || 0)) return false;
        break;
    }
  }

  return true;
}

async function processJourneyAction(
  ctx: any,
  journey: any,
  campaign: any,
  contact: any
): Promise<any> {
  switch (journey.nextAction) {
    case "send_email":
      return await processSendEmailAction(ctx, journey, campaign, contact);
    case "evaluate_branch":
      return await processEvaluateBranchAction(ctx, journey, campaign, contact);
    case "complete_journey":
      return await processCompleteJourneyAction(ctx, journey);
    default:
      return { success: false, error: `Unknown action: ${journey.nextAction}` };
  }
}

async function processSendEmailAction(
  ctx: any,
  journey: any,
  campaign: any,
  contact: any
): Promise<any> {
  // Find the current email in the flow
  const currentEmail = campaign.campaignFlow.emails.find(
    (email: any) => email.id === journey.currentStep || 
    (journey.currentStep === "start" && email === campaign.campaignFlow.emails[0])
  );

  if (!currentEmail) {
    return { success: false, error: "Email not found in campaign flow" };
  }

  // Check email conditions if any
  if (currentEmail.conditions) {
    const conditionsMet = await evaluateEmailConditions(
      ctx,
      currentEmail.conditions,
      contact,
      journey
    );

    if (!conditionsMet) {
      // Skip this email and move to next
      return await scheduleNextAction(ctx, journey, campaign, currentEmail);
    }
  }

  // Personalize and send email
  const personalizedContent = personalizeEmailContent(
    currentEmail.template.content,
    contact,
    currentEmail.template.personalizeFields || []
  );

  const personalizedSubject = personalizeEmailContent(
    currentEmail.template.subject,
    contact,
    currentEmail.template.personalizeFields || []
  );

  try {
    const emailResult = await ctx.runAction(api.campaigns.sendSingleEmail, {
      to: contact.email,
      subject: personalizedSubject,
      content: personalizedContent,
      userId: campaign.userId,
      trackOpens: true,
      trackClicks: true,
      metadata: {
        type: "event_campaign",
        campaignId: campaign._id,
        journeyId: journey._id,
        emailId: currentEmail.id
      }
    });

    if (emailResult.success) {
      // Update journey progress
      await ctx.runMutation(internal.eventCampaigns.updateJourneyProgress, {
        id: journey._id,
        progress: {
          ...journey.progress,
          emailsSent: journey.progress.emailsSent + 1
        }
      });

      // Update campaign stats
      await ctx.runMutation(internal.eventCampaigns.updateCampaignStats, {
        campaignId: campaign._id,
        increment: "emailSent"
      });

      // Execute post-send actions
      if (currentEmail.actions) {
        for (const action of currentEmail.actions) {
          await executeEmailAction(ctx, action, contact);
        }
      }

      // Schedule next action
      return await scheduleNextAction(ctx, journey, campaign, currentEmail);
    } else {
      return { success: false, error: emailResult.error };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function scheduleNextAction(
  ctx: any,
  journey: any,
  campaign: any,
  currentEmail: any
): Promise<any> {
  // Find next email in sequence
  const emails = campaign.campaignFlow.emails;
  const currentIndex = emails.findIndex((email: any) => email.id === currentEmail.id);
  const nextEmail = emails[currentIndex + 1];

  if (nextEmail) {
    const nextActionAt = Date.now() + (nextEmail.delay * 60 * 1000);
    
    await ctx.runMutation(internal.eventCampaigns.updateJourneyStatus, {
      id: journey._id,
      currentStep: nextEmail.id,
      nextAction: "send_email",
      nextActionAt
    });

    return { success: true, nextAction: "send_email", nextAt: nextActionAt };
  } else {
    // Journey complete
    await ctx.runMutation(internal.eventCampaigns.updateJourneyStatus, {
      id: journey._id,
      status: "completed",
      reason: "All emails sent"
    });

    await ctx.runMutation(internal.eventCampaigns.updateCampaignStats, {
      campaignId: campaign._id,
      increment: "completed"
    });

    return { success: true, completed: true };
  }
}

async function evaluateEmailConditions(
  ctx: any,
  conditions: any,
  contact: any,
  journey: any
): Promise<boolean> {
  // Check tag conditions
  if (conditions.tags && conditions.tags.length > 0) {
    const contactTags = contact.tags || [];
    const hasRequiredTags = conditions.tags.some((tag: string) => contactTags.includes(tag));
    if (!hasRequiredTags) return false;
  }

  // Check engagement conditions
  if (conditions.engagement) {
    if (conditions.engagement.previousEmailOpened !== undefined) {
      // Check if previous email was opened
      // This would require tracking engagement in the journey
    }
  }

  return true;
}

async function executeEmailAction(ctx: any, action: any, contact: any): Promise<void> {
  switch (action.type) {
    case "add_tag":
      await ctx.runMutation(api.contacts.addTag, {
        contactId: contact._id,
        tag: action.config.tag
      });
      break;
    case "remove_tag":
      await ctx.runMutation(api.contacts.removeTag, {
        contactId: contact._id,
        tag: action.config.tag
      });
      break;
    case "update_field":
      await ctx.runMutation(api.contacts.updateCustomField, {
        contactId: contact._id,
        field: action.config.field,
        value: action.config.value
      });
      break;
    // Add more action types as needed
  }
}

export const getEventCount = query({
  args: {
    contactId: v.id("contacts"),
    eventType: v.string(),
    period: v.optional(v.number()) // days
  },
  handler: async (ctx, args) => {
    // This would need to be implemented based on your event tracking system
    // For now, return a placeholder
    return 1;
  }
});

export const updateJourneyProgress = mutation({
  args: {
    id: v.id("contactJourneys"),
    progress: v.any()
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      progress: args.progress,
      updatedAt: Date.now()
    });
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
