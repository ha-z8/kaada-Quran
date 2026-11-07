import fs from 'node:fs';
const catalog=JSON.parse(fs.readFileSync('data/reciters-extra.json','utf8'));
for(const reader of catalog.reciters.filter(x=>['ياسر الدوسري','خالد الجليل','بندر بليله'].includes(x.name))){
 const url=reader.server+'001.mp3';
 try{
  const response=await fetch(url,{headers:{Range:'bytes=0-500'},signal:AbortSignal.timeout(16000)});
  const cors=response.headers.get('access-control-allow-origin')||'NONE';
  console.log(reader.name,JSON.stringify({status:response.status,cors,contentType:response.headers.get('content-type'),url}));
  await response.body?.cancel();
 }catch(e){console.log(reader.name,'UNAVAILABLE',e.message)}
}

// Live check: ensure this audit is rerun whenever optional reciter catalog changes.
