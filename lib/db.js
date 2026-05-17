/**
 * db.js — Hybrid Data Layer
 * ─────────────────────────────────────────────────────────────
 * Uses Supabase when env vars are set (production multi-device)
 * Falls back to localStorage for offline/demo use
 *
 * KEY FIX: Hotel registry syncs to Supabase so ALL devices see
 * the same hotels. Each device logs in with hotel PIN locally.
 * ─────────────────────────────────────────────────────────────
 */

// ── Supabase setup ────────────────────────────────────────────
let _sb = null;
function getSB() {
  if (_sb) return _sb;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || typeof window === "undefined") return null;
  try {
    const { createClient } = require("@supabase/supabase-js");
    _sb = createClient(url, key);
    return _sb;
  } catch { return null; }
}

// ── LocalStorage helpers ──────────────────────────────────────
const read  = (k, fb=[]) => {
  if (typeof window === "undefined") return fb;
  try { return JSON.parse(localStorage.getItem(k) ?? JSON.stringify(fb)); } catch { return fb; }
};
const write = (k, d) => {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(k, JSON.stringify(d)); } catch {}
};
const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
const K   = (hid, col) => `air_${hid}_${col}`;

// ── Active hotel ──────────────────────────────────────────────
export function getActiveHotelId() {
  if (typeof window === "undefined") return "default";
  try {
    const u = JSON.parse(localStorage.getItem("air_current_user") || "null");
    if (u?.hotelId) return u.hotelId;
    return localStorage.getItem("air_active_hotel") || "default";
  } catch { return "default"; }
}

// ══════════════════════════════════════════════════════════════
// HOTEL REGISTRY — syncs to Supabase so all devices see hotels
// ══════════════════════════════════════════════════════════════
export const DEMO_HOTELS = [
  { id:"sunrise-jaipur",    name:"Hotel Sunrise",  location:"Jaipur, Rajasthan",     totalRooms:40,  plan:"pro",        emoji:"🏨", ownerPin:"1234", managerPin:"5678" },
  { id:"grand-mumbai",      name:"The Grand Inn",  location:"Mumbai, Maharashtra",   totalRooms:120, plan:"enterprise", emoji:"🏩", ownerPin:"2345", managerPin:"6789" },
  { id:"saffron-ahmedabad", name:"Saffron Stays",  location:"Ahmedabad, Gujarat",    totalRooms:25,  plan:"free",       emoji:"🏪", ownerPin:"3456", managerPin:"7890" },
  { id:"cherry-bhopal",     name:"Hotel Cherry",   location:"Bhopal, Madhya Pradesh",totalRooms:20,  plan:"pro",        emoji:"🍒", ownerPin:"4567", managerPin:"8901" },
];

// Get all hotels — Supabase first, then localStorage + demos
export async function getAllHotels() {
  // 1. Try Supabase
  const sb = getSB();
  if (sb) {
    try {
      const { data, error } = await sb.from("hotels").select("*").order("created_at", { ascending: false });
      if (!error && data && data.length > 0) {
        // Cache locally for offline
        write("gi_hotel_registry_cache", data);
        return data;
      }
    } catch {}
  }
  // 2. LocalStorage custom hotels
  const custom = read("gi_hotel_registry", []);
  // 3. Merge demos + custom (deduplicate by id)
  const all = [...DEMO_HOTELS];
  for (const h of custom) {
    if (!all.find(x => x.id === h.id)) all.push(h);
  }
  // 4. Also check supabase cache
  const cached = read("gi_hotel_registry_cache", []);
  for (const h of cached) {
    if (!all.find(x => x.id === h.id)) all.push(h);
  }
  return all;
}

// Sync hotel to Supabase + localStorage
export async function saveHotelToRegistry(hotel) {
  // Always save to localStorage first (works offline)
  const custom = read("gi_hotel_registry", []);
  const updated = custom.filter(h => h.id !== hotel.id);
  write("gi_hotel_registry", [...updated, hotel]);

  // Try Supabase
  const sb = getSB();
  if (sb) {
    try {
      await sb.from("hotels").upsert({
        id:           hotel.id,
        name:         hotel.name,
        location:     hotel.location,
        total_rooms:  hotel.totalRooms || hotel.rooms || 20,
        plan:         hotel.plan || "starter",
        emoji:        hotel.emoji || "🏨",
        owner_pin:    hotel.ownerPin,
        manager_pin:  hotel.managerPin,
        owner_phone:  hotel.ownerPhone || "",
        created_at:   hotel.createdAt || new Date().toISOString(),
      });
      console.log("[DB] Hotel synced to Supabase:", hotel.id);
    } catch (e) {
      console.warn("[DB] Supabase sync failed (offline?):", e.message);
    }
  }
}

