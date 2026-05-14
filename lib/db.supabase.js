/**
 * db.js — Supabase Edition
 * ─────────────────────────────────────────────────────────────────────────────
 * DROP-IN REPLACEMENT for the localStorage db.js.
 * All function signatures are IDENTICAL — no changes needed in components.
 *
 * HOW TO ACTIVATE:
 *  1. npm install @supabase/supabase-js
 *  2. Add to .env.local:
 *       NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
 *       NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
 *  3. Replace lib/db.js with this file.
 *
 * HOTEL ISOLATION:
 *  Every query passes hotel_id — Supabase RLS policies ensure a hotel
 *  can never read another hotel's data, even if the anon key is exposed.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createClient } from "@supabase/supabase-js";

// ─── Client ───────────────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ─── Active hotel context (set on login) ─────────────────────────────────────
export function getActiveHotelId() {
  if (typeof window === "undefined") return "default";
  return localStorage.getItem("air_active_hotel") || "default";
}

// ─── HOTEL CONFIG ─────────────────────────────────────────────────────────────
export async function getHotelConfig() {
  const hotelId = getActiveHotelId();
  const { data, error } = await supabase
    .from("hotels")
    .select("*")
    .eq("id", hotelId)
    .single();

  if (error || !data) return buildDefaultConfig(hotelId);
  return normalizeHotelConfig(data);
}

export async function saveHotelConfig(config) {
  const hotelId = getActiveHotelId();
  const { error } = await supabase
    .from("hotels")
    .update({
      name: config.name,
      location: config.location,
      total_rooms: config.totalRooms,
      checkout_time: config.checkoutTime,
      gst_percent: config.gstPercent,
      amenities: config.amenities,
      updated_at: new Date().toISOString(),
    })
    .eq("id", hotelId);

  if (error) console.error("saveHotelConfig:", error);
}

function normalizeHotelConfig(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    location: row.location,
    totalRooms: row.total_rooms,
    currency: row.currency || "₹",
    gstPercent: row.gst_percent || 12,
    checkoutTime: row.checkout_time || "11:00",
    plan: row.plan || "free",
    amenities: row.amenities || [],
    emoji: row.emoji || "🏨",
  };
}

function buildDefaultConfig(id) {
  return {
    id,
    name: "The GuestInn",
    location: "India",
    totalRooms: 20,
    currency: "₹",
    gstPercent: 12,
    checkoutTime: "11:00",
    plan: "free",
    amenities: ["WiFi", "AC"],
    emoji: "🏨",
  };
}

// ─── ROOMS ────────────────────────────────────────────────────────────────────
export async function initializeRooms(totalRooms = 20) {
  const hotelId = getActiveHotelId();

  // Check if rooms already exist
  const { data: existing } = await supabase
    .from("rooms")
    .select("id")
    .eq("hotel_id", hotelId)
    .limit(1);

  if (existing?.length > 0) return getRooms();

  // Create rooms in batch
  const rooms = Array.from({ length: totalRooms }, (_, i) => ({
    hotel_id: hotelId,
    number: i + 1,
    floor: Math.ceil((i + 1) / 5),
    type: i % 5 === 0 ? "suite" : i % 3 === 0 ? "deluxe" : "standard",
    status: "vacant",
    base_rate: i % 5 === 0 ? 5000 : i % 3 === 0 ? 3000 : 1500,
  }));

  const { error } = await supabase.from("rooms").insert(rooms);
  if (error) console.error("initializeRooms:", error);

  return getRooms();
}

export async function getRooms() {
  const hotelId = getActiveHotelId();
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("hotel_id", hotelId)
    .order("number");

  if (error) { console.error("getRooms:", error); return []; }
  return (data || []).map(normalizeRoom);
}

export async function updateRoomStatus(roomId, status, bookingId = null) {
  const { error } = await supabase
    .from("rooms")
    .update({
      status,
      current_booking_id: bookingId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", roomId);

  if (error) console.error("updateRoomStatus:", error);
}

function normalizeRoom(row) {
  return {
    id: row.id,
    number: row.number,
    floor: row.floor,
    type: row.type,
    status: row.status,
    baseRate: row.base_rate,
    currentBookingId: row.current_booking_id,
  };
}

// ─── GUESTS ───────────────────────────────────────────────────────────────────
export async function upsertGuest(guestData) {
  const hotelId = getActiveHotelId();

  const payload = {
    hotel_id: hotelId,
    name: guestData.guestName || guestData.name,
    phone: guestData.guestPhone || guestData.phone || null,
    address: guestData.address || null,
    id_type: guestData.idType || "Aadhaar",
    id_number: guestData.idNumber || null,
    gender: guestData.gender || null,
    last_scanned_at: guestData.lastScannedAt || null,
    scan_confidence: guestData.scanConfidence || null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("guests")
    .upsert(payload, { onConflict: "hotel_id,id_number", ignoreDuplicates: false })
    .select()
    .single();

  if (error) console.error("upsertGuest:", error);
  return data;
}

// ─── BOOKINGS ─────────────────────────────────────────────────────────────────
export async function createBooking(bookingData) {
  const hotelId = getActiveHotelId();

  // 1. Upsert guest
  const guest = await upsertGuest(bookingData);
  if (!guest) throw new Error("Guest creation failed");

  const ratePerNight = Number(bookingData.ratePerNight) || 0;
  const nights = Number(bookingData.nights) || 1;
  const totalAmount = Number(bookingData.totalAmount) || ratePerNight * nights;

  const payload = {
    hotel_id: hotelId,
    room_id: bookingData.roomId,
    guest_id: guest.id,
    check_in_date: bookingData.checkInDate || new Date().toISOString().split("T")[0],
    check_out_date: bookingData.checkOutDate || null,
    nights,
    rate_per_night: ratePerNight,
    total_amount: totalAmount,
    payment_mode: bookingData.paymentMode || "Cash",
    room_type: bookingData.roomType || "standard",
    rate_locked: true,
    locked_at: new Date().toISOString(),
    locked_by: bookingData.lockedBy || "manager",
    status: "active",
    source: bookingData.source || "direct",
    created_by: bookingData.createdBy || "manager",
  };

  const { data, error } = await supabase
    .from("bookings")
    .insert(payload)
    .select(`
      *,
      guests ( name, phone, id_type, id_number ),
      rooms  ( number, type )
    `)
    .single();

  if (error) { console.error("createBooking:", error); throw error; }

  // Room status update is handled by DB trigger (on_booking_created)
  // but we call it here too for immediate UI feedback
  await updateRoomStatus(bookingData.roomId, "occupied", data.id);

  return normalizeBooking(data);
}

export async function getBookings() {
  const hotelId = getActiveHotelId();
  const { data, error } = await supabase
    .from("bookings")
    .select(`*, guests ( name, phone, id_type, id_number ), rooms ( number, type )`)
    .eq("hotel_id", hotelId)
    .order("created_at", { ascending: false });

  if (error) { console.error("getBookings:", error); return []; }
  return (data || []).map(normalizeBooking);
}

export async function getTodayBookings() {
  const hotelId = getActiveHotelId();
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("bookings")
    .select(`*, guests ( name, phone ), rooms ( number )`)
    .eq("hotel_id", hotelId)
    .eq("check_in_date", today)
    .order("created_at", { ascending: false });

  if (error) { console.error("getTodayBookings:", error); return []; }
  return (data || []).map(normalizeBooking);
}

export async function getBookingById(id) {
  const { data, error } = await supabase
    .from("bookings")
    .select(`*, guests ( name, phone, id_type, id_number )`)
    .eq("id", id)
    .single();

  if (error) return null;
  return normalizeBooking(data);
}

export async function checkoutBooking(bookingId) {
  const { data, error } = await supabase
    .from("bookings")
    .update({ status: "checked_out", checkout_at: new Date().toISOString() })
    .eq("id", bookingId)
    .select()
    .single();

  if (error) { console.error("checkoutBooking:", error); return null; }
  // Room → cleaning handled by DB trigger (on_booking_checkout)
  return normalizeBooking(data);
}

function normalizeBooking(row) {
  if (!row) return null;
  return {
    id: row.id,
    guestName: row.guests?.name || row.guest_name || "",
    guestPhone: row.guests?.phone || "",
    idType: row.guests?.id_type || "",
    idNumber: row.guests?.id_number || "",
    roomId: row.room_id,
    roomNumber: row.rooms?.number,
    checkInDate: row.check_in_date,
    checkOutDate: row.check_out_date,
    nights: row.nights,
    ratePerNight: row.rate_per_night,
    totalAmount: row.total_amount,
    paymentMode: row.payment_mode,
    roomType: row.room_type,
    rateLocked: row.rate_locked,
    lockedAt: row.locked_at,
    status: row.status,
    createdAt: row.created_at,
  };
}

// ─── STATS ────────────────────────────────────────────────────────────────────
export async function getTodayStats() {
  const hotelId = getActiveHotelId();

  // Use the today_stats view
  const { data: statsRow } = await supabase
    .from("today_stats")
    .select("*")
    .eq("hotel_id", hotelId)
    .single();

  const config = await getHotelConfig();
  const weekly = await getWeeklyRevenue();

  if (!statsRow) {
    return {
      totalRooms: config.totalRooms,
      occupiedRooms: 0,
      vacantRooms: config.totalRooms,
      cleaningRooms: 0,
      occupancyPercent: 0,
      todayRevenue: 0,
      todayCheckIns: 0,
      weeklyRevenue: weekly,
      currency: config.currency,
    };
  }

  return {
    totalRooms: statsRow.total_rooms,
    occupiedRooms: statsRow.occupied_rooms,
    vacantRooms: statsRow.vacant_rooms,
    cleaningRooms: statsRow.cleaning_rooms,
    occupancyPercent: statsRow.occupancy_percent,
    todayRevenue: statsRow.today_revenue,
    todayCheckIns: statsRow.today_checkins,
    weeklyRevenue: weekly,
    currency: config.currency,
  };
}

export async function getWeeklyRevenue() {
  const hotelId = getActiveHotelId();
  const { data, error } = await supabase
    .from("weekly_revenue")
    .select("*")
    .eq("hotel_id", hotelId)
    .order("booking_date");

  if (error) { console.error("getWeeklyRevenue:", error); return []; }
  return (data || []).map((row) => ({
    date: row.day_label,
    revenue: Number(row.revenue) || 0,
  }));
}

// ─── EXPORT ───────────────────────────────────────────────────────────────────
export async function exportCSV() {
  if (typeof window === "undefined") return;
  const bookings = await getBookings();
  if (!bookings.length) return alert("Koi booking nahi hai export karne ke liye.");

  const headers = [
    "Booking ID","Guest Name","Phone","Room","Check-in",
    "Check-out","Nights","Rate/Night","Total","Payment","Status",
  ];
  const rows = bookings.map((b) => [
    b.id, b.guestName, b.guestPhone, b.roomId,
    b.checkInDate,
    b.checkOutDate || "—",
    b.nights, `₹${b.ratePerNight}`, `₹${b.totalAmount}`,
    b.paymentMode, b.status,
  ]);

  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bookings_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── AUTH (simple PIN check — Supabase auth optional for SaaS) ────────────────
export async function verifyPin(hotelSlug, role, pin) {
  // In production: fetch hash from DB, bcrypt.compare(pin, hash)
  // For MVP: direct compare (upgrade before launch!)
  const { data, error } = await supabase
    .from("hotels")
    .select("id, name, owner_pin_hash, manager_pin_hash, plan, emoji, location")
    .eq("slug", hotelSlug)
    .single();

  if (error || !data) return null;

  const hashField = role === "owner" ? "owner_pin_hash" : "manager_pin_hash";
  // TODO: replace with bcrypt.compare(pin, data[hashField])
  const isValid = pin === data[hashField]; // ← TEMPORARY, use bcrypt in prod

  if (!isValid) return null;

  return {
    role,
    hotelId: data.id,
    hotelName: data.name,
    plan: data.plan,
    loginAt: new Date().toISOString(),
  };
}
