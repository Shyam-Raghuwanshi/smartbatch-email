import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

/**
 * Automated Data Retention and Cleanup Jobs
 * Implements GDPR-compliant data retention policies
 */

const crons = cronJobs();

// Daily cleanup at 2 AM UTC
crons.daily(
  "data-retention-cleanup",
  {
    hourUTC: 2,
    minuteUTC: 0,
  },
  internal.dataRetention.performDailyCleanup
);

// Weekly comprehensive cleanup on Sundays at 3 AM UTC
crons.weekly(
  "comprehensive-data-cleanup",
  {
    dayOfWeek: "sunday",
    hourUTC: 3,
    minuteUTC: 0,
  },
  internal.dataRetention.performWeeklyCleanup
);

// Monthly data archival on the 1st at 4 AM UTC
crons.monthly(
  "monthly-data-archival",
  {
    day: 1,
    hourUTC: 4,
    minuteUTC: 0,
  },
  internal.dataRetention.performMonthlyArchival
);

// Quarterly compliance audit on the 1st of Jan, Apr, Jul, Oct at 5 AM UTC
crons.cron(
  "quarterly-compliance-audit",
  "0 5 1 */3 *", // At 05:00 on day-of-month 1 in every 3rd month
  internal.dataRetention.performQuarterlyAudit
);

// Daily encryption key rotation check at 1 AM UTC
crons.daily(
  "encryption-key-rotation",
  {
    hourUTC: 1,
    minuteUTC: 0,
  },
  internal.dataEncryption.checkKeyRotation
);

// Hourly rate limit cleanup
crons.hourly(
  "rate-limit-cleanup",
  {
    minuteUTC: 30,
  },
  internal.rateLimiter.cleanupExpiredLimits
);

// Daily security scan at 6 AM UTC
crons.daily(
  "security-scan",
  {
    hourUTC: 6,
    minuteUTC: 0,
  },
  internal.securityScanning.performDailyScan
);

// Weekly GDPR compliance check on Mondays at 7 AM UTC
crons.weekly(
  "gdpr-compliance-check",
  {
    dayOfWeek: "monday",
    hourUTC: 7,
    minuteUTC: 0,
  },
  internal.gdprCompliance.performWeeklyComplianceCheck
);

// Daily email compliance metrics update at 8 AM UTC
crons.daily(
  "email-compliance-metrics",
  {
    hourUTC: 8,
    minuteUTC: 0,
  },
  internal.emailCompliance.updateDailyMetrics
);

// Weekly team access audit on Fridays at 9 AM UTC
crons.weekly(
  "team-access-audit",
  {
    dayOfWeek: "friday",
    hourUTC: 9,
    minuteUTC: 0,
  },
  internal.rbacSystem.performWeeklyAccessAudit
);

export default crons;
