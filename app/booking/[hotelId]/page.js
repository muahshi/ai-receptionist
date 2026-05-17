/**
 * /booking/[hotelId] — Direct Hotel Login Page
 * Hotel staff/owner is link se seedha apne hotel ka PIN screen dekhta hai.
 * e.g. yourapp.vercel.app/booking/hotel-amardeep-mp9unyer
 */
"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw } from "lucide-react";

const PLAN_LABELS = { free:"Free", starter:"Starter", pro:"Pro", enterprise:"Enterprise" };
const PLAN_COLORS = {
  free:       { bg:"rgba(255,255,255,0.08)", text:"#777"    },
  starter:    { bg:"rgba(34,197,94,0.15)",   text:"#22c55e" },
  pro:        { bg:"rgba(212,175,55,0.2)",   text:"#D4AF37" },
  enterprise: { bg:"rgba(0,112,243,0.2)",    text:"#60a5fa" },
};

export default function BookingDirectPage() {
  const { hotelId } = useParams();
  const router      = useRouter();

  const [hotel,      setHotel]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [notFound,   setNotFound]   = useState(false);
  const [role,       setRole]       = useState("manager");
  const [pin,        setPin]        = useState("");
  const [pinError,   setPinError]   = useState("");
  const [pinLoading, setPinLoading] = useState(false);

  // ── Load hotel data ──────────────────────────────────────────
  useEffect(() => {
    if (!hotelId) { setNotFound(true); setLoading(false); return; }
    loadHotel();
  }, [hotelId]);

  async function loadHotel() {
    setLoading(true);
    // 1. Try Supabase directly
    const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (sbUrl && sbKey && sbUrl !== "undefined") {
      try {
        const res = await fetch(
          `${sbUrl}/rest/v1/hotels?id=eq.${encodeURIComponent(hotelId)}&select=id,name,location,total_rooms,plan,emoji,owner_pin,manager_pin`,
          { headers: { "apikey": sbKey, "Authorization": `Bearer ${sbKey}`, "Content-Type": "application/json" } }
        );
        if (res.ok) {
          const data = await res.json();
          if (data?.length > 0) {
            const h = data[0];
            const hotel = {
              id: h.id, name: h.name, location: h.location,
              totalRooms: h.total_rooms || 20, plan: h.plan || "starter",
              emoji: h.emoji || "🏨", ownerPin: h.owner_pin, managerPin: h.manager_pin,
            };
            // Cache locally for offline
            try { localStorage.setItem(`air_${hotel.id}_config`, JSON.stringify({ ...hotel, currency:"₹" })); } catch {}
            setHotel(hotel);
            setLoading(false);
            return;
          }
        }
      } catch (e) { console.warn("Supabase fetch failed:", e.message); }
    }

    // 2. localStorage cache
    try {
      const cached = localStorage.getItem(`air_${hotelId}_config`);
      if (cached) { setHotel(JSON.parse(cached)); setLoading(false); return; }

      // 3. localStorage registry
      const registry = JSON.parse(localStorage.getItem("gi_hotel_registry") || "[]");
      const found = registry.find(h => h.id === hotelId);
      if (found) { setHotel(found); setLoading(false); return; }

      // 4. Registry cache
      const cache = JSON.parse(localStorage.getItem("gi_hotel_registry_cache") || "[]");
      const cachedH = cache.find(h => h.id === hotelId);
      if (cachedH) { setHotel(cachedH); setLoading(false); return; }
    } catch {}

    // 5. Demo hotels
    const DEMOS = [
      { id:"sunrise-jaipur",    name:"Hotel Sunrise",   location:"Jaipur, Rajasthan",      totalRooms:40,  plan:"pro",        emoji:"🏨", ownerPin:"1234", managerPin:"5678" },
      { id:"grand-mumbai",      name:"The Grand Inn",   location:"Mumbai, Maharashtra",    totalRooms:120, plan:"enterprise", emoji:"🏩", ownerPin:"2345", managerPin:"6789" },
      { id:"saffron-ahmedabad", name:"Saffron Stays",   location:"Ahmedabad, Gujarat",     totalRooms:25,  plan:"free",       emoji:"🏪", ownerPin:"3456", managerPin:"7890" },
      { id:"cherry-bhopal",     name:"Hotel Cherry",    location:"Bhopal, Madhya Pradesh", totalRooms:20,  plan:"pro",        emoji:"🍒", ownerPin:"4567", managerPin:"8901" },
    ];
    const demo = DEMOS.find(h => h.id === hotelId);
    if (demo) { setHotel(demo); setLoading(false); return; }

    setNotFound(true);
    setLoading(false);
  }

  // ── PIN auto-submit ──────────────────────────────────────────
  useEffect(() => { if (pin.length === 4) handleLogin(); }, [pin]);

  const addDigit = (d) => { if (pin.length < 4 && !pinLoading) setPin(p => p + d); };
  const delDigit = ()    => setPin(p => p.slice(0, -1));

  async function handleLogin() {
    if (!hotel || pin.length < 4) return;
    setPinLoading(true); setPinError("");
    await new Promise(r => setTimeout(r, 350));
    const correct = role === "owner" ? hotel.ownerPin : hotel.managerPin;
    if (pin === correct) {
      const user = { hotelId: hotel.id, hotelName: hotel.name, role, loginAt: new Date().toISOString() };
      try {
        localStorage.setItem("air_current_user", JSON.stringify(user));
        localStorage.setItem("air_active_hotel", hotel.id);
        // Save full config so app works offline
        localStorage.setItem(`air_${hotel.id}_config`, JSON.stringify({
          ...hotel, currency:"₹", gstPercent:12, checkoutTime:"11:00",
          rates:{ standard:1500, deluxe:2500, suite:4500 },
        }));
      } catch {}
      if (navigator.vibrate) navigator.vibrate([50, 30, 80]);
      router.push("/");
    } else {
      setPinError("Galat PIN! Dobara try karo.");
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      setPin("");
    }
    setPinLoading(false);
  }

  // ── LOADING ──────────────────────────────────────────────────
  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4"
      style={{ background:"#0A0A0A" }}>
      <div className="w-10 h-10 border-2 rounded-full animate-spin"
        style={{ borderColor:"rgba(212,175,55,0.2)", borderTopColor:"#D4AF37" }}/>
      <p className="text-sm" style={{ color:"rgba(255,255,255,0.4)" }}>Hotel load ho raha hai...</p>
      <p className="text-xs font-mono" style={{ color:"rgba(255,255,255,0.2)" }}>{hotelId}</p>
    </div>
  );

  // ── NOT FOUND ────────────────────────────────────────────────
  if (notFound || !hotel) return (
    <div className="h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background:"#0A0A0A" }}>
      <p className="text-5xl mb-4">🏚️</p>
      <h2 className="font-black text-2xl text-white mb-2">Hotel Nahi Mila</h2>
      <p className="text-sm mb-2" style={{ color:"rgba(255,255,255,0.4)" }}>
        Yeh link sahi nahi lagta.
      </p>
      <code className="text-xs px-3 py-1.5 rounded-lg mb-6 font-mono"
        style={{ background:"rgba(255,255,255,0.05)", color:"rgba(255,255,255,0.35)" }}>
        {hotelId}
      </code>
      <button onClick={loadHotel}
        className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold mb-3"
        style={{ background:"rgba(212,175,55,0.12)", border:"1px solid rgba(212,175,55,0.3)", color:"#D4AF37" }}>
        <RefreshCw size={15}/> Dobara Try Karo
      </button>
      <button onClick={() => router.push("/")}
        className="text-sm" style={{ color:"rgba(255,255,255,0.3)" }}>
        Home Pe Jaao
      </button>
    </div>
  );

  const plan = PLAN_COLORS[hotel.plan] || PLAN_COLORS.free;

  // ── PIN SCREEN ───────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background:"#0A0A0A" }}>

      {/* Back */}
      <button onClick={() => router.push("/")}
        className="absolute top-6 left-4 w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)" }}>
        <ArrowLeft size={18} style={{ color:"rgba(255,255,255,0.4)" }}/>
      </button>

      {/* Hotel card */}
      <div className="mb-8 text-center">
        <div className="w-24 h-24 rounded-3xl mx-auto mb-4 flex items-center justify-center text-5xl"
          style={{ background:"linear-gradient(135deg,#1a1200,#2e2000)",
            border:"1px solid rgba(212,175,55,0.35)", boxShadow:"0 0 40px rgba(212,175,55,0.15)" }}>
          {hotel.emoji || "🏨"}
        </div>
        <h1 className="font-black text-3xl text-white mb-1" style={{ letterSpacing:"-0.02em" }}>
          {hotel.name}
        </h1>
        <p className="text-sm" style={{ color:"rgba(255,255,255,0.4)" }}>📍 {hotel.location}</p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="text-xs px-2.5 py-0.5 rounded-lg font-semibold"
            style={{ background:plan.bg, color:plan.text }}>
            {PLAN_LABELS[hotel.plan] || "Starter"}
          </span>
          <span className="text-xs" style={{ color:"rgba(255,255,255,0.25)" }}>
            {hotel.totalRooms} rooms
          </span>
        </div>
      </div>

      {/* Role toggle */}
      <div className="w-full max-w-xs mb-6 p-1 rounded-2xl flex"
        style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)" }}>
        {[
          { key:"manager", label:"🔑 Manager" },
          { key:"owner",   label:"👑 Owner"   },
        ].map(r => (
          <button key={r.key} onClick={() => { setRole(r.key); setPin(""); setPinError(""); }}
            className="flex-1 py-3 rounded-xl text-sm font-bold transition-all"
            style={role === r.key
              ? { background:"linear-gradient(135deg,#b8960c,#D4AF37,#F5C842)", color:"#000" }
              : { color:"#444" }}>
            {r.label}
          </button>
        ))}
      </div>

      {/* PIN dots */}
      <div className="w-full max-w-xs mb-4 p-5 rounded-2xl"
        style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)" }}>
        <p className="text-xs text-center uppercase tracking-widest mb-4"
          style={{ color:"rgba(255,255,255,0.3)" }}>
          {role === "owner" ? "OWNER" : "MANAGER"} PIN DAALO
        </p>
        <div className="flex justify-center gap-4">
          {[0, 1, 2, 3].map(i => (
            <div key={i}
              className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200"
              style={i < pin.length
                ? { background:"rgba(212,175,55,0.2)", border:"2px solid #D4AF37", boxShadow:"0 0 14px rgba(212,175,55,0.3)" }
                : { background:"rgba(255,255,255,0.04)", border:"2px solid rgba(255,255,255,0.1)" }}>
              {i < pin.length && <div className="w-3 h-3 rounded-full" style={{ background:"#D4AF37" }}/>}
            </div>
          ))}
        </div>
        {pinError && (
          <p className="text-red-400 text-xs text-center mt-3 font-medium">{pinError}</p>
        )}
      </div>

      {/* Keypad */}
      <div className="w-full max-w-xs grid grid-cols-3 gap-3">
        {[1,2,3,4,5,6,7,8,9].map(d => (
          <button key={d} onClick={() => addDigit(String(d))} disabled={pinLoading}
            className="py-4 rounded-2xl text-xl font-bold text-white transition-all active:scale-90"
            style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.07)" }}>
            {d}
          </button>
        ))}
        <button onClick={delDigit} disabled={pinLoading}
          className="py-4 rounded-2xl text-xl font-bold transition-all active:scale-90 flex items-center justify-center"
          style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.07)", color:"#666" }}>
          ⌫
        </button>
        <button onClick={() => addDigit("0")} disabled={pinLoading}
          className="py-4 rounded-2xl text-xl font-bold text-white transition-all active:scale-90"
          style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.07)" }}>
          0
        </button>
        <button onClick={handleLogin}
          disabled={pin.length < 4 || pinLoading}
          className="py-4 rounded-2xl font-bold text-sm flex items-center justify-center transition-all"
          style={pin.length >= 4 && !pinLoading
            ? { background:"linear-gradient(135deg,#b8960c,#D4AF37,#F5C842)", color:"#000", boxShadow:"0 4px 20px rgba(212,175,55,0.3)" }
            : { background:"rgba(255,255,255,0.04)", color:"#333" }}>
          {pinLoading
            ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"/>
            : "Login →"}
        </button>
      </div>

      <p className="text-xs mt-8" style={{ color:"rgba(255,255,255,0.15)" }}>
        The GuestInn AI · Powered by Groq
      </p>
    </div>
  );
}
