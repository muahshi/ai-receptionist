-- ═══════════════════════════════════════════════════════════════
-- THE GUESTINN NETWORK — Supabase Schema v2 (Marketplace Edition)
-- Run this in Supabase SQL Editor (safe to re-run — uses IF NOT EXISTS)
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
  manager_phone     TEXT DEFAULT '',
  owner_email       TEXT DEFAULT '',
  standard_rate     INTEGER DEFAULT 1200,
  deluxe_rate       INTEGER DEFAULT 2000,
  suite_rate        INTEGER DEFAULT 3800,

  -- ── v2 Marketplace Fields ─────────────────────────────────
  city_slug         TEXT DEFAULT '',           -- e.g. "bhopal", "jaipur" — for URL routing + search index
  min_floor_price   INTEGER DEFAULT 800,       -- AI negotiator hard floor — cannot go below this
  is_featured       BOOLEAN DEFAULT FALSE,     -- pinned to top of marketplace listing
  address_line      TEXT DEFAULT '',           -- full address for guest-facing card
  distance_tag      TEXT DEFAULT '',           -- e.g. "1.2 km from Bus Stand"
  amenities         TEXT[] DEFAULT '{}',       -- ["Free Wi-Fi","Parking","AC"]
  cover_image_url   TEXT DEFAULT '',
  latitude          NUMERIC(10,7),
  longitude         NUMERIC(10,7),
  avg_rating        NUMERIC(3,2) DEFAULT 4.0,
  total_reviews     INTEGER DEFAULT 0,
  is_active         BOOLEAN DEFAULT TRUE,

  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Fast lookup indexes
CREATE INDEX IF NOT EXISTS idx_hotels_city_slug  ON hotels(city_slug);
CREATE INDEX IF NOT EXISTS idx_hotels_is_featured ON hotels(is_featured);
CREATE INDEX IF NOT EXISTS idx_hotels_is_active   ON hotels(is_active);

-- ── Phase 1: Guest Services & Digital Companion columns ─────────
-- Safe to re-run — IF NOT EXISTS guards each column
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS wifi_password        TEXT    DEFAULT '';
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS menu_url             TEXT    DEFAULT '';
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS menu_text            TEXT    DEFAULT '';
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS reception_phone      TEXT    DEFAULT '';
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS enable_wifi          BOOLEAN DEFAULT TRUE;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS enable_food_ordering BOOLEAN DEFAULT TRUE;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS enable_housekeeping  BOOLEAN DEFAULT TRUE;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS enable_call_desk     BOOLEAN DEFAULT TRUE;

-- ── Hotels RLS ──────────────────────────────────────────────────
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hotels_read_public"   ON hotels;
DROP POLICY IF EXISTS "hotels_insert_auth"   ON hotels;
DROP POLICY IF EXISTS "hotels_update_own"    ON hotels;

-- Public can read all active hotels (marketplace listings)
CREATE POLICY "hotels_read_public"
  ON hotels FOR SELECT
  USING (is_active = TRUE);

-- Inserts allowed (hotel onboarding — lock down with service role in prod)
CREATE POLICY "hotels_insert_auth"
  ON hotels FOR INSERT
  WITH CHECK (TRUE);

-- Updates allowed per-row (will be tightened to JWT claims in prod)
CREATE POLICY "hotels_update_own"
  ON hotels FOR UPDATE
  USING (TRUE);

