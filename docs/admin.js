const API_URL = "https://clinic-booking-yb4u.onrender.com";
const ADMIN_PASSWORD = "9100";

// 登入檢查
function checkLogin() {
  const pwdInput = document.getElementById("adminPwd");
  const msg = document.getElementById("loginErr");
  if (pwdInput.value === ADMIN_PASSWORD) {
    document.getElementById("loginBox").style.display = "none";
    document.getElementById("adminPanel").style.display = "block";
    loadData();
  } else {
    msg.textContent = "密碼錯誤，請再試一次。";
  }
}

// 重新整理
function reloadData() {
  loadData();
}

// 讀取後端預約資料
async function loadData() {
  const tbody = document.getElementById("dataBody");
  tbody.innerHTML = "<tr><td colspan='10'>讀取中...</td></tr>";

  try {
    const res = await fetch(`${API_URL}/admin-data`);
    const list = await res.json();

    if (!Array.isArray(list) || list.length === 0) {
      tbody.innerHTML = "<tr><td colspan='10'>目前沒有任何預約資料。</td></tr>";
      return;
    }

    tbody.innerHTML = list.map(row => `
      <tr>
        <td>${row.id}</td>
        <td>${row.name}</td>
        <td>${row.phone}</td>
        <td>${row.id_number}</td>
        <td>${row.birthday}</td>
        <td>${row.date}</td>
        <td>${row.time}</td>
        <td>${row.doctor}</td>
        <td>${row.created_at || ""}</td>
        <td><button onclick="deleteRow(${row.id})">刪除</button></td>
      </tr>
    `).join("");

  } catch (e) {
    console.error(e);
    tbody.innerHTML = "<tr><td colspan='10'>讀取失敗，請稍後再試。</td></tr>";
  }
}

// 刪除單筆資料
async function deleteRow(id) {
  if (!confirm(`確定要刪除 ID=${id} 這筆預約嗎？`)) return;

  try {
    const res = await fetch(`${API_URL}/admin/delete/${id}`, {
      method: "DELETE"
    });
    const result = await res.json();
    if (result && result.success) {
      alert("刪除成功！");
      loadData();
    } else {
      alert("刪除失敗，請稍後再試。");
    }
  } catch (e) {
    console.error(e);
    alert("刪除失敗，請稍後再試。");
  }
}

// 匯出 Excel（實際為 CSV，Excel 可直接開啟）
function exportExcel() {
  const table = document.querySelector("table");
  let csv = "";

  for (let i = 0; i < table.rows.length; i++) {
    const cells = table.rows[i].cells;
    let row = [];
    for (let j = 0; j < cells.length - 1; j++) { // 最後一欄是「刪除」不匯出
      let text = cells[j].innerText.replace(/"/g, '""');
      row.push(`"${text}"`);
    }
    csv += row.join(",") + "\n";
  }

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "appointments.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
