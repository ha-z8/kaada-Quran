import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=process.cwd();
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{
  const reqPath=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=path.resolve(root,'.'+(reqPath==='/'?'/index.html':reqPath));
  if(!file.startsWith(root+path.sep)&&file!==path.join(root,'index.html')){res.writeHead(403);res.end();return}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end('Not found');return}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(data)});
});
await new Promise(r=>server.listen(39393,'127.0.0.1',r));
let browser;
try{
 browser=await chromium.launch({headless:true});
 const context=await browser.newContext({viewport:{width:1400,height:900}});
 const page=await context.newPage();
 const errors=[];
 page.on('pageerror',err=>errors.push(err.message));
 await page.goto('http://127.0.0.1:39393/',{waitUntil:'domcontentloaded'});
 await page.locator('.surah-card').first().waitFor({timeout:30000});
 assert.equal(await page.locator('.surah-card').count(),114,'Surah index');
 await page.locator('[data-surah="2"]').first().click();
 await page.locator('.quran-page').waitFor({timeout:20000});
 assert.equal(await page.locator('.basmala').count(),1,'Surah al-Baqarah shows one basmala');
 await page.locator('#ayah-2-1').click();
 assert.equal(await page.locator('#verseDrawer').isVisible(),true,'Ayah actions');
 assert.equal(await page.locator('[data-playmode]').count(),3,'Three play options');
 await page.locator('#drawerClose').click();
 await page.goto('http://127.0.0.1:39393/#adhkar');
 await page.locator('.dhikr-card').first().waitFor();
 const first=page.locator('.dhikr-card').first();
 assert.ok((await first.locator('.count-button').innerText()).includes('٠'));
 await first.locator('.count-button').click();
 assert.ok((await page.locator('.dhikr-card').first().locator('.count-button').innerText()).includes('١'));
 await page.goto('http://127.0.0.1:39393/#audio');
 await page.locator('#readerSelect').waitFor();
 assert.equal(await page.locator('#readerSelect').inputValue(),'ar.sudais','Default reciter Sudais');
 await page.route('https://everyayah.com/data/**',route=>route.fulfill({status:200,headers:{'Content-Type':'audio/mpeg','Access-Control-Allow-Origin':'*'},body:Buffer.alloc(1200,67)}));
 await page.locator('#audioSurah').selectOption('1');
 await page.locator('#downloadSurah').click();
 await page.waitForFunction(()=>document.getElementById('downloadStatus')?.textContent.includes('اكتمل'),{timeout:25000});
 const savedAudio=await page.evaluate(async()=>{
   const cache=await caches.open('wird-audio-v5');
   return Boolean(await cache.match('https://everyayah.com/data/Abdurrahmaan_As-Sudais_192kbps/001001.mp3'));
 });
 assert.equal(savedAudio,true,'Offline Sudais audio cache');
 await page.unroute('https://everyayah.com/data/**');

 await page.locator('#checkAudio').click();
 await page.locator('#downloadStatus').waitFor();
 await page.goto('http://127.0.0.1:39393/#home');
 await page.evaluate(async()=>{await navigator.serviceWorker.ready});
 await context.setOffline(true);
 await page.reload({waitUntil:'domcontentloaded'});
 await page.locator('.surah-card').first().waitFor({timeout:15000});
 await page.goto('http://127.0.0.1:39393/#adhkar');
 await page.locator('.dhikr-card').first().waitFor({timeout:15000});
 assert.deepEqual(errors,[],'No uncaught JavaScript exceptions');
 console.log('PASS: 114 surahs, basmala, ayah actions, Hisn counters, Sudais, offline MP3 cache, offline reload, no JS errors');
 await context.close();
}finally{if(browser)await browser.close();server.close()}
