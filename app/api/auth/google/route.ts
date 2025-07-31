import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { OAUTH_COOKIE_NAME } from '@/lib/google/config';

// Verify environment variables are set
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
  throw new Error('Missing required Google OAuth environment variables');
}

export async function GET(req: NextRequest) {
  try {
    // Get state from query parameter or generate a new one
    const { searchParams } = new URL(req.url);
    const state = searchParams.get('state') || Math.random().toString(36).substring(7);
    
    const oauthParams = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      redirect_uri: process.env.NODE_ENV === 'production' 
        ? process.env.GOOGLE_REDIRECT_URI!
        : 'http://localhost:3000/auth/google/callback',
      response_type: 'code',
      scope: [
        'https://www.googleapis.com/auth/spreadsheets.readonly',
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/drive.file'
      ].join(' '),
      access_type: 'offline',
      state: state,
      prompt: 'consent',
      include_granted_scopes: 'true'
    });

    const url = `https://accounts.google.com/o/oauth2/v2/auth?${oauthParams.toString()}`;

    // Create response with the OAuth URL
    const response = Response.json({ url });
    
    // Set the state cookie in the response headers
    const cookieValue = `${OAUTH_COOKIE_NAME}=${state}; Path=/; HttpOnly; ${
      process.env.NODE_ENV === 'production' ? 'Secure;' : ''
    } SameSite=Lax; Max-Age=600`;
    
    response.headers.set('Set-Cookie', cookieValue);

    return response;
  } catch (error) {
    console.error('OAuth URL generation error:', error);
    return Response.json({ error: 'Failed to generate OAuth URL' }, { status: 500 });
  }
}

// export async function GET(req: NextRequest) {
//   const oauthManager = GoogleOAuthManager.getInstance();
//   const { url, state } = oauthManager.generateAuthUrl();

//   // Store state in cookie for validation
//   cookies().set(OAUTH_COOKIE_NAME, state, {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === 'production',
//     sameSite: 'lax',
//     maxAge: 600, // 10 minutes
//   });

//   return Response.json({ url });
// }
