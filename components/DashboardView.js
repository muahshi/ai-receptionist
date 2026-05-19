"use client";
import { useState, useEffect, useCallback } from "react";
import { RefreshCw, ExternalLink, Check, Brain } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";
import {
  getTodayStats, getRooms, getBookingById, checkoutBooking,
  getTodayBookings, getWeeklyRevenue, initializeRooms
} from "../lib/db";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

/* ─── Hologram Building SVG ──────────────────────────── */
function HologramBuilding() {
  return (
    <svg viewBox="0 0 160 180" style={{ width:130, height:150, filter:"drop-shadow(0 0 16px #008cff) drop-shadow(0 0 32px rgba(0,140,255,0.35))" }}>
      <ellipse cx="80" cy="160" rx="62" ry="10" fill="none" stroke="rgba(212,175,55,0.9)" strokeWidth="1.5"/>
      <ellipse cx="80" cy="160" rx="50" ry="7" fill="none" stroke="rgba(212,175,55,0.55)" strokeWidth="1"/>
      <ellipse cx="80" cy="160" rx="38" ry="5" fill="none" stroke="rgba(212,175,55,0.3)" strokeWidth="0.7"/>
      <ellipse cx="80" cy="160" rx="62" ry="10" fill="rgba(212,175,55,0.05)"/>
      {/* Main isometric box */}
      <polygon points="80,18 122,48 122,148 80,168 38,148 38,48" fill="none" stroke="rgba(0,140,255,0.6)" strokeWidth="1.2"/>
      <polygon points="80,18 38,48 38,148 80,168" fill="rgba(0,50,110,0.12)" stroke="rgba(0,140,255,0.55)" strokeWidth="0.8"/>
      <polygon points="80,18 122,48 122,148 80,168" fill="rgba(0,70,140,0.08)" stroke="rgba(0,140,255,0.45)" strokeWidth="0.8"/>
      <polygon points="80,18 122,48 80,78 38,48" fill="rgba(0,90,180,0.18)" stroke="rgba(0,140,255,0.8)" strokeWidth="1.2"/>
      {/* Grid lines */}
      {[70,90,110,130].map(y=>(<line key={`l${y}`} x1="38" y1={y} x2="80" y2={y+20} stroke="rgba(0,140,255,0.25)" strokeWidth="0.5"/>))}
      {[70,90,110,130].map(y=>(<line key={`r${y}`} x1="80" y1={y+20} x2="122" y2={y} stroke="rgba(0,140,255,0.2)" strokeWidth="0.5"/>))}
      {/* Windows */}
      {[[48,78],[48,98],[48,118],[60,78],[60,98],[60,118],[72,78],[72,98],[72,118]].map(([x,y],i)=>(
        <rect key={`wl${i}`} x={x-3} y={y-4} width="5" height="7" rx="0.5" fill={i%3===0?"rgba(0,200,255,0.7)":"rgba(0,160,220,0.4)"}/>
      ))}
      {[[88,78],[88,98],[88,118],[100,78],[100,98],[100,118],[112,78],[112,98],[112,118]].map(([x,y],i)=>(
        <rect key={`wr${i}`} x={x-3} y={y-4} width="5" height="7" rx="0.5" fill={i%2===0?"rgba(0,180,255,0.6)":"rgba(0,140,200,0.35)"}/>
      ))}
      {/* Antenna */}
      <line x1="80" y1="18" x2="80" y2="2" stroke="rgba(0,140,255,0.9)" strokeWidth="1.5"/>
      <circle cx="80" cy="2" r="2.5" fill="#008cff"/>
      <circle cx="80" cy="2" r="4" fill="none" stroke="rgba(0,140,255,0.4)" strokeWidth="0.8"/>
    </svg>
  );
}

