const SURAH_NAMES = ["الفاتحة","البقرة","آل عمران","النساء","المائدة","الأنعام","الأعراف","الأنفال","التوبة","يونس","هود","يوسف","الرعد","إبراهيم","الحجر","النحل","الإسراء","الكهف","مريم","طه","الأنبياء","الحج","المؤمنون","النور","الفرقان","الشعراء","النمل","القصص","العنكبوت","الروم","لقمان","السجدة","الأحزاب","سبأ","فاطر","يس","الصافات","ص","الزمر","غافر","فصلت","الشورى","الزخرف","الدخان","الجاثية","الأحقاف","محمد","الفتح","الحجرات","ق","الذاريات","الطور","النجم","القمر","الرحمن","الواقعة","الحديد","المجادلة","الحشر","الممتحنة","الصف","الجمعة","المنافقون","التغابن","الطلاق","التحريم","الملك","القلم","الحاقة","المعارج","نوح","الجن","المزمل","المدثر","القيامة","الإنسان","المرسلات","النبأ","النازعات","عبس","التكوير","الانفطار","المطففين","الانشقاق","البروج","الطارق","الأعلى","الغاشية","الفجر","البلد","الشمس","الليل","الضحى","الشرح","التين","العلق","القدر","البينة","الزلزلة","العاديات","القارعة","التكاثر","العصر","الهمزة","الفيل","قريش","الماعون","الكوثر","الكافرون","النصر","المسد","الإخلاص","الفلق","الناس"];
const EXPECTED = [7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];
const $ = id => document.getElementById(id);
let QURAN = [], currentSurah = 1, searchMode = false, installPrompt = null, fontSize = 1.65;
const KEY = "al-mushaf-bookmark-v1";
const cleanSearch = s => s.normalize("NFD").replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g,"").replace(/ـ/g,"").trim();
const esc = s => s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function parseText(raw){
  const data=Array.from({length:114},()=>[]);
  for(const line of raw.replace(/^\uFEFF/,"").split(/\r?\n/)){
    if(!line) continue;
    const m=/^(\d+)\|(\d+)\|(.*)$/u.exec(line);
    if(!m) throw new Error("تعذر قراءة أحد أسطر ملف النص.");
    const s=Number(m[1]),a=Number(m[2]);
    if(s<1||s>114||a!==data[s-1].length+1||!m[3]) throw new Error("ترتيب أرقام الآيات غير صحيح.");
    data[s-1].push(m[3]);
  }
  if(data.some((s,i)=>s.length!==EXPECTED[i])||data.reduce((n,s)=>n+s.length,0)!==6236) throw new Error("لم يكتمل تحقق السور والآيات.");
  return data;
}
function bookmark(){try{return JSON.parse(localStorage.getItem(KEY)||"null")}catch{return null}}
function setBookmark(s,a){localStorage.setItem(KEY,JSON.stringify({surah:s,ayah:a}));$("status").textContent="تم حفظ موضع القراءة: "+SURAH_NAMES[s-1]+" — الآية "+a;}
function render(){
  searchMode=false;
  const s=QURAN[currentSurah-1];
  $("surahSelect").value=String(currentSurah);
  $("surahTitle").textContent=SURAH_NAMES[currentSurah-1];
  $("surahMeta").textContent="السورة "+currentSurah+" · "+s.length+" آية";
  const html=s.map((text,i)=>'<article class="ayah" id="ayah-'+(i+1)+'">'+esc(text)+' <span class="ayah-number">'+(i+1).toLocaleString("ar")+'</span><span class="ayah-actions"><button data-bookmark="'+(i+1)+'" aria-label="حفظ الآية '+(i+1)+'">حفظ الموضع</button></span></article>').join("");
  $("verses").innerHTML=html;
  $("resultCount").textContent=s.length.toLocaleString("ar")+" آية";
  $("status").textContent="تم التحقق من النص: ١١٤ سورة و٦٢٣٦ آية. يمكنك القراءة دون اتصال بعد اكتمال التخزين.";
}
function renderSearch(term){
  const q=cleanSearch(term);
  if(!q){render();return;}
  searchMode=true;
  $("surahTitle").textContent="نتائج البحث";
  $("surahMeta").textContent="البحث في كامل المصحف";
  const found=[];
  QURAN.forEach((s,si)=>s.forEach((text,ai)=>{if(cleanSearch(text).includes(q))found.push({s:si+1,a:ai+1,text})}));
  $("verses").innerHTML=found.slice(0,250).map(v=>'<article class="ayah">'+esc(v.text)+' <span class="ayah-number">'+v.a.toLocaleString("ar")+'</span><span class="ayah-actions"><button data-goto="'+v.s+':'+v.a+'">'+SURAH_NAMES[v.s-1]+'</button></span></article>').join("") || '<p class="status">لا توجد نتائج مطابقة.</p>';
  $("resultCount").textContent="عدد النتائج: "+found.length.toLocaleString("ar")+(found.length>250?" · يتم عرض أول ٢٥٠":"");
}
async function load(){
  $("surahSelect").innerHTML=SURAH_NAMES.map((n,i)=>'<option value="'+(i+1)+'">'+(i+1).toLocaleString("ar")+". "+n+'</option>').join("");
  try{
    const response=await fetch("./data/quran-uthmani.txt");
    if(!response.ok)throw new Error("تعذر تحميل ملف النص ("+response.status+").");
    QURAN=parseText(await response.text());
    const saved=bookmark();if(saved?.surah>=1&&saved.surah<=114)currentSurah=saved.surah;
    render();
  }catch(e){$("status").classList.add("error");$("status").textContent=e.message+" أعد فتح التطبيق مع اتصال بالإنترنت.";}
}
$("surahSelect").addEventListener("change",e=>{currentSurah=Number(e.target.value);render();window.scrollTo({top:0,behavior:"smooth"})});
$("prevBtn").addEventListener("click",()=>{if(currentSurah>1){currentSurah--;render()}});
$("nextBtn").addEventListener("click",()=>{if(currentSurah<114){currentSurah++;render()}});
$("bookmarkBtn").addEventListener("click",()=>{const b=bookmark();if(!b){$("status").textContent="لم تحفظ موضع قراءة بعد.";return}currentSurah=b.surah;render();setTimeout(()=>{document.getElementById("ayah-"+b.ayah)?.scrollIntoView({behavior:"smooth",block:"center"})},50)});
$("searchInput").addEventListener("input",e=>renderSearch(e.target.value));
$("clearSearch").addEventListener("click",()=>{$("searchInput").value="";render()});
$("fontDown").addEventListener("click",()=>{fontSize=Math.max(1.1,fontSize-.1);document.documentElement.style.setProperty("--ayah-size",fontSize+"rem")});
$("fontUp").addEventListener("click",()=>{fontSize=Math.min(2.4,fontSize+.1);document.documentElement.style.setProperty("--ayah-size",fontSize+"rem")});
$("verses").addEventListener("click",e=>{
 const b=e.target.closest("button");if(!b)return;
 if(b.dataset.bookmark){setBookmark(currentSurah,Number(b.dataset.bookmark));return}
 if(b.dataset.goto){const [s,a]=b.dataset.goto.split(":").map(Number);currentSurah=s;$("searchInput").value="";render();setTimeout(()=>document.getElementById("ayah-"+a)?.scrollIntoView({behavior:"smooth",block:"center"}),50)}
});
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();installPrompt=e;$("installBtn").hidden=false});
$("installBtn").addEventListener("click",async()=>{if(!installPrompt)return;installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;$("installBtn").hidden=true});
window.addEventListener("appinstalled",()=>{$("installBtn").hidden=true});
if("serviceWorker" in navigator && location.protocol.startsWith("http"))window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
load();