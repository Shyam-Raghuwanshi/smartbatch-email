import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

// Documentation types and structures
const documentationTypes = [
  "api_reference",
  "setup_guide", 
  "troubleshooting",
  "best_practices",
  "migration_guide",
  "webhook_setup",
  "authentication",
  "rate_limits",
  "error_codes",
  "code_examples"
] as const;

const documentationFormats = [
  "markdown",
  "html", 
  "pdf",
  "interactive",
  "video_tutorial"
] as const;

// Generate comprehensive documentation for an integration
export const generateIntegrationDocumentation = action({
  args: {
    userId: v.id("users"),
    integrationId: v.id("integrations"),
    types: v.array(v.union(...documentationTypes.map(t => v.literal(t)))),
    format: v.union(...documentationFormats.map(f => v.literal(f))),
    includeExamples: v.boolean(),
    includeInteractiveGuides: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Get integration details
    const integration = await ctx.runQuery(internal.integrations.getIntegration, {
      integrationId: args.integrationId
    });

    if (!integration) {
      throw new Error("Integration not found");
    }

    const documentation = {
      integrationId: args.integrationId,
      title: `${integration.name} Integration Guide`,
      version: integration.version || "1.0.0",
      generatedAt: Date.now(),
      sections: [] as any[],
    };

    // Generate each requested documentation type
    for (const type of args.types) {
      const section = await generateDocumentationSection(ctx, {
        integration,
        type,
        includeExamples: args.includeExamples,
      });
      documentation.sections.push(section);
    }

    // Generate interactive guides if requested
    if (args.includeInteractiveGuides) {
      const interactiveGuides = await generateInteractiveGuides(ctx, {
        integration,
        format: args.format,
      });
      documentation.sections.push({
        type: "interactive_guides",
        title: "Interactive Setup Guides",
        content: interactiveGuides,
      });
    }

    // Store documentation
    const docId = await ctx.runMutation(internal.integrationDocumentation.createDocumentation, {
      userId: args.userId,
      integrationId: args.integrationId,
      title: documentation.title,
      content: documentation,
      format: args.format,
      version: integration.version || "1.0.0",
    });

    return { documentationId: docId, documentation };
  },
});

async function generateDocumentationSection(ctx: any, args: {
  integration: any;
  type: string;
  includeExamples: boolean;
}) {
  const { integration, type, includeExamples } = args;

  switch (type) {
    case "api_reference":
      return generateApiReference(integration, includeExamples);
    case "setup_guide":
      return generateSetupGuide(integration, includeExamples);
    case "troubleshooting":
      return generateTroubleshootingGuide(integration);
    case "best_practices":
      return generateBestPractices(integration);
    case "migration_guide":
      return generateMigrationGuide(integration);
    case "webhook_setup":
      return generateWebhookSetup(integration, includeExamples);
    case "authentication":
      return generateAuthenticationGuide(integration, includeExamples);
    case "rate_limits":
      return generateRateLimitsGuide(integration);
    case "error_codes":
      return generateErrorCodesGuide(integration);
    case "code_examples":
      return generateCodeExamples(integration);
    default:
      return { type, title: "General Documentation", content: "Documentation content" };
  }
}

function generateApiReference(integration: any, includeExamples: boolean) {
  const endpoints = integration.config?.endpoints || [];
  
  return {
    type: "api_reference",
    title: "API Reference",
    content: {
      overview: `Complete API reference for ${integration.name} integration`,
      baseUrl: integration.config?.baseUrl || "",
      authentication: integration.config?.authentication || {},
      endpoints: endpoints.map((endpoint: any) => ({
        method: endpoint.method,
        path: endpoint.path,
        description: endpoint.description,
        parameters: endpoint.parameters || [],
        responses: endpoint.responses || [],
        examples: includeExamples ? generateEndpointExamples(endpoint) : [],
      })),
      rateLimits: integration.config?.rateLimits || {},
      pagination: integration.config?.pagination || {},
    }
  };
}

