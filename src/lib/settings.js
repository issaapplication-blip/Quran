const KEY="mushaf-pwa-settings-v1";
const DEFAULTS={theme:"sepia",fontMode:"mushaf",fontSize:1.82,vibration:true};
export function getSettings(){
 try{return {...DEFAULTS,...JSON.parse(localStorage.getItem(KEY)||"{}")};}
 catch{return {...DEFAULTS};}
}
export function updateSettings(patch){
 const next={...getSettings(),...patch};
 localStorage.setItem(KEY,JSON.stringify(next));
 applySettings(next);
 window.dispatchEvent(new CustomEvent("mushaf-settings",{detail:next}));
 return next;
}
export function applySettings(s=getSettings()){
 document.documentElement.dataset.theme=s.theme||"sepia";
 document.documentElement.style.setProperty("--quran-size",(s.fontSize||1.82)+"rem");
 const stacks={
  mushaf:'"Amiri Quran","Amiri","Noto Naskh Arabic","Traditional Arabic",serif',
  naskh:'"Noto Naskh Arabic","Traditional Arabic",serif',
  system:'"Noto Sans Arabic","Tahoma",sans-serif'
 };
 document.documentElement.style.setProperty("--font-quran",stacks[s.fontMode]||stacks.mushaf);
}
