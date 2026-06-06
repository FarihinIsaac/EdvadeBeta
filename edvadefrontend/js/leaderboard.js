requireAuth();
if (localStorage.getItem("role") !== "student") {
  window.location.href = "index.html";
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

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  })[ch]);
}

function renderBadges(badges) {
  const container = document.getElementById("myBadges");
  if (!container) return;

  if (!Array.isArray(badges) || badges.length === 0) {
    container.innerHTML = `<div class="leaderboard-empty">No badges earned yet.</div>`;
    return;
  }

  container.innerHTML = badges
    .map(b => `<span class="badge-pill">${esc(b)}</span>`)
    .join("");
}

function renderTopStudents(students) {
  const body = document.getElementById("topStudentsBody");
  if (!body) return;

  if (!Array.isArray(students) || students.length === 0) {
    body.innerHTML = `<tr><td colspan="6" class="leaderboard-empty">No leaderboard data available.</td></tr>`;
    return;
  }

  body.innerHTML = students
    .map((student, index) => {
      const contact = student.mobile ? esc(student.mobile) : esc(student.email || "-");
      const badgeHtml = Array.isArray(student.badges) && student.badges.length > 0
        ? student.badges.map(b => `<span class="badge-pill">${esc(b)}</span>`).join(" ")
        : `<span class="leaderboard-empty">None</span>`;

      const profileLink = `student-profile.html?id=${encodeURIComponent(student.id)}`;
      const avatarUrl = esc(student.profilePic || "https://via.placeholder.com/40/9CA3AF/FFFFFF?text=U");
      return `
      <tr>
        <td>${index + 1}</td>
        <td>
          <a href="${profileLink}" class="leaderboard-name-cell">
            <img class="leaderboard-avatar" src="${avatarUrl}" alt="${esc(student.name)}" onerror="this.onerror=null;this.src='https://via.placeholder.com/40/9CA3AF/FFFFFF?text=U'">
            <span>${esc(student.name)}</span>
          </a>
        </td>
        <td>${contact}</td>
        <td>${Number(student.points || 0)}</td>
        <td>${Number(student.level || 1)}</td>
        <td>${badgeHtml}</td>
      </tr>
    `;
    })
    .join("");
}

async function loadLeaderboard() {
  try {
    const data = await apiFetch("/leaderboard");
    const me = data?.me || {};

    document.getElementById("myName").textContent = me.name || "You";
    document.getElementById("myRank").textContent = me.rank != null ? me.rank : "-";
    document.getElementById("myPoints").textContent = me.points != null ? me.points : "-";
    document.getElementById("myLevel").textContent = me.level != null ? me.level : "-";
    document.getElementById("myContact").textContent = me.mobile || me.email || "-";
    const avatarUrl = me.profilePic || "https://via.placeholder.com/80/9CA3AF/FFFFFF?text=U";
    const myAvatar = document.getElementById("myAvatar");
    if (myAvatar) {
      myAvatar.src = avatarUrl;
      myAvatar.alt = `${me.name || "Your"} profile picture`;
      myAvatar.onerror = function() {
        this.onerror = null;
        this.src = 'https://via.placeholder.com/80/9CA3AF/FFFFFF?text=U';
      };
    }

    const xpPct = Number(me.points || 0) % 100;
    const xpValue = Number(me.points || 0);
    const xpNext = 100 - xpPct;
    const xpProgress = document.getElementById("myXpProgress");
    if (xpProgress) xpProgress.style.width = `${xpPct}%`;
    const xpText = document.getElementById("myXpText");
    if (xpText) xpText.textContent = `${xpValue} XP • ${xpNext} XP to next level`;

    renderBadges(data.badges || []);
    renderTopStudents(data.topStudents || []);
  } catch (err) {
    console.error(err);
    const body = document.getElementById("topStudentsBody");
    if (body) {
      body.innerHTML = `<tr><td colspan="6" class="leaderboard-empty">${esc(err.message || "Failed to load leaderboard.")}</td></tr>`;
    }
    document.getElementById("myBadges").innerHTML = `<div class="leaderboard-empty">Unable to load badges.</div>`;
  }
}

loadLeaderboard();
