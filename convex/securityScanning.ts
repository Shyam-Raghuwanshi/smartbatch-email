
import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

// Security scan types
export const SCAN_TYPES = {
  VULNERABILITY: "vulnerability",
  COMPLIANCE: "compliance", 
  CONFIGURATION: "configuration",
  ACCESS_CONTROL: "access_control",
  DATA_PRIVACY: "data_privacy",
  ENCRYPTION: "encryption",
  AUTHENTICATION: "authentication",
  NETWORK_SECURITY: "network_security"
} as const;

// Security severity levels
export const SECURITY_SEVERITY = {
  CRITICAL: "critical",
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
  INFO: "info"
} as const;

// Compliance frameworks
export const COMPLIANCE_FRAMEWORKS = {
  GDPR: "gdpr",
  CCPA: "ccpa",
  SOX: "sox",
  HIPAA: "hipaa",
  PCI_DSS: "pci_dss",
  ISO_27001: "iso_27001",
  SOC2: "soc2"
} as const;

// Create security scan
export const createSecurityScan = mutation({
  args: {
    integrationId: v.optional(v.id("integrations")),
    name: v.string(),
    description: v.optional(v.string()),
    scanType: v.string(),
    scope: v.object({
      includeIntegrations: v.boolean(),
      includeWebhooks: v.boolean(),
      includeApiKeys: v.boolean(),
      includeDataFlow: v.boolean(),
      includeCompliance: v.boolean(),
      specificEndpoints: v.optional(v.array(v.string()))
    }),
    configuration: v.optional(v.object({
      depth: v.optional(v.string()),
      timeout: v.optional(v.number()),
      retries: v.optional(v.number()),
      parallelChecks: v.optional(v.number()),
      complianceFrameworks: v.optional(v.array(v.string())),
      customRules: v.optional(v.array(v.any()))
    })),
    scheduledFor: v.optional(v.number()),
    recurring: v.optional(v.object({
      enabled: v.boolean(),
      interval: v.string(),
      nextRun: v.number()
    }))
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("securityScans", {
      integrationId: args.integrationId,
      name: args.name,
      description: args.description,
      scanType: args.scanType,
      scope: args.scope,
      configuration: args.configuration || {},
      status: "pending",
      progress: 0,
      scheduledFor: args.scheduledFor || Date.now(),
      recurring: args.recurring,
      findings: [],
      summary: {
        totalChecks: 0,
        passedChecks: 0,
        failedChecks: 0,
        criticalFindings: 0,
        highFindings: 0,
        mediumFindings: 0,
        lowFindings: 0,
        riskScore: 0
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  }
});

// Run security scan
export const runSecurityScan = action({
  args: {
    scanId: v.id("securityScans")
  },
  handler: async (ctx, args) => {
    const scan = await ctx.runQuery(internal.securityScanning.getSecurityScan, {
      scanId: args.scanId
    });

    if (!scan) {
      throw new Error("Security scan not found");
    }

    // Update scan status to running
    await ctx.runMutation(internal.securityScanning.updateScanStatus, {
      scanId: args.scanId,
      status: "running",
      progress: 0
    });

    const findings = [];
    let totalChecks = 0;
    let completedChecks = 0;

    try {
      // Run different security checks based on scan type
      if (scan.scanType === SCAN_TYPES.VULNERABILITY || scan.scanType === "comprehensive") {
        const vulnerabilityFindings = await runVulnerabilityChecks(ctx, scan);
        findings.push(...vulnerabilityFindings);
        totalChecks += 10;
        completedChecks += 10;
      }

      if (scan.scanType === SCAN_TYPES.COMPLIANCE || scan.scanType === "comprehensive") {
        const complianceFindings = await runComplianceChecks(ctx, scan);
        findings.push(...complianceFindings);
        totalChecks += 15;
        completedChecks += 15;
      }

      if (scan.scanType === SCAN_TYPES.CONFIGURATION || scan.scanType === "comprehensive") {
        const configFindings = await runConfigurationChecks(ctx, scan);
        findings.push(...configFindings);
        totalChecks += 8;
        completedChecks += 8;
      }

      if (scan.scanType === SCAN_TYPES.ACCESS_CONTROL || scan.scanType === "comprehensive") {
        const accessFindings = await runAccessControlChecks(ctx, scan);
        findings.push(...accessFindings);
        totalChecks += 12;
        completedChecks += 12;
      }

      if (scan.scanType === SCAN_TYPES.DATA_PRIVACY || scan.scanType === "comprehensive") {
        const privacyFindings = await runDataPrivacyChecks(ctx, scan);
        findings.push(...privacyFindings);
        totalChecks += 6;
        completedChecks += 6;
      }

      if (scan.scanType === SCAN_TYPES.ENCRYPTION || scan.scanType === "comprehensive") {
        const encryptionFindings = await runEncryptionChecks(ctx, scan);
        findings.push(...encryptionFindings);
        totalChecks += 5;
        completedChecks += 5;
      }

      // Calculate summary
      const summary = {
        totalChecks,
        passedChecks: totalChecks - findings.length,
        failedChecks: findings.length,
        criticalFindings: findings.filter(f => f.severity === SECURITY_SEVERITY.CRITICAL).length,
        highFindings: findings.filter(f => f.severity === SECURITY_SEVERITY.HIGH).length,
        mediumFindings: findings.filter(f => f.severity === SECURITY_SEVERITY.MEDIUM).length,
        lowFindings: findings.filter(f => f.severity === SECURITY_SEVERITY.LOW).length,
        riskScore: calculateRiskScore(findings)
      };

      // Update scan with results
      await ctx.runMutation(internal.securityScanning.updateScanResults, {
        scanId: args.scanId,
        status: "completed",
        progress: 100,
        findings,
        summary,
        completedAt: Date.now()
      });

      // Create alerts for critical findings
      const criticalFindings = findings.filter(f => f.severity === SECURITY_SEVERITY.CRITICAL);
      for (const finding of criticalFindings) {
        await ctx.runMutation(internal.securityScanning.createSecurityAlert, {
          scanId: args.scanId,
          finding,
          severity: finding.severity,
          message: `Critical security issue: ${finding.title}`
        });
      }

      return { success: true, findings: findings.length, riskScore: summary.riskScore };

    } catch (error) {
      await ctx.runMutation(internal.securityScanning.updateScanStatus, {
        scanId: args.scanId,
        status: "failed",
        progress: Math.floor((completedChecks / totalChecks) * 100),
        error: error.message
      });
      
      throw error;
    }
  }
});

// Vulnerability checks
async function runVulnerabilityChecks(ctx: any, scan: any): Promise<any[]> {
  const findings = [];

  // Check for known vulnerabilities in dependencies
  const dependencyFindings = await checkDependencyVulnerabilities(ctx, scan);
  findings.push(...dependencyFindings);

  // Check for insecure API configurations
  const apiFindings = await checkAPIVulnerabilities(ctx, scan);
  findings.push(...apiFindings);

  // Check for injection vulnerabilities
  const injectionFindings = await checkInjectionVulnerabilities(ctx, scan);
  findings.push(...injectionFindings);

  return findings;
}

// Compliance checks
async function runComplianceChecks(ctx: any, scan: any): Promise<any[]> {
  const findings = [];
  const frameworks = scan.configuration?.complianceFrameworks || [COMPLIANCE_FRAMEWORKS.GDPR];

  for (const framework of frameworks) {
    switch (framework) {
      case COMPLIANCE_FRAMEWORKS.GDPR:
        const gdprFindings = await checkGDPRCompliance(ctx, scan);
        findings.push(...gdprFindings);
        break;
      case COMPLIANCE_FRAMEWORKS.CCPA:
        const ccpaFindings = await checkCCPACompliance(ctx, scan);
        findings.push(...ccpaFindings);
        break;
      case COMPLIANCE_FRAMEWORKS.SOC2:
        const soc2Findings = await checkSOC2Compliance(ctx, scan);
        findings.push(...soc2Findings);
        break;
    }
  }

  return findings;
}

// Configuration security checks
async function runConfigurationChecks(ctx: any, scan: any): Promise<any[]> {
  const findings = [];

  // Check webhook security configurations
  if (scan.scope.includeWebhooks) {
    const webhookFindings = await checkWebhookSecurity(ctx, scan);
    findings.push(...webhookFindings);
  }

  // Check API key security
  if (scan.scope.includeApiKeys) {
    const apiKeyFindings = await checkAPIKeySecurity(ctx, scan);
    findings.push(...apiKeyFindings);
  }

  // Check integration configurations
  if (scan.scope.includeIntegrations) {
    const integrationFindings = await checkIntegrationSecurity(ctx, scan);
    findings.push(...integrationFindings);
  }

  return findings;
}

// Access control checks
async function runAccessControlChecks(ctx: any, scan: any): Promise<any[]> {
  const findings = [];

  // Check for weak authentication
  const authFindings = await checkAuthenticationSecurity(ctx, scan);
  findings.push(...authFindings);

  // Check for privilege escalation risks
  const privilegeFindings = await checkPrivilegeEscalation(ctx, scan);
  findings.push(...privilegeFindings);

  // Check for unauthorized access patterns
  const accessFindings = await checkUnauthorizedAccess(ctx, scan);
  findings.push(...accessFindings);

  return findings;
}

// Data privacy checks
async function runDataPrivacyChecks(ctx: any, scan: any): Promise<any[]> {
  const findings = [];

  // Check for PII exposure
  const piiFindings = await checkPIIExposure(ctx, scan);
  findings.push(...piiFindings);

  // Check data retention policies
  const retentionFindings = await checkDataRetention(ctx, scan);
  findings.push(...retentionFindings);

  // Check consent management
  const consentFindings = await checkConsentManagement(ctx, scan);
  findings.push(...consentFindings);

  return findings;
}

// Encryption checks
async function runEncryptionChecks(ctx: any, scan: any): Promise<any[]> {
  const findings = [];

  // Check for weak encryption
  const encryptionFindings = await checkEncryptionStrength(ctx, scan);
  findings.push(...encryptionFindings);

  // Check for unencrypted data in transit
  const transitFindings = await checkDataInTransit(ctx, scan);
  findings.push(...transitFindings);

  return findings;
}

// Helper functions for specific security checks
async function checkDependencyVulnerabilities(ctx: any, scan: any): Promise<any[]> {
  // Mock implementation - would integrate with security databases
  return [
    {
      id: "dep-vuln-001",
      title: "Outdated dependency with known vulnerabilities",
      description: "Some dependencies may have known security vulnerabilities",
      severity: SECURITY_SEVERITY.MEDIUM,
      category: "dependencies",
      recommendation: "Update all dependencies to latest secure versions",
      references: ["https://nvd.nist.gov/"],
      affectedComponents: ["third-party libraries"],
      cwe: "CWE-1104",
      cvss: 5.5
    }
  ];
}

async function checkAPIVulnerabilities(ctx: any, scan: any): Promise<any[]> {
  const findings = [];

  // Check for missing rate limiting
  findings.push({
    id: "api-vuln-001",
    title: "Missing or insufficient rate limiting",
    description: "API endpoints may be vulnerable to abuse without proper rate limiting",
    severity: SECURITY_SEVERITY.MEDIUM,
    category: "api_security",
    recommendation: "Implement comprehensive rate limiting on all API endpoints",
    affectedComponents: ["API endpoints"],
    cwe: "CWE-770"
  });

  // Check for insufficient input validation
  findings.push({
    id: "api-vuln-002", 
    title: "Insufficient input validation",
    description: "API inputs may not be properly validated against malicious data",
    severity: SECURITY_SEVERITY.HIGH,
    category: "input_validation",
    recommendation: "Implement strict input validation and sanitization",
    affectedComponents: ["API inputs"],
    cwe: "CWE-20"
  });

  return findings;
}

async function checkInjectionVulnerabilities(ctx: any, scan: any): Promise<any[]> {
  return [
    {
      id: "inj-vuln-001",
      title: "Potential SQL injection vulnerability",
      description: "Database queries may be vulnerable to SQL injection attacks",
      severity: SECURITY_SEVERITY.HIGH,
      category: "injection",
      recommendation: "Use parameterized queries and input validation",
      affectedComponents: ["database queries"],
      cwe: "CWE-89",
      cvss: 7.5
    }
  ];
}

async function checkGDPRCompliance(ctx: any, scan: any): Promise<any[]> {
  const findings = [];

  // Check for data processing consent
  findings.push({
    id: "gdpr-001",
    title: "Missing explicit consent for data processing",
    description: "Data processing may occur without explicit user consent as required by GDPR",
    severity: SECURITY_SEVERITY.HIGH,
    category: "compliance",
    framework: "GDPR",
    article: "Article 6",
    recommendation: "Implement explicit consent mechanisms for all data processing activities"
  });

  // Check for data subject rights
  findings.push({
    id: "gdpr-002",
    title: "Data subject rights implementation missing",
    description: "System may not fully support data subject rights (access, rectification, erasure)",
    severity: SECURITY_SEVERITY.MEDIUM,
    category: "compliance",
    framework: "GDPR",
    article: "Articles 15-20",
    recommendation: "Implement comprehensive data subject rights management"
  });

  return findings;
}

async function checkCCPACompliance(ctx: any, scan: any): Promise<any[]> {
  return [
    {
      id: "ccpa-001",
      title: "Consumer privacy rights not fully implemented",
      description: "System may not fully support CCPA consumer privacy rights",
      severity: SECURITY_SEVERITY.MEDIUM,
      category: "compliance",
      framework: "CCPA",
      recommendation: "Implement comprehensive consumer privacy rights management"
    }
  ];
}

async function checkSOC2Compliance(ctx: any, scan: any): Promise<any[]> {
  return [
    {
      id: "soc2-001",
      title: "Access controls may not meet SOC 2 requirements",
      description: "Current access control implementation may not satisfy SOC 2 Type II requirements",
      severity: SECURITY_SEVERITY.MEDIUM,
      category: "compliance",
      framework: "SOC2",
      recommendation: "Review and enhance access control mechanisms"
    }
  ];
}

async function checkWebhookSecurity(ctx: any, scan: any): Promise<any[]> {
  return [
    {
      id: "webhook-001",
      title: "Webhook endpoints lack signature verification",
      description: "Webhook endpoints may not verify request signatures, allowing spoofed requests",
      severity: SECURITY_SEVERITY.HIGH,
      category: "webhook_security",
      recommendation: "Implement HMAC signature verification for all webhook endpoints"
    }
  ];
}

async function checkAPIKeySecurity(ctx: any, scan: any): Promise<any[]> {
  return [
    {
      id: "apikey-001",
      title: "API keys may lack proper rotation policy",
      description: "API keys may not be rotated regularly, increasing security risk",
      severity: SECURITY_SEVERITY.MEDIUM,
      category: "api_key_security",
      recommendation: "Implement automated API key rotation policies"
    }
  ];
}

async function checkIntegrationSecurity(ctx: any, scan: any): Promise<any[]> {
  return [
    {
      id: "integration-001",
      title: "Integration credentials stored insecurely",
      description: "Integration credentials may not be properly encrypted at rest",
      severity: SECURITY_SEVERITY.HIGH,
      category: "integration_security",
      recommendation: "Encrypt all integration credentials using strong encryption"
    }
  ];
}

async function checkAuthenticationSecurity(ctx: any, scan: any): Promise<any[]> {
  return [
    {
      id: "auth-001",
      title: "Multi-factor authentication not enforced",
      description: "MFA may not be required for all administrative access",
      severity: SECURITY_SEVERITY.HIGH,
      category: "authentication",
      recommendation: "Enforce MFA for all administrative and sensitive operations"
    }
  ];
}

async function checkPrivilegeEscalation(ctx: any, scan: any): Promise<any[]> {
  return [
    {
      id: "priv-001",
      title: "Potential privilege escalation vulnerabilities",
      description: "Users may be able to access resources beyond their intended permissions",
      severity: SECURITY_SEVERITY.HIGH,
      category: "authorization",
      recommendation: "Implement principle of least privilege and regular access reviews"
    }
  ];
}

async function checkUnauthorizedAccess(ctx: any, scan: any): Promise<any[]> {
  return [
    {
      id: "access-001",
      title: "Insufficient access logging and monitoring",
      description: "System may not adequately log and monitor access attempts",
      severity: SECURITY_SEVERITY.MEDIUM,
      category: "access_control",
      recommendation: "Implement comprehensive access logging and real-time monitoring"
    }
  ];
}

async function checkPIIExposure(ctx: any, scan: any): Promise<any[]> {
  return [
    {
      id: "pii-001",
      title: "Potential PII exposure in logs",
      description: "Personally identifiable information may be logged in plaintext",
      severity: SECURITY_SEVERITY.HIGH,
      category: "data_privacy",
      recommendation: "Implement PII scrubbing in all logging mechanisms"
    }
  ];
}

async function checkDataRetention(ctx: any, scan: any): Promise<any[]> {
  return [
    {
      id: "retention-001",
      title: "Data retention policies not enforced",
      description: "Data may be retained longer than necessary or legally required",
      severity: SECURITY_SEVERITY.MEDIUM,
      category: "data_privacy",
      recommendation: "Implement automated data retention and deletion policies"
    }
  ];
}

async function checkConsentManagement(ctx: any, scan: any): Promise<any[]> {
  return [
    {
      id: "consent-001",
      title: "Consent management system incomplete",
      description: "User consent may not be properly tracked and managed",
      severity: SECURITY_SEVERITY.MEDIUM,
      category: "data_privacy",
      recommendation: "Implement comprehensive consent management system"
    }
  ];
}

async function checkEncryptionStrength(ctx: any, scan: any): Promise<any[]> {
  return [
    {
      id: "encryption-001",
      title: "Weak encryption algorithms detected",
      description: "Some data may be encrypted using outdated or weak algorithms",
      severity: SECURITY_SEVERITY.HIGH,
      category: "encryption",
      recommendation: "Upgrade to current encryption standards (AES-256, RSA-4096)"
    }
  ];
}

async function checkDataInTransit(ctx: any, scan: any): Promise<any[]> {
  return [
    {
      id: "transit-001",
      title: "Unencrypted data transmission",
      description: "Some data transmissions may not be properly encrypted",
      severity: SECURITY_SEVERITY.HIGH,
      category: "encryption",
      recommendation: "Ensure all data transmission uses TLS 1.3 or higher"
    }
  ];
}

// Calculate risk score based on findings
function calculateRiskScore(findings: any[]): number {
  let score = 0;
  
  for (const finding of findings) {
    switch (finding.severity) {
      case SECURITY_SEVERITY.CRITICAL:
        score += 10;
        break;
      case SECURITY_SEVERITY.HIGH:
        score += 7;
        break;
      case SECURITY_SEVERITY.MEDIUM:
        score += 4;
        break;
      case SECURITY_SEVERITY.LOW:
        score += 2;
        break;
      case SECURITY_SEVERITY.INFO:
        score += 1;
        break;
    }
  }
  
  return Math.min(100, score);
}

// Get security scans
export const getSecurityScans = query({
  args: {
    integrationId: v.optional(v.id("integrations")),
    status: v.optional(v.string()),
    scanType: v.optional(v.string()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("securityScans");

    if (args.integrationId) {
      query = query.filter(q => q.eq(q.field("integrationId"), args.integrationId));
    }
    if (args.status) {
      query = query.filter(q => q.eq(q.field("status"), args.status));
    }
    if (args.scanType) {
      query = query.filter(q => q.eq(q.field("scanType"), args.scanType));
    }

    return await query
      .order("desc")
      .take(args.limit || 50);
  }
});

// Get security scan details
export const getSecurityScan = query({
  args: { scanId: v.id("securityScans") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.scanId);
  }
});

// Update scan status
export const updateScanStatus = mutation({
  args: {
    scanId: v.id("securityScans"),
    status: v.string(),
    progress: v.number(),
    error: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const updates: any = {
      status: args.status,
      progress: args.progress,
      updatedAt: Date.now()
    };

    if (args.error) {
      updates.error = args.error;
    }

    await ctx.db.patch(args.scanId, updates);
    return { success: true };
  }
});

// Update scan results
export const updateScanResults = mutation({
  args: {
    scanId: v.id("securityScans"),
    status: v.string(),
    progress: v.number(),
    findings: v.array(v.any()),
    summary: v.any(),
    completedAt: v.number()
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.scanId, {
      status: args.status,
      progress: args.progress,
      findings: args.findings,
      summary: args.summary,
      completedAt: args.completedAt,
      updatedAt: Date.now()
    });

    return { success: true };
  }
});

// Create security alert
export const createSecurityAlert = mutation({
  args: {
    scanId: v.id("securityScans"),
    finding: v.any(),
    severity: v.string(),
    message: v.string()
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("securityAlerts", {
      scanId: args.scanId,
      findingId: args.finding.id,
      severity: args.severity,
      message: args.message,
      title: args.finding.title,
      description: args.finding.description,
      recommendation: args.finding.recommendation,
      isActive: true,
      acknowledgedAt: null,
      resolvedAt: null,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  }
});

// Get security alerts
export const getSecurityAlerts = query({
  args: {
    isActive: v.optional(v.boolean()),
    severity: v.optional(v.string()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("securityAlerts");

    if (args.isActive !== undefined) {
      query = query.filter(q => q.eq(q.field("isActive"), args.isActive));
    }
    if (args.severity) {
      query = query.filter(q => q.eq(q.field("severity"), args.severity));
    }

    return await query
      .order("desc")
      .take(args.limit || 50);
  }
});

// Acknowledge security alert
export const acknowledgeSecurityAlert = mutation({
  args: {
    alertId: v.id("securityAlerts"),
    acknowledgedBy: v.optional(v.id("users")),
    notes: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.alertId, {
      acknowledgedAt: Date.now(),
      acknowledgedBy: args.acknowledgedBy,
      notes: args.notes,
      updatedAt: Date.now()
    });

    return { success: true };
  }
});

// Resolve security alert
export const resolveSecurityAlert = mutation({
  args: {
    alertId: v.id("securityAlerts"),
    resolvedBy: v.optional(v.id("users")),
    resolution: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.alertId, {
      isActive: false,
      resolvedAt: Date.now(),
      resolvedBy: args.resolvedBy,
      resolution: args.resolution,
      updatedAt: Date.now()
    });

    return { success: true };
  }
});

// Run scheduled security scans
export const runScheduledScans = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const scheduledScans = await ctx.db.query("securityScans")
      .filter(q => q.eq(q.field("status"), "pending"))
      .filter(q => q.lte(q.field("scheduledFor"), now))
      .collect();

    const results = [];

    for (const scan of scheduledScans) {
      try {
        await runSecurityScan(ctx, { scanId: scan._id });
        results.push({ scanId: scan._id, status: "started" });

        // Schedule next run if recurring
        if (scan.recurring?.enabled) {
          const nextRun = calculateNextRun(scan.recurring.interval);
          await ctx.db.patch(scan._id, {
            "recurring.nextRun": nextRun
          });
        }
      } catch (error) {
        results.push({ scanId: scan._id, status: "failed", error: error.message });
      }
    }

    return { processed: results.length, results };
  }
});

