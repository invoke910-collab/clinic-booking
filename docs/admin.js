const API = "https://clinic-booking-yb4u.onrender.com";

// ⭐ 後台密碼
const ADMIN_PASS = "9100";

// ⭐ 每次重新整理都會：
// 1. 清除昨天以前的資料
// 2. 重新取得最新資料
async function loadData() {
    try {
        // 執行清除資料（但若後端無此 API 也不報錯）
        await fetch(API + "/admin/clean-old").catch(()=>{});

        // 取得最新資料
        const res = await fetch(API + "/admin/all");

        if (!res.ok) throw new Error("API 錯誤");

        const data = await res.json();
        renderTable(data);

    } catch (err) {
        console.log("Render 後端尚未喚醒，將在 2 秒後重試…");
        setTimeout(loadData, 2000); // ⭐ 2 秒後自動重試，避免 alert
    }
}


// ⭐ 將資料渲染到表格
function renderTable(list) {
    const tbody = document.getElementById("tbody");
    tbody.innerHTML = "";

    list.forEach(item => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${item.id}</td>
            <td>${item.name}</td>
            <td>${item.phone}</td>
            <td>${item.id_number}</td>
            <td>${item.birthday}</td>
            <td>${item.date}</td>
            <td>${item.time}</td>
            <td>${item.doctor}</td>
            <td>${item.created_at}</td>
            <td>
                <button class="delBtn" onclick="deleteData(${item.id})">刪除</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}


// ⭐ 刪除資料
async function deleteData(id) {
    if (!confirm("確定要刪除此筆資料？")) return;

    await fetch(API + "/admin/delete/" + id, { method: "DELETE" });
    loadData();
}


// ⭐ 登入功能
function login() {
    const input = document.getElementById("pwd").value;
    if (input === ADMIN_PASS) {
        document.getElementById("loginBox").style.display = "none";
        document.getElementById("adminPanel").style.display = "block";
        loadData();
    } else {
        alert("密碼錯誤");
    }
}

document.getElementById("refreshBtn").addEventListener("click", loadData);
document.getElementById("exportBtn").addEventListener("click", exportExcel);


// ⭐ 產生 Excel
function exportExcel() {
    const table = document.getElementById("dataTable");
    const wb = XLSX.utils.table_to_book(table, {sheet:"預約資料"});
    XLSX.writeFile(wb, "clinic-booking.xlsx");
}
