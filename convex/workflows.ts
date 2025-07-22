import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

/**
 * Workflow Management System
 * Handles automation workflows, triggers, and actions
 */

// Get all workflows for a user
export const getUserWorkflows = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const workflows = await ctx.db
      .query("workflows")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return workflows;
  },
});

// Create a new workflow
export const createWorkflow = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
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
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    // Sort actions by order
    const sortedActions = args.actions.sort((a, b) => a.order - b.order);

    const workflowId = await ctx.db.insert("workflows", {
      userId: user._id,
      name: args.name,
      description: args.description,
      isActive: false, // Start inactive
      trigger: args.trigger,
      actions: sortedActions,
      executionCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return workflowId;
  },
});

// Update workflow
export const updateWorkflow = mutation({
  args: {
    workflowId: v.id("workflows"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    trigger: v.optional(v.object({
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
    })),
    actions: v.optional(v.array(v.object({
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
    }))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow || workflow.userId !== user._id) {
      throw new Error("Workflow not found");
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.isActive !== undefined) updates.isActive = args.isActive;
    if (args.trigger !== undefined) updates.trigger = args.trigger;
    if (args.actions !== undefined) {
      updates.actions = args.actions.sort((a, b) => a.order - b.order);
    }

    await ctx.db.patch(args.workflowId, updates);
    return args.workflowId;
  },
});

// Delete workflow
export const deleteWorkflow = mutation({
  args: {
    workflowId: v.id("workflows"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow || workflow.userId !== user._id) {
      throw new Error("Workflow not found");
    }

    // Delete related executions
    const executions = await ctx.db
      .query("workflowExecutions")
      .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
      .collect();

    for (const execution of executions) {
      await ctx.db.delete(execution._id);
    }

    await ctx.db.delete(args.workflowId);
    return true;
  },
});

// Trigger workflow manually
export const triggerWorkflow = mutation({
  args: {
    workflowId: v.id("workflows"),
    triggerData: v.record(v.string(), v.any()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow || workflow.userId !== user._id) {
      throw new Error("Workflow not found");
    }

    if (!workflow.isActive) {
      throw new Error("Workflow is not active");
    }

    const executionId = await ctx.db.insert("workflowExecutions", {
      userId: user._id,
      workflowId: args.workflowId,
      status: "pending",
      triggerData: args.triggerData,
      executionData: workflow.actions.map(action => ({
        actionType: action.type,
        status: "pending",
      })),
      startedAt: Date.now(),
    });

    // Schedule workflow execution
    await ctx.scheduler.runAfter(0, "workflows:executeWorkflow", { executionId });

    return executionId;
  },
});

// Internal function to execute workflow
export const executeWorkflow = internalMutation({
  args: {
    executionId: v.id("workflowExecutions"),
  },
  handler: async (ctx, args) => {
    const execution = await ctx.db.get(args.executionId);
    if (!execution) return;

    const workflow = await ctx.db.get(execution.workflowId);
    if (!workflow) return;

    try {
      await ctx.db.patch(args.executionId, {
        status: "running",
      });

      let executionData = [...execution.executionData];
      let currentData = execution.triggerData;

      for (let i = 0; i < workflow.actions.length; i++) {
        const action = workflow.actions[i];
        
        try {
          // Check conditions
          if (action.conditions && !evaluateConditions(action.conditions, currentData)) {
            executionData[i] = {
              ...executionData[i],
              status: "completed",
              result: { skipped: true, reason: "Conditions not met" },
              executedAt: Date.now(),
            };
            continue;
          }

          // Execute action
          const result = await executeAction(ctx, action, currentData);
          
          executionData[i] = {
            ...executionData[i],
            status: "completed",
            result,
            executedAt: Date.now(),
          };

          // Update current data with action result
          if (result && typeof result === 'object') {
            currentData = { ...currentData, ...result };
          }

        } catch (error) {
          executionData[i] = {
            ...executionData[i],
            status: "failed",
            error: error instanceof Error ? error.message : "Action execution failed",
            executedAt: Date.now(),
          };

          // Stop execution on error
          break;
        }
      }

      // Update execution completion
      const hasFailures = executionData.some(data => data.status === "failed");
      await ctx.db.patch(args.executionId, {
        status: hasFailures ? "failed" : "completed",
        executionData,
        completedAt: Date.now(),
      });

      // Update workflow stats
      await ctx.db.patch(execution.workflowId, {
        executionCount: workflow.executionCount + 1,
        lastExecuted: Date.now(),
      });

    } catch (error) {
      await ctx.db.patch(args.executionId, {
        status: "failed",
        error: error instanceof Error ? error.message : "Workflow execution failed",
        completedAt: Date.now(),
      });
    }
  },
});

// Get workflow executions
export const getWorkflowExecutions = query({
  args: {
    workflowId: v.optional(v.id("workflows")),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    let query = ctx.db.query("workflowExecutions").withIndex("by_user", (q) => q.eq("userId", user._id));

    if (args.workflowId) {
      query = ctx.db.query("workflowExecutions").withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId));
    }

    let executions = await query.order("desc").take(args.limit || 50);

    if (args.status) {
      executions = executions.filter(execution => execution.status === args.status);
    }

    // Get workflow details for each execution
    const executionsWithWorkflows = await Promise.all(
      executions.map(async (execution) => {
        const workflow = await ctx.db.get(execution.workflowId);
        return {
          ...execution,
          workflow: workflow ? {
            name: workflow.name,
            description: workflow.description,
          } : null,
        };
      })
    );

    return executionsWithWorkflows;
  },
});

