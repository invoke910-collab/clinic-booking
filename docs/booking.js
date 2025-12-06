// ========================================================
// 順立骨科 booking.js（最終正式版）── 使用 Supabase
// ========================================================

// ---------- Supabase 設定 ----------
const SUPABASE_URL = "https://fjqsrhnwssazcqvjdqqt.supabase.co";
const SUPABASE_KEY = "sb-publishable_3C11H2gMsruJ11llR82XNw_zvl2fIPR"; // 一定要換成你自己的那串

const { createClient } = window.supabase;
const supa = createClient(SUPABASE_URL, SUPABASE_KEY);

// ---------- 今日不可預約（從明天開始） ----------
const dateInput = document.getElementById("date");
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
dateInput.min = tomorrow.toISOString().split("T")[0];

// ---------- 取得 DOM ----------
const sectionSelect = document.getElementById("section");
const doctorSelect = document.getElementById("doctor");

// ---------- 時段中文 ----------
const timeLabel = {
  morning: "早診（08:00–12:00）",
  afternoon: "午診（14:30–18:00）",
  night: "晚診（18:00–20:00）"
};

// ---------- 平日班表（週一～週五） ----------
const weekdaySchedule = {
  1: {
    // Monday
    morning: ["吳立偉院長", "郭芷毓醫師"],
    afternoon: ["林峻豪副院長"],
    night: ["林峻豪副院長"]
  },
  2: {
    // Tuesday
    morning: ["林峻豪副院長"],
    afternoon: ["郭芷毓醫師"],
    night: ["吳立偉院長", "郭芷毓醫師"]
  },
  3: {
    // Wednesday
    morning: ["吳立偉院長", "郭芷毓醫師"],
    afternoon: ["黃俞華副院長"],
    night: ["黃俞華副院長"]
  },
  4: {
    // Thursday
    morning: ["吳立偉院長"],
    afternoon: ["林峻豪副院長"],
    night: ["林峻豪副院長"]
  },
  5: {
    // Friday
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
  // 之後若有新的日期，可以自己往下加
};

// ========================================================
// 日期改變 → 更新時段＆醫師
// ========================================================
dateInput.addEventListener("change", () => {
  const date = dateInput.value;
  if (!date) return;

  const d = new Date(date + "T00:00:00");
  const weekday = d.getDay(); // 0=Sun, 6=Sat

  // 初始化下拉
  sectionSelect.innerHTML = `<option value="">請選擇時段</option>`;
  doctorSelect.innerHTML = `<option value="">請先選擇時段</option>`;
  doctorSelect.disabled = true;

  // ---------- 星期日休診 ----------
  if (weekday === 0) {
    showPopup(
      "提醒",
      `您選擇的日期：${date}<br>星期日為休診日，無法預約。`
    );
    sectionSelect.innerHTML = `<option value="">星期日休診</option>`;
    return;
  }

  // ---------- 週六：早＋午，依照輪值醫師 ----------
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

    // 週六只開放早診＋午診
    sectionSelect.innerHTML = `
      <option value="">請選擇時段</option>
      <option value="morning">${timeLabel.morning}</option>
      <option value="afternoon">${timeLabel.afternoon}</option>
    `;

    sectionSelect.onchange = () => {
      const sec = sectionSelect.value;
      doctorSelect.innerHTML = `<option value="">請選擇醫師</option>`;

      if (!sec) {
        doctorSelect.disabled = true;
        return;
      }
      doctorSelect.disabled = false;

      const opt = document.createElement("option");
      opt.value = doc;
      opt.textContent = doc;
      doctorSelect.appendChild(opt);
      doctorSelect.value = doc;
    };

    return;
  }

  // ---------- 平日（週一～週五） ----------
  const daySchedule = weekdaySchedule[weekday];
  if (!daySchedule) {
    // 正常不會進來，只是保險
    sectionSelect.innerHTML = `<option value="">本日無門診</option>`;
    return;
  }

  sectionSelect.innerHTML = `
    <option value="">請選擇時段</option>
    <option value="morning">${timeLabel.morning}</option>
    <option value="afternoon">${timeLabel.afternoon}</option>
    <option value="night">${timeLabel.night}</option>
  `;

  sectionSelect.onchange = () => {
    const sec = sectionSelect.value;
    doctorSelect.innerHTML = `<option value="">請選擇醫師</option>`;

    if (!sec) {
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
  };
});

// ========================================================
// 送出預約
// ========================================================
window.submitBooking = async function () {
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

  const timeText = timeLabel[sec] || sec;

  // 檢查是否重複預約（同姓名＋電話＋日期＋時段＋醫師）
  const { data: exist, error: checkErr } = await supa
    .from("appointments")
    .select("*")
    .eq("name", name)
    .eq("phone", phone)
    .eq("date", date)
    .eq("time", timeText)
    .eq("doctor", doctor);

  if (checkErr) {
    console.error(checkErr);
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

  // 寫入資料
  const { error: insertErr } = await supa.from("appointments").insert([
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
    console.error(insertErr);
    showPopup("錯誤", "寫入資料時發生錯誤，請稍後再試。");
    return;
  }

  // 成功提示
  showPopup(
    "預約成功！",
    `姓名：${name}<br>日期：${date}<br>時段：${timeText}<br>醫師：${doctor}`
  );

  // 清空部份欄位（姓名/電話/證件保留也可以，看你習慣）
  // document.getElementById("name").value = "";
  // document.getElementById("phone").value = "";
  // document.getElementById("id_number").value = "";
  // document.getElementById("birthday").value = "";
  // document.getElementById("date").value = "";
  // sectionSelect.innerHTML = `<option value="">請先選擇日期</option>`;
  // doctorSelect.innerHTML = `<option value="">請先選擇時段</option>`;
  // doctorSelect.disabled = true;
};

// ========================================================
// Popup 控制
// ========================================================
function showPopup(title, html) {
  document.getElementById("popupTitle").textContent = title;
  document.getElementById("popupContent").innerHTML = html;
  document.getElementById("popupBg").style.display = "flex";
}

window.closePopup = function () {
  document.getElementById("popupBg").style.display = "none";
};