function generateSetupGuide(integration: any, includeExamples: boolean) {
  return {
    type: "setup_guide",
    title: "Setup Guide",
    content: {
      overview: `Step-by-step guide to set up ${integration.name} integration`,
      prerequisites: [
        `Active ${integration.name} account`,
        "API access enabled",
        "Required permissions configured",
      ],
      steps: [
        {
          step: 1,
          title: "Create API Credentials",
          description: `Obtain API credentials from your ${integration.name} account`,
          instructions: [
            `Navigate to ${integration.name} developer settings`,
            "Create a new API application",
            "Copy the API key and secret",
          ],
          examples: includeExamples ? ["curl examples", "SDK examples"] : [],
        },
        {
          step: 2,
          title: "Configure Integration",
          description: "Add integration to your SmartBatch account",
          instructions: [
            "Go to Integrations page",
            `Select ${integration.name}`,
            "Enter your API credentials",
            "Test the connection",
          ],
        },
        {
          step: 3,
          title: "Set Up Data Sync",
          description: "Configure data synchronization settings",
          instructions: [
            "Choose sync frequency",
            "Select data fields to sync",
            "Configure webhooks if needed",
            "Start initial sync",
          ],
        },
      ],
      verification: {
        title: "Verify Setup",
        steps: [
          "Check connection status",
          "Verify data sync",
          "Test webhook delivery",
        ],
      },
    }
  };
}

function generateTroubleshootingGuide(integration: any) {
  return {
    type: "troubleshooting",
    title: "Troubleshooting Guide",
    content: {
      overview: `Common issues and solutions for ${integration.name} integration`,
      commonIssues: [
        {
          issue: "Authentication Failed",
          symptoms: ["401 Unauthorized errors", "Invalid API key messages"],
          causes: ["Expired API key", "Incorrect credentials", "Insufficient permissions"],
          solutions: [
            "Verify API credentials are correct",
            "Check if API key has expired",
            "Ensure proper permissions are granted",
            "Regenerate API key if necessary",
          ],
        },
        {
          issue: "Rate Limit Exceeded",
          symptoms: ["429 Too Many Requests errors", "Sync delays"],
          causes: ["Too many API calls", "Burst limit exceeded"],
          solutions: [
            "Reduce sync frequency",
            "Implement exponential backoff",
            "Contact provider for rate limit increase",
          ],
        },
        {
          issue: "Data Sync Issues",
          symptoms: ["Missing data", "Incomplete syncs", "Sync failures"],
          causes: ["Network connectivity", "Data format changes", "Permission issues"],
          solutions: [
            "Check network connectivity",
            "Verify data field mappings",
            "Review error logs",
            "Restart sync process",
          ],
        },
      ],
      errorCodes: generateErrorCodesList(integration),
      diagnosticSteps: [
        "Check integration status",
        "Review error logs",
        "Verify API credentials",
        "Test API connectivity",
        "Check webhook endpoints",
      ],
    }
  };
}

function generateBestPractices(integration: any) {
  return {
    type: "best_practices",
    title: "Best Practices",
    content: {
      overview: `Best practices for using ${integration.name} integration effectively`,
      practices: [
        {
          category: "Security",
          recommendations: [
            "Store API credentials securely",
            "Use environment variables for sensitive data",
            "Implement proper access controls",
            "Regularly rotate API keys",
            "Monitor for suspicious activity",
          ],
        },
        {
          category: "Performance",
          recommendations: [
            "Optimize sync frequency based on needs",
            "Use batch operations when possible",
            "Implement caching for frequently accessed data",
            "Monitor API usage and limits",
            "Use webhooks for real-time updates",
          ],
        },
        {
          category: "Data Management",
          recommendations: [
            "Validate data before syncing",
            "Handle data conflicts appropriately",
            "Implement data backup strategies",
            "Monitor data quality metrics",
            "Set up data retention policies",
          ],
        },
        {
          category: "Error Handling",
          recommendations: [
            "Implement comprehensive error handling",
            "Use exponential backoff for retries",
            "Log errors for debugging",
            "Set up monitoring and alerts",
            "Have rollback procedures ready",
          ],
        },
      ],
      tips: [
        "Start with test environment before production",
        "Document your integration configuration",
        "Keep integration dependencies up to date",
        "Regular health checks and monitoring",
        "Have a disaster recovery plan",
      ],
    }
  };
}

