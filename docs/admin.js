// ==============================
//   後台管理 JS （最新版）
//   - 支援 XLSX 匯出
//   - 中文完全不亂碼
//   - 手機/電腦都能下載
// ==============================

// 後端 API
const API = "https://clinic-booking-yb4u.onrender.com/admin-data";

let currentData = [];

// 取得全部資料
async function loadData() {
    try {
        const res = await fetch(API);
        currentData = await res.json();
        renderTable();
    } catch (e) {
        alert("無法取得資料，請稍後再試");
    }
}

// 渲染表格
function renderTable() {
    const tbody = document.getElementById("tbody");
    tbody.innerHTML = "";

    currentData.forEach((r) => {
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

// 時段顯示中文
function timeToLabel(t) {
    if (t === "morning") return "早診（08:00–12:00）";
    if (t === "afternoon") return "午診（14:30–18:00）";
    if (t === "night") return "晚診（18:30–20:00）";
    return t;
}

// ==============================
//   匯出 XLSX（Excel 專用格式）
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

// ==============================
//   初始化
// ==============================
loadData();
