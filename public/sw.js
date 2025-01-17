const CACHE_NAME = 'expense-tracker-v1';
const isGitHubPages = self.location.hostname === 'eric4545.github.io';
const BASE_URL = isGitHubPages ? '/expense-tracker' : '';

// Assets to cache immediately
const STATIC_ASSETS = [
  `${BASE_URL}/`,
  `${BASE_URL}/index.html`,
  `${BASE_URL}/manifest.json`,
  // Add dist files that Vite generates
  `${BASE_URL}/assets/index.css`,
  `${BASE_URL}/assets/index.js`,
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

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
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
      self.clients.claim() // Take control of all pages immediately
    ])
  );
});

// Helper function to normalize URLs
const normalizeUrl = (url) => {
  const urlObj = new URL(url);
  // Remove query parameters and hashes
  return urlObj.origin + urlObj.pathname;
};

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Handle same-origin requests only
  if (!event.request.url.startsWith(self.location.origin)) return;

  const normalizedUrl = normalizeUrl(event.request.url);

  event.respondWith(
    caches.match(normalizedUrl)
      .then(async (response) => {
        // Return cached response if found
        if (response) {
          return response;
        }

        try {
          // If not in cache, fetch from network
          const networkResponse = await fetch(event.request);

          // Only cache successful responses
          if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            // Clone the response before caching it
            cache.put(normalizedUrl, networkResponse.clone());
          }

          return networkResponse;
        } catch (error) {
          // If offline and no cache, return cached index.html for navigation
          if (event.request.mode === 'navigate') {
            return caches.match(`${BASE_URL}/index.html`);
          }
          throw error;
        }
      })
  );
});