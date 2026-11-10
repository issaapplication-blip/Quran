/* المصحف الشريف — ميزات: قائمة ⋮، بوصلة القبلة، مواقيت الصلاة.
 * لا يعتمد على أي مكتبة. يعمل بعد app.js (defer) ويتشارك معه صفحات التبويب فقط. */
(() => {
"use strict";

const $ = (id) => document.getElementById(id);
const ar = (n, o) => Number(n).toLocaleString("en-US", o).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d]).replace(/\./g, "٫").replace(/,/g, "٬");

/* تخزين محلي آمن (قد يرمي الخطأ في الوضع الخاص أو عند المنع) */
const ls = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* التخزين غير متاح */ } },
  del(k) { try { localStorage.removeItem(k); } catch { /* تجاهل */ } },
};
const readJSON = (k, fallback = null) => { try { const r = ls.get(k); return r === null ? fallback : JSON.parse(r); } catch { return fallback; } };
const writeJSON = (k, v) => ls.set(k, JSON.stringify(v));

/* ============================== القائمة ⋮ ============================== */
const menuBtn = $("moreMenu"), panel = $("morePanel"), header = document.querySelector("header");

function setMenu(open) {
  panel.hidden = !open;
  if (open) {
    // تُعرض القائمة أسفل شريط التنقل كي لا تغطي أزراره
    const hb = document.querySelector("header").getBoundingClientRect(), nb = document.querySelector("nav").getBoundingClientRect();
    panel.style.top = Math.max(nb.bottom - hb.top, hb.height) + 6 + "px";
  }
  menuBtn.setAttribute("aria-expanded", String(open));
}
function showTab(id) {
  document.querySelectorAll(".tab").forEach((x) => x.classList.toggle("active", x.id === id));
  document.querySelectorAll("nav button[data-tab]").forEach((x) => x.classList.toggle("active", x.dataset.tab === id));
  setMenu(false);
  window.scrollTo(0, 0);
  document.dispatchEvent(new CustomEvent("mushaf:tab", { detail: id }));
}
menuBtn.addEventListener("click", (e) => { e.stopPropagation(); setMenu(panel.hidden); });
document.addEventListener("click", (e) => { if (!panel.hidden && !panel.contains(e.target) && e.target !== menuBtn) setMenu(false); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !panel.hidden) { setMenu(false); menuBtn.focus(); } });
document.addEventListener("mushaf:tab", () => setMenu(false));
panel.querySelectorAll("[data-tab]").forEach((b) => b.addEventListener("click", () => showTab(b.dataset.tab)));

/* ارتفاع الترويسة الفعلي لتثبيت شريط التنقل تحتها دون تداخل */
function syncHeaderHeight() { document.documentElement.style.setProperty("--header-h", header.offsetHeight + "px"); }
syncHeaderHeight();
if ("ResizeObserver" in window) new ResizeObserver(syncHeaderHeight).observe(header);
else window.addEventListener("resize", syncHeaderHeight);

/* ============================== بوصلة القبلة ============================== */
const KAABA = { lat: 21.4225, lon: 39.8262 };
const RAD = Math.PI / 180;
const LOC_KEY = "mushaf-qibla-loc";
const WINDS = ["شمال", "شمال شرق", "شرق", "جنوب شرق", "جنوب", "جنوب غرب", "غرب", "شمال غرب"];

/** الاتجاه الابتدائي على الدائرة العظمى من (lat,lon) إلى الكعبة، بالدرجات من الشمال الجغرافي */
function bearing(lat, lon) {
  const p1 = lat * RAD, p2 = KAABA.lat * RAD, dl = (KAABA.lon - lon) * RAD;
  const y = Math.sin(dl) * Math.cos(p2);
  const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
  return (Math.atan2(y, x) / RAD + 360) % 360;
}
/** المسافة بالكيلومتر (هافرساين) */
function distanceKm(lat, lon) {
  const dp = (KAABA.lat - lat) * RAD, dl = (KAABA.lon - lon) * RAD;
  const a = Math.sin(dp / 2) ** 2 + Math.cos(lat * RAD) * Math.cos(KAABA.lat * RAD) * Math.sin(dl / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(a)));
}
const windName = (deg) => WINDS[Math.round(deg / 45) % 8];
const angleDiff = (a, b) => ((a - b + 540) % 360) - 180;

