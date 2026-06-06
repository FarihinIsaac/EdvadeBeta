requireAuth();

const user = JSON.parse(localStorage.getItem("user") || "{}");
const id = new URLSearchParams(location.search).get("id");

let thread = null;

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}

async function safeJson(res) {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json().catch(() => ({}));
  const text = await res.text().catch(() => "");
  return { message: text };
}

async function loadThread() {
  try {
    const res = await fetch(`${window.API}/forum/posts/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });

    const data = await safeJson(res);
    if (!res.ok) {
      alert(data.message || "Thread not found");
      location.href = "forum.html";
      return;
    }

    console.log("Thread payload:", data); // ✅ SEE WHAT BACKEND RETURNS
    thread = data;
    renderThread();
  } catch (e) {
    console.error(e);
    alert("Failed to load thread: " + e.message);
  }
}

function getRepliesArray() {
  // ✅ Handle different backend property names
  const r =
    thread?.replies ??
    thread?.comments ??
    thread?.repliesRows ??
    thread?.rows ??
    [];

  return Array.isArray(r) ? r : [];
}

function renderThread() {
  const box = document.getElementById("threadBox");
  if (!box) return;

  const p = thread?.post || thread?.data?.post;
  if (!p) {
    box.innerHTML = `<div class="card"><div class="empty">Thread data missing "post". Check console.</div></div>`;
    return;
  }

  const replies = getRepliesArray();

  box.innerHTML = `
    <div class="card">
      <div class="row space">
        <div>
          <h2 class="m0">${escapeHtml(p.title)}</h2>
          <div class="muted small">by ${escapeHtml(p.authorName)} • ${new Date(p.created_at).toLocaleString()}</div>
        </div>
        ${user.role === "lecturer" ? `
          <button class="btn-mini" onclick="toggleHidePost(${p.id}, ${p.is_hidden ? "false" : "true"})">
            ${p.is_hidden ? "Unhide" : "Hide"}
          </button>
        ` : ""}
      </div>
      <p class="post-body big">${escapeHtml(p.body)}</p>
      ${p.is_hidden ? `<div class="tag">Hidden (lecturer)</div>` : ""}
    </div>

    <div class="card">
      <h3 class="m0">Replies</h3>
      <div class="replies">
        ${replies.length ? replies.map(r => `
          <div class="reply ${r.is_hidden ? "hidden" : ""}">
            <div class="row space">
              <div class="muted small">
                ${escapeHtml(r.authorName)} • ${new Date(r.created_at).toLocaleString()}
              </div>
              ${user.role === "lecturer" ? `
                <button class="btn-mini" onclick="toggleHideReply(${r.id}, ${r.is_hidden ? "false" : "true"})">
                  ${r.is_hidden ? "Unhide" : "Hide"}
                </button>
              ` : ""}
            </div>
            <div>${escapeHtml(r.body)}</div>
            ${r.is_hidden ? `<div class="tag">Hidden</div>` : ""}
          </div>
        `).join("") : `<div class="empty">No replies yet.</div>`}
      </div>
    </div>
  `;
}

async function submitReply() {
  const bodyEl = document.getElementById("replyBody");
  const hintEl = document.getElementById("replyHint");
  const body = (bodyEl?.value || "").trim();
  if (!body) return;

  const res = await fetch(`${window.API}/forum/posts/${id}/replies`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`
    },
    body: JSON.stringify({ body })
  });

  const data = await safeJson(res);
  if (!res.ok) return alert(data.message || "Failed to reply");

  bodyEl.value = "";
  if (hintEl) hintEl.textContent = "Replied ✅";
  await loadThread();
}

async function toggleHidePost(postId, hide) {
  const res = await fetch(`${window.API}/forum/posts/${postId}/hide`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`
    },
    body: JSON.stringify({ hide })
  });
  if (!res.ok) return alert("Moderation failed");
  await loadThread();
}

async function toggleHideReply(replyId, hide) {
  const res = await fetch(`${window.API}/forum/replies/${replyId}/hide`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`
    },
    body: JSON.stringify({ hide })
  });
  if (!res.ok) return alert("Moderation failed");
  await loadThread();
}

// expose for onclick buttons
window.toggleHidePost = toggleHidePost;
window.toggleHideReply = toggleHideReply;

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("replyBtn")?.addEventListener("click", submitReply);
  loadThread();
});
