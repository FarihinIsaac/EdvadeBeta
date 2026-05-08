// --- auth + role guard ---
requireAuth();
if (localStorage.getItem("role") !== "student") window.location.href = "index.html";

// IMPORTANT: use a unique const name to avoid "API already declared"
const API_BASE = "http://localhost:3000/api";

function getModuleId() {
  return new URLSearchParams(window.location.search).get("moduleId");
}

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token");
  const res = await fetch(API_BASE + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
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
  // Get userId from localStorage (set during login)
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user?.id || user?._id;
  
  if (!userId) return; // Can't track without userId
  
  const xpDateKey = `xp_today_date_u${userId}`;
  const xpValKey = `xp_today_value_u${userId}`;
  const xpDate = localStorage.getItem(xpDateKey);

  // reset if new day
  if (xpDate !== today) {
    localStorage.setItem(xpDateKey, today);
    localStorage.setItem(xpValKey, "0");
  }

  const cur = parseInt(localStorage.getItem(xpValKey) || "0", 10);
  localStorage.setItem(xpValKey, String(cur + amount));
}

let questions = [];

async function loadQuiz() {
  const moduleId = getModuleId();

  if (!moduleId) {
    document.getElementById("quizBox").innerHTML =
      `<div class="empty">No module selected. Go to Modules and click Start.</div>`;
    return;
  }

  document.getElementById("modTitle").textContent = `Quiz • Module ${moduleId}`;

  questions = await apiFetch(`/quiz/${moduleId}`);

  if (!questions.length) {
    document.getElementById("quizBox").innerHTML =
      `<div class="empty">No questions yet for this module. Ask lecturer to add some.</div>`;
    return;
  }

  document.getElementById("quizBox").innerHTML = questions
    .map((q, idx) => `
      <div class="quiz-question">
        <p><b>Q${idx + 1}:</b> ${escapeHtml(q.prompt)}</p>
        ${renderOption(q.id, "A", q.a)}
        ${renderOption(q.id, "B", q.b)}
        ${renderOption(q.id, "C", q.c)}
        ${renderOption(q.id, "D", q.d)}
      </div>
    `)
    .join("");
}

function renderOption(qid, key, text) {
  return `
    <label style="display:block; margin:6px 0;">
      <input type="radio" name="q_${qid}" value="${key}" />
      ${key}) ${escapeHtml(text)}
    </label>
  `;
}

// ✅ ONLY ONE submitQuiz
async function submitQuiz() {
  const moduleId = getModuleId();
  if (!moduleId) return alert("No module selected.");

  // ✅ backend expects { [questionId]: "A" }
  const answers = {};
  for (const q of questions) {
    const chosen = document.querySelector(`input[name="q_${q.id}"]:checked`);
    if (chosen) answers[q.id] = chosen.value;
  }

  if (Object.keys(answers).length !== questions.length) {
    alert("Please answer all questions.");
    return;
  }

  try {
    const result = await apiFetch(`/quiz/${moduleId}/submit`, {
      method: "POST",
      body: JSON.stringify({ answers })
    });

    document.getElementById("result").innerHTML =
      `Score: <b>${result.score}/${result.total}</b> • Earned: <b>${result.earnedPoints}</b> points`;

    const earned = Number(result.earnedPoints || 0);
    addXpToday(earned);

    // ✅ optional: go back to dashboard so progress/badges update
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

// make sure button onclick can find it
window.submitQuiz = submitQuiz;

loadQuiz().catch(err => {
  console.error(err);
  document.getElementById("quizBox").innerHTML =
    `<div class="empty">Error loading quiz: ${escapeHtml(err.message)}</div>`;
});

