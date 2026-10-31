// Availability checks run against the real CDN; they may fail during provider outages.
import fs from 'node:fs';
const script=fs.readFileSync('audio5.js','utf8');
const re=/id:'([^']+)',name:'([^']+)',rate:(\d+)/g;
const list=[...script.matchAll(re)].map(x=>({id:x[1],name:x[2],rate:Number(x[3])}));
if(list.length<5)throw Error('Reader catalog missing');
async function probe(r,n){
 const url='https://cdn.islamic.network/quran/audio/'+r.rate+'/'+r.id+'/'+n+'.mp3';
 try{const response=await fetch(url,{method:'HEAD',signal:AbortSignal.timeout(14000)});return response.status}catch(e){return 'ERROR '+e.message.slice(0,50)}
}
let failures=0;
for(const r of list){
 const first=await probe(r,1);
 const last=await probe(r,6236);
 console.log(r.id+' '+r.rate+' kbps :: ayah 1 = '+first+' | ayah 6236 = '+last);
 if(first!==200||last!==200)failures++;
}
console.log('Reciters needing investigation:',failures,'/',list.length);
if(failures)process.exitCode=1;
