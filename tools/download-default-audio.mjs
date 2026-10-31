import {createWriteStream,existsSync,mkdirSync,readFileSync,statSync,renameSync,unlinkSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
const ROOT=resolve(import.meta.dirname,'..');
const DEST=join(ROOT,'offline-audio');
const RECITERS=[
 {name:'السديس',folder:'Abdurrahmaan_As-Sudais_192kbps'},
 {name:'محمد أيوب',folder:'Muhammad_Ayyoub_128kbps'}
];
const SURAH_LENGTHS=[7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];
if(SURAH_LENGTHS.length!==114||SURAH_LENGTHS.reduce((x,y)=>x+y,0)!==6236)throw Error('Quran length table invalid');
if(!existsSync(join(ROOT,'data','quran.json')))throw Error('Download project Quran data first');
const full=process.argv.includes('--all');
const test=process.argv.includes('--test');
const selected=full?RECITERS:RECITERS;
const tasks=[];
for(const reciter of selected){
 const dir=join(DEST,reciter.folder);mkdirSync(dir,{recursive:true});
 for(let s=1;s<=114;s++){if(test&&s>1)break;for(let a=1;a<=SURAH_LENGTHS[s-1];a++){
  const filename=String(s).padStart(3,'0')+String(a).padStart(3,'0')+'.mp3';
  const file=join(dir,filename);
  if(existsSync(file)&&statSync(file).size>1200)continue;
  tasks.push({url:'https://everyayah.com/data/'+reciter.folder+'/'+filename,file,reciter:reciter.name});
 }}
}
console.log('Existing verified audio files are skipped; remaining:',tasks.length);
let index=0,success=0,failed=[];
async function download(t){
 const tmp=t.file+'.part';
 for(let attempt=0;attempt<5;attempt++){
  try{
   const controller=new AbortController();
   const timeout=setTimeout(()=>controller.abort(),45000);
   let response;
   try{response=await fetch(t.url,{signal:controller.signal})}finally{clearTimeout(timeout)}
   if(!response.ok||!response.body||!/audio|octet-stream/i.test(response.headers.get('content-type')||''))throw Error('HTTP '+response.status+' not MP3');
   await pipeline(Readable.fromWeb(response.body),createWriteStream(tmp));
   if(statSync(tmp).size<=1200)throw Error('Truncated audio');
   renameSync(tmp,t.file);return;
  }catch(e){
   try{unlinkSync(tmp)}catch{}
   if(attempt===4)throw new Error(t.url+': '+e.message);
   await new Promise(r=>setTimeout(r,900*(attempt+1)));
  }
 }
}
async function worker(){while(index<tasks.length){const task=tasks[index++];try{await download(task);success++}catch(e){failed.push(e.message)}const done=success+failed.length;if(done%150===0||done===tasks.length)console.log(done+'/'+tasks.length+' remaining downloaded; failed '+failed.length)}}
await Promise.all(Array.from({length:8},worker));
const all=[];
for(const r of RECITERS){let count=0,bytes=0;const folder=join(DEST,r.folder);for(let s=1;s<=114;s++)for(let a=1;a<=SURAH_LENGTHS[s-1];a++){const p=join(folder,String(s).padStart(3,'0')+String(a).padStart(3,'0')+'.mp3');if(existsSync(p)&&statSync(p).size>1200){count++;bytes+=statSync(p).size}}all.push({reciter:r.name,folder:r.folder,files:count,bytes})}
mkdirSync(DEST,{recursive:true});writeFileSync(join(DEST,'manifest.json'),JSON.stringify({version:1,created:new Date().toISOString(),reciters:all},null,2));
console.log(all);
if(failed.length){writeFileSync(join(DEST,'download-errors.log'),failed.join('\n'));console.error(failed.slice(0,8));process.exitCode=1}
if(!test&&all.some(r=>r.files!==6236))throw Error('Offline package not complete: expected 6,236 MP3 per reciter');
