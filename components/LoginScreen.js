"use client";
import { useState, useEffect } from "react";
import { getHotelRegistry } from "../lib/hotelConfig";

// ─── Sample hotels for demo (in production, fetched from Supabase) ─────────────
const DEMO_HOTELS = [
  {
    id: "sunrise-jaipur",
    name: "Hotel Sunrise",
    location: "Jaipur, Rajasthan",
    totalRooms: 40,
    plan: "pro",
    emoji: "🏨",
    ownerPin: "1234",
    managerPin: "5678",
  },
  {
    id: "grand-mumbai",
    name: "The Grand Inn",
    location: "Mumbai, Maharashtra",
    totalRooms: 120,
    plan: "enterprise",
    emoji: "🏩",
    ownerPin: "2345",
    managerPin: "6789",
  },
  {
    id: "saffron-ahmedabad",
    name: "Saffron Stays",
    location: "Ahmedabad, Gujarat",
    totalRooms: 25,
    plan: "free",
    emoji: "🏪",
    ownerPin: "3456",
    managerPin: "7890",
  },
];

const PLAN_BADGE = {
  free:       { label: "Free",       bg: "rgba(255,255,255,0.08)",     color: "#666" },
  pro:        { label: "Pro",        bg: "rgba(212,175,55,0.15)",      color: "#D4AF37" },
  enterprise: { label: "Enterprise", bg: "rgba(0,112,243,0.15)",       color: "#0070F3" },
};

// ─── Screens ─────────────────────────────────────────────────────────────────
const SCREEN = { SELECT: "select", PIN: "pin" };

