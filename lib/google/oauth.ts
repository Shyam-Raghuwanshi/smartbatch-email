import { nanoid } from 'nanoid';
import { GOOGLE_CONFIG, GOOGLE_APIS, OAUTH_STATE_TIMEOUT } from './config';

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export class GoogleOAuthManager {
  private static instance: GoogleOAuthManager;
  private tokenCache: Map<string, { token: string; expiresAt: number }>;
  private rateLimits: Map<string, { count: number; resetAt: number }>;

  private constructor() {
    this.tokenCache = new Map();
    this.rateLimits = new Map();
  }

  static getInstance(): GoogleOAuthManager {
    if (!GoogleOAuthManager.instance) {
      GoogleOAuthManager.instance = new GoogleOAuthManager();
    }
    return GoogleOAuthManager.instance;
  }

  generateAuthUrl(): { url: string; state: string } {
    const state = nanoid();
    const searchParams = new URLSearchParams({
      client_id: GOOGLE_CONFIG.clientId,
      redirect_uri: GOOGLE_CONFIG.redirectUri,
      response_type: 'code',
      scope: GOOGLE_CONFIG.scopes.join(' '),
      access_type: 'offline',
      state,
      prompt: 'consent',
    });

    return {
      url: `${GOOGLE_APIS.oauth2}?${searchParams.toString()}`,
      state,
    };
  }

  async exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse> {
    const params = new URLSearchParams({
      client_id: GOOGLE_CONFIG.clientId,
      client_secret: GOOGLE_CONFIG.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: GOOGLE_CONFIG.redirectUri,
    });

    const response = await fetch(GOOGLE_APIS.token, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error(`Failed to exchange code for tokens: ${response.statusText}`);
    }

    return response.json();
  }

  async refreshAccessToken(refreshToken: string): Promise<string> {
    const params = new URLSearchParams({
      client_id: GOOGLE_CONFIG.clientId,
      client_secret: GOOGLE_CONFIG.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });

    const response = await fetch(GOOGLE_APIS.token, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh token: ${response.statusText}`);
    }

    const data = await response.json();
    return data.access_token;
  }

  cacheToken(userId: string, token: string, expiresIn: number): void {
    this.tokenCache.set(userId, {
      token,
      expiresAt: Date.now() + expiresIn * 1000,
    });
  }

  getCachedToken(userId: string): string | null {
    const cached = this.tokenCache.get(userId);
    if (!cached) return null;
    if (cached.expiresAt < Date.now()) {
      this.tokenCache.delete(userId);
      return null;
    }
    return cached.token;
  }

  async checkRateLimit(userId: string, limit: number = 100, windowMs: number = 60000): Promise<boolean> {
    const now = Date.now();
    const userRateLimit = this.rateLimits.get(userId) || { count: 0, resetAt: now + windowMs };

    if (now > userRateLimit.resetAt) {
      userRateLimit.count = 0;
      userRateLimit.resetAt = now + windowMs;
    }

    if (userRateLimit.count >= limit) {
      return false;
    }

    userRateLimit.count++;
    this.rateLimits.set(userId, userRateLimit);
    return true;
  }

  clearExpiredRateLimits(): void {
    const now = Date.now();
    for (const [userId, limit] of this.rateLimits.entries()) {
      if (now > limit.resetAt) {
        this.rateLimits.delete(userId);
      }
    }
  }
}
