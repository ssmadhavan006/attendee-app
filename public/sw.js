/**
 * @file sw.js
 * @description Custom Service Worker for UbuCon India 2026 PWA.
 * Implements a Stale-While-Revalidate and Cache-First strategy to ensure
 * immediate load times while keeping content fresh in the background.
 * Essential for providing a robust offline experience in low-connectivity areas.
 */
const CACHE_NAME = 'ubucon-india-2026-v3';
const BASE = '/attendee/';

// Core assets to pre-cache immediately upon SW installation.
const ASSETS_TO_CACHE = [
  BASE,
  `${BASE}index.html`,
  `${BASE}manifest.webmanifest`,
  `${BASE}favicon.svg`,
  `${BASE}ashoke-chakra-cof.svg`,
  `${BASE}ticket/`,
  `${BASE}schedule/`,
  `${BASE}venue/`,
];

// Install Event: Precaches essential shell assets.
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        await cache.addAll(ASSETS_TO_CACHE);
      } catch (err) {
        console.warn('[ServiceWorker] Some assets failed to precache:', err);
      }
    })()
  );
  self.skipWaiting();
});

// Activate Event: Clears out old caches when a new version takes over.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
      await self.clients.claim();
    })()
  );
});

// Fetch Event: Stale-While-Revalidate with Cache-First fallback.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    (async () => {
      const cachedResponse = await caches.match(event.request);
      const networkFetch = fetch(event.request)
        .then(async (networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            const cache = await caches.open(CACHE_NAME);
            await cache.put(event.request, clone);
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || networkFetch;
    })()
  );
});
