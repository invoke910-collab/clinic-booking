const API = "https://clinic-booking-yb4u.onrender.com/admin-data";
const ADMIN_PASS = "9100";  // 你設定的後台密碼

function login() {
    let pwd = document.getElementById("password").value;
    if (pwd === ADMIN_PASS) {
        document.getElementById("login").style.display = "none";
        document.getElementById("admin").style.display = "block";
        loadData();
    } else {
        document.getElementById("loginMsg").innerText = "密碼錯誤！";
    }
}

async function loadData() {
    const res = await fetch(API);
    const data = await res.json();

    let tbody = document.querySelector("#dataTable tbody");
    tbody.innerHTML = "";

    data.forEach(row => {
        let tr = document.createElement("tr");
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
        `;
        tbody.appendChild(tr);
    });
}

function exportExcel() {
    let table = document.getElementById("dataTable");
    let wb = XLSX.utils.table_to_book(table, {sheet:"預約資料"});
    XLSX.writeFile(wb, "clinic_booking.xlsx");
}