let loc = null;          // {lat, lon, savedAt, saved?:true}
let qibla = null;        // زاوية القبلة من الشمال
let heading = null;      // اتجاه أعلى الهاتف من الشمال (null = لا قراءة حقيقية)
let dialShown = 0;       // زاوية الدائرة المعروضة (متصلة لتجنب القفزة 359→0)
let aligned = false, sensorOn = false, gotSample = false, sensorTimer = null;

const elStage = $("compassStage"), elDial = $("compassDial"), elArm = $("qiblaArm");
const setText = (id, t) => { $(id).textContent = t; };

function renderCompass() {
  if (heading === null) {
    // لا توجد قراءة حقيقية: دائرة ثابتة، الشمال للأعلى، بلا حركة
    dialShown = 0;
    elDial.style.transform = "rotate(0deg)";
    elStage.classList.add("no-sensor");
    elStage.classList.remove("is-aligned");
    aligned = false;
    return;
  }
  elStage.classList.remove("no-sensor");
  dialShown += angleDiff(-heading, dialShown);
  elDial.style.transform = `rotate(${dialShown}deg)`;
  const now = qibla !== null && Math.abs(angleDiff(qibla, heading)) <= 5;
  elStage.classList.toggle("is-aligned", now);
  if (now && !aligned) {
    setText("qiblaSensor", "أنت الآن باتجاه القبلة ✓");
    if (navigator.vibrate) navigator.vibrate(60);
  }
  aligned = now;
}

function setLocation(next, fromSaved) {
  loc = { lat: next.lat, lon: next.lon, savedAt: next.savedAt || Date.now(), saved: !!fromSaved };
  qibla = bearing(loc.lat, loc.lon);
  elArm.hidden = false;
  elArm.style.transform = `rotate(${qibla}deg)`;
  setText("qiblaDegrees", `${ar(qibla, { maximumFractionDigits: 1, minimumFractionDigits: 1 })}°`);
  setText("qiblaDirection", `من الشمال باتجاه ${windName(qibla)}`);
  setText("qiblaDistance", `المسافة إلى الكعبة نحو ${ar(Math.round(distanceKm(loc.lat, loc.lon)))} كم`);
  const when = new Date(loc.savedAt).toLocaleDateString("ar", { day: "numeric", month: "long", year: "numeric" });
  setText("qiblaBearing", fromSaved
    ? `اتجاه القبلة محسوب من آخر موقع محفوظ (${when}). اضغط «تحديد موقعي» لتحديثه.`
    : `اتجاه القبلة من موقعك: ${ar(qibla, { maximumFractionDigits: 1 })}° من الشمال.`);
  renderCompass();
}

function locate() {
  if (!navigator.geolocation) { setText("qiblaBearing", "المتصفح لا يدعم تحديد الموقع. أدخل موقعك من صفحة المواقيت أو جرّب متصفحاً آخر."); return; }
  setText("qiblaBearing", "جارٍ تحديد موقعك...");
  navigator.geolocation.getCurrentPosition((pos) => {
    const next = { lat: pos.coords.latitude, lon: pos.coords.longitude, savedAt: Date.now() };
    writeJSON(LOC_KEY, next);
    setLocation(next, false);
  }, (err) => {
    const msg = err.code === 1
      ? "لم تسمح بالوصول إلى الموقع. فعّل الإذن من إعدادات المتصفح أو من أيقونة القفل بجانب العنوان ثم أعد المحاولة."
      : err.code === 3 ? "انتهت مهلة تحديد الموقع. اخرج إلى مكان مفتوح وتأكد من تفعيل GPS ثم أعد المحاولة."
      : "تعذر تحديد الموقع. تأكد من تفعيل GPS ثم أعد المحاولة.";
    setText("qiblaBearing", loc ? `${msg} (يُستخدم الموقع المحفوظ سابقاً.)` : msg);
  }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 });
}

