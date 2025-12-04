// ===============================
//  booking.js（最終修正版）
//  修正：週六午診、醫師下拉不顯示
//       修正：週日休診
//       修正：日期不可選今天以前
// ===============================


// 平日固定班表
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
    }
};


// ===============================
//    🔥 週六醫師輪值（不比字串）
// ===============================
function getSaturdayDoctor(dayOfMonth) {

    // 每月 6 號 & 20 號 → 劉俊良
    if (dayOfMonth === 6 || dayOfMonth === 20) return "劉俊良醫師";

    // 每月 13 號 & 27 號 → 林峻豪
    if (dayOfMonth === 13 || dayOfMonth === 27) return "林峻豪副院長";

    // 其他日期如遇例外（保險回傳）
    return "劉俊良醫師";
}


// ===============================
//    日期不能選今天以前
// ===============================
const dateInput = document.getElementById("date");
const today = new Date();
today.setDate(today.getDate() + 1); // 今日不可選 → 明天起可選
dateInput.min = today.toISOString().split("T")[0];


const sectionSelect = document.getElementById("section");
const doctorSelect = document.getElementById("doctor");


// ===============================
//    選日期 → 顯示正確時段
// ===============================
dateInput.addEventListener("change", () => {

    const selectedDate = new Date(dateInput.value);
    const weekday = selectedDate.getDay(); // 0=Sun ... 6=Sat

    // 重置
    sectionSelect.innerHTML = '<option value="">請選擇時段</option>';
    doctorSelect.innerHTML = '<option value="">請先選擇時段</option>';

    // === 週日休診 ===
    if (weekday === 0) {
        sectionSelect.innerHTML = '<option value="">本日休診</option>';
        return;
    }

    // === 週六（只有早 + 午）===
    if (weekday === 6) {
        sectionSelect.innerHTML += `
            <option value="morning">早診（08:00–12:00）</option>
            <option value="afternoon">午診（14:30–18:00）</option>
        `;
        return;
    }

    // === 平日 ===
    sectionSelect.innerHTML += `
        <option value="morning">早診（08:00–12:00）</option>
        <option value="afternoon">午診（14:30–18:00）</option>
        <option value="night">晚診（18:00–20:00）</option>
    `;
});


// ===============================
//    選時段 → 顯示醫師
// ===============================
sectionSelect.addEventListener("change", () => {

    const selectedDate = new Date(dateInput.value);
    const weekday = selectedDate.getDay();
    const section = sectionSelect.value;

    doctorSelect.innerHTML = '<option value="">請選擇醫師</option>';

    if (!section) return;

    // ======= 週六（使用日期判斷輪值）========
    if (weekday === 6) {

        const day = selectedDate.getDate();    // 6 / 13 / 20 / 27…
        const dr = getSaturdayDoctor(day);

        if (section === "morning" || section === "afternoon") {
            doctorSelect.innerHTML += `<option value="${dr}">${dr}</option>`;
        }
        return;
    }


    // ======= 平日從班表載入 ========
    const doctors = weeklySchedule[weekday][section] || [];

    doctors.forEach(dr => {
        doctorSelect.innerHTML += `<option value="${dr}">${dr}</option>`;
    });

});