function generateMigrationGuide(integration: any) {
  return {
    type: "migration_guide",
    title: "Migration Guide",
    content: {
      overview: `Guide for migrating to/from ${integration.name} integration`,
      scenarios: [
        {
          title: "Migrating FROM Legacy System",
          steps: [
            "Export data from legacy system",
            "Set up new integration",
            "Map data fields",
            "Import data in batches",
            "Verify data integrity",
            "Update workflows",
          ],
        },
        {
          title: "Migrating TO Different Provider",
          steps: [
            "Set up new provider integration",
            "Create data mapping plan",
            "Export data from current integration",
            "Transform data format if needed",
            "Import to new provider",
            "Update application references",
          ],
        },
      ],
      dataMapping: {
        description: "Field mapping between systems",
        mappings: generateDataMappings(integration),
      },
      timeline: {
        description: "Recommended migration timeline",
        phases: [
          { phase: "Planning", duration: "1-2 weeks", tasks: ["Assess current setup", "Plan migration"] },
          { phase: "Setup", duration: "1 week", tasks: ["Set up new integration", "Configure settings"] },
          { phase: "Testing", duration: "1-2 weeks", tasks: ["Test data migration", "Verify functionality"] },
          { phase: "Migration", duration: "1 week", tasks: ["Migrate data", "Update systems"] },
          { phase: "Validation", duration: "1 week", tasks: ["Verify migration", "Monitor performance"] },
        ],
      },
    }
  };
}

function generateWebhookSetup(integration: any, includeExamples: boolean) {
  return {
    type: "webhook_setup",
    title: "Webhook Setup",
    content: {
      overview: `Configure webhooks for real-time updates from ${integration.name}`,
      prerequisites: [
        "Active integration",
        "Webhook endpoint URL",
        "SSL certificate (HTTPS required)",
      ],
      setup: [
        {
          step: 1,
          title: "Configure Webhook Endpoint",
          description: "Set up your webhook receiver endpoint",
          code: includeExamples ? generateWebhookCode() : null,
        },
        {
          step: 2,
          title: "Register Webhook",
          description: `Register webhook URL with ${integration.name}`,
          instructions: [
            "Navigate to webhook settings",
            "Add your endpoint URL",
            "Select event types",
            "Configure authentication",
          ],
        },
        {
          step: 3,
          title: "Verify Setup",
          description: "Test webhook delivery",
          instructions: [
            "Trigger test event",
            "Check endpoint logs",
            "Verify payload format",
          ],
        },
      ],
      eventTypes: integration.config?.webhookEvents || [
        "data.created",
        "data.updated", 
        "data.deleted",
        "sync.completed",
        "error.occurred",
      ],
      security: {
        description: "Webhook security best practices",
        practices: [
          "Verify webhook signatures",
          "Use HTTPS endpoints only",
          "Implement rate limiting",
          "Validate payload structure",
        ],
      },
    }
  };
}

function generateAuthenticationGuide(integration: any, includeExamples: boolean) {
  const authType = integration.config?.authentication?.type || "api_key";
  
  return {
    type: "authentication",
    title: "Authentication",
    content: {
      overview: `Authentication setup for ${integration.name} integration`,
      authType,
      methods: {
        api_key: authType === "api_key" ? {
          description: "API Key authentication",
          setup: [
            "Obtain API key from provider",
            "Add key to integration settings",
            "Include key in request headers",
          ],
          examples: includeExamples ? generateApiKeyExamples() : [],
        } : null,
        oauth: authType === "oauth" ? {
          description: "OAuth 2.0 authentication",
          flow: "authorization_code",
          setup: [
            "Register OAuth application",
            "Configure redirect URI",
            "Initiate OAuth flow",
            "Exchange code for token",
          ],
          examples: includeExamples ? generateOAuthExamples() : [],
        } : null,
        jwt: authType === "jwt" ? {
          description: "JWT token authentication",
          setup: [
            "Generate JWT token",
            "Sign with private key",
            "Include token in Authorization header",
          ],
          examples: includeExamples ? generateJWTExamples() : [],
        } : null,
      },
      security: [
        "Store credentials securely",
        "Use environment variables",
        "Implement token refresh logic",
        "Monitor for expired tokens",
      ],
    }
  };
}

