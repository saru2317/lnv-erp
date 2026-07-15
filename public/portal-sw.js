// Portal service worker — deliberately minimal.
//
// This exists to satisfy browser PWA-installability criteria (a fetch
// handler is required) and to make repeat visits to the portal shell a bit
// faster. It does NOT cache API responses (/api/*) — fee balances,
// attendance, library due-dates etc. must always be fetched fresh. Showing
// a cached "you owe ₹0" from yesterday because of an aggressive cache
// would be actively wrong, not just stale.
//
// For proper build-aware precaching of hashed Vite assets, migrate this to
// vite-plugin-pwa later — this hand-written version is intentionally simple
// to get installability working today without a build-tool change.

const CACHE_NAME = 'portal-shell-v1'

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Never touch API calls — always go straight to the network, untouched.
  if (url.pathname.startsWith('/api/')) return

  // Only handle GETs for same-origin portal-shell requests; everything
  // else (POST, cross-origin, etc.) passes straight through untouched.
  if (event.request.method !== 'GET') return

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request)
      const networkFetch = fetch(event.request).then((response) => {
        if (response.ok) cache.put(event.request, response.clone())
        return response
      }).catch(() => cached) // offline — fall back to whatever's cached, if anything

      // Cache-first for speed on repeat visits, but always refresh the
      // cache in the background so it doesn't go stale indefinitely
      return cached || networkFetch
    })
  )
})