function onOrientation(e) {
  let h = null;
  if (typeof e.webkitCompassHeading === "number" && !Number.isNaN(e.webkitCompassHeading)) h = e.webkitCompassHeading; // iOS
  else if ((e.type === "deviceorientationabsolute" || e.absolute === true) && typeof e.alpha === "number") h = (360 - e.alpha) % 360; // أندرويد: مرجع الشمال المطلق
  if (h === null) return; // قراءة نسبية لا تدل على الشمال: تُتجاهل ولا تُعرض
  if (!gotSample) {
    gotSample = true;
    clearTimeout(sensorTimer);
    setText("qiblaSensor", loc ? "المستشعر يعمل. أدِر الهاتف حتى يتطابق المؤشر العلوي مع 🕋." : "المستشعر يعمل. اضغط «تحديد موقعي» ليظهر اتجاه القبلة.");
  }
  heading = heading === null ? h : (heading + angleDiff(h, heading) * 0.25 + 360) % 360; // تنعيم
  renderCompass();
}

function stopSensor() {
  window.removeEventListener("deviceorientationabsolute", onOrientation, true);
  window.removeEventListener("deviceorientation", onOrientation, true);
  sensorOn = false; gotSample = false; heading = null;
  renderCompass();
}

async function enableCompass() {
  if (sensorOn) return;
  if (typeof window.DeviceOrientationEvent === "undefined") { setText("qiblaSensor", "هذا الهاتف أو المتصفح لا يدعم مستشعر الاتجاه. استخدم الزاوية بالدرجات المعروضة أعلاه."); return; }
  if (!window.isSecureContext) { setText("qiblaSensor", "مستشعر الاتجاه يتطلب فتح التطبيق عبر اتصال آمن (HTTPS)."); return; }
  try {
    if (typeof DeviceOrientationEvent.requestPermission === "function") {
      const p = await DeviceOrientationEvent.requestPermission();
      if (p !== "granted") { setText("qiblaSensor", "لم يتم منح إذن مستشعر الاتجاه. يمكنك السماح به من إعدادات المتصفح، أو استخدم الزاوية بالدرجات."); return; }
    }
  } catch {
    setText("qiblaSensor", "تعذر طلب إذن المستشعر. أعد المحاولة بعد الضغط مباشرة على الزر، أو استخدم الزاوية بالدرجات.");
    return;
  }
  sensorOn = true; gotSample = false;
  if ("ondeviceorientationabsolute" in window) window.addEventListener("deviceorientationabsolute", onOrientation, true);
  window.addEventListener("deviceorientation", onOrientation, true);
  const landscape = screen.orientation && screen.orientation.angle !== 0;
  setText("qiblaSensor", "جارٍ قراءة المستشعر..." + (landscape ? " للدقة استخدم الوضع الرأسي." : ""));
  sensorTimer = setTimeout(() => {
    if (gotSample) return;
    stopSensor();
    setText("qiblaSensor", "لم يرسل الهاتف قراءة اتجاه مطلقة (قد لا يملك بوصلة إلكترونية أو المتصفح لا يوفرها). لن نعرض مؤشراً متحركاً غير حقيقي؛ استخدم الزاوية بالدرجات.");
  }, 3000);
}

$("locateQibla").addEventListener("click", locate);
$("enableCompass").addEventListener("click", enableCompass);
const savedLoc = readJSON(LOC_KEY);
if (savedLoc && Number.isFinite(savedLoc.lat) && Number.isFinite(savedLoc.lon)) setLocation(savedLoc, true);