function generateRateLimitsGuide(integration: any) {
  return {
    type: "rate_limits",
    title: "Rate Limits",
    content: {
      overview: `Rate limiting information for ${integration.name} API`,
      limits: integration.config?.rateLimits || {
        requests_per_minute: 100,
        requests_per_hour: 1000,
        requests_per_day: 10000,
        burst_limit: 10,
      },
      headers: [
        "X-RateLimit-Limit",
        "X-RateLimit-Remaining",
        "X-RateLimit-Reset",
      ],
      strategies: [
        {
          name: "Exponential Backoff",
          description: "Increase delay between retries exponentially",
          implementation: "Start with 1s, double each retry (1s, 2s, 4s, 8s, ...)",
        },
        {
          name: "Fixed Delay",
          description: "Wait fixed time between retries",
          implementation: "Wait consistent interval (e.g., 5 seconds) between retries",
        },
        {
          name: "Linear Backoff",
          description: "Increase delay linearly",
          implementation: "Increase delay by fixed amount (1s, 2s, 3s, 4s, ...)",
        },
      ],
      monitoring: [
        "Track API usage metrics",
        "Set up rate limit alerts",
        "Monitor error rates",
        "Implement usage dashboards",
      ],
    }
  };
}

function generateErrorCodesGuide(integration: any) {
  return {
    type: "error_codes",
    title: "Error Codes",
    content: {
      overview: `Error codes and handling for ${integration.name} API`,
      categories: [
        {
          category: "Authentication Errors (4xx)",
          codes: [
            { code: 401, message: "Unauthorized", description: "Invalid or missing credentials" },
            { code: 403, message: "Forbidden", description: "Insufficient permissions" },
            { code: 429, message: "Too Many Requests", description: "Rate limit exceeded" },
          ],
        },
        {
          category: "Client Errors (4xx)",
          codes: [
            { code: 400, message: "Bad Request", description: "Invalid request format" },
            { code: 404, message: "Not Found", description: "Resource not found" },
            { code: 422, message: "Unprocessable Entity", description: "Validation error" },
          ],
        },
        {
          category: "Server Errors (5xx)",
          codes: [
            { code: 500, message: "Internal Server Error", description: "Server error" },
            { code: 502, message: "Bad Gateway", description: "Gateway error" },
            { code: 503, message: "Service Unavailable", description: "Service temporarily down" },
          ],
        },
      ],
      handling: {
        retryable: [500, 502, 503, 429],
        non_retryable: [400, 401, 403, 404, 422],
        strategies: [
          "Implement exponential backoff for retryable errors",
          "Log all errors for debugging",
          "Show user-friendly error messages",
          "Set up error monitoring and alerts",
        ],
      },
    }
  };
}

function generateCodeExamples(integration: any) {
  return {
    type: "code_examples",
    title: "Code Examples",
    content: {
      overview: `Code examples for ${integration.name} integration`,
      languages: {
        javascript: generateJavaScriptExamples(integration),
        python: generatePythonExamples(integration),
        curl: generateCurlExamples(integration),
        php: generatePHPExamples(integration),
      },
      sdks: [
        {
          language: "JavaScript",
          package: `${integration.name.toLowerCase()}-js`,
          installation: `npm install ${integration.name.toLowerCase()}-js`,
        },
        {
          language: "Python", 
          package: `${integration.name.toLowerCase()}-python`,
          installation: `pip install ${integration.name.toLowerCase()}-python`,
        },
      ],
    }
  };
}

