/**
 * lib/db.js — Supabase + localStorage hybrid
 * Supabase milega to use karo, warna localStorage fallback
 * NO require() — pure ESM imports for Next.js 14
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
// HOTEL REGISTRY — loads from Supabase (all devices same list)
// ══════════════════════════════════════════════════════════════
export async function getAllHotels() {
  const sb = getSB();
  if (sb) {
    try {
      const { data, error } = await sb.from("hotels").select("*").order("created_at", { ascending: false });
      if (!error && data?.length > 0) {
        // Map Supabase columns → app fields
        const mapped = data.map(h => ({
          id:          h.id,
          name:        h.name,
          location:    h.location,
          totalRooms:  h.total_rooms || 20,
          plan:        h.plan || "starter",
          emoji:       h.emoji || "🏨",
          ownerPin:    h.owner_pin,
          managerPin:  h.manager_pin,
          ownerPhone:  h.owner_phone || "",
        }));
        lsW("gi_hotel_registry_cache", mapped);
        return mapped;
      }
    } catch (e) { console.warn("[DB] Supabase getAllHotels failed:", e.message); }
  }

  // Fallback: localStorage custom + cache + demos
  const custom = ls("gi_hotel_registry", []);
  const cache  = ls("gi_hotel_registry_cache", []);
  const all    = [...DEMO_HOTELS];
  for (const h of [...custom, ...cache]) {
    if (!all.find(x => x.id === h.id)) all.push(h);
  }
  return all;
}

// Find one hotel by ID — used by /h/[hotelId] and /booking/[hotelId]
export async function getHotelById(hotelId) {
  const sb = getSB();
  if (sb) {
    try {
      const { data, error } = await sb.from("hotels").select("*").eq("id", hotelId).single();
      if (!error && data) {
        const h = {
          id:         data.id,
          name:       data.name,
          location:   data.location,
          totalRooms: data.total_rooms || 20,
          plan:       data.plan || "starter",
          emoji:      data.emoji || "🏨",
          ownerPin:   data.owner_pin,
          managerPin: data.manager_pin,
          ownerPhone: data.owner_phone || "",
        };
        lsW(`air_${hotelId}_config`, { ...h, currency:"₹", gstPercent:12, checkoutTime:"11:00", rates:{ standard:1500, deluxe:2500, suite:4500 } });
        return h;
      }
    } catch (e) { console.warn("[DB] getHotelById Supabase failed:", e.message); }
  }

  // localStorage fallbacks
  const cached = ls(`air_${hotelId}_config`, null);
  if (cached) return cached;
  const reg = ls("gi_hotel_registry", []);
  const found = reg.find(h => h.id === hotelId);
  if (found) return found;
  const cache = ls("gi_hotel_registry_cache", []);
  const cachedH = cache.find(h => h.id === hotelId);
  if (cachedH) return cachedH;
  return DEMO_HOTELS.find(h => h.id === hotelId) || null;
}

// Register new hotel → Supabase + localStorage
export async function saveHotelToRegistry(hotel) {
  // Always localStorage first
  const custom = ls("gi_hotel_registry", []);
  lsW("gi_hotel_registry", [...custom.filter(h => h.id !== hotel.id), hotel]);

  const sb = getSB();
  if (sb) {
    try {
      const { error } = await sb.from("hotels").upsert({
        id:          hotel.id,
        name:        hotel.name,
        location:    hotel.location,
        total_rooms: hotel.totalRooms || 20,
        plan:        hotel.plan || "starter",
        emoji:       hotel.emoji || "🏨",
        owner_pin:   hotel.ownerPin,
        manager_pin: hotel.managerPin,
        owner_phone: hotel.ownerPhone || "",
        created_at:  hotel.createdAt || new Date().toISOString(),
      });
      if (error) console.warn("[DB] Supabase upsert hotel failed:", error.message);
      else console.log("[DB] Hotel synced to Supabase ✓", hotel.id);
    } catch (e) { console.warn("[DB] Supabase saveHotel error:", e.message); }
  } else {
    console.warn("[DB] Supabase not available — saved to localStorage only");
  }
}

// ══════════════════════════════════════════════════════════════
// HOTEL CONFIG (synchronous — from localStorage cache)
// ══════════════════════════════════════════════════════════════
export function getHotelConfig(hotelId) {
  const hid = hotelId || getActiveHotelId();
  const cached = ls(K(hid, "config"), null);
  if (cached) return cached;
  const demo = DEMO_HOTELS.find(h => h.id === hid);
  if (demo) return { ...demo, currency:"₹", gstPercent:12, checkoutTime:"11:00", rates:{ standard:1500, deluxe:2500, suite:4500 } };
  return { id:hid, name:"Hotel", location:"India", totalRooms:20, currency:"₹", gstPercent:12, checkoutTime:"11:00", rates:{ standard:1500, deluxe:2500, suite:4500 }, ownerPin:"1234", managerPin:"5678", plan:"starter", emoji:"🏨" };
}

export function saveHotelConfig(hotelId, data) {
  lsW(K(hotelId || getActiveHotelId(), "config"), { ...data, updatedAt: new Date().toISOString() });
}

// ══════════════════════════════════════════════════════════════
// ROOMS
// ══════════════════════════════════════════════════════════════
export function initializeRooms(hotelId, totalRooms = 20) {
  const hid = hotelId || getActiveHotelId();
  const existing = ls(K(hid, "rooms"), []);
  if (existing.length > 0) return existing;
  const rooms = Array.from({ length: totalRooms }, (_, i) => ({
    id:     `${hid}_R${String(i + 1).padStart(3, "0")}`,
    number: i + 1,
    floor:  Math.ceil((i + 1) / Math.max(1, Math.ceil(totalRooms / 5))),
    type:   i % 10 === 0 ? "suite" : i % 3 === 0 ? "deluxe" : "standard",
    status: "vacant",
    currentBookingId: null,
    baseRate: i % 10 === 0 ? 4500 : i % 3 === 0 ? 2500 : 1500,
  }));
  lsW(K(hid, "rooms"), rooms);
  return rooms;
}

export function getRooms(hotelId) {
  const hid = hotelId || getActiveHotelId();
  const rooms = ls(K(hid, "rooms"), []);
  if (rooms.length === 0) return initializeRooms(hid, getHotelConfig(hid).totalRooms || 20);
  return rooms;
}

export function updateRoomStatus(hotelId, roomId, status, bookingId = null) {
  const hid   = hotelId || getActiveHotelId();
  const rooms = getRooms(hid).map(r => r.id === roomId ? { ...r, status, currentBookingId: bookingId } : r);
  lsW(K(hid, "rooms"), rooms);
}

// ══════════════════════════════════════════════════════════════
// BOOKINGS
// ══════════════════════════════════════════════════════════════
export function getBookings(hotelId) { return ls(K(hotelId || getActiveHotelId(), "bookings"), []); }

export function getTodayBookings(hotelId) {
  const today = new Date().toDateString();
  return getBookings(hotelId).filter(b => new Date(b.createdAt).toDateString() === today);
}

export function getBookingById(hotelId, id) { return getBookings(hotelId).find(b => b.id === id) || null; }

export function createBooking(hotelId, bookingData) {
  const hid    = hotelId || getActiveHotelId();
  const nights = Math.max(1, Number(bookingData.nights) || 1);
  const rate   = Number(bookingData.ratePerNight) || 0;
  const total  = Number(bookingData.totalAmount) || rate * nights;
  const booking = {
    id: uid(), hotelId: hid,
    guestName:   bookingData.guestName   || "",
    guestPhone:  bookingData.guestPhone  || "",
    address:     bookingData.address     || "",
    idType:      bookingData.idType      || "Aadhaar",
    idNumber:    bookingData.idNumber    || "",
    gender:      bookingData.gender      || "",
    dob:         bookingData.dob         || "",
    roomId:      bookingData.roomId      || "",
    roomType:    bookingData.roomType    || "standard",
    checkInDate: bookingData.checkInDate || new Date().toISOString().split("T")[0],
    checkOutDate:bookingData.checkOutDate|| "",
    nights, ratePerNight: rate, totalAmount: total,
    paymentMode: bookingData.paymentMode || "Cash",
    status: "active", rateLocked: true,
    lockedAt: new Date().toISOString(), createdAt: new Date().toISOString(),
  };
  lsW(K(hid, "bookings"), [...getBookings(hid), booking]);
  updateRoomStatus(hid, booking.roomId, "occupied", booking.id);
  return booking;
}

export function checkoutBooking(hotelId, bookingId) {
  const hid      = hotelId || getActiveHotelId();
  const bookings = getBookings(hid);
  const booking  = bookings.find(b => b.id === bookingId);
  if (!booking) return null;
  const updated = bookings.map(b => b.id === bookingId ? { ...b, status:"checked_out", checkoutAt: new Date().toISOString() } : b);
  lsW(K(hid, "bookings"), updated);
  if (booking.roomId) updateRoomStatus(hid, booking.roomId, "cleaning", null);
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
  const total    = config.totalRooms || rooms.length;
  const revenue  = today.filter(b => b.status !== "cancelled").reduce((s, b) => s + Number(b.totalAmount || 0), 0);
  return {
    totalRooms: total, occupiedRooms: occupied,
    vacantRooms: total - occupied - cleaning, cleaningRooms: cleaning,
    occupancyPercent: total > 0 ? Math.round(occupied / total * 100) : 0,
    todayRevenue: revenue, todayCheckIns: today.length,
    currency: config.currency || "₹", hotelName: config.name,
  };
}

export function getWeeklyRevenue(hotelId) {
  const hid = hotelId || getActiveHotelId();
  const all = getBookings(hid);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const rev = all.filter(b => new Date(b.createdAt).toDateString() === d.toDateString() && b.status !== "cancelled")
                   .reduce((s, b) => s + Number(b.totalAmount || 0), 0);
    return { date: d.toLocaleDateString("en-IN", { weekday: "short" }), revenue: rev };
  });
}

// ══════════════════════════════════════════════════════════════
// EXPORT
// ══════════════════════════════════════════════════════════════
export function exportCSV(hotelId) {
  if (typeof window === "undefined") return;
  const hid  = hotelId || getActiveHotelId();
  const all  = getBookings(hid);
  if (!all.length) { alert("Koi booking nahi hai."); return; }
  const h    = ["ID","Guest","Phone","Room","Check-in","Check-out","Nights","Rate","Total","Payment","Status"];
  const rows = all.map(b => [b.id, b.guestName, b.guestPhone, b.roomId,
    new Date(b.checkInDate).toLocaleDateString("en-IN"),
    b.checkOutDate ? new Date(b.checkOutDate).toLocaleDateString("en-IN") : "—",
    b.nights, `₹${b.ratePerNight}`, `₹${b.totalAmount}`, b.paymentMode, b.status]);
  const csv  = [h, ...rows].map(r => r.join(",")).join("\n");
  const a    = document.createElement("a");
  a.href     = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = `${hid}_bookings_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
}

export function getDemoHotels() { return DEMO_HOTELS; }
