import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * API Key Management System
 * Handles API key creation, validation, and rate limiting
 */

// Get all API keys for a user (without exposing the actual keys)
export const getUserApiKeys = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const apiKeys = await ctx.db
      .query("apiKeys")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Return keys without sensitive information
    return apiKeys.map(key => ({
      _id: key._id,
      name: key.name,
      prefix: key.prefix,
      permissions: key.permissions,
      isActive: key.isActive,
      expiresAt: key.expiresAt,
      lastUsed: key.lastUsed,
      usageCount: key.usageCount,
      rateLimitConfig: key.rateLimitConfig,
      createdAt: key.createdAt,
      updatedAt: key.updatedAt,
    }));
  },
});

// Create a new API key
export const createApiKey = mutation({
  args: {
    name: v.string(),
    permissions: v.array(v.union(
      v.literal("read_contacts"),
      v.literal("write_contacts"),
      v.literal("read_campaigns"),
      v.literal("write_campaigns"),
      v.literal("read_analytics"),
      v.literal("send_emails"),
      v.literal("manage_webhooks"),
      v.literal("manage_integrations")
    )),
    expiresAt: v.optional(v.number()),
    rateLimitConfig: v.optional(v.object({
      requestsPerMinute: v.number(),
      requestsPerHour: v.number(),
      requestsPerDay: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    // Generate API key
    const apiKey = generateApiKey();
    const keyHash = await hashApiKey(apiKey);
    const prefix = apiKey.substring(0, 8);

    // Check for subscription limits
    const existingKeys = await ctx.db
      .query("apiKeys")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const maxKeys = getMaxApiKeysForPlan(user.subscription?.plan || "free");
    if (existingKeys.length >= maxKeys) {
      throw new Error(`Maximum number of API keys (${maxKeys}) reached for your plan`);
    }

    const defaultRateLimit = getRateLimitForPlan(user.subscription?.plan || "free");

    const apiKeyId = await ctx.db.insert("apiKeys", {
      userId: user._id,
      name: args.name,
      keyHash,
      prefix,
      permissions: args.permissions,
      isActive: true,
      expiresAt: args.expiresAt,
      usageCount: 0,
      rateLimitConfig: args.rateLimitConfig || defaultRateLimit,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Return the full API key only once
    return {
      id: apiKeyId,
      apiKey, // This is the only time the full key is returned
      prefix,
      name: args.name,
      permissions: args.permissions,
    };
  },
});

// Update API key
export const updateApiKey = mutation({
  args: {
    apiKeyId: v.id("apiKeys"),
    name: v.optional(v.string()),
    permissions: v.optional(v.array(v.union(
      v.literal("read_contacts"),
      v.literal("write_contacts"),
      v.literal("read_campaigns"),
      v.literal("write_campaigns"),
      v.literal("read_analytics"),
      v.literal("send_emails"),
      v.literal("manage_webhooks"),
      v.literal("manage_integrations")
    ))),
    isActive: v.optional(v.boolean()),
    expiresAt: v.optional(v.number()),
    rateLimitConfig: v.optional(v.object({
      requestsPerMinute: v.number(),
      requestsPerHour: v.number(),
      requestsPerDay: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const apiKey = await ctx.db.get(args.apiKeyId);
    if (!apiKey || apiKey.userId !== user._id) {
      throw new Error("API key not found");
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.permissions !== undefined) updates.permissions = args.permissions;
    if (args.isActive !== undefined) updates.isActive = args.isActive;
    if (args.expiresAt !== undefined) updates.expiresAt = args.expiresAt;
    if (args.rateLimitConfig !== undefined) updates.rateLimitConfig = args.rateLimitConfig;

    await ctx.db.patch(args.apiKeyId, updates);
    return args.apiKeyId;
  },
});

// Delete API key
export const deleteApiKey = mutation({
  args: {
    apiKeyId: v.id("apiKeys"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const apiKey = await ctx.db.get(args.apiKeyId);
    if (!apiKey || apiKey.userId !== user._id) {
      throw new Error("API key not found");
    }

    await ctx.db.delete(args.apiKeyId);
    return true;
  },
});

// Validate API key (internal function for API endpoints)
export const validateApiKey = internalMutation({
  args: {
    apiKey: v.string(),
    requiredPermission: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const keyHash = await hashApiKey(args.apiKey);
      const prefix = args.apiKey.substring(0, 8);

      const apiKeyRecord = await ctx.db
        .query("apiKeys")
        .withIndex("by_key_hash", (q) => q.eq("keyHash", keyHash))
        .filter((q) => q.eq(q.field("prefix"), prefix))
        .first();

      if (!apiKeyRecord) {
        return { valid: false, error: "Invalid API key" };
      }

      if (!apiKeyRecord.isActive) {
        return { valid: false, error: "API key is inactive" };
      }

      if (apiKeyRecord.expiresAt && apiKeyRecord.expiresAt < Date.now()) {
        return { valid: false, error: "API key has expired" };
      }

      if (!apiKeyRecord.permissions.includes(args.requiredPermission as any)) {
        return { valid: false, error: "Insufficient permissions" };
      }

      // Check rate limits
      const rateLimitResult = await checkRateLimit(ctx, apiKeyRecord);
      if (!rateLimitResult.allowed) {
        return { valid: false, error: rateLimitResult.error };
      }

      // Update usage stats
      await ctx.db.patch(apiKeyRecord._id, {
        lastUsed: Date.now(),
        usageCount: apiKeyRecord.usageCount + 1,
      });

      // Get user info
      const user = await ctx.db.get(apiKeyRecord.userId);
      if (!user) {
        return { valid: false, error: "User not found" };
      }

      return {
        valid: true,
        userId: apiKeyRecord.userId,
        permissions: apiKeyRecord.permissions,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          subscription: user.subscription,
        },
      };

    } catch (error) {
      return { valid: false, error: "API key validation failed" };
    }
  },
});

// Regenerate API key
export const regenerateApiKey = mutation({
  args: {
    apiKeyId: v.id("apiKeys"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const apiKeyRecord = await ctx.db.get(args.apiKeyId);
    if (!apiKeyRecord || apiKeyRecord.userId !== user._id) {
      throw new Error("API key not found");
    }

    // Generate new API key
    const newApiKey = generateApiKey();
    const newKeyHash = await hashApiKey(newApiKey);
    const newPrefix = newApiKey.substring(0, 8);

    await ctx.db.patch(args.apiKeyId, {
      keyHash: newKeyHash,
      prefix: newPrefix,
      usageCount: 0, // Reset usage count
      updatedAt: Date.now(),
    });

    // Return the new API key (only time it's returned in full)
    return {
      apiKey: newApiKey,
      prefix: newPrefix,
    };
  },
});

// Get API key usage statistics
export const getApiKeyUsage = query({
  args: {
    apiKeyId: v.optional(v.id("apiKeys")),
    timeRange: v.optional(v.string()), // "24h", "7d", "30d"
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    let apiKeys;
    if (args.apiKeyId) {
      const apiKey = await ctx.db.get(args.apiKeyId);
      if (!apiKey || apiKey.userId !== user._id) {
        throw new Error("API key not found");
      }
      apiKeys = [apiKey];
    } else {
      apiKeys = await ctx.db
        .query("apiKeys")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();
    }

    // TODO: Implement detailed usage tracking with timestamps
    // For now, return basic usage stats
    return apiKeys.map(key => ({
      id: key._id,
      name: key.name,
      prefix: key.prefix,
      usageCount: key.usageCount,
      lastUsed: key.lastUsed,
      rateLimitConfig: key.rateLimitConfig,
    }));
  },
});

// Helper functions
function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'sb_';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function hashApiKey(apiKey: string): Promise<string> {
  // In a real implementation, use a proper hashing function like bcrypt or scrypt
  // This is a simplified version for demonstration
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function getMaxApiKeysForPlan(plan: string): number {
  switch (plan) {
    case "free": return 2;
    case "pro": return 10;
    case "enterprise": return 50;
    default: return 1;
  }
}

function getRateLimitForPlan(plan: string) {
  switch (plan) {
    case "free":
      return {
        requestsPerMinute: 10,
        requestsPerHour: 100,
        requestsPerDay: 1000,
      };
    case "pro":
      return {
        requestsPerMinute: 100,
        requestsPerHour: 2000,
        requestsPerDay: 20000,
      };
    case "enterprise":
      return {
        requestsPerMinute: 500,
        requestsPerHour: 10000,
        requestsPerDay: 100000,
      };
    default:
      return {
        requestsPerMinute: 5,
        requestsPerHour: 50,
        requestsPerDay: 500,
      };
  }
}

async function checkRateLimit(ctx: any, apiKey: any): Promise<{ allowed: boolean; error?: string }> {
  // TODO: Implement proper rate limiting with Redis or similar
  // This is a simplified version that doesn't track actual request rates
  
  const now = Date.now();
  const oneMinute = 60 * 1000;
  const oneHour = 60 * oneMinute;
  const oneDay = 24 * oneHour;

  // For now, just check if the key was used too recently
  if (apiKey.lastUsed && (now - apiKey.lastUsed) < 1000) { // 1 second minimum
    return { allowed: false, error: "Rate limit exceeded" };
  }

  return { allowed: true };
}
