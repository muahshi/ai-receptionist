"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import {
  Send, MessageCircle, X, MapPin, Star, ShieldCheck,
  Navigation, Camera, RefreshCw, CheckCircle, Zap,
  UtensilsCrossed, Sparkles, Phone, ChevronDown, ChevronUp,
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
            // Phase 1 fields
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
      // Phase 1 fields from localStorage config key
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
    { id: "hotel-cherry",    name: "Hotel Cherry",           location: "Peer Gate, Bhopal, MP",  totalRooms: 20, ownerPhone: "919009109108", emoji: "🍒", standardRate: 1200, deluxeRate: 2000, suiteRate: 3800, minFloorPrice: 900,  addressLine: "Peer Gate Area, Bhopal - 462001",        distanceTag: "900m from Bus Stand",    amenities: ["Free Wi-Fi","AC Rooms","Geyser"], avgRating: 4.5, totalReviews: 128, wifiPassword: "cherry@2024", menuText: "Dal Fry ₹120 | Paneer Butter Masala ₹180 | Roti ₹15 | Rice ₹60 | Tea ₹20 | Coffee ₹30", menuUrl: "", receptionPhone: "919009109108", enableWifi: true, enableFoodOrdering: true, enableHousekeeping: true },
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
   SAVE BOOKING
═══════════════════════════════════════════ */

