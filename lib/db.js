/**
 * lib/db.js — Atomic Dual-Write Hybrid [SYNC-FIX v4]
 *
 * ROOT CAUSE FIXED:
 *   booking/page.js apna khud ka localStorage write karta tha, PHIR createBooking
 *   call karta tha — isse double-write race condition aur state drift hoti thi.
 *
 * FIX ARCHITECTURE:
 *   1. createBooking() is the ONLY entry point for all booking writes.
 *   2. localStorage is written FIRST (synchronous, instant UI).
 *   3. BroadcastChannel fires IMMEDIATELY after localStorage write.
 *   4. Supabase sync happens in background — UI never blocks on it.
 *   5. No duplicate ID check needed because booking/page.js no longer
 *      pre-writes localStorage — it just calls createBooking() directly.
 */
import { createClient } from "@supabase/supabase-js";

// ── Supabase client (lazy, client-side only) ──────────────────
let _sb = null;
function getSB() {
  if (_sb) return _sb;
  if (typeof window === "undefined") return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || url === "undefined" || key === "undefined") return null;
  try { _sb = createClient(url, key); return _sb; } catch { return null; }
}

// ── localStorage helpers ──────────────────────────────────────
const ls  = (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } };
const lsW = (k, d) => { try { localStorage.setItem(k, JSON.stringify(d)); } catch {} };
const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
const K   = (hid, col) => `air_${hid}_${col}`;

// ── BroadcastChannel — same-tab + cross-tab real-time sync ────
// BroadcastChannel fires in ALL tabs including the sender (unlike storage event)
let _bc = null;
function getBroadcast() {
  if (_bc) return _bc;
  if (typeof window === "undefined") return null;
  try { _bc = new BroadcastChannel("air_hotel_sync"); return _bc; } catch { return null; }
}

export function broadcastUpdate(type, hotelId, payload = {}) {
  if (typeof window === "undefined") return;
  try {
    // BroadcastChannel — same tab + all other tabs receive this
    getBroadcast()?.postMessage({ type, hotelId, ts: Date.now(), ...payload });
    // localStorage sentinel — cross-origin fallback for tabs that missed BC
    localStorage.setItem(`air_sync_${hotelId}`, Date.now().toString());
  } catch {}
}

export function onHotelUpdate(cb) {
  if (typeof window === "undefined") return () => {};
  const bc = getBroadcast();
  const bcHandler = (e) => cb(e.data);
  bc?.addEventListener("message", bcHandler);

  // localStorage 'storage' event fires ONLY in OTHER tabs (not same tab)
  // This catches updates from tabs that don't use BroadcastChannel (e.g. legacy code)
  const storageHandler = (e) => {
    if (
      e.key?.startsWith("air_sync_") ||
      e.key?.includes("bookings") ||
      e.key?.includes("rooms")
    ) {
      cb({ type: "storage_event", key: e.key });
    }
  };
  window.addEventListener("storage", storageHandler);

  return () => {
    bc?.removeEventListener("message", bcHandler);
    window.removeEventListener("storage", storageHandler);
  };
}

// ── Active hotel ──────────────────────────────────────────────
export function getActiveHotelId() {
  if (typeof window === "undefined") return "default";
  try {
    const u = JSON.parse(localStorage.getItem("air_current_user") || "null");
    if (u?.hotelId) return u.hotelId;
  } catch {}
  return localStorage.getItem("air_active_hotel") || "default";
}

// ══════════════════════════════════════════════════════════════
// DEMO HOTELS — always available offline
// ══════════════════════════════════════════════════════════════
export const DEMO_HOTELS = [
  { id:"sunrise-jaipur",    name:"Hotel Sunrise",   location:"Jaipur, Rajasthan",      totalRooms:40,  plan:"pro",        emoji:"🏨", ownerPin:"1234", managerPin:"5678" },
  { id:"grand-mumbai",      name:"The Grand Inn",   location:"Mumbai, Maharashtra",    totalRooms:120, plan:"enterprise", emoji:"🏩", ownerPin:"2345", managerPin:"6789" },
  { id:"saffron-ahmedabad", name:"Saffron Stays",   location:"Ahmedabad, Gujarat",     totalRooms:25,  plan:"free",       emoji:"🏪", ownerPin:"3456", managerPin:"7890" },
  { id:"cherry-bhopal",     name:"Hotel Cherry",    location:"Bhopal, Madhya Pradesh", totalRooms:20,  plan:"pro",        emoji:"🍒", ownerPin:"4567", managerPin:"8901" },
];

