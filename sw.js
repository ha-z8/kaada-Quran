const VERSION='wird-shell-v6-1-20261031';
const CORE=['./','./index.html','./v5.css','./audio5.js','./v5.js','./manifest.webmanifest','./icon.svg','./data/quran.json','./data/hisn.json','./assets/college-logo.png'];
const OPTIONAL=['./adhkar.html','./audio.html','./og-cover.svg','./fonts/kfg-hafs.woff2','./fonts/kfg-naskh.woff2','./fonts/kfg-digital-v2.woff2'];
self.addEventListener('install',event=>{event.waitUntil((async()=>{const cache=await caches.open(VERSION);await cache.addAll(CORE);await Promise.all(OPTIONAL.map(async url=>{try{await cache.add(url)}catch{}}));await self.skipWaiting()})())});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k!==VERSION&&k!=='wird-audio-v5'&&k!=='wird-qcf-v6'&&(k.startsWith('wird-')||k.startsWith('kaada-quran-'))).map(k=>caches.delete(k)));await self.clients.claim()})())});
self.addEventListener('fetch',event=>{const request=event.request,url=new URL(request.url);if(request.method!=='GET'||url.origin!==location.origin)return;event.respondWith((async()=>{const cache=await caches.open(VERSION),cached=await caches.match(request,{ignoreSearch:false});
 if(request.mode==='navigate'){try{const response=await fetch(request);if(response.ok)await cache.put(request,response.clone());return response}catch{return cached||await cache.match('./index.html')||Response.error()}}
 if(cached)return cached;
 try{const response=await fetch(request);if(response.ok)await cache.put(request,response.clone());return response}catch{return Response.error()}
})())});