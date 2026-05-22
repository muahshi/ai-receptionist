import { useState, useEffect, useRef, useCallback } from "react";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";

/* ─── MOCK DATA ─────────────────────────────────────────────── */
const revData = [
  { day: "Mon", revenue: 180000 }, { day: "Tue", revenue: 220000 },
  { day: "Wed", revenue: 195000 }, { day: "Thu", revenue: 310000 },
  { day: "Fri", revenue: 285000 }, { day: "Sat", revenue: 380000 },
  { day: "Sun", revenue: 245800 },
];

const ROOMS = [];
for (let floor = 5; floor >= 1; floor--) {
  for (let col = 1; col <= 8; col++) {
    const num = floor * 100 + col;
    const statuses = ["occupied","occupied","occupied","occupied","occupied","reserved","vacant","out_of_order"];
    const rand = (num * 7 + floor * 13) % 8;
    ROOMS.push({ number: num, floor, status: statuses[rand] });
  }
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

/* ─── GOLD PARTICLES ─────────────────────────────────────────── */
function GoldParticles() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    const particles = Array.from({ length: 24 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.4, vy: -(Math.random() * 0.35 + 0.08),
      vx: (Math.random() - 0.5) * 0.2, opacity: Math.random() * 0.45 + 0.1,
      pulse: Math.random() * Math.PI * 2,
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.pulse += 0.022; p.y += p.vy; p.x += p.vx;
        if (p.y < -4) { p.y = canvas.height + 4; p.x = Math.random() * canvas.width; }
        const a = p.opacity * (0.6 + 0.4 * Math.sin(p.pulse));
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212,175,55,${a})`; ctx.shadowBlur = 5;
        ctx.shadowColor = `rgba(212,175,55,${a * 0.8})`; ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={canvasRef} style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none", zIndex:0 }} />;
}

/* ─── VOICE WAVEFORM ──────────────────────────────────────────── */
function VoiceWaveform({ active }) {
  const bars = [3, 9, 14, 9, 5, 11, 15, 10, 4, 12, 7, 13, 6];
  return (
    <div style={{ display:"flex", alignItems:"center", gap:2.5, padding:"3px 8px", borderRadius:10,
      background:"rgba(10,14,30,0.92)", border:"1px solid rgba(59,130,246,0.35)",
      boxShadow: active ? "0 0 14px rgba(59,130,246,0.38)" : "none", transition:"all 0.3s" }}>
      {bars.map((h, i) => (
        <div key={i} style={{
          width:2.5, borderRadius:3,
          background: active ? "linear-gradient(180deg,#60a5fa,#3B82F6)" : "rgba(96,165,250,0.35)",
          height: active ? h : 3,
          transition: `height 0.12s ease ${i * 0.04}s`,
          boxShadow: active ? "0 0 4px rgba(96,165,250,0.6)" : "none",
        }} />
      ))}
    </div>
  );
}

/* ─── AI SCAN BUTTON ─────────────────────────────────────────── */
function AIScanButton({ scanning, onClick }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button onClick={onClick}
      onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)}
      onTouchStart={() => setPressed(true)} onTouchEnd={() => setPressed(false)}
      style={{ width:130, height:130, borderRadius:"50%", display:"flex", alignItems:"center",
        justifyContent:"center", cursor:"pointer", position:"relative", border:"none",
        background:"none", padding:0, transform: pressed ? "scale(0.93)" : "scale(1)", transition:"transform .12s ease" }}>
      <div style={{ position:"absolute", inset:-20, borderRadius:"50%",
        border:"1px solid rgba(0,140,255,0.12)", animation:"scanRingCW 14s linear infinite" }} />
      <div style={{ position:"absolute", inset:-11, borderRadius:"50%",
        border:"1.5px dashed rgba(0,140,255,0.22)", animation:"scanRingCCW 9s linear infinite" }} />
      <div style={{ position:"absolute", inset:-4, borderRadius:"50%",
        border:"2px solid rgba(0,140,255,0.52)",
        boxShadow:"0 0 22px rgba(0,140,255,0.28), inset 0 0 18px rgba(0,140,255,0.07)" }} />
      <div style={{ width:"100%", height:"100%", borderRadius:"50%",
        background:"radial-gradient(circle at 42% 36%, #001a3d 0%, #000d1f 55%, #000508 100%)",
        border:"2.5px solid rgba(0,140,255,0.68)",
        boxShadow:"0 0 0 5px rgba(0,140,255,0.07),0 0 35px rgba(0,140,255,0.55),0 0 70px rgba(0,140,255,0.2),inset 0 0 30px rgba(0,140,255,0.2)",
        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
        animation: scanning ? "none" : "aiScanPulse 2.5s ease-in-out infinite",
        position:"relative", overflow:"hidden" }}>
        {scanning && <div style={{ position:"absolute", inset:0, borderRadius:"50%",
          background:"conic-gradient(from 0deg, transparent 340deg, rgba(0,140,255,0.65) 350deg, rgba(0,220,255,0.9) 356deg, transparent 360deg)",
          animation:"scanLaser .55s linear" }} />}
        <div style={{ position:"absolute", inset:14, borderRadius:"50%",
          background:"radial-gradient(circle, rgba(0,140,255,0.22), transparent 72%)" }} />
        <span style={{ fontWeight:900, fontSize:25, color:"#fff", letterSpacing:"-0.02em",
          lineHeight:1, zIndex:1, position:"relative",
          textShadow:"0 0 20px rgba(255,255,255,0.7),0 0 45px rgba(0,140,255,0.9)" }}>AI</span>
        <span style={{ fontWeight:800, fontSize:10, color:"#3B82F6", letterSpacing:"0.22em",
          zIndex:1, position:"relative", marginTop:3,
          textShadow:"0 0 12px rgba(59,130,246,0.95)" }}>SCAN</span>
      </div>
    </button>
  );
}

/* ─── HOLOGRAM BUILDING ──────────────────────────────────────── */
function HologramBuilding() {
  return (
    <div style={{ width:90, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center",
      animation:"holoBuild 3s ease infinite" }}>
      <svg width="88" height="112" viewBox="0 0 88 112" fill="none">
        <ellipse cx="44" cy="104" rx="32" ry="7" stroke="rgba(0,140,255,0.45)" strokeWidth="1" fill="rgba(0,140,255,0.06)" />
        <rect x="24" y="32" width="40" height="67" stroke="rgba(0,140,255,0.65)" strokeWidth="1.3" fill="rgba(0,140,255,0.05)" rx="2" />
        <line x1="44" y1="10" x2="44" y2="32" stroke="rgba(0,140,255,0.75)" strokeWidth="1.3" />
        <circle cx="44" cy="9" r="2.8" fill="rgba(0,220,255,0.95)" />
        {[0,1,2,3,4,5,6].map(row => [0,1,2].map(col => (
          <rect key={`${row}-${col}`} x={30+col*11} y={38+row*8.5} width="7" height="5" rx="1"
            fill={row*3+col < 13 ? "rgba(0,210,255,0.38)" : "rgba(0,140,255,0.1)"}
            stroke="rgba(0,140,255,0.3)" strokeWidth="0.5" />
        )))}
        <line x1="24" y1="62" x2="64" y2="62" stroke="rgba(0,140,255,0.28)" strokeWidth="0.5" />
        <line x1="24" y1="78" x2="64" y2="78" stroke="rgba(0,140,255,0.28)" strokeWidth="0.5" />
        <line x1="24" y1="99" x2="64" y2="99" stroke="rgba(0,140,255,0.45)" strokeWidth="1.1" />
        <line x1="24" y1="32" x2="12" y2="41" stroke="rgba(0,140,255,0.25)" strokeWidth="0.9" />
        <line x1="64" y1="32" x2="76" y2="41" stroke="rgba(0,140,255,0.25)" strokeWidth="0.9" />
        <line x1="12" y1="41" x2="12" y2="99" stroke="rgba(0,140,255,0.18)" strokeWidth="0.9" />
        <line x1="76" y1="41" x2="76" y2="99" stroke="rgba(0,140,255,0.18)" strokeWidth="0.9" />
        <line x1="12" y1="99" x2="24" y2="99" stroke="rgba(0,140,255,0.25)" strokeWidth="0.9" />
        <line x1="76" y1="99" x2="64" y2="99" stroke="rgba(0,140,255,0.25)" strokeWidth="0.9" />
      </svg>
    </div>
  );
}

/* ─── ROOM CELL 3D ────────────────────────────────────────────── */
function RoomCell3D({ room, onClick }) {
  const [pressed, setPressed] = useState(false);
  if (!room) return <div style={{ flex:1, minWidth:0, aspectRatio:"1", borderRadius:8, background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.04)" }} />;
  const cfg = {
    occupied: { top:"linear-gradient(160deg,#1a4d1a,#0d2e0d)", border:"rgba(34,197,94,0.7)", shadow:"0 4px 0 rgba(10,40,10,0.9),0 0 10px rgba(34,197,94,0.28)", hl:"rgba(34,197,94,0.4)", icon:"#22c55e", num:"#4ade80" },
    reserved: { top:"linear-gradient(160deg,#3d2800,#2a1a00)", border:"rgba(212,175,55,0.72)", shadow:"0 4px 0 rgba(40,25,0,0.9),0 0 10px rgba(212,175,55,0.22)", hl:"rgba(212,175,55,0.38)", icon:"#D4AF37", num:"#F5C842" },
    vacant:   { top:"linear-gradient(160deg,#3d0d0d,#2e0808)", border:"rgba(239,68,68,0.55)", shadow:"0 4px 0 rgba(40,8,8,0.9),0 0 6px rgba(239,68,68,0.12)", hl:"rgba(239,68,68,0.22)", icon:"#ef4444", num:"#fca5a5" },
    out_of_order: { top:"rgba(20,22,28,0.9)", border:"rgba(75,85,99,0.4)", shadow:"0 3px 0 rgba(10,11,14,0.9)", hl:"rgba(255,255,255,0.05)", icon:"#374151", num:"#4B5563" },
  };
  const c = cfg[room.status] || cfg.vacant;
  return (
    <button onClick={onClick}
      onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)}
      style={{ flex:1, minWidth:0, aspectRatio:"1", background:c.top, border:`1px solid ${c.border}`,
        borderRadius:9, boxShadow:c.shadow, display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center", padding:"2px 1px 4px",
        position:"relative", overflow:"hidden", cursor:"pointer",
        transform: pressed ? "scale(0.86) translateZ(-4px)" : "scale(1)",
        transition:"transform 0.1s ease" }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:"36%",
        background:`linear-gradient(180deg,${c.hl},transparent)`, borderRadius:"9px 9px 0 0" }} />
      <svg width="10" height="10" viewBox="0 0 20 20" fill={c.icon} style={{ position:"relative", zIndex:1 }}>
        <circle cx="10" cy="6" r="4" /><path d="M3 20c0-3.866 3.134-7 7-7s7 3.134 7 7" />
      </svg>
      <span style={{ fontSize:7, fontWeight:900, color:c.num, fontFamily:"monospace", lineHeight:1, marginTop:1, position:"relative", zIndex:1 }}>{room.number}</span>
    </button>
  );
}

/* ─── QUICK CARD ──────────────────────────────────────────────── */
function QuickCard({ icon, label, value, sub, subColor, glowColor }) {
  return (
    <div style={{ borderRadius:18, padding:"14px 14px 12px", background:"rgba(255,255,255,0.04)",
      border:"1px solid rgba(255,255,255,0.08)", position:"relative", overflow:"hidden" }}>
      {glowColor && <div style={{ position:"absolute", bottom:0, right:0, width:70, height:70,
        borderRadius:"50%", background:`radial-gradient(circle,${glowColor} 0%,transparent 70%)`, pointerEvents:"none" }} />}
      <div style={{ fontSize:8, fontWeight:700, letterSpacing:"0.12em", color:"rgba(255,255,255,0.35)",
        textTransform:"uppercase", display:"flex", alignItems:"center", gap:5, marginBottom:8 }}>
        {icon}{label}
      </div>
      <div style={{ fontSize:32, fontWeight:900, color:"#fff", letterSpacing:"-0.04em", lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:12, fontWeight:600, marginTop:4, color:subColor }}>{sub}</div>
    </div>
  );
}

/* ─── ROOM MODAL ──────────────────────────────────────────────── */
function RoomModal({ room, onClose }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:50, display:"flex", alignItems:"flex-end",
      background:"rgba(0,0,0,0.78)", backdropFilter:"blur(14px)" }} onClick={onClose}>
      <div style={{ position:"relative", width:"100%",
        background:"linear-gradient(160deg,#0d1020,#080a14)",
        border:"1px solid rgba(255,255,255,0.1)", borderBottom:"none",
        borderRadius:"24px 24px 0 0", padding:20, animation:"slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards"
      }} onClick={e => e.stopPropagation()}>
        <div style={{ width:40, height:4, borderRadius:2, background:"rgba(255,255,255,0.15)", margin:"0 auto 16px" }} />
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <div>
            <h3 style={{ fontWeight:900, fontSize:22, color:"#fff" }}>Room {room.number}</h3>
            <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:2 }}>Deluxe · Floor {room.floor}</p>
          </div>
          <span style={{
            padding:"5px 12px", borderRadius:20, fontSize:11, fontWeight:700,
            background: room.status==="occupied" ? "rgba(34,197,94,0.15)" : room.status==="reserved" ? "rgba(212,175,55,0.15)" : "rgba(239,68,68,0.15)",
            color: room.status==="occupied" ? "#22c55e" : room.status==="reserved" ? "#D4AF37" : "#ef4444",
            border: `1px solid ${room.status==="occupied" ? "rgba(34,197,94,0.3)" : room.status==="reserved" ? "rgba(212,175,55,0.3)" : "rgba(239,68,68,0.3)"}`,
          }}>{room.status === "out_of_order" ? "Out of Order" : room.status.charAt(0).toUpperCase() + room.status.slice(1)}</span>
        </div>
        <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, padding:24, textAlign:"center", marginBottom:12 }}>
          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:13 }}>
            {room.status==="occupied" ? "👤 Guest is checked in" : room.status==="reserved" ? "📋 Booking confirmed" : room.status==="vacant" ? "🏨 Room is available" : "🔧 Under maintenance"}
          </p>
          <p style={{ color:"rgba(255,255,255,0.2)", fontSize:11, marginTop:4 }}>Base Rate: ₹3,500/night</p>
        </div>
        {room.status === "vacant" && (
          <button onClick={onClose} style={{ width:"100%", padding:"14px 0", borderRadius:16, border:"none",
            fontWeight:800, fontSize:14, color:"#000", cursor:"pointer",
            background:"linear-gradient(135deg,#b8960c,#D4AF37,#F5C842)",
            boxShadow:"0 4px 22px rgba(212,175,55,0.4)" }}>+ New Booking</button>
        )}
        {room.status === "occupied" && (
          <button onClick={onClose} style={{ width:"100%", padding:"14px 0", borderRadius:16, border:"none",
            fontWeight:800, fontSize:14, color:"#000", cursor:"pointer",
            background:"linear-gradient(135deg,#b8960c,#D4AF37,#F5C842)",
            boxShadow:"0 4px 22px rgba(212,175,55,0.4)" }}>✓ Check-out</button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════════════════════════ */
export default function GuestInnDashboard() {
  const [activeTab, setActiveTab] = useState("home");
  const [selRoom, setSelRoom] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [revenue, setRevenue] = useState(24580000);
  const [insight] = useState("High demand detected for Deluxe Rooms this weekend. Dynamic pricing +12% recommended. 🔥");

  // Simulate live revenue updates
  useEffect(() => {
    const iv = setInterval(() => {
      setRevenue(r => r + Math.floor(Math.random() * 5000 - 1000));
    }, 4000);
    return () => clearInterval(iv);
  }, []);

  const handleScan = () => {
    setScanning(true);
    setTimeout(() => { setScanning(false); setActiveTab("bookings"); }, 700);
  };

  const openAI = () => { setVoiceActive(true); setTimeout(() => setVoiceActive(false), 3000); };

  // Build floor grid
  const byFloor = {};
  ROOMS.forEach(r => { if (!byFloor[r.floor]) byFloor[r.floor] = []; byFloor[r.floor].push(r); });
  const floors = Object.keys(byFloor).map(Number).sort((a, b) => b - a);

  const NAV = [
    { id:"home",     label:"Dashboard",  icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
    { id:"bookings", label:"Bookings",   icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg> },
    { id:"guests",   label:"Guests",     icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { id:"ops",      label:"Operations", icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg> },
    { id:"reports",  label:"Reports",    icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg> },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100dvh", background:"#07090E", fontFamily:"Inter,sans-serif", maxWidth:430, margin:"0 auto", position:"relative", overflow:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
        @keyframes rotateRing { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulseDot { 0%,100%{opacity:1;box-shadow:0 0 8px #3B82F6,0 0 18px rgba(59,130,246,0.55)} 50%{opacity:.55;box-shadow:0 0 4px #3B82F6} }
        @keyframes scanRingCW { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes scanRingCCW { from{transform:rotate(0deg)} to{transform:rotate(-360deg)} }
        @keyframes scanLaser { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        @keyframes aiScanPulse {
          0%,100%{ box-shadow:0 0 0 5px rgba(0,140,255,.07),0 0 35px rgba(0,140,255,.55),0 0 70px rgba(0,140,255,.2),inset 0 0 30px rgba(0,140,255,.2); }
          50%    { box-shadow:0 0 0 10px rgba(0,140,255,.04),0 0 55px rgba(0,140,255,.75),0 0 95px rgba(0,140,255,.3),inset 0 0 45px rgba(0,140,255,.28); }
        }
        @keyframes goldGlow { 0%,100%{filter:drop-shadow(0 0 6px rgba(212,175,55,.7))} 50%{filter:drop-shadow(0 0 20px rgba(212,175,55,1))} }
        @keyframes holoBuild { 0%,100%{opacity:.65} 50%{opacity:1} }
        @keyframes slideUp { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes dotBounce { 0%,80%,100%{transform:scale(.4);opacity:.3} 40%{transform:scale(1);opacity:1} }
        @keyframes navGlow { 0%,100%{box-shadow:0 0 8px rgba(212,175,55,0.3)} 50%{box-shadow:0 0 20px rgba(212,175,55,0.75)} }
        @keyframes liveRev { 0%{opacity:.8} 50%{opacity:1} 100%{opacity:.8} }
      `}</style>

      {/* ── TOP HEADER ── */}
      <header style={{ flexShrink:0, background:"linear-gradient(180deg,rgba(8,10,18,0.98),rgba(5,7,14,0.95))",
        borderBottom:"1px solid rgba(212,175,55,0.1)", boxShadow:"0 4px 24px rgba(0,0,0,0.5)" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px" }}>
          <button style={{ width:40, height:40, borderRadius:12, background:"rgba(212,175,55,0.06)",
            border:"1px solid rgba(212,175,55,0.18)", display:"flex", alignItems:"center", justifyContent:"center",
            cursor:"pointer" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.2" strokeLinecap="round">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>

          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M3 21V9l9-6 9 6v12" stroke="#D4AF37" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="M9 21V13h6v8" stroke="#D4AF37" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="M12 3v2" stroke="#F5C842" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span style={{ fontSize:20, fontWeight:900, color:"#fff", letterSpacing:"-0.02em" }}>The GuestInn</span>
            </div>
            <span style={{ fontSize:8.5, fontWeight:700, letterSpacing:"0.18em", color:"rgba(212,175,55,0.7)", textTransform:"uppercase" }}>AI-POWERED HOTEL MANAGEMENT</span>
          </div>

          <button style={{ width:40, height:40, borderRadius:12, background:"rgba(255,255,255,0.04)",
            border:"1px solid rgba(255,255,255,0.08)", display:"flex", alignItems:"center", justifyContent:"center",
            cursor:"pointer", position:"relative" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
            </svg>
            <div style={{ position:"absolute", top:9, right:9, width:7, height:7, borderRadius:"50%",
              background:"#D4AF37", boxShadow:"0 0 8px #D4AF37", border:"1.5px solid #07090E" }} />
          </button>
        </div>
      </header>

      {/* ── MAIN SCROLL ── */}
      <main style={{ flex:1, overflowY:"auto", overflowX:"hidden", scrollbarWidth:"none" }}>

        {/* ── AI RECEPTIONIST CARD ── */}
        <div style={{ margin:"12px 12px 0", borderRadius:20, padding:"14px 16px",
          background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.09)",
          backdropFilter:"blur(20px)", display:"flex", alignItems:"center", gap:14,
          position:"relative", overflow:"hidden", animation:"fadeIn 0.5s ease forwards" }}>
          <div style={{ position:"relative", flexShrink:0, width:72, height:72 }}>
            <div style={{ position:"absolute", inset:-6, borderRadius:"50%",
              border:"1.5px solid rgba(0,140,255,0.4)", animation:"rotateRing 8s linear infinite" }} />
            <div onClick={openAI} style={{ width:72, height:72, borderRadius:"50%",
              background:"linear-gradient(135deg,#1a1a2e,#16213e)",
              border:"2.5px solid #D4AF37",
              boxShadow:"0 0 0 4px rgba(212,175,55,0.12),0 0 22px rgba(212,175,55,0.28)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:36, overflow:"hidden", cursor:"pointer" }}>👩‍💼</div>
            <div style={{ position:"absolute", bottom:2, right:2, width:14, height:14,
              borderRadius:"50%", background:"#3B82F6",
              boxShadow:"0 0 8px #3B82F6,0 0 16px rgba(59,130,246,0.5)",
              animation:"pulseDot 2s ease infinite" }} />
            <div style={{ position:"absolute", bottom:-5, left:"50%", transform:"translateX(-50%)" }}>
              <VoiceWaveform active={voiceActive} />
            </div>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ color:"#D4AF37", fontWeight:800, fontSize:15 }}>AI Receptionist</p>
            <p style={{ color:"#fff", fontSize:13, fontWeight:600, marginTop:1 }}>{greeting()}, Manager 👋</p>
            <p style={{ color:"rgba(255,255,255,0.38)", fontSize:11, marginTop:2 }}>Here's your operational overview.</p>
          </div>
          <div style={{ position:"absolute", top:14, right:14, width:10, height:10,
            borderRadius:"50%", background:"#3B82F6", boxShadow:"0 0 8px #3B82F6",
            animation:"pulseDot 2s ease infinite" }} />
        </div>

        {/* ── LIVE REVENUE ── */}
        <div style={{ margin:"12px 12px 0", borderRadius:20,
          background:"linear-gradient(160deg,#111825,#0a0d15)",
          border:"1px solid rgba(212,175,55,0.2)", overflow:"hidden",
          position:"relative", animation:"fadeIn 0.6s ease 0.05s both" }}>
          <GoldParticles />
          <div style={{ padding:"20px 20px 0", position:"relative", zIndex:1 }}>
            <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.14em", color:"rgba(255,255,255,0.4)", textTransform:"uppercase" }}>LIVE REVENUE</p>
            <p style={{ fontSize:36, fontWeight:900, letterSpacing:"-0.03em", lineHeight:1, marginTop:6,
              background:"linear-gradient(135deg,#b8960c 0%,#D4AF37 45%,#F5C842 100%)",
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
              filter:"drop-shadow(0 0 12px rgba(212,175,55,0.5))",
              animation:"liveRev 4s ease infinite" }}>
              ₹{revenue.toLocaleString("en-IN")}<span style={{ fontSize:20 }}>.00</span>
            </p>
            <p style={{ color:"rgba(255,255,255,0.5)", fontSize:12, marginTop:6 }}>Today's Total Revenue</p>
            <div style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"4px 10px",
              borderRadius:100, marginTop:10, background:"rgba(34,197,94,0.12)",
              border:"1px solid rgba(34,197,94,0.25)", color:"#22c55e", fontSize:11, fontWeight:700 }}>↑ 18.6% vs yesterday</div>
          </div>
          <div style={{ height:110, marginTop:4, position:"relative", zIndex:1 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revData} margin={{ top:8, right:0, left:0, bottom:0 }}>
                <defs>
                  <linearGradient id="rGold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip contentStyle={{ background:"#111", border:"1px solid rgba(212,175,55,.3)", borderRadius:8, fontSize:11 }}
                  formatter={v => [`₹${v.toLocaleString("en-IN")}`, "Revenue"]} labelStyle={{ color:"#D4AF37" }} />
                <Area type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={2.5}
                  fill="url(#rGold)" dot={false} style={{ filter:"drop-shadow(0 0 12px rgba(212,175,55,0.95))" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ position:"absolute", right:0, top:"54%", zIndex:2, width:12, height:12,
            borderRadius:"50%", background:"#F5C842",
            boxShadow:"0 0 14px #D4AF37,0 0 26px rgba(212,175,55,.75)",
            animation:"goldGlow 2s ease infinite" }} />
        </div>

        {/* ── ROOM OCCUPANCY ── */}
        <div style={{ margin:"12px 12px 0", borderRadius:20, padding:"16px 14px",
          background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)",
          animation:"fadeIn 0.7s ease 0.1s both" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, fontWeight:800, color:"#fff", letterSpacing:"0.06em" }}>
              <span style={{ fontSize:16 }}>🛏</span> ROOM OCCUPANCY
            </div>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <div style={{ display:"flex", alignItems:"center", gap:4, padding:"5px 10px", borderRadius:10,
                fontSize:11, fontWeight:600, background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.1)",
                color:"rgba(255,255,255,0.55)", cursor:"pointer" }}>
                Tower A
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 3.5l3 3 3-3" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </div>
              <div style={{ width:28, height:28, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(255,255,255,0.06)", cursor:"pointer" }}>
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M1 5V1h4M9 1h4v4M1 9v4h4M9 13h4V9" stroke="rgba(255,255,255,0.4)" strokeWidth="1.4" strokeLinecap="round" /></svg>
              </div>
            </div>
          </div>

          {/* Column numbers */}
          <div style={{ display:"flex", paddingLeft:24, marginBottom:6 }}>
            {Array.from({length:8},(_,i)=>(
              <div key={i} style={{ flex:1, textAlign:"center", fontSize:9, color:"rgba(255,255,255,0.2)", fontFamily:"monospace" }}>
                {String(i+1).padStart(2,"0")}
              </div>
            ))}
          </div>

          {/* 3D grid */}
          <div style={{ perspective:"1000px", perspectiveOrigin:"50% 0%", overflowX:"auto" }}>
            <div style={{ transform:"rotateX(22deg)", transformStyle:"preserve-3d", transformOrigin:"top center", minWidth:280 }}>
              {floors.map(fl => (
                <div key={fl} style={{ display:"flex", alignItems:"center", gap:4, marginBottom:5 }}>
                  <span style={{ width:18, flexShrink:0, fontSize:9, fontWeight:700, color:"rgba(255,255,255,0.22)", fontFamily:"monospace", textAlign:"center" }}>
                    {String(fl).padStart(2,"0")}
                  </span>
                  {byFloor[fl].map(room => (
                    <RoomCell3D key={room.number} room={room} onClick={() => setSelRoom(room)} />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div style={{ display:"flex", flexWrap:"wrap", gap:"6px 14px", marginTop:14 }}>
            {[["#22c55e","Occupied (68%)"],["#D4AF37","Reserved (5%)"],["#ef4444","Vacant (17%)"],["#4B5563","Out of Order (10%)"]].map(([c,l]) => (
              <div key={l} style={{ display:"flex", alignItems:"center", gap:5 }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:c, boxShadow:`0 0 6px ${c}` }} />
                <span style={{ fontSize:10, color:"rgba(255,255,255,0.45)" }}>{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── QUICK STATS + AI SCAN ── */}
        <div style={{ margin:"12px 12px 0", display:"grid", gridTemplateColumns:"1fr auto 1fr", gridTemplateRows:"1fr 1fr", gap:10, animation:"fadeIn 0.8s ease 0.15s both" }}>
          <QuickCard icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
            label="GUEST CHECK-IN" value="12" sub="Pending" subColor="#D4AF37" glowColor="rgba(212,175,55,0.09)" />
          <div style={{ gridRow:"1 / 3", gridColumn:"2 / 3", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <AIScanButton scanning={scanning} onClick={handleScan} />
          </div>
          <QuickCard icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>}
            label="MAINTENANCE" value="5" sub="Pending" subColor="#F59E0B" glowColor="rgba(245,158,11,0.09)" />
          <QuickCard icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2"><path d="M3 22V12a9 9 0 0 1 18 0v10M3 16h18"/></svg>}
            label="HOUSEKEEPING" value="8" sub="Rooms" subColor="#8B5CF6" glowColor="rgba(139,92,246,0.09)" />
          <QuickCard icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F5C842" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
            label="REVIEWS" value="4.8" sub="Rating" subColor="#F5C842" glowColor="rgba(245,200,66,0.09)" />
        </div>

        {/* ── AI INSIGHTS ── */}
        <div style={{ margin:"12px 12px 20px", borderRadius:20, padding:"18px 16px",
          background:"linear-gradient(135deg,#060d1f,#080a14)",
          border:"1px solid rgba(0,140,255,0.25)", boxShadow:"0 0 44px rgba(0,140,255,0.07)",
          display:"flex", gap:12, position:"relative", overflow:"hidden",
          animation:"fadeIn 0.9s ease 0.2s both" }}>
          <div style={{ position:"absolute", top:-30, right:-30, width:130, height:130,
            borderRadius:"50%", background:"radial-gradient(circle,rgba(0,140,255,0.1),transparent 70%)", pointerEvents:"none" }} />
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
              <div style={{ width:36, height:36, borderRadius:12, flexShrink:0, display:"flex",
                alignItems:"center", justifyContent:"center", background:"rgba(0,140,255,0.2)",
                border:"1px solid rgba(0,140,255,0.4)" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="1.7">
                  <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/>
                  <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>
                </svg>
              </div>
              <span style={{ fontSize:12, fontWeight:800, letterSpacing:"0.12em", color:"#fff", textTransform:"uppercase" }}>AI INSIGHTS</span>
            </div>
            <p style={{ fontSize:13, lineHeight:1.6, color:"rgba(255,255,255,0.72)", paddingRight:8 }}>{insight}</p>
            <button style={{ marginTop:14, padding:"9px 18px", borderRadius:12, fontSize:12, fontWeight:700,
              background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.35)",
              color:"#D4AF37", cursor:"pointer" }}>View Insights</button>
          </div>
          <HologramBuilding />
        </div>
      </main>

      {/* ── BOTTOM NAV ── */}
      <nav style={{ flexShrink:0, background:"linear-gradient(180deg,rgba(6,8,15,0.98),rgba(4,5,12,0.99))",
        borderTop:"1px solid rgba(212,175,55,0.08)", boxShadow:"0 -4px 24px rgba(0,0,0,0.6)" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-around", padding:"8px 6px 8px" }}>
          {NAV.map(({ id, icon, label }) => {
            const active = activeTab === id;
            return (
              <button key={id} onClick={() => setActiveTab(id)} style={{
                display:"flex", flexDirection:"column", alignItems:"center", gap:4,
                padding:"6px 10px", borderRadius:14, border:"none",
                background:"transparent", cursor:"pointer", position:"relative" }}>
                {active && (
                  <div style={{ position:"absolute", top:-8, left:"50%", transform:"translateX(-50%)",
                    width:32, height:3, borderRadius:2, background:"#D4AF37",
                    boxShadow:"0 0 10px rgba(212,175,55,0.85),0 0 22px rgba(212,175,55,0.45)",
                    animation:"navGlow 2s ease infinite" }} />
                )}
                <div style={{ width:36, height:36, borderRadius:11, display:"flex", alignItems:"center", justifyContent:"center",
                  background: active ? "rgba(212,175,55,0.12)" : "transparent",
                  border: active ? "1px solid rgba(212,175,55,0.25)" : "1px solid transparent",
                  boxShadow: active ? "0 0 14px rgba(212,175,55,0.18)" : "none",
                  transition:"all 0.2s",
                  color: active ? "#D4AF37" : "rgba(255,255,255,0.25)",
                  filter: active ? "drop-shadow(0 0 5px rgba(212,175,55,0.65))" : "none" }}>
                  {icon}
                </div>
                <span style={{ fontSize:9, fontWeight: active ? 800 : 500,
                  color: active ? "#D4AF37" : "rgba(255,255,255,0.22)",
                  letterSpacing:"0.04em",
                  textShadow: active ? "0 0 8px rgba(212,175,55,0.45)" : "none",
                  transition:"all 0.2s" }}>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── ROOM MODAL ── */}
      {selRoom && <RoomModal room={selRoom} onClose={() => setSelRoom(null)} />}
    </div>
  );
}
