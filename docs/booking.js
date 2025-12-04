// ===============================
//  booking.js（最終修正版）
//  修正：週六午診無法顯示的 BUG
//       修正：週日休診
//       修正：日期不能選今天以前
//       修正：醫師選單同步顯示
// ===============================

// 週一～週六班表
const weeklySchedule = {
    1: { // Monday
        morning: ["吳立偉院長", "郭芷毓醫師"],
        afternoon: ["林峻豪副院長"],
        night: ["林峻豪副院長"]
    },
    2: { // Tuesday
        morning: ["林峻豪副院長"],
        afternoon: ["郭芷毓醫師"],
        night: ["郭芷毓醫師"]
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
    },
    6: { // Saturday（固定早/午診）
        morning: ["劉俊良醫師", "林峻豪副院長"], // 只有早診 & 午診（不同日期不同醫師）
        afternoon: ["劉俊良醫師", "林峻豪副院長"],
        night: []   // 無晚診
    }
};

// 週六醫師輪值
const saturdayMapping = {
    "12/06": "劉俊良醫師",
    "12/13": "林峻豪副院長",
    "12/20": "劉俊良醫師",
    "12/27": "林峻豪副院長"
};


// ===============================
// 限制：日期不可選今天以前（含今日）
// ===============================
const dateInput = document.getElementById("date");
const today = new Date();
today.setDate(today.getDate() + 1);  // 明天起可預約
dateInput.min = today.toISOString().split("T")[0];


// ===============================
// 處理時段選單
// ===============================
const sectionSelect = document.getElementById("section");
const doctorSelect = document.getElementById("doctor");

dateInput.addEventListener("change", () => {
    const selectedDate = new Date(dateInput.value);
    let weekday = selectedDate.getDay(); // 0=Sun,1=Mon...6=Sat

    sectionSelect.innerHTML = '<option value="">請選擇時段</option>';
    doctorSelect.innerHTML = '<option value="">請先選擇時段</option>';

    // 週日休診
    if (weekday === 0) {
        sectionSelect.innerHTML = '<option value="">本日休診</option>';
        return;
    }

    // 週六 → 兩個診別：早 & 午
    if (weekday === 6) {
        sectionSelect.innerHTML += `
            <option value="morning">早診（08:00–12:00）</option>
            <option value="afternoon">午診（14:30–18:00）</option>
        `;
        return;
    }

    // 平日（Mon–Fri）
    sectionSelect.innerHTML += `
        <option value="morning">早診（08:00–12:00）</option>
        <option value="afternoon">午診（14:30–18:00）</option>
        <option value="night">晚診（18:00–20:00）</option>
    `;
});


// ===============================
// 依時段帶出醫師
// ===============================
sectionSelect.addEventListener("change", () => {
    const selectedDate = new Date(dateInput.value);
    let weekday = selectedDate.getDay();
    const section = sectionSelect.value;

    doctorSelect.innerHTML = '<option value="">請選擇醫師</option>';

    if (!section) return;

    let dateStr = dateInput.value.replace(/-/g, "/").slice(5); // 例如 12/06

    // 週六固定醫師（依日期）
    if (weekday === 6) {
        let dr = saturdayMapping[dateStr];
        if (section === "morning" || section === "afternoon") {
            doctorSelect.innerHTML += `<option value="${dr}">${dr}</option>`;
        }
        return;
    }

    // 平日從 weeklySchedule 自動帶出
    let doctors = weeklySchedule[weekday][section];
    doctors.forEach(dr => {
        doctorSelect.innerHTML += `<option value="${dr}">${dr}</option>`;
    });
});
