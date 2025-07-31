import { NextRequest } from 'next/server';
import { headers } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    
    if (!code) {
      return new Response('No code provided', { status: 400 });
    }

    // Exchange the code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: process.env.NODE_ENV === 'production' 
          ? process.env.GOOGLE_REDIRECT_URI!
          : 'http://localhost:3000/auth/google/callback',
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Token exchange error:', error);
      return Response.redirect(`${process.env.NEXTAUTH_URL}/error?error=oauth_failed`);
    }

    const tokens = await tokenResponse.json();

    // Here you would typically store the tokens securely
    // For now, we'll just redirect back to the app with success
    return Response.redirect(`${process.env.NEXTAUTH_URL}/contacts?integration=success`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    return Response.redirect(`${process.env.NEXTAUTH_URL}/error?error=oauth_failed`);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { code, state } = await req.json();
    
    if (!code) {
      return Response.json({ error: 'No code provided' }, { status: 400 });
    }

    // Exchange the code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: process.env.NODE_ENV === 'production' 
          ? process.env.GOOGLE_REDIRECT_URI!
          : 'http://localhost:3000/auth/google/callback',
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Token exchange error:', error);
      return Response.json({ error: 'Failed to exchange code for tokens' }, { status: 400 });
    }

    const tokens = await tokenResponse.json();

    return Response.json({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
      tokenType: tokens.token_type
    });
  } catch (error) {
    console.error('OAuth callback error:', error);
    return Response.json({ error: 'Failed to process OAuth callback' }, { status: 500 });
  }
}
