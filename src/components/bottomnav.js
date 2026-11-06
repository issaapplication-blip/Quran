const TABS=[
 ["quran","المصحف","۞"],["azkar","الأذكار","✦"],["tasbeeh","السبحة","●"],["qibla","القبلة","◉"],["prayer","الصلاة","☼"]
];
export function renderBottomNav(active){
 return '<nav class="bottomnav" aria-label="التنقل الرئيسي">'+TABS.map(([id,label,icon])=>
 '<button class="nav-item '+(active===id?"active":"")+'" data-tab="'+id+'"><span class="nav-icon">'+icon+'</span><span>'+label+'</span></button>'
 ).join("")+'</nav>';
}
