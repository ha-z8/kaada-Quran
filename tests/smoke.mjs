import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root=process.cwd();
const MIME={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.woff2':'font/woff2','.ttf':'font/ttf','.png':'image/png','.mp3':'audio/mpeg'};
const server=http.createServer((req,res)=>{
 let name;
 try{name=decodeURIComponent(new URL(req.url,'http://local').pathname)}catch{res.writeHead(400);res.end();return}
 const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));
 if(!file.startsWith(root+path.sep)&&file!==path.join(root,'index.html')){res.writeHead(403);res.end();return}
 fs.readFile(file,(error,body)=>{
  if(error){res.writeHead(404);res.end('Not found');return}
  res.writeHead(200,{'Content-Type':MIME[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(body);
 });
});
await new Promise(resolve=>server.listen(39393,'127.0.0.1',resolve));
let browser;
try{
 browser=await chromium.launch({headless:true});
 const ctx=await browser.newContext({viewport:{width:1280,height:900},serviceWorkers:'allow'});
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const base='http://127.0.0.1:39393';
 await page.goto(base+'/#home');
 await page.locator('.surah-card').first().waitFor({timeout:25000});
 assert.equal(await page.locator('.surah-card').count(),114,'All 114 surahs');
 assert.equal(await page.locator('.feature').count(),3,'Simplified main navigation');

 await page.locator('#mainSearch').fill('الرحمن');
 await page.locator('.search-suggestions:not([hidden])').waitFor();
 assert.ok((await page.locator('.search-suggestion').count())>0,'Offline search suggestions');
 await page.locator('#mainSearch').fill('2:255');
 await page.locator('.search-suggestion[data-open="2:255"]').waitFor();
 await page.locator('#mainSearch').press('Enter');
 await page.locator('.search-result[data-open="2:255"]').waitFor();

 await page.goto(base+'/#quran/2/1');
 await page.locator('.plain-reader').waitFor();
 assert.equal(await page.locator('.plain-verse').count(),286,'Every Al-Baqarah verse in plain mode');
 assert.equal(await page.locator('.plain-verse-number').count(),286,'Every verse has one Unicode end-number');
 assert.equal(await page.locator('.qcf-glyph').count(),0,'No unverified Quran PUA glyphs');
 assert.equal(await page.locator('.plain-basmala').count(),1,'Exactly one separate al-Baqarah Basmala');
 await page.locator('.plain-verse[data-ayah="2:1"]').click();
 await page.locator('#verseDrawer').waitFor();
 assert.equal(await page.locator('[data-playmode]').count(),3,'Available play modes');
 await page.evaluate(()=>{window.__audioStarts=0;AudioEngine.start=()=>window.__audioStarts++});
 await page.locator('[data-playmode="one"]').click();
 assert.equal(await page.evaluate(()=>window.__audioStarts),1,'Single audio request per button press');
 await page.locator('#drawerClose').click();

 await page.locator('#modeSelect').selectOption('mushaf');
 await page.locator('.quran-page').waitFor();
 assert.equal(await page.locator('.qcf-glyph').count(),0,'Mushaf pages must not expose malformed glyph sequences');
 const QuranText=JSON.parse(fs.readFileSync('data/quran.json','utf8'))[1].verses[0].text;
 const rendered=await page.locator('.quran-text').innerText();
 assert.ok(rendered.includes('الم'),'Page keeps Al-Baqarah first verse');
 assert.equal(await page.evaluate(()=>W.state.qcfIndex?.firstByPage?.length),604,'604 Quran page pointers');
 await page.locator('#modeSelect').selectOption('verses');
 await page.locator('.verse-card').first().waitFor();
 assert.equal(await page.locator('.verse-card').count(),286,'Individual ayah cards');
 await page.locator('#modeSelect').selectOption('plain');

 await page.goto(base+'/#adhkar');
 await page.locator('.dhikr-card').first().waitFor();
 const before=await page.locator('.count-button').first().innerText();
 await page.locator('.count-button').first().click();
 const after=await page.locator('.count-button').first().innerText();
 assert.notEqual(after,before,'Dhikr counter changes');
 await page.goto(base+'/#tasbih');
 await page.locator('.tasbih-button').waitFor();
 const n=await page.locator('.tasbih-button strong').innerText();
 await page.locator('[data-tasbih-add]').click();
 assert.notEqual(await page.locator('.tasbih-button strong').innerText(),n,'Tasbih increment');

 await page.goto(base+'/#audio');
 await page.locator('#readerSelect').waitFor();
 assert.equal(await page.locator('#readerSelect').inputValue(),'ar.sudais','Sudais default');
 assert.ok(await page.locator('#readerSelect option').count()>=26,'All curated extra reciters loaded');
 for(const name of ['ياسر الدوسري','خالد الجليل','بندر بليله']){
  assert.ok((await page.locator('#readerSelect').innerText()).includes(name),'Verified reader: '+name);
 }
 await page.locator('#playbackSpeed').selectOption('1.25');
 assert.equal(await page.evaluate(()=>AudioEngine.getPreferences().speed),1.25,'Saved playback speed');
 await page.goto(base+'/#settings');
 await page.locator('#settingsTheme').selectOption('dark');
 assert.equal(await page.locator('body').evaluate(x=>x.classList.contains('dark')),true,'Dark appearance');
 await page.locator('#settingsTheme').selectOption('light');

 for(const width of [320,360,390,430,768,1280]){
  await page.setViewportSize({width,height:800});
  await page.goto(base+'/#home');
  await page.locator('.surah-card').first().waitFor();
  const info=await page.evaluate(()=>({documentWidth:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth}));
  assert.ok(info.documentWidth<=info.viewport+4,'No horizontal overflow at '+width+'px');
  if(width<710){
   await page.locator('#navMore').click();
   assert.equal(await page.locator('#navExtra').isVisible(),true,'Mobile menu opens at '+width);
   await page.locator('#navMore').click();
  }
 }

 await page.goto(base+'/#home');
 await page.evaluate(()=>navigator.serviceWorker.ready);
 await ctx.setOffline(true);
 await page.reload({waitUntil:'domcontentloaded'});
 await page.locator('.surah-card').first().waitFor({timeout:15000});
 await page.goto(base+'/#quran/2/1');
 await page.locator('.plain-reader').waitFor();
 assert.equal(await page.locator('.plain-verse').count(),286,'Offline full Al-Baqarah');
 await page.goto(base+'/#adhkar');
 await page.locator('.dhikr-card').first().waitFor();
 assert.deepEqual(errors,[],'No unhandled browser JavaScript exceptions');
 console.log('PASS: full Quran text, safe Unicode, Arabic search, 26 reciters, Hisn, tasbih, mobile layouts, offline mode');
 await ctx.close();
}finally{if(browser)await browser.close();server.close()}
