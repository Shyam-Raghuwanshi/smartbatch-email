/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as abTesting from "../abTesting.js";
import type * as analytics from "../analytics.js";
import type * as analyticsData from "../analyticsData.js";
import type * as apiCrons from "../apiCrons.js";
import type * as apiIntegrations from "../apiIntegrations.js";
import type * as apiKeys from "../apiKeys.js";
import type * as auditLogging from "../auditLogging.js";
import type * as campaignMonitoring from "../campaignMonitoring.js";
import type * as campaignTasks from "../campaignTasks.js";
import type * as campaigns from "../campaigns.js";
import type * as contact_segments from "../contact_segments.js";
import type * as contacts from "../contacts.js";
import type * as contacts_enhanced from "../contacts_enhanced.js";
import type * as contentAnalysis from "../contentAnalysis.js";
import type * as contentLibrary from "../contentLibrary.js";
import type * as crons from "../crons.js";
import type * as dataEncryption from "../dataEncryption.js";
import type * as dataRetention from "../dataRetention.js";
import type * as dataRetentionCrons from "../dataRetentionCrons.js";
import type * as debugEmailSettings from "../debugEmailSettings.js";
import type * as emailCompliance from "../emailCompliance.js";
import type * as emailDashboard from "../emailDashboard.js";
import type * as emailScheduler from "../emailScheduler.js";
import type * as emailService from "../emailService.js";
import type * as emailSettings from "../emailSettings.js";
import type * as emailTriggers from "../emailTriggers.js";
import type * as emails from "../emails.js";
import type * as errorHandling from "../errorHandling.js";
import type * as eventCampaigns from "../eventCampaigns.js";
import type * as gdprCompliance from "../gdprCompliance.js";
import type * as googleSheetsIntegration from "../googleSheetsIntegration.js";
import type * as http from "../http.js";
import type * as hubspotIntegration from "../hubspotIntegration.js";
import type * as integrationBackup from "../integrationBackup.js";
import type * as integrationDocumentation from "../integrationDocumentation.js";
import type * as integrationPolling from "../integrationPolling.js";
import type * as integrationTesting from "../integrationTesting.js";
import type * as integrationVersioning from "../integrationVersioning.js";
import type * as integrations from "../integrations.js";
import type * as lib from "../lib.js";
import type * as migrations_add_updated_at_to_contacts from "../migrations/add_updated_at_to_contacts.js";
import type * as migrations from "../migrations.js";
import type * as monitoring from "../monitoring.js";
import type * as oauth from "../oauth.js";
import type * as oauthActions from "../oauthActions.js";
import type * as optimizedQueries from "../optimizedQueries.js";
import type * as performanceOptimization from "../performanceOptimization.js";
import type * as perplexityAI from "../perplexityAI.js";
import type * as personalizationEngine from "../personalizationEngine.js";
import type * as rateLimiter from "../rateLimiter.js";
import type * as rbacSystem from "../rbacSystem.js";
import type * as salesforceIntegration from "../salesforceIntegration.js";
import type * as scheduler from "../scheduler.js";
import type * as securityMonitoring from "../securityMonitoring.js";
import type * as securityScanning from "../securityScanning.js";
import type * as seed from "../seed.js";
import type * as templateIntelligence from "../templateIntelligence.js";
import type * as templateProcessor from "../templateProcessor.js";
import type * as templates from "../templates.js";
import type * as test from "../test.js";
import type * as testFix from "../testFix.js";
import type * as testSchedule from "../testSchedule.js";
import type * as userEmailUsage from "../userEmailUsage.js";
import type * as users from "../users.js";
import type * as webhookSecurity from "../webhookSecurity.js";
import type * as webhooks from "../webhooks.js";
import type * as workflows from "../workflows.js";
import type * as zapierIntegration from "../zapierIntegration.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  abTesting: typeof abTesting;
  analytics: typeof analytics;
  analyticsData: typeof analyticsData;
  apiCrons: typeof apiCrons;
  apiIntegrations: typeof apiIntegrations;
  apiKeys: typeof apiKeys;
  auditLogging: typeof auditLogging;
  campaignMonitoring: typeof campaignMonitoring;
  campaignTasks: typeof campaignTasks;
  campaigns: typeof campaigns;
  contact_segments: typeof contact_segments;
  contacts: typeof contacts;
  contacts_enhanced: typeof contacts_enhanced;
  contentAnalysis: typeof contentAnalysis;
  contentLibrary: typeof contentLibrary;
  crons: typeof crons;
  dataEncryption: typeof dataEncryption;
  dataRetention: typeof dataRetention;
  dataRetentionCrons: typeof dataRetentionCrons;
  debugEmailSettings: typeof debugEmailSettings;
  emailCompliance: typeof emailCompliance;
  emailDashboard: typeof emailDashboard;
  emailScheduler: typeof emailScheduler;
  emailService: typeof emailService;
  emailSettings: typeof emailSettings;
  emailTriggers: typeof emailTriggers;
  emails: typeof emails;
  errorHandling: typeof errorHandling;
  eventCampaigns: typeof eventCampaigns;
  gdprCompliance: typeof gdprCompliance;
  googleSheetsIntegration: typeof googleSheetsIntegration;
  http: typeof http;
  hubspotIntegration: typeof hubspotIntegration;
  integrationBackup: typeof integrationBackup;
  integrationDocumentation: typeof integrationDocumentation;
  integrationPolling: typeof integrationPolling;
  integrationTesting: typeof integrationTesting;
  integrationVersioning: typeof integrationVersioning;
  integrations: typeof integrations;
  lib: typeof lib;
  "migrations/add_updated_at_to_contacts": typeof migrations_add_updated_at_to_contacts;
  migrations: typeof migrations;
  monitoring: typeof monitoring;
  oauth: typeof oauth;
  oauthActions: typeof oauthActions;
  optimizedQueries: typeof optimizedQueries;
  performanceOptimization: typeof performanceOptimization;
  perplexityAI: typeof perplexityAI;
  personalizationEngine: typeof personalizationEngine;
  rateLimiter: typeof rateLimiter;
  rbacSystem: typeof rbacSystem;
  salesforceIntegration: typeof salesforceIntegration;
  scheduler: typeof scheduler;
  securityMonitoring: typeof securityMonitoring;
  securityScanning: typeof securityScanning;
  seed: typeof seed;
  templateIntelligence: typeof templateIntelligence;
  templateProcessor: typeof templateProcessor;
  templates: typeof templates;
  test: typeof test;
  testFix: typeof testFix;
  testSchedule: typeof testSchedule;
  userEmailUsage: typeof userEmailUsage;
  users: typeof users;
  webhookSecurity: typeof webhookSecurity;
  webhooks: typeof webhooks;
  workflows: typeof workflows;
  zapierIntegration: typeof zapierIntegration;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {
  resend: {
    lib: {
      cancelEmail: FunctionReference<
        "mutation",
        "internal",
        { emailId: string },
        null
      >;
      get: FunctionReference<"query", "internal", { emailId: string }, any>;
      getStatus: FunctionReference<
        "query",
        "internal",
        { emailId: string },
        {
          complained: boolean;
          errorMessage: string | null;
          opened: boolean;
          status:
            | "waiting"
            | "queued"
            | "cancelled"
            | "sent"
            | "delivered"
            | "delivery_delayed"
            | "bounced";
        }
      >;
      handleEmailEvent: FunctionReference<
        "mutation",
        "internal",
        { event: any },
        null
      >;
      sendEmail: FunctionReference<
        "mutation",
        "internal",
        {
          from: string;
          headers?: Array<{ name: string; value: string }>;
          html?: string;
          options: {
            apiKey: string;
            initialBackoffMs: number;
            onEmailEvent?: { fnHandle: string };
            retryAttempts: number;
            testMode: boolean;
          };
          replyTo?: Array<string>;
          subject: string;
          text?: string;
          to: string;
        },
        string
      >;
    };
  };
};
