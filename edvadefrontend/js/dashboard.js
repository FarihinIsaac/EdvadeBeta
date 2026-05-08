requireAuth();
if (localStorage.getItem("role") !== "student") window.location.href = "index.html";

// ✅ use the ONE global API from auth.js
async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token");
  const res = await fetch(API + path, {
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

function setProgressBar(id, pct) {
  const bar = document.getElementById(id);
  if (!bar) return;

  const clamped = Math.max(0, Math.min(100, Number(pct) || 0));
  bar.style.width = clamped + "%";

  // ✅ DO NOT put text inside the bar (causes clipping)
  bar.textContent = "";
}

function setPctLabel(labelId, pct) {
  const el = document.getElementById(labelId);
  if (!el) return;
  const clamped = Math.max(0, Math.min(100, Number(pct) || 0));
  el.textContent = clamped + "%";
}

async function loadDashboard() {
  try {
    const data = await apiFetch("/me/summary");

    const name = data?.me?.name || "";
    const points = data?.me?.points ?? 0;
    const level = data?.me?.level ?? 1;

    document.getElementById("studentName").innerText = name;
    document.getElementById("points").innerText = points;
    document.getElementById("level").innerText = level;
    document.getElementById("level").innerText = data.me.level ?? 1;

    // TRIGGER LEVEL UP ANIMATION
    checkLevelUp(Number(data.me.level ?? 1));

    // ✅ store for header HUD initial load
    localStorage.setItem("points", points);
    localStorage.setItem("level", level);

    // ✅ broadcast HUD update (real data)
    window.dispatchEvent(new CustomEvent("hud:update", {
      detail: { level, points, xpPct: Math.min(100, (Number(points) || 0) % 100) }
    }));

    // progress bars
    const mp = data.modulesProgress || [];
    const p0 = mp[0]?.percent ?? 0;
    const p1 = mp[1]?.percent ?? 0;
    const p2 = mp[2]?.percent ?? 0;

    setProgressBar("fundamentals", p0);
    setProgressBar("controlFlow", p1);
    setProgressBar("oop", p2);

    // pct labels (your dashboard.html has these spans)
    setPctLabel("fundamentalsPct", p0);
    setPctLabel("controlFlowPct", p1);
    setPctLabel("oopPct", p2);

    // badges
    const earned = new Set(data.badges || []);
    document.querySelectorAll(".badge").forEach(badge => {
      const bName = badge.dataset.name;
      if (earned.has(bName)) {
        badge.classList.add("earned");
        badge.classList.remove("locked");
        badge.classList.add("unlocked");
      } else {
        badge.classList.add("locked");
        badge.classList.remove("earned");
        badge.classList.remove("unlocked");
      }
    });

    renderAnnouncement("announcementWidget");
  } catch (err) {
    console.error(err);
    window.location.href = "index.html";
  }
}

loadDashboard();