/* ============================== مواقيت الصلاة ============================== */
const ISO = "AD AE AF AG AI AL AM AO AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GT GU GW GY HK HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW".split(" ");

/* طريقة الحساب التلقائية حسب البلد (أرقام طرق AlAdhan). الباقي: رابطة العالم الإسلامي (3) */
const METHOD_BY_COUNTRY = {
  SA: 4, EG: 5, PK: 1, IN: 1, BD: 1, AF: 1, US: 2, CA: 2, FR: 12, TR: 13,
  KW: 9, QA: 10, AE: 8, BH: 8, OM: 8, SG: 11, MY: 17, BN: 17, ID: 20,
  TN: 18, DZ: 19, MA: 21, IR: 7,
};
const methodFor = (cc) => METHOD_BY_COUNTRY[cc] ?? 3;

const PRAYERS = [["Fajr", "الفجر"], ["Sunrise", "الشروق"], ["Dhuhr", "الظهر"], ["Asr", "العصر"], ["Maghrib", "المغرب"], ["Isha", "العشاء"]];
const LAST_KEY = "mushaf-prayer-last";
const CACHE_PREFIX = "mushaf-prayer-v2:";
const INDEX_KEY = "mushaf-prayer-index";
const API = "https://api.aladhan.com/v1";

const elCountry = $("prayerCountry"), elCity = $("prayerCity"), elMethod = $("prayerMethod");
const elDate = $("prayerDate"), elNotice = $("prayerNotice"), elTimes = $("prayerTimes");
const btnLoad = $("loadPrayer"), btnGps = $("loadPrayerGps");

/* قائمة الدول بأسماء عربية من المتصفح نفسه، مرتبة أبجدياً */
(function fillCountries() {
  let names;
  try { names = new Intl.DisplayNames(["ar"], { type: "region" }); } catch { names = null; }
  const rows = ISO.map((cc) => [cc, names ? names.of(cc) : cc]).filter(([cc, n]) => n && n !== cc);
  if (!rows.length) ISO.forEach((cc) => rows.push([cc, cc]));
  rows.sort((a, b) => a[1].localeCompare(b[1], "ar"));
  const frag = document.createDocumentFragment();
  for (const [cc, n] of rows) { const o = document.createElement("option"); o.value = cc; o.textContent = n; frag.append(o); }
  elCountry.append(frag);
})();

const last = readJSON(LAST_KEY);
elCountry.value = (last && last.country) || "LB";
if (!elCountry.value) elCountry.value = "LB";
if (last && last.city) elCity.value = last.city;
if (last && last.method) elMethod.value = last.method;

/* تاريخ اليوم المحلي بصيغة DD-MM-YYYY */
function todayKey(d = new Date()) {
  return [String(d.getDate()).padStart(2, "0"), String(d.getMonth() + 1).padStart(2, "0"), d.getFullYear()].join("-");
}

function cacheGet(sig) { return readJSON(CACHE_PREFIX + sig); }
function cacheSet(sig, entry) {
  writeJSON(CACHE_PREFIX + sig, entry);
  const idx = readJSON(INDEX_KEY, []).filter((x) => x !== sig);
  idx.unshift(sig);
  for (const old of idx.splice(8)) ls.del(CACHE_PREFIX + old); // نبقي آخر ٨ فقط
  writeJSON(INDEX_KEY, idx);
}

function showNotice(text, kind) {
  elNotice.hidden = !text;
  elNotice.textContent = text || "";
  elNotice.dataset.kind = kind || "";
}

