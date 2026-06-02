/**
 * lib/db.js — The GuestInn Network: Offline-First Single Source of Truth
 * ═══════════════════════════════════════════════════════════════════════
 * Multi-tenant Supabase + localStorage hybrid.
 * Supabase milne par use karo, warna localStorage fallback.
 * All functions are pure ESM — no require().
 *
 * VERSION 2.0 — FULL REWRITE
 * New additions:
 *  • exportComprehensiveCSV() — full GRC demographic CSV with all columns
 *  • id_image_base64 stored in bookings (police records compliance)
 *  • reserved status support (Gold) for marketplace bookings
 *  • approveReservation() — reserved → occupied status transition
 *  • updateBookingStatus() — generic status updater
 *  • getBookingsByStatus() — filter by status
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
const lsW = (k, d)  => { try { localStorage.setItem(k, JSON.stringify(d)); } catch {} };
const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
const K   = (hid, col) => `air_${hid}_${col}`;

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
  { id:"sunrise-jaipur",    name:"Hotel Sunrise Palace", location:"Jaipur, Rajasthan",      totalRooms:40,  plan:"pro",        emoji:"🌅", ownerPin:"1234", managerPin:"5678", ownerPhone:"919876543210", standardRate:1500, deluxeRate:2500, suiteRate:5000, minFloorPrice:1100 },
  { id:"grand-mumbai",      name:"The Grand Inn Mumbai", location:"Mumbai, Maharashtra",    totalRooms:120, plan:"enterprise", emoji:"🏩", ownerPin:"2345", managerPin:"6789", ownerPhone:"919900001111", standardRate:2500, deluxeRate:4500, suiteRate:9000, minFloorPrice:2000 },
  { id:"cherry-bhopal",     name:"Hotel Cherry",         location:"Bhopal, Madhya Pradesh", totalRooms:20,  plan:"pro",        emoji:"🍒", ownerPin:"4567", managerPin:"8901", ownerPhone:"919009109108", standardRate:1200, deluxeRate:2000, suiteRate:3800, minFloorPrice:900  },
  { id:"midtown-indore",    name:"Hotel Midtown",        location:"Indore, Madhya Pradesh", totalRooms:35,  plan:"pro",        emoji:"🏙️", ownerPin:"2233", managerPin:"4455", ownerPhone:"919977665544", standardRate:1100, deluxeRate:1800, suiteRate:3500, minFloorPrice:850  },
  { id:"comforts-nagpur",   name:"City Comforts Nagpur", location:"Nagpur, Maharashtra",    totalRooms:30,  plan:"starter",    emoji:"🏨", ownerPin:"6677", managerPin:"8899", ownerPhone:"919988776655", standardRate:1000, deluxeRate:1600, suiteRate:3200, minFloorPrice:800  },
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
        const mapped = data.map(mapHotelRow);
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
        const h = mapHotelRow(data);
        lsW(K(hotelId, "config"), { ...h, currency:"₹", gstPercent:12, checkoutTime:"11:00", rates:{ standard:h.standardRate||1200, deluxe:h.deluxeRate||2000, suite:h.suiteRate||3800 } });
        return h;
      }
    } catch (e) { console.warn("[DB] getHotelById failed:", e.message); }
  }
  const cached = ls(K(hotelId, "config"), null);
  if (cached) return cached;
  return DEMO_HOTELS.find(h => h.id === hotelId) || null;
}

function mapHotelRow(h) {
  return {
    id:            h.id,
    name:          h.name,
    location:      h.location       || "",
    addressLine:   h.address_line   || "",
    distanceTag:   h.distance_tag   || "",
    totalRooms:    h.total_rooms     || 20,
    plan:          h.plan           || "starter",
    emoji:         h.emoji          || "🏨",
    ownerPin:      h.owner_pin,
    managerPin:    h.manager_pin,
    ownerPhone:    h.owner_phone     || "",
    managerPhone:  h.manager_phone   || "",
    ownerEmail:    h.owner_email     || "",
    standardRate:  h.standard_rate   || 1200,
    deluxeRate:    h.deluxe_rate     || 2000,
    suiteRate:     h.suite_rate      || 3800,
    minFloorPrice: h.min_floor_price || 800,
    amenities:     h.amenities       || [],
    avgRating:     h.avg_rating      || 4.0,
    totalReviews:  h.total_reviews   || 0,
    isFeatured:    h.is_featured     || false,
    citySlug:      h.city_slug       || "",
    coverImageUrl: h.cover_image_url || "",
    rates: {
      standard: h.standard_rate || 1200,
      deluxe:   h.deluxe_rate   || 2000,
      suite:    h.suite_rate    || 3800,
    },
  };
}

export async function saveHotelToRegistry(hotel) {
  const custom = ls("gi_hotel_registry", []);
  lsW("gi_hotel_registry", [...custom.filter(h => h.id !== hotel.id), hotel]);
  const sb = getSB();
  if (sb) {
    try {
      const { error } = await sb.from("hotels").upsert({
        id:              hotel.id,
        name:            hotel.name,
        location:        hotel.location    || "",
        total_rooms:     hotel.totalRooms  || 20,
        plan:            hotel.plan        || "starter",
        emoji:           hotel.emoji       || "🏨",
        owner_pin:       hotel.ownerPin,
        manager_pin:     hotel.managerPin,
        owner_phone:     hotel.ownerPhone  || "",
        manager_phone:   hotel.managerPhone|| "",
        standard_rate:   hotel.standardRate|| 1200,
        deluxe_rate:     hotel.deluxeRate  || 2000,
        suite_rate:      hotel.suiteRate   || 3800,
        min_floor_price: hotel.minFloorPrice|| 800,
        created_at:      hotel.createdAt   || new Date().toISOString(),
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
  if (demo) return normalizeConfig({ ...demo, currency:"₹", gstPercent:12, checkoutTime:"11:00" });
  return normalizeConfig({ id:hid, name:"Hotel", location:"India", totalRooms:20, currency:"₹", gstPercent:12, checkoutTime:"11:00", rates:{ standard:1500, deluxe:2500, suite:4500 }, ownerPin:"1234", managerPin:"5678", plan:"starter", emoji:"🏨", standardRate:1500, deluxeRate:2500, suiteRate:4500, minFloorPrice:800 });
}

function normalizeConfig(cfg) {
  if (!cfg) return cfg;
  const r    = cfg.rates || {};
  const std  = r.standard  || cfg.standardRate  || 1200;
  const dlx  = r.deluxe    || cfg.deluxeRate    || 2000;
  const suit = r.suite     || cfg.suiteRate     || 3800;
  return {
    ...cfg,
    rates:        { standard:std, deluxe:dlx, suite:suit },
    standardRate: std,
    deluxeRate:   dlx,
    suiteRate:    suit,
  };
}

export function saveHotelConfig(hotelId, data) {
  const r    = data.rates || {};
  const std  = r.standard  || data.standardRate  || 1200;
  const dlx  = r.deluxe    || data.deluxeRate    || 2000;
  const suit = r.suite     || data.suiteRate     || 3800;
  const normalized = {
    ...data,
    rates:        { standard:std, deluxe:dlx, suite:suit },
    standardRate: std,
    deluxeRate:   dlx,
    suiteRate:    suit,
    updatedAt:    new Date().toISOString(),
  };
  lsW(K(hotelId || getActiveHotelId(), "config"), normalized);
  return normalized;
}

// ══════════════════════════════════════════════════════════════
// ROOMS
// ══════════════════════════════════════════════════════════════
export function initializeRooms(hotelId, totalRooms = 20) {
  const hid      = hotelId || getActiveHotelId();
  const existing = ls(K(hid, "rooms"), []);
  if (existing.length > 0) return existing;
  const cfg       = getHotelConfig(hid);
  const stdRate   = cfg.rates?.standard || 1200;
  const dlxRate   = cfg.rates?.deluxe   || 2000;
  const suitRate  = cfg.rates?.suite    || 3800;
  const rooms     = Array.from({ length: totalRooms }, (_, i) => {
    const type = i%10===0 ? "suite" : i%3===0 ? "deluxe" : "standard";
    return {
      id:               `${hid}_R${String(i+1).padStart(3,"0")}`,
      number:           i+1,
      floor:            Math.ceil((i+1) / Math.max(1, Math.ceil(totalRooms/5))),
      type,
      status:           "vacant",
      currentBookingId: null,
      guestName:        "",
      baseRate:         type==="suite" ? suitRate : type==="deluxe" ? dlxRate : stdRate,
    };
  });
  lsW(K(hid, "rooms"), rooms);
  return rooms;
}

export function getRooms(hotelId) {
  const hid   = hotelId || getActiveHotelId();
  const rooms = ls(K(hid, "rooms"), []);
  if (rooms.length === 0) return initializeRooms(hid, getHotelConfig(hid).totalRooms || 20);
  const cfg      = getHotelConfig(hid);
  const stdRate  = cfg.rates?.standard || 1200;
  const dlxRate  = cfg.rates?.deluxe   || 2000;
  const suitRate = cfg.rates?.suite    || 3800;
  return rooms.map(r => ({
    ...r,
    baseRate: r.type==="suite" ? suitRate : r.type==="deluxe" ? dlxRate : stdRate,
  }));
}

export function updateRoomStatus(hotelId, roomId, status, bookingId = null, guestName = "") {
  const hid   = hotelId || getActiveHotelId();
  const rooms = getRooms(hid).map(r => r.id === roomId
    ? { ...r, status, currentBookingId: bookingId, guestName: guestName || r.guestName || "" }
    : r);
  lsW(K(hid, "rooms"), rooms);
  const sb = getSB();
  if (sb) {
    sb.from("rooms").upsert({
      id:                 roomId,
      hotel_id:           hid,
      status,
      current_booking_id: bookingId,
      guest_name:         guestName,
      updated_at:         new Date().toISOString(),
    }).catch(e => console.warn("[DB] room status sync:", e.message));
  }
}

// ══════════════════════════════════════════════════════════════
// BOOKINGS — Supabase primary, localStorage fallback
// ══════════════════════════════════════════════════════════════
function sbRowToBooking(r) {
  return {
    id:            r.id,
    hotelId:       r.hotel_id,
    guestName:     r.guest_name      || "",
    guestPhone:    r.guest_phone     || "",
    address:       r.address         || "",
    idType:        r.id_type         || "Aadhaar",
    idNumber:      r.id_number       || "",
    idImageBase64: r.id_image_base64 || null,  // Base64 ID scan for police compliance
    gender:        r.gender          || "",
    dob:           r.dob             || "",
    nationality:   r.nationality     || "Indian",
    companyName:   r.company_name    || "",
    gstNo:         r.gst_no          || "",
    arrivalFrom:   r.arrival_from    || "",
    proceedingTo:  r.proceeding_to   || "",
    purposeOfVisit:r.purpose_of_visit|| "",
    roomId:        r.room_id         || "",
    roomType:      r.room_type       || "standard",
    checkInDate:   r.check_in_date   || "",
    checkOutDate:  r.check_out_date  || "",
    nights:        r.nights          || 1,
    ratePerNight:  r.rate_per_night  || 0,
    totalAmount:   r.total_amount    || 0,
    paymentMode:   r.payment_mode    || "Cash",
    status:        r.status          || "active",    // active | reserved | occupied | checked_out | cancelled
    rateLocked:    r.rate_locked     ?? true,
    negotiated:    r.negotiated      || false,
    negotiatedFrom:r.negotiated_from || 0,
    extraGuests:   r.extra_guests    || [],
    source:        r.source          || "direct",
    totalGuests:   r.total_guests    || 1,
    createdAt:     r.created_at      || new Date().toISOString(),
    approvedAt:    r.approved_at     || null,
    checkoutAt:    r.checkout_at     || null,
  };
}

// Async — fetches from Supabase, caches locally
export async function getBookings(hotelId) {
  const hid = hotelId || getActiveHotelId();
  const sb  = getSB();
  if (sb) {
    try {
      const { data, error } = await sb.from("bookings").select("*")
        .eq("hotel_id", hid).order("created_at", { ascending: false });
      if (!error && data) {
        const mapped = data.map(sbRowToBooking);
        lsW(K(hid, "bookings"), mapped);
        return mapped;
      }
    } catch (e) { console.warn("[DB] getBookings Supabase failed:", e.message); }
  }
  return ls(K(hid, "bookings"), []);
}

// Sync (instant, from cache) — use for stats/charts
export function getBookingsSync(hotelId)  { return ls(K(hotelId || getActiveHotelId(), "bookings"), []); }
export function getTodayBookings(hotelId) {
  const today = new Date().toDateString();
  return getBookingsSync(hotelId).filter(b => new Date(b.createdAt).toDateString() === today);
}
export function getBookingById(hotelId, id)    { return getBookingsSync(hotelId).find(b => b.id === id) || null; }
export function getBookingsByStatus(hotelId, status) {
  return getBookingsSync(hotelId).filter(b => b.status === status);
}

// ── CREATE BOOKING ────────────────────────────────────────────
// Handles both direct staff bookings and marketplace "reserved" bookings.
// isPublicBooking=true → status="reserved" (Gold) until staff approves.
export async function createBooking(hotelId, bookingData) {
  const hid    = hotelId || getActiveHotelId();
  const nights = Math.max(1, Number(bookingData.nights) || 1);
  const rate   = Number(bookingData.ratePerNight) || 0;
  const total  = Number(bookingData.totalAmount) || rate * nights;
  const now    = new Date().toISOString();
  const id     = uid();

  // Determine initial status
  // Marketplace booking → "reserved" (awaiting staff approval)
  // Direct staff booking → "occupied"
  const initialStatus = bookingData.isPublicBooking ? "reserved" : "occupied";

  const booking = {
    id,
    hotelId: hid,
    guestName:      bookingData.guestName      || "",
    guestPhone:     bookingData.guestPhone     || "",
    address:        bookingData.address        || "",
    idType:         bookingData.idType         || "Aadhaar",
    idNumber:       bookingData.idNumber       || "",
    idImageBase64:  bookingData.idImageBase64  || null,   // Base64 full ID scan
    idImageFront:   bookingData.idImageFront   || null,   // Thumbnail (display)
    idImageBack:    bookingData.idImageBack    || null,   // Thumbnail back side
    gender:         bookingData.gender         || "",
    dob:            bookingData.dob            || "",
    nationality:    bookingData.nationality    || "Indian",
    companyName:    bookingData.companyName    || "",
    gstNo:          bookingData.gstNo          || "",
    arrivalFrom:    bookingData.arrivalFrom    || "",
    proceedingTo:   bookingData.proceedingTo   || "",
    purposeOfVisit: bookingData.purposeOfVisit || "",
    roomId:         bookingData.roomId         || "",
    roomType:       bookingData.roomType       || "standard",
    checkInDate:    bookingData.checkInDate    || now.split("T")[0],
    checkOutDate:   bookingData.checkOutDate   || "",
    nights,
    ratePerNight:   rate,
    totalAmount:    total,
    paymentMode:    bookingData.paymentMode    || "Cash",
    status:         initialStatus,
    rateLocked:     true,
    lockedAt:       now,
    negotiated:     bookingData.negotiated     || false,
    negotiatedFrom: bookingData.negotiatedFrom || 0,
    rateLockToken:  bookingData.rateLockToken  || null,
    extraGuests:    bookingData.extraGuests    || [],
    totalGuests:    bookingData.totalGuests    || 1,
    source:         bookingData.source         || "direct",
    createdAt:      now,
    approvedAt:     initialStatus === "occupied" ? now : null,
  };

  // 1. localStorage — instant
  lsW(K(hid, "bookings"), [booking, ...getBookingsSync(hid)]);

  // Update room status
  const roomStatus = initialStatus === "reserved" ? "reserved" : "occupied";
  updateRoomStatus(hid, booking.roomId, roomStatus, booking.id, booking.guestName);

  // 2. Supabase — background sync
  const sb = getSB();
  if (sb) {
    sb.from("bookings").insert({
      id,
      hotel_id:        hid,
      guest_name:      booking.guestName,
      guest_phone:     booking.guestPhone,
      address:         booking.address,
      id_type:         booking.idType,
      id_number:       booking.idNumber,
      id_image_base64: booking.idImageBase64,  // Full Base64 for police records
      gender:          booking.gender,
      dob:             booking.dob,
      nationality:     booking.nationality,
      company_name:    booking.companyName,
      gst_no:          booking.gstNo,
      arrival_from:    booking.arrivalFrom,
      proceeding_to:   booking.proceedingTo,
      purpose_of_visit:booking.purposeOfVisit,
      room_id:         booking.roomId,
      room_type:       booking.roomType,
      check_in_date:   booking.checkInDate,
      check_out_date:  booking.checkOutDate,
      nights:          booking.nights,
      rate_per_night:  booking.ratePerNight,
      total_amount:    booking.totalAmount,
      payment_mode:    booking.paymentMode,
      status:          initialStatus,
      rate_locked:     true,
      negotiated:      booking.negotiated,
      negotiated_from: booking.negotiatedFrom,
      extra_guests:    booking.extraGuests,
      total_guests:    booking.totalGuests,
      source:          booking.source,
      created_at:      now,
      approved_at:     booking.approvedAt,
    }).then(({ error }) => {
      if (error) console.warn("[DB] Booking Supabase sync failed:", error.message);
      else console.log("[DB] Booking synced to Supabase ✓", id);
    }).catch(e => console.warn("[DB] insert error:", e.message));
  }

  return booking;
}

// ── APPROVE RESERVATION (reserved → occupied) ────────────────
// Called from DashboardView when staff approves a marketplace booking.
export async function approveReservation(hotelId, bookingId) {
  const hid      = hotelId || getActiveHotelId();
  const bookings = getBookingsSync(hid);
  const booking  = bookings.find(b => b.id === bookingId);
  if (!booking) return null;
  const now     = new Date().toISOString();
  const updated = bookings.map(b => b.id === bookingId
    ? { ...b, status:"occupied", approvedAt:now }
    : b
  );
  lsW(K(hid, "bookings"), updated);
  // Update room to occupied
  if (booking.roomId) updateRoomStatus(hid, booking.roomId, "occupied", bookingId, booking.guestName);
  const sb = getSB();
  if (sb) {
    sb.from("bookings").update({ status:"occupied", approved_at:now, updated_at:now })
      .eq("id", bookingId).then(({ error }) => {
        if (error) console.warn("[DB] Approve reservation sync failed:", error.message);
      }).catch(() => {});
  }
  return updated.find(b => b.id === bookingId);
}

// ── UPDATE BOOKING STATUS ─────────────────────────────────────
export async function updateBookingStatus(hotelId, bookingId, newStatus) {
  const hid      = hotelId || getActiveHotelId();
  const bookings = getBookingsSync(hid);
  const now      = new Date().toISOString();
  const updated  = bookings.map(b => b.id === bookingId
    ? { ...b, status:newStatus, updatedAt:now }
    : b
  );
  lsW(K(hid, "bookings"), updated);
  const sb = getSB();
  if (sb) {
    sb.from("bookings").update({ status:newStatus, updated_at:now })
      .eq("id", bookingId).catch(() => {});
  }
  return updated.find(b => b.id === bookingId);
}

// ── CHECKOUT ──────────────────────────────────────────────────
export async function checkoutBooking(hotelId, bookingId) {
  const hid      = hotelId || getActiveHotelId();
  const bookings = getBookingsSync(hid);
  const booking  = bookings.find(b => b.id === bookingId);
  if (!booking) return null;
  const now     = new Date().toISOString();
  const updated = bookings.map(b => b.id === bookingId
    ? { ...b, status:"checked_out", checkoutAt:now }
    : b
  );
  lsW(K(hid, "bookings"), updated);
  if (booking.roomId) updateRoomStatus(hid, booking.roomId, "cleaning", null);
  const sb = getSB();
  if (sb) {
    sb.from("bookings").update({ status:"checked_out", checkout_at:now, updated_at:now })
      .eq("id", bookingId).then(({ error }) => {
        if (error) console.warn("[DB] Checkout sync failed:", error.message);
      }).catch(() => {});
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
  const occupied  = rooms.filter(r => r.status === "occupied").length;
  const reserved  = rooms.filter(r => r.status === "reserved").length;
  const cleaning  = rooms.filter(r => r.status === "cleaning").length;
  const total     = config.totalRooms || rooms.length;
  const revenue   = today.filter(b => b.status !== "cancelled").reduce((s, b) => s + Number(b.totalAmount || 0), 0);
  return {
    totalRooms:       total,
    occupiedRooms:    occupied,
    reservedRooms:    reserved,
    vacantRooms:      total - occupied - reserved - cleaning,
    cleaningRooms:    cleaning,
    occupancyPercent: total>0 ? Math.round((occupied + reserved)/total*100) : 0,
    todayRevenue:     revenue,
    todayCheckIns:    today.length,
    currency:         config.currency || "₹",
    hotelName:        config.name,
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
// CSV EXPORT — Basic (backward compat)
// ══════════════════════════════════════════════════════════════
export function exportCSV(hotelId) {
  if (typeof window === "undefined") return;
  const hid  = hotelId || getActiveHotelId();
  const all  = getBookingsSync(hid);
  if (!all.length) { alert("Koi booking nahi hai."); return; }
  const h    = ["ID","Guest","Phone","Room","Check-in","Check-out","Nights","Rate","Total","Payment","Status"];
  const rows = all.map(b => [
    b.id, b.guestName, b.guestPhone, b.roomId,
    b.checkInDate ? new Date(b.checkInDate).toLocaleDateString("en-IN") : "—",
    b.checkOutDate ? new Date(b.checkOutDate).toLocaleDateString("en-IN") : "—",
    b.nights, `₹${b.ratePerNight}`, `₹${b.totalAmount}`, b.paymentMode, b.status,
  ]);
  triggerCSVDownload([h, ...rows], `${hid}_bookings_${todayStr()}.csv`);
}

// ══════════════════════════════════════════════════════════════
// COMPREHENSIVE GRC CSV EXPORT
// Full demographic columns for police records compliance.
// Sensitive ID fields are redacted in the exported file using
// static placeholder text per privacy policy.
// ══════════════════════════════════════════════════════════════
export function exportComprehensiveCSV(hotelId) {
  if (typeof window === "undefined") return;
  const hid    = hotelId || getActiveHotelId();
  const config = getHotelConfig(hid);
  const all    = getBookingsSync(hid);
  if (!all.length) { alert("Koi booking nahi hai export karne ke liye."); return; }

  // Expand extra guests into separate rows
  const rows = [];
  for (const b of all) {
    const extraGuests = (() => {
      try { return typeof b.extraGuests === "string" ? JSON.parse(b.extraGuests) : (b.extraGuests || []); }
      catch { return []; }
    })();

    // Primary guest row
    rows.push(buildGRCRow(b, {
      bookingId:      b.id,
      serialNo:       rows.length + 1,
      isPrimary:      true,
      guestIndex:     1,
      totalGuests:    1 + extraGuests.length,
    }));

    // Extra guests (if any) — separate rows linked to same booking
    for (let ei = 0; ei < extraGuests.length; ei++) {
      const eg = extraGuests[ei];
      rows.push(buildGRCRow(b, {
        bookingId:    b.id,
        serialNo:     rows.length + 1,
        isPrimary:    false,
        guestIndex:   ei + 2,
        totalGuests:  1 + extraGuests.length,
        // Override guest fields from extraGuest object
        guestName:    eg.guestName    || eg.name    || "",
        guestPhone:   eg.guestPhone   || eg.phone   || "",
        idType:       eg.idType       || "Aadhaar",
        idNumber:     "[ID Omitted for Privacy]",
        gender:       eg.gender       || "",
        dob:          eg.dob          || "",
        address:      eg.address      || b.address  || "",
        nationality:  eg.nationality  || "Indian",
      }));
    }
  }

  const headers = [
    // Booking meta
    "S.No", "Booking ID", "Hotel Name", "Source", "Booking Date",
    // Primary guest details
    "Guest Name", "Mobile Number", "Email", "Gender", "Date of Birth", "Nationality",
    // Address
    "Complete Address", "Arrival From", "Proceeding To", "Purpose of Visit",
    // ID Document
    "ID Type", "ID Number (Redacted)", "ID Image Captured",
    // Passport (foreign nationals)
    "Passport No", "Visa No", "Visa Issue Date",
    // Company
    "Company Name", "GST No",
    // Room & Stay
    "Room No", "Room Type", "Floor",
    "Check-in Date", "Check-out Date", "No. of Nights",
    // Financials
    "Rate/Night (₹)", "Total Amount (₹)", "Payment Mode",
    "AI Negotiated", "Original Rate (₹)", "Rate Lock Token",
    // Status
    "Booking Status", "Approved At", "Checkout At",
    // Guest position (for multi-guest bookings)
    "Guest No", "Total Guests in Room", "Is Primary Guest",
  ];

  const csvRows = rows.map(r => headers.map(h => {
    const v = r[h];
    // Escape commas and quotes in cell values
    if (v === null || v === undefined) return "";
    const s = String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  }).join(","));

  // BOM prefix for Excel UTF-8 compatibility
  const bom  = "\uFEFF";
  const csv  = bom + [headers.join(","), ...csvRows].join("\n");
  triggerCSVDownload(null, `${config.name || hid}_GRC_Full_${todayStr()}.csv`, csv);
}

function buildGRCRow(b, meta) {
  const rooms   = typeof window !== "undefined" ? ls(K(b.hotelId, "rooms"), []) : [];
  const room    = rooms.find(r => r.id === b.roomId) || {};
  const config  = typeof window !== "undefined" ? getHotelConfig(b.hotelId) : {};

  return {
    "S.No":                        meta.serialNo,
    "Booking ID":                  b.id,
    "Hotel Name":                  config.name || b.hotelId,
    "Source":                      b.source || "direct",
    "Booking Date":                fmtDate(b.createdAt),
    // Guest
    "Guest Name":                  meta.guestName  !== undefined ? meta.guestName  : (b.guestName  || ""),
    "Mobile Number":               meta.guestPhone !== undefined ? meta.guestPhone : (b.guestPhone || ""),
    "Email":                       b.email        || "",
    "Gender":                      meta.gender     !== undefined ? meta.gender     : (b.gender     || ""),
    "Date of Birth":               meta.dob        !== undefined ? meta.dob        : (b.dob        || ""),
    "Nationality":                 meta.nationality!== undefined ? meta.nationality: (b.nationality|| "Indian"),
    // Address
    "Complete Address":            meta.address    !== undefined ? meta.address    : (b.address    || ""),
    "Arrival From":                b.arrivalFrom    || "",
    "Proceeding To":               b.proceedingTo   || "",
    "Purpose of Visit":            b.purposeOfVisit || "",
    // ID — always redacted in CSV exports per privacy policy
    "ID Type":                     meta.idType     !== undefined ? meta.idType     : (b.idType     || "Aadhaar"),
    "ID Number (Redacted)":        "[ID Omitted for Privacy]",
    "ID Image Captured":           (b.idImageBase64 || b.idImageFront) ? "Yes" : "No",
    // Passport
    "Passport No":                 b.passportNo      || "",
    "Visa No":                     b.visaNo          || "",
    "Visa Issue Date":             b.visaIssueDate   || "",
    // Company
    "Company Name":                b.companyName     || "",
    "GST No":                      b.gstNo           || "",
    // Room
    "Room No":                     b.roomId           || "",
    "Room Type":                   b.roomType         || "standard",
    "Floor":                       room.floor         || "",
    // Stay
    "Check-in Date":               fmtDate(b.checkInDate),
    "Check-out Date":              b.checkOutDate ? fmtDate(b.checkOutDate) : "",
    "No. of Nights":               b.nights           || 1,
    // Financials
    "Rate/Night (₹)":              b.ratePerNight     || 0,
    "Total Amount (₹)":            b.totalAmount      || 0,
    "Payment Mode":                b.paymentMode      || "Cash",
    "AI Negotiated":               b.negotiated       ? "Yes" : "No",
    "Original Rate (₹)":           b.negotiatedFrom   || "",
    "Rate Lock Token":             b.rateLockToken    || "",
    // Status
    "Booking Status":              b.status           || "active",
    "Approved At":                 b.approvedAt ? fmtDate(b.approvedAt) : "",
    "Checkout At":                 b.checkoutAt ? fmtDate(b.checkoutAt) : "",
    // Multi-guest
    "Guest No":                    meta.guestIndex,
    "Total Guests in Room":        meta.totalGuests,
    "Is Primary Guest":            meta.isPrimary ? "Yes" : "No",
  };
}

// ── Download trigger helpers ──────────────────────────────────
function triggerCSVDownload(rowsMatrix, filename, rawCsv) {
  if (typeof window === "undefined") return;
  let content = rawCsv;
  if (!content && rowsMatrix) {
    content = rowsMatrix.map(r => r.map(v => {
      const s = String(v ?? "");
      return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g,'""')}"` : s;
    }).join(",")).join("\n");
  }
  const blob = new Blob([content], { type:"text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 500);
}

function fmtDate(d) {
  if (!d) return "";
  try { return new Date(d).toLocaleDateString("en-IN"); }
  catch { return d; }
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

// ══════════════════════════════════════════════════════════════
// JSON FULL EXPORT
// ══════════════════════════════════════════════════════════════
export function exportAllData(hotelId) {
  if (typeof window === "undefined") return;
  const hid      = hotelId || getActiveHotelId();
  const config   = getHotelConfig(hid);
  const bookings = getBookingsSync(hid);
  const rooms    = ls(K(hid, "rooms"), []);
  if (!bookings.length && !rooms.length) { alert("Koi data nahi hai."); return; }
  const payload = {
    exportedAt:    new Date().toISOString(),
    hotel:         config,
    totalBookings: bookings.length,
    // Strip id_image_base64 from JSON export to keep file size manageable
    bookings:      bookings.map(b => ({ ...b, idImageBase64:b.idImageBase64?"[BASE64_PRESENT]":null })),
    rooms,
  };
  try {
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type:"application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `${config.name||hid}_fulldata_${todayStr()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (e) { alert("Export failed: " + e.message); }
}

export function getDemoHotels() { return DEMO_HOTELS; }
