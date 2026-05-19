"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { RefreshCw, Maximize2, ChevronDown, Lock, Brain, ExternalLink, Check } from "lucide-react";
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, ReferenceDot
} from "recharts";
import {
  getTodayStats, getRooms, getBookingById, checkoutBooking,
  getTodayBookings, getWeeklyRevenue, initializeRooms
} from "../lib/db";

function greet() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

// ── Tiny SVG person icon ───────────────────────────────────────
function PersonIcon({ color = "#22c55e", size = 10 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill={color}>
      <circle cx="10" cy="6" r="4.5" />
      <path d="M2 20c0-4.418 3.582-8 8-8s8 3.582 8 8" />
    </svg>
  );
}

// ── Hologram Building SVG ──────────────────────────────────────
function HologramBuilding() {
  return (
    <svg width="90" height="110" viewBox="0 0 90 110" fill="none" className="hologram-building">
      {/* Base platform glow */}
      <ellipse cx="45" cy="100" rx="35" ry="6" fill="rgba(0,140,255,0.25)" />
      <ellipse cx="45" cy="100" rx="22" ry="4" fill="rgba(0,200,255,0.15)" />
      {/* Main tower */}
      <path d="M30 95 L30 30 L60 30 L60 95 Z" stroke="rgba(0,200,255,0.6)" strokeWidth="0.8" fill="rgba(0,100,200,0.08)" />
      {/* Tower top */}
      <path d="M30 30 L45 10 L60 30 Z" stroke="rgba(0,200,255,0.7)" strokeWidth="0.8" fill="rgba(0,140,255,0.12)" />
      {/* Windows grid */}
      {[35,42,49,56,63,70,77,84].map((y, yi) =>
        [33,40,47,54].map((x, xi) => (
          <rect key={`w${yi}${xi}`} x={x} y={y} width="4" height="4" rx="0.5"
            fill={Math.random() > 0.4 ? "rgba(0,220,255,0.7)" : "rgba(0,100,200,0.2)"}
            stroke="rgba(0,200,255,0.3)" strokeWidth="0.3" />
        ))
      )}
      {/* Antenna */}
      <line x1="45" y1="10" x2="45" y2="2" stroke="rgba(0,200,255,0.8)" strokeWidth="1" />
      <circle cx="45" cy="2" r="1.5" fill="rgba(0,255,255,1)" style={{ animation: "pulseDot 1s infinite" }} />
      {/* Side buildings */}
      <path d="M15 95 L15 50 L30 50 L30 95 Z" stroke="rgba(0,180,255,0.4)" strokeWidth="0.6" fill="rgba(0,80,160,0.06)" />
      <path d="M60 95 L60 55 L75 55 L75 95 Z" stroke="rgba(0,180,255,0.4)" strokeWidth="0.6" fill="rgba(0,80,160,0.06)" />
      {/* Horizontal scan lines */}
      {[40,55,70,85].map((y, i) => (
        <line key={i} x1="10" y1={y} x2="80" y2={y} stroke="rgba(0,200,255,0.15)" strokeWidth="0.5" />
      ))}
      {/* Gold base ring */}
      <ellipse cx="45" cy="95" rx="28" ry="4" stroke="rgba(212,175,55,0.5)" strokeWidth="0.8" fill="none" />
    </svg>
  );
}

// ── Audio Visualizer ───────────────────────────────────────────
function AudioViz() {
  const bars = [4, 8, 12, 7, 10, 5, 9, 6, 11, 4, 8, 12];
  return (
    <div className="audio-viz absolute -bottom-2 -right-1 z-10">
      {bars.map((h, i) => (
        <div key={i} className="viz-bar"
          style={{ height: 3, animationDelay: `${i * 0.06}s`, animationDuration: `${0.6 + (i%3)*0.15}s` }} />
      ))}
    </div>
  );
}

// ── Custom Revenue Tooltip ─────────────────────────────────────
function RevTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass px-3 py-2 rounded-xl text-xs" style={{ border: "1px solid rgba(212,175,55,0.3)" }}>
      <p style={{ color: "#D4AF37" }}>{label}</p>
      <p className="font-bold text-white">₹{(payload[0].value || 0).toLocaleString("en-IN")}</p>
    </div>
  );
}

