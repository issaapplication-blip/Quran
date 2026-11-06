export function renderTopbar(title,settings,open){
 const panel=open?'<div class="settings-panel">'+
 '<div class="settings-row"><b>خلفية القراءة</b><div class="choice-row">'+
 '<button class="choice '+(settings.theme==="light"?"active":"")+'" data-theme-choice="light">فاتح</button>'+
 '<button class="choice '+(settings.theme==="sepia"?"active":"")+'" data-theme-choice="sepia">ورقي</button>'+
 '<button class="choice '+(settings.theme==="dark"?"active":"")+'" data-theme-choice="dark">ليلي</button></div></div>'+
 '<div class="settings-row"><b>نوع الخط</b><div class="choice-row">'+
 '<button class="choice '+(settings.fontMode==="mushaf"?"active":"")+'" data-font-choice="mushaf">قرآني</button>'+
 '<button class="choice '+(settings.fontMode==="naskh"?"active":"")+'" data-font-choice="naskh">نسخ</button>'+
 '<button class="choice '+(settings.fontMode==="system"?"active":"")+'" data-font-choice="system">واضح</button></div></div>'+
 '<div class="settings-row"><label for="fontSizeRange">حجم خط الآيات</label><input id="fontSizeRange" type="range" min="1.35" max="2.55" step=".05" value="'+settings.fontSize+'"></div>'+
 '<div class="settings-row"><b>اهتزاز السبحة</b><button class="choice '+(settings.vibration?"active":"")+'" data-vibration-toggle="1">'+(settings.vibration?"مفعّل":"متوقف")+'</button></div></div>':'';
 return '<header class="topbar"><div class="brand"><img src="./assets/icon.svg" alt=""><div><h1>'+title+'</h1><p>القرآن الكريم • الأذكار • التسبيح</p></div></div><button class="icon-btn" data-action="toggle-settings" aria-label="الإعدادات">⋯</button>'+panel+'</header>';
}
