import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const q=JSON.parse(fs.readFileSync('data/quran.json','utf8'));
const source='https://api.alquran.cloud/v1/quran/quran-uthmani';
let payload,problem;
for(let attempt=0;attempt<3;attempt++){
 try{
  const response=await fetch(source,{headers:{'User-Agent':'WIRD-Quran-integrity-audit/1.0'},signal:AbortSignal.timeout(45000)});
  if(!response.ok)throw Error('Source API HTTP '+response.status);
  payload=await response.json();break;
 }catch(e){problem=e;await new Promise(r=>setTimeout(r,1500*(attempt+1)))}
}
if(!payload)throw Error('Could not independently re-download the primary published Quran source for audit: '+problem?.message);
assert.equal(payload.data?.surahs?.length,114,'Source incomplete');
let checked=0;
for(let s=0;s<114;s++){
 const sourceSurah=payload.data.surahs[s];
 assert.equal(sourceSurah.number,s+1);
 assert.equal(sourceSurah.ayahs.length,q[s].verses.length,'Number of verses changed in Surah '+(s+1));
 for(let a=0;a<sourceSurah.ayahs.length;a++){
  const official=sourceSurah.ayahs[a],local=q[s].verses[a],location=(s+1)+':'+(a+1);
  assert.equal(official.numberInSurah,a+1,'Verse numbering changed at '+location);
  assert.equal(local.text,official.text,'DIFFERENT QURAN TEXT at '+location);
  assert.equal(local.page,official.page,'Different Mushaf page at '+location);
  assert.equal(local.juz,official.juz,'Different Juz at '+location);
  checked++;
 }
}
assert.equal(checked,6236);
const hash=crypto.createHash('sha256').update(JSON.stringify(q.flatMap(s=>s.verses.map(v=>v.text)))).digest('hex');
console.log('PASS: all 6236 Quran verses exactly match the source quran-uthmani text, page and Juz metadata');
console.log('Content hash SHA-256:',hash);
