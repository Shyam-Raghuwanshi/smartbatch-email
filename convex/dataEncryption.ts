import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

/**
 * Data Encryption and Security Management System
 * Handles encryption at rest, API security, and data protection
 */

// Encryption key management
export const generateEncryptionKey = internalMutation({
  args: {
    keyType: v.union(
      v.literal("field_encryption"),
      v.literal("data_export"),
      v.literal("api_token"),
      v.literal("webhook_signature")
    ),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // In a real implementation, this would:
    // 1. Generate a secure encryption key using crypto libraries
    // 2. Store it in a secure key management service (AWS KMS, HashiCorp Vault)
    // 3. Return only the key ID for reference

    const keyId = `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const encryptionKeyId = await ctx.db.insert("encryptionKeys", {
      keyId,
      keyType: args.keyType,
      userId: args.userId,
      isActive: true,
      createdAt: Date.now(),
      lastUsed: Date.now(),
      usageCount: 0,
      expiresAt: Date.now() + (365 * 24 * 60 * 60 * 1000), // 1 year
    });

    // Log key generation
    await ctx.db.insert("auditLogs", {
      eventType: "encryption_key_generated",
      userId: args.userId,
      resourceType: "encryption_key",
      resourceId: encryptionKeyId,
      action: "generated",
      description: `Encryption key generated for ${args.keyType}`,
      details: { keyType: args.keyType, keyId },
      riskLevel: "medium",
      tags: ["encryption", "security"],
      timestamp: Date.now(),
      createdAt: Date.now(),
    });

    return { keyId, encryptionKeyId };
  },
});

// Rotate encryption keys
export const rotateEncryptionKeys = internalMutation({
  args: {
    userId: v.id("users"),
    keyType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("encryptionKeys")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isActive"), true));

    if (args.keyType) {
      query = query.filter((q) => q.eq(q.field("keyType"), args.keyType));
    }

    const keys = await query.collect();
    let rotatedCount = 0;

    for (const key of keys) {
      // Check if key needs rotation (older than 6 months)
      const sixMonthsAgo = Date.now() - (6 * 30 * 24 * 60 * 60 * 1000);
      
      if (key.createdAt < sixMonthsAgo) {
        // Mark old key as inactive
        await ctx.db.patch(key._id, {
          isActive: false,
          rotatedAt: Date.now(),
        });

        // Generate new key
        const newKey = await ctx.runMutation(internal.dataEncryption.generateEncryptionKey, {
          keyType: key.keyType as any,
          userId: args.userId,
        });

        rotatedCount++;

        // Log rotation
        await ctx.db.insert("auditLogs", {
          eventType: "encryption_key_rotated",
          userId: args.userId,
          resourceType: "encryption_key",
          resourceId: key._id,
          action: "rotated",
          description: `Encryption key rotated for ${key.keyType}`,
          details: { 
            oldKeyId: key.keyId, 
            newKeyId: newKey.keyId,
            keyType: key.keyType 
          },
          riskLevel: "medium",
          tags: ["encryption", "security", "rotation"],
          timestamp: Date.now(),
          createdAt: Date.now(),
        });
      }
    }

    return { rotatedCount };
  },
});

// Encrypt sensitive field data
export const encryptFieldData = internalMutation({
  args: {
    data: v.string(),
    fieldType: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // In a real implementation, this would:
    // 1. Get the active encryption key for the user
    // 2. Use a proper encryption library (AES-256-GCM)
    // 3. Return encrypted data with initialization vector

    // For demonstration, we'll use a simple base64 encoding
    // NEVER use this in production!
    const encryptedData = Buffer.from(args.data).toString('base64');
    
    // Get active encryption key
    const key = await ctx.db
      .query("encryptionKeys")
      .withIndex("by_user_type", (q) => 
        q.eq("userId", args.userId).eq("keyType", "field_encryption")
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!key) {
      throw new Error("No active encryption key found");
    }

    // Update key usage
    await ctx.db.patch(key._id, {
      lastUsed: Date.now(),
      usageCount: key.usageCount + 1,
    });

    return {
      encryptedData,
      keyId: key.keyId,
      algorithm: "AES-256-GCM", // In real implementation
      iv: "mock_iv", // In real implementation, generate random IV
    };
  },
});

// Decrypt sensitive field data
export const decryptFieldData = internalMutation({
  args: {
    encryptedData: v.string(),
    keyId: v.string(),
    iv: v.optional(v.string()),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Verify key ownership and activity
    const key = await ctx.db
      .query("encryptionKeys")
      .withIndex("by_key_id", (q) => q.eq("keyId", args.keyId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (!key) {
      throw new Error("Encryption key not found or unauthorized");
    }

    // For demonstration, decode base64
    // In real implementation, use proper decryption
    const decryptedData = Buffer.from(args.encryptedData, 'base64').toString('utf8');

    // Update key usage
    await ctx.db.patch(key._id, {
      lastUsed: Date.now(),
      usageCount: key.usageCount + 1,
    });

    return { decryptedData };
  },
});

// Secure API endpoint validation
export const validateSecureEndpoint = internalQuery({
  args: {
    endpoint: v.string(),
    method: v.string(),
    headers: v.record(v.string(), v.string()),
    body: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const validationResults = {
      isValid: true,
      securityIssues: [],
      recommendations: [],
    };

    // Check for HTTPS
    if (!args.endpoint.startsWith('https://')) {
      validationResults.isValid = false;
      validationResults.securityIssues.push("Endpoint must use HTTPS");
      validationResults.recommendations.push("Update endpoint to use HTTPS protocol");
    }

    // Check for proper authentication headers
    const authHeader = args.headers['Authorization'] || args.headers['authorization'];
    if (!authHeader) {
      validationResults.securityIssues.push("Missing authentication header");
      validationResults.recommendations.push("Include proper Authorization header");
    } else if (!authHeader.startsWith('Bearer ') && !authHeader.startsWith('Basic ')) {
      validationResults.securityIssues.push("Invalid authentication format");
      validationResults.recommendations.push("Use Bearer token or Basic authentication");
    }

    // Check for content type on POST/PUT requests
    if (['POST', 'PUT', 'PATCH'].includes(args.method.toUpperCase())) {
      const contentType = args.headers['Content-Type'] || args.headers['content-type'];
      if (!contentType) {
        validationResults.securityIssues.push("Missing Content-Type header");
        validationResults.recommendations.push("Specify Content-Type header");
      }
    }

    // Check for user agent
    const userAgent = args.headers['User-Agent'] || args.headers['user-agent'];
    if (!userAgent) {
      validationResults.securityIssues.push("Missing User-Agent header");
      validationResults.recommendations.push("Include identifying User-Agent header");
    }

    // Check for potentially sensitive data in URL
    if (args.endpoint.includes('password') || args.endpoint.includes('secret') || args.endpoint.includes('key')) {
      validationResults.securityIssues.push("Sensitive data in URL");
      validationResults.recommendations.push("Move sensitive data to request body or headers");
    }

    if (validationResults.securityIssues.length > 0) {
      validationResults.isValid = false;
    }

    return validationResults;
  },
});

// Enhanced rate limiting with IP tracking
export const enhancedRateLimit = internalMutation({
  args: {
    identifier: v.string(), // API key, user ID, or IP address
    identifierType: v.union(
      v.literal("api_key"),
      v.literal("user_id"),
      v.literal("ip_address")
    ),
    endpoint: v.string(),
    requestCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    const requestCount = args.requestCount || 1;

    // Get rate limit configuration based on identifier type
    const rateLimits = getRateLimitsForIdentifier(args.identifierType);

    // Check recent requests
    const recentRequests = await ctx.db
      .query("rateLimitLogs")
      .withIndex("by_identifier_endpoint", (q) => 
        q.eq("identifier", args.identifier).eq("endpoint", args.endpoint)
      )
      .filter((q) => q.gte(q.field("timestamp"), now - day))
      .collect();

    // Count requests in different time windows
    const requestsLastMinute = recentRequests.filter(r => r.timestamp >= now - minute).length;
    const requestsLastHour = recentRequests.filter(r => r.timestamp >= now - hour).length;
    const requestsLastDay = recentRequests.filter(r => r.timestamp >= now - day).length;

    // Check rate limits
    const violations = [];
    if (requestsLastMinute + requestCount > rateLimits.perMinute) {
      violations.push(`Rate limit exceeded: ${requestsLastMinute + requestCount}/${rateLimits.perMinute} per minute`);
    }
    if (requestsLastHour + requestCount > rateLimits.perHour) {
      violations.push(`Rate limit exceeded: ${requestsLastHour + requestCount}/${rateLimits.perHour} per hour`);
    }
    if (requestsLastDay + requestCount > rateLimits.perDay) {
      violations.push(`Rate limit exceeded: ${requestsLastDay + requestCount}/${rateLimits.perDay} per day`);
    }

    if (violations.length > 0) {
      // Log rate limit violation
      await ctx.db.insert("auditLogs", {
        eventType: "rate_limit_exceeded",
        resourceType: "api_request",
        action: "blocked",
        description: "Request blocked due to rate limit",
        details: {
          identifier: args.identifier,
          identifierType: args.identifierType,
          endpoint: args.endpoint,
          violations,
          requestCounts: {
            lastMinute: requestsLastMinute,
            lastHour: requestsLastHour,
            lastDay: requestsLastDay,
          }
        },
        riskLevel: "medium",
        tags: ["rate_limit", "security"],
        timestamp: now,
        createdAt: now,
      });

      return {
        allowed: false,
        violations,
        retryAfter: calculateRetryAfter(violations, rateLimits),
        currentUsage: {
          minute: requestsLastMinute,
          hour: requestsLastHour,
          day: requestsLastDay,
        },
        limits: rateLimits,
      };
    }

    // Log successful request
    await ctx.db.insert("rateLimitLogs", {
      identifier: args.identifier,
      identifierType: args.identifierType,
      endpoint: args.endpoint,
      requestCount,
      timestamp: now,
      createdAt: now,
    });

    return {
      allowed: true,
      currentUsage: {
        minute: requestsLastMinute + requestCount,
        hour: requestsLastHour + requestCount,
        day: requestsLastDay + requestCount,
      },
      limits: rateLimits,
    };
  },
});

// Data masking for logs and exports
export const maskSensitiveData = internalMutation({
  args: {
    data: v.record(v.string(), v.any()),
    maskingRules: v.array(v.object({
      field: v.string(),
      maskType: v.union(
        v.literal("email"),
        v.literal("phone"),
        v.literal("full"),
        v.literal("partial")
      ),
    })),
  },
  handler: async (ctx, args) => {
    const maskedData = { ...args.data };

    for (const rule of args.maskingRules) {
      if (maskedData[rule.field]) {
        maskedData[rule.field] = applyMask(maskedData[rule.field], rule.maskType);
      }
    }

    return maskedData;
  },
});

// Secure webhook signature validation
export const validateWebhookSignature = internalQuery({
  args: {
    payload: v.string(),
    signature: v.string(),
    secret: v.string(),
    algorithm: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // In a real implementation, use proper HMAC validation
    // This is a simplified version for demonstration
    
    const algorithm = args.algorithm || 'sha256';
    
    // Expected signature format: "sha256=<hash>"
    const expectedSignature = `${algorithm}=${Buffer.from(args.payload + args.secret).toString('base64')}`;
    
    const isValid = expectedSignature === args.signature;
    
    if (!isValid) {
      // Log invalid signature attempt
      await ctx.db.insert("auditLogs", {
        eventType: "webhook_signature_invalid",
        resourceType: "webhook",
        action: "validation_failed",
        description: "Invalid webhook signature detected",
        details: {
          providedSignature: args.signature,
          algorithm,
          payloadLength: args.payload.length,
        },
        riskLevel: "high",
        tags: ["webhook", "security", "authentication"],
        timestamp: Date.now(),
        createdAt: Date.now(),
      });
    }

    return { isValid };
  },
});

// Get encryption status dashboard
export const getEncryptionDashboard = query({
  args: {},
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    // Get encryption keys
    const encryptionKeys = await ctx.db
      .query("encryptionKeys")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const keyStats = {
      total: encryptionKeys.length,
      active: encryptionKeys.filter(k => k.isActive).length,
      expired: encryptionKeys.filter(k => k.expiresAt < Date.now()).length,
      needsRotation: encryptionKeys.filter(k => 
        k.isActive && k.createdAt < Date.now() - (6 * 30 * 24 * 60 * 60 * 1000)
      ).length,
    };

    // Get rate limit logs for security overview
    const rateLimitLogs = await ctx.db
      .query("rateLimitLogs")
      .filter((q) => q.gte(q.field("timestamp"), Date.now() - (24 * 60 * 60 * 1000)))
      .collect();

    const securityMetrics = {
      apiRequests24h: rateLimitLogs.length,
      uniqueEndpoints: new Set(rateLimitLogs.map(log => log.endpoint)).size,
      blockedRequests: await getBlockedRequestsCount(ctx, user._id),
    };

    return {
      keyStats,
      securityMetrics,
      recommendations: generateSecurityRecommendations(keyStats, securityMetrics),
    };
  },
});

// Helper functions
function getRateLimitsForIdentifier(identifierType: string) {
  const limits = {
    api_key: { perMinute: 100, perHour: 2000, perDay: 20000 },
    user_id: { perMinute: 50, perHour: 1000, perDay: 10000 },
    ip_address: { perMinute: 20, perHour: 200, perDay: 2000 },
  };

  return limits[identifierType as keyof typeof limits] || limits.ip_address;
}

function calculateRetryAfter(violations: string[], rateLimits: any): number {
  // Return retry after in seconds
  if (violations.some(v => v.includes('per minute'))) {
    return 60; // Retry after 1 minute
  }
  if (violations.some(v => v.includes('per hour'))) {
    return 3600; // Retry after 1 hour
  }
  return 86400; // Retry after 1 day
}

function applyMask(value: string, maskType: string): string {
  switch (maskType) {
    case 'email':
      const [local, domain] = value.split('@');
      if (!local || !domain) return '***@***.***';
      return `${local.charAt(0)}***@${domain}`;
    
    case 'phone':
      return value.replace(/\d(?=\d{4})/g, '*');
    
    case 'full':
      return '*'.repeat(value.length);
    
    case 'partial':
      if (value.length <= 4) return '*'.repeat(value.length);
      return value.substring(0, 2) + '*'.repeat(value.length - 4) + value.substring(value.length - 2);
    
    default:
      return value;
  }
}

async function getBlockedRequestsCount(ctx: any, userId: Id<"users">): Promise<number> {
  const blockedLogs = await ctx.db
    .query("auditLogs")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .filter((q) => q.eq(q.field("eventType"), "rate_limit_exceeded"))
    .filter((q) => q.gte(q.field("timestamp"), Date.now() - (24 * 60 * 60 * 1000)))
    .collect();

  return blockedLogs.length;
}

function generateSecurityRecommendations(keyStats: any, securityMetrics: any): string[] {
  const recommendations = [];

  if (keyStats.needsRotation > 0) {
    recommendations.push(`Rotate ${keyStats.needsRotation} encryption keys older than 6 months`);
  }

  if (keyStats.expired > 0) {
    recommendations.push(`Remove ${keyStats.expired} expired encryption keys`);
  }

  if (securityMetrics.blockedRequests > 100) {
    recommendations.push("High number of blocked requests detected - review API usage patterns");
  }

  if (keyStats.active === 0) {
    recommendations.push("No active encryption keys found - generate encryption keys for data protection");
  }

  return recommendations;
}
