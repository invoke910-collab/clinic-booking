// app.js - 診所預約系統 v2（含身分證、生日、醫師排班、後台列表）

const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();

const app = express();
app.use(cors());
app.use(express.json());

// ★ 使用新資料庫檔名，避免舊表結構不合
const DB_FILE = "./clinic_v2.db";

const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) console.error("連線資料庫失敗：", err.message);
  else console.log("已連線 SQLite 資料庫", DB_FILE);
});

// ★ 醫師排班表（請依實際情況調整內容）
// day: 0=Sunday, 1=Monday, ... 6=Saturday
const schedule = {
  0: { // Sunday
    morning: "休診",
    afternoon: "休診",
    evening: "休診",
  },
  1: { // Monday  例：請依你實際門診表修改
    morning: "吳立偉院長",
    afternoon: "林峻豪副院長",
    evening: "林峻豪副院長",
  },
  2: { // Tuesday
    morning: "郭正毓醫師",
    afternoon: "郭正毓醫師",
    evening: "林峻豪副院長",
  },
  3: { // Wednesday
    morning: "吳立偉院長",
    afternoon: "黃前華副院長",
    evening: "黃前華副院長",
  },
  4: { // Thursday
    morning: "吳立偉院長",
    afternoon: "林峻豪副院長",
    evening: "郭正毓醫師",
  },
  5: { // Friday
    morning: "林峻豪副院長",
    afternoon: "郭正毓醫師",
    evening: "林峻豪副院長",
  },
  6: { // Saturday — 固定顯示兩位醫師（輪值）
    morning: "劉俊良醫師（輪值）、林峻豪副院長（輪值）",
    afternoon: "劉俊良醫師（輪值）、林峻豪副院長（輪值）",
    evening: "劉俊良醫師（輪值）、林峻豪副院長（輪值）",
  },
};

// 依日期與時段取得今日醫師
function getDoctorFor(dateStr, section) {
  // dateStr 格式：YYYY-MM-DD
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d)) return "未知醫師";

  const day = d.getDay(); // 0~6
  const daySchedule = schedule[day];
  if (!daySchedule) return "休診";

  return daySchedule[section] || "休診";
}

// 建立資料表（若不存在）
db.run(`
  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    id_number TEXT NOT NULL,
    birth TEXT NOT NULL,
    date TEXT NOT NULL,
    section TEXT NOT NULL,    -- morning / afternoon / evening
    doctor TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// 台灣身分證檢查 (格式 + 檢查碼)
function isTaiwanId(id) {
  const upper = id.toUpperCase();
  if (!/^[A-Z][12][0-9]{8}$/.test(upper)) return false;

  const letters = "ABCDEFGHJKLMNPQRSTUVXYWZIO";
  const code = letters.indexOf(upper.charAt(0)) + 10;
  if (code < 10) return false;

  const n1 = Math.floor(code / 10);
  const n2 = code % 10;

  let sum = n1 * 1 + n2 * 9;
  for (let i = 1; i <= 8; i++) {
    sum += parseInt(upper.charAt(i), 10) * (9 - i);
  }
  sum += parseInt(upper.charAt(9), 10);

  return sum % 10 === 0;
}

// 預約 API
app.post("/booking", (req, res) => {
  const { name, phone, id_number, birth, date, section } = req.body;

  if (!name || !phone || !id_number || !birth || !date || !section) {
    return res.status(400).json({ error: "姓名、電話、身分證/護照、生日、日期、時段皆為必填" });
  }

  // 手機 / 電話簡單檢查（可自行再強化）
  if (!/^[0-9\-+]{8,15}$/.test(phone)) {
    return res.status(400).json({ error: "電話格式不正確" });
  }

  // 出生年月日簡單檢查
  if (isNaN(new Date(birth + "T00:00:00"))) {
    return res.status(400).json({ error: "出生年月日格式不正確" });
  }

  // 身分證 / 護照檢查：若是台灣身分證格式 → 進行檢查碼驗證，其餘視為護照 / 居留證
  const upperId = id_number.toUpperCase();
  if (/^[A-Z][12][0-9]{8}$/.test(upperId)) {
    if (!isTaiwanId(upperId)) {
      return res.status(400).json({ error: "身分證字號格式錯誤，請重新確認" });
    }
  }

  // 依日期 + 時段決定醫師
  const doctor = getDoctorFor(date, section);
  if (!doctor || doctor === "休診") {
    return res.status(400).json({ error: "該日期或時段無門診，無法預約" });
  }

  // 檢查是否同人重複預約同一日期 + 時段（姓名 + 電話）
  const checkSql = `
    SELECT 1 FROM appointments
    WHERE name = ? AND phone = ? AND date = ? AND section = ?
  `;
  db.get(checkSql, [name, phone, date, section], (err, row) => {
    if (err) {
      console.error("查詢失敗：", err);
      return res.status(500).json({ error: "伺服器錯誤" });
    }

    if (row) {
      return res.status(400).json({
        error: "您已預約過相同日期與時段，請勿重複預約",
      });
    }

    const insertSql = `
      INSERT INTO appointments (name, phone, id_number, birth, date, section, doctor)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    db.run(
      insertSql,
      [name, phone, id_number, birth, date, section, doctor],
      function (err2) {
        if (err2) {
          console.error("新增預約失敗：", err2);
          return res.status(500).json({ error: "預約失敗" });
        }

        return res.json({
          message: "預約成功！",
          booking_id: this.lastID,
          data: { name, phone, id_number, birth, date, section, doctor },
        });
      }
    );
  });
});

// 後台查詢全部預約（可加 date 篩選）
app.get("/appointments", (req, res) => {
  const { date } = req.query;
  let sql = "SELECT * FROM appointments";
  const params = [];

  if (date) {
    sql += " WHERE date = ?";
    params.push(date);
  }

  sql += " ORDER BY date DESC, section ASC, created_at ASC";

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error("查詢預約列表失敗：", err);
      return res.status(500).json({ error: "伺服器錯誤" });
    }
    return res.json(rows);
  });
});

// 健康檢查
app.get("/", (req, res) => {
  res.send("Clinic booking API v2 is running.");
});

// Render / 本地啟動
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("後端 API 執行中，port:", PORT);
});
