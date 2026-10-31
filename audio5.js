'use strict';
window.AudioEngine=(()=>{
const BASE='https://cdn.islamic.network/quran/audio/';
const STORE='wird-audio-v5';
const RECITERS=[
{id:'ar.sudais',name:'عبدالرحمن السديس',rate:192},
{id:'ar.alafasy',name:'مشاري راشد العفاسي',rate:128},
{id:'ar.husary',name:'محمود خليل الحصري',rate:128},
{id:'ar.minshawi',name:'محمد صديق المنشاوي',rate:128},
{id:'ar.shuraim',name:'سعود الشريم',rate:128},
{id:'ar.abdulbasit',name:'عبدالباسط عبدالصمد',rate:192},
{id:'ar.ajamy',name:'أحمد العجمي',rate:128},
{id:'ar.hudhaify',name:'علي الحذيفي',rate:128},
{id:'ar.muhammadayoub',name:'محمد أيوب',rate:128},
{id:'ar.muhammadjibreel',name:'محمد جبريل',rate:128},
{id:'ar.minshawimujawwad',name:'المنشاوي — مجود',rate:64},
{id:'ar.abdulbasitmujawwad',name:'عبدالباسط — مجود',rate:192}
];
let current=-1,mode='one',token=0,blobUrl=null,downloading=false,cancel=false;
const el=id=>document.getElementById(id);
const settings=()=>window.W;
const reciter=()=>RECITERS.find(r=>r.id===settings()?.state.reciter)||RECITERS[0];
const fileURL=(r,v,rate=r.rate)=>BASE+rate+'/'+r.id+'/'+v.global+'.mp3';
const opts=()=>RECITERS.map(r=>'<option value="'+r.id+'" '+(reciter().id===r.id?'selected':'')+'>'+r.name+'</option>').join('');
function revoke(){if(blobUrl){URL.revokeObjectURL(blobUrl);blobUrl=null}}
async function cached(url){if(!('caches'in window))return null;try{const cache=await caches.open(STORE),response=await cache.match(url);if(!response||response.type==='opaque')return null;const b=await response.blob();return b.size>300?URL.createObjectURL(b):null}catch{return null}}
function status(title,desc){el('dockTitle').textContent=title;el('dockStatus').textContent=desc}
async function playAt(index){
 const w=settings(),v=w.state.flat[index];if(!v){stop();return}
 current=index;token++;const request=token,player=el('audioElement');player.pause();revoke();
 el('dock').hidden=false;el('dockReciter').innerHTML=opts();
 status('سورة '+w.state.quran[v.s-1].name+' · الآية '+w.num(v.id),'جارٍ تجهيز التلاوة…');
 const r=reciter(),rates=[r.rate,128,192,64].filter((x,i,a)=>a.indexOf(x)===i);
 for(const rate of rates){
  const blob=await cached(fileURL(r,v,rate));
  if(request!==token){if(blob)URL.revokeObjectURL(blob);return}
  if(blob){blobUrl=blob;player.src=blob;status('سورة '+w.state.quran[v.s-1].name+' · الآية '+w.num(v.id),'صوت محفوظ · متاح دون إنترنت');break}
 }
 if(!blobUrl){
  if(!navigator.onLine){status('صوت غير متوفر دون إنترنت','نزّل هذه السورة أولًا بصوت القارئ المحدد');return}
  player.src=fileURL(r,v);status('سورة '+w.state.quran[v.s-1].name+' · الآية '+w.num(v.id),'القارئ '+r.name+' · بث عبر الإنترنت');
 }
 try{await player.play();if(request===token)el('dockToggle').textContent='❚❚'}catch{if(request===token){el('dockToggle').textContent='▶';el('dockStatus').textContent='اضغط ▶ لبدء الاستماع'}}
}
function start(s,a,how){const w=settings();if(!w)return;const index=w.state.flat.findIndex(v=>v.s===Number(s)&&v.id===Number(a));if(index<0)return;mode=how;w.closeDrawer();playAt(index)}
function next(delta=1,manual=false){const w=settings(),v=w.state.flat[current],n=w.state.flat[current+delta];if(!n||!v||(!manual&&(mode==='one'||mode==='surah'&&n.s!==v.s))){stop();return}playAt(current+delta);if(w.state.view==='quran'&&(w.state.surah!==n.s||w.state.page!==n.page)){w.state.surah=n.s;w.state.page=n.page;w.state.ayah=n.id;w.render()}}
function stop(){token++;current=-1;el('audioElement').pause();el('audioElement').removeAttribute('src');el('audioElement').load();revoke();el('dock').hidden=true}
function changeReciter(id){if(!RECITERS.some(r=>r.id===id))return;const w=settings();w.state.reciter=id;w.save('reciter',id);if(current>=0)playAt(current);else w.render()}
async function download(s){
 if(downloading)return;
 const w=settings(),r=reciter(),tracks=w.state.flat.filter(v=>v.s===Number(s));
 if(!navigator.onLine){w.toast('التنزيل يحتاج إلى اتصال بالإنترنت');return}
 if(!('caches'in window)){w.toast('التخزين الصوتي غير متاح في المتصفح');return}
 downloading=true;cancel=false;
 const start=el('downloadSurah'),abort=el('cancelDownload'),label=el('downloadStatus'),bar=el('downloadProgress');
 if(start)start.disabled=true;if(abort)abort.disabled=false;
 let ok=0,errors=0;
 try{
  const cache=await caches.open(STORE);
  for(let i=0;i<tracks.length;i++){
   if(cancel)break;
   const url=fileURL(r,tracks[i]);
   if(await cache.match(url))ok++;
   else {
    try{
     const res=await fetch(url,{mode:'cors'});
     if(!res.ok||res.type==='opaque')throw Error('لا يمكن حفظ التسجيل');
     const blob=await res.blob();
     if(blob.size<300)throw Error('ملف غير صالح');
     await cache.put(url,new Response(blob,{headers:{'Content-Type':'audio/mpeg'}}));
     ok++;
    }catch(e){errors++;if(errors>=3){if(label)label.textContent='تعذر تنزيل الملفات من مصدر الصوت. جرّب قارئًا آخر.';break}}
   }
   if(bar)bar.style.width=Math.round(100*(i+1)/tracks.length)+'%';
   if(label)label.textContent='تم حفظ '+w.num(ok)+' من '+w.num(tracks.length)+' آية'+(errors?' · تعذر '+w.num(errors):'');
  }
 }catch(e){if(label)label.textContent='فشل التخزين: '+e.message}
 finally{
  downloading=false;if(start)start.disabled=false;if(abort)abort.disabled=true;
  if(cancel&&label)label.textContent='توقف التنزيل، والملفات المحفوظة لم تُحذف.';
  else if(ok===tracks.length&&label)label.textContent='✓ اكتمل حفظ السورة بصوت '+r.name+' دون اتصال.';
 }
}
async function check(s){const w=settings(),r=reciter(),tracks=w.state.flat.filter(v=>v.s===Number(s));let count=0;try{const cache=await caches.open(STORE);for(const v of tracks)if(await cache.match(fileURL(r,v)))count++}catch{}const label=el('downloadStatus');if(label)label.textContent='المحفوظ '+w.num(count)+' من '+w.num(tracks.length)+' آية بصوت '+r.name}
function init(){
 el('dockReciter').innerHTML=opts();
 el('dockReciter').onchange=e=>changeReciter(e.target.value);
 el('audioElement').onended=()=>next(1,false);
 el('audioElement').onerror=()=>{if(current>=0){status('تعذر تشغيل الملف الصوتي','هذا التسجيل غير متاح أو تعذر الوصول إليه. جرّب قارئًا آخر.');el('dockToggle').textContent='▶'}};
 el('dockToggle').onclick=()=>{const player=el('audioElement');if(player.paused)player.play().then(()=>el('dockToggle').textContent='❚❚').catch(()=>settings().toast('تعذر تشغيل التسجيل'));else{player.pause();el('dockToggle').textContent='▶'}};
 el('dockStop').onclick=stop;el('dockNext').onclick=()=>next(1,true);el('dockPrevious').onclick=()=>next(-1,true);
}
return {RECITERS,reciter,opts,start,stop,changeReciter,download,check,init,abort:()=>{cancel=true},fileURL};
})();