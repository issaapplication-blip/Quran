const N=["الفاتحة","البقرة","آل عمران","النساء","المائدة","الأنعام","الأعراف","الأنفال","التوبة","يونس","هود","يوسف","الرعد","إبراهيم","الحجر","النحل","الإسراء","الكهف","مريم","طه","الأنبياء","الحج","المؤمنون","النور","الفرقان","الشعراء","النمل","القصص","العنكبوت","الروم","لقمان","السجدة","الأحزاب","سبأ","فاطر","يس","الصافات","ص","الزمر","غافر","فصلت","الشورى","الزخرف","الدخان","الجاثية","الأحقاف","محمد","الفتح","الحجرات","ق","الذاريات","الطور","النجم","القمر","الرحمن","الواقعة","الحديد","المجادلة","الحشر","الممتحنة","الصف","الجمعة","المنافقون","التغابن","الطلاق","التحريم","الملك","القلم","الحاقة","المعارج","نوح","الجن","المزمل","المدثر","القيامة","الإنسان","المرسلات","النبأ","النازعات","عبس","التكوير","الانفطار","المطففين","الانشقاق","البروج","الطارق","الأعلى","الغاشية","الفجر","البلد","الشمس","الليل","الضحى","الشرح","التين","العلق","القدر","البينة","الزلزلة","العاديات","القارعة","التكاثر","العصر","الهمزة","الفيل","قريش","الماعون","الكوثر","الكافرون","النصر","المسد","الإخلاص","الفلق","الناس"];
const C=[7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];
const $=x=>document.getElementById(x),ar=x=>String(Number(x)).replace(/\d/g,d=>"٠١٢٣٤٥٦٧٨٩"[d]),safe=x=>String(x).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
/* تخزين محلي آمن + تاريخ اليوم المحلي (لا UTC) حتى تُصفَّر العدّادات عند منتصف الليل المحلي */
const ls={get(k){try{return localStorage.getItem(k)}catch{return null}},set(k,v){try{localStorage.setItem(k,v)}catch{}}};
const localDay=()=>{let d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
/* بصمة SHA-256 المسجلة لملف data/quran-uthmani.txt (Tanzil Uthmani 1.1). تُحدَّث فقط عند تحديث نص Tanzil رسمياً. */
const QURAN_SHA256="9cf746b2c7501b4497d5db95589b99feab1e641a04bf1856c55a74cba39ecbf3";
async function sha256(buf){let h=await crypto.subtle.digest("SHA-256",buf);return Array.from(new Uint8Array(h),b=>b.toString(16).padStart(2,"0")).join("")}
/* تطبيع البحث فقط (لا يمس النص المعروض): إزالة التشكيل والتطويل والألف الخنجرية، وتوحيد الهمزات والياء والتاء المربوطة، وحذف الألف لتتطابق الرسم العثماني مع الإملائي */
const norm=t=>t.replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g,"").replace(/[ٱأإآ]/g,"ا").replace(/ى/g,"ي").replace(/ة/g,"ه").replace(/ؤ/g,"و").replace(/ئ/g,"ي").replace(/ا/g,"").replace(/\s+/g," ").trim();
let QN=null;
/* نص Tanzil يضم البسملة في بداية الآية الأولى من كل سورة عدا الفاتحة والتوبة. نعرضها سطراً مستقلاً من النص نفسه (دون أي تعديل في الملف) ونعرض بقية الآية بعدها حتى لا تتكرر البسملة. */
const splitBasmala=t=>{let w=t.split(" ");return w.length>4&&w[0].replace(/[ً-ٰٟ]/g,"")==="بسم"?[w.slice(0,4).join(" "),w.slice(4).join(" ")]:["",t]};
let Q=[],M,A,page=1,size=1.72,cat="morning",cnt=0,target=33,today=0;
const K=(s,a)=>s*1000+a,idx=(s,a)=>Q.slice(0,s-1).reduce((n,x)=>n+x.length,0)+a-1;
function parse(t){let a=Array.from({length:114},()=>[]);for(let l of t.replace(/^﻿/,"").split(/\r?\n/)){if(!l)continue;let m=/^(\d+)\|(\d+)\|(.*)$/u.exec(l);if(!m||+m[2]!==a[+m[1]-1]?.length+1)throw Error("خطأ في تسلسل النص");a[+m[1]-1].push(m[3])}if(a.some((x,i)=>x.length!==C[i])||a.flat().length!==6236)throw Error("لم يكتمل فحص السور والآيات");return a}
function pageFor(s,a){let k=K(s,a),lo=0,hi=603;while(lo<hi){let m=Math.ceil((lo+hi)/2),x=M.pages[m];if(K(x.sura,x.aya)<=k)lo=m;else hi=m-1}return lo+1}
function pageInfo(p){
 let st=M.pages[p-1],en=M.pages[p]||{sura:115,aya:1};
 let from=idx(st.sura,st.aya),to=en.sura===115?6236:idx(en.sura,en.aya),out=[],last=0;
 for(let i=from;i<to;i++){
  let s=1,j=i;
  while(j>=Q[s-1].length){j-=Q[s-1].length;s++}
  let a=j+1,t=Q[s-1][j],bs="";
  if(a===1&&s!==1&&s!==9){[bs,t]=splitBasmala(t)}
  if(s!==last){
   if(last)out.push("</div>");
   out.push('<div class="surah-block"><h3>'+safe(N[s-1])+'</h3>');
   last=s;
   if(bs)out.push('<p class="basmala">'+safe(bs)+'</p>')
  }
  out.push(safe(t)+' <span class="mark">'+ar(a)+'</span> ')
 }
 if(last)out.push("</div>");
 let z=1;
 for(let j of M.juz){if(K(j.surah,j.ayah)<=K(st.sura,st.aya))z=j.juz;else break}
 return {html:out.join(""),surah:st.sura,juz:z}
}
let continuousBuilt=false,pageObserver=null;
function updatePageControls(){
 $("page").value=page;$("range").value=page;
 $("prev").disabled=page===1;$("next").disabled=page===604;
}
function buildContinuous(){
 if(continuousBuilt)return;
 const chunks=[];
 for(let p=1;p<=604;p++){
  chunks.push('<article class="mushaf continuous-page" id="readerPage-'+p+'" data-page="'+p+'" data-rendered="false"><div class="page-head"><span>المصحف الشريف</span><span>صفحة '+ar(p)+'</span></div><div class="page-text" aria-live="off"></div><div class="page-foot"><span>'+ar(p)+'</span><span>المصحف الشريف</span></div></article>')
 }
 $("continuousReader").innerHTML=chunks.join("");
 continuousBuilt=true;
 if("IntersectionObserver"in window){
  pageObserver=new IntersectionObserver(entries=>{
   const visible=entries.filter(x=>x.isIntersecting).sort((a,b)=>{
    const mid=window.innerHeight*.42;
    return Math.abs(a.boundingClientRect.top-mid)-Math.abs(b.boundingClientRect.top-mid)
   })[0];
   for(const entry of entries){
    if(!entry.isIntersecting)continue;
    const el=entry.target;
    if(el.dataset.rendered!=="true"){
     const p=Number(el.dataset.page),d=pageInfo(p);
     el.querySelector(".page-head").innerHTML='<span>'+safe(N[d.surah-1])+'</span><span>الجزء '+ar(d.juz)+'</span>';
     el.querySelector(".page-text").innerHTML=d.html;
     el.dataset.rendered="true";
    }
   }
   if(visible){
    const next=Number(visible.target.dataset.page);
    if(next>=1&&next<=604&&next!==page){page=next;updatePageControls()}
   }
  },{rootMargin:"1000px 0px 1000px 0px",threshold:0});
  $("continuousReader").querySelectorAll(".continuous-page").forEach(x=>pageObserver.observe(x))
 }else{
  $("continuousReader").querySelectorAll(".continuous-page").forEach(el=>{
   const p=Number(el.dataset.page),d=pageInfo(p);
   el.querySelector(".page-head").innerHTML='<span>'+safe(N[d.surah-1])+'</span><span>الجزء '+ar(d.juz)+'</span>';
   el.querySelector(".page-text").innerHTML=d.html;
   el.dataset.rendered="true";
  })
 }
}
let readerMode="page";
function render(){
 const d=pageInfo(page);
 if(readerMode==="scroll"){
  $("mushafPage").hidden=true;
  $("continuousReader").hidden=false;
  buildContinuous();
 }else{
  $("continuousReader").hidden=true;
  $("mushafPage").hidden=false;
  $("pageText").innerHTML=d.html;
  $("pageSurah").textContent=N[d.surah-1];
  $("pageJuz").textContent="الجزء "+ar(d.juz);
  $("pageNum").textContent=ar(page);
 }
 updatePageControls();
}
function go(p){page=Math.max(1,Math.min(604,+p));render();if(readerMode==="scroll"){requestAnimationFrame(()=>document.getElementById("readerPage-"+page)?.scrollIntoView({behavior:"smooth",block:"start"}))}else{window.scrollTo({top:0,behavior:"smooth"})}}
function tab(t){document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x.id===t));document.querySelectorAll("nav button[data-tab]").forEach(x=>x.classList.toggle("active",x.dataset.tab===t));document.dispatchEvent(new CustomEvent("mushaf:tab",{detail:t}));if(t==="quran"&&readerMode==="scroll")requestAnimationFrame(()=>document.getElementById("readerPage-"+page)?.scrollIntoView({behavior:"smooth",block:"start"}))}
function surahs(q=""){$("surahList").innerHTML=N.map((n,i)=>({n,i})).filter(x=>!q||x.n.includes(q)||String(x.i+1)===q).map(x=>'<button data-s="'+(x.i+1)+'"><b>'+ar(x.i+1)+'. '+x.n+'</b><small>'+ar(C[x.i])+' آية</small></button>').join("")}
const AZ_FAV_KEY="azkar-favorites";
function getAzkarProgress(){let p={};try{p=JSON.parse(ls.get("azkar-progress")||"{}")}catch{}if(p.day!==localDay())p={day:localDay(),c:{}};p.c=p.c||{};return p}
function getAzkarFavorites(){try{const v=JSON.parse(ls.get(AZ_FAV_KEY)||"[]");return Array.isArray(v)?v.map(String):[]}catch{return[]}}
function azkar(){
 const progress=getAzkarProgress(),favorites=getAzkarFavorites(),query=norm($("azkarSearch").value||"");
 const onlyFavorites=$("azkarFavorites").getAttribute("aria-pressed")==="true";
 const rows=A.filter(x=>(x.category==="both"||x.category===cat)&&(!onlyFavorites||favorites.includes(String(x.id)))&&(!query||norm(x.text+" "+x.source).includes(query)));
 const done=rows.filter(x=>(progress.c[x.id]||0)>=x.count).length;
 $("azkarSummary").textContent=rows.length?("أُنجز "+ar(done)+" من "+ar(rows.length)+" أذكار في هذا القسم"):"لا توجد أذكار مطابقة لهذا البحث.";
 $("azkarList").innerHTML=rows.map(x=>{
  const n=Math.min(progress.c[x.id]||0,x.count),fav=favorites.includes(String(x.id));
  return '<article class="zikr"><div class="zikr-meta"><span>التكرار المطلوب: '+ar(x.count)+'</span><button class="zikr-fav" type="button" data-fav="'+x.id+'" aria-label="'+(fav?"إزالة من المفضلة":"إضافة إلى المفضلة")+'" aria-pressed="'+fav+'">'+(fav?"♥":"♡")+'</button></div><p>'+safe(x.text)+'</p><div class="zikr-bottom"><span>'+safe(x.source)+'</span><button class="zikr-count" type="button" data-z="'+x.id+'">'+(n>=x.count?"✓ اكتمل":ar(n)+" / "+ar(x.count)+" · تسبيح")+'</button></div><div class="zikr-progress" role="progressbar" aria-valuemin="0" aria-valuemax="'+x.count+'" aria-valuenow="'+n+'"><b style="width:'+Math.min(100,n/x.count*100)+'%"></b></div></article>';
 }).join("");
}
const BUILTIN_DHIKRS=[
 {value:"سُبْحَانَ اللَّهِ",text:"سُبْحَانَ اللَّهِ"},
 {value:"الْحَمْدُ لِلَّهِ",text:"الْحَمْدُ لِلَّهِ"},
 {value:"اللَّهُ أَكْبَرُ",text:"اللَّهُ أَكْبَرُ"},
 {value:"لَا إِلَهَ إِلَّا اللَّهُ",text:"لَا إِلَهَ إِلَّا اللَّهُ"},
 {value:"أَسْتَغْفِرُ اللَّهَ",text:"أَسْتَغْفِرُ اللَّهَ"},
 {value:"اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ",text:"اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ"}
];
let customDhikrs=[],soundEnabled=false,beadTone="dark",audioContext=null,ignoreTapClickUntil=0,swipeStartX=null;
function saveCustomDhikrs(){ls.set("tasbih-custom-dhikrs",JSON.stringify(customDhikrs))}
function syncDhikrSelect(selected){
 const options=BUILTIN_DHIKRS.map(x=>'<option value="'+safe(x.value)+'">'+safe(x.text)+'</option>').join("")+
  customDhikrs.map(x=>'<option value="custom:'+safe(x.id)+'">'+safe(x.text)+'</option>').join("");
 $("dhikr").innerHTML=options;
 const exists=Array.from($("dhikr").options).some(x=>x.value===selected);
 $("dhikr").value=exists?selected:BUILTIN_DHIKRS[0].value;
}
function currentDhikr(){
 const value=$("dhikr").value;
 if(value.startsWith("custom:")){
  const item=customDhikrs.find(x=>String(x.id)===value.slice(7));
  if(item)return item.text;
 }
 return $("dhikr").selectedOptions[0]?.textContent||BUILTIN_DHIKRS[0].text;
}
function renderCustomDhikrList(){
 const box=$("customDhikrList");
 if(!customDhikrs.length){box.innerHTML='<p class="tas-no-custom">لم تضف أذكاراً خاصة بعد.</p>';return}
 box.innerHTML=customDhikrs.map(x=>'<div class="tas-custom-item"><span>'+safe(x.text)+'</span><div><button type="button" data-custom-use="'+safe(x.id)+'">استخدم</button><button type="button" data-custom-delete="'+safe(x.id)+'" class="delete">حذف</button></div></div>').join("");
}
function renderTas(){
 $("count").textContent=ar(cnt);
 $("countTarget").textContent=target?"/"+ar(target):"/∞";
 $("counterDial").setAttribute("aria-label","عدد التسبيحات "+cnt+" من "+(target||"دون هدف"));
 $("targetProgress").textContent=target?ar(Math.min(cnt,target))+" / "+ar(target):ar(cnt)+" · بلا هدف";
 $("targetBar").style.width=(target?Math.min(100,cnt/target*100):0)+"%";
 $("currentDhikr").textContent=currentDhikr();
 $("today").textContent="مجموع ما سبّحته اليوم: "+ar(today)+" مرة";
 $("rounds").textContent="الجولات : "+ar(target?Math.floor(cnt/target)+1:1);
 $("dhikrPosition").textContent=ar($("dhikr").selectedIndex+1)+" / "+ar($("dhikr").options.length);
 $("tap").setAttribute("aria-label","الذكر "+currentDhikr()+"، العدد "+cnt+"، اضغط أو اسحب للعد");
 $("tap").dataset.tone=beadTone;
 $("soundToggle").textContent=soundEnabled?"🔊":"🔇";
 $("soundToggle").setAttribute("aria-pressed",String(soundEnabled));
 $("soundToggle").setAttribute("aria-label",soundEnabled?"إيقاف الصوت":"تشغيل الصوت");
 $("vibrateToggle").setAttribute("aria-pressed",String($("vibrate").checked));
}
function saveTas(){
 ls.set("tasbih",JSON.stringify({
  day:localDay(),cnt,target,today,dhikr:$("dhikr").value,
  vibrate:$("vibrate").checked,soundEnabled,beadTone
 }));
}
function loadTas(){
 let v={};try{v=JSON.parse(ls.get("tasbih")||"{}")}catch{}
 try{customDhikrs=JSON.parse(ls.get("tasbih-custom-dhikrs")||"[]");if(!Array.isArray(customDhikrs))customDhikrs=[]}catch{customDhikrs=[]}
 if(v.dhikr==="custom"&&String(v.custom||"").trim()){
  if(!customDhikrs.some(x=>x.text===String(v.custom).trim()))customDhikrs.unshift({id:"legacy",text:String(v.custom).trim()});
  v.dhikr="custom:legacy";saveCustomDhikrs();
 }
 const d=localDay();today=v.day===d?(Number(v.today)||0):0;cnt=v.day===d?(Number(v.cnt)||0):0;
 target=v.target??33;
 syncDhikrSelect(v.dhikr||BUILTIN_DHIKRS[0].value);
 $("target").value=String(target);
 $("vibrate").checked=v.vibrate!==false;
 soundEnabled=v.soundEnabled===true;
 beadTone=["dark","green","amber"].includes(v.beadTone)?v.beadTone:"dark";
 renderCustomDhikrList();renderTas();
}
function playTasTone(){
 try{
  const AudioCtx=window.AudioContext||window.webkitAudioContext;if(!AudioCtx)return;
  audioContext=audioContext||new AudioCtx();
  if(audioContext.state==="suspended")audioContext.resume();
  const osc=audioContext.createOscillator(),gain=audioContext.createGain();
  osc.type="sine";osc.frequency.value=740;gain.gain.setValueAtTime(.0001,audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(.045,audioContext.currentTime+.012);
  gain.gain.exponentialRampToValueAtTime(.0001,audioContext.currentTime+.09);
  osc.connect(gain);gain.connect(audioContext.destination);osc.start();osc.stop(audioContext.currentTime+.1);
 }catch{}
}
function addTasCount(){
 cnt++;today++;renderTas();
 $("message").textContent=target&&cnt%target===0?"أتممت جولة كاملة، بارك الله فيك.":"تقبّل الله ذكرك.";
 if($("vibrate").checked&&navigator.vibrate)navigator.vibrate(22);
 if(soundEnabled)playTasTone();
 saveTas();
}

async function init(){try{let [q,p,a]=await Promise.all(["quran-uthmani.txt","mushaf-pages.json","adhkar-morning-evening.json"].map(x=>fetch("./data/"+x)));if(!q.ok||!p.ok||!a.ok)throw Error("تعذر تحميل ملفات المحتوى");let qb=await q.arrayBuffer(),fp="";if(window.crypto&&crypto.subtle){if(await sha256(qb)!==QURAN_SHA256)throw Error("تم اكتشاف تغيير في ملف نص القرآن عن نسخة Tanzil المعتمدة، لذلك أُوقف عرض النص. أعد تحميل الصفحة أو ثبّت النسخة الأصلية.");fp=" وبصمة SHA-256 للنص مطابقة."}Q=parse(new TextDecoder("utf-8").decode(qb));M=await p.json();A=await a.json();if(M.pages.length!==604||M.juz.length!==30)throw Error("بيانات الصفحات ناقصة");$("page").innerHTML=Array.from({length:604},(_,i)=>'<option value="'+(i+1)+'">صفحة '+ar(i+1)+'</option>').join("");$("surah").innerHTML=N.map((x,i)=>'<option value="'+(i+1)+'">'+ar(i+1)+'. '+x+'</option>').join("");$("juz").innerHTML=M.juz.map(x=>'<option value="'+x.juz+'">الجزء '+ar(x.juz)+'</option>').join("");let b=null;try{b=JSON.parse(ls.get("mushaf-bookmark")||"null")}catch{}page=Math.min(604,Math.max(1,+b?.page||1));applyPrefs();render();surahs();azkar();loadTas();$("status").textContent="تم التحقق: ١١٤ سورة، ٦٢٣٦ آية، ٦٠٤ صفحات، ٣٠ جزءاً."+fp}catch(e){$("status").textContent=e.message;$("status").classList.add("error")}}
document.querySelectorAll("nav button[data-tab]").forEach(b=>b.onclick=()=>tab(b.dataset.tab));$("page").onchange=e=>go(e.target.value);$("range").oninput=e=>go(e.target.value);$("prev").onclick=()=>go(page-1);$("next").onclick=()=>go(page+1);$("surah").onchange=e=>{go(pageFor(+e.target.value,1));tab("quran")};$("juz").onchange=e=>{let j=M.juz.find(x=>x.juz===+e.target.value);go(pageFor(j.surah,j.ayah))};$("save").onclick=()=>{let s=M.pages[page-1];ls.set("mushaf-bookmark",JSON.stringify({page,surah:s.sura,ayah:s.aya}));$("status").textContent="حُفظ موضع القراءة"};
function setSize(v){
 size=Math.min(2.8,Math.max(1.2,+Number(v).toFixed(2)));
 document.documentElement.style.setProperty("--quran-size",size+"rem");
 $("sizeRange").value=String(size);
 $("sizeValue").textContent=ar(Math.round(size/1.72*100))+"٪";
 ls.set("mushaf-size",String(size))
}
$("smaller").onclick=()=>setSize(size-.1);
$("larger").onclick=()=>setSize(size+.1);
$("resetSize").onclick=()=>setSize(1.72);
$("sizeRange").oninput=e=>setSize(e.target.value);
function setReaderMode(mode,rerender=true){
 readerMode=mode==="scroll"?"scroll":"page";
 document.body.dataset.readerMode=readerMode;
 $("modeToggle").textContent=readerMode==="page"?"تمرير مستمر":"صفحات منفردة";
 $("modeToggle").setAttribute("aria-pressed",String(readerMode==="scroll"));
 ls.set("mushaf-reader-mode",readerMode);
 if(rerender&&Q.length){
  render();
  if(readerMode==="scroll")requestAnimationFrame(()=>document.getElementById("readerPage-"+page)?.scrollIntoView({behavior:"smooth",block:"start"}));
  else window.scrollTo({top:0,behavior:"smooth"});
 }
}
$("modeToggle").onclick=()=>setReaderMode(readerMode==="page"?"scroll":"page");
$("fullScreen").onclick=async()=>{
 try{
  if(document.fullscreenElement){await document.exitFullscreen()}
  else if($("quran").requestFullscreen){await $("quran").requestFullscreen()}
  else throw new Error("unsupported");
 }catch{$("status").textContent="ملء الشاشة غير مدعوم في هذا المتصفح؛ يمكنك القراءة بالتمرير أو تدوير الهاتف."}
};
document.addEventListener("fullscreenchange",()=>{$("fullScreen").textContent=document.fullscreenElement?"إنهاء ملء الشاشة":"ملء الشاشة"});
let pinchStartDistance=0,pinchStartSize=size;
const touchDistance=t=>Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY);
document.addEventListener("touchstart",e=>{
 if(!e.target.closest("#mushafPage,.continuous-page"))return;
 if(e.touches.length===2){pinchStartDistance=touchDistance(e.touches);pinchStartSize=size}
},{passive:true});
document.addEventListener("touchmove",e=>{
 if(!pinchStartDistance||e.touches.length!==2)return;
 e.preventDefault();
 setSize(pinchStartSize*touchDistance(e.touches)/pinchStartDistance);
},{passive:false});
function clearPinch(){pinchStartDistance=0}
document.addEventListener("touchend",e=>{if(e.touches.length<2)clearPinch()},{passive:true});
document.addEventListener("touchcancel",clearPinch,{passive:true});
/* التنقّل بين صفحات المصحف بالسحب الأفقي — يعمل في وضع الصفحة المنفردة فقط */
let pageSwipeStart=null;
$("mushafPage").addEventListener("touchstart",e=>{
 if(readerMode!=="page"||e.touches.length!==1)return;
 const t=e.touches[0];
 pageSwipeStart={x:t.clientX,y:t.clientY};
},{passive:true});
$("mushafPage").addEventListener("touchend",e=>{
 if(readerMode!=="page"||!pageSwipeStart||!e.changedTouches.length){pageSwipeStart=null;return}
 const t=e.changedTouches[0],dx=t.clientX-pageSwipeStart.x,dy=t.clientY-pageSwipeStart.y;
 pageSwipeStart=null;
 if(Math.abs(dx)<48||Math.abs(dx)<Math.abs(dy)*1.25)return;
 if(dx>0)go(page+1);else go(page-1);
},{passive:true});
$("mushafPage").addEventListener("touchcancel",()=>{pageSwipeStart=null},{passive:true});

