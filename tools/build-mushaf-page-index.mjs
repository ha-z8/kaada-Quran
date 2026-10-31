import fs from 'node:fs';
import assert from 'node:assert/strict';
const q=JSON.parse(fs.readFileSync('data/quran.json','utf8'));
const firstSeen={},firstByPage=[];
for(let page=1;page<=604;page++){
 const path='data/mushaf/pages/page-'+String(page).padStart(3,'0')+'.json';
 const data=JSON.parse(fs.readFileSync(path,'utf8'));
 const words=data.lines.flatMap(line=>line.words||[]);
 const first=words.find(word=>word.kind!=='marker'&&word.location);
 if(!first)throw Error('No Quran text for QCF page '+page);
 const [s,a]=first.location.split(':').map(Number);
 firstByPage.push([s,a]);
 for(const word of words){
  const [s,a]=word.location.split(':').map(Number),key=s+':'+a;
  if(!(key in firstSeen))firstSeen[key]=page;
 }
}
const diff={};let total=0;
for(const s of q)for(const v of s.verses){
 const key=s.id+':'+v.id,first=firstSeen[key];
 assert.ok(first>=1&&first<=604,'Missing QCF start for '+key);
 if(first!==v.page){diff[key]=first;total++}
}
const dest='data/mushaf/verse-page-index.json';
fs.writeFileSync(dest,JSON.stringify({version:1,source:'Madinah Mushaf QCF V2 / QUL verified 604 pages',overrides:diff,firstByPage},null,0)+'\n');
console.log('QCF page index generated for all 6236 verses. Overrides:',total,'page-first entries:',firstByPage.length);
