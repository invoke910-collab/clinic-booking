// ===============================
// Supabase 初始化
// ===============================
const SUPABASE_URL = "https://fjqsrhnwssazcqvjdqqt.supabase.co";
const SUPABASE_KEY = "sb_publishable_3C11H2gMsruJ11llR82XNw_zvl2fIPR";

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ===============================
// 讀取 schedule.json
// ===============================
let scheduleData = {};

fetch("schedule.json")
  .then(r => r.json())
  .then(data => scheduleData = data);

// ===============================
// 限制日期（今天以前不可選）
// ===============================
const dateInput = document.getElementById("date");
const today = new Date().toISOString().split("T")[0];
dateInput.min = today;

// ===============================
// 日期改變 → 自動顯示時段
// ===============================
dateInput.addEventListener("change", () => {
    const selected = dateInput.value;
    const weekday = new Date(selected).getDay();

    const section = document.getElementById("section");
    const doctor = document.getElementById("doctor");

    section.innerHTML = "";
    doctor.innerHTML = `<option value="">請先選擇時段</option>`;

    // 週日休診
    if (scheduleData.sunday?.closed && weekday === 0) {
        section.innerHTML = `<option value="">週日休診</option>`;
        return;
    }

    // 週六（輪診）
    if (weekday === 6) {
        section.innerHTML = `
            <option value="">請選擇時段</option>
            <option value="morning">早診（08:00–12:00）</option>
            <option value="afternoon">午診（14:30–17:00）</option>
        `;
        return;
    }

    // 平日
    if (scheduleData.weekday[weekday]) {
        const times = scheduleData.weekday[weekday];
        section.innerHTML = `<option value="">請選擇時段</option>`;
        if (times.morning) section.innerHTML += `<option value="morning">早診（08:00–12:00）</option>`;
        if (times.afternoon) section.innerHTML += `<option value="afternoon">午診（14:30–18:00）</option>`;
        if (times.night) section.innerHTML += `<option value="night">晚診（18:00–20:00）</option>`;
    }
});


// ===============================
// 時段改變 → 自動顯示醫師
// ===============================
document.getElementById("section").addEventListener("change", () => {
    const selectedDate = dateInput.value;
    const weekday = new Date(selectedDate).getDay();
    const section = document.getElementById("section").value;
    const doctor = document.getElementById("doctor");

    doctor.innerHTML = "";

    // 週六輪診
    if (weekday === 6) {
        const found = scheduleData.saturday.cycle.find(x => x.date === selectedDate);
        if (found) {
            doctor.innerHTML = `<option value="${found.doctor}">${found.doctor}</option>`;
        }
        return;
    }

    // 平日
    const list = scheduleData.weekday[weekday]?.[section] || [];
    doctor.innerHTML = `<option value="">請選擇醫師</option>`;

    list.forEach(doc => {
        doctor.innerHTML += `<option value="${doc}">${doc}</option>`;
    });
});


// ===============================
// 送出預約
// ===============================
async function submitBooking() {
    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const id_number = document.getElementById("id_number").value.trim();
    const birthday = document.getElementById("birthday").value.trim();
    const date = document.getElementById("date").value.trim();
    const timeKey = document.getElementById("section").value.trim();
    const doctor = document.getElementById("doctor").value.trim();

    if (!name || !phone || !id_number || !birthday || !date || !timeKey || !doctor) {
        alert("請填寫所有欄位");
        return;
    }

    const timeMap = {
        morning: "早診（08:00–12:00）",
        afternoon: "午診（14:30–18:00）",
        night: "晚診（18:00–20:00）"
    };
    const time = timeMap[timeKey];

    // 🔍 檢查是否重複
    const { data: exists } = await db
        .from("appointments")
        .select("*")
        .eq("name", name)
        .eq("phone", phone)
        .eq("date", date)
        .eq("time", time)
        .eq("doctor", doctor);

    if (exists.length > 0) {
        alert("此時段您已預約過，不可重複預約！");
        return;
    }

    // 寫入資料
    await db.from("appointments").insert([
        { name, phone, id_number, birthday, date, time, doctor }
    ]);

    // 顯示 popup
    popupContent.innerHTML = `
        姓名：${name}<br>
        日期：${date}<br>
        時段：${time}<br>
        醫師：${doctor}
    `;
    popupBg.style.display = "flex";

    // 清空表單
    document.querySelectorAll("input").forEach(x => x.value = "");
    document.getElementById("section").innerHTML = `<option value="">請先選擇日期</option>`;
    document.getElementById("doctor").innerHTML = `<option value="">請先選擇時段</option>`;
}


// 關閉 popup
function closePopup() {
    popupBg.style.display = "none";
}
