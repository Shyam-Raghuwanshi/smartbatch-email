import { mutation, query, internalQuery } from "./_generated/server";
import { v } from "convex/values";

// Helper to get current authenticated user
export const getUserId = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
      
    return user?._id;
  },
});

export const getCurrentUser = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
  },
});

// Helper to ensure user exists in database (called after Clerk authentication)
export const ensureUser = mutation({
  args: {
    email: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    try {
      // Check if user already exists
      const existingUser = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .unique();

      if (existingUser) {
        // Update user info if needed
        if (existingUser.email !== args.email || existingUser.name !== args.name) {
          await ctx.db.patch(existingUser._id, {
            email: args.email,
            name: args.name,
          });
        }
        return existingUser._id;
      }

      // Create new user
      return await ctx.db.insert("users", {
        clerkId: identity.subject,
        email: args.email,
        name: args.name,
        createdAt: Date.now(),
        subscription: {
          plan: "free",
          status: "active",
        },
      });
    } catch (error) {
      console.error("Error in ensureUser:", error);
      throw new Error(`Failed to sync user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Helper function to require authentication and return user
export const requireAuth = async (ctx: any) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
    .unique();

  if (!user) {
    throw new Error("User not found in database");
  }

  return { identity, user };
};

// Helper function to verify user owns a resource
export const verifyOwnership = async (ctx: any, resourceUserId: string) => {
  const { user } = await requireAuth(ctx);

  if (user._id !== resourceUserId) {
    throw new Error("Unauthorized: You don't own this resource");
  }

  return user;
};

// Internal helper to get user by ID
export const getUserById = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});
