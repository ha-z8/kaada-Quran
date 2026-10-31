import {existsSync,statSync,readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const dir=join(root,'offline-audio');
const dirs=['Abdurrahmaan_As-Sudais_192kbps','Muhammad_Ayyoub_128kbps'];
const verseCount=6236;
for(const d of dirs){
 let count=0;
 for(const s of JSON.parse(readFileSync(join(root,'data/quran.json'),'utf8'))){
  for(const v of s.verses){
   const file=join(dir,d,String(s.id).padStart(3,'0')+String(v.id).padStart(3,'0')+'.mp3');
   if(!existsSync(file)||statSync(file).size<=1200)throw Error('Missing offline MP3: '+file);
   count++;
  }
 }
 if(count!==verseCount)throw Error('Incorrect recitation count: '+d+' '+count);
 console.log(d, count, 'files verified');
}
console.log('Offline installer prerequisites verified: 2 complete Quran recitations');
