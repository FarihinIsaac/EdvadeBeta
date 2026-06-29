// --- auth + role guard ---
requireAuth();
if (localStorage.getItem("role") !== "student") window.location.href = "index.html";

function getModuleId() {
  return new URLSearchParams(window.location.search).get("moduleId");
}

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token");
  const res = await fetch(window.API + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "Cache-Control": "no-cache",
      "Pragma": "no-cache",
      ...(options.headers || {})
    }
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

// ---- XP Earned Today (localStorage) ----
function dateKey(d = new Date()) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function addXpToday(amount) {
  const today = dateKey();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user?.id || user?._id;
  if (!userId) return;

  const xpDateKey = `xp_today_date_u${userId}`;
  const xpValKey  = `xp_today_value_u${userId}`;
  const xpDate    = localStorage.getItem(xpDateKey);

  if (xpDate !== today) {
    localStorage.setItem(xpDateKey, today);
    localStorage.setItem(xpValKey, "0");
  }

  const cur = parseInt(localStorage.getItem(xpValKey) || "0", 10);
  localStorage.setItem(xpValKey, String(cur + amount));
}

// -------------------------------------------------------
// TAB VISIBILITY WARNING — uses <dialog> to bypass CSS
// -------------------------------------------------------
let tabWarningTimer   = null;
let tabWarningSeconds = 45;
let tabViolations     = 0;
let tabHiddenTime     = null; // Tracks absolute timestamp when tab is hidden
let quizFailed        = false;

function injectWarningDialog() {
  if (document.getElementById("tabWarningDialog")) return;

  const dialog = document.createElement("dialog");
  dialog.id = "tabWarningDialog";

  // Inline every style so your RPG CSS cannot touch it (display handles via stylesheet to respect open/closed state)
  dialog.setAttribute("style", [
    "all: initial",
    "position: fixed",
    "top: 50%",
    "left: 50%",
    "transform: translate(-50%, -50%)",
    "z-index: 2147483647",
    "background: #ffffff",
    "border: 3px solid #e53e3e",
    "border-radius: 16px",
    "padding: 36px 32px",
    "max-width: 360px",
    "width: 90vw",
    "text-align: center",
    "box-shadow: 0 24px 80px rgba(0,0,0,0.55)",
    "font-family: Arial, sans-serif",
  ].join(";"));

  dialog.innerHTML = `
    <div style="font-size:48px;margin-bottom:12px;">⚠️</div>
    <h3 style="all:initial;display:block;font-family:Arial,sans-serif;font-size:17px;font-weight:700;color:#c53030;margin:0 0 8px;">
      Return to your quiz!
    </h3>
    <p style="all:initial;display:block;font-family:Arial,sans-serif;font-size:13px;color:#555;margin:0 0 6px;">
      You left the quiz page. Return within:
    </p>
    <div id="tabWarningCount" style="all:initial;display:block;font-family:Arial,sans-serif;font-size:72px;font-weight:900;color:#c53030;line-height:1;margin:10px 0;">
      45
    </div>
    <p style="all:initial;display:block;font-family:Arial,sans-serif;font-size:12px;color:#888;margin:0 0 20px;">
      seconds or your attempt will automatically fail.
    </p>
    <button id="tabWarningBtn" style="all:initial;display:block;font-family:Arial,sans-serif;font-size:13px;font-weight:700;background:#c53030;color:#fff;border:none;border-radius:10px;padding:14px 0;width:100%;cursor:pointer;box-sizing:border-box;">
      ✅ I'm back — continue quiz
    </button>
    <p id="tabViolationMsg" style="all:initial;display:block;font-family:Arial,sans-serif;font-size:11px;color:#aaa;margin:10px 0 0;"></p>
  `;

  // Backdrop style
  const style = document.createElement("style");
  style.textContent = `
    #tabWarningDialog {
      display: none !important;
    }
    #tabWarningDialog[open] {
      display: block !important;
    }
    #tabWarningDialog::backdrop {
      background: rgba(0,0,0,0.75);
    }
    #tabWarningBtn:hover {
      background: #9b2424 !important;
      cursor: pointer !important;
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(dialog);

  document.getElementById("tabWarningBtn").addEventListener("click", dismissTabWarning);
}

function showTabWarning() {
  const dialog = document.getElementById("tabWarningDialog");
  if (!dialog) return;

  if (!tabHiddenTime) {
    tabHiddenTime = Date.now();
  }
  tabWarningSeconds = 45;

  const countEl = document.getElementById("tabWarningCount");
  const msgEl   = document.getElementById("tabViolationMsg");

  countEl.style.color = "#c53030";
  countEl.textContent = tabWarningSeconds;
  if (msgEl) msgEl.textContent = `Tab switch #${tabViolations} detected.`;

  // showModal() is native — nothing in CSS can block it
  if (!dialog.open) dialog.showModal();

  clearInterval(tabWarningTimer);
  tabWarningTimer = setInterval(() => {
    if (!tabHiddenTime) return;
    const elapsed = Math.floor((Date.now() - tabHiddenTime) / 1000);
    tabWarningSeconds = Math.max(0, 45 - elapsed);

    if (countEl) {
      countEl.textContent = tabWarningSeconds;
      if (tabWarningSeconds <= 10) {
        countEl.style.color = "#7b0000";
      } else {
        countEl.style.color = "#c53030";
      }
    }

    if (tabWarningSeconds <= 0) {
      clearInterval(tabWarningTimer);
      handleTabTimeout();
    }
  }, 1000);
}

