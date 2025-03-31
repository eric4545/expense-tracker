const CACHE_NAME = 'expense-tracker-v4';
const isGitHubPages = self.location.hostname === 'eric4545.github.io';
const BASE_URL = isGitHubPages ? '/expense-tracker' : '';

// Core assets that must be cached
const CORE_ASSETS = [
  `${BASE_URL}/`,
  `${BASE_URL}/index.html`,
  `${BASE_URL}/offline.html`,
  `${BASE_URL}/manifest.json`,
  // Add icons
  `${BASE_URL}/icons/icon-72x72.png`,
  `${BASE_URL}/icons/icon-96x96.png`,
  `${BASE_URL}/icons/icon-128x128.png`,
  `${BASE_URL}/icons/icon-144x144.png`,
  `${BASE_URL}/icons/icon-152x152.png`,
  `${BASE_URL}/icons/icon-192x192.png`,
  `${BASE_URL}/icons/icon-384x384.png`,
  `${BASE_URL}/icons/icon-512x512.png`
];

// Helper function to determine if a request is for an asset
const isAssetRequest = (url) => {
  const parsedUrl = new URL(url);
  const path = parsedUrl.pathname;

  // Handle both development and production paths
  return (
    path.startsWith('/assets/') ||
    path.startsWith('/expense-tracker/assets/') ||
    path.includes('.js') ||
    path.includes('.css') ||
    path.includes('.png') ||
    path.includes('.ico') ||
    path.includes('.json')
  );
};

// Helper function to determine if a request is for a page
const isNavigationRequest = (request) => {
  return (
    request.mode === 'navigate' ||
    request.headers.get('Accept')?.includes('text/html')
  );
};

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

// Fetch event - network first for assets, cache first for HTML
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Handle same-origin requests only
  if (url.origin !== self.location.origin) return;

  // Network-first strategy for assets
  if (isAssetRequest(url.pathname)) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.ok) {
            const clonedResponse = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, clonedResponse);
            });
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first strategy for HTML and other requests
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
            // If both cache and network fail, return the offline page
            if (isNavigationRequest(event.request)) {
              return caches.match(`${BASE_URL}/offline.html`);
            }
            throw new Error('Both cache and network failed');
          });
      })
      .catch(() => {
        // If everything fails, return offline page for navigation requests
        if (isNavigationRequest(event.request)) {
          return caches.match(`${BASE_URL}/offline.html`);
        }
        throw new Error('Network and cache both failed');
      })
  );
});