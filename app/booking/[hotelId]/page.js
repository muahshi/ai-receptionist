"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import {
  Send, MessageCircle, X, MapPin, Star, ShieldCheck,
  Navigation, Camera, RefreshCw, CheckCircle, Zap,
  UtensilsCrossed, Sparkles, Phone, ChevronDown, ChevronUp,
  Wifi, Wind, Utensils, Tv, ParkingSquare, Droplets,
  Clock, CreditCard, Lock, ChevronRight, Crown,
} from "lucide-react";

/* ═══════════════════════════════════════════
   HOTEL FETCH — now includes Phase 1 config fields
═══════════════════════════════════════════ */
async function fetchHotel(hotelId) {
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (sbUrl && sbKey && sbUrl !== "undefined") {
    try {
      const res = await fetch(
        `${sbUrl}/rest/v1/hotels?id=eq.${encodeURIComponent(hotelId)}&select=*`,
        { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data?.length > 0) {
          const h = data[0];
          return {
            id:                  h.id,
            name:                h.name,
            location:            h.location       || "",
            addressLine:         h.address_line   || "",
            distanceTag:         h.distance_tag   || "",
            totalRooms:          h.total_rooms     || 20,
            ownerPhone:          h.owner_phone     || "",
            managerPhone:        h.manager_phone   || "",
            ownerEmail:          h.owner_email     || "",
            emoji:               h.emoji           || "🏨",
            standardRate:        h.standard_rate   || 1200,
            deluxeRate:          h.deluxe_rate     || 2000,
            suiteRate:           h.suite_rate      || 3800,
            minFloorPrice:       h.min_floor_price || 800,
            amenities:           h.amenities       || [],
            avgRating:           h.avg_rating      || 4.0,
            totalReviews:        h.total_reviews   || 0,
            wifiPassword:        h.wifi_password        || "",
            menuUrl:             h.menu_url             || "",
            menuText:            h.menu_text            || "",
            receptionPhone:      h.reception_phone      || h.owner_phone || "",
            enableWifi:          h.enable_wifi          ?? true,
            enableFoodOrdering:  h.enable_food_ordering ?? true,
            enableHousekeeping:  h.enable_housekeeping  ?? true,
          };
        }
      }
    } catch {}
  }
  try {
    const cfg = JSON.parse(localStorage.getItem(`air_${hotelId}_config`) || "{}");
    if (cfg.name) return {
      id:                  hotelId,
      name:                cfg.name,
      location:            cfg.location        || "",
      addressLine:         "",
      distanceTag:         "",
      totalRooms:          cfg.totalRooms       || 20,
      ownerPhone:          cfg.ownerPhone       || "",
      managerPhone:        cfg.managerPhone     || "",
      emoji:               cfg.emoji            || "🏨",
      standardRate:        cfg.standardRate     || 1200,
      deluxeRate:          cfg.deluxeRate       || 2000,
      suiteRate:           cfg.suiteRate        || 3800,
      minFloorPrice:       cfg.minFloorPrice    || 800,
      amenities:           [],
      avgRating:           4.0,
      totalReviews:        0,
      wifiPassword:        cfg.wifiPassword        || "",
      menuUrl:             cfg.menuUrl             || "",
      menuText:            cfg.menuText            || "",
      receptionPhone:      cfg.receptionPhone      || cfg.ownerPhone || "",
      enableWifi:          cfg.enableWifi          ?? true,
      enableFoodOrdering:  cfg.enableFoodOrdering  ?? true,
      enableHousekeeping:  cfg.enableHousekeeping  ?? true,
    };
  } catch {}
  const DEMOS = [
    { id: "cherry-bhopal",   name: "Hotel Cherry",           location: "Peer Gate, Bhopal, MP",  totalRooms: 20, ownerPhone: "919009109108", emoji: "🍒", standardRate: 1200, deluxeRate: 2000, suiteRate: 3800, minFloorPrice: 900,  addressLine: "Peer Gate Area, Bhopal - 462001",        distanceTag: "900m from Bus Stand",    amenities: ["Free Wi-Fi","AC Rooms","Geyser"], avgRating: 4.5, totalReviews: 128, wifiPassword: "cherry@2024", menuText: "Dal Fry ₹120 | Paneer Butter Masala ₹180 | Roti ₹15 | Rice ₹60 | Tea ₹20 | Coffee ₹30", menuUrl: "", receptionPhone: "919009109108", enableWifi: true, enableFoodOrdering: true, enableHousekeeping: true },
    { id: "hotel-cherry",         name: "Hotel Cherry",           location: "Peer Gate, Bhopal, MP",  totalRooms: 20, ownerPhone: "919009109108", emoji: "🍒", standardRate: 1200, deluxeRate: 2000, suiteRate: 3800, minFloorPrice: 900,  addressLine: "Peer Gate Area, Bhopal - 462001",        distanceTag: "900m from Bus Stand",    amenities: ["Free Wi-Fi","AC Rooms","Geyser"], avgRating: 4.5, totalReviews: 128, wifiPassword: "cherry@2024", menuText: "Dal Fry ₹120 | Paneer Butter Masala ₹180 | Roti ₹15 | Rice ₹60 | Tea ₹20 | Coffee ₹30", menuUrl: "", receptionPhone: "919009109108", enableWifi: true, enableFoodOrdering: true, enableHousekeeping: true },
    { id: "hotel-cherry-bhopal",  name: "Hotel Cherry",           location: "Peer Gate, Bhopal, MP",  totalRooms: 20, ownerPhone: "919009109108", emoji: "🍒", standardRate: 1200, deluxeRate: 2000, suiteRate: 3800, minFloorPrice: 900,  addressLine: "Peer Gate Area, Bhopal - 462001",        distanceTag: "900m from Bus Stand",    amenities: ["Free Wi-Fi","AC Rooms","Geyser"], avgRating: 4.5, totalReviews: 128, wifiPassword: "cherry@2024", menuText: "Dal Fry ₹120 | Paneer Butter Masala ₹180 | Roti ₹15 | Rice ₹60 | Tea ₹20 | Coffee ₹30", menuUrl: "", receptionPhone: "919009109108", enableWifi: true, enableFoodOrdering: true, enableHousekeeping: true },
    { id: "sunrise-jaipur",  name: "Hotel Sunrise Palace",   location: "Jaipur, Rajasthan",       totalRooms: 40, ownerPhone: "919876543210", emoji: "🌅", standardRate: 1500, deluxeRate: 2500, suiteRate: 5000, minFloorPrice: 1100, addressLine: "Civil Lines, Jaipur - 302006",           distanceTag: "2.1 km from City Center", amenities: ["Free Wi-Fi","Pool Access","AC Rooms"], avgRating: 4.7, totalReviews: 312, wifiPassword: "sunrise#jaipur", menuText: "Dal Baati ₹150 | Laal Maas ₹250 | Bajra Roti ₹20 | Lassi ₹50", menuUrl: "", receptionPhone: "919876543210", enableWifi: true, enableFoodOrdering: true, enableHousekeeping: true },
    { id: "midtown-indore",  name: "Hotel Midtown",          location: "Indore, Madhya Pradesh",  totalRooms: 35, ownerPhone: "919977665544", emoji: "🏙️", standardRate: 1100, deluxeRate: 1800, suiteRate: 3500, minFloorPrice: 850,  addressLine: "MG Road, Indore - 452001",              distanceTag: "900m from Bus Stand",    amenities: ["Free Wi-Fi","Early Check-in","AC Rooms"], avgRating: 4.5, totalReviews: 89, wifiPassword: "midtown@456", menuText: "Poha ₹60 | Kachori ₹50 | Biryani ₹180 | Chai ₹15", menuUrl: "", receptionPhone: "919977665544", enableWifi: true, enableFoodOrdering: true, enableHousekeeping: true },
    { id: "comforts-nagpur", name: "City Comforts Nagpur",   location: "Nagpur, Maharashtra",     totalRooms: 30, ownerPhone: "919988776655", emoji: "🏨", standardRate: 1000, deluxeRate: 1600, suiteRate: 3200, minFloorPrice: 800,  addressLine: "Sitabuldi, Nagpur - 440012",            distanceTag: "1.5 km from Bus Stand",  amenities: ["Free Wi-Fi","Parking","AC Rooms"], avgRating: 4.4, totalReviews: 56, wifiPassword: "comforts2024", menuText: "Sabudana Khichdi ₹80 | Vada Pav ₹30 | Thali ₹120", menuUrl: "", receptionPhone: "919988776655", enableWifi: true, enableFoodOrdering: true, enableHousekeeping: true },
    { id: "grand-mumbai",    name: "The Grand Inn Mumbai",   location: "Mumbai, Maharashtra",     totalRooms: 120, ownerPhone: "919900001111", emoji: "🏩", standardRate: 2500, deluxeRate: 4500, suiteRate: 9000, minFloorPrice: 2000, addressLine: "Andheri West, Mumbai - 400053",         distanceTag: "1.8 km from Metro Station", amenities: ["Free Wi-Fi","Restaurant","Gym","AC Rooms"], avgRating: 4.8, totalReviews: 920, wifiPassword: "GrandMumbai#9", menuUrl: "https://example.com/menu", menuText: "", receptionPhone: "919900001111", enableWifi: true, enableFoodOrdering: true, enableHousekeeping: true },
    { id: "amardeep-palace", name: "Hotel Amardeep Palace",  location: "Bhopal, Madhya Pradesh",  totalRooms: 20, ownerPhone: "919009109108", emoji: "🏨", standardRate: 1200, deluxeRate: 2000, suiteRate: 3800, minFloorPrice: 900,  addressLine: "Hamidia Road, Bhopal - 462001",         distanceTag: "500m from Railway Station", amenities: ["Free Wi-Fi","AC Rooms"], avgRating: 4.3, totalReviews: 44, wifiPassword: "amardeep123", menuText: "Biryani ₹160 | Paneer Tikka ₹200 | Roti ₹15 | Tea ₹20", menuUrl: "", receptionPhone: "919009109108", enableWifi: true, enableFoodOrdering: true, enableHousekeeping: true },
  ];
  return DEMOS.find(h => h.id === hotelId) || DEMOS.find(h => hotelId.includes(h.id.split("-")[0])) || null;
}

/* ═══════════════════════════════════════════
   ROOMS from localStorage
═══════════════════════════════════════════ */
function getRooms(hotelId, total) {
  try {
    const s = JSON.parse(localStorage.getItem(`air_${hotelId}_rooms`) || "[]");
    if (s.length > 0) return s;
  } catch {}
  return Array.from({ length: total }, (_, i) => ({
    id: `${hotelId}_R${String(i + 1).padStart(3, "0")}`, number: i + 1,
    floor: Math.ceil((i + 1) / 5), type: i % 10 === 0 ? "suite" : i % 3 === 0 ? "deluxe" : "standard",
    status: "vacant", currentBookingId: null, baseRate: i % 10 === 0 ? 3800 : i % 3 === 0 ? 2000 : 1200,
  }));
}

/* ═══════════════════════════════════════════
   SAVE BOOKING — FIXED: Single atomic entry point
═══════════════════════════════════════════ */
const HOTEL_ID_ALIASES = {
  "hotel-cherry-bhopal":   "cherry-bhopal",
  "hotel-cherry":          "cherry-bhopal",
  "boutique-stays-jaipur": "sunrise-jaipur",
  "hotel-midtown-indore":  "midtown-indore",
  "city-comforts-nagpur":  "comforts-nagpur",
};
function normalizeHotelId(id) { return HOTEL_ID_ALIASES[id] || id; }

