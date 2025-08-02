import { NextRequest } from 'next/server';

async function isTokenValid(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`
    );
    return response.ok;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { accessToken, refreshToken } = await req.json();

    if (!accessToken) {
      return Response.json(
        { error: 'Access token is required' },
        { status: 400 }
      );
    }

    // Check token validity
    const isValid = await isTokenValid(accessToken);

    return Response.json({
      isValid,
      hasRefreshToken: !!refreshToken,
      canRefresh: !!refreshToken && !isValid,
    });
  } catch (error) {
    console.error('Token status check error:', error);
    return Response.json(
      { error: 'Failed to check token status' },
      { status: 500 }
    );
  }
}
