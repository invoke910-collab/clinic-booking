// ===============================
// Supabase 初始化（與前台共用同一組）
// ===============================
const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_KEY = "YOUR_SUPABASE_ANON_KEY";

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// 後台登入密碼
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
// 清除今天以前的資料（保留今天）
// ===============================
async function cleanOld() {
    const today = new Date().toISOString().split("T")[0];
    await db
        .from("appointments")
        .delete()
        .lt("date", today);
}

// ===============================
// 載入資料
// ===============================
async function loadData() {
    await cleanOld();

    const { data, error } = await db
        .from("appointments")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        alert("讀取資料失敗，請稍後再試");
        return;
    }

    renderTable(data || []);
}

// ===============================
// 表格渲染
// ===============================
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
            <td><button class="delBtn" onclick="deleteRow(${item.id})">刪除</button></td>
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
document.getElementById("exportBtn").addEventListener("click", () => {
    const table = document.getElementById("dataTable");
    const wb = XLSX.utils.table_to_book(table, { sheet: "預約資料" });
    XLSX.writeFile(wb, "clinic-booking.xlsx");
});

document.getElementById("refreshBtn").addEventListener("click", loadData);
