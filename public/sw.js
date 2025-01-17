const CACHE_NAME = 'expense-tracker-v2';
const isGitHubPages = self.location.hostname === 'eric4545.github.io';
const BASE_URL = isGitHubPages ? '/expense-tracker' : '';

// Core assets that must be cached
const CORE_ASSETS = [
  `${BASE_URL}/`,
  `${BASE_URL}/index.html`,
  `${BASE_URL}/manifest.json`
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches and take control
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys()
        .then(cacheNames => {
          return Promise.all(
            cacheNames
              .filter(name => name !== CACHE_NAME)
              .map(name => caches.delete(name))
          );
        }),
      self.clients.claim()
    ])
  );
});

// Helper function to determine if a request is for an asset
const isAssetRequest = (url) => {
  const parsedUrl = new URL(url);
  return (
    parsedUrl.pathname.startsWith('/assets/') ||
    parsedUrl.pathname.startsWith('/expense-tracker/assets/') ||
    parsedUrl.pathname.endsWith('.js') ||
    parsedUrl.pathname.endsWith('.css') ||
    parsedUrl.pathname.endsWith('.png') ||
    parsedUrl.pathname.endsWith('.json')
  );
};

// Fetch event - network first for assets, cache first for other requests
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Handle non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Handle cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Network-first strategy for assets
  if (isAssetRequest(event.request.url)) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache the response if it's valid
          if (response.ok) {
            const clonedResponse = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, clonedResponse);
            });
          }
          return response;
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(event.request);
        })
    );
    return;
  }

  // Cache-first strategy for other requests
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request)
          .then(networkResponse => {
            if (networkResponse.ok) {
              const clonedResponse = networkResponse.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, clonedResponse);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            // If both cache and network fail, return the offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match(`${BASE_URL}/index.html`);
            }
            throw new Error('Both cache and network failed');
          });
      })
  );
});