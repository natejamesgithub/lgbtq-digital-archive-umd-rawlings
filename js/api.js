import { supabase } from "./supabaseClient.js";

function normalizeStory(story) {
  return {
    ...story,
    tags: Array.isArray(story.tags) ? story.tags : []
  };
}

export async function getStories(limit = null) {
  let query = supabase
    .from("stories")
    .select("*")
    .order("created_at", { ascending: false });

  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map(normalizeStory);
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

  return {
    story: normalizeStory(story),
    media: media ?? []
  };
}