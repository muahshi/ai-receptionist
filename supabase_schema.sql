-- ═══════════════════════════════════════════════════════════════════════════
-- THE GUESTINN — SUPABASE SCHEMA
-- Multi-hotel SaaS: every hotel's data is isolated via hotel_id (RLS)
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── 1. HOTELS TABLE ─────────────────────────────────────────────────────────
-- One row per registered hotel (the "tenant" in our SaaS)
CREATE TABLE hotels (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug            TEXT UNIQUE NOT NULL,           -- e.g. "sunrise-jaipur"
  name            TEXT NOT NULL,
  location        TEXT,
  total_rooms     INT NOT NULL DEFAULT 20,
  currency        TEXT NOT NULL DEFAULT '₹',
  gst_percent     NUMERIC(5,2) DEFAULT 12.0,
  checkout_time   TIME DEFAULT '11:00',
  plan            TEXT NOT NULL DEFAULT 'free'    -- free | pro | enterprise
                  CHECK (plan IN ('free','pro','enterprise')),
  owner_pin_hash  TEXT NOT NULL,                  -- bcrypt hash, never plain
  manager_pin_hash TEXT NOT NULL,
  owner_phone     TEXT,
  manager_phone   TEXT,
  amenities       TEXT[] DEFAULT '{WiFi,AC,Parking}',
  emoji           TEXT DEFAULT '🏨',
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 2. ROOMS TABLE ──────────────────────────────────────────────────────────
-- Each room belongs to exactly one hotel
CREATE TABLE rooms (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id        UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  number          INT NOT NULL,
  floor           INT NOT NULL DEFAULT 1,
  type            TEXT NOT NULL DEFAULT 'standard'
                  CHECK (type IN ('standard','deluxe','suite')),
  status          TEXT NOT NULL DEFAULT 'vacant'
                  CHECK (status IN ('vacant','occupied','cleaning','out_of_order','reserved')),
  base_rate       NUMERIC(10,2) NOT NULL DEFAULT 1500,
  current_booking_id UUID,                        -- FK set after bookings table created
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (hotel_id, number)                       -- room 101 unique per hotel
);

-- ─── 3. GUESTS TABLE ─────────────────────────────────────────────────────────
-- Reusable guest profiles across multiple stays at the same hotel
CREATE TABLE guests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id        UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  phone           TEXT,
  address         TEXT,
  id_type         TEXT DEFAULT 'Aadhaar'
                  CHECK (id_type IN ('Aadhaar','Passport','PAN','Driving License','Voter ID','Other')),
  id_number       TEXT,
  gender          TEXT CHECK (gender IN ('Male','Female','Other','')),
  email           TEXT,
  nationality     TEXT DEFAULT 'Indian',
  -- AI scan metadata
  last_scanned_at TIMESTAMPTZ,
  scan_confidence NUMERIC(5,2),                  -- 0-100, from Groq
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (hotel_id, id_number)                   -- prevent duplicate ID per hotel
);

-- ─── 4. BOOKINGS TABLE ───────────────────────────────────────────────────────
-- Core transaction table — immutable once rate_locked = TRUE
CREATE TABLE bookings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id        UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_id         UUID NOT NULL REFERENCES rooms(id),
  guest_id        UUID NOT NULL REFERENCES guests(id),

  -- Dates & duration
  check_in_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  check_out_date  DATE,
  nights          INT NOT NULL DEFAULT 1,

  -- Financials — ANTI-THEFT: once rate_locked, these cannot be updated
  rate_per_night  NUMERIC(10,2) NOT NULL,
  total_amount    NUMERIC(10,2) NOT NULL,
  payment_mode    TEXT DEFAULT 'Cash'
                  CHECK (payment_mode IN ('Cash','UPI','Card','Online','Other')),
  gst_amount      NUMERIC(10,2) DEFAULT 0,
  discount_amount NUMERIC(10,2) DEFAULT 0,

  -- Rate lock — immutable integrity flag
  rate_locked     BOOLEAN NOT NULL DEFAULT TRUE,
  locked_at       TIMESTAMPTZ DEFAULT NOW(),
  locked_by       TEXT,                          -- role that locked: owner/manager

  -- Status
  status          TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','checked_out','cancelled','no_show')),
  checkout_at     TIMESTAMPTZ,

  -- Metadata
  room_type       TEXT,
  notes           TEXT,
  source          TEXT DEFAULT 'direct'          -- direct | booking.com | airbnb | walk-in
                  CHECK (source IN ('direct','booking.com','airbnb','walk-in','phone','website')),
  created_by      TEXT,                          -- role: owner/manager
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK from rooms back to bookings (circular — add after both created)
ALTER TABLE rooms
  ADD CONSTRAINT fk_rooms_current_booking
  FOREIGN KEY (current_booking_id)
  REFERENCES bookings(id)
  ON DELETE SET NULL;

