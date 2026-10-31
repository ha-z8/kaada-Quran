'use strict';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=v=>String(v??'').normalize('NFKD').replace(/[\u064b-\u065f\u0670\u06d6-\u06ed]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ـ/g,'').replace(/\s+/g,' ').trim().toLowerCase();
const num=v=>Number(v).toLocaleString('ar-SA');
function get(k,defaultValue){for(const name of ['wird5:'+k,'wird4:'+k])try{const raw=localStorage.getItem(name);if(raw!==null)return JSON.parse(raw)}catch{}return defaultValue}
function save(k,v){try{localStorage.setItem('wird5:'+k,JSON.stringify(v))}catch{}}
const state={quran:[],hisn:[],flat:[],pages:[],qcfIndex:null,view:'home',surah:1,ayah:1,page:1,chapter:0,hisnFilter:'all',hisnSearch:'',mode:get('mode','mushaf'),font:get('font','Hafs'),size:get('size',32),dark:get('dark',false),marks:get('marks',[]),last:get('last',{s:1,a:1}),fav:get('fav',[]),counts:get('counts',{}),reciter:get('reciter','ar.sudais'),selected:null,search:''};
if(!AudioEngine.RECITERS.some(r=>r.id===state.reciter))state.reciter='ar.sudais';
let toastTimeout;
function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>$('toast').hidden=true,3200)}
const surah=s=>state.quran[Number(s)-1];
const verse=(s,a)=>surah(s)?.verses[Number(a)-1];
const printedPage=(s,a)=>state.qcfIndex?.overrides?.[s+':'+a]||verse(s,a)?.page||1;
function look(){
 document.body.classList.toggle('dark',state.dark);
 $('theme').textContent=state.dark?'☀':'☾';
 document.documentElement.style.setProperty('--qsize',state.size+'px');
 document.documentElement.style.setProperty('--qfont',({Hafs:'WirdHafs',Naskh:'WirdNaskh',Digital:'WirdDigital'}[state.font]||'WirdHafs')+',"Traditional Arabic",serif');
 document.querySelectorAll('[data-view]').forEach(n=>n.classList.toggle('active',n.dataset.view===state.view));
}
function setConnection(){
 $('connection').textContent=navigator.onLine?'متصل بالإنترنت':'وضع عدم الاتصال';
 document.querySelector('.dot').style.background=navigator.onLine?'#42ae74':'#c69e55';
}
function head(){
 const info={
 home:['السلام عليكم ورحمة الله','اجعل لك من القرآن والذكر نصيبًا كل يوم'],
 quran:['المصحف الشريف','القراءة والبحث والاستماع برواية حفص'],
 adhkar:['الأذكار وحصن المسلم','حصن المسلم مع العدادات والمراجع'],
 audio:['التلاوات الصوتية','استماع مباشر وتنزيل للاستماع دون إنترنت'],
 saved:['العلامات المرجعية','آياتك وموضع متابعتك'],
 tasbih:['المسبحة الإلكترونية','تسبيح وذكر بعداد محفوظ على جهازك'],
 settings:['إعدادات وِرد','خصّص تجربة القراءة والصوتيات'],
 sources:['المصادر والاعتمادات','مصادر النصوص والتلاوات والخطوط والتراخيص']
 }[state.view];
 $('pageHeading').textContent=info[0];$('pageSub').textContent=info[1];
}
function closeMoreMenu(){
 const more=$('navMore'),extra=$('navExtra');
 if(more)more.setAttribute('aria-expanded','false');
 if(extra)extra.classList.remove('open');
}
function go(view,s,a){
 let link='#'+view;
 if(view==='quran')link+='/'+(Number(s)||state.surah)+'/'+(Number(a)||1);
 if(location.hash===link)route();else location.hash=link;
 window.scrollTo(0,0);
}
function route(){
 closeMoreMenu();
 const parts=location.hash.slice(1).split('/'),v=parts[0];
 if(v==='page'){
  state.view='quran';state.page=Math.max(1,Math.min(604,Number(parts[1])||1));
  const exact=state.qcfIndex?.firstByPage?.[state.page-1];const first=state.pages[state.page][0];state.surah=exact?.[0]||first?.s||1;state.ayah=exact?.[1]||first?.id||1;
 }else if(v==='quran'){
  state.view='quran';state.surah=Math.max(1,Math.min(114,Number(parts[1])||state.last.s||1));
  state.ayah=Math.max(1,Math.min(surah(state.surah)?.verses.length||1,Number(parts[2])||1));
  state.page=printedPage(state.surah,state.ayah);
 }else state.view=['home','adhkar','audio','saved','tasbih','settings','sources'].includes(v)?v:'home';
 render();
}
function render(){
 if(!state.quran.length||!state.hisn.length)return;
 look();head();
 if(state.view==='home')renderHome();
 if(state.view==='quran')renderQuran();
 if(state.view==='adhkar')renderHisn();
 if(state.view==='audio')renderAudio();
 if(state.view==='saved')renderSaved();
 if(state.view==='tasbih')renderTasbih();
 if(state.view==='settings')renderSettings();
 if(state.view==='sources')renderSources();
}
function surahCards(){
 return state.quran.map(s=>'<button class="surah-card" data-surah="'+s.id+'"><span class="surah-index">'+num(s.id)+'</span><span><strong>سورة '+esc(s.name)+'</strong><small>'+num(s.verses.length)+' آية</small></span></button>').join('');
}
function renderHome(){
 $('content').innerHTML='<section class="hero"><div><small>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</small><h1>وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا</h1><p>اقرأ، واستمع، واجعل لك من الذكر نصيبًا.</p><button class="btn" data-resume>متابعة وردك ←</button></div><div class="hero-art" aria-hidden="true">۞</div></section><div class="cards3"><button class="feature" data-go="quran"><span class="feature-icon">۞</span><strong>المصحف الشريف</strong><p>صفحات القرآن، البحث، وحفظ مواضع القراءة.</p></button><button class="feature" data-go="adhkar"><span class="feature-icon">✺</span><strong>الأذكار وحصن المسلم</strong><p>أذكار موثقة بالمراجع وعدادات متابعة.</p></button><button class="feature" data-go="audio"><span class="feature-icon">◉</span><strong>التلاوات الصوتية</strong><p>استماع للآيات وتنزيل السور دون اتصال.</p></button></div><div class="section-head"><h2>سور القرآن الكريم</h2><span>١١٤ سورة · ٦٠٤ صفحات</span></div><div class="search-box"><input class="input" id="mainSearch" type="search" placeholder="بحث بالآيات أو رقم السورة:الآية مثل 2:255" value="'+esc(state.search)+'"><button class="btn" id="searchButton">بحث</button></div><div class="surah-grid">'+surahCards()+'</div><section class="college-home"><img src="./assets/college-logo.png" alt="شعار كلية الملك عبدالله للدفاع الجوي"><div><strong>أُنشئ داخل كلية الملك عبدالله للدفاع الجوي</strong><p>هذا المشروع أُنشئ داخل كلية الملك عبدالله للدفاع الجوي، مع هوية مستقلة لوِرد.</p></div></section>'
}
function renderSaved(){
 const rows=state.marks.map(key=>{const parts=key.split(':').map(Number),v=verse(parts[0],parts[1]);if(!v)return '';return '<button class="search-result" data-open="'+parts[0]+':'+parts[1]+'"><span class="tag">سورة '+esc(surah(parts[0]).name)+' · الآية '+num(parts[1])+'</span><p>'+esc(basmala({...v,s:parts[0]}).text)+'</p><small>فتح الموضع ←</small></button>'}).join('');
 $('content').innerHTML='<div class="section-head"><h2>آياتك المحفوظة</h2><button class="btn small" data-resume>◉ آخر موضع قراءة</button></div>'+(rows||'<div class="empty">لا توجد علامات مرجعية حتى الآن. افتح آية واضغط حفظ.</div>')
}
function basmala(ayah){
 if(!ayah||ayah.id!==1||ayah.s===1||ayah.s===9)return {text:ayah?.text||'',show:false};
 const words=ayah.text.trim().split(/\s+/);
 if(words.length>=4&&norm(words.slice(0,4).join(' '))==='بسم الله الرحمن الرحيم')
  return {text:words.slice(4).join(' '),show:true};
 return {text:ayah.text,show:true};
}
function ayahHtml(v){
 let header='';
 if(v.id===1){header='<div class="surah-divider">۞ سُورَةُ '+esc(surah(v.s).name)+' ۞</div>';if(v.s!==1&&v.s!==9)header+='<div class="basmala">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>'}
 const info=basmala(v);
 return header+'<span class="ayah" role="button" tabindex="0" id="ayah-'+v.s+'-'+v.id+'" data-ayah="'+v.s+':'+v.id+'">'+esc(info.text)+' <span class="ayah-badge">'+num(v.id)+'</span> </span>';
}
function toolbar(){
 const choose=state.quran.map(s=>'<option value="'+s.id+'" '+(state.surah===s.id?'selected':'')+'>'+esc(s.name)+'</option>').join('');
 return '<div class="reader-controls"><label>السورة <select id="surahSelect">'+choose+'</select></label><label>العرض <select id="modeSelect"><option value="mushaf" '+(state.mode==='mushaf'?'selected':'')+'>صفحات المصحف</option><option value="verses" '+(state.mode==='verses'?'selected':'')+'>آية بآية</option></select></label><label>الخط <select id="fontSelect"><option value="Hafs" '+(state.font==='Hafs'?'selected':'')+'>حفص العثماني</option><option value="Naskh" '+(state.font==='Naskh'?'selected':'')+'>النسخ</option><option value="Digital" '+(state.font==='Digital'?'selected':'')+'>الرقمي</option></select></label><label class="reader-font-control" for="quranFontSize">حجم الآيات <input type="range" id="quranFontSize" min="22" max="46" value="'+state.size+'"><output id="quranFontSizeValue">'+num(state.size)+'</output></label><button class="btn small" data-size="-2" aria-label="تصغير خط المصحف">أ−</button><button class="btn small" data-size="2" aria-label="تكبير خط المصحف">أ+</button></div>';
}
function pageButtons(){
 return '<div class="pagenav"><button class="btn small" data-page="-1" '+(state.page===1?'disabled':'')+'>→ السابقة</button><label>صفحة <input class="input" id="pageInput" type="number" min="1" max="604" value="'+state.page+'"> من ٦٠٤</label><button class="btn small" data-page="1" '+(state.page===604?'disabled':'')+'>التالية ←</button></div>';
}
const QCF_FONT_CACHE=new Map();
function fitMushafLines(){
 const container=document.querySelector('.qcf-lines');
 if(!container||!container.isConnected)return;
 const lines=[...container.querySelectorAll('.qcf-line')];
 if(!lines.length)return;
 const base=Math.max(14,Math.min(51,Number(state.size)||32));
 container.style.setProperty('--qcf-render-size',base+'px');
 // Preserve the original 15-line pagination while ensuring long lines fit on narrow screens.
 let scale=1;
 for(const line of lines){
  const width=line.clientWidth;
  if(width>0&&line.scrollWidth>width)scale=Math.min(scale,(width-3)/line.scrollWidth);
 }
 container.style.setProperty('--qcf-render-size',Math.max(7,Math.floor(base*scale*100)/100)+'px');
}
window.addEventListener('resize',()=>requestAnimationFrame(fitMushafLines));

