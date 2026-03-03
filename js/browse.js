import { getStories } from "./api.js";

const grid = document.getElementById("storyGrid");
const searchInput = document.getElementById("search");
const tagBar = document.getElementById("tagBar");

let allStories = [];
let activeTag = null;

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, m => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[m]));
}

function storyCard(s) {
  return `
    <article class="story-card">
      <a href="story.html?id=${encodeURIComponent(s.id)}">
        ${s.hero_image_url ? `<img src="${s.hero_image_url}" alt="${escapeHtml(s.title)}" />` : ""}
        <h3>${escapeHtml(s.title)}</h3>
        <p>${escapeHtml(s.summary)}</p>
        <div class="meta">
          ${s.year ? `<span>${s.year}</span>` : ""}
          ${s.location ? `<span>${escapeHtml(s.location)}</span>` : ""}
        </div>
      </a>
    </article>
  `;
}


function render(stories) {
  grid.innerHTML = stories.map(storyCard).join("");
}

function renderTags(stories) {
  const tags = [...new Set(stories.flatMap(s => s.tags || []))].sort();
  tagBar.innerHTML = `
    <button class="tag ${activeTag === null ? "active" : ""}" data-tag="">
      All
    </button>
    ${tags.map(t => `
      <button class="tag ${activeTag === t ? "active" : ""}" data-tag="${t}">
        ${t}
      </button>
    `).join("")}
  `;
}

function applyFilters() {
  const q = (searchInput.value || "").toLowerCase().trim();
  let filtered = allStories;

  if (activeTag) filtered = filtered.filter(s => (s.tags || []).includes(activeTag));
  if (q) {
    filtered = filtered.filter(s =>
      (s.title || "").toLowerCase().includes(q) ||
      (s.summary || "").toLowerCase().includes(q) ||
      (s.body || "").toLowerCase().includes(q) ||
      (s.location || "").toLowerCase().includes(q)
    );
  }

  render(filtered);
}

function applySearch() {
  const q = (searchInput.value || "").toLowerCase().trim();
  if (!q) return render(allStories);

  const filtered = allStories.filter(s =>
    (s.title || "").toLowerCase().includes(q) ||
    (s.summary || "").toLowerCase().includes(q) ||
    (s.body || "").toLowerCase().includes(q) ||
    (s.location || "").toLowerCase().includes(q)
  );
  render(filtered);
}

(async function init() {
  allStories = await getStories();
  renderTags(allStories);
  render(allStories);

  searchInput?.addEventListener("input", applyFilters);
  searchInput?.addEventListener("input", applySearch);

  tagBar?.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-tag]");
    if (!btn) return;
    activeTag = btn.dataset.tag || null;
    renderTags(allStories);
    applyFilters();
  });
})();