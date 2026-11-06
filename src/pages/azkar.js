const FILE="./data/adhkar-morning-evening.json";
const KEY="mushaf-azkar-progress-v2";
const CATS=[
 ["morning","أذكار الصباح","ورد الصباح"],["evening","أذكار المساء","ورد المساء"],
 ["after","بعد الصلاة","الأذكار عقب الفريضة"],["sleep","قبل النوم","أذكار النوم"],
 ["wake","عند الاستيقاظ","بداية اليوم"],["mosque","المسجد","الدخول والخروج"],
 ["dua","أدعية متنوعة","أدعية مأثورة"]
];
let data=[],category="morning",ready=false;
const day=()=>new Date().toLocaleDateString("en-CA");
function state(){try{let s=JSON.parse(localStorage.getItem(KEY)||"null");if(s?.day===day())return s;}catch{}return {day:day(),counts:{},total:0};}
function save(s){localStorage.setItem(KEY,JSON.stringify(s));}
export async function initAzkar(){if(ready)return;const r=await fetch(FILE);if(!r.ok)throw new Error("تعذّر تحميل الأذكار.");data=await r.json();if(!Array.isArray(data))throw new Error("ملف الأذكار غير صحيح.");ready=true;}
export function renderAzkar(){
 if(!ready)return '<section class="panel">جاري تجهيز الأذكار...</section>';
 const st=state(),items=data.filter(x=>x.category===category||(x.category==="both"&&(category==="morning"||category==="evening")));
 const cat=CATS.find(x=>x[0]===category)||CATS[0];
 return '<section class="page-hero"><p class="eyebrow">وَاذْكُرُوا اللَّهَ كَثِيرًا</p><h2>الأذكار والأدعية</h2><p>أوراد مصنفة حسب الوقت والمناسبة، مع العدّ ومصدر كل ذكر.</p></section>'+
 '<section class="panel"><div class="panel-title"><h3>إنجاز ورد اليوم</h3><strong class="dhikr-count">'+Number(st.total).toLocaleString("ar")+' تكرار</strong></div><div class="progress-track"><span style="width:'+Math.min(100,st.total/300*100)+'%"></span></div><p class="small muted">حفظ محلي على هذا الجهاز.</p></section>'+
 '<section class="panel"><div class="category-grid">'+CATS.map(c=>'<button class="category-card '+(category===c[0]?"active":"")+'" data-az-category="'+c[0]+'"><strong>'+c[1]+'</strong><span>'+c[2]+'</span></button>').join("")+'</div></section>'+
 '<section class="panel"><div class="panel-title"><h3>'+cat[1]+'</h3><span class="muted small">'+items.length+' أذكار</span></div>'+
 (items.length?items.map(z=>{
  const done=st.counts[z.id]||0,ratio=Math.min(100,done/Math.max(1,z.count)*100);
  return '<article class="dhikr-card '+(done>=z.count?"done":"")+'"><div class="panel-title"><h3>ذكر '+Number(z.id).toLocaleString("ar")+'</h3><span class="dhikr-count">'+done.toLocaleString("ar")+' / '+Number(z.count).toLocaleString("ar")+'</span></div><div class="dhikr-ar">'+z.text+'</div><p class="dhikr-note">'+z.source+'</p><div class="progress-track"><span style="width:'+ratio+'%"></span></div><div class="dhikr-actions"><span class="small muted">العدد المأثور: '+Number(z.count).toLocaleString("ar")+'</span><button class="dhikr-tap" data-az-tap="'+z.id+'">تم الذكر</button></div></article>';
 }).join(""):'<p class="muted">لا توجد أذكار في هذا التصنيف.</p>')+'</section>';
}
export function handleAzkarClick(button){
 if(button.dataset.azCategory){category=button.dataset.azCategory;return true;}
 if(button.dataset.azTap){const id=button.dataset.azTap,z=data.find(x=>String(x.id)===id);if(!z)return false;const st=state();st.counts[id]=(st.counts[id]||0)+1;st.total++;save(st);if(navigator.vibrate)navigator.vibrate(16);return true;}
 return false;
}
