// ========= 基本設定 ==========
const API_BASE = "https://clinic-booking-yb4u.onrender.com";

const nameInput = document.getElementById("name");
const phoneInput = document.getElementById("phone");
const idInput = document.getElementById("idNumber");
const birthdayInput = document.getElementById("birthday");
const dateInput = document.getElementById("date");
const sectionSelect = document.getElementById("section");
const doctorSelect = document.getElementById("doctor");
const summaryBox = document.getElementById("summary");
const errBox = document.getElementById("err");
const submitBtn = document.getElementById("submitBtn");

// Popup 元件
const popupOverlay = document.getElementById("popupOverlay");
const popupTitle = document.getElementById("popupTitle");
const popupBody = document.getElementById("popupBody");
const popupCloseBtn = document.getElementById("popupCloseBtn");

popupCloseBtn.addEventListener("click", () => {
  popupOverlay.classList.remove("show");
});

// 小工具：顯示彈跳視窗
function showPopup(title, lines) {
  popupTitle.textContent = title;
  if (!Array.isArray(lines)) lines = [lines];
  popupBody.innerHTML = lines.map((t) => `<p>${t}</p>`).join("");
  popupOverlay.classList.add("show");
}

// ========= 時段／班表設定 ==========

const timeLabelMap = {
  morning: "早診（08:00–12:00）",
  afternoon: "午診（14:30–18:00）",
  night: "晚診（18:30–20:00）",
};

// 日期轉字串 yyyy-mm-dd
function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// 週期班表：週一～週五
function getWeekdayDoctors(weekday, timeKey) {
  // weekday: 1~5 (Mon~Fri), timeKey: morning | afternoon | night
  switch (weekday) {
    case 1: // 週一
      if (timeKey === "morning") return ["吳立偉院長", "郭芷毓醫師"];
      if (timeKey === "afternoon") return ["林峻豪副院長"];
      if (timeKey === "night") return ["林峻豪副院長"];
      break;
    case 2: // 週二
      if (timeKey === "morning") return ["林峻豪副院長"];
      if (timeKey === "afternoon") return ["郭芷毓醫師"];
      if (timeKey === "night") return ["吳立偉院長", "郭芷毓醫師"];
      break;
    case 3: // 週三
      if (timeKey === "morning") return ["吳立偉院長", "郭芷毓醫師"];
      if (timeKey === "afternoon") return ["黃俞華副院長"];
      if (timeKey === "night") return ["黃俞華副院長"];
      break;
    case 4: // 週四
      if (timeKey === "morning") return ["吳立偉院長"];
      if (timeKey === "afternoon") return ["林峻豪副院長"];
      if (timeKey === "night") return ["林峻豪副院長"];
      break;
    case 5: // 週五
      if (timeKey === "morning") return ["林峻豪副院長"];
      if (timeKey === "afternoon") return ["郭芷毓醫師"];
      if (timeKey === "night") return ["郭芷毓醫師"];
      break;
  }
  return [];
}

// 週六固定班表（2025/12 特別指定）
function getSaturdayDoctor(dateStr) {
  switch (dateStr) {
    case "2025-12-06":
      return ["劉俊良醫師"];
    case "2025-12-13":
      return ["林峻豪副院長"];
    case "2025-12-20":
      return ["劉俊良醫師"];
    case "2025-12-27":
      return ["林峻豪副院長"];
    default:
      // 若未特別指定，就顯示輪值文字
      return ["輪值醫師（劉俊良醫師 / 林峻豪副院長）"];
  }
}

// 主函式：依「日期＋時段」回傳醫師陣列
function getDoctorsByDateTime(dateStr, timeKey) {
  if (!dateStr || !timeKey) return [];

  const d = new Date(dateStr + "T00:00:00");
  const weekday = d.getDay(); // 0:Sun ~ 6:Sat

  if (weekday === 0) {
    return []; // 週日休診
  }

  if (weekday >= 1 && weekday <= 5) {
    return getWeekdayDoctors(weekday, timeKey);
  }

  if (weekday === 6) {
    if (timeKey !== "morning") return []; // 週六只有早診
    return getSaturdayDoctor(dateStr);
  }

  return [];
}

// ========= 日期 & 時段控制 ==========

// 設定日期的最小值：明天
(function initMinDate() {
  const today = new Date();
  today.setDate(today.getDate() + 1);
  const minStr = formatDate(today);
  dateInput.min = minStr;
})();

// 依日期更新「時段選單」
function updateSectionOptions() {
  const dateStr = dateInput.value;
  sectionSelect.innerHTML = '<option value="">請選擇時段</option>';
  doctorSelect.innerHTML = '<option value="">請先選擇時段</option>';
  doctorSelect.disabled = true;
  summaryBox.textContent = "本日門診醫師：尚未選擇時段";
  errBox.textContent = "";

  if (!dateStr) return;

  const d = new Date(dateStr + "T00:00:00");
  const weekday = d.getDay();

  // 週日休診
  if (weekday === 0) {
    showPopup("提醒", ["週日休診，無法預約此日期。"]);
    dateInput.value = "";
    return;
  }

  // 當天以前不允許（安全雙重檢查）
  const now = new Date();
  const todayStr = formatDate(now);
  if (dateStr <= todayStr) {
    showPopup("提醒", ["當日及過去日期不可預約，請選擇未來日期。"]);
    dateInput.value = "";
    return;
  }

  // 根據星期決定有哪些時段
  let timeKeys = ["morning", "afternoon", "night"];

  if (weekday === 6) {
    // 週六只有早診
    timeKeys = ["morning"];
  }

  // 特殊例外：2025-12-25 無晚診
  if (dateStr === "2025-12-25") {
    timeKeys = ["morning", "afternoon"];
  }

  timeKeys.forEach((tk) => {
    const opt = document.createElement("option");
    opt.value = tk;
    opt.textContent = timeLabelMap[tk];
    sectionSelect.appendChild(opt);
  });
}

