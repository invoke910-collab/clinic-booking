// =============================================
// booking.js（最終版）
// =============================================

// 時段代碼（用來跟後端一致）
const timeMap = {
    "早診（08:00–12:00）": "morning",
    "午診（14:30–18:00）": "afternoon",
    "晚診（18:30–20:00）": "night"
};

// 動態產生醫師班表 （你之前用 schedule.json）
async function loadSchedule() {
    const res = await fetch("schedule.json");
    return await res.json();
}

document.addEventListener("DOMContentLoaded", async () => {
    const today = new Date().toISOString().split("T")[0];
    document.getElementById("date").setAttribute("min", today);

    const schedule = await loadSchedule();

    document.getElementById("date").addEventListener("change", () => {
        const date = document.getElementById("date").value;
        const dow = new Date(date).getDay();
        const select = document.getElementById("section");

        select.innerHTML = `<option value="">請選擇時段</option>`;

        // 周日休診
        if (dow === 0) {
            select.innerHTML = `<option value="">周日休診</option>`;
            return;
        }

        // 周六只有早診、午診
        if (dow === 6) {
            select.innerHTML += `<option value="早診（08:00–12:00）">早診（08:00–12:00）</option>`;
            select.innerHTML += `<option value="午診（14:30–18:00）">午診（14:30–18:00）</option>`;
            return;
        }

        // 平日：早午晚
        select.innerHTML += `<option value="早診（08:00–12:00）">早診（08:00–12:00）</option>`;
        select.innerHTML += `<option value="午診（14:30–18:00）">午診（14:30–18:00）</option>`;
        select.innerHTML += `<option value="晚診（18:30–20:00）">晚診（18:30–20:00）</option>`;
    });

    document.getElementById("section").addEventListener("change", async () => {
        const doctorSel = document.getElementById("doctor");
        const date = document.getElementById("date").value;
        const timeStr = document.getElementById("section").value;

        doctorSel.innerHTML = `<option value="">請選擇醫師</option>`;

        if (!date || !timeStr) return;

        const dow = new Date(date).getDay();
        const schedule = await loadSchedule();

        if (!schedule[dow]) return;

        const list = schedule[dow][timeMap[timeStr]];
        if (!list) return;

        list.forEach(doc => {
            doctorSel.innerHTML += `<option value="${doc}">${doc}</option>`;
        });
    });
});

// ===========================================
// 送出預約
// ===========================================
async function submitBooking() {
    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const id_number = document.getElementById("id_number").value.trim();
    const birthday = document.getElementById("birthday").value;
    const date = document.getElementById("date").value;
    const timeLabel = document.getElementById("section").value;
    const doctor = document.getElementById("doctor").value;

    if (!name || !phone || !id_number || !birthday || !date || !timeLabel || !doctor) {
        alert("所有欄位皆須填寫！");
        return;
    }

    const time = timeMap[timeLabel]; // 轉為後端格式

    const res = await fetch("https://clinic-booking-yb4u.onrender.com/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, id_number, birthday, date, time, doctor })
    });

    const data = await res.json();

    if (data.status === "duplicate") {
        alert("⚠ 您已預約過此時段，不可重複預約！");
        return;
    }

    // 顯示popup
    document.getElementById("popupContent").innerHTML = `
        姓名：${name}<br>
        日期：${date}<br>
        時段：${timeLabel}<br>
        醫師：${doctor}
    `;

    document.getElementById("popupBg").style.display = "flex";
}

// 關閉 popup → 清空表單
function closePopup() {
    document.getElementById("popupBg").style.display = "none";

    ["name","phone","id_number","birthday","date"].forEach(id => {
        document.getElementById(id).value = "";
    });

    document.getElementById("section").innerHTML = `<option value="">請先選擇日期</option>`;
    document.getElementById("doctor").innerHTML = `<option value="">請先選擇時段</option>`;

    window.scrollTo(0,0);
}
