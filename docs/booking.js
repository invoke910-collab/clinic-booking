//-----------------------------------------
// 禁止選今天以前日期
//-----------------------------------------
const today = new Date().toISOString().split("T")[0];
document.getElementById("date").setAttribute("min", today);

//-----------------------------------------
// 時段 → 醫師排班（含週六輪值）
//-----------------------------------------
async function loadSchedule() {
    const res = await fetch("schedule.json");
    return res.json();
}

let schedule = {};
loadSchedule().then(data => schedule = data);

//-----------------------------------------
// 時段變動 → 更新醫師
//-----------------------------------------
document.getElementById("time").addEventListener("change", updateDoctor);

function updateDoctor() {
    const time = document.getElementById("time").value;
    const date = document.getElementById("date").value;

    let doctorSelect = document.getElementById("doctor");
    doctorSelect.innerHTML = '<option value="">請選擇醫師</option>';

    if (!time || !date) return;

    const week = new Date(date).getDay();
    let doctorList = [];

    if (week === 6) {
        //-------------------
        // 週六輪值
        //-------------------
        const list = schedule.saturday;
        const order = list.order;
        const first = order[0], second = order[1];

        const thisDate = new Date(date);
        const day = thisDate.getDate();

        // 奇數週六 → 第一位醫師
        // 偶數週六 → 第二位醫師
        const doc = (day % 2 === 1 ? list[first] : list[second]);
        doctorList.push(doc);

    } else {
        //-------------------
        // 平日
        //-------------------
        doctorList = schedule.week[week][time];
    }

    doctorList.forEach(d => {
        const op = document.createElement("option");
        op.value = d;
        op.textContent = d;
        doctorSelect.appendChild(op);
    });

    document.getElementById("summary").innerHTML = 
        `本日門診醫師：<strong>${doctorList.join("、")}</strong>`;
}

//-----------------------------------------
// 送出預約
//-----------------------------------------
async function submitBooking() {

    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const id_number = document.getElementById("id_number").value.trim();
    const birthday = document.getElementById("birthday").value;
    const date = document.getElementById("date").value;
    const time = document.getElementById("time").value;
    const doctor = document.getElementById("doctor").value;

    if (!name || !phone || !id_number || !birthday || !date || !time || !doctor) {
        document.getElementById("err").textContent = "所有欄位皆必填！";
        return;
    }

    const body = { name, phone, id_number, birthday, date, time, doctor };

    let res = await fetch("https://clinic-booking-yb4u.onrender.com/booking", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(body)
    });

    res = await res.json();

    if (res.error) {
        document.getElementById("err").textContent = "寫入失敗：" + res.error;
        return;
    }

    //-----------------------------------------
    // Popup 顯示
    //-----------------------------------------
    const timeLabel = {
        morning: "早診（08:00–12:00）",
        afternoon: "午診（14:30–18:00）",
        night: "晚診（18:30–20:00）"
    };

    document.getElementById("popupDetails").innerHTML = `
        <div style="font-size:16px;line-height:1.8;text-align:left;margin-top:10px;">
            <strong>姓名：</strong>${name}<br>
            <strong>日期：</strong>${date}<br>
            <strong>時段：</strong>${timeLabel[time]}<br>
            <strong>醫師：</strong>${doctor}
        </div>
    `;

    document.getElementById("successPopup").style.display = "flex";
}

//-----------------------------------------
function closePopup() {
    document.getElementById("successPopup").style.display = "none";
}
