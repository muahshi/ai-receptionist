"use client";
import { useState } from "react";
import { Search, ChevronRight, Plus, X, Check, Eye, EyeOff, ArrowLeft } from "lucide-react";

// ── SCREEN STATES ─────────────────────────────────────────────
const S = {
  LIST:     "list",      // Hotel list — pick your hotel
  PIN:      "pin",       // Enter PIN for selected hotel
  REGISTER: "register",  // Register new hotel
};

// ── HOTEL REGISTRY: reads from localStorage + hardcoded demos ─
function getHotelRegistry() {
  if (typeof window === "undefined") return DEMO_HOTELS;
  try {
    const custom = JSON.parse(localStorage.getItem("gi_hotel_registry") || "[]");
    return [...DEMO_HOTELS, ...custom];
  } catch { return DEMO_HOTELS; }
}

function saveHotelToRegistry(hotel) {
  if (typeof window === "undefined") return;
  try {
    const custom = JSON.parse(localStorage.getItem("gi_hotel_registry") || "[]");
    const updated = custom.filter(h => h.id !== hotel.id);
    localStorage.setItem("gi_hotel_registry", JSON.stringify([...updated, hotel]));
  } catch {}
}

function saveHotelConfig(hotelId, config) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`air_${hotelId}_config`, JSON.stringify(config));
}

function generateHotelId(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 20) + "-" + Date.now().toString(36);
}

const PLAN_COLORS = {
  free:       { bg: "rgba(255,255,255,0.1)",   text: "#aaa",    label: "Free"       },
  starter:    { bg: "rgba(34,197,94,0.15)",    text: "#22c55e", label: "Starter"    },
  pro:        { bg: "rgba(212,175,55,0.2)",    text: "#D4AF37", label: "Pro"        },
  enterprise: { bg: "rgba(0,112,243,0.2)",     text: "#60a5fa", label: "Enterprise" },
};

const DEMO_HOTELS = [
  { id:"sunrise-jaipur",    name:"Hotel Sunrise",  location:"Jaipur, Rajasthan",     rooms:40,  plan:"pro",        emoji:"🏨", ownerPin:"1234", managerPin:"5678" },
  { id:"grand-mumbai",      name:"The Grand Inn",  location:"Mumbai, Maharashtra",   rooms:120, plan:"enterprise", emoji:"🏩", ownerPin:"2345", managerPin:"6789" },
  { id:"saffron-ahmedabad", name:"Saffron Stays",  location:"Ahmedabad, Gujarat",    rooms:25,  plan:"free",       emoji:"🏪", ownerPin:"3456", managerPin:"7890" },
  { id:"cherry-bhopal",     name:"Hotel Cherry",   location:"Bhopal, Madhya Pradesh",rooms:20,  plan:"pro",        emoji:"🍒", ownerPin:"4567", managerPin:"8901" },
];

