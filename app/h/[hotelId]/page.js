/**
 * /h/[hotelId] — Direct Hotel Login Page
 * 
 * Each hotel gets a unique link:  yourapp.vercel.app/h/hotel-amardeep-xyz
 * Opening this link skips the hotel selection screen and goes DIRECTLY
 * to the PIN screen for that specific hotel.
 * 
 * Hotel owners share THIS link with their staff.
 */
"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

const PLAN_COLORS = {
  free:       { bg:"rgba(255,255,255,0.1)",  text:"#aaa"    },
  starter:    { bg:"rgba(34,197,94,0.15)",   text:"#22c55e" },
  pro:        { bg:"rgba(212,175,55,0.2)",   text:"#D4AF37" },
  enterprise: { bg:"rgba(0,112,243,0.2)",    text:"#60a5fa" },
};

export default function HotelDirectPage() {
  const params = useParams();
  const router = useRouter();
  const hotelId = params.hotelId;

  const [hotel,      setHotel]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [notFound,   setNotFound]   = useState(false);
  const [role,       setRole]       = useState("manager");
  const [pin,        setPin]        = useState("");
  const [pinError,   setPinError]   = useState("");
  const [pinLoading, setPinLoading] = useState(false);

  // Load hotel info
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // 1. Try Supabase
        const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (sbUrl && sbKey) {
          const res = await fetch(
            `${sbUrl}/rest/v1/hotels?id=eq.${encodeURIComponent(hotelId)}&select=*`,
            { headers: { "apikey": sbKey, "Authorization": `Bearer ${sbKey}` } }
          );
          if (res.ok) {
            const data = await res.json();
            if (data && data.length > 0) {
              const h = data[0];
              const hotel = {
                id:          h.id,
                name:        h.name,
                location:    h.location,
                totalRooms:  h.total_rooms || 20,
                plan:        h.plan || "starter",
                emoji:       h.emoji || "🏨",
                ownerPin:    h.owner_pin,
                managerPin:  h.manager_pin,
                ownerPhone:  h.owner_phone || "",
              };
              setHotel(hotel);
              // Cache locally
              localStorage.setItem(`air_${hotel.id}_config`, JSON.stringify({
                ...hotel, currency:"₹", gstPercent:12, checkoutTime:"11:00",
                rates:{ standard:1500, deluxe:2500, suite:4500 },
              }));
              setLoading(false);
              return;
            }
          }
        }

        // 2. Try localStorage cache
        const cached = localStorage.getItem(`air_${hotelId}_config`);
        if (cached) {
          setHotel(JSON.parse(cached));
          setLoading(false);
          return;
        }

        // 3. Check localStorage registry
        const registry = JSON.parse(localStorage.getItem("gi_hotel_registry") || "[]");
        const found = registry.find(h => h.id === hotelId);
        if (found) {
          setHotel(found);
          setLoading(false);
          return;
        }

        // 4. Check demo hotels
        const { DEMO_HOTELS } = await import("../../../lib/db");
        const demo = DEMO_HOTELS.find(h => h.id === hotelId);
        if (demo) {
          setHotel(demo);
          setLoading(false);
          return;
        }

        // Not found
        setNotFound(true);
      } catch (e) {
        console.error(e);
        setNotFound(true);
      }
      setLoading(false);
    }
    load();
  }, [hotelId]);

  // Auto-login when 4 digits
  useEffect(() => {
    if (pin.length === 4) handleLogin();
  }, [pin]);

  const addDigit = (d) => pin.length < 4 && setPin(p => p+d);
  const delDigit = ()    => setPin(p => p.slice(0,-1));

  const handleLogin = async () => {
    if (!hotel || pin.length < 4) return;
    setPinLoading(true); setPinError("");
    await new Promise(r => setTimeout(r, 400));

    const correctPin = role === "owner" ? hotel.ownerPin : hotel.managerPin;
    if (pin === correctPin) {
      const user = {
        hotelId:   hotel.id,
        hotelName: hotel.name,
        role,
        loginAt:   new Date().toISOString(),
      };
      localStorage.setItem("air_current_user", JSON.stringify(user));
      localStorage.setItem("air_active_hotel", hotel.id);
      if (navigator.vibrate) navigator.vibrate([50,30,50]);
      // Go to main app
      router.push("/");
    } else {
      setPinError("Galat PIN! Dobara try karo.");
      if (navigator.vibrate) navigator.vibrate([100,50,100]);
      setPin("");
    }
    setPinLoading(false);
  };

  // ── LOADING ──
  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4" style={{ background:"#0A0A0A" }}>
      <div className="w-10 h-10 border-2 rounded-full animate-spin"
        style={{ borderColor:"rgba(212,175,55,0.2)", borderTopColor:"#D4AF37" }}/>
      <p className="text-sm" style={{ color:"rgba(255,255,255,0.4)" }}>Hotel load ho raha hai...</p>
    </div>
  );

  // ── NOT FOUND ──
  if (notFound || !hotel) return (
    <div className="h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background:"#0A0A0A" }}>
      <p className="text-5xl mb-4">🏚️</p>
      <h2 className="font-black text-xl text-white mb-2">Hotel Nahi Mila</h2>
      <p className="text-sm mb-6" style={{ color:"rgba(255,255,255,0.4)" }}>
        Yeh hotel link sahi nahi hai ya hotel band ho gaya hai.
      </p>
      <button onClick={() => router.push("/")}
        className="px-6 py-3 rounded-2xl font-bold text-sm"
        style={{ background:"linear-gradient(135deg,#b8960c,#D4AF37)", color:"#000" }}>
        Home Pe Jaao
      </button>
    </div>
  );

  const plan = PLAN_COLORS[hotel.plan] || PLAN_COLORS.free;

  // ── PIN SCREEN ──
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 safe-top safe-bottom"
      style={{ background:"#0A0A0A" }}>

      {/* Back to main */}
      <button onClick={() => router.push("/")}
        className="absolute top-6 left-4 w-10 h-10 card rounded-xl flex items-center justify-center safe-top">
        <ArrowLeft size={18} style={{ color:"rgba(255,255,255,0.5)" }}/>
      </button>

      {/* Hotel avatar */}
      <div className="mb-6 text-center">
        <div className="w-24 h-24 rounded-3xl mx-auto mb-4 flex items-center justify-center text-5xl"
          style={{ background:"linear-gradient(135deg,#1a1200,#2e2000)", border:"1px solid rgba(212,175,55,0.3)", boxShadow:"0 0 40px rgba(212,175,55,0.15)" }}>
          {hotel.emoji||"🏨"}
        </div>
        <h2 className="font-black text-2xl text-white mb-1" style={{ letterSpacing:"-0.02em" }}>{hotel.name}</h2>
        <p className="text-sm" style={{ color:"rgba(255,255,255,0.4)" }}>📍 {hotel.location}</p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="text-xs px-2 py-0.5 rounded-md font-semibold"
            style={{ background:plan.bg, color:plan.text }}>
            {hotel.plan?.toUpperCase()||"STARTER"}
          </span>
          <span className="text-xs" style={{ color:"rgba(255,255,255,0.3)" }}>
            {hotel.totalRooms} rooms
          </span>
        </div>
      </div>

      {/* Role toggle */}
      <div className="w-full max-w-xs card p-1 rounded-2xl flex mb-6">
        {["manager","owner"].map(r=>(
          <button key={r} onClick={()=>{ setRole(r); setPin(""); setPinError(""); }}
            className="flex-1 py-3 rounded-xl text-sm font-bold transition-all"
            style={role===r
              ?{ background:"linear-gradient(135deg,#b8960c,#D4AF37,#F5C842)", color:"#000" }
              :{ color:"#555" }}>
            {r==="owner"?"👑 Owner":"🔑 Manager"}
          </button>
        ))}
      </div>

      {/* PIN dots */}
      <div className="w-full max-w-xs card rounded-2xl p-5 mb-4">
        <p className="text-xs text-center uppercase tracking-widest mb-4"
          style={{ color:"rgba(255,255,255,0.35)" }}>PIN ENTER KARO</p>
        <div className="flex justify-center gap-4">
          {[0,1,2,3].map(i=>(
            <div key={i} className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all"
              style={i<pin.length
                ?{ background:"rgba(212,175,55,0.2)", border:"2px solid #D4AF37", boxShadow:"0 0 12px rgba(212,175,55,0.3)" }
                :{ background:"rgba(255,255,255,0.04)", border:"2px solid rgba(255,255,255,0.1)" }}>
              {i<pin.length&&<div className="w-3 h-3 rounded-full" style={{ background:"#D4AF37" }}/>}
            </div>
          ))}
        </div>
        {pinError&&<p className="text-red-400 text-xs text-center mt-3">{pinError}</p>}
      </div>

      {/* Keypad */}
      <div className="w-full max-w-xs grid grid-cols-3 gap-3">
        {[1,2,3,4,5,6,7,8,9].map(d=>(
          <button key={d} onClick={()=>addDigit(String(d))}
            className="card py-4 rounded-2xl text-xl font-bold text-white transition-all active:scale-90 active:bg-white/10">
            {d}
          </button>
        ))}
        <button onClick={delDigit}
          className="card py-4 rounded-2xl text-xl text-gray-500 transition-all active:scale-90 flex items-center justify-center">
          ⌫
        </button>
        <button onClick={()=>addDigit("0")}
          className="card py-4 rounded-2xl text-xl font-bold text-white transition-all active:scale-90">
          0
        </button>
        <button onClick={handleLogin} disabled={pin.length<4||pinLoading}
          className="py-4 rounded-2xl font-bold text-sm flex items-center justify-center"
          style={pin.length>=4&&!pinLoading
            ?{ background:"linear-gradient(135deg,#b8960c,#D4AF37,#F5C842)", color:"#000", boxShadow:"0 4px 20px rgba(212,175,55,0.35)" }
            :{ background:"rgba(255,255,255,0.06)", color:"#444" }}>
          {pinLoading
            ?<div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"/>
            :"Login →"}
        </button>
      </div>

      <p className="text-xs mt-8" style={{ color:"rgba(255,255,255,0.15)" }}>The GuestInn AI • Powered by Groq</p>
    </div>
  );
}