function dismissTabWarning() {
  clearInterval(tabWarningTimer);
  tabHiddenTime = null;
  const dialog = document.getElementById("tabWarningDialog");
  if (dialog && dialog.open) dialog.close();
}

function handleTabTimeout() {
  if (quizFailed) return;
  dismissTabWarning();
  handleTabSwitchFailure("tab_timeout");
}

function handleVisibilityChange() {
  if (document.hidden) {
    tabViolations++;

    // Report tab switch in real-time
    const moduleId = getModuleId();
    if (moduleId) {
      apiFetch("/tab-switch-log", {
        method: "POST",
        body: JSON.stringify({
          moduleId: Number(moduleId),
          switchCount: tabViolations,
          failed: tabViolations >= 2
        })
      }).catch(err => console.warn("Failed to log tab switch:", err));
    }

    if (tabViolations >= 2) {
      handleTabSwitchFailure();
      return;
    }

    tabHiddenTime = Date.now();
    showTabWarning();
  } else {
    // User returned to the tab.
    // Recalculate remaining seconds immediately to avoid throttling delay, 
    // but DO NOT clear the interval timer so it continues ticking like a live timer.
    if (tabHiddenTime) {
      const elapsed = Math.floor((Date.now() - tabHiddenTime) / 1000);
      tabWarningSeconds = Math.max(0, 45 - elapsed);

      const countEl = document.getElementById("tabWarningCount");
      if (countEl) {
        countEl.textContent = tabWarningSeconds;
        if (tabWarningSeconds <= 10) {
          countEl.style.color = "#7b0000";
        } else {
          countEl.style.color = "#c53030";
        }
      }

      if (tabWarningSeconds <= 0) {
        clearInterval(tabWarningTimer);
        handleTabTimeout();
      }
    }
  }
}

function startTabWatcher() {
  injectWarningDialog();
  document.addEventListener("visibilitychange", handleVisibilityChange);
}

function stopTabWatcher() {
  document.removeEventListener("visibilitychange", handleVisibilityChange);
  clearInterval(tabWarningTimer);
  const dialog = document.getElementById("tabWarningDialog");
  if (dialog) dialog.remove();
}

