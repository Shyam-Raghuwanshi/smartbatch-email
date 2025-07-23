"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Wifi, WifiOff, RefreshCw, Download, Bell, AlertCircle, CheckCircle } from 'lucide-react';

interface ServiceWorkerMessage {
  type: string;
  action?: any;
  error?: string;
  actions?: any[];
}

interface PendingAction {
  type: string;
  data: any;
  url: string;
  method?: string;
  timestamp: number;
}

export function useServiceWorker() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);

  // Register service worker
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        setSwRegistration(registration);
        console.log('Service Worker registered successfully');

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available
                console.log('New service worker version available');
              }
            });
          }
        });
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    };

    registerSW();
  }, []);

  // Listen for online/offline events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus('syncing');
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('idle');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen for messages from service worker
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const handleMessage = (event: MessageEvent<ServiceWorkerMessage>) => {
      const { type, action, error, actions } = event.data;

      switch (type) {
        case 'SYNC_SUCCESS':
          setSyncStatus('success');
          setLastSyncTime(Date.now());
          // Remove synced action from pending list
          if (action) {
            setPendingActions(prev => prev.filter(a => a.timestamp !== action.timestamp));
          }
          break;

        case 'SYNC_FAILED':
          setSyncStatus('error');
          console.error('Sync failed:', error);
          break;

        case 'PENDING_ACTIONS':
          setPendingActions(actions || []);
          break;
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, []);

  // Queue action for background sync
  const queueAction = useCallback((action: Omit<PendingAction, 'timestamp'>) => {
    const actionWithTimestamp = {
      ...action,
      timestamp: Date.now()
    };

    setPendingActions(prev => [...prev, actionWithTimestamp]);

    // Send to service worker
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'QUEUE_ACTION',
        payload: actionWithTimestamp
      });
    }
  }, []);

  // Get pending actions from service worker
  const getPendingActions = useCallback(() => {
    if (!navigator.serviceWorker.controller) return;

    const messageChannel = new MessageChannel();
    messageChannel.port1.onmessage = (event) => {
      if (event.data.type === 'PENDING_ACTIONS') {
        setPendingActions(event.data.actions || []);
      }
    };

    navigator.serviceWorker.controller.postMessage(
      { type: 'GET_PENDING_ACTIONS' },
      [messageChannel.port2]
    );
  }, []);

  // Clear cache
  const clearCache = useCallback(() => {
    if (!navigator.serviceWorker.controller) return;

    const messageChannel = new MessageChannel();
    messageChannel.port1.onmessage = (event) => {
      if (event.data.type === 'CACHE_CLEARED') {
        console.log('Cache cleared successfully');
      }
    };

    navigator.serviceWorker.controller.postMessage(
      { type: 'CLEAR_CACHE' },
      [messageChannel.port2]
    );
  }, []);

  // Prefetch URLs
  const prefetchUrls = useCallback((urls: string[]) => {
    if (!navigator.serviceWorker.controller) return;

    const messageChannel = new MessageChannel();
    messageChannel.port1.onmessage = (event) => {
      if (event.data.type === 'PREFETCH_COMPLETE') {
        console.log('Prefetch completed');
      }
    };

    navigator.serviceWorker.controller.postMessage(
      { type: 'PREFETCH_URLS', payload: { urls } },
      [messageChannel.port2]
    );
  }, []);

  return {
    isOnline,
    swRegistration,
    pendingActions,
    syncStatus,
    lastSyncTime,
    queueAction,
    getPendingActions,
    clearCache,
    prefetchUrls
  };
}

// Service Worker Status Component
export function ServiceWorkerStatus() {
  const {
    isOnline,
    swRegistration,
    pendingActions,
    syncStatus,
    lastSyncTime,
    getPendingActions,
    clearCache
  } = useServiceWorker();

  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    getPendingActions();
  }, [getPendingActions]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'syncing': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSyncIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4" />;
      case 'error': return <AlertCircle className="h-4 w-4" />;
      case 'syncing': return <RefreshCw className="h-4 w-4 animate-spin" />;
      default: return <RefreshCw className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="h-5 w-5 text-green-500" />
          ) : (
            <WifiOff className="h-5 w-5 text-red-500" />
          )}
          Service Worker Status
        </CardTitle>
        <CardDescription>
          Offline support and background synchronization
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Connection</span>
          <Badge className={isOnline ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}>
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
        </div>

        {/* Service Worker Registration */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Service Worker</span>
          <Badge className={swRegistration ? 'text-green-600 bg-green-50' : 'text-gray-600 bg-gray-50'}>
            {swRegistration ? 'Active' : 'Not Available'}
          </Badge>
        </div>

        {/* Sync Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Sync Status</span>
          <Badge className={getStatusColor(syncStatus)}>
            <div className="flex items-center gap-1">
              {getSyncIcon(syncStatus)}
              {syncStatus}
            </div>
          </Badge>
        </div>

        {/* Pending Actions */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Pending Actions</span>
          <Badge variant="outline">
            {pendingActions.length}
          </Badge>
        </div>

        {/* Last Sync Time */}
        {lastSyncTime && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Last Sync</span>
            <span className="text-sm text-muted-foreground">
              {new Date(lastSyncTime).toLocaleTimeString()}
            </span>
          </div>
        )}

        {/* Offline Alert */}
        {!isOnline && (
          <Alert>
            <WifiOff className="h-4 w-4" />
            <AlertTitle>You're offline</AlertTitle>
            <AlertDescription>
              Your actions will be synchronized when you're back online.
              {pendingActions.length > 0 && ` ${pendingActions.length} actions queued.`}
            </AlertDescription>
          </Alert>
        )}

        {/* Controls */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearCache}
          >
            Clear Cache
          </Button>
        </div>

        {/* Detailed View */}
        {showDetails && (
          <div className="space-y-3 pt-3 border-t">
            <h4 className="font-medium">Pending Actions</h4>
            {pendingActions.length === 0 ? (
              <div className="text-sm text-muted-foreground">No pending actions</div>
            ) : (
              <div className="space-y-2">
                {pendingActions.map((action, index) => (
                  <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{action.type}</span>
                      <span className="text-muted-foreground">
                        {new Date(action.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-muted-foreground">
                      {action.method || 'POST'} {action.url}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Hook for offline-aware actions
export function useOfflineAction() {
  const { queueAction, isOnline } = useServiceWorker();

  const executeAction = useCallback(
    async (
      actionFn: () => Promise<any>,
      fallbackData: {
        type: string;
        data: any;
        url: string;
        method?: string;
      }
    ) => {
      if (isOnline) {
        try {
          return await actionFn();
        } catch (error) {
          // If online action fails, queue for retry
          queueAction(fallbackData);
          throw error;
        }
      } else {
        // Queue action for when back online
        queueAction(fallbackData);
        
        // Return optimistic response
        return {
          success: true,
          queued: true,
          message: 'Action queued for when you\'re back online'
        };
      }
    },
    [isOnline, queueAction]
  );

  return { executeAction, isOnline };
}
