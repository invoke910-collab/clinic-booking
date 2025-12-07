// =============================================
// Supabase 設定（使用 UMD 全域版）
// =============================================
const SUPABASE_URL = "https://YOUR-PROJECT.supabase.co";
const SUPABASE_KEY = "sb_publishable_3C11H2gMsruJ11llR82XNw_zvl2fIPR";

const supa = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// =============================================
// 時段顯示文字對照（可依你原本的 timeLabel 調整）
// =============================================
const timeLabel = {
  "M": "上午診",
  "A": "下午診",
  "N": "晚上診"
  // 依你實際使用的 key 補齊
};

// =============================================
// 工具：顯示 / 關閉「送出中」遮罩
// =============================================
function showLoading() {
  const mask = document.getElementById("loadingMask");
  if (mask) mask.style.display = "flex";
}

function hideLoading() {
  const mask = document.getElementById("loadingMask");
  if (mask) mask.style.display = "none";
}

// =============================================
// Popup 控制
// =============================================
function showPopup(title, html) {
  document.getElementById("popupTitle").textContent = title;
  document.getElementById("popupContent").innerHTML = html;
  document.getElementById("popupBg").style.display = "flex";
}

window.closePopup = function () {
  document.getElementById("popupBg").style.display = "none";
};

// =============================================
// 預約送出邏輯（強化升級版）
// =============================================
window.submitBooking = async function () {
  const submitBtn = document.getElementById("submitBtn");
  const form = document.getElementById("bookingForm");

  if (!submitBtn) {
    alert("找不到送出按鈕，請確認 HTML 中是否有 id='submitBtn'");
    return;
  }

  // 🔒 防止連點
  submitBtn.disabled = true;
  submitBtn.textContent = "處理中…";
  showLoading();

  try {
    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const id_number = document.getElementById("id_number").value.trim();
    const birthday = document.getElementById("birthday").value;
    const date = document.getElementById("date").value;
    const sec = document.getElementById("section").value;
    const doctor = document.getElementById("doctor").value;

    // 欄位檢查
    if (!name || !phone || !id_number || !birthday || !date || !sec || !doctor) {
      showPopup("提醒", "所有欄位都是必填，請確認是否有漏填。");
      return;
    }

    const timeText = timeLabel[sec] || sec;

    // =====================================================
    // 前端檢查：是否已重複預約
    // =====================================================
    const { data: exist, error: checkErr } = await supa
      .from("appointments")
      .select("id")
      .eq("name", name)
      .eq("phone", phone)
      .eq("date", date)
      .eq("time", timeText)
      .eq("doctor", doctor);

    if (checkErr) {
      console.error("檢查預約時發生錯誤：", checkErr);
      showPopup("錯誤", "檢查預約時發生錯誤，請稍後再試。");
      return;
    }

    if (exist && exist.length > 0) {
      showPopup(
        "提醒",
        `您已預約過以下門診：<br><br>日期：${date}<br>時段：${timeText}<br>醫師：${doctor}<br><br>同一人同一時段不可重複預約。`
      );
      return;
    }

    // =====================================================
    // 寫入資料（後端同時有 UNIQUE 約束，雙重防護）
    // =====================================================
    const { error: insertErr } = await supa
      .from("appointments")
      .insert([
        {
          name,
          phone,
          id_number,
          birthday,
          date,
          time: timeText,
          doctor
        }
      ]);

    if (insertErr) {
      console.error("寫入資料錯誤：", insertErr);

      // 若後端 UNIQUE 約束觸發（Postgres 代碼常為 23505）
      if (insertErr.code === "23505") {
        showPopup(
          "提醒",
          `系統偵測到您本日該時段已經有預約紀錄。<br>請勿重複預約。`
        );
      } else {
        showPopup("錯誤", "寫入資料時發生錯誤，請稍後再試。");
      }
      return;
    }

    // =====================================================
    // 成功處理：清空表單 & 提示 & 跳轉感謝頁
    // =====================================================
    showPopup(
      "預約成功！",
      `姓名：${name}<br>日期：${date}<br>時段：${timeText}<br>醫師：${doctor}`
    );

    // 清空整張表單
    if (form) {
      form.reset();
    }

    // 若你有額外初始化下拉選單的邏輯（例如重設醫師選單），可在這裡補上：
    const doctorSelect = document.getElementById("doctor");
    if (doctorSelect) {
      doctorSelect.innerHTML = `<option value="">請先選擇時段</option>`;
      doctorSelect.disabled = true;
    }

    // 1.5 秒後跳轉到感謝頁
    setTimeout(() => {
      window.location.href = "thanks.html";
    }, 1500);

  } finally {
    // 不論成功或失敗，都要把遮罩關掉、按鈕解鎖
    hideLoading();
    submitBtn.disabled = false;
    submitBtn.textContent = "送出預約";
  }
};

// =============================================
// 綁定按鈕事件（取代 inline onclick）
// =============================================
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("submitBtn");
  if (btn) {
    btn.addEventListener("click", submitBooking);
  }
});