function injectFailDialog() {
  if (document.getElementById("quizFailDialog")) return;

  const dialog = document.createElement("dialog");
  dialog.id = "quizFailDialog";
  dialog.setAttribute("style", [
    "all: initial",
    "position: fixed",
    "top: 50%",
    "left: 50%",
    "transform: translate(-50%, -50%)",
    "z-index: 2147483647",
    "background: #ffffff",
    "border: 3px solid #7f1d1d",
    "border-radius: 16px",
    "padding: 36px 32px",
    "max-width: 400px",
    "width: 90vw",
    "text-align: center",
    "box-shadow: 0 24px 80px rgba(0,0,0,0.55)",
    "font-family: Arial, sans-serif",
  ].join(";"));

  dialog.innerHTML = `
    <div style="font-size:56px;margin-bottom:12px;">❌</div>
    <h3 style="all:initial;display:block;font-family:Arial,sans-serif;font-size:20px;font-weight:800;color:#7f1d1d;margin:0 0 10px;">
      You Failed!
    </h3>
    <p id="quizFailMessage" style="all:initial;display:block;font-family:Arial,sans-serif;font-size:14px;color:#444;margin:0 0 8px;line-height:1.5;">
      You switched tabs too many times. This quiz attempt has been recorded as a fail (0 points).
    </p>
    <p id="quizFailAttempts" style="all:initial;display:block;font-family:Arial,sans-serif;font-size:13px;font-weight:700;color:#c53030;margin:0 0 20px;"></p>
    <button id="quizFailBtn" style="all:initial;display:block;font-family:Arial,sans-serif;font-size:14px;font-weight:700;background:#7f1d1d;color:#fff;border:none;border-radius:10px;padding:14px 0;width:100%;cursor:pointer;box-sizing:border-box;">
      Back to Learning Module
    </button>
  `;

  const style = document.createElement("style");
  style.textContent = `
    #quizFailDialog { display: none !important; }
    #quizFailDialog[open] { display: block !important; }
    #quizFailDialog::backdrop { background: rgba(0,0,0,0.8); }
    #quizFailBtn:hover { background: #5c1515 !important; cursor: pointer !important; }
  `;
  document.head.appendChild(style);
  document.body.appendChild(dialog);
}

function showFailDialog(attemptsLeft, maxAttempts, moduleId, reason = "tab_switch") {
  injectFailDialog();
  const dialog = document.getElementById("quizFailDialog");
  const msgEl = document.getElementById("quizFailMessage");
  const attEl = document.getElementById("quizFailAttempts");

  if (msgEl) {
    if (reason === "tab_timeout") {
      msgEl.textContent =
        "You did not return within 45 seconds. This quiz attempt has been recorded as a fail (0 points).";
    } else {
      msgEl.textContent =
        "You switched tabs too many times. This quiz attempt has been recorded as a fail (0 points).";
    }
  }
  if (attEl) {
    if (attemptsLeft <= 0) {
      attEl.textContent = `No attempts left (${maxAttempts}/${maxAttempts} used).`;
    } else {
      attEl.textContent = `Attempts remaining: ${attemptsLeft} of ${maxAttempts}`;
    }
  }

  const btn = document.getElementById("quizFailBtn");
  if (btn) {
    btn.onclick = () => {
      if (dialog && dialog.open) dialog.close();
      if (moduleId) {
        window.location.href = `learning.html?moduleId=${moduleId}`;
      } else {
        window.location.href = "student-module.html";
      }
    };
  }

  if (dialog && !dialog.open) dialog.showModal();
}

async function handleTabSwitchFailure(reason = "tab_switch") {
  if (quizFailed) return;
  quizFailed = true;
  stopTabWatcher();

  const moduleId = getModuleId();
  let attemptsLeft = 0;
  let maxAttempts = 3;

  document.querySelectorAll("input[type=radio]").forEach((r) => (r.disabled = true));
  const subBtn = document.getElementById("submitBtn");
  if (subBtn) subBtn.disabled = true;

  try {
    if (moduleId) {
      const result = await apiFetch(`/quiz/${moduleId}/fail`, {
        method: "POST",
        body: JSON.stringify({ reason })
      });
      attemptsLeft = result.attemptsLeft ?? 0;
      maxAttempts = result.maxAttempts ?? 3;
    }
  } catch (err) {
    console.error("Failed to record quiz failure:", err);
  }

  showFailDialog(attemptsLeft, maxAttempts, moduleId, reason);
}
// -------------------------------------------------------