/* عرض النتيجة. entry = {savedAt, day, data}. stale = جاءت من المحفوظ لا من الشبكة */
function renderPrayer(entry, stale, reason) {
  const data = entry.data, t = data.timings || {};
  const clean = (v) => { const x = String(v || "").split(" ")[0]; return /^\d{1,2}:\d{2}$/.test(x) ? x : "—"; };
  elTimes.textContent = "";
  for (const [key, name] of PRAYERS) {
    const row = document.createElement("div"); row.className = "prayer-time";
    const n = document.createElement("span"); n.textContent = name;
    const v = document.createElement("strong"); v.textContent = clean(t[key]);
    row.append(n, v); elTimes.append(row);
  }
  const hijri = data.date && data.date.hijri;
  const parts = [
    (data.date && data.date.readable) || entry.day,
    hijri && hijri.month ? `${hijri.day} ${hijri.month.ar || hijri.month.en} ${hijri.year}هـ` : "",
    data.meta && data.meta.timezone ? `المنطقة الزمنية: ${data.meta.timezone}` : "",
    data.meta && data.meta.method && data.meta.method.name ? `الطريقة: ${data.meta.method.name}` : "",
  ].filter(Boolean);
  elDate.textContent = parts.join(" · ");
  if (!stale) { showNotice(""); return; }
  const savedOn = new Date(entry.savedAt).toLocaleString("ar", { dateStyle: "medium", timeStyle: "short" });
  const outdated = entry.day !== todayKey();
  showNotice(`${reason} تُعرض مواقيت محفوظة بتاريخ ${entry.day} (حُفظت ${savedOn}).${outdated ? " هذه المواقيت ليست لليوم وقد تختلف بدقائق؛ اتصل بالإنترنت لتحديثها." : " آخر تحديث لها كان اليوم."}`, outdated ? "old" : "info");
}

async function getJSON(url) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 12000);
  try {
    const res = await fetch(url, { signal: ctl.signal, cache: "no-store" });
    const body = await res.json().catch(() => null);
    if (!res.ok || !body) { const e = new Error("http"); e.status = res.status; throw e; }
    return body;
  } finally { clearTimeout(timer); }
}

function errorMessage(e) {
  if (e && e.userMessage) return e.userMessage;
  if (e && e.name === "AbortError") return "انتهت مهلة الاتصال بخدمة المواقيت.";
  if (e && (e.status === 400 || e.status === 404)) return "تعذر العثور على هذه المدينة. اكتب الاسم بالإنجليزية (مثل Tripoli) وتأكد من اختيار البلد الصحيح.";
  if (e && e.status) return `تعذر الوصول إلى خدمة المواقيت (${e.status}).`;
  if (navigator.onLine === false) return "لا يوجد اتصال بالإنترنت.";
  return "تعذر الاتصال بخدمة المواقيت.";
}

/* يجلب ويعرض ويحفظ؛ عند الفشل يعرض المحفوظ مع تنبيه صريح، وإلا رسالة خطأ بلا أي مواقيت وهمية */
let prayerSeq = 0; // رقم الطلب الأحدث: نتجاهل أي ردّ متأخر لطلب أقدم حتى لا يطغى على اختيار المستخدم
async function loadPrayer(sig, url, selection) {
  const mine = ++prayerSeq;
  btnLoad.disabled = btnGps.disabled = true;
  const label = btnLoad.dataset.label || (btnLoad.dataset.label = btnLoad.textContent);
  btnLoad.textContent = "جارٍ التحميل...";
  elDate.textContent = "جارٍ جلب مواقيت الصلاة...";
  showNotice("");
  try {
    const body = await getJSON(url);
    if (mine !== prayerSeq) return;
    if (body.code !== 200 || !body.data || !body.data.timings) throw Object.assign(new Error("bad"), { status: body.code || 502 });
    const entry = { savedAt: Date.now(), day: todayKey(), data: body.data };
    if (!PRAYERS.some(([k]) => /^\d{1,2}:\d{2}/.test(String(entry.data.timings[k] || "")))) throw Object.assign(new Error("bad"), { userMessage: "وصلت استجابة غير صالحة من خدمة المواقيت." });
    cacheSet(sig, entry);
    writeJSON(LAST_KEY, selection);
    renderPrayer(entry, false);
  } catch (e) {
    if (mine !== prayerSeq) return;
    const saved = cacheGet(sig);
    const msg = errorMessage(e);
    if (saved && saved.data) renderPrayer(saved, true, msg);
    else {
      elDate.textContent = msg;
      elTimes.textContent = "";
      const p = document.createElement("p"); p.textContent = "لا توجد مواقيت محفوظة لهذا الموقع بعد. اتصل بالإنترنت وأعد المحاولة.";
      elTimes.append(p);
    }
  } finally {
    if (mine === prayerSeq) { btnLoad.disabled = btnGps.disabled = false; btnLoad.textContent = label; }
  }
}

