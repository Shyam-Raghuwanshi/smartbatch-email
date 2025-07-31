export const GOOGLE_CONFIG = {
  clientId: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback',
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets.readonly',
    'https://www.googleapis.com/auth/drive.readonly',
  ],
};

export const GOOGLE_APIS = {
  oauth2: 'https://accounts.google.com/o/oauth2/v2/auth',
  token: 'https://oauth2.googleapis.com/token',
  sheets: 'https://sheets.googleapis.com/v4',
  drive: 'https://www.googleapis.com/drive/v3',
};

export const OAUTH_COOKIE_NAME = 'google_oauth_state';
export const OAUTH_STATE_TIMEOUT = 10 * 60 * 1000; // 10 minutes
