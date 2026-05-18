"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { RefreshCw, ChevronDown, Lock, Brain, ExternalLink, Check, Maximize2 } from "lucide-react";
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
  const [refreshing, setRefreshing] = useState(false);
  const [copied,     setCopied]   = useState(false);
  const [pct]                     = useState(() => (Math.random() * 10 + 10).toFixed(1));

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
    setRefreshing(true); load();
    await fetchInsight(); setRefreshing(false);
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
    load(); setSelRoom(null);
    if (navigator.vibrate) navigator.vibrate(50);
  };

  if (!stats) return <Skeleton />;

  // Group rooms by floor
  const byFloor = {};
  rooms.forEach(r => {
    const f = r.floor || 1;
    if (!byFloor[f]) byFloor[f] = [];
    byFloor[f].push(r);
  });
  const floors = Object.keys(byFloor).map(Number).sort((a, b) => b - a);
  const maxCols = Math.max(...floors.map(f => byFloor[f].length), 8);

  const pendingCheckIns = getTodayBookings(hotelId).filter(b => b.status === "active").length;

  return (
    <div className="h-full scroll-y pb-6" style={{ background: "#0A0A0A" }}>

      {/* ── AI RECEPTIONIST BANNER ── */}
      <div className="mx-3 mt-3 rounded-2xl p-4 flex items-center gap-3"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        {/* Avatar with real-person photo feel */}
        <div className="relative flex-shrink-0">
          <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg,#1a0a00,#2a1500)",
              border: "2px solid rgba(212,175,55,0.4)",
              boxShadow: "0 0 20px rgba(212,175,55,0.15)"
            }}>
            {/* Face emoji styled as real receptionist */}
            <span style={{ fontSize: 36 }}>👩‍💼</span>
          </div>
          {/* Blue pulse dot bottom left */}
          <div className="absolute -bottom-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: "#0A0A0A" }}>
            <div className="w-3.5 h-3.5 rounded-full bg-blue-500"
              style={{ boxShadow: "0 0 8px rgba(59,130,246,0.8)", animation: "pulseDot 2s infinite" }} />
          </div>
          {/* Sound wave icon */}
          <div className="absolute -bottom-1 left-3 w-6 h-4 flex items-center justify-center">
            <svg width="16" height="10" viewBox="0 0 16 10">
              {[0,1,2,3].map(i => (
                <rect key={i} x={i*4} y={i%2===0?2:0} width="2.5" height={i%2===0?6:10}
                  rx="1.2" fill="#60a5fa" opacity="0.7"
                  style={{ animation: `soundBar 0.8s ease-in-out ${i*0.15}s infinite alternate` }}/>
              ))}
            </svg>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-base" style={{ color: "#D4AF37" }}>AI Receptionist</p>
          <p className="text-white text-sm font-semibold">
            {greeting()}, {user?.role === "owner" ? "Owner" : "Manager"} 👋
          </p>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
            Here's your operational overview.
          </p>
        </div>

        {/* External link button */}
        <button onClick={copyLink}
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
          style={{ background: "rgba(0,112,243,0.15)", border: "1px solid rgba(0,112,243,0.3)" }}>
          {copied
            ? <Check size={16} className="text-green-400" />
            : <ExternalLink size={16} style={{ color: "#60a5fa" }} />}
        </button>
      </div>

      {/* ── LIVE REVENUE CARD ── */}
      <div className="mx-3 mt-3 rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(160deg,#111 0%,#0d0b00 60%,#0a0800 100%)",
          border: "1px solid rgba(212,175,55,0.2)",
          boxShadow: "0 0 40px rgba(212,175,55,0.06)"
        }}>
        <div className="px-5 pt-5 pb-0">
          <p className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "rgba(255,255,255,0.4)" }}>LIVE REVENUE</p>
          <p className="font-black mt-1"
            style={{ fontSize: 42, color: "#D4AF37", letterSpacing: "-0.03em", lineHeight: 1 }}>
            ₹{stats.todayRevenue.toLocaleString("en-IN")}
            <span className="text-2xl">.00</span>
          </p>
          <p className="text-gray-400 text-sm mt-1.5">Today's Total Revenue</p>
          <div className="mt-2 mb-3">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold"
              style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.25)" }}>
              ↑ {pct}% vs yesterday
            </span>
          </div>
        </div>
        {/* Glowing gold sparkline */}
        <div style={{ height: 100 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#D4AF37" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                </linearGradient>
                <filter id="goldGlow">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>
              <Tooltip
                contentStyle={{ background:"#111", border:"1px solid rgba(212,175,55,0.3)", borderRadius:8, fontSize:11 }}
                formatter={v => [`₹${v.toLocaleString("en-IN")}`, "Revenue"]}
                labelStyle={{ color:"#D4AF37" }} />
              <Area type="monotone" dataKey="revenue"
                stroke="#D4AF37" strokeWidth={2.5}
                fill="url(#goldGrad)" dot={false}
                style={{ filter: "drop-shadow(0 0 8px rgba(212,175,55,0.8))" }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── ROOM OCCUPANCY ── */}
      <div className="mx-3 mt-3 rounded-2xl p-4"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 18 }}>🛏</span>
            <span className="font-bold text-sm text-white tracking-widest">ROOM OCCUPANCY</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium"
              style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.5)" }}>
              Tower A <ChevronDown size={11} className="ml-0.5"/>
            </div>
            <button onClick={handleRefresh}
              className="w-7 h-7 rounded-xl flex items-center justify-center"
              style={{ background:"rgba(255,255,255,0.06)" }}>
              <Maximize2 size={12} className="text-gray-500"/>
            </button>
          </div>
        </div>

        {/* Column headers */}
        <div className="flex items-center mb-1" style={{ paddingLeft: 26 }}>
          {Array.from({ length: maxCols }, (_, i) => (
            <div key={i} className="flex-1 text-center font-mono"
              style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", minWidth: 0 }}>
              {String(i + 1).padStart(2, "0")}
            </div>
          ))}
        </div>

        {/* Room grid */}
        <div className="space-y-1.5">
          {floors.map(floorNum => {
            const fr = [...(byFloor[floorNum] || [])];
            while (fr.length < maxCols) fr.push(null);
            return (
              <div key={floorNum} className="flex items-center gap-0" style={{ gap: 3 }}>
                {/* Floor label */}
                <div className="font-mono text-right flex-shrink-0"
                  style={{ width: 22, fontSize: 9, color: "rgba(255,255,255,0.2)" }}>
                  {String(floorNum).padStart(2, "0")}
                </div>
                {/* Room cells */}
                {fr.map((room, ci) => (
                  <RoomCell key={room ? room.id : `e-${floorNum}-${ci}`}
                    room={room} onClick={() => room && handleRoomClick(room)} />
                ))}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-4">
          {[
            { c: "#22c55e", l: `Occupied (${stats.occupancyPercent}%)` },
            { c: "#D4AF37", l: "Reserved (5%)" },
            { c: "#ef4444", l: `Vacant (${Math.max(0, 100 - stats.occupancyPercent - 15)}%)` },
            { c: "#444",    l: "Out of Order (10%)" },
          ].map(({ c, l }) => (
            <div key={l} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.45)" }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── QUICK ACTIONS GRID (2×2 + AI SCAN center) ── */}
      <div className="mx-3 mt-3">
        {/* Top row: Guest Check-in | [AI SCAN space] | Maintenance */}
        <div className="grid grid-cols-3 gap-2 items-stretch">

          {/* Guest Check-in */}
          <QuickCard
            icon="👥" label="GUEST CHECK-IN"
            value={pendingCheckIns} sub="Pending" subColor="#0070F3" />

          {/* AI SCAN CENTER BUTTON — tall, spans 2 rows visually */}
          <div className="row-span-2 flex items-center justify-center">
            <button onClick={() => onNavigate && onNavigate("scanner")}
              className="w-full aspect-square rounded-full flex flex-col items-center justify-center transition-all active:scale-90 relative"
              style={{
                background: "radial-gradient(circle at 40% 35%, #001a3a, #000d1a 55%, #000508 100%)",
                border: "2px solid rgba(0,112,243,0.5)",
                boxShadow: [
                  "0 0 0 8px rgba(0,112,243,0.06)",
                  "0 0 0 16px rgba(0,112,243,0.03)",
                  "0 0 40px rgba(0,112,243,0.35)",
                  "0 0 80px rgba(0,112,243,0.15)",
                  "inset 0 0 30px rgba(0,112,243,0.12)",
                ].join(","),
                animation: "aiScanPulse 2.5s ease-in-out infinite",
              }}>
              {/* Outer ring */}
              <div className="absolute inset-0 rounded-full"
                style={{ border: "1px solid rgba(0,112,243,0.2)", animation: "rotateRing 8s linear infinite" }} />
              {/* Inner glow */}
              <div className="absolute inset-4 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(0,112,243,0.15), transparent 70%)" }} />
              <span className="font-black text-2xl text-white z-10 relative"
                style={{ letterSpacing: "-0.02em", lineHeight: 1, textShadow: "0 0 20px rgba(255,255,255,0.5)" }}>
                AI
              </span>
              <span className="font-bold text-xs z-10 relative mt-0.5"
                style={{ color: "#0070F3", letterSpacing: "0.18em", textShadow: "0 0 10px rgba(0,112,243,0.8)" }}>
                SCAN
              </span>
            </button>
          </div>

          {/* Maintenance */}
          <QuickCard
            icon="🔧" label="MAINTENANCE"
            value={5} sub="Pending" subColor="#D4AF37" />
        </div>

        {/* Bottom row: Housekeeping | [AI center already] | Reviews */}
        <div className="grid grid-cols-3 gap-2 mt-2">
          <QuickCard
            icon="🧹" label="HOUSEKEEPING"
            value={stats.cleaningRooms || 1} sub="Rooms" subColor="#0070F3" />
          <div /> {/* AI SCAN space */}
          <QuickCard
            icon="⭐" label="REVIEWS"
            value="4.8" sub="Rating" subColor="#D4AF37" />
        </div>
      </div>

      {/* ── AI INSIGHTS ── */}
      <div className="mx-3 mt-3 rounded-2xl p-4 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg,#080d1a,#060810)",
          border: "1px solid rgba(0,112,243,0.25)",
          boxShadow: "0 0 30px rgba(0,112,243,0.08)"
        }}>
        {/* 3D building graphic top-right */}
        <div className="absolute right-3 top-3 opacity-30 pointer-events-none"
          style={{ fontSize: 56, lineHeight: 1 }}>🏢</div>

        <div className="flex items-center gap-2 mb-2">
          <div className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(0,112,243,0.2)", border: "1px solid rgba(0,112,243,0.35)" }}>
            <Brain size={18} style={{ color: "#60a5fa" }} />
          </div>
          <span className="font-bold text-sm uppercase tracking-widest text-white">AI INSIGHTS</span>
        </div>

        {iLoad ? (
          <div className="flex gap-1.5 py-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-blue-500"
                style={{ animation: `pulseDot 1.2s ease-in-out ${i * 0.2}s infinite` }} />
            ))}
          </div>
        ) : (
          <p className="text-sm leading-relaxed pr-14" style={{ color: "rgba(255,255,255,0.75)" }}>
            {insight}
          </p>
        )}

        <button onClick={fetchInsight}
          className="mt-4 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
          style={{
            background: "rgba(212,175,55,0.1)",
            border: "1px solid rgba(212,175,55,0.35)",
            color: "#D4AF37",
            boxShadow: "0 0 15px rgba(212,175,55,0.08)"
          }}>
          View Insights
        </button>
      </div>

      {/* ── ROOM MODAL ── */}
      {selRoom && (
        <RoomModal room={selRoom} onClose={() => setSelRoom(null)}
          onCheckout={handleCheckout} user={user} onNewBooking={onNewBooking} />
      )}
    </div>
  );
}

