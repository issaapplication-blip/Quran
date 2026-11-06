const N=["الفاتحة","البقرة","آل عمران","النساء","المائدة","الأنعام","الأعراف","الأنفال","التوبة","يونس","هود","يوسف","الرعد","إبراهيم","الحجر","النحل","الإسراء","الكهف","مريم","طه","الأنبياء","الحج","المؤمنون","النور","الفرقان","الشعراء","النمل","القصص","العنكبوت","الروم","لقمان","السجدة","الأحزاب","سبأ","فاطر","يس","الصافات","ص","الزمر","غافر","فصلت","الشورى","الزخرف","الدخان","الجاثية","الأحقاف","محمد","الفتح","الحجرات","ق","الذاريات","الطور","النجم","القمر","الرحمن","الواقعة","الحديد","المجادلة","الحشر","الممتحنة","الصف","الجمعة","المنافقون","التغابن","الطلاق","التحريم","الملك","القلم","الحاقة","المعارج","نوح","الجن","المزمل","المدثر","القيامة","الإنسان","المرسلات","النبأ","النازعات","عبس","التكوير","الانفطار","المطففين","الانشقاق","البروج","الطارق","الأعلى","الغاشية","الفجر","البلد","الشمس","الليل","الضحى","الشرح","التين","العلق","القدر","البينة","الزلزلة","العاديات","القارعة","التكاثر","العصر","الهمزة","الفيل","قريش","الماعون","الكوثر","الكافرون","النصر","المسد","الإخلاص","الفلق","الناس"];
let ready=false,verses=[],surahs=Array.from({length:114},()=>[]),pages=[],juz=[],page=1,surah=1,view="page",query="";
const KEY="mushaf-position-v3",esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])),ar=n=>Number(n).toLocaleString("ar"),norm=s=>s.normalize("NFD").replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g,"").replace(/ـ/g,"").replace(/[أإآٱ]/g,"ا").replace(/ى/g,"ي").trim();
function globalIndex(s,a){let total=a-1;for(let i=0;i<s-1;i++)total+=surahs[i].length;return total;}
function pageAt(s,a){const k=globalIndex(s,a);let lo=0,hi=pages.length-1;while(lo<hi){const mid=Math.floor((lo+hi+1)/2);if(pages[mid].start<=k)lo=mid;else hi=mid-1;}return lo+1;}
export async function initQuran(){
 if(ready)return true;
 const results=await Promise.all([fetch("./data/quran-uthmani.txt"),fetch("./data/mushaf-pages.json")]);
 if(results.some(r=>!r.ok))throw new Error("تعذّر تحميل نص المصحف أو بيانات الصفحات.");
 const raw=await results[0].text(),meta=await results[1].json();let g=0;
 for(const line of raw.replace(/^\uFEFF/,"").split(/\r?\n/)){
  if(!line)continue;const m=/^(\d+)\|(\d+)\|(.+)$/u.exec(line);
  if(!m)throw new Error("صيغة أحد أسطر النص غير صحيحة.");
  const s=+m[1],a=+m[2];if(s<1||s>114||a!==surahs[s-1].length+1)throw new Error("تسلسل الآيات غير مكتمل.");
  const v={s,a,text:m[3],global:++g};surahs[s-1].push(v);verses.push(v);
 }
 if(g!==6236||surahs.some(s=>s.length===0)||meta.pages?.length!==604||meta.juz?.length!==30)throw new Error("فشل التحقق من 114 سورة و6236 آية و604 صفحات.");
 pages=meta.pages.map(p=>({page:p.page,start:globalIndex(p.sura,p.aya),ref:{s:p.sura,a:p.aya},juz:1}));
 if(pages[0].start!==0)throw new Error("بداية خريطة الصفحات غير صحيحة.");
 for(let i=0;i<pages.length;i++)if(i&&pages[i].start<=pages[i-1].start)throw new Error("ترتيب الصفحات غير متصل.");
 juz=meta.juz;for(const p of pages){let z=1;for(const j of juz){if(globalIndex(j.surah,j.ayah)<=p.start)z=j.juz;else break;}p.juz=z;}
 const covered=pages.reduce((n,p,i)=>n+((pages[i+1]?.start??6236)-p.start),0);if(covered!==6236)throw new Error("مجموع الآيات ضمن الصفحات لا يساوي 6236.");
 try{const saved=JSON.parse(localStorage.getItem(KEY)||"null");if(saved?.page>=1&&saved.page<=604)page=saved.page;if(saved?.surah>=1&&saved.surah<=114)surah=saved.surah;if(saved?.view==="continuous")view="continuous";}catch{}
 ready=true;return true;
}
function save(){localStorage.setItem(KEY,JSON.stringify({page,surah,view}));}
function pageEnd(){return pages[page]?.start??6236;}
function renderPage(){
 const p=pages[page-1],start=p.start,end=pageEnd(),out=[];let last=0;
 for(let i=start;i<end;i++){
  const v=verses[i];
  if(v.s!==last){out.push('<div class="surah-heading">'+N[v.s-1]+'</div>');last=v.s;}
  out.push('<span class="ayah-text">'+esc(v.text)+'</span> <span class="ayah-medallion">۞'+ar(v.a)+'۞</span> ');
 }
 const lastVerse=verses[end-1];
 return '<article class="mushaf-page"><div class="mushaf-page-head"><span>'+esc(N[p.ref.s-1])+'</span><span>الجزء '+ar(p.juz)+'</span><span>صفحة '+ar(page)+'</span></div><div class="mushaf-page-body">'+out.join("")+'</div><div class="page-footer"><span>المصحف الشريف</span><span>'+ar(p.ref.s)+':'+ar(p.ref.a)+' — '+ar(lastVerse.s)+':'+ar(lastVerse.a)+'</span></div></article>';
}
function renderContinuous(){return '<div class="continuous-wrap">'+surahs[surah-1].map(v=>'<article class="continuous-ayah"><div class="verse-meta"><span>'+esc(N[surah-1])+'</span><span>الآية '+ar(v.a)+'</span></div>'+esc(v.text)+' <span class="ayah-medallion">۞'+ar(v.a)+'۞</span></article>').join("")+'</div>';}
function renderSearch(){
 const q=norm(query);if(!q)return "";const found=verses.filter(v=>norm(v.text).includes(q)).slice(0,150);
 return '<section class="panel"><div class="panel-title"><h3>نتائج البحث</h3><span class="muted small">'+ar(found.length)+' نتيجة معروضة</span></div>'+(found.length?found.map(v=>'<button class="search-result" data-q-goto="'+pageAt(v.s,v.a)+'"><b>سورة '+esc(N[v.s-1])+' • الآية '+ar(v.a)+'</b><span>'+esc(v.text)+'</span></button>').join(""):'<p class="muted">لا توجد نتائج مطابقة.</p>')+'</section>';
}
export function renderQuran(){
 if(!ready)return '<section class="panel">جاري تحميل المصحف...</section>';
 const p=pages[page-1];
 const surahOptions=N.map((n,i)=>'<option value="'+(i+1)+'" '+(surah===i+1?"selected":"")+'>'+ar(i+1)+'. '+n+'</option>').join("");
 const juzOptions=Array.from({length:30},(_,i)=>'<option value="'+(i+1)+'" '+(p.juz===i+1?"selected":"")+'>'+'الجزء '+ar(i+1)+'</option>').join("");
 return '<section class="page-hero"><p class="eyebrow">مصحف المدينة • رواية حفص</p><h2>وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا</h2><p>604 صفحات • 30 جزءاً • 114 سورة</p></section>'+
 '<section class="panel"><div class="quran-tools"><div class="field"><label for="quranSurah">فهرس السور</label><select id="quranSurah">'+surahOptions+'</select></div><div class="field"><label for="quranJuz">الجزء</label><select id="quranJuz">'+juzOptions+'</select></div><div class="field"><label for="quranPage">الصفحة</label><select id="quranPage">'+pages.map(p=>'<option value="'+p.page+'" '+(page===p.page?"selected":"")+'>'+ar(p.page)+'</option>').join("")+'</select></div></div>'+
 '<div class="search-row"><input id="quranSearch" class="search-input" type="search" value="'+esc(query)+'" placeholder="ابحث في القرآن دون تشكيل..."><button class="btn ghost" data-q-action="bookmark">حفظ الموضع</button></div>'+
 '<div class="segmented"><button data-q-view="page" class="'+(view==="page"?"active":"")+'">صفحات المصحف</button><button data-q-view="continuous" class="'+(view==="continuous"?"active":"")+'">تمرير مستمر</button></div></section>'+
 (query?renderSearch():(view==="page"?renderPage():renderContinuous()))+
 (view==="page"&&!query?'<div class="page-controls"><button class="btn" data-q-action="prev" '+(page===1?"disabled":"")+'>السابق</button><span class="page-readout">'+ar(page)+' / 604</span><button class="btn" data-q-action="next" '+(page===604?"disabled":"")+'>التالي</button></div>':'')+
 '<p class="small muted center">النص: Tanzil Uthmani • حدود الصفحات: مصحف المدينة 604 صفحة</p>';
}
export function handleQuranClick(b){
 if(b.dataset.qView){view=b.dataset.qView;query="";save();return true;}
 const a=b.dataset.qAction;
 if(a==="prev"&&page>1){page--;surah=pages[page-1].ref.s;query="";save();return true;}
 if(a==="next"&&page<604){page++;surah=pages[page-1].ref.s;query="";save();return true;}
 if(a==="bookmark"){save();return true;}
 if(b.dataset.qGoto){page=+b.dataset.qGoto;surah=pages[page-1].ref.s;query="";view="page";save();return true;}
 return false;
}
export function handleQuranChange(el){
 if(el.id==="quranPage"){page=+el.value;surah=pages[page-1].ref.s;query="";save();return true;}
 if(el.id==="quranSurah"){surah=+el.value;page=pageAt(surah,1);view="page";query="";save();return true;}
 if(el.id==="quranJuz"&&el.value){const j=juz.find(x=>x.juz===+el.value);if(j){surah=j.surah;page=pageAt(j.surah,j.ayah);view="page";query="";save();}return true;}
 return false;
}
export function handleQuranInput(el){if(el.id==="quranSearch"){query=el.value;return true;}return false;}
