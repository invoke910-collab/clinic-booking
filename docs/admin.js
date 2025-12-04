// ==============================
//   後台管理（最新版）
//   - 含密碼登入
//   - 含 XLSX 匯出
// ==============================

// 設定後台密碼
const ADMIN_PASSWORD = "9100";

// 後端 API
const API = "https://clinic-booking-yb4u.onrender.com/admin-data";

let currentData = [];

// ==============================
// ► 密碼登入
// ==============================
function checkLogin() {
    const input = document.getElementById("pwd").value;

    if (input === ADMIN_PASSWORD) {
        document.getElementById("loginBox").style.display = "none";
        document.getElementById("adminPanel").style.display = "block";
        loadData();
    } else {
        document.getElementById("loginErr").innerText = "密碼錯誤！";
    }
}

// ==============================
// ► 後端取得全部資料
// ==============================
async function loadData() {
    try {
        const res = await fetch(API);
        currentData = await res.json();
        renderTable();
    } catch (e) {
        alert("資料讀取失敗，請稍後再試");
    }
}

// ==============================
// ► 渲染表格
// ==============================
function renderTable() {
    const tbody = document.getElementById("tbody");
    tbody.innerHTML = "";

    currentData.forEach(r => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${r.id}</td>
            <td>${r.name}</td>
            <td>${r.phone}</td>
            <td>${r.id_number}</td>
            <td>${r.birthday}</td>
            <td>${r.date}</td>
            <td>${timeToLabel(r.time)}</td>
            <td>${r.doctor}</td>
            <td>${r.created_at}</td>
        `;
        tbody.appendChild(tr);
    });
}

function timeToLabel(t) {
    if (t === "morning") return "早診（08:00–12:00）";
    if (t === "afternoon") return "午診（14:30–18:00）";
    if (t === "night") return "晚診（18:30–20:00）";
    return t;
}

// ==============================
// ► 匯出 Excel (.xlsx)
// ==============================
function exportXLSX() {
    if (!currentData.length) {
        alert("沒有資料可匯出");
        return;
    }

    const header = [
        ["ID", "姓名", "電話", "證件號碼", "生日", "預約日期", "時段", "醫師", "建立時間"]
    ];

    const body = currentData.map(r => [
        r.id,
        r.name,
        r.phone,
        r.id_number,
        r.birthday,
        r.date,
        timeToLabel(r.time),
        r.doctor,
        r.created_at
    ]);

    const sheetData = [...header, ...body];

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "預約資料");

    XLSX.writeFile(wb, "clinic_booking.xlsx");
}
