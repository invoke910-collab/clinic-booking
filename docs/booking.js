// ===============================
// Supabase 初始化（請填自己的 URL & anon key）
// ===============================
const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_KEY = "YOUR_SUPABASE_ANON_KEY";

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// ===============================
// 讀取排班 schedule.json
// ===============================
let scheduleData = null;

fetch("schedule.json")
  .then(res => res.json())
  .then(data => {
      scheduleData = data;
  })
  .catch(() => {
      alert("無法載入排班資料，請稍後再試");
  });

// ===============================
// 限制日期：今天「以前」＋今天都不能預約，只能預約未來
// ===============================
const dateInput = document.getElementById("date");
const todayObj = new Date();
todayObj.setDate(todayObj.getDate() + 1); // 從「明天」開始可以預約

const yyyy = todayObj.getFullYear();
const mm = String(todayObj.getMonth() + 1).padStart(2, "0");
const dd = String(todayObj.getDate()).padStart(2, "0");
const minDateStr = `${yyyy}-${mm}-${dd}`;
dateInput.min = minDateStr;

// ===============================
// 日期改變 → 產生時段（早 / 午 / 晚診）
// ===============================
dateInput.addEventListener("change", () => {
    const sectionSel = document.getElementById("section");
    const doctorSel = document.getElementById("doctor");
    sectionSel.innerHTML = `<option value="">請先選擇日期</option>`;
    doctorSel.innerHTML = `<option value="">請先選擇時段</option>`;

    if (!scheduleData) return;
    const dateVal = dateInput.value;
    if (!dateVal) return;

    const d = new Date(dateVal);
    const weekday = d.getDay(); // 0=日,1=一,...6=六

    // 週日休診
    if (weekday === 0 && scheduleData.sunday?.closed) {
        sectionSel.innerHTML = `<option value="">週日休診</option>`;
        return;
    }

    sectionSel.innerHTML = `<option value="">請選擇時段</option>`;

    // 週六：固定早 + 午診，醫師輪值
    if (weekday === 6) {
        const sections = scheduleData.saturday?.sections || {};
        if (sections.morning) {
            sectionSel.innerHTML += `<option value="morning">${sections.morning[0]}</option>`;
        }
        if (sections.afternoon) {
            sectionSel.innerHTML += `<option value="afternoon">${sections.afternoon[0]}</option>`;
        }
        return;
    }

    // 平日：依 weekday 設定
    const dayKey = String(weekday);
    const dayData = scheduleData.weekday?.[dayKey];
    if (!dayData) return;

    if (dayData.morning) {
        sectionSel.innerHTML += `<option value="morning">早診（08:00–12:00）</option>`;
    }
    if (dayData.afternoon) {
        sectionSel.innerHTML += `<option value="afternoon">午診（14:30–18:00）</option>`;
    }
    if (dayData.night) {
        sectionSel.innerHTML += `<option value="night">晚診（18:00–20:00）</option>`;
    }
});

// ===============================
// 時段改變 → 顯示醫師名單
// ===============================
document.getElementById("section").addEventListener("change", () => {
    const doctorSel = document.getElementById("doctor");
    doctorSel.innerHTML = `<option value="">請選擇醫師</option>`;

    if (!scheduleData) return;

    const dateVal = dateInput.value;
    const d = new Date(dateVal);
    const weekday = d.getDay();
    const section = document.getElementById("section").value;

    if (!section) {
        doctorSel.innerHTML = `<option value="">請先選擇時段</option>`;
        return;
    }

    // 週六：依 cycle 決定醫師
    if (weekday === 6) {
        const cycle = scheduleData.saturday?.cycle || [];
        const found = cycle.find(c => c.date === dateVal);
        if (!found) {
            doctorSel.innerHTML = `<option value="">此日期尚未開放預約</option>`;
            return;
        }
        doctorSel.innerHTML = `<option value="${found.doctor}">${found.doctor}</option>`;
        return;
    }

    // 平日：依 weekday + section 決定醫師
    const dayKey = String(weekday);
    const doctors = scheduleData.weekday?.[dayKey]?.[section] || [];
    doctors.forEach(doc => {
        doctorSel.innerHTML += `<option value="${doc}">${doc}</option>`;
    });
});

// ===============================
// Helper：將 section 轉成中文時段字串
// ===============================
function sectionToLabel(section) {
    switch (section) {
        case "morning": return "早診（08:00–12:00）";
        case "afternoon": return "午診（14:30–18:00）";
        case "night": return "晚診（18:00–20:00）";
        default: return section;
    }
}

// ===============================
// 送出預約
// ===============================
async function submitBooking() {
    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const id_number = document.getElementById("id_number").value.trim();
    const birthday = document.getElementById("birthday").value;
    const date = document.getElementById("date").value;
    const section = document.getElementById("section").value;
    const doctor = document.getElementById("doctor").value;

    if (!name || !phone || !id_number || !birthday || !date || !section || !doctor) {
        alert("請完整填寫所有欄位");
        return;
    }

    const timeLabel = sectionToLabel(section);

    // 🔒 防止重複預約（同姓名+電話+日期+時段+醫師）
    const { data: exists, error: checkErr } = await db
        .from("appointments")
        .select("id", { count: "exact" })
        .eq("name", name)
        .eq("phone", phone)
        .eq("date", date)
        .eq("time", timeLabel)
        .eq("doctor", doctor);

    if (checkErr) {
        alert("檢查重複預約時發生錯誤，請稍後再試");
        return;
    }

    if (exists && exists.length > 0) {
        alert("此日期與時段，您已預約過同一位醫師，請勿重複預約。");
        return;
    }

    // ✅ 新增預約
    const { error: insertErr } = await db
        .from("appointments")
        .insert([
            { name, phone, id_number, birthday, date, time: timeLabel, doctor }
        ]);

    if (insertErr) {
        alert("預約失敗，請稍後再試");
        return;
    }

    // ✅ 顯示彈跳視窗
    const popupBg = document.getElementById("popupBg");
    const popupContent = document.getElementById("popupContent");
    popupContent.innerHTML = `
        您的預約已完成！<br>
        姓名：${name}<br>
        日期：${date}<br>
        時段：${timeLabel}<br>
        醫師：${doctor}
    `;
    popupBg.style.display = "flex";

    // ✅ 清空表單，方便下一筆預約
    document.getElementById("name").value = "";
    document.getElementById("phone").value = "";
    document.getElementById("id_number").value = "";
    document.getElementById("birthday").value = "";
    document.getElementById("date").value = "";
    document.getElementById("section").innerHTML = `<option value="">請先選擇日期</option>`;
    document.getElementById("doctor").innerHTML = `<option value="">請先選擇時段</option>`;
}

// 關閉 popup
function closePopup() {
    document.getElementById("popupBg").style.display = "none";
}
