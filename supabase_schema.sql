-- ═══════════════════════════════════════════════════════════
-- THE GUESTINN — Supabase Schema
-- Run this in Supabase SQL Editor (supabase.com → SQL Editor)
-- ═══════════════════════════════════════════════════════════

-- Hotels table (shared registry — all devices see this)
CREATE TABLE IF NOT EXISTS hotels (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  location     TEXT,
  total_rooms  INTEGER DEFAULT 20,
  plan         TEXT DEFAULT 'starter',
  emoji        TEXT DEFAULT '🏨',
  owner_pin    TEXT NOT NULL,
  manager_pin  TEXT NOT NULL,
  owner_phone  TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Allow anonymous reads (so hotel list loads without login)
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read hotels"
  ON hotels FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert hotels"
  ON hotels FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update hotels"
  ON hotels FOR UPDATE
  USING (true);

-- Insert demo hotels (so they show on all devices)
INSERT INTO hotels (id, name, location, total_rooms, plan, emoji, owner_pin, manager_pin, owner_phone)
VALUES
  ('sunrise-jaipur',    'Hotel Sunrise',  'Jaipur, Rajasthan',     40,  'pro',        '🏨', '1234', '5678', ''),
  ('grand-mumbai',      'The Grand Inn',  'Mumbai, Maharashtra',   120, 'enterprise', '🏩', '2345', '6789', ''),
  ('saffron-ahmedabad', 'Saffron Stays',  'Ahmedabad, Gujarat',    25,  'free',       '🏪', '3456', '7890', ''),
  ('cherry-bhopal',     'Hotel Cherry',   'Bhopal, Madhya Pradesh',20,  'pro',        '🍒', '4567', '8901', '')
ON CONFLICT (id) DO NOTHING;
