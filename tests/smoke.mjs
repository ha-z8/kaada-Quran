import {chromium} from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const ROOT=process.cwd();
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.json':'application/json','.svg':'image/svg+xml','.woff2':'font/woff2','.ttf':'font/ttf','.png':'image/png','.webmanifest':'application/manifest+json'};
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://127.0.0.1'),request=decodeURIComponent(u.pathname),file=path.resolve(ROOT,'.'+(request==='/'?'/index.html':request));
 if(!file.startsWith(ROOT+path.sep)){res.writeHead(403).end();return}
 fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end('Not found');return}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(data)});
});
await new Promise(resolve=>server.listen(39393,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true});
const ctx=await browser.newContext({viewport:{width:1280,height:820}});
const page=await ctx.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));
const BASE='http://127.0.0.1:39393';
const open=async hash=>{await page.goto(BASE+'/'+(hash||''),{waitUntil:'domcontentloaded'});await page.locator('#content:not(:has(.loading))').waitFor({timeout:20000})};
try{
 await open('');
 await page.locator('.surah-card').first().waitFor();
 assert.equal(await page.locator('.surah-card').count(),114,'114 surahs visible');
 assert.equal(await page.locator('.home-links .feature').count(),3,'Compact home links');
 await page.locator('#mainSearch').fill('الرحمن');
 await page.locator('.search-suggestions:not([hidden])').waitFor();
 assert.ok((await page.locator('.search-suggestion').count())>0,'Local Quran search suggestions');
 await page.locator('#mainSearch').fill('2:255');
 await page.locator('.search-suggestion[data-open="2:255"]').waitFor();

 await open('#quran/3/1');
 await page.locator('.plain-reader').waitFor();
 assert.equal(await page.locator('.plain-verse').count(),200,'Al Imran must contain 200 verses');
 assert.equal(await page.locator('.plain-basmala').count(),1,'Basmala separate and complete');
 assert.equal(await page.locator('.plain-verse-number').count(),200,'End-of-ayah numbers');
 assert.equal(await page.locator('.qcf-glyph').count(),0,'No private Quran font glyphs in Unicode mode');
 assert.doesNotMatch(await page.locator('.plain-reader').innerText(),/[\uE000-\uF8FF]/u,'No PUA private-use characters in user-visible Quran text');
 const second=await page.locator('.plain-verse[data-ayah="3:2"]').innerText();
 assert.ok(second.length>12&&!/[\\uE000-\\uF8FF]/u.test(second),'Al Imran ayah 2 is legible and contains no private-use glyphs');
 await page.locator('.plain-verse[data-ayah="3:2"]').click();
 assert.equal(await page.locator('#verseDrawer').isVisible(),true);
 await page.locator('#drawerClose').click();

 await page.locator('#modeSelect').selectOption('mushaf');
 await page.locator('.quran-page').waitFor();
 await page.waitForFunction(()=>document.querySelector('.quran-text')?.dataset.verifiedLayout==='safe-unicode',{timeout:7000});
 assert.equal(await page.locator('.qcf-glyph').count(),0,'No broken glyph circles in page view');
 assert.doesNotMatch(await page.locator('.quran-text').innerText(),/[\uE000-\uF8FF]/u,'No PUA codes in page reader');
 await page.locator('#modeSelect').selectOption('verses');
 assert.equal(await page.locator('.verse-card').count(),200,'Verse cards complete');

 await open('#adhkar');
 await page.locator('.dhikr-card').first().waitFor();
 await page.locator('.count-button').first().click();
 assert.ok((await page.locator('.count-button').first().innerText()).includes('١'),'Hisn count increments');
 await page.locator('#hisnSearch').fill('الصباح');
 await page.waitForTimeout(500);
 assert.ok((await page.locator('.chapter-button').count())>=1,'Hisn search');

 await open('#tasbih');
 await page.locator('[data-tasbih-add]').click();
 assert.ok((await page.locator('.tasbih-button strong').innerText()).includes('١'),'Tasbih increments');
 assert.ok((await page.locator('.tasbih-today').innerText()).includes('١'),'Daily counter persists');
 await page.locator('#tasbihGoal').selectOption('100');
 assert.equal(await page.locator('#tasbihGoal').inputValue(),'100');
 await page.reload();
 await page.locator('.tasbih-today').waitFor();
 assert.ok((await page.locator('.tasbih-today').innerText()).includes('١'),'Daily counter survives reload');

 await open('#audio');
 await page.locator('#readerSelect').waitFor();
 const readers=await page.locator('#readerSelect option').allTextContents();
 for(const reader of ['ياسر الدوسري','خالد الجليل','بندر بليله'])assert.ok(readers.some(x=>x.includes(reader)),'Missing curated reciter: '+reader);
 assert.ok(readers.length>=25,'Reciter catalog includes ayah and surah readers');
 assert.equal(await page.locator('#readerSelect').inputValue(),'ar.sudais','Default Sudais reader');
 const extra=await page.locator('#readerSelect option').evaluateAll(nodes=>nodes.find(x=>x.textContent.includes('ياسر الدوسري'))?.value);
 await page.locator('#readerSelect').selectOption(extra);
 await page.locator('[data-audiomode="surah"]').waitFor();
 assert.equal(await page.locator('[data-audiomode="one"]').count(),0,'Whole-surah recorder must not promise single ayah playback');
 assert.equal(await page.locator('#audioAyah').count(),0,'No impossible seek-to-ayah for full-surah audio');

 await open('#settings');await page.locator('#settingsFont').waitFor();
 await open('#sources');await page.locator('.sources-grid a').first().waitFor();
 await open('#home');await page.evaluate(async()=>navigator.serviceWorker.ready);
 await ctx.setOffline(true);
 await page.reload({waitUntil:'domcontentloaded'});
 await page.locator('.surah-card').first().waitFor({timeout:15000});
 await open('#quran/3/1');
 await page.locator('.plain-reader').waitFor();
 assert.equal(await page.locator('.plain-verse').count(),200,'Offline Quran complete');
 await open('#adhkar');await page.locator('.dhikr-card').first().waitFor();
 await ctx.setOffline(false);

 for(const width of [320,375,390,430,768,1280]){
  await page.setViewportSize({width,height:840});
  await open('#home');
  const layout=await page.evaluate(()=>({full:document.documentElement.scrollWidth,inner:document.documentElement.clientWidth}));
  assert.ok(layout.full<=layout.inner+3,'Global horizontal overflow at width '+width);
 }
 assert.deepEqual(errors,[],'No uncaught JavaScript errors');
 console.log('PASS: Quran safe Unicode 200 ayahs, PUA blocked, adhkar, daily tasbih, 26+ reciters, search, offline, responsive');
}finally{await browser.close();server.close()}