// ══════════════════════════════════════════════════════════════
// HOTEL REGISTRY
// ══════════════════════════════════════════════════════════════
export async function getAllHotels() {
  const sb = getSB();
  if (sb) {
    try {
      const { data, error } = await sb.from("hotels").select("*").order("created_at", { ascending: false });
      if (!error && data?.length > 0) {
        const mapped = data.map(h => ({
          id:           h.id,
          name:         h.name,
          location:     h.location,
          totalRooms:   h.total_rooms || 20,
          plan:         h.plan || "starter",
          emoji:        h.emoji || "🏨",
          ownerPin:     h.owner_pin,
          managerPin:   h.manager_pin,
          ownerPhone:   h.owner_phone   || "",
          managerPhone: h.manager_phone || "",
          ownerEmail:   h.owner_email   || "",
          managerEmail: h.manager_email || "",
        }));
        lsW("gi_hotel_registry_cache", mapped);
        return mapped;
      }
    } catch (e) { console.warn("[DB] Supabase getAllHotels failed:", e.message); }
  }
  const custom = ls("gi_hotel_registry", []);
  const cache  = ls("gi_hotel_registry_cache", []);
  const all    = [...DEMO_HOTELS];
  for (const h of [...custom, ...cache]) {
    if (!all.find(x => x.id === h.id)) all.push(h);
  }
  return all;
}

export async function getHotelById(hotelId) {
  const sb = getSB();
  if (sb) {
    try {
      const { data, error } = await sb.from("hotels").select("*").eq("id", hotelId).single();
      if (!error && data) {
        const h = {
          id:           data.id,
          name:         data.name,
          location:     data.location,
          totalRooms:   data.total_rooms || 20,
          plan:         data.plan || "starter",
          emoji:        data.emoji || "🏨",
          ownerPin:     data.owner_pin,
          managerPin:   data.manager_pin,
          ownerPhone:   data.owner_phone   || "",
          managerPhone: data.manager_phone || "",
          ownerEmail:   data.owner_email   || "",
          managerEmail: data.manager_email || "",
          wifiPassword:       data.wifi_password        || "",
          receptionPhone:     data.reception_phone      || data.owner_phone || "",
          menuUrl:            data.menu_url             || "",
          menuText:           data.menu_text            || "",
          enableWifi:         data.enable_wifi          ?? true,
          enableFoodOrdering: data.enable_food_ordering ?? true,
          enableHousekeeping: data.enable_housekeeping  ?? true,
          enableCallDesk:     data.enable_call_desk     ?? true,
          checkoutTime:       data.checkout_time        || "11:00",
        };
        lsW(`air_${hotelId}_config`, {
          ...h,
          currency: "₹", gstPercent: 12,
          rates: {
            standard: data.standard_rate || 1200,
            deluxe:   data.deluxe_rate   || 2000,
            suite:    data.suite_rate    || 3800,
          }
        });
        return h;
      }
    } catch (e) { console.warn("[DB] getHotelById failed:", e.message); }
  }
  const cached = ls(`air_${hotelId}_config`, null);
  if (cached) return cached;
  const reg   = ls("gi_hotel_registry", []);
  const found = reg.find(h => h.id === hotelId);
  if (found) return found;
  const cache = ls("gi_hotel_registry_cache", []);
  const cachedH = cache.find(h => h.id === hotelId);
  if (cachedH) return cachedH;
  return DEMO_HOTELS.find(h => h.id === hotelId) || null;
}

export async function saveHotelToRegistry(hotel) {
  const custom = ls("gi_hotel_registry", []);
  lsW("gi_hotel_registry", [...custom.filter(h => h.id !== hotel.id), hotel]);
  const sb = getSB();
  if (sb) {
    try {
      const { error } = await sb.from("hotels").upsert({
        id:            hotel.id,
        name:          hotel.name,
        location:      hotel.location,
        total_rooms:   hotel.totalRooms   || 20,
        plan:          hotel.plan         || "starter",
        emoji:         hotel.emoji        || "🏨",
        owner_pin:     hotel.ownerPin,
        manager_pin:   hotel.managerPin,
        owner_phone:   hotel.ownerPhone   || "",
        manager_phone: hotel.managerPhone || "",
        owner_email:   hotel.ownerEmail   || "",
        manager_email: hotel.managerEmail || "",
        created_at:    hotel.createdAt    || new Date().toISOString(),
      });
      if (error) console.warn("[DB] Supabase upsert hotel failed:", error.message);
      else console.log("[DB] Hotel synced to Supabase ✓", hotel.id);
    } catch (e) { console.warn("[DB] saveHotel error:", e.message); }
  }
}