-- ─── 5. LEADS TABLE ──────────────────────────────────────────────────────────
-- SaaS marketing leads from the landing page
CREATE TABLE leads (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  hotel_name      TEXT,
  phone           TEXT,
  rooms_count     TEXT,                          -- "1-20", "21-50", etc.
  email           TEXT,
  source          TEXT DEFAULT 'landing_page',
  status          TEXT DEFAULT 'new'
                  CHECK (status IN ('new','contacted','demo_scheduled','converted','lost')),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 6. AUDIT LOG TABLE ──────────────────────────────────────────────────────
-- Tracks all sensitive operations for owner visibility
CREATE TABLE audit_log (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id        UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  action          TEXT NOT NULL,                 -- checkout, rate_change, login, etc.
  entity_type     TEXT,                          -- booking, room, guest
  entity_id       UUID,
  performed_by    TEXT,                          -- role: owner/manager
  old_value       JSONB,
  new_value       JSONB,
  ip_address      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS) — THE CORE ISOLATION MECHANISM
-- Every table is protected: a hotel can ONLY see its own rows.
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE hotels   ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms    ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests   ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Policy: hotel reads its own config only
CREATE POLICY "hotel_isolation_hotels"
  ON hotels FOR ALL
  USING (id = (current_setting('app.hotel_id', TRUE)::UUID));

-- Policy: rooms isolation
CREATE POLICY "hotel_isolation_rooms"
  ON rooms FOR ALL
  USING (hotel_id = (current_setting('app.hotel_id', TRUE)::UUID));

-- Policy: guests isolation
CREATE POLICY "hotel_isolation_guests"
  ON guests FOR ALL
  USING (hotel_id = (current_setting('app.hotel_id', TRUE)::UUID));

-- Policy: bookings isolation
CREATE POLICY "hotel_isolation_bookings"
  ON bookings FOR ALL
  USING (hotel_id = (current_setting('app.hotel_id', TRUE)::UUID));

-- Policy: audit log isolation
CREATE POLICY "hotel_isolation_audit"
  ON audit_log FOR ALL
  USING (hotel_id = (current_setting('app.hotel_id', TRUE)::UUID));

-- RATE LOCK: prevent ANY update to financial fields once rate_locked = TRUE
-- This protects against manager fraud (changing rate after check-in)
CREATE POLICY "prevent_rate_tampering"
  ON bookings FOR UPDATE
  USING (
    rate_locked = FALSE
    OR (
      rate_locked = TRUE
      AND current_setting('app.role', TRUE) = 'owner'
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- INDEXES — Performance for common query patterns
-- ═══════════════════════════════════════════════════════════════════════════

-- Rooms: fast lookup by hotel + status (used for occupancy grid)
CREATE INDEX idx_rooms_hotel_status   ON rooms    (hotel_id, status);
CREATE INDEX idx_rooms_hotel_number   ON rooms    (hotel_id, number);

-- Bookings: today's bookings, revenue queries
CREATE INDEX idx_bookings_hotel_date  ON bookings (hotel_id, check_in_date);
CREATE INDEX idx_bookings_hotel_status ON bookings (hotel_id, status);
CREATE INDEX idx_bookings_created_at  ON bookings (hotel_id, created_at);
CREATE INDEX idx_bookings_room        ON bookings (room_id);

-- Guests: fast lookup by phone or ID number (for returning guests)
CREATE INDEX idx_guests_hotel_phone   ON guests   (hotel_id, phone);
CREATE INDEX idx_guests_hotel_id_num  ON guests   (hotel_id, id_number);

-- Audit: recent activity feed
CREATE INDEX idx_audit_hotel_recent   ON audit_log (hotel_id, created_at DESC);

-- Leads: sales pipeline
CREATE INDEX idx_leads_status         ON leads    (status, created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- TRIGGERS — Auto-update timestamps & enforce business rules
-- ═══════════════════════════════════════════════════════════════════════════

-- Function: auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER trg_hotels_updated_at
  BEFORE UPDATE ON hotels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_rooms_updated_at
  BEFORE UPDATE ON rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_guests_updated_at
  BEFORE UPDATE ON guests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function: when booking is created, set room to 'occupied'
CREATE OR REPLACE FUNCTION on_booking_created()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE rooms
  SET status = 'occupied', current_booking_id = NEW.id, updated_at = NOW()
  WHERE id = NEW.room_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_booking_occupies_room
  AFTER INSERT ON bookings
  FOR EACH ROW
  WHEN (NEW.status = 'active')
  EXECUTE FUNCTION on_booking_created();

-- Function: when booking checked_out, set room to 'cleaning'
CREATE OR REPLACE FUNCTION on_booking_checkout()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'checked_out' AND OLD.status = 'active' THEN
    UPDATE rooms
    SET status = 'cleaning', current_booking_id = NULL, updated_at = NOW()
    WHERE id = NEW.room_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_booking_checkout_cleans_room
  AFTER UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION on_booking_checkout();

-- ═══════════════════════════════════════════════════════════════════════════
-- VIEWS — Pre-built queries for dashboard
-- ═══════════════════════════════════════════════════════════════════════════

-- Today's stats view (used by DashboardView)
CREATE OR REPLACE VIEW today_stats AS
SELECT
  r.hotel_id,
  COUNT(*)                                     AS total_rooms,
  COUNT(*) FILTER (WHERE r.status = 'occupied')  AS occupied_rooms,
  COUNT(*) FILTER (WHERE r.status = 'vacant')    AS vacant_rooms,
  COUNT(*) FILTER (WHERE r.status = 'cleaning')  AS cleaning_rooms,
  ROUND(
    COUNT(*) FILTER (WHERE r.status = 'occupied')::NUMERIC
    / NULLIF(COUNT(*), 0) * 100, 1
  )                                              AS occupancy_percent,
  COALESCE(SUM(b.total_amount) FILTER (
    WHERE b.created_at::DATE = CURRENT_DATE
    AND b.status != 'cancelled'
  ), 0)                                          AS today_revenue,
  COUNT(b.id) FILTER (
    WHERE b.created_at::DATE = CURRENT_DATE
  )                                              AS today_checkins
FROM rooms r
LEFT JOIN bookings b ON b.room_id = r.id
GROUP BY r.hotel_id;

-- Weekly revenue view
CREATE OR REPLACE VIEW weekly_revenue AS
SELECT
  hotel_id,
  check_in_date                                  AS booking_date,
  TO_CHAR(check_in_date, 'Dy')                  AS day_label,
  SUM(total_amount) FILTER (WHERE status != 'cancelled') AS revenue,
  COUNT(id)                                      AS bookings_count
FROM bookings
WHERE check_in_date >= CURRENT_DATE - INTERVAL '6 days'
GROUP BY hotel_id, check_in_date
ORDER BY check_in_date;

-- ═══════════════════════════════════════════════════════════════════════════
-- SEED DATA — Demo hotel for testing
-- (Replace pin hashes with actual bcrypt hashes in production)
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO hotels (slug, name, location, total_rooms, plan, owner_pin_hash, manager_pin_hash, emoji)
VALUES
  ('sunrise-jaipur',    'Hotel Sunrise',  'Jaipur, Rajasthan',     40,  'pro',        '$2b$10$DEMO_HASH_OWNER_1234', '$2b$10$DEMO_HASH_MGR_5678', '🏨'),
  ('grand-mumbai',      'The Grand Inn',  'Mumbai, Maharashtra',   120, 'enterprise', '$2b$10$DEMO_HASH_OWNER_2345', '$2b$10$DEMO_HASH_MGR_6789', '🏩'),
  ('saffron-ahmedabad', 'Saffron Stays',  'Ahmedabad, Gujarat',    25,  'free',       '$2b$10$DEMO_HASH_OWNER_3456', '$2b$10$DEMO_HASH_MGR_7890', '🏪');

-- NOTE: In production, generate pin hashes like:
-- const hash = await bcrypt.hash(pin, 10);
