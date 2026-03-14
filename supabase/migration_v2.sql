-- ============================================================
-- Homebook v2 Migration
-- Run this in Supabase Dashboard > SQL Editor > New Query
-- (Run AFTER the original migration.sql)
-- ============================================================

-- Add new columns to inspirations
alter table inspirations
  add column if not exists source_url  text default '',
  add column if not exists source_name text default '';

-- Floorplans
create table if not exists floorplans (
  id         bigint generated always as identity primary key,
  name       text not null,
  image_url  text not null,
  rooms      jsonb default '[]',
  created_at timestamptz default now()
);

-- Todos
create table if not exists todos (
  id          bigint generated always as identity primary key,
  title       text not null,
  description text default '',
  category    text default 'Other',
  priority    text default 'Medium' check (priority in ('Low','Medium','High')),
  due_date    date,
  done        boolean default false,
  created_at  timestamptz default now()
);

-- Cost items
create table if not exists cost_items (
  id               bigint generated always as identity primary key,
  name             text not null,
  category         text not null,
  amount           numeric(12,2) default 0,
  date             date,
  notes            text default '',
  recurring        boolean default false,
  recurring_period text check (recurring_period in ('monthly','yearly')),
  created_at       timestamptz default now()
);

-- Calendar events
create table if not exists calendar_events (
  id             bigint generated always as identity primary key,
  title          text not null,
  date           date not null,
  time           text,
  type           text default 'Other',
  notes          text default '',
  linked_todo_id bigint references todos(id) on delete set null,
  created_at     timestamptz default now()
);

-- RLS
alter table floorplans      enable row level security;
alter table todos           enable row level security;
alter table cost_items      enable row level security;
alter table calendar_events enable row level security;

create policy "Allow all" on floorplans      for all using (true) with check (true);
create policy "Allow all" on todos           for all using (true) with check (true);
create policy "Allow all" on cost_items      for all using (true) with check (true);
create policy "Allow all" on calendar_events for all using (true) with check (true);