export default function LoginScreen({ onLogin }) {
  const [screen,  setScreen]  = useState(SCREEN.SELECT);
  const [hotels,  setHotels]  = useState([]);
  const [selected, setSelected] = useState(null);
  const [role,    setRole]    = useState("manager");
  const [pin,     setPin]     = useState("");
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [search,  setSearch]  = useState("");

  // Load hotels — merge registry (localStorage) with demo hotels
  useEffect(() => {
    const registry = getHotelRegistry();
    const merged = [
      ...DEMO_HOTELS,
      ...registry.filter((r) => !DEMO_HOTELS.find((d) => d.id === r.id)),
    ];
    setHotels(merged);
  }, []);

  const filteredHotels = hotels.filter(
    (h) =>
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      (h.location || "").toLowerCase().includes(search.toLowerCase())
  );

  // ── Select hotel & go to PIN screen ──
  const handleSelectHotel = (hotel) => {
    setSelected(hotel);
    setPin("");
    setError("");
    setRole("manager");
    setScreen(SCREEN.PIN);
  };

  // ── PIN login ──
  const handleLogin = async () => {
    if (pin.length < 4) return;
    setLoading(true);
    setError("");

    await new Promise((r) => setTimeout(r, 500)); // tactile delay

    const validPin =
      role === "owner"
        ? selected.ownerPin || "1234"
        : selected.managerPin || "5678";

    if (pin === validPin) {
      const user = {
        role,
        hotelId: selected.id,
        hotelName: selected.name,
        loginAt: new Date().toISOString(),
      };
      localStorage.setItem("air_current_user", JSON.stringify(user));
      // Save active hotel config key for db.js to use
      localStorage.setItem("air_active_hotel", selected.id);
      if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
      onLogin(user);
    } else {
      setError("Galat PIN! Dobara try karo.");
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      setPin("");
    }
    setLoading(false);
  };

  const addDigit = (d) => pin.length < 4 && setPin((p) => p + d);
  const delDigit = () => setPin((p) => p.slice(0, -1));

  // ─────────────────────────────────────────────────────────────────────────────
  // SCREEN 1: Hotel Selector
  // ─────────────────────────────────────────────────────────────────────────────
  if (screen === SCREEN.SELECT) {
    return (
      <div
        className="flex flex-col safe-top safe-bottom"
        style={{ height: "100dvh", background: "#0A0A0A" }}
      >
        {/* Header */}
        <div className="px-4 pt-6 pb-4 flex-shrink-0">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-6">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg,#1a1200,#2a1f00)",
                border: "1px solid rgba(212,175,55,0.35)",
              }}
            >
              <svg width="22" height="22" viewBox="0 0 40 40" fill="none">
                <path
                  d="M20 4L6 14v22h28V14L20 4z"
                  stroke="#D4AF37"
                  strokeWidth="2"
                  fill="rgba(212,175,55,0.1)"
                />
                <path d="M15 36V24h10v12" stroke="#D4AF37" strokeWidth="2" />
                <circle cx="20" cy="10" r="2" fill="#D4AF37" />
              </svg>
            </div>
            <div>
              <p
                className="font-black text-lg"
                style={{ color: "#D4AF37", letterSpacing: "-0.02em" }}
              >
                The GuestInn
              </p>
              <p
                className="text-gray-600"
                style={{ fontSize: 9, letterSpacing: "0.12em" }}
              >
                AI-POWERED HOTEL MANAGEMENT
              </p>
            </div>
          </div>

          <h2 className="text-white font-black text-2xl mb-1">
            Apna Hotel Chuniye
          </h2>
          <p className="text-gray-500 text-sm mb-4">
            {hotels.length} registered properties
          </p>

          {/* Search */}
          <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#555"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Hotel ya city search karo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-white text-sm outline-none"
              style={{ "::placeholder": { color: "#444" } }}
            />
          </div>
        </div>

        {/* Hotel list */}
        <div className="flex-1 scroll-y px-4 space-y-2 pb-6">
          {filteredHotels.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-gray-600 text-sm">Koi hotel nahi mila</p>
            </div>
          ) : (
            filteredHotels.map((hotel) => {
              const badge = PLAN_BADGE[hotel.plan] || PLAN_BADGE.free;
              return (
                <button
                  key={hotel.id}
                  onClick={() => handleSelectHotel(hotel)}
                  className="w-full text-left card rounded-2xl p-4 flex items-center gap-3 active:scale-[0.98] transition-all"
                  style={{ border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  {/* Emoji avatar */}
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{
                      background:
                        "linear-gradient(135deg, #1a1200, #0d0d0d)",
                      border: "1px solid rgba(212,175,55,0.15)",
                    }}
                  >
                    {hotel.emoji || "🏨"}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p
                        className="font-bold text-white text-sm truncate"
                        style={{ letterSpacing: "-0.01em" }}
                      >
                        {hotel.name}
                      </p>
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-md font-semibold flex-shrink-0"
                        style={{
                          background: badge.bg,
                          color: badge.color,
                        }}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <p className="text-gray-500 text-xs truncate">
                      📍 {hotel.location || "India"}
                    </p>
                    <p className="text-gray-600 text-xs mt-0.5">
                      {hotel.totalRooms} rooms
                    </p>
                  </div>

                  {/* Arrow */}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#333"
                    strokeWidth="2"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              );
            })
          )}

          {/* Add new hotel CTA */}
          <div
            className="rounded-2xl p-4 text-center mt-4"
            style={{
              background: "rgba(212,175,55,0.04)",
              border: "1px dashed rgba(212,175,55,0.2)",
            }}
          >
            <p className="text-gray-600 text-sm mb-2">
              Naya hotel add karna hai?
            </p>
            <a
              href="https://theguestinn.com"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold"
              style={{ color: "#D4AF37" }}
            >
              Register karein →
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SCREEN 2: PIN Entry
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div
      className="flex flex-col items-center justify-center px-6 safe-top safe-bottom"
      style={{ height: "100dvh", background: "#0A0A0A" }}
    >
      {/* Back */}
      <div className="absolute top-12 left-4">
        <button
          onClick={() => { setScreen(SCREEN.SELECT); setPin(""); setError(""); }}
          className="w-10 h-10 card rounded-xl flex items-center justify-center"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#D4AF37"
            strokeWidth="2"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Hotel Info */}
      <div className="text-center mb-7 fade-up">
        <div
          className="w-20 h-20 rounded-3xl mx-auto mb-3 flex items-center justify-center text-4xl"
          style={{
            background: "linear-gradient(135deg,#1a1200,#2a1f00)",
            border: "1px solid rgba(212,175,55,0.3)",
            boxShadow: "0 0 30px rgba(212,175,55,0.12)",
          }}
        >
          {selected?.emoji || "🏨"}
        </div>
        <h2
          className="font-black text-2xl"
          style={{ color: "#D4AF37", letterSpacing: "-0.02em" }}
        >
          {selected?.name}
        </h2>
        <p className="text-gray-600 text-xs mt-1">
          📍 {selected?.location}
        </p>
      </div>

      {/* Role Toggle */}
      <div className="w-full max-w-xs card p-1 rounded-2xl flex mb-5 fade-up">
        {["manager", "owner"].map((r) => (
          <button
            key={r}
            onClick={() => { setRole(r); setPin(""); setError(""); }}
            className="flex-1 py-3 rounded-xl text-sm font-bold transition-all capitalize"
            style={
              role === r
                ? {
                    background:
                      "linear-gradient(135deg,#b8960c,#D4AF37,#F5C842)",
                    color: "#000",
                  }
                : { color: "#555" }
            }
          >
            {r === "owner" ? "👑 Owner" : "🔑 Manager"}
          </button>
        ))}
      </div>

      {/* PIN dots */}
      <div className="w-full max-w-xs card rounded-2xl p-4 mb-4 fade-up">
        <p className="text-gray-600 text-xs text-center uppercase tracking-widest mb-3">
          Enter PIN
        </p>
        <div className="flex justify-center gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all"
              style={
                i < pin.length
                  ? {
                      background: "rgba(212,175,55,0.2)",
                      border: "2px solid #D4AF37",
                    }
                  : {
                      background: "rgba(255,255,255,0.04)",
                      border: "2px solid rgba(255,255,255,0.1)",
                    }
              }
            >
              {i < pin.length && (
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ background: "#D4AF37" }}
                />
              )}
            </div>
          ))}
        </div>
        {error && (
          <p className="text-red-400 text-xs text-center mt-3 fade-up">
            {error}
          </p>
        )}
      </div>

      {/* Numpad */}
      <div className="w-full max-w-xs grid grid-cols-3 gap-3 fade-up">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
          <button
            key={d}
            onClick={() => addDigit(String(d))}
            className="card py-4 rounded-2xl text-xl font-bold text-white active:scale-90 transition-all active:bg-white/10"
          >
            {d}
          </button>
        ))}

        {/* Delete */}
        <button
          onClick={delDigit}
          className="card py-4 rounded-2xl text-gray-500 text-xl active:scale-90 transition-all flex items-center justify-center"
        >
          ⌫
        </button>

        {/* 0 */}
        <button
          onClick={() => addDigit("0")}
          className="card py-4 rounded-2xl text-xl font-bold text-white active:scale-90 transition-all active:bg-white/10"
        >
          0
        </button>

        {/* Login */}
        <button
          onClick={handleLogin}
          disabled={pin.length < 4 || loading}
          className="py-4 rounded-2xl font-bold text-sm flex items-center justify-center transition-all"
          style={
            pin.length >= 4 && !loading
              ? {
                  background:
                    "linear-gradient(135deg,#b8960c,#D4AF37,#F5C842)",
                  color: "#000",
                  boxShadow: "0 4px 20px rgba(212,175,55,0.35)",
                }
              : { background: "rgba(255,255,255,0.06)", color: "#444" }
          }
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
          ) : (
            "Login"
          )}
        </button>
      </div>

      <p className="text-gray-800 text-xs mt-8">
        The GuestInn AI v2.0 • Powered by Groq
      </p>
    </div>
  );
}
