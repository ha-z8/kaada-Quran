'use strict';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=v=>String(v??'').normalize('NFKD').replace(/[\u064b-\u065f\u0670\u06d6-\u06ed]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ـ/g,'').replace(/\s+/g,' ').trim().toLowerCase();
const num=v=>Number(v).toLocaleString('ar-SA');
function get(k,defaultValue){for(const name of ['wird5:'+k,'wird4:'+k])try{const raw=localStorage.getItem(name);if(raw!==null)return JSON.parse(raw)}catch{}return defaultValue}
function save(k,v){try{localStorage.setItem('wird5:'+k,JSON.stringify(v))}catch{}}
const state={quran:[],hisn:[],flat:[],pages:[],view:'home',surah:1,ayah:1,page:1,chapter:0,hisnFilter:'all',hisnSearch:'',mode:get('mode','mushaf'),font:get('font','Hafs'),size:get('size',32),dark:get('dark',false),marks:get('marks',[]),last:get('last',{s:1,a:1}),fav:get('fav',[]),counts:get('counts',{}),reciter:get('reciter','ar.sudais'),selected:null,search:''};
if(!AudioEngine.RECITERS.some(r=>r.id===state.reciter))state.reciter='ar.sudais';
let toastTimeout;
function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>$('toast').hidden=true,3200)}
const surah=s=>state.quran[Number(s)-1];
const verse=(s,a)=>surah(s)?.verses[Number(a)-1];
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
 saved:['العلامات المرجعية','آياتك وموضع متابعتك']
 }[state.view];
 $('pageHeading').textContent=info[0];$('pageSub').textContent=info[1];
}
function go(view,s,a){
 let link='#'+view;
 if(view==='quran')link+='/'+(Number(s)||state.surah)+'/'+(Number(a)||1);
 if(location.hash===link)route();else location.hash=link;
 window.scrollTo(0,0);
}
function route(){
 const parts=location.hash.slice(1).split('/'),v=parts[0];
 if(v==='page'){
  state.view='quran';state.page=Math.max(1,Math.min(604,Number(parts[1])||1));
  const first=state.pages[state.page][0];state.surah=first?.s||1;state.ayah=first?.id||1;
 }else if(v==='quran'){
  state.view='quran';state.surah=Math.max(1,Math.min(114,Number(parts[1])||state.last.s||1));
  state.ayah=Math.max(1,Math.min(surah(state.surah)?.verses.length||1,Number(parts[2])||1));
  state.page=verse(state.surah,state.ayah)?.page||1;
 }else state.view=['home','adhkar','audio','saved'].includes(v)?v:'home';
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
}
function surahCards(){
 return state.quran.map(s=>'<button class="surah-card" data-surah="'+s.id+'"><span class="surah-index">'+num(s.id)+'</span><span><strong>سورة '+esc(s.name)+'</strong><small>'+num(s.verses.length)+' آية</small></span></button>').join('');
}
function renderHome(){
 $('content').innerHTML='<section class="hero"><div><small>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</small><h1>وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا</h1><p>اقرأ، واستمع، واجعل لك من الذكر نصيبًا.</p><button class="btn" data-resume>متابعة وردك ←</button></div><div class="hero-art" aria-hidden="true">۞</div></section><div class="cards3"><button class="feature" data-go="quran"><span class="feature-icon">۞</span><strong>المصحف الشريف</strong><p>صفحات القرآن، البحث، وحفظ مواضع القراءة.</p></button><button class="feature" data-go="adhkar"><span class="feature-icon">✺</span><strong>الأذكار وحصن المسلم</strong><p>أذكار موثقة بالمراجع وعدادات متابعة.</p></button><button class="feature" data-go="audio"><span class="feature-icon">♫</span><strong>التلاوات الصوتية</strong><p>استماع للآيات وتنزيل السور دون اتصال.</p></button></div><div class="section-head"><h2>سور القرآن الكريم</h2><span>١١٤ سورة · ٦٠٤ صفحات</span></div><div class="search-box"><input class="input" id="mainSearch" type="search" placeholder="بحث بالآيات أو رقم السورة:الآية مثل 2:255" value="'+esc(state.search)+'"><button class="btn" id="searchButton">بحث</button></div><div class="surah-grid">'+surahCards()+'</div>'
}
function renderSaved(){
 const rows=state.marks.map(key=>{const parts=key.split(':').map(Number),v=verse(parts[0],parts[1]);if(!v)return '';return '<button class="search-result" data-open="'+parts[0]+':'+parts[1]+'"><span class="tag">سورة '+esc(surah(parts[0]).name)+' · الآية '+num(parts[1])+'</span><p>'+esc(v.text)+'</p><small>فتح الموضع ←</small></button>'}).join('');
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
 return '<div class="reader-controls"><label>السورة <select id="surahSelect">'+choose+'</select></label><label>العرض <select id="modeSelect"><option value="mushaf" '+(state.mode==='mushaf'?'selected':'')+'>صفحات المصحف</option><option value="verses" '+(state.mode==='verses'?'selected':'')+'>آية بآية</option></select></label><label>الخط <select id="fontSelect"><option value="Hafs" '+(state.font==='Hafs'?'selected':'')+'>حفص العثماني</option><option value="Naskh" '+(state.font==='Naskh'?'selected':'')+'>النسخ</option><option value="Digital" '+(state.font==='Digital'?'selected':'')+'>الرقمي</option></select></label><button class="btn small push" data-size="-2">أ−</button><span class="muted">'+num(state.size)+'</span><button class="btn small" data-size="2">أ+</button></div>';
}
function pageButtons(){
 return '<div class="pagenav"><button class="btn small" data-page="-1" '+(state.page===1?'disabled':'')+'>→ السابقة</button><label>صفحة <input class="input" id="pageInput" type="number" min="1" max="604" value="'+state.page+'"> من ٦٠٤</label><button class="btn small" data-page="1" '+(state.page===604?'disabled':'')+'>التالية ←</button></div>';
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
  html+=pageButtons()+'<article class="quran-page"><div class="qpage-header"><span>الجزء '+num(first.juz)+'</span><span>وِرد · حفص</span><span>صفحة '+num(state.page)+'</span></div><div class="quran-text">'+page.map(ayahHtml).join('')+'</div><div class="qpage-footer">﴿ '+num(state.page)+' ﴾</div></article>'+pageButtons()+'<div class="notice">حدود الصفحات صحيحة، لكن النص ليس تنضيدًا مطابقًا للأسطر الخمسة عشر في طبعة مصحف المدينة. لن نعرض تنسيقًا تقديريًا باعتباره نسخة رسمية.</div>';
 }
 $('content').innerHTML=html;
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
 $('content').innerHTML='<div class="section-head"><h2>حصن المسلم</h2><span>'+num(state.hisn.length)+' بابًا · '+num(state.hisn.reduce((a,c)=>a+c.items.length,0))+' ذكرًا</span></div>'+tabs+'<div class="two-col"><aside class="panel"><input id="hisnSearch" class="input" placeholder="ابحث في الأذكار…" value="'+esc(state.hisnSearch)+'"><div class="chapter-list">'+(list||'<div class="empty">لا توجد نتائج</div>')+'</div></aside><section><div class="section-head"><h2>'+esc(c.title)+'</h2><span>'+num(items.length)+' ذكرًا</span></div>'+(cards||'<div class="empty">لا توجد أذكار مطابقة</div>')+'</section></div><div class="notice">المصدر: كتاب حصن المسلم، بيانات HisnElMuslim (MIT)، مع عرض مراجع الأذكار.</div>';
}
function renderAudio(){
 const r=AudioEngine.reciter();
 const surahs=state.quran.map(s=>'<option value="'+s.id+'" '+(s.id===state.surah?'selected':'')+'>'+esc(s.name)+'</option>').join('');
 $('content').innerHTML='<div class="section-head"><h2>التلاوات القرآنية</h2><span>الافتراضي: عبدالرحمن السديس</span></div><section class="audio-card"><h2>استمع داخل وِرد</h2><p class="muted">اختر القارئ والسورة والآية. تستخدم الملفات الصوتية Al Quran Cloud، وقد تختلف الجودة وتوفر التسجيلات حسب القارئ.</p><div class="audio-fields"><label for="readerSelect">القارئ</label><select id="readerSelect">'+AudioEngine.opts()+'</select><label for="audioSurah">السورة</label><select id="audioSurah">'+surahs+'</select><label for="audioAyah">الآية</label><input class="input" id="audioAyah" type="number" min="1" max="'+surah(state.surah).verses.length+'" value="'+state.ayah+'"></div><div class="chips"><button class="btn primary" data-audiomode="one">▶ الآية فقط</button><button class="btn" data-audiomode="surah">▶ إلى نهاية السورة</button><button class="btn" data-audiomode="quran">▶ إلى نهاية القرآن</button></div></section><section class="audio-card"><h2>الاستماع دون إنترنت</h2><p class="muted">نزّل آيات السورة المحددة بصوت '+esc(r.name)+'. تُحفظ التسجيلات محليًا في هذا المتصفح. لا تُنزَّل بقية السور أو القراء تلقائيًا، لتجنب استهلاك مساحة جهازك.</p><div class="chips"><button class="btn primary" id="downloadSurah">↓ تنزيل السورة</button><button class="btn" id="cancelDownload" disabled>إيقاف التنزيل</button><button class="btn" id="checkAudio">فحص المحفوظ</button></div><div class="progressbar"><div id="downloadProgress"></div></div><p class="download-status" id="downloadStatus">اختر سورة وقارئًا ثم نزّل التسجيلات للقراءة دون شبكة.</p></section><section class="audio-card"><h2>مصادر التلاوات</h2><p>التلاوات المشغّلة من خدمة Al Quran Cloud. تتوفر مصادر إضافية مرخّصة من <a href="https://qurancomplex.gov.sa/quran-audios/" target="_blank" rel="noopener" style="color:var(--green);text-decoration:underline">مجمع الملك فهد</a>، وخدمات <a href="https://quran.foundation/" target="_blank" rel="noopener" style="color:var(--green);text-decoration:underline">Quran Foundation</a> للمطورين.</p><p class="muted">قد لا يتيح مصدر الصوت التخزين في بعض المتصفحات، ويظهر عندها خطأ واضح بدل ادعاء نجاح التنزيل.</p></section>';
}
function closeDrawer(){state.selected=null;$('verseDrawer').hidden=true;$('overlay').hidden=true}
function openDrawer(s,a){const v=verse(s,a);if(!v)return;state.selected={s,a};$('drawerTitle').textContent='سورة '+surah(s).name+' · الآية '+num(a);$('drawerText').textContent=v.text;$('drawerBookmark').textContent=state.marks.includes(s+':'+a)?'★ إزالة العلامة':'☆ حفظ العلامة';$('verseDrawer').hidden=false;$('overlay').hidden=false}
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
  else if(t.id==='audioAyah'){state.ayah=Math.max(1,Math.min(surah(state.surah).verses.length,Number(t.value)||1))}
 });
 let pending;
 document.addEventListener('input',e=>{
  if(e.target.id==='mainSearch'){state.search=e.target.value;clearTimeout(pending);pending=setTimeout(()=>{searchView(state.search);$('mainSearch')?.focus()},300)}
  if(e.target.id==='hisnSearch'){state.hisnSearch=e.target.value;const pos=e.target.selectionStart;clearTimeout(pending);pending=setTimeout(()=>{render();const input=$('hisnSearch');input?.focus();input?.setSelectionRange(pos,pos)},240)}
 });
 $('theme').onclick=()=>{state.dark=!state.dark;save('dark',state.dark);look()};
 $('drawerClose').onclick=closeDrawer;$('overlay').onclick=closeDrawer;
 $('drawerBookmark').onclick=()=>{if(state.selected)mark(state.selected.s,state.selected.a)};
 $('drawerLast').onclick=()=>{if(!state.selected)return;state.last=state.selected;save('last',state.last);toast('تم حفظ موضع القراءة');closeDrawer()};
 $('drawerCopy').onclick=()=>{if(!state.selected)return;navigator.clipboard.writeText(verse(state.selected.s,state.selected.a).text).then(()=>{toast('تم نسخ الآية');closeDrawer()}).catch(()=>toast('تعذر النسخ'))};
 document.querySelectorAll('[data-playmode]').forEach(b=>b.onclick=()=>{if(state.selected)AudioEngine.start(state.selected.s,state.selected.a,b.dataset.playmode)});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDrawer();if((e.key==='Enter'||e.key===' ')&&e.target.matches('.ayah')){e.preventDefault();e.target.click()}});
 window.addEventListener('hashchange',route);window.addEventListener('online',setConnection);window.addEventListener('offline',setConnection);
}
window.W={state,render,closeDrawer,save,toast,num};
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
  route();
 }catch(e){$('content').innerHTML='<div class="empty">تعذر تشغيل الموقع: '+esc(e.message)+'<p>افتح الموقع أثناء الاتصال بالإنترنت ثم أعد المحاولة.</p></div>'}
 if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
}
init();