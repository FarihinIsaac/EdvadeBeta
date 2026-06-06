requireAuth();
if (localStorage.getItem("role") !== "student") {
  window.location.href = "index.html";
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  })[ch]);
}

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token");
  const res = await fetch(window.API + path, {
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

function renderBadges(badges) {
  const container = document.getElementById("profileBadges");
  if (!container) return;

  if (!Array.isArray(badges) || badges.length === 0) {
    container.innerHTML = `<div class="leaderboard-empty">No badges earned yet.</div>`;
    return;
  }

  container.innerHTML = badges
    .map(b => `<span class="badge-pill">${esc(b)}</span>`)
    .join("");
}

async function loadProfile() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) {
    alert("Student ID missing.");
    window.location.href = "leaderboard.html";
    return;
  }

  try {
    const data = await apiFetch(`/users/${encodeURIComponent(id)}`);
    document.getElementById("profileName").textContent = data.name || "-";
    document.getElementById("profileEmail").textContent = data.email || "-";
    document.getElementById("profileMobile").textContent = data.mobile || "-";
    document.getElementById("profilePoints").textContent = data.points != null ? data.points : "-";
    document.getElementById("profileLevel").textContent = data.level != null ? data.level : "-";
    document.getElementById("profileAttempts").textContent = data.attempts != null ? data.attempts : "-";
    document.getElementById("profileRank").textContent = data.rank != null ? data.rank : "-";
    renderBadges(data.badges || []);
  } catch (err) {
    console.error(err);
    alert(err.message || "Failed to load profile.");
    window.location.href = "leaderboard.html";
  }
}

loadProfile();
