// ===============================
// 設定：預約日期不可選擇今日以前
// ===============================
const today = new Date();
today.setDate(today.getDate() + 1);
document.getElementById("date").min = today.toISOString().split("T")[0];

// ===============================
// 週六醫師班表（12/6、12/13、12/20、12/27）
// ===============================
const saturdayDoctors = {
    "2025-12-06": ["劉俊良醫師"],
    "2025-12-13": ["林峻豪副院長"],
    "2025-12-20": ["劉俊良醫師"],
    "2025-12-27": ["林峻豪副院長"]
};

// ===============================
// 平日醫師班表
// ===============================
const weekdayDoctors = {
    morning: ["吳立偉院長", "郭芷毓醫師", "林峻豪副院長"],
    afternoon: ["林峻豪副院長", "黃卉華副院長", "郭芷毓醫師"],
    night: ["林峻豪副院長", "黃卉華副院長", "郭芷毓醫師"]
};

// ===============================
// 時段顯示中文
// ===============================
const sectionText = {
    morning: "早診（08:00–12:00）",
    afternoon: "午診（14:30–18:00）",
    night: "晚診（18:00–20:00）"
};

// ===============================
// 日期改變 → 更新時段
// ===============================
document.getElementById("date").addEventListener("change", function () {
    const d = new Date(this.value);
    const day = d.getDay();

    const sec = document.getElementById("section");
    sec.innerHTML = `<option value="">請選擇時段</option>`;

    const doctorSelect = document.getElementById("doctor");
    doctorSelect.innerHTML = `<option value="">請選擇時段</option>`;

    // 週日休診
    if (day === 0) {
        sec.innerHTML = `<option value="">休診</option>`;
        return;
    }

    // 週六：只有早診 + 午診
    if (day === 6) {
        sec.innerHTML += `<option value="morning">早診（08:00–12:00）</option>`;
        sec.innerHTML += `<option value="afternoon">午診（14:30–18:00）</option>`;
        return;
    }

    // 平日：早＋午＋晚
    sec.innerHTML += `<option value="morning">早診（08:00–12:00）</option>`;
    sec.innerHTML += `<option value="afternoon">午診（14:30–18:00）</option>`;
    sec.innerHTML += `<option value="night">晚診（18:00–20:00）</option>`;
});

// ===============================
// 選時段 → 更新醫師
// ===============================
document.getElementById("section").addEventListener("change", function () {
    const date = document.getElementById("date").value;
    const section = this.value;
    const d = new Date(date);
    const day = d.getDay();

    const doctorSelect = document.getElementById("doctor");
    doctorSelect.innerHTML = `<option value="">請選擇醫師</option>`;

    if (!section) return;

    // 週日休診
    if (day === 0) {
        doctorSelect.innerHTML = `<option value="">休診</option>`;
        return;
    }

    // 週六
    if (day === 6) {
        if (saturdayDoctors[date]) {
            saturdayDoctors[date].forEach(doc => {
                doctorSelect.innerHTML += `<option value="${doc}">${doc}</option>`;
            });
        }
        return;
    }

    // 平日
    weekdayDoctors[section].forEach(doc => {
        doctorSelect.innerHTML += `<option value="${doc}">${doc}</option>`;
    });
});

// ===============================
// 送出預約
// ===============================
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

// ===============================
// 顯示 Popup
// ===============================
function showPopup(data) {
    document.getElementById("popupContent").innerHTML = `
        姓名：${data.name}<br>
        日期：${data.date}<br>
        時段：${sectionText[data.time]}<br>
        醫師：${data.doctor}
    `;
    document.getElementById("popupBg").style.display = "flex";
}

function closePopup() {
    document.getElementById("popupBg").style.display = "none";
    location.reload();
}
