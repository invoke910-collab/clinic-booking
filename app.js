// ===============================
//  匯入套件
// ===============================
const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();

// ===============================
//  建立 Express APP
// ===============================
const app = express();
app.use(cors());
app.use(express.json());

// ===============================
// 連線 SQLite 資料庫 clinic.db
// ===============================
const db = new sqlite3.Database("./clinic.db", (err) => {
    if (err) console.error(err.message);
    else console.log("已連線 SQLite 資料庫 clinic.db");
});

// ===============================
// 建立預約資料表（若不存在）
// ===============================
db.run(`
    CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        id_number TEXT,
        birth_date TEXT,
        date TEXT NOT NULL,
        section TEXT NOT NULL,
        time TEXT NOT NULL,
        doctor TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
`);

// ===============================
// 建立排班資料表（若不存在）
// ===============================
// 用於方案 C：後台管理班表
db.run(`
    CREATE TABLE IF NOT EXISTS schedule (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        work_date TEXT NOT NULL,
        doctor TEXT NOT NULL,
        section TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
`);

// ===============================
// （API）查詢某日期負責醫師
// GET /doctor?date=2025-12-08
// ===============================
app.get("/doctor", (req, res) => {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: "缺少 date 參數" });

    db.all(
        `SELECT doctor, section FROM schedule WHERE work_date = ?`,
        [date],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ date, doctors: rows });
        }
    );
});

// ===============================
// （API）後台更新班表（新增每日醫師）
// POST /schedule
// ===============================
app.post("/schedule", (req, res) => {
    const { work_date, doctor, section } = req.body;

    if (!work_date || !doctor || !section) {
        return res.status(400).json({ error: "work_date、doctor、section 必填" });
    }

    const sql = `
        INSERT INTO schedule (work_date, doctor, section)
        VALUES (?, ?, ?)
    `;

    db.run(sql, [work_date, doctor, section], function (err) {
        if (err) return res.status(500).json({ error: err.message });

        res.json({
            message: "班表新增成功",
            id: this.lastID,
            data: { work_date, doctor, section }
        });
    });
});

// ===============================
// （API）後台刪除班表項目
// DELETE /schedule/:id
// ===============================
app.delete("/schedule/:id", (req, res) => {
    const id = req.params.id;

    db.run(`DELETE FROM schedule WHERE id = ?`, [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });

        res.json({ message: "刪除成功", deleted: this.changes });
    });
});

// ===============================
// （API）後台取得整個班表
// GET /schedule
// ===============================
app.get("/schedule", (req, res) => {
    db.all(`SELECT * FROM schedule ORDER BY work_date ASC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// ===============================
//  預約 API（含不可重複預約規則）
// ===============================
app.post("/booking", (req, res) => {
    const { name, phone, idNumber, birthDate, date, section, doctor } = req.body;

    // 後端把「早/午/晚診」轉換成時間
    const sectionToTime = {
        "早診": "08:30–12:00",
        "午診": "14:30–18:30",
        "晚診": "18:30–20:00"
    };

    const time = sectionToTime[section];

    if (!name || !phone || !date || !section || !time) {
        return res.status(400).json({ error: "必填欄位不足" });
    }

    // 同一個人 同一天 同時段 不可重複預約
    const checkSQL = `
        SELECT * FROM appointments
        WHERE name = ? AND phone = ? AND date = ? AND section = ?
    `;

    db.get(checkSQL, [name, phone, date, section], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });

        if (row) {
            return res.json({
                message: "此人已預約過相同日期與時段",
                conflict: row
            });
        }

        // 寫入預約
        const insertSQL = `
            INSERT INTO appointments
            (name, phone, id_number, birth_date, date, section, time, doctor)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.run(
            insertSQL,
            [name, phone, idNumber, birthDate, date, section, time, doctor],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });

                res.json({
                    message: "預約成功！",
                    booking_id: this.lastID,
                    data: { name, phone, idNumber, birthDate, date, section, time, doctor }
                });
            }
        );
    });
});

// ===============================
//  啟動伺服器（Render 會自動指定 PORT）
// ===============================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`伺服器已啟動，PORT: ${PORT}`);
});
