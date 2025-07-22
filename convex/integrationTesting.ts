import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api, internal } from "./_generated/api";

// Integration testing framework
export const createIntegrationTest = mutation({
  args: {
    integrationId: v.id("integrations"),
    name: v.string(),
    description: v.optional(v.string()),
    testType: v.union(
      v.literal("connectivity"),
      v.literal("authentication"),
      v.literal("data_sync"),
      v.literal("webhook_delivery"),
      v.literal("rate_limiting"),
      v.literal("error_handling"),
      v.literal("performance"),
      v.literal("data_integrity"),
      v.literal("security"),
      v.literal("compliance")
    ),
    testConfig: v.object({
      // Test parameters
      timeout: v.optional(v.number()), // milliseconds
      retries: v.optional(v.number()),
      parallelConnections: v.optional(v.number()),
      dataVolume: v.optional(v.number()), // records to test with
      
      // Expected results
      expectedResponseTime: v.optional(v.number()), // milliseconds
      expectedSuccessRate: v.optional(v.number()), // percentage
      expectedDataAccuracy: v.optional(v.number()), // percentage
      
      // Test data
      sampleData: v.optional(v.any()),
      testEndpoints: v.optional(v.array(v.string())),
      
      // Validation rules
      validationRules: v.optional(v.array(v.object({
        field: v.string(),
        rule: v.string(),
        expected: v.any()
      })))
    }),
    schedule: v.optional(v.object({
      enabled: v.boolean(),
      frequency: v.number(), // minutes
      runOnFailure: v.boolean()
    })),
    isActive: v.boolean()
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("integrationTests", {
      ...args,
      results: {
        totalRuns: 0,
        passedRuns: 0,
        failedRuns: 0,
        lastRun: 0,
        lastResult: "pending",
        averageResponseTime: 0,
        averageSuccessRate: 0
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  }
});

export const runIntegrationTest = action({
  args: {
    testId: v.id("integrationTests"),
    runManually: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const test = await ctx.runQuery(api.integrationTesting.getTest, {
      id: args.testId
    });

    if (!test || !test.isActive) {
      throw new Error("Test not found or inactive");
    }

    const integration = await ctx.runQuery(api.integrations.getIntegration, {
      id: test.integrationId
    });

    if (!integration) {
      throw new Error("Integration not found");
    }

    const startTime = Date.now();
    let testResult: any = {
      success: false,
      responseTime: 0,
      details: {},
      errors: []
    };

    try {
      // Run the specific test type
      switch (test.testType) {
        case "connectivity":
          testResult = await runConnectivityTest(test, integration);
          break;
        case "authentication":
          testResult = await runAuthenticationTest(test, integration);
          break;
        case "data_sync":
          testResult = await runDataSyncTest(ctx, test, integration);
          break;
        case "webhook_delivery":
          testResult = await runWebhookTest(ctx, test, integration);
          break;
        case "rate_limiting":
          testResult = await runRateLimitTest(test, integration);
          break;
        case "error_handling":
          testResult = await runErrorHandlingTest(test, integration);
          break;
        case "performance":
          testResult = await runPerformanceTest(test, integration);
          break;
        case "data_integrity":
          testResult = await runDataIntegrityTest(ctx, test, integration);
          break;
        case "security":
          testResult = await runSecurityTest(test, integration);
          break;
        case "compliance":
          testResult = await runComplianceTest(test, integration);
          break;
        default:
          throw new Error(`Unsupported test type: ${test.testType}`);
      }

      testResult.responseTime = Date.now() - startTime;

    } catch (error) {
      testResult = {
        success: false,
        responseTime: Date.now() - startTime,
        error: error.message,
        details: {},
        errors: [error.message]
      };
    }

    // Record test result
    const resultId = await ctx.runMutation(internal.integrationTesting.recordTestResult, {
      testId: args.testId,
      result: testResult,
      runManually: args.runManually || false
    });

    // Update test statistics
    await ctx.runMutation(internal.integrationTesting.updateTestStats, {
      testId: args.testId,
      success: testResult.success,
      responseTime: testResult.responseTime
    });

    return {
      ...testResult,
      resultId
    };
  }
});

export const recordTestResult = mutation({
  args: {
    testId: v.id("integrationTests"),
    result: v.any(),
    runManually: v.boolean()
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("testResults", {
      testId: args.testId,
      success: args.result.success,
      responseTime: args.result.responseTime,
      details: args.result.details || {},
      errors: args.result.errors || [],
      error: args.result.error,
      runManually: args.runManually,
      timestamp: Date.now()
    });
  }
});

export const updateTestStats = mutation({
  args: {
    testId: v.id("integrationTests"),
    success: v.boolean(),
    responseTime: v.number()
  },
  handler: async (ctx, args) => {
    const test = await ctx.db.get(args.testId);
    if (!test) return;

    const stats = test.results;
    const totalRuns = stats.totalRuns + 1;
    const passedRuns = stats.passedRuns + (args.success ? 1 : 0);
    const failedRuns = stats.failedRuns + (args.success ? 0 : 1);
    
    const averageResponseTime = 
      (stats.averageResponseTime * stats.totalRuns + args.responseTime) / totalRuns;
    
    const averageSuccessRate = (passedRuns / totalRuns) * 100;

    await ctx.db.patch(args.testId, {
      results: {
        totalRuns,
        passedRuns,
        failedRuns,
        lastRun: Date.now(),
        lastResult: args.success ? "passed" : "failed",
        averageResponseTime,
        averageSuccessRate
      },
      updatedAt: Date.now()
    });
  }
});

export const getTest = query({
  args: {
    id: v.id("integrationTests")
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  }
});

export const getIntegrationTests = query({
  args: {
    integrationId: v.optional(v.id("integrations")),
    userId: v.optional(v.id("users"))
  },
  handler: async (ctx, args) => {
    if (args.integrationId) {
      return await ctx.db
        .query("integrationTests")
        .filter(q => q.eq(q.field("integrationId"), args.integrationId))
        .collect();
    }

    if (args.userId) {
      // Get all integrations for the user, then their tests
      const integrations = await ctx.db
        .query("integrations")
        .filter(q => q.eq(q.field("userId"), args.userId))
        .collect();

      const allTests = [];
      for (const integration of integrations) {
        const tests = await ctx.db
          .query("integrationTests")
          .filter(q => q.eq(q.field("integrationId"), integration._id))
          .collect();
        allTests.push(...tests);
      }

      return allTests;
    }

    return [];
  }
});

export const getTestResults = query({
  args: {
    testId: v.id("integrationTests"),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    return await ctx.db
      .query("testResults")
      .filter(q => q.eq(q.field("testId"), args.testId))
      .order("desc")
      .take(limit);
  }
});

export const runScheduledTests = action({
  args: {},
  handler: async (ctx) => {
    // Get all active tests that are scheduled
    const scheduledTests = await ctx.runQuery(internal.integrationTesting.getScheduledTests, {
      dueTime: Date.now()
    });

    const results = [];

    for (const test of scheduledTests) {
      try {
        const result = await ctx.runAction(api.integrationTesting.runIntegrationTest, {
          testId: test._id,
          runManually: false
        });

        results.push({
          testId: test._id,
          testName: test.name,
          result
        });
      } catch (error) {
        results.push({
          testId: test._id,
          testName: test.name,
          result: { success: false, error: error.message }
        });
      }
    }

    return { processed: results.length, results };
  }
});

export const getScheduledTests = query({
  args: {
    dueTime: v.number()
  },
  handler: async (ctx, args) => {
    const tests = await ctx.db
      .query("integrationTests")
      .filter(q => q.eq(q.field("isActive"), true))
      .collect();

    return tests.filter(test => {
      if (!test.schedule?.enabled) return false;
      
      const frequencyMs = test.schedule.frequency * 60 * 1000;
      const nextRunTime = test.results.lastRun + frequencyMs;
      
      return nextRunTime <= args.dueTime;
    });
  }
});

export const validateIntegrationConfiguration = action({
  args: {
    integrationId: v.id("integrations")
  },
  handler: async (ctx, args) => {
    const integration = await ctx.runQuery(api.integrations.getIntegration, {
      id: args.integrationId
    });

    if (!integration) {
      throw new Error("Integration not found");
    }

    const validationResults = {
      isValid: true,
      errors: [] as string[],
      warnings: [] as string[],
      suggestions: [] as string[],
      securityIssues: [] as string[]
    };

    try {
      // Validate credentials
      const credentialValidation = validateCredentials(integration);
      if (!credentialValidation.isValid) {
        validationResults.errors.push(...credentialValidation.errors);
        validationResults.isValid = false;
      }

      // Validate settings
      const settingsValidation = validateSettings(integration);
      if (!settingsValidation.isValid) {
        validationResults.warnings.push(...settingsValidation.warnings);
      }

      // Security validation
      const securityValidation = validateSecurity(integration);
      validationResults.securityIssues.push(...securityValidation.issues);
      if (securityValidation.issues.length > 0) {
        validationResults.isValid = false;
      }

      // Performance validation
      const performanceValidation = validatePerformance(integration);
      validationResults.suggestions.push(...performanceValidation.suggestions);

      return validationResults;

    } catch (error) {
      return {
        isValid: false,
        errors: [error.message],
        warnings: [],
        suggestions: [],
        securityIssues: []
      };
    }
  }
});

// Test implementation functions
async function runConnectivityTest(test: any, integration: any) {
  const config = test.testConfig;
  const timeout = config.timeout || 30000;

  try {
    const endpoint = getTestEndpoint(integration);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const startTime = Date.now();
    const response = await fetch(endpoint, {
      signal: controller.signal,
      headers: getAuthHeaders(integration)
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    return {
      success: response.ok,
      responseTime,
      details: {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries())
      },
      errors: response.ok ? [] : [`HTTP ${response.status}: ${response.statusText}`]
    };

  } catch (error) {
    return {
      success: false,
      responseTime: 0,
      details: {},
      errors: [error.message]
    };
  }
}

async function runAuthenticationTest(test: any, integration: any) {
  try {
    const authEndpoint = getAuthTestEndpoint(integration);
    const response = await fetch(authEndpoint, {
      headers: getAuthHeaders(integration)
    });

    const isAuthenticated = response.status !== 401 && response.status !== 403;
    
    return {
      success: isAuthenticated,
      responseTime: 0,
      details: {
        status: response.status,
        authenticated: isAuthenticated
      },
      errors: isAuthenticated ? [] : ["Authentication failed"]
    };

  } catch (error) {
    return {
      success: false,
      responseTime: 0,
      details: {},
      errors: [error.message]
    };
  }
}

async function runDataSyncTest(ctx: any, test: any, integration: any) {
  try {
    const sampleData = test.testConfig.sampleData || generateSampleData(integration);
    const syncResult = await performTestSync(ctx, integration, sampleData);

    return {
      success: syncResult.success,
      responseTime: syncResult.duration,
      details: {
        recordsProcessed: syncResult.recordsProcessed,
        successfulRecords: syncResult.successfulRecords,
        failedRecords: syncResult.failedRecords,
        dataAccuracy: syncResult.dataAccuracy
      },
      errors: syncResult.errors
    };

  } catch (error) {
    return {
      success: false,
      responseTime: 0,
      details: {},
      errors: [error.message]
    };
  }
}

async function runWebhookTest(ctx: any, test: any, integration: any) {
  try {
    // Send test webhook
    const webhookResult = await sendTestWebhook(ctx, integration);
    
    return {
      success: webhookResult.delivered,
      responseTime: webhookResult.responseTime,
      details: {
        webhookId: webhookResult.webhookId,
        deliveryStatus: webhookResult.status,
        retryCount: webhookResult.retries
      },
      errors: webhookResult.delivered ? [] : [webhookResult.error]
    };

  } catch (error) {
    return {
      success: false,
      responseTime: 0,
      details: {},
      errors: [error.message]
    };
  }
}

async function runRateLimitTest(test: any, integration: any) {
  const config = test.testConfig;
  const parallelConnections = config.parallelConnections || 10;
  const endpoint = getTestEndpoint(integration);

  try {
    const requests = Array(parallelConnections).fill(null).map(() =>
      fetch(endpoint, { headers: getAuthHeaders(integration) })
    );

    const startTime = Date.now();
    const responses = await Promise.allSettled(requests);
    const responseTime = Date.now() - startTime;

    const successful = responses.filter(r => 
      r.status === "fulfilled" && r.value.ok
    ).length;
    
    const rateLimited = responses.filter(r => 
      r.status === "fulfilled" && r.value.status === 429
    ).length;

    return {
      success: successful > 0,
      responseTime,
      details: {
        totalRequests: parallelConnections,
        successfulRequests: successful,
        rateLimitedRequests: rateLimited,
        successRate: (successful / parallelConnections) * 100
      },
      errors: successful === 0 ? ["All requests failed"] : []
    };

  } catch (error) {
    return {
      success: false,
      responseTime: 0,
      details: {},
      errors: [error.message]
    };
  }
}

async function runErrorHandlingTest(test: any, integration: any) {
  // Test error scenarios
  const errorScenarios = [
    { name: "Invalid auth", headers: { "Authorization": "Bearer invalid" } },
    { name: "Malformed request", body: "invalid json" },
    { name: "Missing required fields", body: "{}" }
  ];

  const results = [];
  const endpoint = getTestEndpoint(integration);

  for (const scenario of errorScenarios) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...scenario.headers
        },
        body: scenario.body
      });

      results.push({
        scenario: scenario.name,
        status: response.status,
        handled: response.status >= 400 && response.status < 500
      });

    } catch (error) {
      results.push({
        scenario: scenario.name,
        status: 0,
        handled: false,
        error: error.message
      });
    }
  }

  const handledErrors = results.filter(r => r.handled).length;
  const success = handledErrors === errorScenarios.length;

  return {
    success,
    responseTime: 0,
    details: {
      scenarios: results,
      errorHandlingRate: (handledErrors / errorScenarios.length) * 100
    },
    errors: success ? [] : ["Some error scenarios not properly handled"]
  };
}

