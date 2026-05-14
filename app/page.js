"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  LayoutDashboard, CalendarDays, Users, Cpu, BarChart3, Bell, Menu
} from "lucide-react";

const DashboardView  = dynamic(() => import("../components/DashboardView"),  { ssr: false });
const ScannerView    = dynamic(() => import("../components/ScannerView"),    { ssr: false });
const ReportsView    = dynamic(() => import("../components/ReportsView"),    { ssr: false });
const SettingsView   = dynamic(() => import("../components/SettingsView"),   { ssr: false });
const LoginScreen    = dynamic(() => import("../components/LoginScreen"),    { ssr: false });

const NAV = [
  { id: "home",     icon: LayoutDashboard, label: "Dashboard" },
  { id: "scanner",  icon: CalendarDays,    label: "Bookings"  },
  { id: "guests",   icon: Users,           label: "Guests"    },
  { id: "reports",  icon: Cpu,             label: "Operations"},
  { id: "settings", icon: BarChart3,       label: "Reports"   },
];

export default function App() {
  const [tab, setTab]     = useState("home");
  const [user, setUser]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts]   = useState(0);
  const [timeStr, setTimeStr] = useState("");

  useEffect(() => {
    try {
      const u = localStorage.getItem("air_current_user");
      if (u) setUser(JSON.parse(u));
    } catch {}
    setLoading(false);

    // Live clock
    const tick = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
    };
    tick();
    const iv = setInterval(tick, 60000);
    return () => clearInterval(iv);
  }, []);

  const onLogin  = (u) => setUser(u);
  const onLogout = () => { localStorage.removeItem("air_current_user"); setUser(null); };
  const onNew    = useCallback(() => { setAlerts(a => a + 1); setTimeout(() => setAlerts(0), 5000); }, []);

  if (loading) return (
    <div className="h-screen flex items-center justify-center" style={{ background: "#0A0A0A" }}>
      <div className="w-10 h-10 border-2 rounded-full animate-spin"
        style={{ borderColor: "rgba(212,175,55,0.2)", borderTopColor: "#D4AF37" }} />
    </div>
  );

  if (!user) return <LoginScreen onLogin={onLogin} />;

  const hotelName = process.env.NEXT_PUBLIC_HOTEL_NAME || "The GuestInn";

  return (
    <div className="flex flex-col" style={{ height: "100dvh", background: "#0A0A0A" }}>

      {/* ── Top Bar ─────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 safe-top px-4 pt-2 pb-0">
        <div className="flex items-center justify-between">
          {/* Hamburger */}
          <button className="w-10 h-10 rounded-xl flex items-center justify-center card">
            <Menu size={18} style={{ color: "#D4AF37" }} />
          </button>

          {/* Logo + Name */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2">
              {/* Hotel icon SVG */}
              <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
                <path d="M20 4L6 14v22h28V14L20 4z" stroke="#D4AF37" strokeWidth="2" fill="rgba(212,175,55,0.1)"/>
                <path d="M15 36V24h10v12" stroke="#D4AF37" strokeWidth="2"/>
                <path d="M12 14h16M12 20h16" stroke="#D4AF37" strokeWidth="1.5" strokeDasharray="2 2"/>
                <circle cx="20" cy="10" r="2" fill="#D4AF37"/>
              </svg>
              <span className="font-bold text-lg" style={{ color: "#D4AF37", letterSpacing: "-0.02em" }}>
                {hotelName}
              </span>
            </div>
            <span className="text-xs tracking-widest font-medium"
              style={{ color: "rgba(212,175,55,0.6)", fontSize: 9, letterSpacing: "0.15em" }}>
              AI-POWERED HOTEL MANAGEMENT
            </span>
          </div>

          {/* Bell */}
          <button className="w-10 h-10 rounded-xl flex items-center justify-center card relative">
            <Bell size={18} style={{ color: "#D4AF37" }} />
            {alerts > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500"
                style={{ animation: "pulse-gold 2s infinite" }} />
            )}
          </button>
        </div>
      </header>

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <main className="flex-1 overflow-hidden">
        {tab === "home"     && <DashboardView user={user} onNavigate={setTab} onNewBooking={onNew} />}
        {tab === "scanner"  && <ScannerView   user={user} onSuccess={() => { onNew(); setTab("home"); }} onBack={() => setTab("home")} />}
        {tab === "reports"  && <ReportsView   user={user} />}
        {tab === "settings" && <SettingsView  user={user} onLogout={onLogout} />}
        {tab === "guests"   && (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-600 text-sm">Guests section — Coming soon</p>
          </div>
        )}
      </main>

      {/* ── Bottom Nav ───────────────────────────────────────────────── */}
      <nav className="flex-shrink-0 safe-bottom px-3 pb-2 pt-1">
        <div className="card rounded-2xl px-1 py-2">
          <div className="flex items-center justify-around">
            {NAV.map(({ id, icon: Icon, label }) => {
              const active = tab === id;
              return (
                <button key={id} onClick={() => setTab(id)}
                  className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all"
                  style={{ color: active ? "#D4AF37" : "#4a4a4a" }}>
                  <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                  <span className="text-xs font-medium" style={{ fontSize: 10 }}>{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
