"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { RefreshCw, Maximize2, ChevronDown, Lock, Brain, ExternalLink, Check, Bell, Menu, User, Sparkles } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";
import {
  getTodayStats, getRooms, getBookingById, checkoutBooking,
  getTodayBookings, getWeeklyRevenue, initializeRooms
} from "../lib/db";

// CSS Stylesheet for animations, 3D deck perspective, glows and neon lighting effects
const CustomStyles = () => (
  <style dangerouslySetInnerHTML={{ __html: `
    @keyframes pulse-glow {
      0%, 100% { box-shadow: 0 0 15px rgba(0, 112, 243, 0.4), inset 0 0 10px rgba(0, 112, 243, 0.2); }
      50% { box-shadow: 0 0 30px rgba(0, 112, 243, 0.8), inset 0 0 20px rgba(0, 112, 243, 0.4); }
    }
    @keyframes pulse-gold {
      0%, 100% { box-shadow: 0 0 12px rgba(212, 175, 55, 0.3); }
      50% { box-shadow: 0 0 25px rgba(212, 175, 55, 0.6); }
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
      0%, 100% { transform: translateY(-5px); opacity: 0.3; }
      50% { transform: translateY(55px); opacity: 0.9; }
    }
    @keyframes soundwave {
      0%, 100% { height: 4px; }
      50% { height: 16px; }
    }
    .sound-bar {
      animation: soundwave 1.2s ease-in-out infinite;
    }
    .glow-gold-text {
      text-shadow: 0 0 12px rgba(212, 175, 55, 0.5);
    }
    .perspective-deck {
      perspective: 1200px;
      transform-style: preserve-3d;
    }
    .isometric-grid {
      transform: rotateX(24deg) translateY(-5px);
      transform-style: preserve-3d;
    }
    /* Keycap 3D buttons */
    .keycap-3d {
      position: relative;
      transition: all 0.1s ease;
      transform-style: preserve-3d;
    }
    .keycap-3d:active {
      transform: translateY(3px);
    }
    .hologram-line {
      stroke-dasharray: 100;
      animation: hologram-dash 5s linear infinite;
    }
    @keyframes hologram-dash {
      to {
        stroke-dashoffset: -1000;
      }
    }
  `}} />
);

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

