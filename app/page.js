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
  { id: "home",     Icon: LayoutDashboard, label: "Dashboard"  },
  { id: "scanner",  Icon: CalendarDays,    label: "Bookings"   },
  { id: "guests",   Icon: Users,           label: "Guests"     },
  { id: "reports",  Icon: Cpu,             label: "Operations" },
  { id: "settings", Icon: BarChart3,       label: "Reports"    },
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
    setUser(null); setHotel(null); setTab("home");
  };

  const onNew = useCallback(() => {
    setAlerts(a => a + 1);
    setTimeout(() => setAlerts(0), 5000);
  }, []);

  if (loading) return (
    <div style={{ height:"100dvh", display:"flex", alignItems:"center", justifyContent:"center", background:"#07090E" }}>
      <div style={{ width:40, height:40, border:"2px solid rgba(212,175,55,0.15)", borderTopColor:"#D4AF37", borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/>
    </div>
  );

  if (!user) return <LoginScreen onLogin={onLogin}/>;

  const hotelName = hotel?.name || user.hotelName || "Hotel";
  const hotelId   = user.hotelId;

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100dvh", background:"#07090E" }}>

      {/* ══ TOP HEADER ══════════════════════════════════════════════ */}
      <header style={{
        flexShrink: 0,
        background: "linear-gradient(180deg, rgba(8,10,18,0.98) 0%, rgba(5,7,14,0.95) 100%)",
        borderBottom: "1px solid rgba(212,175,55,0.1)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
        paddingTop: "env(safe-area-inset-top)"
      }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px 10px" }}>

          {/* Hamburger */}
          <button onClick={() => setMenu(true)} style={{
            width: 40, height: 40, borderRadius: 12,
            background: "rgba(212,175,55,0.06)",
            border: "1px solid rgba(212,175,55,0.18)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 12px rgba(212,175,55,0.08)"
          }}>
            <Menu size={18} style={{ color: "#D4AF37" }}/>
          </button>

          {/* Logo center */}
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              {/* Hotel icon */}
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: "linear-gradient(135deg,rgba(212,175,55,0.15),rgba(212,175,55,0.05))",
                border: "1px solid rgba(212,175,55,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 0 12px rgba(212,175,55,0.15)"
              }}>
                <span style={{ fontSize: 16 }}>{hotel?.emoji || "🏨"}</span>
              </div>
              <span style={{
                fontSize: 20, fontWeight: 900, color: "#D4AF37",
                letterSpacing: "-0.02em",
                textShadow: "0 0 20px rgba(212,175,55,0.4), 0 0 40px rgba(212,175,55,0.15)"
              }}>
                {hotelName}
              </span>
            </div>
            <span style={{
              fontSize: 8, letterSpacing: "0.18em", fontWeight: 700,
              color: "rgba(212,175,55,0.45)", textTransform: "uppercase"
            }}>
              AI-POWERED HOTEL MANAGEMENT
            </span>
          </div>

          {/* Bell */}
          <button style={{
            width: 40, height: 40, borderRadius: 12,
            background: "rgba(212,175,55,0.06)",
            border: "1px solid rgba(212,175,55,0.18)",
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative",
            boxShadow: "0 2px 12px rgba(212,175,55,0.08)"
          }}>
            <Bell size={18} style={{ color: "#D4AF37" }}/>
            {alerts > 0 && (
              <div style={{
                position: "absolute", top: 6, right: 6,
                width: 10, height: 10, borderRadius: "50%",
                background: "#008cff", border: "2px solid #07090E",
                boxShadow: "0 0 8px #008cff",
                animation: "livePulse 2s infinite"
              }}/>
            )}
          </button>
        </div>
      </header>

      {/* ══ SLIDE-OUT MENU ══════════════════════════════════════════ */}
      {menuOpen && (
        <div style={{ position:"fixed", inset:0, zIndex:50, display:"flex" }}>
          <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.7)", backdropFilter:"blur(4px)" }} onClick={() => setMenu(false)}/>
          <div style={{
            position:"relative", width:280, height:"100%", display:"flex", flexDirection:"column", padding:20,
            background:"linear-gradient(180deg,#0c0f1a,#07090E)",
            borderRight:"1px solid rgba(212,175,55,0.1)",
            boxShadow:"4px 0 40px rgba(0,0,0,0.6)"
          }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:24 }}>{hotel?.emoji || "🏨"}</span>
                <div>
                  <p style={{ fontWeight:800, color:"#fff", fontSize:14 }}>{hotelName}</p>
                  <p style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>{user.role==="owner"?"👑 Owner":"🔑 Manager"}</p>
                </div>
              </div>
              <button onClick={() => setMenu(false)} style={{ width:32, height:32, borderRadius:9, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <X size={15} style={{ color:"rgba(255,255,255,0.4)" }}/>
              </button>
            </div>
            <div style={{ background:"rgba(212,175,55,0.05)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:14, padding:16, marginBottom:16 }}>
              <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.12em", color:"#D4AF37", textTransform:"uppercase", marginBottom:12 }}>Hotel Info</p>
              {[["📍 Location",hotel?.location||"India"],["🛏 Rooms",hotel?.totalRooms||"—"],["📋 Plan",(hotel?.plan||"starter").toUpperCase()],["🔑 Role",user.role==="owner"?"Owner":"Manager"]].map(([l,v])=>(
                <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                  <span style={{ fontSize:12, color:"rgba(255,255,255,0.35)" }}>{l}</span>
                  <span style={{ fontSize:12, fontWeight:600, color:"#fff" }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:14, padding:14, marginBottom:16 }}>
              <p style={{ fontSize:12, fontWeight:600, color:"#fff", marginBottom:8 }}>🔗 Guest Booking Link</p>
              <p style={{ fontSize:11, fontFamily:"monospace", color:"rgba(255,255,255,0.3)", wordBreak:"break-all" }}>/booking/{hotelId}</p>
              <button onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}/booking/${hotelId}`); setMenu(false); }} style={{ marginTop:10, width:"100%", padding:"8px", borderRadius:9, background:"rgba(212,175,55,0.08)", border:"1px solid rgba(212,175,55,0.2)", color:"#D4AF37", fontSize:11, fontWeight:700, cursor:"pointer" }}>
                Copy Link
              </button>
            </div>
            <div style={{ marginTop:"auto" }}>
              <button onClick={onLogout} style={{ width:"100%", padding:12, borderRadius:13, display:"flex", alignItems:"center", justifyContent:"center", gap:8, fontSize:13, fontWeight:600, color:"#f87171", background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.18)", cursor:"pointer" }}>
                <LogOut size={15}/> Hotel Switch / Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MAIN CONTENT ════════════════════════════════════════════ */}
      <main style={{ flex:1, overflow:"hidden" }}>
        {tab==="home"    && <DashboardView hotelId={hotelId} hotel={hotel} user={user} onNavigate={setTab} onNewBooking={onNew}/>}
        {tab==="scanner" && <ScannerView   hotelId={hotelId} hotel={hotel} user={user} onSuccess={()=>{ onNew(); setTab("home"); }} onBack={()=>setTab("home")}/>}
        {tab==="reports" && <ReportsView   hotelId={hotelId} hotel={hotel} user={user}/>}
        {tab==="settings"&& <SettingsView  hotelId={hotelId} hotel={hotel} user={user} onLogout={onLogout}/>}
        {tab==="guests"  && (
          <div style={{ height:"100%", display:"flex", flexDirection:"column", padding:"16px 14px", gap:12 }}>
            <h2 style={{ fontWeight:900, fontSize:22, color:"#D4AF37", textShadow:"0 0 20px rgba(212,175,55,0.3)" }}>Guests</h2>
            <div style={{ flex:1, background:"rgba(6,8,15,0.98)", border:"1px solid rgba(255,255,255,0.055)", borderRadius:20, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <p style={{ fontSize:13, color:"rgba(255,255,255,0.2)" }}>Coming soon</p>
            </div>
          </div>
        )}
      </main>

      {/* ══ BOTTOM NAV ══════════════════════════════════════════════ */}
      <nav style={{
        flexShrink: 0,
        background: "linear-gradient(180deg, rgba(6,8,15,0.98) 0%, rgba(4,5,12,0.99) 100%)",
        borderTop: "1px solid rgba(212,175,55,0.08)",
        boxShadow: "0 -4px 24px rgba(0,0,0,0.6)",
        paddingBottom: "env(safe-area-inset-bottom)"
      }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-around", padding:"8px 6px 6px" }}>
          {NAV.map(({ id, Icon, label }) => {
            const active = tab === id;
            return (
              <button key={id} onClick={() => setTab(id)} style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                padding: "6px 10px", borderRadius: 14, border: "none",
                background: "transparent", cursor: "pointer",
                position: "relative",
                transition: "all 0.2s"
              }}>
                {/* Active glow indicator */}
                {active && (
                  <div style={{
                    position: "absolute", top: -8, left: "50%", transform: "translateX(-50%)",
                    width: 32, height: 3, borderRadius: 2,
                    background: "#D4AF37",
                    boxShadow: "0 0 10px rgba(212,175,55,0.8), 0 0 20px rgba(212,175,55,0.4)"
                  }}/>
                )}
                {/* Icon wrapper */}
                <div style={{
                  width: 36, height: 36, borderRadius: 11,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: active ? "rgba(212,175,55,0.12)" : "transparent",
                  border: active ? "1px solid rgba(212,175,55,0.25)" : "1px solid transparent",
                  boxShadow: active ? "0 0 14px rgba(212,175,55,0.15)" : "none",
                  transition: "all 0.2s"
                }}>
                  <Icon size={18} strokeWidth={active ? 2.5 : 1.8} style={{ color: active ? "#D4AF37" : "rgba(255,255,255,0.25)", filter: active ? "drop-shadow(0 0 5px rgba(212,175,55,0.6))" : "none", transition:"all 0.2s" }}/>
                </div>
                <span style={{
                  fontSize: 9, fontWeight: active ? 800 : 500,
                  color: active ? "#D4AF37" : "rgba(255,255,255,0.22)",
                  letterSpacing: "0.04em",
                  textShadow: active ? "0 0 8px rgba(212,175,55,0.4)" : "none",
                  transition: "all 0.2s"
                }}>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Global spin keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
