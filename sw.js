const CACHE = 'capriration-mobile-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon_192.png',
  '/icons/icon_512.png',
  '/icons/CapriRation_full.png'
];

self.addEventListener('install', e=>{
  e.waitUntil(
    caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate', e=>{
  e.waitUntil(
    caches.keys().then(keys=>
      Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))
    ).then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch', e=>{
  if(e.request.url.includes('firebaseio') ||
     e.request.url.includes('googleapis') ||
     e.request.url.includes('gstatic') ||
     e.request.url.includes('firestore')){
    e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached=>{
      if(cached) return cached;
      return fetch(e.request).then(resp=>{
        const clone = resp.clone();
        caches.open(CACHE).then(c=>c.put(e.request,clone));
        return resp;
      });
    })
  );
});
