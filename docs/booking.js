// =====================================
//  booking.js（最新版）
//  修正：
//  - 週六 = 早診 + 午診（無晚診）
//  - 12/25 無晚診
//  - 週日休診
//  - 過去＆當天禁止預約
//  - 醫師排班正確
// =====================================

// 後端 API
const API_URL = "https://clinic-booking-yb4u.onrender.com/booking";

// HTML 元件
const dateInput = document.getElementById("date");
const sectionSelect = document.getElementById("section");
const doctorSelect = document.getElementById("doctor");
const summaryBox = document.getElementById("summary");
const errBox = document.getElementById("error-msg");

// 時段中文
const timeLabelMap = {
  morning: "早診（08:00–12:00）",
  afternoon: "午診（14:30–17:00）",  // ★ 修正週六正確時間
  night: "晚診（18:30–20:00）"
};

// ================================
// 日期格式 YYYY-MM-DD
// ================================
function formatDate(d) {
  return d.toISOString().split("T")[0];
}

// 今日禁止預約 → 設定 min
const today = new Date();
const tomorrow = new Date(today.getTime() + 86400000);
dateInput.min = formatDate(tomorrow);

// ================================
// 醫師排班（依你最後確認的）
const schedule = {
  1: { // Monday
    morning: ["吳立偉", "郭芷毓"],
    afternoon: ["林峻豪"],
    night: ["林峻豪"]
  },
  2: { // Tuesday
    morning: ["林峻豪"],
    afternoon: ["郭芷毓"],
    night: ["吳立偉", "郭芷毓"]
  },
  3: { // Wednesday
    morning: ["吳立偉", "郭芷毓"],
    afternoon: ["黃俞華"],
    night: ["黃俞華"]
  },
  4: { // Thursday
    morning: ["吳立偉"],
    afternoon: ["林峻豪"],
    night: ["林峻豪"]
  },
  5: { // Friday
    morning: ["林峻豪"],
    afternoon: ["郭芷毓"],
    night: ["郭芷毓"]
  },
  6: { // Saturday（輪值）
    morning: {
      "2025-12-06": ["劉俊良"],
      "2025-12-13": ["林峻豪"],
      "2025-12-20": ["劉俊良"],
      "2025-12-27": ["林峻豪"]
    },
    afternoon: {
      "2025-12-06": ["劉俊良"],
      "2025-12-13": ["林峻豪"],
      "2025-12-20": ["劉俊良"],
      "2025-12-27": ["林峻豪"]
    }
  }
};

// ================================
// 更新「時段」
function updateSectionOptions() {
  const dateStr = dateInput.value;
  sectionSelect.innerHTML = '<option value="">請選擇時段</option>';
  doctorSelect.innerHTML = '<option value="">請先選擇時段</option>';
  doctorSelect.disabled = true;
  summaryBox.textContent = "本日門診醫師：尚未選擇時段";
  errBox.textContent = "";

  if (!dateStr) return;

  const d = new Date(dateStr + "T00:00:00");
  const weekday = d.getDay(); // 0 = Sunday

  // ⭐ 週日休診
  if (weekday === 0) {
    showPopup("提醒", ["週日休診，無法預約。"]);
    dateInput.value = "";
    return;
  }

  // ⭐ 過去日期與當天不可預約
  const todayStr = formatDate(new Date());
  if (dateStr <= todayStr) {
    showPopup("提醒", ["當日與過去日期不可預約。"]);
    dateInput.value = "";
    return;
  }

  // ⭐ 預設：早、午、晚
  let timeKeys = ["morning", "afternoon", "night"];

  // ⭐ 週六 → 只有早＋午（🔥 你要的修正版）
  if (weekday === 6) {
    timeKeys = ["morning", "afternoon"];
  }

  // ⭐ 12/25（特例）無晚診
  if (dateStr === "2025-12-25") {
    timeKeys = ["morning", "afternoon"];
  }

  // ⭐ 產生時段下拉
  timeKeys.forEach((tk) => {
    const opt = document.createElement("option");
    opt.value = tk;
    opt.textContent = timeLabelMap[tk];
    sectionSelect.appendChild(opt);
  });
}


// ================================
// 更新「醫師」
function updateDoctorOptions() {
  const dateStr = dateInput.value;
  const timeKey = sectionSelect.value;

  doctorSelect.innerHTML = '<option value="">請選擇醫師</option>';
  doctorSelect.disabled = true;

  if (!dateStr || !timeKey) return;

  const d = new Date(dateStr + "T00:00:00");
  const weekday = d.getDay();

  let doctors = [];

  if (weekday === 6) {
    // 週六輪值
    if (schedule[6][timeKey][dateStr]) {
      doctors = schedule[6][timeKey][dateStr];
    }
  } else {
    doctors = schedule[weekday][timeKey] || [];
  }

  // 更新選單
  doctors.forEach((doc) => {
    const opt = document.createElement("option");
    opt.value = doc;
    opt.textContent = doc;
    doctorSelect.appendChild(opt);
  });

  doctorSelect.disabled = false;

  summaryBox.textContent = "本日門診醫師：" + doctors.join("、");
}

// ================================
// 送出預約
async function submitBooking(e) {
  e.preventDefault();
  errBox.textContent = "";

  const name = document.getElementById("name").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const id_number = document.getElementById("id_number").value.trim();
  const birthday = document.getElementById("birthday").value;
  const date = dateInput.value;
  const time = sectionSelect.value;
  const doctor = doctorSelect.value;

  if (!name || !phone || !id_number || !birthday || !date || !time || !doctor) {
    errBox.textContent = "請完整填寫所有欄位。";
    return;
  }

  const payload = { name, phone, id_number, birthday, date, time, doctor };

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (data.conflict) {
      showPopup("重複預約", [
        `${name} 您已預約過 ${date} 的 ${timeLabelMap[time]}`,
      ]);
      return;
    }

    showPopup("預約成功！", [
      `${name} 您的預約已完成！`,
      `日期：${date}`,
      `時段：${timeLabelMap[time]}`,
      `醫師：${doctor}`,
      `預約編號：${data.booking_id}`
    ]);

  } catch (err) {
    errBox.textContent = "系統連線異常，請稍後再試。";
  }
}

// popup
function showPopup(title, lines = []) {
  document.getElementById("popupTitle").textContent = title;
  const box = document.getElementById("popupText");
  box.innerHTML = "";
  lines.forEach(t => {
    const p = document.createElement("p");
    p.style.textAlign = "left";
    p.textContent = t;
    box.appendChild(p);
  });

  document.getElementById("popup").style.display = "block";
}

function closePopup() {
  document.getElementById("popup").style.display = "none";
}


// 綁定事件
dateInput.addEventListener("change", updateSectionOptions);
sectionSelect.addEventListener("change", updateDoctorOptions);
document.getElementById("bookingForm").addEventListener("submit", submitBooking);
