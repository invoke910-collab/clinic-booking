// ===============================
// 後台密碼（可自行更改）
// ===============================
const ADMIN_PASSWORD = "9100";

// ===============================
// 後台登入
// ===============================
function loginAdmin() {
    const inputPwd = document.getElementById("adminPassword").value;

    if (inputPwd === ADMIN_PASSWORD) {
        document.getElementById("loginBox").style.display = "none";
        document.getElementById("adminBox").style.display = "block";
        loadData();
    } else {
        alert("密碼錯誤！");
    }
}

// ===============================
// 從 API 載入資料
// ===============================
async function loadData() {
    const apiURL = "https://clinic-booking-yb4u.onrender.com/admin-data";

    try {
        const res = await fetch(apiURL);
        const data = await res.json();
        renderTable(data);
    } catch (err) {
        alert("讀取資料時發生錯誤");
        console.error(err);
    }
}

// ===============================
// 表格渲染
// ===============================
function renderTable(rows) {
    const tbody = document.querySelector("#dataTable tbody");
    tbody.innerHTML = "";

    rows.forEach(item => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${item.id}</td>
            <td>${item.name}</td>
            <td>${item.phone}</td>
            <td>${item.id_number}</td>
            <td>${item.birthday}</td>
            <td>${item.date}</td>
            <td>${translateTime(item.time)}</td>
            <td>${item.doctor}</td>
            <td>${item.created_at}</td>
        `;

        tbody.appendChild(tr);
    });
}

// ===============================
// 時段翻譯
// ===============================
function translateTime(t) {
    const map = {
        "morning": "早診（08:00–12:00）",
        "afternoon": "午診（14:30–18:00）",
        "night": "晚診（18:00–20:00）"
    };
    return map[t] || t;
}

// ===============================
// 匯出 Excel（XLSX 格式不亂碼）
// ===============================
function exportExcel() {
    const table = document.getElementById("dataTable");

    // 將 HTML table 轉為 sheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.table_to_sheet(table);

    XLSX.utils.book_append_sheet(wb, ws, "預約紀錄");

    const filename = "clinic-booking.xlsx";

    XLSX.writeFile(wb, filename);
}

// ===============================
// 重新整理按鈕
// ===============================
function refreshData() {
    loadData();
}