function chosenMethod(cc) { return elMethod.value === "auto" ? methodFor(cc) : Number(elMethod.value); }

function loadByCity() {
  const city = elCity.value.trim(), cc = elCountry.value;
  if (!city || !cc) { elDate.textContent = "يرجى اختيار البلد وكتابة المدينة."; return; }
  const method = chosenMethod(cc);
  const day = todayKey();
  const url = `${API}/timingsByCity/${day}?${new URLSearchParams({ city, country: cc, method: String(method) })}`;
  const sig = `city|${cc}|${method}|${city.toLowerCase()}`;
  loadPrayer(sig, url, { mode: "city", country: cc, city, method: elMethod.value });
}

function loadByCoords(lat, lon) {
  const method = elMethod.value === "auto" ? null : Number(elMethod.value);
  const q = { latitude: lat.toFixed(4), longitude: lon.toFixed(4) };
  if (method !== null) q.method = String(method); // بدون طريقة: تُترك الخدمة لاختيار الأنسب لموقعك
  const url = `${API}/timings/${todayKey()}?${new URLSearchParams(q)}`;
  const sig = `gps|${lat.toFixed(2)}|${lon.toFixed(2)}|${method === null ? "auto" : method}`;
  loadPrayer(sig, url, { mode: "gps", lat, lon, country: elCountry.value, city: elCity.value, method: elMethod.value });
}

function useMyLocation() {
  if (!navigator.geolocation) { elDate.textContent = "المتصفح لا يدعم تحديد الموقع. اختر البلد واكتب المدينة."; return; }
  elDate.textContent = "جارٍ تحديد موقعك...";
  navigator.geolocation.getCurrentPosition((pos) => {
    const lat = pos.coords.latitude, lon = pos.coords.longitude;
    writeJSON(LOC_KEY, { lat, lon, savedAt: Date.now() });
    setLocation({ lat, lon, savedAt: Date.now() }, false);
    loadByCoords(lat, lon);
  }, (err) => {
    elDate.textContent = err.code === 1
      ? "لم تسمح بالوصول إلى الموقع. يمكنك اختيار البلد وكتابة المدينة يدوياً، أو تفعيل الإذن من إعدادات المتصفح."
      : "تعذر تحديد موقعك. اختر البلد واكتب المدينة يدوياً.";
  }, { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 });
}

$("prayerForm").addEventListener("submit", (e) => { e.preventDefault(); loadByCity(); });
btnGps.addEventListener("click", useMyLocation);

/* عند أول فتح لصفحة المواقيت: أعد تحميل آخر اختيار محفوظ (الشبكة أولاً ثم المحفوظ) */
let autoLoaded = false;
document.addEventListener("mushaf:tab", (e) => {
  if (e.detail !== "prayer" || autoLoaded) return;
  autoLoaded = true;
  const l = readJSON(LAST_KEY);
  if (!l) return;
  if (l.mode === "gps" && Number.isFinite(l.lat) && Number.isFinite(l.lon)) loadByCoords(l.lat, l.lon);
  else if (l.mode === "city") loadByCity();
});

/* للاختبارات الآلية فقط */
window.__mushaf = { bearing, distanceKm, methodFor, ISO };
})();