async function generateInteractiveGuides(ctx: any, args: {
  integration: any;
  format: string;
}) {
  return {
    guides: [
      {
        id: "quick_start",
        title: "Quick Start Guide",
        description: "Get up and running in 5 minutes",
        estimatedTime: "5 minutes",
        steps: [
          {
            id: "step_1",
            title: "Get API Credentials",
            description: "Obtain your API credentials",
            type: "instruction",
            content: "Follow these steps to get your API credentials...",
            interactive: true,
            validation: "api_key_format",
          },
          {
            id: "step_2", 
            title: "Test Connection",
            description: "Verify your credentials work",
            type: "api_test",
            content: "We'll test your API connection...",
            interactive: true,
            validation: "connection_test",
          },
        ],
      },
      {
        id: "advanced_setup",
        title: "Advanced Configuration",
        description: "Configure advanced features",
        estimatedTime: "15 minutes",
        steps: [
          {
            id: "webhook_setup",
            title: "Configure Webhooks",
            description: "Set up real-time notifications",
            type: "configuration",
            interactive: true,
          },
          {
            id: "data_mapping",
            title: "Map Data Fields",
            description: "Configure field mappings",
            type: "mapping",
            interactive: true,
          },
        ],
      },
    ],
    tutorials: [
      {
        id: "video_tutorial",
        title: "Video Tutorial",
        description: "Complete setup walkthrough",
        type: "video",
        duration: "10 minutes",
        url: `/tutorials/${args.integration.name.toLowerCase()}/setup`,
      },
    ],
  };
}

// Helper functions for generating examples
function generateEndpointExamples(endpoint: any) {
  return [
    {
      language: "curl",
      code: `curl -X ${endpoint.method} "${endpoint.path}" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`,
    },
    {
      language: "javascript",
      code: `const response = await fetch('${endpoint.path}', {
  method: '${endpoint.method}',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});`,
    },
  ];
}

function generateWebhookCode() {
  return {
    javascript: `// Express.js webhook handler
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-signature'];
  const payload = req.body;
  
  // Verify signature
  if (!verifySignature(payload, signature)) {
    return res.status(401).send('Invalid signature');
  }
  
  // Process webhook event
  handleWebhookEvent(payload);
  
  res.status(200).send('OK');
});`,
    python: `# Flask webhook handler
@app.route('/webhook', methods=['POST'])
def webhook():
    signature = request.headers.get('X-Signature')
    payload = request.get_json()
    
    # Verify signature
    if not verify_signature(payload, signature):
        return 'Invalid signature', 401
    
    # Process webhook event
    handle_webhook_event(payload)
    
    return 'OK', 200`,
  };
}

function generateApiKeyExamples() {
  return [
    {
      language: "curl",
      code: `curl -H "Authorization: Bearer YOUR_API_KEY" \\
  https://api.example.com/v1/data`,
    },
    {
      language: "javascript",
      code: `const headers = {
  'Authorization': 'Bearer YOUR_API_KEY',
  'Content-Type': 'application/json'
};`,
    },
  ];
}

function generateOAuthExamples() {
  return [
    {
      step: "Authorization URL",
      code: `https://provider.com/oauth/authorize?
  client_id=YOUR_CLIENT_ID&
  redirect_uri=YOUR_REDIRECT_URI&
  response_type=code&
  scope=read write`,
    },
    {
      step: "Token Exchange",
      code: `curl -X POST https://provider.com/oauth/token \\
  -d "grant_type=authorization_code" \\
  -d "code=AUTHORIZATION_CODE" \\
  -d "client_id=YOUR_CLIENT_ID" \\
  -d "client_secret=YOUR_CLIENT_SECRET"`,
    },
  ];
}

function generateJWTExamples() {
  return [
    {
      language: "javascript",
      code: `const jwt = require('jsonwebtoken');

const token = jwt.sign(
  { user_id: 'user123', scope: 'read write' },
  'your-secret-key',
  { expiresIn: '1h' }
);`,
    },
  ];
}