/* ─── ROOM CELL ──────────────────────────────────────────────── */
function RoomCell({ room, onClick }) {
  // Null = empty/out-of-order slot
  if (!room) return (
    <div className="flex-1 rounded-xl"
      style={{
        aspectRatio: "1", minWidth: 0,
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.05)"
      }} />
  );

  const st = room.status;
  const styles = {
    occupied: {
      bg: "linear-gradient(145deg,#0f2e0f,#0a1f0a)",
      border: "rgba(34,197,94,0.55)",
      iconColor: "#22c55e",
      glow: "0 0 8px rgba(34,197,94,0.3)",
    },
    reserved: {
      bg: "linear-gradient(145deg,#2a1f00,#1a1400)",
      border: "rgba(212,175,55,0.55)",
      iconColor: "#D4AF37",
      glow: "0 0 8px rgba(212,175,55,0.3)",
    },
    cleaning: {
      bg: "linear-gradient(145deg,#0a0f2a,#060814)",
      border: "rgba(99,102,241,0.5)",
      iconColor: "#818cf8",
      glow: "0 0 8px rgba(99,102,241,0.3)",
    },
    vacant: {
      bg: "linear-gradient(145deg,#0f0505,#1a0505)",
      border: "rgba(239,68,68,0.4)",
      iconColor: "#ef4444",
      glow: "none",
    },
    out_of_order: {
      bg: "rgba(20,20,20,0.9)",
      border: "rgba(75,85,99,0.3)",
      iconColor: "#374151",
      glow: "none",
    },
  };

  const s = styles[st] || styles.vacant;

  return (
    <button onClick={onClick}
      className="flex-1 rounded-xl flex flex-col items-center justify-center transition-all active:scale-90"
      style={{
        aspectRatio: "1", minWidth: 0,
        background: s.bg,
        border: `1px solid ${s.border}`,
        boxShadow: s.glow,
      }}>
      {/* Person icon */}
      <svg width="10" height="10" viewBox="0 0 20 20" fill={s.iconColor}>
        <circle cx="10" cy="6" r="4" />
        <path d="M3 20c0-3.866 3.134-7 7-7s7 3.134 7 7" />
      </svg>
      {/* Room number */}
      <span className="font-mono font-black mt-0.5"
        style={{ fontSize: 7, color: s.iconColor, lineHeight: 1 }}>
        {room.number}
      </span>
    </button>
  );
}

