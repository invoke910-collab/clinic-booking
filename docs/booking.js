// =======================================
// 順立骨科 booking.js（最終正式版）
// =======================================

// 今日不可預約（從明天開始）
const dateInput = document.getElementById("date");
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
dateInput.min = tomorrow.toISOString().split("T")[0];

// 取 DOM
const sectionSelect = document.getElementById("section");
const doctorSelect = document.getElementById("doctor");

// ================================
// 時段中文
// ================================
const timeLabel = {
  morning: "早診（08:00–12:00）",
  afternoon: "午診（14:30–18:00）",
  night: "晚診（18:00–20:00）"
};

// ================================
// 平日班表（你確認 A 版）
// ================================
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

// ================================
// 週六輪值（你指定的輪值）
// ================================
const saturdayDoctor = {
  "2025-12-06": "劉俊良醫師",
  "2025-12-13": "林峻豪副院長",
  "2025-12-20": "劉俊良醫師",
  "2025-12-27": "林峻豪副院長"
};

// ================================
// 日期改變 → 更新時段
// ================================
dateInput.addEventListener("change", () => {
  const date = dateInput.value;
  const d = new Date(date);
  const weekday = d.getDay();

  sectionSelect.innerHTML = `<option value="">請選擇時段</option>`;
  doctorSelect.innerHTML = `<option value="">請先選擇時段</option>`;
  doctorSelect.disabled = true;

  // 週日休診
  if (weekday === 0) {
    sectionSelect.innerHTML = `<option value="">休診</option>`;
    return;
  }

  // 週六 → 早診 + 午診
  if (weekday === 6) {
    sectionSelect.innerHTML += `
      <option value="morning">早診（08:00–12:00）</option>
      <option value="afternoon">午診（14:30–18:00）</option>
    `;
    return;
  }

  // 平日 → 早、午、晚
  sectionSelect.innerHTML += `
    <option value="morning">早診（08:00–12:00）</option>
    <option value="afternoon">午診（14:30–18:00）</option>
    <option value="night">晚診（18:00–20:00）</option>
  `;
});

// ================================
// 選時段 → 更新醫師
// ================================
sectionSelect.addEventListener("change", () => {
  const date = dateInput.value;
  const d = new Date(date);
  const weekday = d.getDay();
  const sec = sectionSelect.value;

  doctorSelect.innerHTML = `<option value="">請選擇醫師</option>`;
  doctorSelect.disabled = false;

  // 週日休診
  if (weekday === 0) {
    doctorSelect.innerHTML = `<option value="">休診</option>`;
    return;
  }

  // 週六
  if (weekday === 6) {
    const dr = saturdayDoctor[date];
    if (dr) {
      doctorSelect.innerHTML += `<option value="${dr}">${dr}</option>`;
    }
    return;
  }

  // 平日
  if (weekdaySchedule[weekday] && weekdaySchedule[weekday][sec]) {
    weekdaySchedule[weekday][sec].forEach(doc => {
      doctorSelect.innerHTML += `<option value="${doc}">${doc}</option>`;
    });
  }
});

// ================================
// 送出預約
// ================================
function submitBooking() {
  let data = {
    name: document.getElementById("name").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    id_number: document.getElementById("id_number").value.trim(),
    birthday: document.getElementById("birthday").value,
    date: document.getElementById("date").value,
    time: document.getElementById("section").value,
    doctor: document.getElementById("doctor").value
  };

  if (!data.name || !data.phone || !data.id_number || !data.birthday ||
      !data.date || !data.time || !data.doctor) {
    alert("請完整填寫所有欄位！");
    return;
  }

  fetch("https://clinic-booking-yb4u.onrender.com/booking", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
    .then(res => res.json())
    .then(result => {
      if (result.error) {
        alert(result.error);
        return;
      }
      showPopup(data);
    });
}

// ================================
// Popup 顯示
// ================================
function showPopup(data) {
  document.getElementById("popupContent").innerHTML = `
      姓名：${data.name}<br>
      日期：${data.date}<br>
      時段：${timeLabel[data.time]}<br>
      醫師：${data.doctor}
  `;
  document.getElementById("popupBg").style.display = "flex";
}

function closePopup() {
  document.getElementById("popupBg").style.display = "none";
  location.reload();
}