// ── HOTEL CONFIG ──────────────────────────────────────────────
export const getHotelConfig = (hotelId) => {
  const hid = hotelId || getActiveHotelId();
  const specific = read(K(hid, "config"), null);
  if (specific) return specific;
  const demo = DEMO_HOTELS.find(h => h.id === hid);
  if (demo) return { ...demo, currency:"₹", gstPercent:12, checkoutTime:"11:00",
    rates:{ standard:1500, deluxe:2500, suite:4500 } };
  return buildDefaultConfig(hid);
};

export const saveHotelConfig = (hotelId, data) => {
  const hid = hotelId || getActiveHotelId();
  write(K(hid, "config"), { ...data, updatedAt: new Date().toISOString() });
};

function buildDefaultConfig(hotelId) {
  return {
    id: hotelId, name: "The GuestInn", location: "India",
    totalRooms: 20, currency: "₹", gstPercent: 12, checkoutTime: "11:00",
    rates: { standard:1500, deluxe:2500, suite:4500 },
    ownerPin: "1234", managerPin: "5678", plan: "starter",
  };
}

export function getDemoHotels() { return DEMO_HOTELS; }

// ── ROOMS ─────────────────────────────────────────────────────
export const initializeRooms = (hotelId, totalRooms=20) => {
  const hid = hotelId || getActiveHotelId();
  const existing = read(K(hid,"rooms"), []);
  if (existing.length > 0) return existing;
  const rooms = Array.from({ length: totalRooms }, (_,i) => ({
    id: `${hid}_R${String(i+1).padStart(3,"0")}`,
    number: i+1,
    floor: Math.ceil((i+1)/Math.max(1,Math.ceil(totalRooms/5))),
    type: i%10===0?"suite":i%3===0?"deluxe":"standard",
    status: "vacant", currentBookingId: null,
    baseRate: i%10===0?4500:i%3===0?2500:1500,
  }));
  write(K(hid,"rooms"), rooms);
  return rooms;
};

export const getRooms = (hotelId) => {
  const hid = hotelId || getActiveHotelId();
  const rooms = read(K(hid,"rooms"), []);
  if (rooms.length === 0) {
    const cfg = getHotelConfig(hid);
    return initializeRooms(hid, cfg.totalRooms || 20);
  }
  return rooms;
};

export const updateRoomStatus = (hotelId, roomId, status, bookingId=null) => {
  const hid = hotelId || getActiveHotelId();
  const rooms = getRooms(hid).map(r =>
    r.id === roomId ? { ...r, status, currentBookingId: bookingId } : r
  );
  write(K(hid,"rooms"), rooms);
};

// ── BOOKINGS ──────────────────────────────────────────────────
export const getBookings     = (hotelId) => read(K(hotelId||getActiveHotelId(),"bookings"), []);
export const getTodayBookings = (hotelId) => {
  const today = new Date().toDateString();
  return getBookings(hotelId).filter(b => new Date(b.createdAt).toDateString() === today);
};
export const getBookingById = (hotelId, id) => getBookings(hotelId).find(b => b.id === id) || null;

export const createBooking = (hotelId, bookingData) => {
  const hid     = hotelId || getActiveHotelId();
  const nights  = Math.max(1, Number(bookingData.nights) || 1);
  const rate    = Number(bookingData.ratePerNight) || 0;
  const total   = Number(bookingData.totalAmount) || rate * nights;
  const booking = {
    id: uid(), hotelId: hid,
    guestName:    bookingData.guestName    || "",
    guestPhone:   bookingData.guestPhone   || "",
    address:      bookingData.address      || "",
    idType:       bookingData.idType       || "Aadhaar",
    idNumber:     bookingData.idNumber     || "",
    gender:       bookingData.gender       || "",
    roomId:       bookingData.roomId       || "",
    roomType:     bookingData.roomType     || "standard",
    checkInDate:  bookingData.checkInDate  || new Date().toISOString().split("T")[0],
    checkOutDate: bookingData.checkOutDate || "",
    nights, ratePerNight: rate, totalAmount: total,
    paymentMode:  bookingData.paymentMode  || "Cash",
    status: "active", rateLocked: true,
    lockedAt: new Date().toISOString(), createdAt: new Date().toISOString(),
  };
  const bookings = getBookings(hid);
  write(K(hid,"bookings"), [...bookings, booking]);
  updateRoomStatus(hid, booking.roomId, "occupied", booking.id);
  return booking;
};

