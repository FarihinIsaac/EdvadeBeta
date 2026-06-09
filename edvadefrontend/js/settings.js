requireAuth();

const token = localStorage.getItem("token");
let currentSettings = {};

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

  // some endpoints may return text/html on error — handle safely
  const ct = res.headers.get("content-type") || "";
  const data = ct.includes("application/json") ? await res.json().catch(() => ({})) : await res.text();

  if (!res.ok) {
    const msg = typeof data === "string" ? data : (data.message || "Request failed");
    throw new Error(msg);
  }
  return data;
}

function applySettings(s) {
  currentSettings = { ...currentSettings, ...s };

  const role = localStorage.getItem("role");
  if (role === "student") {
    const lpPanel = $("learningPreferencesPanel");
    if (lpPanel) lpPanel.style.display = "block";
    if ($("difficultyPreference")) $("difficultyPreference").value = s.difficultyPreference || "beginner";
    if ($("topicPreference")) $("topicPreference").value = s.topicPreference || "";
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
    payload.difficultyPreference = $("difficultyPreference").value;
    payload.topicPreference = $("topicPreference").value;
  }
  return payload;
}

// ✅ Works even if backend endpoints do not exist (fallback to localStorage)
async function loadSettings() {
  setSaveState("Loading…", "warn");

  // fallback defaults
  const fallback = {
    theme: localStorage.getItem("theme") || "light",
    notifyEmail: (localStorage.getItem("notifyEmail") ?? "true") === "true",
    notifyPush: (localStorage.getItem("notifyPush") ?? "false") === "true",
    language: localStorage.getItem("language") || "en",
    timezone: localStorage.getItem("timezone") || "UTC",
    difficultyPreference: localStorage.getItem("difficultyPreference") || "beginner",
    topicPreference: localStorage.getItem("topicPreference") || ""
  };

  try {
    const data = await apiFetch("/settings", { method: "GET" });
    applySettings({ ...fallback, ...data });
    setSaveState("Loaded", "ok");
  } catch (e) {
    // Endpoint missing → just use localStorage
    applySettings(fallback);
    setSaveState("Local only", "warn");
  }
}

async function saveSettings() {
  const payload = gatherSettings();
  setSaveState("Saving…", "warn");

  // always save locally (so it still works without backend)
  localStorage.setItem("theme", payload.theme);
  localStorage.setItem("notifyEmail", String(payload.notifyEmail));
  localStorage.setItem("notifyPush", String(payload.notifyPush));
  localStorage.setItem("language", payload.language);
  localStorage.setItem("timezone", payload.timezone);
  if (payload.difficultyPreference !== undefined) {
    localStorage.setItem("difficultyPreference", payload.difficultyPreference);
    localStorage.setItem("topicPreference", payload.topicPreference);
  }

  try {
    await apiFetch("/settings", {
      method: "PUT",
      body: JSON.stringify(payload)
    });
    setSaveState("Saved", "ok");
    alert("Settings saved ✅");
  } catch (e) {
    // backend missing → still ok locally
    setSaveState("Saved locally", "warn");
    alert("Saved locally ✅ (backend /settings not found)");
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
    $("pwHint").textContent = "Updating…";
    await apiFetch("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword })
    });
    $("pwForm").reset();
    $("pwHint").textContent = "Password updated ✅";
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
  $("saveSettings").addEventListener("click", saveSettings);
  $("resetSettings").addEventListener("click", loadSettings);
  $("pwForm").addEventListener("submit", handlePasswordChange);
  $("deleteAccount").addEventListener("click", handleDeleteAccount);

  loadSettings();
});
