-- D.C. LGBTQ+ Digital Archive - idempotent Supabase setup
-- Run this in the Supabase SQL editor.

create extension if not exists pgcrypto;

create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text,
  body text,
  year int,
  location text,
  tags text[] not null default '{}',
  hero_image_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  type text not null check (type in ('image', 'audio')),
  url text not null,
  alt_text text,
  caption text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists stories_created_at_idx on public.stories(created_at desc);
create index if not exists stories_tags_gin_idx on public.stories using gin(tags);
create index if not exists media_story_id_idx on public.media(story_id);

alter table public.stories enable row level security;
alter table public.media enable row level security;

-- Public read
drop policy if exists public_read_stories on public.stories;
create policy public_read_stories
on public.stories
for select
to anon, authenticated
using (true);

drop policy if exists public_read_media on public.media;
create policy public_read_media
on public.media
for select
to anon, authenticated
using (true);

-- Authenticated inserts/updates/deletes for admin users
drop policy if exists auth_write_stories on public.stories;
create policy auth_write_stories
on public.stories
for all
to authenticated
using (true)
with check (true);

drop policy if exists auth_write_media on public.media;
create policy auth_write_media
on public.media
for all
to authenticated
using (true)
with check (true);

-- Storage buckets (create these in the Supabase dashboard if they do not exist):
--   images (public)
--   audio  (public)
--
-- Suggested storage policies:
-- Public read on both buckets
-- Authenticated upload/update/delete on both buckets
