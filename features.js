/* حقوق التطبيق محفوظة؛ النص القرآني وبياناته تخضع لإشعار Tanzil المرفق. */
(() => {
  "use strict";

  // اختصار آمن للوصول إلى عناصر الواجهة.
  const $ = (id) => document.getElementById(id);
  const menu = $("moreMenu");
  const panel = $("morePanel");

  // القائمة الإضافية مستقلة عن التنقل الأساسي وتغلق بعد اختيار أي صفحة.
  function closeMenu() {
    if (!menu || !panel) return;
    panel.hidden = true;
    menu.setAttribute("aria-expanded", "false");
  }

  function showTab(id) {
    document.querySelectorAll(".tab").forEach((item) => {
      item.classList.toggle("active", item.id === id);
    });
    document.querySelectorAll('nav button[data-tab]').forEach((item) => {
      item.classList.toggle("active", item.dataset.tab === id);
    });
    closeMenu();
  }

  if (menu && panel) {
    menu.addEventListener("click", () => {
      panel.hidden = !panel.hidden;
      menu.setAttribute("aria-expanded", String(!panel.hidden));
    });
    panel.querySelectorAll("[data-tab]").forEach((button) => {
      button.addEventListener("click", () => showTab(button.dataset.tab));
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });
    document.addEventListener("click", (event) => {
      if (!panel.hidden && !panel.contains(event.target) && !menu.contains(event.target)) closeMenu();
    });
  }

  // حساب اتجاه القبلة والمسافة الكروية من إحداثيات المستخدم إلى الكعبة.
  const KAABA = { lat: 21.4225, lon: 39.8262 };
  const EARTH_RADIUS_KM = 6371.0088;
  const toRadians = (value) => value * Math.PI / 180;
  const normalize = (value) => (value % 360 + 360) % 360;

  function qiblaBearing(lat, lon) {
    const phi1 = toRadians(lat);
    const phi2 = toRadians(KAABA.lat);
    const deltaLambda = toRadians(KAABA.lon - lon);
    const y = Math.sin(deltaLambda);
    const x = Math.cos(phi1) * Math.tan(phi2) -
      Math.sin(phi1) * Math.cos(deltaLambda);
    return normalize(Math.atan2(y, x) * 180 / Math.PI);
  }

  function distanceToKaaba(lat, lon) {
    const phi1 = toRadians(lat);
    const phi2 = toRadians(KAABA.lat);
    const deltaPhi = phi2 - phi1;
    const deltaLambda = toRadians(KAABA.lon - lon);
    const a = Math.sin(deltaPhi / 2) ** 2 +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;
    return 2 * EARTH_RADIUS_KM * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function directionName(degrees) {
    const directions = ["الشمال", "الشمال الشرقي", "الشرق", "الجنوب الشرقي",
      "الجنوب", "الجنوب الغربي", "الغرب", "الشمال الغربي"];
    return directions[Math.round(normalize(degrees) / 45) % 8];
  }

  let coordinates = null;
  let bearing = null;
  let deviceHeading = null;
  let sensorReady = false;
  let aligned = false;
  let lastSensorMessage = "";

  function qiblaStatus(message) {
    const element = $("qiblaBearing");
    if (element) element.textContent = message;
  }

  function renderQibla() {
    if (bearing === null || !coordinates) return;
    const distance = distanceToKaaba(coordinates.lat, coordinates.lon);
    const base = "اتجاه القبلة: " + bearing.toFixed(1) + "° من الشمال (" +
      directionName(bearing) + ") · المسافة إلى الكعبة: " +
      Math.round(distance).toLocaleString("ar") + " كم.";
    const needle = document.querySelector(".compass-needle");
    const mark = $("qiblaMark");

    if (sensorReady && Number.isFinite(deviceHeading)) {
      const relative = normalize(bearing - deviceHeading);
      if (needle) {
        needle.style.display = "block";
        needle.style.transform = "rotate(" + relative + "deg)";
      }
      if (mark) {
        mark.style.display = "block";
        mark.style.transform = "translate(-50%,-50%) rotate(" + relative +
          "deg) translateY(-86px)";
      }
      const difference = Math.min(relative, 360 - relative);
      if (difference <= 5) {
        if (!aligned && navigator.vibrate) navigator.vibrate(90);
        aligned = true;
        qiblaStatus(base + " أنت بمحاذاة القبلة ضمن 5 درجات. أحسنت.");
      } else {
        aligned = false;
        qiblaStatus(base + " حرّك الهاتف حتى يصبح المؤشر باتجاه القبلة. " +
          "فرق الاتجاه الحالي " + difference.toFixed(1) + "°.");
      }
    } else {
      if (needle) needle.style.display = "none";
      if (mark) mark.style.display = "none";
      qiblaStatus(base + " البوصلة الحية غير مفعّلة؛ استخدم الزاوية الرقمية " +
        "أو فعّل مستشعر الاتجاه بعد معايرة الهاتف.");
    }
  }

  function useCoordinates(lat, lon, source) {
    if (!Number.isFinite(lat) || !Number.isFinite(lon) ||
        Math.abs(lat) > 90 || Math.abs(lon) > 180) {
      qiblaStatus("إحداثيات الموقع غير صالحة.");
      return;
    }
    coordinates = { lat, lon };
    bearing = qiblaBearing(lat, lon);
    try {
      localStorage.setItem("mushaf-qibla-location", JSON.stringify(coordinates));
    } catch (_) {
      // قد يمنع المتصفح التخزين؛ تظل الحسابات الحالية متاحة.
    }
    renderQibla();
    if (source) qiblaStatus($("qiblaBearing").textContent + " مصدر الموقع: " + source + ".");
  }

  // استعادة موقع سبق أن اختاره المستخدم، من دون طلب إذن GPS عند فتح التطبيق.
  try {
    const saved = JSON.parse(localStorage.getItem("mushaf-qibla-location") || "null");
    if (saved && Number.isFinite(saved.lat) && Number.isFinite(saved.lon)) {
      useCoordinates(saved.lat, saved.lon, "الموقع المحفوظ على هذا الجهاز");
    }
  } catch (_) {
    qiblaStatus("لم يُحفظ موقع سابق. اضغط تحديد موقعي عند رغبتك.");
  }

  const locateButton = $("locateQibla");
  if (locateButton) {
    locateButton.addEventListener("click", () => {
      if (!navigator.geolocation) {
        qiblaStatus("هذا المتصفح لا يدعم تحديد الموقع. لا يمكن حساب الاتجاه دون إحداثيات؛ اختر مدينة من إعدادات الموقع عند توفرها.");
        return;
      }
      qiblaStatus("نطلب موقعك الآن بعد ضغطك على الزر. وافق على إذن الموقع عند ظهور الطلب.");
      navigator.geolocation.getCurrentPosition(
        (position) => useCoordinates(position.coords.latitude, position.coords.longitude, "GPS"),
        (error) => {
          const message = error.code === 1
            ? "رفضت إذن الموقع. يمكنك إعادة المحاولة بعد السماح به من إعدادات المتصفح."
            : error.code === 2
              ? "تعذر تحديد الموقع. تحقق من تشغيل خدمة الموقع ثم حاول مجدداً."
              : "انتهت مهلة تحديد الموقع. حاول في مكان مفتوح أو استخدم موقعاً محفوظاً.";
          qiblaStatus(message);
        },
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 60000 }
      );
    });
  }

  // لا نعتبر alpha بوصلة شمالية إلا إذا كان الحدث مطلقاً؛ webkitCompassHeading
  // هو القراءة الخاصة بأجهزة iOS، و deviceorientationabsolute شائع على Android.
  function onOrientation(event) {
    if (typeof event.webkitCompassHeading === "number") {
      deviceHeading = normalize(event.webkitCompassHeading);
      sensorReady = true;
    } else if (event.absolute === true && typeof event.alpha === "number") {
      deviceHeading = normalize(360 - event.alpha);
      sensorReady = true;
    } else {
      if (!lastSensorMessage) {
        lastSensorMessage = "وصلت قراءة اتجاه نسبية وليست شمالاً مغناطيسياً مطلقاً؛ لن نعرض سهماً متحركاً مضللاً.";
        if (bearing !== null) qiblaStatus(lastSensorMessage + " " + $("qiblaBearing").textContent);
      }
      return;
    }
    renderQibla();
  }

  const compassButton = $("enableCompass");
  if (compassButton) {
    compassButton.addEventListener("click", async () => {
      try {
        if (!("DeviceOrientationEvent" in window)) {
          throw new Error("هذا الجهاز أو المتصفح لا يوفر مستشعر اتجاه. ستبقى زاوية القبلة والمسافة ظاهرتين رقمياً.");
        }
        if (typeof DeviceOrientationEvent.requestPermission === "function") {
          const permission = await DeviceOrientationEvent.requestPermission();
          if (permission !== "granted") {
            throw new Error("لم تمنح إذن مستشعر الاتجاه. يمكنك استخدام الزاوية الرقمية دون البوصلة الحية.");
          }
        }
        window.addEventListener("deviceorientationabsolute", onOrientation, true);
        window.addEventListener("deviceorientation", onOrientation, true);
        qiblaStatus(bearing === null
          ? "تم طلب تفعيل المستشعر. حدّد موقعك أولاً لحساب اتجاه القبلة."
          : $("qiblaBearing").textContent + " جارٍ انتظار قراءة شمال مطلق من المستشعر.");
      } catch (error) {
        qiblaStatus(error.message || "تعذر تفعيل مستشعر الاتجاه. استخدم الزاوية الرقمية.");
      }
    });
  }

  // مواقيت الصلاة: اختيار طريقة الحساب تلقائياً وفق الدولة أو يدوياً.
  const prayerNames = {
    Fajr: "الفجر", Sunrise: "الشروق", Dhuhr: "الظهر",
    Asr: "العصر", Maghrib: "المغرب", Isha: "العشاء"
  };
  const prayerCachePrefix = "mushaf-prayer-cache-v2";

  function methodForCountry(country) {
    const value = country.trim().toLocaleLowerCase();
    if (/saudi arabia|السعودية|المملكة العربية السعودية/.test(value)) return "4";
    if (/egypt|مصر/.test(value)) return "5";
    if (/pakistan|باكستان/.test(value)) return "1";
    if (/united states|usa|canada|أمريكا|الولايات المتحدة|كندا/.test(value)) return "2";
    return "3";
  }

  function prayerCacheKey(city, country, method) {
    return prayerCachePrefix + ":" + [city, country, method]
      .map((value) => value.trim().toLocaleLowerCase()).join(":");
  }

  function renderPrayer(data, stale) {
    const timings = data.timings || {};
    const dateElement = $("prayerDate");
    const timesElement = $("prayerTimes");
    if (!dateElement || !timesElement) return;

    const dateText = data.date && data.date.readable ? data.date.readable : "";
    const timezone = data.meta && data.meta.timezone ? data.meta.timezone : "المنطقة الزمنية غير متاحة";
    dateElement.textContent = dateText + " · " + timezone +
      (stale ? " · بيانات محفوظة قد تكون قديمة؛ اتصل بالإنترنت للتحديث." : " · تم التحديث الآن.");

    timesElement.replaceChildren();
    Object.entries(prayerNames).forEach(([key, label]) => {
      const card = document.createElement("div");
      const name = document.createElement("span");
      const time = document.createElement("strong");
      card.className = "prayer-time";
      name.textContent = label;
      time.textContent = String(timings[key] || "—").split(" ")[0];
      card.append(name, time);
      timesElement.append(card);
    });
  }

  function readPrayerCache(key) {
    try {
      const item = JSON.parse(localStorage.getItem(key) || "null");
      return item && item.data ? item : null;
    } catch (_) {
      return null;
    }
  }

  async function fetchPrayerTimes() {
    const city = $("prayerCity").value.trim();
    const country = $("prayerCountry").value.trim();
    const choice = $("prayerMethod").value;
    const method = choice === "auto" ? methodForCountry(country) : choice;
    const status = $("prayerDate");
    const output = $("prayerTimes");
    const button = $("loadPrayer");

    if (!city || !country) {
      status.textContent = "أدخل اسم البلد والمدينة أولاً.";
      return;
    }

    const key = prayerCacheKey(city, country, method);
    const cached = readPrayerCache(key);
    button.disabled = true;
    button.textContent = "جارٍ التحميل...";
    output.textContent = "جارٍ جلب المواقيت من خدمة AlAdhan...";
    status.textContent = "طريقة الحساب: " + method + (choice === "auto" ? " (اختيار تلقائي)" : " (اختيار يدوي)");

    try {
      // نستخدم التاريخ المحلي للجهاز؛ وتُعرض المنطقة الزمنية التي تعيدها الخدمة.
      const now = new Date();
      const date = [String(now.getDate()).padStart(2, "0"),
        String(now.getMonth() + 1).padStart(2, "0"), now.getFullYear()].join("-");
      const url = new URL("https://api.aladhan.com/v1/timingsByCity/" + date);
      url.search = new URLSearchParams({ city, country, method }).toString();

      const response = await fetch(url.toString(), { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error("تعذر الاتصال بخدمة المواقيت (HTTP " + response.status + ").");
      const body = await response.json();
      if (body.code !== 200 || !body.data || !body.data.timings) {
        throw new Error("لم تُرجع الخدمة مواقيت صالحة لهذه المدينة.");
      }

      const record = { savedAt: Date.now(), dateKey: date, data: body.data };
      try { localStorage.setItem(key, JSON.stringify(record)); } catch (_) { /* التخزين غير متاح */ }
      renderPrayer(body.data, false);
    } catch (error) {
      if (cached) {
        const sameDay = cached.dateKey === new Date().toLocaleDateString("en-CA");
        renderPrayer(cached.data, true);
        status.textContent += " · تعذر التحديث: " + error.message +
          (sameDay ? "" : " · تاريخ النسخة المحفوظة مختلف عن اليوم.");
      } else {
        status.textContent = "لم تتوفر مواقيت محفوظة. " + error.message;
        output.textContent = "لا توجد بيانات موثوقة للعرض حالياً. تحقق من الاتصال واسم المدينة ثم أعد المحاولة.";
      }
    } finally {
      button.disabled = false;
      button.textContent = "عرض مواقيت اليوم";
    }
  }

  const loadPrayerButton = $("loadPrayer");
  if (loadPrayerButton) loadPrayerButton.addEventListener("click", fetchPrayerTimes);

  // إظهار طريقة الحساب الافتراضية المناسبة فور تغيير البلد، مع إبقاء التغيير اليدوي ممكناً.
  const countryInput = $("prayerCountry");
  const methodSelect = $("prayerMethod");
  if (countryInput && methodSelect) {
    countryInput.addEventListener("change", () => {
      if (methodSelect.value === "auto") {
        methodSelect.setAttribute("aria-label", "طريقة الحساب التلقائية: " +
          methodForCountry(countryInput.value));
      }
    });
  }
})();
