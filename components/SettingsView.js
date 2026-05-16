"use client";
import { useState, useEffect } from "react";
import { Hotel, Phone, Download, Trash2, Shield } from "lucide-react";
import { getHotelConfig, saveHotelConfig, exportAllData, exportCSV } from "../lib/db";

export default function SettingsView({ hotelId, hotel, user, onLogout }) {
  const [cfg, setCfg]   = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setCfg(getHotelConfig(hotelId)); }, []);

  const save = () => {
    saveHotelConfig(hotelId, cfg);
    setSaved(true);
    if (navigator.vibrate) navigator.vibrate(50);
    setTimeout(() => setSaved(false), 2000);
  };

  const clearData = () => {
    if (window.confirm("Sab data delete ho jayega! Sure ho?")) {
      ["air_bookings","air_rooms","air_leads"].forEach(k => localStorage.removeItem(k));
      window.location.reload();
    }
  };

  if (!cfg) return null;

  return (
    <div className="h-full flex flex-col gap-3 px-3 py-2 overflow-hidden">
      <h2 className="font-black text-xl flex-shrink-0" style={{ color:"#D4AF37" }}>Settings</h2>

      <div className="flex-1 scroll-y space-y-3 pb-4">

        <Section icon={<Hotel size={12}/>} title="Hotel Info">
          <LabelInput label="Hotel Name" value={cfg.name}
            onChange={v => setCfg({...cfg, name:v})} ph="Hotel ka naam"/>
          <div className="grid grid-cols-2 gap-2">
            <LabelInput label="Total Rooms" value={cfg.totalRooms} type="number"
              onChange={v => setCfg({...cfg, totalRooms:parseInt(v)})} ph="20"/>
            <LabelInput label="GST %" value={cfg.gstPercent} type="number"
              onChange={v => setCfg({...cfg, gstPercent:parseInt(v)})} ph="12"/>
          </div>
        </Section>

        <Section icon={<Phone size={12}/>} title="WhatsApp Numbers">
          <LabelInput label="👑 Owner Phone" value={cfg.ownerPhone}
            onChange={v => setCfg({...cfg, ownerPhone:v})} ph="+91 9999999999" type="tel"/>
          <LabelInput label="🔑 Manager Phone" value={cfg.managerPhone}
            onChange={v => setCfg({...cfg, managerPhone:v})} ph="+91 8888888888" type="tel"/>
        </Section>

        <button onClick={save}
          className="w-full py-3 rounded-2xl font-bold text-sm transition-all"
          style={saved
            ? { background:"rgba(34,197,94,0.15)", color:"#22c55e", border:"1px solid rgba(34,197,94,0.3)" }
            : { background:"linear-gradient(135deg,#b8960c,#D4AF37,#F5C842)", color:"#000", boxShadow:"0 4px 20px rgba(212,175,55,0.3)" }}>
          {saved ? "✅ Saved!" : "Settings Save Karo"}
        </button>

        {user?.role === "owner" && (
          <Section icon={<Download size={12}/>} title="Data Export">
            {[
              { label:"📊 Bookings CSV", action: exportCSV },
              { label:"💾 Complete JSON", action: exportAllData },
            ].map(({ label, action }) => (
              <button key={label} onClick={action}
                className="w-full py-3 rounded-xl card flex items-center gap-2 px-4 text-gray-300 text-sm active:scale-95">
                {label}
              </button>
            ))}
          </Section>
        )}

        <Section icon={<Shield size={12}/>} title="Security">
          {["🔒 Rate lock anti-theft active", "📱 Triple WhatsApp alerts", "👁️ Owner real-time view", "🤖 Groq AI (Llama 3 + LLaVA)"].map(t => (
            <p key={t} className="text-gray-600 text-xs">{t}</p>
          ))}
        </Section>

        {user?.role === "owner" && (
          <div className="rounded-2xl p-4" style={{ border:"1px solid rgba(239,68,68,0.2)", background:"rgba(239,68,68,0.04)" }}>
            <p className="text-red-500 text-xs uppercase tracking-widest mb-3">Danger Zone</p>
            <button onClick={clearData}
              className="w-full py-3 rounded-xl text-red-400 text-sm font-semibold active:scale-95"
              style={{ border:"1px solid rgba(239,68,68,0.25)" }}>
              <Trash2 size={14} className="inline mr-2"/>Sab Data Clear Karo
            </button>
          </div>
        )}

        <button onClick={onLogout}
          className="w-full py-3 rounded-2xl card text-gray-500 text-sm font-medium">
          Logout
        </button>

        <p className="text-center text-gray-800 text-xs pb-2">The GuestInn AI v2.0 • Built for Indian Hotels 🏨</p>
      </div>
    </div>
  );
}

function Section({ icon, title, children }) {
  return (
    <div className="card rounded-2xl p-4 space-y-3">
      <p className="text-gray-600 text-xs uppercase tracking-widest flex items-center gap-1.5">
        <span className="text-gray-700">{icon}</span>{title}
      </p>
      {children}
    </div>
  );
}

function LabelInput({ label, value, onChange, ph, type="text" }) {
  return (
    <div>
      <label className="text-gray-600 text-xs mb-1 block">{label}</label>
      <input type={type} value={value||""} onChange={e => onChange(e.target.value)}
        placeholder={ph} className="inp w-full px-3 py-2.5 text-sm"/>
    </div>
  );
}