/* ─── QUICK CARD ─────────────────────────────────────────────── */
function QuickCard({ icon, label, value, sub, subColor }) {
  return (
    <div className="rounded-2xl p-3.5"
      style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)" }}>
      <div className="flex items-center gap-1.5 mb-2">
        <span style={{ fontSize: 15 }}>{icon}</span>
        <span className="font-semibold uppercase"
          style={{ fontSize: 8, letterSpacing:"0.07em", color:"rgba(255,255,255,0.35)" }}>
          {label}
        </span>
      </div>
      <span className="font-black text-white block"
        style={{ fontSize: 30, letterSpacing:"-0.03em", lineHeight: 1 }}>
        {value}
      </span>
      <p className="font-semibold text-xs mt-1" style={{ color: subColor }}>{sub}</p>
    </div>
  );
}

/* ─── ROOM MODAL ─────────────────────────────────────────────── */
function RoomModal({ room, onClose, onCheckout, user, onNewBooking }) {
  const b = room.booking;
  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div className="absolute inset-0" style={{ background:"rgba(0,0,0,0.75)", backdropFilter:"blur(10px)" }}/>
      <div className="relative w-full rounded-t-3xl p-5 slide-up"
        style={{ background:"#0f0f0f", border:"1px solid rgba(255,255,255,0.1)", borderBottom:"none" }}
        onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full mx-auto mb-4 bg-white/20"/>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-black text-2xl text-white">Room {room.number}</h3>
            <p className="text-xs mt-0.5 capitalize" style={{ color:"rgba(255,255,255,0.4)" }}>
              {room.type} · Floor {room.floor}
            </p>
          </div>
          <span className="px-3 py-1.5 rounded-full text-xs font-bold"
            style={room.status === "occupied"
              ? { background:"rgba(34,197,94,0.15)", color:"#22c55e", border:"1px solid rgba(34,197,94,0.3)" }
              : room.status === "cleaning"
              ? { background:"rgba(99,102,241,0.15)", color:"#818cf8" }
              : { background:"rgba(239,68,68,0.15)", color:"#ef4444" }}>
            {room.status === "occupied" ? "Occupied"
              : room.status === "cleaning" ? "Cleaning" : "Vacant"}
          </span>
        </div>

        {b ? (
          <div className="space-y-2">
            <div className="rounded-2xl p-4 space-y-2.5"
              style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)" }}>
              {[
                ["👤 Guest",    b.guestName],
                ["📱 Phone",    b.guestPhone || "—"],
                ["🪪 ID",       `${b.idType} · ${b.idNumber || "—"}`],
                ["📅 Check-in", new Date(b.checkInDate).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})],
                ["🌙 Nights",   `${b.nights} raat`],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between items-center py-1 border-b border-white/5 last:border-0">
                  <span className="text-xs" style={{ color:"rgba(255,255,255,0.4)" }}>{l}</span>
                  <span className="text-sm font-semibold text-white">{v}</span>
                </div>
              ))}
            </div>

            {/* Rate Badge */}
            <div className="rounded-2xl p-4"
              style={{ background:"rgba(212,175,55,0.08)", border:"1px solid rgba(212,175,55,0.25)" }}>
              <div className="flex items-center gap-1.5 mb-2">
                <Lock size={12} style={{ color:"#D4AF37" }}/>
                <span className="font-bold text-xs uppercase tracking-widest" style={{ color:"#D4AF37" }}>
                  Rate Integrity Badge
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Locked Rate</span>
                <span className="font-bold" style={{ color:"#D4AF37" }}>
                  ₹{Number(b.ratePerNight||0).toLocaleString("en-IN")}/raat
                </span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-gray-400 text-sm">Total</span>
                <span className="font-black text-xl text-white">
                  ₹{Number(b.totalAmount||0).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <button onClick={() => onCheckout(b.id)}
              className="w-full py-3.5 rounded-2xl font-bold text-sm active:scale-95 transition-all"
              style={{ background:"linear-gradient(135deg,#b8960c,#D4AF37,#F5C842)", color:"#000",
                boxShadow:"0 4px 20px rgba(212,175,55,0.3)" }}>
              ✓ Check-out Karo
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="rounded-2xl p-6 text-center"
              style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-gray-400 text-sm capitalize">
                {room.status === "cleaning" ? "🧹 Cleaning mein hai" : "Room khali hai"}
              </p>
              <p className="text-gray-700 text-xs mt-1">Base Rate: ₹{room.baseRate}/raat</p>
            </div>
            {room.status === "vacant" && (
              <button onClick={() => { onClose(); onNewBooking && onNewBooking(room); }}
                className="w-full py-3.5 rounded-2xl font-bold text-sm active:scale-95"
                style={{ background:"linear-gradient(135deg,#b8960c,#D4AF37,#F5C842)", color:"#000" }}>
                + Nayi Booking Karo
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── SKELETON ───────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div className="px-3 py-3 space-y-3 animate-pulse" style={{ background:"#0A0A0A", minHeight:"100vh" }}>
      <div className="rounded-2xl loading-shimmer" style={{ height:80 }}/>
      <div className="rounded-2xl loading-shimmer" style={{ height:200 }}/>
      <div className="rounded-2xl loading-shimmer" style={{ height:300 }}/>
      <div className="rounded-2xl loading-shimmer" style={{ height:160 }}/>
      <div className="rounded-2xl loading-shimmer" style={{ height:120 }}/>
    </div>
  );
}

function localInsight(s) {
  if (!s) return "Data load ho raha hai...";
  if (s.occupancyPercent > 80)
    return `High demand detected! Aaj ${s.occupancyPercent}% rooms bhare hain. Rates ₹200-300 badha sakte ho. 🔥`;
  if (s.occupancyPercent > 50)
    return `${s.vacantRooms} rooms khali hain. Deluxe rooms weekend par promote karo aur pricing optimize karo. 💡`;
  return `High demand detected for Deluxe Rooms this weekend. Dynamic pricing +12% consider karo.`;
}