async function saveBooking(booking, hotelId) {
  hotelId = normalizeHotelId(hotelId);
  try {
    const { createBooking } = await import("../../../lib/db");
    await createBooking(hotelId, {
      ...booking,
      isPublicBooking: true,
    });
  } catch (e) {
    console.warn("[saveBooking] createBooking error:", e.message);
    const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (sbUrl && sbKey && sbUrl !== "undefined") {
      try {
        const now = booking.createdAt || new Date().toISOString();
        const row = {
          id:              booking.id,
          hotel_id:        hotelId,
          guest_name:      booking.guestName     || "",
          guest_phone:     booking.guestPhone    || "",
          address:         booking.address       || "",
          id_type:         booking.idType        || "Aadhaar",
          id_number:       booking.idNumber      || "",
          gender:          booking.gender        || "",
          dob:             booking.dob           || "",
          room_id:         booking.roomId        || "",
          room_number:     booking.roomNumber    || 0,
          room_type:       booking.roomType      || "standard",
          check_in_date:   booking.checkInDate   || "",
          check_out_date:  booking.checkOutDate  || "",
          nights:          booking.nights        || 1,
          rate_per_night:  booking.ratePerNight  || 0,
          total_amount:    booking.totalAmount   || 0,
          payment_mode:    booking.paymentMode   || "Cash",
          status:          "active",
          rate_locked:     true,
          negotiated:      booking.negotiated    || false,
          negotiated_from: booking.negotiatedFrom || 0,
          source:          "marketplace",
          created_at:      now,
        };
        await fetch(`${sbUrl}/rest/v1/bookings`, {
          method: "POST",
          headers: {
            apikey: sbKey,
            Authorization: `Bearer ${sbKey}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify(row),
        });
        try {
          const key  = `air_${hotelId}_bookings`;
          const list = JSON.parse(localStorage.getItem(key) || "[]");
          if (!list.find(b => b.id === booking.id)) {
            localStorage.setItem(key, JSON.stringify([{
              ...booking, source: "marketplace", status: "active",
            }, ...list]));
          }
          try {
            const bc = new BroadcastChannel("air_hotel_sync");
            bc.postMessage({ type: "new_booking", hotelId, ts: Date.now() });
            bc.close();
          } catch {}
          localStorage.setItem(`air_sync_${hotelId}`, Date.now().toString());
        } catch {}
      } catch (e2) {
        console.warn("[saveBooking] Hard fallback error:", e2.message);
      }
    }
  }

  try {
    fetch("/api/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action:     "send",
        hotelId,
        type:       "new_booking",
        title:      `🛎️ Naya Booking — ${booking.guestName || "Guest"}`,
        body:       `Room ${booking.roomNumber || booking.roomId} · ₹${booking.totalAmount} · ${booking.nights} raat`,
        actionId:   "new_booking",
        roomNumber: booking.roomNumber || null,
        guestName:  booking.guestName  || "Guest",
        timestamp:  booking.createdAt  || new Date().toISOString(),
      }),
    }).catch(() => {});
  } catch {}

  return { success: true };
}

/* ═══════════════════════════════════════════
   ROOM KEYCAP — Premium Dark Style
═══════════════════════════════════════════ */
function RoomKeycap({ room, selected, onClick }) {
  const isOccupied = room.status === "occupied";
  const isVacant   = room.status === "vacant";
  const isReserved = room.status === "reserved";
  const isCleaning = room.status === "cleaning";

  const dotColor = isVacant ? "#22c55e" : isReserved ? "#D4AF37" : isOccupied ? "#ef4444" : "#818cf8";

  const bgColor = isOccupied
    ? "rgba(100,0,0,0.55)"
    : selected
    ? "rgba(20,60,20,0.85)"
    : "rgba(15,25,15,0.7)";

  const borderColor = isOccupied
    ? "rgba(239,68,68,0.35)"
    : selected
    ? "rgba(34,197,94,0.7)"
    : "rgba(34,197,94,0.12)";

  return (
    <button
      onClick={() => onClick(room)}
      disabled={isOccupied}
      style={{
        aspectRatio: "1",
        borderRadius: 10,
        background: bgColor,
        border: `1.5px solid ${borderColor}`,
        cursor: isOccupied ? "not-allowed" : "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        transition: "all 0.15s ease",
        outline: "none",
        padding: "6px 2px",
        boxShadow: selected ? `0 0 12px rgba(34,197,94,0.3)` : isOccupied ? "none" : "inset 0 1px 0 rgba(255,255,255,0.04)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {selected && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(34,197,94,0.06)", borderRadius: 10, pointerEvents: "none" }} />
      )}
      <span style={{ fontSize: 11, color: selected ? "#fff" : "rgba(255,255,255,0.7)", fontWeight: 700, fontFamily: "monospace", letterSpacing: "0.02em" }}>
        {String(room.number).padStart(2, "0") }
      </span>
      <div style={{ width: 7, height: 7, borderRadius: "50%", background: dotColor, boxShadow: `0 0 6px ${dotColor}99`, flexShrink: 0 }} />
    </button>
  );
}

/* ═══════════════════════════════════════════
   AI REACTOR
═══════════════════════════════════════════ */
function AiReactor({ scanning, progress }) {
  return (
    <div style={{ width: 54, height: 54, borderRadius: "50%", background: "linear-gradient(135deg,#0d1a2e,#0a1020)", border: `2px solid ${scanning ? "rgba(0,140,255,0.7)" : "rgba(0,140,255,0.25)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative", transition: "border-color 0.4s", boxShadow: scanning ? "0 0 20px rgba(0,140,255,0.4)" : "none" }}>
      {scanning
        ? <div style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid transparent", borderTop: "2px solid #008cff", animation: "spinRingCW 0.8s linear infinite" }} />
        : <span style={{ fontSize: 22 }}>🤖</span>
      }
      {scanning && (
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 54 54">
          <circle cx="27" cy="27" r="24" fill="none" stroke="rgba(0,140,255,0.12)" strokeWidth="2" />
          <circle cx="27" cy="27" r="24" fill="none" stroke="#008cff" strokeWidth="2" strokeDasharray={`${(progress / 100) * 150.8} 150.8`} strokeLinecap="round" transform="rotate(-90 27 27)" style={{ transition: "stroke-dasharray 0.3s" }} />
        </svg>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   NEGOTIATE DETECT
═══════════════════════════════════════════ */
function detectNegotiationIntent(text) {
  const patterns = [
    /(\d{3,5})\s*(mein|me|pe|par|kar\s*do|chahiye|milega|dedo|de\s*do)/i,
    /discount|kam\s*karo|less\s*karo|reduce|negotiate|sasta|cheap|concession/i,
    /₹\s*(\d{3,5})/,
    /(\d{3,5})\s*(rupee|rs|inr)/i,
  ];
  for (const p of patterns) {
    if (text.match(p)) {
      const numMatch = text.match(/(\d{3,5})/);
      return { isNegotiation: true, requestedRate: numMatch ? parseInt(numMatch[1]) : null };
    }
  }
  return { isNegotiation: false, requestedRate: null };
}

/* ═══════════════════════════════════════════
   PHASE 2 — IN-ROOM DIGITAL COMPANION TABS
═══════════════════════════════════════════ */

/* Tab bar */
function CompanionTabBar({ activeTab, setActiveTab, hotel }) {
  const tabs = [
    { id: "chat",         label: "Sandy",    icon: "🤖" },
    { id: "food",         label: "Food",     icon: "🍽️", disabled: !(hotel?.enableFoodOrdering ?? true) },
    { id: "service",      label: "Service",  icon: "🧹", disabled: !(hotel?.enableHousekeeping ?? true) },
    { id: "desk",         label: "Desk",     icon: "📞" },
  ];
  return (
    <div style={{ display: "flex", gap: 6, padding: "10px 16px", background: "rgba(0,0,0,0.4)", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => !t.disabled && setActiveTab(t.id)}
          style={{
            flex: 1, padding: "8px 4px", borderRadius: 10,
            background: activeTab === t.id ? "rgba(212,175,55,0.15)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${activeTab === t.id ? "rgba(212,175,55,0.45)" : "rgba(255,255,255,0.07)"}`,
            color: activeTab === t.id ? "#D4AF37" : t.disabled ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.5)",
            fontSize: 9, fontWeight: 700, cursor: t.disabled ? "not-allowed" : "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            transition: "all 0.15s",
          }}
        >
          <span style={{ fontSize: 16 }}>{t.icon}</span>
          {t.label}
          {t.disabled && <span style={{ fontSize: 7, color: "rgba(255,255,255,0.2)" }}>Off</span>}
        </button>
      ))}
    </div>
  );
}

/* Food Tab */
function FoodTab({ hotel }) {
  const hasUrl  = !!(hotel?.menuUrl  || "").trim();
  const hasText = !!(hotel?.menuText || "").trim();
  const items   = hasText
    ? hotel.menuText.split(/[|\n]/).map(s => s.trim()).filter(Boolean)
    : [];

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "14px", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ textAlign: "center" }}>
        <span style={{ fontSize: 32 }}>🍽️</span>
        <h3 style={{ fontSize: 16, fontWeight: 900, color: "#fff", marginTop: 6 }}>Restaurant Menu</h3>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
          {hotel?.name} ki kitchen se sidha aapke room tak
        </p>
      </div>

      {!hasUrl && !hasText && (
        <div style={{ textAlign: "center", padding: "24px 16px", borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.08)" }}>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>Menu abhi available nahi hai</p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 4 }}>Reception se contact karo</p>
        </div>
      )}

      {hasUrl && (
        <a
          href={hotel.menuUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px", borderRadius: 14, background: "linear-gradient(135deg,rgba(212,175,55,0.12),rgba(212,175,55,0.06))", border: "1px solid rgba(212,175,55,0.3)", color: "#D4AF37", fontSize: 13, fontWeight: 800, textDecoration: "none" }}
        >
          <UtensilsCrossed size={16} /> Digital Menu Dekho →
        </a>
      )}

      {hasText && items.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.25)", letterSpacing: "0.12em", textTransform: "uppercase" }}>Today's Menu</p>
          {items.map((item, i) => {
            const priceMatch = item.match(/₹\s*(\d+)/);
            const price = priceMatch ? priceMatch[0] : null;
            const name  = price ? item.replace(priceMatch[0], "").trim().replace(/[-–]$/, "").trim() : item;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 13px", borderRadius: 11, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <span style={{ fontSize: 18 }}>{["🍛","🫓","🥘","🍚","☕","🍵","🥗","🧆"][i % 8]}</span>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>{name}</span>
                </div>
                {price && <span style={{ fontSize: 13, fontWeight: 800, color: "#D4AF37", flexShrink: 0 }}>{price}</span>}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: 4, padding: "12px 14px", borderRadius: 12, background: "rgba(0,140,255,0.06)", border: "1px solid rgba(0,140,255,0.15)" }}>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
          🤖 <strong style={{ color: "#60b8ff" }}>Sandy se order karo:</strong> Chat tab mein jaao aur likhein — <em style={{ color: "rgba(255,255,255,0.35)" }}>"Ek dal fry aur 2 roti chahiye room mein"</em>
        </p>
      </div>
    </div>
  );
}

/* Room Service Tab */
function ServiceTab({ hotel, bookingResult, onRequestSent }) {
  const [sentRequests, setSentRequests] = useState([]);
  const [loading,      setLoading]      = useState(null);

  const actions = [
    { id: "clean",    emoji: "🧹", label: "Clean My Room",       msg: "Room cleaning chahiye" },
    { id: "water",    emoji: "💧", label: "Water Bottle Laao",   msg: "Water bottle chahiye" },
    { id: "towel",    emoji: "🛁", label: "Extra Towel Chahiye", msg: "Extra towel chahiye" },
    { id: "ac",       emoji: "❄️", label: "AC Issue Report",     msg: "AC mein problem hai" },
    { id: "blanket",  emoji: "🛏️", label: "Extra Blanket",       msg: "Extra blanket chahiye" },
    { id: "wakeup",   emoji: "⏰", label: "Wake-Up Call Chahiye",msg: "Wake-up call chahiye" },
    { id: "dnd",      emoji: "🔕", label: "Do Not Disturb",      msg: "Do not disturb mode on karo" },
    { id: "checkout", emoji: "🧾", label: "Bill Prepare Karo",   msg: "Checkout ke liye bill ready karo" },
  ];

  const handleRequest = async (action) => {
    if (sentRequests.includes(action.id)) return;
    setLoading(action.id);
    try {
      await fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action:      "send",
          hotelId:     hotel?.id,
          type:        "room_service",
          title:       `🔔 Room ${bookingResult?.roomNumber || "?"} — Service Request`,
          body:        `${action.msg} · Guest: ${bookingResult?.guestName || "In-house guest"}`,
          actionId:    action.id,
          roomNumber:  bookingResult?.roomNumber,
          guestName:   bookingResult?.guestName,
          timestamp:   new Date().toISOString(),
        }),
      });
    } catch {}
    try {
      const { broadcastUpdate } = await import("../../../lib/db");
      const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (sbUrl && sbKey && sbUrl !== "undefined") {
        await fetch(`${sbUrl}/rest/v1/service_requests`, {
          method: "POST",
          headers: {
            apikey: sbKey, Authorization: `Bearer ${sbKey}`,
            "Content-Type": "application/json", Prefer: "return=minimal",
          },
          body: JSON.stringify({
            hotel_id:    hotel?.id,
            booking_id:  bookingResult?.id   || null,
            room_number: String(bookingResult?.roomNumber || ""),
            guest_name:  bookingResult?.guestName || "",
            action_id:   action.id,
            title:       `Room ${bookingResult?.roomNumber || "?"} — ${action.label}`,
            message:     action.msg,
            status:      "pending",
            created_at:  new Date().toISOString(),
          }),
        });
      }
      broadcastUpdate("service_request", hotel?.id, {
        actionId:   action.id,
        roomNumber: bookingResult?.roomNumber,
        guestName:  bookingResult?.guestName,
        msg:        action.msg,
      });
    } catch {}
    setSentRequests(p => [...p, action.id]);
    setLoading(null);
    onRequestSent?.(action);
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "14px", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ textAlign: "center" }}>
        <span style={{ fontSize: 32 }}>🧹</span>
        <h3 style={{ fontSize: 16, fontWeight: 900, color: "#fff", marginTop: 6 }}>Room Service</h3>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>Ek tap mein staff ko request bhejo</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {actions.map(action => {
          const sent    = sentRequests.includes(action.id);
          const loading_ = loading === action.id;
          return (
            <button
              key={action.id}
              onClick={() => handleRequest(action)}
              disabled={sent || loading_}
              style={{
                padding: "14px 10px", borderRadius: 14, textAlign: "center",
                background: sent ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${sent ? "rgba(34,197,94,0.35)" : "rgba(255,255,255,0.07)"}`,
                cursor: sent ? "default" : "pointer",
                transition: "all 0.15s",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
              }}
            >
              <span style={{ fontSize: 24 }}>{sent ? "✅" : action.emoji}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: sent ? "#22c55e" : "rgba(255,255,255,0.7)", lineHeight: 1.3 }}>
                {loading_ ? "Sending..." : sent ? "Sent!" : action.label}
              </span>
            </button>
          );
        })}
      </div>

      {sentRequests.length > 0 && (
        <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.2)" }}>
          <p style={{ fontSize: 11, color: "#22c55e", fontWeight: 700 }}>✓ Staff ko notify kar diya gaya</p>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>Thodi der mein aapka kaam ho jayega</p>
        </div>
      )}
    </div>
  );
}

/* Call Desk Tab */
function CallDeskTab({ hotel }) {
  const phone = hotel?.receptionPhone || hotel?.ownerPhone || hotel?.managerPhone || "";
  const e164  = phone.startsWith("+") ? phone : phone ? `+${phone}` : "";
  const whatsapp = phone.replace(/\D/g, "");

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "14px", display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ textAlign: "center" }}>
        <span style={{ fontSize: 32 }}>📞</span>
        <h3 style={{ fontSize: 16, fontWeight: 900, color: "#fff", marginTop: 6 }}>Call Desk</h3>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>Reception se directly baat karo</p>
      </div>

      {e164 ? (
        <>
          <a
            href={`tel:${e164}`}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              padding: "16px", borderRadius: 16,
              background: "linear-gradient(135deg,#14532d,#166534)",
              border: "1px solid rgba(34,197,94,0.35)",
              color: "#fff", fontSize: 15, fontWeight: 900, textDecoration: "none",
              boxShadow: "0 4px 20px rgba(34,197,94,0.25)",
            }}
          >
            <Phone size={18} /> 📲 Reception Ko Call Karo
          </a>

          {whatsapp && (
            <a
              href={`https://wa.me/${whatsapp}?text=Namaste%2C%20mujhe%20room%20service%20chahiye`}
              target="_blank" rel="noopener noreferrer"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                padding: "14px", borderRadius: 14,
                background: "rgba(37,211,102,0.08)",
                border: "1px solid rgba(37,211,102,0.25)",
                color: "#25D366", fontSize: 13, fontWeight: 800, textDecoration: "none",
              }}
            >
              <span style={{ fontSize: 18 }}>💬</span> WhatsApp Pe Message Karo
            </a>
          )}

          <div style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textAlign: "center" }}>Reception number</p>
            <p style={{ fontSize: 20, fontWeight: 900, color: "#fff", textAlign: "center", marginTop: 4, fontFamily: "monospace", letterSpacing: "0.05em" }}>{e164}</p>
          </div>
        </>
      ) : (
        <div style={{ textAlign: "center", padding: "24px 16px", borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.08)" }}>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>Contact number configure nahi hai</p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 4 }}>Hotel admin se baat karo</p>
        </div>
      )}

      <div style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(0,140,255,0.05)", border: "1px solid rgba(0,140,255,0.12)" }}>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
          ⏰ <strong style={{ color: "#60b8ff" }}>Check-out time:</strong> 11:00 AM<br />
          🔑 <strong style={{ color: "#60b8ff" }}>Check-in time:</strong> 12:00 PM<br />
          🆘 <strong style={{ color: "#60b8ff" }}>Emergency:</strong> Reception pe directly aao
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   IN-ROOM COMPANION PANEL (Full Screen)
═══════════════════════════════════════════ */
function InRoomCompanion({
  hotel, bookingResult,
  messages, chatInput, setChatInput,
  chatLoading, negotiating, sendChat,
  checkIn, checkOut, selectedRoom, negotiatedRate, rateLockToken, nights, roomRate, activeRoomTypeKey,
  chatEndRef,
  onClose,
}) {
  const [activeTab, setActiveTab] = useState("chat");

  const handleServiceRequest = (action) => {};

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", flexDirection: "column", background: "linear-gradient(180deg,#0d111e,#060810)", animation: "slideUp 0.3s cubic-bezier(0.16,1,0.3,1) forwards" }}>
      <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(0,0,0,0.3)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#1a1400,#2d2200)", border: "1px solid rgba(212,175,55,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{hotel?.emoji}</div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 800, color: "#D4AF37" }}>In-Room Companion</p>
            <p style={{ fontSize: 9, color: "#22c55e", display: "flex", alignItems: "center", gap: 3 }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
              {bookingResult?.guestName ? `Welcome, ${bookingResult.guestName.split(" ")[0]}! Room ${bookingResult.roomNumber}` : `${hotel?.name} · Guest Services`}
            </p>
          </div>
        </div>
        <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <X size={15} />
        </button>
      </div>

      {hotel?.wifiPassword && (hotel?.enableWifi ?? true) && (
        <div style={{ padding: "8px 16px", background: "rgba(0,140,255,0.06)", borderBottom: "1px solid rgba(0,140,255,0.1)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ fontSize: 14 }}>📶</span>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Wi-Fi Password:</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#60b8ff", fontFamily: "monospace" }}>{hotel.wifiPassword}</span>
          </div>
          <WifiCopyButton password={hotel.wifiPassword} />
        </div>
      )}

      <CompanionTabBar activeTab={activeTab} setActiveTab={setActiveTab} hotel={hotel} />

      {activeTab === "chat" && (
        <ChatTab
          messages={messages} chatInput={chatInput} setChatInput={setChatInput}
          chatLoading={chatLoading} negotiating={negotiating} sendChat={sendChat}
          checkIn={checkIn} checkOut={checkOut} selectedRoom={selectedRoom}
          negotiatedRate={negotiatedRate} rateLockToken={rateLockToken}
          nights={nights} roomRate={roomRate} activeRoomTypeKey={activeRoomTypeKey}
          chatEndRef={chatEndRef}
        />
      )}
      {activeTab === "food" && <FoodTab hotel={hotel} />}
      {activeTab === "service" && (
        <ServiceTab hotel={hotel} bookingResult={bookingResult} onRequestSent={handleServiceRequest} />
      )}
      {activeTab === "desk" && <CallDeskTab hotel={hotel} />}
    </div>
  );
}

/* Wi-Fi copy button */
function WifiCopyButton({ password }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(password).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} style={{ fontSize: 9, padding: "4px 8px", borderRadius: 6, background: copied ? "rgba(34,197,94,0.1)" : "rgba(0,140,255,0.1)", border: `1px solid ${copied ? "rgba(34,197,94,0.3)" : "rgba(0,140,255,0.25)"}`, color: copied ? "#22c55e" : "#60b8ff", cursor: "pointer", fontWeight: 700 }}>
      {copied ? "Copied ✓" : "Copy"}
    </button>
  );
}

