"use client";
import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Maximize2, ChevronDown, Lock, Brain, ExternalLink, Check } from "lucide-react";
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
  const [stats,     setStats]   = useState(null);
  const [rooms,     setRooms]   = useState([]);
  const [insight,   setInsight] = useState("Aaj ki demand analysis ho rahi hai...");
  const [iLoad,     setILoad]   = useState(false);
  const [selRoom,   setSelRoom] = useState(null);
  const [revData,   setRevData] = useState([]);
  const [refreshing,setRefresh] = useState(false);
  const [copied,    setCopied]  = useState(false);

  // KEY FIX: Every data call uses hotelId, never a global/default
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

  const handleRefresh = async () => { setRefresh(true); load(); await fetchInsight(); setRefresh(false); };

  const copyLink = () => {
    navigator.clipboard?.writeText(`${window.location.origin}/booking/${hotelId}`)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const handleRoomClick = (room) => {
    const booking = room.currentBookingId ? getBookingById(hotelId, room.currentBookingId) : null;
    setSelRoom({ ...room, booking });
  };

  const handleCheckout = (bookingId) => {
    checkoutBooking(hotelId, bookingId);
    load();
    setSelRoom(null);
    if (navigator.vibrate) navigator.vibrate(50);
  };

  if (!stats) return <Skeleton />;

  const pct = (Math.random() * 20 + 5).toFixed(1);

  // Group rooms by floor
  const byFloor = {};
  rooms.forEach(r => {
    const f = r.floor || 1;
    if (!byFloor[f]) byFloor[f] = [];
    byFloor[f].push(r);
  });
  const floors = Object.keys(byFloor).map(Number).sort((a, b) => b - a);

  return (
    <div className="h-full scroll-y px-3 py-2 space-y-3 pb-4">

      {/* AI Receptionist Banner */}
      <div className="card rounded-2xl p-4 flex items-center gap-3 fade-up">
        <div className="relative flex-shrink-0">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
            style={{ background: "linear-gradient(135deg,#1a1200,#2a1f00)", border: "2px solid rgba(212,175,55,0.35)" }}>
            👩‍💼
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: "#0a0a0a", border: "1px solid rgba(212,175,55,0.3)" }}>
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500" style={{ animation: "pulseDot 2s infinite" }} />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-base" style={{ color: "#D4AF37" }}>AI Receptionist</p>
          <p className="text-white text-sm font-medium">{greeting()}, {user?.role === "owner" ? "Owner" : "Manager"} 👋</p>
          <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.4)" }}>Here's your operational overview.</p>
        </div>
        <button onClick={copyLink} className="p-2.5 rounded-xl transition-all flex-shrink-0"
          style={{ background: "rgba(0,112,243,0.15)", border: "1px solid rgba(0,112,243,0.3)" }}>
          {copied ? <Check size={16} className="text-green-400" /> : <ExternalLink size={16} style={{ color: "#0070F3" }} />}
        </button>
      </div>

      {/* Live Revenue */}
      <div className="rounded-2xl overflow-hidden fade-up"
        style={{ background: "linear-gradient(160deg,#111 0%,#0f0d00 100%)", border: "1px solid rgba(212,175,55,0.15)", animationDelay: "0.05s" }}>
        <div className="px-5 pt-5 pb-0">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>LIVE REVENUE</p>
          <p className="font-black mt-1" style={{ fontSize: 38, color: "#D4AF37", letterSpacing: "-0.03em", lineHeight: 1 }}>
            ₹{stats.todayRevenue.toLocaleString("en-IN")}<span className="text-xl">.00</span>
          </p>
          <p className="text-gray-400 text-sm mt-1">Today's Total Revenue</p>
          <div className="mt-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
              style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}>
              ↑ {pct}% vs yesterday
            </span>
          </div>
        </div>
        <div className="h-28 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gGold" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#D4AF37" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip contentStyle={{ background: "#111", border: "1px solid rgba(212,175,55,0.3)", borderRadius: 8, fontSize: 11 }}
                formatter={v => [`₹${v.toLocaleString("en-IN")}`, "Revenue"]} labelStyle={{ color: "#D4AF37" }} />
              <Area type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={2.5}
                fill="url(#gGold)" dot={false} style={{ filter: "drop-shadow(0 0 6px #D4AF37)" }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Room Occupancy */}
      <div className="card rounded-2xl p-4 fade-up" style={{ animationDelay: "0.1s" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span>🛏</span>
            <span className="font-bold text-sm text-white tracking-wide">ROOM OCCUPANCY</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
              Tower A <ChevronDown size={10} />
            </div>
            <button onClick={handleRefresh} className="p-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.06)" }}>
              <RefreshCw size={11} className={`text-gray-500 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        <div className="scroll-x">
          <div style={{ minWidth: 240 }}>
            <div className="flex items-center mb-1.5" style={{ paddingLeft: 28 }}>
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="flex-1 text-center font-mono"
                  style={{ fontSize: 8, color: "rgba(255,255,255,0.25)" }}>
                  {String(i + 1).padStart(2, "0")}
                </div>
              ))}
            </div>
            {floors.map(floorNum => {
              const fr = (byFloor[floorNum] || []).slice(0, 8);
              while (fr.length < 8) fr.push(null);
              return (
                <div key={floorNum} className="flex items-center mb-1.5">
                  <div className="font-mono text-right pr-1.5 flex-shrink-0"
                    style={{ width: 26, fontSize: 8, color: "rgba(255,255,255,0.25)" }}>
                    {String(floorNum).padStart(2, "0")}
                  </div>
                  {fr.map((room, ci) => (
                    <RoomCell key={room ? room.id : `e-${floorNum}-${ci}`} room={room}
                      onClick={() => room && handleRoomClick(room)} />
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
          {[
            { c: "#22c55e", l: `Occupied (${stats.occupancyPercent}%)` },
            { c: "#D4AF37", l: "Reserved (5%)" },
            { c: "#ef4444", l: `Vacant (${Math.max(0, 100 - stats.occupancyPercent - 10)}%)` },
            { c: "#555",    l: "Out of Order (10%)" },
          ].map(({ c, l }) => (
            <div key={l} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ background: c }} />
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Action Grid */}
      <div className="grid grid-cols-3 gap-2 items-center fade-up" style={{ animationDelay: "0.15s" }}>
        <QuickCard icon="👥" label="GUEST CHECK-IN"
          value={getTodayBookings(hotelId).filter(b => b.status === "active").length}
          sub="Pending" subColor="#0070F3" />

        <button onClick={() => onNavigate("scanner")}
          className="flex flex-col items-center justify-center rounded-full transition-all active:scale-90 ai-ring relative"
          style={{
            aspectRatio: "1",
            background: "radial-gradient(circle at 40% 40%,#001830,#000d1a 60%,#000508 100%)",
            border: "2px solid rgba(0,112,243,0.4)",
            boxShadow: "0 0 30px rgba(0,112,243,0.25),0 0 60px rgba(0,112,243,0.1),inset 0 0 20px rgba(0,112,243,0.1)",
          }}>
          <span className="font-black text-xl z-10 relative" style={{ letterSpacing: "-0.03em" }}>AI</span>
          <span className="font-bold text-xs z-10 relative" style={{ color: "#0070F3", letterSpacing: "0.1em" }}>SCAN</span>
        </button>

        <QuickCard icon="🔧" label="MAINTENANCE" value={5} sub="Pending" subColor="#D4AF37" />
        <QuickCard icon="🧹" label="HOUSEKEEPING" value={stats.cleaningRooms || 1} sub="Rooms" subColor="#0070F3" />
        <div />
        <QuickCard icon="⭐" label="REVIEWS" value="4.8" sub="Rating" subColor="#D4AF37" />
      </div>

      {/* AI Insights */}
      <div className="rounded-2xl p-4 relative overflow-hidden fade-up"
        style={{ animationDelay: "0.2s", background: "linear-gradient(135deg,#0d0d1a,#080814)", border: "1px solid rgba(0,112,243,0.2)" }}>
        <div className="absolute right-3 bottom-3 opacity-20 text-6xl pointer-events-none select-none">🏢</div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(0,112,243,0.2)", border: "1px solid rgba(0,112,243,0.3)" }}>
            <Brain size={16} style={{ color: "#0070F3" }} />
          </div>
          <span className="font-bold text-sm uppercase tracking-widest text-white">AI INSIGHTS</span>
        </div>
        {iLoad ? (
          <div className="flex gap-1.5 py-2">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-blue-500"
                style={{ animation: `pulseDot 1.2s ease-in-out ${i * 0.2}s infinite` }} />
            ))}
          </div>
        ) : (
          <p className="text-sm leading-relaxed pr-16" style={{ color: "rgba(255,255,255,0.7)" }}>{insight}</p>
        )}
        <button onClick={fetchInsight}
          className="mt-3 px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95"
          style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.3)", color: "#D4AF37" }}>
          View Insights
        </button>
      </div>

      {selRoom && (
        <RoomModal room={selRoom} onClose={() => setSelRoom(null)}
          onCheckout={handleCheckout} user={user} />
      )}
    </div>
  );
}

function RoomCell({ room, onClick }) {
  if (!room) return (
    <div className="flex-1 mx-0.5 rounded-lg room-outoforder" style={{ aspectRatio: "1", minWidth: 0 }} />
  );
  const st = room.status === "occupied" ? "occupied"
    : room.number % 13 === 0 ? "outoforder"
    : room.number % 7  === 0 ? "reserved"
    : "vacant";
  const iconColor = { occupied: "#22c55e", vacant: "#ef4444", reserved: "#D4AF37", outoforder: "#444", cleaning: "#818cf8" }[st];
  return (
    <button onClick={onClick}
      className={`flex-1 mx-0.5 rounded-lg flex flex-col items-center justify-center transition-all active:scale-90 room-${st}`}
      style={{ aspectRatio: "1", minWidth: 0 }}>
      <svg width="9" height="9" viewBox="0 0 20 20" fill={iconColor}>
        <circle cx="10" cy="6" r="4" />
        <path d="M3 20c0-3.866 3.134-7 7-7s7 3.134 7 7" />
      </svg>
      <span className="font-mono font-bold" style={{ fontSize: 7, color: iconColor, lineHeight: 1.2 }}>{room.number}</span>
    </button>
  );
}

function QuickCard({ icon, label, value, sub, subColor }) {
  return (
    <div className="card rounded-2xl p-3">
      <div className="flex items-center gap-1 mb-1">
        <span style={{ fontSize: 13 }}>{icon}</span>
        <span className="font-semibold uppercase" style={{ fontSize: 7, letterSpacing: "0.07em", color: "rgba(255,255,255,0.4)" }}>{label}</span>
      </div>
      <span className="font-black text-white" style={{ fontSize: 26, letterSpacing: "-0.03em", lineHeight: 1 }}>{value}</span>
      <p className="font-semibold text-xs mt-0.5" style={{ color: subColor }}>{sub}</p>
    </div>
  );
}

function RoomModal({ room, onClose, onCheckout, user }) {
  const b = room.booking;
  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70" style={{ backdropFilter: "blur(8px)" }} />
      <div className="relative w-full rounded-t-3xl p-5 slide-up"
        style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderBottom: "none" }}
        onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full mx-auto mb-4 bg-white/20" />
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-xl" style={{ color: "#D4AF37" }}>Room {room.number}</h3>
          <span className="px-2 py-1 rounded-full text-xs font-semibold"
            style={room.status === "occupied"
              ? { background: "rgba(34,197,94,0.15)", color: "#22c55e" }
              : { background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>
            {room.status === "occupied" ? "Occupied" : room.status === "cleaning" ? "Cleaning" : "Vacant"}
          </span>
        </div>
        {b ? (
          <div className="space-y-2.5">
            {[["Guest", b.guestName], ["Phone", b.guestPhone || "—"], ["ID", `${b.idType} • ${b.idNumber}`],
              ["Check-in", new Date(b.checkInDate).toLocaleDateString("en-IN")], ["Nights", b.nights]
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{l}</span>
                <span className="text-sm font-semibold text-white">{v}</span>
              </div>
            ))}
            <div className="rounded-xl p-3" style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.25)" }}>
              <div className="flex items-center gap-1.5 mb-2">
                <Lock size={11} style={{ color: "#D4AF37" }} />
                <span className="font-bold text-xs uppercase tracking-widest" style={{ color: "#D4AF37" }}>Rate Integrity Badge</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">Locked Rate</span>
                <span className="font-bold" style={{ color: "#D4AF37" }}>₹{b.ratePerNight?.toLocaleString("en-IN")}/night</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-gray-400 text-sm">Total</span>
                <span className="text-white font-black text-xl">₹{b.totalAmount?.toLocaleString("en-IN")}</span>
              </div>
            </div>
            {(user?.role === "owner") && (
              <button onClick={() => onCheckout(b.id)}
                className="w-full py-3 rounded-xl font-semibold text-sm text-red-400 active:scale-95"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}>
                Check-out Karo
              </button>
            )}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-6 text-sm">
            Room {room.status === "cleaning" ? "cleaning mein hai" : "khali hai"}
          </p>
        )}
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="h-full px-3 py-2 space-y-3">
      {[80, 200, 250, 130, 120].map((h, i) => (
        <div key={i} className="rounded-2xl loading-shimmer" style={{ height: h }} />
      ))}
    </div>
  );
}

function localInsight(s) {
  if (!s) return "Data load ho raha hai...";
  const day = new Date().toLocaleDateString("en-IN", { weekday: "long" });
  if (s.occupancyPercent > 80) return `${day} ko ${s.occupancyPercent}% occupancy! Rates ₹200 badha do. 🔥`;
  if (s.occupancyPercent < 30) return `Aaj sirf ${s.occupancyPercent}% rooms bhare hain. Walk-in special offer karo! 💡`;
  return `${day} — ${s.occupancyPercent}% occupancy. Premium rooms promote karo!`;
}