export const checkoutBooking = (hotelId, bookingId) => {
  const hid      = hotelId || getActiveHotelId();
  const bookings = getBookings(hid);
  const booking  = bookings.find(b => b.id === bookingId);
  if (!booking) return null;
  const updated  = bookings.map(b =>
    b.id === bookingId ? { ...b, status:"checked_out", checkoutAt:new Date().toISOString() } : b
  );
  write(K(hid,"bookings"), updated);
  if (booking.roomId) updateRoomStatus(hid, booking.roomId, "cleaning", null);
  return updated.find(b => b.id === bookingId);
};

// ── STATS ─────────────────────────────────────────────────────
export const getTodayStats = (hotelId) => {
  const hid    = hotelId || getActiveHotelId();
  const today  = getTodayBookings(hid);
  const rooms  = getRooms(hid);
  const config = getHotelConfig(hid);
  const occupied = rooms.filter(r => r.status === "occupied").length;
  const cleaning = rooms.filter(r => r.status === "cleaning").length;
  const total    = config.totalRooms || rooms.length;
  const revenue  = today.filter(b => b.status !== "cancelled").reduce((s,b) => s+Number(b.totalAmount||0), 0);
  return {
    totalRooms: total, occupiedRooms: occupied, vacantRooms: total-occupied-cleaning,
    cleaningRooms: cleaning, occupancyPercent: total>0?Math.round(occupied/total*100):0,
    todayRevenue: revenue, todayCheckIns: today.length,
    currency: config.currency||"₹", hotelName: config.name,
  };
};

export const getWeeklyRevenue = (hotelId) => {
  const hid = hotelId || getActiveHotelId();
  const all = getBookings(hid);
  return Array.from({ length:7 }, (_,i) => {
    const d = new Date(); d.setDate(d.getDate()-(6-i));
    const rev = all
      .filter(b => new Date(b.createdAt).toDateString()===d.toDateString() && b.status!=="cancelled")
      .reduce((s,b) => s+Number(b.totalAmount||0), 0);
    return { date: d.toLocaleDateString("en-IN",{weekday:"short"}), revenue: rev };
  });
};

// ── EXPORT ────────────────────────────────────────────────────
export const exportCSV = (hotelId) => {
  if (typeof window === "undefined") return;
  const hid = hotelId || getActiveHotelId();
  const all = getBookings(hid);
  if (!all.length) { alert("Koi booking nahi hai."); return; }
  const h    = ["ID","Guest","Phone","Room","Check-in","Check-out","Nights","Rate","Total","Payment","Status"];
  const rows = all.map(b => [b.id,b.guestName,b.guestPhone,b.roomId,
    new Date(b.checkInDate).toLocaleDateString("en-IN"),
    b.checkOutDate?new Date(b.checkOutDate).toLocaleDateString("en-IN"):"—",
    b.nights,`₹${b.ratePerNight}`,`₹${b.totalAmount}`,b.paymentMode,b.status]);
  const csv  = [h,...rows].map(r=>r.join(",")).join("\n");
  const a    = document.createElement("a");
  a.href     = URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
  a.download = `${hid}_bookings_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
};

export const exportAllData = (hotelId) => {
  if (typeof window === "undefined") return;
  const hid  = hotelId || getActiveHotelId();
  const data = { hotel:getHotelConfig(hid), bookings:getBookings(hid), rooms:getRooms(hid), exportedAt:new Date().toISOString() };
  const a    = document.createElement("a");
  a.href     = URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));
  a.download = `${hid}_data_${new Date().toISOString().split("T")[0]}.json`;
  a.click();
};
