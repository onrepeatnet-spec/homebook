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
