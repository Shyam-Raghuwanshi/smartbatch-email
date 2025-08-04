"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class AuthErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if it's an authentication-related error
    const isAuthError = error.message.includes('Not authenticated') ||
                       error.message.includes('User not found') ||
                       error.message.includes('Failed to sync user');
    
    return {
      hasError: isAuthError,
      error: isAuthError ? error : undefined
    };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    // Force a page reload to reinitialize authentication
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full text-center p-6">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 mb-4">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Authentication Issue
            </h1>
            <p className="text-gray-600 mb-6">
              We're having trouble loading your account. This usually resolves quickly.
            </p>
            
            <div className="space-y-3">
              <Button onClick={this.handleRetry} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/'} 
                className="w-full"
              >
                Go to Home
              </Button>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="text-sm text-gray-500 cursor-pointer">
                  Technical Details
                </summary>
                <pre className="mt-2 text-xs text-gray-600 bg-gray-100 p-2 rounded overflow-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
