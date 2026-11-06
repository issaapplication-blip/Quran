import {renderTopbar} from "./components/topbar.js";
import {renderBottomNav} from "./components/bottomnav.js";
import {getSettings,updateSettings,applySettings} from "./lib/settings.js";
import {initQuran,renderQuran,handleQuranClick,handleQuranChange,handleQuranInput} from "./pages/quran.js";
import {initAzkar,renderAzkar,handleAzkarClick} from "./pages/azkar.js";
import {renderTasbeeh,handleTasbeehClick,handleTasbeehChange} from "./pages/tasbeeh.js";
import {renderQibla} from "./pages/qibla.js";
import {renderPrayer} from "./pages/prayer.js";
const root=document.getElementById("app");
let tab="quran",settingsOpen=false,settings=getSettings(),toastTimer;
const titles={quran:"المصحف الشريف",azkar:"الأذكار",tasbeeh:"السبحة الإلكترونية",qibla:"القبلة",prayer:"الصلاة"};
function content(){
 if(tab==="quran")return renderQuran();
 if(tab==="azkar")return renderAzkar();
 if(tab==="tasbeeh")return renderTasbeeh();
 if(tab==="qibla")return renderQibla();
 return renderPrayer();
}
function render(){
 settings=getSettings();applySettings(settings);
 root.innerHTML=renderTopbar(titles[tab],settings,settingsOpen)+"<main>"+content()+"</main>"+renderBottomNav(tab);
}
function toast(message){
 let el=document.getElementById("toast");
 if(!el){el=document.createElement("div");el.id="toast";el.className="toast";document.body.appendChild(el);}
 el.textContent=message;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),1900);
}
root.addEventListener("click",event=>{
 const b=event.target.closest("button");if(!b)return;
 if(b.dataset.tab){tab=b.dataset.tab;settingsOpen=false;render();window.scrollTo({top:0,behavior:"smooth"});return;}
 if(b.dataset.action==="toggle-settings"){settingsOpen=!settingsOpen;render();return;}
 if(b.dataset.themeChoice){updateSettings({theme:b.dataset.themeChoice});render();return;}
 if(b.dataset.fontChoice){updateSettings({fontMode:b.dataset.fontChoice});render();return;}
 if(b.dataset.vibrationToggle){updateSettings({vibration:!settings.vibration});render();return;}
 if(tab==="quran"&&handleQuranClick(b)){render();return;}
 if(tab==="azkar"&&handleAzkarClick(b)){render();return;}
 if(tab==="tasbeeh"&&handleTasbeehClick(b)){render();return;}
});
root.addEventListener("change",event=>{
 const el=event.target;
 if(el.id==="fontSizeRange"){updateSettings({fontSize:Number(el.value)});return;}
 if(tab==="quran"&&handleQuranChange(el)){render();return;}
 if(tab==="tasbeeh"&&handleTasbeehChange(el)){render();return;}
});
root.addEventListener("input",event=>{
 if(tab!=="quran"||!handleQuranInput(event.target))return;
 const value=event.target.value,position=event.target.selectionStart;
 render();
 const field=document.getElementById("quranSearch");
 if(field){field.focus();field.setSelectionRange(position,position);}
});
window.addEventListener("mushaf-settings",event=>{settings=event.detail;applySettings(settings);});
async function boot(){
 applySettings(settings);
 root.innerHTML=renderTopbar(titles.quran,settings,false)+'<main><section class="panel loading"><span class="loader"></span><strong>جاري تجهيز المصحف الشريف</strong><small>القرآن الكريم والأذكار والسبحة</small></section></main>';
 try{await Promise.all([initQuran(),initAzkar()]);render();}
 catch(error){root.innerHTML='<main><section class="panel error-panel"><h2>تعذر تجهيز المحتوى</h2><p>'+String(error.message||error)+'</p><button class="btn primary" data-action="reload">إعادة المحاولة</button></section></main>'+renderBottomNav(tab);}
 if("serviceWorker" in navigator&&location.protocol==="https:")navigator.serviceWorker.register("./sw.js").catch(()=>toast("تعذر تفعيل العمل دون اتصال."));
}
root.addEventListener("click",event=>{if(event.target.closest('[data-action="reload"]'))location.reload();});
boot();
