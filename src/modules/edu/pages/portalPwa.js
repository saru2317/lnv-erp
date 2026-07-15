// Registers the portal service worker, explicitly scoped to /portal/ —
// this never runs for or affects the main staff/admin ERP pages, only the
// parent-facing portal routes that import and call this.
export function registerPortalServiceWorker() {
  if (!('serviceWorker' in navigator)) return
  navigator.serviceWorker.register('/portal-sw.js', { scope: '/portal/' })
    .catch(err => console.warn('Portal service worker registration failed:', err.message))
}
