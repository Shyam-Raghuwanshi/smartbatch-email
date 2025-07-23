const CACHE_NAME = 'smartbatch-email-v1';
const STATIC_CACHE_URLS = [
  '/',
  '/dashboard',
  '/contacts',
  '/campaigns',
  '/templates',
  '/analytics',
  '/_next/static/css/',
  '/_next/static/js/',
];

const DYNAMIC_CACHE_URLS = [
  '/api/',
  '/convex/',
];

// Performance optimization: Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  CACHE_ONLY: 'cache-only',
  NETWORK_ONLY: 'network-only',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
};

// Background sync for offline actions
const BACKGROUND_SYNC_TAG = 'background-sync';
let pendingActions = [];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName))
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip Chrome extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // Determine cache strategy based on URL
  let strategy = CACHE_STRATEGIES.NETWORK_FIRST;
  
  if (STATIC_CACHE_URLS.some(pattern => url.pathname.startsWith(pattern))) {
    strategy = CACHE_STRATEGIES.CACHE_FIRST;
  } else if (url.pathname.startsWith('/_next/static/')) {
    strategy = CACHE_STRATEGIES.CACHE_FIRST;
  } else if (DYNAMIC_CACHE_URLS.some(pattern => url.pathname.startsWith(pattern))) {
    strategy = CACHE_STRATEGIES.STALE_WHILE_REVALIDATE;
  }

  event.respondWith(handleRequest(request, strategy));
});

// Handle requests based on cache strategy
async function handleRequest(request, strategy) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  switch (strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      return cachedResponse || fetchAndCache(request, cache);

    case CACHE_STRATEGIES.NETWORK_FIRST:
      try {
        const networkResponse = await fetchAndCache(request, cache);
        return networkResponse;
      } catch (error) {
        return cachedResponse || createOfflineResponse();
      }

    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      // Return cached response immediately, fetch in background
      if (cachedResponse) {
        fetchAndCache(request, cache); // Don't await
        return cachedResponse;
      }
      return fetchAndCache(request, cache);

    case CACHE_STRATEGIES.CACHE_ONLY:
      return cachedResponse || createOfflineResponse();

    case CACHE_STRATEGIES.NETWORK_ONLY:
      return fetch(request);

    default:
      return fetchAndCache(request, cache);
  }
}

// Fetch and cache helper
async function fetchAndCache(request, cache) {
  try {
    const response = await fetch(request);
    
    // Only cache successful responses
    if (response.ok) {
      // Clone the response because it can only be consumed once
      const responseClone = response.clone();
      
      // Cache the response
      await cache.put(request, responseClone);
    }
    
    return response;
  } catch (error) {
    console.error('Fetch failed:', error);
    throw error;
  }
}

// Create offline response
function createOfflineResponse() {
  return new Response(
    JSON.stringify({
      error: 'Offline',
      message: 'You are currently offline. Please check your connection.',
      timestamp: Date.now()
    }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === BACKGROUND_SYNC_TAG) {
    event.waitUntil(processPendingActions());
  }
});

// Process pending actions when back online
async function processPendingActions() {
  console.log('Processing pending actions:', pendingActions.length);
  
  const actionsToProcess = [...pendingActions];
  pendingActions = [];
  
  for (const action of actionsToProcess) {
    try {
      await processAction(action);
      console.log('Successfully processed action:', action.type);
      
      // Notify clients of successful sync
      notifyClients({
        type: 'SYNC_SUCCESS',
        action: action
      });
    } catch (error) {
      console.error('Failed to process action:', action, error);
      
      // Re-add failed actions to pending queue
      pendingActions.push(action);
      
      // Notify clients of sync failure
      notifyClients({
        type: 'SYNC_FAILED',
        action: action,
        error: error.message
      });
    }
  }
}

// Process individual action
async function processAction(action) {
  const { type, data, url, method = 'POST' } = action;
  
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
}

// Notify all clients
function notifyClients(message) {
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage(message);
    });
  });
}

// Handle messages from client
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'QUEUE_ACTION':
      pendingActions.push(payload);
      
      // Try to sync immediately if online
      if (navigator.onLine) {
        processPendingActions();
      } else {
        // Register for background sync when online
        self.registration.sync.register(BACKGROUND_SYNC_TAG);
      }
      break;
      
    case 'GET_PENDING_ACTIONS':
      event.ports[0].postMessage({
        type: 'PENDING_ACTIONS',
        actions: pendingActions
      });
      break;
      
    case 'CLEAR_CACHE':
      caches.delete(CACHE_NAME)
        .then(() => {
          event.ports[0].postMessage({
            type: 'CACHE_CLEARED'
          });
        });
      break;
      
    case 'PREFETCH_URLS':
      prefetchUrls(payload.urls)
        .then(() => {
          event.ports[0].postMessage({
            type: 'PREFETCH_COMPLETE'
          });
        });
      break;
  }
});

// Prefetch URLs for better performance
async function prefetchUrls(urls) {
  const cache = await caches.open(CACHE_NAME);
  
  const fetchPromises = urls.map(async (url) => {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response);
      }
    } catch (error) {
      console.warn('Failed to prefetch:', url, error);
    }
  });
  
  await Promise.allSettled(fetchPromises);
}

// Performance monitoring
self.addEventListener('fetch', (event) => {
  const startTime = performance.now();
  
  event.respondWith(
    handleRequest(event.request, getStrategy(event.request))
      .then((response) => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // Log slow requests
        if (duration > 1000) {
          console.warn('Slow request detected:', {
            url: event.request.url,
            duration: duration,
            method: event.request.method
          });
        }
        
        return response;
      })
  );
});

// Get cache strategy for request
function getStrategy(request) {
  const url = new URL(request.url);
  
  if (url.pathname.startsWith('/_next/static/')) {
    return CACHE_STRATEGIES.CACHE_FIRST;
  }
  
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/convex/')) {
    return CACHE_STRATEGIES.STALE_WHILE_REVALIDATE;
  }
  
  return CACHE_STRATEGIES.NETWORK_FIRST;
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  const options = {
    body: 'You have new email campaign results!',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Dashboard',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/xmark.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('SmartBatch Email', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  }
});

console.log('Service Worker loaded successfully');
