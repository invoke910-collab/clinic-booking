// ===== 1. 填入你的 Supabase URL & anon key =====
const SUPABASE_URL = "https://fjqsrhnwssazcqvjdqqt.supabase.co";
const SUPABASE_KEY = "c5e35025-2ef9-4f98-9363-72758c85efdf";

// ===== 2. 建立 Supabase client =====
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ===== 3. 載入排班設定（schedule.json） =====
let scheduleData = null;

async function loadSchedule() {
    const res = await fetch("schedule.json");
    scheduleData = await res.json();
}

loadSchedule();

// ===== 4. 日期相關：限制今日以前不可選 =====
const dateInput = document.getElementById("date");
(function setMinDate() {
    const today = new Date();
    // 今日不可預約→ 最小日 = 明天
    today.setDate(today.getDate() + 1);
    const min = today.toISOString().split("T")[0];
    dateInput.min = min;
})();

// ===== 5. 依日期顯示時段選單 =====
const sectionSelect = document.getElementById("section");
const doctorSelect = document.getElementById("doctor");

dateInput.addEventListener("change", onDateChange);
sectionSelect.addEventListener("change", onSectionChange);

function clearSelectOptions(selectEl, placeholder) {
    selectEl.innerHTML = "";
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = placeholder;
    selectEl.appendChild(opt);
}

function onDateChange() {
    clearSelectOptions(sectionSelect, "請選擇時段");
    clearSelectOptions(doctorSelect, "請先選擇時段");

    const value = dateInput.value; // yyyy-mm-dd
    if (!value || !scheduleData) return;

    const d = new Date(value + "T00:00:00");
    const weekDay = d.getDay(); // 0: Sun ~ 6: Sat

    // 星期日休診
    if (weekDay === 0) {
        clearSelectOptions(sectionSelect, "星期日休診，請選擇其他日期");
        sectionSelect.disabled = true;
        doctorSelect.disabled = true;
        return;
    }

    sectionSelect.disabled = false;
    doctorSelect.disabled = false;

    // 平日 (1~5)
    if (weekDay >= 1 && weekDay <= 5) {
        const times = [
            { value: "morning", label: "早診（08:00–12:00）" },
            { value: "afternoon", label: "午診（14:30–18:00）" },
            { value: "night", label: "晚診（18:30–20:00）" }
        ];
        clearSelectOptions(sectionSelect, "請選擇時段");
        times.forEach(t => {
            const opt = document.createElement("option");
            opt.value = t.value;
            opt.textContent = t.label;
            sectionSelect.appendChild(opt);
        });
        return;
    }

    // 星期六：依照 schedule.json 的 cycle
    if (weekDay === 6) {
        clearSelectOptions(sectionSelect, "請選擇時段");

        const satConfig = scheduleData.saturday;
        // 週六只有早診 & 午診
        const satSections = satConfig.sections;
        Object.entries(satSections).forEach(([key, label]) => {
            const opt = document.createElement("option");
            opt.value = key;   // morning / afternoon
            opt.textContent = label;
            sectionSelect.appendChild(opt);
        });
    }
}

// ===== 6. 依時段顯示醫師選單 =====
function onSectionChange() {
    clearSelectOptions(doctorSelect, "請選擇醫師");

    const dateVal = dateInput.value;
    const secVal = sectionSelect.value;
    if (!dateVal || !secVal || !scheduleData) return;

    const d = new Date(dateVal + "T00:00:00");
    const weekDay = d.getDay();

    let doctors = [];

    if (weekDay >= 1 && weekDay <= 5) {
        // 平日
        const dayCfg = scheduleData.weekday[String(weekDay)];
        if (dayCfg && dayCfg[secVal]) {
            doctors = dayCfg[secVal];
        }
    } else if (weekDay === 6) {
        // 星期六：看 cycle
        const satCfg = scheduleData.saturday;
        const cycle = satCfg.cycle;
        const target = cycle.find(c => c.date === dateVal);
        if (target && secVal === "morning") {
            // 週六早診：依 cycle 的 doctor
            doctors = [target.doctor];
        } else if (target && secVal === "afternoon") {
            // 週六午診：固定「劉俊良 醫師」
            doctors = ["劉俊良 醫師"];
        }
    }

    if (doctors.length === 0) {
        clearSelectOptions(doctorSelect, "本時段無門診，請改選其他時段");
        doctorSelect.disabled = true;
        return;
    }

    doctorSelect.disabled = false;
    doctors.forEach(name => {
        const opt = document.createElement("option");
        opt.value = name;
        opt.textContent = name;
        doctorSelect.appendChild(opt);
    });
}

// ===== 7. 送出預約 =====
async function submitBooking() {
    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const id_number = document.getElementById("id_number").value.trim();
    const birthday = document.getElementById("birthday").value;
    const date = document.getElementById("date").value;
    const timeKey = document.getElementById("section").value;
    const doctor = document.getElementById("doctor").value;

    if (!name || !phone || !id_number || !birthday || !date || !timeKey || !doctor) {
        alert("所有欄位都是必填（姓名、電話、證件、生日、日期、時段、醫師）");
        return;
    }

    // 顯示中文時段文字
    let timeText = "";
    if (timeKey === "morning") timeText = "早診（08:00–12:00）";
    else if (timeKey === "afternoon") timeText = "午診（14:30–18:00）";
    else if (timeKey === "night") timeText = "晚診（18:30–20:00）";

    try {
        // 1) 檢查是否已重複預約
        const { data: dupList, error: dupErr } = await supabase
            .from("appointments")
            .select("id")
            .eq("name", name)
            .eq("phone", phone)
            .eq("date", date)
            .eq("time", timeText)
            .eq("doctor", doctor)
            .limit(1);

        if (dupErr) {
            console.error(dupErr);
            alert("檢查重複預約時發生錯誤，請稍後再試");
            return;
        }

        if (dupList && dupList.length > 0) {
            alert("您已預約過同一日期、同一時段與同一位醫師，無法重複預約。");
            return;
        }

        // 2) 寫入資料
        const { error: insertErr } = await supabase.from("appointments").insert([{
            name,
            phone,
            id_number,
            birthday,
            date,
            time: timeText,
            doctor
        }]);

        if (insertErr) {
            console.error(insertErr);
            alert("預約寫入失敗，請稍後再試");
            return;
        }

        // 3) 顯示漂亮 popup
        const popupBg = document.getElementById("popupBg");
        const popupContent = document.getElementById("popupContent");
        popupContent.innerHTML = `
            <p>姓名：${name}</p>
            <p>日期：${date}</p>
            <p>時段：${timeText}</p>
            <p>醫師：${doctor}</p>
        `;
        popupBg.style.display = "flex";

    } catch (e) {
        console.error(e);
        alert("預約過程發生錯誤，請稍後再試");
    }
}

// popup 關閉 & 清空表單
function closePopup() {
    document.getElementById("popupBg").style.display = "none";

    document.getElementById("name").value = "";
    document.getElementById("phone").value = "";
    document.getElementById("id_number").value = "";
    document.getElementById("birthday").value = "";
    document.getElementById("date").value = "";
    clearSelectOptions(sectionSelect, "請先選擇日期");
    clearSelectOptions(doctorSelect, "請先選擇時段");
    sectionSelect.disabled = true;
    doctorSelect.disabled = true;
}
window.closePopup = closePopup;
window.submitBooking = submitBooking;

