'use strict';
const CACHE='begemot-iphone-shell-v1';
const SHELL=[
 './','./index.html','./style.css','./v2.css','./v3.css','./engine.js','./rich.js',
 './chat-store.js','./archive-ui.js','./app.js','./features.js','./web-v3.js',
 './system-prompt.txt','./manifest.webmanifest','./assets/icon-180.png',
 './assets/icon-192.png','./assets/icon-512.jpg','./assets/purr.mp3','./assets/meow.mp3',
 '../brand.jpg','../data/directory.json','../data/us.json','../../../favicon.svg'
];
const ALLOWED=new Set(SHELL.map(p=>new URL(p,self.registration.scope).pathname));
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('begemot-iphone-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
 const req=event.request,url=new URL(req.url);
 if(req.method!=='GET'||url.origin!==self.location.origin||!ALLOWED.has(url.pathname))return;
 if(req.mode==='navigate'){
  event.respondWith(fetch(req).catch(()=>caches.match(new URL('./index.html',self.registration.scope).href)));
  return;
 }
 event.respondWith(caches.open(CACHE).then(async cache=>{
  const cached=await cache.match(url.pathname);
  if(cached)return cached;
  return fetch(req);
 }));
});