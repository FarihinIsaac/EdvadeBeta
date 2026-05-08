console.log("Edvade loaded successfully!");

// ✅ Require login (token + user)
const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user") || "null");

if (!token || !user) {
  window.location.href = "index.html";
}

// ✅ Optional: student-only protection
if (localStorage.getItem("role") !== "student") {
  window.location.href = "index.html";
}

// ✅ Display user basics (fallback if points/level missing)
document.getElementById("studentName").innerText = user.name || "Student";
document.getElementById("points").innerText = user.points ?? 0;
document.getElementById("level").innerText = user.level ?? (Math.floor((user.points ?? 0) / 100) + 1);

// ✅ Progress bars (only if you have them in storage)
const progress = user.progress || { fundamentals: 0, controlFlow: 0, oop: 0 };

const fundamentalsEl = document.getElementById("fundamentals");
const controlFlowEl = document.getElementById("controlFlow");
const oopEl = document.getElementById("oop");

if (fundamentalsEl) fundamentalsEl.style.width = (progress.fundamentals || 0) + "%";
if (controlFlowEl) controlFlowEl.style.width = (progress.controlFlow || 0) + "%";
if (oopEl) oopEl.style.width = (progress.oop || 0) + "%";

// ✅ Badges (only if exist)
const badges = user.badges || [];

document.querySelectorAll(".badge").forEach(badge => {
  const badgeName = badge.dataset.name;
  if (badgeName && badges.includes(badgeName)) {
    badge.classList.add("earned");
    badge.classList.remove("locked");
  }
});
