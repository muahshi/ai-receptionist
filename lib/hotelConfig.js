/**
 * SaaS Hotel Config System
 * Each hotel has an isolated config stored under its own hotelId key
 * Migration path: replace localStorage with Supabase hotels table
 */

const DEFAULT_RATES = { standard: 1500, deluxe: 2500, suite: 4500 };

export function getHotelConfig(hotelId = "default") {
  if (typeof window === "undefined") return buildDefault(hotelId);
  try {
    const raw = localStorage.getItem(`air_hotel_${hotelId}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return buildDefault(hotelId);
}

export function saveHotelConfig(hotelId = "default", config) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`air_hotel_${hotelId}`, JSON.stringify(config));
  // Keep registry of all registered hotels
  const registry = getHotelRegistry();
  if (!registry.find((h) => h.id === hotelId)) {
    registry.push({ id: hotelId, name: config.name, createdAt: new Date().toISOString() });
    localStorage.setItem("air_hotel_registry", JSON.stringify(registry));
  }
}

export function getHotelRegistry() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("air_hotel_registry") || "[]");
  } catch { return []; }
}

export function registerHotel(config) {
  const hotelId = config.id || slugify(config.name);
  const fullConfig = { ...buildDefault(hotelId), ...config, id: hotelId };
  saveHotelConfig(hotelId, fullConfig);
  return fullConfig;
}

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").slice(0, 20) + "-" + Date.now().toString(36);
}

function buildDefault(hotelId) {
  return {
    id: hotelId,
    name: process.env.NEXT_PUBLIC_HOTEL_NAME || "The GuestInn",
    location: "India",
    totalRooms: parseInt(process.env.NEXT_PUBLIC_HOTEL_TOTAL_ROOMS || "20"),
    ownerPhone: process.env.NEXT_PUBLIC_OWNER_PHONE || "",
    managerPhone: process.env.NEXT_PUBLIC_MANAGER_PHONE || "",
    currency: "₹",
    gstPercent: 12,
    checkoutTime: "11:00",
    rates: DEFAULT_RATES,
    amenities: ["WiFi", "AC", "Parking", "Restaurant"],
    photos: [],
    // SaaS fields
    plan: "free", // free | pro | enterprise
    ownerPin: process.env.NEXT_PUBLIC_OWNER_PIN || "1234",
    managerPin: process.env.NEXT_PUBLIC_MANAGER_PIN || "5678",
  };
}
