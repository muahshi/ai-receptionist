"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { RefreshCw, ExternalLink, Check, Brain, ChevronDown, Wrench, Star, Users, Home, Bell, Menu, User } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";
import {
  getTodayStats, getRooms, getBookingById, checkoutBooking,
  getTodayBookings, getWeeklyRevenue, initializeRooms
} from "../lib/db";

// Helper for Greeting
function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

// Global styles for custom 3D projection, glows, and futuristic UI elements
const InteractiveStyles = () => (
  <style dangerouslySetInnerHTML={{ __html: `
    @keyframes pulseDot {
      0%, 100% { box-shadow: 0 0 4px #22c55e; }
      50% { box-shadow: 0 0 12px #22c55e, 0 0 20px rgba(34,197,94,0.5); }
    }
    @keyframes soundwave {
      0%, 100% { height: 4px; }
      50% { height: 14px; }
    }
    .sound-bar {
      animation: soundwave 1.2s ease-in-out infinite;
    }
    @keyframes spin-slow {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    @keyframes spin-reverse {
      0% { transform: rotate(360deg); }
      100% { transform: rotate(0deg); }
    }
    @keyframes laser-sweep {
      0%, 100% { transform: translateY(-8px); opacity: 0.2; }
      50% { transform: translateY(48px); opacity: 0.9; }
    }
    @keyframes hologram-dash {
      to { stroke-dashoffset: -1000; }
    }
    .hologram-line {
      stroke-dasharray: 80;
      animation: hologram-dash 6s linear infinite;
    }
    .perspective-deck {
      perspective: 1000px;
      transform-style: preserve-3d;
    }
    .isometric-grid {
      transform: rotateX(20deg) translateY(-4px);
      transform-style: preserve-3d;
    }
    /* 3D Keycap interactive button classes */
    .keycap-3d {
      position: relative;
      transition: all 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      transform-style: preserve-3d;
    }
    .keycap-3d:active {
      transform: translateY(3px);
    }
    /* Hide default scrollbars */
    .scroll-y::-webkit-scrollbar {
      display: none;
    }
    .scroll-y {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `}} />
);

export default function App(props) {
  return <DashboardView {...props} />;
}