async function upgradeMushaf(page){
 const target=document.querySelector('.quran-text');if(!target||state.mode!=='mushaf')return;
 const id=String(page).padStart(3,'0');
 let data;try{const response=await fetch('./data/mushaf/pages/page-'+id+'.json');if(!response.ok)return;data=await response.json()}catch{return}
 if(state.page!==page||!data||!Array.isArray(data.lines))return;
 try{
  if(!QCF_FONT_CACHE.has(id)){
   const name='QCF2P'+id;const face=new FontFace(name,'url(./fonts/qcf/QCF2'+id+'.ttf) format("truetype")');
   await face.load();document.fonts.add(face);QCF_FONT_CACHE.set(id,name);
  }
 }catch{return}
 if(state.page!==page||!target.isConnected)return;
 const face=QCF_FONT_CACHE.get(id);
 const lines=data.lines.map(line=>{
  if(line.type==='surah_name'){const n=line.decor?.surah||1;return '<div class="qcf-surah">۞ سورة '+esc(surah(n).name)+' ۞</div>'}
  if(line.type==='basmallah')return '<div class="qcf-basmala" lang="ar" aria-label="بسم الله الرحمن الرحيم">بِسْمِ اللّٰهِ الرَّحْمَٰنِ الرَّحِيمِ</div>';
  if(line.type==='blank')return '<div class="qcf-line qcf-blank" aria-hidden="true"></div>';
  if(line.type!=='text')return '';
  const words=(line.words||[]).map(w=>{const p=w.location?.split(':');const key=p&&p.length>=2?p[0]+':'+p[1]:'';return '<span class="qcf-glyph" '+(key?'role="button" tabindex="0" data-ayah="'+esc(key)+'"':'')+'>'+esc(w.qpcV2||'')+'</span>'}).join(' ');
  return '<div class="qcf-line" dir="rtl">'+words+'</div>'
 }).join('');
 target.innerHTML='<div class="qcf-lines" style="font-family:\''+face+'\',serif">'+lines+'</div>';
 target.setAttribute('data-verified-layout','qcf-v2');
 requestAnimationFrame(fitMushafLines);
}
function renderQuran(){
 const s=surah(state.surah);
 let html='<div class="reader-head"><h2>سورة '+esc(s.name)+'</h2><button class="btn small" data-resume>آخر موضع قراءة</button></div>'+toolbar();
 if(state.mode==='verses'){
  html+=s.verses.map(v=>{
   const item={...v,s:state.surah},clean=basmala(item);
   const prefix=(v.id===1&&state.surah!==1&&state.surah!==9?'<div class="basmala">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>':'');
   return '<article class="verse-card" id="ayah-'+state.surah+'-'+v.id+'"><span class="tag">سورة '+esc(s.name)+' · '+num(v.id)+'</span><div class="verse-text">'+prefix+esc(clean.text)+'</div><div class="verse-buttons"><button class="btn primary small" data-ayah="'+state.surah+':'+v.id+'">▶ الاستماع وخيارات الآية</button><button class="btn small" data-mark="'+state.surah+':'+v.id+'">'+(state.marks.includes(state.surah+':'+v.id)?'★ محفوظة':'☆ حفظ')+'</button></div></article>'
  }).join('');
 }else{
  const page=state.pages[state.page],first=page?.[0];
  if(!first){$('content').innerHTML='<div class="empty">صفحة المصحف غير متاحة</div>';return}
  html+=pageButtons()+'<article class="quran-page"><div class="qpage-header"><span>الجزء '+num(first.juz)+'</span><span>وِرد · حفص</span><span>صفحة '+num(state.page)+'</span></div><div class="quran-text">'+page.map(ayahHtml).join('')+'</div><div class="qpage-footer">﴿ '+num(state.page)+' ﴾</div></article>'+pageButtons()+'<div class="notice">تعرض الصفحة أسطر مصحف المدينة QCF V2 عند اكتمال تنزيل ملف الصفحة وخطها؛ وإن تعذّر تحميلها يظهر النص العثماني العادي دون حذف الآيات.</div>';
 }
 $('content').innerHTML=html;
 if(state.mode==='mushaf')upgradeMushaf(state.page);
}
function dhikrGoal(v){return Math.max(1,Number.parseInt(v.count,10)||1)}
function renderHisn(){
 const filters=[['all','جميع الأبواب'],['الصباح','الصباح'],['المساء','المساء'],['النوم','النوم'],['الصلاة','الصلاة'],['fav','المفضلة']];
 const tabs='<div class="chips">'+filters.map(f=>'<button class="btn small '+(state.hisnFilter===f[0]?'flat':'')+'" data-filter="'+f[0]+'" aria-pressed="'+(state.hisnFilter===f[0])+'">'+f[1]+'</button>').join('')+'</div>';
 const found=state.hisn.map((c,i)=>({...c,i})).filter(c=>(state.hisnFilter==='all'||state.hisnFilter==='fav'||norm(c.title).includes(norm(state.hisnFilter)))&&(!state.hisnSearch||norm(c.title).includes(norm(state.hisnSearch))||c.items.some(v=>norm(v.text).includes(norm(state.hisnSearch)))));
 if(found.length&&!found.some(c=>c.i===state.chapter))state.chapter=found[0].i;
 const list=found.map(c=>'<button class="chapter-button '+(c.i===state.chapter?'active':'')+'" data-chapter="'+c.i+'">'+esc(c.title)+' <small class="muted">('+num(c.items.length)+')</small></button>').join('');
 const c=state.hisn[state.chapter];
 const items=c.items.map((v,i)=>({...v,i})).filter(v=>(state.hisnFilter!=='fav'||state.fav.includes(state.chapter+':'+v.i))&&(!state.hisnSearch||norm(c.title).includes(norm(state.hisnSearch))||norm(v.text).includes(norm(state.hisnSearch))));
 const cards=items.map(v=>{
  const id=state.chapter+':'+v.i,goal=dhikrGoal(v),count=Math.min(goal,Number(state.counts[id])||0),complete=count>=goal;
  return '<article class="dhikr-card '+(complete?'done':'')+'"><div class="tag">الذكر '+num(v.i+1)+' <span class="pill">'+(complete?'✓ مكتمل':'المطلوب '+num(goal))+'</span></div><div class="dhikr-text">'+esc(v.text)+'</div><p class="dhikr-ref">'+esc(v.reference||'لا يوجد مرجع مذكور')+'</p><div class="count-row"><button class="btn primary count-button" data-count="'+id+'" '+(complete?'disabled':'')+'>'+(complete?'✓ أُكمل الذكر':'اضغط للعدّ')+' <strong>'+num(count)+' / '+num(goal)+'</strong></button><button class="btn small" data-reset="'+id+'">إعادة</button><button class="btn small" data-fav="'+id+'">'+(state.fav.includes(id)?'★ محفوظ':'☆ حفظ')+'</button><button class="btn small" data-copydhikr="'+id+'">نسخ</button></div></article>';
 }).join('');
 $('content').innerHTML='<div class="section-head"><h2>حصن المسلم</h2><span>'+num(state.hisn.length)+' بابًا · '+num(state.hisn.reduce((a,c)=>a+c.items.length,0))+' ذكرًا</span></div>'+tabs+'<div class="two-col"><aside class="panel"><input id="hisnSearch" class="input" placeholder="ابحث في الأذكار…" value="'+esc(state.hisnSearch)+'"><div class="chapter-list">'+(list||'<div class="empty">لا توجد نتائج</div>')+'</div></aside><section><div class="section-head"><h2>'+esc(c.title)+'</h2><span>'+num(items.length)+' ذكرًا</span></div>'+(cards||'<div class="empty">لا توجد أذكار مطابقة</div>')+'</section></div><div class="notice">المصدر: تفاصيل مصادر الأذكار وتراخيصها في صفحة المصادر، ومراجع كل ذكر معروضة أسفله.</div>';
}
function renderAudio(){
 const r=AudioEngine.reciter(),prefs=AudioEngine.getPreferences();
 const surahs=state.quran.map(s=>'<option value="'+s.id+'" '+(s.id===state.surah?'selected':'')+'>'+esc(s.name)+'</option>').join('');
 $('content').innerHTML='<div class="section-head"><h2>التلاوات القرآنية</h2><span>الافتراضي: عبدالرحمن السديس</span></div><section class="audio-card"><h2>استمع داخل وِرد</h2><p class="muted">اختر القارئ والسورة والآية. تلاوات متتابعة على مستوى الآيات، ويمكن تنزيل السورة المختارة للاستماع دون اتصال.</p><div class="audio-fields"><label for="readerSelect">القارئ</label><select id="readerSelect">'+AudioEngine.opts()+'</select><label for="audioSurah">السورة</label><select id="audioSurah">'+surahs+'</select><label for="audioAyah">الآية</label><input class="input" id="audioAyah" type="number" min="1" max="'+surah(state.surah).verses.length+'" value="'+state.ayah+'"></div><div class="chips"><button class="btn primary" data-audiomode="one">▶ الآية فقط</button><button class="btn" data-audiomode="surah">▶ إلى نهاية السورة</button><button class="btn" data-audiomode="quran">▶ إلى نهاية القرآن</button></div></section><section class="audio-card"><h2>الاستماع دون إنترنت</h2><p class="muted">نزّل آيات السورة المحددة بصوت '+esc(r.name)+'. تُحفظ التسجيلات محليًا في هذا المتصفح. لا تُنزَّل بقية السور أو القراء تلقائيًا، لتجنب استهلاك مساحة جهازك.</p><div class="chips"><button class="btn primary" id="downloadSurah">↓ تنزيل السورة</button><button class="btn" id="cancelDownload" disabled>إيقاف التنزيل</button><button class="btn" id="checkAudio">فحص المحفوظ</button></div><div class="progressbar"><div id="downloadProgress"></div></div><p class="download-status" id="downloadStatus">اختر سورة وقارئًا ثم نزّل التسجيلات للقراءة دون شبكة.</p></section><section class="audio-card"><h2>إعدادات التشغيل</h2><div class="audio-fields"><label for="playbackSpeed">السرعة</label><select id="playbackSpeed">'+[[.75,'0.75×'],[1,'1×'],[1.25,'1.25×'],[1.5,'1.5×'],[2,'2×']].map(([v,label])=>'<option value="'+v+'" '+(prefs.speed===v?'selected':'')+'>'+label+'</option>').join('')+'</select><label for="repeatCount">تكرار الآية</label><select id="repeatCount">'+[[1,'مرة واحدة'],[3,'3 مرات'],[5,'5 مرات'],[0,'دائمًا']].map(([v,label])=>'<option value="'+v+'" '+(prefs.repeat===v?'selected':'')+'>'+label+'</option>').join('')+'</select><label for="playbackVolume">مستوى الصوت</label><input id="playbackVolume" type="range" min="0" max="1" step="0.05" value="'+prefs.volume+'"></div><p class="muted">جميع معلومات المصادر والتراخيص في <a href="#sources" style="text-decoration:underline">صفحة المصادر</a>.</p></section>';
}

