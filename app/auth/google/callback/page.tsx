'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function GoogleCallbackContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      console.log('Callback received:', { code: !!code, state, error });

      if (error) {
        window.opener?.postMessage({
          type: 'GOOGLE_OAUTH_ERROR',
          error,
          state
        }, window.location.origin);
        window.close();
        return;
      }

      if (!code) {
        window.opener?.postMessage({
          type: 'GOOGLE_OAUTH_ERROR',
          error: 'No authorization code received',
          state
        }, window.location.origin);
        window.close();
        return;
      }

      try {
        // Exchange code for tokens
        console.log('Exchanging code for tokens...');
        const response = await fetch('/api/auth/google/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code, state }),
        });

        if (!response.ok) {
          throw new Error('Failed to exchange code for tokens');
        }

        const tokens = await response.json();
        console.log('Tokens received, sending to parent window...');

        // Send tokens to parent window
        window.opener?.postMessage({
          type: 'GOOGLE_OAUTH_SUCCESS',
          tokens,
          state
        }, window.location.origin);
      } catch (error) {
        console.error('Callback error:', error);
        window.opener?.postMessage({
          type: 'GOOGLE_OAUTH_ERROR',
          error: error instanceof Error ? error.message : 'Failed to complete authentication',
          state
        }, window.location.origin);
      } finally {
        // Always close the popup
        window.close();
      }
    };

    // Run the callback handler immediately
    handleCallback();

    // Clean up function
    return () => {
      if (window.opener) {
        try {
          window.close();
        } catch (e) {
          console.error('Failed to close window:', e);
        }
      }
    };
  }, [searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-xl font-semibold mb-2">Completing authentication...</h1>
        <p className="text-muted-foreground">This window will close automatically.</p>
      </div>
    </div>
  );
}

export default function GoogleCallback() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-2">Loading...</h1>
          <p className="text-muted-foreground">Please wait while we process your authentication.</p>
        </div>
      </div>
    }>
      <GoogleCallbackContent />
    </Suspense>
  );
}
