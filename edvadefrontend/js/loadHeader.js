fetch("header.html")
  .then(r => r.text())
  .then(html => {
    document.body.insertAdjacentHTML("afterbegin", html);

    function applyHud({ level, points, xpPct } = {}) {
      const hudLevel = document.getElementById("hudLevel");
      const hudPoints = document.getElementById("hudPoints");
      const xpFill = document.getElementById("xpFill");

      if (hudLevel && level != null) hudLevel.textContent = level;
      if (hudPoints && points != null) hudPoints.textContent = points;

      if (xpFill) {
        const pct =
          xpPct != null
            ? Number(xpPct)
            : Math.min(100, (Number(points) || 0) % 100);

        xpFill.style.width = Math.max(0, Math.min(100, pct)) + "%";
      }
    }

    // 1) initial from localStorage (if available)
    const levelLS = localStorage.getItem("level");
    const pointsLS = localStorage.getItem("points");
    if (levelLS || pointsLS) {
      applyHud({ level: levelLS ?? "-", points: pointsLS ?? "-" });
    }

    // 2) listen for updates from any page
    window.addEventListener("hud:update", (e) => {
      applyHud(e.detail || {});
    });
  });