function generateJavaScriptExamples(integration: any) {
  return {
    basic_request: `// Basic API request
const response = await fetch('${integration.config?.baseUrl}/api/v1/data', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data);`,
    
    create_record: `// Create a new record
const newRecord = await fetch('${integration.config?.baseUrl}/api/v1/records', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'New Record',
    email: 'test@example.com'
  })
});`,
  };
}

function generatePythonExamples(integration: any) {
  return {
    basic_request: `# Basic API request
import requests

headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
}

response = requests.get('${integration.config?.baseUrl}/api/v1/data', headers=headers)
data = response.json()
print(data)`,
    
    create_record: `# Create a new record
import requests

headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
}

data = {
    'name': 'New Record',
    'email': 'test@example.com'
}

response = requests.post('${integration.config?.baseUrl}/api/v1/records', 
                        headers=headers, json=data)`,
  };
}

function generateCurlExamples(integration: any) {
  return {
    basic_request: `# Basic API request
curl -X GET "${integration.config?.baseUrl}/api/v1/data" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`,
    
    create_record: `# Create a new record
curl -X POST "${integration.config?.baseUrl}/api/v1/records" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "New Record",
    "email": "test@example.com"
  }'`,
  };
}

function generatePHPExamples(integration: any) {
  return {
    basic_request: `<?php
// Basic API request
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, '${integration.config?.baseUrl}/api/v1/data');
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer YOUR_API_KEY',
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$data = json_decode($response, true);
curl_close($ch);
?>`,
  };
}

function generateErrorCodesList(integration: any) {
  return [
    { code: "AUTH_001", message: "Invalid API key", solution: "Check API key format" },
    { code: "RATE_001", message: "Rate limit exceeded", solution: "Reduce request frequency" },
    { code: "SYNC_001", message: "Sync failed", solution: "Check data format" },
    { code: "WEBHOOK_001", message: "Webhook delivery failed", solution: "Verify endpoint URL" },
  ];
}

function generateDataMappings(integration: any) {
  return [
    { source: "email", target: "email_address", type: "string", required: true },
    { source: "name", target: "full_name", type: "string", required: true },
    { source: "phone", target: "phone_number", type: "string", required: false },
    { source: "tags", target: "categories", type: "array", required: false },
  ];
}