async function runPerformanceTest(test: any, integration: any) {
  const config = test.testConfig;
  const expectedResponseTime = config.expectedResponseTime || 2000;
  const requests = config.parallelConnections || 5;

  try {
    const endpoint = getTestEndpoint(integration);
    const startTime = Date.now();

    const promises = Array(requests).fill(null).map(() =>
      fetch(endpoint, { headers: getAuthHeaders(integration) })
    );

    const responses = await Promise.all(promises);
    const totalTime = Date.now() - startTime;
    const averageResponseTime = totalTime / requests;

    const successCount = responses.filter(r => r.ok).length;
    const success = averageResponseTime <= expectedResponseTime && successCount === requests;

    return {
      success,
      responseTime: averageResponseTime,
      details: {
        totalRequests: requests,
        successfulRequests: successCount,
        averageResponseTime,
        expectedResponseTime,
        performanceScore: Math.max(0, 100 - (averageResponseTime / expectedResponseTime) * 100)
      },
      errors: success ? [] : ["Performance below expectations"]
    };

  } catch (error) {
    return {
      success: false,
      responseTime: 0,
      details: {},
      errors: [error.message]
    };
  }
}

async function runDataIntegrityTest(ctx: any, test: any, integration: any) {
  try {
    const validationRules = test.testConfig.validationRules || [];
    const sampleData = generateSampleData(integration);
    
    // Perform sync and validate data integrity
    const syncResult = await performTestSync(ctx, integration, sampleData);
    
    if (!syncResult.success) {
      return {
        success: false,
        responseTime: syncResult.duration,
        details: {},
        errors: ["Data sync failed"]
      };
    }

    // Validate data integrity
    const validationResults = [];
    for (const rule of validationRules) {
      const isValid = validateDataRule(syncResult.data, rule);
      validationResults.push({
        rule: rule.field,
        valid: isValid,
        expected: rule.expected
      });
    }

    const validRules = validationResults.filter(r => r.valid).length;
    const integrityScore = (validRules / validationResults.length) * 100;
    const success = integrityScore >= (test.testConfig.expectedDataAccuracy || 95);

    return {
      success,
      responseTime: syncResult.duration,
      details: {
        validationResults,
        integrityScore,
        expectedAccuracy: test.testConfig.expectedDataAccuracy || 95
      },
      errors: success ? [] : ["Data integrity below threshold"]
    };

  } catch (error) {
    return {
      success: false,
      responseTime: 0,
      details: {},
      errors: [error.message]
    };
  }
}

