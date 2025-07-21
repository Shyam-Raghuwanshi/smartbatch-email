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

export default crons;
