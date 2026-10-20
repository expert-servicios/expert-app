// ── Push notifications ────────────────────────────────────────
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const kia = data.source === 'kia';
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'EXPERT', {
      body:     data.body ?? '',
      icon:     kia ? '/avatars/kia/kia-bienvenida.webp' : '/branding/expert-approved/app-dark-192.png',
      badge:    '/branding/expert-approved/app-dark-192.png',
      tag:      data.tag ?? 'expert-push',
      renotify: true,
      data:     { url: data.url ?? '/admin/whatsapp' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const target = event.notification.data?.url ?? '/admin/whatsapp';
      for (const client of list) {
        if (client.url.includes(target) && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(target);
    })
  );
});

// ── PWA cache ─────────────────────────────────────────────────
const CACHE = 'expert-pwa-v2-brand-approved';

const PRECACHE = [
  '/offline',
  '/branding/expert-approved/favicon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Only cache http/https — chrome-extension:// and others are not cacheable
  if (!url.protocol.startsWith('http')) return;

  // Skip non-GET and API calls — always go to network
  if (request.method !== 'GET' || url.pathname.startsWith('/api/')) return;

  // Static assets (JS, CSS, fonts, images) — cache first
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/logos/') ||
    url.pathname.startsWith('/branding/expert-approved/') ||
    url.pathname.startsWith('/icons/')
  ) {
    e.respondWith(
      caches.match(request).then((cached) =>
        cached ?? fetch(request).then((res) => {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(request, clone));
          return res;
        })
      )
    );
    return;
  }

  // Pages — network first, fall back to cache, then /offline
  e.respondWith(
    fetch(request)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE).then((c) => c.put(request, clone));
        return res;
      })
      .catch(() =>
        caches.match(request).then((cached) =>
          cached ?? caches.match('/offline')
        )
      )
  );
});
