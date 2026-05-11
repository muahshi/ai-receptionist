/**
 * Data Layer - MVP uses LocalStorage
 * Architecture is designed for easy migration to Supabase
 * 
 * To migrate: Replace each function body with a Supabase query.
 * The function signatures remain the same.
 */

// ─── KEYS ────────────────────────────────────────────────────────────────────
const KEYS = {
  BOOKINGS: "air_bookings",
  ROOMS: "air_rooms",
  HOTEL_CONFIG: "air_hotel_config",
  LEADS: "air_leads",
  CURRENT_USER: "air_current_user",
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const generateId = () =>
  `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const getStore = (key) => {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
};

const setStore = (key, data) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
};

// ─── HOTEL CONFIG ─────────────────────────────────────────────────────────────
export const getHotelConfig = () => {
  if (typeof window === "undefined") return defaultConfig();
  try {
    const stored = localStorage.getItem(KEYS.HOTEL_CONFIG);
    if (stored) return JSON.parse(stored);
  } catch {}
  return defaultConfig();
};

const defaultConfig = () => ({
  name: process.env.NEXT_PUBLIC_HOTEL_NAME || "Grand Palace Hotel",
  totalRooms: parseInt(process.env.NEXT_PUBLIC_HOTEL_TOTAL_ROOMS || "20"),
  ownerPhone: process.env.NEXT_PUBLIC_OWNER_PHONE || "",
  managerPhone: process.env.NEXT_PUBLIC_MANAGER_PHONE || "",
  currency: "₹",
  gstPercent: 12,
  checkoutTime: "11:00",
});

export const saveHotelConfig = (config) => {
  localStorage.setItem(KEYS.HOTEL_CONFIG, JSON.stringify(config));
};

// ─── ROOMS ───────────────────────────────────────────────────────────────────
export const initializeRooms = (totalRooms = 20) => {
  const existing = getStore(KEYS.ROOMS);
  if (existing.length > 0) return existing;

  const rooms = Array.from({ length: totalRooms }, (_, i) => ({
    id: `R${String(i + 1).padStart(3, "0")}`,
    number: i + 1,
    floor: Math.ceil((i + 1) / 5),
    type: i % 5 === 0 ? "suite" : i % 3 === 0 ? "deluxe" : "standard",
    status: "vacant", // vacant | occupied | cleaning | maintenance
    currentBookingId: null,
    baseRate: i % 5 === 0 ? 5000 : i % 3 === 0 ? 3000 : 1500,
  }));

  setStore(KEYS.ROOMS, rooms);
  return rooms;
};

export const getRooms = () => {
  const rooms = getStore(KEYS.ROOMS);
  if (rooms.length === 0) return initializeRooms();
  return rooms;
};

export const updateRoomStatus = (roomId, status, bookingId = null) => {
  const rooms = getRooms();
  const updated = rooms.map((r) =>
    r.id === roomId
      ? { ...r, status, currentBookingId: bookingId }
      : r
  );
  setStore(KEYS.ROOMS, updated);
  return updated;
};

// ─── BOOKINGS ─────────────────────────────────────────────────────────────────
export const createBooking = (bookingData) => {
  const bookings = getStore(KEYS.BOOKINGS);
  const booking = {
    id: generateId(),
    ...bookingData,
    createdAt: new Date().toISOString(),
    // ANTI-THEFT: Once created, rate cannot be changed
    rateLocked: true,
    lockedAt: new Date().toISOString(),
  };
  bookings.push(booking);
  setStore(KEYS.BOOKINGS, bookings);

  // Update room status
  if (bookingData.roomId) {
    updateRoomStatus(bookingData.roomId, "occupied", booking.id);
  }

  return booking;
};

export const getBookings = () => getStore(KEYS.BOOKINGS);

export const getTodayBookings = () => {
  const today = new Date().toDateString();
  return getStore(KEYS.BOOKINGS).filter(
    (b) => new Date(b.createdAt).toDateString() === today
  );
};

export const getBookingById = (id) =>
  getStore(KEYS.BOOKINGS).find((b) => b.id === id);

export const checkoutBooking = (bookingId) => {
  const bookings = getStore(KEYS.BOOKINGS);
  const booking = bookings.find((b) => b.id === bookingId);
  if (!booking) return null;

  const updated = bookings.map((b) =>
    b.id === bookingId
      ? { ...b, status: "checked_out", checkoutAt: new Date().toISOString() }
      : b
  );
  setStore(KEYS.BOOKINGS, updated);

  if (booking.roomId) {
    updateRoomStatus(booking.roomId, "cleaning", null);
  }

  return updated.find((b) => b.id === bookingId);
};

// ─── STATS ────────────────────────────────────────────────────────────────────
export const getTodayStats = () => {
  const todayBookings = getTodayBookings();
  const rooms = getRooms();
  const config = getHotelConfig();

  const occupiedRooms = rooms.filter((r) => r.status === "occupied").length;
  const vacantRooms = rooms.filter((r) => r.status === "vacant").length;
  const cleaningRooms = rooms.filter((r) => r.status === "cleaning").length;

  const todayRevenue = todayBookings
    .filter((b) => b.status !== "cancelled")
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  const weeklyRevenue = getWeeklyRevenue();

  return {
    totalRooms: config.totalRooms,
    occupiedRooms,
    vacantRooms,
    cleaningRooms,
    occupancyPercent: Math.round((occupiedRooms / config.totalRooms) * 100),
    todayRevenue,
    todayCheckIns: todayBookings.length,
    weeklyRevenue,
    currency: config.currency,
  };
};

export const getWeeklyRevenue = () => {
  const bookings = getStore(KEYS.BOOKINGS);
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toDateString();
    const dayRevenue = bookings
      .filter(
        (b) =>
          new Date(b.createdAt).toDateString() === dateStr &&
          b.status !== "cancelled"
      )
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    days.push({
      date: d.toLocaleDateString("en-IN", { weekday: "short" }),
      revenue: dayRevenue,
    });
  }
  return days;
};

// ─── LEADS ────────────────────────────────────────────────────────────────────
export const addLead = (leadData) => {
  const leads = getStore(KEYS.LEADS);
  const lead = {
    id: generateId(),
    ...leadData,
    createdAt: new Date().toISOString(),
  };
  leads.push(lead);
  setStore(KEYS.LEADS, leads);
  return lead;
};

export const getTodayLeads = () => {
  const today = new Date().toDateString();
  return getStore(KEYS.LEADS).filter(
    (l) => new Date(l.createdAt).toDateString() === today
  );
};

// ─── AUTH ─────────────────────────────────────────────────────────────────────
export const login = (role, pin) => {
  const validPin =
    role === "owner"
      ? process.env.NEXT_PUBLIC_OWNER_PIN || "1234"
      : process.env.NEXT_PUBLIC_MANAGER_PIN || "5678";

  if (pin === validPin) {
    const user = { role, loginAt: new Date().toISOString() };
    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
    return user;
  }
  return null;
};

export const getCurrentUser = () => {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem(KEYS.CURRENT_USER) || "null");
  } catch {
    return null;
  }
};

export const logout = () => {
  localStorage.removeItem(KEYS.CURRENT_USER);
};

// ─── EXPORT DATA ──────────────────────────────────────────────────────────────
export const exportAllData = () => {
  const data = {
    bookings: getStore(KEYS.BOOKINGS),
    rooms: getStore(KEYS.ROOMS),
    leads: getStore(KEYS.LEADS),
    config: getHotelConfig(),
    exportedAt: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `hotel_data_${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportCSV = () => {
  const bookings = getStore(KEYS.BOOKINGS);
  if (!bookings.length) return;

  const headers = [
    "Booking ID",
    "Guest Name",
    "Phone",
    "Room",
    "Check-in",
    "Check-out",
    "Nights",
    "Rate/Night",
    "Total",
    "Payment Mode",
    "Status",
  ];

  const rows = bookings.map((b) => [
    b.id,
    b.guestName,
    b.guestPhone,
    b.roomId,
    new Date(b.checkInDate).toLocaleDateString("en-IN"),
    b.checkOutDate
      ? new Date(b.checkOutDate).toLocaleDateString("en-IN")
      : "—",
    b.nights,
    `₹${b.ratePerNight}`,
    `₹${b.totalAmount}`,
    b.paymentMode,
    b.status,
  ]);

  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bookings_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
