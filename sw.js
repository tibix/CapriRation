// CapriRation Mobile — Service Worker
// Page (index.html) : réseau d'abord → les mises à jour arrivent sans changer CACHE.
// Icônes / manifest : cache d'abord.
// Changer CACHE seulement si on modifie les icônes ou le manifest.
const CACHE = 'capriration-mobile-v3.8';
const ASSETS = [
  '/CapriRation/',
  '/CapriRation/index.html',
  '/CapriRation/manifest.json',
  '/CapriRation/icons/icon_192.png',
  '/CapriRation/icons/icon_512.png',
  '/CapriRation/icons/CapriRation_full.png'
];

// Installation : chaque fichier est mis en cache séparément.
// Un fichier manquant (404) ne bloque plus la mise à jour, il est signalé en console.
self.addEventListener('install', e=>{
  e.waitUntil(
    caches.open(CACHE).then(c=>Promise.all(ASSETS.map(url=>
      c.add(url).catch(err=>console.warn('[SW] Fichier non mis en cache :', url, err))
    ))).then(()=>self.skipWaiting())
  );
});

// Activation : suppression des anciens caches + prise de contrôle immédiate
self.addEventListener('activate', e=>{
  e.waitUntil(
    caches.keys().then(keys=>
      Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))
    ).then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch', e=>{
  if(e.request.method !== 'GET') return;
  const url = e.request.url;

  // Firebase / Google : toujours le réseau (cache seulement si hors ligne)
  if(url.includes('firebaseio') || url.includes('googleapis') ||
     url.includes('gstatic') || url.includes('firestore')){
    e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));
    return;
  }

  // Page (index.html) : réseau d'abord → toujours la dernière version en ligne,
  // copie en cache si pas de réseau
  if(e.request.mode === 'navigate'){
    e.respondWith(
      fetch(e.request).then(resp=>{
        if(resp.ok){
          const clone = resp.clone();
          caches.open(CACHE).then(c=>c.put(e.request, clone));
        }
        return resp;
      }).catch(()=>caches.match(e.request).then(r=>r || caches.match('/CapriRation/index.html')))
    );
    return;
  }

  // Le reste (icônes, manifest) : cache d'abord
  e.respondWith(
    caches.match(e.request).then(cached=>{
      if(cached) return cached;
      return fetch(e.request).then(resp=>{
        if(resp.ok){
          const clone = resp.clone();
          caches.open(CACHE).then(c=>c.put(e.request, clone));
        }
        return resp;
      });
    })
  );
});
