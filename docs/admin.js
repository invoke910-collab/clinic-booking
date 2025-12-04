const API_URL = "https://clinic-booking-yb4u.onrender.com";

// 固定班表 & 星期排班
const schedule = {
    1: { morning:["吳立偉院長","郭芷毓醫師"], afternoon:["林峻豪副院長"], night:["林峻豪副院長"] },
    2: { morning:["林峻豪副院長"], afternoon:["郭芷毓醫師"], night:["吳立偉院長","郭芷毓醫師"] },
    3: { morning:["吳立偉院長","郭芷毓醫師"], afternoon:["黃俞華副院長"], night:["黃俞華副院長"] },
    4: { morning:["吳立偉院長"], afternoon:["林峻豪副院長"], night:["吳立偉院長"] },
    5: { morning:["林峻豪副院長","郭芷毓醫師"], afternoon:["郭芷毓醫師"], night:["林峻豪副院長"] },
    6: {} // 週六依日期
};

// 週六：固定日期排班
function getSaturdayDoctor(dateStr){
    const d = new Date(dateStr);
    const day = d.getDate();

    if([6,20].includes(day)) return ["劉俊良醫師"];
    if([13,27].includes(day)) return ["林峻豪副院長"];
    return [];
}

document.getElementById("time").addEventListener("change", loadDoctors);
document.getElementById("date").addEventListener("change", loadDoctors);

function loadDoctors() {
    const date = document.getElementById("date").value;
    const time = document.getElementById("time").value;
    const doctorSelect = document.getElementById("doctor");

    doctorSelect.innerHTML = "<option value=''>請選擇醫師</option>";
    if(!date || !time) return;

    const weekday = new Date(date).getDay();
    let doctors = [];

    if(weekday === 6){
        doctors = getSaturdayDoctor(date);
    } else {
        doctors = schedule[weekday]?.[time] || [];
    }

    doctors.forEach(d => {
        const opt = document.createElement("option");
        opt.value = d;
        opt.textContent = d;
        doctorSelect.appendChild(opt);
    });

    updateSummary();
}

function updateSummary(){
    const doctor = document.getElementById("doctor").value;
    const box = document.getElementById("summary");

    if(doctor){
        box.innerHTML = `本日門診醫師：<b>${doctor}</b>`;
    } else {
        box.innerHTML = "";
    }
}

async function submitBooking(){
    const data = {
        name: document.getElementById("name").value,
        phone: document.getElementById("phone").value,
        id_number: document.getElementById("id_number").value,
        birthday: document.getElementById("birthday").value,
        date: document.getElementById("date").value,
        time: document.getElementById("time").value,
        doctor: document.getElementById("doctor").value,
    };

    if(Object.values(data).includes("")){
        alert("所有欄位都是必填！");
        return;
    }

    const res = await fetch(API_URL + "/booking", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify(data)
    });

    const result = await res.json();
    alert(result.message);
}
