"use client";
import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { LayoutDashboard, CalendarDays, Users, Cpu, BarChart3, Bell, Menu, X, LogOut } from "lucide-react";
import { getHotelConfig, getActiveHotelId, initializeRooms } from "../lib/db";

const DashboardView = dynamic(() => import("../components/DashboardView"), { ssr: false });
const ScannerView   = dynamic(() => import("../components/ScannerView"),   { ssr: false });
const ReportsView   = dynamic(() => import("../components/ReportsView"),   { ssr: false });
const SettingsView  = dynamic(() => import("../components/SettingsView"),  { ssr: false });
const LoginScreen   = dynamic(() => import("../components/LoginScreen"),   { ssr: false });

const NAV = [
  { id: "home",     Icon: LayoutDashboard, label: "Dashboard" },
  { id: "scanner",  Icon: CalendarDays,    label: "Bookings"  },
  { id: "guests",   Icon: Users,           label: "Guests"    },
  { id: "reports",  Icon: Cpu,             label: "Operations"},
  { id: "settings", Icon: BarChart3,       label: "Reports"   },
];

export default function App() {
  const [tab,      setTab]     = useState("home");
  const [user,     setUser]    = useState(null);
  const [hotel,    setHotel]   = useState(null);
  const [loading,  setLoading] = useState(true);
  const [alerts,   setAlerts]  = useState(0);
  const [menuOpen, setMenu]    = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("air_current_user");
      if (stored) {
        const u = JSON.parse(stored);
        setUser(u);
        // Load THIS hotel's config using the hotelId from session
        const cfg = getHotelConfig(u.hotelId);
        setHotel(cfg);
        initializeRooms(u.hotelId, cfg.totalRooms);
      }
    } catch {}
    setLoading(false);
  }, []);

  const onLogin = (u) => {
    setUser(u);
    const cfg = getHotelConfig(u.hotelId);
    setHotel(cfg);
    initializeRooms(u.hotelId, cfg.totalRooms);
    setTab("home");
  };

  const onLogout = () => {
    localStorage.removeItem("air_current_user");
    localStorage.removeItem("air_active_hotel");
    setUser(null);
    setHotel(null);
    setTab("home");
  };

  const onNew = useCallback(() => {
    setAlerts(a => a + 1);
    setTimeout(() => setAlerts(0), 5000);
  }, []);

  if (loading) return (
    <div className="h-screen flex items-center justify-center" style={{ background: "#0A0A0A" }}>
      <div className="w-10 h-10 border-2 rounded-full animate-spin"
        style={{ borderColor: "rgba(212,175,55,0.2)", borderTopColor: "#D4AF37" }} />
    </div>
  );

  if (!user) return <LoginScreen onLogin={onLogin} />;

  // ── The hotel name shown is THIS hotel's name, not a hardcoded env var ──
  const hotelName = hotel?.name || user.hotelName || "Hotel";
  const hotelId   = user.hotelId;

  return (
    <div className="flex flex-col" style={{ height: "100dvh", background: "#0A0A0A" }}>

      {/* ── Top Bar ──────────────────────────────────────────────── */}
      <header className="flex-shrink-0 safe-top px-4 pt-2 pb-0">
        <div className="flex items-center justify-between">
          <button onClick={() => setMenu(true)}
            className="w-10 h-10 rounded-xl flex items-center justify-center card">
            <Menu size={18} style={{ color: "#D4AF37" }} />
          </button>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5">
              <span className="text-xl">{hotel?.emoji || "🏨"}</span>
              <span className="font-black text-lg" style={{ color: "#D4AF37", letterSpacing: "-0.02em" }}>
                {hotelName}
              </span>
            </div>
            <span style={{ color: "rgba(212,175,55,0.55)", fontSize: 8, letterSpacing: "0.14em", fontWeight: 600 }}>
              AI-POWERED HOTEL MANAGEMENT
            </span>
          </div>

          <button className="w-10 h-10 rounded-xl flex items-center justify-center card relative">
            <Bell size={18} style={{ color: "#D4AF37" }} />
            {alerts > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-blue-500"
                style={{ animation: "pulseDot 2s infinite" }} />
            )}
          </button>
        </div>
      </header>

      {/* ── Slide-out Menu ───────────────────────────────────────── */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" style={{ backdropFilter: "blur(4px)" }}
            onClick={() => setMenu(false)} />
          <div className="relative w-72 h-full flex flex-col p-5"
            style={{ background: "#111", borderRight: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{hotel?.emoji || "🏨"}</span>
                <div>
                  <p className="font-bold text-white text-sm">{hotelName}</p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                    {user.role === "owner" ? "👑 Owner" : "🔑 Manager"}
                  </p>
                </div>
              </div>
              <button onClick={() => setMenu(false)} className="p-1.5 card rounded-xl">
                <X size={16} className="text-gray-500" />
              </button>
            </div>

            {/* Hotel details */}
            <div className="card-gold rounded-xl p-4 mb-4">
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#D4AF37" }}>
                Hotel Info
              </p>
              {[
                ["📍 Location", hotel?.location || "India"],
                ["🛏 Rooms",    hotel?.totalRooms || "—"],
                ["📋 Plan",     (hotel?.plan || "starter").toUpperCase()],
                ["🔑 Role",     user.role === "owner" ? "Owner" : "Manager"],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{l}</span>
                  <span className="text-xs font-semibold text-white">{v}</span>
                </div>
              ))}
            </div>

            {/* Guest booking link */}
            <div className="card rounded-xl p-3 mb-4">
              <p className="text-xs font-semibold text-white mb-1.5">🔗 Guest Booking Link</p>
              <p className="text-xs font-mono break-all" style={{ color: "rgba(255,255,255,0.35)" }}>
                /booking/{hotelId}
              </p>
              <button
                onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}/booking/${hotelId}`); setMenu(false); }}
                className="mt-2 w-full py-2 rounded-lg text-xs font-semibold btn-outline-gold">
                Copy Link
              </button>
            </div>

            <div className="mt-auto">
              <button onClick={onLogout}
                className="w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold text-red-400"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <LogOut size={16} /> Hotel Switch / Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content ─────────────────────────────────────────── */}
      <main className="flex-1 overflow-hidden">
        {tab === "home"    && <DashboardView hotelId={hotelId} hotel={hotel} user={user} onNavigate={setTab} onNewBooking={onNew} />}
        {tab === "scanner" && <ScannerView   hotelId={hotelId} hotel={hotel} user={user} onSuccess={() => { onNew(); setTab("home"); }} onBack={() => setTab("home")} />}
        {tab === "reports" && <ReportsView   hotelId={hotelId} hotel={hotel} user={user} />}
        {tab === "settings"&& <SettingsView  hotelId={hotelId} hotel={hotel} user={user} onLogout={onLogout} />}
        {tab === "guests"  && (
          <div className="h-full flex flex-col px-3 py-2 gap-3">
            <h2 className="font-black text-xl" style={{ color: "#D4AF37" }}>Guests</h2>
            <div className="card rounded-2xl flex-1 flex items-center justify-center">
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>Coming soon</p>
            </div>
          </div>
        )}
      </main>

      {/* ── Bottom Nav ───────────────────────────────────────────── */}
      <nav className="flex-shrink-0 safe-bottom px-3 pb-2 pt-1">
        <div className="card rounded-2xl px-1 py-2">
          <div className="flex items-center justify-around">
            {NAV.map(({ id, Icon, label }) => {
              const active = tab === id;
              return (
                <button key={id} onClick={() => setTab(id)}
                  className="flex flex-col items-center gap-1 px-2 py-1 rounded-xl transition-all"
                  style={{ color: active ? "#D4AF37" : "#404040" }}>
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
