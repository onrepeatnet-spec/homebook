-- ============================================================
-- Homebook v3 Migration
-- Run in Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- Add order column to rooms
alter table rooms add column if not exists "order" integer default 0;

-- Update existing rooms to have sequential order
update rooms set "order" = id where "order" = 0;

-- Add link/title fields to moodboard_items
alter table moodboard_items add column if not exists href  text;
alter table moodboard_items add column if not exists title text;

-- App settings (key-value store for things like budget goals)
create table if not exists app_settings (
  key        text primary key,
  value      text,
  updated_at timestamptz default now()
);

alter table app_settings enable row level security;
create policy "Allow all" on app_settings for all using (true) with check (true);

-- Budget scenarios (named sets of products for comparison)
create table if not exists budget_scenarios (
  id         bigint generated always as identity primary key,
  name       text not null,
  room_id    bigint references rooms(id) on delete cascade,
  items      jsonb default '[]',
  created_at timestamptz default now()
);
alter table budget_scenarios enable row level security;
create policy "Allow all" on budget_scenarios for all using (true) with check (true);
