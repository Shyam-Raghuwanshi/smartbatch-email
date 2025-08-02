import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { refreshToken } = await req.json();

    if (!refreshToken) {
      return Response.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error('Missing Google OAuth credentials');
      return Response.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token refresh failed:', errorText);
      return Response.json(
        { error: 'Failed to refresh access token' },
        { status: 401 }
      );
    }

    const data = await response.json();

    return Response.json({
      accessToken: data.access_token,
      expiresIn: data.expires_in,
      scope: data.scope,
      tokenType: data.token_type,
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
