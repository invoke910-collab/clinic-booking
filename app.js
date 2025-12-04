const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();

const app = express();
app.use(cors());
app.use(express.json());

// 建立 SQLite
const db = new sqlite3.Database("./clinic.db", (err) => {
  if (err) console.error(err.message);
  else console.log("SQLite DB 已連線");
});

// 建立資料表（含身份證、生日、醫師）
db.run(`
  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    idno TEXT NOT NULL,
    birthday TEXT NOT NULL,
    date TEXT NOT NULL,
    section TEXT NOT NULL,
    doctor TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// =============================
//   預約 API
// =============================
app.post("/booking", (req, res) => {
  const { name, phone, idno, birthday, date, section, doctor } = req.body;

  // 必填欄位檢查（新版，前端有 7 欄位）
  if (!name || !phone || !idno || !birthday || !date || !section || !doctor) {
    return res.status(400).json({ error: "必填欄位不足" });
  }

  // 檢查是否同人同時段重複預約
  const checkSQL = `
    SELECT * FROM appointments
    WHERE name=? AND phone=? AND date=? AND section=?
  `;
  db.get(checkSQL, [name, phone, date, section], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });

    if (row) {
      return res.json({
        message: "此人已預約過相同時段",
        conflict: row
      });
    }

    // 寫入資料
    const insertSQL = `
      INSERT INTO appointments (name, phone, idno, birthday, date, section, doctor)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    db.run(
      insertSQL,
      [name, phone, idno, birthday, date, section, doctor],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });

        res.json({
          message: "預約成功",
          booking_id: this.lastID,
          doctor,
          data: { name, phone, date, section }
        });
      }
    );
  });
});

app.listen(3000, () => console.log("後端服務運作中（port 3000）"));
