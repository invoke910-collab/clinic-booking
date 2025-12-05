// =============================================
// Supabase 設定（使用 UMD 全域版）
// =============================================
const SUPABASE_URL = "https://fjqsrhnwssazcqvjdqqt.supabase.co";
const SUPABASE_KEY = "sb-publishable-3C11H2..................................fIPR";

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// =============================================
// 1. 今日以前不可預約
// =============================================
const dateInput = document.getElementById("date");
const today = new Date().toISOString().split("T")[0];
dateInput.min = today;

// =============================================
// 2. 載入班表
// =============================================
let SCHEDULE = null;

async function loadSchedule() {
    const res = await fetch("schedule.json");
    SCHEDULE = await res.json();
}

// =============================================
// 3. 日期選擇 → 更新時段與醫師
// =============================================
document.getElementById("date").addEventListener("change", async function () {
    if (!SCHEDULE) await loadSchedule();

    const chosenDate = this.value;
    const weekday = new Date(chosenDate).getDay();

    const sectionSelect = document.getElementById("section");
    const doctorSelect = document.getElementById("doctor");

    sectionSelect.innerHTML = `<option value="">請選擇時段</option>`;
    doctorSelect.innerHTML = `<option value="">請先選擇時段</option>`;

    // 星期日休診
    if (weekday === 0) {
        alert("星期日休診，無法預約");
        return;
    }

    // -------------------------
    // 週六（輪值）
    // -------------------------
    if (weekday === 6) {
        const sat = SCHEDULE.saturday;

        const match = sat.cycle.find(x => x.date === chosenDate);
        if (!match) {
            alert("此週六沒有門診。");
            return;
        }

        // 時段
        for (let key of Object.keys(sat.sections)) {
            const opt = document.createElement("option");
            opt.value = key;
            opt.textContent = sat.sections[key];
            sectionSelect.appendChild(opt);
        }

        // 醫師
        sectionSelect.onchange = () => {
            doctorSelect.innerHTML = "";
            const opt = document.createElement("option");
            opt.value = match.doctor;
            opt.textContent = match.doctor;
            doctorSelect.appendChild(opt);
        };

        return;
    }

    // -------------------------
    // 平日班表
    // -------------------------
    const day = weekday; //1~5
    const daySchedule = SCHEDULE.weekday[day];

    // 時段
    const naming = {
        morning: "早診（08:00–12:00）",
        afternoon: "午診（14:30–18:00）",
        night: "晚診（18:00–20:00）"
    };

    Object.keys(daySchedule).forEach(sec => {
        const opt = document.createElement("option");
        opt.value = sec;
        opt.textContent = naming[sec];
        sectionSelect.appendChild(opt);
    });

    // 醫師
    sectionSelect.onchange = () => {
        doctorSelect.innerHTML = `<option value="">請選擇醫師</option>`;
        const sec = sectionSelect.value;

        daySchedule[sec].forEach(doc => {
            const opt = document.createElement("option");
            opt.value = doc;
            opt.textContent = doc;
            doctorSelect.appendChild(opt);
        });
    };
});

// =============================================
// 4. 送出預約
// =============================================
window.submitBooking = async function () {
    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const id_number = document.getElementById("id_number").value.trim();
    const birthday = document.getElementById("birthday").value;
    const date = document.getElementById("date").value;
    const sec = document.getElementById("section").value;
    const doctor = document.getElementById("doctor").value;

    if (!name || !phone || !id_number || !birthday || !date || !sec || !doctor) {
        alert("所有欄位都是必填！");
        return;
    }

    const displayTime = {
        morning: "早診（08:00–12:00）",
        afternoon: "午診（14:30–18:00）",
        night: "晚診（18:00–20:00）"
    }[sec];

    // 檢查重複預約
    const { data: exist, error: checkErr } = await supabase
        .from("appointments")
        .select("*")
        .eq("name", name)
        .eq("phone", phone)
        .eq("date", date)
        .eq("time", displayTime)
        .eq("doctor", doctor);

    if (checkErr) {
        alert("檢查預約時發生錯誤，請稍後重試");
        return;
    }

    if (exist.length > 0) {
        alert("您已預約此日期與時段（相同醫師），不能重複預約！");
        return;
    }

    // 寫入
    const { error: insertErr } = await supabase
        .from("appointments")
        .insert([
            {
                name,
                phone,
                id_number,
                birthday,
                date,
                time: displayTime,
                doctor
            }
        ]);

    if (insertErr) {
        alert("寫入資料時發生錯誤，請稍後再試");
        return;
    }

    // 顯示成功 popup
    document.getElementById("popupContent").innerHTML = `
        姓名：${name}<br>
        日期：${date}<br>
        時段：${displayTime}<br>
        醫師：${doctor}
    `;
    document.getElementById("popupBg").style.display = "flex";

    // 表單清空
    document.querySelector("form")?.reset();
};
