"use client";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Shield, Download, Trash2, LogOut } from "lucide-react";
import { getHotelConfig, saveHotelConfig, exportCSV, exportAllData } from "../lib/db";

export default function SettingsView({ hotelId, hotel, user, onLogout }) {
  const [cfg,     setCfg]   = useState(null);
  const [saved,   setSaved] = useState(false);
  const [showOwnerPin, setShowOP] = useState(false);
  const [showMgrPin,   setShowMP] = useState(false);

  useEffect(() => {
    if (hotelId) setCfg(getHotelConfig(hotelId));
  }, [hotelId]);

  const save = async () => {
    if (!cfg) return;
    // Validate PINs
    if (cfg.ownerPin && cfg.ownerPin.length < 4) { alert("Owner PIN minimum 4 digits chahiye."); return; }
    if (cfg.managerPin && cfg.managerPin.length < 4) { alert("Manager PIN minimum 4 digits chahiye."); return; }
    if (cfg.ownerPin && cfg.managerPin && cfg.ownerPin === cfg.managerPin) {
      alert("Owner aur Manager PIN alag hone chahiye."); return;
    }

    // 1. Save to localStorage (instant, works offline)
    saveHotelConfig(hotelId, cfg);

    // 2. Update hotel registry (so login screen reflects new name/location)
    try {
      const reg = JSON.parse(localStorage.getItem("gi_hotel_registry") || "[]");
      const updated = reg.map(h => h.id === hotelId
        ? { ...h, name: cfg.name, location: cfg.location,
            totalRooms: cfg.totalRooms,
            ownerPin: cfg.ownerPin, managerPin: cfg.managerPin,
            ownerPhone: cfg.ownerPhone, rates: cfg.rates }
        : h);
      localStorage.setItem("gi_hotel_registry", JSON.stringify(updated));
      // Also update cache
      const cache = JSON.parse(localStorage.getItem("gi_hotel_registry_cache") || "[]");
      const updCache = cache.map(h => h.id === hotelId ? { ...h, name: cfg.name, location: cfg.location, totalRooms: cfg.totalRooms } : h);
      localStorage.setItem("gi_hotel_registry_cache", JSON.stringify(updCache));
    } catch {}

    // 3. Sync rates to Supabase (so all devices + booking page get fresh rates)
    const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (sbUrl && sbKey && sbUrl !== "undefined") {
      try {
        await fetch(`${sbUrl}/rest/v1/hotels?id=eq.${encodeURIComponent(hotelId)}`, {
          method: "PATCH",
          headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}`,
            "Content-Type": "application/json", Prefer: "return=minimal" },
          body: JSON.stringify({
            name:        cfg.name,
            location:    cfg.location,
            total_rooms: cfg.totalRooms || 20,
            owner_pin:   cfg.ownerPin,
            manager_pin: cfg.managerPin,
            owner_phone: cfg.ownerPhone || "",
            updated_at:  new Date().toISOString(),
            // Store rates as JSON in a custom field
            // (add rates column to Supabase if needed — stored in config for now)
          }),
        });
      } catch {}
    }

    // 4. Reinitialize rooms if total count changed
    try {
      const { initializeRooms } = await import("../lib/db");
      // Force re-init by clearing room cache if count changed
      const currentRooms = JSON.parse(localStorage.getItem(`air_${hotelId}_rooms`) || "[]");
      if (currentRooms.length !== cfg.totalRooms) {
        localStorage.removeItem(`air_${hotelId}_rooms`);
        initializeRooms(hotelId, cfg.totalRooms);
      }
    } catch {}

    setSaved(true);
    if (navigator.vibrate) navigator.vibrate([50, 30, 80]);
    setTimeout(() => setSaved(false), 2500);
  };

  const clearData = () => {
    if (!window.confirm("Sab booking data delete ho jayega! Sure ho?")) return;
    [`air_${hotelId}_bookings`, `air_${hotelId}_rooms`].forEach(k => localStorage.removeItem(k));
    window.location.reload();
  };

  if (!cfg) return null;

  return (
    <div className="h-full flex flex-col gap-3 px-3 py-2 overflow-hidden">
      <h2 className="font-black text-xl flex-shrink-0" style={{ color: "#D4AF37" }}>Settings</h2>

      <div className="flex-1 scroll-y space-y-3 pb-4">

        {/* Hotel Info */}
        <Section title="🏨 Hotel Info">
          <LI label="Hotel Name"   val={cfg.name}       onChange={v => setCfg({ ...cfg, name: v })}       ph="Hotel ka naam" />
          <LI label="Location"     val={cfg.location}   onChange={v => setCfg({ ...cfg, location: v })}   ph="City, State" />
          <div className="grid grid-cols-2 gap-2">
            <LI label="Total Rooms" val={cfg.totalRooms} onChange={v => setCfg({ ...cfg, totalRooms: parseInt(v)||20 })} ph="20" type="number" />
            <LI label="GST %"       val={cfg.gstPercent} onChange={v => setCfg({ ...cfg, gstPercent: parseInt(v)||12 })} ph="12" type="number" />
          </div>
        </Section>

        {/* WhatsApp */}
        <Section title="📱 WhatsApp Alerts">
          <LI label="👑 Owner Phone"   val={cfg.ownerPhone}   onChange={v => setCfg({ ...cfg, ownerPhone: v })}   ph="+91 9999999999" type="tel" />
          <LI label="🔑 Manager Phone" val={cfg.managerPhone} onChange={v => setCfg({ ...cfg, managerPhone: v })} ph="+91 8888888888" type="tel" />
        </Section>

        {/* Booking Page Link */}
        <Section title="🌐 Your Booking Page">
          <p className="text-xs" style={{color:"rgba(255,255,255,0.4)"}}>
            Yeh link customers ko bhejo — GMB, WhatsApp, Instagram pe daalo
          </p>
          <div className="px-3 py-2.5 rounded-xl" style={{background:"rgba(212,175,55,0.06)",border:"1px solid rgba(212,175,55,0.15)"}}>
            <p className="text-xs font-mono break-all" style={{color:"rgba(255,255,255,0.45)"}}>
              {typeof window!=="undefined"?window.location.origin:""}/booking/{hotelId}
            </p>
          </div>
          <button onClick={()=>navigator.clipboard?.writeText(`${window.location.origin}/booking/${hotelId}`)}
            className="w-full py-2.5 rounded-xl text-sm font-semibold"
            style={{background:"rgba(212,175,55,0.1)",border:"1px solid rgba(212,175,55,0.25)",color:"#D4AF37"}}>
            📋 Link Copy Karo
          </button>
        </Section>

        {/* Room Rates */}
        <Section title="💰 Room Rates">
          <p className="text-xs" style={{color:"rgba(255,255,255,0.3)"}}>
            Yeh rates booking page aur ScannerView dono pe apply honge
          </p>
          {[
            ["Standard","standard","Basic room"],
            ["Deluxe","deluxe","Premium room"],
            ["Suite","suite","Luxury suite"],
          ].map(([l,k,desc])=>(
            <div key={k}>
              <label className="text-xs mb-1 block" style={{color:"rgba(255,255,255,0.4)"}}>
                {l} (₹/night) — <span style={{color:"rgba(255,255,255,0.2)"}}>{desc}</span>
              </label>
              <div className="flex gap-2">
                <input type="number" value={cfg.rates?.[k]||""}
                  onChange={e=>setCfg({...cfg,rates:{...cfg.rates,[k]:parseInt(e.target.value)||0}})}
                  className="inp flex-1 px-3 py-2.5 text-sm"/>
                {/* Quick preset buttons */}
                <div className="flex gap-1">
                  {(k==="standard"?[800,1200,1500,2000]:k==="deluxe"?[1500,2000,2500,3500]:[3000,4000,4500,6000]).map(p=>(
                    <button key={p} onClick={()=>setCfg({...cfg,rates:{...cfg.rates,[k]:p}})}
                      className="px-2 py-1 rounded-lg text-xs font-semibold transition-all"
                      style={cfg.rates?.[k]===p
                        ?{background:"rgba(212,175,55,0.25)",color:"#D4AF37",border:"1px solid rgba(212,175,55,0.4)"}
                        :{background:"rgba(255,255,255,0.04)",color:"rgba(255,255,255,0.3)",border:"1px solid rgba(255,255,255,0.07)"}}>
                      {p>=1000?`${p/1000}K`:p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
          {/* Checkout time */}
          <div>
            <label className="text-xs mb-1 block" style={{color:"rgba(255,255,255,0.4)"}}>Checkout Time</label>
            <div className="flex gap-2">
              {["10:00","11:00","12:00","13:00"].map(t=>(
                <button key={t} onClick={()=>setCfg({...cfg,checkoutTime:t})}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold"
                  style={cfg.checkoutTime===t
                    ?{background:"rgba(212,175,55,0.2)",color:"#D4AF37",border:"1px solid rgba(212,175,55,0.3)"}
                    :{background:"rgba(255,255,255,0.04)",color:"rgba(255,255,255,0.35)",border:"1px solid rgba(255,255,255,0.07)"}}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </Section>

        {/* PIN Management — CRITICAL for new hotels */}
        <Section title="🔐 Login PINs Change Karo">
          <div className="px-3 py-2 rounded-xl text-xs mb-1"
            style={{background:"rgba(212,175,55,0.08)",border:"1px solid rgba(212,175,55,0.2)",color:"rgba(255,255,255,0.6)"}}>
            ⚠️ PIN change karne ke baad hotel list se dobara login karna hoga.
          </div>
          {/* Owner PIN */}
          <div>
            <label className="text-xs mb-1.5 block" style={{color:"rgba(255,255,255,0.4)"}}>👑 Owner PIN (4 digits)</label>
            <div className="relative">
              <input type={showOwnerPin?"text":"password"} value={cfg.ownerPin||""}
                onChange={e=>setCfg({...cfg,ownerPin:e.target.value.replace(/\D/g,"").slice(0,4)})}
                placeholder="• • • •" maxLength={4}
                className="inp w-full px-3 py-2.5 text-sm pr-10 font-mono tracking-widest"/>
              <button onClick={()=>setShowOP(!showOwnerPin)} className="absolute right-3 top-1/2 -translate-y-1/2">
                {showOwnerPin?<EyeOff size={14} style={{color:"rgba(255,255,255,0.3)"}}/>:<Eye size={14} style={{color:"rgba(255,255,255,0.3)"}}/>}
              </button>
            </div>
          </div>
          {/* Manager PIN */}
          <div>
            <label className="text-xs mb-1.5 block" style={{color:"rgba(255,255,255,0.4)"}}>🔑 Manager PIN (4 digits)</label>
            <div className="relative">
              <input type={showMgrPin?"text":"password"} value={cfg.managerPin||""}
                onChange={e=>setCfg({...cfg,managerPin:e.target.value.replace(/\D/g,"").slice(0,4)})}
                placeholder="• • • •" maxLength={4}
                className="inp w-full px-3 py-2.5 text-sm pr-10 font-mono tracking-widest"/>
              <button onClick={()=>setShowMP(!showMgrPin)} className="absolute right-3 top-1/2 -translate-y-1/2">
                {showMgrPin?<EyeOff size={14} style={{color:"rgba(255,255,255,0.3)"}}/>:<Eye size={14} style={{color:"rgba(255,255,255,0.3)"}}/>}
              </button>
            </div>
          </div>
        </Section>

        {/* Save Button */}
        <button onClick={save}
          className="w-full py-3.5 rounded-2xl font-bold text-base transition-all"
          style={saved
            ?{background:"rgba(34,197,94,0.15)",color:"#22c55e",border:"1px solid rgba(34,197,94,0.3)"}
            :{background:"linear-gradient(135deg,#b8960c,#D4AF37,#F5C842)",color:"#000",boxShadow:"0 4px 20px rgba(212,175,55,0.3)"}}>
          {saved ? "✅ Saved Ho Gaya!" : "Settings Save Karo"}
        </button>

        {/* Security Info */}
        <Section title="🛡️ Security">
          <div className="space-y-2">
            {["🔒 Rate lock anti-theft active","📱 Triple WhatsApp alerts on check-in","👁️ Owner sees all transactions real-time","🤖 Powered by Groq AI (Llama 3 + LLaVA)"].map(t=>(
              <p key={t} className="text-xs" style={{color:"rgba(255,255,255,0.4)"}}>{t}</p>
            ))}
          </div>
        </Section>

        {/* Export */}
        <Section title="📤 Data Export">
          {[["📊 Bookings CSV",()=>exportCSV(hotelId)],["💾 Complete JSON",()=>exportAllData(hotelId)]].map(([l,fn])=>(
            <button key={l} onClick={fn}
              className="w-full py-3 rounded-xl card flex items-center gap-2 px-4 text-sm active:scale-95"
              style={{color:"rgba(255,255,255,0.6)"}}>{l}</button>
          ))}
        </Section>

        {/* Danger Zone */}
        {user?.role === "owner" && (
          <div className="rounded-2xl p-4" style={{border:"1px solid rgba(239,68,68,0.2)",background:"rgba(239,68,68,0.03)"}}>
            <p className="text-xs uppercase tracking-widest mb-3 text-red-500">Danger Zone</p>
            <button onClick={clearData}
              className="w-full py-3 rounded-xl text-red-400 text-sm font-semibold active:scale-95 flex items-center justify-center gap-2"
              style={{border:"1px solid rgba(239,68,68,0.25)"}}>
              <Trash2 size={14}/> Sab Booking Data Clear Karo
            </button>
          </div>
        )}

        <button onClick={onLogout}
          className="w-full py-3 rounded-2xl card text-sm font-medium flex items-center justify-center gap-2"
          style={{color:"rgba(255,255,255,0.4)"}}>
          <LogOut size={14}/> Hotel Switch / Logout
        </button>

        <p className="text-center text-xs pb-4" style={{color:"rgba(255,255,255,0.15)"}}>
          The GuestInn v2.0 • {hotel?.name} • {(hotel?.plan||"starter").toUpperCase()}
        </p>
      </div>
    </div>
  );
}

function Section({title, children}){
  return(
    <div className="card rounded-2xl p-4 space-y-3">
      <p className="text-xs uppercase tracking-widest" style={{color:"rgba(255,255,255,0.3)"}}>{title}</p>
      {children}
    </div>
  );
}
function LI({label,val,onChange,ph,type="text"}){
  return(
    <div>
      <label className="text-xs mb-1 block" style={{color:"rgba(255,255,255,0.4)"}}>{label}</label>
      <input type={type} value={val||""} onChange={e=>onChange(e.target.value)}
        placeholder={ph} className="inp w-full px-3 py-2.5 text-sm"/>
    </div>
  );
}
