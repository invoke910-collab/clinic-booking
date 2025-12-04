const API_URL = "https://clinic-booking-yb4u.onrender.com";

// =====================
//  固定班表（週一～週五）
// =====================
const weekdaySchedule = {
  1: { // 週一
    morning: ["吳立偉院長", "郭芷毓醫師"],
    afternoon: ["林峻豪副院長"],
    night: ["林峻豪副院長"]
  },
  2: { // 週二
    morning: ["林峻豪副院長"],
    afternoon: ["郭芷毓醫師"],
    night: ["吳立偉院長", "郭芷毓醫師"]
  },
  3: { // 週三
    morning: ["吳立偉院長", "郭芷毓醫師"],
    afternoon: ["黃俞華副院長"],
    night: ["黃俞華副院長"]
  },
  4: { // 週四
    morning: ["吳立偉院長"],
    afternoon: ["林峻豪副院長"],
    night: ["吳立偉院長"]
  },
  5: { // 週五
    morning: ["林峻豪副院長", "郭芷毓醫師"],
    afternoon: ["郭芷毓醫師"],
    night: ["林峻豪副院長"]
  }
};

// =====================
//  週六輪值：依日期決定醫師
//  2025/12/06、12/20 → 劉俊良
//  2025/12/13、12/27 → 林峻豪
// =====================
const saturdayMap = {
  "2025-12-06": "劉俊良醫師",
  "2025-12-20": "劉俊良醫師",
  "2025-12-13": "林峻豪副院長",
  "2025-12-27": "林峻豪副院長"
};

// 預約日期 input：設定「不得選今天以前」
(function setMinDate() {
  const dateInput = document.getElementById("date");
  const today = new Date();
  today.setDate(today.getDate() + 1); // 明天開始可預約

  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  dateInput.min = `${yyyy}-${mm}-${dd}`;
})();

// 綁定事件
document.getElementById("date").addEventListener("change", loadDoctors);
document.getElementById("time").addEventListener("change", loadDoctors);
document.getElementById("doctor").addEventListener("change", updateSummary);

// 依日期 + 時段載入可選醫師
function loadDoctors() {
  const date = document.getElementById("date").value;
  const time = document.getElementById("time").value;
  const doctorSelect = document.getElementById("doctor");
  const err = document.getElementById("err");

  doctorSelect.innerHTML = `<option value="">請先選擇時段</option>`;
  document.getElementById("summary").innerHTML = "";
  err.textContent = "";

  if (!date || !time) return;

  const d = new Date(date);
  const jsDay = d.getDay(); // 0~6, 0=Sunday

  let doctors = [];

  if (jsDay === 6) { // 週六
    const key = date; // yyyy-mm-dd
    const doc = saturdayMap[key];

    if (doc && (time === "morning" || time === "afternoon")) {
      doctors = [doc];
    } else {
      doctors = []; // 其它情況目前視為無門診
    }

  } else if (jsDay >= 1 && jsDay <= 5) {
    doctors = (weekdaySchedule[jsDay] && weekdaySchedule[jsDay][time]) || [];
  } else {
    // 週日不看診
    doctors = [];
  }

  if (!doctors || doctors.length === 0) {
    doctorSelect.innerHTML = `<option value="">本時段暫無門診</option>`;
    err.textContent = "本日期 / 時段無門診，請改選其他時間。";
    return;
  }

  doctorSelect.innerHTML = `<option value="">請選擇醫師</option>`;
  doctors.forEach(dname => {
    const opt = document.createElement("option");
    opt.value = dname;
    opt.textContent = dname;
    doctorSelect.appendChild(opt);
  });

  updateSummary();
}

// 顯示本日門診醫師
function updateSummary() {
  const doctor = document.getElementById("doctor").value;
  const summary = document.getElementById("summary");
  if (!doctor) {
    summary.innerHTML = "";
    return;
  }
  summary.innerHTML = `本日門診醫師：<b>${doctor}</b>`;
}

// 送出預約
async function submitBooking() {
  const name = document.getElementById("name").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const id_number = document.getElementById("id_number").value.trim();
  const birthday = document.getElementById("birthday").value;
  const date = document.getElementById("date").value;
  const time = document.getElementById("time").value;
  const doctor = document.getElementById("doctor").value;
  const err = document.getElementById("err");

  err.textContent = "";

  if (!name || !phone || !id_number || !birthday || !date || !time || !doctor) {
    err.textContent = "所有欄位都是必填（姓名、電話、證件、生日、日期、時段、醫師）。";
    return;
  }

  try {
    const res = await fetch(`${API_URL}/booking`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, id_number, birthday, date, time, doctor })
    });

    const data = await res.json();

    if (data.error) {
      err.textContent = data.error;
      return;
    }

    if (data.message && data.message.indexOf("不可重複") !== -1) {
      alert(data.message);
      return;
    }

    // 成功提示（簡單版）
    alert(
      `預約成功！\n\n` +
      `姓名：${name}\n` +
      `日期：${date}\n` +
      `時段：${time}\n` +
      `醫師：${doctor}`
    );

    // 清空表單
    document.getElementById("name").value = "";
    document.getElementById("phone").value = "";
    document.getElementById("id_number").value = "";
    document.getElementById("birthday").value = "";
    document.getElementById("date").value = "";
    document.getElementById("time").value = "";
    document.getElementById("doctor").innerHTML = `<option value="">請先選擇時段</option>`;
    document.getElementById("summary").innerHTML = "";
  } catch (e) {
    err.textContent = "送出失敗，請稍後再試。";
    console.error(e);
  }
}
