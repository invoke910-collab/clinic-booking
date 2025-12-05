// =======================================
//   booking.js - 最終完整版（小幫手版）
// =======================================

// 後端 API（Render）
// ⚠ 如果你之後換 domain，只要改這行即可：
const API_URL = "https://clinic-booking-yb4u.onrender.com";

// ===============================
// 今日以前不可選
// ===============================
const dateInput = document.getElementById("date");
const today = new Date();
today.setDate(today.getDate() + 1); // 今日不可預約 → 從明天開始
dateInput.min = today.toISOString().split("T")[0];

// ===============================
// 時段設定（含週六）
// ===============================
const sectionSelect = document.getElementById("section");
const doctorSelect  = document.getElementById("doctor");

// 全時段（平日）
const weekdaySections = [
    { id: "morning", name: "早診（08:00–12:00）" },
    { id: "afternoon", name: "午診（14:30–18:00）" },
    { id: "night", name: "晚診（18:00–20:00）" }
];

// 週六只有兩個時段
const saturdaySections = [
    { id: "sat_morning", name: "早診（08:00–12:00）" },
    { id: "sat_afternoon", name: "午診（14:30–17:00）" }
];

// ===============================
// 預約日期 → 載入時段
// ===============================
dateInput.addEventListener("change", () => {
    const date = new Date(dateInput.value);
    const day = date.getDay(); // 0=日, 6=六

    sectionSelect.innerHTML = `<option value="">請選擇時段</option>`;
    doctorSelect.innerHTML = `<option value="">請先選擇時段</option>`;

    if (!dateInput.value) return;

    let list = [];

    if (day === 6) {
        // 星期六
        list = saturdaySections;
    } 
    else if (day === 0) {
        // 星期日休診
        sectionSelect.innerHTML = `<option value="">星期日休診</option>`;
        return;
    }
    else {
        // 平日
        list = weekdaySections;
    }

    list.forEach(s => {
        const opt = document.createElement("option");
        opt.value = s.id;
        opt.textContent = s.name;
        sectionSelect.appendChild(opt);
    });
});

// ===============================
// 醫師班表設定（最新最終版）
// ===============================
function getDoctors(dateValue, section) {
    const date = new Date(dateValue);
    const day = date.getDay();

    // =============================
    // 週六醫師（固定四週循環）
    // =============================
    if (day === 6) {

        const saturdays = [
            { date: "2025-12-06", doctor: "劉俊良 醫師" },
            { date: "2025-12-13", doctor: "林峻豪 副院長" },
            { date: "2025-12-20", doctor: "劉俊良 醫師" },
            { date: "2025-12-27", doctor: "林峻豪 副院長" }
        ];

        const found = saturdays.find(s => s.date === dateValue);
        if (found) return [found.doctor];

        // 萬一日期超出，可自動四週循環
        const base = new Date("2025-12-06");
        const diff = Math.floor((date - base) / (7 * 24 * 60 * 60 * 1000));
        const cycleIndex = ((diff % 4) + 4) % 4;
        return [saturdays[cycleIndex].doctor];
    }

    // =============================
    // 平日醫師班表（最新正確版）
    // =============================
    const weekdayDoctors = {

        // -------- 星期一 --------
        1: {
            morning:   ["吳立偉 院長", "郭芷毓 醫師"],
            afternoon: ["林峻豪 副院長"],
            night:     ["林峻豪 副院長"]
        },

        // -------- 星期二 --------
        2: {
            morning:   ["林峻豪 副院長"],
            afternoon: ["郭芷毓 醫師"],
            night:     ["吳立偉 院長", "郭芷毓 醫師"]
        },

        // -------- 星期三 --------
        3: {
            morning:   ["吳立偉 院長", "郭芷毓 醫師"],
            afternoon: ["黃俞華 副院長"],
            night:     ["黃俞華 副院長"]
        },

        // -------- 星期四 --------
        4: {
            morning:   ["吳立偉 院長"],
            afternoon: ["林峻豪 副院長"],
            night:     ["林峻豪 副院長"]
        },

        // -------- 星期五 --------
        5: {
            morning:   ["林峻豪 副院長"],
            afternoon: ["郭芷毓 醫師"],
            night:     ["郭芷毓 醫師"]
        }
    };

    return weekdayDoctors[day]?.[section] || [];
}

// ===============================
// 時段 → 載入醫師
// ===============================
sectionSelect.addEventListener("change", () => {
    const dateValue = dateInput.value;
    const section = sectionSelect.value;

    doctorSelect.innerHTML = `<option value="">請選擇醫師</option>`;

    if (!dateValue || !section) return;

    const list = getDoctors(dateValue, section);

    list.forEach(d => {
        const opt = document.createElement("option");
        opt.value = d;
        opt.textContent = d;
        doctorSelect.appendChild(opt);
    });
});

// ===============================
// 送出預約
// ===============================
function submitBooking() {
    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const id_number = document.getElementById("id_number").value.trim();
    const birthday = document.getElementById("birthday").value;
    const date = document.getElementById("date").value;
    const section = document.getElementById("section").value;
    const doctor = document.getElementById("doctor").value;

    if (!name || !phone || !id_number || !birthday || !date || !section || !doctor) {
        alert("請完整填寫所有欄位！");
        return;
    }

    const sectionText = document.querySelector(`#section option[value="${section}"]`).textContent;

    // POST to API
    fetch(`${API_URL}/booking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name, phone, id_number, birthday, date,
            time: sectionText,
            doctor
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
            return;
        }
        showPopup(name, date, sectionText, doctor);
    });
}

// ===============================
// Popup 顯示
// ===============================
function showPopup(name, date, time, doctor) {
    document.getElementById("popupContent").innerHTML = `
        姓名：${name}<br>
        日期：${date}<br>
        時段：${time}<br>
        醫師：${doctor}
    `;
    document.getElementById("popupBg").style.display = "flex";
}

function closePopup() {
    document.getElementById("popupBg").style.display = "none";
}
