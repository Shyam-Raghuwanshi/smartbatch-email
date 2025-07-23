"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQuery, useMutation, useAction } from 'convex/react';

// Cache interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

// In-memory cache
class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize: number;
  
  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  set<T>(key: string, data: T, ttl = 5 * 60 * 1000): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  getStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    }

    return {
      total: this.cache.size,
      valid: validEntries,
      expired: expiredEntries,
      hitRate: validEntries / this.cache.size
    };
  }
}

// Global cache instance
const globalCache = new MemoryCache(200);

// Cache hook
export function useCache<T>(
  key: string, 
  fetcher: () => Promise<T>, 
  options: {
    ttl?: number;
    enabled?: boolean;
    refreshInterval?: number;
    staleWhileRevalidate?: boolean;
  } = {}
) {
  const { 
    ttl = 5 * 60 * 1000, 
    enabled = true, 
    refreshInterval,
    staleWhileRevalidate = true 
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastFetched, setLastFetched] = useState<number>(0);
  
  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!enabled) return;

    // Check cache first
    const cachedData = forceRefresh ? null : globalCache.get<T>(key);
    
    if (cachedData && staleWhileRevalidate) {
      setData(cachedData);
      // Return cached data but continue with background refresh
    }

    if (cachedData && !forceRefresh) {
      setData(cachedData);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      globalCache.set(key, result, ttl);
      setData(result);
      setLastFetched(Date.now());
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [key, fetcher, ttl, enabled, staleWhileRevalidate]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refresh interval
  useEffect(() => {
    if (!refreshInterval || !enabled) return;

    const interval = setInterval(() => {
      fetchData(true);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [fetchData, refreshInterval, enabled]);

  const mutate = useCallback((newData: T) => {
    globalCache.set(key, newData, ttl);
    setData(newData);
  }, [key, ttl]);

  const invalidate = useCallback(() => {
    globalCache.delete(key);
    fetchData(true);
  }, [key, fetchData]);

  return {
    data,
    isLoading,
    error,
    lastFetched,
    mutate,
    invalidate,
    refresh: () => fetchData(true)
  };
}

// Paginated data hook with caching
export function usePaginatedCache<T>(
  baseKey: string,
  fetcher: (page: number, limit: number) => Promise<{ items: T[]; total: number; hasMore: boolean }>,
  options: {
    pageSize?: number;
    enabled?: boolean;
    prefetchNext?: boolean;
  } = {}
) {
  const { pageSize = 20, enabled = true, prefetchNext = true } = options;
  const [currentPage, setCurrentPage] = useState(1);
  const [allItems, setAllItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const loadPage = useCallback(async (page: number) => {
    const cacheKey = `${baseKey}:page:${page}`;
    const cached = globalCache.get<{ items: T[]; total: number; hasMore: boolean }>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const result = await fetcher(page, pageSize);
    globalCache.set(cacheKey, result, 2 * 60 * 1000); // 2 minutes
    
    return result;
  }, [baseKey, fetcher, pageSize]);

  const loadNextPage = useCallback(async () => {
    if (!enabled || isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const result = await loadPage(currentPage + 1);
      setAllItems(prev => [...prev, ...result.items]);
      setCurrentPage(prev => prev + 1);
      setHasMore(result.hasMore);
      setTotal(result.total);

      // Prefetch next page
      if (prefetchNext && result.hasMore) {
        setTimeout(() => {
          loadPage(currentPage + 2).catch(() => {});
        }, 100);
      }
    } catch (err) {
      console.error('Failed to load next page:', err);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, isLoading, hasMore, currentPage, loadPage, prefetchNext]);

  // Load initial page
  useEffect(() => {
    if (!enabled) return;

    const loadInitial = async () => {
      setIsLoading(true);
      try {
        const result = await loadPage(1);
        setAllItems(result.items);
        setCurrentPage(1);
        setHasMore(result.hasMore);
        setTotal(result.total);
      } catch (err) {
        console.error('Failed to load initial page:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitial();
  }, [enabled, loadPage]);

  const reset = useCallback(() => {
    setCurrentPage(1);
    setAllItems([]);
    setHasMore(true);
    setTotal(0);
    // Clear cache for this base key
    const keysToDelete: string[] = [];
    globalCache['cache'].forEach((_, key) => {
      if (key.startsWith(`${baseKey}:page:`)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => globalCache.delete(key));
  }, [baseKey]);

  return {
    items: allItems,
    currentPage,
    total,
    hasMore,
    isLoading,
    loadNextPage,
    reset
  };
}

// Background sync hook
export function useBackgroundSync<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    interval?: number;
    onUpdate?: (data: T) => void;
    enabled?: boolean;
  } = {}
) {
  const { interval = 30000, onUpdate, enabled = true } = options;
  const [lastSync, setLastSync] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const sync = useCallback(async () => {
    if (!enabled || isSyncing) return;

    setIsSyncing(true);
    try {
      const data = await fetcher();
      globalCache.set(key, data, 10 * 60 * 1000); // 10 minutes
      setLastSync(Date.now());
      onUpdate?.(data);
    } catch (err) {
      console.error('Background sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [key, fetcher, enabled, isSyncing, onUpdate]);

  useEffect(() => {
    if (!enabled || !interval) return;

    const intervalId = setInterval(sync, interval);
    return () => clearInterval(intervalId);
  }, [sync, interval, enabled]);

  return {
    lastSync,
    isSyncing,
    forceSync: sync
  };
}

// Optimistic updates hook
export function useOptimisticMutation<TArgs, TResult>(
  mutation: any,
  optimisticUpdate: (args: TArgs) => TResult,
  options: {
    onSuccess?: (result: TResult) => void;
    onError?: (error: Error, rollback: () => void) => void;
    invalidateKeys?: string[];
  } = {}
) {
  const { onSuccess, onError, invalidateKeys = [] } = options;
  const [isLoading, setIsLoading] = useState(false);
  const [optimisticData, setOptimisticData] = useState<TResult | null>(null);

  const mutate = useCallback(async (args: TArgs) => {
    setIsLoading(true);
    
    // Apply optimistic update
    const optimisticResult = optimisticUpdate(args);
    setOptimisticData(optimisticResult);

    const rollback = () => {
      setOptimisticData(null);
    };

    try {
      const result = await mutation(args);
      setOptimisticData(null);
      
      // Invalidate cache keys
      invalidateKeys.forEach(key => globalCache.delete(key));
      
      onSuccess?.(result);
      return result;
    } catch (error) {
      onError?.(error as Error, rollback);
      rollback();
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [mutation, optimisticUpdate, onSuccess, onError, invalidateKeys]);

  return {
    mutate,
    isLoading,
    optimisticData
  };
}

// Convex query with caching
export function useCachedQuery(query: any, args: any, options: { ttl?: number; enabled?: boolean } = {}) {
  const { ttl = 5 * 60 * 1000, enabled = true } = options;
  const cacheKey = `query:${query.toString()}:${JSON.stringify(args)}`;
  
  const queryResult = useQuery(query, enabled ? args : 'skip');
  
  // Cache the result
  useEffect(() => {
    if (queryResult !== undefined) {
      globalCache.set(cacheKey, queryResult, ttl);
    }
  }, [queryResult, cacheKey, ttl]);

  // Return cached data if query is disabled
  if (!enabled) {
    return globalCache.get(cacheKey);
  }

  return queryResult;
}

// Preload data function
export function preloadData<T>(key: string, fetcher: () => Promise<T>, ttl = 5 * 60 * 1000) {
  const cached = globalCache.get<T>(key);
  if (cached) return Promise.resolve(cached);

  return fetcher().then(data => {
    globalCache.set(key, data, ttl);
    return data;
  });
}

// Cache management utilities
export const cacheUtils = {
  clear: () => globalCache.clear(),
  getStats: () => globalCache.getStats(),
  delete: (key: string) => globalCache.delete(key),
  size: () => globalCache.size(),
  
  // Bulk operations
  deleteByPrefix: (prefix: string) => {
    const keysToDelete: string[] = [];
    globalCache['cache'].forEach((_, key) => {
      if (key.startsWith(prefix)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => globalCache.delete(key));
    return keysToDelete.length;
  },
  
  // Memory cleanup
  cleanup: () => {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    globalCache['cache'].forEach((entry, key) => {
      if (now > entry.expiry) {
        expiredKeys.push(key);
      }
    });
    
    expiredKeys.forEach(key => globalCache.delete(key));
    return expiredKeys.length;
  }
};

// Auto cleanup interval
setInterval(() => {
  cacheUtils.cleanup();
}, 5 * 60 * 1000); // Cleanup every 5 minutes
