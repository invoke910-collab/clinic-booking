// =============================================
// Supabase 設定（使用新版 supabase-js v2）
// =============================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://fjqsrhnwssazcqvjdqqt.supabase.co";
const SUPABASE_KEY = "sb_publishable_3C11H2gMsruJ11llR82XNw_zvl2fIPR";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// =============================================
// 1. 日期不可選今天以前
// =============================================
const dateInput = document.getElementById("date");
const today = new Date().toISOString().split("T")[0];
dateInput.min = today;

// =============================================
// 2. 動態載入班表
// =============================================
async function loadSchedule() {
    const res = await fetch("schedule.json");
    return await res.json();
}

let SCHEDULE = null;

// =============================================
// 3. 日期改變 → 更新時段 → 更新醫師
// =============================================
document.getElementById("date").addEventListener("change", async function () {
    if (!SCHEDULE) SCHEDULE = await loadSchedule();
    const chosenDate = this.value;

    const weekday = new Date(chosenDate).getDay(); // 0~6

    const sectionSelect = document.getElementById("section");
    const doctorSelect = document.getElementById("doctor");

    sectionSelect.innerHTML = `<option value="">請選擇時段</option>`;
    doctorSelect.innerHTML = `<option value="">請先選擇時段</option>`;

    // 星期日休診
    if (weekday === 0) {
        alert("星期日休診，無法預約。");
        return;
    }

    // ====== 星期六特殊輪值 ======
    if (weekday === 6) {
        const sat = SCHEDULE.saturday;

        // 取出該日是哪位醫師
        const match = sat.cycle.find(x => x.date === chosenDate);
        if (!match) {
            alert("此週六沒有門診。");
            return;
        }

        // 載入可預約時段
        Object.keys(sat.sections).forEach(sec => {
            const displayName = sat.sections[sec];
            const opt = document.createElement("option");
            opt.value = sec;
            opt.textContent = displayName;
            sectionSelect.appendChild(opt);
        });

        // 當使用者選擇時段後更新醫師
        sectionSelect.addEventListener("change", function () {
            doctorSelect.innerHTML = "";
            const opt = document.createElement("option");
            opt.value = match.doctor;
            opt.textContent = match.doctor;
            doctorSelect.appendChild(opt);
        });

        return;
    }

    // ====== 一般平日班表 ======
    const day = weekday; // 1=一 ... 5=五
    const daySchedule = SCHEDULE.weekday[day];

    Object.keys(daySchedule).forEach(sec => {
        let display = "";
        if (sec === "morning") display = "早診（08:00–12:00）";
        if (sec === "afternoon") display = "午診（14:30–18:00）";
        if (sec === "night") display = "晚診（18:00–20:00）";

        const opt = document.createElement("option");
        opt.value = sec;
        opt.textContent = display;
        sectionSelect.appendChild(opt);
    });

    // 時段選擇 → 產生醫師名單
    sectionSelect.addEventListener("change", function () {
        doctorSelect.innerHTML = `<option value="">請選擇醫師</option>`;
        const sec = this.value;

        if (!sec) return;

        daySchedule[sec].forEach(doc => {
            const opt = document.createElement("option");
            opt.value = doc;
            opt.textContent = doc;
            doctorSelect.appendChild(opt);
        });
    });
});


// =============================================
// 4. 送出預約
// =============================================
async function submitBooking() {
    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const id_number = document.getElementById("id_number").value.trim();
    const birthday = document.getElementById("birthday").value;
    const date = document.getElementById("date").value;
    const timeKey = document.getElementById("section").value;
    const doctor = document.getElementById("doctor").value;

    if (!name || !phone || !id_number || !birthday || !date || !timeKey || !doctor) {
        alert("請完整填寫所有欄位！");
        return;
    }

    // 取得顯示時段名稱（用於顯示）
    let timeDisplay = "";
    if (timeKey === "morning") timeDisplay = "早診（08:00–12:00）";
    if (timeKey === "afternoon") timeDisplay = "午診（14:30–18:00）";
    if (timeKey === "night") timeDisplay = "晚診（18:00–20:00）";

    // === 1. 檢查是否重複預約 ===
    const { data: existing, error: checkError } = await supabase
        .from("appointments")
        .select("*")
        .eq("name", name)
        .eq("phone", phone)
        .eq("date", date)
        .eq("time", timeDisplay)
        .eq("doctor", doctor);

    if (checkError) {
        alert("檢查重複預約時發生錯誤，請稍後再試");
        return;
    }

    if (existing.length > 0) {
        alert("您已預約過相同日期、時段、醫師，不能重複預約！");
        return;
    }

    // === 2. 寫入資料 ===
    const { error: insertError } = await supabase
        .from("appointments")
        .insert([
            {
                name,
                phone,
                id_number,
                birthday,
                date,
                time: timeDisplay,
                doctor,
            }
        ]);

    if (insertError) {
        alert("寫入預約資料時發生錯誤，請稍後再試");
        return;
    }

    // === 3. 顯示成功 popup（你的 booking.html 已有 popup 樣式） ===
    document.getElementById("popupContent").innerHTML = `
        姓名：${name}<br>
        日期：${date}<br>
        時段：${timeDisplay}<br>
        醫師：${doctor}
    `;
    document.getElementById("popupBg").style.display = "flex";

    // 清空表單
    document.getElementById("name").value = "";
    document.getElementById("phone").value = "";
    document.getElementById("id_number").value = "";
    document.getElementById("birthday").value = "";
    document.getElementById("date").value = "";
    document.getElementById("section").innerHTML = `<option value="">請先選擇日期</option>`;
    document.getElementById("doctor").innerHTML = `<option value="">請先選擇時段</option>`;
}

window.submitBooking = submitBooking;
window.closePopup = () => {
    document.getElementById("popupBg").style.display = "none";
};
