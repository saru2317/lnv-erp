// Registers the portal service worker, explicitly scoped to /portal/ —
// this never runs for or affects the main staff/admin ERP pages, only the
// parent-facing portal routes that import and call this.
export function registerPortalServiceWorker() {
  if (!('serviceWorker' in navigator)) return
  navigator.serviceWorker.register('/portal-sw.js', { scope: '/portal/' })
    .catch(err => console.warn('Portal service worker registration failed:', err.message))
}

// Injects the Parent Portal's PWA manifest ONLY when a portal page actually
// loads, instead of it living globally in index.html — that's exactly what
// caused "Install" from the main ERP to use the Parent Portal's branding
// and navigate there instead. Removed on unmount so leaving the portal
// (e.g. staff navigating back to the main ERP in the same tab) doesn't
// leave it lingering either.
export function registerPortalManifest() {
  const existing = document.querySelector('link[rel="manifest"]')
  if (existing) return () => {} // already present, don't duplicate; no-op cleanup
  const link = document.createElement('link')
  link.rel = 'manifest'
  link.href = '/portal-manifest.json'
  document.head.appendChild(link)
  return () => { link.remove() }
}
