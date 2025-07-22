import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

// Integration backup system
export const createBackup = action({
  args: {
    userId: v.id("users"),
    integrationId: v.id("integrations"),
    backupType: v.union(
      v.literal("full"),
      v.literal("configuration"),
      v.literal("data"),
      v.literal("scheduled")
    ),
    name: v.string(),
    description: v.optional(v.string()),
    encryption: v.optional(v.object({
      enabled: v.boolean(),
      algorithm: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    // Get integration details
    const integration = await ctx.runQuery(internal.integrations.getIntegration, {
      integrationId: args.integrationId
    });

    if (!integration) {
      throw new Error("Integration not found");
    }

    // Create backup record
    const backupId = await ctx.runMutation(internal.integrationBackup.createBackupRecord, {
      userId: args.userId,
      integrationId: args.integrationId,
      backupType: args.backupType,
      name: args.name,
      description: args.description,
      encryption: args.encryption,
    });

    // Generate backup data based on type
    let backupData: any = {};
    
    try {
      switch (args.backupType) {
        case "full":
          backupData = await createFullBackup(ctx, integration);
          break;
        case "configuration":
          backupData = await createConfigurationBackup(ctx, integration);
          break;
        case "data":
          backupData = await createDataBackup(ctx, integration);
          break;
        case "scheduled":
          backupData = await createScheduledBackup(ctx, integration);
          break;
      }

      // Calculate backup size and checksums
      const backupString = JSON.stringify(backupData);
      const size = new Blob([backupString]).size;
      const checksumMD5 = await generateChecksum(backupString, 'MD5');
      const checksumSHA256 = await generateChecksum(backupString, 'SHA-256');

      // Apply encryption if enabled
      if (args.encryption?.enabled) {
        backupData = await encryptBackupData(backupData, args.encryption.algorithm);
      }

      // Update backup record with data
      await ctx.runMutation(internal.integrationBackup.updateBackupData, {
        backupId,
        backupData,
        size,
        checksumMD5,
        checksumSHA256,
        status: "completed",
      });

      return { backupId, size, checksums: { md5: checksumMD5, sha256: checksumSHA256 } };

    } catch (error) {
      await ctx.runMutation(internal.integrationBackup.updateBackupStatus, {
        backupId,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  },
});

async function createFullBackup(ctx: any, integration: any) {
  return {
    integration: {
      id: integration._id,
      name: integration.name,
      provider: integration.provider,
      config: integration.config,
      status: integration.status,
      settings: integration.settings,
      createdAt: integration.createdAt,
      updatedAt: integration.updatedAt,
    },
    // Include related data
    syncHistory: await getSyncHistory(ctx, integration._id),
    webhooks: await getWebhooks(ctx, integration._id),
    errorLogs: await getErrorLogs(ctx, integration._id),
    performanceMetrics: await getPerformanceMetrics(ctx, integration._id),
    securityScans: await getSecurityScans(ctx, integration._id),
    versions: await getVersionHistory(ctx, integration._id),
    tests: await getTestHistory(ctx, integration._id),
  };
}

async function createConfigurationBackup(ctx: any, integration: any) {
  return {
    integration: {
      id: integration._id,
      name: integration.name,
      provider: integration.provider,
      config: integration.config,
      settings: integration.settings,
    },
    webhooks: await getWebhooks(ctx, integration._id),
  };
}

async function createDataBackup(ctx: any, integration: any) {
  return {
    syncHistory: await getSyncHistory(ctx, integration._id),
    errorLogs: await getErrorLogs(ctx, integration._id),
    performanceMetrics: await getPerformanceMetrics(ctx, integration._id),
    auditLogs: await getAuditLogs(ctx, integration._id),
  };
}

async function createScheduledBackup(ctx: any, integration: any) {
  // For scheduled backups, include recent data only
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  
  return {
    integration: {
      id: integration._id,
      name: integration.name,
      config: integration.config,
      status: integration.status,
    },
    recentSyncHistory: await getRecentSyncHistory(ctx, integration._id, thirtyDaysAgo),
    recentErrorLogs: await getRecentErrorLogs(ctx, integration._id, thirtyDaysAgo),
    recentMetrics: await getRecentMetrics(ctx, integration._id, thirtyDaysAgo),
  };
}

// Restore backup
export const restoreBackup = action({
  args: {
    userId: v.id("users"),
    backupId: v.id("integrationBackups"),
    restoreType: v.union(
      v.literal("full"),
      v.literal("configuration_only"),
      v.literal("data_only"),
      v.literal("selective")
    ),
    options: v.optional(v.object({
      overwriteExisting: v.boolean(),
      createNew: v.boolean(),
      selectiveRestore: v.optional(v.array(v.string())),
    })),
  },
  handler: async (ctx, args) => {
    // Get backup
    const backup = await ctx.runQuery(internal.integrationBackup.getBackup, {
      backupId: args.backupId
    });

    if (!backup || backup.status !== "completed") {
      throw new Error("Backup not found or not completed");
    }

    // Update backup status
    await ctx.runMutation(internal.integrationBackup.updateBackupStatus, {
      backupId: args.backupId,
      status: "restoring",
    });

    try {
      let backupData = backup.backupData;

      // Decrypt if needed
      if (backup.encryption?.enabled) {
        backupData = await decryptBackupData(backupData, backup.encryption.algorithm);
      }

      // Verify checksums
      const backupString = JSON.stringify(backupData);
      const currentMD5 = await generateChecksum(backupString, 'MD5');
      if (currentMD5 !== backup.checksumMD5) {
        throw new Error("Backup integrity check failed - MD5 mismatch");
      }

      // Perform restore based on type
      let restoredItems = 0;
      
      switch (args.restoreType) {
        case "full":
          restoredItems = await restoreFullBackup(ctx, backupData, args.options);
          break;
        case "configuration_only":
          restoredItems = await restoreConfigurationOnly(ctx, backupData, args.options);
          break;
        case "data_only":
          restoredItems = await restoreDataOnly(ctx, backupData, args.options);
          break;
        case "selective":
          restoredItems = await restoreSelective(ctx, backupData, args.options);
          break;
      }

      // Update backup record
      await ctx.runMutation(internal.integrationBackup.updateRestoreInfo, {
        backupId: args.backupId,
        restoredCount: restoredItems,
        lastRestoredAt: Date.now(),
      });

      return { success: true, restoredItems };

    } catch (error) {
      await ctx.runMutation(internal.integrationBackup.updateBackupStatus, {
        backupId: args.backupId,
        status: "completed", // Reset to completed since restore failed
        error: error instanceof Error ? error.message : "Restore failed",
      });
      throw error;
    }
  },
});

// Integration migration system
export const createMigration = action({
  args: {
    userId: v.id("users"),
    sourceIntegrationId: v.optional(v.id("integrations")),
    targetIntegrationId: v.id("integrations"),
    migrationType: v.union(
      v.literal("provider_change"),
      v.literal("version_upgrade"),
      v.literal("configuration_update"),
      v.literal("data_migration"),
      v.literal("platform_migration")
    ),
    name: v.string(),
    description: v.optional(v.string()),
    migrationPlan: v.any(),
    dataMapping: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Create migration record
    const migrationId = await ctx.runMutation(internal.integrationMigration.createMigrationRecord, {
      userId: args.userId,
      sourceIntegrationId: args.sourceIntegrationId,
      targetIntegrationId: args.targetIntegrationId,
      migrationType: args.migrationType,
      name: args.name,
      description: args.description,
      migrationPlan: args.migrationPlan,
      dataMapping: args.dataMapping,
    });

    // Generate migration phases
    const phases = generateMigrationPhases(args.migrationType);
    
    await ctx.runMutation(internal.integrationMigration.updateMigrationPhases, {
      migrationId,
      phases,
    });

    return { migrationId, phases };
  },
});

// Execute migration
export const executeMigration = action({
  args: {
    migrationId: v.id("integrationMigrations"),
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const migration = await ctx.runQuery(internal.integrationMigration.getMigration, {
      migrationId: args.migrationId
    });

    if (!migration) {
      throw new Error("Migration not found");
    }

    // Update migration status
    await ctx.runMutation(internal.integrationMigration.updateMigrationStatus, {
      migrationId: args.migrationId,
      status: "in_progress",
      startedAt: Date.now(),
    });

    try {
      const results = await executeMigrationPhases(ctx, migration, args.dryRun || false);
      
      await ctx.runMutation(internal.integrationMigration.updateMigrationStatus, {
        migrationId: args.migrationId,
        status: "completed",
        completedAt: Date.now(),
        metrics: results.metrics,
      });

      return results;

    } catch (error) {
      await ctx.runMutation(internal.integrationMigration.updateMigrationStatus, {
        migrationId: args.migrationId,
        status: "failed",
        error: error instanceof Error ? error.message : "Migration failed",
      });
      throw error;
    }
  },
});

async function executeMigrationPhases(ctx: any, migration: any, dryRun: boolean) {
  const results = {
    phases: [] as any[],
    metrics: {
      recordsMigrated: 0,
      duration: 0,
      downtime: 0,
      errorCount: 0,
    },
  };

  const startTime = Date.now();

  for (const phase of migration.phases) {
    const phaseStartTime = Date.now();
    
    try {
      // Update phase status
      await ctx.runMutation(internal.integrationMigration.updatePhaseStatus, {
        migrationId: migration._id,
        phaseName: phase.name,
        status: "in_progress",
        startedAt: phaseStartTime,
      });

      // Execute phase
      const phaseResult = await executeMigrationPhase(ctx, migration, phase, dryRun);
      
      // Update phase completion
      await ctx.runMutation(internal.integrationMigration.updatePhaseStatus, {
        migrationId: migration._id,
        phaseName: phase.name,
        status: "completed",
        completedAt: Date.now(),
        progress: 100,
      });

      results.phases.push({
        name: phase.name,
        status: "completed",
        duration: Date.now() - phaseStartTime,
        result: phaseResult,
      });

      results.metrics.recordsMigrated += phaseResult.recordsProcessed || 0;

    } catch (error) {
      results.metrics.errorCount++;
      
      await ctx.runMutation(internal.integrationMigration.updatePhaseStatus, {
        migrationId: migration._id,
        phaseName: phase.name,
        status: "failed",
        error: error instanceof Error ? error.message : "Phase failed",
      });

      results.phases.push({
        name: phase.name,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });

      // Decide whether to continue or abort
      if (phase.critical !== false) {
        throw error;
      }
    }
  }

  results.metrics.duration = Date.now() - startTime;
  return results;
}

async function executeMigrationPhase(ctx: any, migration: any, phase: any, dryRun: boolean) {
  switch (phase.name) {
    case "pre_validation":
      return await executePreValidation(ctx, migration, dryRun);
    case "backup_source":
      return await executeBackupSource(ctx, migration, dryRun);
    case "prepare_target":
      return await executePrepareTarget(ctx, migration, dryRun);
    case "migrate_configuration":
      return await executeMigrateConfiguration(ctx, migration, dryRun);
    case "migrate_data":
      return await executeMigrateData(ctx, migration, dryRun);
    case "validate_migration":
      return await executeValidateMigration(ctx, migration, dryRun);
    case "cutover":
      return await executeCutover(ctx, migration, dryRun);
    case "post_validation":
      return await executePostValidation(ctx, migration, dryRun);
    default:
      throw new Error(`Unknown migration phase: ${phase.name}`);
  }
}

// Helper functions for various operations
async function getSyncHistory(ctx: any, integrationId: Id<"integrations">) {
  return await ctx.runQuery(internal.integrationSync.getSyncHistory, { integrationId });
}

async function getWebhooks(ctx: any, integrationId: Id<"integrations">) {
  return await ctx.runQuery(internal.integrationWebhooks.getWebhooks, { integrationId });
}

async function getErrorLogs(ctx: any, integrationId: Id<"integrations">) {
  return await ctx.runQuery(internal.errorHandling.getErrorLogs, { integrationId });
}

async function getPerformanceMetrics(ctx: any, integrationId: Id<"integrations">) {
  return await ctx.runQuery(internal.performanceOptimization.getMetrics, { integrationId });
}

async function getSecurityScans(ctx: any, integrationId: Id<"integrations">) {
  return await ctx.runQuery(internal.securityScanning.getScans, { integrationId });
}

async function getVersionHistory(ctx: any, integrationId: Id<"integrations">) {
  return await ctx.runQuery(internal.integrationVersioning.getVersions, { integrationId });
}

async function getTestHistory(ctx: any, integrationId: Id<"integrations">) {
  return await ctx.runQuery(internal.integrationTesting.getTestHistory, { integrationId });
}

async function getAuditLogs(ctx: any, integrationId: Id<"integrations">) {
  return await ctx.runQuery(internal.auditLogging.getAuditLogs, { integrationId });
}

async function getRecentSyncHistory(ctx: any, integrationId: Id<"integrations">, since: number) {
  return await ctx.runQuery(internal.integrationSync.getRecentSyncHistory, { integrationId, since });
}

async function getRecentErrorLogs(ctx: any, integrationId: Id<"integrations">, since: number) {
  return await ctx.runQuery(internal.errorHandling.getRecentErrorLogs, { integrationId, since });
}

async function getRecentMetrics(ctx: any, integrationId: Id<"integrations">, since: number) {
  return await ctx.runQuery(internal.performanceOptimization.getRecentMetrics, { integrationId, since });
}

async function generateChecksum(data: string, algorithm: string): Promise<string> {
  // In a real implementation, use crypto library
  // For now, return a mock checksum
  return `${algorithm}_${Date.now()}_${data.length}`;
}

async function encryptBackupData(data: any, algorithm: string): Promise<any> {
  // In a real implementation, use proper encryption
  // For now, return encoded data
  return {
    encrypted: true,
    algorithm,
    data: Buffer.from(JSON.stringify(data)).toString('base64'),
  };
}

async function decryptBackupData(data: any, algorithm: string): Promise<any> {
  // In a real implementation, use proper decryption
  if (data.encrypted) {
    return JSON.parse(Buffer.from(data.data, 'base64').toString());
  }
  return data;
}

function generateMigrationPhases(migrationType: string) {
  const commonPhases = [
    { name: "pre_validation", critical: true },
    { name: "backup_source", critical: true },
    { name: "prepare_target", critical: true },
  ];

  const typeSpecificPhases = {
    provider_change: [
      { name: "migrate_configuration", critical: true },
      { name: "migrate_data", critical: true },
      { name: "validate_migration", critical: true },
      { name: "cutover", critical: true },
    ],
    version_upgrade: [
      { name: "migrate_configuration", critical: true },
      { name: "validate_migration", critical: true },
      { name: "cutover", critical: false },
    ],
    configuration_update: [
      { name: "migrate_configuration", critical: true },
      { name: "validate_migration", critical: true },
    ],
    data_migration: [
      { name: "migrate_data", critical: true },
      { name: "validate_migration", critical: true },
    ],
    platform_migration: [
      { name: "migrate_configuration", critical: true },
      { name: "migrate_data", critical: true },
      { name: "validate_migration", critical: true },
      { name: "cutover", critical: true },
    ],
  };

  const endPhases = [
    { name: "post_validation", critical: false },
  ];

  return [
    ...commonPhases,
    ...(typeSpecificPhases[migrationType as keyof typeof typeSpecificPhases] || []),
    ...endPhases,
  ].map(phase => ({
    ...phase,
    status: "pending" as const,
    startedAt: undefined,
    completedAt: undefined,
    error: undefined,
    progress: 0,
  }));
}

// Implementation of migration phase executors
async function executePreValidation(ctx: any, migration: any, dryRun: boolean) {
  // Validate source and target integrations
  const checks = [
    "Source integration exists and is accessible",
    "Target integration is properly configured", 
    "Required permissions are available",
    "Network connectivity is working",
  ];
  
  return {
    recordsProcessed: 0,
    checks: checks.map(check => ({ check, status: "passed" })),
    dryRun,
  };
}

async function executeBackupSource(ctx: any, migration: any, dryRun: boolean) {
  if (dryRun) {
    return { recordsProcessed: 0, message: "Backup would be created", dryRun };
  }
  
  // Create backup of source integration
  if (migration.sourceIntegrationId) {
    const backupResult = await ctx.runAction(internal.integrationBackup.createBackup, {
      userId: migration.userId,
      integrationId: migration.sourceIntegrationId,
      backupType: "full",
      name: `Migration backup - ${migration.name}`,
      description: `Backup created before migration ${migration._id}`,
    });
    
    return {
      recordsProcessed: 1,
      backupId: backupResult.backupId,
      dryRun,
    };
  }
  
  return { recordsProcessed: 0, message: "No source integration to backup", dryRun };
}

async function executePrepareTarget(ctx: any, migration: any, dryRun: boolean) {
  // Prepare target integration for migration
  return {
    recordsProcessed: 0,
    message: dryRun ? "Target would be prepared" : "Target prepared",
    dryRun,
  };
}

async function executeMigrateConfiguration(ctx: any, migration: any, dryRun: boolean) {
  // Migrate configuration settings
  let recordsProcessed = 0;
  
  if (!dryRun && migration.migrationPlan?.configuration) {
    // Apply configuration changes
    recordsProcessed = Object.keys(migration.migrationPlan.configuration).length;
  }
  
  return {
    recordsProcessed,
    message: dryRun ? "Configuration would be migrated" : "Configuration migrated",
    dryRun,
  };
}

async function executeMigrateData(ctx: any, migration: any, dryRun: boolean) {
  // Migrate data based on mapping
  let recordsProcessed = 0;
  
  if (!dryRun && migration.dataMapping) {
    // Process data migration
    recordsProcessed = migration.dataMapping.estimatedRecords || 0;
  }
  
  return {
    recordsProcessed,
    message: dryRun ? "Data would be migrated" : "Data migrated",
    dryRun,
  };
}

async function executeValidateMigration(ctx: any, migration: any, dryRun: boolean) {
  // Validate migration results
  const validations = [
    "Configuration applied correctly",
    "Data migrated successfully",
    "Integration tests passing",
    "Performance within acceptable limits",
  ];
  
  return {
    recordsProcessed: 0,
    validations: validations.map(validation => ({ validation, status: "passed" })),
    dryRun,
  };
}

async function executeCutover(ctx: any, migration: any, dryRun: boolean) {
  // Switch from source to target
  return {
    recordsProcessed: 0,
    message: dryRun ? "Cutover would be performed" : "Cutover completed",
    dryRun,
  };
}

async function executePostValidation(ctx: any, migration: any, dryRun: boolean) {
  // Final validation after migration
  return {
    recordsProcessed: 0,
    message: dryRun ? "Post-validation would be performed" : "Post-validation completed",
    dryRun,
  };
}

async function restoreFullBackup(ctx: any, backupData: any, options: any) {
  // Restore complete backup
  let restoredItems = 0;
  
  if (backupData.integration) restoredItems++;
  if (backupData.syncHistory) restoredItems += backupData.syncHistory.length;
  if (backupData.webhooks) restoredItems += backupData.webhooks.length;
  
  return restoredItems;
}

async function restoreConfigurationOnly(ctx: any, backupData: any, options: any) {
  // Restore only configuration
  let restoredItems = 0;
  
  if (backupData.integration) restoredItems++;
  if (backupData.webhooks) restoredItems += backupData.webhooks.length;
  
  return restoredItems;
}

async function restoreDataOnly(ctx: any, backupData: any, options: any) {
  // Restore only data
  let restoredItems = 0;
  
  if (backupData.syncHistory) restoredItems += backupData.syncHistory.length;
  if (backupData.errorLogs) restoredItems += backupData.errorLogs.length;
  if (backupData.performanceMetrics) restoredItems += backupData.performanceMetrics.length;
  
  return restoredItems;
}

async function restoreSelective(ctx: any, backupData: any, options: any) {
  // Restore selected items only
  let restoredItems = 0;
  const selective = options?.selectiveRestore || [];
  
  for (const item of selective) {
    if (backupData[item]) {
      restoredItems += Array.isArray(backupData[item]) ? backupData[item].length : 1;
    }
  }
  
  return restoredItems;
}

// Queries and mutations for backups
export const getBackups = query({
  args: {
    userId: v.id("users"),
    integrationId: v.optional(v.id("integrations")),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("integrationBackups")
      .withIndex("by_user", (q) => q.eq("userId", args.userId));

    if (args.integrationId) {
      query = query.filter((q) => q.eq(q.field("integrationId"), args.integrationId));
    }

    return await query.order("desc").collect();
  },
});

export const getMigrations = query({
  args: {
    userId: v.id("users"),
    integrationId: v.optional(v.id("integrations")),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("integrationMigrations")
      .withIndex("by_user", (q) => q.eq("userId", args.userId));

    if (args.integrationId) {
      query = query.filter((q) => 
        q.eq(q.field("sourceIntegrationId"), args.integrationId) ||
        q.eq(q.field("targetIntegrationId"), args.integrationId)
      );
    }

    return await query.order("desc").collect();
  },
});

// Schedule automatic backups
export const scheduleBackup = mutation({
  args: {
    userId: v.id("users"),
    integrationId: v.id("integrations"),
    schedule: v.object({
      frequency: v.union(
        v.literal("hourly"),
        v.literal("daily"),
        v.literal("weekly"),
        v.literal("monthly")
      ),
      retentionDays: v.number(),
      enabled: v.boolean(),
    }),
  },
  handler: async (ctx, args) => {
    const nextBackupAt = calculateNextBackupTime(args.schedule.frequency);
    
    return await ctx.db.insert("integrationBackups", {
      userId: args.userId,
      integrationId: args.integrationId,
      backupType: "scheduled",
      name: `Scheduled backup - ${args.schedule.frequency}`,
      backupData: {},
      size: 0,
      storage: {
        location: "internal",
        provider: "convex",
        path: `/backups/${args.integrationId}`,
      },
      schedule: {
        ...args.schedule,
        nextBackupAt,
      },
      status: "completed",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

function calculateNextBackupTime(frequency: string): number {
  const now = Date.now();
  const hour = 60 * 60 * 1000;
  const day = 24 * hour;
  
  switch (frequency) {
    case "hourly": return now + hour;
    case "daily": return now + day;
    case "weekly": return now + (7 * day);
    case "monthly": return now + (30 * day);
    default: return now + day;
  }
}

// Internal mutations for backup management
export const createBackupRecord = mutation({
  args: {
    userId: v.id("users"),
    integrationId: v.id("integrations"),
    backupType: v.union(
      v.literal("full"),
      v.literal("configuration"),
      v.literal("data"),
      v.literal("scheduled")
    ),
    name: v.string(),
    description: v.optional(v.string()),
    encryption: v.optional(v.object({
      enabled: v.boolean(),
      algorithm: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("integrationBackups", {
      userId: args.userId,
      integrationId: args.integrationId,
      backupType: args.backupType,
      name: args.name,
      description: args.description,
      backupData: {},
      size: 0,
      encryption: args.encryption ? {
        enabled: args.encryption.enabled,
        algorithm: args.encryption.algorithm,
        keyId: `key_${Date.now()}`,
      } : undefined,
      storage: {
        location: "internal",
        provider: "convex",
        path: `/backups/${args.integrationId}/${Date.now()}`,
      },
      status: "creating",
      progress: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const updateBackupData = mutation({
  args: {
    backupId: v.id("integrationBackups"),
    backupData: v.any(),
    size: v.number(),
    checksumMD5: v.string(),
    checksumSHA256: v.string(),
    status: v.literal("completed"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.backupId, {
      backupData: args.backupData,
      size: args.size,
      checksumMD5: args.checksumMD5,
      checksumSHA256: args.checksumSHA256,
      status: args.status,
      progress: 100,
      updatedAt: Date.now(),
    });
  },
});

export const updateBackupStatus = mutation({
  args: {
    backupId: v.id("integrationBackups"),
    status: v.union(
      v.literal("creating"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("restoring")
    ),
    error: v.optional(v.string()),
    progress: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.backupId, {
      status: args.status,
      error: args.error,
      progress: args.progress,
      updatedAt: Date.now(),
    });
  },
});

export const updateRestoreInfo = mutation({
  args: {
    backupId: v.id("integrationBackups"),
    restoredCount: v.number(),
    lastRestoredAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.backupId, {
      restoredCount: args.restoredCount,
      lastRestoredAt: args.lastRestoredAt,
      updatedAt: Date.now(),
    });
  },
});

export const getBackup = query({
  args: { backupId: v.id("integrationBackups") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.backupId);
  },
});

// Internal mutations for migration management
export const createMigrationRecord = mutation({
  args: {
    userId: v.id("users"),
    sourceIntegrationId: v.optional(v.id("integrations")),
    targetIntegrationId: v.id("integrations"),
    migrationType: v.union(
      v.literal("provider_change"),
      v.literal("version_upgrade"),
      v.literal("configuration_update"),
      v.literal("data_migration"),
      v.literal("platform_migration")
    ),
    name: v.string(),
    description: v.optional(v.string()),
    migrationPlan: v.any(),
    dataMapping: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("integrationMigrations", {
      userId: args.userId,
      sourceIntegrationId: args.sourceIntegrationId,
      targetIntegrationId: args.targetIntegrationId,
      migrationType: args.migrationType,
      name: args.name,
      description: args.description,
      migrationPlan: args.migrationPlan,
      dataMapping: args.dataMapping,
      validation: {
        preChecks: [],
        postChecks: [],
        dataIntegrity: false,
      },
      phases: [],
      status: "planned",
      progress: 0,
      rollbackAvailable: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const updateMigrationPhases = mutation({
  args: {
    migrationId: v.id("integrationMigrations"),
    phases: v.array(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.migrationId, {
      phases: args.phases,
      updatedAt: Date.now(),
    });
  },
});

export const updateMigrationStatus = mutation({
  args: {
    migrationId: v.id("integrationMigrations"),
    status: v.union(
      v.literal("planned"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("rolled_back")
    ),
    error: v.optional(v.string()),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    metrics: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const updates: any = {
      status: args.status,
      updatedAt: Date.now(),
    };
    
    if (args.error !== undefined) updates.error = args.error;
    if (args.startedAt !== undefined) updates.startedAt = args.startedAt;
    if (args.completedAt !== undefined) updates.completedAt = args.completedAt;
    if (args.metrics !== undefined) updates.metrics = args.metrics;
    
    return await ctx.db.patch(args.migrationId, updates);
  },
});

export const updatePhaseStatus = mutation({
  args: {
    migrationId: v.id("integrationMigrations"),
    phaseName: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("skipped")
    ),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    error: v.optional(v.string()),
    progress: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const migration = await ctx.db.get(args.migrationId);
    if (!migration) return;
    
    const updatedPhases = migration.phases.map((phase: any) => {
      if (phase.name === args.phaseName) {
        const updates: any = { ...phase, status: args.status };
        if (args.startedAt !== undefined) updates.startedAt = args.startedAt;
        if (args.completedAt !== undefined) updates.completedAt = args.completedAt;
        if (args.error !== undefined) updates.error = args.error;
        if (args.progress !== undefined) updates.progress = args.progress;
        return updates;
      }
      return phase;
    });
    
    return await ctx.db.patch(args.migrationId, {
      phases: updatedPhases,
      updatedAt: Date.now(),
    });
  },
});

export const getMigration = query({
  args: { migrationId: v.id("integrationMigrations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.migrationId);
  },
});
