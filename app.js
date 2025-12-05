// =========================================
// 順立骨科診所預約 API（最終修正版）
// - 完整防止重複預約
// - 後台自動清除過期資料（今天以前）
// =========================================

const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();

const app = express();
app.use(cors());
app.use(express.json());

// =========================================
// 連線 SQLite
// =========================================
const db = new sqlite3.Database("./clinic.db", (err) => {
  if (err) console.error(err.message);
  else console.log("已連線 SQLite 資料庫 clinic.db");
});

// =========================================
// 建立資料表（不存在才建立）
// =========================================
db.run(`
  CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      id_number TEXT NOT NULL,
      birthday TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      doctor TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);


// =========================================
// 🔥 自動清除今天以前的資料（保留今天）
// =========================================
function cleanOldData() {
  const today = new Date().toISOString().split("T")[0];

  db.run(
    `DELETE FROM appointments WHERE date < ?`,
    [today],
    function (err) {
      if (err) console.log("清理舊資料失敗：", err.message);
      else console.log("舊資料已清除，保留今天：", today);
    }
  );
}


// =========================================
// 🔥 後台讀取所有資料（自動清除過期）
// =========================================
app.get("/admin/all", (req, res) => {
  cleanOldData();

  db.all("SELECT * FROM appointments ORDER BY created_at DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: "DB read error" });
    res.json(rows);
  });
});


// =========================================
// 🔥 刪除單筆
// =========================================
app.delete("/admin/delete/:id", (req, res) => {
  const id = req.params.id;
  db.run("DELETE FROM appointments WHERE id = ?", [id], function (err) {
    if (err) return res.status(500).json({ error: "Delete failed" });
    res.json({ success: true });
  });
});


// =========================================
// 🔥 前台預約（強化後的防重複版本）
// =========================================
app.post("/booking", (req, res) => {
  const { name, phone, id_number, birthday, date, time, doctor } = req.body;

  // 必填驗證
  if (!name || !phone || !id_number || !birthday || !date || !time || !doctor) {
    return res.status(400).json({
      error: "所有欄位都是必填（姓名、電話、身分證、生日、日期、時段、醫師）"
    });
  }

  // 🔒 完整防重複：以 (姓名 + 電話 + 日期 + 時段 + 醫師) 為判定
  const checkSQL = `
    SELECT * FROM appointments
    WHERE name = ? AND phone = ? AND date = ? AND time = ? AND doctor = ?
  `;

  db.get(checkSQL, [name, phone, date, time, doctor], (err, row) => {
    if (err) return res.status(500).json({ error: "資料庫錯誤：" + err.message });

    if (row) {
      return res.json({
        status: "duplicate",
        message: "您已預約過此日期與時段（相同醫師），不可重複預約。",
        conflict: row
      });
    }

    // 新增預約
    const insertSQL = `
      INSERT INTO appointments 
      (name, phone, id_number, birthday, date, time, doctor)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(insertSQL,
      [name, phone, id_number, birthday, date, time, doctor],
      function (err) {
        if (err) return res.status(500).json({ error: "寫入失敗：" + err.message });

        res.json({
          status: "success",
          message: "預約成功！",
          booking_id: this.lastID
        });
      }
    );
  });
});


// =========================================
// API 首頁測試
// =========================================
app.get("/", (req, res) => {
  res.send("Clinic booking API is running.");
});


// =========================================
// Render PORT
// =========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API 已啟動於 Port ${PORT}`);
});