// Internal function to trigger workflows based on events
export const triggerWorkflowsByEvent = internalMutation({
  args: {
    eventType: v.string(),
    eventData: v.record(v.string(), v.any()),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // Find workflows that should be triggered by this event
    let query = ctx.db.query("workflows").withIndex("by_active", (q) => q.eq("isActive", true));

    if (args.userId) {
      query = ctx.db.query("workflows")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .filter((q) => q.eq(q.field("isActive"), true));
    }

    const workflows = await query.collect();

    for (const workflow of workflows) {
      // Check if this workflow should be triggered by this event
      if (shouldTriggerWorkflow(workflow.trigger, args.eventType, args.eventData)) {
        const executionId = await ctx.db.insert("workflowExecutions", {
          userId: workflow.userId,
          workflowId: workflow._id,
          status: "pending",
          triggerData: {
            eventType: args.eventType,
            ...args.eventData,
          },
          executionData: workflow.actions.map(action => ({
            actionType: action.type,
            status: "pending",
          })),
          startedAt: Date.now(),
        });

        // Schedule workflow execution
        await ctx.scheduler.runAfter(0, "workflows:executeWorkflow", { executionId });
      }
    }
  },
});

// Helper functions
function evaluateConditions(conditions: any[], data: any): boolean {
  return conditions.every(condition => {
    const value = getNestedValue(data, condition.field);
    
    switch (condition.operator) {
      case "equals":
        return value === condition.value;
      case "not_equals":
        return value !== condition.value;
      case "contains":
        return String(value).includes(String(condition.value));
      case "not_contains":
        return !String(value).includes(String(condition.value));
      case "greater_than":
        return Number(value) > Number(condition.value);
      case "less_than":
        return Number(value) < Number(condition.value);
      case "exists":
        return value !== undefined && value !== null;
      case "not_exists":
        return value === undefined || value === null;
      default:
        return false;
    }
  });
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

function shouldTriggerWorkflow(trigger: any, eventType: string, eventData: any): boolean {
  switch (trigger.type) {
    case "contact_added":
      return eventType === "contact_created";
    case "tag_added":
      return eventType === "contact_updated" && eventData.tagsAdded?.length > 0;
    case "email_event":
      return ["email_opened", "email_clicked", "unsubscribe", "bounce"].includes(eventType);
    case "integration_sync":
      return eventType === "integration_sync_completed";
    case "webhook":
      return eventType === "webhook_received" && trigger.configuration.eventType === eventData.eventType;
    default:
      return false;
  }
}

async function executeAction(ctx: any, action: any, data: any): Promise<any> {
  switch (action.type) {
    case "send_email":
      return await executeSendEmailAction(ctx, action.configuration, data);
    case "add_tag":
      return await executeAddTagAction(ctx, action.configuration, data);
    case "update_contact":
      return await executeUpdateContactAction(ctx, action.configuration, data);
    case "webhook_call":
      return await executeWebhookCallAction(ctx, action.configuration, data);
    case "delay":
      return await executeDelayAction(action.configuration);
    case "conditional":
      return await executeConditionalAction(ctx, action.configuration, data);
    default:
      throw new Error(`Unsupported action type: ${action.type}`);
  }
}

async function executeSendEmailAction(ctx: any, config: any, data: any): Promise<any> {
  // TODO: Implement email sending
  return { sent: true, emailId: "placeholder" };
}

async function executeAddTagAction(ctx: any, config: any, data: any): Promise<any> {
  // TODO: Implement tag addition
  return { tagAdded: config.tag };
}

async function executeUpdateContactAction(ctx: any, config: any, data: any): Promise<any> {
  // TODO: Implement contact update
  return { updated: true };
}

async function executeWebhookCallAction(ctx: any, config: any, data: any): Promise<any> {
  // TODO: Implement webhook call
  return { called: true, url: config.url };
}

async function executeDelayAction(config: any): Promise<any> {
  // Schedule next action after delay
  const delayMs = config.delayMs || 1000;
  await new Promise(resolve => setTimeout(resolve, delayMs));
  return { delayed: delayMs };
}

async function executeConditionalAction(ctx: any, config: any, data: any): Promise<any> {
  // TODO: Implement conditional logic
  return { evaluated: true };
}
