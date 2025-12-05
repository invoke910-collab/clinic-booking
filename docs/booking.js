// ===============================
//   讀取排班 JSON
// ===============================
let scheduleData = null;

async function loadSchedule() {
    try {
        const res = await fetch("schedule.json");
        scheduleData = await res.json();
    } catch (e) {
        alert("排班資料讀取失敗！");
    }
}
loadSchedule();


// ===============================
//   日期選擇：禁用今日以前
// ===============================
const dateInput = document.getElementById("date");
const today = new Date().toISOString().split("T")[0];
dateInput.min = today;


// ===============================
//   日期變動 → 產生時段選項
// ===============================
dateInput.addEventListener("change", () => {
    const sectionSel = document.getElementById("section");
    const doctorSel = document.getElementById("doctor");
    sectionSel.innerHTML = `<option value="">請選擇時段</option>`;
    doctorSel.innerHTML = `<option value="">請先選擇時段</option>`;

    if (!scheduleData) return;

    const selected = new Date(dateInput.value);
    const weekday = selected.getDay(); // 星期 (0=日,1=一,...,6=六)

    // 星期日休診
    if (weekday === 0 && scheduleData.sunday?.closed) {
        sectionSel.innerHTML = `<option value="">週日休診</option>`;
        return;
    }

    // 平日處理
    if (weekday >= 1 && weekday <= 5) {
        const dayData = scheduleData.weekday[weekday];

        if (!dayData) return;

        Object.keys(dayData).forEach(section => {
            sectionSel.innerHTML += `<option value="${section}">${convertSection(section)}</option>`;
        });

        return;
    }

    // 週六處理（輪值）
    if (weekday === 6) {
        const cycle = scheduleData.saturday.cycle;
        const sections = scheduleData.saturday.sections;

        // 加入早診、午診
        Object.keys(sections).forEach(sec => {
            sectionSel.innerHTML += `<option value="${sec}">${sections[sec][0]}</option>`;
        });

        return;
    }
});


// ===============================
//   時段變動 → 顯示醫師名單
// ===============================
document.getElementById("section").addEventListener("change", () => {
    const doctorSel = document.getElementById("doctor");
    doctorSel.innerHTML = `<option value="">請選擇醫師</option>`;

    if (!scheduleData) return;

    const dateValue = dateInput.value;
    const selected = new Date(dateValue);
    const weekday = selected.getDay();
    const section = document.getElementById("section").value;

    // 平日
    if (weekday >= 1 && weekday <= 5) {
        const doctors = scheduleData.weekday[weekday][section];
        if (!doctors) return;

        doctors.forEach(d => {
            doctorSel.innerHTML += `<option value="${d}">${d}</option>`;
        });

        return;
    }

    // 週六：根據 cycle 找對應醫師
    if (weekday === 6) {
        const cycleList = scheduleData.saturday.cycle;
        const found = cycleList.find(c => c.date === dateValue);

        if (!found) return;

        doctorSel.innerHTML += `<option value="${found.doctor}">${found.doctor}</option>`;
    }
});


// ===============================
//   時段英文 → 中文顯示
// ===============================
function convertSection(s) {
    switch (s) {
        case "morning": return "早診（08:00–12:00）";
        case "afternoon": return "午診（14:30–18:00）";
        case "night": return "晚診（18:00–20:00）";
    }
    return s;
}


// ===============================
//   送出預約
// ===============================
async function submitBooking() {
    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const id_number = document.getElementById("id_number").value.trim();
    const birthday = document.getElementById("birthday").value;
    const date = document.getElementById("date").value;
    const time = document.getElementById("section").value;
    const doctor = document.getElementById("doctor").value;

    if (!name || !phone || !id_number || !birthday || !date || !time || !doctor) {
        alert("請完整填寫所有欄位");
        return;
    }

    const res = await fetch("https://clinic-booking-yb4u.onrender.com/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, id_number, birthday, date, time, doctor })
    });

    const data = await res.json();

    // 🔒 重複預約擋住
    if (data.status === "duplicate") {
        alert("⚠ 此日期與時段已預約過同一位醫師，請勿重複預約！");
        return;
    }

    // 成功彈窗
    showPopup(name, date, time, doctor);

    // 清空表單
    document.getElementById("name").value = "";
    document.getElementById("phone").value = "";
    document.getElementById("id_number").value = "";
    document.getElementById("birthday").value = "";
    document.getElementById("date").value = "";
    document.getElementById("section").innerHTML = `<option value="">請先選擇日期</option>`;
    document.getElementById("doctor").innerHTML = `<option value="">請先選擇時段</option>`;
}


// ===============================
//   Popup 顯示
// ===============================
function showPopup(name, date, time, doctor) {
    const popupBg = document.getElementById("popupBg");
    const popupContent = document.getElementById("popupContent");

    popupContent.innerHTML =
        `姓名：${name}<br>日期：${date}<br>時段：${convertSection(time)}<br>醫師：${doctor}`;

    popupBg.style.display = "flex";
}

function closePopup() {
    document.getElementById("popupBg").style.display = "none";
}