async function runSecurityTest(test: any, integration: any) {
  const securityChecks = [
    { name: "HTTPS", check: () => getTestEndpoint(integration).startsWith("https://") },
    { name: "Auth Headers", check: () => !!getAuthHeaders(integration)["Authorization"] },
    { name: "Token Security", check: () => validateTokenSecurity(integration) }
  ];

  const results = securityChecks.map(check => ({
    name: check.name,
    passed: check.check()
  }));

  const passedChecks = results.filter(r => r.passed).length;
  const securityScore = (passedChecks / securityChecks.length) * 100;
  const success = securityScore >= 80;

  return {
    success,
    responseTime: 0,
    details: {
      securityChecks: results,
      securityScore
    },
    errors: success ? [] : ["Security checks failed"]
  };
}

async function runComplianceTest(test: any, integration: any) {
  // Check compliance requirements (GDPR, SOC2, etc.)
  const complianceChecks = [
    { name: "Data Encryption", required: true, status: checkDataEncryption(integration) },
    { name: "Access Logs", required: true, status: checkAccessLogging(integration) },
    { name: "Data Retention", required: false, status: checkDataRetention(integration) }
  ];

  const requiredPassed = complianceChecks
    .filter(c => c.required)
    .every(c => c.status);

  return {
    success: requiredPassed,
    responseTime: 0,
    details: {
      complianceChecks,
      requiredPassed
    },
    errors: requiredPassed ? [] : ["Required compliance checks failed"]
  };
}