export default function DashboardView({ hotelId, hotel, user, onNavigate, onNewBooking }) {
  const [stats,       setStats]    = useState(null);
  const [rooms,       setRooms]    = useState([]);
  const [revData,     setRevData]  = useState([]);
  const [insight,     setInsight]  = useState("High demand detected for Deluxe Rooms this weekend.");
  const [iLoad,       setILoad]    = useState(false);
  const [selRoom,     setSelRoom]  = useState(null);
  const [copied,      setCopied]   = useState(false);
  const [scanning,    setScanning] = useState(false);
  const [pct,         setPct]      = useState(() => (Math.random() * 20 + 5).toFixed(1));

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
      if (d.insight) setInsight(d.insight);
    } catch {}
    setILoad(false);
  };

  const handleRoomClick = (room) => {
    const booking = room.currentBookingId ? getBookingById(hotelId, room.currentBookingId) : null;
    setSelRoom({ ...room, booking });
  };

  const handleCheckout = (bookingId) => {
    checkoutBooking(hotelId, bookingId);
    load(); setSelRoom(null);
    if (navigator.vibrate) navigator.vibrate(50);
  };

  const handleScanClick = () => {
    if (navigator.vibrate) navigator.vibrate([30, 20, 60]);
    setScanning(true);
    setTimeout(() => setScanning(false), 1500);
    onNavigate("scanner");
  };

  const copyLink = () => {
    navigator.clipboard?.writeText(`${window.location.origin}/booking/${hotelId}`)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  if (!stats) return <Skeleton />;

  // ── Group rooms by floor ───────────────────────────────────
  const byFloor = {};
  rooms.forEach(r => {
    const f = r.floor || 1;
    if (!byFloor[f]) byFloor[f] = [];
    byFloor[f].push(r);
  });
  const floors = Object.keys(byFloor).map(Number).sort((a, b) => b - a);

  const todayActive = getTodayBookings(hotelId).filter(b => b.status === "active").length;
  const lastRev = revData[revData.length - 1];

  return (
    <div className="h-full scroll-y pb-4" style={{ paddingLeft: 14, paddingRight: 14, paddingTop: 8 }}>

      {/* ── 1. AI RECEPTIONIST CARD ───────────────────────── */}
      <div className="glass fade-up mb-3 p-4 flex items-center gap-3"
        style={{ animationDelay: "0s" }}>
        {/* Avatar with spinning ring */}
        <div className="relative flex-shrink-0" style={{ width: 60, height: 60 }}>
          <div className="avatar-ring" style={{ width: 60, height: 60, padding: 2 }}>
            <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center text-3xl"
              style={{ background: "linear-gradient(135deg,#1a1200,#2a1f00)", border: "none" }}>
              👩‍💼
            </div>
          </div>
          <AudioViz />
          {/* Live dot */}
          <div className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-black"
            style={{ animation: "pulseDot 2s infinite" }} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-base" style={{ color: "#D4AF37" }}>AI Receptionist</p>
          <p className="text-white text-sm font-semibold">{greet()}, {user?.role === "owner" ? "Owner" : "Manager"} 👋</p>
          <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.4)" }}>Here's your operational overview.</p>
        </div>

        <button onClick={copyLink}
          className="p-2.5 rounded-xl transition-all flex-shrink-0 active:scale-90"
          style={{ background: "rgba(0,140,255,0.18)", border: "1px solid rgba(0,140,255,0.35)" }}>
          {copied ? <Check size={16} className="text-green-400" /> : <ExternalLink size={16} style={{ color: "#60b3ff" }} />}
        </button>
      </div>

      {/* ── 2. LIVE REVENUE CARD ──────────────────────────── */}
      <div className="mb-3 rounded-2xl overflow-hidden fade-up"
        style={{
          animationDelay: "0.05s",
          background: "linear-gradient(160deg, #111625 0%, #0c0e00 100%)",
          border: "1px solid rgba(212,175,55,0.18)",
          boxShadow: "0 0 30px rgba(212,175,55,0.06)"
        }}>
        <div className="px-5 pt-5 pb-1">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)", letterSpacing: "0.16em" }}>
            LIVE REVENUE
          </p>
          <p className="revenue-number font-black mt-1.5"
            style={{ fontSize: 38, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            ₹{stats.todayRevenue.toLocaleString("en-IN")}<span style={{ fontSize: 22 }}>.00</span>
          </p>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>Today's Total Revenue</p>
          <div className="mt-2.5 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.25)" }}>
              ↑ {pct}% vs yesterday
            </span>
          </div>
        </div>

        {/* Recharts area with glow */}
        <div style={{ height: 90, marginBottom: -4 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revData} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#D4AF37" stopOpacity={0.45} />
                  <stop offset="60%"  stopColor="#D4AF37" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              <Tooltip content={<RevTooltip />} cursor={{ stroke: "rgba(212,175,55,0.2)", strokeWidth: 1 }} />
              <Area type="monotoneX" dataKey="revenue"
                stroke="#D4AF37" strokeWidth={2.5}
                fill="url(#revGrad)" dot={false}
                style={{ filter: "drop-shadow(0 0 6px #D4AF37) drop-shadow(0 0 12px rgba(212,175,55,0.5))" }} />
              {lastRev && (
                <ReferenceDot x={lastRev.date} y={lastRev.revenue}
                  r={5} fill="#F5C842" stroke="#fff" strokeWidth={1.5}
                  style={{ filter: "drop-shadow(0 0 6px #D4AF37)" }} />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── 3. ROOM OCCUPANCY 3D GRID ─────────────────────── */}
      <div className="glass mb-3 p-4 fade-up" style={{ animationDelay: "0.1s" }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">🛏</span>
            <span className="font-bold text-sm text-white" style={{ letterSpacing: "0.08em" }}>ROOM OCCUPANCY</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.55)" }}>
              Tower A <ChevronDown size={11} />
            </div>
            <button className="p-1.5 rounded-xl active:scale-90 transition-all"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <Maximize2 size={12} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* 3D Grid */}
        <div className="scroll-x">
          <div className="room-grid-3d" style={{ paddingBottom: 16 }}>
            <div className="room-grid-inner">
              {/* Column headers */}
              <div className="flex items-center mb-2.5" style={{ paddingLeft: 28 }}>
                {Array.from({ length: 8 }, (_, i) => (
                  <div key={i} className="font-mono text-center"
                    style={{ width: "calc(100% / 8)", fontSize: 9, color: "rgba(255,255,255,0.3)", minWidth: 38 }}>
                    {String(i + 1).padStart(2, "0")}
                  </div>
                ))}
              </div>

              {floors.map(floorNum => {
                const fr = [...(byFloor[floorNum] || [])].slice(0, 8);
                while (fr.length < 8) fr.push(null);
                return (
                  <div key={floorNum} className="flex items-center mb-2">
                    <div className="font-mono text-right pr-2 flex-shrink-0"
                      style={{ width: 26, fontSize: 9, color: "rgba(255,255,255,0.3)" }}>
                      {String(floorNum).padStart(2, "0")}
                    </div>
                    {fr.map((room, ci) => (
                      <Keycap key={room ? room.id : `e${floorNum}${ci}`}
                        room={room} onClick={() => room && handleRoomClick(room)} />
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-1">
          {[
            { c: "#22c55e", l: `Occupied (${stats.occupancyPercent}%)` },
            { c: "#D4AF37", l: "Reserved (5%)" },
            { c: "#ef4444", l: `Vacant (${Math.max(0, 100 - stats.occupancyPercent - 15)}%)` },
            { c: "#555",    l: "Out of Order (10%)" },
          ].map(({ c, l }) => (
            <div key={l} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: c, boxShadow: `0 0 4px ${c}` }} />
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.45)" }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 4. QUICK ACTIONS GRID ─────────────────────────── */}
      <div className="mb-3 fade-up" style={{ animationDelay: "0.15s" }}>
        <div className="grid grid-cols-3 items-center" style={{ gap: 10 }}>
          {/* Guest Check-in */}
          <QuickCard icon="👥" label="GUEST CHECK-IN" value={todayActive} sub="Pending" subColor="#60b3ff" />

          {/* AI SCAN centerpiece */}
          <div className="flex items-center justify-center" style={{ paddingTop: 8, paddingBottom: 8 }}>
            <div className="ai-scan-btn relative" onClick={handleScanClick}
              style={{ width: 110, height: 110 }}>
              {/* Outer rings */}
              <div className="ai-ring-1" />
              <div className="ai-ring-2" />
              <div className="ai-ring-3" />
              {/* Conic spinner rings */}
              <div className="ai-conic-1" />
              <div className="ai-conic-2" />
              {/* Core */}
              <div className="ai-scan-core w-full h-full flex flex-col items-center justify-center relative">
                {/* Laser inside */}
                <div className={`ai-laser ${scanning ? "opacity-100" : "opacity-70"}`} />
                <span className="font-black text-white z-10 relative" style={{ fontSize: 22, letterSpacing: "-0.03em", textShadow: "0 0 12px rgba(255,255,255,0.8)" }}>AI</span>
                <span className="font-bold z-10 relative" style={{ color: "#60b3ff", fontSize: 11, letterSpacing: "0.14em", textShadow: "0 0 8px rgba(0,140,255,0.8)" }}>SCAN</span>
              </div>
              {/* Ground glow */}
              <div className="ai-ground-glow" />
            </div>
          </div>

          {/* Maintenance */}
          <QuickCard icon="🔧" label="MAINTENANCE" value={5} sub="Pending" subColor="#D4AF37" />
          {/* Housekeeping */}
          <QuickCard icon="🧹" label="HOUSEKEEPING" value={stats.cleaningRooms || 8} sub="Rooms" subColor="#60b3ff" />
          {/* Empty center */}
          <div />
          {/* Reviews */}
          <QuickCard icon="⭐" label="REVIEWS" value="4.8" sub="Rating" subColor="#D4AF37" />
        </div>
      </div>

      {/* ── 5. AI INSIGHTS CARD ───────────────────────────── */}
      <div className="glass-blue rounded-2xl p-5 relative overflow-hidden fade-up"
        style={{ animationDelay: "0.2s", minHeight: 130 }}>
        {/* Hologram building — right side */}
        <div className="absolute right-2 bottom-0 opacity-85 pointer-events-none">
          <HologramBuilding />
        </div>

        {/* Content */}
        <div className="flex items-start gap-3 pr-24">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(0,140,255,0.2)", border: "1px solid rgba(0,140,255,0.35)", boxShadow: "0 0 12px rgba(0,140,255,0.3)" }}>
            <Brain size={18} style={{ color: "#60b3ff" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm uppercase tracking-widest mb-2" style={{ color: "#60b3ff", letterSpacing: "0.12em" }}>
              AI INSIGHTS
            </p>
            {iLoad ? (
              <div className="flex gap-1.5 py-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full"
                    style={{ background: "#60b3ff", animation: `pulseDot 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                ))}
              </div>
            ) : (
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>
                {insight}
              </p>
            )}
            <button onClick={fetchInsight}
              className="mt-3 px-4 py-2 rounded-xl text-xs font-bold active:scale-95 transition-all"
              style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.4)", color: "#D4AF37" }}>
              View Insights
            </button>
          </div>
        </div>
      </div>

      {/* ── Room Detail Modal ──────────────────────────────── */}
      {selRoom && (
        <RoomModal room={selRoom} onClose={() => setSelRoom(null)}
          onCheckout={handleCheckout} user={user} />
      )}
    </div>
  );
}

// ── 3D KEYCAP ─────────────────────────────────────────────────
function Keycap({ room, onClick }) {
  if (!room) {
    return (
      <div className="keycap keycap-outoforder flex-1 mx-0.5"
        style={{ aspectRatio: "1", minWidth: 36, maxWidth: 48 }} />
    );
  }

  // Determine visual status
  const st = room.status === "occupied" ? "occupied"
    : room.status === "cleaning" ? "cleaning"
    : room.number % 13 === 0 ? "outoforder"
    : room.number % 9  === 0 ? "reserved"
    : "vacant";

  const iconColor = {
    occupied:    "#34d368",
    vacant:      "#ef4444",
    reserved:    "#D4AF37",
    cleaning:    "#a78bfa",
    outoforder:  "#555",
  }[st];

  const numColor = {
    occupied:    "#86efac",
    vacant:      "#fca5a5",
    reserved:    "#fde68a",
    cleaning:    "#c4b5fd",
    outoforder:  "#555",
  }[st];

  return (
    <button
      onClick={onClick}
      className={`keycap keycap-${st} flex-1 mx-0.5 flex flex-col items-center justify-center`}
      style={{ aspectRatio: "1", minWidth: 36, maxWidth: 48, paddingTop: 2 }}>
      {/* Person icon */}
      <PersonIcon color={iconColor} size={10} />
      {/* Room number */}
      <span className="font-mono font-bold mt-0.5" style={{ fontSize: 8, color: numColor, lineHeight: 1.1 }}>
        {room.number}
      </span>
    </button>
  );
}

// ── QUICK CARD ────────────────────────────────────────────────
function QuickCard({ icon, label, value, sub, subColor }) {
  return (
    <div className="glass rounded-2xl p-3.5">
      <div className="flex items-center gap-1.5 mb-2">
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.06em", color: "rgba(255,255,255,0.4)", lineHeight: 1 }}>
          {label}
        </span>
      </div>
      <span className="font-black text-white block" style={{ fontSize: 28, letterSpacing: "-0.04em", lineHeight: 1 }}>
        {value}
      </span>
      <span className="font-semibold text-xs mt-1 block" style={{ color: subColor }}>{sub}</span>
    </div>
  );
}

// ── ROOM MODAL ────────────────────────────────────────────────
function RoomModal({ room, onClose, onCheckout, user }) {
  const b = room.booking;
  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/75" style={{ backdropFilter: "blur(10px)" }} />
      <div className="relative w-full rounded-t-3xl p-5 slide-up"
        style={{ background: "#0d1117", border: "1px solid rgba(255,255,255,0.1)", borderBottom: "none",
          boxShadow: "0 -4px 40px rgba(0,0,0,0.5)" }}
        onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full mx-auto mb-4 bg-white/20" />
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-xl" style={{ color: "#D4AF37" }}>Room {room.number}</h3>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
            style={room.status === "occupied"
              ? { background: "rgba(34,197,94,0.15)", color: "#22c55e" }
              : { background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>
            {room.status === "occupied" ? "Occupied" : room.status === "cleaning" ? "Cleaning" : "Vacant"}
          </span>
        </div>

        {b ? (
          <div className="space-y-2.5">
            {[["Guest", b.guestName], ["Phone", b.guestPhone || "—"],
              ["ID", `${b.idType} • ${b.idNumber}`],
              ["Check-in", new Date(b.checkInDate).toLocaleDateString("en-IN")],
              ["Nights", b.nights]].map(([l, v]) => (
              <div key={l} className="flex justify-between py-1.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{l}</span>
                <span className="text-sm font-semibold text-white">{v}</span>
              </div>
            ))}

            <div className="rounded-xl p-3.5 mt-2"
              style={{ background: "rgba(212,175,55,0.07)", border: "1px solid rgba(212,175,55,0.25)" }}>
              <div className="flex items-center gap-2 mb-2">
                <Lock size={12} style={{ color: "#D4AF37" }} />
                <span className="font-bold text-xs uppercase tracking-widest" style={{ color: "#D4AF37" }}>
                  Rate Integrity Badge
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>Locked Rate</span>
                <span className="font-bold" style={{ color: "#D4AF37" }}>₹{b.ratePerNight?.toLocaleString("en-IN")}/night</span>
              </div>
              <div className="flex justify-between mt-1.5">
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>Total</span>
                <span className="text-white font-black text-xl">₹{b.totalAmount?.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {user?.role === "owner" && (
              <button onClick={() => onCheckout(b.id)}
                className="w-full py-3 rounded-xl font-semibold text-sm text-red-400 active:scale-95 transition-all"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}>
                Check-out Karo
              </button>
            )}
          </div>
        ) : (
          <p className="text-center py-6 text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
            Room {room.status === "cleaning" ? "cleaning mein hai" : "khali hai"}
          </p>
        )}
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="px-3.5 py-2 space-y-3">
      {[72, 190, 240, 130, 120].map((h, i) => (
        <div key={i} className="rounded-2xl shimmer" style={{ height: h }} />
      ))}
    </div>
  );
}