// ══════════════════════════════════════════════════════════════
// HOTEL CONFIG
// ══════════════════════════════════════════════════════════════
export function getHotelConfig(hotelId) {
  const hid = hotelId || getActiveHotelId();
  const raw = ls(K(hid, "config"), null);
  if (raw) return normalizeConfig(raw);
  const demo = DEMO_HOTELS.find(h => h.id === hid);
  if (demo) return normalizeConfig({ ...demo, currency:"₹", gstPercent:12, checkoutTime:"11:00", rates:{ standard:1500, deluxe:2500, suite:4500 } });
  return normalizeConfig({ id:hid, name:"Hotel", location:"India", totalRooms:20, currency:"₹", gstPercent:12, checkoutTime:"11:00", rates:{ standard:1500, deluxe:2500, suite:4500 }, ownerPin:"1234", managerPin:"5678", plan:"starter", emoji:"🏨" });
}

function normalizeConfig(cfg) {
  if (!cfg) return cfg;
  const r     = cfg.rates || {};
  const std   = r.standard   || cfg.standardRate   || 1200;
  const dlx   = r.deluxe     || cfg.deluxeRate     || 2000;
  const suite = r.suite      || cfg.suiteRate      || 3800;
  return {
    ...cfg,
    rates:         { standard:std, deluxe:dlx, suite:suite },
    standardRate:  std,
    deluxeRate:    dlx,
    suiteRate:     suite,
    wifiPassword:        cfg.wifiPassword        ?? "",
    menuUrl:             cfg.menuUrl             ?? "",
    menuText:            cfg.menuText            ?? "",
    receptionPhone:      cfg.receptionPhone      ?? "",
    enableWifi:          cfg.enableWifi          ?? true,
    enableFoodOrdering:  cfg.enableFoodOrdering  ?? true,
    enableHousekeeping:  cfg.enableHousekeeping  ?? true,
    enableCallDesk:      cfg.enableCallDesk      ?? true,
    managerPhone:        cfg.managerPhone        ?? "",
    ownerEmail:          cfg.ownerEmail          ?? "",
    managerEmail:        cfg.managerEmail        ?? "",
  };
}

export function saveHotelConfig(hotelId, data) {
  const hid = hotelId || getActiveHotelId();
  const r     = data.rates || {};
  const std   = r.standard   || data.standardRate   || 1200;
  const dlx   = r.deluxe     || data.deluxeRate     || 2000;
  const suite = r.suite      || data.suiteRate      || 3800;
  const normalized = {
    ...data,
    rates:        { standard:std, deluxe:dlx, suite:suite },
    standardRate: std,
    deluxeRate:   dlx,
    suiteRate:    suite,
    updatedAt:    new Date().toISOString(),
  };
  lsW(K(hid, "config"), normalized);
  const sb = getSB();
  if (sb) {
    sb.from("hotels").update({
      wifi_password:        normalized.wifiPassword        || "",
      reception_phone:      normalized.receptionPhone      || "",
      menu_url:             normalized.menuUrl             || "",
      menu_text:            normalized.menuText            || "",
      owner_phone:          normalized.ownerPhone          || "",
      manager_phone:        normalized.managerPhone        || "",
      owner_email:          normalized.ownerEmail          || "",
      manager_email:        normalized.managerEmail        || "",
      enable_wifi:          normalized.enableWifi          ?? true,
      enable_food_ordering: normalized.enableFoodOrdering  ?? true,
      enable_housekeeping:  normalized.enableHousekeeping  ?? true,
      enable_call_desk:     normalized.enableCallDesk      ?? true,
      checkout_time:        normalized.checkoutTime        || "11:00",
      standard_rate:        std,
      deluxe_rate:          dlx,
      suite_rate:           suite,
      updated_at:           new Date().toISOString(),
    }).eq("id", hid)
      .then(({ error }) => {
        if (error) console.warn("[DB] saveHotelConfig Supabase sync failed:", error.message);
        else console.log("[DB] Hotel config synced to Supabase ✓", hid);
      })
      .catch(e => console.warn("[DB] saveHotelConfig error:", e.message));
  }
  return normalized;
}

// ══════════════════════════════════════════════════════════════
// ROOMS
// ══════════════════════════════════════════════════════════════
export function initializeRooms(hotelId, totalRooms = 20) {
  const hid      = hotelId || getActiveHotelId();
  const existing = ls(K(hid, "rooms"), []);
  if (existing.length > 0) return existing;
  const cfg      = getHotelConfig(hid);
  const stdRate  = cfg.rates?.standard || cfg.standardRate || 1200;
  const dlxRate  = cfg.rates?.deluxe   || cfg.deluxeRate   || 2000;
  const suitRate = cfg.rates?.suite    || cfg.suiteRate    || 3800;
  const rooms    = Array.from({ length: totalRooms }, (_, i) => {
    const type = i%10===0?"suite":i%3===0?"deluxe":"standard";
    return {
      id:`${hid}_R${String(i+1).padStart(3,"0")}`, number:i+1,
      floor:Math.ceil((i+1)/Math.max(1,Math.ceil(totalRooms/5))),
      type, status:"vacant", currentBookingId:null, guestName:"",
      baseRate: type==="suite"?suitRate : type==="deluxe"?dlxRate : stdRate,
    };
  });
  lsW(K(hid, "rooms"), rooms);
  syncRoomsToSupabase(hid, rooms);
  return rooms;
}