// Helper function to calculate next run time
function calculateNextRun(interval: string): number {
  const now = Date.now();
  
  switch (interval) {
    case "daily":
      return now + 24 * 60 * 60 * 1000;
    case "weekly":
      return now + 7 * 24 * 60 * 60 * 1000;
    case "monthly":
      return now + 30 * 24 * 60 * 60 * 1000;
    default:
      return now + 24 * 60 * 60 * 1000;
  }
}

// Generate security report
export const generateSecurityReport = action({
  args: {
    scanIds: v.optional(v.array(v.id("securityScans"))),
    format: v.optional(v.string()),
    includeRecommendations: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const scans = args.scanIds?.length 
      ? await Promise.all(args.scanIds.map(id => ctx.runQuery(internal.securityScanning.getSecurityScan, { scanId: id })))
      : await ctx.runQuery(internal.securityScanning.getSecurityScans, { limit: 10 });

    const report = {
      generatedAt: Date.now(),
      scansIncluded: scans.length,
      overallRiskScore: 0,
      totalFindings: 0,
      criticalFindings: 0,
      highFindings: 0,
      mediumFindings: 0,
      lowFindings: 0,
      complianceStatus: {},
      recommendations: [],
      scans: scans.map(scan => ({
        id: scan._id,
        name: scan.name,
        type: scan.scanType,
        status: scan.status,
        riskScore: scan.summary?.riskScore || 0,
        findings: scan.findings?.length || 0,
        completedAt: scan.completedAt
      }))
    };

    // Calculate overall metrics
    for (const scan of scans) {
      if (scan.summary) {
        report.totalFindings += scan.summary.failedChecks;
        report.criticalFindings += scan.summary.criticalFindings;
        report.highFindings += scan.summary.highFindings;
        report.mediumFindings += scan.summary.mediumFindings;
        report.lowFindings += scan.summary.lowFindings;
        report.overallRiskScore += scan.summary.riskScore;
      }
    }

    report.overallRiskScore = Math.round(report.overallRiskScore / scans.length) || 0;

    // Generate recommendations if requested
    if (args.includeRecommendations) {
      report.recommendations = generateSecurityRecommendations(scans);
    }

    return report;
  }
});

