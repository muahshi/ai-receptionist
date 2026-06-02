-- ═══════════════════════════════════════════════════════════════
-- THE GUESTINN NETWORK — Supabase Schema v3 (FIXED — All Bugs)
-- Run this COMPLETELY in Supabase SQL Editor
-- Safe to re-run — IF NOT EXISTS / IF NOT EXISTS guards everywhere
-- ═══════════════════════════════════════════════════════════════

-- ── Hotels table ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hotels (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  location          TEXT DEFAULT '',
  total_rooms       INTEGER DEFAULT 20,
  plan              TEXT DEFAULT 'starter',
  emoji             TEXT DEFAULT '🏨',
  owner_pin         TEXT NOT NULL,
  manager_pin       TEXT NOT NULL,
  owner_phone       TEXT DEFAULT '',
  manager_phone     TEXT DEFAULT '',   -- FIX #1: was missing
  owner_email       TEXT DEFAULT '',   -- FIX #2: was missing
  manager_email     TEXT DEFAULT '',   -- FIX #3: was missing
  standard_rate     INTEGER DEFAULT 1200,
  deluxe_rate       INTEGER DEFAULT 2000,
  suite_rate        INTEGER DEFAULT 3800,

  -- Marketplace Fields
  city_slug         TEXT DEFAULT '',
  min_floor_price   INTEGER DEFAULT 800,
  is_featured       BOOLEAN DEFAULT FALSE,
  address_line      TEXT DEFAULT '',
  distance_tag      TEXT DEFAULT '',
  amenities         TEXT[] DEFAULT '{}',
  cover_image_url   TEXT DEFAULT '',
  latitude          NUMERIC(10,7),
  longitude         NUMERIC(10,7),
  avg_rating        NUMERIC(3,2) DEFAULT 4.0,
  total_reviews     INTEGER DEFAULT 0,
  is_active         BOOLEAN DEFAULT TRUE,

  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns safely (if re-running on existing DB)
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS manager_phone   TEXT DEFAULT '';
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS owner_email     TEXT DEFAULT '';
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS manager_email   TEXT DEFAULT '';
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS wifi_password   TEXT DEFAULT '';
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS menu_url        TEXT DEFAULT '';
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS menu_text       TEXT DEFAULT '';
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS reception_phone TEXT DEFAULT '';
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS enable_wifi          BOOLEAN DEFAULT TRUE;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS enable_food_ordering BOOLEAN DEFAULT TRUE;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS enable_housekeeping  BOOLEAN DEFAULT TRUE;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS enable_call_desk     BOOLEAN DEFAULT TRUE;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS checkin_time    TEXT DEFAULT '12:00';
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS checkout_time   TEXT DEFAULT '11:00';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_hotels_city_slug   ON hotels(city_slug);
CREATE INDEX IF NOT EXISTS idx_hotels_is_featured ON hotels(is_featured);
CREATE INDEX IF NOT EXISTS idx_hotels_is_active   ON hotels(is_active);

-- Hotels RLS
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "hotels_read_public" ON hotels;
DROP POLICY IF EXISTS "hotels_insert_auth" ON hotels;
DROP POLICY IF EXISTS "hotels_update_own"  ON hotels;
CREATE POLICY "hotels_read_public" ON hotels FOR SELECT USING (TRUE);
CREATE POLICY "hotels_insert_auth" ON hotels FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "hotels_update_own"  ON hotels FOR UPDATE USING (TRUE);


-- ── Bookings table ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id               TEXT PRIMARY KEY,
  hotel_id         TEXT NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  guest_name       TEXT DEFAULT '',
  guest_phone      TEXT DEFAULT '',
  address          TEXT DEFAULT '',
  id_type          TEXT DEFAULT 'Aadhaar',
  id_number        TEXT DEFAULT '',
  gender           TEXT DEFAULT '',
  dob              TEXT DEFAULT '',
  room_id          TEXT DEFAULT '',
  room_number      INTEGER DEFAULT 0,
  room_type        TEXT DEFAULT 'standard',
  check_in_date    TEXT DEFAULT '',
  check_out_date   TEXT DEFAULT '',
  nights           INTEGER DEFAULT 1,
  rate_per_night   NUMERIC DEFAULT 0,
  total_amount     NUMERIC DEFAULT 0,
  payment_mode     TEXT DEFAULT 'Cash',
  status           TEXT DEFAULT 'active',
  rate_locked      BOOLEAN DEFAULT TRUE,
  negotiated       BOOLEAN DEFAULT FALSE,
  negotiated_from  NUMERIC DEFAULT 0,
  extra_guests     JSONB DEFAULT '[]',
  source           TEXT DEFAULT 'direct',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns safely
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS room_number INTEGER DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'direct';

CREATE INDEX IF NOT EXISTS idx_bookings_hotel_id  ON bookings(hotel_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status    ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_check_in  ON bookings(check_in_date);
CREATE INDEX IF NOT EXISTS idx_bookings_created   ON bookings(created_at DESC);

-- Bookings RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bookings_read_by_hotel"    ON bookings;
DROP POLICY IF EXISTS "bookings_insert_validated" ON bookings;
DROP POLICY IF EXISTS "bookings_update_by_hotel"  ON bookings;
CREATE POLICY "bookings_read_by_hotel"    ON bookings FOR SELECT USING (TRUE);
CREATE POLICY "bookings_insert_validated" ON bookings FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "bookings_update_by_hotel"  ON bookings FOR UPDATE USING (TRUE);


-- ── FIX #4: Rooms table — was COMPLETELY MISSING ────────────────
-- updateRoomStatus() Supabase sync fail ho raha tha kyunki yeh table
-- exist hi nahi thi. Ab banao.
CREATE TABLE IF NOT EXISTS rooms (
  id                  TEXT PRIMARY KEY,
  hotel_id            TEXT NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  number              INTEGER NOT NULL,
  floor               INTEGER DEFAULT 1,
  type                TEXT DEFAULT 'standard',  -- standard | deluxe | suite
  status              TEXT DEFAULT 'vacant',    -- vacant | occupied | reserved | cleaning | out_of_order
  current_booking_id  TEXT DEFAULT NULL,
  guest_name          TEXT DEFAULT '',
  base_rate           NUMERIC DEFAULT 1200,
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rooms_hotel_id ON rooms(hotel_id);
CREATE INDEX IF NOT EXISTS idx_rooms_status   ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_rooms_number   ON rooms(hotel_id, number);

-- Rooms RLS
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rooms_all" ON rooms;
CREATE POLICY "rooms_all" ON rooms FOR ALL USING (TRUE) WITH CHECK (TRUE);


-- ── Push Subscriptions table ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id           BIGSERIAL PRIMARY KEY,
  hotel_id     TEXT NOT NULL,
  role         TEXT DEFAULT 'staff',
  endpoint     TEXT NOT NULL UNIQUE,
  p256dh       TEXT DEFAULT '',
  auth         TEXT DEFAULT '',
  subscription TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "push_read"   ON push_subscriptions;
DROP POLICY IF EXISTS "push_insert" ON push_subscriptions;
DROP POLICY IF EXISTS "push_delete" ON push_subscriptions;
DROP POLICY IF EXISTS "push_update" ON push_subscriptions;
CREATE POLICY "push_read"   ON push_subscriptions FOR SELECT USING (TRUE);
CREATE POLICY "push_insert" ON push_subscriptions FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "push_delete" ON push_subscriptions FOR DELETE USING (TRUE);
CREATE POLICY "push_update" ON push_subscriptions FOR UPDATE USING (TRUE);

CREATE INDEX IF NOT EXISTS idx_push_hotel ON push_subscriptions(hotel_id);


-- ── Service Requests table (push alerts log) ─────────────────────
CREATE TABLE IF NOT EXISTS service_requests (
  id           BIGSERIAL PRIMARY KEY,
  hotel_id     TEXT NOT NULL,
  room_number  TEXT DEFAULT '',
  guest_name   TEXT DEFAULT '',
  action_id    TEXT DEFAULT '',
  title        TEXT DEFAULT '',
  message      TEXT DEFAULT '',
  status       TEXT DEFAULT 'pending',   -- pending | resolved
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  resolved_at  TIMESTAMPTZ DEFAULT NULL
);

ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sr_all" ON service_requests;
CREATE POLICY "sr_all" ON service_requests FOR ALL USING (TRUE) WITH CHECK (TRUE);

CREATE INDEX IF NOT EXISTS idx_sr_hotel_id  ON service_requests(hotel_id);
CREATE INDEX IF NOT EXISTS idx_sr_status    ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_sr_created   ON service_requests(created_at DESC);


-- ── Seed: Demo Hotels (v3 — all fields included) ─────────────────
INSERT INTO hotels (
  id, name, location, total_rooms, plan, emoji,
  owner_pin, manager_pin,
  owner_phone, manager_phone, owner_email,
  standard_rate, deluxe_rate, suite_rate,
  city_slug, min_floor_price, is_featured,
  address_line, distance_tag, amenities,
  avg_rating, total_reviews, is_active,
  wifi_password, reception_phone
) VALUES
  (
    'cherry-bhopal', 'Hotel Cherry', 'Bhopal, Madhya Pradesh', 20, 'pro', '🍒',
    '4567', '8901', '919009109108', '919009109108', '',
    1200, 2000, 3800,
    'bhopal', 900, TRUE,
    'Peer Gate Area, Bhopal - 462001', '900m from Bus Stand',
    ARRAY['Free Wi-Fi','AC Rooms','Geyser','24/7 Reception'],
    4.5, 128, TRUE,
    'cherry@2024', '919009109108'
  ),
  (
    'sunrise-jaipur', 'Hotel Sunrise Palace', 'Jaipur, Rajasthan', 40, 'pro', '🌅',
    '1234', '5678', '919876543210', '919876543210', '',
    1500, 2500, 5000,
    'jaipur', 1100, TRUE,
    'Civil Lines, Jaipur - 302006', '2.1 km from City Center',
    ARRAY['Free Wi-Fi','Pool Access','AC Rooms','Parking'],
    4.7, 312, TRUE,
    'sunrise#jaipur', '919876543210'
  ),
  (
    'grand-mumbai', 'The Grand Inn Mumbai', 'Mumbai, Maharashtra', 120, 'enterprise', '🏩',
    '2345', '6789', '919900001111', '919900001111', '',
    2500, 4500, 9000,
    'mumbai', 2000, TRUE,
    'Andheri West, Mumbai - 400053', '1.8 km from Metro Station',
    ARRAY['Free Wi-Fi','Restaurant','Gym','AC Rooms','Parking','Room Service'],
    4.8, 920, TRUE,
    'GrandMumbai#9', '919900001111'
  )
ON CONFLICT (id) DO UPDATE SET
  manager_phone   = EXCLUDED.manager_phone,
  owner_email     = EXCLUDED.owner_email,
  wifi_password   = EXCLUDED.wifi_password,
  reception_phone = EXCLUDED.reception_phone,
  updated_at      = NOW();


-- ── Audit View ───────────────────────────────────────────────────
CREATE OR REPLACE VIEW bookings_audit_log AS
  SELECT
    b.id, b.hotel_id,
    h.name          AS hotel_name,
    b.guest_name,   b.guest_phone,
    b.id_type,
    '[ID Omitted for Privacy]'::TEXT AS id_number,
    b.room_id,      b.room_type,
    b.check_in_date, b.check_out_date,
    b.nights,       b.rate_per_night,
    b.total_amount, b.payment_mode,
    b.status,       b.rate_locked,
    b.negotiated,   b.source,
    b.created_at
  FROM bookings b
  LEFT JOIN hotels h ON h.id = b.hotel_id;
