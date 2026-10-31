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

for(const [label,url] of [['Sudais EveryAyah','https://everyayah.com/data/Abdurrahmaan_As-Sudais_192kbps/001001.mp3'],['Alafasy CDN','https://cdn.islamic.network/quran/audio/128/ar.alafasy/1.mp3']]){try{const x=await fetch(url,{method:'GET',headers:{Range:'bytes=0-1023'},signal:AbortSignal.timeout(12000)});console.log(label+' GET '+x.status+' CORS '+(x.headers.get('access-control-allow-origin')||'NONE')+' type '+x.headers.get('content-type'));await x.body?.cancel()}catch(e){console.log(label+' GET ERROR '+e.message)}}

for(const [id,folder] of [
['ar.alafasy','Alafasy_128kbps'],
['ar.husary','Husary_128kbps'],
['ar.minshawi','Minshawy_Murattal_128kbps'],
['ar.hudhaify','Hudhaify_128kbps'],
['ar.muhammadjibreel','Muhammad_Jibreel_128kbps'],
['ar.minshawimujawwad','Minshawy_Mujawwad_64kbps']
]){
 const base='https://everyayah.com/data/'+folder+'/';
 const first=await head(base+'001001.mp3'),last=await head(base+'114006.mp3');
 let cors='?';try{const x=await fetch(base+'001001.mp3',{method:'GET',headers:{Range:'bytes=0-10'},signal:AbortSignal.timeout(10000)});cors=x.headers.get('access-control-allow-origin')||'NONE';await x.body?.cancel()}catch(e){cors=e.message}
 console.log(id+' EveryAyah '+first+'/'+last+' CORS '+cors);
}