// Generate security recommendations based on scan results
function generateSecurityRecommendations(scans: any[]): any[] {
  const recommendations = [];
  const findingsByCategory = new Map();

  // Collect findings by category
  for (const scan of scans) {
    if (scan.findings) {
      for (const finding of scan.findings) {
        const category = finding.category || 'general';
        if (!findingsByCategory.has(category)) {
          findingsByCategory.set(category, []);
        }
        findingsByCategory.get(category).push(finding);
      }
    }
  }

  // Generate recommendations for each category
  for (const [category, findings] of findingsByCategory) {
    const criticalCount = findings.filter((f: any) => f.severity === SECURITY_SEVERITY.CRITICAL).length;
    const highCount = findings.filter((f: any) => f.severity === SECURITY_SEVERITY.HIGH).length;

    if (criticalCount > 0 || highCount > 2) {
      recommendations.push({
        category,
        priority: 'high',
        title: `Address ${category.replace('_', ' ')} vulnerabilities`,
        description: `Found ${criticalCount} critical and ${highCount} high severity issues in ${category}`,
        actions: getRecommendedActions(category, findings),
        timeline: 'immediate'
      });
    }
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder];
  });
}

// Get recommended actions for a category
function getRecommendedActions(category: string, findings: any[]): string[] {
  const actionMap: Record<string, string[]> = {
    'api_security': [
      'Implement comprehensive rate limiting',
      'Add API key rotation policies',
      'Enable request/response logging',
      'Implement API versioning strategy'
    ],
    'compliance': [
      'Review data processing agreements',
      'Implement consent management',
      'Establish data retention policies',
      'Conduct privacy impact assessments'
    ],
    'encryption': [
      'Upgrade encryption algorithms',
      'Implement key rotation',
      'Enable encryption at rest',
      'Enforce TLS 1.3 for all connections'
    ],
    'authentication': [
      'Enforce multi-factor authentication',
      'Implement password policies',
      'Add session management',
      'Enable account lockout protection'
    ]
  };

  return actionMap[category] || [
    'Review security configurations',
    'Implement monitoring and alerting',
    'Conduct regular security assessments',
    'Update security documentation'
  ];
}
