// ===========================
//   診所班表讀取
// ===========================
async function loadSchedule() {
    const res = await fetch("schedule.json");
    const schedule = await res.json();
    window.scheduleData = schedule;
}

// ===========================
//   日期選擇 → 產生時段
// ===========================
function onDateChange() {
    const date = document.getElementById("date").value;
    if (!date) return;

    const weekday = new Date(date).getDay(); // 0=日,1=一...

    let sections = [];

    if (weekday === 1) {  // 週一
        sections = ["早診", "午診", "晚診"];
    } 
    else if (weekday === 2) { // 週二
        sections = ["早診", "午診", "晚診"];
    }
    else if (weekday === 3) { // 週三
        sections = ["早診", "午診", "晚診"];
    }
    else if (weekday === 4) { // 週四
        sections = ["早診", "午診", "晚診"];
    }
    else if (weekday === 5) { // 週五
        sections = ["早診", "午診"];
    }
    else if (weekday === 6) { // 週六
        sections = ["早診"];
    }
    else {
        sections = [];
    }

    const select = document.getElementById("section");
    select.innerHTML = "";

    sections.forEach(s => {
        const op = document.createElement("option");
        op.value = s;
        op.textContent = s;
        select.appendChild(op);
    });

    onSectionChange();
}

// ===========================
//   時段選擇 → 顯示今日醫師
// ===========================
function onSectionChange() {
    const date = document.getElementById("date").value;
    const section = document.getElementById("section").value;
    const doctorSelect = document.getElementById("doctor");
    const msg = document.getElementById("doctor-today");

    if (!date || !section) return;

    const weekday = new Date(date).getDay();
    let doctorList = [];

    // 使用 schedule.json
    doctorList = (window.scheduleData[weekday] && window.scheduleData[weekday][section])
        ? window.scheduleData[weekday][section]
        : [];

    msg.textContent = "本日門診醫師：" + doctorList.join("、");

    doctorSelect.innerHTML = "";
    doctorList.forEach(d => {
        const op = document.createElement("option");
        op.value = d;
        op.textContent = d;
        doctorSelect.appendChild(op);
    });
}

// ===========================
//   送出預約送到後端
// ===========================
async function submitBooking() {
    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const idNumber = document.getElementById("idNumber").value.trim();
    const birthday = document.getElementById("birthday").value.trim();
    const date = document.getElementById("date").value.trim();
    const section = document.getElementById("section").value.trim();
    const doctor = document.getElementById("doctor").value.trim();

    if (!name || !phone || !idNumber || !birthday || !date || !section || !doctor) {
        alert("所有欄位都是必填（姓名、電話、證件、生日、日期、時段、醫師）");
        return;
    }

    const res = await fetch("https://clinic-booking-yb4u.onrender.com/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name,
            phone,
            idNumber,
            birthday,
            date,
            section,
            doctor
        })
    });

    const data = await res.json();

    if (data.error) {
        alert("錯誤：" + data.error);
        return;
    }

    alert("預約成功！\n預約編號：" + data.booking_id);
}
