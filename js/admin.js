console.log("admin.js loaded");

import { supabase } from "./supabaseClient.js";
console.log("supabase client loaded:", supabase);

const form = document.getElementById("storyForm");
const uploadGate = document.getElementById("uploadGate");
const statusEl = document.getElementById("status");

const authStatus = document.getElementById("authStatus");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const authBox = document.getElementById("authBox");
const loginFields = document.getElementById("loginFields");
const userBar = document.getElementById("userBar");
const userEmail = document.getElementById("userEmail");

function setStatus(msg) {
  if (statusEl) statusEl.textContent = msg;
}

function setAuthStatus(msg) {
  authStatus.textContent = msg;
}

async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

async function refreshAuthUI() {
  const session = await getSession();
  const signedIn = !!session;

  uploadGate.hidden = !signedIn; 

  if (signedIn) {
    loginFields.style.display = "none";

    userBar.style.display = "flex"; 
    userBar.style.alignItems = "center"; 
    userBar.style.gap = "10px"; 

    userEmail.textContent = session.user.email;
    setAuthStatus("");
  } else {
    // show login inputs
    loginFields.style.display = "block";
    // hide logout bar
    userBar.style.display = "none";
    setAuthStatus("Not signed in. Please log in to upload.");
  }
}

loginBtn?.addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    setAuthStatus("Please enter both email and password.");
    return;
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    setAuthStatus(`Login failed: ${error.message}`);
    return;
  }

  setAuthStatus("Logged in.");
  await refreshAuthUI();
});

logoutBtn?.addEventListener("click", async () => {
  await supabase.auth.signOut();
  setStatus("");
  await refreshAuthUI();
});

//supabase.auth.onAuthStateChange(async () => {
//  await refreshAuthUI();
//});

refreshAuthUI();

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

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  setStatus("Uploading...");

  try {
    const session = await getSession();
    if (!session) {
      throw new Error("You must be logged in before uploading.");
    }

    const title = document.getElementById("title").value.trim();
    const summary = document.getElementById("summary").value.trim() || null;
    const year = Number(document.getElementById("year").value) || null;
    const location = document.getElementById("location").value.trim() || null;
    const body = document.getElementById("body").value || null;

    const heroFile = document.getElementById("hero").files[0];
    const galleryFiles = Array.from(document.getElementById("gallery").files || []);
    const audioFile = document.getElementById("audio").files[0];
    const audioCaption = document.getElementById("audioCaption").value || null;

    if (!title) throw new Error("Title is required.");
    if (!heroFile) throw new Error("Hero image is required.");

    const heroUrl = await uploadToSupabaseStorage("images", heroFile);

    const { data: story, error: storyErr } = await supabase
      .from("stories")
      .insert([{
        title,
        summary,
        year,
        location,
        body,
        hero_image_url: heroUrl
      }])
      .select()
      .single();

    if (storyErr) throw storyErr;

    let order = 0;
    for (const img of galleryFiles) {
      const url = await uploadToSupabaseStorage("images", img);

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

    setStatus("Published! Redirecting...");
    window.location.href = `./story.html?id=${encodeURIComponent(story.id)}`;
  } catch (err) {
    setStatus(`Error: ${err.message || err}`);
  }
});