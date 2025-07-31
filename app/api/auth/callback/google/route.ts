import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { GoogleOAuthManager } from '@/lib/google/oauth';
import { OAUTH_COOKIE_NAME } from '@/lib/google/config';

export async function GET(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const storedState = cookieStore.get(OAUTH_COOKIE_NAME)?.value;
    const searchParams = req.nextUrl.searchParams;
    const state = searchParams.get('state');
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      throw new Error(`OAuth error: ${error}`);
    }

    if (!state || !storedState || state !== storedState) {
      throw new Error('Invalid OAuth state');
    }

    if (!code) {
      throw new Error('No authorization code received');
    }

    const oauthManager = GoogleOAuthManager.getInstance();
    const tokens = await oauthManager.exchangeCodeForTokens(code);

    // Store tokens securely (implement your token storage strategy)
    // For example, you might want to store them in your database
    // associated with the user's session

    cookieStore.delete(OAUTH_COOKIE_NAME);

    // Redirect back to the contacts page with success message
    return Response.redirect(new URL('/contacts?integration=success', req.url));
  } catch (error) {
    console.error('OAuth callback error:', error);
    return Response.redirect(
      new URL('/contacts?integration=error', req.url)
    );
  }
}
