"use client";

import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { debounce } from 'lodash-es';

// Memory optimization utilities
export class MemoryManager {
  private static instance: MemoryManager;
  private cleanup: (() => void)[] = [];
  private memoryThreshold = 100 * 1024 * 1024; // 100MB threshold
  private checkInterval: NodeJS.Timeout | null = null;

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  constructor() {
    this.startMemoryMonitoring();
  }

  private startMemoryMonitoring() {
    if (typeof window === 'undefined' || !('memory' in performance)) return;

    this.checkInterval = setInterval(() => {
      const memory = (performance as any).memory;
      if (memory.usedJSHeapSize > this.memoryThreshold) {
        this.performCleanup();
      }
    }, 10000); // Check every 10 seconds
  }

  private performCleanup() {
    // Execute all registered cleanup functions
    this.cleanup.forEach(cleanupFn => {
      try {
        cleanupFn();
      } catch (error) {
        console.warn('Memory cleanup error:', error);
      }
    });

    // Force garbage collection if available (Chrome DevTools)
    if ('gc' in window) {
      (window as any).gc();
    }
  }

  registerCleanup(cleanupFn: () => void): () => void {
    this.cleanup.push(cleanupFn);
    
    // Return unregister function
    return () => {
      const index = this.cleanup.indexOf(cleanupFn);
      if (index > -1) {
        this.cleanup.splice(index, 1);
      }
    };
  }

  setMemoryThreshold(threshold: number) {
    this.memoryThreshold = threshold;
  }

  destroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.cleanup = [];
  }
}

// Hook for memory-optimized components
export function useMemoryOptimization() {
  const memoryManager = useMemo(() => MemoryManager.getInstance(), []);
  const cleanupRefs = useRef<Map<string, () => void>>(new Map());

  const registerCleanup = useCallback((key: string, cleanupFn: () => void) => {
    // Unregister previous cleanup for this key
    const existingUnregister = cleanupRefs.current.get(key);
    if (existingUnregister) {
      existingUnregister();
    }

    // Register new cleanup
    const unregister = memoryManager.registerCleanup(cleanupFn);
    cleanupRefs.current.set(key, unregister);

    return unregister;
  }, [memoryManager]);

  useEffect(() => {
    return () => {
      // Cleanup all registered functions on unmount
      cleanupRefs.current.forEach(unregister => unregister());
      cleanupRefs.current.clear();
    };
  }, []);

  return {
    registerCleanup,
    memoryManager
  };
}

// Memory-optimized list component
interface MemoryOptimizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  getItemKey: (item: T, index: number) => string;
  chunkSize?: number;
  maxVisibleChunks?: number;
  className?: string;
}