/* Chat Tab */
function ChatTab({ messages, chatInput, setChatInput, chatLoading, negotiating, sendChat, checkIn, checkOut, selectedRoom, negotiatedRate, rateLockToken, nights, roomRate, activeRoomTypeKey, chatEndRef }) {
  return (
    <>
      {(checkIn || selectedRoom) && (
        <div style={{ padding: "7px 14px", background: "rgba(212,175,55,0.05)", borderBottom: "1px solid rgba(212,175,55,0.1)", display: "flex", gap: 10, flexWrap: "wrap", flexShrink: 0 }}>
          {checkIn  && <span style={{ fontSize: 9, color: "rgba(212,175,55,0.7)", background: "rgba(212,175,55,0.08)", padding: "3px 8px", borderRadius: 6 }}>📅 {checkIn} → {checkOut || "?"}</span>}
          {selectedRoom && <span style={{ fontSize: 9, color: "rgba(212,175,55,0.7)", background: "rgba(212,175,55,0.08)", padding: "3px 8px", borderRadius: 6 }}>🏠 Room {selectedRoom.number}</span>}
          {negotiatedRate && <span style={{ fontSize: 9, color: "#22c55e", background: "rgba(34,197,94,0.1)", padding: "3px 8px", borderRadius: 6 }}>🔒 ₹{negotiatedRate}/night locked</span>}
        </div>
      )}

      <div style={{ flex: 1, padding: "14px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, WebkitOverflowScrolling: "touch" }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", animation: "fadeUp 0.25s ease" }}>
            <div style={{
              maxWidth: "85%", padding: "10px 13px",
              borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
              fontSize: 12, lineHeight: 1.6,
              background: msg.role === "user"
                ? "linear-gradient(135deg,#91711e,#D4AF37)"
                : msg.isNegotiationResult
                  ? msg.approved ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.08)"
                  : "rgba(255,255,255,0.05)",
              color: msg.role === "user" ? "#000" : "rgba(255,255,255,0.85)",
              border: msg.role === "user" ? "none"
                : msg.isNegotiationResult
                  ? `1px solid ${msg.approved ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.25)"}`
                  : "1px solid rgba(255,255,255,0.06)",
              fontWeight: msg.role === "user" ? 700 : 400,
            }}>
              {msg.content.split("\n").map((line, j) => <span key={j}>{line}{j < msg.content.split("\n").length - 1 && <br />}</span>)}
              {msg.isNegotiationResult && msg.approved && msg.token && (
                <div style={{ marginTop: 8, padding: "6px 8px", borderRadius: 6, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
                  <p style={{ fontSize: 9, color: "#22c55e", fontFamily: "monospace" }}>🔒 Rate Lock Token: {msg.token}</p>
                </div>
              )}
            </div>
          </div>
        ))}
        {(chatLoading || negotiating) && (
          <div style={{ display: "flex", gap: 5, padding: "8px 4px", alignItems: "center" }}>
            {negotiating && <span style={{ fontSize: 10, color: "#D4AF37", marginRight: 4 }}>Negotiating...</span>}
            {[0, 1, 2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: negotiating ? "#D4AF37" : "#008cff", animation: "dotBounce 1.2s infinite", animationDelay: `${i * 0.2}s` }} />)}
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div style={{ padding: "8px 14px 0", display: "flex", gap: 6, flexWrap: "wrap", flexShrink: 0 }}>
        {["Rates kya hain?", "₹1000 mein milega?", "Wi-fi password?", "Khana order karna hai", "Checkout time?"].map(q => (
          <button key={q} onClick={() => sendChat(q)} style={{ fontSize: 10, padding: "6px 10px", borderRadius: 8, background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)", color: "#D4AF37", cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" }}>{q}</button>
        ))}
      </div>

      <div style={{ padding: "10px 14px 16px", borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.3)", display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
        <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendChat()} placeholder="Hinglish mein puchho ya negotiate karo..." style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "11px 14px", fontSize: 12, color: "#fff", outline: "none" }} />
        <button onClick={() => sendChat()} disabled={!chatInput.trim() || chatLoading} style={{ width: 42, height: 42, borderRadius: 11, background: "linear-gradient(135deg,#0050c8,#0080ff)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: (!chatInput.trim() || chatLoading) ? 0.4 : 1 }}>
          <Send size={14} style={{ color: "#fff" }} />
        </button>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════
   FAQ SECTION — Premium Redesign
═══════════════════════════════════════════ */
function FaqSection({ faqOpen, setFaqOpen }) {
  const faqs = [
    { q: "Check-in aur Check-out ka time kya hai?",       a: "Check-in time 1:00 PM se hai aur check-out time 11:00 AM tak. Early check-in subject to availability." },
    { q: "Kya ID proof mandatory hai?",                    a: "Haan, ek valid government-issued ID (Aadhaar, PAN, Passport, ya Driving License) zaroori hai check-in ke time." },
    { q: "Payment kaise kar sakte hain?",                  a: "Check-in ke time Cash ya UPI accepted hai. Card payment bhi available hai hotel reception pe." },
    { q: "Kya couple friendly rooms available hain?",      a: "Haan, hum couple-friendly rooms provide karte hain. Aapko valid ID proof saath laana zaroori hai." },
    { q: "Cancellation policy kya hai?",                   a: "24 ghante pehle cancellation bilkul free hai. Uske baad ek raat ka charge lagega." },
  ];

  return (
    <div style={{ background: "rgba(10,10,12,0.98)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, overflow: "hidden", marginBottom: 14 }}>
      {/* Header */}
      <div style={{ padding: "18px 18px 14px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <MessageCircle size={18} style={{ color: "#D4AF37" }} />
        </div>
        <div>
          <p style={{ fontSize: 16, fontWeight: 800, color: "#D4AF37" }}>Aksar Puche Jane Wale Sawal (FAQ)</p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>Aapke har sawaal ka simple jawab</p>
        </div>
      </div>

      {/* FAQ Items */}
      {faqs.map((f, i) => (
        <div
          key={i}
          style={{
            borderTop: "1px solid rgba(255,255,255,0.05)",
            background: faqOpen === i ? "rgba(212,175,55,0.04)" : "transparent",
            transition: "background 0.2s",
          }}
        >
          <button
            onClick={() => setFaqOpen(faqOpen === i ? null : i)}
            style={{ width: "100%", padding: "16px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", gap: 12 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#D4AF37", flexShrink: 0, fontFamily: "monospace", minWidth: 22 }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span style={{ fontSize: 13, color: faqOpen === i ? "#fff" : "rgba(255,255,255,0.75)", fontWeight: 600, flex: 1 }}>{f.q}</span>
            </div>
            <div style={{
              width: 26, height: 26, borderRadius: "50%", border: "1.5px solid rgba(212,175,55,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              color: "#D4AF37", fontSize: 16, fontWeight: 300, lineHeight: 1,
              transition: "transform 0.2s",
              transform: faqOpen === i ? "rotate(45deg)" : "none",
            }}>
              +
            </div>
          </button>
          {faqOpen === i && (
            <div style={{ padding: "0 18px 16px 54px", animation: "fadeUp 0.2s ease" }}>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.7 }}>{f.a}</p>
            </div>
          )}
        </div>
      ))}

      {/* Support CTA */}
      <div style={{ margin: "12px 14px 14px", padding: "14px 16px", borderRadius: 14, background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.2)", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(212,175,55,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Phone size={15} style={{ color: "#D4AF37" }} />
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#D4AF37" }}>Aur sawaal hai? Humse baat karein</p>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>24x7 Support</p>
          </div>
        </div>
        <ChevronRight size={16} style={{ color: "#D4AF37", flexShrink: 0 }} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   REPUTATION & TRUST SECTION
═══════════════════════════════════════════ */
function ReputationSection({ hotel }) {
  const rating    = hotel?.avgRating   || 4.8;
  const reviews   = hotel?.totalReviews || 2432;
  const ratingPct = [78, 16, 4, 1, 1];

  const guestReviews = [
    { name: "Rahul Sharma", time: "2 days ago",  stars: 5, text: "Amazing stay! Room was spotless, staff was polite and the service was top-notch. Will definitely visit again.", helpful: 24 },
    { name: "Priya Mehta",  time: "1 week ago",  stars: 5, text: "Beautiful property with great ambience. Perfect location and excellent hospitality. Highly recommended!", helpful: 18 },
    { name: "Arjun Verma",  time: "2 weeks ago", stars: 5, text: "Value for money! Everything was beyond expectations. The AI concierge helped a lot during our stay.", helpful: 31 },
  ];

  return (
    <div style={{ background: "rgba(10,10,12,0.98)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, overflow: "hidden", marginBottom: 14 }}>
      {/* Section header */}
      <div style={{ padding: "18px 18px 12px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <ShieldCheck size={18} style={{ color: "#D4AF37" }} />
        </div>
        <div>
          <p style={{ fontSize: 16, fontWeight: 800, color: "#D4AF37" }}>Reputation &amp; Trust</p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>Real reviews from real guests</p>
        </div>
      </div>

      <div style={{ padding: "0 14px 14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {/* Google Rating Card */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 900 }}>
                <span style={{ color: "#4285F4" }}>G</span>
                <span style={{ color: "#EA4335" }}>o</span>
                <span style={{ color: "#FBBC05" }}>o</span>
                <span style={{ color: "#4285F4" }}>g</span>
                <span style={{ color: "#34A853" }}>l</span>
                <span style={{ color: "#EA4335" }}>e</span>
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
              <span style={{ fontSize: 8, color: "rgba(255,255,255,0.35)" }}>Live Reviews</span>
            </div>
          </div>
          <p style={{ fontSize: 32, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{rating.toFixed(1)}</p>
          <div style={{ display: "flex", gap: 2, marginTop: 4, marginBottom: 4 }}>
            {[1,2,3,4,5].map(s => (
              <span key={s} style={{ fontSize: 13, color: s <= Math.round(rating) ? "#F5C842" : "rgba(255,255,255,0.15)" }}>★</span>
            ))}
          </div>
          <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginBottom: 10 }}>Based on {reviews.toLocaleString("en-IN")}+ reviews</p>
          {ratingPct.map((pct, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
              <span style={{ fontSize: 8, color: "rgba(255,255,255,0.4)", width: 6 }}>{5 - i}</span>
              <span style={{ fontSize: 9, color: "#F5C842" }}>★</span>
              <div style={{ flex: 1, height: 4, borderRadius: 4, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: i === 0 ? "#F5C842" : i === 1 ? "#D4AF37" : "rgba(255,255,255,0.2)", borderRadius: 4 }} />
              </div>
              <span style={{ fontSize: 8, color: "rgba(255,255,255,0.35)", width: 18 }}>{pct}%</span>
            </div>
          ))}
          {/* Trust badge */}
          <div style={{ marginTop: 12, padding: "10px", borderRadius: 12, background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.15)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <ShieldCheck size={13} style={{ color: "#22c55e" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#22c55e" }}>Trusted by 10,000+ Guests</span>
            </div>
            <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>Across India</p>
            <div style={{ display: "flex", alignItems: "center", gap: -4, marginTop: 8 }}>
              {["👨‍💼","👩","👨","👩‍💼"].map((em, i) => (
                <div key={i} style={{ width: 26, height: 26, borderRadius: "50%", background: `hsl(${i * 40},60%,40%)`, border: "2px solid rgba(10,10,12,0.9)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, marginLeft: i > 0 ? -6 : 0 }}>{em}</div>
              ))}
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(212,175,55,0.2)", border: "2px solid rgba(212,175,55,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 800, color: "#D4AF37", marginLeft: -6 }}>10K+</div>
            </div>
          </div>
        </div>

        {/* Guest Reviews */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>Guest Experiences</span>
            <span style={{ fontSize: 10, color: "#D4AF37", fontWeight: 700 }}>See All ›</span>
          </div>
          {guestReviews.map((rv, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "12px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: `hsl(${i * 80 + 200},60%,35%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 }}>
                    {rv.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>{rv.name}</span>
                      <span style={{ fontSize: 9, color: "#22c55e" }}>✓</span>
                    </div>
                    <div style={{ display: "flex", gap: 1, marginTop: 1 }}>
                      {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: 9, color: "#F5C842" }}>★</span>)}
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>{rv.time}</span>
              </div>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", lineHeight: 1.5, marginBottom: 6 }}>{rv.text}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>👍 Helpful ({rv.helpful})</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════ */
export default function BookingPage() {
  const params   = useParams();
  const hotelId  = params?.hotelId;

  const [hotel,         setHotel]         = useState(null);
  const [rooms,         setRooms]         = useState([]);
  const [pageLoading,   setPageLoading]   = useState(true);
  const [selectedRoom,  setSelectedRoom]  = useState(null);

  const [guestName,    setGuestName]    = useState("");
  const [guestPhone,   setGuestPhone]   = useState("");
  const [checkIn,      setCheckIn]      = useState("");
  const [checkOut,     setCheckOut]     = useState("");
  const [address,      setAddress]      = useState("");
  const [idType,       setIdType]       = useState("Aadhaar");
  const [idNumber,     setIdNumber]     = useState("");
  const [gender,       setGender]       = useState("");
  const [dob,          setDob]          = useState("");
  const [nationality,  setNationality]  = useState("Indian");
  const [roomType,     setRoomType]     = useState("Deluxe Room");
  const [paymentMode,  setPaymentMode]  = useState("Cash");

  const [scanStep,     setScanStep]     = useState("idle");
  const [scanSide,     setScanSide]     = useState("front");
  const [scanProgress, setScanProgress] = useState(0);
  const [frontImage,   setFrontImage]   = useState("");
  const [backImage,    setBackImage]    = useState("");
  const [scanError,    setScanError]    = useState("");
  const videoRef   = useRef(null);
  const canvasRef  = useRef(null);
  const streamRef  = useRef(null);

  const [submitting,    setSubmitting]    = useState(false);
  const [submitted,     setSubmitted]     = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const [formError,     setFormError]     = useState("");
  const [activeBooking, setActiveBooking] = useState(null);

  const [negotiatedRate, setNegotiatedRate] = useState(null);
  const [rateLockToken,  setRateLockToken]  = useState(null);
  const [negotiating,    setNegotiating]    = useState(false);

  const [companionOpen, setCompanionOpen] = useState(false);
  const [messages,      setMessages]      = useState([]);
  const [chatInput,     setChatInput]     = useState("");
  const [chatLoading,   setChatLoading]   = useState(false);
  const chatEndRef = useRef(null);

  const [faqOpen, setFaqOpen] = useState(null);

  const nights = (() => {
    if (!checkIn || !checkOut) return 0;
    const diff = (new Date(checkOut) - new Date(checkIn)) / 86400000;
    return diff > 0 ? diff : 0;
  })();

  const roomRate = (() => {
    if (negotiatedRate) return negotiatedRate;
    if (selectedRoom) return selectedRoom.baseRate || hotel?.standardRate || 1200;
    if (!hotel) return 0;
    if (roomType.toLowerCase().includes("suite"))  return hotel.suiteRate   || 3800;
    if (roomType.toLowerCase().includes("deluxe")) return hotel.deluxeRate  || 2000;
    return hotel.standardRate || 1200;
  })();

  const total = roomRate * nights;

  const activeRoomTypeKey = (() => {
    if (selectedRoom) return selectedRoom.type || "standard";
    if (roomType.toLowerCase().includes("suite"))  return "suite";
    if (roomType.toLowerCase().includes("deluxe")) return "deluxe";
    return "standard";
  })();

  useEffect(() => {
    if (!hotelId) { setPageLoading(false); return; }
    fetchHotel(hotelId).then(async h => {
      setHotel(h);
      if (h) {
        const localRooms = getRooms(hotelId, h.totalRooms);
        setRooms(localRooms);

        const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (sbUrl && sbKey && sbUrl !== "undefined") {
          try {
            const res = await fetch(
              `${sbUrl}/rest/v1/rooms?hotel_id=eq.${encodeURIComponent(hotelId)}&select=id,number,status,current_booking_id,guest_name`,
              { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } }
            );
            if (res.ok) {
              const sbRooms = await res.json();
              if (sbRooms?.length > 0) {
                const sbMap = {};
                sbRooms.forEach(r => { sbMap[r.id] = r; });
                const merged = localRooms.map(r => {
                  const sb = sbMap[r.id];
                  if (!sb) return r;
                  return { ...r, status: sb.status, currentBookingId: sb.current_booking_id || null, guestName: sb.guest_name || "" };
                });
                setRooms(merged);
                try { localStorage.setItem(`air_${hotelId}_rooms`, JSON.stringify(merged)); } catch {}
              }
            }
          } catch {}
        }
      }
      try {
        const stored = localStorage.getItem(`air_active_booking_${hotelId}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.id && parsed.status !== "checked_out") {
            setActiveBooking(parsed);
            setBookingResult(parsed);
            setSubmitted(true);
          }
        }
      } catch {}
      setPageLoading(false);
    });
  }, [hotelId]);

  useEffect(() => {
    if (hotel && messages.length === 0) {
      const restoredBooking = (() => {
        try {
          const s = localStorage.getItem(`air_active_booking_${hotel.id}`);
          return s ? JSON.parse(s) : null;
        } catch { return null; }
      })();
      const guestFirstName = restoredBooking?.guestName?.split(" ")[0] || null;
      const roomNum        = restoredBooking?.roomNumber || null;

      setMessages([{
        role: "assistant",
        content: guestFirstName
          ? `Wapas aaye, ${guestFirstName}! 🙏 Main Sandy hoon — ${hotel.name} ka AI Concierge.\n\n${roomNum ? `Room ${roomNum} mein aapka swagat hai! 🏨\n\n` : ""}Aap puchh sakte ho:\n• 📶 Wi-Fi password\n• 🍽️ Menu & food order\n• 🧹 Room service request\n• 📞 Reception call\n\nKya main aapki help kar sakta hoon? 😊`
          : `Namaste! 🙏 Main ${hotel.name} ka AI Concierge Sandy hoon.\n\nAap puchh sakte ho:\n• 📶 Wi-Fi password\n• 🍽️ Menu & food order\n• 🏨 Room service requests\n• 💰 Rates & discount negotiate\n\nKya main aapki help kar sakta hoon? 😊`,
      }]);
    }
  }, [hotel]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setScanStep("camera");
    } catch (e) {
      setScanError("Camera access nahi mila: " + e.message);
      setScanStep("error");
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  const captureAndScan = async () => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const base64 = canvas.toDataURL("image/jpeg", 0.85).split(",")[1];
    stopCamera();
    setScanStep("scanning");
    setScanProgress(0);
    if (scanSide === "front") setFrontImage(base64); else setBackImage(base64);
    const prog = setInterval(() => setScanProgress(p => p >= 90 ? 90 : p + 12), 250);
    try {
      const res  = await fetch("/api/groq", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "id_scan", imageBase64: base64 }) });
      const data = await res.json();
      clearInterval(prog);
      setScanProgress(100);
      if (data.success && data.data) {
        const d = data.data;
        if (d.name)     setGuestName(d.name);
        if (d.dob)      setDob(d.dob.replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$3-$2-$1"));
        if (d.address)  setAddress(d.address);
        if (d.idNumber) setIdNumber(d.idNumber);
        if (d.idType)   setIdType(d.idType);
        if (d.gender)   setGender(d.gender === "M" ? "Male" : d.gender === "F" ? "Female" : d.gender);
        setTimeout(() => setScanStep("done"), 400);
      } else {
        setScanError(data.error || "ID data extract nahi hua.");
        setScanStep("error");
      }
    } catch (e) {
      clearInterval(prog);
      setScanError("Network error: " + e.message);
      setScanStep("error");
    }
  };

  const resetScan = () => {
    setScanStep("idle"); setScanProgress(0); setScanError("");
    setFrontImage(""); setBackImage(""); stopCamera();
  };

  const handleBook = async () => {
    setFormError("");
    if (!guestName.trim())  return setFormError("Guest ka naam likhna zaroori hai.");
    if (!guestPhone.trim()) return setFormError("Phone number likhna zaroori hai.");
    if (!checkIn)           return setFormError("Check-in date select karo.");
    if (!checkOut)          return setFormError("Check-out date select karo.");
    if (nights <= 0)        return setFormError("Check-out, check-in ke baad honi chahiye.");
    setSubmitting(true);
    const bid = `BK${Date.now().toString(36).toUpperCase()}`;

    let resolvedRoom = selectedRoom;
    if (!resolvedRoom) {
      const vacantRooms = rooms.filter(r => r.status === "vacant" && r.type === activeRoomTypeKey);
      const anyVacant   = rooms.filter(r => r.status === "vacant");
      resolvedRoom = vacantRooms[0] || anyVacant[0] || rooms[0] || null;
    }

    const roomId     = resolvedRoom?.id     || `${hotelId}_R001`;
    const roomNumber = resolvedRoom?.number || 1;
    const booking = {
      id:             bid,
      hotelId,
      guestName:      guestName.trim(),
      guestPhone:     guestPhone.trim(),
      address:        address.trim(),
      idType,
      idNumber:       idNumber.trim() || "[Aadhaar Redacted]",
      gender,
      dob,
      nationality,
      roomId,
      roomNumber,
      roomType:       resolvedRoom?.type || activeRoomTypeKey,
      checkInDate:    checkIn,
      checkOutDate:   checkOut,
      nights,
      ratePerNight:   roomRate,
      totalAmount:    total,
      paymentMode,
      rateLocked:     true,
      negotiated:     !!negotiatedRate,
      negotiatedFrom: negotiatedRate ? (resolvedRoom?.baseRate || hotel?.standardRate || 0) : 0,
      rateLockToken:  rateLockToken || null,
      source:         "marketplace",
      createdAt:      new Date().toISOString(),
    };
    await saveBooking(booking, hotelId);

    if (resolvedRoom) {
      setRooms(prev => prev.map(r =>
        r.id === resolvedRoom.id
          ? { ...r, status: "reserved", currentBookingId: bid, guestName: booking.guestName }
          : r
      ));
    }

    try {
      const { sendBookingAlerts } = await import("../../../lib/alerts");
      await sendBookingAlerts(booking);
    } catch {}

    const result = { ...booking, roomNumber };
    try {
      localStorage.setItem(`air_active_booking_${hotelId}`, JSON.stringify(result));
    } catch {}
    setActiveBooking(result);
    setBookingResult(result);
    setSubmitted(true);
    setCompanionOpen(true);
    setSubmitting(false);
  };

  const sendChat = async (override) => {
    const text = (override || chatInput).trim();
    if (!text || chatLoading) return;
    if (!override) setChatInput("");
    const newMsgs = [...messages, { role: "user", content: text }];
    setMessages(newMsgs);
    setChatLoading(true);
    const { isNegotiation, requestedRate } = detectNegotiationIntent(text);
    if (isNegotiation && requestedRate && hotel) {
      setNegotiating(true);
      try {
        const res = await fetch("/api/groq", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type:          "negotiate",
            hotelId,
            requestedRate,
            roomType:      activeRoomTypeKey,
            hotelConfig: {
              name:          hotel.name,
              location:      hotel.location,
              standardRate:  hotel.standardRate,
              deluxeRate:    hotel.deluxeRate,
              suiteRate:     hotel.suiteRate,
              minFloorPrice: hotel.minFloorPrice,
            },
            bookingContext: {
              checkIn, checkOut, nights,
              roomType: activeRoomTypeKey,
              selectedRoom: selectedRoom ? { id: selectedRoom.id, number: selectedRoom.number } : null,
            },
          }),
        });
        const data = await res.json();
        if (data.success) {
          if (data.approved) { setNegotiatedRate(data.finalRate); setRateLockToken(data.rateLockToken); }
          setMessages(p => [...p, {
            role: "assistant", content: data.message,
            isNegotiationResult: true, approved: data.approved,
            finalRate: data.finalRate, token: data.rateLockToken,
          }]);
        } else throw new Error(data.error || "Negotiate failed");
      } catch {
        setMessages(p => [...p, { role: "assistant", content: "Rate negotiation mein problem aayi. Dobara try karo 🙏" }]);
      }
      setNegotiating(false);
      setChatLoading(false);
      return;
    }
    const bookingContextBlock = (checkIn || checkOut || selectedRoom)
      ? `\n\n[CURRENT BOOKING CONTEXT: Check-in: ${checkIn || "not set"}, Check-out: ${checkOut || "not set"}, Nights: ${nights || 0}, Room: ${selectedRoom ? `Room ${selectedRoom.number} (${activeRoomTypeKey})` : roomType}, Rate: ₹${roomRate}/night${negotiatedRate ? `, NEGOTIATED RATE LOCKED: ₹${negotiatedRate} (Token: ${rateLockToken})` : ""}]`
      : "";
    try {
      const res = await fetch("/api/groq", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "chat",
          hotelId,
          hotelConfig: {
            name:               hotel?.name,
            location:           hotel?.location,
            standardRate:       hotel?.standardRate,
            deluxeRate:         hotel?.deluxeRate,
            suiteRate:          hotel?.suiteRate,
            minFloorPrice:      hotel?.minFloorPrice,
            rates:              { standard: hotel?.standardRate, deluxe: hotel?.deluxeRate, suite: hotel?.suiteRate },
            wifiPassword:       hotel?.wifiPassword        || "",
            menuText:           hotel?.menuText            || "",
            menuUrl:            hotel?.menuUrl             || "",
            receptionPhone:     hotel?.receptionPhone      || "",
            enableWifi:         hotel?.enableWifi          ?? true,
            enableFoodOrdering: hotel?.enableFoodOrdering  ?? true,
            enableHousekeeping: hotel?.enableHousekeeping  ?? true,
            checkinTime:        hotel?.checkinTime         || "12:00 PM",
            checkoutTime:       hotel?.checkoutTime        || "11:00 AM",
            amenities:          hotel?.amenities           || [],
          },
          messages: [
            ...newMsgs.slice(0, -1).map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: text + bookingContextBlock },
          ],
        }),
      });
      const data = await res.json();
      setMessages(p => [...p, { role: "assistant", content: data.message || "Thodi der baad try karo 🙏" }]);
    } catch {
      setMessages(p => [...p, { role: "assistant", content: "Connection issue. Dobara try karo 🙏" }]);
    }
    setChatLoading(false);
  };

  /* ── LOADING ── */
  if (pageLoading) return (
    <div style={{ minHeight: "100vh", background: "#07090E", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 50, height: 50, borderRadius: "50%", border: "2px solid rgba(212,175,55,0.2)", borderTop: "2px solid #D4AF37", animation: "spinRingCW 1s linear infinite" }} />
      <style>{`@keyframes spinRingCW{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if (!hotel) return (
    <div style={{ minHeight: "100vh", background: "#07090E", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "rgba(255,255,255,0.3)" }}>Hotel not found</p>
    </div>
  );

  /* ── Derived values ── */
  const inpStyle   = { width: "100%", background: "rgba(15,15,20,0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 14px", fontSize: 13, color: "#fff", outline: "none", boxSizing: "border-box", colorScheme: "dark" };
  const labelStyle = { fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 6 };

  const vacantN = rooms.filter(r => r.status === "vacant").length;

  /* Amenity icons mapping */
  const amenityIconMap = {
    "free wi-fi": <Wifi size={13} />, "wifi": <Wifi size={13} />, "wi-fi": <Wifi size={13} />,
    "ac": <Wind size={13} />, "ac rooms": <Wind size={13} />,
    "room service": <Utensils size={13} />, "restaurant": <Utensils size={13} />,
    "smart tv": <Tv size={13} />, "tv": <Tv size={13} />,
    "parking": <ParkingSquare size={13} />,
    "geyser": <Droplets size={13} />, "hot water": <Droplets size={13} />,
  };
  const getAmenityIcon = (a) => amenityIconMap[a.toLowerCase()] || <Sparkles size={13} />;

  /* Build 4-col room grid */
  const COLS = 4;
  const padded = [...rooms];
  while (padded.length % COLS !== 0) padded.push(null);
  const roomRows = [];
  for (let i = 0; i < padded.length; i += COLS) roomRows.push(padded.slice(i, i + COLS));

  /* JSON-LD for SEO */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Hotel",
    "name": hotel.name,
    "description": `Premium stay with AI amenities at ${hotel.name}, ${hotel.location}.`,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": hotel.location,
      "addressRegion": "Madhya Pradesh",
      "addressCountry": "IN",
    },
    "priceRange": `INR ${hotel.standardRate} - ${hotel.suiteRate}`,
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": hotel.avgRating,
      "reviewCount": hotel.totalReviews || 100,
    },
  };

  return (
    <div style={{ minHeight: "100vh", background: "#07090E", color: "#fff", fontFamily: "system-ui,-apple-system,sans-serif", paddingBottom: 100 }}>
      {/* JSON-LD SEO */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <style>{`
        @keyframes spinRingCW  {from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes holoPulse   {0%,100%{filter:drop-shadow(0 0 12px #008cff) drop-shadow(0 0 28px rgba(0,140,255,0.4))}50%{filter:drop-shadow(0 0 22px #00aaff) drop-shadow(0 0 55px rgba(0,160,255,0.65))}}
        @keyframes audioBar    {0%,100%{height:4px}50%{height:16px}}
        @keyframes fadeUp      {from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideUp     {from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes dotBounce   {0%,80%,100%{transform:scale(0.4);opacity:0.3}40%{transform:scale(1);opacity:1}}
        @keyframes greenPulse  {0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0.4)}50%{box-shadow:0 0 0 6px rgba(34,197,94,0)}}
        @keyframes goldPulse   {0%,100%{box-shadow:0 0 0 0 rgba(212,175,55,0.5)}50%{box-shadow:0 0 0 8px rgba(212,175,55,0)}}
        input:focus,select:focus,textarea:focus{border-color:rgba(212,175,55,0.5)!important;background:rgba(212,175,55,0.04)!important}
        input::placeholder,textarea::placeholder{color:rgba(255,255,255,0.2)}
        select option{background:#0f0f14;color:#fff}
        ::-webkit-scrollbar{width:3px;height:3px}
        ::-webkit-scrollbar-thumb{background:rgba(212,175,55,0.15);border-radius:3px}
        .scrollbar-hide::-webkit-scrollbar{display:none}
        .scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}
      `}</style>

      {/* ══════════════════════════════════════
          PREMIUM HEADER
      ══════════════════════════════════════ */}
      <div style={{ background: "rgba(7,9,14,0.97)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {/* Top nav row */}
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "14px 16px" }}>
          {/* Logo + Verified badge */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {/* Left: Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg,#1a1200,#2d2000)", border: "1.5px solid rgba(212,175,55,0.35)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0, boxShadow: "0 0 20px rgba(212,175,55,0.1)" }}>
                {hotel.emoji}
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <p style={{ fontSize: 16, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>{hotel.name}</p>
                </div>
                <p style={{ fontSize: 10, fontWeight: 600, color: "#D4AF37", letterSpacing: "0.15em", textTransform: "uppercase", marginTop: 1 }}>Hotels &amp; Resorts</p>
              </div>
            </div>

            {/* Right: Verified + Rating */}
            <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 12, padding: "8px 12px", textAlign: "right" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
                <div style={{ width: 14, height: 14, borderRadius: "50%", background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 8, color: "#22c55e" }}>✓</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#22c55e" }}>Verified Hotel</span>
                <ShieldCheck size={12} style={{ color: "rgba(34,197,94,0.6)" }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Star size={10} fill="#D4AF37" color="#D4AF37" />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#D4AF37" }}>{hotel.avgRating}</span>
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>|</span>
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }}>{hotel.totalReviews > 0 ? `${(hotel.totalReviews / 1000).toFixed(1)}K+` : "2.4K+"} Reviews</span>
              </div>
            </div>
          </div>

          {/* Trust bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 0, marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            {[
              { icon: "🧾", label: "GST Certified" },
              { icon: "🛡️", label: `Trusted by 10K+ Hoteliers` },
              { icon: "🔒", label: "Secure & Encrypted" },
            ].map((item, i) => (
              <div key={i} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "4px 8px", borderRight: i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                <span style={{ fontSize: 11 }}>{item.icon}</span>
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Amenities horizontal scroll bar */}
        {hotel.amenities?.length > 0 && (
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)", padding: "10px 16px", maxWidth: 480, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>Hotel Amenities</span>
              <span style={{ fontSize: 10, color: "#D4AF37", fontWeight: 700 }}>View All</span>
            </div>
            <div className="scrollbar-hide" style={{ display: "flex", gap: 8, overflowX: "auto", whiteSpace: "nowrap", paddingBottom: 2 }}>
              {[...hotel.amenities, "Room Service", "Smart TV", "24/7 Reception"].slice(0, 8).map((a, i) => (
                <div key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 20, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", flexShrink: 0 }}>
                  <span style={{ color: "rgba(255,255,255,0.6)", display: "flex" }}>{getAmenityIcon(a)}</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", fontWeight: 600 }}>{a}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════
          PAGE BODY
      ══════════════════════════════════════ */}
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "14px 16px 0" }}>

        {/* AI Rate Lock banner (when negotiated) */}
        {negotiatedRate && (
          <div style={{ padding: "12px 14px", borderRadius: 14, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.3)", display: "flex", alignItems: "center", gap: 10, animation: "fadeUp 0.3s ease", marginBottom: 12 }}>
            <Zap size={16} style={{ color: "#22c55e", flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 800, color: "#22c55e" }}>AI Rate Lock Active ✓</p>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>₹{negotiatedRate.toLocaleString("en-IN")}/night · Token: {rateLockToken?.slice(-8)}</p>
            </div>
          </div>
        )}

        {/* POST-BOOKING IN-ROOM COMPANION CARD */}
        {submitted && bookingResult && (
          <div style={{ background: "linear-gradient(135deg,rgba(212,175,55,0.1),rgba(0,0,0,0.4))", border: "1px solid rgba(212,175,55,0.3)", borderRadius: 20, padding: "18px", marginBottom: 14, animation: "fadeUp 0.4s ease" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.35)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>✅</div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 900, color: "#22c55e" }}>Check-in Confirm!</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Room {bookingResult.roomNumber} · {bookingResult.guestName}</p>
              </div>
            </div>
            <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 14, padding: "12px 14px", marginBottom: 12, display: "flex", flexDirection: "column", gap: 7 }}>
              {[
                ["📋 Booking ID",  bookingResult.id?.slice(0, 14)],
                ["🛏 Room",        `Room ${bookingResult.roomNumber} (${bookingResult.roomType || "standard"})`],
                ["📅 Check-in",    bookingResult.checkInDate ? new Date(bookingResult.checkInDate).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) : "—"],
                ["📅 Check-out",   bookingResult.checkOutDate ? new Date(bookingResult.checkOutDate).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) : "—"],
                ["🌙 Nights",      `${bookingResult.nights || 1} raat`],
                ["💰 Total",       `₹${Number(bookingResult.totalAmount||0).toLocaleString("en-IN")}`],
              ].map(([label, val]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", fontFamily: label === "📋 Booking ID" ? "monospace" : "inherit" }}>{val}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 12, lineHeight: 1.5 }}>
              Aapka digital companion ready hai — Wi-Fi password, food order, room service, aur call desk — sab ek jagah.
            </p>
            <button
              onClick={() => setCompanionOpen(true)}
              style={{ width: "100%", padding: "14px", borderRadius: 14, background: "linear-gradient(135deg,#b8960c,#D4AF37,#F5C842)", border: "none", cursor: "pointer", color: "#000", fontSize: 14, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 20px rgba(212,175,55,0.35)", marginBottom: 8 }}
            >
              <Sparkles size={16} /> Open In-Room Companion
            </button>
            <button
              onClick={() => {
                try { localStorage.removeItem(`air_active_booking_${hotelId}`); } catch {}
                setActiveBooking(null); setSubmitted(false); setBookingResult(null); setCompanionOpen(false);
              }}
              style={{ width: "100%", padding: "10px", borderRadius: 12, background: "transparent", border: "1px solid rgba(239,68,68,0.2)", color: "rgba(239,68,68,0.5)", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
            >
              🚪 Check-out ho gaye? Session clear karo
            </button>
          </div>
        )}

        {/* ROOM ALLOCATOR + FORM — only show when no active booking */}
        {!activeBooking && <>

        {/* ── STEP 1: ROOM ALLOCATOR ── */}
        <div style={{ background: "rgba(8,14,8,0.95)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: 20, padding: "18px", marginBottom: 14, overflow: "hidden", position: "relative" }}>
          {/* Subtle grid texture */}
          <div style={{ position: "absolute", inset: 0, opacity: 0.015, backgroundImage: "linear-gradient(rgba(34,197,94,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(34,197,94,0.8) 1px,transparent 1px)", backgroundSize: "28px 28px", pointerEvents: "none" }} />

          {/* Section header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>
                <span style={{ color: "#D4AF37" }}>Step 1:</span> Choose Your Room
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e" }} />
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>Available</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", boxShadow: "0 0 6px #ef4444" }} />
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>Occupied</span>
              </div>
            </div>
          </div>

          {/* 4-column room grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {rooms.map((room, idx) => room
              ? <RoomKeycap key={room.id} room={room} selected={selectedRoom?.id === room.id} onClick={r => setSelectedRoom(prev => prev?.id === r.id ? null : r)} />
              : <div key={`ph${idx}`} style={{ aspectRatio: "1", borderRadius: 10, background: "rgba(255,255,255,0.008)", border: "1px dashed rgba(255,255,255,0.03)" }} />
            )}
          </div>

          {/* Full legend */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            {[{ c: "#22c55e", l: "Available" }, { c: "#D4AF37", l: "Reserved" }, { c: "#ef4444", l: "Occupied" }, { c: "#818cf8", l: "Cleaning" }].map(x => (
              <div key={x.l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: x.c, boxShadow: `0 0 4px ${x.c}` }} />
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>{x.l}</span>
              </div>
            ))}
          </div>

          {/* Selected room badge */}
          {selectedRoom && (
            <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 12, background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.3)", display: "flex", alignItems: "center", justifyContent: "space-between", animation: "fadeUp 0.3s ease" }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 800, color: "#D4AF37" }}>Room {selectedRoom.number} selected ✓</p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Floor {selectedRoom.floor} · {selectedRoom.type} · ₹{(negotiatedRate || selectedRoom.baseRate)?.toLocaleString("en-IN")}/raat</p>
              </div>
              <button onClick={() => setSelectedRoom(null)} style={{ width: 26, height: 26, borderRadius: 7, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", fontSize: 13, cursor: "pointer" }}>✕</button>
            </div>
          )}
        </div>

        {/* ── STEP 2: GUEST DETAILS ── */}
        <div style={{ background: "rgba(10,10,14,0.97)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "18px", marginBottom: 14 }}>

          {/* Step header + AI Scanner button */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>
              <span style={{ color: "#D4AF37" }}>Step 2:</span> Guest Details
            </p>
            <button
              onClick={() => { setScanSide("front"); startCamera(); }}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 12, background: "rgba(20,20,28,0.9)", border: "1.5px solid rgba(255,255,255,0.15)", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
            >
              <Camera size={14} style={{ color: "#60b8ff" }} />
              <span style={{ color: "rgba(255,255,255,0.8)" }}>AI ID Scanner</span>
            </button>
          </div>

          {/* Camera feed */}
          {scanStep === "camera" && (
            <div style={{ borderRadius: 16, overflow: "hidden", background: "#000", position: "relative", marginBottom: 16, border: "1px solid rgba(0,140,255,0.3)" }}>
              <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", maxHeight: 220, objectFit: "cover", display: "block" }} />
              <canvas ref={canvasRef} style={{ display: "none" }} />
              <div style={{ position: "absolute", inset: 0, border: "2px solid rgba(0,140,255,0.5)", borderRadius: 16, pointerEvents: "none" }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "10px 12px", background: "linear-gradient(transparent,rgba(0,0,0,0.8))", display: "flex", gap: 8, justifyContent: "center" }}>
                <button onClick={captureAndScan} style={{ flex: 1, padding: "11px", borderRadius: 12, background: "linear-gradient(135deg,#0050c8,#008cff)", border: "none", color: "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <Camera size={15} /> Scan Karo
                </button>
                <button onClick={() => { stopCamera(); setScanStep("idle"); }} style={{ padding: "11px 14px", borderRadius: 12, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}>✕</button>
              </div>
              <div style={{ position: "absolute", top: 10, left: 0, right: 0, textAlign: "center" }}>
                <span style={{ fontSize: 11, padding: "4px 12px", borderRadius: 10, background: "rgba(0,0,0,0.7)", color: "#60b8ff", fontWeight: 600 }}>
                  {scanSide === "front" ? "ID ka Front Side" : "ID ka Back Side"} frame mein rakho
                </span>
              </div>
            </div>
          )}

          {/* Scanner status rows */}
          {scanStep !== "camera" && (
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16, padding: "14px", borderRadius: 14, background: "linear-gradient(135deg,rgba(0,18,45,0.55),rgba(0,8,22,0.65))", border: "1px solid rgba(0,140,255,0.18)" }}>
              <AiReactor scanning={scanStep === "scanning"} progress={scanProgress} />
              <div style={{ flex: 1 }}>
                {scanStep === "idle" && (<>
                  <p style={{ fontSize: 13, fontWeight: 800, color: "#60b8ff", marginBottom: 3 }}>Aadhaar / PAN / Passport</p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.5, marginBottom: 8 }}>Camera se scan karo — form auto-fill ho jayega</p>
                  <button onClick={() => { setScanSide("front"); startCamera(); }} style={{ padding: "8px 14px", borderRadius: 10, background: "rgba(0,140,255,0.12)", border: "1px solid rgba(0,140,255,0.3)", color: "#60b8ff", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                    <Camera size={13} /> Camera Kholo
                  </button>
                </>)}
                {scanStep === "scanning" && (
                  <div style={{ animation: "fadeUp 0.3s ease" }}>
                    <p style={{ fontSize: 13, fontWeight: 800, color: "#60b8ff", marginBottom: 6 }}>AI Scan ho raha hai...</p>
                    <div style={{ height: 4, background: "rgba(0,140,255,0.15)", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${scanProgress}%`, background: "linear-gradient(90deg,#008cff,#60b8ff)", borderRadius: 4, transition: "width 0.3s ease" }} />
                    </div>
                    <p style={{ fontSize: 10, color: "rgba(0,140,255,0.6)", marginTop: 4 }}>Llama 4 Vision processing...</p>
                  </div>
                )}
                {scanStep === "done" && (
                  <div style={{ animation: "fadeUp 0.3s ease" }}>
                    <p style={{ fontSize: 13, fontWeight: 800, color: "#22c55e", marginBottom: 3 }}>✓ ID Scan Successful!</p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>{guestName} · {idType}</p>
                    {!backImage && (
                      <button onClick={() => { setScanSide("back"); startCamera(); setScanStep("camera"); }} style={{ padding: "7px 12px", borderRadius: 8, background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.3)", color: "#D4AF37", fontSize: 10, fontWeight: 700, cursor: "pointer", marginRight: 6 }}>
                        📷 Back Side Bhi Scan Karo
                      </button>
                    )}
                    <button onClick={resetScan} style={{ padding: "7px 12px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", fontSize: 10, cursor: "pointer" }}>
                      <RefreshCw size={10} style={{ display: "inline", marginRight: 4 }} />Reset
                    </button>
                  </div>
                )}
                {scanStep === "error" && (
                  <div style={{ animation: "fadeUp 0.3s ease" }}>
                    <p style={{ fontSize: 12, color: "#ef4444", marginBottom: 6 }}>{scanError || "Scan nahi hua."}</p>
                    <button onClick={() => { setScanStep("camera"); startCamera(); }} style={{ padding: "7px 12px", borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", fontSize: 10, cursor: "pointer", marginRight: 6 }}>Dobara Try Karo</button>
                    <button onClick={resetScan} style={{ padding: "7px 12px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", fontSize: 10, cursor: "pointer" }}>Skip Karo</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* GRC Form Fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Full Name + Mobile */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={labelStyle}>Full Name *</label>
                <div style={{ position: "relative" }}>
                  <input value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="Enter full name" style={{ ...inpStyle, paddingLeft: 36 }} />
                  <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.25)", fontSize: 14 }}>👤</span>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Mobile Number *</label>
                <div style={{ position: "relative" }}>
                  <input value={guestPhone} onChange={e => setGuestPhone(e.target.value)} placeholder="Enter number" type="tel" style={{ ...inpStyle, paddingLeft: 46 }} />
                  <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.25)", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>📞 +91</span>
                </div>
              </div>
            </div>

            {/* Check-in + Check-out */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={labelStyle}>Check-In *</label>
                <div style={{ position: "relative" }}>
                  <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} min={new Date().toISOString().split("T")[0]} style={{ ...inpStyle, paddingLeft: 36 }} />
                  <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.25)", fontSize: 13 }}>📅</span>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Check-Out *</label>
                <div style={{ position: "relative" }}>
                  <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} min={checkIn || new Date().toISOString().split("T")[0]} style={{ ...inpStyle, paddingLeft: 36 }} />
                  <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.25)", fontSize: 13 }}>📅</span>
                </div>
              </div>
            </div>

            {/* Gender + DOB */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={labelStyle}>Gender</label>
                <div style={{ position: "relative" }}>
                  <select value={gender} onChange={e => setGender(e.target.value)} style={{ ...inpStyle, paddingLeft: 36, appearance: "none" }}>
                    <option value="">Select gender</option><option>Male</option><option>Female</option><option>Other</option>
                  </select>
                  <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.25)", fontSize: 14 }}>👤</span>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Date of Birth</label>
                <div style={{ position: "relative" }}>
                  <input type="date" value={dob} onChange={e => setDob(e.target.value)} placeholder="DD / MM / YYYY" style={{ ...inpStyle, paddingLeft: 36 }} />
                  <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.25)", fontSize: 13 }}>📅</span>
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={labelStyle}>Email (Optional)</label>
              <div style={{ position: "relative" }}>
                <input type="email" placeholder="Enter email address" style={{ ...inpStyle, paddingLeft: 36 }} />
                <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.25)", fontSize: 13 }}>✉️</span>
              </div>
            </div>

            {/* Address */}
            <div>
              <label style={labelStyle}>Address</label>
              <div style={{ position: "relative" }}>
                <textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="Enter your address" rows={2} style={{ ...inpStyle, paddingLeft: 36, resize: "none", lineHeight: 1.5 }} />
                <span style={{ position: "absolute", left: 11, top: 13, color: "rgba(255,255,255,0.25)", fontSize: 13 }}>📍</span>
              </div>
            </div>

            {/* ID Type + ID Number */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={labelStyle}>ID Type</label>
                <select value={idType} onChange={e => setIdType(e.target.value)} style={{ ...inpStyle, appearance: "none" }}>
                  {["Aadhaar", "PAN", "Passport", "Driving License", "Voter ID"].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>ID Number</label>
                <input value={idNumber} onChange={e => setIdNumber(e.target.value)} placeholder="XXXX XXXX XXXX" style={inpStyle} />
              </div>
            </div>

            {/* Room Type + Payment */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {!selectedRoom && (
                <div>
                  <label style={labelStyle}>Room Type</label>
                  <select value={roomType} onChange={e => setRoomType(e.target.value)} style={{ ...inpStyle, appearance: "none" }}>
                    <option value="Standard Room">Standard — ₹{(hotel.standardRate || 1200).toLocaleString("en-IN")}/raat</option>
                    <option value="Deluxe Room">Deluxe — ₹{(hotel.deluxeRate || 2000).toLocaleString("en-IN")}/raat</option>
                    <option value="Suite Room">Suite — ₹{(hotel.suiteRate || 3800).toLocaleString("en-IN")}/raat</option>
                  </select>
                </div>
              )}
              <div style={selectedRoom ? { gridColumn: "1 / -1" } : {}}>
                <label style={labelStyle}>Payment Mode</label>
                <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)} style={{ ...inpStyle, appearance: "none" }}>
                  <option>Cash</option><option>UPI</option><option>Card</option><option>Online</option>
                </select>
              </div>
            </div>

            {/* Terms */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0" }}>
              <div style={{ width: 18, height: 18, borderRadius: 5, background: "rgba(212,175,55,0.15)", border: "1.5px solid rgba(212,175,55,0.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 11, color: "#D4AF37" }}>✓</span>
              </div>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>
                I agree to the <span style={{ color: "#D4AF37", textDecoration: "underline" }}>Terms &amp; Conditions</span> and <span style={{ color: "#D4AF37", textDecoration: "underline" }}>Privacy Policy</span>
              </p>
            </div>

            {/* Price summary */}
            {nights > 0 && (
              <div style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 14, padding: "14px 16px", animation: "fadeUp 0.3s ease" }}>
                {negotiatedRate && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 11, color: "#22c55e" }}>🔒 AI Negotiated Rate</span>
                    <span style={{ fontSize: 11, color: "#22c55e" }}>₹{negotiatedRate.toLocaleString("en-IN")}/night</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{selectedRoom ? `Room ${selectedRoom.number}` : roomType} × {nights} raat</span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>₹{roomRate.toLocaleString("en-IN")} × {nights}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: "1px solid rgba(212,175,55,0.15)" }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#D4AF37" }}>Total</span>
                  <span style={{ fontSize: 22, fontWeight: 900, color: "#D4AF37", textShadow: "0 0 16px rgba(212,175,55,0.4)" }}>₹{total.toLocaleString("en-IN")}</span>
                </div>
              </div>
            )}

            {/* Error */}
            {formError && (
              <div style={{ padding: "11px 14px", borderRadius: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444", fontSize: 12, animation: "fadeUp 0.2s ease" }}>⚠️ {formError}</div>
            )}

            {/* Success or CTA */}
            {submitted ? (
              <div style={{ textAlign: "center", padding: "22px", borderRadius: 16, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", animation: "fadeUp 0.4s ease" }}>
                <CheckCircle size={38} style={{ color: "#22c55e", margin: "0 auto 12px", display: "block" }} />
                <p style={{ fontSize: 16, fontWeight: 900, color: "#22c55e", marginBottom: 4 }}>Booking Confirm Ho Gayi! 🎉</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 10 }}>Room {bookingResult?.roomNumber || selectedRoom?.number || ""} aapke naam RESERVE ho gaya hai</p>
                <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 12, padding: "12px 14px", textAlign: "left" }}>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>📋 Booking ID: <span style={{ color: "rgba(255,255,255,0.7)", fontFamily: "monospace" }}>{bookingResult?.id?.slice(0, 12)}</span></p>
                  {rateLockToken && <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>🔒 Rate Lock Token: <span style={{ color: "#D4AF37", fontFamily: "monospace" }}>{rateLockToken}</span></p>}
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>🏨 Hotel team aapko <strong style={{ color: "#fff" }}>{guestPhone}</strong> par confirm karegi</p>
                </div>
              </div>
            ) : (
              <button
                onClick={handleBook}
                disabled={submitting}
                style={{ width: "100%", padding: "17px", borderRadius: 16, fontWeight: 900, fontSize: 15, background: submitting ? "rgba(212,175,55,0.3)" : "linear-gradient(135deg,#b8960c,#D4AF37,#F5C842)", color: "#000", border: "none", cursor: submitting ? "not-allowed" : "pointer", boxShadow: "0 6px 28px rgba(212,175,55,0.4)", display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: 20, paddingRight: 20 }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {submitting
                    ? <div style={{ width: 18, height: 18, borderRadius: "50%", border: "2.5px solid rgba(0,0,0,0.3)", borderTop: "2.5px solid #000", animation: "spinRingCW 0.8s linear infinite" }} />
                    : <Crown size={18} />
                  }
                  <span>{submitting ? "Saving..." : "Book Karo & Owner Ko Batao"}</span>
                </div>
                {!submitting && <ChevronRight size={20} />}
              </button>
            )}

            {/* Rate lock note */}
            <div style={{ display: "flex", gap: 8, padding: "10px 12px", borderRadius: 12, background: "rgba(0,140,255,0.04)", border: "1px solid rgba(0,140,255,0.1)" }}>
              <ShieldCheck size={13} style={{ color: "#60b8ff", flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", lineHeight: 1.5 }}>Direct booking se <strong style={{ color: "rgba(255,255,255,0.5)" }}>rate lock</strong> hota hai — OTA commission nahi lagta. Checkout tak rate change nahi hoga.</p>
            </div>
          </div>
        </div>

        </>} {/* end !activeBooking wrapper */}

        {/* LOCATION */}
        <div style={{ background: "rgba(6,8,15,0.98)", border: "1px solid rgba(255,255,255,0.055)", borderRadius: 18, padding: "16px", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: "rgba(0,140,255,0.1)", border: "1px solid rgba(0,140,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <MapPin size={16} style={{ color: "#60b8ff" }} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{hotel.name}</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{hotel.addressLine || hotel.location}</p>
              {hotel.distanceTag && <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 2 }}>📍 {hotel.distanceTag}</p>}
            </div>
          </div>
          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotel.name + " " + hotel.location)}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", padding: "11px", borderRadius: 12, background: "rgba(0,140,255,0.08)", border: "1px solid rgba(0,140,255,0.2)", color: "#60b8ff", fontSize: 11, fontWeight: 700, textDecoration: "none" }}>
            <Navigation size={11} /> Google Maps Pe Dekho
          </a>
        </div>

        {/* FAQ */}
        <FaqSection faqOpen={faqOpen} setFaqOpen={setFaqOpen} />

        {/* REPUTATION & TRUST */}
        <ReputationSection hotel={hotel} />

        {/* BOTTOM TRUST BADGES */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, padding: "12px 0 4px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          {[
            { icon: "🛡️", label: "Best Price Guarantee" },
            { icon: "⚡", label: "Instant Confirmation" },
            { icon: "🔒", label: "Secure Booking" },
          ].map((item, i) => (
            <div key={i} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "4px 8px", borderRight: i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
              <span style={{ fontSize: 12 }}>{item.icon}</span>
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>{item.label}</span>
            </div>
          ))}
        </div>

      </div>

      {/* ══════════════════════════════════════
          STICKY CTA BAR
      ══════════════════════════════════════ */}
      {!submitted && !activeBooking && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40, background: "rgba(7,9,14,0.97)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "12px 16px 16px" }}>
          <div style={{ maxWidth: 480, margin: "0 auto" }}>
            <button
              onClick={handleBook}
              disabled={submitting}
              style={{ width: "100%", padding: "16px 20px", borderRadius: 16, fontWeight: 900, fontSize: 15, background: submitting ? "rgba(212,175,55,0.3)" : "linear-gradient(135deg,#b8960c,#D4AF37,#F5C842)", color: "#000", border: "none", cursor: submitting ? "not-allowed" : "pointer", boxShadow: "0 6px 28px rgba(212,175,55,0.4)", display: "flex", alignItems: "center", justifyContent: "space-between" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {submitting
                  ? <div style={{ width: 18, height: 18, borderRadius: "50%", border: "2.5px solid rgba(0,0,0,0.3)", borderTop: "2.5px solid #000", animation: "spinRingCW 0.8s linear infinite" }} />
                  : <Crown size={18} />
                }
                <span>{submitting ? "Processing..." : "Book Karo & Owner Ko Batao"}</span>
              </div>
              {!submitting && <ChevronRight size={20} />}
            </button>
          </div>
        </div>
      )}

      {/* FLOATING SANDY BUTTON */}
      {!companionOpen && (
        <button
          onClick={() => setCompanionOpen(true)}
          style={{
            position: "fixed",
            bottom: submitted || activeBooking ? 20 : 84,
            right: 16,
            zIndex: 50,
            display: "flex", alignItems: "center", gap: 8,
            padding: "11px 16px", borderRadius: 28,
            background: "linear-gradient(135deg,#b8960c,#D4AF37)",
            border: "none", cursor: "pointer",
            boxShadow: "0 4px 20px rgba(212,175,55,0.45)",
            color: "#000", fontWeight: 900, fontSize: 12,
            animation: "goldPulse 2s infinite",
          }}
        >
          <Sparkles size={15} />
          <span>Sandy</span>
          <span style={{ fontSize: 9, fontWeight: 700, opacity: 0.7 }}>AI Concierge</span>
          <div style={{ position: "absolute", top: -2, right: -2, width: 10, height: 10, borderRadius: "50%", background: "#22c55e", border: "2px solid #07090E" }} />
        </button>
      )}

      {/* IN-ROOM COMPANION PANEL */}
      {companionOpen && (
        <InRoomCompanion
          hotel={hotel}
          bookingResult={bookingResult}
          messages={messages}
          chatInput={chatInput}
          setChatInput={setChatInput}
          chatLoading={chatLoading}
          negotiating={negotiating}
          sendChat={sendChat}
          checkIn={checkIn       || bookingResult?.checkInDate  || ""}
          checkOut={checkOut     || bookingResult?.checkOutDate || ""}
          selectedRoom={selectedRoom || (bookingResult?.roomNumber ? { number: bookingResult.roomNumber, type: bookingResult.roomType || "standard" } : null)}
          negotiatedRate={negotiatedRate || (bookingResult?.negotiated ? bookingResult.ratePerNight : null)}
          rateLockToken={rateLockToken  || bookingResult?.rateLockToken || null}
          nights={nights         || bookingResult?.nights        || 0}
          roomRate={roomRate     || bookingResult?.ratePerNight  || 0}
          activeRoomTypeKey={activeRoomTypeKey || bookingResult?.roomType || "standard"}
          chatEndRef={chatEndRef}
          onClose={() => setCompanionOpen(false)}
        />
      )}
    </div>
  );
}