export function getRooms(hotelId) {
  const hid    = hotelId || getActiveHotelId();
  const rooms  = ls(K(hid, "rooms"), []);
  if (rooms.length === 0) return initializeRooms(hid, getHotelConfig(hid).totalRooms || 20);
  const cfg    = getHotelConfig(hid);
  const stdRate  = cfg.rates?.standard || cfg.standardRate || 1200;
  const dlxRate  = cfg.rates?.deluxe   || cfg.deluxeRate   || 2000;
  const suitRate = cfg.rates?.suite    || cfg.suiteRate    || 3800;
  return rooms.map(r => ({
    ...r,
    baseRate: r.type==="suite" ? suitRate : r.type==="deluxe" ? dlxRate : stdRate,
  }));
}

/**
 * updateRoomStatus — ATOMIC room update
 * 1. localStorage write (instant)
 * 2. BroadcastChannel fire (all tabs see it immediately)
 * 3. Supabase upsert (background, non-blocking)
 */
export function updateRoomStatus(hotelId, roomId, status, bookingId = null, guestName = "") {
  const hid      = hotelId || getActiveHotelId();
  const allRooms = getRooms(hid);
  const target   = allRooms.find(r => r.id === roomId);
  const updated  = allRooms.map(r => r.id === roomId
    ? { ...r, status, currentBookingId: bookingId, guestName: guestName || r.guestName || "" }
    : r
  );
  // 1. localStorage — instant
  lsW(K(hid, "rooms"), updated);
  // 2. Broadcast — all tabs update their room grid instantly
  broadcastUpdate("room_status", hid, { roomId, status, bookingId, guestName });
  // 3. Supabase — background, never blocks UI
  const sb = getSB();
  if (sb) {
    (async () => {
      try {
        const { error } = await sb.from("rooms").upsert({
          id:                 roomId,
          hotel_id:           hid,
          number:             target?.number  || 0,
          floor:              target?.floor   || 1,
          type:               target?.type    || "standard",
          base_rate:          target?.baseRate || 1200,
          status,
          current_booking_id: bookingId,
          guest_name:         guestName || "",
          updated_at:         new Date().toISOString(),
        });
        if (error) console.warn("[DB] room status Supabase sync:", error.message);
      } catch (e) {
        console.warn("[DB] room status sync error:", e.message);
      }
    })();
  }
}

async function syncRoomsToSupabase(hotelId, rooms) {
  const sb = getSB();
  if (!sb || !rooms?.length) return;
  try {
    const rows = rooms.map(r => ({
      id:                 r.id,
      hotel_id:           hotelId,
      number:             r.number,
      floor:              r.floor,
      type:               r.type,
      base_rate:          r.baseRate,
      status:             r.status || "vacant",
      current_booking_id: r.currentBookingId || null,
      guest_name:         r.guestName || "",
      updated_at:         new Date().toISOString(),
    }));
    const { error } = await sb.from("rooms").upsert(rows);
    if (error) console.warn("[DB] syncRoomsToSupabase failed:", error.message);
    else console.log("[DB] Rooms synced to Supabase ✓", hotelId, rows.length, "rooms");
  } catch (e) {
    console.warn("[DB] syncRoomsToSupabase error:", e.message);
  }
}

// ══════════════════════════════════════════════════════════════
// BOOKINGS — ATOMIC DUAL-WRITE SYSTEM
// ══════════════════════════════════════════════════════════════
function sbRowToBooking(r) {
  return {
    id:r.id, hotelId:r.hotel_id,
    guestName:r.guest_name||"",   guestPhone:r.guest_phone||"",
    address:r.address||"",        idType:r.id_type||"Aadhaar",
    idNumber:r.id_number||"",     gender:r.gender||"",
    dob:r.dob||"",                roomId:r.room_id||"",
    roomNumber:r.room_number||0,
    roomType:r.room_type||"standard",
    checkInDate:r.check_in_date||"",   checkOutDate:r.check_out_date||"",
    nights:r.nights||1,           ratePerNight:r.rate_per_night||0,
    totalAmount:r.total_amount||0, paymentMode:r.payment_mode||"Cash",
    status:r.status||"active",    rateLocked:r.rate_locked??true,
    source:r.source||"direct",
    createdAt:r.created_at||new Date().toISOString(),
  };
}

