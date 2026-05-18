-- ═══════════════════════════════════════════════════════════════
-- THE GUESTINN — Supabase Schema (Run this in SQL Editor)
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

ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_hotels"   ON hotels;
DROP POLICY IF EXISTS "insert_hotels" ON hotels;
DROP POLICY IF EXISTS "update_hotels" ON hotels;
CREATE POLICY "read_hotels"   ON hotels FOR SELECT USING (true);
CREATE POLICY "insert_hotels" ON hotels FOR INSERT WITH CHECK (true);
CREATE POLICY "update_hotels" ON hotels FOR UPDATE USING (true);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id             TEXT PRIMARY KEY,
  hotel_id       TEXT NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  guest_name     TEXT DEFAULT '',
  guest_phone    TEXT DEFAULT '',
  address        TEXT DEFAULT '',
  id_type        TEXT DEFAULT 'Aadhaar',
  id_number      TEXT DEFAULT '',
  gender         TEXT DEFAULT '',
  dob            TEXT DEFAULT '',
  room_id        TEXT DEFAULT '',
  room_type      TEXT DEFAULT 'standard',
  check_in_date  TEXT DEFAULT '',
  check_out_date TEXT DEFAULT '',
  nights         INTEGER DEFAULT 1,
  rate_per_night NUMERIC DEFAULT 0,
  total_amount   NUMERIC DEFAULT 0,
  payment_mode   TEXT DEFAULT 'Cash',
  status         TEXT DEFAULT 'active',
  rate_locked    BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_bookings"   ON bookings;
DROP POLICY IF EXISTS "insert_bookings" ON bookings;
DROP POLICY IF EXISTS "update_bookings" ON bookings;
CREATE POLICY "read_bookings"   ON bookings FOR SELECT USING (true);
CREATE POLICY "insert_bookings" ON bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "update_bookings" ON bookings FOR UPDATE USING (true);

-- Demo hotels
INSERT INTO hotels (id, name, location, total_rooms, plan, emoji, owner_pin, manager_pin)
VALUES
  ('sunrise-jaipur',    'Hotel Sunrise',   'Jaipur, Rajasthan',      40,  'pro',        '🏨', '1234', '5678'),
  ('grand-mumbai',      'The Grand Inn',   'Mumbai, Maharashtra',    120, 'enterprise', '🏩', '2345', '6789'),
  ('saffron-ahmedabad', 'Saffron Stays',   'Ahmedabad, Gujarat',     25,  'free',       '🏪', '3456', '7890'),
  ('cherry-bhopal',     'Hotel Cherry',    'Bhopal, Madhya Pradesh', 20,  'pro',        '🍒', '4567', '8901')
ON CONFLICT (id) DO NOTHING;