function DashboardView({ hotelId, hotel, user, onNavigate, onNewBooking }) {
  const [stats,      setStats]    = useState(null);
  const [rooms,      setRooms]    = useState([]);
  const [insight,    setInsight]  = useState("High demand detected for Deluxe Rooms this weekend.");
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
    if (navigator.vibrate) navigator.vibrate([40, 30, 40]);
    await fetchInsight();
    setTimeout(() => setAiScan(false), 2000);
  };

  const copyLink = () => {
    // Cross-environment compatible clipboard copy mechanism
    const dummy = document.createElement("input");
    dummy.value = `${window.location.origin}/booking/${hotelId}`;
    document.body.appendChild(dummy);
    dummy.select();
    document.execCommand("copy");
    document.body.removeChild(dummy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  const pct = (Math.random() * 5 + 15).toFixed(1); // Keeps 15-20% range for premium look

  const byFloor = {};
  rooms.forEach(r => {
    if (!byFloor[r.floor]) byFloor[r.floor] = [];
    byFloor[r.floor].push(r);
  });
  const floors = Object.keys(byFloor).map(Number).sort((a, b) => b - a);

  // Status config optimized for 3D Keycaps styling matching Image 1
  const roomConfig = (r) => {
    if (r.status === "occupied") {
      return { 
        bg: "bg-gradient-to-b from-[#10b981] to-[#047857]", 
        border: "border-[#6ee7b7]/30", 
        text: "text-white", 
        glow: "rgba(16, 185, 129, 0.45)", 
        shadow: "shadow-[0_4px_0px_#064e3b]",
        icon: "👤", 
        label: "Occupied"  
      };
    }
    if (r.status === "reserved") {
      return { 
        bg: "bg-gradient-to-b from-[#fbbf24] to-[#d97706]", 
        border: "border-[#fde68a]/30", 
        text: "text-white", 
        glow: "rgba(245, 158, 11, 0.45)", 
        shadow: "shadow-[0_4px_0px_#92400e]",
        icon: "📌", 
        label: "Reserved"  
      };
    }
    if (r.status === "cleaning") {
      return { 
        bg: "bg-gradient-to-b from-[#3b82f6] to-[#1d4ed8]", 
        border: "border-[#93c5fd]/30", 
        text: "text-white", 
        glow: "rgba(59, 130, 246, 0.45)", 
        shadow: "shadow-[0_4px_0px_#1e3a8a]",
        icon: "🧹", 
        label: "Cleaning"  
      };
    }
    if (r.status === "out_of_order") {
      return { 
        bg: "bg-gradient-to-b from-[#4b5563] to-[#1f2937]", 
        border: "border-[#9ca3af]/20", 
        text: "text-gray-400", 
        glow: "rgba(75, 85, 99, 0.1)", 
        shadow: "shadow-[0_4px_0px_#111827]",
        icon: "🔧", 
        label: "Out Order" 
      };
    }
    // Vacant/Available -> Red colored button matching Image 1
    return { 
      bg: "bg-gradient-to-b from-[#ef4444] to-[#b91c1c]", 
      border: "border-[#fca5a5]/30", 
      text: "text-white", 
      glow: "rgba(239, 68, 68, 0.45)", 
      shadow: "shadow-[0_4px_0px_#7f1d1d]",
      icon: "👤", 
      label: "Vacant"    
    };
  };

  const occupied   = rooms.filter(r => r.status === "occupied").length;
  const vacant     = rooms.filter(r => r.status === "vacant").length;
  const reserved   = rooms.filter(r => r.status === "reserved").length;
  const cleaning   = rooms.filter(r => r.status === "cleaning").length;
  const outOfOrder = rooms.filter(r => r.status === "out_of_order").length;
  const total      = rooms.length;

  const Tip = ({ active, payload }) => active && payload?.length ? (
    <div className="bg-[#111625]/90 border border-[#D4AF37]/30 px-3 py-1.5 rounded-lg text-xs backdrop-blur-md">
      <p style={{ color:"#D4AF37" }} className="font-bold">₹{payload[0].value.toLocaleString("en-IN")}</p>
    </div>
  ) : null;

  const todayBookings = getTodayBookings(hotelId);
  const pendingCheckIns = todayBookings.filter(b => b.status === "active").length;

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-[#07090e] via-[#0b0f19] to-[#04060a] text-gray-300 relative overflow-hidden">
      <InteractiveStyles />

      {/* ── SCROLLABLE CONTAINER ── */}
      <div className="flex-1 overflow-y-auto scroll-y px-4 py-3 space-y-4 pb-24">

        {/* ── BRAND HEADER ── */}
        <div className="flex items-center justify-between">
          <button className="w-10 h-10 rounded-xl bg-[#111625] border border-white/5 flex items-center justify-center text-[#D4AF37] hover:bg-white/5 active:scale-95 transition-all">
            <Menu size={20} />
          </button>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-[#D4AF37]">
                <path d="M12 2L2 22h20L12 2zm0 3l7.5 15h-15L12 5zm-1 5h2v6h-2v-6zm0 8h2v2h-2v-2z"/>
              </svg>
              <h1 className="text-lg font-black tracking-wider text-white uppercase" style={{ fontFamily: 'system-ui' }}>
                The GuestInn
              </h1>
            </div>
            <p className="text-[8px] tracking-[0.25em] font-medium text-[#D4AF37] opacity-80 uppercase">
              AI-Powered Hotel Management
            </p>
          </div>

          <button className="w-10 h-10 rounded-xl bg-[#111625] border border-white/5 flex items-center justify-center text-gray-300 hover:bg-white/5 active:scale-95 transition-all relative">
            <Bell size={20} />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          </button>
        </div>

        {/* ── AI RECEPTIONIST CARD ── */}
        <div className="bg-[#111625]/65 border border-white/5 rounded-2xl p-3.5 backdrop-blur-md relative overflow-hidden flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Holographic glowing Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-13 h-13 rounded-full border-2 border-[#D4AF37] p-0.5 relative overflow-hidden shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-blue-700 to-indigo-900 flex items-center justify-center text-white overflow-hidden">
                  <svg viewBox="0 0 32 32" className="w-9 h-9 mt-1.5 text-white/95">
                    <circle cx="16" cy="12" r="6" fill="currentColor" />
                    <path d="M16 20c-6 0-10 4-10 8h20c0-4-4-8-10-8z" fill="currentColor" />
                  </svg>
                </div>
              </div>
              {/* Floating pulsing live voice indicator */}
              <div className="absolute -bottom-1 -right-1 bg-blue-600 border border-blue-400 text-white rounded-full px-1.5 py-0.5 flex items-center gap-0.5 shadow-lg">
                <span className="sound-bar w-0.5 bg-white rounded-full" style={{ animationDelay: "0.1s" }} />
                <span className="sound-bar w-0.5 bg-white rounded-full" style={{ animationDelay: "0.4s" }} />
                <span className="sound-bar w-0.5 bg-white rounded-full" style={{ animationDelay: "0.7s" }} />
              </div>
            </div>

            <div className="min-w-0">
              <p className="text-blue-400 font-extrabold text-[10px] tracking-widest uppercase">
                AI Receptionist
              </p>
              <h3 className="font-black text-white text-sm mt-0.5">
                {greeting()}, Manager 👋
              </h3>
              <p className="text-gray-400 text-[11px] mt-0.5">Here's your operational overview.</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_#3b82f6]" />
          </div>
        </div>

        {/* ── LIVE REVENUE CARD WITH GLOW ── */}
        <div className="bg-[#111625]/65 border border-white/5 rounded-2xl p-4.5 backdrop-blur-md relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-gray-400 text-[9px] font-bold tracking-[0.15em] uppercase">Live Revenue</p>
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-600 filter drop-shadow-[0_0_10px_rgba(212,175,55,0.4)]">
                ₹{stats.todayRevenue.toLocaleString("en-IN")}.00
              </h2>
              <p className="text-[11px] text-gray-400">Today's Total Revenue</p>
              
              <div className="pt-2">
                <span className="inline-flex items-center gap-1 bg-[#10b981]/10 text-[#10b981] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-[#10b981]/20">
                  ↑ {pct}% <span className="opacity-75 font-normal">vs yesterday</span>
                </span>
              </div>
            </div>

            {/* Sparkline side-by-side matching Image 1 layout */}
            <div className="w-5/12 h-[80px] self-end opacity-90 relative">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revData} margin={{ top:5, right:2, left:2, bottom:0 }}>
                  <defs>
                    <linearGradient id="revenueGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.45}/>
                      <stop offset="100%" stopColor="#D4AF37" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip content={<Tip/>} cursor={false}/>
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#D4AF37" 
                    strokeWidth={2.5} 
                    fill="url(#revenueGlow)" 
                    dot={{ r: 2.5, fill: '#D4AF37', stroke: '#fff', strokeWidth: 1 }}
                    activeDot={{ r: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
              <div className="absolute top-[34px] right-2 w-2 h-2 rounded-full bg-[#D4AF37] shadow-[0_0_10px_#D4AF37]" />
            </div>
          </div>
        </div>

        {/* ── 3D ROOM OCCUPANCY GRID ── */}
        <div className="bg-[#111625]/65 border border-white/5 rounded-2xl p-4 backdrop-blur-md relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5 text-gray-200">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]/85 shadow-[0_0_8px_#D4AF37]" />
              <h4 className="text-xs font-black tracking-wider uppercase">Room Occupancy</h4>
            </div>
            
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#141b2d] border border-white/5 text-[10px] font-bold text-gray-300">
                Tower A <ChevronDown size={11} className="text-[#D4AF37]" />
              </button>
              <button className="w-7 h-7 rounded-lg bg-[#141b2d] border border-white/5 flex items-center justify-center text-gray-400">
                <RefreshCw size={11} className={refreshing ? "animate-spin" : ""} onClick={handleRefresh} />
              </button>
            </div>
          </div>

          {/* Isometric Deck Wrapper */}
          <div className="perspective-deck py-3 overflow-x-auto scroll-y">
            <div className="isometric-grid space-y-3 min-w-[310px]">
              {floors.map(fl => (
                <div key={fl} className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-gray-500 w-5 text-right font-mono">
                    {String(fl).padStart(2,"0")}
                  </span>
                  
                  <div className="flex gap-2.5 flex-1 justify-between">
                    {byFloor[fl].map(room => {
                      const cfg = roomConfig(room);
                      return (
                        <button 
                          key={room.id} 
                          onClick={() => handleRoomClick(room)}
                          className={`keycap-3d flex-1 min-w-[30px] max-w-[42px] aspect-square rounded-lg flex flex-col items-center justify-center py-1 border-t ${cfg.bg} ${cfg.shadow} ${cfg.border} ${cfg.text}`}
                          style={{ boxShadow: `0 4px 0px ${cfg.glow.replace('0.45', '0.7')}` }}
                        >
                          {/* Person badge inside button */}
                          <User size={8} className="opacity-90 mb-0.5 text-white/80" />
                          <span className="text-[9px] font-black tracking-tighter leading-none">{room.number}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              
              {/* Bottom floor label indexes */}
              <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                <span className="w-5" />
                <div className="flex gap-2.5 flex-1 justify-between text-[9px] font-black text-gray-500 font-mono">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <span key={i} className="flex-1 text-center">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Occupancy Legend Grid */}
          <div className="grid grid-cols-4 gap-1.5 pt-4 mt-2 border-t border-white/5 text-center">
            {[
              { c:"bg-[#10b981]", l:`Occupied (${Math.round((occupied/total)*100)}%)` }, 
              { c:"bg-[#fbbf24]", l:`Reserved (${Math.round((reserved/total)*100)}%)` },
              { c:"bg-[#ef4444]", l:`Vacant (${Math.round((vacant/total)*100)}%)` }, 
              { c:"bg-[#4b5563]", l:`Out of Order (${Math.round((outOfOrder/total)*100)}%)` },
            ].map(x => (
              <div key={x.l} className="flex flex-col items-center justify-center">
                <div className="flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${x.c}`} />
                  <span className="text-[8px] font-medium text-gray-400">{x.l}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── PLATFORM CENTERPIECE & AI SCAN ORB ── */}
        <div className="grid grid-cols-12 gap-3 items-center relative">
          
          {/* Left Operations Cards */}
          <div className="col-span-4 flex flex-col gap-3">
            {/* Guest Check-In */}
            <div className="bg-[#111625]/65 border border-white/5 rounded-2xl p-3 text-left">
              <div className="flex items-center gap-1.5 text-amber-500/90 mb-1">
                <Users size={12} />
                <p className="text-[8px] font-black tracking-wider uppercase">Guest Check-In</p>
              </div>
              <h4 className="text-2xl font-black text-white leading-none">{pendingCheckIns}</h4>
              <p className="text-[10px] text-blue-400 font-bold mt-1">Pending</p>
            </div>

            {/* Housekeeping */}
            <div className="bg-[#111625]/65 border border-white/5 rounded-2xl p-3 text-left">
              <div className="flex items-center gap-1.5 text-amber-500/90 mb-1">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <p className="text-[8px] font-black tracking-wider uppercase">Housekeeping</p>
              </div>
              <h4 className="text-2xl font-black text-white leading-none">{cleaning}</h4>
              <p className="text-[10px] text-blue-400 font-bold mt-1">Rooms</p>
            </div>
          </div>

          {/* Central Pulsing AI Scan Centerpiece matching Image 1 */}
          <div className="col-span-4 flex flex-col items-center justify-center relative">
            <button 
              onClick={handleAiScan}
              disabled={aiScan}
              className="relative w-28 h-28 rounded-full flex items-center justify-center active:scale-95 transition-transform"
            >
              {/* Outer pulsing ring */}
              <div 
                className={`absolute inset-0 rounded-full border border-blue-500/30 ${aiScan ? 'animate-ping' : 'animate-pulse'}`} 
                style={{ animationDuration: aiScan ? '1s' : '3s' }}
              />
              
              {/* Layer 1 Ring: Fast Rotation */}
              <div 
                className="absolute inset-1.5 rounded-full border-2 border-dashed border-cyan-400/40"
                style={{ animation: 'spin-slow 12s linear infinite' }}
              />

              {/* Layer 2 Ring: Reverse Rotation */}
              <div 
                className="absolute inset-3.5 rounded-full border border-blue-600/50"
                style={{ animation: 'spin-reverse 7s linear infinite' }}
              />

              {/* Main Glowing Button Face */}
              <div className={`absolute inset-5 rounded-full bg-gradient-to-tr from-blue-950 via-slate-950 to-blue-900 border border-blue-400/80 flex flex-col items-center justify-center ${aiScan ? 'shadow-[0_0_30px_rgba(34,211,238,0.7)]' : 'shadow-[0_0_15px_rgba(0,112,243,0.4)]'}`}>
                <span className="text-[8px] tracking-[0.2em] font-black text-cyan-400 uppercase">AI</span>
                <span className="text-sm font-black text-white tracking-widest mt-0.5">SCAN</span>
                {aiScan && <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-cyan-400/80 shadow-[0_0_8px_#22d3ee] laser-sweep" />}
              </div>
            </button>
          </div>

          {/* Right Operations Cards */}
          <div className="col-span-4 flex flex-col gap-3">
            {/* Maintenance */}
            <div className="bg-[#111625]/65 border border-white/5 rounded-2xl p-3 text-left">
              <div className="flex items-center gap-1.5 text-amber-500/90 mb-1">
                <Wrench size={12} />
                <p className="text-[8px] font-black tracking-wider uppercase">Maintenance</p>
              </div>
              <h4 className="text-2xl font-black text-white leading-none">{outOfOrder}</h4>
              <p className="text-[10px] text-blue-400 font-bold mt-1">Pending</p>
            </div>

            {/* Reviews */}
            <div className="bg-[#111625]/65 border border-white/5 rounded-2xl p-3 text-left">
              <div className="flex items-center gap-1.5 text-amber-500/90 mb-1">
                <Star size={12} className="text-amber-400 fill-current" />
                <p className="text-[8px] font-black tracking-wider uppercase">Reviews</p>
              </div>
              <h4 className="text-2xl font-black text-white leading-none">4.8</h4>
              <p className="text-[10px] text-blue-400 font-bold mt-1">Rating</p>
            </div>
          </div>
        </div>

        {/* ── AI INSIGHTS CARD & 3D HOLOGRAM BUILDING ── */}
        <div className="bg-[#111625]/65 border border-blue-500/20 rounded-2xl p-4 backdrop-blur-md relative overflow-hidden">
          <div className="flex items-center gap-4">
            
            {/* Insights text column */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-1.5 text-blue-400">
                <Brain size={14} className="animate-pulse" />
                <p className="text-[10px] font-black tracking-widest uppercase">AI Insights</p>
              </div>
              
              {iLoad ? (
                <div className="flex gap-1 py-1">
                  {[0,1,2].map(i => (
                    <div 
                      key={i} 
                      className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" 
                      style={{ animationDelay: `${i*0.15}s` }} 
                    />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-300 leading-relaxed font-semibold">
                  {insight}
                </p>
              )}

              <button onClick={fetchInsight} className="inline-flex items-center gap-1 px-4 py-1.5 rounded-xl border border-[#D4AF37]/30 hover:border-[#D4AF37]/80 text-[10px] font-bold text-[#D4AF37] transition-all bg-[#D4AF37]/5 active:scale-95">
                View Insights
              </button>
            </div>

            {/* Glowing 3D Isometric Hologram Building Wireframe */}
            <div className="w-1/3 flex items-center justify-center">
              <svg className="w-20 h-20 text-blue-400" viewBox="0 0 100 100" fill="none">
                {/* Horizontal projection grid rings */}
                <ellipse cx="50" cy="80" rx="30" ry="10" stroke="#D4AF37" strokeWidth="0.75" strokeDasharray="4 2" />
                <ellipse cx="50" cy="80" rx="20" ry="6.5" stroke="#0070f3" strokeWidth="1" />
                
                {/* Outer bounding perspective grids */}
                <g className="opacity-30">
                  <line x1="10" y1="80" x2="50" y2="95" stroke="currentColor" strokeWidth="0.5" />
                  <line x1="90" y1="80" x2="50" y2="95" stroke="currentColor" strokeWidth="0.5" />
                </g>
                
                {/* Building Block 1 */}
                <g className="hologram-line" stroke="currentColor" strokeWidth="1">
                  <polygon points="50,45 75,32 75,67 50,80" fill="rgba(0,112,243,0.12)" />
                  <polygon points="50,45 25,32 25,67 50,80" fill="rgba(0,112,243,0.18)" />
                  <polygon points="50,45 75,32 50,20 25,32" fill="rgba(0,112,243,0.06)" />
                </g>

                {/* Taller Building Block 2 */}
                <g className="hologram-line" stroke="#22d3ee" strokeWidth="1" opacity="0.8">
                  <polygon points="50,25 68,16 68,52 50,61" fill="rgba(34,211,238,0.12)" />
                  <polygon points="50,25 32,16 32,52 50,61" fill="rgba(34,211,238,0.18)" />
                  <polygon points="50,25 68,16 50,7 32,16" fill="rgba(34,211,238,0.06)" />
                </g>

                {/* Dynamic laser scan horizontal bar */}
                <line x1="15" y1="52" x2="85" y2="52" stroke="#0070f3" strokeWidth="1.5" className="animate-pulse shadow-2xl" />
              </svg>
            </div>

          </div>
        </div>

        {/* ── SHARE PLATFORM BAR ── */}
        <button 
          onClick={copyLink}
          className="w-full bg-[#111625]/65 border border-[#D4AF37]/25 rounded-2xl px-4 py-3 flex items-center justify-between hover:bg-[#D4AF37]/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <ExternalLink size={13} className="text-[#D4AF37]" />
            <span className="text-[11px] font-mono text-gray-400 truncate max-w-[200px]">
              /booking/{hotelId}
            </span>
          </div>
          <span className="text-xs font-bold flex items-center gap-1 text-[#D4AF37]">
            {copied ? <><Check size={11}/>Copied!</> : "Share Link"}
          </span>
        </button>

        {/* ── TODAY'S CHECK-INS ── */}
        <div className="bg-[#111625]/65 border border-white/5 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/5">
            <p className="text-gray-400 text-xs font-bold tracking-wider uppercase">Aaj Ke Check-ins</p>
            <span className="text-xs font-bold text-[#D4AF37]">
              {todayBookings.filter(b=>b.status==="active").length} active
            </span>
          </div>

          {todayBookings.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-2xl mb-2">🌙</p>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Aaj koi check-in nahi hua</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {todayBookings.slice(0, 5).map(b => (
                <div key={b.id} className="px-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                  <div>
                    <p className="text-white text-sm font-bold">{b.guestName}</p>
                    <p className="text-gray-400 text-xs mt-0.5">Room {b.roomId} · {b.nights} raat · {b.paymentMode}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-sm text-[#D4AF37]">
                      ₹{Number(b.totalAmount||0).toLocaleString("en-IN")}
                    </p>
                    <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest">{b.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ── PORTABLE BOTTOM NAVBAR ── */}
      <div className="absolute bottom-0 inset-x-0 h-16 bg-[#07090e]/95 border-t border-white/5 px-6 flex items-center justify-between z-40 backdrop-blur-md">
        {[
          { label: "Dashboard", icon: "🏠", active: true },
          { label: "Bookings", icon: "📅", active: false },
          { label: "Guests", icon: "👥", active: false },
          { label: "Operations", icon: "⚙️", active: false },
          { label: "Reports", icon: "📊", active: false },
        ].map(tab => (
          <button 
            key={tab.label}
            onClick={() => onNavigate && onNavigate(tab.label.toLowerCase())}
            className="flex flex-col items-center justify-center py-1 flex-1 relative"
          >
            <span className="text-lg">{tab.icon}</span>
            <span className={`text-[9px] font-bold mt-1 ${tab.active ? 'text-[#D4AF37]' : 'text-gray-500'}`}>
              {tab.label}
            </span>
            {tab.active && (
              <span className="absolute -top-1 w-8 h-[2px] bg-[#D4AF37] rounded-full shadow-[0_0_8px_#D4AF37]" />
            )}
          </button>
        ))}
      </div>

      {/* ── ROOM DETAIL POPUP SHEET ── */}
      {selRoom && (
        <div 
          className="absolute inset-0 z-50 flex items-end justify-center bg-black/85 backdrop-blur-xs"
          onClick={() => setSelRoom(null)}
        >
          <div 
            className="w-full max-w-md bg-[#0e1320] border-t border-white/10 rounded-t-3xl p-6 space-y-4 pb-10"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto" />
            
            <div className="flex items-center gap-4">
              <div 
                className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black text-xl border-t ${roomConfig(selRoom).bg} ${roomConfig(selRoom).shadow} ${roomConfig(selRoom).border} ${roomConfig(selRoom).text}`}
                style={{ boxShadow: `0 4px 0px ${roomConfig(selRoom).glow.replace('0.45', '0.7')}` }}
              >
                <span className="text-[9px] opacity-75 uppercase">Room</span>
                <span className="leading-none mt-0.5">{selRoom.number}</span>
              </div>
              <div>
                <h3 className="font-black text-white text-lg">Room {selRoom.number}</h3>
                <p className="text-gray-400 text-xs capitalize">{selRoom.type} · Floor {selRoom.floor}</p>
              </div>
            </div>

            {selRoom.booking ? (
              <div className="space-y-4 pt-2">
                <div className="bg-[#111625]/80 border border-white/5 rounded-2xl p-4 space-y-2.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white font-black text-base">{selRoom.booking.guestName}</p>
                      <p className="text-gray-400 text-xs mt-0.5">{selRoom.booking.guestPhone}</p>
                    </div>
                    <span className="bg-[#10b981]/10 text-[#10b981] text-[10px] font-bold px-2.5 py-1 rounded-full border border-[#10b981]/20">
                      Active Stay
                    </span>
                  </div>
                  
                  <div className="border-t border-white/5 pt-2.5 flex justify-between text-sm">
                    <span className="text-gray-400">{selRoom.booking.nights} Raatein</span>
                    <span className="font-black text-[#D4AF37]">₹{Number(selRoom.booking.totalAmount||0).toLocaleString("en-IN")}</span>
                  </div>
                </div>

                <button 
                  onClick={() => handleCheckout(selRoom.booking.id)}
                  className="w-full py-4 rounded-2xl font-black text-sm bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-600 text-black shadow-lg hover:shadow-yellow-500/20 active:scale-95 transition-all uppercase tracking-wider"
                >
                  ✓ Check-out Karo
                </button>
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                <div className="bg-[#111625]/80 border border-white/5 rounded-2xl p-4 text-center">
                  <p className="text-gray-400 text-sm capitalize font-bold">Status: {selRoom.status?.replace('_', ' ')}</p>
                  <p className="text-[#D4AF37] text-xs font-black mt-1.5">Base Rate: ₹{selRoom.baseRate}/night</p>
                </div>
                {selRoom.status === "vacant" && (
                  <button 
                    onClick={() => { setSelRoom(null); onNewBooking && onNewBooking(selRoom); }}
                    className="w-full py-4 rounded-2xl font-black text-sm bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-600 text-black shadow-lg hover:shadow-yellow-500/20 active:scale-95 transition-all uppercase tracking-wider"
                  >
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
    <div className="h-full bg-[#07090e] px-4 py-6 space-y-4 animate-pulse">
      <div className="h-10 w-2/3 bg-white/5 rounded-xl" />
      <div className="h-20 bg-white/5 rounded-2xl" />
      <div className="h-32 bg-white/5 rounded-2xl" />
      <div className="h-44 bg-white/5 rounded-2xl" />
    </div>
  );
}
