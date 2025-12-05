// ===============================
// Supabase 初始化
// ===============================
const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_KEY = "YOUR_SUPABASE_ANON_KEY";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 後台密碼
const ADMIN_PASS = "9100";


// ===============================
// 登入
// ===============================
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


// ===============================
// 清除過期資料（今天以前）
// ===============================
async function cleanOld() {
    const today = new Date().toISOString().split("T")[0];

    await db
        .from("appointments")
        .delete()
        .lt("date", today);
}


// ===============================
// 讀取資料
// ===============================
async function loadData() {
    await cleanOld();

    const { data } = await db
        .from("appointments")
        .select("*")
        .order("created_at", { ascending: false });

    renderTable(data);
}


// ===============================
// 渲染表格
// ===============================
function renderTable(rows) {
    const tbody = document.getElementById("tbody");
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
          <td><button class="delBtn" onclick="deleteRow(${r.id})">刪除</button></td>
        `;
        tbody.appendChild(tr);
    });
}


// ===============================
// 刪除單筆
// ===============================
async function deleteRow(id) {
    if (!confirm("確定要刪除此筆資料？")) return;

    await db.from("appointments").delete().eq("id", id);
    loadData();
}


// ===============================
// 匯出 Excel
// ===============================
document.getElementById("exportBtn").addEventListener("click", function () {
    const table = document.getElementById("dataTable");
    const wb = XLSX.utils.table_to_book(table, { sheet: "預約資料" });
    XLSX.writeFile(wb, "clinic_booking.xlsx");
});

document.getElementById("refreshBtn").addEventListener("click", loadData);
