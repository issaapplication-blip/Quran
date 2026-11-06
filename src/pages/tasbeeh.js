const KEY="mushaf-smart-tasbeeh-v2";
const PRESETS=[
 {id:"subhan",name:"سبحان الله",text:"سُبْحَانَ اللَّهِ",target:33},
 {id:"hamd",name:"الحمد لله",text:"الْحَمْدُ لِلَّهِ",target:33},
 {id:"takbir",name:"الله أكبر",text:"اللَّهُ أَكْبَرُ",target:33},
 {id:"tahlil",name:"لا إله إلا الله",text:"لَا إِلَهَ إِلَّا اللَّهُ",target:100},
 {id:"istighfar",name:"أستغفر الله",text:"أَسْتَغْفِرُ اللَّهَ",target:100},
 {id:"salawat",name:"الصلاة على النبي",text:"اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ",target:100}
];
const day=()=>new Date().toLocaleDateString("en-CA");
function initial(){try{const s=JSON.parse(localStorage.getItem(KEY)||"null");if(s){if(s.day!==day()){s.day=day();s.today=0;}s.counts=s.counts||{};s.targets=s.targets||{};s.custom=s.custom||[];return s;}}catch{}return {day:day(),selected:"subhan",counts:{},targets:{},today:0,allTime:0,custom:[],vibration:true};}
let st=initial();
function save(){localStorage.setItem(KEY,JSON.stringify(st));}
function current(){return [...PRESETS,...st.custom].find(x=>x.id===st.selected)||PRESETS[0];}
export function renderTasbeeh(){
 const z=current(),n=st.counts[z.id]||0,target=st.targets[z.id]||z.target,percent=Math.min(100,n/target*100);
 return '<section class="page-hero"><p class="eyebrow">وَاذْكُر رَبَّكَ كَثِيرًا</p><h2>السبحة الإلكترونية الذكية</h2><p>عداد شخصي يعمل دون اتصال ويحفظ وردك على الجهاز.</p></section>'+
 '<section class="panel"><div class="field"><label for="tsDhikr">اختر الذكر</label><select id="tsDhikr">'+[...PRESETS,...st.custom].map(x=>'<option value="'+x.id+'" '+(x.id===z.id?"selected":"")+'>'+x.name+'</option>').join("")+'</select></div><div class="field mt"><label for="tsTarget">الهدف</label><select id="tsTarget"><option value="33" '+(target===33?"selected":"")+'>33</option><option value="100" '+(target===100?"selected":"")+'>100</option><option value="1000" '+(target===1000?"selected":"")+'>1000</option><option value="custom" '+(![33,100,1000].includes(target)?"selected":"")+'>هدف مخصص ('+target+')</option></select></div></section>'+
 '<section class="panel counter-card"><p class="counter-dhikr">'+z.text+'</p><button class="counter-ring" data-ts-action="add" aria-label="إضافة تسبيحة"><strong>'+n.toLocaleString("ar")+'</strong><span>المجموع الحالي • الهدف '+target.toLocaleString("ar")+'</span></button><div class="progress-track"><span style="width:'+percent+'%"></span></div><div class="counter-stats mt"><div class="stat"><strong>'+st.today.toLocaleString("ar")+'</strong><span>اليوم</span></div><div class="stat"><strong>'+st.allTime.toLocaleString("ar")+'</strong><span>الإجمالي</span></div><div class="stat"><strong>'+Math.max(0,target-n).toLocaleString("ar")+'</strong><span>المتبقي</span></div></div><div class="counter-actions"><button class="btn" data-ts-action="undo">تراجع</button><button class="btn" data-ts-action="reset">تصفير الذكر</button><button class="btn '+(st.vibration?"ghost":"")+'" data-ts-action="vibrate">'+(st.vibration?"الاهتزاز مفعّل":"الاهتزاز متوقف")+'</button></div></section>'+
 '<section class="panel"><div class="panel-title"><h3>ذكر مخصص</h3></div><div class="custom-row"><input id="tsCustom" class="custom-input" placeholder="اكتب الذكر"><button class="btn primary" data-ts-action="custom">إضافة</button></div></section>';
}
export function handleTasbeehClick(b){
 const action=b.dataset.tsAction,z=current(),id=z.id,target=st.targets[id]||z.target;
 if(action==="add"){st.counts[id]=(st.counts[id]||0)+1;st.today++;st.allTime++;if(st.vibration&&navigator.vibrate)navigator.vibrate(st.counts[id]===target?[28,45,28]:12);save();return true;}
 if(action==="undo"){if((st.counts[id]||0)>0){st.counts[id]--;st.today=Math.max(0,st.today-1);st.allTime=Math.max(0,st.allTime-1);save();}return true;}
 if(action==="reset"){st.counts[id]=0;save();return true;}
 if(action==="vibrate"){st.vibration=!st.vibration;save();return true;}
 if(action==="custom"){const input=document.getElementById("tsCustom"),name=(input?.value||"").trim();if(!name)return true;const z={id:"custom-"+Date.now(),name,text:name,target:33};st.custom.push(z);st.selected=z.id;save();return true;}
 return false;
}
export function handleTasbeehChange(el){
 if(el.id==="tsDhikr"){st.selected=el.value;save();return true;}
 if(el.id==="tsTarget"){const z=current();let v=+el.value;if(el.value==="custom"){const raw=prompt("أدخل الهدف من 1 إلى 10000","100");v=Number(raw);if(!Number.isInteger(v)||v<1||v>10000)return true;}st.targets[z.id]=v;save();return true;}
 return false;
}
