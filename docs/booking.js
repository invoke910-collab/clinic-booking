// ===========================================
//  booking.js — 最新完整版
// ===========================================

// 後端 API URL（Render）
const API_URL = "https://clinic-booking-yb4u.onrender.com";

// DOM 元素
const dateInput = document.getElementById("date");
const sectionSelect = document.getElementById("section");
const doctorSelect = document.getElementById("doctor");
const summary = document.getElementById("summary");
const err = document.getElementById("err");

// 今日不得預約（含今天）
const today = new Date();
today.setHours(0, 0, 0, 0);

// 設定 date 的 min = 明天（UI 直接限制）
(function setMinDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1); // 明天
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  dateInput.min = `${y}-${m}-${day}`;
})();

// 日期改變事件
dateInput.addEventListener("change", () => {
  if (!dateInput.value) return;

  const chosen = new Date(dateInput.value);
  chosen.setHours(0, 0, 0, 0);

  if (chosen <= today) {
    showPopup("⚠️ 不可預約今日或過去日期！");
    dateInput.value = "";
    return;
  }

  loadDoctorOptions();
});

// ===============================
// 週六固定醫師排班
// ===============================
function getSaturdayDoctor(dateStr) {
  const fixed = {
    "2025-12-06": "劉俊良醫師",
    "2025-12-13": "林峻豪副院長",
    "2025-12-20": "劉俊良醫師",
    "2025-12-27": "林峻豪副院長",
  };
  return fixed[dateStr] || null;
}

// ===============================
// 依日期＋時段載入醫師
// ===============================
async function loadDoctorOptions() {
  doctorSelect.innerHTML = `<option value="">請先選擇時段</option>`;
  summary.innerHTML = "";

  const dateStr = dateInput.value;
  if (!dateStr || !sectionSelect.value) return;

  const dateObj = new Date(dateStr);
  const weekday = dateObj.getDay(); // 0=日 1=一 ... 6=六
  const time = sectionSelect.value; // morning / afternoon / night

  // 週六：固定輪值
  if (weekday === 6) {
    const doc = getSaturdayDoctor(dateStr);
    if (doc) {
      doctorSelect.innerHTML = `<option value="${doc}">${doc}</option>`;
      summary.innerHTML = `本日門診醫師：${doc}`;
    } else {
      doctorSelect.innerHTML = `<option value="">本日無門診</option>`;
      summary.innerHTML = `本日無門診`;
    }
    return;
  }

  // 平日：讀取 schedule.json
  try {
    const res = await fetch("schedule.json");
    const data = await res.json();
    const scheduleForDay = data.schedule[weekday];
    if (!scheduleForDay) return;

    const list = scheduleForDay[time] || [];

    if (list.length === 0) {
      doctorSelect.innerHTML = `<option value="">本時段無門診</option>`;
      summary.innerHTML = "本時段無門診";
      return;
    }

    doctorSelect.innerHTML = list
      .map((d) => `<option value="${d}">${d}</option>`)
      .join("");

    summary.innerHTML = `本日門診醫師：${list.join("、")}`;
  } catch (e) {
    console.error("讀取 schedule.json 失敗", e);
    showPopup("載入醫師班表失敗，請稍後再試");
  }
}

// 時段更動 → 重新載入醫師
sectionSelect.addEventListener("change", loadDoctorOptions);

// ===============================
// 漂亮 Popup（共用）
// ===============================
function showPopup(message) {
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.left = "0";
  overlay.style.top = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.background = "rgba(0,0,0,0.55)";
  overlay.style.display = "flex";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";
  overlay.style.zIndex = "9999";

  overlay.innerHTML = `
    <div style="
      background:#ffffff;
      padding:22px 20px 18px;
      width:80%;
      max-width:380px;
      border-radius:18px;
      box-shadow:0 6px 18px rgba(0,0,0,0.25);
      text-align:center;
      font-size:16px;
      line-height:1.7;
      color:#333;
    ">
      ${message}
      <br /><br />
      <button id="popupOK" style="
        background:#007bff;
        color:#fff;
        border:none;
        padding:9px 22px;
        border-radius:999px;
        font-size:15px;
        cursor:pointer;
      ">確定</button>
    </div>
  `;

  document.body.appendChild(overlay);
  document.getElementById("popupOK").onclick = () => overlay.remove();
}

// ===============================
// 送出預約
// ===============================
async function submitBooking() {
  err.textContent = "";

  const name = document.getElementById("name").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const id_number = document.getElementById("id_number").value.trim();
  const birthday = document.getElementById("birthday").value;
  const date = dateInput.value;
  const time = sectionSelect.value;
  const doctor = doctorSelect.value;

  if (!name || !phone || !id_number || !birthday || !date || !time || !doctor) {
    showPopup("⚠️ 所有欄位皆為必填（姓名、電話、證件、生日、日期、時段、醫師）");
    return;
  }

  let timeText = "";
  if (time === "morning") timeText = "早診（08:00–12:00）";
  if (time === "afternoon") timeText = "午診（14:30–18:00）";
  if (time === "night") timeText = "晚診（18:30–20:00）";

  try {
    const res = await fetch(`${API_URL}/booking`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        phone,
        id_number,
        birthday,
        date,
        time,
        doctor,
      }),
    });

    const data = await res.json();

    if (data.error) {
      showPopup("⚠️ " + data.error);
      return;
    }

    if (data.message && data.message.includes("已預約過")) {
      showPopup("⚠️ 您已預約過此日期與時段，不可重複預約。");
      return;
    }

    showPopup(`
      <b>預約成功！</b><br /><br />
      姓名：${name}<br />
      日期：${date}<br />
      時段：${timeText}<br />
      醫師：${doctor}
    `);
  } catch (e) {
    console.error("Error:", e);
    showPopup("⚠️ 發生錯誤，請稍後再試");
  }
}