export async function getBookings(hotelId) {
  const hid    = hotelId || getActiveHotelId();
  // Always read localStorage first — this is the safe local truth
  const cached = ls(K(hid, "bookings"), []);
  const sb     = getSB();
  if (sb) {
    try {
      const { data, error } = await sb.from("bookings").select("*")
        .eq("hotel_id", hid).order("created_at", { ascending: false });
      if (!error && data) {
        const mapped = data.map(sbRowToBooking);
        // CRITICAL FIX: Never overwrite localStorage cache with an empty
        // Supabase result. That was causing Guests/Reports to show blank even
        // when bookings existed locally (written by createBooking instantly).
        // Scenario: booking made → localStorage has it → Supabase fetch returns
        // empty (hotel_id mismatch or not yet synced) → old code wiped cache → blank screen.
        if (mapped.length > 0) {
          // Supabase has data — merge with any unsynced local-only bookings
          const sbIds     = new Set(mapped.map(b => b.id));
          const localOnly = cached.filter(b => !sbIds.has(b.id));
          const merged    = [...mapped, ...localOnly];
          lsW(K(hid, "bookings"), merged);
          return merged;
        }
        // Supabase returned 0 rows — serve localStorage cache (may have unsynced bookings)
        if (cached.length > 0) {
          console.log("[DB] Supabase returned 0 for", hid, "— serving", cached.length, "from cache");
          return cached;
        }
        // Both genuinely empty
        lsW(K(hid, "bookings"), []);
        return [];
      }
    } catch (e) { console.warn("[DB] getBookings Supabase failed:", e.message); }
  }
  return cached;
}

export function getBookingsSync(hotelId) { return ls(K(hotelId || getActiveHotelId(), "bookings"), []); }
export function getTodayBookings(hotelId) {
  const today = new Date().toDateString();
  return getBookingsSync(hotelId).filter(b => new Date(b.createdAt).toDateString() === today);
}
export function getBookingById(hotelId, id) { return getBookingsSync(hotelId).find(b => b.id === id) || null; }

/**
 * ensureHotelInSupabase — hotel ka existence guarantee karo Supabase mein.
 *
 * WHY THIS EXISTS:
 *   bookings table mein `hotel_id TEXT NOT NULL REFERENCES hotels(id)` FK constraint hai.
 *   DEMO_HOTELS (cherry-bhopal, sunrise-jaipur, etc.) sirf localStorage mein hain —
 *   Supabase ke hotels table mein nahi.
 *   Isliye jab bhi booking insert hoti hai, pehle hotel upsert kar do silently.
 *   Agar hotel already exist karta hai toh upsert no-op hai (ON CONFLICT DO NOTHING).
 */
async function ensureHotelInSupabase(hid) {
  const sb = getSB();
  if (!sb) return;
  try {
    // Check karo hotel exist karta hai ya nahi
    const { data, error: selErr } = await sb.from("hotels").select("id").eq("id", hid).maybeSingle();
    if (selErr) { console.warn("[DB] ensureHotel select failed:", selErr.message); return; }
    if (data) return; // already exists — done

    // Hotel nahi hai — upsert karo localStorage/DEMO se
    const cfg = getHotelConfig(hid);
    const demo = DEMO_HOTELS.find(h => h.id === hid);
    const src  = cfg || demo;
    if (!src) { console.warn("[DB] ensureHotel: no config found for", hid); return; }

    const { error: insErr } = await sb.from("hotels").upsert({
      id:            hid,
      name:          src.name          || hid,
      location:      src.location      || "",
      total_rooms:   src.totalRooms    || 20,
      plan:          src.plan          || "starter",
      emoji:         src.emoji         || "🏨",
      owner_pin:     src.ownerPin      || "1234",
      manager_pin:   src.managerPin    || "5678",
      owner_phone:   src.ownerPhone    || "",
      manager_phone: src.managerPhone  || "",
      owner_email:   src.ownerEmail    || "",
      standard_rate: src.rates?.standard || src.standardRate || 1200,
      deluxe_rate:   src.rates?.deluxe   || src.deluxeRate   || 2000,
      suite_rate:    src.rates?.suite    || src.suiteRate     || 3800,
      is_active:     true,
      created_at:    new Date().toISOString(),
    }, { onConflict: "id", ignoreDuplicates: true });

    if (insErr) console.warn("[DB] ensureHotel upsert failed:", insErr.message);
    else {
      console.log("[DB] Hotel auto-synced to Supabase ✓", hid);
      // ── CRITICAL: Also initialize rooms in Supabase ──
      // Without this, rooms.upsert in createBooking fails silently because
      // the room row doesn't exist yet (FK or just missing row).
      // initializeRooms creates rooms in localStorage AND calls syncRoomsToSupabase.
      const existingRooms = ls(K(hid, "rooms"), []);
      if (existingRooms.length > 0) {
        // Rooms exist in localStorage — sync them to Supabase
        syncRoomsToSupabase(hid, existingRooms);
      } else {
        // No rooms at all — create from config
        const cfg = getHotelConfig(hid);
        initializeRooms(hid, cfg.totalRooms || src.totalRooms || 20);
      }
    }
  } catch (e) {
    console.warn("[DB] ensureHotel error:", e.message);
  }
}