const QCF_OFFLINE_CACHE='wird-qcf-v6';
let qcfDownloading=false,qcfStop=false;
async function downloadQCFOffline(){
 if(qcfDownloading)return;
 if(!('caches'in window)){toast('متصفحك لا يدعم حفظ الصفحات محليًا');return}
 qcfDownloading=true;qcfStop=false;
 let done=0,errors=0,cache;const total=1208;
 const status=$('qcfProgress');
 if(status)status.textContent='جاري حفظ 604 صفحة و604 خط…';
 try{
  if(navigator.storage?.persist)await navigator.storage.persist();
  cache=await caches.open(QCF_OFFLINE_CACHE);
  for(let page=1;page<=604;page++){
   if(qcfStop)break;
   const id=String(page).padStart(3,'0');
   for(const u of ['./data/mushaf/pages/page-'+id+'.json','./fonts/qcf/QCF2'+id+'.ttf']){
    if(qcfStop)break;
    try{if(!(await cache.match(u)))await cache.add(u);done++}
    catch(e){errors++;if(errors>5)throw new Error('الملفات غير متاحة أو المساحة غير كافية')}
   }
   if(page%5===0&&status)status.textContent='تم حفظ '+num(done)+' / '+num(total)+' ملفًا';
  }
  if(status)status.textContent=qcfStop?'توقف التنزيل، ويمكنك الاستكمال لاحقًا.':errors?'اكتمل جزء من الملفات وتعذّر تنزيل '+num(errors):'✓ أصبح مصحف المدينة بالخطوط والصفحات متاحًا دون إنترنت.';
 }catch(e){if(status)status.textContent='تعذر استكمال الحفظ: '+e.message}
 finally{qcfDownloading=false}
}
const TASBIH_ITEMS=['سُبْحَانَ اللَّهِ','الْحَمْدُ لِلَّهِ','اللَّهُ أَكْبَرُ','لَا إِلَهَ إِلَّا اللَّهُ','أَسْتَغْفِرُ اللَّهَ','سُبْحَانَ اللَّهِ وَبِحَمْدِهِ'];
function renderTasbih(){
 const selection=get('tasbih-selection',0),counts=get('tasbih-counts',{}),goal=get('tasbih-goal',33),n=Number(counts[selection])||0;
 $('content').innerHTML='<div class="section-head"><h2>المسبحة الإلكترونية</h2><span>عداد خاص بكل ذكر، محفوظ على هذا الجهاز</span></div><section class="tasbih-panel"><p class="muted">اختر الذكر والعدد المطلوب، ثم اضغط الزر الكبير للتسبيح. يمكنك استخدام مفتاح المسافة أيضًا.</p><label>الذكر <select id="tasbihSelect">'+TASBIH_ITEMS.map((t,i)=>'<option value="'+i+'" '+(i===selection?'selected':'')+'>'+esc(t)+'</option>').join('')+'</select></label><label>الهدف <select id="tasbihGoal">'+[33,100,300,1000].map(x=>'<option value="'+x+'" '+(x===goal?'selected':'')+'>'+num(x)+'</option>').join('')+'</select></label><div class="tasbih-word">'+esc(TASBIH_ITEMS[selection])+'</div><button class="tasbih-button" data-tasbih-add aria-label="اضغط للتسبيح"><small>اضغط للتسبيح</small><strong>'+num(n)+'</strong><span>من '+num(goal)+'</span></button><div class="progressbar"><div style="width:'+Math.min(100,n/goal*100)+'%"></div></div><div class="chips"><button class="btn" data-tasbih-minus>− إنقاص</button><button class="btn" data-tasbih-reset>إعادة العد</button><button class="btn primary" data-tasbih-next>الذكر التالي</button></div></section>';
}
function renderSettings(){
 $('content').innerHTML='<div class="section-head"><h2>التفضيلات</h2><span>تُحفظ محليًا على الجهاز</span></div><section class="settings-grid"><div class="audio-card"><h2>القراءة</h2><label>طريقة العرض <select id="settingsMode"><option value="mushaf" '+(state.mode==='mushaf'?'selected':'')+'>صفحات المصحف</option><option value="verses" '+(state.mode==='verses'?'selected':'')+'>آية بآية</option></select></label><label>الخط <select id="settingsFont">'+[['Hafs','حفص العثماني'],['Naskh','النسخ'],['Digital','الرقمي']].map(([v,n])=>'<option value="'+v+'" '+(state.font===v?'selected':'')+'>'+n+'</option>').join('')+'</select></label><label>حجم الخط <input id="settingsSize" type="range" min="22" max="46" value="'+state.size+'"></label></div><div class="audio-card"><h2>التطبيق</h2><label>المظهر <select id="settingsTheme"><option value="light" '+(!state.dark?'selected':'')+'>نهاري</option><option value="dark" '+(state.dark?'selected':'')+'>ليلي</option></select></label><p>للاستخدام دون إنترنت افتح الموقع مرة واحدة مع الإنترنت حتى يحفظ ملفات القرآن والأذكار والخطوط. أما نسخة ويندوز فتقرأها من ملفاتها المدمجة.</p><p class="muted">التلاوات المضمّنة كاملة في نسخة ويندوز تُجهَّز في حزمة التوزيع خارج المتصفح.</p><button class="btn primary" id="downloadQCF" '+(qcfDownloading?'disabled':'')+'>↓ حفظ جميع صفحات مصحف المدينة دون إنترنت</button><button class="btn" id="stopQCF">إيقاف التنزيل</button><p class="muted" id="qcfProgress">604 صفحة و604 خط؛ يحتاج مساحة تخزين واتصالًا أول مرة.</p></div></section><section class="audio-card"><h2>مركز فحص النظام</h2><p class="muted">يفحص اكتمال البيانات، والخطوط، والتخزين المحلي، والمصدر الصوتي. يساعدك على تحديد العطل بدل إعادة تثبيت التطبيق عشوائيًا.</p><button class="btn primary" id="runDiagnostics">◉ بدء فحص وِرد</button><div id="diagResults" role="status" aria-live="polite"></div></section>';
}
async function runDiagnostics(){
 const el=$('diagResults');if(!el)return;el.textContent='جارٍ فحص الملفات والاتصال…';
 const items=[];const add=(name,status,details)=>items.push({name,status,details});
 const all=state.quran.reduce((sum,x)=>sum+x.verses.length,0);
 add('ملف القرآن',state.quran.length===114&&all===6236?'ok':'error',state.quran.length+' سورة / '+all+' آية');
 add('حصن المسلم',state.hisn.length>=100?'ok':'error',state.hisn.length+' بابًا');
 for(const [name,url] of [['صفحة المصحف الأولى','./data/mushaf/pages/page-001.json'],['آخر صفحة من المصحف','./data/mushaf/pages/page-604.json'],['خط الصفحة الأولى','./fonts/qcf/QCF2001.ttf']]){
  try{const res=await fetch(url,{method:'HEAD',cache:'no-store'});add(name,res.ok?'ok':'error',res.ok?'موجود على هذا الجهاز أو الخادم':'رمز '+res.status)}catch(e){add(name,'error','غير متاح، قد يلزم تنزيل الملفات أولًا')}
 }
 try{const cache=await caches.open('wird-audio-v5');const keys=await cache.keys();add('التلاوات المحلية','info',keys.length+' ملفًا صوتيًا محفوظًا')}catch{add('التلاوات المحلية','warn','التخزين الصوتي غير متاح')}
 if(window.wirdDesktop){for(const [name,folder] of [['السديس','Abdurrahmaan_As-Sudais_192kbps'],['محمد أيوب','Muhammad_Ayyoub_128kbps']]){
  try{const res=await fetch('./offline-audio/'+folder+'/001001.mp3',{method:'HEAD'});add('نسخة ويندوز: '+name,res.ok?'ok':'error',res.ok?'ملفات الصوت المحلية متاحة':'تسجيل غير موجود')}catch{add('نسخة ويندوز: '+name,'error','تعذر الوصول لملف التلاوة')}
 }}else if(navigator.onLine){
  try{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),9000);let response;try{response=await fetch('https://everyayah.com/data/Abdurrahmaan_As-Sudais_192kbps/001001.mp3',{method:'HEAD',signal:controller.signal})}finally{clearTimeout(timer)}add('مصدر السديس',response.ok?'ok':'warn','HTTP '+response.status)}catch{add('مصدر السديس','warn','تعذر فحص المصدر حاليًا')}
 }else add('مصدر السديس','info','الاختبار الشبكي متجاوز لأن الجهاز دون اتصال');
 try{const found=await Promise.all(['site.woff2','site.woff','site.ttf','site.otf'].map(async name=>{try{return (await fetch('./fonts/ui/'+name,{method:'HEAD'})).ok?name:null}catch{return null}}));const uploaded=found.find(Boolean);add('خط واجهة الموقع',uploaded?'ok':'info',uploaded?'مرفوع: '+uploaded:'لم يُرفع خط الواجهة بعد؛ يستخدم الموقع الخط الاحتياطي')}catch{}
 try{const estimate=await navigator.storage.estimate();add('مساحة تخزين الموقع','info',Math.round((estimate.usage||0)/1048576)+' ميجابايت مستخدمة')}catch{}
 el.innerHTML='<div class="diag-list">'+items.map(x=>'<div class="diag-item '+x.status+'"><b>'+esc(x.name)+'</b><span>'+esc(x.details)+'</span></div>').join('')+'</div>';
}
function renderSources(){
 const sources=[['مجمع الملك فهد لطباعة المصحف الشريف','الخطوط والنصوص والموارد القرآنية الرسمية، بما فيها بيانات بداية ونهاية السطر.','https://qurancomplex.gov.sa/quran-dev/'],['مجموعة خطوط مجمع الملك فهد','خطوط رسم المصحف الرسمي وخصائصها.','https://fonts.qurancomplex.gov.sa/'],['Quran Foundation','توثيق تخطيط المصحف وواجهات البيانات والتفسير، تحتاج بعض الواجهات بيانات اعتماد.','https://quran.foundation/'],['Quran.com للمطورين','وثائق وموارد المطورين المرتبطة بالمصحف.','https://quran.com/ar/developers'],['Al Quran Cloud','المصدر المستخدم لملف النص العثماني الأساسي في الموقع.','https://alquran.cloud/api'],['EveryAyah','مصدر ملفات التلاوة الصوتية آيةً آية؛ يخضع استخدامها لشروط الناشر.','https://everyayah.com/'],['خطوط مصحف المدينة QCF V2 / QUL','تنضيد الأسطر وعددها وخط كل صفحة، من مرآة بيانات مجمع الملك فهد وQUL. حقوقها محفوظة لأصحابها.','https://github.com/manaf/KFGQPC-Madinah-Mushaf'],['HisnElMuslim (MIT)','بيانات حصن المسلم ومراجع الأذكار، الكتاب لسعيد بن علي بن وهف القحطاني.','https://github.com/asellam/HisnElMuslim']];
 $('content').innerHTML='<div class="section-head"><h2>المصادر والتراخيص</h2><span>شفافية المصدر وحقوق الاستخدام</span></div><p class="muted">وجود رابط لمصدر لا يعني أن جميع محتوياته مدمجة حاليًا في التطبيق أو أن كل التسجيلات من إنتاج ذلك المصدر.</p><div class="sources-grid">'+sources.map(([n,d,u])=>'<article class="audio-card"><h2>'+esc(n)+'</h2><p>'+esc(d)+'</p><a target="_blank" rel="noopener noreferrer" href="'+esc(u)+'" class="btn small">فتح المصدر</a></article>').join('')+'</div><div class="notice">تعتمد النسخة الحالية للنص على Al Quran Cloud. لم تُدمج بعد جميع بيانات التنضيد أو التفسير الميسر الرسمية في التطبيق، ولا يُدّعى خلاف ذلك.</div>';
}
function closeDrawer(){state.selected=null;$('verseDrawer').hidden=true;$('overlay').hidden=true}
function openDrawer(s,a){const v=verse(s,a);if(!v)return;state.selected={s,a};$('drawerTitle').textContent='سورة '+surah(s).name+' · الآية '+num(a);$('drawerText').textContent=basmala({...v,s}).text;$('drawerBookmark').textContent=state.marks.includes(s+':'+a)?'★ إزالة العلامة':'☆ حفظ العلامة';$('verseDrawer').hidden=false;$('overlay').hidden=false}
function mark(s,a){const key=s+':'+a;state.marks=state.marks.includes(key)?state.marks.filter(v=>v!==key):[...state.marks,key];save('marks',state.marks);toast('تم تحديث العلامة المرجعية');closeDrawer();render()}
function pair(text){const [s,a]=String(text).split(':').map(Number);return verse(s,a)?{s,a}:null}
function searchView(value){
 state.search=value.trim();
 const exact=state.search.match(/^(\d{1,3})\s*[:：]\s*(\d{1,3})$/);
 let results=[];
 if(exact){
  const s=Number(exact[1]),a=Number(exact[2]);if(verse(s,a))results=[{s,id:a,text:verse(s,a).text}];
 }else{
  const terms=norm(state.search).split(' ').filter(Boolean);
  if(terms.length)for(const v of state.flat){if(terms.every(term=>norm(v.text).includes(term))||norm(surah(v.s).name)===norm(state.search))results.push(v);if(results.length>=120)break}
 }
 $('content').innerHTML='<div class="section-head"><h2>البحث في القرآن</h2><span>'+num(results.length)+' نتيجة'+(results.length===120?' أولى':'')+'</span></div><div class="search-box"><input class="input" id="mainSearch" placeholder="كلمة أو عبارة أو 2:255" value="'+esc(state.search)+'"><button class="btn" id="clearSearch">مسح</button></div>'+(results.map(v=>'<button class="search-result" data-open="'+v.s+':'+v.id+'"><span class="tag">سورة '+esc(surah(v.s).name)+' · '+num(v.id)+'</span><p>'+esc(v.text)+'</p><small>فتح الآية ←</small></button>').join('')||'<div class="empty">لم تظهر نتائج، جرّب كلمة أقصر.</div>');
}
function handleClick(e){
 const t=e.target.closest('button,[data-ayah]');if(!t)return;
 if(t.dataset.go){go(t.dataset.go);return}
 if(t.hasAttribute('data-tasbih-add')||t.hasAttribute('data-tasbih-minus')||t.hasAttribute('data-tasbih-reset')||t.hasAttribute('data-tasbih-next')){const selected=get('tasbih-selection',0),counts=get('tasbih-counts',{});if(t.hasAttribute('data-tasbih-next'))save('tasbih-selection',(selected+1)%TASBIH_ITEMS.length);else if(t.hasAttribute('data-tasbih-reset'))counts[selected]=0;else if(t.hasAttribute('data-tasbih-minus'))counts[selected]=Math.max(0,(counts[selected]||0)-1);else counts[selected]=(counts[selected]||0)+1;save('tasbih-counts',counts);render();return}
 if(t.dataset.surah){go('quran',Number(t.dataset.surah),1);return}
 if(t.hasAttribute('data-resume')){go('quran',state.last.s,state.last.a);return}
 if(t.dataset.open){const v=pair(t.dataset.open);if(v){go('quran',v.s,v.a);setTimeout(()=>document.getElementById('ayah-'+v.s+'-'+v.a)?.scrollIntoView({block:'center'}),90)}return}
 if(t.dataset.ayah){const v=pair(t.dataset.ayah);if(v)openDrawer(v.s,v.a);return}
 if(t.dataset.mark){const v=pair(t.dataset.mark);if(v)mark(v.s,v.a);return}
 if(t.dataset.page){location.hash='#page/'+Math.max(1,Math.min(604,state.page+Number(t.dataset.page)));return}
 if(t.dataset.size){state.size=Math.max(22,Math.min(46,state.size+Number(t.dataset.size)));save('size',state.size);render();return}
 if(t.dataset.filter){state.hisnFilter=t.dataset.filter;render();return}
 if(t.dataset.chapter){state.chapter=Number(t.dataset.chapter);render();return}
 if(t.dataset.count){const k=t.dataset.count,[g,i]=k.split(':').map(Number),v=state.hisn[g].items[i];state.counts[k]=Math.min(dhikrGoal(v),(Number(state.counts[k])||0)+1);save('counts',state.counts);render();return}
 if(t.dataset.reset){state.counts[t.dataset.reset]=0;save('counts',state.counts);render();return}
 if(t.dataset.fav){const k=t.dataset.fav;state.fav=state.fav.includes(k)?state.fav.filter(x=>x!==k):[...state.fav,k];save('fav',state.fav);render();return}
 if(t.dataset.copydhikr){const [g,i]=t.dataset.copydhikr.split(':').map(Number);navigator.clipboard.writeText(state.hisn[g].items[i].text).then(()=>toast('تم نسخ الذكر')).catch(()=>toast('تعذر النسخ'));return}
 if(t.dataset.playmode){if(state.selected)AudioEngine.start(state.selected.s,state.selected.a,t.dataset.playmode);return}
 if(t.dataset.audiomode){AudioEngine.start(state.surah,state.ayah,t.dataset.audiomode);return}
 if(t.id==='searchButton'){searchView(state.search);return}
 if(t.id==='clearSearch'){state.search='';render();return}
 if(t.id==='downloadSurah'){AudioEngine.download(state.surah);return}
 if(t.id==='downloadQCF'){downloadQCFOffline();return}
 if(t.id==='runDiagnostics'){runDiagnostics();return}
 if(t.id==='stopQCF'){qcfStop=true;return}
 if(t.id==='cancelDownload'){AudioEngine.abort();return}
 if(t.id==='checkAudio'){AudioEngine.check(state.surah);return}
}
function events(){
 document.addEventListener('click',handleClick);
 document.addEventListener('change',e=>{
  const t=e.target;
  if(t.id==='surahSelect')go('quran',Number(t.value),1);
  else if(t.id==='modeSelect'){state.mode=t.value;save('mode',state.mode);render()}
  else if(t.id==='fontSelect'){state.font=t.value;save('font',state.font);render()}
  else if(t.id==='pageInput')location.hash='#page/'+Math.max(1,Math.min(604,Number(t.value)||1));
  else if(t.id==='readerSelect')AudioEngine.changeReciter(t.value);
  else if(t.id==='audioSurah'){state.surah=Number(t.value);state.ayah=1;render()}
  else if(t.id==='tasbihSelect'){save('tasbih-selection',Number(t.value));render()}
  else if(t.id==='tasbihGoal'){save('tasbih-goal',Number(t.value));render()}
  else if(t.id==='settingsMode'){state.mode=t.value;save('mode',state.mode);render()}
  else if(t.id==='settingsFont'){state.font=t.value;save('font',state.font);render()}
  else if(t.id==='settingsTheme'){state.dark=t.value==='dark';save('dark',state.dark);render()}
  else if(t.id==='settingsSize'){state.size=Number(t.value);save('size',state.size);render()}
  else if(t.id==='quranFontSize'){state.size=Number(t.value);save('size',state.size);render()}
  else if(t.id==='playbackSpeed'){AudioEngine.setSpeed(Number(t.value))}
  else if(t.id==='repeatCount'){AudioEngine.setRepeat(Number(t.value))}
  else if(t.id==='playbackVolume'){AudioEngine.setVolume(Number(t.value))}
  else if(t.id==='audioAyah'){state.ayah=Math.max(1,Math.min(surah(state.surah).verses.length,Number(t.value)||1))}
 });
 let pending;
 document.addEventListener('input',e=>{
  if(e.target.id==='mainSearch'){state.search=e.target.value;clearTimeout(pending);pending=setTimeout(()=>{searchView(state.search);$('mainSearch')?.focus()},300)}
  if(e.target.id==='hisnSearch'){state.hisnSearch=e.target.value;const pos=e.target.selectionStart;clearTimeout(pending);pending=setTimeout(()=>{render();const input=$('hisnSearch');input?.focus();input?.setSelectionRange(pos,pos)},240)}
 });
 $('navMore').onclick=()=>{const more=$('navMore'),extra=$('navExtra');const isOpen=extra.classList.toggle('open');more.setAttribute('aria-expanded',String(isOpen))};
 $('theme').onclick=()=>{state.dark=!state.dark;save('dark',state.dark);look()};
 $('drawerClose').onclick=closeDrawer;$('overlay').onclick=closeDrawer;
 $('drawerBookmark').onclick=()=>{if(state.selected)mark(state.selected.s,state.selected.a)};
 $('drawerLast').onclick=()=>{if(!state.selected)return;state.last=state.selected;save('last',state.last);toast('تم حفظ موضع القراءة');closeDrawer()};
 $('drawerCopy').onclick=()=>{if(!state.selected)return;navigator.clipboard.writeText(basmala({...verse(state.selected.s,state.selected.a),s:state.selected.s}).text).then(()=>{toast('تم نسخ الآية');closeDrawer()}).catch(()=>toast('تعذر النسخ'))};
 document.querySelectorAll('[data-playmode]').forEach(b=>b.onclick=()=>{if(state.selected)AudioEngine.start(state.selected.s,state.selected.a,b.dataset.playmode)});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDrawer();if((e.key==='Enter'||e.key===' ')&&e.target.matches('.ayah')){e.preventDefault();e.target.click()}});
 window.addEventListener('hashchange',route);window.addEventListener('online',setConnection);window.addEventListener('offline',setConnection);
}
window.W={state,render,closeDrawer,save,toast,num,printedPage};
async function init(){
 events();AudioEngine.init();setConnection();look();
 try{
  const [qr,hr]=await Promise.all([fetch('./data/quran.json'),fetch('./data/hisn.json')]);
  if(!qr.ok||!hr.ok)throw Error('تعذّر جلب ملفات البيانات');
  const [q,h]=await Promise.all([qr.json(),hr.json()]);
  if(!Array.isArray(q)||q.length!==114||q.reduce((n,s)=>n+s.verses.length,0)!==6236)throw Error('بيانات المصحف غير مكتملة');
  if(!Array.isArray(h)||h.length<100)throw Error('بيانات الأذكار غير مكتملة');
  state.quran=q;state.hisn=h;state.pages=Array.from({length:605},()=>[]);
  let global=0;
  for(const s of q)for(const v of s.verses){
   const item={...v,s:s.id,global:++global};
   if(!Number.isInteger(item.page)||item.page<1||item.page>604)throw Error('خطأ في ترقيم صفحات المصحف');
   state.flat.push(item);state.pages[v.page].push(item);
  }
  if(state.pages.slice(1).some(p=>!p.length))throw Error('بيانات إحدى الصفحات ناقصة');
  if(!verse(state.last?.s,state.last?.a))state.last={s:1,a:1};
  try{
   const res=await fetch('./data/mushaf/verse-page-index.json');
   if(res.ok){const idx=await res.json();if(idx.version===1&&idx.firstByPage?.length===604&&idx.overrides)state.qcfIndex=idx;}
  }catch{}
  route();
 }catch(e){$('content').innerHTML='<div class="empty">تعذر تشغيل الموقع: '+esc(e.message)+'<p>افتح الموقع أثناء الاتصال بالإنترنت ثم أعد المحاولة.</p></div>'}
 if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
}
init();