// Store generated documentation
export const createDocumentation = mutation({
  args: {
    userId: v.id("users"),
    integrationId: v.id("integrations"),
    title: v.string(),
    content: v.any(),
    format: v.union(...documentationFormats.map(f => v.literal(f))),
    version: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("integrationDocumentation", {
      userId: args.userId,
      integrationId: args.integrationId,
      title: args.title,
      content: args.content,
      format: args.format,
      version: args.version,
      status: "generated",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Get documentation for an integration
export const getDocumentation = query({
  args: {
    integrationId: v.id("integrations"),
    format: v.optional(v.union(...documentationFormats.map(f => v.literal(f)))),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("integrationDocumentation")
      .withIndex("by_integration", (q) => q.eq("integrationId", args.integrationId));

    if (args.format) {
      query = query.filter((q) => q.eq(q.field("format"), args.format));
    }

    return await query.order("desc").collect();
  },
});

// Update documentation
export const updateDocumentation = mutation({
  args: {
    documentationId: v.id("integrationDocumentation"),
    updates: v.object({
      title: v.optional(v.string()),
      content: v.optional(v.any()),
      version: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.documentationId, {
      ...args.updates,
      updatedAt: Date.now(),
    });
  },
});

// Search documentation
export const searchDocumentation = query({
  args: {
    userId: v.id("users"),
    searchTerm: v.string(),
    filters: v.optional(v.object({
      integrationId: v.optional(v.id("integrations")),
      format: v.optional(v.union(...documentationFormats.map(f => v.literal(f)))),
      type: v.optional(v.union(...documentationTypes.map(t => v.literal(t)))),
    })),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("integrationDocumentation")
      .withIndex("by_user", (q) => q.eq("userId", args.userId));

    if (args.filters?.integrationId) {
      query = query.filter((q) => q.eq(q.field("integrationId"), args.filters!.integrationId!));
    }

    if (args.filters?.format) {
      query = query.filter((q) => q.eq(q.field("format"), args.filters!.format!));
    }

    const docs = await query.collect();

    // Simple text search in title and content
    return docs.filter(doc => 
      doc.title.toLowerCase().includes(args.searchTerm.toLowerCase()) ||
      JSON.stringify(doc.content).toLowerCase().includes(args.searchTerm.toLowerCase())
    );
  },
});

// Export documentation
export const exportDocumentation = action({
  args: {
    documentationId: v.id("integrationDocumentation"),
    format: v.union(v.literal("pdf"), v.literal("html"), v.literal("markdown")),
  },
  handler: async (ctx, args) => {
    const doc = await ctx.runQuery(internal.integrationDocumentation.getDocumentationById, {
      documentationId: args.documentationId
    });

    if (!doc) {
      throw new Error("Documentation not found");
    }

    // Generate export based on format
    let exportContent = "";
    
    switch (args.format) {
      case "markdown":
        exportContent = convertToMarkdown(doc.content);
        break;
      case "html":
        exportContent = convertToHTML(doc.content);
        break;
      case "pdf":
        exportContent = await convertToPDF(doc.content);
        break;
    }

    return {
      filename: `${doc.title.replace(/[^a-zA-Z0-9]/g, '_')}.${args.format}`,
      content: exportContent,
      mimeType: getMimeType(args.format),
    };
  },
});

function convertToMarkdown(content: any): string {
  let markdown = `# ${content.title}\n\n`;
  markdown += `Generated: ${new Date(content.generatedAt).toLocaleString()}\n\n`;
  
  for (const section of content.sections) {
    markdown += `## ${section.title}\n\n`;
    
    if (typeof section.content === 'string') {
      markdown += section.content + '\n\n';
    } else {
      markdown += JSON.stringify(section.content, null, 2) + '\n\n';
    }
  }
  
  return markdown;
}

function convertToHTML(content: any): string {
  let html = `<!DOCTYPE html>
<html>
<head>
  <title>${content.title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    h1, h2, h3 { color: #333; }
    pre { background: #f5f5f5; padding: 10px; border-radius: 4px; }
    code { background: #f0f0f0; padding: 2px 4px; border-radius: 2px; }
  </style>
</head>
<body>`;
  
  html += `<h1>${content.title}</h1>`;
  html += `<p><em>Generated: ${new Date(content.generatedAt).toLocaleString()}</em></p>`;
  
  for (const section of content.sections) {
    html += `<h2>${section.title}</h2>`;
    
    if (typeof section.content === 'string') {
      html += `<p>${section.content}</p>`;
    } else {
      html += `<pre><code>${JSON.stringify(section.content, null, 2)}</code></pre>`;
    }
  }
  
  html += '</body></html>';
  return html;
}

async function convertToPDF(content: any): Promise<string> {
  // In a real implementation, you would use a library like Puppeteer or jsPDF
  // For now, return HTML that can be converted to PDF
  return convertToHTML(content);
}

function getMimeType(format: string): string {
  switch (format) {
    case "markdown": return "text/markdown";
    case "html": return "text/html";
    case "pdf": return "application/pdf";
    default: return "text/plain";
  }
}

// Get documentation by ID (internal)
export const getDocumentationById = query({
  args: { documentationId: v.id("integrationDocumentation") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.documentationId);
  },
});

// Analytics for documentation usage
export const getDocumentationAnalytics = query({
  args: {
    userId: v.id("users"),
    integrationId: v.optional(v.id("integrations")),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("integrationDocumentation")
      .withIndex("by_user", (q) => q.eq("userId", args.userId));

    if (args.integrationId) {
      query = query.filter((q) => q.eq(q.field("integrationId"), args.integrationId));
    }

    const docs = await query.collect();

    return {
      totalDocuments: docs.length,
      documentsByFormat: docs.reduce((acc, doc) => {
        acc[doc.format] = (acc[doc.format] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      recentDocuments: docs
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 10),
    };
  },
});
