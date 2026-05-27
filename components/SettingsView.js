"use client";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Shield, Download, Trash2, LogOut, Mail, Check } from "lucide-react";
import { getHotelConfig, saveHotelConfig, exportCSV, exportAllData } from "../lib/db";

const WHATSAPP_BASE = "+919575877759"; // GuestInn support number for demo alerts

export default function SettingsView({ hotelId, hotel, user, onLogout }) {
  const [cfg,          setCfg]      = useState(null);
  const [saved,        setSaved]    = useState(false);
  const [saving,       setSaving]   = useState(false);
  const [showOP,       setShowOP]   = useState(false);
  const [showMP,       setShowMP]   = useState(false);
  const [testEmailSent,setTestEmail]= useState(false);
  const [testWASent,   setTestWA]   = useState(false);

  useEffect(() => {
    if (hotelId) {
      const loaded = getHotelConfig(hotelId);
      // Set defaults if missing
      if (!loaded.rates) loaded.rates = { standard:1500, deluxe:2500, suite:4500 };
      if (!loaded.rates.standard) loaded.rates.standard = 1500;
      if (!loaded.gstPercent) loaded.gstPercent = 12;
      if (!loaded.checkoutTime) loaded.checkoutTime = "11:00";
      setCfg(loaded);
    }
  }, [hotelId]);

  const save = async () => {
    if (!cfg) return;
    if (cfg.ownerPin && cfg.ownerPin.length < 4) { alert("Owner PIN minimum 4 digits."); return; }
    if (cfg.managerPin && cfg.managerPin.length < 4) { alert("Manager PIN minimum 4 digits."); return; }
    if (cfg.ownerPin && cfg.managerPin && cfg.ownerPin === cfg.managerPin) {
      alert("Owner aur Manager PIN alag hone chahiye."); return;
    }
    setSaving(true);

    // 1. Save to localStorage
    saveHotelConfig(hotelId, cfg);

    // 2. Update registry
    try {
      const reg = JSON.parse(localStorage.getItem("gi_hotel_registry") || "[]");
      const updated = reg.map(h => h.id === hotelId ? {
        ...h, name:cfg.name, location:cfg.location,
        totalRooms:cfg.totalRooms, ownerPin:cfg.ownerPin,
        managerPin:cfg.managerPin, ownerPhone:cfg.ownerPhone,
        managerPhone:cfg.managerPhone, ownerEmail:cfg.ownerEmail,
        managerEmail:cfg.managerEmail, rates:cfg.rates,
      } : h);
      localStorage.setItem("gi_hotel_registry", JSON.stringify(updated));
      const cache = JSON.parse(localStorage.getItem("gi_hotel_registry_cache") || "[]");
      localStorage.setItem("gi_hotel_registry_cache", JSON.stringify(
        cache.map(h => h.id === hotelId ? { ...h, name:cfg.name, location:cfg.location, totalRooms:cfg.totalRooms } : h)
      ));
    } catch {}

    // 3. Supabase sync
    const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (sbUrl && sbKey && sbUrl !== "undefined") {
      try {
        await fetch(`${sbUrl}/rest/v1/hotels?id=eq.${encodeURIComponent(hotelId)}`, {
          method:"PATCH",
          headers:{ apikey:sbKey, Authorization:`Bearer ${sbKey}`,
            "Content-Type":"application/json", Prefer:"return=minimal" },
          body:JSON.stringify({
            name:        cfg.name,
            location:    cfg.location,
            total_rooms: cfg.totalRooms || 20,
            owner_pin:   cfg.ownerPin,
            manager_pin: cfg.managerPin,
            owner_phone: cfg.ownerPhone || "",
            updated_at:  new Date().toISOString(),
          }),
        });
      } catch {}
    }

    // 4. Reinit rooms if count changed
    try {
      const current = JSON.parse(localStorage.getItem(`air_${hotelId}_rooms`) || "[]");
      if (current.length > 0 && current.length !== Number(cfg.totalRooms)) {
        localStorage.removeItem(`air_${hotelId}_rooms`);
        const { initializeRooms } = await import("../lib/db");
        initializeRooms(hotelId, cfg.totalRooms);
      }
    } catch {}

    setSaving(false); setSaved(true);
    if (navigator.vibrate) navigator.vibrate([50,30,80]);
    setTimeout(() => setSaved(false), 3000);
  };

  // Test WhatsApp — send to GuestInn demo number
  const testWhatsApp = () => {
    const msg = `🏨 *The GuestInn — Test Alert*\n\nHotel: ${cfg?.name}\nOwner: ${cfg?.ownerPhone||"—"}\nSettings test successful! ✅`;
    window.open(`https://wa.me/${WHATSAPP_BASE.replace(/\D/g,"")}?text=${encodeURIComponent(msg)}`, "_blank");
    setTestWA(true); setTimeout(()=>setTestWA(false), 3000);
  };

  // Test Email via mailto
  const testEmail = () => {
    if (!cfg?.ownerEmail) { alert("Pehle owner email daalo."); return; }
    const sub = encodeURIComponent(`The GuestInn — Test Email (${cfg.name})`);
    const body = encodeURIComponent(`Yeh ek test email hai.\n\nHotel: ${cfg.name}\nLocation: ${cfg.location}\n\nSettings sahi se save ho gayi hain.\n\n— The GuestInn AI`);
    window.open(`mailto:${cfg.ownerEmail}?subject=${sub}&body=${body}`);
    setTestEmail(true); setTimeout(()=>setTestEmail(false), 3000);
  };

  const clearData = () => {
    if (!window.confirm("Sab booking data delete ho jayega! Sure ho?")) return;
    [`air_${hotelId}_bookings`,`air_${hotelId}_rooms`].forEach(k=>localStorage.removeItem(k));
    window.location.reload();
  };

  if (!cfg) return null;

  return (
    <div className="h-full flex flex-col gap-0 px-3 py-2 overflow-hidden">
      <h2 className="font-black text-xl flex-shrink-0 mb-3" style={{color:"#D4AF37"}}>Settings</h2>

      <div className="flex-1 scroll-y space-y-3 pb-6">

        {/* ── HOTEL INFO ── */}
        <Section title="🏨 Hotel Info">
          <LI label="Hotel Name"   val={cfg.name}       onChange={v=>setCfg({...cfg,name:v})}                     ph="Hotel ka naam"/>
          <LI label="Location"     val={cfg.location}   onChange={v=>setCfg({...cfg,location:v})}                 ph="City, State"/>
          <LI label="Hotel Address" val={cfg.address||""} onChange={v=>setCfg({...cfg,address:v})}                ph="Plot no., Street, City"/>
          <LI label="Hotel Phone"  val={cfg.phone||""}  onChange={v=>setCfg({...cfg,phone:v})}                    ph="+91 9999999999" type="tel"/>
          <div className="grid grid-cols-2 gap-2">
            <LI label="Total Rooms" val={cfg.totalRooms} onChange={v=>setCfg({...cfg,totalRooms:parseInt(v)||20})} ph="20" type="number"/>
            <LI label="GST %"       val={cfg.gstPercent} onChange={v=>setCfg({...cfg,gstPercent:parseInt(v)||12})} ph="12" type="number"/>
          </div>
        </Section>

        {/* ── CONTACT & ALERTS ── */}
        <Section title="📱 WhatsApp Alerts">
          <div className="px-3 py-2 rounded-xl text-xs"
            style={{background:"rgba(34,197,94,0.06)",border:"1px solid rgba(34,197,94,0.2)",color:"rgba(255,255,255,0.5)"}}>
            💡 Har check-in pe WhatsApp alert aayega in numbers pe
          </div>
          <LI label="👑 Owner Phone"   val={cfg.ownerPhone||""}   onChange={v=>setCfg({...cfg,ownerPhone:v})}   ph="+91 9999999999" type="tel"/>
          <LI label="🔑 Manager Phone" val={cfg.managerPhone||""} onChange={v=>setCfg({...cfg,managerPhone:v})} ph="+91 8888888888" type="tel"/>
          <button onClick={testWhatsApp}
            className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
            style={{background:"rgba(37,211,102,0.1)",border:"1px solid rgba(37,211,102,0.25)",color:"#25D366"}}>
            {testWASent ? "✅ WhatsApp Khul Gaya!" : "📲 Test WhatsApp Bhejo"}
          </button>
        </Section>

        {/* ── EMAIL ── */}
        <Section title="📧 Email Notifications">
          <div className="px-3 py-2 rounded-xl text-xs"
            style={{background:"rgba(59,130,246,0.06)",border:"1px solid rgba(59,130,246,0.2)",color:"rgba(255,255,255,0.5)"}}>
            💡 Booking confirmation aur reports email pe bhi jayenge
          </div>
          <LI label="👑 Owner Email"   val={cfg.ownerEmail||""}   onChange={v=>setCfg({...cfg,ownerEmail:v})}   ph="owner@hotel.com"   type="email"/>
          <LI label="🔑 Manager Email" val={cfg.managerEmail||""} onChange={v=>setCfg({...cfg,managerEmail:v})} ph="manager@hotel.com" type="email"/>
          <button onClick={testEmail}
            className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
            style={{background:"rgba(59,130,246,0.1)",border:"1px solid rgba(59,130,246,0.25)",color:"#60a5fa"}}>
            {testEmailSent ? "✅ Email Client Khul Gaya!" : "📧 Test Email Bhejo"}
          </button>
        </Section>

        {/* ── BOOKING PAGE LINK ── */}
        <Section title="🌐 Your Booking Page">
          <p className="text-xs" style={{color:"rgba(255,255,255,0.35)"}}>
            GMB, WhatsApp, Instagram pe yeh link share karo
          </p>
          <div className="px-3 py-2.5 rounded-xl" style={{background:"rgba(212,175,55,0.06)",border:"1px solid rgba(212,175,55,0.15)"}}>
            <p className="text-xs font-mono break-all" style={{color:"rgba(255,255,255,0.45)"}}>
              {typeof window!=="undefined"?window.location.origin:""}/booking/{hotelId}
            </p>
          </div>
          <button onClick={()=>navigator.clipboard?.writeText(`${window.location.origin}/booking/${hotelId}`).then(()=>alert("Link copied!"))}
            className="w-full py-2.5 rounded-xl text-sm font-semibold"
            style={{background:"rgba(212,175,55,0.1)",border:"1px solid rgba(212,175,55,0.25)",color:"#D4AF37"}}>
            📋 Link Copy Karo
          </button>
        </Section>

        {/* ── ROOM RATES ── */}
        <Section title="💰 Room Rates">
          <p className="text-xs" style={{color:"rgba(255,255,255,0.3)"}}>
            Yeh rates booking page, Scanner, aur GRC form — sab jagah apply honge
          </p>
          {[
            {label:"Standard",key:"standard",desc:"Basic room",  presets:[600,800,1000,1200,1500,2000]},
            {label:"Deluxe",  key:"deluxe",  desc:"Premium room",presets:[1500,2000,2500,3000,3500,4000]},
            {label:"Suite",   key:"suite",   desc:"Luxury suite", presets:[3000,3500,4000,4500,5000,6000]},
          ].map(({label,key,desc,presets})=>(
            <div key={key}>
              <label className="text-xs mb-1.5 block" style={{color:"rgba(255,255,255,0.4)"}}>
                {label} (₹/night) — <span style={{color:"rgba(255,255,255,0.2)"}}>{desc}</span>
              </label>
              <div className="flex gap-2 mb-1.5">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
                  <input type="number" min="100" max="99999" step="50"
                    value={cfg.rates?.[key]||""}
                    onChange={e=>setCfg({...cfg,rates:{...cfg.rates,[key]:parseInt(e.target.value)||0}})}
                    className="inp w-full pl-7 pr-3 py-2.5 text-sm"/>
                </div>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {presets.map(p=>(
                  <button key={p} onClick={()=>setCfg({...cfg,rates:{...cfg.rates,[key]:p}})}
                    className="px-2 py-1 rounded-lg text-xs font-semibold"
                    style={cfg.rates?.[key]===p
                      ?{background:"rgba(212,175,55,0.25)",color:"#D4AF37",border:"1px solid rgba(212,175,55,0.5)"}
                      :{background:"rgba(255,255,255,0.04)",color:"rgba(255,255,255,0.3)",border:"1px solid rgba(255,255,255,0.08)"}}>
                    {p>=1000?`${p/1000}K`:p}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Checkout time */}
          <div>
            <label className="text-xs mb-1.5 block" style={{color:"rgba(255,255,255,0.4)"}}>Checkout Time</label>
            <div className="flex gap-2">
              {["10:00","11:00","12:00","13:00"].map(t=>(
                <button key={t} onClick={()=>setCfg({...cfg,checkoutTime:t})}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold"
                  style={cfg.checkoutTime===t
                    ?{background:"linear-gradient(135deg,#b8960c,#D4AF37)",color:"#000"}
                    :{background:"rgba(255,255,255,0.04)",color:"rgba(255,255,255,0.35)",border:"1px solid rgba(255,255,255,0.07)"}}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </Section>

        {/* ── RATE SUMMARY (live preview) ── */}
        <div className="rounded-2xl p-3" style={{background:"rgba(212,175,55,0.04)",border:"1px solid rgba(212,175,55,0.12)"}}>
          <p className="text-xs mb-2 font-semibold" style={{color:"rgba(212,175,55,0.6)"}}>💡 Current Rates Preview</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[["Standard",cfg.rates?.standard],["Deluxe",cfg.rates?.deluxe],["Suite",cfg.rates?.suite]].map(([l,v])=>(
              <div key={l} className="card rounded-xl py-2">
                <p className="text-xs" style={{color:"rgba(255,255,255,0.3)"}}>{l}</p>
                <p className="font-black text-sm" style={{color:"#D4AF37"}}>₹{(v||0).toLocaleString("en-IN")}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── LOGIN PINs ── */}
        <Section title="🔐 Login PINs Change Karo">
          <div className="px-3 py-2 rounded-xl text-xs"
            style={{background:"rgba(212,175,55,0.08)",border:"1px solid rgba(212,175,55,0.2)",color:"rgba(255,255,255,0.6)"}}>
            ⚠️ PIN change ke baad hotel list se dobara login karna hoga.
          </div>
          <PinField label="👑 Owner PIN (4 digits)"   val={cfg.ownerPin||""}   show={showOP} setShow={setShowOP}
            onChange={v=>setCfg({...cfg,ownerPin:v.replace(/\D/g,"").slice(0,4)})}/>
          <PinField label="🔑 Manager PIN (4 digits)" val={cfg.managerPin||""} show={showMP} setShow={setShowMP}
            onChange={v=>setCfg({...cfg,managerPin:v.replace(/\D/g,"").slice(0,4)})}/>
        </Section>

        {/* ── SAVE BUTTON ── */}
        <button onClick={save} disabled={saving}
          className="w-full py-4 rounded-2xl font-bold text-base transition-all"
          style={saved
            ?{background:"rgba(34,197,94,0.15)",color:"#22c55e",border:"1px solid rgba(34,197,94,0.3)"}
            :saving
            ?{background:"rgba(212,175,55,0.15)",color:"#D4AF37"}
            :{background:"linear-gradient(135deg,#b8960c,#D4AF37,#F5C842)",color:"#000",boxShadow:"0 4px 20px rgba(212,175,55,0.3)"}}>
          {saved?"✅ Settings Save Ho Gayi!":saving?"⏳ Saving...":"💾 Settings Save Karo"}
        </button>

        {/* ── SECURITY INFO ── */}
        <Section title="🛡️ Security">
          <div className="space-y-2">
            {[
              "🔒 Rate lock anti-theft active",
              "📱 Triple WhatsApp alerts on check-in",
              "👁️ Owner sees all transactions real-time",
              "🤖 Powered by Groq AI (Llama 4 Scout + 70B)",
              "🗄️ Supabase encrypted database",
            ].map(t=>(
              <p key={t} className="text-xs" style={{color:"rgba(255,255,255,0.4)"}}>{t}</p>
            ))}
          </div>
        </Section>

        {/* ── DATA EXPORT ── */}
        <Section title="📤 Data Export">
          <p className="text-xs" style={{color:"rgba(255,255,255,0.3)"}}>
            GRC-style full export — sare guests ki details ke saath
          </p>
          <div className="space-y-2">
            <button onClick={()=>exportCSV(hotelId)}
              className="w-full py-3 rounded-xl card flex items-center gap-3 px-4 text-sm active:scale-95"
              style={{color:"rgba(255,255,255,0.6)"}}>
              <span className="text-xl">📊</span>
              <div className="text-left">
                <p className="font-semibold">Bookings CSV</p>
                <p className="text-xs" style={{color:"rgba(255,255,255,0.3)"}}>GRC form fields — Excel mein khulega</p>
              </div>
            </button>
            <button onClick={()=>exportAllData(hotelId)}
              className="w-full py-3 rounded-xl card flex items-center gap-3 px-4 text-sm active:scale-95"
              style={{color:"rgba(255,255,255,0.6)"}}>
              <span className="text-xl">💾</span>
              <div className="text-left">
                <p className="font-semibold">Complete JSON</p>
                <p className="text-xs" style={{color:"rgba(255,255,255,0.3)"}}>Full backup — sab guests + ID images</p>
              </div>
            </button>
          </div>
        </Section>

        {/* ── DANGER ZONE ── */}
        {user?.role==="owner" && (
          <div className="rounded-2xl p-4" style={{border:"1px solid rgba(239,68,68,0.2)",background:"rgba(239,68,68,0.03)"}}>
            <p className="text-xs uppercase tracking-widest mb-3 font-semibold" style={{color:"#ef4444"}}>⚠️ Danger Zone</p>
            <button onClick={clearData}
              className="w-full py-3 rounded-xl text-sm font-semibold active:scale-95 flex items-center justify-center gap-2"
              style={{border:"1px solid rgba(239,68,68,0.25)",color:"#ef4444",background:"transparent"}}>
              <Trash2 size={14}/> Sab Booking Data Clear Karo
            </button>
          </div>
        )}

        {/* ── LOGOUT ── */}
        <button onClick={onLogout}
          className="w-full py-3 rounded-2xl card text-sm font-medium flex items-center justify-center gap-2"
          style={{color:"rgba(255,255,255,0.4)"}}>
          <LogOut size={14}/> Hotel Switch / Logout
        </button>

        <p className="text-center text-xs pb-4" style={{color:"rgba(255,255,255,0.15)"}}>
          The GuestInn v2.0 • {cfg?.name} • {(cfg?.plan||hotel?.plan||"starter").toUpperCase()}
        </p>
      </div>
    </div>
  );
}

function Section({title,children}){
  return(
    <div className="card rounded-2xl p-4 space-y-3">
      <p className="text-xs uppercase tracking-widest font-semibold" style={{color:"rgba(255,255,255,0.3)"}}>{title}</p>
      {children}
    </div>
  );
}

function LI({label,val,onChange,ph,type="text"}){
  return(
    <div>
      <label className="text-xs mb-1 block" style={{color:"rgba(255,255,255,0.4)"}}>{label}</label>
      <input type={type} value={val||""} onChange={e=>onChange(e.target.value)}
        placeholder={ph} className="inp w-full px-3 py-2.5 text-sm" style={{colorScheme:"dark"}}/>
    </div>
  );
}

function PinField({label,val,onChange,show,setShow}){
  return(
    <div>
      <label className="text-xs mb-1.5 block" style={{color:"rgba(255,255,255,0.4)"}}>{label}</label>
      <div className="relative">
        <input type={show?"text":"password"} value={val} onChange={e=>onChange(e.target.value)}
          placeholder="• • • •" maxLength={4}
          className="inp w-full px-3 py-2.5 text-sm pr-10 font-mono"
          style={{letterSpacing:"0.3em",colorScheme:"dark"}}/>
        <button onClick={()=>setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2">
          {show
            ?<EyeOff size={14} style={{color:"rgba(255,255,255,0.3)"}}/>
            :<Eye    size={14} style={{color:"rgba(255,255,255,0.3)"}}/>}
        </button>
      </div>
      {val.length>0&&val.length<4&&(
        <p className="text-xs mt-1" style={{color:"rgba(239,68,68,0.7)"}}>{4-val.length} aur digit chahiye</p>
      )}
      {val.length===4&&<p className="text-xs mt-1" style={{color:"#22c55e"}}>✓ PIN ready</p>}
    </div>
  );
}