// ─────────────────────────────────────────────────────────────
export default function LoginScreen({ onLogin }) {
  const [screen,      setScreen]     = useState(S.LIST);
  const [query,       setQuery]      = useState("");
  const [selHotel,    setSelHotel]   = useState(null);
  const [role,        setRole]       = useState("manager");
  const [pin,         setPin]        = useState("");
  const [pinError,    setPinError]   = useState("");
  const [pinLoading,  setPinLoading] = useState(false);

  // Registration form state
  const [reg, setReg] = useState({
    name:"", location:"", rooms:"20", ownerPin:"", managerPin:"",
    ownerPhone:"", plan:"starter", emoji:"🏨",
  });
  const [regError,   setRegError]   = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [regDone,    setRegDone]    = useState(false);

  const hotels   = getHotelRegistry();
  const filtered = hotels.filter(h =>
    h.name.toLowerCase().includes(query.toLowerCase()) ||
    h.location.toLowerCase().includes(query.toLowerCase())
  );

  // ── SELECT HOTEL ────────────────────────────────────────────
  const handleSelectHotel = (hotel) => {
    setSelHotel(hotel);
    setPin(""); setPinError("");
    setScreen(S.PIN);
  };

  // ── PIN LOGIN ───────────────────────────────────────────────
  const handlePinLogin = async () => {
    if (pin.length < 4) return;
    setPinLoading(true); setPinError("");
    await new Promise(r => setTimeout(r, 500));

    const correctPin = role === "owner" ? selHotel.ownerPin : selHotel.managerPin;
    if (pin === correctPin) {
      // Save session with THIS hotel's id
      const user = {
        hotelId:   selHotel.id,
        hotelName: selHotel.name,
        role,
        loginAt:   new Date().toISOString(),
      };
      localStorage.setItem("air_current_user", JSON.stringify(user));
      localStorage.setItem("air_active_hotel", selHotel.id);
      if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
      onLogin(user);
    } else {
      setPinError("Galat PIN! Dobara try karo.");
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      setPin("");
    }
    setPinLoading(false);
  };

  const addPinDigit = (d) => pin.length < 4 && setPin(p => p + d);
  const delPinDigit = ()     => setPin(p => p.slice(0, -1));

  // ── REGISTER NEW HOTEL ──────────────────────────────────────
  const handleRegister = async () => {
    if (!reg.name.trim())      { setRegError("Hotel ka naam zaroori hai."); return; }
    if (!reg.location.trim())  { setRegError("Location zaroori hai."); return; }
    if (!reg.ownerPin || reg.ownerPin.length < 4)   { setRegError("Owner PIN minimum 4 digits chahiye."); return; }
    if (!reg.managerPin || reg.managerPin.length < 4){ setRegError("Manager PIN minimum 4 digits chahiye."); return; }
    if (reg.ownerPin === reg.managerPin) { setRegError("Owner aur Manager ka PIN alag hona chahiye."); return; }

    setRegLoading(true); setRegError("");
    await new Promise(r => setTimeout(r, 800));

    const hotelId = generateHotelId(reg.name);
    const hotel = {
      id:         hotelId,
      name:       reg.name.trim(),
      location:   reg.location.trim(),
      rooms:      parseInt(reg.rooms) || 20,
      plan:       reg.plan,
      emoji:      reg.emoji,
      ownerPin:   reg.ownerPin,
      managerPin: reg.managerPin,
      ownerPhone: reg.ownerPhone,
      createdAt:  new Date().toISOString(),
    };

    // Save to registry + save full config
    saveHotelToRegistry(hotel);
    saveHotelConfig(hotelId, {
      ...hotel,
      totalRooms:   hotel.rooms,
      currency:     "₹",
      gstPercent:   12,
      checkoutTime: "11:00",
      rates:        { standard: 1500, deluxe: 2500, suite: 4500 },
    });

    if (navigator.vibrate) navigator.vibrate([50, 30, 100]);
    setRegDone(true);
    setRegLoading(false);

    // After 2s, go back to list — new hotel will appear
    setTimeout(() => {
      setRegDone(false);
      setReg({ name:"", location:"", rooms:"20", ownerPin:"", managerPin:"", ownerPhone:"", plan:"starter", emoji:"🏨" });
      setScreen(S.LIST);
    }, 2500);
  };

  // ════════════════════════════════════════════════════════════
  // SCREEN: HOTEL LIST
  // ════════════════════════════════════════════════════════════
  if (screen === S.LIST) return (
    <div className="min-h-screen px-4 py-6 safe-top safe-bottom" style={{ background: "#0A0A0A" }}>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.2)" }}>
          🏨
        </div>
        <div>
          <h1 className="font-black text-lg text-white" style={{ letterSpacing: "-0.02em" }}>The GuestInn</h1>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em" }}>AI-POWERED HOTEL MANAGEMENT</p>
        </div>
      </div>

      <h2 className="font-black text-2xl text-white mb-1" style={{ letterSpacing: "-0.02em" }}>
        Apna Hotel Chuniye
      </h2>
      <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,0.4)" }}>
        {hotels.length} registered {hotels.length === 1 ? "property" : "properties"}
      </p>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2"
          style={{ color: "rgba(255,255,255,0.3)" }} />
        <input
          value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Hotel ya city search karo..."
          className="inp w-full pl-10 pr-4 py-3 text-sm"
        />
      </div>

      {/* Hotel Cards */}
      <div className="space-y-2 mb-4">
        {filtered.length === 0 ? (
          <div className="card rounded-2xl p-8 text-center">
            <p className="text-4xl mb-2">🔍</p>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>"{query}" nahi mila</p>
          </div>
        ) : filtered.map(hotel => {
          const plan = PLAN_COLORS[hotel.plan] || PLAN_COLORS.free;
          return (
            <button key={hotel.id} onClick={() => handleSelectHotel(hotel)}
              className="w-full card rounded-2xl p-4 flex items-center gap-3 text-left transition-all active:scale-98"
              style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
              {/* Emoji avatar */}
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                {hotel.emoji || "🏨"}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm truncate">{hotel.name}</span>
                  <span className="px-1.5 py-0.5 rounded-md text-xs font-semibold flex-shrink-0"
                    style={{ background: plan.bg, color: plan.text, fontSize: 9 }}>
                    {plan.label}
                  </span>
                </div>
                <p className="text-xs mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.4)" }}>
                  📍 {hotel.location}
                </p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
                  {hotel.rooms} rooms
                </p>
              </div>

              <ChevronRight size={16} style={{ color: "rgba(255,255,255,0.2)", flexShrink: 0 }} />
            </button>
          );
        })}
      </div>

      {/* Register new hotel CTA */}
      <button onClick={() => setScreen(S.REGISTER)}
        className="w-full card rounded-2xl p-4 flex items-center justify-center gap-2 transition-all active:scale-98"
        style={{ border: "1px dashed rgba(212,175,55,0.3)" }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(212,175,55,0.12)" }}>
          <Plus size={16} style={{ color: "#D4AF37" }} />
        </div>
        <div className="text-left">
          <p className="text-sm font-semibold" style={{ color: "#D4AF37" }}>Naya hotel add karna hai?</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Register karein →</p>
        </div>
      </button>
    </div>
  );

  // ════════════════════════════════════════════════════════════
  // SCREEN: PIN LOGIN
  // ════════════════════════════════════════════════════════════
  if (screen === S.PIN) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 safe-top safe-bottom"
      style={{ background: "#0A0A0A" }}>

      {/* Back */}
      <button onClick={() => { setScreen(S.LIST); setPin(""); setPinError(""); }}
        className="absolute top-6 left-4 w-10 h-10 card rounded-xl flex items-center justify-center safe-top">
        <ArrowLeft size={18} style={{ color: "rgba(255,255,255,0.5)" }} />
      </button>

      {/* Hotel avatar */}
      <div className="mb-6 text-center fade-up">
        <div className="w-20 h-20 rounded-3xl mx-auto mb-4 flex items-center justify-center text-4xl"
          style={{ background: "linear-gradient(135deg,#1a1200,#2e2000)", border: "1px solid rgba(212,175,55,0.3)", boxShadow: "0 0 30px rgba(212,175,55,0.15)" }}>
          {selHotel?.emoji || "🏨"}
        </div>
        <h2 className="font-black text-2xl" style={{ color: "#D4AF37", letterSpacing: "-0.02em" }}>
          {selHotel?.name}
        </h2>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
          📍 {selHotel?.location}
        </p>
      </div>

      {/* Role Toggle */}
      <div className="w-full max-w-xs card p-1 rounded-2xl flex mb-6 fade-up">
        {["manager", "owner"].map(r => (
          <button key={r} onClick={() => { setRole(r); setPin(""); setPinError(""); }}
            className="flex-1 py-3 rounded-xl text-sm font-bold transition-all capitalize"
            style={role === r
              ? { background: "linear-gradient(135deg,#b8960c,#D4AF37,#F5C842)", color: "#000" }
              : { color: "#555" }}>
            {r === "owner" ? "👑 Owner" : "🔑 Manager"}
          </button>
        ))}
      </div>

      {/* PIN Dots */}
      <div className="w-full max-w-xs card rounded-2xl p-5 mb-4 fade-up">
        <p className="text-xs text-center uppercase tracking-widest mb-4"
          style={{ color: "rgba(255,255,255,0.35)" }}>ENTER PIN</p>
        <div className="flex justify-center gap-4">
          {[0, 1, 2, 3].map(i => (
            <div key={i}
              className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200"
              style={i < pin.length
                ? { background: "rgba(212,175,55,0.2)", border: "2px solid #D4AF37", boxShadow: "0 0 12px rgba(212,175,55,0.3)" }
                : { background: "rgba(255,255,255,0.04)", border: "2px solid rgba(255,255,255,0.1)" }}>
              {i < pin.length && <div className="w-3 h-3 rounded-full" style={{ background: "#D4AF37" }} />}
            </div>
          ))}
        </div>
        {pinError && (
          <p className="text-red-400 text-xs text-center mt-3 fade-up">{pinError}</p>
        )}
      </div>

      {/* Keypad */}
      <div className="w-full max-w-xs grid grid-cols-3 gap-3 fade-up">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => (
          <button key={d} onClick={() => addPinDigit(String(d))}
            className="card py-4 rounded-2xl text-xl font-bold text-white transition-all active:scale-90 active:bg-white/10">
            {d}
          </button>
        ))}
        <button onClick={delPinDigit}
          className="card py-4 rounded-2xl text-xl text-gray-500 transition-all active:scale-90 flex items-center justify-center">
          ⌫
        </button>
        <button onClick={() => addPinDigit("0")}
          className="card py-4 rounded-2xl text-xl font-bold text-white transition-all active:scale-90 active:bg-white/10">
          0
        </button>
        <button onClick={handlePinLogin} disabled={pin.length < 4 || pinLoading}
          className="py-4 rounded-2xl font-bold text-sm flex items-center justify-center transition-all"
          style={pin.length >= 4 && !pinLoading
            ? { background: "linear-gradient(135deg,#b8960c,#D4AF37,#F5C842)", color: "#000", boxShadow: "0 4px 20px rgba(212,175,55,0.35)" }
            : { background: "rgba(255,255,255,0.06)", color: "#444" }}>
          {pinLoading
            ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            : "Login"}
        </button>
      </div>

      <p className="text-xs mt-8" style={{ color: "rgba(255,255,255,0.15)" }}>
        The GuestInn AI v2.0 • Powered by Groq
      </p>
    </div>
  );

  // ════════════════════════════════════════════════════════════
  // SCREEN: REGISTER NEW HOTEL
  // ════════════════════════════════════════════════════════════
  if (screen === S.REGISTER) return (
    <div className="min-h-screen px-4 py-6 safe-top safe-bottom" style={{ background: "#0A0A0A" }}>

      {/* Back */}
      <button onClick={() => { setScreen(S.LIST); setRegError(""); }}
        className="flex items-center gap-2 mb-6 text-sm"
        style={{ color: "rgba(255,255,255,0.5)" }}>
        <ArrowLeft size={16} /> Wapas jaao
      </button>

      <h2 className="font-black text-2xl text-white mb-1" style={{ letterSpacing: "-0.02em" }}>
        Naya Hotel Register Karo
      </h2>
      <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.4)" }}>
        Apni details bharo — 2 minute mein ready ho jayega
      </p>

      {/* Success State */}
      {regDone && (
        <div className="card rounded-2xl p-8 text-center mb-4 fade-up"
          style={{ border: "1px solid rgba(34,197,94,0.3)", background: "rgba(34,197,94,0.06)" }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 lock-seal"
            style={{ background: "rgba(34,197,94,0.15)", border: "2px solid rgba(34,197,94,0.4)" }}>
            <Check size={28} style={{ color: "#22c55e" }} />
          </div>
          <h3 className="font-black text-xl text-white mb-1">Hotel Register Ho Gaya! 🎉</h3>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
            {reg.name} ab hotel list mein dikh raha hai
          </p>
        </div>
      )}

      {!regDone && (
        <div className="space-y-3">
          {regError && (
            <div className="px-4 py-3 rounded-xl text-sm text-red-400"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
              {regError}
            </div>
          )}

          {/* Hotel emoji picker */}
          <div className="card rounded-2xl p-4">
            <p className="text-xs uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>
              Hotel Avatar Chuno
            </p>
            <div className="flex gap-2 flex-wrap">
              {["🏨","🏩","🏪","🏰","🏯","🏛️","🌴","⭐","🍒","🌺","💎","🔱"].map(e => (
                <button key={e} onClick={() => setReg(r => ({ ...r, emoji: e }))}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all"
                  style={reg.emoji === e
                    ? { background: "rgba(212,175,55,0.25)", border: "2px solid #D4AF37" }
                    : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Basic Info */}
          <div className="card rounded-2xl p-4 space-y-3">
            <p className="text-xs uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>
              🏨 Basic Info
            </p>
            <RegField label="Hotel Ka Naam *" value={reg.name}
              onChange={v => setReg(r => ({ ...r, name: v }))} ph="e.g. Hotel Sunrise" />
            <RegField label="City / Location *" value={reg.location}
              onChange={v => setReg(r => ({ ...r, location: v }))} ph="e.g. Jaipur, Rajasthan" />
            <div className="grid grid-cols-2 gap-2">
              <RegField label="Total Rooms" value={reg.rooms} type="number"
                onChange={v => setReg(r => ({ ...r, rooms: v }))} ph="20" />
              <RegField label="Owner Phone" value={reg.ownerPhone} type="tel"
                onChange={v => setReg(r => ({ ...r, ownerPhone: v }))} ph="+91 9999999999" />
            </div>
          </div>

          {/* Plan Selection */}
          <div className="card rounded-2xl p-4">
            <p className="text-xs uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>
              📋 Plan
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id:"free",    label:"Free",        desc:"Up to 10 rooms",   price:"₹0" },
                { id:"starter", label:"Starter",     desc:"Up to 20 rooms",   price:"₹999/mo" },
                { id:"pro",     label:"Pro",          desc:"Up to 100 rooms",  price:"₹2,499/mo" },
                { id:"enterprise",label:"Enterprise", desc:"Unlimited rooms",  price:"Custom" },
              ].map(p => {
                const pc = PLAN_COLORS[p.id];
                return (
                  <button key={p.id} onClick={() => setReg(r => ({ ...r, plan: p.id }))}
                    className="p-3 rounded-xl text-left transition-all"
                    style={reg.plan === p.id
                      ? { background: pc.bg, border: `1.5px solid ${pc.text}` }
                      : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <p className="font-bold text-xs text-white">{p.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{p.desc}</p>
                    <p className="text-xs font-semibold mt-1" style={{ color: pc.text }}>{p.price}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* PIN Setup */}
          <div className="card rounded-2xl p-4 space-y-3">
            <p className="text-xs uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>
              🔐 Login PINs Set Karo
            </p>
            <div className="px-3 py-2.5 rounded-xl text-xs" style={{ background: "rgba(0,112,243,0.08)", border: "1px solid rgba(0,112,243,0.2)", color: "rgba(255,255,255,0.6)" }}>
              ℹ️ Owner aur Manager ke liye alag-alag 4-digit PIN banao. Ye baad mein settings mein change ho sakta hai.
            </div>
            <PinSetField label="👑 Owner PIN (4 digits)" value={reg.ownerPin}
              onChange={v => setReg(r => ({ ...r, ownerPin: v.replace(/\D/g,"").slice(0,4) }))} />
            <PinSetField label="🔑 Manager PIN (4 digits)" value={reg.managerPin}
              onChange={v => setReg(r => ({ ...r, managerPin: v.replace(/\D/g,"").slice(0,4) }))} />
          </div>

          {/* Submit */}
          <button onClick={handleRegister} disabled={regLoading}
            className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all"
            style={{ background: "linear-gradient(135deg,#b8960c,#D4AF37,#F5C842)", color: "#000", boxShadow: "0 4px 24px rgba(212,175,55,0.4)" }}>
            {regLoading
              ? <><div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />Registering...</>
              : "🚀 Hotel Register Karo"}
          </button>

          <p className="text-xs text-center pb-4" style={{ color: "rgba(255,255,255,0.2)" }}>
            Register karne ke baad hotel list mein dikh jayega
          </p>
        </div>
      )}
    </div>
  );

  return null;
}

// ── Field components ──────────────────────────────────────────
function RegField({ label, value, onChange, ph, type = "text" }) {
  return (
    <div>
      <label className="block text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={ph} className="inp w-full px-3 py-2.5 text-sm"
        style={{ colorScheme: "dark" }} />
    </div>
  );
}

function PinSetField({ label, value, onChange }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</label>
      <div className="relative">
        <input type={show ? "text" : "password"} value={value} onChange={e => onChange(e.target.value)}
          placeholder="• • • •" maxLength={4}
          className="inp w-full px-3 py-2.5 text-sm pr-10 font-mono tracking-widest"
          style={{ colorScheme: "dark", letterSpacing: "0.3em" }} />
        <button onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2">
          {show
            ? <EyeOff size={14} style={{ color: "rgba(255,255,255,0.3)" }} />
            : <Eye size={14} style={{ color: "rgba(255,255,255,0.3)" }} />}
        </button>
      </div>
      {value.length > 0 && value.length < 4 && (
        <p className="text-xs mt-1" style={{ color: "rgba(239,68,68,0.7)" }}>
          {4 - value.length} aur digit chahiye
        </p>
      )}
      {value.length === 4 && (
        <p className="text-xs mt-1" style={{ color: "#22c55e" }}>✓ PIN ready</p>
      )}
    </div>
  );
}
