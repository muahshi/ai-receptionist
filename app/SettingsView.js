"use client";

import { useState, useEffect } from "react";
import {
  Hotel, Phone, Users, Key, Trash2, ChevronRight,
  Info, Shield, Download, ExternalLink
} from "lucide-react";
import { getHotelConfig, saveHotelConfig, exportAllData, exportCSV } from "../lib/db";

export default function SettingsView({ user, onLogout }) {
  const [config, setConfig] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setConfig(getHotelConfig());
  }, []);

  const handleSave = () => {
    saveHotelConfig(config);
    setSaved(true);
    if (navigator.vibrate) navigator.vibrate(50);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClearData = () => {
    if (window.confirm("Sab data delete ho jayega! Confirm karo?")) {
      ["air_bookings", "air_rooms", "air_leads"].forEach((k) =>
        localStorage.removeItem(k)
      );
      window.location.reload();
    }
  };

  if (!config) return null;

  return (
    <div className="h-full flex flex-col gap-3 overflow-hidden">
      <h2 className="font-display text-gold-400 text-xl flex-shrink-0">Settings</h2>

      <div className="flex-1 scroll-area space-y-3 pb-4">
        {/* Hotel Info */}
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <p className="text-gray-500 text-xs uppercase tracking-widest flex items-center gap-1.5">
            <Hotel size={12} /> Hotel Info
          </p>

          <div>
            <label className="text-gray-500 text-xs mb-1 block">Hotel Name</label>
            <input
              value={config.name}
              onChange={(e) => setConfig({ ...config, name: e.target.value })}
              className="input-glass w-full px-3 py-2.5 text-sm"
              placeholder="Hotel ka naam"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-gray-500 text-xs mb-1 block">Total Rooms</label>
              <input
                type="number"
                value={config.totalRooms}
                onChange={(e) =>
                  setConfig({ ...config, totalRooms: parseInt(e.target.value) })
                }
                className="input-glass w-full px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="text-gray-500 text-xs mb-1 block">GST %</label>
              <input
                type="number"
                value={config.gstPercent}
                onChange={(e) =>
                  setConfig({ ...config, gstPercent: parseInt(e.target.value) })
                }
                className="input-glass w-full px-3 py-2.5 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Phone Numbers */}
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <p className="text-gray-500 text-xs uppercase tracking-widest flex items-center gap-1.5">
            <Phone size={12} /> WhatsApp Numbers
          </p>
          <div>
            <label className="text-gray-500 text-xs mb-1 block">👑 Owner Phone</label>
            <input
              value={config.ownerPhone}
              onChange={(e) =>
                setConfig({ ...config, ownerPhone: e.target.value })
              }
              className="input-glass w-full px-3 py-2.5 text-sm"
              placeholder="+91 9999999999"
              type="tel"
            />
          </div>
          <div>
            <label className="text-gray-500 text-xs mb-1 block">🔑 Manager Phone</label>
            <input
              value={config.managerPhone}
              onChange={(e) =>
                setConfig({ ...config, managerPhone: e.target.value })
              }
              className="input-glass w-full px-3 py-2.5 text-sm"
              placeholder="+91 8888888888"
              type="tel"
            />
          </div>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          className={`w-full py-3 rounded-2xl font-bold text-sm transition-all ${
            saved ? "glass-card text-green-400" : "btn-gold"
          }`}
        >
          {saved ? "✅ Saved Ho Gaya!" : "Settings Save Karo"}
        </button>

        {/* Data Export */}
        {user?.role === "owner" && (
          <div className="glass-card rounded-2xl p-4 space-y-2">
            <p className="text-gray-500 text-xs uppercase tracking-widest flex items-center gap-1.5 mb-3">
              <Download size={12} /> Data Export
            </p>
            <button
              onClick={exportCSV}
              className="w-full py-3 rounded-xl glass-card flex items-center gap-2 px-4 text-gray-300 text-sm active:scale-95"
            >
              <span>📊</span> Bookings CSV Download
            </button>
            <button
              onClick={exportAllData}
              className="w-full py-3 rounded-xl glass-card flex items-center gap-2 px-4 text-gray-300 text-sm active:scale-95"
            >
              <span>💾</span> Complete Data Export (JSON)
            </button>
          </div>
        )}

        {/* Info Section */}
        <div className="glass-card rounded-2xl p-4">
          <p className="text-gray-500 text-xs uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Shield size={12} /> Security Info
          </p>
          <div className="space-y-2 text-xs text-gray-500">
            <p>🔒 Rate lock anti-theft protection active hai</p>
            <p>📱 Triple WhatsApp alerts har check-in par</p>
            <p>👁️ Owner ko sabhi bookings real-time dekhne milte hain</p>
            <p>🤖 AI powered by Groq (Llama 3 + LLaVA)</p>
          </div>
        </div>

        {/* Danger Zone - Owner Only */}
        {user?.role === "owner" && (
          <div className="rounded-2xl p-4 border border-red-500/20 bg-red-500/5">
            <p className="text-red-400 text-xs uppercase tracking-widest mb-3">Danger Zone</p>
            <button
              onClick={handleClearData}
              className="w-full py-3 rounded-xl border border-red-500/30 text-red-400 text-sm font-semibold active:scale-95"
            >
              <Trash2 size={14} className="inline mr-2" />
              Sab Data Clear Karo
            </button>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={onLogout}
          className="w-full py-3 rounded-2xl glass-card text-gray-400 text-sm font-medium"
        >
          Logout
        </button>

        <p className="text-center text-gray-700 text-xs pb-2">
          AI Receptionist v1.0 • Built for Indian Hotels 🏨
        </p>
      </div>
    </div>
  );
}
