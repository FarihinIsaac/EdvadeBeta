// js/lecturer-module.js

requireAuth();

const user = JSON.parse(localStorage.getItem("user") || "{}");
const role = user.role || localStorage.getItem("role");
if (role !== "lecturer") window.location.href = "index.html";

const els = {
  title: document.getElementById("modTitle"),
  desc: document.getElementById("modDesc"),
  unlock: document.getElementById("modUnlock"),
  order: document.getElementById("modOrder"),
  addBtn: document.getElementById("addModuleBtn"),
  list: document.getElementById("moduleList"),
  hint: document.getElementById("moduleHint"),
  search: document.getElementById("moduleSearch")
};

let modules = [];

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, m => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[m]));
}

function setHint(msg, isError = false) {
  if (!els.hint) return;
  els.hint.textContent = msg || "";
  els.hint.style.color = isError ? "#b91c1c" : "#047857";
}

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token");

  // IMPORTANT: if your frontend is running on 127.0.0.1, still call API using localhost
  // Keep consistent to avoid CORS/token confusion.
  const res = await fetch(`${window.API}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    },
    body: options.body
  });

  const contentType = res.headers.get("content-type") || "";
  let data;

  if (contentType.includes("application/json")) {
    data = await res.json().catch(() => ({}));
  } else {
    const text = await res.text().catch(() => "");
    data = { message: text };
  }

  if (!res.ok) {
    throw new Error(data.message || `HTTP ${res.status}`);
  }
  return data;
}

function renderModules() {
  const q = (els.search?.value || "").trim().toLowerCase();
  const filtered = modules.filter(m => (m.title || "").toLowerCase().includes(q));

  if (!filtered.length) {
    els.list.innerHTML = `<div class="empty">No modules found.</div>`;
    return;
  }

  els.list.innerHTML = filtered.map(m => `
    <div class="post">
      <div class="row space" style="align-items:flex-start;">
        <div style="min-width:0;">
          <div class="post-title">${escapeHtml(m.title)}</div>
          <div class="muted small" style="margin-top:4px;">
            ${escapeHtml(m.description || "")}
          </div>
          <div class="muted small" style="margin-top:6px;">
            <span class="tag">Unlock: ${Number(m.unlock_points ?? 0)} pts</span>
            <span class="tag">Order: ${Number(m.order_no ?? 0)}</span>
          </div>
        </div>

        <div class="row gap" style="flex-wrap:wrap; justify-content:flex-end;">
          <button class="btn-mini" onclick="editModule(${m.id})">Edit</button>
          <button class="btn-mini danger" onclick="deleteModule(${m.id}, '${escapeHtml(m.title)}')">Delete</button>
        </div>
      </div>
    </div>
  `).join("");
}

async function loadModules() {
  try {
    setHint("Loading modules...");
    modules = await apiFetch("/lecturer/modules");
    renderModules();
    setHint("");
  } catch (err) {
    console.error(err);
    setHint(`Failed to load: ${err.message}`, true);
  }
}

async function loadKPIs() {
  try {
    let totalQuestions = 0;
    let totalUnlocked = 0;
    let lastUpdated = "—";

    for (const mod of modules) {
      const questions = await apiFetch(`/lecturer/modules/${mod.id}/questions`);
      totalQuestions += questions.length;
      
      if (Number(mod.unlock_points ?? 0) > 0) {
        totalUnlocked++;
      }
    }

    document.getElementById("kpiTotalModules").textContent = modules.length;
    document.getElementById("kpiUnlocked").textContent = totalUnlocked;
    document.getElementById("kpiQuestions").textContent = totalQuestions;
    document.getElementById("kpiLastUpdated").textContent = lastUpdated;
  } catch (err) {
    console.error("Error loading KPIs:", err);
  }
}

async function createModule() {
  const title = (els.title?.value || "").trim();
  const description = (els.desc?.value || "").trim();
  const unlock_points = Number((els.unlock?.value || "0").trim() || 0);

  // If order is empty, server will auto-assign (your server.js does this)
  const orderRaw = (els.order?.value || "").trim();
  const order_no = orderRaw ? Number(orderRaw) : undefined;

  if (!title) return setHint("Title is required.", true);

  try {
    setHint("Creating...");
    await apiFetch("/lecturer/modules", {
      method: "POST",
      body: JSON.stringify({ title, description, unlock_points, order_no })
    });

    els.title.value = "";
    els.desc.value = "";
    els.unlock.value = 0;
    els.order.value = "";

    setHint("Created ✅");
    await loadModules();
  } catch (err) {
    console.error(err);
    setHint(`Create failed: ${err.message}`, true);
    alert(`Create failed: ${err.message}`);
  }
}

async function deleteModule(id, title) {
  const ok = confirm(`Delete module "${title}"?\nThis will also delete questions under it.`);
  if (!ok) return;

  try {
    setHint("Deleting...");
    await apiFetch(`/lecturer/modules/${id}`, { method: "DELETE" });
    setHint("Deleted ✅");
    await loadModules();
  } catch (err) {
    console.error(err);
    setHint(`Delete failed: ${err.message}`, true);
    alert(`Delete failed: ${err.message}\n\nOpen DevTools > Network to see the backend message.`);
  }
}

async function editModule(id) {
  const m = modules.find(x => x.id === id);
  if (!m) return;

  const newTitle = prompt("Title:", m.title ?? "");
  if (newTitle === null) return;

  const newDesc = prompt("Description:", m.description ?? "");
  if (newDesc === null) return;

  const newUnlock = prompt("Unlock points:", String(m.unlock_points ?? 0));
  if (newUnlock === null) return;

  const newOrder = prompt("Order:", String(m.order_no ?? 1));
  if (newOrder === null) return;

  try {
    setHint("Updating...");
    await apiFetch(`/lecturer/modules/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        title: newTitle.trim(),
        description: newDesc.trim(),
        unlock_points: Number(newUnlock) || 0,
        order_no: Number(newOrder) || 1
      })
    });

    setHint("Updated ✅");
    await loadModules();
  } catch (err) {
    console.error(err);
    setHint(`Update failed: ${err.message}`, true);
    alert(`Update failed: ${err.message}`);
  }
}

// Wire up
document.addEventListener("DOMContentLoaded", () => {
  els.addBtn?.addEventListener("click", createModule);
  els.search?.addEventListener("input", renderModules);
  loadModules();
  loadKPIs();

  // Refresh button
  document.getElementById("refreshBtn")?.addEventListener("click", () => {
    loadModules();
    loadKPIs();
  });
});

// Expose for onclick
window.deleteModule = deleteModule;
window.editModule = editModule;
