requireAuth();

const API_BASE = typeof API !== "undefined" ? API : "http://localhost:3000/api";
const user = JSON.parse(localStorage.getItem("user") || "{}");

const rolePill = document.getElementById("rolePill");
rolePill.textContent = user.role ? user.role.toUpperCase() : "STUDENT";

let modules = [];
let posts = [];

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}

function timeAgo(dateStr) {
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

async function loadModules() {
  modules = await apiFetch("/modules");
  const sel = document.getElementById("moduleSelect");

  sel.innerHTML = modules
    .map(m => `<option value="${m.id}">${escapeHtml(m.title)}</option>`)
    .join("");

  sel.addEventListener("change", loadPosts);

  document.getElementById("search").addEventListener("input", renderPosts);
  document.getElementById("btnPost").addEventListener("click", createPost);

  await loadPosts();
}

async function loadPosts() {
  const moduleId = Number(document.getElementById("moduleSelect").value);

  const res = await fetch(`${API_BASE}/forum/posts?moduleId=${moduleId}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });

  if (!res.ok) {
    alert("Failed to load posts. Login again.");
    logout();
    return;
  }

  posts = await res.json();
  renderPosts();

  // ✅ after posts render, load comments + reactions
  posts.forEach(p => {
    loadComments(p.id);
    loadPostReactions(p.id);
  });
}

function renderPosts() {
  const q = document.getElementById("search").value.trim().toLowerCase();
  const list = document.getElementById("postsList");
  const meta = document.getElementById("postsMeta");

  const filtered = posts.filter(p => (p.title || "").toLowerCase().includes(q));
  meta.textContent = `${filtered.length} post(s)`;

  if (!filtered.length) {
    list.innerHTML = `<div class="empty">No posts found.</div>`;
    return;
  }

  list.innerHTML = filtered.map(p => `
    <div class="post-card ${p.is_hidden ? "is-hidden" : ""}">
      <div class="post-head">
        <div class="post-main">
          <div class="post-title" onclick="openThread(${p.id})">${escapeHtml(p.title)}</div>
          <div class="post-meta">
            <span>by <b>${escapeHtml(p.authorName)}</b></span>
            <span class="dot">•</span>
            <span title="${new Date(p.created_at).toLocaleString()}">${timeAgo(p.created_at)}</span>
            ${p.is_hidden ? `<span class="chip">Hidden</span>` : ""}
          </div>
        </div>

        ${user.role === "lecturer" ? `
          <button class="btn-ghost" onclick="toggleHidePost(${p.id}, ${p.is_hidden ? "false" : "true"})">
            ${p.is_hidden ? "Unhide" : "Hide"}
          </button>
        ` : ""}
      </div>

      <div class="post-body">${escapeHtml(p.body)}</div>

      <div class="post-tools">
        <div class="reactions">
          <button class="react" onclick="reactPost(${p.id}, 'like')">
            👍 <span id="postLike_${p.id}">0</span>
          </button>
          <button class="react" onclick="reactPost(${p.id}, 'love')">
            ❤️ <span id="postLove_${p.id}">0</span>
          </button>
          <button class="react" onclick="reactPost(${p.id}, 'funny')">
            😂 <span id="postFunny_${p.id}">0</span>
          </button>
        </div>

        <button class="btn-mini" onclick="openThread(${p.id})">Open Thread →</button>
      </div>

      <div class="comment-box">
        <input class="input" id="commentInput_${p.id}" placeholder="Write a comment..." />
        <button class="btn-mini" onclick="addComment(${p.id})">Comment</button>
      </div>

      <div id="commentList_${p.id}" class="comment-list"></div>
    </div>
  `).join("");
}

function openThread(id) {
  location.href = `thread.html?id=${id}`;
}

async function createPost() {
  const moduleId = Number(document.getElementById("moduleSelect").value);
  const title = document.getElementById("postTitle").value.trim();
  const body = document.getElementById("postBody").value.trim();
  const hint = document.getElementById("postHint");

  if (!title || !body) {
    hint.textContent = "Please fill title and message.";
    return;
  }

  try {
    hint.textContent = "Posting...";
    await apiFetch(`/forum/posts`, {
      method: "POST",
      body: JSON.stringify({ moduleId, title, body })
    });

    document.getElementById("postTitle").value = "";
    document.getElementById("postBody").value = "";
    hint.textContent = "Posted ✅";

    await loadPosts();
  } catch (err) {
    hint.textContent = "";
    alert(err.message);
  }
}

async function toggleHidePost(postId, hide) {
  try {
    await apiFetch(`/forum/posts/${postId}/hide`, {
      method: "PATCH",
      body: JSON.stringify({ hide })
    });
    await loadPosts();
  } catch (err) {
    alert("Moderation failed: " + err.message);
  }
}

/* ============ COMMENTS ============ */
async function addComment(postId) {
  const input = document.getElementById(`commentInput_${postId}`);
  const body = (input?.value || "").trim();
  if (!body) return alert("Write a comment first.");

  try {
    await apiFetch(`/forum/posts/${postId}/comments`, {
      method: "POST",
      body: JSON.stringify({ body })
    });

    input.value = "";
    await loadComments(postId);
  } catch (err) {
    alert(err.message);
  }
}

async function loadComments(postId) {
  const box = document.getElementById(`commentList_${postId}`);
  if (!box) return;

  try {
    const comments = await apiFetch(`/forum/posts/${postId}/comments`);
    if (!comments.length) {
      box.innerHTML = `<div class="empty small">No comments yet.</div>`;
      return;
    }

    box.innerHTML = comments.map(c => `
      <div class="comment">
        <div class="comment-meta">
          <b>${escapeHtml(c.authorName)}</b>
          <span class="dot">•</span>
          <span>${timeAgo(c.created_at)}</span>
        </div>
        <div class="comment-body">${escapeHtml(c.body)}</div>

        <div class="reactions small">
          <button class="react" onclick="reactComment(${c.id}, 'like')">
            👍 <span id="cLike_${c.id}">0</span>
          </button>
          <button class="react" onclick="reactComment(${c.id}, 'love')">
            ❤️ <span id="cLove_${c.id}">0</span>
          </button>
          <button class="react" onclick="reactComment(${c.id}, 'funny')">
            😂 <span id="cFunny_${c.id}">0</span>
          </button>
        </div>
      </div>
    `).join("");

    comments.forEach(c => loadCommentReactions(c.id));
  } catch (err) {
    box.innerHTML = `<div class="empty small">Error loading comments.</div>`;
  }
}

/* ============ REACTIONS ============ */
async function reactPost(postId, reaction) {
  await apiFetch(`/forum/posts/${postId}/reactions`, {
    method: "POST",
    body: JSON.stringify({ reaction })
  });
  await loadPostReactions(postId);
}

async function loadPostReactions(postId) {
  const counts = await apiFetch(`/forum/posts/${postId}/reactions`);
  const likeEl = document.getElementById(`postLike_${postId}`);
  const loveEl = document.getElementById(`postLove_${postId}`);
  const funnyEl = document.getElementById(`postFunny_${postId}`);

  if (likeEl) likeEl.textContent = counts.like ?? 0;
  if (loveEl) loveEl.textContent = counts.love ?? 0;
  if (funnyEl) funnyEl.textContent = counts.funny ?? 0;
}

async function reactComment(commentId, reaction) {
  await apiFetch(`/forum/comments/${commentId}/reactions`, {
    method: "POST",
    body: JSON.stringify({ reaction })
  });
  await loadCommentReactions(commentId);
}

async function loadCommentReactions(commentId) {
  try {
    const counts = await apiFetch(`/forum/comments/${commentId}/reactions`);
    const likeEl = document.getElementById(`cLike_${commentId}`);
    const loveEl = document.getElementById(`cLove_${commentId}`);
    const funnyEl = document.getElementById(`cFunny_${commentId}`);

    if (likeEl) likeEl.textContent = counts.like ?? 0;
    if (loveEl) loveEl.textContent = counts.love ?? 0;
    if (funnyEl) funnyEl.textContent = counts.funny ?? 0;
  } catch {}
}

/* expose functions used in HTML onclick */
window.openThread = openThread;
window.toggleHidePost = toggleHidePost;
window.addComment = addComment;
window.reactPost = reactPost;
window.reactComment = reactComment;

loadModules().catch(err => {
  console.error(err);
  alert("Failed to load forum: " + err.message);
});
