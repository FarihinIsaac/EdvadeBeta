(() => {
  const c = document.getElementById("bgWorld");
  if (!c) return;

  const ctx = c.getContext("2d");
  const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

  function resize() {
    c.style.position = "fixed";
    c.style.inset = "0";
    c.style.zIndex = "-5";
    c.style.pointerEvents = "none";

    c.width = Math.floor(window.innerWidth * DPR);
    c.height = Math.floor(window.innerHeight * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.imageSmoothingEnabled = false;
  }

  // simple tile palette (sky/grass/water)
  const TILE = 12; // pixel size
  const colors = {
    sky:  "#7dd3fc",
    sky2: "#38bdf8",
    grass:"#22c55e",
    grass2:"#16a34a",
    water:"#60a5fa",
    sand: "#fde68a"
  };

  let t = 0;

  function tileAt(x, y) {
    // very simple "noise": pattern based on coords
    const v = (Math.sin(x * 0.18) + Math.cos(y * 0.18) + Math.sin((x+y) * 0.07));
    if (y < 6) return v > 0.2 ? "sky" : "sky2";        // top sky band
    if (v > 1.0) return "water";
    if (v > 0.6) return "sand";
    return v > 0.0 ? "grass" : "grass2";
  }

  function draw() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    // scroll offsets (slow drifting “world”)
    const offX = Math.floor(t * 0.6);
    const offY = Math.floor(t * 0.25);

    ctx.clearRect(0, 0, w, h);

    // draw tiles
    const cols = Math.ceil(w / TILE) + 2;
    const rows = Math.ceil(h / TILE) + 2;

    for (let gy = 0; gy < rows; gy++) {
      for (let gx = 0; gx < cols; gx++) {
        const tx = gx + Math.floor(offX / TILE);
        const ty = gy + Math.floor(offY / TILE);

        const key = tileAt(tx, ty);
        ctx.fillStyle = colors[key];
        ctx.fillRect(gx * TILE - (offX % TILE), gy * TILE - (offY % TILE), TILE, TILE);

        // add tiny pixel “texture” dots
        if ((tx + ty) % 7 === 0) {
          ctx.fillStyle = "rgba(0,0,0,0.08)";
          ctx.fillRect(gx * TILE - (offX % TILE) + 2, gy * TILE - (offY % TILE) + 2, 2, 2);
        }
      }
    }

    // subtle dark vignette
    const g = ctx.createRadialGradient(w/2, h/2, 60, w/2, h/2, Math.max(w,h)/1.2);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,0.14)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    t += 0.35;
    requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener("resize", resize);
  draw();
})();