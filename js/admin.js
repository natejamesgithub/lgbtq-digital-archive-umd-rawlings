// js/admin.js
import { supabase } from "./supabaseClient.js";

const form = document.getElementById("storyForm");
const statusEl = document.getElementById("status");

const authStatus = document.getElementById("authStatus");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

function setStatus(msg) {
  statusEl.textContent = msg;
}

function setAuthStatus(msg) {
  authStatus.textContent = msg;
}

// ----- OPTIONAL AUTH (recommended if you used authenticated-only insert policies) -----
async function refreshAuthUI() {
  const { data } = await supabase.auth.getSession();
  const signedIn = !!data.session;

  loginBtn.style.display = signedIn ? "none" : "inline-block";
  logoutBtn.style.display = signedIn ? "inline-block" : "none";

  setAuthStatus(signedIn ? "Signed in." : "Not signed in.");
}

loginBtn?.addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return setAuthStatus(`Login failed: ${error.message}`);

  setAuthStatus("Logged in!");
  refreshAuthUI();
});

logoutBtn?.addEventListener("click", async () => {
  await supabase.auth.signOut();
  refreshAuthUI();
});

refreshAuthUI();

// ----- FILE UPLOAD HELPERS -----
async function uploadToSupabaseStorage(bucket, file) {
  const ext = file.name.split(".").pop();
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const path = fileName;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false
  });
  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/*
  ========== Cloudflare R2 Provision (COMMENTED) ==========
  IMPORTANT: You cannot safely upload to R2 directly from the browser with your secret keys.
  You need a small backend (serverless function / Node endpoint) that returns a pre-signed URL.

  Flow:
  1) Frontend asks your backend: POST /sign-upload { filename, contentType }
  2) Backend returns { uploadUrl, publicUrl }
  3) Frontend PUTs the file to uploadUrl
  4) Store publicUrl in Supabase DB (hero_image_url / media.url)

  Example frontend helper (requires your backend):
  async function uploadToR2ViaPresign(file) {
    const res = await fetch("/sign-upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: file.name, contentType: file.type })
    });
    if (!res.ok) throw new Error("Failed to get presigned URL");
    const { uploadUrl, publicUrl } = await res.json();

    const putRes = await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type }});
    if (!putRes.ok) throw new Error("Failed R2 upload");

    return publicUrl;
  }
*/

// ----- MAIN SUBMIT -----
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  setStatus("Uploading...");

  try {
    const title = document.getElementById("title").value.trim();
    const summary = document.getElementById("summary").value.trim() || null;
    const year = Number(document.getElementById("year").value) || null;
    const location = document.getElementById("location").value.trim() || null;
    const body = document.getElementById("body").value || null;

    const heroFile = document.getElementById("hero").files[0];
    const galleryFiles = Array.from(document.getElementById("gallery").files || []);
    const audioFile = document.getElementById("audio").files[0];
    const audioCaption = document.getElementById("audioCaption").value || null;

    if (!heroFile) throw new Error("Hero image is required.");

    // 1) Upload hero image
    const heroUrl = await uploadToSupabaseStorage("images", heroFile);

    // (If using R2 later)
    // const heroUrl = await uploadToR2ViaPresign(heroFile);

    // 2) Insert story
    const { data: story, error: storyErr } = await supabase
      .from("stories")
      .insert([{ title, summary, year, location, body, hero_image_url: heroUrl }])
      .select()
      .single();

    if (storyErr) throw storyErr;

    // 3) Upload gallery images and insert media rows
    let order = 0;
    for (const img of galleryFiles) {
      const url = await uploadToSupabaseStorage("images", img);
      // const url = await uploadToR2ViaPresign(img);

      const { error } = await supabase.from("media").insert([{
        story_id: story.id,
        type: "image",
        url,
        alt_text: img.name,
        caption: null,
        sort_order: order++
      }]);

      if (error) throw error;
    }

    // 4) Upload audio and insert media row
    if (audioFile) {
      const audioUrl = await uploadToSupabaseStorage("audio", audioFile);
      // const audioUrl = await uploadToR2ViaPresign(audioFile);

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

    setStatus("Published! Redirecting to story...");
    window.location.href = `./story.html?id=${encodeURIComponent(story.id)}`;
  } catch (err) {
    setStatus(`Error: ${err.message || err}`);
  }
});