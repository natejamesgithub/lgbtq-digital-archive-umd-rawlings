export async function getStories() {
  const res = await fetch("../data/stories.json");
  if (!res.ok) throw new Error("Could not load stories.json");
  const data = await res.json();
  return data.stories ?? [];
}