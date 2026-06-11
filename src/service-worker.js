import { clientsClaim, setCacheNameDetails } from 'workbox-core';
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

setCacheNameDetails({
  prefix: 'spendwise',
  suffix: 'v1',
  precache: 'precache',
  runtime: 'runtime',
});

clientsClaim();
self.skipWaiting();

cleanupOutdatedCaches();
precacheAndRoute((self.__WB_MANIFEST || []).concat([{ url: '/offline.html', revision: null }]));

const imageCache = new CacheFirst({
  cacheName: 'spendwise-images',
  plugins: [
    new ExpirationPlugin({
      maxEntries: 60,
      maxAgeSeconds: 30 * 24 * 60 * 60,
    }),
  ],
});

const fontCache = new CacheFirst({
  cacheName: 'spendwise-fonts',
  plugins: [
    new ExpirationPlugin({
      maxEntries: 30,
      maxAgeSeconds: 365 * 24 * 60 * 60,
    }),
  ],
});

const staticCache = new StaleWhileRevalidate({
  cacheName: 'spendwise-static',
  plugins: [
    new ExpirationPlugin({
      maxEntries: 100,
      maxAgeSeconds: 30 * 24 * 60 * 60,
    }),
  ],
});

const pageCache = new NetworkFirst({
  cacheName: 'spendwise-pages',
  networkTimeoutSeconds: 4,
  plugins: [
    new CacheableResponsePlugin({ statuses: [0, 200] }),
    new ExpirationPlugin({ maxEntries: 50 }),
  ],
});

const apiCache = new NetworkFirst({
  cacheName: 'spendwise-api',
  networkTimeoutSeconds: 4,
  plugins: [
    new CacheableResponsePlugin({ statuses: [0, 200] }),
    new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 }),
  ],
});

registerRoute(({ request }) => request.destination === 'image', imageCache);
registerRoute(({ request }) => request.destination === 'font', fontCache);
registerRoute(
  ({ url }) => url.pathname.startsWith('/_next/static') || url.pathname.startsWith('/static'),
  staticCache
);
registerRoute(
  ({ request }) => request.destination === 'script' || request.destination === 'style',
  staticCache
);
registerRoute(
  ({ url }) => url.hostname.endsWith('.supabase.co'),
  apiCache
);

const navigationHandler = async ({ event }) => {
  try {
    return await pageCache.handle({ event });
  } catch {
    return caches.match('/offline.html', { ignoreSearch: true });
  }
};

registerRoute(new NavigationRoute(navigationHandler));

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
