// غيّر رقم الإصدار عند كل تحديث للبرنامج حتى يصل التحديث للأجهزة
const CACHE = 'daily-work-v1';
const FILES = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // صفحة البرنامج: من الإنترنت أولاً (لأخذ آخر تحديث)، وإذا لا يوجد إنترنت من النسخة المحفوظة
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then(r => {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put('./index.html', copy));
        return r;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // الخطوط والأيقونات وباقي الملفات: من النسخة المحفوظة أولاً
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
      if (r.ok || r.type === 'opaque') {
        const copy = r.clone();
        if (url.origin === location.origin || url.host.includes('fonts.g')) {
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
      }
      return r;
    }).catch(() => hit))
  );
});
