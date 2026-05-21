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
/* ── Dynamic grid sizing ──────────────────────────────────── */
function getRoomGridLayout(totalRooms) {
  if (totalRooms <= 10)  return { cols:5,  gap:6, numSz:10, badgeSz:15, depth:7  };
  if (totalRooms <= 20)  return { cols:5,  gap:5, numSz:9,  badgeSz:13, depth:6  };
  if (totalRooms <= 32)  return { cols:8,  gap:4, numSz:8,  badgeSz:12, depth:5  };
  if (totalRooms <= 48)  return { cols:8,  gap:3, numSz:7,  badgeSz:11, depth:5  };
  if (totalRooms <= 64)  return { cols:10, gap:3, numSz:6,  badgeSz:10, depth:4  };
  if (totalRooms <= 80)  return { cols:10, gap:2, numSz:6,  badgeSz:9,  depth:4  };
  return                        { cols:10, gap:2, numSz:5,  badgeSz:8,  depth:3  };
}

/* ── Status config ────────────────────────────────────────── */
function getRoomCfg(status) {
  return {
    occupied:    { face:"linear-gradient(160deg,#1d5c1d 0%,#0d360d 60%,#082208 100%)", right:"linear-gradient(180deg,#0d360d,#051405)", bottom:"#041004", glow:"#22c55e", glowA:"rgba(34,197,94,0.7)",  border:"rgba(34,197,94,0.8)",  badgeC:"#22c55e", numC:"#86efac",  label:"Occupied",    icon:"👤" },
    reserved:    { face:"linear-gradient(160deg,#4a3500 0%,#2e2000 60%,#1a1200 100%)", right:"linear-gradient(180deg,#2e2000,#100b00)", bottom:"#0c0800", glow:"#D4AF37", glowA:"rgba(212,175,55,0.7)", border:"rgba(212,175,55,0.8)", badgeC:"#D4AF37", numC:"#fde68a",  label:"Reserved",    icon:"📌" },
    cleaning:    { face:"linear-gradient(160deg,#1e1e5a 0%,#111138 60%,#08082a 100%)", right:"linear-gradient(180deg,#111138,#060618)", bottom:"#040412", glow:"#818cf8", glowA:"rgba(129,140,248,0.7)",border:"rgba(129,140,248,0.8)",badgeC:"#818cf8", numC:"#c7d2fe",  label:"Cleaning",    icon:"🧹" },
    out_of_order:{ face:"linear-gradient(160deg,#1a1a1e 0%,#111113 60%,#090909 100%)", right:"linear-gradient(180deg,#111113,#060606)", bottom:"#040404", glow:"#6b7280", glowA:"rgba(107,114,128,0.4)",border:"rgba(107,114,128,0.5)",badgeC:"#4b5563", numC:"#9ca3af",  label:"Out of Order", icon:"🔧" },
    vacant:      { face:"linear-gradient(160deg,#0d3520 0%,#072212 60%,#041209 100%)", right:"linear-gradient(180deg,#072212,#021008)", bottom:"#020a05", glow:"#10b981", glowA:"rgba(16,185,129,0.7)", border:"rgba(16,185,129,0.8)", badgeC:"#10b981", numC:"#6ee7b7",  label:"Vacant",      icon:"" },
  }[status] || { face:"linear-gradient(160deg,#0d3520,#072212,#041209)", right:"linear-gradient(180deg,#072212,#021008)", bottom:"#020a05", glow:"#10b981", glowA:"rgba(16,185,129,0.7)", border:"rgba(16,185,129,0.8)", badgeC:"#10b981", numC:"#6ee7b7", label:"Vacant", icon:"" };
}

