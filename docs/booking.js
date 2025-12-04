// =======================
//  每週固定醫師班表設定
// =======================
const weeklySchedule = {
    1: {  // 星期一
        morning: ["吳立偉院長", "郭芷毓醫師"],
        afternoon: ["林峻豪副院長"],
        night: ["林峻豪副院長"]
    },
    2: {  // 星期二
        morning: ["林峻豪副院長"],
        afternoon: ["郭芷毓醫師"],
        night: ["吳立偉院長", "郭芷毓醫師"]  // 雙診
    },
    3: {  // 星期三
        morning: ["吳立偉院長", "郭芷毓醫師"], // 雙診
        afternoon: ["黃俞華副院長"],
        night: ["黃俞華副院長"]
    },
    4: {  // 星期四
        morning: ["吳立偉院長"],
        afternoon: ["林峻豪副院長"],
        night: ["林峻豪副院長"]
    },
    5: {  // 星期五
        morning: ["林峻豪副院長"],
        afternoon: ["郭芷毓醫師"],
        night: ["郭芷毓醫師"]
    },
    6: {  // 星期六（固定）
        morning: ["劉俊良醫師"],
        afternoon: ["林峻豪副院長"],
        night: []
    }
};

// =======================
//  依日期＋時段 → 顯示可選醫師
// =======================
document.getElementById("section").addEventListener("change", loadDoctors);
document.getElementById("date").addEventListener("change", loadDoctors);

function loadDoctors() {
    const date = document.getElementById("date").value;
    const section = document.getElementById("section").value;
    const doctorSelect = document.getElementById("doctor");
    const todayBox = document.getElementById("todayDoctor");

    doctorSelect.innerHTML = `<option disabled selected>請先選擇時段</option>`;
    todayBox.innerHTML = "";

    if (!date || !section) return;

    const day = new Date(date).getDay();
    const doctors = weeklySchedule[day]?.[section] || [];

    if (doctors.length === 0) {
        doctorSelect.innerHTML = `<option disabled selected>本時段無門診</option>`;
        return;
    }

    doctorSelect.innerHTML = doctors
        .map(d => `<option value="${d}">${d}</option>`)
        .join("");

    todayBox.innerHTML = `本日門診醫師：${doctors.join("、")}`;
}

// =======================
//  送出預約
// =======================
function submitBooking() {
    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const idNumber = document.getElementById("idNumber").value.trim();
    const birthday = document.getElementById("birthday").value;
    const date = document.getElementById("date").value;
    const section = document.getElementById("section").value;
    const doctor = document.getElementById("doctor").value;

    if (!name || !phone || !idNumber || !birthday || !date || !section || !doctor) {
        alert("所有欄位都是必填（姓名、電話、證件、生日、日期、時段、醫師）");
        return;
    }

    fetch("https://clinic-booking-yb4u.onrender.com/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, idNumber, birthday, date, section, doctor })
    })
        .then(res => res.json())
        .then(data => {
            alert(data.message || "預約已送出");
        })
        .catch(err => alert("送出失敗：" + err));
}