// Wrapping for the App main-export requirement
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
  const [isScanning, setIsScanning] = useState(false);

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

  const triggerAIScan = () => {
    setIsScanning(true);
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    setTimeout(() => {
      setIsScanning(false);
      fetchInsight();
    }, 2000);
  };

  const copyLink = () => {
    // Canvas iFrame bypass compatible copy
    const tempInput = document.createElement("input");
    tempInput.value = `${window.location.origin}/booking/${hotelId}`;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand("copy");
    document.body.removeChild(tempInput);
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

  const pct = (Math.random() * 5 + 15).toFixed(1);

  const byFloor = {};
  rooms.forEach(r => {
    if (!byFloor[r.floor]) byFloor[r.floor] = [];
    byFloor[r.floor].push(r);
  });
  const floors = Object.keys(byFloor).map(Number).sort((a, b) => b - a);

  // Styling maps for premium 3D keycaps matching Image 1
  const roomStyleMap = (r) => {
    if (r.status === "occupied") {
      return {
        bg: "bg-gradient-to-b from-[#10b981] to-[#047857]",
        shadow: "shadow-[0_4px_0_#064e3b]",
        border: "border-[#6ee7b7]/30",
        text: "text-white",
        glow: "rgba(16, 185, 129, 0.35)"
      };
    }
    if (r.status === "reserved") {
      return {
        bg: "bg-gradient-to-b from-[#fbbf24] to-[#d97706]",
        shadow: "shadow-[0_4px_0_#92400e]",
        border: "border-[#fde68a]/30",
        text: "text-white",
        glow: "rgba(245, 158, 11, 0.35)"
      };
    }
    if (r.status === "cleaning") {
      return {
        bg: "bg-gradient-to-b from-[#3b82f6] to-[#1d4ed8]",
        shadow: "shadow-[0_4px_0_#1e3a8a]",
        border: "border-[#93c5fd]/30",
        text: "text-white",
        glow: "rgba(59, 130, 246, 0.35)"
      };
    }
    if (r.status === "out_of_order") {
      return {
        bg: "bg-gradient-to-b from-[#4b5563] to-[#1f2937]",
        shadow: "shadow-[0_4px_0_#111827]",
        border: "border-[#9ca3af]/20",
        text: "text-gray-400",
        glow: "rgba(75, 85, 99, 0.1)"
      };
    }
    // Vacant/Available -> Red color based on Image 1 (Vacant = Red)
    return {
      bg: "bg-gradient-to-b from-[#ef4444] to-[#b91c1c]",
      shadow: "shadow-[0_4px_0_#7f1d1d]",
      border: "border-[#fca5a5]/30",
      text: "text-white",
      glow: "rgba(239, 68, 68, 0.35)"
    };
  };

  const Tip = ({ active, payload }) => active && payload?.length ? (
    <div className="bg-[#111625]/90 border border-[#D4AF37]/30 px-3 py-1.5 rounded-lg text-xs backdrop-blur-md">
      <p style={{ color:"#D4AF37" }} className="font-bold">₹{payload[0].value.toLocaleString("en-IN")}</p>
    </div>
  ) : null;

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-[#0e1320] via-[#080a10] to-[#04060a] text-gray-300 font-sans relative overflow-hidden selection:bg-[#D4AF37]/30">
      <CustomStyles />
      
      {/* Scrollable content container */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 pb-20">

        {/* Brand Header */}
        <div className="flex items-center justify-between">
          <button className="w-10 h-10 rounded-xl bg-[#141b2d] border border-white/5 flex items-center justify-center text-[#D4AF37] hover:bg-white/5 transition-colors active:scale-95">
            <Menu size={20} />
          </button>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5">
              {/* Gold Temple/Hotel Icon */}
              <div className="w-6 h-6 text-[#D4AF37] flex items-center justify-center font-bold">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M12 2L2 22h20L12 2zm0 3l7.5 15h-15L12 5zm-1 5h2v6h-2v-6zm0 8h2v2h-2v-2z"/>
                </svg>
              </div>
              <h1 className="text-lg font-black tracking-wider text-white uppercase" style={{ fontFamily: 'system-ui' }}>
                The GuestInn
              </h1>
            </div>
            <p className="text-[8px] tracking-[0.2em] font-medium text-[#D4AF37] opacity-80 uppercase">
              AI-Powered Hotel Management
            </p>
          </div>

          <button className="w-10 h-10 rounded-xl bg-[#141b2d] border border-white/5 flex items-center justify-center text-gray-300 hover:bg-white/5 transition-colors active:scale-95 relative">
            <Bell size={20} />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-amber-500" />
          </button>
        </div>

        {/* AI Receptionist Card */}
        <div className="bg-[#111625]/60 border border-white/5 rounded-2xl p-3.5 backdrop-blur-md relative overflow-hidden flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar with gold border and glowing sound visualizer */}
            <div className="relative">
              <div className="w-14 h-14 rounded-full border-2 border-[#D4AF37] p-0.5 relative overflow-hidden">
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#1d4ed8] to-[#60a5fa] flex items-center justify-center text-white overflow-hidden">
                  {/* Highly polished female avatar SVG illustration */}
                  <svg viewBox="0 0 32 32" className="w-10 h-10 mt-2 text-white/90">
                    <circle cx="16" cy="12" r="6" fill="currentColor" />
                    <path d="M16 20c-6 0-10 4-10 8h20c0-4-4-8-10-8z" fill="currentColor" />
                  </svg>
                </div>
              </div>
              {/* Mini visualizer badge */}
              <div className="absolute -bottom-1 -right-1 bg-blue-600/90 border border-blue-400 text-white rounded-full px-1.5 py-0.5 flex items-center gap-0.5 shadow-lg">
                <span className="sound-bar w-0.5 bg-white rounded-full" style={{ animationDelay: "0.1s" }} />
                <span className="sound-bar w-0.5 bg-white rounded-full" style={{ animationDelay: "0.3s" }} />
                <span className="sound-bar w-0.5 bg-white rounded-full" style={{ animationDelay: "0.5s" }} />
              </div>
            </div>

            <div>
              <p className="text-[#60a5fa] font-semibold text-xs tracking-wider flex items-center gap-1 uppercase">
                AI Receptionist
                <Sparkles size={11} className="animate-pulse" />
              </p>
              <h3 className="font-extrabold text-white text-sm mt-0.5">{greeting()}, Manager 👋</h3>
              <p className="text-gray-400 text-[11px] mt-0.5">Here's your operational overview.</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
          </div>
        </div>

        {/* Live Revenue Card with Gold Glow */}
        <div className="bg-[#111625]/60 border border-white/5 rounded-2xl p-4 backdrop-blur-md relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-gray-400 text-[9px] font-bold tracking-[0.15em] uppercase">Live Revenue</p>
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-600 glow-gold-text">
                ₹24,58,000.00
              </h2>
              <p className="text-xs text-gray-400">Today's Total Revenue</p>
              
              <div className="pt-2">
                <span className="inline-flex items-center gap-1 bg-[#10b981]/10 text-[#10b981] text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-[#10b981]/20">
                  ↑ 18.6% <span className="text-[9px] opacity-75 font-normal">vs yesterday</span>
                </span>
              </div>
            </div>

            {/* Sparkline overlay right-aligned */}
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
                    dot={{ r: 3, fill: '#D4AF37', stroke: '#fff', strokeWidth: 1 }}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
              {/* Glowing point at end */}
              <div className="absolute top-[34px] right-2 w-2 h-2 rounded-full bg-[#D4AF37] shadow-[0_0_10px_#D4AF37]" />
            </div>
          </div>
        </div>

        {/* 3D Perspective Room Occupancy Grid */}
        <div className="bg-[#111625]/60 border border-white/5 rounded-2xl p-4 backdrop-blur-md relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5 text-gray-200">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]/80" />
              <h4 className="text-xs font-bold tracking-wider uppercase">Room Occupancy</h4>
            </div>
            
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#141b2d] border border-white/5 text-[10px] font-semibold text-gray-300">
                Tower A <ChevronDown size={11} className="text-[#D4AF37]" />
              </button>
              <button className="w-7 h-7 rounded-lg bg-[#141b2d] border border-white/5 flex items-center justify-center text-gray-400">
                <Maximize2 size={12} />
              </button>
            </div>
          </div>

          {/* 3D Isometric Deck Structure */}
          <div className="perspective-deck py-3 overflow-x-auto">
            <div className="isometric-grid space-y-2.5 min-w-[310px]">
              {floors.map(fl => (
                <div key={fl} className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-gray-500 w-5 text-right font-mono">
                    {String(fl).padStart(2,"0")}
                  </span>
                  
                  <div className="flex gap-2.5 flex-1 justify-between">
                    {byFloor[fl].map(room => {
                      const style = roomStyleMap(room);
                      return (
                        <button 
                          key={room.id} 
                          onClick={() => handleRoomClick(room)}
                          className={`keycap-3d flex-1 min-w-[28px] max-w-[36px] aspect-square rounded-lg flex flex-col items-center justify-center py-1 border-t ${style.bg} ${style.shadow} ${style.border} ${style.text}`}
                          style={{ boxShadow: `0 4px 0px ${style.glow.replace('0.35', '0.7')}` }}
                        >
                          {/* Top tiny icon from Image 1 */}
                          <User size={8} className="opacity-90 mb-0.5 text-white/80" />
                          <span className="text-[9px] font-black tracking-tighter leading-none">{room.number}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              
              {/* Row indexes at bottom */}
              <div className="flex items-center gap-2 pt-1 border-t border-white/5">
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

          {/* Dynamic Legends */}
          <div className="grid grid-cols-4 gap-1.5 pt-4 mt-2 border-t border-white/5 text-center">
            {[
              { c:"bg-[#10b981]", l:"Occupied (68%)" }, 
              { c:"bg-[#fbbf24]", l:"Reserved (5%)" },
              { c:"bg-[#ef4444]", l:"Vacant (17%)" }, 
              { c:"bg-[#4b5563]", l:"Out of Order (10%)" },
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

        {/* Operations Dashboard & Interactive AI Scan Orb */}
        <div className="grid grid-cols-12 gap-3 items-center relative">
          
          {/* Left Column Stats */}
          <div className="col-span-4 flex flex-col gap-3">
            {/* Guest Check-In */}
            <div className="bg-[#111625]/60 border border-white/5 rounded-2xl p-3 text-left">
              <div className="flex items-center gap-1.5 text-amber-500/90 mb-1">
                <User size={13} />
                <p className="text-[9px] font-bold tracking-wider uppercase">Guest Check-In</p>
              </div>
              <h4 className="text-2xl font-black text-white leading-none">12</h4>
              <p className="text-[10px] text-blue-400 font-semibold mt-1">Pending</p>
            </div>

            {/* Housekeeping */}
            <div className="bg-[#111625]/60 border border-white/5 rounded-2xl p-3 text-left">
              <div className="flex items-center gap-1.5 text-amber-500/90 mb-1">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <p className="text-[9px] font-bold tracking-wider uppercase">Housekeeping</p>
              </div>
              <h4 className="text-2xl font-black text-white leading-none">8</h4>
              <p className="text-[10px] text-blue-400 font-semibold mt-1">Rooms</p>
            </div>
          </div>

          {/* Central AI Scan Pulsing Dial (Image 1 Highlight) */}
          <div className="col-span-4 flex flex-col items-center justify-center relative">
            <button 
              onClick={triggerAIScan}
              disabled={isScanning}
              className="relative w-28 h-28 rounded-full flex items-center justify-center active:scale-95 transition-transform"
            >
              {/* Outer glowing dynamic rings */}
              <div 
                className={`absolute inset-0 rounded-full border border-blue-500/30 ${isScanning ? 'animate-ping' : 'animate-pulse'}`} 
                style={{ animationDuration: isScanning ? '1s' : '3s' }}
              />
              
              {/* Concentric Layer 1: Spin Slow */}
              <div 
                className="absolute inset-2 rounded-full border-2 border-dashed border-cyan-400/40"
                style={{ animation: 'spin-slow 15s linear infinite' }}
              />

              {/* Concentric Layer 2: Reverse Spin */}
              <div 
                className="absolute inset-4 rounded-full border border-blue-600/50"
                style={{ animation: 'spin-reverse 8s linear infinite' }}
              />

              {/* Glowing Inner Core with radial gold/blue highlights */}
              <div className={`absolute inset-5 rounded-full bg-gradient-to-tr from-blue-900 via-slate-900 to-blue-950 border border-blue-400/80 flex flex-col items-center justify-center ${isScanning ? 'pulse-glow' : 'shadow-[0_0_15px_rgba(0,112,243,0.5)]'}`}>
                <span className="text-[8px] tracking-[0.25em] font-extrabold text-cyan-400 uppercase">AI</span>
                <span className="text-sm font-black text-white tracking-widest mt-0.5">SCAN</span>
                {isScanning && <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-cyan-400/80 shadow-[0_0_8px_#22d3ee] laser-sweep" />}
              </div>
            </button>
          </div>

          {/* Right Column Stats */}
          <div className="col-span-4 flex flex-col gap-3">
            {/* Maintenance */}
            <div className="bg-[#111625]/60 border border-white/5 rounded-2xl p-3 text-left">
              <div className="flex items-center gap-1.5 text-amber-500/90 mb-1">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                </svg>
                <p className="text-[9px] font-bold tracking-wider uppercase">Maintenance</p>
              </div>
              <h4 className="text-2xl font-black text-white leading-none">5</h4>
              <p className="text-[10px] text-blue-400 font-semibold mt-1">Pending</p>
            </div>

            {/* Reviews */}
            <div className="bg-[#111625]/60 border border-white/5 rounded-2xl p-3 text-left">
              <div className="flex items-center gap-1.5 text-amber-500/90 mb-1">
                <svg className="w-3.5 h-3.5 text-amber-400 fill-current" viewBox="0 0 24 24">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                </svg>
                <p className="text-[9px] font-bold tracking-wider uppercase">Reviews</p>
              </div>
              <h4 className="text-2xl font-black text-white leading-none">4.8</h4>
              <p className="text-[10px] text-blue-400 font-semibold mt-1">Rating</p>
            </div>
          </div>
        </div>

        {/* AI Insights and Hologram Building Integration */}
        <div className="bg-[#111625]/60 border border-blue-500/20 rounded-2xl p-4 backdrop-blur-md relative overflow-hidden">
          <div className="flex items-center gap-4">
            
            {/* Informational Column */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-1.5 text-blue-400">
                <Brain size={14} className="animate-pulse" />
                <p className="text-[10px] font-extrabold tracking-widest uppercase">AI Insights</p>
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
                <p className="text-xs text-gray-300 leading-relaxed font-medium">
                  {insight}
                </p>
              )}

              <button className="inline-flex items-center gap-1 px-4 py-1.5 rounded-xl border border-[#D4AF37]/30 hover:border-[#D4AF37]/80 text-[10px] font-bold text-[#D4AF37] transition-all bg-[#D4AF37]/5 active:scale-95">
                View Insights
              </button>
            </div>

            {/* 3D Wireframe/Hologram Building Vector (Pure SVG - Highly detailed layout from Image 1) */}
            <div className="w-1/3 flex items-center justify-center">
              <svg className="w-20 h-20 text-blue-400" viewBox="0 0 100 100" fill="none">
                {/* Isometric coordinate grid representation */}
                <g className="opacity-40">
                  <line x1="10" y1="80" x2="50" y2="95" stroke="currentColor" strokeWidth="0.5" />
                  <line x1="90" y1="80" x2="50" y2="95" stroke="currentColor" strokeWidth="0.5" />
                </g>
                
                {/* Building Block 1 */}
                <g className="hologram-line" stroke="currentColor" strokeWidth="1">
                  <polygon points="50,45 75,32 75,67 50,80" fill="rgba(0,112,243,0.1)" />
                  <polygon points="50,45 25,32 25,67 50,80" fill="rgba(0,112,243,0.15)" />
                  <polygon points="50,45 75,32 50,20 25,32" fill="rgba(0,112,243,0.05)" />
                </g>

                {/* Building Block 2 (Taller background tower) */}
                <g className="hologram-line" stroke="#22d3ee" strokeWidth="1" opacity="0.8">
                  <polygon points="50,25 68,16 68,52 50,61" fill="rgba(34,211,238,0.1)" />
                  <polygon points="50,25 32,16 32,52 50,61" fill="rgba(34,211,238,0.15)" />
                  <polygon points="50,25 68,16 50,7 32,16" fill="rgba(34,211,238,0.05)" />
                </g>

                {/* Laser horizontal scanner line */}
                <line x1="15" y1="50" x2="85" y2="50" stroke="#0070f3" strokeWidth="2" className="animate-pulse shadow-xl" />
                
                {/* Glowing target rings under building */}
                <ellipse cx="50" cy="80" rx="30" ry="10" stroke="#D4AF37" strokeWidth="0.75" strokeDasharray="4 2" />
                <ellipse cx="50" cy="80" rx="22" ry="7" stroke="#0070f3" strokeWidth="1" />
              </svg>
            </div>

          </div>
        </div>

        {/* Shareable Platform Link Copy Bar */}
        <button 
          onClick={copyLink}
          className="w-full bg-[#111625]/60 border border-[#D4AF37]/20 rounded-2xl px-4 py-3.5 flex items-center justify-between hover:bg-[#D4AF37]/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <ExternalLink size={14} className="text-[#D4AF37]" />
            <span className="text-[11px] font-mono text-gray-400 truncate max-w-[200px]">
              /booking/{hotelId}
            </span>
          </div>
          <span className="text-xs font-bold flex items-center gap-1 text-[#D4AF37]">
            {copied ? <><Check size={12}/>Copied!</> : "Share Link"}
          </span>
        </button>

        {/* Today's Check-ins Feed */}
        <div className="bg-[#111625]/60 border border-white/5 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/5">
            <p className="text-gray-400 text-xs font-bold tracking-wider uppercase">Today's Check-ins</p>
            <span className="text-xs font-bold text-[#D4AF37]">
              {getTodayBookings(hotelId).filter(b=>b.status==="active").length} active
            </span>
          </div>

          {getTodayBookings(hotelId).length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-gray-500 text-sm">Aaj koi check-in nahi hua</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {getTodayBookings(hotelId).slice(0, 5).map(b => (
                <div key={b.id} className="px-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                  <div>
                    <p className="text-white text-sm font-bold">{b.guestName}</p>
                    <p className="text-gray-400 text-xs mt-0.5">Room {b.roomId} · {b.nights} nights · {b.paymentMode}</p>
                  </div>
                  <p className="font-extrabold text-sm text-[#D4AF37]">
                    ₹{Number(b.totalAmount||0).toLocaleString("en-IN")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Floating Modern iOS Tab bar at bottom (Matches Navigation Concept of Image 1) */}
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

      {/* Room detail custom modal sheet */}
      {selRoom && (
        <div 
          className="absolute inset-0 z-50 flex items-end justify-center bg-black/85 backdrop-blur-sm"
          onClick={() => setSelRoom(null)}
        >
          <div 
            className="w-full max-w-md bg-[#0e1320] border-t border-white/10 rounded-t-3xl p-6 space-y-4 pb-10"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto" />
            
            <div className="flex items-center gap-4">
              <div 
                className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black text-xl border-t ${roomStyleMap(selRoom).bg} ${roomStyleMap(selRoom).shadow} ${roomStyleMap(selRoom).border} ${roomStyleMap(selRoom).text}`}
                style={{ boxShadow: `0 4px 0px ${roomStyleMap(selRoom).glow.replace('0.35', '0.7')}` }}
              >
                <span className="text-[10px] opacity-75">ROOM</span>
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
                    <span className="text-gray-400">{selRoom.booking.nights} Nights Stay</span>
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
                  <p className="text-gray-400 text-sm capitalize font-bold">Status: {selRoom.status}</p>
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

```