// 依日期＋時段更新「醫師選單」
function updateDoctorOptions() {
  const dateStr = dateInput.value;
  const timeKey = sectionSelect.value;

  doctorSelect.innerHTML = '<option value="">請選擇醫師</option>';
  doctorSelect.disabled = true;
  summaryBox.textContent = "本日門診醫師：尚未選擇時段";

  if (!dateStr || !timeKey) return;

  const docs = getDoctorsByDateTime(dateStr, timeKey);

  if (!docs.length) {
    if (new Date(dateStr + "T00:00:00").getDay() === 0) {
      showPopup("提醒", ["週日休診，無門診時段。"]);
    } else {
      showPopup("提醒", ["此日期的該時段無門診，請改選其它時段。"]);
    }
    return;
  }

  docs.forEach((name) => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    doctorSelect.appendChild(opt);
  });

  doctorSelect.disabled = false;
  summaryBox.textContent = "本日門診醫師：" + docs.join("、");
}

// ========= 身分證簡易驗證（台灣身分證） =========
function isTaiwanId(str) {
  str = str.trim().toUpperCase();
  if (!/^[A-Z][12]\d{8}$/.test(str)) return false;

  const letters = "ABCDEFGHJKLMNPQRSTUVXYWZIO";
  const code = letters.indexOf(str[0]) + 10;
  const n1 = Math.floor(code / 10);
  const n2 = code % 10;

  let sum = n1 + n2 * 9;
  for (let i = 1; i <= 8; i++) {
    sum += parseInt(str[i], 10) * (9 - i);
  }
  sum += parseInt(str[9], 10);
  return sum % 10 === 0;
}

// ========= 事件綁定 ==========

dateInput.addEventListener("change", updateSectionOptions);
sectionSelect.addEventListener("change", updateDoctorOptions);

// ========= 送出預約 =========

submitBtn.addEventListener("click", async () => {
  errBox.textContent = "";

  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();
  const idNumber = idInput.value.trim();
  const birthday = birthdayInput.value;
  const dateStr = dateInput.value;
  const timeKey = sectionSelect.value;
  const doctor = doctorSelect.value;

  if (!name || !phone || !idNumber || !birthday || !dateStr || !timeKey || !doctor) {
    errBox.textContent = "請完整填寫所有欄位。";
    showPopup("欄位未填寫完整", [
      "請確認以下欄位皆已填寫：",
      "・姓名",
      "・電話",
      "・身分證 / 護照號碼",
      "・生日",
      "・預約日期",
      "・預約時段",
      "・醫師",
    ]);
    return;
  }

  // 台灣身分證檢查（第一碼是英文字母且長度 10 就檢查）
  if (/^[A-Za-z]/.test(idNumber) && idNumber.length === 10) {
    if (!isTaiwanId(idNumber)) {
      errBox.textContent = "身分證字號格式有誤，請再確認。";
      showPopup("身分證格式錯誤", ["請確認台灣身分證字號是否輸入正確。"]);
      return;
    }
  }

  // double check 未來日期
  const todayStr = formatDate(new Date());
  if (dateStr <= todayStr) {
    errBox.textContent = "當日及過去日期不可預約。";
    showPopup("日期錯誤", ["當日及過去日期不可預約，請改選未來日期。"]);
    return;
  }

  const payload = {
    name,
    phone,
    id_number: idNumber,
    birthday,
    date: dateStr,
    time: timeLabelMap[timeKey],
    doctor,
  };

  try {
    const res = await fetch(`${API_BASE}/booking`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "預約失敗，請稍後再試。");
    }

    if (data && data.conflict) {
      showPopup("已有相同預約", [
        "您已預約過相同日期與時段，無法重複預約。",
        `姓名：${data.conflict.name}`,
        `日期：${data.conflict.date}`,
        `時段：${data.conflict.time}`,
        `醫師：${data.conflict.doctor}`,
      ]);
      return;
    }

    // ✅ 成功視窗
    showPopup("預約成功！", [
      `姓名：${name}`,
      `日期：${dateStr}`,
      `時段：${timeLabelMap[timeKey]}`,
      `醫師：${doctor}`,
    ]);

    // 清空表單
    nameInput.value = "";
    phoneInput.value = "";
    idInput.value = "";
    birthdayInput.value = "";
    dateInput.value = "";
    sectionSelect.innerHTML = '<option value="">請選擇時段</option>';
    doctorSelect.innerHTML = '<option value="">請先選擇時段</option>';
    doctorSelect.disabled = true;
    summaryBox.textContent = "本日門診醫師：尚未選擇日期與時段";
  } catch (err) {
    console.error(err);
    errBox.textContent = "預約失敗，請稍後再試。";
    showPopup("預約失敗", [
      "很抱歉，目前系統暫時無法完成預約。",
      "請稍後再試，或改以電話聯繫診所。",
    ]);
  }
});