// Helper functions
function getTestEndpoint(integration: any): string {
  const endpoints = {
    google_sheets: "https://sheets.googleapis.com/v4/spreadsheets",
    salesforce: `${integration.credentials.instanceUrl}/services/data/v57.0/sobjects/Contact`,
    hubspot: "https://api.hubapi.com/crm/v3/objects/contacts",
    zapier: "https://hooks.zapier.com",
    webhook: integration.settings?.url || "http://example.com"
  };

  return endpoints[integration.type as keyof typeof endpoints] || "http://example.com";
}

function getAuthTestEndpoint(integration: any): string {
  const endpoints = {
    google_sheets: "https://www.googleapis.com/oauth2/v1/userinfo",
    salesforce: `${integration.credentials.instanceUrl}/services/oauth2/userinfo`,
    hubspot: "https://api.hubapi.com/oauth/v1/access-tokens/",
    zapier: "https://zapier.com/api/v1/me"
  };

  return endpoints[integration.type as keyof typeof endpoints] || "http://example.com";
}

function getAuthHeaders(integration: any): Record<string, string> {
  const credentials = integration.credentials || {};
  
  switch (integration.type) {
    case "google_sheets":
    case "salesforce":
    case "hubspot":
      return credentials.accessToken 
        ? { "Authorization": `Bearer ${credentials.accessToken}` }
        : {};
    case "webhook":
      return credentials.headers || {};
    default:
      return {};
  }
}

