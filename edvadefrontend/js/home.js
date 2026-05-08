requireAuth();
if (localStorage.getItem("role") !== "student") window.location.href = "index.html";

let ALL_MODULES = []; // store all quests

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token");
  const res = await fetch(API + path, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

async function loadHudFromServer() {
  try {
    const data = await apiFetch("/me/summary");

    const points = data?.me?.points ?? 0;
    const level = data?.me?.level ?? 1;
    const userId = data?.me?.id;   // 👈 this is the important line

    localStorage.setItem("points", points);
    localStorage.setItem("level", level);

    window.dispatchEvent(new CustomEvent("hud:update", {
      detail: { level, points, xpPct: Math.min(100, points % 100) }
    }));

    // ✅ Call XP + streak with userId
    if (userId) {
      updateDailyXpAndStreak(userId);
    }

  } catch (e) {}
}

async function loadModules() {
  try {
    ALL_MODULES = await apiFetch("/modules");
    renderModules(ALL_MODULES);
  } catch (err) {
    console.error(err);
    document.getElementById("questGrid").innerHTML =
      `<div class="empty">Error loading quests.</div>`;
  }
}

function renderModules(list) {
  const grid = document.getElementById("questGrid");

  if (!list.length) {
    grid.innerHTML = `<div class="empty">No quests found.</div>`;
    return;
  }

  grid.innerHTML = list.map(m => `
    <button
      type="button"
      class="quest-card ${m.unlocked ? "" : "locked"}"
      ${m.unlocked ? `onclick="openQuest(${m.id})"` : "disabled"}
    >
      <div class="quest-top">
        <div>
          <div class="quest-title">${escapeHtml(m.title)}</div>
          <div class="quest-sub">${escapeHtml(m.description || "")}</div>
        </div>
        <div class="quest-chip">${m.unlock_points} pts</div>
      </div>

      <div class="quest-bottom">
        ${m.unlocked
          ? `<span class="quest-status unlocked">UNLOCKED</span>`
          : `<span class="quest-status locked">LOCKED 🔒</span>`}
      </div>

      <div class="lock-overlay">🔒 Locked</div>
    </button>
  `).join("");
}

/* 🔍 LIVE SEARCH */
document.getElementById("questSearch").addEventListener("input", e => {
  const q = e.target.value.toLowerCase();

  const filtered = ALL_MODULES.filter(m =>
    (m.title || "").toLowerCase().includes(q) ||
    (m.description || "").toLowerCase().includes(q)
  );

  renderModules(filtered);
});

function openQuest(moduleId) {
  window.location.href = `learning.html?moduleId=${moduleId}`;
}
window.openQuest = openQuest;

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function xpKey(userId) {
  return `xp_today_value_u${userId}`;
}
function xpDateKey(userId) {
  return `xp_today_date_u${userId}`;
}
function streakKey(userId) {
  return `streak_days_u${userId}`;
}
function streakLastKey(userId) {
  return `streak_last_login_u${userId}`;
}

// ---- Daily XP + Streak (localStorage) ----
function dateKey(d = new Date()) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function updateDailyXpAndStreak(userId) {
  const today = dateKey();
  const yd = new Date(); yd.setDate(yd.getDate() - 1);
  const yesterday = dateKey(yd);

  // XP Today reset
 const xpDate = localStorage.getItem(xpDateKey(userId));
if (xpDate !== today) {
  localStorage.setItem(xpDateKey(userId), today);
  localStorage.setItem(xpKey(userId), "0");
}

const xpToday = parseInt(localStorage.getItem(xpKey(userId)) || "0", 10);


  const xpTodayText = document.getElementById("xpTodayText");
  const xpTodayChip = document.getElementById("xpTodayChip");
  if (xpTodayText) xpTodayText.textContent = `${xpToday}`;
  if (xpTodayChip) xpTodayChip.textContent = `${xpToday} XP`;

  // Streak update (home page counts as daily login)
  const streakDaysKey = streakKey(userId);
  const streakLastKey = streakLastKey(userId);
  
  const last = localStorage.getItem(streakLastKey);
  let streak = parseInt(localStorage.getItem(streakDaysKey) || "0", 10);

  if (!last) {
    streak = 1;
    localStorage.setItem(streakDaysKey, String(streak));
    localStorage.setItem(streakLastKey, today);
  } else if (last === today) {
    // already counted today
  } else if (last === yesterday) {
    streak += 1;
    localStorage.setItem(streakDaysKey, String(streak));
    localStorage.setItem(streakLastKey, today);
  } else {
    streak = 1;
    localStorage.setItem(streakDaysKey, String(streak));
    localStorage.setItem(streakLastKey, today);
  }

  const streakDays = document.getElementById("streakDays");
  const streakChip = document.getElementById("streakChip");
  const streakMsg = document.getElementById("streakMsg");

  if (streakDays) streakDays.textContent = `${streak}`;
  if (streakChip) streakChip.textContent = `${streak} days`;

  if (streakMsg) {
    if (streak >= 7) streakMsg.textContent = "Amazing! 7+ day streak 🔥";
    else if (streak >= 3) streakMsg.textContent = "Nice! Keep it going 💪";
    else streakMsg.textContent = "Log in daily to keep it going 🔥";
  }
}
(async () => {
  await loadHudFromServer();
  await loadModules();
  await renderAnnouncement("homeAnnouncementWidget");
})();

