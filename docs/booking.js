// ================================
//  booking.js（iOS風格 B 完整版）
// ================================

const API = "https://clinic-booking-yb4u.onrender.com/booking";

// 正確週六輪值表（照你提供的）
const saturdayDoctors = {
    "2025-12-06": "劉俊良醫師",
    "2025-12-13": "林峻豪副院長",
    "2025-12-20": "劉俊良醫師",
    "2025-12-27": "林峻豪副院長"
};

// 預設不選今天以前的日期
window.onload = () => {
    const today = new Date();
    today.setDate(today.getDate() + 1); // 當天不可預約 → +1

    let yyyy = today.getFullYear();
    let mm = String(today.getMonth() + 1).padStart(2, '0');
    let dd = String(today.getDate()).padStart(2, '0');

    document.getElementById("date").setAttribute("min", `${yyyy}-${mm}-${dd}`);
};

// 當選擇日期、時段 → 更新醫師欄位
document.getElementById("date").addEventListener("change", updateDoctor);
document.getElementById("time").addEventListener("change", updateDoctor);

function updateDoctor() {
    const date = document.getElementById("date").value;
    const time = document.getElementById("time").value;
    const doctorSel = document.getElementById("doctor");
    const todayBox = document.getElementById("todayDoctor");

    doctorSel.innerHTML = `<option value="">請先選擇時段</option>`;
    todayBox.innerHTML = "";

    if (!date || !time) return;

    const day = new Date(date).getDay();

    let doctor = "";

    if (day === 6) {  
        doctor = saturdayDoctors[date] || "輪值資訊未設定";
    } else if (day === 1) { // 一
        if (time === "morning") doctor = "吳立偉院長 ＆ 郭芷毓醫師";
        if (time === "afternoon") doctor = "林峻豪副院長";
        if (time === "night") doctor = "林峻豪副院長";
    } else if (day === 2) { // 二
        if (time === "morning") doctor = "林峻豪副院長";
        if (time === "afternoon") doctor = "郭芷毓醫師";
        if (time === "night") doctor = "吳立偉院長 ＆ 郭芷毓醫師";
    } else if (day === 3) { // 三
        if (time === "morning") doctor = "吳立偉院長 ＆ 郭芷毓醫師";
        if (time === "afternoon") doctor = "黃俞華副院長";
        if (time === "night") doctor = "黃俞華副院長";
    } else if (day === 4) { // 四
        if (time === "morning") doctor = "吳立偉院長";
        if (time === "afternoon") doctor = "林峻豪副院長";
        if (time === "night") doctor = "林峻豪副院長";
    } else if (day === 5) { // 五
        if (time === "morning") doctor = "林峻豪副院長";
        if (time === "afternoon") doctor = "郭芷毓醫師";
        if (time === "night") doctor = "郭芷毓醫師";
    }

    if (doctor) {
        doctorSel.innerHTML = `<option value="${doctor}">${doctor}</option>`;
        todayBox.innerHTML = `本日門診醫師：${doctor}`;
    }
}


// =========================
// 送出預約
// =========================
async function submitBooking() {
    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const id_number = document.getElementById("id_number").value.trim();
    const birthday = document.getElementById("birthday").value;
    const date = document.getElementById("date").value;
    const time = document.getElementById("time").value;
    const doctor = document.getElementById("doctor").value;

    if (!name || !phone || !id_number || !birthday || !date || !time || !doctor) {
        document.getElementById("err").innerText = "所有欄位皆為必填";
        return;
    }

    const payload = { name, phone, id_number, birthday, date, time, doctor };

    const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    const result = await res.json();

    if (result.error) {
        document.getElementById("err").innerText = result.error;
        return;
    }

    popupShow(name, date, time, doctor);
}


// =========================
// popup
// =========================
function popupShow(name, date, time, doctor) {
    const t = 
        time === "morning" ? "早診（08:00–12:00）" :
        time === "afternoon" ? "午診（14:30–18:00）" :
        "晚診（18:30–20:00）";

    document.getElementById("popupContent").innerHTML = `
        姓名：${name}<br>
        日期：${date}<br>
        時段：${t}<br>
        醫師：${doctor}
    `;

    document.getElementById("popupBox").style.display = "flex";
}

function closePopup() {
    document.getElementById("popupBox").style.display = "none";
    location.reload();
}
