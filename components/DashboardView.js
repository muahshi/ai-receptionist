"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { RefreshCw, Maximize2, ChevronDown, Lock, ExternalLink, Copy, Check, Brain } from "lucide-react";
import {
  AreaChart, Area, ResponsiveContainer, Tooltip
} from "recharts";
import {
  getTodayStats, getRooms, getBookingById,
  initializeRooms, checkoutBooking, getTodayBookings, getWeeklyRevenue
} from "../lib/db";

// ── Greeting based on time ────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardView({ user, onNavigate, onNewBooking }) {
  const [stats, setStats]           = useState(null);
  const [rooms, setRooms]           = useState([]);
  const [insight, setInsight]       = useState("High demand detected for Deluxe Rooms this weekend.");
  const [insightLoading, setIL]     = useState(false);
  const [selectedRoom, setSelRoom]  = useState(null);
  const [revenueData, setRevData]   = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [tower, setTower]           = useState("Tower A");

  const loadData = useCallback(() => {
    initializeRooms(parseInt(process.env.NEXT_PUBLIC_HOTEL_TOTAL_ROOMS || "40"));
    const s = getTodayStats();
    setStats(s);
    setRooms(getRooms());
    setRevData(getWeeklyRevenue());
  }, []);

  useEffect(() => {
    loadData();
    fetchInsight();
    const iv = setInterval(loadData, 30000);
    return () => clearInterval(iv);
  }, [loadData]);

  const fetchInsight = async () => {
    setIL(true);
    try {
      const s = getTodayStats();
      const res = await fetch("/api/groq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "ai_insight", stats: s }),
      });
      const data = await res.json();
      if (data.insight) setInsight(data.insight);
    } catch {}
    setIL(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    loadData();
    await fetchInsight();
    setRefreshing(false);
  };

  const copyLink = () => {
    navigator.clipboard?.writeText(`${window.location.origin}/booking/default`)
      .then(() => { setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000); });
  };

  // Compute percentage vs yesterday (mock ±)
  const pctChange = stats ? (Math.random() * 25 + 5).toFixed(1) : "18.6";

  if (!stats) return <Skeleton />;

  // Group rooms by floor for the grid
  const floors = {};
  rooms.forEach(r => {
    const f = r.floor || Math.ceil(r.number / 8);
    if (!floors[f]) floors[f] = [];
    floors[f].push(r);
  });
  const floorNums = Object.keys(floors).map(Number).sort((a,b) => b - a);

  return (
    <div className="h-full scroll-y px-3 py-2 space-y-3 pb-4">

      {/* ── AI Receptionist Banner ───────────────────────────────────── */}
      <div className="card rounded-2xl p-4 flex items-center gap-3 fade-up">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-16 h-16 rounded-2xl overflow-hidden"
            style={{ border: "2px solid rgba(212,175,55,0.4)" }}>
            <div className="w-full h-full flex items-center justify-center text-3xl"
              style={{ background: "linear-gradient(135deg, #1a1200, #2a1f00)" }}>
              👩‍💼
            </div>
          </div>
          {/* Live pulse */}
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: "#0A0A0A", border: "1px solid rgba(212,175,55,0.3)" }}>
            <div className="w-3 h-3 rounded-full bg-blue-500" style={{ animation: "pulse-gold 2s infinite" }} />
          </div>
        </div>

        <div className="flex-1">
          <p className="font-bold text-base" style={{ color: "#D4AF37" }}>AI Receptionist</p>
          <p className="text-white text-sm">{getGreeting()}, {user?.role === "owner" ? "Owner" : "Manager"} 👋</p>
          <p className="text-gray-500 text-xs">Here's your operational overview.</p>
        </div>

        <button onClick={copyLink}
          className="p-2 rounded-xl transition-all"
          style={{ background: "rgba(0,112,243,0.15)", border: "1px solid rgba(0,112,243,0.3)" }}
          title="Copy guest booking link">
          {linkCopied
            ? <Check size={16} className="text-green-400" />
            : <ExternalLink size={16} style={{ color: "#0070F3" }} />}
        </button>
      </div>

      {/* ── Live Revenue Card ────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden fade-up"
        style={{ background: "linear-gradient(160deg, #111111 0%, #0f0d00 100%)", border: "1px solid rgba(212,175,55,0.15)", animationDelay: "0.05s" }}>
        <div className="px-4 pt-4 pb-0">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest">Live Revenue</p>
          <p className="font-black mt-1" style={{ fontSize: 34, color: "#D4AF37", letterSpacing: "-0.02em" }}>
            ₹{stats.todayRevenue.toLocaleString("en-IN")}<span className="text-lg">.00</span>
          </p>
          <p className="text-gray-400 text-sm mt-0.5">Today's Total Revenue</p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1"
              style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}>
              ↑ {pctChange}% vs yesterday
            </span>
          </div>
        </div>

        {/* Sparkline chart */}
        <div className="h-24 mt-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#D4AF37" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <Tooltip
                contentStyle={{ background: "#111", border: "1px solid rgba(212,175,55,0.3)", borderRadius: 8, fontSize: 11 }}
                formatter={(v) => [`₹${v.toLocaleString("en-IN")}`, "Revenue"]}
                labelStyle={{ color: "#D4AF37" }}
              />
              <Area type="monotone" dataKey="revenue"
                stroke="#D4AF37" strokeWidth={2}
                fill="url(#goldGrad)"
                className="revenue-glow-line"
                dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Room Occupancy Grid ──────────────────────────────────────── */}
      <div className="card rounded-2xl p-4 fade-up" style={{ animationDelay: "0.1s" }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-base">🛏</span>
            <span className="text-white font-semibold text-sm tracking-wide">ROOM OCCUPANCY</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-gray-400"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
              {tower} <ChevronDown size={12} />
            </button>
            <button className="p-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <Maximize2 size={12} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Floor grid */}
        <div className="scroll-x">
          <div style={{ minWidth: 280 }}>
            {/* Column headers */}
            <div className="flex items-center mb-1.5">
              <div style={{ width: 24 }} />
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="flex-1 text-center text-gray-700 font-mono"
                  style={{ fontSize: 9 }}>
                  {String(i+1).padStart(2,"0")}
                </div>
              ))}
            </div>

            {floorNums.map(floorNum => {
              const floorRooms = (floors[floorNum] || []).slice(0, 8);
              while (floorRooms.length < 8) floorRooms.push(null);
              return (
                <div key={floorNum} className="flex items-center mb-1.5">
                  <div className="text-gray-600 font-mono flex-shrink-0 text-right pr-1"
                    style={{ width: 24, fontSize: 9 }}>
                    {String(floorNum).padStart(2,"0")}
                  </div>
                  {floorRooms.map((room, ci) => (
                    <RoomCell
                      key={room ? room.id : `empty-${floorNum}-${ci}`}
                      room={room}
                      onClick={() => room && handleRoomClick(room)}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3">
          {[
            { color: "#22c55e", label: `Occupied (${stats.occupiedRooms > 0 ? Math.round(stats.occupiedRooms/stats.totalRooms*100) : 68}%)` },
            { color: "#D4AF37", label: `Reserved (5%)` },
            { color: "#ef4444", label: `Vacant (${stats.vacantRooms > 0 ? Math.round(stats.vacantRooms/stats.totalRooms*100) : 17}%)` },
            { color: "#555",    label: `Out of Order (10%)` },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ background: color }} />
              <span className="text-gray-500" style={{ fontSize: 10 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Quick Action Grid ────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-2 items-center fade-up" style={{ animationDelay: "0.15s" }}>
        {/* Guest Check-in */}
        <QuickCard
          icon="👥"
          label="GUEST CHECK-IN"
          value={getTodayBookings().filter(b => b.status === "active").length}
          subLabel="Pending"
          subColor="#0070F3"
        />

        {/* AI SCAN Center Button */}
        <button onClick={() => onNavigate("scanner")}
          className="flex flex-col items-center justify-center aspect-square rounded-full transition-all active:scale-90 ai-scan-ring relative"
          style={{
            background: "radial-gradient(circle at center, #001a3a 0%, #000d1a 60%, #000508 100%)",
            border: "2px solid rgba(0,112,243,0.5)",
            boxShadow: "0 0 30px rgba(0,112,243,0.3), 0 0 60px rgba(0,112,243,0.1), inset 0 0 20px rgba(0,112,243,0.1)",
          }}>
          <span className="font-black text-xl text-white z-10 relative" style={{ letterSpacing: "-0.02em" }}>AI</span>
          <span className="font-bold text-xs z-10 relative" style={{ color: "#0070F3", letterSpacing: "0.12em" }}>SCAN</span>
        </button>

        {/* Maintenance */}
        <QuickCard
          icon="🔧"
          label="MAINTENANCE"
          value={5}
          subLabel="Pending"
          subColor="#D4AF37"
        />

        {/* Housekeeping */}
        <QuickCard
          icon="🧹"
          label="HOUSEKEEPING"
          value={stats.cleaningRooms || 8}
          subLabel="Rooms"
          subColor="#0070F3"
        />

        {/* Spacer (center column — below AI button) */}
        <div />

        {/* Reviews */}
        <QuickCard
          icon="⭐"
          label="REVIEWS"
          value="4.8"
          subLabel="Rating"
          subColor="#D4AF37"
        />
      </div>

      {/* ── AI Insights ──────────────────────────────────────────────── */}
      <div className="rounded-2xl p-4 fade-up relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0d0d1a 0%, #080814 100%)", border: "1px solid rgba(0,112,243,0.2)", animationDelay: "0.2s" }}>
        {/* 3D building graphic (CSS) */}
        <div className="absolute right-2 bottom-2 opacity-30 pointer-events-none">
          <div style={{ fontSize: 60 }}>🏢</div>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(0,112,243,0.2)", border: "1px solid rgba(0,112,243,0.3)" }}>
            <Brain size={16} style={{ color: "#0070F3" }} />
          </div>
          <span className="font-bold text-sm tracking-widest text-white uppercase">AI Insights</span>
        </div>

        {insightLoading ? (
          <div className="flex gap-1.5 py-2">
            {[0,1,2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full"
                style={{ background: "#0070F3", animation: `pulse-gold 1.2s ease-in-out ${i*0.2}s infinite` }} />
            ))}
          </div>
        ) : (
          <p className="text-gray-300 text-sm leading-relaxed pr-16">{insight}</p>
        )}

        <button onClick={fetchInsight}
          className="mt-3 px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95"
          style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.35)", color: "#D4AF37" }}>
          View Insights
        </button>
      </div>

      {/* Room Detail Modal */}
      {selectedRoom && (
        <RoomModal room={selectedRoom} onClose={() => setSelRoom(null)}
          user={user} onCheckout={(id) => { checkoutBooking(id); loadData(); setSelRoom(null); }} />
      )}
    </div>
  );

  function handleRoomClick(room) {
    const booking = room.currentBookingId ? getBookingById(room.currentBookingId) : null;
    setSelRoom({ ...room, booking });
  }
}

// ── Room Cell ────────────────────────────────────────────────────────────────
function RoomCell({ room, onClick }) {
  if (!room) {
    return <div className="flex-1 mx-0.5 aspect-square rounded-lg"
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }} />;
  }

  // Map status — for demo some rooms are "reserved" (yellow)
  const st = room.status === "occupied" ? "occupied"
    : room.number % 13 === 0 ? "outoforder"
    : room.number % 7  === 0 ? "reserved"
    : "vacant";

  const iconColor = {
    occupied:    "#22c55e",
    vacant:      "#ef4444",
    reserved:    "#D4AF37",
    outoforder:  "#555",
    cleaning:    "#818cf8",
  }[st];

  return (
    <button onClick={onClick}
      className={`flex-1 mx-0.5 aspect-square rounded-lg flex flex-col items-center justify-center transition-all active:scale-90 room-${st}`}>
      <svg width="10" height="10" viewBox="0 0 20 20" fill={iconColor}>
        <circle cx="10" cy="6" r="4"/>
        <path d="M3 20c0-3.866 3.134-7 7-7s7 3.134 7 7"/>
      </svg>
      <span className="font-mono font-bold mt-0.5" style={{ fontSize: 8, color: iconColor }}>
        {room.number}
      </span>
    </button>
  );
}

// ── Quick Action Card ─────────────────────────────────────────────────────────
function QuickCard({ icon, label, value, subLabel, subColor }) {
  return (
    <div className="card rounded-2xl p-3 flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span className="text-gray-500 font-semibold" style={{ fontSize: 8, letterSpacing: "0.08em" }}>{label}</span>
      </div>
      <span className="font-black text-white text-2xl">{value}</span>
      <span className="font-semibold text-xs" style={{ color: subColor }}>{subLabel}</span>
    </div>
  );
}

// ── Room Modal ────────────────────────────────────────────────────────────────
function RoomModal({ room, onClose, onCheckout, user }) {
  const b = room.booking;
  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70" style={{ backdropFilter: "blur(8px)" }} />
      <div className="relative w-full max-w-lg mx-auto rounded-t-3xl p-5 slide-up"
        style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderBottom: "none" }}
        onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full mx-auto mb-4 bg-white/20" />
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-xl" style={{ color: "#D4AF37" }}>Room {room.number}</h3>
          <StatusPill status={room.status} />
        </div>
        {b ? (
          <div className="space-y-3">
            {[["Guest",b.guestName],["Phone",b.guestPhone||"—"],["ID",`${b.idType} • ${b.idNumber}`],["Check-in",new Date(b.checkInDate).toLocaleDateString("en-IN")],["Nights",b.nights]].map(([l,v]) => (
              <div key={l} className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-gray-500 text-xs">{l}</span>
                <span className="text-white text-sm font-medium">{v}</span>
              </div>
            ))}
            <div className="rounded-xl p-3 mt-2"
              style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.25)" }}>
              <div className="flex items-center gap-1.5 mb-2">
                <Lock size={12} style={{ color: "#D4AF37" }} />
                <span className="text-xs font-bold tracking-widest" style={{ color: "#D4AF37" }}>RATE INTEGRITY BADGE</span>
              </div>
              <div className="flex justify-between"><span className="text-gray-400 text-sm">Locked Rate</span><span className="font-bold" style={{ color: "#D4AF37" }}>₹{b.ratePerNight?.toLocaleString("en-IN")}/night</span></div>
              <div className="flex justify-between mt-1"><span className="text-gray-400 text-sm">Total</span><span className="text-white font-black text-xl">₹{b.totalAmount?.toLocaleString("en-IN")}</span></div>
            </div>
            {user?.role === "owner" && (
              <button onClick={() => onCheckout(b.id)}
                className="w-full py-3 rounded-xl font-semibold text-sm text-red-400 active:scale-95"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}>
                Check-out Karo
              </button>
            )}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4 text-sm">Ye room {room.status === "cleaning" ? "cleaning mein hai" : "khali hai"}</p>
        )}
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    occupied: { bg: "rgba(34,197,94,0.15)",   color: "#22c55e", label: "Bhara"    },
    vacant:   { bg: "rgba(239,68,68,0.15)",   color: "#ef4444", label: "Khali"    },
    cleaning: { bg: "rgba(99,102,241,0.15)",  color: "#818cf8", label: "Cleaning" },
  };
  const s = map[status] || map.vacant;
  return (
    <span className="px-2 py-1 rounded-full text-xs font-semibold"
      style={{ background: s.bg, color: s.color }}>{s.label}</span>
  );
}

function Skeleton() {
  return (
    <div className="h-full px-3 py-2 space-y-3">
      {[80,180,260,120].map((h,i) => (
        <div key={i} className="rounded-2xl animate-pulse"
          style={{ height: h, background: "rgba(255,255,255,0.04)" }} />
      ))}
    </div>
  );
}
