// ==================================================
// 順立骨科 admin.js（Supabase + 密碼登入 + 匯出 XLSX）
// ==================================================

// ---- 後台密碼 ----
const ADMIN_PASSWORD = "9100";

// ---- Supabase 設定 ----
const SUPABASE_URL = "https://fjqsrhnwssazcqvjdqqt.supabase.co";
const SUPABASE_KEY = "在這裡貼上你自己的 sb-publishable key"; // 一定要換成你自己的那串

const { createClient } = window.supabase;
const supa = createClient(SUPABASE_URL, SUPABASE_KEY);

// ---- DOM ----
const loginMask = document.getElementById("loginMask");
const adminMain = document.getElementById("adminMain");
const loginBtn = document.getElementById("loginBtn");
const loginError = document.getElementById("loginError");
const pwInput = document.getElementById("adminPassword");

const btnRefresh = document.getElementById("btnRefresh");
const btnExport = document.getElementById("btnExport");
const dataBody = document.getElementById("dataBody");

let currentData = [];

// ==================================================
// 登入邏輯
// ==================================================
loginBtn.addEventListener("click", () => {
  const pw = pwInput.value.trim();
  if (!pw) {
    loginError.textContent = "請先輸入密碼";
    return;
  }
  if (pw !== ADMIN_PASSWORD) {
    loginError.textContent = "密碼錯誤，請再試一次。";
    pwInput.value = "";
    pwInput.focus();
    return;
  }

  // 登入成功
  loginError.textContent = "";
  loginMask.style.display = "none";
  adminMain.style.display = "block";
  loadData();
});

// 按 Enter 也可登入
pwInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") loginBtn.click();
});

// ==================================================
// 讀取資料
// ==================================================
async function loadData() {
  dataBody.innerHTML = `<tr><td class="text-center" colspan="9">讀取資料中...</td></tr>`;

  const { data, error } = await supa
    .from("appointments")
    .select("*")
    .order("date", { ascending: true })
    .order("time", { ascending: true });

  if (error) {
    console.error(error);
    dataBody.innerHTML = `<tr><td class="text-center" colspan="9">讀取資料時發生錯誤</td></tr>`;
    return;
  }

  currentData = data || [];
  if (!currentData.length) {
    dataBody.innerHTML = `<tr><td class="text-center" colspan="9">目前尚無任何預約紀錄</td></tr>`;
    return;
  }

  let html = "";
  currentData.forEach((row) => {
    html += `
      <tr>
        <td class="text-center">${row.id}</td>
        <td>${escapeHtml(row.name)}</td>
        <td>${escapeHtml(row.phone)}</td>
        <td>${escapeHtml(row.id_number)}</td>
        <td>${escapeHtml(row.birthday)}</td>
        <td>${escapeHtml(row.date)}</td>
        <td>${escapeHtml(row.time)}</td>
        <td>${escapeHtml(row.doctor)}</td>
        <td>${row.created_at ? escapeHtml(row.created_at) : ""}</td>
      </tr>
    `;
  });

  dataBody.innerHTML = html;
}

// 簡單的 HTML escape
function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ==================================================
// 匯出 Excel（使用 XLSX）
// ==================================================
function exportExcel() {
  if (!currentData || !currentData.length) {
    alert("目前沒有資料可以匯出。");
    return;
  }

  // 轉成比較友善欄位名稱
  const exportRows = currentData.map((r) => ({
    ID: r.id,
    姓名: r.name,
    電話: r.phone,
    證件號碼: r.id_number,
    生日: r.birthday,
    日期: r.date,
    時段: r.time,
    醫師: r.doctor,
    建立時間: r.created_at
  }));

  const ws = XLSX.utils.json_to_sheet(exportRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "預約紀錄");

  XLSX.writeFile(wb, "順立骨科診所_線上預約紀錄.xlsx");
}

// ==================================================
// 按鈕事件
// ==================================================
btnRefresh.addEventListener("click", loadData);
btnExport.addEventListener("click", exportExcel);