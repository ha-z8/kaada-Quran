import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const raw=fs.readFileSync('data/quran.json','utf8');
const q=JSON.parse(raw);
const EXPECTED=[7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];
assert.equal(q.length,114,'114 surahs must be present');
const ayahKeys=new Set(),pageKeys=new Set();
let total=0,priorPage=1,lastJuz=1;
for(let i=0;i<q.length;i++){
 const surah=q[i];assert.equal(surah.id,i+1,'Surah number/order');
 assert.equal(surah.verses.length,EXPECTED[i],'Wrong ayah count in surah '+(i+1));
 assert.ok(typeof surah.name==='string'&&surah.name.trim(),'Missing surah name '+surah.id);
 for(let j=0;j<surah.verses.length;j++){
  const v=surah.verses[j],key=surah.id+':'+v.id;
  assert.equal(v.id,j+1,'Missing or reordered ayah '+(i+1)+':'+(j+1));
  assert.equal(typeof v.text,'string','Missing text '+key);
  assert.ok(v.text.trim().length>=1&&!/[\uFFFD\u0000-\u0008]/.test(v.text),'Empty or invalid Unicode '+key);
  assert.ok(Number.isInteger(v.page)&&v.page>=priorPage&&v.page<=604,'Page sequence '+key);
  assert.ok(Number.isInteger(v.juz)&&v.juz>=lastJuz&&v.juz<=30,'Juz sequence '+key);
  priorPage=v.page;lastJuz=v.juz;
  assert.ok(!ayahKeys.has(key),'Duplicate ayah '+key);ayahKeys.add(key);pageKeys.add(v.page);total++;
 }
}
assert.equal(total,6236);assert.equal(pageKeys.size,604);
assert.equal(lastJuz,30);
// AlQuran.Cloud stores a prefixed Basmala within the first ayah text of some surahs.
 // Preserve the source text unchanged. The QCF page shows its own separate Basmala line.
console.log('Al-Baqarah source first ayah prefix:',JSON.stringify(q[1].verses[0].text.slice(0,90)));
const references=new Set(),markers=new Set(),basmalaPages=[];
for(let page=1;page<=604;page++){
 const id=String(page).padStart(3,'0');
 const file='data/mushaf/pages/page-'+id+'.json';
 const obj=JSON.parse(fs.readFileSync(file,'utf8'));
 assert.equal(obj.page,page,'QCF page number '+page);
 assert.equal(obj.lines.length,15,'Printed 15 lines '+page);
 const basmallahs=obj.lines.filter(line=>line.type==='basmallah').length;
 assert.ok(basmallahs<=2,'Repeated basmala on page '+page);
 if(basmallahs)basmalaPages.push(page);
 for(let li=0;li<obj.lines.length;li++){
  const line=obj.lines[li];
  assert.equal(line.line,li+1,'Unexpected line order on page '+page);
  for(const word of line.words||[]){
   assert.ok(word.qpcV2&&typeof word.qpcV2==='string','Blank QCF glyph page '+page);
   assert.ok(/^\d{1,3}:\d{1,3}:\d+$/.test(word.location),'Invalid verse location '+word.location);
   const [s,a]=word.location.split(':').map(Number),key=s+':'+a;
   assert.ok(ayahKeys.has(key),'Page glyph references non-existing ayah '+key);
   assert.equal(q[s-1].verses[a-1].page,page,'Incorrect QCF page for '+key);
   references.add(key);
   if(word.kind==='marker'){
    assert.ok(!markers.has(key),'Repeated marker for verse '+key);
    markers.add(key);
   }
  }
 }
}
const uncovered=[...ayahKeys].filter(key=>!references.has(key));
const unmarked=[...ayahKeys].filter(key=>!markers.has(key));
assert.deepEqual(uncovered,[],'Every ayah must be present in QCF word locations');
assert.deepEqual(unmarked,[],'Every ayah must have an end-of-verse marker');
assert.ok(basmalaPages.includes(2),'Al-Baqarah page must include separate Basmala line');
const fingerprint=crypto.createHash('sha256').update(raw).digest('hex');
console.log('PASS: 114 surahs, 6236 ordered full-text verses, 604 pages / 15 lines, 6236 QCF references and markers');
console.log('Local Quran JSON SHA-256:',fingerprint);
console.log('QCF pages containing Basmala:',basmalaPages.length);
