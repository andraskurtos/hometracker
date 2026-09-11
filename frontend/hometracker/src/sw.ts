/**
 * sw.ts — Custom Service Worker
 *
 * Uses vite-plugin-pwa's injectManifest mode so we can:
 *  1. Keep Workbox precaching (injected at build time)
 *  2. Handle Web Push `push` events ourselves
 *  3. Handle `notificationclick` to focus/open the app
 */

import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';

declare let self: ServiceWorkerGlobalScope;

// Workbox injects the precache manifest here at build time
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// ---------------------------------------------------------------------------
// Push events — fires when the backend sends a Web Push message
// ---------------------------------------------------------------------------

self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return;

  let payload: { title?: string; body?: string; url?: string; icon?: string } = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'HomeTracker', body: event.data.text() };
  }

  const title = payload.title ?? 'HomeTracker';
  const appIcon = '/src/assets/icon.png';
  const options: NotificationOptions = {
    body: payload.body ?? '',
    icon: payload.icon ?? appIcon,
    badge: appIcon,
    data: { url: payload.url ?? '/' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ---------------------------------------------------------------------------
// Notification click — bring the app to the foreground / navigate
// ---------------------------------------------------------------------------

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  const targetUrl = (event.notification.data?.url as string) ?? '/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If there's already a window, focus it and navigate
        for (const client of clientList) {
          if ('focus' in client) {
            client.focus();
            if ('navigate' in client) {
              (client as WindowClient).navigate(targetUrl);
            }
            return;
          }
        }
        // Otherwise open a new window
        return self.clients.openWindow(targetUrl);
      })
  );
});