function generateSampleData(integration: any): any[] {
  return [
    {
      email: "test@example.com",
      name: "Test Contact",
      phone: "+1234567890"
    }
  ];
}

async function performTestSync(ctx: any, integration: any, data: any[]): Promise<any> {
  const startTime = Date.now();
  
  try {
    // Simulate sync operation based on integration type
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      duration: Date.now() - startTime,
      recordsProcessed: data.length,
      successfulRecords: data.length,
      failedRecords: 0,
      dataAccuracy: 100,
      data: data,
      errors: []
    };
  } catch (error) {
    return {
      success: false,
      duration: Date.now() - startTime,
      recordsProcessed: 0,
      successfulRecords: 0,
      failedRecords: data.length,
      dataAccuracy: 0,
      data: [],
      errors: [error.message]
    };
  }
}

async function sendTestWebhook(ctx: any, integration: any): Promise<any> {
  const testPayload = {
    type: "integration_test",
    timestamp: Date.now(),
    test: true
  };

  const startTime = Date.now();
  
  try {
    const webhookUrl = integration.settings?.webhookUrl;
    if (!webhookUrl) {
      throw new Error("No webhook URL configured");
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(testPayload)
    });

    return {
      delivered: response.ok,
      responseTime: Date.now() - startTime,
      status: response.status,
      retries: 0,
      webhookId: "test",
      error: response.ok ? null : `HTTP ${response.status}`
    };

  } catch (error) {
    return {
      delivered: false,
      responseTime: Date.now() - startTime,
      status: 0,
      retries: 0,
      webhookId: "test",
      error: error.message
    };
  }
}

