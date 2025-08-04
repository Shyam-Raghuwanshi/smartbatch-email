"use client";

import { Loader2 } from 'lucide-react';

interface QueryFallbackProps {
  isLoading?: boolean;
  error?: any;
  data?: any;
  children: (data: any) => React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
}

export function QueryFallback({
  isLoading,
  error,
  data,
  children,
  loadingComponent,
  errorComponent
}: QueryFallbackProps) {
  if (error) {
    return errorComponent || (
      <div className="flex items-center justify-center p-4 text-red-600">
        <span>Error loading data</span>
      </div>
    );
  }

  if (isLoading || data === undefined) {
    return loadingComponent || (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  return <>{children(data)}</>;
}
