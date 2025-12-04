// =========================================
//  後端：診所預約 API（最新版）
//  功能：新增身份證、生日、醫師、時段欄位
//  資料庫會自動建立（A：重建模式）
// =========================================

const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const app = express();
app.use(cors());
app.use(express.json());

// SQLite DB 連線
const db = new sqlite3.Database("./clinic.db", (err) => {
  if (err) console.error(err.message);
  else console.log("已連線 SQLite 資料庫 clinic.db");
});

// 建立資料表
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


// ===============================
//  🔥 預約 API（新版）
// ===============================
// 後台取得全部預約資料
app.get("/admin-data", (req, res) => {
  db.all("SELECT * FROM appointments ORDER BY created_at DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/booking", (req, res) => {
  const { name, phone, idNumber, birthday, date, section, doctor } = req.body;

  // 1️⃣ 基本必填驗證
  if (!name || !phone || !idNumber || !birthday || !date || !section || !doctor) {
    return res.status(400).json({ 
      error: "所有欄位都是必填（姓名、電話、證件、生日、日期、時段、醫師）" 
    });
  }

  // 2️⃣ 禁止同一人重複預約相同日期＋時段
  const checkSQL = `
    SELECT * FROM appointments
    WHERE name = ? AND phone = ? AND date = ? AND section = ?
  `;
  db.get(checkSQL, [name, phone, date, section], (err, row) => {
    if (err) {
      return res.status(500).json({ error: "資料庫錯誤：" + err.message });
    }

    if (row) {
      return res.json({
        message: "您已預約過此日期與時段，不可重複預約。",
        conflict: row
      });
    }

    // 3️⃣ 正式寫入資料庫
    const insertSQL = `
      INSERT INTO appointments 
        (name, phone, idNumber, birthday, date, section, doctor)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(
      insertSQL,
      [name, phone, idNumber, birthday, date, section, doctor],
      function (err) {
        if (err) {
          return res.status(500).json({ error: "寫入失敗：" + err.message });
        }

        res.json({
          message: "預約成功！",
          booking_id: this.lastID,
          data: { name, phone, idNumber, birthday, date, section, doctor }
        });
      }
    );
  });
});

// ===============================
//  API 測試首頁
// ===============================
app.get("/", (req, res) => {
  res.send("Clinic booking API is running.");
});

// ===============================
//  啟動伺服器（Render 用）
// ===============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API 已啟動於 Port ${PORT}`);
});

app.get("/admin/all", (req, res) => {
    db.all("SELECT * FROM appointments ORDER BY created_at DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: "DB read error" });
        res.json(rows);
    });
});

app.delete("/admin/delete/:id", (req, res) => {
    const id = req.params.id;
    db.run("DELETE FROM appointments WHERE id = ?", [id], function(err) {
        if (err) return res.status(500).json({ error: "Delete failed" });
        res.json({ success: true });
    });
});
