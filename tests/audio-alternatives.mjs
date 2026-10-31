// Check first and final Quran ayah availability for each alternative source.
const entries=[
['ar.sudais','Abdurrahmaan_As-Sudais_192kbps'],
['ar.shuraim','Saood_ash-Shuraym_128kbps'],
['ar.abdulbasit','Abdul_Basit_Murattal_192kbps'],
['ar.ajamy','Ahmed_ibn_Ali_al-Ajamy_64kbps_QuranExplorer.Com'],
['ar.muhammadayoub','Muhammad_Ayyoub_128kbps'],
['ar.abdulbasitmujawwad','Abdul_Basit_Mujawwad_128kbps']
];
async function head(url){try{const r=await fetch(url,{method:'HEAD',signal:AbortSignal.timeout(10000)});return r.status}catch(e){return e.name}}
for(const [id,folder] of entries){
 const every1=await head('https://everyayah.com/data/'+folder+'/001001.mp3');
 const everyLast=await head('https://everyayah.com/data/'+folder+'/114006.mp3');
 let cdn=[];
 for(const rate of [64,128,192])cdn.push(rate+':'+await head('https://cdn.islamic.network/quran/audio/'+rate+'/'+id+'/1.mp3'));
 console.log(id+' EveryAyah: '+every1+'/'+everyLast+' | CDN: '+cdn.join(' '));
}
