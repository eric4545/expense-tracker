const CACHE_NAME = 'expense-tracker-v7'

// Detect base URL dynamically (same logic as index.html)
let BASE_URL = ''
if (self.location.hostname.endsWith('.github.io')) {
  const path = self.location.pathname
  // Try to detect PR preview pattern
  const prPreviewMatch = path.match(/^(\/[^/]+\/pr-preview\/pr-\d+)/)
  if (prPreviewMatch) {
    BASE_URL = prPreviewMatch[1]
  } else {
    // Extract repo name from pathname
    const repoMatch = path.match(/^\/([^/]+)/)
    BASE_URL = repoMatch ? '/' + repoMatch[1] : ''
  }
}

// Only cache core assets during install
// Dynamic assets will be cached as they're accessed
const CORE_ASSETS = [
  `${BASE_URL}/`,
  `${BASE_URL}/index.html`,
  `${BASE_URL}/manifest.json`,
  `${BASE_URL}/offline.html`,
]

// Helper function to determine if an asset should be cached
const shouldCacheAsset = (url) => {
  return (
    url.includes('/assets/') ||
    url.endsWith('.js') ||
    url.endsWith('.css') ||
    url.endsWith('.png') ||
    url.endsWith('.ico') ||
    url.endsWith('.json')
  )
}

// Install event - cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(CORE_ASSETS)
      })
      .then(() => self.skipWaiting())
  )
})

// Activate event - clean up old caches and take control
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              return caches.delete(name)
            })
        )
      }),
      self.clients.claim(),
    ])
  )
})

// Fetch event - network first for assets, cache first for HTML
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return
  }

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return
  }

  const url = new URL(event.request.url)
  const isAsset = shouldCacheAsset(url.pathname)
  const isNavigationRequest = event.request.mode === 'navigate'

  // Network-first strategy for assets (CSS, JS, images)
  if (isAsset) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache the response if valid
          if (response.ok) {
            const clonedResponse = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clonedResponse)
            })
          }
          return response
        })
        .catch((err) => {
          return caches.match(event.request)
        })
    )
    return
  }

  // Cache-first strategy for navigation and other requests
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response
      }
      return fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse.ok) {
            // Cache the response for future
            const clonedResponse = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clonedResponse)
            })
          }
          return networkResponse
        })
        .catch((err) => {
          // If it's a navigation request and fails, show the offline page
          if (isNavigationRequest) {
            return caches.match(`${BASE_URL}/offline.html`)
          }
          throw err
        })
    })
  )
})
