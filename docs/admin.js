const API = "https://clinic-booking-yb4u.onrender.com";

// ======================================
// 重新整理按鈕
// ======================================
async function reloadData() {
    try {
        const res = await fetch(`${API}/admin/all`);
        const list = await res.json();
        
        renderTable(list);
    } catch (e) {
        alert("讀取資料時發生錯誤");
    }
}


// ======================================
// 顯示表格
// ======================================
function renderTable(data) {
    const tbody = document.getElementById("tbody");
    tbody.innerHTML = "";

    data.forEach(row => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${row.id}</td>
            <td>${row.name}</td>
            <td>${row.phone}</td>
            <td>${row.id_number}</td>
            <td>${row.birthday}</td>
            <td>${row.date}</td>
            <td>${row.time}</td>
            <td>${row.doctor}</td>
            <td>${row.created_at}</td>
            <td><button onclick="del(${row.id})">刪除</button></td>
        `;

        tbody.appendChild(tr);
    });
}


// ======================================
// 刪除單筆
// ======================================
async function del(id) {
    if (!confirm("確定刪除？")) return;

    await fetch(`${API}/admin/delete/${id}`, { method: "DELETE" });
    reloadData();
}

window.onload = reloadData;
