const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();

const app = express();
app.use(cors());
app.use(express.json());

// 建立 SQLite
const db = new sqlite3.Database("./clinic.db", (err) => {
  if (err) console.error(err.message);
  else console.log("SQLite 資料庫連線成功");
});

// 建立資料表（含新欄位）
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

// ===========================
//   預約 API
// ===========================
app.post("/booking", (req, res) => {
  const { name, phone, idno, birthday, date, section } = req.body;

  // 欄位完整性檢查
  if (!name || !phone || !idno || !birthday || !date || !section) {
    return res.status(400).json({ error: "必填欄位不足" });
  }

  // 取得星期（排班使用）
  const weekday = new Date(date).getDay();
  const schedule = {
    1: { morning: "吳立偉 / 郭芷毓", noon: "林峻豪", night: "林峻豪" },
    2: { morning: "林峻豪", noon: "郭芷毓", night: "吳立偉 / 郭芷毓" },
    3: { morning: "吳立偉 / 郭芷毓", noon: "黃前華", night: "黃前華" },
    4: { morning: "吳立偉", noon: "林峻豪", night: "林峻豪" },
    5: { morning: "林峻豪", noon: "郭芷毓", night: "郭芷毓" },
    6: { morning: "劉俊良（輪值）", noon: "林峻豪（輪值）", night: "休診" },
    0: { morning: "休診", noon: "休診", night: "休診" }
  };

  const doctor = schedule[weekday][section];

  // 不可預約休診時段
  if (doctor === "休診") {
    return res.status(400).json({ error: "該日期與時段無門診" });
  }

  // 不可同姓名＋同電話＋同日期＋同時段 重複預約
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

    db.run(insertSQL, 
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

app.listen(3000, () => console.log("後端運作於 port 3000"));