/* ── 3D Isometric Room Block ──────────────────────────────── */
function RoomBlock({ room, onClick, layout }) {
  const cfg = getRoomCfg(room.status);
  const { numSz=9, badgeSz=13, depth=6 } = layout || {};
  const hasImg = room.imageUrl; // future: room.imageUrl

  return (
    <button
      onClick={()=>onClick(room)}
      style={{
        width:"100%", aspectRatio:"1/1.05",
        position:"relative", background:"transparent",
        border:"none", cursor:"pointer", padding:0,
        /* Isometric perspective tilt */
        transform:"perspective(400px) rotateX(20deg) rotateZ(0deg)",
        transformOrigin:"center 90%",
        transition:"transform 0.15s ease, filter 0.15s ease",
        filter:`drop-shadow(0 ${depth+2}px ${depth*2}px rgba(0,0,0,0.7)) drop-shadow(0 0 ${depth*2}px ${cfg.glowA})`,
      }}
      onTouchStart={e=>{ e.currentTarget.style.transform="perspective(400px) rotateX(24deg) scale(0.92)"; e.currentTarget.style.filter=`drop-shadow(0 2px 4px rgba(0,0,0,0.9)) drop-shadow(0 0 8px ${cfg.glowA})`; }}
      onTouchEnd={e=>{ e.currentTarget.style.transform="perspective(400px) rotateX(20deg)"; e.currentTarget.style.filter=`drop-shadow(0 ${depth+2}px ${depth*2}px rgba(0,0,0,0.7)) drop-shadow(0 0 ${depth*2}px ${cfg.glowA})`; }}
    >
      {/* ── Bottom depth face (shadow illusion) ── */}
      <div style={{
        position:"absolute", inset:0, top:`${depth}px`,
        borderRadius:"6px 6px 8px 8px",
        background:cfg.bottom,
        boxShadow:`0 4px 12px rgba(0,0,0,0.9), 0 0 ${depth*3}px ${cfg.glowA}`,
      }}/>

      {/* ── Right depth side face ── */}
      <div style={{
        position:"absolute",
        top:`${depth}px`, right:0, bottom:0,
        width:`${depth+1}px`,
        background:cfg.right,
        borderRadius:"0 2px 4px 0",
        opacity:0.9,
      }}/>

      {/* ── Front top face ── */}
      <div style={{
        position:"absolute", inset:0, bottom:`${depth}px`,
        borderRadius:"7px 7px 5px 5px",
        background: hasImg ? "transparent" : cfg.face,
        border:`1.5px solid ${cfg.border}`,
        boxShadow:`inset 0 0 14px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.12)`,
        overflow:"hidden",
        display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
        gap:2, padding:"3px 2px",
      }}>
        {/* Room image (future) */}
        {hasImg && (
          <img src={room.imageUrl} alt={`Room ${room.number}`} style={{
            position:"absolute", inset:0, width:"100%", height:"100%",
            objectFit:"cover", opacity:0.55,
          }}/>
        )}

        {/* Top glass sheen */}
        <div style={{
          position:"absolute", top:0, left:"6%", right:"6%", height:"35%",
          background:"linear-gradient(180deg,rgba(255,255,255,0.22) 0%,rgba(255,255,255,0.02) 100%)",
          borderRadius:"6px 6px 50% 50%", pointerEvents:"none",
          zIndex:2,
        }}/>

        {/* Bottom underlight glow bar */}
        <div style={{
          position:"absolute", bottom:1, left:"8%", right:"8%", height:2,
          background:cfg.badgeC, filter:"blur(3px)", opacity:0.95,
          zIndex:2,
        }}/>

        {/* Left edge light streak */}
        <div style={{
          position:"absolute", top:"10%", left:1, bottom:"10%", width:1.5,
          background:`linear-gradient(180deg,transparent,${cfg.badgeC},transparent)`,
          opacity:0.5, zIndex:2,
        }}/>

        {/* Badge circle with person icon */}
        <div style={{
          width:badgeSz, height:badgeSz, borderRadius:"50%",
          background:`radial-gradient(circle, ${cfg.badgeC} 0%, ${cfg.badgeC}cc 100%)`,
          display:"flex", alignItems:"center", justifyContent:"center",
          boxShadow:`0 0 8px ${cfg.badgeC}, 0 0 16px ${cfg.glowA}`,
          position:"relative", zIndex:3, flexShrink:0,
          border:`1px solid ${cfg.badgeC}90`,
        }}>
          {/* Person silhouette SVG */}
          <svg viewBox="0 0 10 10" style={{width:badgeSz*0.6, height:badgeSz*0.6}}>
            <circle cx="5" cy="3.2" r="1.8" fill="white" opacity="0.95"/>
            <path d="M1.5,9 Q1.5,6.2 5,6.2 Q8.5,6.2 8.5,9Z" fill="white" opacity="0.95"/>
          </svg>
        </div>

        {/* Room number */}
        <span style={{
          fontSize:numSz, color:cfg.numC, fontWeight:900,
          fontFamily:"'Courier New',monospace",
          letterSpacing:"0.01em", lineHeight:1,
          position:"relative", zIndex:3,
          textShadow:`0 0 6px ${cfg.badgeC}, 0 1px 0 rgba(0,0,0,0.8)`,
        }}>
          {room.number}
        </span>
      </div>

      {/* Outer ambient glow ring (very subtle) */}
      <div style={{
        position:"absolute", inset:-2, bottom:depth-2,
        borderRadius:"9px 9px 7px 7px",
        border:`1px solid ${cfg.border}`,
        opacity:0.4, pointerEvents:"none",
      }}/>
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
                              ? <RoomBlock key={room.id} room={room} onClick={handleRoomClick} layout={layout}/>
                              : <div key={`ph-${ci}`} style={{aspectRatio:"1/1.05",borderRadius:8,background:"rgba(255,255,255,0.008)",border:"1px dashed rgba(255,255,255,0.03)"}}/>
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

      {/* ── ROOM DETAIL MODAL ── */}
      {selRoom&&(()=>{
        const cfg = getRoomCfg(selRoom.status);
        const imgs = selRoom.images || (selRoom.imageUrl ? [selRoom.imageUrl] : []);
        return (
          <div style={{position:"absolute",inset:0,zIndex:50,display:"flex",alignItems:"flex-end",background:"rgba(0,0,0,0.85)",backdropFilter:"blur(8px)"}} onClick={()=>setSelRoom(null)}>
            <div style={{
              width:"100%", maxHeight:"88vh", overflowY:"auto",
              background:"linear-gradient(180deg,#0c101c,#07090E)",
              borderRadius:"26px 26px 0 0", padding:"0 0 24px",
              border:"1px solid rgba(255,255,255,0.07)", borderBottom:"none",
              boxShadow:"0 -12px 60px rgba(0,0,0,0.8)"
            }} onClick={e=>e.stopPropagation()}>

              {/* Drag handle */}
              <div style={{width:40,height:4,background:"rgba(255,255,255,0.12)",borderRadius:2,margin:"12px auto 0"}}/>

              {/* ── Status color header bar ── */}
              <div style={{
                background:`linear-gradient(135deg, ${cfg.glowA.replace("0.7","0.12")}, transparent)`,
                borderBottom:`1px solid ${cfg.border.replace("0.8","0.15")}`,
                padding:"14px 20px 14px",
                display:"flex", alignItems:"center", gap:14,
              }}>
                {/* 3D mini block preview */}
                <div style={{
                  width:56, height:52, flexShrink:0, position:"relative",
                  filter:`drop-shadow(0 4px 12px ${cfg.glowA})`
                }}>
                  {/* bottom */}
                  <div style={{position:"absolute",inset:0,top:5,borderRadius:"7px 7px 9px 9px",background:cfg.bottom,boxShadow:`0 0 12px ${cfg.glowA}`}}/>
                  {/* right side */}
                  <div style={{position:"absolute",top:5,right:0,bottom:0,width:5,background:cfg.right,borderRadius:"0 2px 4px 0"}}/>
                  {/* front face */}
                  <div style={{position:"absolute",inset:0,bottom:5,borderRadius:"6px 6px 4px 4px",background:cfg.face,border:`1.5px solid ${cfg.border}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:1}}>
                    <div style={{width:18,height:18,borderRadius:"50%",background:cfg.badgeC,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 8px ${cfg.badgeC}`}}>
                      <svg viewBox="0 0 10 10" style={{width:11,height:11}}>
                        <circle cx="5" cy="3.2" r="1.8" fill="white"/>
                        <path d="M1.5,9 Q1.5,6.2 5,6.2 Q8.5,6.2 8.5,9Z" fill="white"/>
                      </svg>
                    </div>
                    <span style={{fontSize:9,color:cfg.numC,fontWeight:900,fontFamily:"monospace",textShadow:`0 0 6px ${cfg.badgeC}`}}>{selRoom.number}</span>
                  </div>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                    <p style={{fontSize:22,fontWeight:900,color:"#fff",letterSpacing:"-0.02em"}}>Room {selRoom.number}</p>
                    <div style={{padding:"2px 8px",borderRadius:20,background:`${cfg.glowA.replace("0.7","0.15")}`,border:`1px solid ${cfg.border}`,display:"flex",alignItems:"center",gap:4}}>
                      <div style={{width:6,height:6,borderRadius:"50%",background:cfg.badgeC,boxShadow:`0 0 5px ${cfg.badgeC}`}}/>
                      <span style={{fontSize:10,fontWeight:700,color:cfg.numC,letterSpacing:"0.04em"}}>{cfg.label.toUpperCase()}</span>
                    </div>
                  </div>
                  <p style={{fontSize:12,color:"rgba(255,255,255,0.35)"}}>
                    {selRoom.type||"Standard Room"} · Floor {selRoom.floor} · ₹{(selRoom.baseRate||0).toLocaleString("en-IN")}/raat
                  </p>
                </div>
              </div>

              <div style={{padding:"16px 20px 0"}}>

                {/* ── IMAGE GALLERY ── */}
                <div style={{marginBottom:16}}>
                  {imgs.length > 0 ? (
                    <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:4}}>
                      {imgs.map((src,i)=>(
                        <div key={i} style={{flexShrink:0,width:i===0?200:120,height:i===0?130:120,borderRadius:14,overflow:"hidden",border:`1px solid ${cfg.border.replace("0.8","0.3")}`,boxShadow:`0 0 16px ${cfg.glowA.replace("0.7","0.3")}`}}>
                          <img src={src} alt={`Room ${selRoom.number} view ${i+1}`} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Placeholder image slots for future */
                    <div style={{
                      width:"100%", height:140, borderRadius:16,
                      background:`linear-gradient(135deg,${cfg.glowA.replace("0.7","0.08")},rgba(255,255,255,0.02))`,
                      border:`1.5px dashed ${cfg.border.replace("0.8","0.3")}`,
                      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8
                    }}>
                      <div style={{fontSize:32}}>🛏️</div>
                      <p style={{fontSize:11,color:"rgba(255,255,255,0.2)",textAlign:"center",lineHeight:1.4}}>
                        Room photos yahan aayengi<br/>
                        <span style={{fontSize:10,color:cfg.numC,opacity:0.6}}>Tap to add images (coming soon)</span>
                      </p>
                    </div>
                  )}
                </div>

                {/* ── ROOM INFO GRID ── */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
                  {[
                    {label:"Room Type",   val:selRoom.type||"Standard",    icon:"🏠"},
                    {label:"Floor",       val:`Floor ${selRoom.floor}`,     icon:"🏢"},
                    {label:"Base Rate",   val:`₹${(selRoom.baseRate||0).toLocaleString("en-IN")}/raat`, icon:"💰"},
                    {label:"Capacity",    val:selRoom.capacity||"2 Adults", icon:"👥"},
                  ].map(item=>(
                    <div key={item.label} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"10px 12px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:4}}>
                        <span style={{fontSize:12}}>{item.icon}</span>
                        <p style={{fontSize:9,color:"rgba(255,255,255,0.3)",letterSpacing:"0.08em",textTransform:"uppercase",fontWeight:700}}>{item.label}</p>
                      </div>
                      <p style={{fontSize:13,color:"#fff",fontWeight:700}}>{item.val}</p>
                    </div>
                  ))}
                </div>

                {/* ── ACTIVE BOOKING DETAILS ── */}
                {selRoom.booking && (
                  <div style={{background:`linear-gradient(135deg,${cfg.glowA.replace("0.7","0.06")},rgba(0,0,0,0.2))`,border:`1px solid ${cfg.border.replace("0.8","0.2")}`,borderRadius:16,padding:16,marginBottom:16}}>
                    <p style={{fontSize:9,color:"rgba(255,255,255,0.3)",letterSpacing:"0.12em",textTransform:"uppercase",fontWeight:700,marginBottom:10}}>Current Guest</p>
                    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                      <div style={{width:40,height:40,borderRadius:"50%",background:`${cfg.glowA.replace("0.7","0.15")}`,border:`1px solid ${cfg.border.replace("0.8","0.3")}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>👤</div>
                      <div>
                        <p style={{fontSize:16,fontWeight:800,color:"#fff",marginBottom:2}}>{selRoom.booking.guestName}</p>
                        <p style={{fontSize:11,color:"rgba(255,255,255,0.35)"}}>{selRoom.booking.guestPhone}</p>
                      </div>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                      {[
                        {label:"Raatein",  val:selRoom.booking.nights},
                        {label:"Payment",  val:selRoom.booking.paymentMode||"Cash"},
                        {label:"Total",    val:`₹${Number(selRoom.booking.totalAmount||0).toLocaleString("en-IN")}`},
                      ].map(x=>(
                        <div key={x.label} style={{textAlign:"center",padding:"8px 4px",background:"rgba(255,255,255,0.025)",borderRadius:10}}>
                          <p style={{fontSize:14,fontWeight:900,color:"#D4AF37"}}>{x.val}</p>
                          <p style={{fontSize:9,color:"rgba(255,255,255,0.3)",marginTop:2}}>{x.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── ACTION BUTTONS ── */}
                {selRoom.booking ? (
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    <button onClick={()=>handleCheckout(selRoom.booking.id)} style={{width:"100%",padding:16,borderRadius:16,fontWeight:800,fontSize:15,background:"linear-gradient(135deg,#b8960c,#D4AF37,#F5C842)",color:"#000",border:"none",cursor:"pointer",boxShadow:"0 4px 24px rgba(212,175,55,0.45)",letterSpacing:"0.02em"}}>
                      ✓ Check-out Karo
                    </button>
                    <button onClick={()=>setSelRoom(null)} style={{width:"100%",padding:13,borderRadius:14,fontWeight:600,fontSize:13,background:"transparent",color:"rgba(255,255,255,0.35)",border:"1px solid rgba(255,255,255,0.08)",cursor:"pointer"}}>
                      Close
                    </button>
                  </div>
                ) : selRoom.status==="vacant" ? (
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    <button onClick={()=>{setSelRoom(null);onNewBooking&&onNewBooking(selRoom);}} style={{width:"100%",padding:16,borderRadius:16,fontWeight:800,fontSize:15,background:"linear-gradient(135deg,#b8960c,#D4AF37,#F5C842)",color:"#000",border:"none",cursor:"pointer",boxShadow:"0 4px 24px rgba(212,175,55,0.45)",letterSpacing:"0.02em"}}>
                      + Nayi Booking Karo
                    </button>
                    <button onClick={()=>setSelRoom(null)} style={{width:"100%",padding:13,borderRadius:14,fontWeight:600,fontSize:13,background:"transparent",color:"rgba(255,255,255,0.35)",border:"1px solid rgba(255,255,255,0.08)",cursor:"pointer"}}>
                      Close
                    </button>
                  </div>
                ) : (
                  <button onClick={()=>setSelRoom(null)} style={{width:"100%",padding:14,borderRadius:14,fontWeight:700,fontSize:13,background:"rgba(255,255,255,0.04)",color:"rgba(255,255,255,0.5)",border:"1px solid rgba(255,255,255,0.08)",cursor:"pointer"}}>
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}
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