/**
 * createBooking — THE SINGLE SOURCE OF TRUTH for all booking writes.
 *
 * ATOMIC SEQUENCE:
 *   Step 1: localStorage write (instant, synchronous — UI updates immediately)
 *   Step 2: updateRoomStatus (localStorage + broadcast, synchronous)
 *   Step 3: BroadcastChannel fire (all tabs: Dashboard, Guests, Reports update)
 *   Step 4: Supabase insert (async, background — UI never waits for this)
 *
 * Called by:
 *   - ScannerView (manager check-in)
 *   - booking/[hotelId]/page.js (public booking) via { isPublicBooking: true }
 *
 * booking/page.js no longer pre-writes localStorage or fires its own broadcast.
 * This eliminates the double-write race condition that was causing state drift.
 */
export async function createBooking(hotelId, bookingData) {
  const hid    = hotelId || getActiveHotelId();
  const nights = Math.max(1, Number(bookingData.nights) || 1);
  const rate   = Number(bookingData.ratePerNight) || 0;
  const total  = Number(bookingData.totalAmount) || rate * nights;
  const now    = new Date().toISOString();
  const id     = bookingData.id || uid();

  // Resolve room number from roomId (e.g. "hotel_R005" → 5)
  const allRooms   = getRooms(hid);
  const roomObj    = allRooms.find(r => r.id === bookingData.roomId);
  const roomNumber = roomObj?.number || parseInt((bookingData.roomId || "").replace(/\D/g, "")) || bookingData.roomNumber || 0;

  const booking = {
    id, hotelId:hid,
    guestName:bookingData.guestName||"",     guestPhone:bookingData.guestPhone||"",
    address:bookingData.address||"",          idType:bookingData.idType||"Aadhaar",
    idNumber:bookingData.idNumber||"",        gender:bookingData.gender||"",
    dob:bookingData.dob||"",                  roomId:bookingData.roomId||"",
    roomNumber,
    roomType:bookingData.roomType||"standard",
    checkInDate:bookingData.checkInDate||now.split("T")[0],
    checkOutDate:bookingData.checkOutDate||"",
    nights, ratePerNight:rate, totalAmount:total,
    paymentMode:bookingData.paymentMode||"Cash",
    status:"active", rateLocked:true, lockedAt:now, createdAt:now,
    source: bookingData.isPublicBooking ? "marketplace" : (bookingData.source || "direct"),
    // Extra fields preserved as-is
    negotiated:     bookingData.negotiated     || false,
    negotiatedFrom: bookingData.negotiatedFrom || 0,
    rateLockToken:  bookingData.rateLockToken  || null,
    nationality:    bookingData.nationality    || "Indian",
  };

  // ── STEP 1: localStorage — instant, synchronous ──────────────
  const existing = getBookingsSync(hid);
  // Guard: skip if same ID already written (idempotent)
  if (!existing.find(b => b.id === id)) {
    lsW(K(hid, "bookings"), [booking, ...existing]);
  }

  // ── STEP 2: Room status — localStorage + broadcast ───────────
  // Public bookings: "reserved" (not yet physically checked in)
  // Manager check-in: "occupied"
  const roomStatus = bookingData.isPublicBooking ? "reserved" : "occupied";
  updateRoomStatus(hid, booking.roomId, roomStatus, booking.id, booking.guestName);
  // Note: updateRoomStatus already calls broadcastUpdate("room_status", ...)

  // ── STEP 3: Broadcast new_booking — Dashboard/Guests/Reports react ──
  broadcastUpdate("new_booking", hid, {
    bookingId:   booking.id,
    guestName:   booking.guestName,
    roomNumber:  booking.roomNumber,
    roomStatus,
    totalAmount: booking.totalAmount,
  });

  // ── STEP 4: Supabase — background, never blocks UI ───────────
  const sb = getSB();
  if (sb) {
    // CRITICAL: ensure hotel row exists in Supabase BEFORE inserting booking.
    // bookings table has FK: hotel_id REFERENCES hotels(id).
    // DEMO_HOTELS (cherry-bhopal etc.) only exist in localStorage — not in Supabase.
    // Without this, every booking insert fails silently with FK violation error.
    (async () => {
      try {
        await ensureHotelInSupabase(hid);

        // ── Pre-resolve room details for Supabase upsert ──
        // Do this BEFORE booking insert so we have the data even if insert fails
        const roomStatusSb = bookingData.isPublicBooking ? "reserved" : "occupied";
        const cfgSb = getHotelConfig(hid);
        const rateMapSb = {
          standard: cfgSb.rates?.standard || cfgSb.standardRate || 1200,
          deluxe:   cfgSb.rates?.deluxe   || cfgSb.deluxeRate   || 2000,
          suite:    cfgSb.rates?.suite    || cfgSb.suiteRate    || 3800,
        };
        const roomTypeSb = booking.roomType || "standard";

        // ── ALWAYS upsert room status first (don't wait for booking insert) ──
        // This ensures room grid updates on manager dashboard even if booking
        // insert fails/is duplicate. Room ID must be a real room ID, not _AUTO.
        if (booking.roomId && !booking.roomId.endsWith("_AUTO")) {
          try {
            await sb.from("rooms").upsert({
              id:                 booking.roomId,
              hotel_id:           hid,
              number:             booking.roomNumber,
              floor:              Math.ceil(booking.roomNumber / 10) || 1,
              type:               roomTypeSb,
              base_rate:          rateMapSb[roomTypeSb] || 1200,
              status:             roomStatusSb,
              current_booking_id: booking.id,
              guest_name:         booking.guestName,
              updated_at:         new Date().toISOString(),
            }, { onConflict: "id" });
            console.log("[DB] Room status synced to Supabase ✓", booking.roomId, roomStatusSb);
          } catch (re) {
            console.warn("[DB] Room upsert error:", re.message);
          }
        }

        const { error } = await sb.from("bookings").insert({
          id,
          hotel_id:        hid,
          guest_name:      booking.guestName,
          guest_phone:     booking.guestPhone,
          address:         booking.address,
          id_type:         booking.idType,
          id_number:       booking.idNumber,
          gender:          booking.gender,
          dob:             booking.dob,
          room_id:         booking.roomId,
          room_number:     booking.roomNumber,
          room_type:       booking.roomType,
          check_in_date:   booking.checkInDate,
          check_out_date:  booking.checkOutDate,
          nights:          booking.nights,
          rate_per_night:  booking.ratePerNight,
          total_amount:    booking.totalAmount,
          payment_mode:    booking.paymentMode,
          status:          "active",
          rate_locked:     true,
          negotiated:      booking.negotiated || false,
          negotiated_from: booking.negotiatedFrom || 0,
          source:          booking.source,
          created_at:      now,
        });
        if (error) {
          if (error.code !== "23505") {
            console.warn("[DB] Booking Supabase sync failed:", error.message);
          }
        } else {
          console.log("[DB] Booking synced to Supabase ✓", id);
        }
      } catch (e) {
        console.warn("[DB] Booking insert error:", e.message);
      }
    })();
  }

  return booking;
}