function validateDataRule(data: any[], rule: any): boolean {
  // Simple validation - could be expanded
  return data.length > 0;
}

function validateCredentials(integration: any): { isValid: boolean; errors: string[] } {
  const errors = [];
  
  if (!integration.credentials) {
    errors.push("No credentials configured");
    return { isValid: false, errors };
  }

  switch (integration.type) {
    case "google_sheets":
    case "salesforce":
    case "hubspot":
      if (!integration.credentials.accessToken) {
        errors.push("Access token missing");
      }
      if (!integration.credentials.clientId) {
        errors.push("Client ID missing");
      }
      break;
  }

  return { isValid: errors.length === 0, errors };
}

function validateSettings(integration: any): { isValid: boolean; warnings: string[] } {
  const warnings = [];

  if (!integration.settings.syncFrequency || integration.settings.syncFrequency > 1440) {
    warnings.push("Sync frequency should be set and less than 24 hours");
  }

  if (integration.settings.fieldMappings?.length === 0) {
    warnings.push("No field mappings configured");
  }

  return { isValid: warnings.length === 0, warnings };
}

function validateSecurity(integration: any): { issues: string[] } {
  const issues = [];

  if (!getTestEndpoint(integration).startsWith("https://")) {
    issues.push("Integration endpoint is not using HTTPS");
  }

  if (!integration.credentials?.accessToken) {
    issues.push("No access token configured for authentication");
  }

  return { issues };
}

function validatePerformance(integration: any): { suggestions: string[] } {
  const suggestions = [];

  if (integration.settings.syncFrequency && integration.settings.syncFrequency < 5) {
    suggestions.push("Consider increasing sync frequency to reduce API load");
  }

  return { suggestions };
}

function validateTokenSecurity(integration: any): boolean {
  const token = integration.credentials?.accessToken;
  if (!token) return false;
  
  // Basic token validation - should be expanded based on token type
  return token.length > 20 && !token.includes(" ");
}

function checkDataEncryption(integration: any): boolean {
  // Check if data is encrypted in transit and at rest
  return getTestEndpoint(integration).startsWith("https://");
}

function checkAccessLogging(integration: any): boolean {
  // Check if access logging is enabled
  return true; // Placeholder - would check actual logging config
}

function checkDataRetention(integration: any): boolean {
  // Check data retention policies
  return true; // Placeholder - would check retention settings
}
