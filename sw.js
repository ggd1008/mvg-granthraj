/* MVG Granthraj service worker: simple cache-first.
   Experimental seva project, respect privacy terms, no illegal.
   When you upload a new index.html, raise the number below (v2 -> v3) so phones fetch the new copy. */
const CACHE='mvg-granthraj-v2';
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
  e.respondWith(caches.match(r,{ignoreSearch:true}).then(hit=>hit||fetch(r).then(res=>{
    if(res&&res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(r,copy));}
    return res;
  }).catch(()=>caches.match('index.html'))));
});
