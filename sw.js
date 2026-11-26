const prefix = 'civics:' + self.registration.scope + ':';
const version = prefix + '6';
const assets = ['./','./index.html','./study.js','./questions.js','./app.webmanifest','./icon-180.png?v=constitution-quill','./icon-192.png?v=constitution-quill','./icon-512.png?v=constitution-quill'];
self.addEventListener('install', event => {
 event.waitUntil(caches.open(version).then(cache => cache.addAll(assets)));
});
self.addEventListener('activate', event => {
 event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(prefix) && key !== version).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
 if (event.request.method !== 'GET' || !event.request.url.startsWith(self.registration.scope)) return;
 event.respondWith(caches.open(version).then(async cache => {
  const cached = await cache.match(event.request);
  if (cached) return cached;
  try { return await fetch(event.request); }
  catch (error) {
   if (event.request.mode === 'navigate') return await cache.match('./index.html');
   throw error;
  }
 }));
});
