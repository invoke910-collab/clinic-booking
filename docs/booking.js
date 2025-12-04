// ===========================================
//  booking.js — 最新完整版
// ===========================================

// 後端 API URL（Render）
const API_URL = "https://clinic-booking-yb4u.onrender.com";

// DOM 元素
const dateInput = document.getElementById("date");
const sectionSelect = document.getElementById("section");
const doctorSelect = document.getElementById("doctor");
const summary = document.getElementById("summary");
const err = document.getElementById("err");

// 今日不得預約（含今天）
const today = new Date();
today.setHours(0, 0, 0, 0);

dateInput.addEventListener("change", () => {
    const chosen = new Date(dateInput.value);
    chosen.setHours(0, 0, 0, 0);

    if (chosen <= today) {
        showPopup("⚠️ 不可預約今日或過去日期！");
        dateInput.value = "";
        return;
    }

    loadDoctorOptions();
});

// ===============================
// 週六固定醫師排班
// ===============================
function getSaturdayDoctor(dateStr) {
    const fixed = {
        "2025-12-06": "劉俊良醫師",
        "2025-12-13": "林峻豪副院長",
        "2025-12-20": "劉俊良醫師",
        "2025-12-27": "林峻豪副院長"
    };
    return fixed[dateStr] || null;
}

// ===============================
// 依時段載入醫師
// ===============================
async function loadDoctorOptions() {
    doctorSelect.innerHTML = `<option value="">請先選擇時段</option>`;
    summary.innerHTML = "";

    const dateStr = dateInput.value;
    if (!dateStr || !sectionSelect.value) return;

    const dateObj = new Date(dateStr);
    const weekday = dateObj.getDay(); // 0=日 6=六

    // 處理週六
    if (weekday === 6) {
        const doc = getSaturdayDoctor(dateStr);
        if (doc) {
            doctorSelect.innerHTML = `<option value="${doc}">${doc}</option>`;
            summary.innerHTML = `本日門診醫師：${doc}`;
        } else {
            doctorSelect.innerHTML = `<option value="">尚未提供預約</option>`;
            summary.innerHTML = `本日無門診`;
        }
        return;
    }

    // 平日：依 schedule.json 讀取
    try {
        const res = await fetch("schedule.json");
        const data = await res.json();

        const schedule = data.schedule[weekday];
        if (!schedule) return;

        const time = sectionSelect.value; // morning / afternoon / night
        const list = schedule[time] || [];

        // 無醫師
        if (list.length === 0) {
            doctorSelect.innerHTML = `<option value="">本時段無門診</option>`;
            summary.innerHTML = "本時段無門診";
            return;
        }

        // 有醫師 → 填入選單
        doctorSelect.innerHTML = list
            .map(d => `<option value="${d}">${d}</option>`)
            .join("");

        summary.innerHTML = `本日門診醫師：${list.join("、")}`;

    } catch (e) {
        console.error("讀取 schedule.json 失敗", e);
        showPopup("載入醫師班表失敗");
    }
}

// 監聽時段選擇 → 更新醫師
sectionSelect.addEventListener("change", loadDoctorOptions);

// ===============================
// 漂亮的 Popup
// ===============================
function showPopup(message) {
    const popup = document.createElement("div");
    popup.style.position = "fixed";
    popup.style.top = "0";
    popup.style.left = "0";
    popup.style.width = "100%";
    popup.style.height = "100%";
    popup.style.background = "rgba(0,0,0,0.6)";
    popup.style.display = "flex";
    popup.style.justifyContent = "center";
    popup.style.alignItems = "center";
    popup.style.zIndex = "9999";

    popup.innerHTML = `
        <div style="
            background: white;
            padding: 25px;
            width: 80%;
            max-width: 380px;
            border-radius: 15px;
            text-align: center;
            font-size: 18px;
            line-height: 1.6;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        ">
            ${message}
            <br><br>
            <button id="popupOK" style="
                background:#007bff;
                color:white;
                padding:10px 20px;
                border-radius:10px;
                font-size:16px;
                border:none;
            ">確定</button>
        </div>
    `;

    document.body.appendChild(popup);

    document.getElementById("popupOK").onclick = () => popup.remove();
}

// ===============================
// 送出預約
// ===============================
async function submitBooking() {
    err.textContent = "";

    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const id_number = document.getElementById("id_number").value.trim();
    const birthday = document.getElementById("birthday").value;
    const date = dateInput.value;
    const time = sectionSelect.value;
    const doctor = doctorSelect.value;

    if (!name || !phone || !id_number || !birthday || !date || !time || !doctor) {
        showPopup("⚠️ 所有欄位皆為必填！");
        return;
    }

    let timeText = "";
    if (time === "morning") timeText = "早診（08:00–12:00）";
    if (time === "afternoon") timeText = "午診（14:30–18:00）";
    if (time === "night") timeText = "晚診（18:30–20:00）";

    // 送資料到後端
    try {
        const res = await fetch(`${API_URL}/booking`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name,
                phone,
                id_number,
                birthday,
                date,
                time,
                doctor
            }),
        });

        const data = await res.json();

        if (data.error) {
            showPopup("⚠️ " + data.error);
            return;
        }

        if (data.message && data.message.includes("已預約過")) {
            showPopup("⚠️ 您已預約過此日期與時段！");
            return;
        }

        // 成功 popup
        showPopup(`
            <b>預約成功！</b><br><br>
            姓名：${name}<br>
            日期：${date}<br>
            時段：${timeText}<br>
            醫師：${doctor}
        `);

    } catch (e) {
        console.error("Error:", e);
        showPopup("⚠️ 發生錯誤，請稍後再試");
    }
}

