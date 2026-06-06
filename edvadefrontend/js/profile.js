// Simple profile loader/saver (API set by config.js)
const token = localStorage.getItem('token');

if (!token) {
  // require auth
  window.location.href = 'index.html';
}

function byId(id){ return document.getElementById(id); }

async function apiGet(path) {
  const res = await fetch(`${window.API}${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

async function loadProfile() {
  try {
    // Try /profile first
    let r = await apiGet("/profile");

    // Fallback to /me/summary (used by dashboard)
    if (!r.ok) {
      r = await apiGet("/me/summary");
      if (!r.ok) return;

      const me = r.data.me || {};

      byId("fullName").value = me.name || "";
      byId("email").value = me.email || "";
      byId("studentId").value = me.studentId || me.id || me._id || "";
      byId("program").value = me.program || "";
      byId("bio").value = me.bio || "";
      byId("phone").value = me.mobile || me.phone || "";
      byId("profilePic").value = me.profilePic || "";

      const pic = me.profilePic || "https://via.placeholder.com/120";
      byId("profilePicPreview").src = pic;

      byId("displayName").innerText = me.name || "Student Profile";
      byId("displayEmail").innerText = me.email || "";
      return;
    }

    // If /profile exists
    const data = r.data || {};

    byId("fullName").value = data.fullName || data.name || "";
    byId("email").value = data.email || "";
    byId("studentId").value = data.studentId || data.id || data._id || "";
    byId("program").value = data.program || "";
    byId("bio").value = data.bio || "";
    byId("phone").value = data.phone || data.mobile || "";
    byId("profilePic").value = data.profilePic || "";

    const pic = data.profilePic || "https://via.placeholder.com/120";
    byId("profilePicPreview").src = pic;

    byId("displayName").innerText = byId("fullName").value || "Student Profile";
    byId("displayEmail").innerText = byId("email").value || "";

  } catch (err) {
    console.error("loadProfile error", err);
  }
}


async function saveProfile(payload) {
  try {
    const res = await fetch(`${window.API}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const text = await res.text();
      alert('Save failed: ' + (text || res.status));
      console.error('saveProfile failed', res.status, text);
      return false;
    }

    const updated = await res.json();
    return updated;
  } catch (err) {
    console.error('saveProfile error', err);
    alert('Network error while saving profile.');
    return false;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const form = byId('profileForm');
  const picInput = byId('profilePic');

  // update preview when profilePic changes
  picInput.addEventListener('input', () => {
    const u = picInput.value.trim();
    if (u) byId('profilePicPreview').src = u;
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      fullName: byId('fullName').value.trim(),
      email: byId('email').value.trim(),
      studentId: byId('studentId').value.trim(),
      program: byId('program').value,
      bio: byId('bio').value.trim(),
      phone: byId('phone').value.trim(),
      profilePic: byId('profilePic').value.trim()
    };

    const result = await saveProfile(payload);
    if (result) {
      alert('Profile saved successfully.');
      // refresh display values
      byId('displayName').innerText = payload.fullName || 'Student Profile';
      byId('displayEmail').innerText = payload.email || '';
      if (payload.profilePic) byId('profilePicPreview').src = payload.profilePic;
    }
  });
  

  loadProfile();
});