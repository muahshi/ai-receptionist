"use client";
import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { LayoutDashboard, CalendarDays, Users, Cpu, BarChart3, Bell, Menu, X, LogOut } from "lucide-react";
import { getHotelConfig, getActiveHotelId, initializeRooms, getDemoHotels } from "../lib/db";

const DashboardView = dynamic(() => import("../components/DashboardView"), { ssr: false });
const ScannerView   = dynamic(() => import("../components/ScannerView"),   { ssr: false });
const ReportsView   = dynamic(() => import("../components/ReportsView"),   { ssr: false });
const SettingsView  = dynamic(() => import("../components/SettingsView"),  { ssr: false });
const LoginScreen   = dynamic(() => import("../components/LoginScreen"),   { ssr: false });

const NAV = [
  { id:"home",     Icon:LayoutDashboard, label:"Dashboard" },
  { id:"scanner",  Icon:CalendarDays,    label:"Bookings"  },
  { id:"guests",   Icon:Users,           label:"Guests"    },
  { id:"reports",  Icon:Cpu,             label:"Operations"},
  { id:"settings", Icon:BarChart3,       label:"Reports"   },
];

export default function App() {
  const [tab,      setTab]      = useState("home");
  const [user,     setUser]     = useState(null);
  const [hotel,    setHotel]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [alerts,   setAlerts]   = useState(0);
  const [menuOpen, setMenu]     = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("air_current_user");
      if (stored) {
        const u = JSON.parse(stored);
        setUser(u);
        const cfg = getHotelConfig(u.hotelId);
        setHotel(cfg);
        initializeRooms(u.hotelId, cfg.totalRooms || 20);
      }
    } catch {}
    setLoading(false);
  }, []);

  const onLogin = (u) => {
    setUser(u);
    const cfg = getHotelConfig(u.hotelId);
    setHotel(cfg);
    initializeRooms(u.hotelId, cfg.totalRooms || 20);
    setTab("home");
  };

  const onLogout = () => {
    localStorage.removeItem("air_current_user");
    localStorage.removeItem("air_active_hotel");
    setUser(null); setHotel(null); setTab("home");
  };

  const onNew = useCallback(() => {
    setAlerts(a => a + 1);
    setTimeout(() => setAlerts(0), 5000);
  }, []);

  if (loading) return (
    <div className="h-screen flex items-center justify-center" style={{ background: "#07090E" }}>
      <div className="w-10 h-10 border-2 rounded-full animate-spin"
        style={{ borderColor: "rgba(212,175,55,0.15)", borderTopColor: "#D4AF37" }} />
    </div>
  );

  if (!user) return <LoginScreen onLogin={onLogin} />;

  const hotelName = hotel?.name || user.hotelName || "Hotel";
  const hotelId   = user.hotelId;
  const hotelEmoji = hotel?.emoji || getDemoHotels().find(h=>h.id===hotelId)?.emoji || "🏨";

  return (
    <div className="app-shell">

      {/* ── TOP HEADER ──────────────────────────────────────── */}
      <header className="flex-shrink-0 safe-top" style={{ padding: "8px 14px 6px" }}>
        <div className="flex items-center justify-between">
          {/* Hamburger */}
          <button onClick={() => setMenu(true)}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <Menu size={18} style={{ color: "#D4AF37" }} />
          </button>

          {/* Hotel Logo + Name */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2">
              {/* Hotel icon frame */}
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg"
                style={{ background: "linear-gradient(135deg,#1a1200,#2e2000)", border: "1px solid rgba(212,175,55,0.35)" }}>
                {hotelEmoji}
              </div>
              <span className="font-black" style={{ fontSize: 20, color: "#D4AF37", letterSpacing: "-0.02em" }}>
                {hotelName}
              </span>
            </div>
            <span style={{ fontSize: 8, color: "rgba(212,175,55,0.5)", letterSpacing: "0.16em", fontWeight: 600 }}>
              AI-POWERED HOTEL MANAGEMENT
            </span>
          </div>

          {/* Bell */}
          <button className="w-10 h-10 rounded-xl flex items-center justify-center relative transition-all active:scale-90"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <Bell size={18} style={{ color: "#D4AF37" }} />
            {alerts > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-blue-500"
                style={{ animation: "pulseDot 2s infinite" }} />
            )}
          </button>
        </div>
      </header>

      {/* ── SLIDE-OUT MENU ──────────────────────────────────── */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/65" style={{ backdropFilter: "blur(6px)" }}
            onClick={() => setMenu(false)} />
          <div className="relative flex flex-col p-5"
            style={{ width: 280, height: "100%", background: "#0d1117", borderRight: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center justify-between mb-7">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{hotelEmoji}</span>
                <div>
                  <p className="font-bold text-white text-sm">{hotelName}</p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                    {user.role === "owner" ? "👑 Owner" : "🔑 Manager"}
                  </p>
                </div>
              </div>
              <button onClick={() => setMenu(false)}
                className="p-2 rounded-xl active:scale-90"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <X size={15} className="text-gray-500" />
              </button>
            </div>

            <div className="glass-gold rounded-xl p-4 mb-5">
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#D4AF37" }}>Hotel Info</p>
              {[
                ["📍 Location", hotel?.location || "India"],
                ["🛏 Rooms",    hotel?.totalRooms || "—"],
                ["📋 Plan",     (hotel?.plan || "starter").toUpperCase()],
                ["🔑 Role",     user.role === "owner" ? "Owner" : "Manager"],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between py-1.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{l}</span>
                  <span className="text-xs font-semibold text-white">{v}</span>
                </div>
              ))}
            </div>

            <div className="glass rounded-xl p-3 mb-5">
              <p className="text-xs font-semibold text-white mb-1.5">🔗 Guest Booking Link</p>
              <p className="text-xs font-mono break-all" style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>
                /booking/{hotelId}
              </p>
              <button
                onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}/booking/${hotelId}`); setMenu(false); }}
                className="mt-2 w-full py-2 rounded-lg text-xs font-bold btn-outline-gold">
                Copy Link
              </button>
            </div>

            <div className="mt-auto">
              <button onClick={onLogout}
                className="w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold text-red-400 transition-all active:scale-95"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <LogOut size={16} /> Hotel Switch / Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ────────────────────────────────────── */}
      <main className="flex-1 overflow-hidden">
        {tab === "home"     && <DashboardView hotelId={hotelId} hotel={hotel} user={user} onNavigate={setTab} onNewBooking={onNew} />}
        {tab === "scanner"  && <ScannerView   hotelId={hotelId} hotel={hotel} user={user} onSuccess={() => { onNew(); setTab("home"); }} onBack={() => setTab("home")} />}
        {tab === "reports"  && <ReportsView   hotelId={hotelId} hotel={hotel} user={user} />}
        {tab === "settings" && <SettingsView  hotelId={hotelId} hotel={hotel} user={user} onLogout={onLogout} />}
        {tab === "guests"   && (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>Guests section coming soon</p>
          </div>
        )}
      </main>

      {/* ── BOTTOM NAV ──────────────────────────────────────── */}
      <nav className="flex-shrink-0 safe-bottom" style={{ padding: "6px 14px 10px" }}>
        <div className="glass rounded-2xl px-1 py-2">
          <div className="flex items-center justify-around">
            {NAV.map(({ id, Icon, label }) => {
              const active = tab === id;
              return (
                <button key={id} onClick={() => setTab(id)}
                  className="flex flex-col items-center gap-1 px-2 py-1 rounded-xl transition-all active:scale-90"
                  style={{ color: active ? "#D4AF37" : "#383838" }}>
                  <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                  <span className="font-medium" style={{ fontSize: 9 }}>{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