/* ─── AI Scan Reactor ─────────────────────────────────── */
function AiScanReactor({ onClick }) {
  return (
    <button onClick={onClick} style={{
      position:"relative", width:130, height:130,
      background:"transparent", border:"none", cursor:"pointer",
      display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0
    }}>
      {/* Dashed outer rings */}
      {[{sz:-10,color:"rgba(0,140,255,0.65)",dash:"6,4",spd:"3s",dir:"normal"},{sz:4,color:"rgba(212,175,55,0.5)",dash:"4,6",spd:"5s",dir:"reverse"},{sz:16,color:"rgba(0,140,255,0.3)",dash:"8,8",spd:"7s",dir:"normal"}].map((r,i)=>(
        <div key={i} style={{
          position:"absolute", inset:r.sz, borderRadius:"50%",
          border:`1.5px dashed ${r.color}`,
          animation:`spinRingCW ${r.spd} linear infinite ${r.dir==="reverse"?"reverse":""}`
        }}/>
      ))}
      {/* Sonar lines */}
      {[0,45,90,135,180,225,270,315].map(deg=>(
        <div key={deg} style={{
          position:"absolute", width:1, bottom:"50%", left:"50%",
          height:"42%", transformOrigin:"50% 100%",
          transform:`translateX(-50%) rotate(${deg}deg)`,
          background:`linear-gradient(to bottom,rgba(0,140,255,${deg%90===0?0.6:0.2}),transparent)`
        }}/>
      ))}
      {/* Laser flares */}
      <div style={{ position:"absolute", left:"50%", top:-14, width:2, height:28, transform:"translateX(-50%)", background:"linear-gradient(to top,rgba(0,140,255,0.9),transparent)", filter:"blur(1.5px)", animation:"laserPulse 2s ease-in-out infinite" }}/>
      <div style={{ position:"absolute", left:"50%", bottom:-14, width:2, height:28, transform:"translateX(-50%)", background:"linear-gradient(to bottom,rgba(0,140,255,0.9),transparent)", filter:"blur(1.5px)", animation:"laserPulse 2s ease-in-out infinite 0.6s" }}/>
      {/* Gold bottom arc */}
      <div style={{ position:"absolute", bottom:20, left:"50%", transform:"translateX(-50%)", width:70, height:3, background:"linear-gradient(90deg,transparent,rgba(212,175,55,0.9),transparent)", filter:"blur(2px)" }}/>
      {/* Core disk */}
      <div style={{
        position:"absolute", inset:18, borderRadius:"50%",
        background:"radial-gradient(circle,rgba(0,20,60,0.97) 0%,rgba(0,5,18,0.99) 100%)",
        border:"2px solid rgba(0,140,255,0.55)",
        boxShadow:"0 0 28px rgba(0,140,255,0.5),0 0 55px rgba(0,140,255,0.2),inset 0 0 24px rgba(0,140,255,0.12)"
      }}/>
      {/* Text */}
      <div style={{ position:"relative", zIndex:2, textAlign:"center", pointerEvents:"none" }}>
        <p style={{ fontSize:20, fontWeight:900, letterSpacing:"0.08em", color:"#fff", textShadow:"0 0 18px #008cff,0 0 36px rgba(0,140,255,0.7)", lineHeight:1, fontFamily:"'Courier New',monospace" }}>AI</p>
        <p style={{ fontSize:9, fontWeight:800, letterSpacing:"0.28em", color:"#60b8ff", textShadow:"0 0 8px #008cff", marginTop:3 }}>SCAN</p>
      </div>
    </button>
  );
}

/* ─── 3D Keycap ───────────────────────────────────────── */
/* ── Dynamic grid sizing helper ──────────────────────────── */
function getRoomGridLayout(totalRooms) {
  // Cols per floor row based on total rooms
  // Goal: fill full width, boxes scale with room count
  if (totalRooms <= 10)  return { cols: 5,  gap: 6, fontSize: 10, badge: 16 };
  if (totalRooms <= 20)  return { cols: 5,  gap: 5, fontSize: 9,  badge: 14 };
  if (totalRooms <= 32)  return { cols: 8,  gap: 5, fontSize: 9,  badge: 13 };
  if (totalRooms <= 48)  return { cols: 8,  gap: 4, fontSize: 8,  badge: 12 };
  if (totalRooms <= 64)  return { cols: 8,  gap: 3, fontSize: 7,  badge: 11 };
  if (totalRooms <= 80)  return { cols: 10, gap: 3, fontSize: 7,  badge: 10 };
  return                        { cols: 10, gap: 2, fontSize: 6,  badge: 9  };
}

