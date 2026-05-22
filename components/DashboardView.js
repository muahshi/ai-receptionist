"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";
import { Check, Lock, ExternalLink } from "lucide-react";
import {
  getTodayStats, getRooms, getBookingById, checkoutBooking,
  getTodayBookings, getWeeklyRevenue, initializeRooms
} from "../lib/db";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

/* ─── INLINE STYLES (no external CSS needed) ─────────────────── */
const S = {
  page: {
    background: "radial-gradient(ellipse at 20% 0%, #111625 0%, #07090E 60%)",
    minHeight: "100%",
    paddingBottom: 32,
  },

  /* AI Receptionist */
  aiCard: {
    margin: "12px 12px 0",
    borderRadius: 20,
    padding: "14px 16px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.09)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    display: "flex", alignItems: "center", gap: 14,
  },
  avatarWrap: {
    position: "relative", flexShrink: 0,
    width: 72, height: 72,
  },
  avatarInner: {
    width: 72, height: 72, borderRadius: "50%",
    background: "linear-gradient(135deg,#1a1a2e,#16213e)",
    border: "2.5px solid #D4AF37",
    boxShadow: "0 0 0 4px rgba(212,175,55,0.12), 0 0 20px rgba(212,175,55,0.25)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 38, overflow: "hidden",
  },
  avatarBlueRing: {
    position: "absolute", inset: -6,
    borderRadius: "50%",
    border: "1.5px solid rgba(0,112,243,0.4)",
    boxShadow: "0 0 10px rgba(0,112,243,0.2)",
    animation: "rotateRing 8s linear infinite",
  },
  pulseDot: {
    position: "absolute", bottom: 2, left: 2,
    width: 14, height: 14, borderRadius: "50%",
    background: "#3B82F6",
    boxShadow: "0 0 8px #3B82F6, 0 0 16px rgba(59,130,246,0.5)",
    animation: "pulseDot 2s ease infinite",
  },

  /* Revenue */
  revCard: {
    margin: "12px 12px 0",
    borderRadius: 20,
    background: "linear-gradient(160deg,#111825 0%,#0a0d15 100%)",
    border: "1px solid rgba(212,175,55,0.2)",
    overflow: "hidden",
    position: "relative",
  },
  revInner: { padding: "20px 20px 0" },
  revLabel: {
    fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
    color: "rgba(255,255,255,0.4)", textTransform: "uppercase",
  },
  revAmount: {
    fontSize: 38, fontWeight: 900, letterSpacing: "-0.03em",
    lineHeight: 1, marginTop: 6,
    background: "linear-gradient(135deg,#b8960c 0%,#D4AF37 45%,#F5C842 100%)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
    filter: "drop-shadow(0 0 12px rgba(212,175,55,0.5))",
  },
  revBadge: {
    display: "inline-flex", alignItems: "center", gap: 4,
    padding: "4px 10px", borderRadius: 100, marginTop: 10,
    background: "rgba(34,197,94,0.12)",
    border: "1px solid rgba(34,197,94,0.25)",
    color: "#22c55e", fontSize: 11, fontWeight: 700,
  },

  /* Room Occupancy */
  roomCard: {
    margin: "12px 12px 0",
    borderRadius: 20, padding: "16px 14px",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  roomHeader: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    marginBottom: 16,
  },
  roomTitle: {
    display: "flex", alignItems: "center", gap: 8,
    fontSize: 13, fontWeight: 800, color: "#fff",
    letterSpacing: "0.06em",
  },
  towerBadge: {
    display: "flex", alignItems: "center", gap: 4,
    padding: "5px 10px", borderRadius: 10, fontSize: 11, fontWeight: 600,
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "rgba(255,255,255,0.55)",
  },
  expandBtn: {
    width: 28, height: 28, borderRadius: 8, display:"flex",
    alignItems:"center", justifyContent:"center",
    background: "rgba(255,255,255,0.06)",
  },

  /* 3D Grid perspective wrapper */
  gridPerspective: {
    perspective: "1000px",
    perspectiveOrigin: "50% 0%",
    overflowX: "auto",
  },
  gridInner: {
    transform: "rotateX(22deg)",
    transformStyle: "preserve-3d",
    transformOrigin: "top center",
    minWidth: 280,
  },

  /* Quick actions */
  quickGrid: {
    margin: "12px 12px 0",
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    gridTemplateRows: "1fr 1fr",
    gap: 10,
  },
  quickCard: {
    borderRadius: 18, padding: "14px 14px 12px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  quickLabel: {
    fontSize: 8, fontWeight: 700, letterSpacing: "0.1em",
    color: "rgba(255,255,255,0.35)", textTransform: "uppercase",
    display: "flex", alignItems: "center", gap: 4, marginBottom: 8,
  },
  quickValue: {
    fontSize: 32, fontWeight: 900, color: "#fff",
    letterSpacing: "-0.04em", lineHeight: 1,
  },
  quickSub: { fontSize: 12, fontWeight: 600, marginTop: 4 },

  /* AI SCAN */
  scanWrap: {
    gridRow: "1 / 3",
    gridColumn: "2 / 3",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  scanBtn: {
    width: 130, height: 130,
    borderRadius: "50%",
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    cursor: "pointer", position: "relative",
    border: "none", background: "none", padding: 0,
  },

  /* AI Insights */
  insightCard: {
    margin: "12px 12px 0",
    borderRadius: 20, padding: "18px 16px",
    background: "linear-gradient(135deg,#060d1f,#080a14)",
    border: "1px solid rgba(0,112,243,0.25)",
    boxShadow: "0 0 40px rgba(0,112,243,0.07)",
    display: "flex", gap: 12, position: "relative", overflow: "hidden",
  },
  insightBtn: {
    marginTop: 14, padding: "9px 18px", borderRadius: 12,
    fontSize: 12, fontWeight: 700,
    background: "rgba(212,175,55,0.1)",
    border: "1px solid rgba(212,175,55,0.35)",
    color: "#D4AF37", cursor: "pointer",
    boxShadow: "0 0 12px rgba(212,175,55,0.1)",
  },
};

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function DashboardView({ hotelId, hotel, user, onNavigate, onNewBooking }) {
  const [stats,      setStats]    = useState(null);
  const [rooms,      setRooms]    = useState([]);
  const [insight,    setInsight]  = useState("High demand detected for Deluxe Rooms this weekend.");
  const [iLoad,      setILoad]    = useState(false);
  const [selRoom,    setSelRoom]  = useState(null);
  const [revData,    setRevData]  = useState([]);
  const [scanning,   setScanning] = useState(false);
  const [copied,     setCopied]   = useState(false);
  const [pct]                     = useState(() => (Math.random() * 10 + 12).toFixed(1));

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
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ type:"ai_insight", stats:s, hotelName:hotel?.name }),
      });
      const d = await r.json();
      setInsight(d.insight || localInsight(s));
    } catch { setInsight(localInsight(getTodayStats(hotelId))); }
    setILoad(false);
  };

  const handleCheckout = async (bookingId) => {
    await checkoutBooking(hotelId, bookingId);
    load(); setSelRoom(null);
    if (navigator.vibrate) navigator.vibrate(50);
  };

  const handleRoomClick = (room) => {
    const booking = room.currentBookingId ? getBookingById(hotelId, room.currentBookingId) : null;
    setSelRoom({ ...room, booking });
  };

  const handleScan = () => {
    setScanning(true);
    if (navigator.vibrate) navigator.vibrate([30, 20, 60]);
    setTimeout(() => { setScanning(false); onNavigate && onNavigate("scanner"); }, 700);
  };

  const copyLink = () => {
    navigator.clipboard?.writeText(`${window.location.origin}/booking/${hotelId}`)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  if (!stats) return <Skeleton />;

  // Build floor map
  const byFloor = {};
  rooms.forEach(r => {
    const f = r.floor || 1;
    if (!byFloor[f]) byFloor[f] = [];
    byFloor[f].push(r);
  });
  const floors = Object.keys(byFloor).map(Number).sort((a, b) => b - a);
  const maxCols = Math.max(...floors.map(f => byFloor[f].length), 8);
  const pendingCI = getTodayBookings(hotelId).filter(b => b.status === "active").length;

  return (
    <>
      {/* ── EMBEDDED CSS ── */}
      <style>{`
        @keyframes pulseDot {
          0%,100%{opacity:1;transform:scale(1);box-shadow:0 0 8px #3B82F6,0 0 16px rgba(59,130,246,0.5)}
          50%{opacity:.6;transform:scale(.75);box-shadow:0 0 4px #3B82F6}
        }
        @keyframes rotateRing {
          from{transform:rotate(0deg)} to{transform:rotate(360deg)}
        }
        @keyframes soundBar {
          from{transform:scaleY(.35)} to{transform:scaleY(1)}
        }
        @keyframes scanPulse {
          0%,100%{box-shadow:0 0 0 0 rgba(0,112,243,.7)}
          70%{box-shadow:0 0 0 20px rgba(0,112,243,0)}
        }
        @keyframes scanRing {
          from{transform:rotate(0deg)} to{transform:rotate(360deg)}
        }
        @keyframes scanLaser {
          0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)}
        }
        @keyframes goldGlow {
          0%,100%{filter:drop-shadow(0 0 6px rgba(212,175,55,.6))}
          50%{filter:drop-shadow(0 0 18px rgba(212,175,55,1))}
        }
        @keyframes holoBuild {
          0%,100%{opacity:.7} 50%{opacity:1}
        }
        @keyframes shimmer {
          0%{background-position:-200% 0} 100%{background-position:200% 0}
        }
        .room3d {
          transform-style: preserve-3d;
          transition: transform .12s ease, box-shadow .12s ease;
        }
        .room3d:active { transform: scale(.88) translateZ(-4px)!important; }
        .scan-active {
          animation: scanPulse .6s ease-out!important;
        }
        .rev-chart-glow path { filter: drop-shadow(0 0 10px #D4AF37); }
        ::-webkit-scrollbar { width:3px; height:3px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(212,175,55,.25); border-radius:3px; }
      `}</style>

      <div style={S.page} className="scroll-y h-full">

        {/* ══ 1. AI RECEPTIONIST ══ */}
        <div style={S.aiCard}>
          <div style={S.avatarWrap}>
            {/* Outer rotating ring */}
            <div style={S.avatarBlueRing} />
            {/* Avatar */}
            <div style={S.avatarInner}>👩‍💼</div>
            {/* Pulse dot */}
            <div style={S.pulseDot} />
            {/* Audio visualizer */}
            <div style={{
              position:"absolute", bottom:-2, left:"50%", transform:"translateX(-50%)",
              background:"rgba(10,14,30,0.85)", borderRadius:8,
              padding:"2px 5px", display:"flex", alignItems:"center", gap:2,
              border:"1px solid rgba(59,130,246,0.3)",
            }}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{
                  width:2.5, borderRadius:2,
                  background:"#60a5fa",
                  height: [8,12,10,6][i],
                  opacity:.85,
                  animation:`soundBar .7s ease-in-out ${i*.15}s infinite alternate`,
                }}/>
              ))}
            </div>
          </div>

          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ color:"#D4AF37", fontWeight:800, fontSize:15, letterSpacing:"0.01em" }}>
              AI Receptionist
            </p>
            <p style={{ color:"#fff", fontSize:13, fontWeight:600, marginTop:1 }}>
              {greeting()}, {user?.role==="owner"?"Owner":"Manager"} 👋
            </p>
            <p style={{ color:"rgba(255,255,255,0.38)", fontSize:11, marginTop:2 }}>
              Here's your operational overview.
            </p>
          </div>

          <button onClick={copyLink}
            style={{
              width:34, height:34, borderRadius:10, flexShrink:0,
              display:"flex", alignItems:"center", justifyContent:"center",
              background:"rgba(0,112,243,0.15)", border:"1px solid rgba(0,112,243,0.35)",
            }}>
            {copied
              ? <Check size={15} style={{color:"#22c55e"}}/>
              : <ExternalLink size={15} style={{color:"#60a5fa"}}/>}
          </button>
        </div>

        {/* ══ 2. LIVE REVENUE ══ */}
        <div style={S.revCard}>
          <div style={S.revInner}>
            <p style={S.revLabel}>LIVE REVENUE</p>
            <p style={S.revAmount} className="rev-amount">
              ₹{stats.todayRevenue.toLocaleString("en-IN")}
              <span style={{fontSize:22,fontWeight:900}}>.00</span>
            </p>
            <p style={{color:"rgba(255,255,255,0.5)", fontSize:12, marginTop:6}}>Today's Total Revenue</p>
            <div style={S.revBadge}>↑ {pct}% vs yesterday</div>
          </div>

          {/* Glowing area chart */}
          <div style={{height:110, marginTop:4}} className="rev-chart-glow">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revData} margin={{top:8,right:0,left:0,bottom:0}}>
                <defs>
                  <linearGradient id="rGold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#D4AF37" stopOpacity={0.45}/>
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                  </linearGradient>
                  <filter id="lineGlow">
                    <feGaussianBlur stdDeviation="4" result="blur"/>
                    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                </defs>
                <Tooltip
                  contentStyle={{background:"#111",border:"1px solid rgba(212,175,55,.3)",borderRadius:8,fontSize:11}}
                  formatter={v=>[`₹${v.toLocaleString("en-IN")}`, "Revenue"]}
                  labelStyle={{color:"#D4AF37"}}/>
                <Area type="monotone" dataKey="revenue"
                  stroke="#D4AF37" strokeWidth={2.5}
                  fill="url(#rGold)" dot={false}
                  style={{filter:"drop-shadow(0 0 10px rgba(212,175,55,0.9))"}}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Glowing end dot */}
          <div style={{
            position:"absolute", right:0, top:"55%",
            width:12, height:12, borderRadius:"50%",
            background:"#F5C842",
            boxShadow:"0 0 12px #D4AF37, 0 0 24px rgba(212,175,55,.7)",
            animation:"goldGlow 2s ease infinite",
          }}/>
        </div>

        {/* ══ 3. ROOM OCCUPANCY ══ */}
        <div style={S.roomCard}>
          <div style={S.roomHeader}>
            <div style={S.roomTitle}>
              <span style={{fontSize:16}}>🛏</span>
              ROOM OCCUPANCY
            </div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <div style={S.towerBadge}>
                Tower A
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 3.5l3 3 3-3" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div style={S.expandBtn}>
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                  <path d="M1 5V1h4M9 1h4v4M1 9v4h4M9 13h4V9" stroke="rgba(255,255,255,0.4)" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Column numbers */}
          <div style={{display:"flex", paddingLeft:24, marginBottom:6}}>
            {Array.from({length:maxCols},(_,i)=>(
              <div key={i} style={{flex:1,textAlign:"center",fontSize:9,color:"rgba(255,255,255,0.2)",fontFamily:"monospace"}}>
                {String(i+1).padStart(2,"0")}
              </div>
            ))}
          </div>

          {/* 3D perspective grid */}
          <div style={S.gridPerspective}>
            <div style={S.gridInner}>
              {floors.map(fl=>{
                const fr=[...(byFloor[fl]||[])];
                while(fr.length<maxCols) fr.push(null);
                return(
                  <div key={fl} style={{display:"flex",alignItems:"center",gap:3,marginBottom:5}}>
                    <div style={{width:20,textAlign:"right",fontSize:9,color:"rgba(255,255,255,0.2)",fontFamily:"monospace",flexShrink:0}}>
                      {String(fl).padStart(2,"0")}
                    </div>
                    {fr.map((room,ci)=>(
                      <RoomCell3D key={room?room.id:`e-${fl}-${ci}`}
                        room={room} onClick={()=>room&&handleRoomClick(room)}/>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div style={{display:"flex",flexWrap:"wrap",gap:"6px 16px",marginTop:14}}>
            {[
              {c:"#22c55e", l:`Occupied (${stats.occupancyPercent}%)`},
              {c:"#D4AF37", l:"Reserved (5%)"},
              {c:"#ef4444", l:`Vacant (${Math.max(0,100-stats.occupancyPercent-15)}%)`},
              {c:"#374151", l:"Out of Order (10%)"},
            ].map(({c,l})=>(
              <div key={l} style={{display:"flex",alignItems:"center",gap:5}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:c,boxShadow:`0 0 4px ${c}`}}/>
                <span style={{fontSize:10,color:"rgba(255,255,255,0.45)"}}>{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ══ 4. QUICK CARDS + AI SCAN ══ */}
        <div style={S.quickGrid}>

          {/* Guest Check-in — top left */}
          <QuickCard icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.8">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          } label="GUEST CHECK-IN" value={pendingCI} sub="Pending" subColor="#3B82F6"/>

          {/* AI SCAN CENTER */}
          <div style={S.scanWrap}>
            <AIScanButton scanning={scanning} onClick={handleScan}/>
          </div>

          {/* Maintenance — top right */}
          <QuickCard icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.8">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
          } label="MAINTENANCE" value={5} sub="Pending" subColor="#D4AF37"/>

          {/* Housekeeping — bottom left */}
          <QuickCard icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.8">
              <path d="M3 12h18M3 6h18M3 18h18"/>
            </svg>
          } label="HOUSEKEEPING" value={stats.cleaningRooms||1} sub="Rooms" subColor="#3B82F6"/>

          {/* Empty center bottom (AI scan occupies) */}
          <div/>

          {/* Reviews — bottom right */}
          <QuickCard icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.8">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          } label="REVIEWS" value="4.8" sub="Rating" subColor="#D4AF37"/>
        </div>

        {/* ══ 5. AI INSIGHTS ══ */}
        <div style={S.insightCard}>
          <div style={{flex:1, minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              {/* Brain icon in blue circle */}
              <div style={{
                width:36,height:36,borderRadius:12,flexShrink:0,
                display:"flex",alignItems:"center",justifyContent:"center",
                background:"rgba(0,112,243,0.2)",
                border:"1px solid rgba(0,112,243,0.4)",
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="1.7">
                  <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/>
                  <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>
                </svg>
              </div>
              <span style={{fontSize:12,fontWeight:800,letterSpacing:"0.12em",color:"#fff",textTransform:"uppercase"}}>
                AI INSIGHTS
              </span>
            </div>

            {iLoad ? (
              <div style={{display:"flex",gap:5,padding:"6px 0"}}>
                {[0,1,2].map(i=>(
                  <div key={i} style={{width:8,height:8,borderRadius:"50%",background:"#3B82F6",
                    animation:`pulseDot 1.2s ease ${i*.2}s infinite`}}/>
                ))}
              </div>
            ) : (
              <p style={{fontSize:13,lineHeight:1.6,color:"rgba(255,255,255,0.72)",paddingRight:8}}>
                {insight}
              </p>
            )}

            <button onClick={fetchInsight} style={S.insightBtn}>
              View Insights
            </button>
          </div>

          {/* Hologram Building SVG */}
          <HologramBuilding/>
        </div>

        {/* ══ ROOM MODAL ══ */}
        {selRoom && (
          <RoomModal room={selRoom} onClose={()=>setSelRoom(null)}
            onCheckout={handleCheckout} user={user} onNewBooking={onNewBooking}/>
        )}
      </div>
    </>
  );
}

/* ─── 3D ROOM CELL ───────────────────────────────────────────── */
function RoomCell3D({ room, onClick }) {
  if (!room) return (
    <div style={{
      flex:1, minWidth:0, aspectRatio:"1",
      borderRadius:8,
      background:"rgba(255,255,255,0.02)",
      border:"1px solid rgba(255,255,255,0.04)",
    }}/>
  );

  const st = room.status;
  const cfg = {
    occupied: {
      top:"linear-gradient(160deg,#1a4d1a,#0d2e0d)",
      border:"rgba(34,197,94,0.7)",
      shadow:"0 4px 0 rgba(10,40,10,0.9), 0 0 10px rgba(34,197,94,0.25)",
      highlight:"rgba(34,197,94,0.4)",
      icon:"#22c55e", num:"#4ade80",
    },
    reserved: {
      top:"linear-gradient(160deg,#3d2800,#2a1a00)",
      border:"rgba(212,175,55,0.7)",
      shadow:"0 4px 0 rgba(40,25,0,0.9), 0 0 10px rgba(212,175,55,0.2)",
      highlight:"rgba(212,175,55,0.35)",
      icon:"#D4AF37", num:"#F5C842",
    },
    cleaning: {
      top:"linear-gradient(160deg,#1a1a4d,#0d0d2e)",
      border:"rgba(99,102,241,0.6)",
      shadow:"0 4px 0 rgba(10,10,40,0.9)",
      highlight:"rgba(99,102,241,0.3)",
      icon:"#818cf8", num:"#a5b4fc",
    },
    vacant: {
      top:"linear-gradient(160deg,#3d0d0d,#2e0808)",
      border:"rgba(239,68,68,0.55)",
      shadow:"0 4px 0 rgba(40,8,8,0.9), 0 0 6px rgba(239,68,68,0.1)",
      highlight:"rgba(239,68,68,0.2)",
      icon:"#ef4444", num:"#fca5a5",
    },
    out_of_order: {
      top:"rgba(20,22,28,0.9)",
      border:"rgba(75,85,99,0.4)",
      shadow:"0 3px 0 rgba(10,11,14,0.9)",
      highlight:"rgba(255,255,255,0.05)",
      icon:"#374151", num:"#4B5563",
    },
  };
  const c = cfg[st] || cfg.vacant;

  return (
    <button onClick={onClick} className="room3d" style={{
      flex:1, minWidth:0, aspectRatio:"1",
      background:c.top,
      border:`1px solid ${c.border}`,
      borderRadius:9,
      boxShadow:c.shadow,
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      padding:"2px 1px 4px",
      position:"relative", overflow:"hidden",
    }}>
      {/* Top highlight strip (glossy keycap effect) */}
      <div style={{
        position:"absolute", top:0, left:0, right:0, height:"35%",
        background:`linear-gradient(180deg,${c.highlight},transparent)`,
        borderRadius:"9px 9px 0 0",
      }}/>
      {/* Person icon */}
      <svg width="10" height="10" viewBox="0 0 20 20" fill={c.icon} style={{position:"relative",zIndex:1}}>
        <circle cx="10" cy="6" r="4"/>
        <path d="M3 20c0-3.866 3.134-7 7-7s7 3.134 7 7"/>
      </svg>
      {/* Room number */}
      <span style={{
        fontSize:7, fontWeight:900, color:c.num,
        fontFamily:"monospace", lineHeight:1, marginTop:1,
        position:"relative", zIndex:1,
      }}>
        {room.number}
      </span>
    </button>
  );
}

/* ─── QUICK CARD ─────────────────────────────────────────────── */
function QuickCard({ icon, label, value, sub, subColor }) {
  return (
    <div style={S.quickCard}>
      <div style={S.quickLabel}>
        {icon}
        {label}
      </div>
      <div style={S.quickValue}>{value}</div>
      <div style={{...S.quickSub, color:subColor}}>{sub}</div>
    </div>
  );
}

/* ─── AI SCAN BUTTON ─────────────────────────────────────────── */
function AIScanButton({ scanning, onClick }) {
  return (
    <button onClick={onClick} style={{
      ...S.scanBtn,
      transition:"transform .12s ease",
    }}
    onMouseDown={e=>e.currentTarget.style.transform="scale(.93)"}
    onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}
    onTouchStart={e=>e.currentTarget.style.transform="scale(.93)"}
    onTouchEnd={e=>e.currentTarget.style.transform="scale(1)"}>

      {/* Outermost ring — faint blue */}
      <div style={{
        position:"absolute", inset:-18,
        borderRadius:"50%",
        border:"1px solid rgba(0,112,243,0.15)",
        animation:"scanRing 12s linear infinite",
      }}/>
      {/* Dashed rotating ring */}
      <div style={{
        position:"absolute", inset:-10,
        borderRadius:"50%",
        border:"1px dashed rgba(0,112,243,0.25)",
        animation:"scanRing 8s linear infinite reverse",
      }}/>
      {/* Outer solid ring */}
      <div style={{
        position:"absolute", inset:-4,
        borderRadius:"50%",
        border:"1.5px solid rgba(0,112,243,0.45)",
        boxShadow:"0 0 20px rgba(0,112,243,0.2), inset 0 0 20px rgba(0,112,243,0.05)",
      }}/>

      {/* Main circle */}
      <div style={{
        width:"100%", height:"100%", borderRadius:"50%",
        background:"radial-gradient(circle at 42% 38%, #001a3a 0%, #000d1a 55%, #000508 100%)",
        border:"2px solid rgba(0,112,243,0.6)",
        boxShadow:[
          "0 0 0 6px rgba(0,112,243,0.07)",
          "0 0 30px rgba(0,112,243,0.45)",
          "0 0 60px rgba(0,112,243,0.18)",
          "inset 0 0 25px rgba(0,112,243,0.15)",
        ].join(","),
        display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
        animation: scanning?"scan-active":"aiScanPulse 2.5s ease-in-out infinite",
        position:"relative", overflow:"hidden",
      }}>
        {/* Laser sweep when scanning */}
        {scanning && (
          <div style={{
            position:"absolute", inset:0,
            background:"conic-gradient(from 0deg, transparent 340deg, rgba(0,112,243,0.6) 350deg, rgba(0,200,255,0.8) 355deg, transparent 360deg)",
            borderRadius:"50%",
            animation:"scanLaser .6s linear",
          }}/>
        )}
        {/* Inner glow */}
        <div style={{
          position:"absolute", inset:12, borderRadius:"50%",
          background:"radial-gradient(circle, rgba(0,112,243,0.2), transparent 70%)",
        }}/>
        <span style={{
          fontWeight:900, fontSize:24, color:"#fff", letterSpacing:"-0.02em",
          lineHeight:1, zIndex:1, position:"relative",
          textShadow:"0 0 20px rgba(255,255,255,0.6), 0 0 40px rgba(0,112,243,0.8)",
        }}>AI</span>
        <span style={{
          fontWeight:800, fontSize:10, color:"#3B82F6",
          letterSpacing:"0.2em", zIndex:1, position:"relative", marginTop:3,
          textShadow:"0 0 10px rgba(59,130,246,0.9)",
        }}>SCAN</span>
      </div>
    </button>
  );
}

/* ─── HOLOGRAM BUILDING SVG ──────────────────────────────────── */
function HologramBuilding() {
  return (
    <div style={{width:90, flexShrink:0, display:"flex",alignItems:"center",justifyContent:"center",
      animation:"holoBuild 3s ease infinite"}}>
      <svg width="85" height="110" viewBox="0 0 85 110" fill="none">
        {/* Base platform */}
        <ellipse cx="42" cy="100" rx="30" ry="7" stroke="rgba(0,112,243,0.4)" strokeWidth="1" fill="rgba(0,112,243,0.05)"/>
        {/* Building outline */}
        <rect x="22" y="30" width="40" height="65" stroke="rgba(0,112,243,0.6)" strokeWidth="1.2" fill="rgba(0,112,243,0.04)" rx="2"/>
        {/* Top antenna */}
        <line x1="42" y1="10" x2="42" y2="30" stroke="rgba(0,112,243,0.7)" strokeWidth="1.2"/>
        <circle cx="42" cy="9" r="2.5" fill="rgba(0,200,255,0.9)" style={{animation:"pulseDot 1.5s ease infinite"}}/>
        {/* Windows grid */}
        {[0,1,2,3,4,5].map(row=>
          [0,1,2].map(col=>(
            <rect key={`${row}-${col}`}
              x={28+col*11} y={36+row*9}
              width="7" height="5" rx="1"
              fill={row*3+col < 12 ? "rgba(0,200,255,0.35)" : "rgba(0,112,243,0.12)"}
              stroke="rgba(0,112,243,0.3)" strokeWidth="0.5"/>
          ))
        )}
        {/* Glow lines */}
        <line x1="22" y1="60" x2="62" y2="60" stroke="rgba(0,112,243,0.3)" strokeWidth="0.5"/>
        <line x1="22" y1="75" x2="62" y2="75" stroke="rgba(0,112,243,0.3)" strokeWidth="0.5"/>
        {/* Base glow */}
        <line x1="22" y1="95" x2="62" y2="95" stroke="rgba(0,112,243,0.4)" strokeWidth="1"/>
        {/* Perspective lines */}
        <line x1="22" y1="30" x2="12" y2="38" stroke="rgba(0,112,243,0.25)" strokeWidth="0.8"/>
        <line x1="62" y1="30" x2="72" y2="38" stroke="rgba(0,112,243,0.25)" strokeWidth="0.8"/>
        <line x1="12" y1="38" x2="12" y2="95" stroke="rgba(0,112,243,0.2)" strokeWidth="0.8"/>
        <line x1="72" y1="38" x2="72" y2="95" stroke="rgba(0,112,243,0.2)" strokeWidth="0.8"/>
        <line x1="12" y1="95" x2="22" y2="95" stroke="rgba(0,112,243,0.25)" strokeWidth="0.8"/>
        <line x1="72" y1="95" x2="62" y2="95" stroke="rgba(0,112,243,0.25)" strokeWidth="0.8"/>
      </svg>
    </div>
  );
}

/* ─── ROOM MODAL ─────────────────────────────────────────────── */
function RoomModal({ room, onClose, onCheckout, user, onNewBooking }) {
  const b = room.booking;
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:50, display:"flex", alignItems:"flex-end",
      background:"rgba(0,0,0,0.75)", backdropFilter:"blur(12px)",
    }} onClick={onClose}>
      <div style={{
        position:"relative", width:"100%",
        background:"linear-gradient(160deg,#0d1020,#080a14)",
        border:"1px solid rgba(255,255,255,0.1)", borderBottom:"none",
        borderRadius:"24px 24px 0 0", padding:20,
      }} onClick={e=>e.stopPropagation()}>
        <div style={{width:40,height:4,borderRadius:2,background:"rgba(255,255,255,0.15)",margin:"0 auto 16px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div>
            <h3 style={{fontWeight:900,fontSize:22,color:"#fff"}}>Room {room.number}</h3>
            <p style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:2,textTransform:"capitalize"}}>
              {room.type} · Floor {room.floor}
            </p>
          </div>
          <span style={{
            padding:"5px 12px", borderRadius:20, fontSize:11, fontWeight:700,
            ...(room.status==="occupied"
              ? {background:"rgba(34,197,94,0.15)",color:"#22c55e",border:"1px solid rgba(34,197,94,0.3)"}
              : room.status==="cleaning"
              ? {background:"rgba(99,102,241,0.15)",color:"#818cf8"}
              : {background:"rgba(239,68,68,0.15)",color:"#ef4444"})
          }}>
            {room.status==="occupied"?"Occupied":room.status==="cleaning"?"Cleaning":"Vacant"}
          </span>
        </div>

        {b ? (
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,padding:14}}>
              {[["👤 Guest",b.guestName],["📱 Phone",b.guestPhone||"—"],
                ["🪪 ID",`${b.idType} · ${b.idNumber||"—"}`],
                ["📅 Check-in",new Date(b.checkInDate).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})],
                ["🌙 Nights",`${b.nights} raat`],
              ].map(([l,v])=>(
                <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                  padding:"7px 0",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                  <span style={{fontSize:11,color:"rgba(255,255,255,0.38)"}}>{l}</span>
                  <span style={{fontSize:13,fontWeight:600,color:"#fff"}}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{background:"rgba(212,175,55,0.07)",border:"1px solid rgba(212,175,55,0.25)",borderRadius:16,padding:14}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                <Lock size={12} style={{color:"#D4AF37"}}/>
                <span style={{fontSize:10,fontWeight:800,letterSpacing:"0.1em",color:"#D4AF37",textTransform:"uppercase"}}>
                  Rate Integrity Badge
                </span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{color:"rgba(255,255,255,0.5)",fontSize:12}}>Locked Rate</span>
                <span style={{color:"#D4AF37",fontWeight:700,fontSize:13}}>
                  ₹{Number(b.ratePerNight||0).toLocaleString("en-IN")}/raat
                </span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:6}}>
                <span style={{color:"rgba(255,255,255,0.5)",fontSize:12}}>Total</span>
                <span style={{color:"#fff",fontWeight:900,fontSize:20}}>
                  ₹{Number(b.totalAmount||0).toLocaleString("en-IN")}
                </span>
              </div>
            </div>
            <button onClick={()=>onCheckout(b.id)} style={{
              width:"100%", padding:"14px 0", borderRadius:16, border:"none",
              fontWeight:800, fontSize:14, color:"#000", cursor:"pointer",
              background:"linear-gradient(135deg,#b8960c,#D4AF37,#F5C842)",
              boxShadow:"0 4px 20px rgba(212,175,55,0.35)",
            }}>
              ✓ Check-out Karo
            </button>
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",
              borderRadius:16,padding:24,textAlign:"center"}}>
              <p style={{color:"rgba(255,255,255,0.4)",fontSize:13,textTransform:"capitalize"}}>
                {room.status==="cleaning"?"🧹 Cleaning mein hai":"Room khali hai"}
              </p>
              <p style={{color:"rgba(255,255,255,0.2)",fontSize:11,marginTop:4}}>
                Base Rate: ₹{room.baseRate}/raat
              </p>
            </div>
            {room.status==="vacant"&&(
              <button onClick={()=>{onClose();onNewBooking&&onNewBooking(room);}} style={{
                width:"100%", padding:"14px 0", borderRadius:16, border:"none",
                fontWeight:800, fontSize:14, color:"#000", cursor:"pointer",
                background:"linear-gradient(135deg,#b8960c,#D4AF37,#F5C842)",
              }}>
                + Nayi Booking Karo
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div style={{background:"#07090E",minHeight:"100vh",padding:"12px",display:"flex",flexDirection:"column",gap:12}}>
      {[80,200,320,180,130].map((h,i)=>(
        <div key={i} style={{
          height:h, borderRadius:20,
          background:"linear-gradient(90deg,rgba(255,255,255,0.03) 25%,rgba(255,255,255,0.07) 50%,rgba(255,255,255,0.03) 75%)",
          backgroundSize:"200% 100%",
          animation:"shimmer 1.5s ease-in-out infinite",
        }}/>
      ))}
    </div>
  );
}

function localInsight(s) {
  if (!s) return "Data load ho raha hai...";
  if (s.occupancyPercent>80) return `High demand! ${s.occupancyPercent}% rooms bhare hain. Rates ₹200-300 badha sakte ho. 🔥`;
  if (s.occupancyPercent>50) return `${s.vacantRooms} rooms khali hain. Deluxe rooms weekend par promote karo. 💡`;
  return "High demand detected for Deluxe Rooms this weekend. Dynamic pricing +12% consider karo.";
}
