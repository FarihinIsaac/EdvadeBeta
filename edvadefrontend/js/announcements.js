async function getAnnouncement() {
  try {
    const response = await fetch(`${window.API}/announcements`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (err) {
    console.error("Failed to fetch announcement:", err);
    return null;
  }
}

async function saveAnnouncement({ title, message }) {
  const response = await fetch(`${window.API}/announcements`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`
    },
    body: JSON.stringify({ title, message })
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Failed to save announcement");
  }
  return await response.json();
}

async function renderAnnouncement(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const announcement = await getAnnouncement();
  container.innerHTML = "";

  if (!announcement || !announcement.message) {
    const empty = document.createElement("div");
    empty.className = "announcement-empty";
    empty.textContent = "No announcements yet. Your lecturer will share one here soon.";
    container.appendChild(empty);
    return;
  }

  const card = document.createElement("div");
  card.className = "announcement-card";

  const header = document.createElement("div");
  header.className = "announcement-header";

  const title = document.createElement("strong");
  title.textContent = announcement.title;
  const meta = document.createElement("span");
  meta.textContent = `Posted ${new Date(announcement.publishedAt).toLocaleString()}`;
  header.appendChild(title);
  header.appendChild(meta);

  const body = document.createElement("p");
  body.textContent = announcement.message;
  body.className = "announcement-body";

  const footer = document.createElement("div");
  footer.className = "announcement-footer";
  footer.textContent = `By ${announcement.author}`;

  card.appendChild(header);
  card.appendChild(body);
  card.appendChild(footer);
  container.appendChild(card);
}

async function initAnnouncementEditor(formId, titleId, messageId, statusId, previewId) {
  const form = document.getElementById(formId);
  if (!form) return;

  const titleInput = document.getElementById(titleId);
  const messageInput = document.getElementById(messageId);
  const status = document.getElementById(statusId);
  const preview = document.getElementById(previewId);

  const existing = await getAnnouncement();
  if (existing) {
    if (titleInput) titleInput.value = existing.title;
    if (messageInput) messageInput.value = existing.message;
  }

  if (preview) await renderAnnouncement(previewId);

  form.addEventListener("submit", async event => {
    event.preventDefault();

    if (!titleInput || !messageInput) return;
    if (!messageInput.value.trim()) {
      alert("Please type an announcement message before publishing.");
      return;
    }

    try {
      await saveAnnouncement({
        title: titleInput.value,
        message: messageInput.value
      });

      if (status) {
        status.textContent = "Announcement published successfully.";
        setTimeout(() => { status.textContent = ""; }, 3000);
      }

      if (previewId) {
        await renderAnnouncement(previewId);
      }
      await renderAnnouncement("announcementWidget");
      await renderAnnouncement("homeAnnouncementWidget");
    } catch (err) {
      if (status) status.textContent = err.message || "Failed to publish announcement.";
    }
  });
}