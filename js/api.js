/*export async function getStories() {
  const res = await fetch("../data/stories.json");
  if (!res.ok) throw new Error("Could not load stories.json");
  const data = await res.json();
  return data.stories ?? [];
}*/

import { supabase } from "./supabaseClient.js";

export async function getStories() {
  const { data, error } = await supabase
    .from("stories")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getStoryBundleById(storyId) {
  const { data: story, error: storyErr } = await supabase
    .from("stories")
    .select("*")
    .eq("id", storyId)
    .single();

  if (storyErr) throw storyErr;

  const { data: media, error: mediaErr } = await supabase
    .from("media")
    .select("*")
    .eq("story_id", storyId)
    .order("sort_order", { ascending: true });

  if (mediaErr) throw mediaErr;

  return { story, media: media ?? [] };
}