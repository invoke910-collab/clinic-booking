// 匯入套件
const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();

// 建立 express APP
const app = express();

// 啟用 CORS（讓前端 localhost:3000 可以呼叫後端 5000）
app.use(cors());

// 啟用 JSON 解析
app.use(express.json());

// 連線 SQLite 資料庫
const db = new sqlite3.Database("./clinic.db", (err) => {
    if (err) console.error(err.message);
    else console.log("已連線 SQLite 資料庫 clinic.db");
});

// 若無 table 自動建立
db.run(`
    CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
`);

// 正式版預約 API：寫入 SQLite 並避免重複時段
app.post("/booking", (req, res) => {
    const { name, phone, date, time } = req.body;

    // 基本檢查
    if (!name || !phone || !date || !time) {
        return res.status(400).json({ error: "name、phone、date、time 都是必填" });
    }

    // 檢查是否重複預約
    const checkSQL = `SELECT * FROM appointments WHERE date = ? AND time = ?`;
    db.get(checkSQL, [date, time], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });

        if (row) {
            return res.json({
                message: "此時段已被預約",
                conflict: row
            });
        }

        // 寫入資料庫
        const insertSQL = `
            INSERT INTO appointments (name, phone, date, time)
            VALUES (?, ?, ?, ?)
        `;
        db.run(insertSQL, [name, phone, date, time], function (err) {
            if (err) return res.status(500).json({ error: err.message });

            res.json({
                message: "預約成功！",
                booking_id: this.lastID,
                data: { name, phone, date, time }
            });
        });
    });
});

// API 使用 port 5000
app.listen(5000, () => {
    console.log("API 伺服器已啟動：http://localhost:5000");
});
