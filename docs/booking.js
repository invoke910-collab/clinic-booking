// =====================================================
// Ultra 版 — StandFit 診所線上預約 booking.js
// =====================================================

// ---------------------------
// 1. 班表：依星期 + 時段 → 自動帶出醫師
// ---------------------------
const schedule = {
    1: { // 週一
        morning: ["吳立偉院長", "郭芷毓醫師"],   // 雙診
        afternoon: ["林峻豪副院長"],
        night: ["林峻豪副院長"]
    },
    2: { // 週二
        morning: ["林峻豪副院長"],
        afternoon: ["郭芷毓醫師"],
        night: ["吳立偉院長", "郭芷毓醫師"] // 雙診
    },
    3: { // 週三
        morning: ["吳立偉院長"],
        afternoon: ["黃俞華副院長"],
        night: ["黃俞華副院長"]
    },
    4: { // 週四
        morning: ["吳立偉院長"],
        afternoon: ["林峻豪副院長"],
        night: ["郭芷毓醫師"]
    },
    5: { // 週五
        morning: ["林峻豪副院長"],
        afternoon: ["郭芷毓醫師"],
        night: ["郭芷毓醫師"]
    },
    6: { // 週六 → 固定（依你提供週六醫師序列）
        morning: ["劉俊良醫師"],  // 12/6
        afternoon: ["林峻豪副院長"], // 12/13
        night: ["休診"] 
    }
};


// ---------------------------
// 2. 選擇日期自動判斷星期＋顯示可選醫師
// ---------------------------
document.getElementById("date").addEventListener("change", updateDoctorList);
document.getElementById("section").addEventListener("change", updateDoctorList);

function updateDoctorList() {
    const date = document.getElementById("date").value;
    const section = document.getElementById("section").value;
    const doctorSelect = document.getElementById("doctor");

    doctorSelect.innerHTML = "<option value=''>請選擇醫師</option>";

    if (!date || !section) return;

    const weekday = new Date(date).getDay();
    const doctors = schedule[weekday]?.[section] || [];

    doctors.forEach(d => {
        if (d !== "休診") {
            doctorSelect.innerHTML += `<option value="${d}">${d}</option>`;
        }
    });

    updateSummary();
}


// ---------------------------
// 3. UI 下方顯示今日門診醫師
// ---------------------------
function updateSummary() {
    const date = document.getElementById("date").value;
    const section = document.getElementById("section").value;

    if (!date || !section) return;

    const weekday = new Date(date).getDay();
    const doctors = schedule[weekday]?.[section] || [];

    document.getElementById("summary").innerHTML =
        `本日門診醫師：${doctors.join("、")}`;
}


// ---------------------------
// 4. 驗證 + 送出 API
// ---------------------------
function showErr(msg) {
    document.getElementById("err").innerText = msg;
}

async function submitBooking() {
    showErr("");

    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const idNumber = document.getElementById("idNumber").value.trim();
    const birthday = document.getElementById("birthday").value;
    const date = document.getElementById("date").value;
    const section = document.getElementById("section").value;
    const doctor = document.getElementById("doctor").value;

    if (!name || !phone || !idNumber || !birthday || !date || !section || !doctor) {
        showErr("所有欄位皆為必填（姓名、電話、證件、生日、日期、時段、醫師）");
        return;
    }

    const payload = { name, phone, idNumber, birthday, date, section, doctor };

    try {
        const res = await fetch("https://clinic-booking-yb4u.onrender.com/booking", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (data.error) {
            alert(data.error);
            return;
        }

        alert("預約成功！");
        location.reload();

    } catch (err) {
        showErr("連線錯誤，請稍後再試");
    }
}
