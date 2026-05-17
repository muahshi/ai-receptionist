-- ═══════════════════════════════════════════════════════════════
-- THE GUESTINN — Supabase Schema
-- Supabase Dashboard → SQL Editor → Paste karo → Run
-- ═══════════════════════════════════════════════════════════════

-- Hotels table
CREATE TABLE IF NOT EXISTS hotels (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  location     TEXT DEFAULT '',
  total_rooms  INTEGER DEFAULT 20,
  plan         TEXT DEFAULT 'starter',
  emoji        TEXT DEFAULT '🏨',
  owner_pin    TEXT NOT NULL,
  manager_pin  TEXT NOT NULL,
  owner_phone  TEXT DEFAULT '',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;

-- Policies: anyone can read/write (PIN is the auth layer)
DROP POLICY IF EXISTS "read_hotels"   ON hotels;
DROP POLICY IF EXISTS "insert_hotels" ON hotels;
DROP POLICY IF EXISTS "update_hotels" ON hotels;

CREATE POLICY "read_hotels"   ON hotels FOR SELECT USING (true);
CREATE POLICY "insert_hotels" ON hotels FOR INSERT WITH CHECK (true);
CREATE POLICY "update_hotels" ON hotels FOR UPDATE USING (true);

-- Demo hotels (won't duplicate if run again)
INSERT INTO hotels (id, name, location, total_rooms, plan, emoji, owner_pin, manager_pin)
VALUES
  ('sunrise-jaipur',    'Hotel Sunrise',   'Jaipur, Rajasthan',      40,  'pro',        '🏨', '1234', '5678'),
  ('grand-mumbai',      'The Grand Inn',   'Mumbai, Maharashtra',    120, 'enterprise', '🏩', '2345', '6789'),
  ('saffron-ahmedabad', 'Saffron Stays',   'Ahmedabad, Gujarat',     25,  'free',       '🏪', '3456', '7890'),
  ('cherry-bhopal',     'Hotel Cherry',    'Bhopal, Madhya Pradesh', 20,  'pro',        '🍒', '4567', '8901')
ON CONFLICT (id) DO NOTHING;