function setTheme(t){document.body.dataset.theme=t;document.querySelectorAll("[data-theme]").forEach(x=>x.classList.toggle("active",x.dataset.theme===t))}
function applyPrefs(){let t=ls.get("mushaf-theme");if(["paper","cream","dark"].includes(t))setTheme(t);let z=parseFloat(ls.get("mushaf-size"));if(z>=1.2&&z<=2.8)setSize(z);setReaderMode(ls.get("mushaf-reader-mode")==="scroll"?"scroll":"page",false)}
document.querySelectorAll("[data-theme]").forEach(b=>b.onclick=()=>{setTheme(b.dataset.theme);ls.set("mushaf-theme",b.dataset.theme)});
$("findToggle").onclick=()=>{$("searchBox").hidden=!$("searchBox").hidden};$("clear").onclick=()=>{$("query").value="";$("results").hidden=true};
$("query").oninput=e=>{let raw=e.target.value.trim(),q=norm(raw);if(!q){$("results").hidden=true;return}if(!QN)QN=Q.map((sr,i)=>sr.map((v,j)=>norm(j===0&&i!==0&&i!==8?splitBasmala(v)[1]:v)));let hits=[],total=0;QN.forEach((sr,i)=>sr.forEach((v,j)=>{if(v.includes(q)){total++;if(hits.length<60)hits.push({s:i+1,a:j+1,t:j===0&&i!==0&&i!==8?splitBasmala(Q[i][j])[1]:Q[i][j]})}}));$("results").hidden=false;$("results").innerHTML=(total?'<small>'+ar(total)+' نتيجة'+(total>60?' (تُعرض أول ٦٠)':'')+'</small>':'')+hits.map(x=>'<button data-hit="'+x.s+':'+x.a+'">'+N[x.s-1]+' '+ar(x.a)+' — '+safe(x.t)+'</button>').join("")||"لا توجد نتائج"};
$("results").onclick=e=>{let b=e.target.closest("[data-hit]");if(!b)return;let [s,a]=b.dataset.hit.split(":").map(Number);go(pageFor(s,a));tab("quran")};
$("filter").oninput=e=>surahs(e.target.value);$("surahList").onclick=e=>{let b=e.target.closest("[data-s]");if(b){go(pageFor(+b.dataset.s,1));tab("quran")}};
document.querySelectorAll("[data-cat]").forEach(b=>b.onclick=()=>{cat=b.dataset.cat;document.querySelectorAll("[data-cat]").forEach(x=>x.classList.toggle("active",x===b));$("azkarFavorites").setAttribute("aria-pressed","false");azkar()});
$("azkarSearch").oninput=azkar;
$("azkarFavorites").onclick=()=>{$("azkarFavorites").setAttribute("aria-pressed",$("azkarFavorites").getAttribute("aria-pressed")!=="true");azkar()};
$("azkarList").onclick=e=>{
 const fav=e.target.closest("[data-fav]");
 if(fav){let list=getAzkarFavorites(),id=String(fav.dataset.fav);list=list.includes(id)?list.filter(x=>x!==id):[...list,id];ls.set(AZ_FAV_KEY,JSON.stringify(list));azkar();return}
 const b=e.target.closest("[data-z]");if(!b)return;
 const p=getAzkarProgress(),item=A.find(x=>String(x.id)===String(b.dataset.z));if(!item)return;
 p.c[item.id]=Math.min(item.count,(p.c[item.id]||0)+1);ls.set("azkar-progress",JSON.stringify(p));azkar();
};
function moveDhikr(step){
 const select=$("dhikr"),next=(select.selectedIndex+step+select.options.length)%select.options.length;
 select.selectedIndex=next;cnt=0;renderTas();saveTas();
}
$("dhikrPrev").onclick=()=>moveDhikr(-1);
$("dhikrNext").onclick=()=>moveDhikr(1);
$("dhikr").onchange=()=>{cnt=0;renderTas();saveTas()};
$("target").onchange=e=>{target=+e.target.value;renderTas();saveTas()};
$("tap").onclick=()=>{if(Date.now()<ignoreTapClickUntil)return;addTasCount()};
$("tap").addEventListener("touchstart",e=>{if(e.touches.length===1)swipeStartX=e.touches[0].clientX},{passive:true});
$("tap").addEventListener("touchend",e=>{
 if(swipeStartX!==null&&e.changedTouches.length){
  const dx=e.changedTouches[0].clientX-swipeStartX;
  if(Math.abs(dx)>26){e.preventDefault();ignoreTapClickUntil=Date.now()+500;addTasCount()}
 }
 swipeStartX=null;
},{passive:false});
$("undo").onclick=()=>{if(cnt){cnt--;today=Math.max(0,today-1);renderTas();saveTas();$("message").textContent="تم التراجع عن آخر تسبيحة."}};
$("reset").onclick=()=>{cnt=0;renderTas();saveTas();$("message").textContent="أُعيد ضبط العداد الحالي."};
function toggleTasSettings(){
 $("tasSettings").hidden=!$("tasSettings").hidden;
}
$("tasSettingsToggle").onclick=toggleTasSettings;
$("tasMenuToggle").onclick=toggleTasSettings;
$("vibrateToggle").onclick=()=>{$("vibrate").checked=!$("vibrate").checked;renderTas();saveTas()};
$("soundToggle").onclick=()=>{soundEnabled=!soundEnabled;renderTas();saveTas();if(soundEnabled)playTasTone()};
$("tasPalette").onclick=()=>{
 const tones=["dark","green","amber"],i=tones.indexOf(beadTone);beadTone=tones[(i+1)%tones.length];
 renderTas();saveTas();
 $("message").textContent=beadTone==="dark"?"لون الخرز: أسود لامع":beadTone==="green"?"لون الخرز: أخضر":"لون الخرز: ذهبي";
};
$("addCustomToggle").onclick=()=>{
 $("customDhikrForm").hidden=!$("customDhikrForm").hidden;
 if(!$("customDhikrForm").hidden)$("newDhikrText").focus();
};
$("cancelCustomDhikr").onclick=()=>{$("customDhikrForm").hidden=true;$("newDhikrText").value=""};
$("customDhikrForm").onsubmit=e=>{
 e.preventDefault();
 const phrase=$("newDhikrText").value.trim();
 if(!phrase){$("newDhikrText").focus();return}
 if(customDhikrs.some(x=>x.text===phrase)){
  $("message").textContent="هذا الذكر موجود بالفعل.";return;
 }
 const id=Date.now().toString(36);
 customDhikrs.push({id,text:phrase});saveCustomDhikrs();
 syncDhikrSelect("custom:"+id);cnt=0;
 $("newDhikrText").value="";$("customDhikrForm").hidden=true;
 renderCustomDhikrList();renderTas();saveTas();
 $("message").textContent="تم حفظ الذكر الخاص على هذا الجهاز.";
};
$("customDhikrList").onclick=e=>{
 const use=e.target.closest("[data-custom-use]");
 const del=e.target.closest("[data-custom-delete]");
 if(use){
  syncDhikrSelect("custom:"+use.dataset.customUse);cnt=0;renderTas();saveTas();
  $("message").textContent="تم اختيار الذكر الخاص.";return;
 }
 if(del){
  const id=del.dataset.customDelete;
  customDhikrs=customDhikrs.filter(x=>String(x.id)!==id);saveCustomDhikrs();
  const current=$("dhikr").value;
  syncDhikrSelect(current==="custom:"+id?BUILTIN_DHIKRS[0].value:current);
  if(current==="custom:"+id)cnt=0;
  renderCustomDhikrList();renderTas();saveTas();
  $("message").textContent="تم حذف الذكر الخاص من هذا الجهاز.";
 }
};
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();window._prompt=e;$("install").hidden=false});$("install").onclick=async()=>{if(window._prompt){window._prompt.prompt();await window._prompt.userChoice;window._prompt=null;$("install").hidden=true}};
if("serviceWorker"in navigator)navigator.serviceWorker.register("./sw.js").catch(()=>{});init();
// إخفاء زر التثبيت بعد نجاح تثبيت التطبيق على الجهاز.
window.addEventListener("appinstalled",()=>{$("install").hidden=true;window._prompt=null});
