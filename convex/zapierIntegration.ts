import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";

export const sendToZapier = action({
  args: {
    integrationId: v.id("integrations"),
    eventType: v.string(),
    data: v.any(),
  },
  handler: async (ctx, { integrationId, eventType, data }) => {
    const integration = await ctx.runQuery(api.integrations.getById, { integrationId });
    
    if (!integration || integration.type !== "zapier") {
      throw new Error("Invalid Zapier integration");
    }

    const { zapierHookUrl, authentication } = integration.configuration;
    
    if (!zapierHookUrl) {
      throw new Error("Zapier hook URL not configured");
    }

    try {
      const payload = {
        event: eventType,
        timestamp: new Date().toISOString(),
        data,
        source: "smartbatch-email",
      };

      const response = await fetch(zapierHookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authentication?.apiKey && {
            "Authorization": `Bearer ${authentication.apiKey}`
          }),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Zapier webhook failed: ${response.status} ${response.statusText}`);
      }

      // Log successful webhook delivery
      await ctx.runMutation(api.webhooks.logDelivery, {
        webhookId: integration.webhookEndpointId, // If linked to webhook endpoint
        eventType,
        payload,
        status: "success",
        responseStatus: response.status,
        responseBody: await response.text(),
        duration: Date.now() - Date.now(), // This would be calculated properly in real implementation
      });

      return {
        success: true,
        message: "Successfully sent data to Zapier",
        statusCode: response.status,
      };
    } catch (error) {
      // Log failed webhook delivery
      await ctx.runMutation(api.webhooks.logDelivery, {
        webhookId: integration.webhookEndpointId,
        eventType,
        payload: { event: eventType, data },
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
        duration: Date.now() - Date.now(),
      });

      throw error;
    }
  },
});

export const triggerZapierWorkflow = action({
  args: {
    integrationId: v.id("integrations"),
    workflowType: v.string(),
    triggerData: v.any(),
  },
  handler: async (ctx, { integrationId, workflowType, triggerData }) => {
    const integration = await ctx.runQuery(api.integrations.getById, { integrationId });
    
    if (!integration || integration.type !== "zapier") {
      throw new Error("Invalid Zapier integration");
    }

    const eventMapping = {
      "new_contact": "contact.created",
      "contact_updated": "contact.updated",
      "campaign_sent": "campaign.sent",
      "email_opened": "email.opened",
      "email_clicked": "email.clicked",
      "form_submitted": "form.submitted",
    };

    const eventType = eventMapping[workflowType as keyof typeof eventMapping] || workflowType;

    return await ctx.runAction(api.zapierIntegration.sendToZapier, {
      integrationId,
      eventType,
      data: {
        workflowType,
        trigger: triggerData,
        timestamp: new Date().toISOString(),
      },
    });
  },
});

export const setupZapierWebhook = mutation({
  args: {
    integrationId: v.id("integrations"),
    zapierHookUrl: v.string(),
    events: v.array(v.string()),
  },
  handler: async (ctx, { integrationId, zapierHookUrl, events }) => {
    // Update the integration configuration
    const integration = await ctx.db.get(integrationId);
    if (!integration) {
      throw new Error("Integration not found");
    }

    await ctx.db.patch(integrationId, {
      configuration: {
        ...integration.configuration,
        zapierHookUrl,
        events,
        webhookSetup: true,
        setupDate: Date.now(),
      },
    });

    // Create a webhook endpoint record for tracking
    const webhookId = await ctx.db.insert("webhookEndpoints", {
      integrationId,
      name: "Zapier Webhook",
      url: zapierHookUrl,
      events,
      isActive: true,
      secret: "", // Zapier handles its own security
    });

    // Link the webhook to the integration
    await ctx.db.patch(integrationId, {
      configuration: {
        ...integration.configuration,
        zapierHookUrl,
        events,
        webhookEndpointId: webhookId,
      },
    });

    return webhookId;
  },
});

export const handleZapierEvent = action({
  args: {
    eventType: v.string(),
    eventData: v.any(),
    zapierMetadata: v.optional(v.any()),
  },
  handler: async (ctx, { eventType, eventData, zapierMetadata }) => {
    // Find all Zapier integrations that should receive this event
    const integrations = await ctx.runQuery(api.integrations.list);
    const zapierIntegrations = integrations.filter(
      integration => 
        integration.type === "zapier" && 
        integration.isActive &&
        integration.configuration.events?.includes(eventType)
    );

    const results = [];

    for (const integration of zapierIntegrations) {
      try {
        const result = await ctx.runAction(api.zapierIntegration.sendToZapier, {
          integrationId: integration._id,
          eventType,
          data: {
            ...eventData,
            zapierMetadata,
          },
        });
        
        results.push({
          integrationId: integration._id,
          integrationName: integration.name,
          ...result,
        });
      } catch (error) {
        results.push({
          integrationId: integration._id,
          integrationName: integration.name,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return {
      eventType,
      integrationsTriggered: zapierIntegrations.length,
      results,
    };
  },
});

export const receiveFromZapier = action({
  args: {
    integrationId: v.id("integrations"),
    zapierData: v.any(),
  },
  handler: async (ctx, { integrationId, zapierData }) => {
    const integration = await ctx.runQuery(api.integrations.getById, { integrationId });
    
    if (!integration || integration.type !== "zapier") {
      throw new Error("Invalid Zapier integration");
    }

    // Process incoming data from Zapier based on action type
    const { action_type, data } = zapierData;

    switch (action_type) {
      case "create_contact":
        return await ctx.runMutation(api.contacts.create, {
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          company: data.company,
          phone: data.phone,
          tags: data.tags ? data.tags.split(",").map((t: string) => t.trim()) : [],
          customFields: data.customFields || {},
        });

      case "update_contact":
        const contact = await ctx.runQuery(api.contacts.getByEmail, { email: data.email });
        if (!contact) {
          throw new Error("Contact not found");
        }
        
        return await ctx.runMutation(api.contacts.update, {
          contactId: contact._id,
          firstName: data.firstName,
          lastName: data.lastName,
          company: data.company,
          phone: data.phone,
          tags: data.tags ? data.tags.split(",").map((t: string) => t.trim()) : contact.tags,
          customFields: { ...contact.customFields, ...data.customFields },
        });

      case "create_campaign":
        return await ctx.runMutation(api.campaigns.create, {
          name: data.name,
          subject: data.subject,
          content: data.content,
          templateId: data.templateId,
          segmentId: data.segmentId,
          scheduledFor: data.scheduledFor ? new Date(data.scheduledFor).getTime() : undefined,
        });

      case "add_to_segment":
        if (data.email && data.segmentId) {
          const contact = await ctx.runQuery(api.contacts.getByEmail, { email: data.email });
          if (contact) {
            return await ctx.runMutation(api.contact_segments.addContactToSegment, {
              contactId: contact._id,
              segmentId: data.segmentId,
            });
          }
        }
        break;

      default:
        throw new Error(`Unknown action type: ${action_type}`);
    }

    return { success: true, message: "Data processed successfully" };
  },
});

export const validateZapierConnection = action({
  args: {
    zapierHookUrl: v.string(),
  },
  handler: async (ctx, { zapierHookUrl }) => {
    try {
      // Send a test payload to validate the Zapier webhook
      const testPayload = {
        event: "test_connection",
        timestamp: new Date().toISOString(),
        data: {
          test: true,
          message: "This is a test from SmartBatch Email",
        },
        source: "smartbatch-email",
      };

      const response = await fetch(zapierHookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testPayload),
      });

      if (!response.ok) {
        return {
          success: false,
          message: `Zapier webhook validation failed: ${response.status} ${response.statusText}`,
        };
      }

      return {
        success: true,
        message: "Zapier webhook connection validated successfully",
        statusCode: response.status,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  },
});

export const createZapierTrigger = mutation({
  args: {
    integrationId: v.id("integrations"),
    triggerName: v.string(),
    triggerEvents: v.array(v.string()),
    filterConditions: v.optional(v.any()),
    transformations: v.optional(v.any()),
  },
  handler: async (ctx, { integrationId, triggerName, triggerEvents, filterConditions, transformations }) => {
    const triggerId = await ctx.db.insert("workflows", {
      integrationId,
      name: triggerName,
      type: "zapier_trigger",
      isActive: true,
      trigger: {
        type: "zapier",
        events: triggerEvents,
        conditions: filterConditions,
      },
      actions: [{
        type: "send_to_zapier",
        config: {
          transformations,
        },
      }],
      createdBy: await ctx.auth.getUserIdentity().then(identity => identity?.subject),
    });

    return triggerId;
  },
});

export const getZapierIntegrationStats = query({
  args: {
    integrationId: v.id("integrations"),
    timeRange: v.optional(v.string()),
  },
  handler: async (ctx, { integrationId, timeRange = "24h" }) => {
    const integration = await ctx.db.get(integrationId);
    if (!integration || integration.type !== "zapier") {
      throw new Error("Invalid Zapier integration");
    }

    // Calculate time range
    const now = Date.now();
    const timeRangeMs = {
      "1h": 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
    }[timeRange] || 24 * 60 * 60 * 1000;

    const startTime = now - timeRangeMs;

    // Get webhook logs for this integration
    const webhookLogs = await ctx.db
      .query("webhookLogs")
      .withIndex("by_webhook_id", (q) => 
        integration.configuration.webhookEndpointId 
          ? q.eq("webhookId", integration.configuration.webhookEndpointId)
          : q
      )
      .filter((q) => q.gte(q.field("_creationTime"), startTime))
      .collect();

    const totalRequests = webhookLogs.length;
    const successfulRequests = webhookLogs.filter(log => log.status === "success").length;
    const failedRequests = webhookLogs.filter(log => log.status === "failed").length;
    const averageResponseTime = webhookLogs.length > 0 
      ? webhookLogs.reduce((sum, log) => sum + (log.duration || 0), 0) / webhookLogs.length 
      : 0;

    return {
      integrationId,
      integrationName: integration.name,
      timeRange,
      stats: {
        totalRequests,
        successfulRequests,
        failedRequests,
        successRate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
        averageResponseTime: Math.round(averageResponseTime),
      },
      recentActivity: webhookLogs
        .sort((a, b) => b._creationTime - a._creationTime)
        .slice(0, 10)
        .map(log => ({
          timestamp: log._creationTime,
          eventType: log.eventType,
          status: log.status,
          duration: log.duration,
        })),
    };
  },
});

// Utility function to get available Zapier triggers and actions
export const getZapierCapabilities = query({
  args: {},
  handler: async (ctx) => {
    return {
      triggers: [
        {
          key: "new_contact",
          name: "New Contact Created",
          description: "Triggers when a new contact is added to SmartBatch",
          sampleData: {
            email: "john@example.com",
            firstName: "John",
            lastName: "Doe",
            company: "Acme Corp",
            tags: ["lead", "marketing"],
          },
        },
        {
          key: "contact_updated",
          name: "Contact Updated",
          description: "Triggers when a contact is modified",
          sampleData: {
            email: "john@example.com",
            changes: {
              firstName: "John",
              company: "New Company",
            },
          },
        },
        {
          key: "campaign_sent",
          name: "Campaign Sent",
          description: "Triggers when an email campaign is sent",
          sampleData: {
            campaignId: "camp_123",
            campaignName: "Welcome Series",
            recipientCount: 100,
            sentAt: "2025-07-22T10:00:00Z",
          },
        },
        {
          key: "email_opened",
          name: "Email Opened",
          description: "Triggers when a recipient opens an email",
          sampleData: {
            email: "john@example.com",
            campaignId: "camp_123",
            openedAt: "2025-07-22T10:30:00Z",
          },
        },
        {
          key: "email_clicked",
          name: "Email Link Clicked",
          description: "Triggers when a recipient clicks a link in an email",
          sampleData: {
            email: "john@example.com",
            campaignId: "camp_123",
            linkUrl: "https://example.com/product",
            clickedAt: "2025-07-22T10:35:00Z",
          },
        },
      ],
      actions: [
        {
          key: "create_contact",
          name: "Create Contact",
          description: "Creates a new contact in SmartBatch",
          requiredFields: ["email"],
          optionalFields: ["firstName", "lastName", "company", "phone", "tags"],
        },
        {
          key: "update_contact",
          name: "Update Contact",
          description: "Updates an existing contact",
          requiredFields: ["email"],
          optionalFields: ["firstName", "lastName", "company", "phone", "tags"],
        },
        {
          key: "create_campaign",
          name: "Create Campaign",
          description: "Creates a new email campaign",
          requiredFields: ["name", "subject", "content"],
          optionalFields: ["templateId", "segmentId", "scheduledFor"],
        },
        {
          key: "add_to_segment",
          name: "Add Contact to Segment",
          description: "Adds a contact to a specific segment",
          requiredFields: ["email", "segmentId"],
        },
      ],
    };
  },
});
