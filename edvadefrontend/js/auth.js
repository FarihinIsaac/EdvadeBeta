
// One API base for the whole frontend
window.API =
  window.API ||
  localStorage.getItem("API_BASE") ||
  `${location.protocol}//${location.hostname}:3000/api`;

/* ======================
   SESSION HELPERS
====================== */
function saveSession(data) {
  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));
  localStorage.setItem("role", data.user.role); // ✅ important
}

function getToken() {
  return localStorage.getItem("token");
}

function requireAuth() {
  if (!getToken()) window.location.href = "index.html";
}

/* ======================
   REGISTER (STUDENT)
====================== */
async function registerStudent() {
  const name = document.getElementById("name").value.trim();
  const mobile = document.getElementById("mobile").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const password2 = document.getElementById("password2").value;

  if (password !== password2) return alert("Passwords do not match");

  const res = await fetch(`${API}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, mobile, email, password })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) return alert(data.message || "Register failed");

  alert("Registered! Please login.");
  window.location.href = "index.html";
}

/* ======================
   LOGIN (STUDENT + LECTURER)
====================== */
async function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) return alert("Please fill in all fields");

  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) return alert(data.message || "Login failed");

  saveSession(data);

  // ✅ redirect by role from DB
  const role = data?.user?.role;
  if (role === "lecturer") {
    window.location.href = "lecturer-dashboard.html";
  } else {
    window.location.href = "home.html";
  }
}

/* Backward compatibility (if your HTML still calls loginStudent()) */
function loginStudent() {
  login();
}

/* ======================
   LOGOUT
====================== */
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("role");
  window.location.href = "index.html";
}
