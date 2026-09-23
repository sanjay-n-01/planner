const CACHE_NAME = 'sanjay-planner-v12';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Network only - no caching for now
  event.respondWith(fetch(event.request));
});

self.addEventListener('message', event => {
  if (event.data?.type !== 'TRACKER_CHECK_IN') return;

  event.waitUntil(
    self.registration.showNotification('Tracker check-in', {
      body: event.data.body,
      tag: 'tracker-check-in',
      renotify: true
    })
  );
});
