import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Process scheduled emails every minute
crons.interval(
  "process-scheduled-emails", 
  { minutes: 1 },
  internal.emailService.scheduleQueuedEmails,
  {}
);

// Update timezone profiles for contacts daily
crons.daily(
  "update-timezone-profiles",
  { hourUTC: 1, minuteUTC: 0 }, // 1 AM UTC
  internal.emailScheduler.updateTimezoneProfiles,
  {}
);

// Clean up old email tracking data every day
crons.daily(
  "cleanup-email-data",
  { hourUTC: 2, minuteUTC: 0 }, // 2 AM UTC
  internal.emailService.cleanupOldEmails,
  {}
);

// Process priority email queue every 30 seconds for high-priority emails
crons.interval(
  "process-priority-queue",
  { seconds: 30 },
  internal.emailService.processPriorityQueue,
  {}
);

// Update ISP send rate configurations daily
crons.daily(
  "update-isp-send-rates",
  { hourUTC: 3, minuteUTC: 0 }, // 3 AM UTC
  internal.emailScheduler.updateISPSendRates,
  {}
);

// Run health checks every 5 minutes
crons.interval(
  "health-checks",
  { minutes: 5 },
  internal.monitoring.runAllHealthChecks,
  {}
);

// Process scheduled triggered emails every minute
crons.interval(
  "triggered-emails",
  { minutes: 1 },
  internal.emailTriggers.processScheduledTriggerEmails,
  {}
);

// Process scheduled event campaign actions every minute
crons.interval(
  "event-campaigns",
  { minutes: 1 },
  internal.eventCampaigns.processScheduledActions,
  {}
);

// Clean up expired OAuth states every hour
crons.interval(
  "oauth-cleanup",
  { hours: 1 },
  internal.oauth.cleanupExpiredOAuthStates,
  {}
);

// Clean up old webhook logs daily (keep last 30 days)
crons.daily(
  "webhook-cleanup",
  { hourUTC: 4, minuteUTC: 0 },
  internal.scheduler.cleanupOldWebhookLogs,
  { before: Date.now() - (30 * 24 * 60 * 60 * 1000) }
);

// Run comprehensive scheduled tasks every 10 minutes
crons.interval(
  "scheduled-tasks",
  { minutes: 10 },
  internal.scheduler.runScheduledTasks,
  {}
);

// Error handling and retries - every 5 minutes
crons.interval(
  "process-error-retries",
  { minutes: 5 },
  internal.errorHandling.processPendingRetries,
  {}
);

// Performance metrics cleanup - daily at 4 AM
crons.daily(
  "cleanup-old-metrics",
  { hourUTC: 4, minuteUTC: 0 },
  internal.performanceOptimization.cleanupOldMetrics,
  { olderThanDays: 7 }
);

// Error logs cleanup - weekly on Sunday at 5 AM
crons.weekly(
  "cleanup-old-errors",
  { dayOfWeek: "sunday", hourUTC: 5, minuteUTC: 0 },
  internal.errorHandling.cleanupOldErrors,
  { olderThanDays: 30 }
);

// Auto-tune integrations - daily at 6 AM
crons.daily(
  "auto-tune-integrations",
  { hourUTC: 6, minuteUTC: 0 },
  internal.scheduler.autoTuneIntegrations,
  {}
);

// Integration testing - every 4 hours
crons.interval(
  "run-integration-tests",
  { hours: 4 },
  internal.integrationTesting.runScheduledTests,
  {}
);

// Integration polling - check for due syncs every 5 minutes
crons.interval(
  "integration-polling",
  { minutes: 5 },
  internal.integrationPolling.processPollingQueue,
  {}
);

export default crons;
