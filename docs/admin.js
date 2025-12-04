// ====== 基本設定 ======
const API_BASE = "https://clinic-booking-yb4u.onrender.com";
const ADMIN_PASSWORD = "9100";

const loginCard = document.getElementById("loginCard");
const adminCard = document.getElementById("adminCard");
const passwordInput = document.getElementById("passwordInput");
const loginBtn = document.getElementById("loginBtn");
const loginStatus = document.getElementById("loginStatus");

const refreshBtn = document.getElementById("refreshBtn");
const exportBtn = document.getElementById("exportBtn");
const dataBody = document.getElementById("dataBody");
const dataStatus = document.getElementById("dataStatus");

let currentData = [];

// ====== 登入處理 ======
loginBtn.addEventListener("click", handleLogin);
passwordInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleLogin();
});

function handleLogin() {
  const pwd = passwordInput.value.trim();
  if (!pwd) {
    loginStatus.textContent = "請先輸入密碼。";
    loginStatus.style.color = "#d32f2f";
    return;
  }

  if (pwd !== ADMIN_PASSWORD) {
    loginStatus.textContent = "密碼錯誤，請再試一次。";
    loginStatus.style.color = "#d32f2f";
    passwordInput.select();
    return;
  }

  loginStatus.textContent = "登入成功，正在載入資料…";
  loginStatus.style.color = "#388e3c";

  loginCard.classList.add("hidden");
  adminCard.classList.remove("hidden");

  loadData();
}

// ====== 讀取資料 ======
async function loadData() {
  dataStatus.textContent = "資料載入中…";
  dataStatus.style.color = "#546e7a";
  dataBody.innerHTML = "";

  try {
    const res = await fetch(`${API_BASE}/admin/all`);
    const rows = await res.json();
    currentData = Array.isArray(rows) ? rows : [];

    if (!currentData.length) {
      dataBody.innerHTML =
        '<tr><td colspan="10" style="text-align:center;">目前尚無預約資料</td></tr>';
      dataStatus.textContent = "0 筆預約資料。";
      dataStatus.style.color = "#546e7a";
      return;
    }

    renderTable(currentData);
    dataStatus.textContent = `共 ${currentData.length} 筆預約資料。`;
    dataStatus.style.color = "#546e7a";
  } catch (err) {
    console.error(err);
    dataBody.innerHTML =
      '<tr><td colspan="10" style="text-align:center;color:#d32f2f;">無法載入資料，請稍後再試。</td></tr>';
    dataStatus.textContent = "讀取失敗。";
    dataStatus.style.color = "#d32f2f";
  }
}

function renderTable(rows) {
  dataBody.innerHTML = "";
  rows.forEach((r) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${r.id ?? ""}</td>
      <td>${r.name ?? ""}</td>
      <td>${r.phone ?? ""}</td>
      <td>${r.id_number ?? ""}</td>
      <td>${r.birthday ?? ""}</td>
      <td>${r.date ?? ""}</td>
      <td>${r.time ?? ""}</td>
      <td>${r.doctor ?? ""}</td>
      <td>${r.created_at ?? ""}</td>
      <td>
        <button class="btn btn-danger btn-sm" data-id="${r.id}">刪除</button>
      </td>
    `;
    dataBody.appendChild(tr);
  });

  // 綁定刪除按鈕
  dataBody.querySelectorAll("button[data-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      if (!id) return;
      if (confirm(`確定要刪除編號 #${id} 的預約紀錄嗎？`)) {
        deleteRow(id);
      }
    });
  });
}

// ====== 刪除資料 ======
async function deleteRow(id) {
  try {
    const res = await fetch(`${API_BASE}/admin/delete/${id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error("刪除失敗");
    }
    await loadData();
  } catch (err) {
    console.error(err);
    alert("刪除失敗，請稍後再試。");
  }
}

// ====== 匯出 Excel (xlsx) ======
function exportExcel() {
  if (!currentData || !currentData.length) {
    alert("目前沒有資料可匯出。");
    return;
  }

  // 將欄位名稱改成中文表頭
  const exportRows = currentData.map((r) => ({
    ID: r.id ?? "",
    姓名: r.name ?? "",
    電話: r.phone ?? "",
    "身分證／護照": r.id_number ?? "",
    生日: r.birthday ?? "",
    日期: r.date ?? "",
    時段: r.time ?? "",
    醫師: r.doctor ?? "",
    建立時間: r.created_at ?? "",
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(exportRows);
  XLSX.utils.book_append_sheet(wb, ws, "預約紀錄");

  XLSX.writeFile(wb, "clinic-booking-appointments.xlsx");
}

// ====== 按鈕事件 ======
refreshBtn.addEventListener("click", loadData);
exportBtn.addEventListener("click", exportExcel);
