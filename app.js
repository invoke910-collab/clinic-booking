// app.js －－診所預約 API + 後台管理

const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = process.env.PORT || 3000;

// === 後台登入密碼 ===
const ADMIN_PASSWORD = "9100";

// 啟用 CORS ＋ JSON
app.use(cors());
app.use(express.json());

// =========================
//  SQLite 資料庫連線與建表
// =========================
const db = new sqlite3.Database("./clinic.db", (err) => {
  if (err) {
    console.error("資料庫連線失敗：", err.message);
  } else {
    console.log("已連線 SQLite 資料庫 clinic.db");
  }
});

// 若無表則建立（新欄位版）
db.run(
  `
  CREATE TABLE IF NOT EXISTS appointments (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT NOT NULL,
    phone     TEXT NOT NULL,
    idno      TEXT NOT NULL,
    birthday  TEXT NOT NULL,
    date      TEXT NOT NULL,
    section   TEXT NOT NULL,   -- morning / noon / night
    doctor    TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`,
  (err) => {
    if (err) console.error("建立資料表錯誤：", err.message);
  }
);

// =========================
//  工具：台灣身分證驗證
// =========================
function validateTWID(id) {
  return /^[A-Z][12][0-9]{8}$/i.test(id);
}

// =========================
//  前台預約 API
// =========================

// 健康檢查用
app.get("/", (req, res) => {
  res.send("Clinic booking API is running.");
});

// 建立預約
app.post("/booking", (req, res) => {
  const { name, phone, idno, birthday, date, section, doctor } = req.body || {};

  // 1. 基本必填檢查
  if (!name || !phone || !idno || !birthday || !date || !section || !doctor) {
    return res.status(400).json({ error: "所有欄位皆為必填" });
  }

  // 2. 若看起來像台灣身分證，做格式驗證
  if (/^[A-Z]/i.test(idno) && !validateTWID(idno)) {
    return res.status(400).json({ error: "身分證格式不正確" });
  }

  // 3. 檢查同一個人（姓名+電話）是否已在同日期＋同診別預約
  const checkSQL = `
    SELECT id FROM appointments
    WHERE name = ? AND phone = ? AND date = ? AND section = ?
  `;
  db.get(checkSQL, [name, phone, date, section], (err, row) => {
    if (err) {
      console.error("查詢重複預約錯誤：", err);
      return res.status(500).json({ error: "伺服器錯誤，請稍後再試" });
    }

    if (row) {
      return res.status(400).json({
        error: "您已預約過相同日期與診別，請勿重複預約。"
      });
    }

    // 4. 寫入資料
    const insertSQL = `
      INSERT INTO appointments
        (name, phone, idno, birthday, date, section, doctor)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    db.run(
      insertSQL,
      [name, phone, idno, birthday, date, section, doctor],
      function (err2) {
        if (err2) {
          console.error("寫入預約錯誤：", err2);
          return res.status(500).json({ error: "伺服器錯誤，請稍後再試" });
        }

        return res.json({
          message: "預約成功！",
          booking_id: this.lastID
        });
      }
    );
  });
});

// =========================
//  後台用：密碼驗證 middleware
// =========================
function checkAdmin(req, res, next) {
  const pw = req.headers["x-admin-password"];
  if (pw !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "未授權，請重新登入" });
  }
  next();
}

// =========================
//  後台登入（檢查密碼）
// =========================
app.post("/admin/login", (req, res) => {
  const { password } = req.body || {};
  if (password === ADMIN_PASSWORD) {
    return res.json({ ok: true });
  }
  return res.status(401).json({ error: "密碼錯誤" });
});

// =========================
//  後台：查詢預約列表
//  GET /admin/appointments?keyword=&date=&doctor=
// =========================
app.get("/admin/appointments", checkAdmin, (req, res) => {
  const { keyword = "", date = "", doctor = "" } = req.query;

  const where = [];
  const params = [];

  if (keyword) {
    where.push("(name LIKE ? OR phone LIKE ? OR idno LIKE ?)");
    const like = `%${keyword}%`;
    params.push(like, like, like);
  }
  if (date) {
    where.push("date = ?");
    params.push(date);
  }
  if (doctor) {
    where.push("doctor = ?");
    params.push(doctor);
  }

  let sql = "SELECT * FROM appointments";
  if (where.length) {
    sql += " WHERE " + where.join(" AND ");
  }
  sql += " ORDER BY date DESC, section ASC, created_at DESC";

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error("讀取預約列表錯誤：", err);
      return res.status(500).json({ error: "伺服器錯誤" });
    }
    res.json(rows);
  });
});

// =========================
//  後台：刪除預約
//  DELETE /admin/appointments/:id
// =========================
app.delete("/admin/appointments/:id", checkAdmin, (req, res) => {
  const id = req.params.id;
  db.run("DELETE FROM appointments WHERE id = ?", [id], function (err) {
    if (err) {
      console.error("刪除預約錯誤：", err);
      return res.status(500).json({ error: "伺服器錯誤" });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "找不到資料" });
    }
    res.json({ ok: true });
  });
});

// =========================
//  後台：匯出 CSV
//  GET /admin/export?keyword=&date=&doctor=
// =========================
app.get("/admin/export", checkAdmin, (req, res) => {
  const { keyword = "", date = "", doctor = "" } = req.query;

  const where = [];
  const params = [];

  if (keyword) {
    where.push("(name LIKE ? OR phone LIKE ? OR idno LIKE ?)");
    const like = `%${keyword}%`;
    params.push(like, like, like);
  }
  if (date) {
    where.push("date = ?");
    params.push(date);
  }
  if (doctor) {
    where.push("doctor = ?");
    params.push(doctor);
  }

  let sql = "SELECT * FROM appointments";
  if (where.length) {
    sql += " WHERE " + where.join(" AND ");
  }
  sql += " ORDER BY date DESC, section ASC, created_at DESC";

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error("匯出 CSV 錯誤：", err);
      return res.status(500).json({ error: "伺服器錯誤" });
    }

    // 組 CSV 字串
    let csv = "id,姓名,電話,身分證/護照,生日,日期,診別,醫師,建立時間\n";
    for (const r of rows) {
      const line = [
        r.id,
        r.name,
        r.phone,
        r.idno,
        r.birthday,
        r.date,
        r.section,
        r.doctor,
        r.created_at
      ]
        .map((v) => `"${(v || "").toString().replace(/"/g, '""')}"`)
        .join(",");
      csv += line + "\n";
    }

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=appointments.csv"
    );
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.send(csv);
  });
});

// =========================
//  啟動伺服器
// =========================
app.listen(PORT, () => {
  console.log(`Clinic booking API running on port ${PORT}`);
});
