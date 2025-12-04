// =====================
// 後台密碼設定（可修改）
// =====================
const ADMIN_PASSWORD = "9100";

// =====================
// 後台登入檢查
// =====================
function checkLogin() {
    const pwd = document.getElementById("adminPwd").value;
    const msg = document.getElementById("loginMsg");

    if (pwd === ADMIN_PASSWORD) {
        document.getElementById("loginBox").style.display = "none";
        document.getElementById("adminPanel").style.display = "block";
        loadData();
    } else {
        msg.innerText = "密碼錯誤！";
    }
}

// =========================
// 讀取預約資料（API）
// =========================
function loadData() {
    fetch("https://clinic-booking-yb4u.onrender.com/admin-data")
        .then(res => res.json())
        .then(rows => {
            const tbody = document.querySelector("#dataTable tbody");
            tbody.innerHTML = "";

            rows.forEach(r => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${r.id}</td>
                    <td>${r.name}</td>
                    <td>${r.phone}</td>
                    <td>${r.id_number}</td>
                    <td>${r.birthday}</td>
                    <td>${r.date}</td>
                    <td>${r.time}</td>
                    <td>${r.doctor}</td>
                    <td>${r.created_at}</td>
                    <td><button onclick="deleteRow(${r.id})">刪除</button></td>
                `;
                tbody.appendChild(tr);
            });
        });
}

// =========================
// 刪除資料
// =========================
function deleteRow(id) {
    if (!confirm("確定要刪除這筆資料？")) return;

    fetch(`https://clinic-booking-yb4u.onrender.com/admin/delete/${id}`, {
        method: "DELETE"
    })
    .then(res => res.json())
    .then(data => {
        loadData();
    });
}

// =========================
// 匯出 Excel（xlsx）
// =========================
function exportExcel() {
    fetch("https://clinic-booking-yb4u.onrender.com/admin-data")
        .then(res => res.json())
        .then(rows => {
            const sheet = XLSX.utils.json_to_sheet(rows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, sheet, "Appointments");

            XLSX.writeFile(wb, "clinic_booking.xlsx");
        });
}
