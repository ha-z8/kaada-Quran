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
 await page.locator('#mainSearch').fill('الرحمن');
 await page.locator('.search-suggestions:not([hidden])').waitFor();
 assert.ok((await page.locator('.search-suggestion').count())>0,'Live search suggestions appear');
 assert.ok((await page.locator('.search-suggestion mark').count())>0,'Matched Quran words are visually highlighted');
 await page.locator('#mainSearch').fill('2:255');
 await page.locator('.search-suggestion[data-open="2:255"]').waitFor();
 await page.locator('#mainSearch').press('Enter');
 await page.locator('.search-result[data-open="2:255"]').waitFor();
 await page.goto('http://127.0.0.1:39393/#home');

 await page.locator('[data-surah="2"]').first().click();
 await page.locator('.quran-page').waitFor({timeout:20000});
 await page.waitForFunction(()=>document.querySelector('.quran-text')?.dataset.verifiedLayout==='qcf-v2',{timeout:15000});
 assert.equal(await page.locator('.qcf-basmala').count(),1,'Madinah page has exactly one basmala');
 assert.match(await page.locator('.qcf-basmala').innerText(),/بِسْمِ.*اللَّهِ.*الرَّحْمَٰنِ.*الرَّحِيمِ/,'Complete visible Basmala in Al-Baqarah');
 await page.evaluate(()=>document.fonts.ready);
 const desktopBasmala=await page.locator('.qcf-basmala-words').evaluate(el=>{
   const outer=el.closest('.qcf-basmala').getBoundingClientRect(),rect=el.getBoundingClientRect();
   return {text:el.textContent,width:rect.width,container:outer.width,left:rect.left,outerLeft:outer.left,right:rect.right,outerRight:outer.right,height:rect.height};
 });
 assert.ok(desktopBasmala.width>150&&desktopBasmala.height>20,'Desktop Basmala must have visible glyphs');
 assert.ok(desktopBasmala.left>=desktopBasmala.outerLeft-3&&desktopBasmala.right<=desktopBasmala.outerRight+3,'Full desktop Basmala fits the Quran page');
 assert.equal(await page.locator('.qcf-lines').locator(':scope > div').count(),15,'15 complete printed lines including intentional blanks');
 await page.locator('#quranFontSize').fill('44');
 await page.locator('#quranFontSize').dispatchEvent('change');
 await page.locator('.quran-text[data-verified-layout="qcf-v2"]').waitFor();
 assert.equal(await page.evaluate(()=>W.state.size),44,'QCF reader font size control is connected');
 await page.locator('#quranFontSize').fill('32');
 await page.locator('#quranFontSize').dispatchEvent('change');
 await page.locator('.quran-text[data-verified-layout="qcf-v2"]').waitFor();
 
 await page.locator('#modeSelect').selectOption('plain');
 await page.locator('.plain-reader').waitFor();
 assert.equal(await page.locator('.plain-verse').count(),286,'Normal reading shows every verse of Al-Baqarah');
 assert.equal(await page.locator('.plain-basmala').count(),1,'Normal reading shows one Basmala');
 assert.equal(await page.locator('.ayah-badge').count(),0,'Normal reading has no unwanted decorative circles');
 assert.equal(await page.locator('.plain-verse-number').count(),286,'Normal verse-end numbers are complete');
 await page.locator('.plain-verse[data-ayah="2:1"]').click();
 assert.equal(await page.locator('#verseDrawer').isVisible(),true,'Normal reading supports ayah actions');
 await page.locator('#drawerClose').click();
 await page.locator('#modeSelect').selectOption('verses');
 assert.equal(await page.locator('.verse-card').count(),286,'Verse-by-verse reading complete');
 await page.locator('#modeSelect').selectOption('mushaf');
 await page.locator('.quran-text[data-verified-layout="qcf-v2"]').waitFor();
 assert.ok((await page.locator('.qcf-line').count())>=4,'Exact Madinah page line layout');
 await page.goto('http://127.0.0.1:39393/#page/604');
 await page.locator('.quran-text[data-verified-layout="qcf-v2"]').waitFor({timeout:20000});
 assert.ok((await page.locator('.qcf-line').count())>=3,'Last Madinah page line layout');
 await page.goto('http://127.0.0.1:39393/#quran/2/1');
 await page.locator('.quran-text[data-verified-layout="qcf-v2"]').waitFor({timeout:20000});

 await page.locator('.qcf-glyph[data-ayah="2:1"]').first().click();
 assert.equal(await page.locator('#verseDrawer').isVisible(),true,'Ayah actions');
 assert.doesNotMatch(await page.locator('#drawerText').innerText(),/بِسْمِ/,'Al-Baqarah verse text must not duplicate its separate Basmala');
 assert.equal(await page.locator('[data-playmode]').count(),3,'Three play options');
 await page.evaluate(()=>{window.__audioStartCalls=0;window.__actualAudioStart=AudioEngine.start;AudioEngine.start=()=>{window.__audioStartCalls++}});
 await page.locator('[data-playmode="one"]').click();
 assert.equal(await page.evaluate(()=>window.__audioStartCalls),1,'Playing one ayah must make exactly one audio request');
 await page.evaluate(()=>{AudioEngine.start=window.__actualAudioStart});

 await page.locator('#drawerClose').click();
 await page.goto('http://127.0.0.1:39393/#adhkar');
 await page.locator('.dhikr-card').first().waitFor();
 const first=page.locator('.dhikr-card').first();
 assert.ok((await first.locator('.count-button').innerText()).includes('٠'));
 await first.locator('.count-button').click();
 assert.ok((await page.locator('.dhikr-card').first().locator('.count-button').innerText()).includes('١'));
 await page.goto('http://127.0.0.1:39393/#tasbih');
 await page.locator('.tasbih-button').waitFor();
 await page.locator('[data-tasbih-add]').click();
 assert.ok((await page.locator('.tasbih-button strong').innerText()).includes('١'));
 await page.goto('http://127.0.0.1:39393/#sources');
 await page.locator('.sources-grid a').first().waitFor();
 await page.goto('http://127.0.0.1:39393/#settings');
 await page.locator('#downloadQCF').waitFor();
 await page.locator('#runDiagnostics').click();
 await page.locator('.diag-list').waitFor({timeout:15000});
 assert.ok((await page.locator('.diag-item').count())>=7,'Diagnostics covers Quran, audio, QCF and fonts');

 await page.goto('http://127.0.0.1:39393/#audio');
 await page.locator('#readerSelect').waitFor();
 assert.equal(await page.locator('#readerSelect').inputValue(),'ar.sudais','Default reciter Sudais');
 const defaults=await page.evaluate(()=>AudioEngine.getPreferences());
 assert.deepEqual(defaults,{speed:1,repeat:1,volume:1},'Audio must not start silent');
 assert.equal(await page.locator('#readerSelect option').count(),12,'12 reciters available');
 await page.locator('#playbackSpeed').selectOption('1.25');
 await page.locator('#repeatCount').selectOption('3');
 await page.locator('#playbackVolume').fill('0.8');
 await page.locator('#playbackVolume').dispatchEvent('change');
 assert.deepEqual(await page.evaluate(()=>AudioEngine.getPreferences()),{speed:1.25,repeat:3,volume:0.8},'Persisted audio options');
 await page.goto('http://127.0.0.1:39393/#home');
 await page.goto('http://127.0.0.1:39393/#audio');
 await page.locator('#readerSelect').waitFor();
 assert.equal(await page.locator('#playbackSpeed').inputValue(),'1.25');
 assert.equal(await page.locator('#repeatCount').inputValue(),'3');
 assert.equal(await page.locator('#playbackVolume').inputValue(),'0.8');
 const audioSources=await page.evaluate(()=>{
  const v=W.state.flat[0];
  const sudais=AudioEngine.RECITERS.find(r=>r.id==='ar.sudais');
  const ayoub=AudioEngine.RECITERS.find(r=>r.id==='ar.muhammadayoub');
  return [AudioEngine.fileURL(sudais,v),AudioEngine.fileURL(ayoub,v)];
 });
 assert.ok(audioSources[0].endsWith('/Abdurrahmaan_As-Sudais_192kbps/001001.mp3'));
 assert.ok(audioSources[1].endsWith('/Muhammad_Ayyoub_128kbps/001001.mp3'));

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
 await page.goto('http://127.0.0.1:39393/#quran/2/1');
 await page.locator('#modeSelect').waitFor({timeout:15000});
 await page.locator('#modeSelect').selectOption('plain');
 assert.equal(await page.locator('.plain-verse').count(),286,'All Al-Baqarah verses available in normal reading without internet');
 assert.equal(await page.locator('.plain-verse-number').count(),286,'Verse endings available offline');
 await page.locator('#modeSelect').selectOption('mushaf');
 await context.setOffline(false);
 await page.setViewportSize({width:390,height:844});
 await page.goto('http://127.0.0.1:39393/#tasbih');
 await page.locator('.tasbih-button').waitFor();
 assert.equal(await page.locator('.nav a').count(),8,'All navigation sections accessible on mobile');
 const navVisible=await page.locator('.sidebar').isVisible();
 assert.equal(navVisible,true,'Mobile navigation visible');
 await page.locator('#navMore').click();
 assert.equal(await page.locator('#navExtra').isVisible(),true,'Additional navigation opens on mobile');
 await page.locator('#navExtra a[href="#settings"]').click();
 await page.locator('#settingsFont').waitFor();
 assert.equal(await page.locator('#navExtra').isVisible(),false,'Menu closes after navigation');
 const horizontal=await page.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
 assert.ok(horizontal.scroll<=horizontal.client+3,'No global horizontal overflow on phone');
 for(const width of [320,360,390,430,768]){
  await page.setViewportSize({width,height:850});
  await page.goto('http://127.0.0.1:39393/#home');
  await page.locator('.surah-card').first().waitFor();
  const nav=await page.locator('.sidebar .nav>a, .sidebar .nav-more').evaluateAll(els=>els.filter(el=>getComputedStyle(el).display!=='none').map(el=>{
    const r=el.getBoundingClientRect(),t=el.querySelector('span:last-child'),span=t?.getBoundingClientRect();
    return {text:t?.innerText,left:r.left,right:r.right,top:r.top,bottom:r.bottom,labelWidth:span?.width||0,labelScrollWidth:t?.scrollWidth||0};
  }));
  if(width<=710){
   assert.equal(nav.length,5,'Bottom navigation has five entries at width '+width);
   for(let i=1;i<nav.length;i++)assert.ok(nav[i].right<=nav[i-1].left+2,'Navigation labels do not overlap at '+width);
   for(const item of nav)assert.ok(item.labelScrollWidth<=item.labelWidth+3,'No truncated navigation label at '+width+': '+item.text);
  }
  const dims=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:document.documentElement.clientWidth}));
  assert.ok(dims.scroll<=dims.width+3,'No horizontal overflow at '+width);
}
await page.setViewportSize({width:390,height:844});

 await page.goto('http://127.0.0.1:39393/#settings');
 await page.locator('#settingsFont').waitFor();
 await page.locator('#settingsFont').selectOption('Naskh');
 await page.goto('http://127.0.0.1:39393/#quran/1/1');
 await page.locator('.quran-page').waitFor();
 assert.equal(await page.evaluate(()=>W.state.font),'Naskh','Separate Quran font control');
 await page.goto('http://127.0.0.1:39393/#quran/5/77');
 await page.locator('.quran-text[data-verified-layout="qcf-v2"]').waitFor({timeout:20000});
 assert.equal(await page.evaluate(()=>W.state.page),120,'QCF page index overrides API page for verse 5:77');
 await page.goto('http://127.0.0.1:39393/#quran/2/1');
 await page.locator('.quran-text[data-verified-layout="qcf-v2"]').waitFor({timeout:20000});
 const clipped=await page.evaluate(()=>{
   const lines=[...document.querySelectorAll('.qcf-line')].filter(x=>!x.classList.contains('qcf-blank'));
   return lines.filter(line=>line.scrollWidth>line.clientWidth+4).length;
 });
 assert.equal(clipped,0,'QCF printed lines must not overflow on a narrow phone screen');
 const mobileBasmala=await page.locator('.qcf-basmala-words').evaluate(el=>{const box=el.closest('.qcf-basmala').getBoundingClientRect(),r=el.getBoundingClientRect();return {width:r.width,height:r.height,left:r.left,right:r.right,boxLeft:box.left,boxRight:box.right}});
 assert.ok(mobileBasmala.height>12&&mobileBasmala.left>=mobileBasmala.boxLeft-4&&mobileBasmala.right<=mobileBasmala.boxRight+4,'Mobile Basmala fully visible');


assert.deepEqual(errors,[],'No uncaught JavaScript exceptions');
 console.log('PASS: 114 surahs, basmala, ayah actions, Hisn counters, Sudais, offline MP3 cache, offline reload, no JS errors');
 await context.close();
}finally{if(browser)await browser.close();server.close()}
