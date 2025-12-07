// =======================================
// 順立骨科 booking.js（最終整合正式版 — 含時間字串修正）
// =======================================

// ---------- Supabase 設定 ----------
const SUPABASE_URL = "https://fjqsrhnwssazcqvjdqqt.supabase.co";
const SUPABASE_KEY = "sb-publishable_3C11H2gMsruJ11llR82XNw_zvl2fIPR";

const { createClient } = window.supabase;
const supa = createClient(SUPABASE_URL, SUPABASE_KEY);

// ---------- 時段顯示文字 ----------
const timeLabel = {
  morning: "早診（08:00–12:00）",
  afternoonWeekday: "午診（14:30–18:00）",
  afternoonSaturday: "午診（14:30–17:00）",
  night: "晚診（18:00–20:00）"
};

// ---------- 時間字串正規化（避免 EN DASH 導致查詢錯誤） ----------
function normalizeTimeString(str) {
  if (!str) return str;
  return str.replace(/–/g, "-"); // 將 “–”（EN DASH）轉換為 “-”
}

// ---------- 平日班表（週一～週五） ----------
const weekdaySchedule = {
  1: {
    morning: ["吳立偉院長", "郭芷毓醫師"],
    afternoon: ["林峻豪副院長"],
    night: ["林峻豪副院長"]
  },
  2: {
    morning: ["林峻豪副院長"],
    afternoon: ["郭芷毓醫師"],
    night: ["吳立偉院長", "郭芷毓醫師"]
  },
  3: {
    morning: ["吳立偉院長", "郭芷毓醫師"],
    afternoon: ["黃俞華副院長"],
    night: ["黃俞華副院長"]
  },
  4: {
    morning: ["吳立偉院長"],
    afternoon: ["林峻豪副院長"],
    night: ["林峻豪副院長"]
  },
  5: {
    morning: ["林峻豪副院長"],
    afternoon: ["郭芷毓醫師"],
    night: ["郭芷毓醫師"]
  }
};

// ---------- 週六輪值醫師 ----------
const saturdayDoctor = {
  "2025-12-06": "劉俊良醫師",
  "2025-12-13": "林峻豪副院長",
  "2025-12-20": "劉俊良醫師",
  "2025-12-27": "林峻豪副院長"
};

// ---------- 工具函式 ----------
function getWeekday(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00");
  return Number.isNaN(d.getTime()) ? null : d.getDay();
}

function isSaturday(dateStr) {
  return getWeekday(dateStr) === 6;
}

function isSunday(dateStr) {
  return getWeekday(dateStr) === 0;
}

function isXmas(dateStr) {
  return dateStr === "2025-12-25";
}

function getTimeText(dateStr, sec) {
  const wd = getWeekday(dateStr);
  if (sec === "morning") return timeLabel.morning;
  if (sec === "afternoon") {
    return wd === 6 ? timeLabel.afternoonSaturday : timeLabel.afternoonWeekday;
  }
  if (sec === "night") return timeLabel.night;
  return sec;
}

// ---------- Loading 遮罩 ----------
function showLoading() {
  const mask = document.getElementById("loadingMask");
  if (mask) mask.style.display = "flex";
}

function hideLoading() {
  const mask = document.getElementById("loadingMask");
  if (mask) mask.style.display = "none";
}

// ---------- Popup ----------
function showPopup(title, html) {
  document.getElementById("popupTitle").textContent = title;
  document.getElementById("popupContent").innerHTML = html;
  document.getElementById("popupBg").style.display = "flex";
}

window.closePopup = function () {
  document.getElementById("popupBg").style.display = "none";
};

