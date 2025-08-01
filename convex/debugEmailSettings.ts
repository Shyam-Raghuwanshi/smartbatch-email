import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Debug function to check email settings for a user
 */
export const debugEmailSettings = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
    
    if (!user) {
      return { error: "User not found", clerkId: args.clerkId };
    }

    // Get all email settings for this user
    const allEmailSettings = await ctx.db
      .query("emailSettings")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Get default email settings
    const defaultEmailSettings = await ctx.db
      .query("emailSettings")
      .withIndex("by_user_default", (q) => q.eq("userId", user._id).eq("isDefault", true))
      .first();

    // Get active default email settings
    const activeDefaultSettings = defaultEmailSettings && defaultEmailSettings.isActive 
      ? defaultEmailSettings 
      : null;

    return {
      user: {
        id: user._id,
        clerkId: user.clerkId,
        email: user.email,
        name: user.name,
      },
      emailSettings: {
        total: allEmailSettings.length,
        all: allEmailSettings.map(setting => ({
          id: setting._id,
          name: setting.name,
          provider: setting.provider,
          isDefault: setting.isDefault,
          isActive: setting.isActive,
          domain: setting.configuration.domain,
          defaultFromEmail: setting.configuration.defaultFromEmail,
          hasApiKey: !!setting.configuration.apiKey,
          apiKeyLength: setting.configuration.apiKey?.length || 0,
        })),
        default: defaultEmailSettings ? {
          id: defaultEmailSettings._id,
          name: defaultEmailSettings.name,
          isActive: defaultEmailSettings.isActive,
          domain: defaultEmailSettings.configuration.domain,
          defaultFromEmail: defaultEmailSettings.configuration.defaultFromEmail,
        } : null,
        activeDefault: activeDefaultSettings ? {
          id: activeDefaultSettings._id,
          name: activeDefaultSettings.name,
          domain: activeDefaultSettings.configuration.domain,
          defaultFromEmail: activeDefaultSettings.configuration.defaultFromEmail,
        } : null,
      },
      hasValidEmailSettings: !!activeDefaultSettings,
    };
  },
});