export function MemoryOptimizedList<T>({
  items,
  renderItem,
  getItemKey,
  chunkSize = 50,
  maxVisibleChunks = 4,
  className
}: MemoryOptimizedListProps<T>) {
  const [visibleChunks, setVisibleChunks] = React.useState<Set<number>>(new Set([0]));
  const containerRef = useRef<HTMLDivElement>(null);
  const { registerCleanup } = useMemoryOptimization();

  // Chunk the items
  const chunks = useMemo(() => {
    const result: T[][] = [];
    for (let i = 0; i < items.length; i += chunkSize) {
      result.push(items.slice(i, i + chunkSize));
    }
    return result;
  }, [items, chunkSize]);

  // Intersection observer for lazy loading chunks
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const chunkIndex = parseInt(entry.target.getAttribute('data-chunk-index') || '0');
          
          if (entry.isIntersecting) {
            setVisibleChunks(prev => {
              const newVisible = new Set(prev);
              newVisible.add(chunkIndex);
              
              // Limit visible chunks to prevent memory bloat
              if (newVisible.size > maxVisibleChunks) {
                const sortedVisible = Array.from(newVisible).sort((a, b) => a - b);
                const toRemove = sortedVisible.slice(0, sortedVisible.length - maxVisibleChunks);
                toRemove.forEach(index => newVisible.delete(index));
              }
              
              return newVisible;
            });
          }
        });
      },
      {
        root: containerRef.current,
        rootMargin: '100px',
        threshold: 0.1
      }
    );

    // Observe chunk placeholders
    const chunkElements = containerRef.current.querySelectorAll('[data-chunk-index]');
    chunkElements.forEach(el => observer.observe(el));

    // Register cleanup
    const unregister = registerCleanup('intersection-observer', () => {
      observer.disconnect();
    });

    return () => {
      observer.disconnect();
      unregister();
    };
  }, [chunks.length, maxVisibleChunks, registerCleanup]);

  return (
    <div ref={containerRef} className={className}>
      {chunks.map((chunk, chunkIndex) => (
        <div
          key={chunkIndex}
          data-chunk-index={chunkIndex}
          style={{ minHeight: visibleChunks.has(chunkIndex) ? 'auto' : `${chunkSize * 50}px` }}
        >
          {visibleChunks.has(chunkIndex) ? (
            chunk.map((item, itemIndex) => (
              <div key={getItemKey(item, chunkIndex * chunkSize + itemIndex)}>
                {renderItem(item, chunkIndex * chunkSize + itemIndex)}
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Loading chunk {chunkIndex + 1}...
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Memory-optimized image component
interface MemoryOptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  fallback?: string;
  lowQualitySrc?: string;
}

export function MemoryOptimizedImage({
  src,
  fallback,
  lowQualitySrc,
  className,
  ...props
}: MemoryOptimizedImageProps) {
  const [currentSrc, setCurrentSrc] = React.useState(lowQualitySrc || src);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const { registerCleanup } = useMemoryOptimization();

  // Lazy load high quality image
  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Load high quality image
            const highQualityImg = new Image();
            highQualityImg.onload = () => {
              setCurrentSrc(src);
              setIsLoaded(true);
            };
            highQualityImg.onerror = () => {
              setHasError(true);
              if (fallback) setCurrentSrc(fallback);
            };
            highQualityImg.src = src;
            
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(imgRef.current);

    const unregister = registerCleanup('image-observer', () => {
      observer.disconnect();
    });

    return () => {
      observer.disconnect();
      unregister();
    };
  }, [src, fallback, registerCleanup]);

  return (
    <img
      ref={imgRef}
      src={hasError && fallback ? fallback : currentSrc}
      className={className}
      style={{
        filter: !isLoaded && lowQualitySrc ? 'blur(4px)' : 'none',
        transition: 'filter 0.3s ease'
      }}
      {...props}
    />
  );
}

// Hook for debounced values with memory optimization
export function useMemoryOptimizedDebounce<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);
  const { registerCleanup } = useMemoryOptimization();

  const debouncedSetter = useMemo(
    () => debounce((newValue: T) => setDebouncedValue(newValue), delay),
    [delay]
  );

  useEffect(() => {
    debouncedSetter(value);

    const unregister = registerCleanup('debounce-cleanup', () => {
      debouncedSetter.cancel();
    });

    return () => {
      debouncedSetter.cancel();
      unregister();
    };
  }, [value, debouncedSetter, registerCleanup]);

  return debouncedValue;
}

// Memory stats component
export function MemoryStats() {
  const [memoryStats, setMemoryStats] = React.useState<{
    used: number;
    total: number;
    limit: number;
  } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('memory' in performance)) return;

    const updateStats = () => {
      const memory = (performance as any).memory;
      setMemoryStats({
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024)
      });
    };

    updateStats();
    const interval = setInterval(updateStats, 2000);

    return () => clearInterval(interval);
  }, []);

  if (!memoryStats) {
    return (
      <div className="text-sm text-muted-foreground">
        Memory stats not available
      </div>
    );
  }

  const usagePercentage = (memoryStats.used / memoryStats.limit) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>Memory Usage</span>
        <span className="font-mono">
          {memoryStats.used}MB / {memoryStats.limit}MB
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${
            usagePercentage > 80
              ? 'bg-red-500'
              : usagePercentage > 60
              ? 'bg-yellow-500'
              : 'bg-green-500'
          }`}
          style={{ width: `${Math.min(usagePercentage, 100)}%` }}
        />
      </div>
      <div className="text-xs text-muted-foreground">
        Total heap: {memoryStats.total}MB
      </div>
    </div>
  );
}