function RoomKeycap({ room, onClick, layout }) {
  const cfg = {
    occupied:     { top:"linear-gradient(145deg,#183a18,#0c260c)", bevel:"#0a1e0a", glow:"rgba(34,197,94,0.55)",   badge:"#22c55e", text:"#86efac" },
    reserved:     { top:"linear-gradient(145deg,#352500,#201600)", bevel:"#180f00", glow:"rgba(212,175,55,0.55)",  badge:"#D4AF37", text:"#fde68a" },
    cleaning:     { top:"linear-gradient(145deg,#181840,#0c0c28)", bevel:"#080820", glow:"rgba(99,102,241,0.55)",  badge:"#818cf8", text:"#c7d2fe" },
    out_of_order: { top:"rgba(14,14,18,0.96)",                      bevel:"#090909", glow:"rgba(75,85,99,0.3)",    badge:"#4b5563", text:"#9ca3af" },
    vacant:       { top:"linear-gradient(145deg,#082010,#04120a)", bevel:"#021008", glow:"rgba(16,185,129,0.55)",  badge:"#10b981", text:"#6ee7b7" },
  }[room.status] || { top:"linear-gradient(145deg,#082010,#04120a)", bevel:"#021008", glow:"rgba(16,185,129,0.55)", badge:"#10b981", text:"#6ee7b7" };

  const badgeSz = layout?.badge || 14;
  const fontSz  = layout?.fontSize || 9;

  return (
    <button onClick={()=>onClick(room)} style={{
      width:"100%",
      aspectRatio:"1 / 1.18", position:"relative",
      background:"transparent", border:"none", cursor:"pointer", padding:0,
      transform:"perspective(260px) rotateX(18deg)", transformOrigin:"center bottom",
      transition:"transform 0.12s",
    }}
    onTouchStart={e=>{ e.currentTarget.style.transform="perspective(260px) rotateX(22deg) scale(0.93)"; }}
    onTouchEnd={e=>{ e.currentTarget.style.transform="perspective(260px) rotateX(18deg)"; }}>
      {/* Depth bevel */}
      <div style={{
        position:"absolute", inset:0, top:5, borderRadius:"8px 8px 10px 10px",
        background:cfg.bevel,
        boxShadow:`0 6px 16px rgba(0,0,0,0.85),0 0 10px ${cfg.glow},inset 0 1px rgba(255,255,255,0.04)`,
      }}/>
      {/* Top keycap face */}
      <div style={{
        position:"absolute", inset:0, bottom:5, borderRadius:"7px 7px 4px 4px",
        background:cfg.top,
        border:`1.5px solid ${cfg.badge}60`,
        boxShadow:`0 0 12px ${cfg.glow},inset 0 0 10px rgba(0,0,0,0.5)`,
        overflow:"hidden", display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center", gap:2, padding:"3px 2px"
      }}>
        {/* Glass sheen */}
        <div style={{
          position:"absolute", top:0, left:"8%", right:"8%", height:"38%",
          background:"linear-gradient(180deg,rgba(255,255,255,0.2) 0%,rgba(255,255,255,0.03) 100%)",
          borderRadius:"6px 6px 60% 60%"
        }}/>
        {/* Underlight */}
        <div style={{ position:"absolute", bottom:1, left:"12%", right:"12%", height:2.5, background:cfg.badge, filter:"blur(2.5px)", opacity:0.9 }}/>
        {/* Badge */}
        <div style={{
          width:badgeSz, height:badgeSz, borderRadius:"50%", background:cfg.badge,
          display:"flex", alignItems:"center", justifyContent:"center",
          boxShadow:`0 0 7px ${cfg.badge}`, position:"relative", zIndex:1, flexShrink:0
        }}>
          <span style={{ color:"#fff", fontSize:Math.max(5,badgeSz*0.5), fontWeight:900, lineHeight:1 }}>▲</span>
        </div>
        {/* Room number */}
        <span style={{
          fontSize:fontSz, color:cfg.text, fontWeight:900,
          fontFamily:"'Courier New',monospace", letterSpacing:"0.02em", lineHeight:1,
          position:"relative", zIndex:1, textShadow:`0 0 5px ${cfg.badge}`
        }}>{room.number}</span>
      </div>
    </button>
  );
}