let questions = [];

async function loadQuiz() {
  const moduleId = getModuleId();

  if (!moduleId) {
    document.getElementById("quizBox").innerHTML =
      `<div class="empty">No module selected. Go to Modules and click Start.</div>`;
    return;
  }

  document.getElementById("modTitle").textContent = `Quiz • Module ${moduleId}`;
  
  const quizData = await apiFetch(`/quiz/${moduleId}`);
  questions = quizData.questions || [];
  const attemptsLeft = quizData.attemptsLeft ?? 3;
  const maxAttempts = quizData.maxAttempts ?? 3;
  const attemptsMade = quizData.attemptsMade ?? 0;

  const attEl = document.getElementById("attemptsInfo");
  if (attEl) {
    attEl.textContent = `Attempts Left: ${attemptsLeft} / ${maxAttempts}`;
  }

  if (attemptsLeft <= 0) {
    document.getElementById("quizBox").innerHTML =
      `<div class="empty">No attempts left. You have already taken this quiz ${attemptsMade} times (Max ${maxAttempts}).</div>`;
    const subBtn = document.getElementById("submitBtn");
    if (subBtn) subBtn.style.display = "none";
    return;
  }

  if (!questions.length) {
    document.getElementById("quizBox").innerHTML =
      `<div class="empty">No questions yet for this module. Ask lecturer to add some.</div>`;
    return;
  }

  document.getElementById("quizBox").innerHTML = questions
    .map((q, idx) => {
      let badgeStyle = "background: #e6fffa; color: #319795; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 11px; margin-left: 8px; display: inline-block;";
      if (q.difficulty === "intermediate") {
        badgeStyle = "background: #feebc8; color: #dd6b20; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 11px; margin-left: 8px; display: inline-block;";
      } else if (q.difficulty === "advanced") {
        badgeStyle = "background: #fed7d7; color: #e53e3e; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 11px; margin-left: 8px; display: inline-block;";
      }
      const difficultyText = (q.difficulty || "beginner").toUpperCase();

      return `
        <div class="quiz-question">
          <p style="display: flex; align-items: center; flex-wrap: wrap; gap: 8px;">
            <b>Q${idx + 1}:</b> ${escapeHtml(q.prompt)}
            <span style="${badgeStyle}">${difficultyText}</span>
          </p>
          ${renderOption(q.id, "A", q.a)}
          ${renderOption(q.id, "B", q.b)}
          ${renderOption(q.id, "C", q.c)}
          ${renderOption(q.id, "D", q.d)}
        </div>
      `;
    })
    .join("");

  startTabWatcher();
}

function renderOption(qid, key, text) {
  return `
    <label style="display:block; margin:6px 0;">
      <input type="radio" name="q_${qid}" value="${key}" />
      ${key}) ${escapeHtml(text)}
    </label>
  `;
}

async function submitQuiz() {
  const moduleId = getModuleId();
  if (!moduleId) return alert("No module selected.");

  const answers = {};
  for (const q of questions) {
    const chosen = document.querySelector(`input[name="q_${q.id}"]:checked`);
    if (chosen) answers[q.id] = chosen.value;
  }

  if (Object.keys(answers).length !== questions.length) {
    alert("Please answer all questions.");
    return;
  }

  stopTabWatcher();

  try {
    const result = await apiFetch(`/quiz/${moduleId}/submit`, {
      method: "POST",
      body: JSON.stringify({ answers, tabViolations })
    });

    document.getElementById("result").innerHTML =
      `Score: <b>${result.score}/${result.total}</b> • Earned: <b>${result.earnedPoints}</b> points`;

    const earned = Number(result.earnedPoints || 0);
    addXpToday(earned);

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 900);

  } catch (err) {
    alert(err.message);
  }
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

window.submitQuiz = submitQuiz;

loadQuiz().catch(err => {
  console.error(err);
  document.getElementById("quizBox").innerHTML =
    `<div class="empty">Error loading quiz: ${escapeHtml(err.message)}</div>`;
});