/**
 * checkoutBooking — ATOMIC checkout
 * Same pattern: localStorage first, broadcast, then Supabase background
 */
export async function checkoutBooking(hotelId, bookingId) {
  const hid      = hotelId || getActiveHotelId();
  const bookings = getBookingsSync(hid);
  const booking  = bookings.find(b => b.id === bookingId);
  if (!booking) return null;

  const now     = new Date().toISOString();
  const updated = bookings.map(b =>
    b.id === bookingId ? { ...b, status:"checked_out", checkoutAt:now } : b
  );

  // 1. localStorage — instant
  lsW(K(hid, "bookings"), updated);
  // 2. Room → cleaning (localStorage + broadcast)
  if (booking.roomId) updateRoomStatus(hid, booking.roomId, "cleaning", null, "");
  // 3. Broadcast checkout event
  broadcastUpdate("checkout", hid, {
    bookingId,
    roomId: booking.roomId,
    guestName: booking.guestName,
  });
  // 4. Supabase background — bookings + rooms table both update
  const sb = getSB();
  if (sb) {
    (async () => {
      try {
        await sb.from("bookings")
          .update({ status:"checked_out", updated_at:now })
          .eq("id", bookingId);
        // ── CRITICAL FIX: Update rooms table in Supabase on checkout ──
        // Without this, manager's dashboard keeps showing "occupied/reserved"
        // even after checkout because rooms table is never updated via Supabase
        if (booking.roomId) {
          await sb.from("rooms").upsert({
            id:                 booking.roomId,
            hotel_id:           hid,
            number:             booking.roomNumber || 0,
            floor:              Math.ceil((booking.roomNumber || 1) / 10) || 1,
            type:               booking.roomType || "standard",
            base_rate:          booking.ratePerNight || 1200,
            status:             "cleaning",
            current_booking_id: null,
            guest_name:         "",
            updated_at:         now,
          }, { onConflict: "id" });
        }
        console.log("[DB] Checkout synced ✓", bookingId);
      } catch (e) {
        console.warn("[DB] Checkout Supabase sync failed:", e.message);
      }
    })();
  }

  return updated.find(b => b.id === bookingId);
}

