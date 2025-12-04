// ===========================================
// admin.js — 後台管理
// ===========================================

const API_URL = "https://clinic-booking-yb4u.onrender.com";
const ADMIN_PASSWORD = "9100";

let currentData = [];

// 密碼確認
function checkPassword() {
  const pwd = document.getElementById("adminPwd").value.trim();
  if (pwd === ADMIN_PASSWORD) {
    document.getElementById("loginBox").style.display = "none";
    document.getElementById("adminPanel").style.display = "block";
    refreshData();
  } else {
    alert("密碼錯誤");
  }
}

// 取得全部預約資料
async function refreshData() {
  try {
    const res = await fetch(`${API_URL}/admin/all`);
    const data = await res.json();
    currentData = data;
    renderTable(data);
  } catch (e) {
    console.error(e);
    alert("讀取資料失敗");
  }
}

// 將 time 轉成中文時段
function timeToLabel(t) {
  if (t === "morning") return "早診（08:00–12:00）";
  if (t === "afternoon") return "午診（14:30–18:00）";
  if (t === "night") return "晚診（18:30–20:00）";
  return t || "";
}

// 繪製表格
function renderTable(list) {
  const tbody = document.getElementById("adminBody");
  tbody.innerHTML = "";

  if (!list || list.length === 0) {
    tbody.innerHTML =
      `<tr><td colspan="10" style="color:#757575;">目前沒有預約資料</td></tr>`;
    return;
  }

  list.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.id}</td>
      <td>${row.name || ""}</td>
      <td>${row.phone || ""}</td>
      <td>${row.id_number || ""}</td>
      <td>${row.birthday || ""}</td>
      <td>${row.date || ""}</td>
      <td>${timeToLabel(row.time)}</td>
      <td>${row.doctor || ""}</td>
      <td>${row.created_at || ""}</td>
      <td>
        <button class="btn danger" style="padding:4px 8px;font-size:12px;"
          onclick="deleteBooking(${row.id})">刪除</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// 刪除預約
async function deleteBooking(id) {
  if (!confirm(`確定要刪除 ID ${id} 這筆預約嗎？`)) return;
  try {
    const res = await fetch(`${API_URL}/admin/delete/${id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (data && data.success) {
      refreshData();
    } else {
      alert("刪除失敗");
    }
  } catch (e) {
    console.error(e);
    alert("刪除失敗");
  }
}

// 匯出成 CSV（Excel 可直接打開）
function exportCSV() {
  if (!currentData || currentData.length === 0) {
    alert("沒有資料可以匯出");
    return;
  }

  const header = [
    "ID",
    "姓名",
    "電話",
    "證件號碼",
    "生日",
    "預約日期",
    "時段",
    "醫師",
    "建立時間",
  ];

  const rows = currentData.map((r) => [
    r.id,
    r.name || "",
    r.phone || "",
    r.id_number || "",
    r.birthday || "",
    r.date || "",
    timeToLabel(r.time),
    r.doctor || "",
    r.created_at || "",
  ]);

  const all = [header, ...rows];

  // **避免亂碼：所有欄位強制以 UTF-8 BOM & CSV-safe 格式輸出**
  const csv = all
    .map((row) =>
      row
        .map((cell) => {
          const s = String(cell).replace(/"/g, '""');
          return `"${s}"`;
        })
        .join(",")
    )
    .join("\r\n");

  // 👇🏻 這裡重點來了：type 明確設定；UTF-8 + BOM
  const blob = new Blob(["\ufeff" + csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "clinic_bookings.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

