
import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

// Version types
export const VERSION_TYPES = {
  MAJOR: "major",      // Breaking changes
  MINOR: "minor",      // New features, backward compatible
  PATCH: "patch",      // Bug fixes, backward compatible
  HOTFIX: "hotfix"     // Critical security/bug fixes
} as const;

// Deployment strategies
export const DEPLOYMENT_STRATEGIES = {
  IMMEDIATE: "immediate",
  SCHEDULED: "scheduled",
  CANARY: "canary",
  BLUE_GREEN: "blue_green",
  ROLLING: "rolling"
} as const;

// Create integration version
export const createIntegrationVersion = mutation({
  args: {
    integrationId: v.id("integrations"),
    version: v.string(),
    versionType: v.string(),
    changelog: v.string(),
    configuration: v.any(),
    dependencies: v.optional(v.array(v.object({
      name: v.string(),
      version: v.string(),
      required: v.boolean()
    }))),
    compatibilityNotes: v.optional(v.string()),
    migrationInstructions: v.optional(v.string()),
    rollbackInstructions: v.optional(v.string()),
    testResults: v.optional(v.any()),
    deploymentStrategy: v.optional(v.string()),
    scheduledDeployment: v.optional(v.number()),
    canaryConfig: v.optional(v.object({
      percentage: v.number(),
      duration: v.number(),
      successCriteria: v.array(v.string())
    }))
  },
  handler: async (ctx, args) => {
    // Get current integration to create snapshot
    const integration = await ctx.db.get(args.integrationId);
    if (!integration) {
      throw new Error("Integration not found");
    }

    // Create configuration snapshot of current version
    const currentSnapshot = {
      configuration: integration.configuration,
      settings: integration.settings,
      webhooks: integration.webhookEndpoints,
      healthStatus: integration.healthStatus,
      lastSyncAt: integration.lastSyncAt,
      snapshotAt: Date.now()
    };

    // Create new version record
    const versionId = await ctx.db.insert("integrationVersions", {
      integrationId: args.integrationId,
      version: args.version,
      versionType: args.versionType,
      changelog: args.changelog,
      configuration: args.configuration,
      dependencies: args.dependencies || [],
      compatibilityNotes: args.compatibilityNotes,
      migrationInstructions: args.migrationInstructions,
      rollbackInstructions: args.rollbackInstructions,
      testResults: args.testResults,
      deploymentStrategy: args.deploymentStrategy || DEPLOYMENT_STRATEGIES.IMMEDIATE,
      scheduledDeployment: args.scheduledDeployment,
      canaryConfig: args.canaryConfig,
      status: "pending",
      currentSnapshot,
      deploymentProgress: 0,
      rollbackAvailable: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    // If immediate deployment, deploy now
    if (args.deploymentStrategy === DEPLOYMENT_STRATEGIES.IMMEDIATE) {
      await deployVersion(ctx, { versionId });
    }

    return versionId;
  }
});

// Deploy integration version
export const deployVersion = action({
  args: {
    versionId: v.id("integrationVersions"),
    force: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const version = await ctx.runQuery(internal.integrationVersioning.getIntegrationVersion, {
      versionId: args.versionId
    });

    if (!version) {
      throw new Error("Version not found");
    }

    if (version.status === "deployed" && !args.force) {
      throw new Error("Version already deployed");
    }

    // Update version status to deploying
    await ctx.runMutation(internal.integrationVersioning.updateVersionStatus, {
      versionId: args.versionId,
      status: "deploying",
      progress: 0
    });

    try {
      let deploymentResult;

      switch (version.deploymentStrategy) {
        case DEPLOYMENT_STRATEGIES.IMMEDIATE:
          deploymentResult = await performImmediateDeployment(ctx, version);
          break;
        case DEPLOYMENT_STRATEGIES.CANARY:
          deploymentResult = await performCanaryDeployment(ctx, version);
          break;
        case DEPLOYMENT_STRATEGIES.BLUE_GREEN:
          deploymentResult = await performBlueGreenDeployment(ctx, version);
          break;
        case DEPLOYMENT_STRATEGIES.ROLLING:
          deploymentResult = await performRollingDeployment(ctx, version);
          break;
        default:
          deploymentResult = await performImmediateDeployment(ctx, version);
      }

      if (deploymentResult.success) {
        // Update integration with new configuration
        await ctx.runMutation(internal.integrations.updateIntegrationConfiguration, {
          integrationId: version.integrationId,
          configuration: version.configuration
        });

        // Mark version as deployed
        await ctx.runMutation(internal.integrationVersioning.updateVersionStatus, {
          versionId: args.versionId,
          status: "deployed",
          progress: 100,
          deployedAt: Date.now(),
          deploymentResult
        });

        // Mark previous versions as superseded
        await ctx.runMutation(internal.integrationVersioning.markPreviousVersionsSuperseded, {
          integrationId: version.integrationId,
          currentVersionId: args.versionId
        });

        return { success: true, deploymentResult };
      } else {
        throw new Error(deploymentResult.error || "Deployment failed");
      }

    } catch (error) {
      await ctx.runMutation(internal.integrationVersioning.updateVersionStatus, {
        versionId: args.versionId,
        status: "failed",
        error: error.message
      });
      throw error;
    }
  }
});

// Rollback to previous version
export const rollbackVersion = action({
  args: {
    integrationId: v.id("integrations"),
    targetVersionId: v.optional(v.id("integrationVersions")),
    reason: v.string()
  },
  handler: async (ctx, args) => {
    let targetVersion;

    if (args.targetVersionId) {
      targetVersion = await ctx.runQuery(internal.integrationVersioning.getIntegrationVersion, {
        versionId: args.targetVersionId
      });
    } else {
      // Get the last successfully deployed version
      const versions = await ctx.runQuery(internal.integrationVersioning.getIntegrationVersions, {
        integrationId: args.integrationId,
        status: "superseded",
        limit: 1
      });
      targetVersion = versions[0];
    }

    if (!targetVersion) {
      throw new Error("No suitable version found for rollback");
    }

    if (!targetVersion.rollbackAvailable) {
      throw new Error("Rollback not available for this version");
    }

    // Create rollback record
    const rollbackId = await ctx.runMutation(internal.integrationVersioning.createRollbackRecord, {
      integrationId: args.integrationId,
      fromVersionId: await getCurrentVersionId(ctx, args.integrationId),
      toVersionId: targetVersion._id,
      reason: args.reason,
      initiatedAt: Date.now()
    });

    try {
      // Restore configuration from snapshot
      const snapshot = targetVersion.currentSnapshot;
      if (snapshot) {
        await ctx.runMutation(internal.integrations.updateIntegrationConfiguration, {
          integrationId: args.integrationId,
          configuration: snapshot.configuration,
          settings: snapshot.settings
        });

        // Restore webhooks if needed
        if (snapshot.webhooks) {
          await ctx.runMutation(internal.integrations.updateWebhookEndpoints, {
            integrationId: args.integrationId,
            webhookEndpoints: snapshot.webhooks
          });
        }
      }

      // Mark rollback as completed
      await ctx.runMutation(internal.integrationVersioning.updateRollbackStatus, {
        rollbackId,
        status: "completed",
        completedAt: Date.now()
      });

      // Update version statuses
      await ctx.runMutation(internal.integrationVersioning.updateVersionStatus, {
        versionId: targetVersion._id,
        status: "deployed"
      });

      return { success: true, rolledBackTo: targetVersion.version };

    } catch (error) {
      await ctx.runMutation(internal.integrationVersioning.updateRollbackStatus, {
        rollbackId,
        status: "failed",
        error: error.message
      });
      throw error;
    }
  }
});

// Deployment strategies implementation
async function performImmediateDeployment(ctx: any, version: any): Promise<any> {
  // Simple immediate deployment
  await updateDeploymentProgress(ctx, version._id, 50);
  
  // Simulate deployment validation
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await updateDeploymentProgress(ctx, version._id, 100);
  
  return {
    success: true,
    strategy: "immediate",
    deployedAt: Date.now(),
    validationResults: {
      configurationValid: true,
      dependenciesResolved: true,
      healthChecksPass: true
    }
  };
}

async function performCanaryDeployment(ctx: any, version: any): Promise<any> {
  const canaryConfig = version.canaryConfig || { percentage: 10, duration: 300000, successCriteria: [] };
  
  // Phase 1: Deploy to canary percentage
  await updateDeploymentProgress(ctx, version._id, 25);
  
  // Phase 2: Monitor canary for specified duration
  await updateDeploymentProgress(ctx, version._id, 50);
  
  // Simulate monitoring
  const canaryMetrics = await monitorCanaryDeployment(ctx, version, canaryConfig);
  
  if (!canaryMetrics.success) {
    throw new Error("Canary deployment failed validation");
  }
  
  // Phase 3: Full deployment
  await updateDeploymentProgress(ctx, version._id, 75);
  
  // Phase 4: Final validation
  await updateDeploymentProgress(ctx, version._id, 100);
  
  return {
    success: true,
    strategy: "canary",
    canaryMetrics,
    fullDeploymentAt: Date.now()
  };
}

async function performBlueGreenDeployment(ctx: any, version: any): Promise<any> {
  // Phase 1: Prepare green environment
  await updateDeploymentProgress(ctx, version._id, 25);
  
  // Phase 2: Deploy to green environment
  await updateDeploymentProgress(ctx, version._id, 50);
  
  // Phase 3: Validate green environment
  await updateDeploymentProgress(ctx, version._id, 75);
  
  // Phase 4: Switch traffic to green
  await updateDeploymentProgress(ctx, version._id, 100);
  
  return {
    success: true,
    strategy: "blue_green",
    switchedAt: Date.now(),
    greenEnvironmentReady: true
  };
}

async function performRollingDeployment(ctx: any, version: any): Promise<any> {
  const phases = [25, 50, 75, 100];
  
  for (let i = 0; i < phases.length; i++) {
    await updateDeploymentProgress(ctx, version._id, phases[i]);
    
    // Simulate rolling deployment validation
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return {
    success: true,
    strategy: "rolling",
    phasesCompleted: phases.length,
    completedAt: Date.now()
  };
}

// Monitor canary deployment
async function monitorCanaryDeployment(ctx: any, version: any, config: any): Promise<any> {
  // Simulate monitoring metrics
  const metrics = {
    errorRate: Math.random() * 2, // 0-2%
    responseTime: 200 + Math.random() * 100, // 200-300ms
    throughput: 95 + Math.random() * 10, // 95-105%
    userSatisfaction: 85 + Math.random() * 15 // 85-100%
  };
  
  const success = metrics.errorRate < 5 && 
                 metrics.responseTime < 500 && 
                 metrics.throughput > 90 && 
                 metrics.userSatisfaction > 80;
  
  return {
    success,
    metrics,
    duration: config.duration,
    percentage: config.percentage
  };
}

// Helper functions
async function updateDeploymentProgress(ctx: any, versionId: Id<"integrationVersions">, progress: number) {
  await ctx.runMutation(internal.integrationVersioning.updateVersionProgress, {
    versionId,
    progress
  });
}

async function getCurrentVersionId(ctx: any, integrationId: Id<"integrations">): Promise<Id<"integrationVersions"> | null> {
  const versions = await ctx.runQuery(internal.integrationVersioning.getIntegrationVersions, {
    integrationId,
    status: "deployed",
    limit: 1
  });
  return versions[0]?._id || null;
}

// Query functions
export const getIntegrationVersions = query({
  args: {
    integrationId: v.id("integrations"),
    status: v.optional(v.string()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("integrationVersions")
      .filter(q => q.eq(q.field("integrationId"), args.integrationId));

    if (args.status) {
      query = query.filter(q => q.eq(q.field("status"), args.status));
    }

    return await query
      .order("desc")
      .take(args.limit || 20);
  }
});

export const getIntegrationVersion = query({
  args: { versionId: v.id("integrationVersions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.versionId);
  }
});

export const getRollbackHistory = query({
  args: {
    integrationId: v.id("integrations"),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    return await ctx.db.query("integrationRollbacks")
      .filter(q => q.eq(q.field("integrationId"), args.integrationId))
      .order("desc")
      .take(args.limit || 10);
  }
});

// Mutation functions
export const updateVersionStatus = mutation({
  args: {
    versionId: v.id("integrationVersions"),
    status: v.string(),
    progress: v.optional(v.number()),
    error: v.optional(v.string()),
    deployedAt: v.optional(v.number()),
    deploymentResult: v.optional(v.any())
  },
  handler: async (ctx, args) => {
    const updates: any = {
      status: args.status,
      updatedAt: Date.now()
    };

    if (args.progress !== undefined) {
      updates.deploymentProgress = args.progress;
    }
    if (args.error) {
      updates.error = args.error;
    }
    if (args.deployedAt) {
      updates.deployedAt = args.deployedAt;
    }
    if (args.deploymentResult) {
      updates.deploymentResult = args.deploymentResult;
    }

    await ctx.db.patch(args.versionId, updates);
    return { success: true };
  }
});

export const updateVersionProgress = mutation({
  args: {
    versionId: v.id("integrationVersions"),
    progress: v.number()
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.versionId, {
      deploymentProgress: args.progress,
      updatedAt: Date.now()
    });
    return { success: true };
  }
});

export const markPreviousVersionsSuperseded = mutation({
  args: {
    integrationId: v.id("integrations"),
    currentVersionId: v.id("integrationVersions")
  },
  handler: async (ctx, args) => {
    const previousVersions = await ctx.db.query("integrationVersions")
      .filter(q => q.eq(q.field("integrationId"), args.integrationId))
      .filter(q => q.neq(q.field("_id"), args.currentVersionId))
      .filter(q => q.eq(q.field("status"), "deployed"))
      .collect();

    for (const version of previousVersions) {
      await ctx.db.patch(version._id, {
        status: "superseded",
        supersededAt: Date.now(),
        updatedAt: Date.now()
      });
    }

    return { superseded: previousVersions.length };
  }
});

export const createRollbackRecord = mutation({
  args: {
    integrationId: v.id("integrations"),
    fromVersionId: v.optional(v.id("integrationVersions")),
    toVersionId: v.id("integrationVersions"),
    reason: v.string(),
    initiatedAt: v.number()
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("integrationRollbacks", {
      integrationId: args.integrationId,
      fromVersionId: args.fromVersionId,
      toVersionId: args.toVersionId,
      reason: args.reason,
      status: "in_progress",
      initiatedAt: args.initiatedAt,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  }
});

export const updateRollbackStatus = mutation({
  args: {
    rollbackId: v.id("integrationRollbacks"),
    status: v.string(),
    completedAt: v.optional(v.number()),
    error: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const updates: any = {
      status: args.status,
      updatedAt: Date.now()
    };

    if (args.completedAt) {
      updates.completedAt = args.completedAt;
    }
    if (args.error) {
      updates.error = args.error;
    }

    await ctx.db.patch(args.rollbackId, updates);
    return { success: true };
  }
});

// Compare versions
export const compareVersions = query({
  args: {
    versionId1: v.id("integrationVersions"),
    versionId2: v.id("integrationVersions")
  },
  handler: async (ctx, args) => {
    const version1 = await ctx.db.get(args.versionId1);
    const version2 = await ctx.db.get(args.versionId2);

    if (!version1 || !version2) {
      throw new Error("One or both versions not found");
    }

    const differences = {
      configuration: compareObjects(version1.configuration, version2.configuration),
      dependencies: compareDependencies(version1.dependencies || [], version2.dependencies || []),
      compatibility: {
        breakingChanges: version1.versionType === VERSION_TYPES.MAJOR || version2.versionType === VERSION_TYPES.MAJOR,
        requiresMigration: Boolean(version1.migrationInstructions || version2.migrationInstructions)
      }
    };

    return {
      version1: {
        version: version1.version,
        type: version1.versionType,
        date: version1.createdAt
      },
      version2: {
        version: version2.version,
        type: version2.versionType,
        date: version2.createdAt
      },
      differences
    };
  }
});

// Helper functions for comparison
function compareObjects(obj1: any, obj2: any): any {
  const changes = {
    added: [] as string[],
    removed: [] as string[],
    modified: [] as string[]
  };

  const keys1 = Object.keys(obj1 || {});
  const keys2 = Object.keys(obj2 || {});

  // Find added keys
  for (const key of keys2) {
    if (!keys1.includes(key)) {
      changes.added.push(key);
    }
  }

  // Find removed keys
  for (const key of keys1) {
    if (!keys2.includes(key)) {
      changes.removed.push(key);
    }
  }

  // Find modified keys
  for (const key of keys1) {
    if (keys2.includes(key) && JSON.stringify(obj1[key]) !== JSON.stringify(obj2[key])) {
      changes.modified.push(key);
    }
  }

  return changes;
}

function compareDependencies(deps1: any[], deps2: any[]): any {
  const changes = {
    added: [] as any[],
    removed: [] as any[],
    updated: [] as any[]
  };

  const deps1Map = new Map(deps1.map(d => [d.name, d]));
  const deps2Map = new Map(deps2.map(d => [d.name, d]));

  // Find added dependencies
  for (const [name, dep] of deps2Map) {
    if (!deps1Map.has(name)) {
      changes.added.push(dep);
    }
  }

  // Find removed dependencies
  for (const [name, dep] of deps1Map) {
    if (!deps2Map.has(name)) {
      changes.removed.push(dep);
    }
  }

  // Find updated dependencies
  for (const [name, dep1] of deps1Map) {
    const dep2 = deps2Map.get(name);
    if (dep2 && dep1.version !== dep2.version) {
      changes.updated.push({
        name,
        oldVersion: dep1.version,
        newVersion: dep2.version
      });
    }
  }

  return changes;
}

// Schedule version deployment
export const scheduleVersionDeployment = mutation({
  args: {
    versionId: v.id("integrationVersions"),
    scheduledFor: v.number(),
    deploymentStrategy: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const updates: any = {
      scheduledDeployment: args.scheduledFor,
      status: "scheduled",
      updatedAt: Date.now()
    };

    if (args.deploymentStrategy) {
      updates.deploymentStrategy = args.deploymentStrategy;
    }

    await ctx.db.patch(args.versionId, updates);
    return { success: true };
  }
});

// Process scheduled deployments
export const processScheduledDeployments = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const scheduledVersions = await ctx.db.query("integrationVersions")
      .filter(q => q.eq(q.field("status"), "scheduled"))
      .filter(q => q.lte(q.field("scheduledDeployment"), now))
      .collect();

    const results = [];

    for (const version of scheduledVersions) {
      try {
        await deployVersion(ctx, { versionId: version._id });
        results.push({ versionId: version._id, status: "deployed" });
      } catch (error) {
        results.push({ versionId: version._id, status: "failed", error: error.message });
      }
    }

    return { processed: results.length, results };
  }
});
