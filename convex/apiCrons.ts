import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run every 10 minutes to check for integrations that need polling
crons.interval(
  "poll-api-integrations",
  { minutes: 10 },
  internal.apiIntegrations.pollApiIntegrations
);

// Clean up old polling logs every day at 2 AM
crons.daily(
  "cleanup-integration-logs",
  { hourUTC: 2, minuteUTC: 0 },
  internal.apiIntegrations.cleanupPollingLogs
);

export default crons;
