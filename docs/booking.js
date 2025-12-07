// =======================================
// 順立骨科 booking.js（最終整合正式版）
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

// ---------- 平日班表（週一～週五）----------
// weekday: 1=Mon ... 5=Fri
const weekdaySchedule = {
  1: { // Monday
    morning: ["吳立偉院長", "郭芷毓醫師"],
    afternoon: ["林峻豪副院長"],
    night: ["林峻豪副院長"]
  },
  2: { // Tuesday
    morning: ["林峻豪副院長"],
    afternoon: ["郭芷毓醫師"],
    night: ["吳立偉院長", "郭芷毓醫師"]
  },
  3: { // Wednesday
    morning: ["吳立偉院長", "郭芷毓醫師"],
    afternoon: ["黃俞華副院長"],
    night: ["黃俞華副院長"]
  },
  4: { // Thursday
    morning: ["吳立偉院長"],
    afternoon: ["林峻豪副院長"],
    night: ["林峻豪副院長"]
  },
  5: { // Friday
    morning: ["林峻豪副院長"],
    afternoon: ["郭芷毓醫師"],
    night: ["郭芷毓醫師"]
  }
};

// ---------- 週六輪值醫師（只有早診＋午診） ----------
const saturdayDoctor = {
  "2025-12-06": "劉俊良醫師",
  "2025-12-13": "林峻豪副院長",
  "2025-12-20": "劉俊良醫師",
  "2025-12-27": "林峻豪副院長"
  // 之後你可以自己往下加
};

// ---------- 工具函式 ----------

// 將 yyyy-mm-dd 轉成星期幾（0=Sun ... 6=Sat）
function getWeekday(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00");
  if (Number.isNaN(d.getTime())) return null;
  return d.getDay();
}

// 是否週六
function isSaturday(dateStr) {
  return getWeekday(dateStr) === 6;
}

// 是否週日
function isSunday(dateStr) {
  return getWeekday(dateStr) === 0;
}

// 是否是 2025-12-25（晚診休診）
function isXmas(dateStr) {
  return dateStr === "2025-12-25";
}

// 依照日期 + 時段代碼，取得要寫入 DB / 顯示的文字
function getTimeText(dateStr, sec) {
  const wd = getWeekday(dateStr);
  if (sec === "morning") return timeLabel.morning;
  if (sec === "afternoon") {
    if (wd === 6) return timeLabel.afternoonSaturday; // 週六午診
    return timeLabel.afternoonWeekday;                // 平日午診
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

// ---------- Popup 控制 ----------
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
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateInput.min = tomorrow.toISOString().split("T")[0];
  }

  // 日期改變 → 更新時段 & 醫師
  if (dateInput && sectionSelect && doctorSelect) {
    dateInput.addEventListener("change", () => {
      const date = dateInput.value;
      if (!date) return;

      const weekday = getWeekday(date);

      // 初始化下拉
      sectionSelect.innerHTML = `<option value="">請選擇時段</option>`;
      doctorSelect.innerHTML = `<option value="">請先選擇時段</option>`;
      doctorSelect.disabled = true;

      // 週日休診
      if (weekday === 0) {
        sectionSelect.innerHTML = `<option value="">星期日休診</option>`;
        showPopup(
          "提醒",
          `您選擇的日期：${date}<br>星期日為休診日，無法預約。`
        );
        return;
      }

      // 週六：早診 + 午診（14:30–17:00），依輪值醫師
      if (weekday === 6) {
        const doc = saturdayDoctor[date];
        if (!doc) {
          showPopup(
            "提醒",
            `您選擇的日期：${date}<br>目前尚未設定週六門診，請改選其他日期。`
          );
          sectionSelect.innerHTML = `<option value="">本日無門診</option>`;
          return;
        }

        sectionSelect.innerHTML = `
          <option value="">請選擇時段</option>
          <option value="morning">${timeLabel.morning}</option>
          <option value="afternoon">${timeLabel.afternoonSaturday}</option>
        `;
        doctorSelect.innerHTML = `<option value="">請先選擇時段</option>`;
        doctorSelect.disabled = true;
        return;
      }

      // 平日（週一～週五）
      const daySchedule = weekdaySchedule[weekday];
      if (!daySchedule) {
        sectionSelect.innerHTML = `<option value="">本日無門診</option>`;
        return;
      }

      const xmas = isXmas(date); // 2025-12-25 晚診休診

      let options = `
        <option value="">請選擇時段</option>
        <option value="morning">${timeLabel.morning}</option>
        <option value="afternoon">${timeLabel.afternoonWeekday}</option>
      `;
      if (!xmas) {
        options += `<option value="night">${timeLabel.night}</option>`;
      }
      sectionSelect.innerHTML = options;
      doctorSelect.innerHTML = `<option value="">請先選擇時段</option>`;
      doctorSelect.disabled = true;
    });

    // 選時段 → 更新醫師
    sectionSelect.addEventListener("change", () => {
      const date = dateInput.value;
      const sec = sectionSelect.value;

      doctorSelect.innerHTML = `<option value="">請選擇醫師</option>`;

      if (!date || !sec) {
        doctorSelect.disabled = true;
        return;
      }

      const weekday = getWeekday(date);

      // 週日早就被擋掉，這裡只是保險
      if (weekday === 0) {
        doctorSelect.innerHTML = `<option value="">休診</option>`;
        doctorSelect.disabled = true;
        return;
      }

      // 週六：依輪值醫師
      if (weekday === 6) {
        const doc = saturdayDoctor[date];
        if (!doc) {
          doctorSelect.innerHTML = `<option value="">本日無門診</option>`;
          doctorSelect.disabled = true;
          return;
        }
        doctorSelect.disabled = false;
        const opt = document.createElement("option");
        opt.value = doc;
        opt.textContent = doc;
        doctorSelect.appendChild(opt);
        doctorSelect.value = doc;
        return;
      }

      // 平日：依班表
      const daySchedule = weekdaySchedule[weekday];
      if (!daySchedule) {
        doctorSelect.innerHTML = `<option value="">本日無門診</option>`;
        doctorSelect.disabled = true;
        return;
      }

      const list = daySchedule[sec] || [];
      list.forEach((doc) => {
        const opt = document.createElement("option");
        opt.value = doc;
        opt.textContent = doc;
        doctorSelect.appendChild(opt);
      });

      doctorSelect.disabled = list.length === 0;
    });
  }

  // 綁定送出按鈕（不用 inline onclick）
  if (submitBtn) {
    submitBtn.addEventListener("click", submitBooking);
  }
});

