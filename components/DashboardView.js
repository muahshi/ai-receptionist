"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { RefreshCw, ExternalLink, Check, Brain, ChevronDown, Wrench, Star, Users, Home } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";
import {
  getTodayStats, getRooms, getBookingById, checkoutBooking,
  getTodayBookings, getWeeklyRevenue, initializeRooms
} from "../lib/db";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default function DashboardView({ hotelId, hotel, user, onNavigate, onNewBooking }) {
  const [stats,      setStats]    = useState(null);
  const [rooms,      setRooms]    = useState([]);
  const [insight,    setInsight]  = useState("Aaj ki demand analysis ho rahi hai...");
  const [iLoad,      setILoad]    = useState(false);
  const [selRoom,    setSelRoom]  = useState(null);
  const [revData,    setRevData]  = useState([]);
  const [refreshing, setRefresh]  = useState(false);
  const [copied,     setCopied]   = useState(false);
  const [aiScan,     setAiScan]   = useState(false);
  const scanRef = useRef(null);

  const load = useCallback(() => {
    if (!hotelId) return;
    initializeRooms(hotelId, hotel?.totalRooms || 20);
    setStats(getTodayStats(hotelId));
    setRooms(getRooms(hotelId));
    setRevData(getWeeklyRevenue(hotelId));
  }, [hotelId, hotel?.totalRooms]);

  useEffect(() => {
    load();
    fetchInsight();
    const iv = setInterval(load, 30000);
    return () => clearInterval(iv);
  }, [load]);

  const fetchInsight = async () => {
    setILoad(true);
    try {
      const s = getTodayStats(hotelId);
      const r = await fetch("/api/groq", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "ai_insight", stats: s, hotelName: hotel?.name }),
      });
      const d = await r.json();
      setInsight(d.insight || localInsight(s));
    } catch { setInsight(localInsight(getTodayStats(hotelId))); }
    setILoad(false);
  };

  const handleRefresh = async () => {
    setRefresh(true);
    load();
    await fetchInsight();
    setRefresh(false);
  };

  const handleAiScan = async () => {
    setAiScan(true);
    if (navigator.vibrate) navigator.vibrate([30, 20, 30]);
    await fetchInsight();
    setTimeout(() => setAiScan(false), 2000);
  };

  const copyLink = () => {
    navigator.clipboard?.writeText(`${window.location.origin}/booking/${hotelId}`)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const handleRoomClick = (room) => {
    const booking = room.currentBookingId ? getBookingById(hotelId, room.currentBookingId) : null;
    setSelRoom({ ...room, booking });
  };

  const handleCheckout = async (bookingId) => {
    await checkoutBooking(hotelId, bookingId);
    load();
    setSelRoom(null);
    if (navigator.vibrate) navigator.vibrate(50);
  };

  if (!stats) return <Skeleton />;

  const pct = (Math.random() * 20 + 5).toFixed(1);

  const byFloor = {};
  rooms.forEach(r => {
    if (!byFloor[r.floor]) byFloor[r.floor] = [];
    byFloor[r.floor].push(r);
  });
  const floors = Object.keys(byFloor).map(Number).sort((a, b) => b - a);

  // Status config
  const roomConfig = (r) => {
    if (r.status === "occupied")     return { bg: "linear-gradient(145deg,#1a3a1a,#0d2a0d)", border: "rgba(34,197,94,0.6)",  text: "#4ade80", glow: "rgba(34,197,94,0.25)",   icon: "👤", label: "Occupied"  };
    if (r.status === "reserved")     return { bg: "linear-gradient(145deg,#2a1f00,#1a1300)", border: "rgba(212,175,55,0.6)", text: "#fbbf24", glow: "rgba(212,175,55,0.2)", icon: "📌", label: "Reserved"  };
    if (r.status === "cleaning")     return { bg: "linear-gradient(145deg,#1a1a3a,#0d0d28)", border: "rgba(99,102,241,0.6)", text: "#818cf8", glow: "rgba(99,102,241,0.2)", icon: "🧹", label: "Cleaning"  };
    if (r.status === "out_of_order") return { bg: "rgba(20,20,20,0.9)",                      border: "rgba(75,85,99,0.4)",   text: "#6b7280", glow: "transparent",           icon: "🔧", label: "Out Order" };
    return                                   { bg: "linear-gradient(145deg,#0a1a10,#061209)", border: "rgba(16,185,129,0.5)", text: "#34d399", glow: "rgba(16,185,129,0.15)", icon: "",   label: "Vacant"    };
  };

  // Stats for quick tiles
  const occupied   = rooms.filter(r => r.status === "occupied").length;
  const vacant     = rooms.filter(r => r.status === "vacant").length;
  const reserved   = rooms.filter(r => r.status === "reserved").length;
  const cleaning   = rooms.filter(r => r.status === "cleaning").length;
  const outOfOrder = rooms.filter(r => r.status === "out_of_order").length;
  const total      = rooms.length;

  const Tip = ({ active, payload }) => active && payload?.length ? (
    <div style={{ background:"rgba(0,0,0,0.85)", border:"1px solid rgba(212,175,55,0.3)", borderRadius:8, padding:"6px 10px" }}>
      <p style={{ color:"#D4AF37", fontSize:11, fontWeight:700 }}>₹{payload[0].value.toLocaleString("en-IN")}</p>
    </div>
  ) : null;

  const todayBookings = getTodayBookings(hotelId);
  const pendingCheckIns = todayBookings.filter(b => b.status === "active").length;

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background:"#080808" }}>
      {/* Scrollable content */}
      <div className="flex-1 scroll-y" style={{ paddingBottom: 24 }}>

        {/* ── HERO HEADER ── */}
        <div style={{
          background: "linear-gradient(180deg, rgba(212,175,55,0.08) 0%, transparent 100%)",
          borderBottom: "1px solid rgba(212,175,55,0.08)",
          padding: "16px 16px 14px"
        }}>
          {/* AI Receptionist row */}
          <div style={{
            background: "linear-gradient(135deg, rgba(20,20,20,0.9), rgba(15,15,15,0.9))",
            border: "1px solid rgba(212,175,55,0.15)",
            borderRadius: 16,
            padding: "12px 14px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 14
          }}>
            {/* Avatar with pulse */}
            <div style={{ position:"relative", flexShrink:0 }}>
              <div style={{
                width: 48, height: 48, borderRadius: "50%",
                background: "linear-gradient(135deg,#1a1200,#2e2000)",
                border: "2px solid rgba(212,175,55,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, boxShadow: "0 0 20px rgba(212,175,55,0.15)"
              }}>
                {hotel?.emoji || "🏨"}
              </div>
              <div style={{
                position: "absolute", bottom: 0, right: 0,
                width: 12, height: 12, borderRadius: "50%",
                background: "#22c55e",
                border: "2px solid #080808",
                boxShadow: "0 0 6px #22c55e",
                animation: "pulseDot 2s infinite"
              }}/>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ color:"#D4AF37", fontWeight:700, fontSize:13, marginBottom:1 }}>
                {hotel?.name || "Hotel"}
              </p>
              <p style={{ color:"rgba(255,255,255,0.5)", fontSize:11 }}>
                {greeting()}, {user?.role === "owner" ? "Owner" : "Manager"} 👋 · {new Date().toLocaleDateString("en-IN",{day:"numeric",month:"short"})}
              </p>
            </div>
            <button onClick={handleRefresh} disabled={refreshing}
              style={{ width:36, height:36, background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.2)", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <RefreshCw size={14} style={{ color:"#D4AF37" }} className={refreshing ? "animate-spin" : ""}/>
            </button>
          </div>

          {/* Hotel booking link */}
          <button onClick={copyLink} style={{
            width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12, padding: "9px 14px", display: "flex", alignItems: "center", justifyContent: "space-between"
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <ExternalLink size={12} style={{ color:"#D4AF37" }}/>
              <span style={{ fontSize:11, fontFamily:"monospace", color:"rgba(255,255,255,0.3)" }}>
                /booking/{hotelId}
              </span>
            </div>
            <span style={{ fontSize:11, fontWeight:700, color:"#D4AF37", display:"flex", alignItems:"center", gap:4 }}>
              {copied ? <><Check size={10}/>Copied!</> : "Share Link"}
            </span>
          </button>
        </div>

        <div style={{ padding: "0 14px" }}>

          {/* ── LIVE REVENUE CARD ── */}
          <div style={{
            margin: "14px 0",
            background: "linear-gradient(135deg, rgba(18,14,0,0.95), rgba(12,10,0,0.95))",
            border: "1px solid rgba(212,175,55,0.2)",
            borderRadius: 20,
            padding: "18px 18px 14px",
            position: "relative",
            overflow: "hidden"
          }}>
            {/* Background glow */}
            <div style={{
              position:"absolute", top:-40, right:-40, width:160, height:160,
              background:"radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 70%)",
              pointerEvents:"none"
            }}/>
            <p style={{ fontSize:10, letterSpacing:"0.12em", color:"rgba(212,175,55,0.6)", textTransform:"uppercase", marginBottom:6 }}>
              LIVE REVENUE
            </p>
            <p style={{ fontSize:32, fontWeight:900, color:"#fff", letterSpacing:"-0.03em", lineHeight:1.1, marginBottom:4 }}>
              ₹{stats.todayRevenue.toLocaleString("en-IN")}.00
            </p>
            <p style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginBottom:10 }}>Today's Total Revenue</p>
            <div style={{ display:"inline-flex", alignItems:"center", gap:5, background:"rgba(34,197,94,0.12)", border:"1px solid rgba(34,197,94,0.2)", borderRadius:8, padding:"3px 8px" }}>
              <span style={{ color:"#4ade80", fontSize:11, fontWeight:700 }}>↑ {pct}% vs yesterday</span>
            </div>
            {/* Sparkline */}
            <div style={{ marginTop:12, height:50 }}>
              <ResponsiveContainer width="100%" height={50}>
                <AreaChart data={revData} margin={{ top:0, right:0, left:0, bottom:0 }}>
                  <defs>
                    <linearGradient id="rg2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.4}/>
                      <stop offset="100%" stopColor="#D4AF37" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip content={<Tip/>} cursor={false}/>
                  <Area type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={2}
                    fill="url(#rg2)" dot={false}
                    style={{ filter:"drop-shadow(0 0 6px rgba(212,175,55,0.6))" }}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── STATS ROW ── */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
            {[
              { label:"Occupied", value:`${occupied}/${total}`, sub:`${stats.occupancyPercent}%`, color:"#4ade80", icon:"🛏️", glow:"rgba(34,197,94,0.2)" },
              { label:"Check-ins", value:stats.todayCheckIns, sub:"Today", color:"#D4AF37", icon:"✅", glow:"rgba(212,175,55,0.15)" },
            ].map(s => (
              <div key={s.label} style={{
                background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)",
                borderRadius:16, padding:"14px 14px", position:"relative", overflow:"hidden"
              }}>
                <div style={{ position:"absolute", top:-20, right:-20, width:70, height:70, background:`radial-gradient(circle, ${s.glow} 0%, transparent 70%)`, pointerEvents:"none" }}/>
                <p style={{ fontSize:22 }}>{s.icon}</p>
                <p style={{ fontSize:26, fontWeight:900, color:"#fff", letterSpacing:"-0.02em", lineHeight:1.1, marginTop:4 }}>{s.value}</p>
                <p style={{ fontSize:11, fontWeight:700, color:s.color, marginTop:2 }}>{s.sub}</p>
                <p style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginTop:1 }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* ── QUICK STATS 4-tile ── */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:14 }}>
            {[
              { label:"Vacant",   value:vacant,     color:"#34d399" },
              { label:"Reserved", value:reserved,   color:"#fbbf24" },
              { label:"Cleaning", value:cleaning,   color:"#818cf8" },
              { label:"Offline",  value:outOfOrder, color:"#6b7280" },
            ].map(s => (
              <div key={s.label} style={{
                background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.06)",
                borderRadius:12, padding:"10px 8px", textAlign:"center"
              }}>
                <p style={{ fontSize:20, fontWeight:900, color:s.color, lineHeight:1 }}>{s.value}</p>
                <p style={{ fontSize:9, color:"rgba(255,255,255,0.35)", marginTop:3, letterSpacing:"0.04em" }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* ── ROOM OCCUPANCY GRID ── */}
          <div style={{
            background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)",
            borderRadius:20, padding:"16px 14px", marginBottom:14
          }}>
            {/* Header */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:14 }}>🛏️</span>
                <p style={{ fontSize:11, fontWeight:700, letterSpacing:"0.08em", color:"rgba(255,255,255,0.5)", textTransform:"uppercase" }}>Room Occupancy</p>
              </div>
            </div>
            {/* Legend */}
            <div style={{ display:"flex", flexWrap:"wrap", gap:"6px 14px", marginBottom:14 }}>
              {[
                { c:"#4ade80", l:"Vacant" },
                { c:"#22c55e", l:"Occupied" },
                { c:"#fbbf24", l:"Reserved" },
                { c:"#818cf8", l:"Cleaning" },
                { c:"#6b7280", l:"Out of Order" },
              ].map(x => (
                <div key={x.l} style={{ display:"flex", alignItems:"center", gap:5 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:x.c, boxShadow:`0 0 4px ${x.c}` }}/>
                  <span style={{ fontSize:9, color:"rgba(255,255,255,0.4)" }}>{x.l}</span>
                </div>
              ))}
            </div>

            {/* Room grid - BIG boxes */}
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {floors.map(fl => (
                <div key={fl} style={{ display:"flex", alignItems:"center", gap:6 }}>
                  {/* Floor label */}
                  <span style={{
                    fontSize:9, color:"rgba(255,255,255,0.3)", width:18, textAlign:"right",
                    fontWeight:700, letterSpacing:"0.04em", flexShrink:0
                  }}>
                    {String(fl).padStart(2,"0")}
                  </span>
                  {/* Room buttons */}
                  <div style={{ display:"flex", gap:5, flex:1, flexWrap:"wrap" }}>
                    {byFloor[fl].map(room => {
                      const c = roomConfig(room);
                      return (
                        <button key={room.id} onClick={() => handleRoomClick(room)}
                          style={{
                            flex: "1 1 0",
                            minWidth: 40,
                            maxWidth: 58,
                            aspectRatio: "1 / 1.1",
                            borderRadius: 10,
                            background: c.bg,
                            border: `1.5px solid ${c.border}`,
                            boxShadow: `0 0 10px ${c.glow}, inset 0 1px 0 rgba(255,255,255,0.06)`,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 2,
                            cursor: "pointer",
                            transition: "all 0.15s",
                            padding: "4px 2px"
                          }}
                          onTouchStart={e => e.currentTarget.style.transform = "scale(0.92)"}
                          onTouchEnd={e => e.currentTarget.style.transform = "scale(1)"}
                        >
                          {c.icon && <span style={{ fontSize:10, lineHeight:1 }}>{c.icon}</span>}
                          <span style={{ fontSize:9, color:c.text, fontWeight:800, letterSpacing:"0.02em" }}>
                            {room.number}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── QUICK ACTIONS GRID ── */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14, position:"relative" }}>
            {/* Left col */}
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {/* Guest Check-ins */}
              <div style={{
                background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)",
                borderRadius:16, padding:"14px"
              }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
                  <Users size={14} style={{ color:"#D4AF37" }}/>
                  <p style={{ fontSize:9, color:"rgba(255,255,255,0.4)", letterSpacing:"0.1em", textTransform:"uppercase" }}>Guest Check-in</p>
                </div>
                <p style={{ fontSize:28, fontWeight:900, color:"#fff", lineHeight:1 }}>{pendingCheckIns}</p>
                <p style={{ fontSize:11, color:"#D4AF37", fontWeight:600, marginTop:2 }}>
                  {pendingCheckIns > 0 ? "Pending" : "All Done"}
                </p>
              </div>
              {/* Housekeeping */}
              <div style={{
                background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)",
                borderRadius:16, padding:"14px"
              }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
                  <span style={{ fontSize:14 }}>🧹</span>
                  <p style={{ fontSize:9, color:"rgba(255,255,255,0.4)", letterSpacing:"0.1em", textTransform:"uppercase" }}>Housekeeping</p>
                </div>
                <p style={{ fontSize:28, fontWeight:900, color:"#fff", lineHeight:1 }}>{cleaning}</p>
                <p style={{ fontSize:11, color:"#818cf8", fontWeight:600, marginTop:2 }}>Rooms</p>
              </div>
            </div>

            {/* AI SCAN center button */}
            <div style={{
              display:"flex", flexDirection:"column", gap:10
            }}>
              {/* Maintenance */}
              <div style={{
                background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)",
                borderRadius:16, padding:"14px"
              }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
                  <Wrench size={14} style={{ color:"#f87171" }}/>
                  <p style={{ fontSize:9, color:"rgba(255,255,255,0.4)", letterSpacing:"0.1em", textTransform:"uppercase" }}>Maintenance</p>
                </div>
                <p style={{ fontSize:28, fontWeight:900, color:"#fff", lineHeight:1 }}>{outOfOrder}</p>
                <p style={{ fontSize:11, color:"#f87171", fontWeight:600, marginTop:2 }}>Pending</p>
              </div>
              {/* Reviews */}
              <div style={{
                background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)",
                borderRadius:16, padding:"14px"
              }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
                  <Star size={14} style={{ color:"#D4AF37" }}/>
                  <p style={{ fontSize:9, color:"rgba(255,255,255,0.4)", letterSpacing:"0.1em", textTransform:"uppercase" }}>Rating</p>
                </div>
                <p style={{ fontSize:28, fontWeight:900, color:"#fff", lineHeight:1 }}>4.8</p>
                <p style={{ fontSize:11, color:"#D4AF37", fontWeight:600, marginTop:2 }}>Reviews</p>
              </div>
            </div>
          </div>

          {/* ── AI SCAN BUTTON ── */}
          <div style={{ display:"flex", justifyContent:"center", marginBottom:14 }}>
            <button onClick={handleAiScan}
              style={{
                width:110, height:110, borderRadius:"50%", position:"relative",
                background: aiScan
                  ? "radial-gradient(circle, rgba(0,112,243,0.3) 0%, rgba(0,0,0,0.9) 70%)"
                  : "radial-gradient(circle, rgba(0,40,80,0.8) 0%, rgba(0,0,0,0.9) 70%)",
                border: "2px solid rgba(0,112,243,0.4)",
                boxShadow: aiScan
                  ? "0 0 40px rgba(0,112,243,0.6), 0 0 80px rgba(0,112,243,0.3)"
                  : "0 0 20px rgba(0,112,243,0.25)",
                cursor:"pointer", display:"flex", flexDirection:"column",
                alignItems:"center", justifyContent:"center", gap:4,
                transition: "all 0.3s"
              }}>
              {/* Rotating rings */}
              <div style={{
                position:"absolute", inset:-10, borderRadius:"50%",
                border:"1px solid transparent",
                borderTopColor:"rgba(0,112,243,0.5)",
                animation:"spinRing 2s linear infinite"
              }}/>
              <div style={{
                position:"absolute", inset:-18, borderRadius:"50%",
                border:"1px solid transparent",
                borderBottomColor:"rgba(212,175,55,0.3)",
                animation:"spinRing 3s linear infinite reverse"
              }}/>
              <Brain size={20} style={{ color:"#60a5fa", filter:"drop-shadow(0 0 6px #60a5fa)" }}/>
              <span style={{ fontSize:11, fontWeight:900, color:"#60a5fa", letterSpacing:"0.1em" }}>
                {aiScan ? "SCANNING" : "AI SCAN"}
              </span>
            </button>
          </div>

          {/* ── AI INSIGHTS ── */}
          <div style={{
            background:"linear-gradient(135deg, rgba(0,30,80,0.4), rgba(0,20,60,0.3))",
            border:"1px solid rgba(0,112,243,0.2)",
            borderRadius:20, padding:"16px",
            marginBottom:14,
            position:"relative", overflow:"hidden"
          }}>
            {/* BG decoration */}
            <div style={{
              position:"absolute", bottom:-30, right:-20, width:120, height:120,
              background:"radial-gradient(circle, rgba(0,112,243,0.08) 0%, transparent 70%)",
              pointerEvents:"none"
            }}/>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
              <div style={{
                width:32, height:32, borderRadius:10,
                background:"rgba(0,112,243,0.15)", border:"1px solid rgba(0,112,243,0.2)",
                display:"flex", alignItems:"center", justifyContent:"center"
              }}>
                <Brain size={14} style={{ color:"#60a5fa" }}/>
              </div>
              <p style={{ fontSize:11, fontWeight:800, color:"#60a5fa", letterSpacing:"0.1em" }}>AI INSIGHTS</p>
            </div>
            {iLoad ? (
              <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{
                    width:6, height:6, borderRadius:"50%", background:"#60a5fa",
                    animation:"bounce 1.2s infinite",
                    animationDelay:`${i*0.2}s`
                  }}/>
                ))}
              </div>
            ) : (
              <p style={{ fontSize:13, color:"rgba(255,255,255,0.7)", lineHeight:1.6 }}>{insight}</p>
            )}
            <button style={{
              marginTop:12, padding:"7px 14px", borderRadius:10,
              background:"linear-gradient(135deg,#b8960c,#D4AF37)", color:"#000",
              fontSize:11, fontWeight:800, cursor:"pointer", border:"none"
            }} onClick={fetchInsight}>
              Refresh Insights
            </button>
          </div>

          {/* ── TODAY'S CHECK-INS ── */}
          <div style={{
            background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)",
            borderRadius:20, overflow:"hidden", marginBottom:14
          }}>
            <div style={{
              display:"flex", alignItems:"center", justifyContent:"space-between",
              padding:"14px 16px", borderBottom:"1px solid rgba(255,255,255,0.05)"
            }}>
              <p style={{ fontSize:11, fontWeight:700, letterSpacing:"0.08em", color:"rgba(255,255,255,0.4)", textTransform:"uppercase" }}>
                Aaj Ke Check-ins
              </p>
              <span style={{ fontSize:11, fontWeight:700, color:"#D4AF37" }}>
                {todayBookings.filter(b => b.status === "active").length} active
              </span>
            </div>
            {todayBookings.length === 0 ? (
              <div style={{ padding:"24px 16px", textAlign:"center" }}>
                <p style={{ fontSize:28, marginBottom:8 }}>🌙</p>
                <p style={{ fontSize:13, color:"rgba(255,255,255,0.25)" }}>Aaj koi check-in nahi hua</p>
              </div>
            ) : todayBookings.slice(0, 5).map((b, idx) => (
              <div key={b.id} style={{
                padding:"13px 16px",
                borderBottom: idx < Math.min(4, todayBookings.length - 1) ? "1px solid rgba(255,255,255,0.04)" : "none",
                display:"flex", alignItems:"center", justifyContent:"space-between"
              }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:13, color:"#fff", fontWeight:700, marginBottom:2 }}>{b.guestName}</p>
                  <p style={{ fontSize:10, color:"rgba(255,255,255,0.35)" }}>Room {b.roomId} · {b.nights} raat · {b.paymentMode}</p>
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <p style={{ fontSize:14, fontWeight:800, color:"#D4AF37" }}>
                    ₹{Number(b.totalAmount || 0).toLocaleString("en-IN")}
                  </p>
                  <span style={{
                    fontSize:9, fontWeight:700, letterSpacing:"0.06em",
                    color: b.status === "active" ? "#4ade80" : "#6b7280",
                    background: b.status === "active" ? "rgba(34,197,94,0.1)" : "rgba(107,114,128,0.1)",
                    padding:"2px 6px", borderRadius:4
                  }}>
                    {b.status?.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>{/* /padding div */}
      </div>{/* /scroll */}

      {/* ── ROOM DETAIL MODAL ── */}
      {selRoom && (
        <div
          style={{ position:"absolute", inset:0, zIndex:50, display:"flex", alignItems:"flex-end", background:"rgba(0,0,0,0.75)", backdropFilter:"blur(4px)" }}
          onClick={() => setSelRoom(null)}
        >
          <div
            style={{ width:"100%", background:"linear-gradient(180deg,#141414,#0d0d0d)", borderRadius:"24px 24px 0 0", padding:24, border:"1px solid rgba(255,255,255,0.08)", borderBottom:"none" }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ width:36, height:3, background:"rgba(255,255,255,0.15)", borderRadius:3, margin:"0 auto 20px" }}/>
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:18 }}>
              {/* Room number badge */}
              <div style={{
                width:56, height:56, borderRadius:16,
                ...(() => { const c = roomConfig(selRoom); return { background:c.bg, border:`2px solid ${c.border}`, boxShadow:`0 0 16px ${c.glow}` }; })(),
                display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:2
              }}>
                <span style={{ fontSize:14 }}>{roomConfig(selRoom).icon}</span>
                <span style={{ fontSize:11, color:roomConfig(selRoom).text, fontWeight:800 }}>{selRoom.number}</span>
              </div>
              <div>
                <p style={{ fontSize:20, fontWeight:900, color:"#fff", letterSpacing:"-0.02em" }}>Room {selRoom.number}</p>
                <p style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginTop:1 }}>
                  {selRoom.type || "Standard"} · Floor {selRoom.floor} · <span style={{ color:roomConfig(selRoom).text }}>{roomConfig(selRoom).label}</span>
                </p>
              </div>
            </div>

            {selRoom.booking ? (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:16 }}>
                  <p style={{ fontSize:16, fontWeight:800, color:"#fff", marginBottom:4 }}>{selRoom.booking.guestName}</p>
                  <p style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginBottom:10 }}>{selRoom.booking.guestPhone}</p>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>{selRoom.booking.nights} raatein</span>
                    <span style={{ fontSize:16, fontWeight:800, color:"#D4AF37" }}>₹{Number(selRoom.booking.totalAmount || 0).toLocaleString("en-IN")}</span>
                  </div>
                </div>
                <button onClick={() => handleCheckout(selRoom.booking.id)} style={{
                  width:"100%", padding:"15px", borderRadius:16, fontWeight:800, fontSize:14,
                  background:"linear-gradient(135deg,#b8960c,#D4AF37,#F5C842)", color:"#000",
                  border:"none", cursor:"pointer", boxShadow:"0 4px 20px rgba(212,175,55,0.35)"
                }}>
                  ✓ Check-out Karo
                </button>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:16, textAlign:"center" }}>
                  <p style={{ fontSize:13, color:"rgba(255,255,255,0.4)", textTransform:"capitalize" }}>{selRoom.status?.replace("_"," ")}</p>
                  <p style={{ fontSize:11, color:"rgba(255,255,255,0.25)", marginTop:4 }}>Base Rate: ₹{selRoom.baseRate}/raat</p>
                </div>
                {selRoom.status === "vacant" && (
                  <button onClick={() => { setSelRoom(null); onNewBooking && onNewBooking(selRoom); }} style={{
                    width:"100%", padding:"15px", borderRadius:16, fontWeight:800, fontSize:14,
                    background:"linear-gradient(135deg,#b8960c,#D4AF37,#F5C842)", color:"#000",
                    border:"none", cursor:"pointer", boxShadow:"0 4px 20px rgba(212,175,55,0.35)"
                  }}>
                    + Nayi Booking Karo
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inline styles for animations */}
      <style>{`
        @keyframes pulseDot {
          0%,100% { box-shadow: 0 0 4px #22c55e; }
          50%      { box-shadow: 0 0 10px #22c55e, 0 0 20px rgba(34,197,94,0.4); }
        }
        @keyframes bounce {
          0%,80%,100% { transform: scale(0); }
          40%          { transform: scale(1); }
        }
        @keyframes spinRing {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function localInsight(s) {
  if (s.occupancyPercent > 80) return `Aaj occupancy ${s.occupancyPercent}% hai — bohot acha! Peak demand mein dynamic pricing try karo.`;
  if (s.occupancyPercent > 50) return `${s.vacantRooms} rooms khali hain — online listing promote karo ya walk-in offers do.`;
  return `Occupancy kam hai. Weekend package ya local business se tie-up consider karo.`;
}

function Skeleton() {
  return (
    <div style={{ height:"100%", padding:"16px 14px", display:"flex", flexDirection:"column", gap:12, background:"#080808" }}>
      {[120, 80, 200, 100].map((h, i) => (
        <div key={i} style={{ height:h, background:"rgba(255,255,255,0.03)", borderRadius:20, animation:"pulse 1.5s infinite" }}/>
      ))}
    </div>
  );
}
