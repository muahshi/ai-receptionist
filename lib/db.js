/**
 * lib/db.js — Supabase + localStorage hybrid  [FIXED v3]
 *
 * FIXES APPLIED:
 *  1. saveHotelToRegistry() — manager_phone, owner_email, manager_email fields ADD kiye
 *  2. saveHotelConfig()     — Supabase mein bhi sync karta hai ab (pehle sirf localStorage tha)
 *  3. getHotelById()        — manager_phone, owner_email, manager_email ab map hote hain
 *  4. getAllHotels()         — manager_phone, owner_email, manager_email ab map hote hain
 *  5. updateRoomStatus()    — upsert mein number aur floor bhi save hota hai ab (rooms table ke liye)
 *  6. createBooking()       — room_number column bhi save hota hai Supabase mein
 *  7. syncRoomsToSupabase() — new helper: rooms table ko Supabase mein initialize karta hai
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
          // FIX #1: ye teeno pehle missing the
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
          // FIX #2: ye teeno pehle missing the
          managerPhone: data.manager_phone || "",
          ownerEmail:   data.owner_email   || "",
          managerEmail: data.manager_email || "",
          // Settings fields
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
  const reg = ls("gi_hotel_registry", []);
  const found = reg.find(h => h.id === hotelId);
  if (found) return found;
  const cache = ls("gi_hotel_registry_cache", []);
  const cachedH = cache.find(h => h.id === hotelId);
  if (cachedH) return cachedH;
  return DEMO_HOTELS.find(h => h.id === hotelId) || null;
}

// FIX #3: saveHotelToRegistry — manager_phone, owner_email, manager_email add kiye
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
        manager_phone: hotel.managerPhone || "",   // FIX: was missing
        owner_email:   hotel.ownerEmail   || "",   // FIX: was missing
        manager_email: hotel.managerEmail || "",   // FIX: was missing
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
    // FIX: alerts ke liye zaroori fields ensure karo
    managerPhone:        cfg.managerPhone        ?? "",
    ownerEmail:          cfg.ownerEmail          ?? "",
    managerEmail:        cfg.managerEmail        ?? "",
  };
}

// FIX #4: saveHotelConfig — ab Supabase mein bhi sync karta hai
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

  // FIX: Supabase mein bhi update karo — pehle ye bilkul nahi tha
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

  // FIX: naye hotel ke rooms bhi Supabase mein sync karo
  syncRoomsToSupabase(hid, rooms);
  return rooms;
}

export function getRooms(hotelId) {
  const hid    = hotelId || getActiveHotelId();
  const rooms  = ls(K(hid, "rooms"), []);
  if (rooms.length === 0) return initializeRooms(hid, getHotelConfig(hid).totalRooms || 20);
  const cfg    = getHotelConfig(hid);
  const stdRate = cfg.rates?.standard || cfg.standardRate || 1200;
  const dlxRate = cfg.rates?.deluxe   || cfg.deluxeRate   || 2000;
  const suitRate = cfg.rates?.suite   || cfg.suiteRate    || 3800;
  return rooms.map(r => ({
    ...r,
    baseRate: r.type==="suite" ? suitRate : r.type==="deluxe" ? dlxRate : stdRate,
  }));
}

// FIX #5: updateRoomStatus — number aur floor bhi save karo Supabase mein
export function updateRoomStatus(hotelId, roomId, status, bookingId = null, guestName = "") {
  const hid   = hotelId || getActiveHotelId();
  const allRooms = getRooms(hid);
  const targetRoom = allRooms.find(r => r.id === roomId);
  const rooms = allRooms.map(r => r.id === roomId
    ? { ...r, status, currentBookingId: bookingId, guestName: guestName || r.guestName || "" }
    : r);
  lsW(K(hid, "rooms"), rooms);

  // Supabase sync — ab sahi kaam karega kyunki rooms table exist karti hai
  const sb = getSB();
  if (sb) {
    sb.from("rooms").upsert({
      id:                 roomId,
      hotel_id:           hid,
      number:             targetRoom?.number  || 0,
      floor:              targetRoom?.floor   || 1,
      type:               targetRoom?.type    || "standard",
      base_rate:          targetRoom?.baseRate || 1200,
      status,
      current_booking_id: bookingId,
      guest_name:         guestName || "",
      updated_at:         new Date().toISOString(),
    }).catch(e => console.warn("[DB] room status sync:", e.message));
  }
}

// FIX: New helper — rooms batch Supabase mein sync karo
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
// BOOKINGS — Supabase primary, localStorage fallback
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
export function getBookingsSync(hotelId) { return ls(K(hotelId || getActiveHotelId(), "bookings"), []); }
export function getTodayBookings(hotelId) {
  const today = new Date().toDateString();
  return getBookingsSync(hotelId).filter(b => new Date(b.createdAt).toDateString() === today);
}
export function getBookingById(hotelId, id) { return getBookingsSync(hotelId).find(b => b.id === id) || null; }

// FIX #6: createBooking — room_number bhi save karo, source track karo
export async function createBooking(hotelId, bookingData) {
  const hid    = hotelId || getActiveHotelId();
  const nights = Math.max(1, Number(bookingData.nights) || 1);
  const rate   = Number(bookingData.ratePerNight) || 0;
  const total  = Number(bookingData.totalAmount) || rate * nights;
  const now    = new Date().toISOString();
  const id     = uid();

  // Room number resolve karo roomId se (e.g. "hotel_R005" → 5)
  const allRooms   = getRooms(hid);
  const roomObj    = allRooms.find(r => r.id === bookingData.roomId);
  const roomNumber = roomObj?.number || parseInt((bookingData.roomId || "").replace(/\D/g, "")) || 0;

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
    source: bookingData.isPublicBooking ? "marketplace" : "direct",
  };

  // 1. localStorage — instant
  lsW(K(hid, "bookings"), [booking, ...getBookingsSync(hid)]);
  const roomStatus = bookingData.isPublicBooking ? "reserved" : "occupied";
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
      gender:          booking.gender,
      dob:             booking.dob,
      room_id:         booking.roomId,
      room_number:     booking.roomNumber,     // FIX: pehle nahi tha
      room_type:       booking.roomType,
      check_in_date:   booking.checkInDate,
      check_out_date:  booking.checkOutDate,
      nights:          booking.nights,
      rate_per_night:  booking.ratePerNight,
      total_amount:    booking.totalAmount,
      payment_mode:    booking.paymentMode,
      status:          "active",
      rate_locked:     true,
      source:          booking.source,         // FIX: pehle nahi tha
      created_at:      now,
    }).then(({ error }) => {
      if (error) console.warn("[DB] Booking Supabase sync failed:", error.message);
      else console.log("[DB] Booking synced to Supabase ✓", id);
    }).catch(e => console.warn("[DB] insert error:", e.message));
  }
  return booking;
}

// Checkout — localStorage instantly + Supabase background
export async function checkoutBooking(hotelId, bookingId) {
  const hid      = hotelId || getActiveHotelId();
  const bookings = getBookingsSync(hid);
  const booking  = bookings.find(b => b.id === bookingId);
  if (!booking) return null;
  const now     = new Date().toISOString();
  const updated = bookings.map(b => b.id === bookingId ? { ...b, status:"checked_out", checkoutAt:now } : b);
  lsW(K(hid, "bookings"), updated);
  if (booking.roomId) updateRoomStatus(hid, booking.roomId, "cleaning", null, "");
  const sb = getSB();
  if (sb) {
    sb.from("bookings").update({ status:"checked_out", updated_at:now })
      .eq("id", bookingId).then(({ error }) => {
        if (error) console.warn("[DB] Checkout sync failed:", error.message);
        else console.log("[DB] Checkout synced ✓", bookingId);
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
    rooms:        rooms,
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
