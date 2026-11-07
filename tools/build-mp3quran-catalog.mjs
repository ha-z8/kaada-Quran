import {writeFileSync,mkdirSync} from 'node:fs';
const endpoint='https://mp3quran.net/api/v3/reciters?language=ar';
const choices=[
 ['ياسر الدوسري',['ياسر الدوسري']],
 ['خالد الجليل',['خالد الجليل']],
 ['بندر بليله',['بندر بليله','بندر بليلة']],
 ['ماهر المعيقلي',['ماهر المعيقلي']],
 ['فارس عباد',['فارس عباد']],
 ['سعد الغامدي',['سعد الغامدي']],
 ['إدريس أبكر',['إدريس أبكر']],
 ['ناصر القطامي',['ناصر القطامي']],
 ['عبدالله الجهني',['عبدالله عواد الجهني']],
 ['صلاح البدير',['صلاح البدير']],
 ['هاني الرفاعي',['هاني الرفاعي']],
 ['علي جابر',['علي جابر']],
 ['إسلام صبحي',['إسلام صبحي']],
 ['رعد الكردي',['رعد محمد الكردي']]
];
const normalize=s=>String(s).replace(/[آأإٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/[ًٌٍَُِّْـ]/g,'').replace(/\\s+/g,' ').trim();
let response;for(let attempt=0;attempt<3;attempt++){try{response=await fetch(endpoint,{signal:AbortSignal.timeout(25000)});if(!response.ok)throw Error('HTTP '+response.status);break}catch(e){if(attempt===2)throw e;await new Promise(resolve=>setTimeout(resolve,1600*(attempt+1)))}}
const data=await response.json();
if(!Array.isArray(data.reciters)||data.reciters.length<100)throw Error('Invalid official MP3Quran API response');
const extra=[];
for(const [title,names] of choices){
 const item=data.reciters.find(r=>names.some(n=>normalize(r.name)===normalize(n)));
 if(!item){console.log('Not found:',title);continue}
 const all=(item.moshaf||[]).filter(m=>m.server&&/^https:\/\//.test(m.server)&&m.surah_list);
 const best=all.sort((a,b)=>Number(b.surah_total)-Number(a.surah_total))[0];
 if(!best){console.log('No recorded surah:',title);continue}
 const chapters=[...new Set(String(best.surah_list).split(',').map(Number).filter(n=>Number.isInteger(n)&&n>=1&&n<=114))];
 if(!chapters.length)continue;
 const url=new URL(best.server);
 if(!/^https:$/.test(url.protocol))continue;
 const clean=best.server.replace(/\/+$/,'')+'/';
 extra.push({id:'mp3quran-'+item.id,name:title,provider:'MP3Quran',type:'surah',server:clean,chapters,moshaf:best.name});
 console.log(title,chapters.length,'surahs',clean);
}
for(const name of choices.slice(0,3).map(x=>x[0]))if(!extra.some(r=>r.name===name))throw Error('Required reader missing from MP3Quran official API: '+name);
mkdirSync('data',{recursive:true});
writeFileSync('data/reciters-extra.json',JSON.stringify({version:1,source:endpoint,generatedAt:new Date().toISOString(),reciters:extra},null,2)+'\n');
console.log('Saved',extra.length,'verified catalog entries');
