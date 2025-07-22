"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import crypto from "crypto";

// OAuth configuration for different providers
const OAUTH_CONFIGS = {
  google: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive.readonly",
      "email",
      "profile"
    ]
  },
  salesforce: {
    authUrl: "https://login.salesforce.com/services/oauth2/authorize",
    tokenUrl: "https://login.salesforce.com/services/oauth2/token",
    scopes: ["api", "refresh_token", "offline_access"]
  },
  hubspot: {
    authUrl: "https://app.hubspot.com/oauth/authorize",
    tokenUrl: "https://api.hubapi.com/oauth/v1/token",
    scopes: [
      "contacts",
      "content",
      "reports",
      "social",
      "automation",
      "forms",
      "files",
      "hubdb",
      "integration-sync"
    ]
  },
  microsoft: {
    authUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    scopes: [
      "https://graph.microsoft.com/Files.ReadWrite",
      "https://graph.microsoft.com/User.Read",
      "offline_access"
    ]
  }
};

export const initiateOAuthFlow = action({
  args: {
    provider: v.string(),
    redirectUri: v.string(),
    state: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const config = OAUTH_CONFIGS[args.provider as keyof typeof OAUTH_CONFIGS];
    if (!config) {
      throw new Error(`Unsupported OAuth provider: ${args.provider}`);
    }

    // Generate state parameter for CSRF protection
    const state = args.state || crypto.randomBytes(32).toString("hex");
    
    // Store OAuth state in database
    const oauthStateId = await ctx.runMutation(internal.oauth.storeOAuthState, {
      provider: args.provider,
      state,
      redirectUri: args.redirectUri,
      expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
    });

    // Get client credentials from environment
    const clientId = process.env[`${args.provider.toUpperCase()}_CLIENT_ID`];
    if (!clientId) {
      throw new Error(`Missing client ID for ${args.provider}`);
    }

    // Build authorization URL
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: args.redirectUri,
      response_type: "code",
      scope: config.scopes.join(" "),
      state,
      access_type: "offline", // For refresh tokens
      prompt: "consent"
    });

    return {
      authUrl: `${config.authUrl}?${params.toString()}`,
      state,
      oauthStateId
    };
  }
});

export const exchangeCodeForTokens = action({
  args: {
    provider: v.string(),
    code: v.string(),
    state: v.string(),
    redirectUri: v.string()
  },
  handler: async (ctx, args) => {
    // Verify OAuth state
    const oauthState = await ctx.runQuery(internal.oauth.getOAuthState, {
      state: args.state,
      provider: args.provider
    });

    if (!oauthState || oauthState.used || oauthState.expiresAt < Date.now()) {
      throw new Error("Invalid or expired OAuth state");
    }

    // Mark state as used
    await ctx.runMutation(internal.oauth.markOAuthStateAsUsed, {
      id: oauthState._id
    });

    const config = OAUTH_CONFIGS[args.provider as keyof typeof OAUTH_CONFIGS];
    const clientId = process.env[`${args.provider.toUpperCase()}_CLIENT_ID`];
    const clientSecret = process.env[`${args.provider.toUpperCase()}_CLIENT_SECRET`];

    if (!clientId || !clientSecret) {
      throw new Error(`Missing credentials for ${args.provider}`);
    }

    // Exchange code for tokens
    const tokenResponse = await fetch(config.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: args.code,
        grant_type: "authorization_code",
        redirect_uri: args.redirectUri
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Token exchange failed: ${errorText}`);
    }

    const tokens = await tokenResponse.json();

    // Get user info from the provider
    const userInfo = await getUserInfo(args.provider, tokens.access_token);

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
      tokenType: tokens.token_type,
      scope: tokens.scope,
      userInfo
    };
  }
});

export const refreshAccessToken = action({
  args: {
    provider: v.string(),
    refreshToken: v.string()
  },
  handler: async (ctx, args) => {
    const config = OAUTH_CONFIGS[args.provider as keyof typeof OAUTH_CONFIGS];
    const clientId = process.env[`${args.provider.toUpperCase()}_CLIENT_ID`];
    const clientSecret = process.env[`${args.provider.toUpperCase()}_CLIENT_SECRET`];

    if (!clientId || !clientSecret) {
      throw new Error(`Missing credentials for ${args.provider}`);
    }

    const response = await fetch(config.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: args.refreshToken,
        grant_type: "refresh_token"
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token refresh failed: ${errorText}`);
    }

    const tokens = await response.json();
    
    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || args.refreshToken, // Some providers don't return new refresh token
      expiresIn: tokens.expires_in,
      tokenType: tokens.token_type,
      scope: tokens.scope
    };
  }
});

export const validateAccessToken = action({
  args: {
    provider: v.string(),
    accessToken: v.string()
  },
  handler: async (ctx, args) => {
    try {
      const userInfo = await getUserInfo(args.provider, args.accessToken);
      return { valid: true, userInfo };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }
});

export const revokeOAuthToken = action({
  args: {
    provider: v.string(),
    accessToken: v.string()
  },
  handler: async (ctx, args) => {
    const revokeUrls = {
      google: "https://oauth2.googleapis.com/revoke",
      salesforce: "https://login.salesforce.com/services/oauth2/revoke",
      hubspot: null, // HubSpot doesn't have a revoke endpoint
      microsoft: "https://graph.microsoft.com/v1.0/me/revokeSignInSessions"
    };

    const url = revokeUrls[args.provider as keyof typeof revokeUrls];
    if (!url) {
      return { success: false, message: `Revoke not supported for ${args.provider}` };
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          token: args.accessToken
        })
      });

      return { 
        success: response.ok,
        message: response.ok ? "Token revoked successfully" : "Failed to revoke token"
      };
    } catch (error) {
      return { 
        success: false, 
        message: `Error revoking token: ${error.message}` 
      };
    }
  }
});

async function getUserInfo(provider: string, accessToken: string) {
  const userInfoUrls = {
    google: "https://www.googleapis.com/oauth2/v2/userinfo",
    salesforce: "https://login.salesforce.com/services/oauth2/userinfo",
    hubspot: "https://api.hubapi.com/oauth/v1/access-tokens/" + accessToken,
    microsoft: "https://graph.microsoft.com/v1.0/me"
  };

  const url = userInfoUrls[provider as keyof typeof userInfoUrls];
  if (!url) {
    throw new Error(`Unsupported provider: ${provider}`);
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to get user info: ${response.statusText}`);
  }

  return await response.json();
}
