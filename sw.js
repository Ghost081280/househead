// House Head Chase - Service Worker
// Version 1.0.0

const CACHE_NAME = 'house-head-chase-v1.0.0';
const OFFLINE_URL = '/offline.html';

// Files to cache for offline functionality
const CACHE_URLS = [
  '/',
  '/index.html',
  '/styles.css',
  '/game.js',
  '/manifest.json',
  '/icons/icon-72.png',
  '/icons/icon-96.png',
  '/icons/icon-128.png',
  '/icons/icon-144.png',
  '/icons/icon-152.png',
  '/icons/icon-192.png',
  '/icons/icon-384.png',
  '/icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Creepster&family=Orbitron:wght@400;700;900&family=Exo+2:wght@300;400;700&display=swap'
];

// Install event - cache resources
self.addEventListener('install', event => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Caching app shell and content');
        return cache.addAll(CACHE_URLS);
      })
      .then(() => {
        console.log('✅ Service Worker installed successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('❌ Service Worker installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }

        return fetch(event.request)
          .then(fetchResponse => {
            // Don't cache non-successful responses
            if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
              return fetchResponse;
            }

            // Clone the response for caching
            const responseToCache = fetchResponse.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return fetchResponse;
          })
          .catch(() => {
            // If both cache and network fail, show offline page for navigation requests
            if (event.request.destination === 'document') {
              return caches.match(OFFLINE_URL);
            }
          });
      })
  );
});

// Background sync for high scores (when connectivity returns)
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync-scores') {
    console.log('🔄 Background syncing high scores...');
    event.waitUntil(syncHighScores());
  }
});

// Push notifications for game updates
self.addEventListener('push', event => {
  console.log('📢 Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New House Head Chase update available!',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Play Now',
        icon: '/icons/icon-192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/icon-192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('🏠 House Head Chase', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', event => {
  console.log('🔔 Notification clicked');
  
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Periodic background sync for offline score submission
self.addEventListener('periodicsync', event => {
  if (event.tag === 'periodic-score-sync') {
    console.log('⏰ Periodic sync: submitting offline scores');
    event.waitUntil(syncOfflineScores());
  }
});

// Helper functions
async function syncHighScores() {
  try {
    // This would sync with a server in a real implementation
    console.log('📊 High scores synced successfully');
  } catch (error) {
    console.error('❌ Failed to sync high scores:', error);
    throw error;
  }
}

async function syncOfflineScores() {
  try {
    // Get pending scores from IndexedDB
    const pendingScores = await getPendingScores();
    
    if (pendingScores.length > 0) {
      // Submit scores to server
      await submitScoresToServer(pendingScores);
      
      // Clear pending scores
      await clearPendingScores();
      
      console.log(`📤 Submitted ${pendingScores.length} offline scores`);
    }
  } catch (error) {
    console.error('❌ Failed to sync offline scores:', error);
  }
}

async function getPendingScores() {
  // In a real implementation, this would read from IndexedDB
  return [];
}

async function submitScoresToServer(scores) {
  // In a real implementation, this would POST to your server
  return Promise.resolve();
}

async function clearPendingScores() {
  // In a real implementation, this would clear IndexedDB
  return Promise.resolve();
}

// Update available notification
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('⚡ Updating to new version...');
    self.skipWaiting();
  }
});

// Error handling
self.addEventListener('error', event => {
  console.error('💥 Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', event => {
  console.error('💥 Service Worker unhandled rejection:', event.reason);
  event.preventDefault();
});

console.log('🏠 House Head Chase Service Worker loaded successfully!');
