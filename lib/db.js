 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/lib/db.js b/lib/db.js
index 16ba688fa0ff36b7501aada475812417a439378f..a2d97393213f92bc359995412f723c6d9f0c07ef 100644
--- a/lib/db.js
+++ b/lib/db.js
@@ -137,59 +137,105 @@ export function getHotelConfig(hotelId) {
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
     id:`${hid}_R${String(i+1).padStart(3,"0")}`, number:i+1,
     floor:Math.ceil((i+1)/Math.max(1,Math.ceil(totalRooms/5))),
     type:i%10===0?"suite":i%3===0?"deluxe":"standard",
     status:"vacant", currentBookingId:null,
     baseRate:i%10===0?4500:i%3===0?2500:1500,
   }));
   lsW(K(hid, "rooms"), rooms);
   return rooms;
 }
 export function getRooms(hotelId) {
   const hid = hotelId || getActiveHotelId();
   const rooms = ls(K(hid, "rooms"), []);
-  if (rooms.length === 0) return initializeRooms(hid, getHotelConfig(hid).totalRooms || 20);
+  if (rooms.length === 0) {
+    const seeded = initializeRooms(hid, getHotelConfig(hid).totalRooms || 20);
+    return reconcileRoomsFromBookings(hid) || seeded;
+  }
   return rooms;
 }
 export function updateRoomStatus(hotelId, roomId, status, bookingId = null) {
   const hid   = hotelId || getActiveHotelId();
   const rooms = getRooms(hid).map(r => r.id === roomId ? { ...r, status, currentBookingId: bookingId } : r);
   lsW(K(hid, "rooms"), rooms);
 }
 
+
+
+export function reconcileRoomsFromBookings(hotelId) {
+  const hid = hotelId || getActiveHotelId();
+  const rooms = getRooms(hid);
+  const bookings = getBookingsSync(hid);
+  const activeByRoom = new Map();
+  for (const b of bookings) {
+    if (!b.roomId) continue;
+    if (b.status === "pending" || b.status === "active") {
+      activeByRoom.set(b.roomId, b.id);
+    }
+  }
+  const next = rooms.map((r) => {
+    const bookingId = activeByRoom.get(r.id);
+    if (bookingId) return { ...r, status: "occupied", currentBookingId: bookingId };
+    if (r.status === "out_of_order" || r.status === "cleaning") return r;
+    return { ...r, status: "vacant", currentBookingId: null };
+  });
+  lsW(K(hid, "rooms"), next);
+  return next;
+}
+
+export function setBookingStatus(hotelId, bookingId, status) {
+  const hid = hotelId || getActiveHotelId();
+  const now = new Date().toISOString();
+  const allowed = ["pending", "active", "checked_out", "cancelled"];
+  const nextStatus = allowed.includes(status) ? status : "active";
+  const bookings = getBookingsSync(hid);
+  const booking = bookings.find((b) => b.id === bookingId);
+  if (!booking) return null;
+  const updated = bookings.map((b) => (b.id === bookingId ? { ...b, status: nextStatus, updatedAt: now } : b));
+  lsW(K(hid, "bookings"), updated);
+  reconcileRoomsFromBookings(hid);
+
+  const sb = getSB();
+  if (sb) {
+    sb.from("bookings").update({ status: nextStatus, updated_at: now }).eq("id", bookingId)
+      .then(({ error }) => { if (error) console.warn("[DB] Status sync failed:", error.message); })
+      .catch(() => {});
+  }
+  return updated.find((b) => b.id === bookingId) || null;
+}
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
     roomType:r.room_type||"standard",
     checkInDate:r.check_in_date||"",   checkOutDate:r.check_out_date||"",
     nights:r.nights||1,           ratePerNight:r.rate_per_night||0,
     totalAmount:r.total_amount||0, paymentMode:r.payment_mode||"Cash",
     status:r.status||"active",    rateLocked:r.rate_locked??true,
     createdAt:r.created_at||new Date().toISOString(),
   };
 }
 
 // Async — fetches from Supabase, caches locally
 export async function getBookings(hotelId) {
   const hid = hotelId || getActiveHotelId();
   const sb  = getSB();
   if (sb) {
     try {
@@ -211,70 +257,70 @@ export function getTodayBookings(hotelId) {
   const today = new Date().toDateString();
   return getBookingsSync(hotelId).filter(b => new Date(b.createdAt).toDateString() === today);
 }
 export function getBookingById(hotelId, id) { return getBookingsSync(hotelId).find(b => b.id === id) || null; }
 
 // Create booking — localStorage instantly + Supabase in background
 export async function createBooking(hotelId, bookingData) {
   const hid    = hotelId || getActiveHotelId();
   const nights = Math.max(1, Number(bookingData.nights) || 1);
   const rate   = Number(bookingData.ratePerNight) || 0;
   const total  = Number(bookingData.totalAmount) || rate * nights;
   const now    = new Date().toISOString();
   const id     = uid();
 
   const booking = {
     id, hotelId:hid,
     guestName:bookingData.guestName||"",     guestPhone:bookingData.guestPhone||"",
     address:bookingData.address||"",          idType:bookingData.idType||"Aadhaar",
     idNumber:bookingData.idNumber||"",        gender:bookingData.gender||"",
     dob:bookingData.dob||"",                  roomId:bookingData.roomId||"",
     roomType:bookingData.roomType||"standard",
     checkInDate:bookingData.checkInDate||now.split("T")[0],
     checkOutDate:bookingData.checkOutDate||"",
     nights, ratePerNight:rate, totalAmount:total,
     paymentMode:bookingData.paymentMode||"Cash",
-    status:"active", rateLocked:true, lockedAt:now, createdAt:now,
+    status:"pending", rateLocked:true, lockedAt:now, createdAt:now,
   };
 
   // 1. localStorage — instant
   lsW(K(hid, "bookings"), [booking, ...getBookingsSync(hid)]);
   updateRoomStatus(hid, booking.roomId, "occupied", booking.id);
 
   // 2. Supabase — background sync
   const sb = getSB();
   if (sb) {
     sb.from("bookings").insert({
       id, hotel_id:hid,
       guest_name:booking.guestName,    guest_phone:booking.guestPhone,
       address:booking.address,          id_type:booking.idType,
       id_number:booking.idNumber,       gender:booking.gender,
       dob:booking.dob,                  room_id:booking.roomId,
       room_type:booking.roomType,       check_in_date:booking.checkInDate,
       check_out_date:booking.checkOutDate, nights:booking.nights,
       rate_per_night:booking.ratePerNight, total_amount:booking.totalAmount,
-      payment_mode:booking.paymentMode, status:"active",
+      payment_mode:booking.paymentMode, status:"pending",
       rate_locked:true,                 created_at:now,
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
   if (booking.roomId) updateRoomStatus(hid, booking.roomId, "cleaning", null);
   const sb = getSB();
   if (sb) {
     sb.from("bookings").update({ status:"checked_out", updated_at:now })
       .eq("id", bookingId).then(({ error }) => {
         if (error) console.warn("[DB] Checkout sync failed:", error.message);
       }).catch(() => {});
 
EOF
)