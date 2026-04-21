import { getStories } from "./api.js";

const grid = document.getElementById("archiveGrid");

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}

function storyCard(story) {
  return `
    <article class="story-card">
      <a href="./story.html?id=${encodeURIComponent(story.id)}">
        ${story.hero_image_url ? `<img src="${story.hero_image_url}" alt="${escapeHtml(story.title)}" />` : ""}
        <div class="card-content">
          <h3>${escapeHtml(story.title)}</h3>
          <p>${escapeHtml(story.summary || "")}</p>
          <div class="meta">
            ${story.year ? `<span>${story.year}</span>` : ""}
            ${story.location ? `<span>${escapeHtml(story.location)}</span>` : ""}
          </div>
        </div>
      </a>
    </article>
  `;
}

(async function init() {
  try {
    const stories = await getStories(6);
    if (!stories.length) {
      grid.innerHTML = `<p class="empty-state">No stories have been published yet.</p>`;
      return;
    }
    grid.innerHTML = stories.map(storyCard).join("");
  } catch (err) {
    console.error(err);
    grid.innerHTML = `<p class="empty-state">Could not load stories. Check Supabase configuration and published rows.</p>`;
  }
})();