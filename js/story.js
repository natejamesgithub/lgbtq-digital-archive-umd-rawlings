import { getStoryBundleById } from "./api.js";

function qs(id) {
  return document.getElementById(id);
}

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}

(async function init() {
  const params = new URLSearchParams(window.location.search);
  const storyId = params.get("id");

  if (!storyId) {
    document.body.innerHTML = "<main class='main-content'><p class='empty-state'>Missing story id.</p></main>";
    return;
  }

  try {
    const { story, media } = await getStoryBundleById(storyId);

    qs("title").textContent = story.title;
    qs("summary").textContent = story.summary || "";

    qs("storyMeta").innerHTML = `
      ${story.year ? `<span>${story.year}</span>` : ""}
      ${story.location ? `<span>${escapeHtml(story.location)}</span>` : ""}
      ${(story.tags || []).map((tag) => `<span>#${escapeHtml(tag)}</span>`).join("")}
    `;

    const hero = qs("hero");
    if (story.hero_image_url) {
      hero.src = story.hero_image_url;
      hero.alt = story.title;
    } else {
      hero.remove();
    }

    qs("body").innerHTML = `<p>${escapeHtml(story.body || "").replace(/\n/g, "<br />")}</p>`;

    const audio = media.find((item) => item.type === "audio");
    if (audio) {
      qs("audioSection").hidden = false;
      qs("audio").src = audio.url;
      qs("transcript").textContent = audio.caption || "";
    }

    const images = media.filter((item) => item.type === "image");
    if (images.length) {
      qs("gallerySection").hidden = false;
      qs("gallery").innerHTML = images.map((img) => `
        <figure>
          <img src="${img.url}" alt="${escapeHtml(img.alt_text || "")}" />
          ${img.caption ? `<figcaption>${escapeHtml(img.caption)}</figcaption>` : ""}
        </figure>
      `).join("");
    }
  } catch (err) {
    console.error(err);
    document.body.innerHTML = "<main class='main-content'><p class='empty-state'>Could not load this story. Check the story id and Supabase read permissions.</p></main>";
  }
})();