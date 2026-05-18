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
  const [stats,      setStats]    = useState(null);
  const [rooms,      setRooms]    = useState([]);
  const [insight,    setInsight]  = useState("Aaj ki demand analysis ho rahi hai...");
  const [iLoad,      setILoad]    = useState(false);
  const [selRoom,    setSelRoom]  = useState(null);
  const [revData,    setRevData]  = useState([]);
  const [refreshing, setRefresh]  = useState(false);
  const [copied,     setCopied]   = useState(false);

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

  // ── FIX: await checkoutBooking (now async) ──
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

  const roomColor = (r) => {
    if (r.status === "occupied")  return { bg:"rgba(139,0,0,0.7)",    border:"rgba(220,38,38,0.5)",   text:"#fca5a5" };
    if (r.status === "reserved")  return { bg:"rgba(120,83,0,0.7)",   border:"rgba(212,175,55,0.5)",  text:"#fcd34d" };
    if (r.status === "cleaning")  return { bg:"rgba(30,58,138,0.7)",  border:"rgba(59,130,246,0.5)",  text:"#93c5fd" };
    if (r.status === "out_of_order") return { bg:"rgba(17,17,17,0.9)",border:"rgba(75,85,99,0.4)",    text:"#6b7280" };
    return { bg:"rgba(6,78,59,0.5)", border:"rgba(16,185,129,0.3)", text:"#6ee7b7" };
  };

  const Tip = ({ active, payload }) => active && payload?.length ? (
    <div className="card px-2 py-1.5 rounded-lg text-xs">
      <p style={{ color:"#D4AF37" }}>₹{payload[0].value.toLocaleString("en-IN")}</p>
    </div>
  ) : null;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Scrollable content */}
      <div className="flex-1 scroll-y px-3 py-2 space-y-3">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-black text-lg text-white" style={{ letterSpacing:"-0.02em" }}>
              {greeting()}, {user?.role === "owner" ? "Owner" : "Manager"} 👋
            </h2>
            <p className="text-xs" style={{ color:"rgba(255,255,255,0.35)" }}>
              {hotel?.name} · {new Date().toLocaleDateString("en-IN",{day:"numeric",month:"short"})}
            </p>
          </div>
          <button onClick={handleRefresh} disabled={refreshing}
            className="w-9 h-9 card rounded-xl flex items-center justify-center">
            <RefreshCw size={15} style={{ color:"#D4AF37" }} className={refreshing ? "animate-spin" : ""}/>
          </button>
        </div>

        {/* Hotel link copy */}
        <button onClick={copyLink}
          className="w-full card rounded-2xl px-4 py-3 flex items-center justify-between"
          style={{ border:"1px solid rgba(212,175,55,0.15)" }}>
          <div className="flex items-center gap-2">
            <ExternalLink size={13} style={{ color:"#D4AF37" }}/>
            <span className="text-xs font-mono truncate max-w-[200px]"
              style={{ color:"rgba(255,255,255,0.3)" }}>
              /booking/{hotelId}
            </span>
          </div>
          <span className="text-xs font-semibold flex items-center gap-1"
            style={{ color:"#D4AF37" }}>
            {copied ? <><Check size={11}/>Copied!</> : "Share Link"}
          </span>
        </button>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label:"Occupied",  value:`${stats.occupiedRooms}/${stats.totalRooms}`, sub:`${stats.occupancyPercent}%`, color:"#ef4444" },
            { label:"Revenue",   value:`₹${(stats.todayRevenue/1000).toFixed(1)}K`,   sub:"Aaj",                       color:"#D4AF37" },
            { label:"Check-ins", value: stats.todayCheckIns,                          sub:"Aaj",                       color:"#22c55e" },
          ].map(s => (
            <div key={s.label} className="card rounded-2xl p-3 text-center">
              <p className="font-black text-xl text-white" style={{ letterSpacing:"-0.02em" }}>{s.value}</p>
              <p className="text-xs font-semibold" style={{ color:s.color }}>{s.sub}</p>
              <p className="text-gray-700 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Revenue sparkline */}
        <div className="card rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-500 text-xs uppercase tracking-widest">7 Din Ka Revenue</p>
            <p className="text-xs font-bold text-green-400">↑ {pct}%</p>
          </div>
          <ResponsiveContainer width="100%" height={60}>
            <AreaChart data={revData} margin={{ top:0, right:0, left:0, bottom:0 }}>
              <defs>
                <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.3}/>
                  <stop offset="100%" stopColor="#D4AF37" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Tooltip content={<Tip/>} cursor={false}/>
              <Area type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={2} fill="url(#rg)" dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* AI Insight */}
        <div className="card rounded-2xl p-4" style={{ border:"1px solid rgba(0,112,243,0.2)", background:"rgba(0,112,243,0.05)" }}>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background:"rgba(0,112,243,0.15)" }}>
              <Brain size={15} style={{ color:"#60a5fa" }}/>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold mb-1" style={{ color:"#60a5fa" }}>AI INSIGHT</p>
              {iLoad
                ? <div className="flex gap-1">{[0,1,2].map(i=><div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{animationDelay:`${i*0.15}s`}}/>)}</div>
                : <p className="text-xs text-gray-400 leading-relaxed">{insight}</p>
              }
            </div>
          </div>
        </div>

        {/* Room Grid */}
        <div className="card rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-500 text-xs uppercase tracking-widest">Room Occupancy</p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                {[
                  { c:"#22c55e", l:"Vacant" }, { c:"#ef4444", l:"Occupied" },
                  { c:"#D4AF37", l:"Reserved" }, { c:"#60a5fa", l:"Cleaning" },
                ].map(x => (
                  <div key={x.l} className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ background:x.c }}/>
                    <span className="text-gray-600" style={{ fontSize:9 }}>{x.l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-1">
            {floors.map(fl => (
              <div key={fl} className="flex items-center gap-1">
                <span className="text-gray-700 w-5 text-right flex-shrink-0" style={{ fontSize:9 }}>
                  {String(fl).padStart(2,"0")}
                </span>
                <div className="flex gap-1 flex-1 flex-wrap">
                  {byFloor[fl].map(room => {
                    const c = roomColor(room);
                    return (
                      <button key={room.id} onClick={() => handleRoomClick(room)}
                        className="flex-1 min-w-[28px] max-w-[40px] aspect-square rounded-lg flex items-center justify-center transition-all active:scale-90"
                        style={{ background:c.bg, border:`1px solid ${c.border}` }}>
                        <span style={{ fontSize:8, color:c.text, fontWeight:700 }}>{room.number}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Today check-ins */}
        <div className="card rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <p className="text-gray-500 text-xs uppercase tracking-widest">Aaj Ke Check-ins</p>
            <span className="text-xs" style={{ color:"#D4AF37" }}>{getTodayBookings(hotelId).filter(b=>b.status==="active").length} active</span>
          </div>
          {getTodayBookings(hotelId).length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-gray-700 text-sm">Aaj koi check-in nahi hua</p>
            </div>
          ) : getTodayBookings(hotelId).slice(0, 5).map(b => (
            <div key={b.id} className="px-4 py-3 flex items-center justify-between border-b border-white/5 last:border-0">
              <div>
                <p className="text-white text-sm font-semibold">{b.guestName}</p>
                <p className="text-gray-600 text-xs">Room {b.roomId} · {b.nights} raat · {b.paymentMode}</p>
              </div>
              <p className="font-bold text-sm" style={{ color:"#D4AF37" }}>₹{Number(b.totalAmount||0).toLocaleString("en-IN")}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Room detail modal */}
      {selRoom && (
        <div className="absolute inset-0 z-50 flex items-end" style={{ background:"rgba(0,0,0,0.7)" }}
          onClick={() => setSelRoom(null)}>
          <div className="w-full card rounded-t-3xl p-6" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-4"/>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg"
                style={(() => { const c = roomColor(selRoom); return { background:c.bg, border:`1px solid ${c.border}`, color:c.text }; })()}>
                {selRoom.number}
              </div>
              <div>
                <p className="font-black text-white text-lg">Room {selRoom.number}</p>
                <p className="text-gray-500 text-sm capitalize">{selRoom.type} · Floor {selRoom.floor}</p>
              </div>
            </div>
            {selRoom.booking ? (
              <div className="space-y-2">
                <div className="card rounded-2xl p-4 space-y-2">
                  <p className="text-white font-bold">{selRoom.booking.guestName}</p>
                  <p className="text-gray-500 text-sm">{selRoom.booking.guestPhone}</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{selRoom.booking.nights} raatein</span>
                    <span style={{ color:"#D4AF37" }}>₹{Number(selRoom.booking.totalAmount||0).toLocaleString("en-IN")}</span>
                  </div>
                </div>
                <button onClick={() => handleCheckout(selRoom.booking.id)}
                  className="w-full py-3.5 rounded-2xl font-bold text-sm"
                  style={{ background:"linear-gradient(135deg,#b8960c,#D4AF37,#F5C842)", color:"#000" }}>
                  ✓ Check-out Karo
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="card rounded-2xl p-4 text-center">
                  <p className="text-gray-500 text-sm capitalize">{selRoom.status}</p>
                  <p className="text-gray-700 text-xs mt-1">Base Rate: ₹{selRoom.baseRate}/raat</p>
                </div>
                {selRoom.status === "vacant" && (
                  <button onClick={() => { setSelRoom(null); onNewBooking && onNewBooking(selRoom); }}
                    className="w-full py-3.5 rounded-2xl font-bold text-sm"
                    style={{ background:"linear-gradient(135deg,#b8960c,#D4AF37,#F5C842)", color:"#000" }}>
                    + Nayi Booking Karo
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
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
    <div className="h-full px-3 py-4 space-y-3 animate-pulse">
      {[80, 60, 120, 60].map((h, i) => (
        <div key={i} className="card rounded-2xl" style={{ height: h, background:"rgba(255,255,255,0.03)" }}/>
      ))}
    </div>
  );
}
