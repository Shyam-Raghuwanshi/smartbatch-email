import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const storeOAuthState = mutation({
  args: {
    provider: v.string(),
    state: v.string(),
    redirectUri: v.string(),
    expiresAt: v.number()
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("oauthStates", {
      provider: args.provider,
      state: args.state,
      redirectUri: args.redirectUri,
      expiresAt: args.expiresAt,
      used: false,
      createdAt: Date.now()
    });
  }
});

export const getOAuthState = query({
  args: {
    state: v.string(),
    provider: v.string()
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("oauthStates")
      .filter(q => q.eq(q.field("state"), args.state))
      .filter(q => q.eq(q.field("provider"), args.provider))
      .first();
  }
});

export const markOAuthStateAsUsed = mutation({
  args: {
    id: v.id("oauthStates")
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      used: true,
      usedAt: Date.now()
    });
  }
});

// Clean up expired OAuth states
export const cleanupExpiredOAuthStates = mutation({
  args: {},
  handler: async (ctx) => {
    const expiredStates = await ctx.db
      .query("oauthStates")
      .filter(q => q.lt(q.field("expiresAt"), Date.now()))
      .collect();

    for (const state of expiredStates) {
      await ctx.db.delete(state._id);
    }

    return { deletedCount: expiredStates.length };
  }
});
