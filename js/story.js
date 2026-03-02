import { getStories } from "./api.js";

function qs(id) { return document.getElementById(id); }

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, m => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[m]));
}

(async function init() {
  const params = new URLSearchParams(window.location.search);
  const storyId = params.get("id");

  const stories = await getStories();
  const story = stories.find(s => s.id === storyId);

  if (!story) {
    document.body.innerHTML = `<p>Story not found.</p>`;
    return;
  }

  qs("title").textContent = story.title;
  qs("summary").textContent = story.summary;

  const hero = qs("hero");
  hero.src = story.heroImage;
  hero.alt = story.title;

  qs("body").innerHTML = `<p>${escapeHtml(story.body).replace(/\n/g, "<br/>")}</p>`;

  if (story.audio?.src) {
    qs("audioSection").hidden = false;
    qs("audio").src = story.audio.src;
    qs("transcript").textContent = story.audio.transcript || "";
  }

  const gallery = story.gallery || [];
  qs("gallery").innerHTML = gallery.map(img => `
    <figure>
      <img src="${img.src}" alt="${escapeHtml(img.alt || "")}">
    </figure>
  `).join("");
})();