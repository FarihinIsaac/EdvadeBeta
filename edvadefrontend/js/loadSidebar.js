// js/loadSidebar.js
(function () {
  async function fetchSidebar() {
    const res = await fetch("sidebar.html");
    if (!res.ok) throw new Error(res.status + " " + res.statusText);
    const html = await res.text();
    const tmp = document.createElement("div");
    tmp.innerHTML = html.trim();
    return tmp.firstElementChild;
  }

  function wireLogout(btn) {
    btn.addEventListener("click", () => {
      if (typeof window.logout === "function") return window.logout();
      setTimeout(() => typeof window.logout === "function" && window.logout(), 150);
      setTimeout(() => typeof window.logout === "function" && window.logout(), 600);
    });
  }

  function setActiveNav(sidebarEl) {
    const page = (location.pathname.split("/").pop() || "").toLowerCase();
    const map = {
      "home.html": "home",
      "dashboard.html": "dashboard",
      "leaderboard.html": "leaderboard",
      "student-module.html": "modules",
      "forum.html": "forum",
      "profile.html": "profile",
      "settings.html": "settings"
    };
    const key = map[page];
    if (!key) return;
    const btn = sidebarEl.querySelector(`[data-nav="${key}"]`);
    if (btn) btn.classList.add("active");

    // Update sidebar label
    const labelMap = {
      "home": "Home",
      "dashboard": "Dashboard",
      "leaderboard": "Leaderboard",
      "modules": "Modules",
      "forum": "Forum",
      "profile": "Profile",
      "settings": "Settings"
    };
    const labelEl = sidebarEl.querySelector("#sidebarLabel");
    if (labelEl && key) {
      labelEl.textContent = labelMap[key] || "Dashboard";
    }
  }

  async function init() {
    if (document.readyState === "loading") {
      await new Promise(r => document.addEventListener("DOMContentLoaded", r, { once: true }));
    }

    try {
      const sidebarEl = await fetchSidebar();
      if (!sidebarEl) return;

      const mount = document.getElementById("sidebarMount");
      if (mount) mount.replaceWith(sidebarEl);
      else document.body.insertAdjacentElement("afterbegin", sidebarEl);

      document.body.classList.add("has-sidebar");
      if (document.querySelector(".main-header, .topbar, header, .dashboard-header")) {
        document.body.classList.add("has-topbar");
      }

      setActiveNav(sidebarEl);

      const logoutBtn = sidebarEl.querySelector(".sidebtn.logout");
      if (logoutBtn) wireLogout(logoutBtn);

    } catch (e) {
      console.error("loadSidebar error:", e);
    }
  }

  init();
})();