/* ═══════════════════════════════════════════
   SAVE BOOKING — FIXED: Single atomic entry point
   
   ROOT CAUSE OF SYNC BUG:
   Previous version wrote to localStorage here, THEN called createBooking()
   which wrote again — double-write race condition caused state drift across
   Dashboard, Guests, and Reports tabs.
   
   FIX: This function is now a thin orchestrator. It calls createBooking()
   from lib/db.js which is the ONLY place that touches localStorage, rooms,
   and BroadcastChannel. No pre-writing here.
═══════════════════════════════════════════ */
async function saveBooking(booking, hotelId) {
  try {
    // Single atomic call — lib/db.js handles:
    //   1. localStorage write (instant)
    //   2. Room status update (localStorage + broadcast)
    //   3. BroadcastChannel fire (all tabs: Dashboard, Guests, Reports)
    //   4. Supabase insert (background, non-blocking)
    const { createBooking } = await import("../../../lib/db");
    await createBooking(hotelId, {
      ...booking,
      isPublicBooking: true,   // marks source as "marketplace", room as "reserved"
    });
  } catch (e) {
    console.warn("[saveBooking] createBooking error:", e.message);
    // Hard fallback: direct Supabase REST if dynamic import fails entirely
    // localStorage is NOT written here — we don't want duplicate state
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
        // Minimal localStorage write in fallback — only if createBooking failed
        try {
          const key  = `air_${hotelId}_bookings`;
          const list = JSON.parse(localStorage.getItem(key) || "[]");
          if (!list.find(b => b.id === booking.id)) {
            localStorage.setItem(key, JSON.stringify([{
              ...booking, source: "marketplace", status: "active",
            }, ...list]));
          }
          // Minimal broadcast in fallback
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

  // Push notification to staff dashboard — separate from data sync
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
   ROOM KEYCAP
═══════════════════════════════════════════ */
function RoomKeycap({ room, selected, onClick }) {
  const colorMap = { vacant: "#22c55e", reserved: "#D4AF37", occupied: "#ef4444", cleaning: "#818cf8" };
  const c = colorMap[room.status] || "#22c55e";
  return (
    <button
      onClick={() => onClick(room)}
      style={{
        aspectRatio: "1/1.05", borderRadius: 6,
        background: selected ? `rgba(${c === "#22c55e" ? "34,197,94" : c === "#D4AF37" ? "212,175,55" : c === "#ef4444" ? "239,68,68" : "129,140,248"},0.2)` : "rgba(255,255,255,0.04)",
        border: `1px solid ${selected ? c : "rgba(255,255,255,0.07)"}`,
        cursor: room.status === "occupied" ? "not-allowed" : "pointer",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
        transition: "all 0.15s ease", outline: "none", padding: 2,
        boxShadow: selected ? `0 0 8px ${c}55` : "none",
      }}
    >
      <div style={{ width: 5, height: 5, borderRadius: "50%", background: c, boxShadow: `0 0 4px ${c}` }} />
      <span style={{ fontSize: 7, color: "rgba(255,255,255,0.5)", fontFamily: "monospace", fontWeight: 700 }}>
        {String(room.number).padStart(2, "0")}
      </span>
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

      {/* Order via Sandy nudge */}
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
    // 1. Push notification to staff
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
    // 2. Log to Supabase service_requests + broadcast to staff dashboard
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
            room_number: String(bookingResult?.roomNumber || ""),
            guest_name:  bookingResult?.guestName || "",
            action_id:   action.id,
            title:       `Room ${bookingResult?.roomNumber || "?"} — ${action.label}`,
            message:     action.msg,
            status:      "pending",
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
                background: sent
                  ? "rgba(34,197,94,0.1)"
                  : "rgba(255,255,255,0.04)",
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

  const handleServiceRequest = (action) => {
    // Optionally log or echo in chat
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", flexDirection: "column", background: "linear-gradient(180deg,#0d111e,#060810)", animation: "slideUp 0.3s cubic-bezier(0.16,1,0.3,1) forwards" }}>
      {/* Header */}
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

      {/* Wi-Fi strip — always visible if password is set */}
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

      {/* Tab Bar */}
      <CompanionTabBar activeTab={activeTab} setActiveTab={setActiveTab} hotel={hotel} />

      {/* Tab Content */}
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

/* Chat Tab — extracted from original inline chat panel */
function ChatTab({ messages, chatInput, setChatInput, chatLoading, negotiating, sendChat, checkIn, checkOut, selectedRoom, negotiatedRate, rateLockToken, nights, roomRate, activeRoomTypeKey, chatEndRef }) {
  return (
    <>
      {/* Booking context strip */}
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

      {/* Quick chips */}
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
  // Persistent guest session — survives page refresh
  const [activeBooking, setActiveBooking] = useState(null);

  const [negotiatedRate, setNegotiatedRate] = useState(null);
  const [rateLockToken,  setRateLockToken]  = useState(null);
  const [negotiating,    setNegotiating]    = useState(false);

  // Companion panel (replaces old chat panel — now tabbed)
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
    fetchHotel(hotelId).then(h => {
      setHotel(h);
      if (h) setRooms(getRooms(hotelId, h.totalRooms));
      // ── Persistent guest session: check for active booking in localStorage ──
      try {
        const stored = localStorage.getItem(`air_active_booking_${hotelId}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Only restore if booking is still active (not checked_out)
          if (parsed && parsed.id && parsed.status !== "checked_out") {
            setActiveBooking(parsed);
            setBookingResult(parsed);
            setSubmitted(true);
            setCompanionOpen(true);
          }
        }
      } catch {}
      setPageLoading(false);
    });
  }, [hotelId]);

  useEffect(() => {
    if (hotel && messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: `Namaste! 🙏 Main ${hotel.name} ka AI Concierge Sandy hoon.\n\nAap puchh sakte ho:\n• 📶 Wi-Fi password\n• 🍽️ Menu & food order\n• 🏨 Room service requests\n• 💰 Rates & discount negotiate\n\nKya main aapki help kar sakta hoon? 😊`,
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
    const bid        = `BK${Date.now().toString(36).toUpperCase()}`;
    const roomId     = selectedRoom?.id     || `${hotelId}_AUTO`;
    const roomNumber = selectedRoom?.number || "—";
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
      roomType:       activeRoomTypeKey,
      checkInDate:    checkIn,
      checkOutDate:   checkOut,
      nights,
      ratePerNight:   roomRate,
      totalAmount:    total,
      paymentMode,
      rateLocked:     true,
      negotiated:     !!negotiatedRate,
      negotiatedFrom: negotiatedRate ? (selectedRoom?.baseRate || hotel?.standardRate || 0) : 0,
      rateLockToken:  rateLockToken || null,
      source:         "marketplace",
      createdAt:      new Date().toISOString(),
    };
    await saveBooking(booking, hotelId);

    // UI: room color update karo instantly (display only)
    if (selectedRoom) {
      setRooms(prev => prev.map(r =>
        r.id === selectedRoom.id
          ? { ...r, status: "reserved", currentBookingId: bid, guestName: booking.guestName }
          : r
      ));
    }

    try {
      const { sendBookingAlerts } = await import("../../../lib/alerts");
      await sendBookingAlerts(booking);
    } catch {}

    const result = { ...booking, roomNumber };
    // ── Persist active booking to localStorage — survives refresh ──
    try {
      localStorage.setItem(`air_active_booking_${hotelId}`, JSON.stringify(result));
    } catch {}
    setActiveBooking(result);
    setBookingResult(result);
    setSubmitted(true);
    setCompanionOpen(true);   // auto-open companion after booking
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
    // Inject hotel config (incl. wifi/menu) into context for Phase 3 — already structured here
    const bookingContextBlock = (checkIn || checkOut || selectedRoom)
      ? `\n\n[CURRENT BOOKING CONTEXT: Check-in: ${checkIn || "not set"}, Check-out: ${checkOut || "not set"}, Nights: ${nights || 0}, Room: ${selectedRoom ? `Room ${selectedRoom.number} (${activeRoomTypeKey})` : roomType}, Rate: ₹${roomRate}/night${negotiatedRate ? `, NEGOTIATED RATE LOCKED: ₹${negotiatedRate} (Token: ${rateLockToken})` : ""}]`
      : "";
    try {
      const res = await fetch("/api/groq", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "chat",
          // Phase 3: pass hotelId so backend can do Supabase enrichment if needed
          hotelId,
          hotelConfig: {
            name:               hotel?.name,
            location:           hotel?.location,
            standardRate:       hotel?.standardRate,
            deluxeRate:         hotel?.deluxeRate,
            suiteRate:          hotel?.suiteRate,
            minFloorPrice:      hotel?.minFloorPrice,
            rates:              { standard: hotel?.standardRate, deluxe: hotel?.deluxeRate, suite: hotel?.suiteRate },
            // Phase 1 + Phase 3 fields — full context for Sandy's system prompt
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

  if (pageLoading) return (
    <div style={{ minHeight: "100vh", background: "#07090E", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 50, height: 50, borderRadius: "50%", border: "2px solid rgba(0,140,255,0.3)", borderTop: "2px solid #008cff", animation: "spinRingCW 1s linear infinite" }} />
      <style>{`@keyframes spinRingCW{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if (!hotel) return (
    <div style={{ minHeight: "100vh", background: "#07090E", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "rgba(255,255,255,0.3)" }}>Hotel not found</p>
    </div>
  );

  const inpStyle   = { width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "11px 13px", fontSize: 13, color: "#fff", outline: "none", boxSizing: "border-box", colorScheme: "dark" };
  const labelStyle = { fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 5 };

  const vacantN = rooms.filter(r => r.status === "vacant").length;
  const byFloor = rooms.reduce((acc, r) => { (acc[r.floor] = acc[r.floor] || []).push(r); return acc; }, {});
  const floors  = Object.keys(byFloor).map(Number).sort((a, b) => a - b);

  return (
    <div style={{ minHeight: "100vh", background: "#07090E", color: "#fff", fontFamily: "system-ui,-apple-system,sans-serif", paddingBottom: 90 }}>
      <style>{`
        @keyframes spinRingCW  {from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes holoPulse   {0%,100%{filter:drop-shadow(0 0 12px #008cff) drop-shadow(0 0 28px rgba(0,140,255,0.4))}50%{filter:drop-shadow(0 0 22px #00aaff) drop-shadow(0 0 55px rgba(0,160,255,0.65))}}
        @keyframes audioBar    {0%,100%{height:4px}50%{height:16px}}
        @keyframes fadeUp      {from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideUp     {from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes dotBounce   {0%,80%,100%{transform:scale(0.4);opacity:0.3}40%{transform:scale(1);opacity:1}}
        @keyframes greenPulse  {0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0.4)}50%{box-shadow:0 0 0 6px rgba(34,197,94,0)}}
        @keyframes goldPulse   {0%,100%{box-shadow:0 0 0 0 rgba(212,175,55,0.5)}50%{box-shadow:0 0 0 8px rgba(212,175,55,0)}}
        input:focus,select:focus,textarea:focus{border-color:rgba(212,175,55,0.5)!important;background:rgba(212,175,55,0.04)!important}
        input::placeholder,textarea::placeholder{color:rgba(255,255,255,0.2)}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:rgba(212,175,55,0.15);border-radius:3px}
      `}</style>

      {/* NAV */}
      <nav style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(7,9,14,0.94)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#1a1400,#2d2200)", border: "1px solid rgba(212,175,55,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{hotel.emoji}</div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{hotel.name}</p>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{hotel.location}</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {hotel.avgRating > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 8, background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)" }}>
              <Star size={11} fill="#D4AF37" color="#D4AF37" />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#D4AF37" }}>{hotel.avgRating}</span>
            </div>
          )}
        </div>
      </nav>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "16px 16px 0" }}>

        {/* HOTEL HERO CARD */}
        <div style={{ background: "linear-gradient(135deg,rgba(212,175,55,0.07),rgba(0,0,0,0.3))", border: "1px solid rgba(212,175,55,0.18)", borderRadius: 20, padding: "18px", marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 900, color: "#fff", marginBottom: 4 }}>{hotel.name}</h1>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <MapPin size={11} style={{ color: "#D4AF37" }} />
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{hotel.addressLine || hotel.location}</span>
              </div>
              {hotel.distanceTag && <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 3 }}>📍 {hotel.distanceTag}</p>}
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Starts from</p>
              <p style={{ fontSize: 20, fontWeight: 900, color: "#D4AF37" }}>₹{(hotel.standardRate || 1200).toLocaleString("en-IN")}</p>
              <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>per night</p>
            </div>
          </div>

          {negotiatedRate && (
            <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.3)", display: "flex", alignItems: "center", gap: 8, animation: "fadeUp 0.3s ease", marginTop: 8 }}>
              <Zap size={14} style={{ color: "#22c55e", flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 12, fontWeight: 800, color: "#22c55e" }}>AI Rate Lock Active ✓</p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>₹{negotiatedRate.toLocaleString("en-IN")}/night · Token: {rateLockToken?.slice(-8)}</p>
              </div>
            </div>
          )}

          {hotel.amenities?.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 10 }}>
              {hotel.amenities.map(a => (
                <span key={a} style={{ fontSize: 10, padding: "4px 9px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>{a}</span>
              ))}
            </div>
          )}
        </div>

        {/* POST-BOOKING IN-ROOM COMPANION CARD */}
        {submitted && bookingResult && (
          <div style={{ background: "linear-gradient(135deg,rgba(212,175,55,0.1),rgba(0,0,0,0.4))", border: "1px solid rgba(212,175,55,0.3)", borderRadius: 20, padding: "16px", marginBottom: 12, animation: "fadeUp 0.4s ease" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.35)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>✅</div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 900, color: "#22c55e" }}>Check-in Confirm!</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Room {bookingResult.roomNumber} · {bookingResult.guestName}</p>
              </div>
            </div>
            {/* Booking details — visible anytime, survives refresh */}
            <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 12, padding: "12px 14px", marginBottom: 12, display: "flex", flexDirection: "column", gap: 6 }}>
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
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 10, lineHeight: 1.5 }}>
              Aapka digital companion ready hai — Wi-Fi password, food order, room service, aur call desk — sab ek jagah.
            </p>
            <button
              onClick={() => setCompanionOpen(true)}
              style={{
                width: "100%", padding: "14px", borderRadius: 14,
                background: "linear-gradient(135deg,#b8960c,#D4AF37,#F5C842)",
                border: "none", cursor: "pointer",
                color: "#000", fontSize: 14, fontWeight: 900,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: "0 4px 20px rgba(212,175,55,0.35)",
                marginBottom: 8,
              }}
            >
              <Sparkles size={16} /> Open In-Room Companion
            </button>
            {/* Checkout clear — removes persistent session */}
            <button
              onClick={() => {
                try { localStorage.removeItem(`air_active_booking_${hotelId}`); } catch {}
                setActiveBooking(null); setSubmitted(false); setBookingResult(null);
                setCompanionOpen(false);
              }}
              style={{
                width: "100%", padding: "10px", borderRadius: 12,
                background: "transparent", border: "1px solid rgba(239,68,68,0.2)",
                color: "rgba(239,68,68,0.5)", fontSize: 11, fontWeight: 600, cursor: "pointer",
              }}
            >
              🚪 Check-out ho gaye? Session clear karo
            </button>
          </div>
        )}

        {/* ROOM ALLOCATOR + FORM — only show when no active booking */}
        {!activeBooking && <>}
        <div style={{ background: "linear-gradient(135deg,rgba(5,15,8,0.9),rgba(2,10,4,0.95))", border: "1px solid rgba(34,197,94,0.15)", borderRadius: 20, padding: "16px", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.45)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Visual Room Allocator</p>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e" }} />
              <span style={{ fontSize: 9, color: "#22c55e", fontWeight: 700 }}>{vacantN} Available</span>
            </div>
          </div>

          {floors.map(floor => {
            const fr = byFloor[floor]; const cols = 5;
            const padded = [...fr]; while (padded.length % cols !== 0) padded.push(null);
            const rowArr = []; for (let i = 0; i < padded.length; i += cols) rowArr.push(padded.slice(i, i + cols));
            return (
              <div key={floor} style={{ marginBottom: 4 }}>
                {rowArr.map((row, ri) => (
                  <div key={ri} style={{ display: "flex", alignItems: "flex-end", gap: 4, marginBottom: 4 }}>
                    <span style={{ fontSize: 7, color: "rgba(255,255,255,0.18)", width: 14, textAlign: "right", flexShrink: 0, fontWeight: 700, paddingBottom: 4, fontFamily: "monospace" }}>{ri === 0 ? String(floor).padStart(2, "0") : ""}</span>
                    <div style={{ flex: 1, display: "grid", gridTemplateColumns: `repeat(${cols},1fr)`, gap: 4 }}>
                      {row.map((room, ci) => room
                        ? <RoomKeycap key={room.id} room={room} selected={selectedRoom?.id === room.id} onClick={r => setSelectedRoom(prev => prev?.id === r.id ? null : r)} />
                        : <div key={`ph${ci}`} style={{ aspectRatio: "1/1.05", borderRadius: 6, background: "rgba(255,255,255,0.008)", border: "1px dashed rgba(255,255,255,0.03)" }} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}

          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px", marginTop: 10, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            {[{ c: "#22c55e", l: "Available" }, { c: "#D4AF37", l: "Reserved" }, { c: "#ef4444", l: "Occupied" }, { c: "#818cf8", l: "Cleaning" }].map(x => (
              <div key={x.l} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: x.c, boxShadow: `0 0 4px ${x.c}` }} />
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>{x.l}</span>
              </div>
            ))}
          </div>

          {selectedRoom && (
            <div style={{ marginTop: 10, padding: "10px 12px", borderRadius: 12, background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.3)", display: "flex", alignItems: "center", justifyContent: "space-between", animation: "fadeUp 0.3s ease" }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: 800, color: "#D4AF37" }}>Room {selectedRoom.number} selected ✓</p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Floor {selectedRoom.floor} · {selectedRoom.type} · ₹{(negotiatedRate || selectedRoom.baseRate)?.toLocaleString("en-IN")}/raat</p>
              </div>
              <button onClick={() => setSelectedRoom(null)} style={{ width: 24, height: 24, borderRadius: 6, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", fontSize: 12, cursor: "pointer" }}>✕</button>
            </div>
          )}
        </div>

        {/* AI ID SCANNER */}
        <div style={{ background: "linear-gradient(135deg,rgba(0,18,45,0.55),rgba(0,8,22,0.65))", border: "1px solid rgba(0,140,255,0.18)", borderRadius: 20, padding: "16px", marginBottom: 12, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, opacity: 0.025, backgroundImage: "linear-gradient(rgba(0,140,255,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(0,140,255,0.8) 1px,transparent 1px)", backgroundSize: "22px 22px", pointerEvents: "none" }} />
          <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.45)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>📷 AI ID Scanner</p>

          {scanStep === "camera" && (
            <div style={{ borderRadius: 16, overflow: "hidden", background: "#000", position: "relative", marginBottom: 12, border: "1px solid rgba(0,140,255,0.3)" }}>
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

          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: scanStep === "camera" ? 0 : 14 }}>
            <AiReactor scanning={scanStep === "scanning"} progress={scanProgress} />
            <div style={{ flex: 1 }}>
              {scanStep === "idle" && (<>
                <p style={{ fontSize: 13, fontWeight: 800, color: "#60b8ff", marginBottom: 4 }}>Aadhaar / PAN / Passport</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.5, marginBottom: 8 }}>Camera se scan karo — form auto-fill ho jayega</p>
                <button onClick={() => { setScanSide("front"); startCamera(); }} style={{ padding: "9px 14px", borderRadius: 10, background: "rgba(0,140,255,0.12)", border: "1px solid rgba(0,140,255,0.3)", color: "#60b8ff", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                  <Camera size={13} /> Camera Kholo
                </button>
              </>)}
              {scanStep === "scanning" && (
                <div style={{ animation: "fadeUp 0.3s ease" }}>
                  <p style={{ fontSize: 13, fontWeight: 800, color: "#60b8ff", marginBottom: 4 }}>AI Scan ho raha hai...</p>
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
                  <button onClick={() => { setScanStep("camera"); startCamera(); }} style={{ padding: "7px 12px", borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", fontSize: 10, cursor: "pointer", marginRight: 6 }}>
                    Dobara Try Karo
                  </button>
                  <button onClick={resetScan} style={{ padding: "7px 12px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", fontSize: 10, cursor: "pointer" }}>Skip Karo</button>
                </div>
              )}
            </div>
          </div>

          {/* GRC Form Fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div><label style={labelStyle}>Guest Name *</label><input value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="Suresh Kumar" style={inpStyle} /></div>
              <div><label style={labelStyle}>Phone *</label><input value={guestPhone} onChange={e => setGuestPhone(e.target.value)} placeholder="9876543210" type="tel" style={inpStyle} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div><label style={labelStyle}>Check-In *</label><input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} min={new Date().toISOString().split("T")[0]} style={inpStyle} /></div>
              <div><label style={labelStyle}>Check-Out *</label><input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} min={checkIn || new Date().toISOString().split("T")[0]} style={inpStyle} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div><label style={labelStyle}>ID Type</label>
                <select value={idType} onChange={e => setIdType(e.target.value)} style={inpStyle}>
                  {["Aadhaar", "PAN", "Passport", "Driving License", "Voter ID"].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div><label style={labelStyle}>ID Number</label><input value={idNumber} onChange={e => setIdNumber(e.target.value)} placeholder="XXXX XXXX XXXX" style={inpStyle} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div><label style={labelStyle}>Gender</label>
                <select value={gender} onChange={e => setGender(e.target.value)} style={inpStyle}>
                  <option value="">Select</option><option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
              <div><label style={labelStyle}>Date of Birth</label><input type="date" value={dob} onChange={e => setDob(e.target.value)} style={inpStyle} /></div>
            </div>
            <div><label style={labelStyle}>Address</label><textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="Full address..." rows={2} style={{ ...inpStyle, resize: "none", lineHeight: 1.5 }} /></div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {!selectedRoom && (
                <div><label style={labelStyle}>Room Type</label>
                  <select value={roomType} onChange={e => setRoomType(e.target.value)} style={inpStyle}>
                    <option value="Standard Room">Standard — ₹{(hotel.standardRate || 1200).toLocaleString("en-IN")}/raat</option>
                    <option value="Deluxe Room">Deluxe — ₹{(hotel.deluxeRate || 2000).toLocaleString("en-IN")}/raat</option>
                    <option value="Suite Room">Suite — ₹{(hotel.suiteRate || 3800).toLocaleString("en-IN")}/raat</option>
                  </select>
                </div>
              )}
              <div><label style={labelStyle}>Payment Mode</label>
                <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)} style={inpStyle}>
                  <option>Cash</option><option>UPI</option><option>Card</option><option>Online</option>
                </select>
              </div>
            </div>

            {nights > 0 && (
              <div style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 12, padding: "12px 14px", animation: "fadeUp 0.3s ease" }}>
                {negotiatedRate && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 10, color: "#22c55e" }}>🔒 AI Negotiated Rate</span>
                    <span style={{ fontSize: 10, color: "#22c55e" }}>₹{negotiatedRate.toLocaleString("en-IN")}/night</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{selectedRoom ? `Room ${selectedRoom.number}` : roomType} × {nights} raat</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>₹{roomRate.toLocaleString("en-IN")} × {nights}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#D4AF37" }}>Total</span>
                  <span style={{ fontSize: 20, fontWeight: 900, color: "#D4AF37", textShadow: "0 0 16px rgba(212,175,55,0.4)" }}>₹{total.toLocaleString("en-IN")}</span>
                </div>
              </div>
            )}

            {formError && (
              <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444", fontSize: 12, animation: "fadeUp 0.2s ease" }}>⚠️ {formError}</div>
            )}

            {submitted ? (
              <div style={{ textAlign: "center", padding: "20px", borderRadius: 16, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", animation: "fadeUp 0.4s ease" }}>
                <CheckCircle size={36} style={{ color: "#22c55e", margin: "0 auto 10px", display: "block" }} />
                <p style={{ fontSize: 15, fontWeight: 800, color: "#22c55e", marginBottom: 4 }}>Booking Confirm Ho Gayi! 🎉</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>Room {bookingResult?.roomNumber || selectedRoom?.number || ""} aapke naam RESERVE ho gaya hai</p>
                <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 10, padding: "10px 12px", textAlign: "left" }}>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>📋 Booking ID: <span style={{ color: "rgba(255,255,255,0.7)", fontFamily: "monospace" }}>{bookingResult?.id?.slice(0, 12)}</span></p>
                  {rateLockToken && <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>🔒 Rate Lock Token: <span style={{ color: "#D4AF37", fontFamily: "monospace" }}>{rateLockToken}</span></p>}
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>🏨 Hotel team aapko <strong style={{ color: "#fff" }}>{guestPhone}</strong> par confirm karegi</p>
                </div>
              </div>
            ) : (
              <button onClick={handleBook} disabled={submitting} style={{ width: "100%", padding: "15px", borderRadius: 14, fontWeight: 900, fontSize: 14, background: submitting ? "rgba(212,175,55,0.3)" : "linear-gradient(135deg,#b8960c,#D4AF37,#F5C842)", color: "#000", border: "none", cursor: submitting ? "not-allowed" : "pointer", boxShadow: "0 4px 24px rgba(212,175,55,0.35)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {submitting ? <><div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(0,0,0,0.3)", borderTop: "2px solid #000", animation: "spinRingCW 0.8s linear infinite" }} /> Saving...</> : "📱 Book Karo & Owner Ko Batao"}
              </button>
            )}

            <div style={{ display: "flex", gap: 8, padding: "10px 12px", borderRadius: 10, background: "rgba(0,140,255,0.04)", border: "1px solid rgba(0,140,255,0.1)" }}>
              <ShieldCheck size={13} style={{ color: "#60b8ff", flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", lineHeight: 1.5 }}>Direct booking se <strong style={{ color: "rgba(255,255,255,0.5)" }}>rate lock</strong> hota hai — OTA commission nahi lagta. Checkout tak rate change nahi hoga.</p>
            </div>
          </div>
        </div>

        </>} {/* end !activeBooking wrapper */}

        {/* LOCATION */}
        <div style={{ background: "rgba(6,8,15,0.98)", border: "1px solid rgba(255,255,255,0.055)", borderRadius: 16, padding: "14px", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(0,140,255,0.1)", border: "1px solid rgba(0,140,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <MapPin size={15} style={{ color: "#60b8ff" }} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{hotel.name}</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{hotel.addressLine || hotel.location}</p>
            </div>
          </div>
          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotel.name + " " + hotel.location)}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", padding: "10px", borderRadius: 10, background: "rgba(0,140,255,0.08)", border: "1px solid rgba(0,140,255,0.2)", color: "#60b8ff", fontSize: 11, fontWeight: 700, textDecoration: "none" }}>
            <Navigation size={11} /> Google Maps Pe Dekho
          </a>
        </div>

        {/* FAQ */}
        <FaqSection faqOpen={faqOpen} setFaqOpen={setFaqOpen} />

      </div>

      {/* FLOATING COMPANION BUTTON — always visible once hotel loaded */}
      {!companionOpen && (
        <button
          onClick={() => setCompanionOpen(true)}
          style={{
            position: "fixed", bottom: 20, right: 18, zIndex: 50,
            display: "flex", alignItems: "center", gap: 8,
            padding: "12px 16px", borderRadius: 28,
            background: "linear-gradient(135deg,#b8960c,#D4AF37)",
            border: "none", cursor: "pointer",
            boxShadow: "0 4px 20px rgba(212,175,55,0.45)",
            color: "#000", fontWeight: 900, fontSize: 12,
            animation: "goldPulse 2s infinite",
          }}
        >
          <Sparkles size={16} />
          {submitted ? "Room Services" : "Sandy — AI Concierge"}
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
          checkIn={checkIn}
          checkOut={checkOut}
          selectedRoom={selectedRoom}
          negotiatedRate={negotiatedRate}
          rateLockToken={rateLockToken}
          nights={nights}
          roomRate={roomRate}
          activeRoomTypeKey={activeRoomTypeKey}
          chatEndRef={chatEndRef}
          onClose={() => setCompanionOpen(false)}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   FAQ COMPONENT
═══════════════════════════════════════════ */
function FaqSection({ faqOpen, setFaqOpen }) {
  const faqs = [
    { q: "Check-in / Check-out time?",    a: "Check-in: 12:00 PM | Check-out: 11:00 AM. Early check-in availability pe depend karta hai." },
    { q: "Direct booking ka fayda?",       a: "Rate lock hota hai — OTA commission nahi lagta (18% savings), aur checkout tak rate change nahi hoga." },
    { q: "AI Negotiator kya hota hai?",    a: "AI Negotiator se aap directly discount negotiate kar sakte ho. Agar requested rate hotel ke floor price se upar hai, toh automatically approve ho jata hai aur rate lock token milta hai." },
    { q: "Payment kab?",                   a: "Check-in ke time hotel reception pe — Cash ya UPI accepted hai." },
    { q: "Cancellation policy?",           a: "24 ghante pehle cancellation bilkul free hai. Uske baad ek raat ka charge lagega." },
  ];
  return (
    <div style={{ background: "rgba(6,8,15,0.98)", border: "1px solid rgba(255,255,255,0.055)", borderRadius: 16, overflow: "hidden", marginBottom: 14 }}>
      <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.12em", textTransform: "uppercase" }}>Aksar Puche Sawal</p>
      </div>
      {faqs.map((f, i) => (
        <div key={i} style={{ borderBottom: i < faqs.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
          <button onClick={() => setFaqOpen(faqOpen === i ? null : i)} style={{ width: "100%", padding: "13px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: 600, flex: 1, paddingRight: 12 }}>{f.q}</span>
            <span style={{ fontSize: 16, color: "#D4AF37", transition: "transform 0.2s", transform: faqOpen === i ? "rotate(45deg)" : "none", flexShrink: 0, display: "inline-block" }}>+</span>
          </button>
          {faqOpen === i && <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.6, padding: "0 14px 13px", animation: "fadeUp 0.2s ease" }}>{f.a}</p>}
        </div>
      ))}
    </div>
  );
}
