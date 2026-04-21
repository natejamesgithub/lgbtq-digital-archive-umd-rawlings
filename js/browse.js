import { getStories } from "./api.js";

const grid = document.getElementById("storyGrid");
const searchInput = document.getElementById("search");
const tagBar = document.getElementById("tagBar");
const emptyState = document.getElementById("emptyState");

let allStories = [];
let activeTag = null;

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
            ${(story.tags || []).slice(0, 2).map((tag) => `<span>#${escapeHtml(tag)}</span>`).join("")}
          </div>
        </div>
      </a>
    </article>
  `;
}

function render(stories) {
  grid.innerHTML = stories.map(storyCard).join("");
  emptyState.hidden = stories.length > 0;
}

function renderTags(stories) {
  const tags = [...new Set(stories.flatMap((story) => story.tags || []))].sort((a, b) => a.localeCompare(b));
  tagBar.innerHTML = `
    <button class="tag ${activeTag === null ? "active" : ""}" data-tag="">
      All
    </button>
    ${tags.map((tag) => `
      <button class="tag ${activeTag === tag ? "active" : ""}" data-tag="${escapeHtml(tag)}">
        ${escapeHtml(tag)}
      </button>
    `).join("")}
  `;
}

function applyFilters() {
  const q = (searchInput.value || "").toLowerCase().trim();

  let filtered = allStories;
  if (activeTag) {
    filtered = filtered.filter((story) => (story.tags || []).includes(activeTag));
  }

  if (q) {
    filtered = filtered.filter((story) =>
      (story.title || "").toLowerCase().includes(q) ||
      (story.summary || "").toLowerCase().includes(q) ||
      (story.body || "").toLowerCase().includes(q) ||
      (story.location || "").toLowerCase().includes(q) ||
      (story.tags || []).join(" ").toLowerCase().includes(q)
    );
  }

  render(filtered);
}

(async function init() {
  try {
    allStories = await getStories();
    renderTags(allStories);
    render(allStories);

    searchInput?.addEventListener("input", applyFilters);
    tagBar?.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-tag]");
      if (!button) return;
      activeTag = button.dataset.tag || null;
      renderTags(allStories);
      applyFilters();
    });
  } catch (err) {
    console.error(err);
    grid.innerHTML = `<p class="empty-state">Could not load stories. Check Supabase configuration and public read policies.</p>`;
    emptyState.hidden = true
  }
})();