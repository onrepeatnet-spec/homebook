-- ============================================================
-- Homebook — Supabase Database Migration
-- Run this in: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- Rooms
create table if not exists rooms (
  id          bigint generated always as identity primary key,
  name        text not null,
  description text default '',
  emoji       text default '🏠',
  color       text default '#C17B4E',
  created_at  timestamptz default now()
);

-- Inspirations
create table if not exists inspirations (
  id          bigint generated always as identity primary key,
  image_url   text not null,
  room_id     bigint references rooms(id) on delete cascade,
  tags        text[] default '{}',
  notes       text default '',
  created_at  timestamptz default now()
);

-- Products
create table if not exists products (
  id          bigint generated always as identity primary key,
  name        text not null,
  store       text default '',
  url         text default '',
  image       text default '',
  price       numeric(10,2) default 0,
  room_id     bigint references rooms(id) on delete cascade,
  status      text default 'Idea' check (status in ('Idea','Considering','Buying','Purchased')),
  notes       text default '',
  created_at  timestamptz default now()
);

-- Colour palettes
create table if not exists colour_palettes (
  id          bigint generated always as identity primary key,
  name        text not null,
  colours     text[] default '{}',
  notes       text default '',
  room_id     bigint references rooms(id) on delete cascade,
  created_at  timestamptz default now()
);

-- Budget items
create table if not exists budget_items (
  id               bigint generated always as identity primary key,
  name             text not null,
  category         text default '',
  estimated_price  numeric(10,2) default 0,
  actual_price     numeric(10,2),
  room_id          bigint references rooms(id) on delete cascade,
  purchased        boolean default false,
  created_at       timestamptz default now()
);

-- Notes (one per room)
create table if not exists notes (
  id          bigint generated always as identity primary key,
  room_id     bigint references rooms(id) on delete cascade unique,
  content     text default '',
  updated_at  timestamptz default now()
);

-- Moodboard items
create table if not exists moodboard_items (
  id       text primary key,
  type     text not null check (type in ('image','color','text')),
  x        numeric default 0,
  y        numeric default 0,
  w        numeric default 200,
  h        numeric default 150,
  room_id  bigint references rooms(id) on delete cascade,
  src      text,
  color    text,
  text     text,
  label    text
);

-- ============================================================
-- Storage bucket
-- ============================================================
insert into storage.buckets (id, name, public)
values ('homebook', 'homebook', true)
on conflict do nothing;

-- ============================================================
-- Row Level Security
-- (For a personal app, we allow all access.
--  Add auth checks here when you add user accounts.)
-- ============================================================
alter table rooms            enable row level security;
alter table inspirations     enable row level security;
alter table products         enable row level security;
alter table colour_palettes  enable row level security;
alter table budget_items     enable row level security;
alter table notes            enable row level security;
alter table moodboard_items  enable row level security;

-- Allow full access (personal app — no auth yet)
create policy "Allow all" on rooms            for all using (true) with check (true);
create policy "Allow all" on inspirations     for all using (true) with check (true);
create policy "Allow all" on products         for all using (true) with check (true);
create policy "Allow all" on colour_palettes  for all using (true) with check (true);
create policy "Allow all" on budget_items     for all using (true) with check (true);
create policy "Allow all" on notes            for all using (true) with check (true);
create policy "Allow all" on moodboard_items  for all using (true) with check (true);

-- Storage policy
create policy "Allow all storage" on storage.objects
  for all using (bucket_id = 'homebook') with check (bucket_id = 'homebook');

-- ============================================================
-- Seed data (optional — delete if you want a blank slate)
-- ============================================================
insert into rooms (name, description, emoji, color) values
  ('Living Room', 'Main gathering space',    '🛋️', '#C17B4E'),
  ('Bedroom',     'Master bedroom',           '🛏️', '#6B7FA8'),
  ('Kitchen',     'Heart of the home',        '🍳', '#4A7C6F'),
  ('Office',      'Home workspace',           '💻', '#8B6BAE'),
  ('Bathroom',    'Spa-inspired retreat',     '🛁', '#5A8FA0'),
  ('Garden',      'Outdoor living',           '🌿', '#5C7A45');
