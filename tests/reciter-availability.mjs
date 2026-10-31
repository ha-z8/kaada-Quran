import fs from 'node:fs';
const source=fs.readFileSync('audio5.js','utf8');
const readers=[...source.matchAll(/id:'([^']+)',name:'([^']+)',rate:(\d+),folder:'([^']+)'/g)].map(x=>({id:x[1],name:x[2],rate:Number(x[3]),folder:x[4]}));
if(readers.length!==12)throw Error('Exactly 12 verified reciters expected');
async function check(url,headers={}){
 try{const r=await fetch(url,{method:Object.keys(headers).length?'GET':'HEAD',headers,signal:AbortSignal.timeout(13000)});const result={status:r.status,cors:r.headers.get('access-control-allow-origin')};if(r.body)await r.body.cancel();return result}
 catch(e){return {status:e.name,cors:null}}
}
let failed=0;
for(const r of readers){
 const base='https://everyayah.com/data/'+r.folder+'/';
 const first=await check(base+'001001.mp3'),last=await check(base+'114006.mp3');
 const cors=await check(base+'001001.mp3',{Range:'bytes=0-2'});
 const works=first.status===200&&last.status===200&&cors.status>=200&&cors.status<300&&cors.cors==='*';
 console.log(r.name+' '+r.id+': first '+first.status+' last '+last.status+' CORS '+cors.cors+' '+(works?'PASS':'FAIL'));
 if(!works)failed++;
}
console.log('Working reciters:',readers.length-failed,'/',readers.length);
if(failed)process.exitCode=1;