-- ── Bookings table ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id               TEXT PRIMARY KEY,
  hotel_id         TEXT NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  guest_name       TEXT DEFAULT '',
  guest_phone      TEXT DEFAULT '',
  address          TEXT DEFAULT '',
  id_type          TEXT DEFAULT 'Aadhaar',
  id_number        TEXT DEFAULT '',           -- stored as "[Aadhaar Redacted]" in GRC audit logs
  gender           TEXT DEFAULT '',
  dob              TEXT DEFAULT '',
  room_id          TEXT DEFAULT '',
  room_type        TEXT DEFAULT 'standard',
  check_in_date    TEXT DEFAULT '',
  check_out_date   TEXT DEFAULT '',
  nights           INTEGER DEFAULT 1,
  rate_per_night   NUMERIC DEFAULT 0,
  total_amount     NUMERIC DEFAULT 0,
  payment_mode     TEXT DEFAULT 'Cash',
  status           TEXT DEFAULT 'active',     -- active | checked_out | cancelled
  rate_locked      BOOLEAN DEFAULT TRUE,
  negotiated       BOOLEAN DEFAULT FALSE,     -- TRUE if AI negotiator set this rate
  negotiated_from  NUMERIC DEFAULT 0,         -- original rate before negotiation
  extra_guests     JSONB DEFAULT '[]',
  source           TEXT DEFAULT 'direct',     -- direct | marketplace | walkin
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_hotel_id   ON bookings(hotel_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status     ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_check_in   ON bookings(check_in_date);

-- ── Bookings RLS ────────────────────────────────────────────────
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bookings_read_by_hotel"   ON bookings;
DROP POLICY IF EXISTS "bookings_insert_validated" ON bookings;
DROP POLICY IF EXISTS "bookings_update_by_hotel"  ON bookings;

-- Staff can read bookings only for their own hotel (hotel_id scoped)
CREATE POLICY "bookings_read_by_hotel"
  ON bookings FOR SELECT
  USING (TRUE);  -- tighten to: hotel_id = current_setting('app.hotel_id') in production

CREATE POLICY "bookings_insert_validated"
  ON bookings FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "bookings_update_by_hotel"
  ON bookings FOR UPDATE
  USING (TRUE);

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

-- ── Seed: Demo Hotels (v2 marketplace fields included) ───────────
INSERT INTO hotels (
  id, name, location, total_rooms, plan, emoji,
  owner_pin, manager_pin, owner_phone,
  standard_rate, deluxe_rate, suite_rate,
  city_slug, min_floor_price, is_featured,
  address_line, distance_tag, amenities,
  avg_rating, total_reviews, is_active
) VALUES
  (
    'cherry-bhopal', 'Hotel Cherry', 'Bhopal, Madhya Pradesh', 20, 'pro', '🍒',
    '4567', '8901', '919009109108',
    1200, 2000, 3800,
    'bhopal', 900, TRUE,
    'Peer Gate Area, Bhopal - 462001',
    '900m from Bus Stand',
    ARRAY['Free Wi-Fi','AC Rooms','Geyser','24/7 Reception'],
    4.5, 128, TRUE
  ),
  (
    'sunrise-jaipur', 'Hotel Sunrise Palace', 'Jaipur, Rajasthan', 40, 'pro', '🌅',
    '1234', '5678', '919876543210',
    1500, 2500, 5000,
    'jaipur', 1100, TRUE,
    'Civil Lines, Jaipur - 302006',
    '2.1 km from City Center',
    ARRAY['Free Wi-Fi','Pool Access','AC Rooms','Parking'],
    4.7, 312, TRUE
  ),
  (
    'midtown-indore', 'Hotel Midtown', 'Indore, Madhya Pradesh', 35, 'pro', '🏙️',
    '2233', '4455', '919977665544',
    1100, 1800, 3500,
    'indore', 850, FALSE,
    'MG Road, Indore - 452001',
    '900m from Bus Stand',
    ARRAY['Free Wi-Fi','Early Check-in','AC Rooms'],
    4.5, 89, TRUE
  ),
  (
    'comforts-nagpur', 'City Comforts Nagpur', 'Nagpur, Maharashtra', 30, 'starter', '🏨',
    '6677', '8899', '919988776655',
    1000, 1600, 3200,
    'nagpur', 800, FALSE,
    'Sitabuldi, Nagpur - 440012',
    '1.5 km from Bus Stand',
    ARRAY['Free Wi-Fi','Parking','AC Rooms'],
    4.4, 56, TRUE
  ),
  (
    'grand-mumbai', 'The Grand Inn Mumbai', 'Mumbai, Maharashtra', 120, 'enterprise', '🏩',
    '2345', '6789', '919900001111',
    2500, 4500, 9000,
    'mumbai', 2000, TRUE,
    'Andheri West, Mumbai - 400053',
    '1.8 km from Metro Station',
    ARRAY['Free Wi-Fi','Restaurant','Gym','AC Rooms','Parking','Room Service'],
    4.8, 920, TRUE
  )
ON CONFLICT (id) DO UPDATE SET
  city_slug       = EXCLUDED.city_slug,
  min_floor_price = EXCLUDED.min_floor_price,
  is_featured     = EXCLUDED.is_featured,
  address_line    = EXCLUDED.address_line,
  distance_tag    = EXCLUDED.distance_tag,
  amenities       = EXCLUDED.amenities,
  avg_rating      = EXCLUDED.avg_rating,
  total_reviews   = EXCLUDED.total_reviews,
  updated_at      = NOW();

-- ── RLS Audit Helper View (read-only, for GRC compliance logs) ──
-- ID fields in this view mask sensitive data per privacy policy.
-- Actual id_number stored as "[Aadhaar Redacted]" in test environments.
CREATE OR REPLACE VIEW bookings_audit_log AS
  SELECT
    b.id,
    b.hotel_id,
    h.name          AS hotel_name,
    b.guest_name,
    b.guest_phone,
    b.id_type,
    '[ID Omitted for Privacy]'::TEXT  AS id_number,   -- GRC compliance mask
    b.room_id,
    b.room_type,
    b.check_in_date,
    b.check_out_date,
    b.nights,
    b.rate_per_night,
    b.total_amount,
    b.payment_mode,
    b.status,
    b.rate_locked,
    b.negotiated,
    b.source,
    b.created_at
  FROM bookings b
  LEFT JOIN hotels h ON h.id = b.hotel_id;
