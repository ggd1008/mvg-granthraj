/* MVG Vani service worker: simple cache-first.
   Experimental seva project, respect privacy terms, no illegal.
   The app page itself is fetched from the network first (so updates arrive on their own), and falls back to the saved copy when offline.
   Other files stay cache-first. When you change the cache name below, phones switch to the new copy. */
const CACHE='mvg-granthraj-v7';
const FILES=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>Promise.all(FILES.map(f=>c.add(f).catch(()=>{})))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('mvg-granthraj-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET'||new URL(r.url).origin!==self.location.origin)return;   // API calls and other sites go straight to the network
  if(r.cache==='no-store')return;                                              // the Admin kit export wants the live file
  const u=new URL(r.url);
  const isPage=r.mode==='navigate'||u.pathname==='/'||u.pathname.endsWith('/index.html')||u.pathname==='';
  if(isPage){                                                                 // page: network first, saved copy when offline
    e.respondWith(fetch(r).then(res=>{if(res&&res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(r,copy));}return res}).catch(()=>caches.match(r,{ignoreSearch:true}).then(h=>h||caches.match('index.html'))));
    return;
  }
  e.respondWith(caches.match(r,{ignoreSearch:true}).then(hit=>hit||fetch(r).then(res=>{
    if(res&&res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(r,copy));}
    return res;
  }).catch(()=>caches.match('index.html'))));
});

/* Sadhana reminder: show the notification, and open the app when it is tapped. */
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data.json(); } catch (x) {}
  e.waitUntil(self.registration.showNotification(d.title || 'MVG Vani', { body: d.body || '', icon: 'icon-192.png', badge: 'icon-192.png', tag: 'sadhana', data: { url: d.url || './' } }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: 'window' }).then(list => {
    for (const c of list) { if ('focus' in c) return c.focus(); }
    return clients.openWindow(e.notification.data.url || './');
  }));
});