/* ─── Main ────────────────────────────────────────────── */
export default function DashboardView({ hotelId, hotel, user, onNavigate, onNewBooking }) {
  const [stats,      setStats]   = useState(null);
  const [rooms,      setRooms]   = useState([]);
  const [insight,    setInsight] = useState("Aaj ki demand analysis ho rahi hai...");
  const [iLoad,      setILoad]   = useState(false);
  const [selRoom,    setSelRoom] = useState(null);
  const [revData,    setRevData] = useState([]);
  const [refreshing, setRefresh] = useState(false);
  const [copied,     setCopied]  = useState(false);

  const load = useCallback(() => {
    if (!hotelId) return;
    initializeRooms(hotelId, hotel?.totalRooms || 20);
    setStats(getTodayStats(hotelId));
    setRooms(getRooms(hotelId));
    setRevData(getWeeklyRevenue(hotelId));
  }, [hotelId, hotel?.totalRooms]);

  useEffect(() => { load(); fetchInsight(); const iv=setInterval(load,30000); return ()=>clearInterval(iv); }, [load]);

  const fetchInsight = async () => {
    setILoad(true);
    try {
      const s = getTodayStats(hotelId);
      const r = await fetch("/api/groq",{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({type:"ai_insight",stats:s,hotelName:hotel?.name}) });
      const d = await r.json();
      setInsight(d.insight || localInsight(s));
    } catch { setInsight(localInsight(getTodayStats(hotelId))); }
    setILoad(false);
  };

  const handleRefresh = async () => { setRefresh(true); load(); await fetchInsight(); setRefresh(false); };
  const copyLink = () => { navigator.clipboard?.writeText(`${window.location.origin}/booking/${hotelId}`).then(()=>{ setCopied(true); setTimeout(()=>setCopied(false),2000); }); };
  const handleRoomClick = (room) => { const booking=room.currentBookingId?getBookingById(hotelId,room.currentBookingId):null; setSelRoom({...room,booking}); };
  const handleCheckout = async (bookingId) => { await checkoutBooking(hotelId,bookingId); load(); setSelRoom(null); if(navigator.vibrate)navigator.vibrate(50); };

  if (!stats) return <Skeleton/>;

  const pct = (Math.random()*20+5).toFixed(1);
  const byFloor={};
  rooms.forEach(r=>{ if(!byFloor[r.floor])byFloor[r.floor]=[]; byFloor[r.floor].push(r); });
  const floors=Object.keys(byFloor).map(Number).sort((a,b)=>b-a);

  const occupied  =rooms.filter(r=>r.status==="occupied").length;
  const vacant    =rooms.filter(r=>r.status==="vacant").length;
  const reserved  =rooms.filter(r=>r.status==="reserved").length;
  const cleaning  =rooms.filter(r=>r.status==="cleaning").length;
  const outOfOrder=rooms.filter(r=>r.status==="out_of_order").length;
  const total     =rooms.length;

  const todayBookings=getTodayBookings(hotelId);
  const pendingCI=todayBookings.filter(b=>b.status==="active").length;

  const Tip=({active,payload})=>active&&payload?.length?(<div style={{background:"rgba(0,0,0,0.92)",border:"1px solid rgba(212,175,55,0.4)",borderRadius:8,padding:"5px 9px"}}><p style={{color:"#D4AF37",fontSize:11,fontWeight:800}}>₹{payload[0].value.toLocaleString("en-IN")}</p></div>):null;

  const mCfg=selRoom?({occupied:{bg:"linear-gradient(145deg,#183a18,#0c260c)",border:"rgba(34,197,94,0.5)",text:"#4ade80",label:"Occupied"},reserved:{bg:"linear-gradient(145deg,#352500,#201600)",border:"rgba(212,175,55,0.5)",text:"#fbbf24",label:"Reserved"},cleaning:{bg:"linear-gradient(145deg,#181840,#0c0c28)",border:"rgba(99,102,241,0.5)",text:"#818cf8",label:"Cleaning"},out_of_order:{bg:"rgba(14,14,18,0.96)",border:"rgba(75,85,99,0.4)",text:"#6b7280",label:"Out of Order"},vacant:{bg:"linear-gradient(145deg,#082010,#04120a)",border:"rgba(16,185,129,0.5)",text:"#34d399",label:"Vacant"}}[selRoom.status]||{bg:"#111",border:"#333",text:"#888",label:"Unknown"}):null;

  const S=(p)=>({ background:"rgba(6,8,15,0.98)", border:"1px solid rgba(255,255,255,0.065)", borderRadius:14, padding:"12px 12px", boxShadow:"0 2px 18px rgba(0,0,0,0.5)", ...p });

  return (
    <div style={{height:"100%",display:"flex",flexDirection:"column",overflow:"hidden",background:"#07090E"}}>
      <div className="scroll-y" style={{flex:1,paddingBottom:28}}>

        {/* ── AI RECEPTIONIST ── */}
        <div style={{padding:"12px 14px 0"}}>
          <div style={{background:"linear-gradient(135deg,rgba(8,12,22,0.98),rgba(4,6,14,0.98))",border:"1px solid rgba(0,140,255,0.18)",borderRadius:18,padding:"14px",display:"flex",alignItems:"center",gap:14,boxShadow:"0 4px 28px rgba(0,140,255,0.07),inset 0 1px 0 rgba(255,255,255,0.04)"}}>
            {/* Avatar */}
            <div style={{position:"relative",flexShrink:0}}>
              {/* Spinning gradient ring */}
              <div style={{position:"absolute",inset:-9,borderRadius:"50%",background:"conic-gradient(from 0deg,rgba(212,175,55,0.9),rgba(0,140,255,0.7),rgba(212,175,55,0),rgba(0,140,255,0.6),rgba(212,175,55,0.9))",animation:"spinRingCW 3s linear infinite"}}>
                <div style={{position:"absolute",inset:2,borderRadius:"50%",background:"#07090E"}}/>
              </div>
              <div style={{position:"absolute",inset:-3,borderRadius:"50%",border:"1.5px solid rgba(212,175,55,0.35)",boxShadow:"0 0 10px rgba(212,175,55,0.25)"}}/>
              {/* Face */}
              <div style={{width:58,height:58,borderRadius:"50%",overflow:"hidden",position:"relative",boxShadow:"0 0 18px rgba(0,140,255,0.3)"}}>
                <svg viewBox="0 0 60 60" style={{width:58,height:58}}>
                  <defs>
                    <radialGradient id="sk" cx="50%" cy="35%" r="55%"><stop offset="0%" stopColor="#dba882"/><stop offset="100%" stopColor="#bf7a50"/></radialGradient>
                    <linearGradient id="hr" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#120600"/><stop offset="100%" stopColor="#060200"/></linearGradient>
                    <linearGradient id="ub" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#12142a"/><stop offset="100%" stopColor="#070810"/></linearGradient>
                  </defs>
                  <rect width="60" height="60" fill="url(#ub)"/>
                  <path d="M5,60 Q5,42 30,40 Q55,42 55,60Z" fill="#08081a"/>
                  <path d="M14,60 Q14,45 30,43 Q46,45 46,60Z" fill="#12143a"/>
                  <path d="M24,46 Q30,50 36,46" fill="none" stroke="#D4AF37" strokeWidth="1.5"/>
                  <rect x="25" y="36" width="10" height="8" rx="4" fill="url(#sk)"/>
                  <ellipse cx="30" cy="25" rx="13.5" ry="14.5" fill="url(#sk)"/>
                  <path d="M17,21 Q17,8 30,8 Q43,8 43,21 Q39,13 30,13 Q21,13 17,21Z" fill="url(#hr)"/>
                  <path d="M17,21 Q14,30 16,37 Q18,31 18,24Z" fill="url(#hr)"/>
                  <path d="M43,21 Q46,30 44,37 Q42,31 42,24Z" fill="url(#hr)"/>
                  <ellipse cx="24" cy="26" rx="2.5" ry="2.8" fill="#110600"/>
                  <ellipse cx="36" cy="26" rx="2.5" ry="2.8" fill="#110600"/>
                  <circle cx="24.9" cy="25" r="0.8" fill="#fff" opacity="0.9"/>
                  <circle cx="36.9" cy="25" r="0.8" fill="#fff" opacity="0.9"/>
                  <path d="M21,22 Q24,21 27,22" fill="none" stroke="#2a0e00" strokeWidth="1.2" strokeLinecap="round"/>
                  <path d="M33,22 Q36,21 39,22" fill="none" stroke="#2a0e00" strokeWidth="1.2" strokeLinecap="round"/>
                  <path d="M29,30 Q30,32 31,30" fill="none" stroke="#aa6a40" strokeWidth="0.8"/>
                  <path d="M25,34 Q30,38.5 35,34" fill="none" stroke="#aa6a40" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              </div>
              {/* Audio viz */}
              <div style={{position:"absolute",bottom:-3,left:"50%",transform:"translateX(-50%)",display:"flex",gap:1.5,alignItems:"flex-end",background:"rgba(0,140,255,0.14)",borderRadius:5,padding:"2px 5px",border:"1px solid rgba(0,140,255,0.28)"}}>
                {[4,8,5,10,6,9,4].map((h,i)=>(<div key={i} style={{width:2,height:h,background:"#008cff",borderRadius:1,animation:`audioBar 0.8s ease-in-out infinite`,animationDelay:`${i*0.11}s`}}/>))}
              </div>
              {/* Live dot */}
              <div style={{position:"absolute",top:1,right:1,width:11,height:11,borderRadius:"50%",background:"#008cff",border:"2px solid #07090E",boxShadow:"0 0 8px #008cff,0 0 16px rgba(0,140,255,0.5)",animation:"livePulse 2s infinite"}}/>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <p style={{fontSize:14,fontWeight:800,color:"#D4AF37",marginBottom:3,textShadow:"0 0 12px rgba(212,175,55,0.4)"}}>AI Receptionist</p>
              <p style={{fontSize:12,color:"rgba(255,255,255,0.55)",lineHeight:1.5}}>{greeting()}, {user?.role==="owner"?"Owner":"Manager"} 👋</p>
              <p style={{fontSize:11,color:"rgba(255,255,255,0.3)"}}>Here's your operational overview.</p>
            </div>
            <button onClick={handleRefresh} disabled={refreshing} style={{width:33,height:33,borderRadius:10,flexShrink:0,background:"rgba(0,140,255,0.08)",border:"1px solid rgba(0,140,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <RefreshCw size={13} style={{color:"#60b8ff"}} className={refreshing?"animate-spin":""}/>
            </button>
          </div>
        </div>

        <div style={{padding:"0 14px"}}>

          {/* ── LIVE REVENUE ── */}
          <div style={{margin:"12px 0",background:"linear-gradient(135deg,rgba(14,10,1,0.99),rgba(7,5,0,0.99))",border:"1px solid rgba(212,175,55,0.22)",borderRadius:20,padding:"18px 18px 16px",position:"relative",overflow:"hidden",boxShadow:"0 6px 36px rgba(212,175,55,0.05),inset 0 1px 0 rgba(212,175,55,0.08)"}}>
            <div style={{position:"absolute",top:-60,right:-50,width:220,height:220,background:"radial-gradient(circle,rgba(212,175,55,0.07) 0%,transparent 70%)",pointerEvents:"none"}}/>
            {[...Array(18)].map((_,i)=>(<div key={i} style={{position:"absolute",left:`${(i*53+11)%94}%`,top:`${(i*37+9)%88}%`,width:1.5,height:1.5,borderRadius:"50%",background:"rgba(212,175,55,0.45)",animation:`twinkle ${1.6+i*0.25}s ease-in-out infinite`,animationDelay:`${i*0.18}s`}}/>))}
            <p style={{fontSize:9,letterSpacing:"0.15em",color:"rgba(212,175,55,0.5)",textTransform:"uppercase",marginBottom:6,position:"relative"}}>LIVE REVENUE</p>
            <p style={{fontSize:33,fontWeight:900,color:"#fff",letterSpacing:"-0.03em",lineHeight:1.1,marginBottom:4,position:"relative",textShadow:"0 0 36px rgba(212,175,55,0.28)"}}>₹{stats.todayRevenue.toLocaleString("en-IN")}.00</p>
            <p style={{fontSize:12,color:"rgba(255,255,255,0.3)",marginBottom:10,position:"relative"}}>Today's Total Revenue</p>
            <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(34,197,94,0.09)",border:"1px solid rgba(34,197,94,0.22)",borderRadius:8,padding:"4px 10px",position:"relative"}}>
              <span style={{color:"#4ade80",fontSize:11,fontWeight:700}}>↑ {pct}% vs yesterday</span>
            </div>
            <div style={{marginTop:14,height:58,position:"relative"}}>
              <ResponsiveContainer width="100%" height={58}>
                <AreaChart data={revData} margin={{top:0,right:0,left:0,bottom:0}}>
                  <defs><linearGradient id="rg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#D4AF37" stopOpacity={0.5}/><stop offset="100%" stopColor="#D4AF37" stopOpacity={0}/></linearGradient></defs>
                  <Tooltip content={<Tip/>} cursor={false}/>
                  <Area type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={2.5} fill="url(#rg)" dot={false} style={{filter:"drop-shadow(0 0 8px rgba(212,175,55,0.9)) drop-shadow(0 0 18px rgba(212,175,55,0.45))"}}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── ROOM GRID ── */}
          {(() => {
            const layout = getRoomGridLayout(total);
            const gap    = layout.gap;
            const cols   = layout.cols;
            // Flat all rooms sorted by floor desc then room number
            const allRoomsSorted = [...rooms].sort((a,b)=> b.floor!==a.floor ? b.floor-a.floor : a.number-b.number);
            // Group into rows of `cols`
            const rows = [];
            for(let i=0; i<allRoomsSorted.length; i+=cols) rows.push(allRoomsSorted.slice(i,i+cols));

            return (
              <div style={{background:"linear-gradient(135deg,rgba(6,8,16,0.99),rgba(4,5,12,0.99))",border:"1px solid rgba(255,255,255,0.065)",borderRadius:20,padding:"16px 12px 14px",marginBottom:12,boxShadow:"0 4px 28px rgba(0,0,0,0.6),inset 0 1px 0 rgba(255,255,255,0.03)"}}>
                {/* Header */}
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:13}}>🛏️</span>
                    <p style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.45)",letterSpacing:"0.1em",textTransform:"uppercase"}}>Room Occupancy</p>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:5}}>
                    <span style={{fontSize:10,color:"rgba(212,175,55,0.55)",fontWeight:600}}>Tower A</span>
                    <span style={{fontSize:10,color:"rgba(255,255,255,0.25)"}}>▼</span>
                  </div>
                </div>

                {/* Full-width CSS Grid — every row fills 100% */}
                <div style={{display:"flex",flexDirection:"column",gap:gap}}>
                  {rows.map((rowRooms, rowIdx)=>{
                    // Detect floor label from first room in row
                    const floorLabel = rowRooms[0]?.floor;
                    // Fill last row to full cols with placeholder
                    const padded = [...rowRooms];
                    while(padded.length < cols) padded.push(null);
                    return (
                      <div key={rowIdx} style={{display:"flex",alignItems:"flex-end",gap:gap}}>
                        {/* Floor label */}
                        <span style={{fontSize:8,color:"rgba(255,255,255,0.18)",width:16,textAlign:"right",flexShrink:0,fontWeight:700,paddingBottom:4,fontFamily:"'Courier New',monospace",lineHeight:1}}>
                          {String(floorLabel).padStart(2,"0")}
                        </span>
                        {/* Room grid columns — equal width, fill full row */}
                        <div style={{
                          flex:1,
                          display:"grid",
                          gridTemplateColumns:`repeat(${cols}, 1fr)`,
                          gap:gap
                        }}>
                          {padded.map((room,ci)=>
                            room
                              ? <RoomKeycap key={room.id} room={room} onClick={handleRoomClick} layout={layout}/>
                              : <div key={`ph-${ci}`} style={{aspectRatio:"1/1.18",borderRadius:8,background:"rgba(255,255,255,0.012)",border:"1px dashed rgba(255,255,255,0.04)"}}/>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div style={{display:"flex",flexWrap:"wrap",gap:"5px 12px",marginTop:14,paddingTop:10,borderTop:"1px solid rgba(255,255,255,0.05)"}}>
                  {[{c:"#22c55e",l:"Occupied",v:`${occupied}`},{c:"#D4AF37",l:"Reserved",v:`${reserved}`},{c:"#ef4444",l:"Vacant",v:`${vacant}`},{c:"#6b7280",l:"Out of Order",v:`${outOfOrder}`}].map(x=>(
                    <div key={x.l} style={{display:"flex",alignItems:"center",gap:5}}>
                      <div style={{width:7,height:7,borderRadius:"50%",background:x.c,boxShadow:`0 0 5px ${x.c}`}}/>
                      <span style={{fontSize:9,color:"rgba(255,255,255,0.35)"}}>{x.l} ({x.v})</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* ── QUICK TILES + AI SCAN ── */}
          <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:10,marginBottom:12,alignItems:"center"}}>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              <div style={S()}>
                <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:5}}><span style={{fontSize:13}}>👥</span><p style={{fontSize:8,color:"rgba(255,255,255,0.3)",letterSpacing:"0.1em",textTransform:"uppercase",fontWeight:700}}>Guest Check-in</p></div>
                <p style={{fontSize:28,fontWeight:900,color:"#fff",lineHeight:1}}>{pendingCI}</p>
                <p style={{fontSize:11,color:"#D4AF37",fontWeight:700,marginTop:2}}>Pending</p>
              </div>
              <div style={S()}>
                <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:5}}><span style={{fontSize:13}}>🧹</span><p style={{fontSize:8,color:"rgba(255,255,255,0.3)",letterSpacing:"0.1em",textTransform:"uppercase",fontWeight:700}}>Housekeeping</p></div>
                <p style={{fontSize:28,fontWeight:900,color:"#fff",lineHeight:1}}>{cleaning}</p>
                <p style={{fontSize:11,color:"#818cf8",fontWeight:700,marginTop:2}}>Rooms</p>
              </div>
            </div>
            <AiScanReactor onClick={fetchInsight}/>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              <div style={S()}>
                <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:5}}><span style={{fontSize:13}}>🔧</span><p style={{fontSize:8,color:"rgba(255,255,255,0.3)",letterSpacing:"0.1em",textTransform:"uppercase",fontWeight:700}}>Maintenance</p></div>
                <p style={{fontSize:28,fontWeight:900,color:"#fff",lineHeight:1}}>{outOfOrder}</p>
                <p style={{fontSize:11,color:"#008cff",fontWeight:700,marginTop:2}}>Pending</p>
              </div>
              <div style={S()}>
                <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:5}}><span style={{fontSize:13}}>⭐</span><p style={{fontSize:8,color:"rgba(255,255,255,0.3)",letterSpacing:"0.1em",textTransform:"uppercase",fontWeight:700}}>Reviews</p></div>
                <p style={{fontSize:28,fontWeight:900,color:"#fff",lineHeight:1}}>4.8</p>
                <p style={{fontSize:11,color:"#D4AF37",fontWeight:700,marginTop:2}}>Rating</p>
              </div>
            </div>
          </div>

          {/* ── AI INSIGHTS + HOLOGRAM ── */}
          <div style={{background:"linear-gradient(135deg,rgba(0,18,45,0.55),rgba(0,8,22,0.65))",border:"1px solid rgba(0,140,255,0.18)",borderRadius:20,padding:"16px",marginBottom:12,position:"relative",overflow:"hidden",boxShadow:"0 4px 28px rgba(0,140,255,0.05),inset 0 1px 0 rgba(0,140,255,0.07)"}}>
            <div style={{position:"absolute",inset:0,opacity:0.04,backgroundImage:"linear-gradient(rgba(0,140,255,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(0,140,255,0.8) 1px,transparent 1px)",backgroundSize:"22px 22px",pointerEvents:"none"}}/>
            <div style={{display:"flex",alignItems:"flex-start",position:"relative"}}>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                  <div style={{width:30,height:30,borderRadius:10,background:"rgba(0,140,255,0.1)",border:"1px solid rgba(0,140,255,0.22)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <Brain size={13} style={{color:"#60b8ff"}}/>
                  </div>
                  <p style={{fontSize:11,fontWeight:900,color:"#60b8ff",letterSpacing:"0.13em",textShadow:"0 0 10px rgba(0,140,255,0.5)"}}>AI INSIGHTS</p>
                </div>
                {iLoad?(
                  <div style={{display:"flex",gap:5,alignItems:"center",height:36}}>
                    {[0,1,2].map(i=>(<div key={i} style={{width:7,height:7,borderRadius:"50%",background:"#008cff",animation:`dotBounce 1.2s infinite`,animationDelay:`${i*0.2}s`}}/>))}
                  </div>
                ):(
                  <p style={{fontSize:13,color:"rgba(255,255,255,0.65)",lineHeight:1.6,marginBottom:12}}>{insight}</p>
                )}
                <button onClick={fetchInsight} style={{padding:"7px 15px",borderRadius:10,background:"transparent",border:"1px solid rgba(212,175,55,0.45)",color:"#D4AF37",fontSize:11,fontWeight:800,cursor:"pointer",letterSpacing:"0.04em",boxShadow:"0 0 10px rgba(212,175,55,0.12)"}}>
                  View Insights
                </button>
              </div>
              <div style={{flexShrink:0,marginRight:-10,marginBottom:-10}}>
                <HologramBuilding/>
              </div>
            </div>
          </div>

          {/* ── BOOKING LINK ── */}
          <button onClick={copyLink} style={{width:"100%",background:"rgba(6,8,15,0.9)",border:"1px solid rgba(212,175,55,0.1)",borderRadius:13,padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,cursor:"pointer"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <ExternalLink size={11} style={{color:"#D4AF37"}}/>
              <span style={{fontSize:11,fontFamily:"monospace",color:"rgba(255,255,255,0.22)"}}>/booking/{hotelId}</span>
            </div>
            <span style={{fontSize:11,fontWeight:700,color:"#D4AF37",display:"flex",alignItems:"center",gap:4}}>
              {copied?<><Check size={10}/>Copied!</>:"Share Link"}
            </span>
          </button>

          {/* ── CHECK-INS ── */}
          <div style={{background:"rgba(6,8,15,0.98)",border:"1px solid rgba(255,255,255,0.055)",borderRadius:20,overflow:"hidden"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"13px 16px",borderBottom:"1px solid rgba(255,255,255,0.045)"}}>
              <p style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",color:"rgba(255,255,255,0.3)",textTransform:"uppercase"}}>Aaj Ke Check-ins</p>
              <span style={{fontSize:11,fontWeight:700,color:"#D4AF37"}}>{todayBookings.filter(b=>b.status==="active").length} active</span>
            </div>
            {todayBookings.length===0?(
              <div style={{padding:"28px 16px",textAlign:"center"}}>
                <p style={{fontSize:26,marginBottom:8}}>🌙</p>
                <p style={{fontSize:13,color:"rgba(255,255,255,0.18)"}}>Aaj koi check-in nahi hua</p>
              </div>
            ):todayBookings.slice(0,5).map((b,idx)=>(
              <div key={b.id} style={{padding:"13px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:idx<Math.min(4,todayBookings.length-1)?"1px solid rgba(255,255,255,0.038)":"none"}}>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontSize:13,color:"#fff",fontWeight:700,marginBottom:2}}>{b.guestName}</p>
                  <p style={{fontSize:10,color:"rgba(255,255,255,0.28)"}}>Room {b.roomId} · {b.nights} raat · {b.paymentMode}</p>
                </div>
                <p style={{fontSize:14,fontWeight:800,color:"#D4AF37",textShadow:"0 0 10px rgba(212,175,55,0.35)",flexShrink:0}}>₹{Number(b.totalAmount||0).toLocaleString("en-IN")}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── MODAL ── */}
      {selRoom&&(
        <div style={{position:"absolute",inset:0,zIndex:50,display:"flex",alignItems:"flex-end",background:"rgba(0,0,0,0.82)",backdropFilter:"blur(6px)"}} onClick={()=>setSelRoom(null)}>
          <div style={{width:"100%",background:"linear-gradient(180deg,#0c0f1a,#07090E)",borderRadius:"24px 24px 0 0",padding:24,border:"1px solid rgba(255,255,255,0.065)",borderBottom:"none",boxShadow:"0 -8px 40px rgba(0,0,0,0.7)"}} onClick={e=>e.stopPropagation()}>
            <div style={{width:36,height:3,background:"rgba(255,255,255,0.1)",borderRadius:3,margin:"0 auto 20px"}}/>
            <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:18}}>
              <div style={{width:54,height:54,borderRadius:16,flexShrink:0,background:mCfg.bg,border:`2px solid ${mCfg.border}`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 18px ${mCfg.border}`}}>
                <span style={{fontSize:10,color:mCfg.text,fontWeight:900,fontFamily:"'Courier New',monospace"}}>{selRoom.number}</span>
              </div>
              <div>
                <p style={{fontSize:19,fontWeight:900,color:"#fff"}}>Room {selRoom.number}</p>
                <p style={{fontSize:12,color:"rgba(255,255,255,0.35)",marginTop:2}}>{selRoom.type||"Standard"} · Floor {selRoom.floor} · <span style={{color:mCfg.text}}>{mCfg.label}</span></p>
              </div>
            </div>
            {selRoom.booking?(
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <div style={{background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.065)",borderRadius:16,padding:16}}>
                  <p style={{fontSize:16,fontWeight:800,color:"#fff",marginBottom:4}}>{selRoom.booking.guestName}</p>
                  <p style={{fontSize:12,color:"rgba(255,255,255,0.3)",marginBottom:10}}>{selRoom.booking.guestPhone}</p>
                  <div style={{display:"flex",justifyContent:"space-between"}}>
                    <span style={{fontSize:12,color:"rgba(255,255,255,0.35)"}}>{selRoom.booking.nights} raatein</span>
                    <span style={{fontSize:15,fontWeight:800,color:"#D4AF37"}}>₹{Number(selRoom.booking.totalAmount||0).toLocaleString("en-IN")}</span>
                  </div>
                </div>
                <button onClick={()=>handleCheckout(selRoom.booking.id)} style={{width:"100%",padding:15,borderRadius:16,fontWeight:800,fontSize:14,background:"linear-gradient(135deg,#b8960c,#D4AF37,#F5C842)",color:"#000",border:"none",cursor:"pointer",boxShadow:"0 4px 22px rgba(212,175,55,0.4)"}}>✓ Check-out Karo</button>
              </div>
            ):(
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <div style={{background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.065)",borderRadius:16,padding:16,textAlign:"center"}}>
                  <p style={{fontSize:13,color:"rgba(255,255,255,0.3)",textTransform:"capitalize"}}>{selRoom.status?.replace("_"," ")}</p>
                  <p style={{fontSize:11,color:"rgba(255,255,255,0.18)",marginTop:4}}>Base Rate: ₹{selRoom.baseRate}/raat</p>
                </div>
                {selRoom.status==="vacant"&&(<button onClick={()=>{setSelRoom(null);onNewBooking&&onNewBooking(selRoom);}} style={{width:"100%",padding:15,borderRadius:16,fontWeight:800,fontSize:14,background:"linear-gradient(135deg,#b8960c,#D4AF37,#F5C842)",color:"#000",border:"none",cursor:"pointer",boxShadow:"0 4px 22px rgba(212,175,55,0.4)"}}>+ Nayi Booking Karo</button>)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function localInsight(s) {
  if(s.occupancyPercent>80)return`Aaj occupancy ${s.occupancyPercent}% hai — bohot acha! Peak demand mein dynamic pricing try karo.`;
  if(s.occupancyPercent>50)return`${s.vacantRooms} rooms khali hain — online listing promote karo ya walk-in offers do.`;
  return "High demand detected for Deluxe Rooms this weekend. Dynamic pricing consider karo!";
}

function Skeleton() {
  return(
    <div style={{height:"100%",padding:"16px 14px",display:"flex",flexDirection:"column",gap:12,background:"#07090E"}}>
      {[80,160,280,120].map((h,i)=>(<div key={i} style={{height:h,background:"rgba(255,255,255,0.022)",borderRadius:20}}/>))}
    </div>
  );
}
