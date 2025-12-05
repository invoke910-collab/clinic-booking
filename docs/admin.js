// =========================================
// 順立骨科診所預約 API（最終正式版）
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
// 🔥 後台：取得所有預約資料
// =========================================
app.get("/admin/all", (req, res) => {
  db.all("SELECT * FROM appointments ORDER BY created_at DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: "DB read error" });
    res.json(rows);
  });
});

// =========================================
// 🔥 後台：刪除單筆紀錄
// =========================================
app.delete("/admin/delete/:id", (req, res) => {
  const id = req.params.id;
  db.run("DELETE FROM appointments WHERE id = ?", [id], function (err) {
    if (err) return res.status(500).json({ error: "Delete failed" });
    res.json({ success: true });
  });
});


// =========================================
// 🔥 前台：新增預約（正式版）
// =========================================
app.post("/booking", (req, res) => {
  const { name, phone, id_number, birthday, date, time, doctor } = req.body;

  // 1️⃣ 必填欄位檢查
  if (!name || !phone || !id_number || !birthday || !date || !time || !doctor) {
    return res.status(400).json({
      error: "所有欄位都是必填（姓名、電話、身分證、生日、日期、時段、醫師）"
    });
  }

  // 2️⃣ 禁止同一人預約同一天同時段
  const checkSQL = `
    SELECT * FROM appointments
    WHERE name = ? AND phone = ? AND date = ? AND time = ?
  `;

  db.get(checkSQL, [name, phone, date, time], (err, row) => {
    if (err) {
      return res.status(500).json({ error: "資料庫錯誤：" + err.message });
    }

    if (row) {
      return res.json({
        message: "您已預約過此日期與時段，不可重複預約。",
        conflict: row
      });
    }

    // 3️⃣ 新增預約
    const insertSQL = `
      INSERT INTO appointments 
      (name, phone, id_number, birthday, date, time, doctor)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(
      insertSQL,
      [name, phone, id_number, birthday, date, time, doctor],
      function (err) {
        if (err) return res.status(500).json({ error: "寫入失敗：" + err.message });

        res.json({
          message: "預約成功！",
          booking_id: this.lastID,
          data: { name, phone, id_number, birthday, date, time, doctor }
        });
      }
    );
  });
});


// =========================================
// API 測試首頁
// =========================================
app.get("/", (req, res) => {
  res.send("Clinic booking API is running.");
});

// =========================================
// Render 用固定 PORT
// =========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API 已啟動於 Port ${PORT}`);
});