// ---------- DOM 初始化 ----------
document.addEventListener("DOMContentLoaded", () => {
  const dateInput = document.getElementById("date");
  const sectionSelect = document.getElementById("section");
  const doctorSelect = document.getElementById("doctor");
  const submitBtn = document.getElementById("submitBtn");

  // 今日不可預約（從明天開始）
  if (dateInput) {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    dateInput.min = t.toISOString().split("T")[0];
  }

  // ---------- 日期改變 → 時段選單 ----------
  dateInput.addEventListener("change", () => {
    const date = dateInput.value;
    if (!date) return;

    const weekday = getWeekday(date);

    // 清空初始
    sectionSelect.innerHTML = `<option value="">請選擇時段</option>`;
    doctorSelect.innerHTML = `<option value="">請先選擇時段</option>`;
    doctorSelect.disabled = true;

    // 週日休診
    if (isSunday(date)) {
      sectionSelect.innerHTML = `<option value="">星期日休診</option>`;
      showPopup("提醒", `您選擇的日期：${date}<br>星期日為休診日，無法預約。`);
      return;
    }

    // 週六（早 + 午）
    if (isSaturday(date)) {
      if (!saturdayDoctor[date]) {
        sectionSelect.innerHTML = `<option value="">本日無門診</option>`;
        showPopup("提醒", `${date}<br>尚未設定週六輪值醫師。`);
        return;
      }

      sectionSelect.innerHTML = `
        <option value="">請選擇時段</option>
        <option value="morning">${timeLabel.morning}</option>
        <option value="afternoon">${timeLabel.afternoonSaturday}</option>
      `;
      return;
    }

    // 平日（週一～週五）
    const schedule = weekdaySchedule[weekday];
    if (!schedule) {
      sectionSelect.innerHTML = `<option value="">本日無門診</option>`;
      return;
    }

    let options = `
      <option value="">請選擇時段</option>
      <option value="morning">${timeLabel.morning}</option>
      <option value="afternoon">${timeLabel.afternoonWeekday}</option>
    `;
    if (!isXmas(date)) {
      options += `<option value="night">${timeLabel.night}</option>`;
    }

    sectionSelect.innerHTML = options;
  });

  // ---------- 選時段 → 醫師選單 ----------
  sectionSelect.addEventListener("change", () => {
    const date = dateInput.value;
    const sec = sectionSelect.value;
    const weekday = getWeekday(date);

    doctorSelect.innerHTML = `<option value="">請選擇醫師</option>`;

    if (!sec) {
      doctorSelect.disabled = true;
      return;
    }

    // 週六
    if (isSaturday(date)) {
      const doc = saturdayDoctor[date];
      doctorSelect.disabled = false;
      doctorSelect.innerHTML += `<option value="${doc}">${doc}</option>`;
      doctorSelect.value = doc;
      return;
    }

    // 平日
    const schedule = weekdaySchedule[weekday];
    const list = schedule[sec] || [];
    list.forEach(doc => {
      doctorSelect.innerHTML += `<option value="${doc}">${doc}</option>`;
    });
    doctorSelect.disabled = list.length === 0;
  });

  // 綁定送出按鈕
  submitBtn.addEventListener("click", submitBooking);
});

// ---------- 送出預約（含時間字串正規化） ----------
async function submitBooking() {
  const submitBtn = document.getElementById("submitBtn");
  const form = document.getElementById("bookingForm");

  submitBtn.disabled = true;
  submitBtn.textContent = "處理中…";
  showLoading();

  try {
    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const id_number = document.getElementById("id_number").value.trim();
    const birthday = document.getElementById("birthday").value;
    const date = document.getElementById("date").value;
    const sec = document.getElementById("section").value;
    const doctor = document.getElementById("doctor").value;

    if (!name || !phone || !id_number || !birthday || !date || !sec || !doctor) {
      showPopup("提醒", "所有欄位都是必填，請確認是否有漏填。");
      return;
    }

    // 時段文字 → 正規化後查詢
    const timeText = getTimeText(date, sec);
    const timeNormalized = normalizeTimeString(timeText);

    // ---------- 前端查詢：是否重複預約 ----------
    const { data: exist, error: checkErr } = await supa
      .from("appointments")
      .select("*")
      .eq("name", name)
      .eq("phone", phone)
      .eq("date", date)
      .eq("time", timeNormalized)
      .eq("doctor", doctor);

    if (checkErr) {
      console.error("查詢錯誤：", checkErr);
      showPopup("錯誤", "檢查預約時發生錯誤，請稍後再試。");
      return;
    }

    if (exist && exist.length > 0) {
      showPopup(
        "提醒",
        `您已預約過以下門診：<br><br>日期：${date}<br>時段：${timeText}<br>醫師：${doctor}`
      );
      return;
    }

    // ---------- 寫入資料（後端 UNIQUE 防呆） ----------
    const { error: insertErr } = await supa.from("appointments").insert([
      {
        name,
        phone,
        id_number,
        birthday,
        date,
        time: timeNormalized,
        doctor
      }
    ]);

    if (insertErr) {
      console.error(insertErr);
      showPopup("錯誤", "寫入資料時發生錯誤，請稍後再試。");
      return;
    }

    // ---------- 成功 ----------
    showPopup(
      "預約成功！",
      `姓名：${name}<br>日期：${date}<br>時段：${timeText}<br>醫師：${doctor}`
    );

    form.reset();
    document.getElementById("doctor").innerHTML =
      `<option value="">請先選擇時段</option>`;
    document.getElementById("doctor").disabled = true;

    setTimeout(() => {
      window.location.href = "thanks.html";
    }, 1500);

  } finally {
    hideLoading();
    submitBtn.disabled = false;
    submitBtn.textContent = "送出預約";
  }
}

window.submitBooking = submitBooking;
