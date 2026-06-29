requireAuth();

const token = localStorage.getItem("token");
let currentSettings = {};
let availableModules = [];
let modulePreferences = [];

const $ = (id) => document.getElementById(id);

function setSaveState(text, kind = "ok") {
  const el = $("saveState");
  if (!el) return;
  el.textContent = text;
  el.classList.remove("pill-ok", "pill-warn", "pill-bad");
  el.classList.add(kind === "ok" ? "pill-ok" : kind === "warn" ? "pill-warn" : "pill-bad");
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${window.API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  });

  const ct = res.headers.get("content-type") || "";
  const data = ct.includes("application/json") ? await res.json().catch(() => ({})) : await res.text();

  if (!res.ok) {
    const msg = typeof data === "string" ? data : (data.message || "Request failed");
    throw new Error(msg);
  }
  return data;
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}

function readLocalModulePreferences() {
  try {
    const prefs = JSON.parse(localStorage.getItem("modulePreferences") || "[]");
    return Array.isArray(prefs) ? prefs : [];
  } catch {
    return [];
  }
}

function preferenceMap() {
  return Object.fromEntries(
    modulePreferences.map(pref => [
      String(pref.moduleId ?? pref.module_id),
      pref.difficultyPreference || pref.difficulty_preference || "beginner"
    ])
  );
}

function setDifficultyForSelectedModule() {
  const moduleSelect = $("topicPreference");
  const difficultySelect = $("difficultyPreference");
  if (!moduleSelect || !difficultySelect) return;

  const selectedModuleId = String(moduleSelect.value || "");
  const prefs = preferenceMap();
  difficultySelect.value = prefs[selectedModuleId] || "beginner";
}

function rememberSelectedModulePreference(moduleId, difficultyPreference) {
  const key = String(moduleId || "");
  if (!key) return;

  const existing = modulePreferences.find(pref => String(pref.moduleId ?? pref.module_id) === key);
  if (existing) {
    existing.moduleId = Number(key);
    existing.difficultyPreference = difficultyPreference;
  } else {
    modulePreferences.push({
      moduleId: Number(key),
      difficultyPreference
    });
  }
}

function applySettings(s) {
  currentSettings = { ...currentSettings, ...s };
  modulePreferences = Array.isArray(currentSettings.modulePreferences)
    ? [...currentSettings.modulePreferences]
    : modulePreferences;

  const role = localStorage.getItem("role");
  if (role === "student") {
    const lpPanel = $("learningPreferencesPanel");
    if (lpPanel) lpPanel.style.display = "block";
    if ($("topicPreference")) $("topicPreference").value = currentSettings.topicPreference || "";
    setDifficultyForSelectedModule();
  }
}

function gatherSettings() {
  const payload = {
    theme: currentSettings.theme || localStorage.getItem("theme") || "light",
    notifyEmail: currentSettings.notifyEmail ?? ((localStorage.getItem("notifyEmail") ?? "true") === "true"),
    notifyPush: currentSettings.notifyPush ?? ((localStorage.getItem("notifyPush") ?? "false") === "true"),
    language: currentSettings.language || localStorage.getItem("language") || "en",
    timezone: currentSettings.timezone || localStorage.getItem("timezone") || "UTC"
  };

  const role = localStorage.getItem("role");
  if (role === "student") {
    const selectedModuleId = $("topicPreference")?.value || "";
    const selectedDifficulty = $("difficultyPreference")?.value || "beginner";

    payload.moduleId = selectedModuleId ? Number(selectedModuleId) : null;
    payload.difficultyPreference = selectedDifficulty;
    payload.topicPreference = selectedModuleId;
  }
  return payload;
}

async function loadSettings() {
  setSaveState("Loading...", "warn");

  const fallback = {
    theme: localStorage.getItem("theme") || "light",
    notifyEmail: (localStorage.getItem("notifyEmail") ?? "true") === "true",
    notifyPush: (localStorage.getItem("notifyPush") ?? "false") === "true",
    language: localStorage.getItem("language") || "en",
    timezone: localStorage.getItem("timezone") || "UTC",
    difficultyPreference: localStorage.getItem("difficultyPreference") || "beginner",
    topicPreference: localStorage.getItem("topicPreference") || "",
    modulePreferences: readLocalModulePreferences()
  };

  const role = localStorage.getItem("role");
  if (role === "student") {
    try {
      availableModules = await apiFetch("/modules");
      const select = $("topicPreference");
      if (select) {
        select.innerHTML = '<option value="">-- Select Preferred Chapter --</option>' +
          availableModules.map(m => `<option value="${m.id}">${escapeHtml(m.title)}</option>`).join("");
      }
    } catch (e) {
      console.error("Failed to load chapters for preference dropdown", e);
      const select = $("topicPreference");
      if (select) {
        select.innerHTML = '<option value="">Failed to load chapters</option>';
      }
    }
  }

  try {
    const data = await apiFetch("/settings", { method: "GET" });
    applySettings({ ...fallback, ...data });
    setSaveState("Loaded", "ok");
  } catch (e) {
    applySettings(fallback);
    setSaveState("Local only", "warn");
  }
}

async function saveSettings() {
  const payload = gatherSettings();
  setSaveState("Saving...", "warn");

  localStorage.setItem("theme", payload.theme);
  localStorage.setItem("notifyEmail", String(payload.notifyEmail));
  localStorage.setItem("notifyPush", String(payload.notifyPush));
  localStorage.setItem("language", payload.language);
  localStorage.setItem("timezone", payload.timezone);
  if (payload.difficultyPreference !== undefined) {
    localStorage.setItem("difficultyPreference", payload.difficultyPreference);
    localStorage.setItem("topicPreference", payload.topicPreference);
    rememberSelectedModulePreference(payload.moduleId, payload.difficultyPreference);
    localStorage.setItem("modulePreferences", JSON.stringify(modulePreferences));
  }

  try {
    await apiFetch("/settings", {
      method: "PUT",
      body: JSON.stringify(payload)
    });
    currentSettings = { ...currentSettings, ...payload };
    setSaveState("Saved", "ok");
    alert("Settings saved");
  } catch (e) {
    setSaveState("Saved locally", "warn");
    alert("Saved locally. Backend /settings could not be reached.");
  }
}

async function handlePasswordChange(e) {
  e.preventDefault();
  $("pwHint").textContent = "";

  const currentPassword = $("currentPw").value;
  const newPassword = $("newPw").value;
  const confirm = $("newPw2").value;

  if (!currentPassword || !newPassword) return alert("Please fill current + new password.");
  if (newPassword.length < 6) return alert("New password should be at least 6 characters.");
  if (newPassword !== confirm) return alert("Passwords do not match.");

  try {
    $("pwHint").textContent = "Updating...";
    await apiFetch("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword })
    });
    $("pwForm").reset();
    $("pwHint").textContent = "Password updated";
  } catch (e) {
    $("pwHint").textContent = "";
    alert("Password change failed: " + e.message);
  }
}

async function handleDeleteAccount() {
  if (!confirm("Delete your account permanently? This cannot be undone.")) return;

  try {
    await apiFetch("/account", { method: "DELETE" });
    logout();
  } catch (e) {
    alert("Delete failed: " + e.message);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  $("saveSettings")?.addEventListener("click", saveSettings);
  $("resetSettings")?.addEventListener("click", loadSettings);
  $("pwForm")?.addEventListener("submit", handlePasswordChange);
  $("deleteAccount")?.addEventListener("click", handleDeleteAccount);
  $("topicPreference")?.addEventListener("change", setDifficultyForSelectedModule);

  loadSettings();
});
