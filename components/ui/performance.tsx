"use client";

import React, { Suspense, lazy, memo, useCallback, useMemo, useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

// Performance monitoring hook
export function usePerformanceMonitor(componentName: string) {
  const [renderTime, setRenderTime] = useState(0);
  
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTimeMs = endTime - startTime;
      
      setRenderTime(renderTimeMs);
      
      if (renderTimeMs > 100) {
        console.warn(`${componentName} took ${renderTimeMs.toFixed(2)}ms to render`);
      }
      
      // Dispatch custom event for performance dashboard
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('component-render', {
          detail: { componentName, renderTime: renderTimeMs }
        }));
      }
    };
  }, [componentName]);
  
  return { renderTime };
}

// Lazy loading wrapper with fallback
export function LazyComponentWrapper({ 
  children, 
  fallback = <ComponentSkeleton />,
  minLoadTime = 0 
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  minLoadTime?: number;
}) {
  const [showContent, setShowContent] = useState(minLoadTime === 0);

  useEffect(() => {
    if (minLoadTime > 0) {
      const timer = setTimeout(() => setShowContent(true), minLoadTime);
      return () => clearTimeout(timer);
    }
  }, [minLoadTime]);

  if (!showContent) {
    return <>{fallback}</>;
  }

  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
}

// Loading skeletons
export const ComponentSkeleton = memo(() => (
  <Card className="animate-pulse">
    <CardContent className="p-6">
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-8 bg-gray-200 rounded"></div>
      </div>
    </CardContent>
  </Card>
));

export const TableSkeleton = memo(({ rows = 5 }: { rows?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/6"></div>
        <div className="h-4 bg-gray-200 rounded w-1/6"></div>
        <div className="h-4 bg-gray-200 rounded w-1/6"></div>
        <div className="h-4 bg-gray-200 rounded w-1/6"></div>
        <div className="h-8 w-8 bg-gray-200 rounded ml-auto"></div>
      </div>
    ))}
  </div>
));

export const ListSkeleton = memo(({ items = 3 }: { items?: number }) => (
  <div className="space-y-4">
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="flex items-start space-x-3 p-4 border rounded-lg animate-pulse">
        <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
        </div>
        <div className="h-6 w-16 bg-gray-200 rounded"></div>
      </div>
    ))}
  </div>
));

// Optimistic update wrapper
export function OptimisticWrapper<T>({ 
  children, 
  isLoading, 
  optimisticData, 
  actualData,
  onOptimisticUpdate
}: {
  children: (data: T, isOptimistic: boolean) => React.ReactNode;
  isLoading: boolean;
  optimisticData?: T;
  actualData?: T;
  onOptimisticUpdate?: (data: T) => void;
}) {
  const displayData = actualData || optimisticData;
  const isOptimistic = !actualData && !!optimisticData;

  if (isLoading && !displayData) {
    return <ComponentSkeleton />;
  }

  return (
    <div className={isOptimistic ? 'opacity-75 transition-opacity' : ''}>
      {displayData && children(displayData, isOptimistic)}
    </div>
  );
}

// Error boundary component
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error; retry: () => void }> },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo });
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const Fallback = this.props.fallback || DefaultErrorFallback;
      return <Fallback error={this.state.error} retry={() => this.setState({ hasError: false })} />;
    }

    return this.props.children;
  }
}

// Default error fallback
const DefaultErrorFallback = memo(({ error, retry }: { error: Error; retry: () => void }) => (
  <Alert className="border-red-200 bg-red-50">
    <AlertTriangle className="h-4 w-4 text-red-600" />
    <AlertDescription className="text-red-800">
      <div className="space-y-2">
        <p>Something went wrong: {error.message}</p>
        <Button variant="outline" size="sm" onClick={retry}>
          Try Again
        </Button>
      </div>
    </AlertDescription>
  </Alert>
));

// Network status indicator
export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [showRetry, setShowRetry] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      setShowRetry(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showRetry) return null;

  return (
    <Alert className={`fixed top-4 right-4 w-auto z-50 ${isOnline ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
      {isOnline ? <Wifi className="h-4 w-4 text-green-600" /> : <WifiOff className="h-4 w-4 text-red-600" />}
      <AlertDescription className={isOnline ? 'text-green-800' : 'text-red-800'}>
        {isOnline ? 'Connection restored' : 'No internet connection'}
        {isOnline && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="ml-2 h-auto p-0 text-green-600"
            onClick={() => setShowRetry(false)}
          >
            ×
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

// Performance-optimized image component
export const OptimizedImage = memo(({ 
  src, 
  alt, 
  className,
  width,
  height,
  lazy = true,
  placeholder = "blur",
  ...props 
}: {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  lazy?: boolean;
  placeholder?: "blur" | "empty";
  [key: string]: any;
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  if (hasError) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <AlertTriangle className="h-8 w-8 text-gray-400" />
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && placeholder === "blur" && (
        <div className={`absolute inset-0 bg-gray-200 animate-pulse ${className}`} />
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        loading={lazy ? "lazy" : "eager"}
        width={width}
        height={height}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    </div>
  );
});

// Debounced input wrapper
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Progressive loading states
export const LoadingStates = {
  initial: <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>,
  skeleton: <ComponentSkeleton />,
  table: <TableSkeleton />,
  list: <ListSkeleton />,
  empty: <div className="text-center text-gray-500 py-8">No data available</div>
};

ComponentSkeleton.displayName = 'ComponentSkeleton';
TableSkeleton.displayName = 'TableSkeleton';
ListSkeleton.displayName = 'ListSkeleton';
OptimizedImage.displayName = 'OptimizedImage';
DefaultErrorFallback.displayName = 'DefaultErrorFallback';