// ---------- 送出預約（強化版） ----------
async function submitBooking() {
  const submitBtn = document.getElementById("submitBtn");
  const form = document.getElementById("bookingForm");

  if (!submitBtn) {
    alert("找不到送出按鈕，請確認 HTML 中是否有 id='submitBtn'");
    return;
  }

  // 防止連點
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

    // 欄位檢查
    if (!name || !phone || !id_number || !birthday || !date || !sec || !doctor) {
      showPopup("提醒", "所有欄位都是必填，請確認是否有漏填。");
      return;
    }

    const timeText = getTimeText(date, sec);

    // 前端檢查：是否已重複預約
    const { data: exist, error: checkErr } = await supa
      .from("appointments")
      .select("*")
      .eq("name", name)
      .eq("phone", phone)
      .eq("date", date)
      .eq("time", timeText)
      .eq("doctor", doctor);

    if (checkErr) {
      console.error("檢查預約時發生錯誤：", checkErr);
      showPopup("錯誤", "檢查預約時發生錯誤，請稍後再試。");
      return;
    }

    if (exist && exist.length > 0) {
      showPopup(
        "提醒",
        `您已預約過以下門診：<br><br>日期：${date}<br>時段：${timeText}<br>醫師：${doctor}<br><br>同一人同一時段不可重複預約。`
      );
      return;
    }

    // 寫入資料（後端另有 UNIQUE 約束，雙重防護）
    const { error: insertErr } = await supa
      .from("appointments")
      .insert([
        {
          name,
          phone,
          id_number,
          birthday,
          date,
          time: timeText,
          doctor
        }
      ]);

    if (insertErr) {
      console.error("寫入資料錯誤：", insertErr);

      // 若是 UNIQUE 約束錯誤（通常 code=23505）
      if (insertErr.code === "23505") {
        showPopup(
          "提醒",
          `系統偵測到您本日該時段已經有預約紀錄。<br>請勿重複預約。`
        );
      } else {
        showPopup("錯誤", "寫入資料時發生錯誤，請稍後再試。");
      }
      return;
    }

    // 成功處理：提示 + 清空 + 跳轉
    showPopup(
      "預約成功！",
      `姓名：${name}<br>日期：${date}<br>時段：${timeText}<br>醫師：${doctor}`
    );

    if (form) form.reset();

    const doctorSelect = document.getElementById("doctor");
    if (doctorSelect) {
      doctorSelect.innerHTML = `<option value="">請先選擇時段</option>`;
      doctorSelect.disabled = true;
    }

    // 1.5 秒後跳轉感謝頁
    setTimeout(() => {
      window.location.href = "thanks.html";
    }, 1500);

  } finally {
    hideLoading();
    submitBtn.disabled = false;
    submitBtn.textContent = "送出預約";
  }
}

// 讓其他地方（如果有）也可以呼叫
window.submitBooking = submitBooking;
