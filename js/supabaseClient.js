import { CONFIG } from "./config.js";

if (!window.supabase) {
  throw new Error("Supabase CDN script is missing. Make sure the HTML page loads @supabase/supabase-js.");
}

if (!CONFIG?.SUPABASE_URL || !CONFIG?.SUPABASE_ANON_KEY) {
  throw new Error("Missing Supabase config. Copy config.example.js to config.js and fill in your project values.");
}

export const supabase = window.supabase.createClient(
  CONFIG.SUPABASE_URL,
  CONFIG.SUPABASE_ANON_KEY
);