// ══════════════════════════════════════════════════════════════
// STATS
// ══════════════════════════════════════════════════════════════
export function getTodayStats(hotelId) {
  const hid      = hotelId || getActiveHotelId();
  const today    = getTodayBookings(hid);
  const rooms    = getRooms(hid);
  const config   = getHotelConfig(hid);
  const occupied = rooms.filter(r => r.status === "occupied").length;
  const cleaning = rooms.filter(r => r.status === "cleaning").length;
  const reserved = rooms.filter(r => r.status === "reserved").length;
  const total    = config.totalRooms || rooms.length;
  const revenue  = today.filter(b => b.status !== "cancelled").reduce((s, b) => s + Number(b.totalAmount || 0), 0);
  return {
    totalRooms:total, occupiedRooms:occupied, reservedRooms:reserved,
    vacantRooms:total-occupied-cleaning-reserved, cleaningRooms:cleaning,
    occupancyPercent:total>0?Math.round((occupied+reserved)/total*100):0,
    todayRevenue:revenue, todayCheckIns:today.length,
    currency:config.currency||"₹", hotelName:config.name,
  };
}

export function getWeeklyRevenue(hotelId) {
  const hid = hotelId || getActiveHotelId();
  const all = getBookingsSync(hid);
  return Array.from({ length:7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate()-(6-i));
    const rev = all.filter(b => new Date(b.createdAt).toDateString()===d.toDateString() && b.status!=="cancelled")
                   .reduce((s, b) => s+Number(b.totalAmount||0), 0);
    return { date:d.toLocaleDateString("en-IN",{weekday:"short"}), revenue:rev };
  });
}

// ══════════════════════════════════════════════════════════════
// CSV EXPORT
// ══════════════════════════════════════════════════════════════
export function exportCSV(hotelId) {
  if (typeof window === "undefined") return;
  const hid  = hotelId || getActiveHotelId();
  const all  = getBookingsSync(hid);
  if (!all.length) { alert("Koi booking nahi hai."); return; }
  const h    = ["ID","Guest","Phone","Room","Check-in","Check-out","Nights","Rate","Total","Payment","Status","Source"];
  const rows = all.map(b => [b.id,b.guestName,b.guestPhone,b.roomId,
    new Date(b.checkInDate).toLocaleDateString("en-IN"),
    b.checkOutDate?new Date(b.checkOutDate).toLocaleDateString("en-IN"):"—",
    b.nights,`₹${b.ratePerNight}`,`₹${b.totalAmount}`,b.paymentMode,b.status,b.source||"direct"]);
  const csv  = [h,...rows].map(r=>r.join(",")).join("\n");
  const a    = document.createElement("a");
  a.href     = URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
  a.download = `${hid}_bookings_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
}

export function getDemoHotels() { return DEMO_HOTELS; }

// ══════════════════════════════════════════════════════════════
// JSON FULL EXPORT
// ══════════════════════════════════════════════════════════════
export function exportAllData(hotelId) {
  if (typeof window === "undefined") return;
  const hid      = hotelId || getActiveHotelId();
  const config   = getHotelConfig(hid);
  const bookings = getBookingsSync(hid);
  const rooms    = ls(K(hid, "rooms"), []);

  if (!bookings.length && !rooms.length) {
    alert("Koi data nahi hai export karne ke liye.");
    return;
  }

  const expanded = [];
  for (const b of bookings) {
    expanded.push({ ...b, guestIndex:1, totalGuests:1 + (b.extraGuests?.length || 0) });
    for (const eg of (b.extraGuests || [])) {
      expanded.push({ ...b, ...eg, guestIndex:expanded.length - bookings.indexOf(b) + 1, primaryBookingId:b.id });
    }
  }

  const payload = {
    exportedAt:   new Date().toISOString(),
    hotel:        config,
    totalBookings:bookings.length,
    bookings:     expanded,
    rooms,
  };

  try {
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type:"application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `${config.name||hid}_fulldata_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (e) {
    alert("Export failed: " + e.message);
  }
}
