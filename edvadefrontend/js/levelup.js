// js/levelup.js
// Usage: call checkLevelUp(newLevel) after you fetch fresh user data.

function showLevelUp(newLevel) {
  // create overlay
  const el = document.createElement("div");
  el.className = "lvlup-overlay";
  el.innerHTML = `
    <div class="lvlup-card">
      <div class="lvlup-badge">🎉</div>
      <div class="lvlup-title">LEVEL UP!</div>
      <div class="lvlup-level">Level ${newLevel}</div>
    </div>
    <div class="lvlup-confetti"></div>
  `;
  document.body.appendChild(el);

  // confetti (simple)
  const conf = el.querySelector(".lvlup-confetti");
  for (let i = 0; i < 60; i++) {
    const p = document.createElement("span");
    p.className = "confetti";
    p.style.left = Math.random() * 100 + "vw";
    p.style.animationDelay = Math.random() * 0.3 + "s";
    p.style.transform = `rotate(${Math.random() * 360}deg)`;
    conf.appendChild(p);
  }

  setTimeout(() => el.classList.add("show"), 10);
  setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => el.remove(), 400);
  }, 1500);
}

// compare old vs new level (stored in localStorage)
function checkLevelUp(currentLevel) {
  const key = "lastLevel";
  const last = Number(localStorage.getItem(key) || "0");
  if (currentLevel > last) showLevelUp(currentLevel);
  localStorage.setItem(key, String(currentLevel));
}

window.checkLevelUp = checkLevelUp;
