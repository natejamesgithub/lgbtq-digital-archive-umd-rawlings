import { supabase } from "./supabaseClient.js";

const form = document.getElementById("storyForm");
const statusEl = document.getElementById("status");
const authStatus = document.getElementById("authStatus");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

function setStatus(message) {
  statusEl.textContent = message;
}

function setAuthStatus(message) {
  authStatus.textContent = message;
}

function parseTags(rawValue) {
  return String(rawValue || "")
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
}

async function refreshAuthUI() {
  const { data } = await supabase.auth.getSession();
  const signedIn = !!data.session;
  loginBtn.style.display = signedIn ? "none" : "inline-flex";
  logoutBtn.style.display = signedIn ? "inline-flex" : "none";
  setAuthStatus(signedIn ? "Signed in." : "Not signed in.");
}

loginBtn?.addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    setAuthStatus(`Login failed: ${error.message}`);
    return;
  }

  setAuthStatus("Logged in.");
  refreshAuthUI();
});

logoutBtn?.addEventListener("click", async () => {
  await supabase.auth.signOut();
  refreshAuthUI();
});

refreshAuthUI();

async function uploadToSupabaseStorage(bucket, file) {
  const ext = file.name.split(".").pop();
  const safeName = `${crypto.randomUUID()}.${ext}`;
  const path = safeName;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false
  });
  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus("Uploading...");

  try {
    const title = document.getElementById("title").value.trim();
    const summary = document.getElementById("summary").value.trim() || null;
    const year = Number(document.getElementById("year").value) || null;
    const location = document.getElementById("location").value.trim() || null;
    const body = document.getElementById("body").value.trim() || null;
    const tags = parseTags(document.getElementById("tags").value);

    const heroFile = document.getElementById("hero").files[0];
    const galleryFiles = Array.from(document.getElementById("gallery").files || []);
    const audioFile = document.getElementById("audio").files[0];
    const audioCaption = document.getElementById("audioCaption").value.trim() || null;

    if (!title) throw new Error("Title is required.");
    if (!heroFile) throw new Error("Hero image is required.");

    const heroUrl = await uploadToSupabaseStorage("images", heroFile);

    const { data: story, error: storyError } = await supabase
      .from("stories")
      .insert([{
        title,
        summary,
        year,
        location,
        body,
        tags,
        hero_image_url: heroUrl
      }])
      .select()
      .single();

    if (storyError) throw storyError;

    let order = 0;
    for (const imageFile of galleryFiles) {
      const imageUrl = await uploadToSupabaseStorage("images", imageFile);
      const { error } = await supabase.from("media").insert([{
        story_id: story.id,
        type: "image",
        url: imageUrl,
        alt_text: imageFile.name,
        caption: null,
        sort_order: order++
      }]);
      if (error) throw error;
    }

    if (audioFile) {
      const audioUrl = await uploadToSupabaseStorage("audio", audioFile);
      const { error } = await supabase.from("media").insert([{
        story_id: story.id,
        type: "audio",
        url: audioUrl,
        alt_text: null,
        caption: audioCaption,
        sort_order: 0
      }]);
      if (error) throw error;
    }

    setStatus("Published. Redirecting...");
    form.reset();
    window.location.href = `./story.html?id=${encodeURIComponent(story.id)}`;
  } catch (err) {
    console.error(err);
    setStatus(`Error: ${err.message || err}`);
  }
});