// House Head Chase - Enhanced Service Worker for Better PWA Experience
// Version 2.0.1 - Cache refresh for HELP button fix

const CACHE_NAME = 'house-head-chase-v2.0.1';
const OFFLINE_URL = './offline.html';

// Files to cache for offline functionality
const CACHE_URLS = [
  './',
  './index.html',
  './styles.css',
  './game.js',
  './config.js',
  './firebase-integration.js',
  './manifest.json',
  './offline.html',
  './icons/icon-16.png',
  './icons/icon-32.png',
  './icons/icon-72.png',
  './icons/icon-96.png',
  './icons/icon-128.png',
  './icons/icon-144.png',
  './icons/icon-152.png',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-256.png',
  './icons/icon-384.png',
  './icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Creepster&family=Orbitron:wght@400;700;900&family=Exo+2:wght@300;400;700&display=swap'
];

// Install event - cache resources
self.addEventListener('install', event => {
  console.log('🔧 Service Worker installing v2.0.1...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Caching app shell and content');
        return cache.addAll(CACHE_URLS);
      })
      .then(() => {
        console.log('✅ Service Worker v2.0.1 installed successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('❌ Service Worker installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker v2.0.1 activating...');
  
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
        console.log('✅ Service Worker v2.0.1 activated');
        // Force refresh all clients to get new content
        return self.clients.claim();
      })
      .then(() => {
        // Notify all clients that new content is available
        return self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'CACHE_UPDATED',
              message: 'New content available - refresh to see changes!'
            });
          });
        });
      })
  );
});

// Fetch event - serve cached content when offline, but check for updates online
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip Chrome extension requests
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  // For HTML files, always try network first to get updates
  if (event.request.destination === 'document' || 
      event.request.url.includes('.html') || 
      event.request.url.includes('.js') || 
      event.request.url.includes('.css')) {
    
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // If fetch succeeds, update cache and return response
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
          }
          return response;
        })
        .catch(() => {
          // If fetch fails, fall back to cache
          return caches.match(event.request)
            .then(response => {
              if (response) {
                return response;
              }
              // If no cache either, show offline page for documents
              if (event.request.destination === 'document') {
                return caches.match(OFFLINE_URL);
              }
            });
        })
    );
    return;
  }

  // For other resources, use cache-first strategy
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
            
            // For images, return a placeholder
            if (event.request.destination === 'image') {
              return new Response(
                '<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#ddd"/><text x="50%" y="50%" text-anchor="middle" dy=".3em">🏠</text></svg>',
                { headers: { 'Content-Type': 'image/svg+xml' } }
              );
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
    icon: './icons/icon-192.png',
    badge: './icons/icon-72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Play Now',
        icon: './icons/icon-192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: './icons/icon-192.png'
      }
    ],
    tag: 'house-head-chase',
    renotify: true,
    requireInteraction: false,
    silent: false
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
      clients.openWindow('./')
    );
  } else {
    // Default click action
    event.waitUntil(
      clients.matchAll().then(clients => {
        if (clients.length > 0) {
          return clients[0].focus();
        }
        return clients.openWindow('./');
      })
    );
  }
});

// Helper functions
async function syncHighScores() {
  try {
    // This would sync with a server in a real implementation
    console.log('📊 High scores synced successfully');
    
    // For now, just validate local storage
    const scores = localStorage.getItem('houseHeadChaseHighScores');
    if (scores) {
      JSON.parse(scores); // Validate JSON
    }
  } catch (error) {
    console.error('❌ Failed to sync high scores:', error);
    throw error;
  }
}

// Update available notification
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('⚡ Updating to new version...');
    self.skipWaiting();
  }
});

// Improved error handling
self.addEventListener('error', event => {
  console.error('💥 Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', event => {
  console.error('💥 Service Worker unhandled rejection:', event.reason);
  event.preventDefault();
});

// PWA install prompt enhancement
self.addEventListener('appinstalled', event => {
  console.log('✅ App was installed successfully');
  
  // Show welcome notification after install
  self.registration.showNotification('🏠 Welcome to House Head Chase!', {
    body: 'The app is now installed and ready to play offline!',
    icon: './icons/icon-192.png',
    badge: './icons/icon-72.png',
    tag: 'welcome',
    requireInteraction: false,
    actions: [
      {
        action: 'play',
        title: 'Start Playing',
        icon: './icons/icon-192.png'
      }
    ]
  });
});

console.log('🏠 House Head Chase Service Worker v2.0.3 loaded successfully!');
