import { getStoryBundleById } from "./api.js";

function qs(id) { return document.getElementById(id); }

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, m => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[m]));
}

(async function init() {
  const params = new URLSearchParams(window.location.search);
  const storyId = params.get("id");

  if (!storyId) {
    document.body.innerHTML = `<p>Missing story id.</p>`;
    return;
  }

  const { story, media } = await getStoryBundleById(storyId);

  qs("title").textContent = story.title;
  qs("summary").textContent = story.summary ?? "";

  const hero = qs("hero");
  if (story.hero_image_url) {
    hero.src = story.hero_image_url;
    hero.alt = story.title;
  } else {
    hero.remove();
  }

  qs("body").innerHTML = `<p>${escapeHtml(story.body).replace(/\n/g, "<br/>")}</p>`;

  const audio = media.find(m => m.type === "audio");
  if (audio) {
    qs("audioSection").hidden = false;
    qs("audio").src = audio.url;
    qs("transcript").textContent = audio.caption || "";
  }

  const images = media.filter(m => m.type === "image");
  qs("gallery").innerHTML = images.map(img => `
    <figure>
      <img src="${img.url}" alt="${escapeHtml(img.alt_text || "")}" />
      ${img.caption ? `<figcaption>${escapeHtml(img.caption)}</figcaption>` : ""}
    </figure>
  `).join("");
})();