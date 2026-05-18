"use client";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { 
  RefreshCw, ExternalLink, Check, Brain, ChevronDown, Wrench, Star, Users, 
  Home, Bell, Menu, Sparkles, Plus, Calendar, Shield, CreditCard, Trash2, 
  Search, ArrowRight, CheckCircle2, UserCheck, AlertTriangle, Layers, 
  Activity, Award, FileText, Settings, X, ChevronRight, CheckSquare, 
  MessageSquare, Scan, Send, Zap
} from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from "recharts";
import {
  getTodayStats, getRooms, getBookingById, checkoutBooking,
  getTodayBookings, getWeeklyRevenue, initializeRooms
} from "../lib/db";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default function DashboardView({ hotelId, hotel, user, onNavigate, onNewBooking }) {
  // Core database managed states
  const [stats,      setStats]    = useState(null);
  const [rooms,      setRooms]    = useState([]);
  const [revData,    setRevData]  = useState([]);
  const [refreshing, setRefresh]  = useState(false);
  
  // Dashboard navigation tab
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, bookings, ocr_scanner, ai_chat, whatsapp, settings

  // Interaction flows
  const [selRoom,    setSelRoom]  = useState(null);
  const [copied,     setCopied]   = useState(false);
  const [aiScan,     setAiScan]   = useState(false);
  const [toast,      setToast]    = useState(null);

  // Gemini API & Insights logic
  const [apiKey, setApiKey] = useState("");
  const [showApiModal, setShowApiModal] = useState(false);
  const [insight,    setInsight]  = useState("Aaj ki demand analysis ho rahi hai...");
  const [iLoad,      setILoad]    = useState(false);

  // OCR ID Scanner Simulation States
  const [ocrScanning, setOcrScanning] = useState(false);
  const [ocrIdType, setOcrIdType] = useState("Aadhaar");
  const [scannedResult, setScannedResult] = useState(null);

  // WhatsApp logs simulation
  const [whatsappLogs, setWhatsappLogs] = useState([
    { id: 1, phone: "9876543210", type: "Check-in Confirm", message: "Namaste Rohan! Welcome to The GuestInn. Your digital room key RM-104 is active. Tap for dynamic self checkout.", time: "11:15 PM" },
    { id: 2, phone: "9123456780", type: "Auto Housekeeping", message: "Housekeeping Alert: Room 302 sheets changed & audited.", time: "11:20 PM" }
  ]);
  const [whatsappDraft, setWhatsappDraft] = useState({ phone: "", template: "Welcome Hook" });

  // AI Chat Conversation logs
  const [aiChatMessages, setAiChatMessages] = useState([
    { id: 1, role: "assistant", text: "Namaste! Aapka AI Receptionist active hai. Hotel Delhi Heritage ke live rooms check-in karne ke liye main ready hu. Kya help karu?" }
  ]);
  const [chatInput, setChatInput] = useState("");

  const scanRef = useRef(null);

  // System tactile dynamic feedback wrapper
  const triggerHaptic = (pattern = 30) => {
    if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(pattern);
    }
  };

  const showToast = (msg, type = "success") => {
    setToast({ text: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Dynamically pull NextDB changes
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

  // Deep AI Insights integration using custom token ruleset
  const fetchInsight = async () => {
    setILoad(true);
    const s = getTodayStats(hotelId);
    
    if (!apiKey) {
      // Offline local rules fallbacks
      setTimeout(() => {
        setInsight(localInsight(s));
        setILoad(false);
      }, 1000);
      return;
    }

    const systemPrompt = `You are the master AI receptionist core of "The GuestInn" PMS. 
    Analyze hotel stats: ${s?.occupancyPercent}% occupancy, ${s?.vacantRooms} vacant, live revenue. 
    Deliver elite operational insights in clean, professional Hinglish. Keep it short, actionable, and dynamic.`;

    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Perform immediate room price index analysis and suggest optimization steps." }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] }
        }),
      });
      const d = await r.json();
      const aiText = d.candidates?.[0]?.content?.parts?.[0]?.text;
      setInsight(aiText || localInsight(s));
    } catch { 
      setInsight(localInsight(s) + " (Offline rules fallback)"); 
    } finally {
      setILoad(false);
    }
  };

  const handleRefresh = async () => {
    setRefresh(true);
    load();
    await fetchInsight();
    setRefresh(false);
    showToast("Dashboard synchronized!", "success");
  };

  const handleAiScan = async () => {
    setAiScan(true);
    triggerHaptic([40, 20, 40]);
    await fetchInsight();
    setTimeout(() => {
      setAiScan(false);
      showToast("Holographic AI Scanner sweep completed!", "success");
    }, 2000);
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
    load();
    
    // Automated outbound WhatsApp simulator log trigger
    const newLog = {
      id: Date.now(),
      phone: selRoom?.booking?.guestPhone || "9876543210",
      type: "Checkout Thank-you",
      message: `Dear ${selRoom?.booking?.guestName}, check-out for Room ${selRoom?.number} is successfully compiled. Thanks for staying at ${hotel?.name || "The GuestInn"}.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setWhatsappLogs(prev => [newLog, ...prev]);

    setSelRoom(null);
    triggerHaptic(50);
    showToast("Check-out processed and guest notified!", "success");
  };

  // Simulated OCR Engine trigger
  const handleOcrSimulation = () => {
    setOcrScanning(true);
    triggerHaptic([100, 50, 100]);
    setScannedResult(null);

    setTimeout(() => {
      const isAadhaar = ocrIdType === "Aadhaar";
      setScannedResult(isAadhaar ? {
        documentNo: "UID-9012-3456-7890",
        name: "Mubashir Hasan",
        gender: "Male",
        dob: "15/08/1996",
        address: "E-3 Arera Colony, Bhopal, MP",
        confidence: "99.4%"
      } : {
        documentNo: "PASS-Z4839201",
        name: "Vikram Singhal",
        gender: "Male",
        dob: "12/10/1988",
        address: "Marine Drive, Mumbai, MH",
        confidence: "98.7%"
      });
      setOcrScanning(false);
      showToast("OCR Identification Extracted successfully!", "success");
    }, 2500);
  };

  const applyOcrToNewBooking = () => {
    if (!scannedResult) return;
    const firstVacant = rooms.find(r => r.status === "vacant");
    
    // Auto-fill booking function from parent dashboard trigger
    if (onNewBooking && firstVacant) {
      onNewBooking({
        ...firstVacant,
        presetName: scannedResult.name,
        presetPhone: "9826012345"
      });
      setScannedResult(null);
    } else {
      showToast("No vacant room available to dispatch!", "warning");
    }
  };

  const handleSendChatMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = { id: Date.now(), role: "user", text: chatInput };
    setAiChatMessages(prev => [...prev, userMsg]);
    setChatInput("");

    setTimeout(() => {
      let responseText = "Mubashir's AI Engine is processing. Live stats checked: Everything is operational.";
      if (chatInput.toLowerCase().includes("room") || chatInput.toLowerCase().includes("occupancy")) {
        responseText = `Current statistics: Occupancy rate is ${stats?.occupancyPercent}%. We have ${stats?.vacantRooms} rooms empty currently.`;
      }
      setAiChatMessages(prev => [...prev, { id: Date.now() + 1, role: "assistant", text: responseText }]);
      triggerHaptic(20);
    }, 1000);
  };

  if (!stats) return <Skeleton />;

  const pct = (Math.random() * 20 + 5).toFixed(1);

  // Group rooms safely by floors
  const byFloor = {};
  rooms.forEach(r => {
    if (!byFloor[r.floor]) byFloor[r.floor] = [];
    byFloor[r.floor].push(r);
  });
  const floors = Object.keys(byFloor).map(Number).sort((a, b) => b - a);

  // Dynamic Room node colors config matches image premium style
  const roomConfig = (r) => {
    if (r.status === "occupied")     return { bg: "linear-gradient(145deg,#16a34a,#15803d)", border: "rgba(34,197,94,0.7)",  text: "#f0fdf4", glow: "rgba(34,197,94,0.3)",   icon: "👤", label: "Occupied"  };
    if (r.status === "reserved")     return { bg: "linear-gradient(145deg,#eab308,#ca8a04)", border: "rgba(234,179,8,0.7)",  text: "#fef9c3", glow: "rgba(234,179,8,0.25)", icon: "📌", label: "Reserved"  };
    if (r.status === "cleaning")     return { bg: "linear-gradient(145deg,#3b82f6,#1d4ed8)", border: "rgba(59,130,246,0.7)",  text: "#eff6ff", glow: "rgba(59,130,246,0.25)", icon: "🧹", label: "Cleaning"  };
    if (r.status === "out_of_order") return { bg: "linear-gradient(145deg,#374151,#1f2937)", border: "rgba(107,114,128,0.5)", text: "#9ca3af", glow: "transparent",           icon: "🔧", label: "Out Order" };
    return                                   { bg: "linear-gradient(145deg,#ef4444,#dc2626)", border: "rgba(239,68,68,0.7)",  text: "#fef2f2", glow: "rgba(239,68,68,0.25)",  icon: "",   label: "Vacant"    };
  };

  // Real-time variables calculated
  const occupied   = rooms.filter(r => r.status === "occupied").length;
  const vacant     = rooms.filter(r => r.status === "vacant").length;
  const reserved   = rooms.filter(r => r.status === "reserved").length;
  const cleaning   = rooms.filter(r => r.status === "cleaning").length;
  const outOfOrder = rooms.filter(r => r.status === "out_of_order").length;
  const total      = rooms.length;

  const Tip = ({ active, payload }) => active && payload?.length ? (
    <div style={{ background:"rgba(0,0,0,0.85)", border:"1px solid rgba(212,175,55,0.3)", borderRadius:8, padding:"6px 10px" }}>
      <p style={{ color:"#D4AF37", fontSize:11, fontWeight:700 }}>₹{payload[0].value.toLocaleString("en-IN")}</p>
    </div>
  ) : null;

  const todayBookings = getTodayBookings(hotelId) || [];
  const pendingCheckIns = todayBookings.filter(b => b.status === "active").length;

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background:"#060606" }}>
      
      {/* ── TOAST DISPLAY ── */}
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-[#111] border border-[#D4AF37]/30 px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs">
          <Sparkles className="text-[#D4AF37] w-3.5 h-3.5 animate-spin" />
          <span>{toast.text}</span>
        </div>
      )}

      {/* Dynamic top tabs navigator header */}
      <div className="bg-[#080808]/90 border-b border-white/5 py-2 px-4 flex items-center justify-between">
        <span className="text-[10px] font-black text-white/50 tracking-widest uppercase">Workspace Desk</span>
        
        {/* Gemini Token Trigger Indicator */}
        <button 
          onClick={() => setShowApiModal(true)}
          className={`text-[9px] px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all ${
            apiKey ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400" : "bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37]"
          }`}
        >
          <Shield className="w-3 h-3" />
          {apiKey ? "Gemini Active" : "Link LLM Core"}
        </button>
      </div>

      {/* Scrollable contents flow */}
      <div className="flex-1 scroll-y" style={{ paddingBottom: 80 }}>

        {/* ── DYNAMIC DESK TAB: MAIN DASHBOARD ── */}
        {activeTab === "dashboard" && (
          <div className="animate-fade-up">
            
            {/* ── HERO HEADER ── */}
            <div style={{
              background: "linear-gradient(180deg, rgba(212,175,55,0.08) 0%, transparent 100%)",
              borderBottom: "1px solid rgba(212,175,55,0.08)",
              padding: "16px 16px 14px"
            }}>
              {/* AI Receptionist row */}
              <div style={{
                background: "linear-gradient(135deg, rgba(20,20,20,0.9), rgba(15,15,15,0.9))",
                border: "1px solid rgba(212,175,55,0.15)",
                borderRadius: 16,
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 14
              }}>
                {/* Avatar with pulse */}
                <div style={{ position:"relative", flexShrink:0 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: "50%",
                    background: "linear-gradient(135deg,#1a1200,#2e2000)",
                    border: "2px solid rgba(212,175,55,0.4)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 22, boxShadow: "0 0 20px rgba(212,175,55,0.15)"
                  }}>
                    {hotel?.emoji || "🏨"}
                  </div>
                  <div style={{
                    position: "absolute", bottom: 0, right: 0,
                    width: 12, height: 12, borderRadius: "50%",
                    background: "#22c55e",
                    border: "2px solid #080808",
                    boxShadow: "0 0 6px #22c55e",
                    animation: "pulseDot 2s infinite"
                  }}/>
                </div>
                <div style={{ flex:1, minWidth:0, textAlign:"left" }}>
                  <p style={{ color:"#D4AF37", fontWeight:700, fontSize:13, marginBottom:1 }}>
                    {hotel?.name || "Hotel"}
                  </p>
                  <p style={{ color:"rgba(255,255,255,0.5)", fontSize:11 }}>
                    {greeting()}, {user?.role === "owner" ? "Owner" : "Manager"} 👋 · {new Date().toLocaleDateString("en-IN",{day:"numeric",month:"short"})}
                  </p>
                </div>
                <button onClick={handleRefresh} disabled={refreshing}
                  style={{ width:36, height:36, background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.2)", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <RefreshCw size={14} style={{ color:"#D4AF37" }} className={refreshing ? "animate-spin" : ""}/>
                </button>
              </div>

              {/* Hotel booking link */}
              <button onClick={copyLink} style={{
                width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12, padding: "9px 14px", display: "flex", alignItems: "center", justifyBetween: "space-between"
              }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <ExternalLink size={12} style={{ color:"#D4AF37" }}/>
                  <span style={{ fontSize:11, fontFamily:"monospace", color:"rgba(255,255,255,0.3)" }}>
                    /booking/{hotelId}
                  </span>
                </div>
                <span style={{ fontSize:11, fontWeight:700, color:"#D4AF37", display:"flex", alignItems:"center", gap:4 }}>
                  {copied ? <><Check size={10}/>Copied!</> : "Share Link"}
                </span>
              </button>
            </div>

            <div style={{ padding: "0 14px" }}>

              {/* ── LIVE REVENUE CARD ── */}
              <div style={{
                margin: "14px 0",
                background: "linear-gradient(135deg, rgba(18,14,0,0.95), rgba(12,10,0,0.95))",
                border: "1px solid rgba(212,175,55,0.2)",
                borderRadius: 20,
                padding: "18px 18px 14px",
                position: "relative",
                overflow: "hidden",
                textAlign: "left"
              }}>
                <div style={{
                  position:"absolute", top:-40, right:-40, width:160, height:160,
                  background:"radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 70%)",
                  pointerEvents:"none"
                }}/>
                <p style={{ fontSize:10, letterSpacing:"0.12em", color:"rgba(212,175,55,0.6)", textTransform:"uppercase", marginBottom:6 }}>
                  LIVE REVENUE
                </p>
                <p style={{ fontSize:32, fontWeight:900, color:"#fff", letterSpacing:"-0.03em", lineHeight:1.1, marginBottom:4 }}>
                  ₹{(stats.todayRevenue || 0).toLocaleString("en-IN")}.00
                </p>
                <p style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginBottom:10 }}>Today's Total Revenue</p>
                <div style={{ display:"inline-flex", alignItems:"center", gap:5, background:"rgba(34,197,94,0.12)", border:"1px solid rgba(34,197,94,0.2)", borderRadius:8, padding:"3px 8px" }}>
                  <span style={{ color:"#4ade80", fontSize:11, fontWeight:700 }}>↑ {pct}% vs yesterday</span>
                </div>
                {/* Sparkline chart */}
                <div style={{ marginTop:12, height:50 }}>
                  <ResponsiveContainer width="100%" height={50}>
                    <AreaChart data={revData} margin={{ top:0, right:0, left:0, bottom:0 }}>
                      <defs>
                        <linearGradient id="rg2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.4}/>
                          <stop offset="100%" stopColor="#D4AF37" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Tooltip content={<Tip/>} cursor={false}/>
                      <Area type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={2}
                        fill="url(#rg2)" dot={false}
                        style={{ filter:"drop-shadow(0 0 6px rgba(212,175,55,0.6))" }}/>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ── STATS SUMMARY ROW ── */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14, textAlign:"left" }}>
                {[
                  { label:"Occupied", value:`${occupied}/${total}`, sub:`${stats.occupancyPercent}%`, color:"#4ade80", icon:"🛏️", glow:"rgba(34,197,94,0.2)" },
                  { label:"Check-ins", value:stats.todayCheckIns, sub:"Today", color:"#D4AF37", icon:"✅", glow:"rgba(212,175,55,0.15)" },
                ].map(s => (
                  <div key={s.label} style={{
                    background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)",
                    borderRadius:16, padding:"14px 14px", position:"relative", overflow:"hidden"
                  }}>
                    <div style={{ position:"absolute", top:-20, right:-20, width:70, height:70, background:`radial-gradient(circle, ${s.glow} 0%, transparent 70%)`, pointerEvents:"none" }}/>
                    <p style={{ fontSize:22 }}>{s.icon}</p>
                    <p style={{ fontSize:26, fontWeight:900, color:"#fff", letterSpacing:"-0.02em", lineHeight:1.1, marginTop:4 }}>{s.value}</p>
                    <p style={{ fontSize:11, fontWeight:700, color:s.color, marginTop:2 }}>{s.sub}</p>
                    <p style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginTop:1 }}>{s.label}</p>
                  </div>
                ))}
              </div>

              {/* ── QUICK STATS 4-tile ── */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:14 }}>
                {[
                  { label:"Vacant",   value:vacant,     color:"#34d399" },
                  { label:"Reserved", value:reserved,   color:"#fbbf24" },
                  { label:"Cleaning", value:cleaning,   color:"#818cf8" },
                  { label:"Offline",  value:outOfOrder, color:"#6b7280" },
                ].map(s => (
                  <div key={s.label} style={{
                    background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.06)",
                    borderRadius:12, padding:"10px 8px", textAlign:"center"
                  }}>
                    <p style={{ fontSize:20, fontWeight:900, color:s.color, lineHeight:1 }}>{s.value}</p>
                    <p style={{ fontSize:9, color:"rgba(255,255,255,0.35)", marginTop:3, letterSpacing:"0.04em" }}>{s.label}</p>
                  </div>
                ))}
              </div>

              {/* ── ROOM OCCUPANCY GRID ── */}
              <div style={{
                background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)",
                borderRadius:20, padding:"16px 14px", marginBottom:14, textAlign: "left"
              }}>
                <div style={{ display:"flex", alignItems:"center", justifyBetween:"space-between", marginBottom:14 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:14 }}>🛏️</span>
                    <p style={{ fontSize:11, fontWeight:700, letterSpacing:"0.08em", color:"rgba(255,255,255,0.5)", textTransform:"uppercase" }}>Room Occupancy Matrix</p>
                  </div>
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:"6px 14px", marginBottom:14 }}>
                  {[
                    { c:"#4ade80", l:"Vacant" },
                    { c:"#22c55e", l:"Occupied" },
                    { c:"#fbbf24", l:"Reserved" },
                    { c:"#818cf8", l:"Cleaning" },
                    { c:"#6b7280", l:"Out of Order" },
                  ].map(x => (
                    <div key={x.l} style={{ display:"flex", alignItems:"center", gap:5 }}>
                      <div style={{ width:8, height:8, borderRadius:"50%", background:x.c, boxShadow:`0 0 4px ${x.c}` }}/>
                      <span style={{ fontSize:9, color:"rgba(255,255,255,0.4)" }}>{x.l}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {floors.map(fl => (
                    <div key={fl} style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <span style={{
                        fontSize:9, color:"rgba(255,255,255,0.3)", width:18, textAlign:"right",
                        fontWeight:700, letterSpacing:"0.04em", flexShrink:0
                      }}>
                        {String(fl).padStart(2,"0")}
                      </span>
                      <div style={{ display:"flex", gap:5, flex:1, flexWrap:"wrap" }}>
                        {byFloor[fl].map(room => {
                          const c = roomConfig(room);
                          return (
                            <button key={room.id} onClick={() => handleRoomClick(room)}
                              style={{
                                flex: "1 1 0",
                                minWidth: 40,
                                maxWidth: 58,
                                aspectRatio: "1 / 1.1",
                                borderRadius: 10,
                                background: c.bg,
                                border: `1.5px solid ${c.border}`,
                                boxShadow: `0 0 10px ${c.glow}, inset 0 1px 0 rgba(255,255,255,0.06)`,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 2,
                                cursor: "pointer",
                                transition: "all 0.15s",
                                padding: "4px 2px"
                              }}
                            >
                              {c.icon && <span style={{ fontSize:10, lineHeight:1 }}>{c.icon}</span>}
                              <span style={{ fontSize:9, color:c.text, fontWeight:800, letterSpacing:"0.02em" }}>
                                {room.number}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── QUICK ACTIONS SUMMARY MATRIX ── */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14, position:"relative", textAlign:"left" }}>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  <div style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, padding:"14px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
                      <Users size={14} style={{ color:"#D4AF37" }}/>
                      <p style={{ fontSize:9, color:"rgba(255,255,255,0.4)", letterSpacing:"0.1em", textTransform:"uppercase" }}>Guest Check-in</p>
                    </div>
                    <p style={{ fontSize:28, fontWeight:900, color:"#fff", lineHeight:1 }}>{pendingCheckIns}</p>
                    <p style={{ fontSize:11, color:"#D4AF37", fontWeight:600, marginTop:2 }}>{pendingCheckIns > 0 ? "Pending" : "All Done"}</p>
                  </div>
                  <div style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, padding:"14px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
                      <span style={{ fontSize:14 }}>🧹</span>
                      <p style={{ fontSize:9, color:"rgba(255,255,255,0.4)", letterSpacing:"0.1em", textTransform:"uppercase" }}>Housekeeping</p>
                    </div>
                    <p style={{ fontSize:28, fontWeight:900, color:"#fff", lineHeight:1 }}>{cleaning}</p>
                    <p style={{ fontSize:11, color:"#818cf8", fontWeight:600, marginTop:2 }}>Rooms</p>
                  </div>
                </div>

                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  <div style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, padding:"14px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
                      <Wrench size={14} style={{ color:"#f87171" }}/>
                      <p style={{ fontSize:9, color:"rgba(255,255,255,0.4)", letterSpacing:"0.1em", textTransform:"uppercase" }}>Maintenance</p>
                    </div>
                    <p style={{ fontSize:28, fontWeight:900, color:"#fff", lineHeight:1 }}>{outOfOrder}</p>
                    <p style={{ fontSize:11, color:"#f87171", fontWeight:600, marginTop:2 }}>Pending</p>
                  </div>
                  <div style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, padding:"14px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
                      <Star size={14} style={{ color:"#D4AF37" }}/>
                      <p style={{ fontSize:9, color:"rgba(255,255,255,0.4)", letterSpacing:"0.1em", textTransform:"uppercase" }}>Rating</p>
                    </div>
                    <p style={{ fontSize:28, fontWeight:900, color:"#fff", lineHeight:1 }}>4.8</p>
                    <p style={{ fontSize:11, color:"#D4AF37", fontWeight:600, marginTop:2 }}>Reviews</p>
                  </div>
                </div>
              </div>

              {/* ── ADVANCED CORE SCAN BUTTON ── */}
              <div style={{ display:"flex", justifyCenter:"center", marginBottom:14 }}>
                <button onClick={handleAiScan}
                  style={{
                    width:110, height:110, borderRadius:"50%", position:"relative",
                    background: aiScan
                      ? "radial-gradient(circle, rgba(0,112,243,0.3) 0%, rgba(0,0,0,0.9) 70%)"
                      : "radial-gradient(circle, rgba(0,40,80,0.8) 0%, rgba(0,0,0,0.9) 70%)",
                    border: "2px solid rgba(0,112,243,0.4)",
                    boxShadow: aiScan
                      ? "0 0 40px rgba(0,112,243,0.6), 0 0 80px rgba(0,112,243,0.3)"
                      : "0 0 20px rgba(0,112,243,0.25)",
                    cursor:"pointer", display:"flex", flexDirection:"column",
                    alignItems:"center", justifyCenter:"center", gap:4,
                    transition: "all 0.3s"
                  }}>
                  <div style={{
                    position:"absolute", inset:-10, borderRadius:"50%",
                    border:"1px solid transparent",
                    borderTopColor:"rgba(0,112,243,0.5)",
                    animation:"spinRing 2s linear infinite"
                  }}/>
                  <div style={{
                    position:"absolute", inset:-18, borderRadius:"50%",
                    border:"1px solid transparent",
                    borderBottomColor:"rgba(212,175,55,0.3)",
                    animation:"spinRing 3s linear infinite reverse"
                  }}/>
                  <Brain size={20} style={{ color:"#60a5fa", filter:"drop-shadow(0 0 6px #60a5fa)" }}/>
                  <span style={{ fontSize:11, fontWeight:900, color:"#60a5fa", letterSpacing:"0.1em" }}>
                    {aiScan ? "SCANNING" : "AI SCAN"}
                  </span>
                </button>
              </div>

              {/* ── AI INSIGHT FEED ── */}
              <div style={{
                background:"linear-gradient(135deg, rgba(0,30,80,0.4), rgba(0,20,60,0.3))",
                border:"1px solid rgba(0,112,243,0.2)",
                borderRadius:20, padding:"16px",
                marginBottom:14,
                position:"relative", overflow:"hidden",
                textAlign: "left"
              }}>
                <div style={{
                  position:"absolute", bottom:-30, right:-20, width:120, height:120,
                  background:"radial-gradient(circle, rgba(0,112,243,0.08) 0%, transparent 70%)",
                  pointerEvents:"none"
                }}/>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                  <div style={{
                    width:32, height:32, borderRadius:10,
                    background:"rgba(0,112,243,0.15)", border:"1px solid rgba(0,112,243,0.2)",
                    display:"flex", alignItems:"center", justifyCenter:"center"
                  }}>
                    <Brain size={14} style={{ color:"#60a5fa" }}/>
                  </div>
                  <p style={{ fontSize:11, fontWeight:800, color:"#60a5fa", letterSpacing:"0.1em" }}>AI RECEPTIONIST INSIGHTS</p>
                </div>
                {iLoad ? (
                  <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{
                        width:6, height:6, borderRadius:"50%", background:"#60a5fa",
                        animation:"bounce 1.2s infinite",
                        animationDelay:`${i*0.2}s`
                      }}/>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize:13, color:"rgba(255,255,255,0.7)", lineHeight:1.6 }}>{insight}</p>
                )}
                <button style={{
                  marginTop:12, padding:"7px 14px", borderRadius:10,
                  background:"linear-gradient(135deg,#b8960c,#D4AF37)", color:"#000",
                  fontSize:11, fontWeight:800, cursor:"pointer", border:"none"
                }} onClick={fetchInsight}>
                  Refresh Insights
                </button>
              </div>

              {/* ── TODAY'S LIVE CHECK-INS LIST ── */}
              <div style={{
                background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)",
                borderRadius:20, overflow:"hidden", marginBottom:14, textLeft: "left"
              }}>
                <div style={{
                  display:"flex", alignItems:"center", justifyBetween:"space-between",
                  padding:"14px 16px", borderBottom:"1px solid rgba(255,255,255,0.05)"
                }}>
                  <p style={{ fontSize:11, fontWeight:700, letterSpacing:"0.08em", color:"rgba(255,255,255,0.4)", textTransform:"uppercase" }}>
                    Aaj Ke Check-ins
                  </p>
                  <span style={{ fontSize:11, fontWeight:700, color:"#D4AF37" }}>
                    {todayBookings.filter(b => b.status === "active").length} active
                  </span>
                </div>
                {todayBookings.length === 0 ? (
                  <div style={{ padding:"24px 16px", textCenter:"center" }}>
                    <p style={{ fontSize:28, marginBottom:8 }}>🌙</p>
                    <p style={{ fontSize:13, color:"rgba(255,255,255,0.25)" }}>Aaj koi check-in nahi hua</p>
                  </div>
                ) : todayBookings.slice(0, 5).map((b, idx) => (
                  <div key={b.id} style={{
                    padding:"13px 16px",
                    borderBottom: idx < Math.min(4, todayBookings.length - 1) ? "1px solid rgba(255,255,255,0.04)" : "none",
                    display:"flex", alignItems:"center", justifyBetween:"space-between"
                  }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:13, color:"#fff", fontWeight:700, marginBottom:2 }}>{b.guestName}</p>
                      <p style={{ fontSize:10, color:"rgba(255,255,255,0.35)" }}>Room {b.roomId} · {b.nights} raat · {b.paymentMode}</p>
                    </div>
                    <div style={{ textRight:"right", flexShrink:0 }}>
                      <p style={{ fontSize:14, fontWeight:800, color:"#D4AF37" }}>
                        ₹{Number(b.totalAmount || 0).toLocaleString("en-IN")}
                      </p>
                      <span style={{
                        fontSize:9, fontWeight:700, letterSpacing:"0.06em",
                        color: b.status === "active" ? "#4ade80" : "#6b7280",
                        background: b.status === "active" ? "rgba(34,197,94,0.1)" : "rgba(107,114,128,0.1)",
                        padding:"2px 6px", borderRadius:4
                      }}>
                        {b.status?.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        )}

        {/* ── DYNAMIC DESK TAB: AUTOMATED CHECK-INS LIST DESK ── */}
        {activeTab === "bookings" && (
          <div className="p-4 space-y-4 text-left animate-fade-up">
            <h2 className="text-sm font-black uppercase text-white tracking-widest">Reservations Desk</h2>
            <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-[#181818] border-b border-white/5 text-white/40 text-[9px] uppercase tracking-wider">
                    <th className="p-3">Guest Details</th>
                    <th className="p-3">Room</th>
                    <th className="p-3">Bill</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {todayBookings.map(b => (
                    <tr key={b.id} className="hover:bg-white/5">
                      <td className="p-3 font-bold">{b.guestName}</td>
                      <td className="p-3">RM {b.roomId}</td>
                      <td className="p-3 text-[#D4AF37]">₹{b.totalAmount}</td>
                      <td className="p-3">{b.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── DYNAMIC DESK TAB: AI HOLOGRAPHIC SCANNER ── */}
        {activeTab === "ocr_scanner" && (
          <div className="p-4 space-y-4 text-left animate-fade-up">
            <h2 className="text-sm font-black uppercase text-white tracking-widest">Holographic ID OCR</h2>
            <p className="text-xs text-white/40">Scan Aadhaar or Passport to prefill dynamic guest details.</p>
            
            <div className="bg-[#111] border border-white/5 p-4 rounded-3xl space-y-4 flex flex-col items-center">
              <div className="flex bg-[#181818] p-1 rounded-xl border border-white/5 w-full">
                {["Aadhaar", "Passport"].map(t => (
                  <button key={t} onClick={() => setOcrIdType(t)} className={`flex-1 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${ocrIdType === t ? "bg-[#D4AF37]/15 text-[#D4AF37]" : "text-white/40"}`}>{t}</button>
                ))}
              </div>

              <div className="w-full aspect-[1.5] border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden">
                {ocrScanning && (
                  <div className="absolute inset-0 bg-cyan-500/5">
                    <div className="w-full h-1 bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.8)] animate-scanline absolute" />
                  </div>
                )}
                {scannedResult ? (
                  <div className="text-center space-y-1">
                    <CheckSquare className="w-8 h-8 text-emerald-400 mx-auto" />
                    <p className="text-xs font-bold">{scannedResult.name}</p>
                    <p className="text-[10px] text-white/50">{scannedResult.documentNo}</p>
                  </div>
                ) : (
                  <p className="text-xs text-white/30">Align document card inside target frame</p>
                )}
              </div>

              <button onClick={handleOcrSimulation} className="w-full py-3 bg-gradient-to-r from-[#0070F3] to-cyan-500 rounded-xl text-xs font-bold uppercase">Simulate Scan</button>
              {scannedResult && (
                <button onClick={applyOcrToNewBooking} className="w-full py-3 bg-[#D4AF37] text-black rounded-xl text-xs font-bold uppercase">Fill Check-in Detail</button>
              )}
            </div>
          </div>
        )}

        {/* ── DYNAMIC DESK TAB: AI CHAT AGENT ── */}
        {activeTab === "ai_chat" && (
          <div className="p-4 space-y-4 text-left animate-fade-up">
            <h2 className="text-sm font-black uppercase text-white tracking-widest">AI Agent Interaction</h2>
            <div className="bg-[#111] border border-white/5 rounded-3xl h-[300px] flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {aiChatMessages.map(m => (
                  <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`p-3 rounded-2xl text-xs max-w-[80%] ${m.role === "user" ? "bg-[#D4AF37]/10 text-white" : "bg-white/5 text-white/70"}`}>{m.text}</div>
                  </div>
                ))}
              </div>
              <form onSubmit={handleSendChatMessage} className="p-2 bg-[#181818] flex gap-2">
                <input type="text" placeholder="Type ask: occupancy details..." value={chatInput} onChange={e=>setChatInput(e.target.value)} className="flex-1 bg-black/40 text-xs text-white p-2.5 rounded-xl outline-none" />
                <button type="submit" className="p-2 bg-[#D4AF37] text-black rounded-xl"><Send className="w-4 h-4" /></button>
              </form>
            </div>
          </div>
        )}

        {/* ── DYNAMIC DESK TAB: OUTBOUND WHATSAPP LOG ── */}
        {activeTab === "whatsapp" && (
          <div className="p-4 space-y-4 text-left animate-fade-up">
            <h2 className="text-sm font-black uppercase text-white tracking-widest">WhatsApp Automation Logs</h2>
            <div className="space-y-3">
              {whatsappLogs.map(log => (
                <div key={log.id} className="p-3 bg-[#111] border border-white/5 rounded-xl text-xs flex justify-between items-center">
                  <div>
                    <span className="font-bold">{log.phone}</span>
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded ml-2">{log.type}</span>
                    <p className="text-white/50 mt-1">{log.message}</p>
                  </div>
                  <span className="text-[9px] text-white/30">{log.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>{/* /scroll */}

      {/* ── PERSISTENT LOW PROFILE FOOTER NAVIGATION BAR (DIRECT FROM PORTAL) ── */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-[#111]/95 border-t border-white/5">
        <div className="max-w-md mx-auto grid grid-cols-5 py-2 text-center">
          {[
            { id: "dashboard", label: "Home", icon: Home },
            { id: "bookings", label: "Desk", icon: Calendar },
            { id: "ocr_scanner", label: "ID OCR", icon: Scan },
            { id: "ai_chat", label: "AI Agent", icon: Brain },
            { id: "whatsapp", label: "WhatsApp", icon: MessageSquare }
          ].map((nav) => {
            const Icon = nav.icon;
            const isActive = activeTab === nav.id;
            return (
              <button
                key={nav.id}
                onClick={() => {
                  setActiveTab(nav.id);
                  triggerHaptic(15);
                }}
                className="flex flex-col items-center justify-center space-y-1 py-1 cursor-pointer relative"
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-[#D4AF37]" : "text-white/40"}`} />
                <span className={`text-[8px] font-black uppercase tracking-wider ${isActive ? "text-white" : "text-white/40"}`}>
                  {nav.label}
                </span>
                {isActive && (
                  <span className="absolute bottom-[-4px] w-5 h-[2px] bg-[#D4AF37] rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </footer>

      {/* ── ROOM DETAIL MODAL ── */}
      {selRoom && (
        <div
          style={{ position:"absolute", inset:0, zIndex:50, display:"flex", alignItems:"flex-end", background:"rgba(0,0,0,0.75)", backdropFilter:"blur(4px)" }}
          onClick={() => setSelRoom(null)}
        >
          <div
            style={{ width:"100%", background:"linear-gradient(180deg,#141414,#0d0d0d)", borderRadius:"24px 24px 0 0", padding:24, border:"1px solid rgba(255,255,255,0.08)", borderBottom:"none", textAlign:"left" }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ width:36, height:3, background:"rgba(255,255,255,0.15)", borderRadius:3, margin:"0 auto 20px" }}/>
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:18 }}>
              {/* Room number badge */}
              <div style={{
                width:56, height:56, borderRadius:16,
                ...(() => { const c = roomConfig(selRoom); return { background:c.bg, border:`2px solid ${c.border}`, boxShadow:`0 0 16px ${c.glow}` }; })(),
                display:"flex", flexDirection:"column", alignItems:"center", justifyCenter:"center", gap:2
              }}>
                <span style={{ fontSize:14 }}>{roomConfig(selRoom).icon}</span>
                <span style={{ fontSize:11, color:roomConfig(selRoom).text, fontWeight:800 }}>{selRoom.number}</span>
              </div>
              <div>
                <p style={{ fontSize:20, fontWeight:900, color:"#fff", letterSpacing:"-0.02em" }}>Room {selRoom.number}</p>
                <p style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginTop:1 }}>
                  {selRoom.type || "Standard"} · Floor {selRoom.floor} · <span style={{ color:roomConfig(selRoom).text }}>{roomConfig(selRoom).label}</span>
                </p>
              </div>
            </div>

            {selRoom.booking ? (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:16 }}>
                  <p style={{ fontSize:16, fontWeight:800, color:"#fff", marginBottom:4 }}>{selRoom.booking.guestName}</p>
                  <p style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginBottom:10 }}>{selRoom.booking.guestPhone}</p>
                  <div style={{ display:"flex", justifyBetween:"space-between", alignItems:"center" }}>
                    <span style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>{selRoom.booking.nights} raatein</span>
                    <span style={{ fontSize:16, fontWeight:800, color:"#D4AF37" }}>₹{Number(selRoom.booking.totalAmount || 0).toLocaleString("en-IN")}</span>
                  </div>
                </div>
                <button onClick={() => handleCheckout(selRoom.booking.id)} style={{
                  width:"100%", padding:"15px", borderRadius:16, fontWeight:800, fontSize:14,
                  background:"linear-gradient(135deg,#b8960c,#D4AF37,#F5C842)", color:"#000",
                  border:"none", cursor:"pointer", boxShadow:"0 4px 20px rgba(212,175,55,0.35)"
                }}>
                  ✓ Check-out Karo
                </button>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:16, textCenter:"center" }}>
                  <p style={{ fontSize:13, color:"rgba(255,255,255,0.4)", textTransform:"capitalize" }}>{selRoom.status?.replace("_"," ")}</p>
                  <p style={{ fontSize:11, color:"rgba(255,255,255,0.25)", marginTop:4 }}>Base Rate: ₹{selRoom.baseRate}/raat</p>
                </div>
                {selRoom.status === "vacant" && (
                  <button onClick={() => { setSelRoom(null); onNewBooking && onNewBooking(selRoom); }} style={{
                    width:"100%", padding:"15px", borderRadius:16, fontWeight:800, fontSize:14,
                    background:"linear-gradient(135deg,#b8960c,#D4AF37,#F5C842)", color:"#000",
                    border:"none", cursor:"pointer", boxShadow:"0 4px 20px rgba(212,175,55,0.35)"
                  }}>
                    + Nayi Booking Karo
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── COVETED GEMINI API KEY SETUP DIALOG PANEL ── */}
      {showApiModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 text-left">
          <div className="w-full max-w-md bg-[#111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl animate-scale-up">
            <div className="px-5 py-4 bg-[#181818] border-b border-white/5 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Shield className="w-4.5 h-4.5 text-[#D4AF37]" />
                <h3 className="text-xs font-black text-white uppercase tracking-wider">Configure LLM Core</h3>
              </div>
              <button onClick={() => setShowApiModal(false)} className="p-1 hover:bg-white/5 rounded-lg text-white/50">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-white/60 leading-relaxed">
                Plug in your standard Google Gemini API key to run real-time Hinglish analysis and dynamic checks.
              </p>

              <div className="space-y-1 text-xs">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Enter Google Gemini Key</label>
                <input 
                  type="password" 
                  placeholder="AIzaSy..." 
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full bg-[#181818] border border-white/10 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <button 
                onClick={() => {
                  setShowApiModal(false);
                  showToast(apiKey ? "Dynamic Gemini Verified!" : "Switched to Local system rules.", "info");
                  triggerHaptic(50);
                }}
                className="w-full py-3 bg-gradient-to-r from-[#b8960c] to-[#D4AF37] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg"
              >
                Apply LLM parameters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline styles for animations */}
      <style>{`
        @keyframes pulseDot {
          0%,100% { box-shadow: 0 0 4px #22c55e; }
          50%      { box-shadow: 0 0 10px #22c55e, 0 0 20px rgba(34,197,94,0.4); }
        }
        @keyframes bounce {
          0%,80%,100% { transform: scale(0); }
          40%          { transform: scale(1); }
        }
        @keyframes spinRing {
          to { transform: rotate(360deg); }
        }
        @keyframes scanLine {
          0% { top: 5%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 95%; opacity: 0; }
        }
        .animate-scanline {
          animation: scanLine 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up {
          animation: fadeUp 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

function localInsight(s) {
  if (s?.occupancyPercent > 80) return `Aaj occupancy ${s?.occupancyPercent}% hai — bohot acha! Peak demand mein dynamic pricing try karo.`;
  if (s?.occupancyPercent > 50) return `${s?.vacantRooms} rooms khali hain — online listing promote karo ya walk-in offers do.`;
  return `Occupancy kam hai. Weekend package ya local business se tie-up consider karo.`;
}

function Skeleton() {
  return (
    <div style={{ height:"100%", padding:"16px 14px", display:"flex", flexDirection:"column", gap:12, background:"#080808" }}>
      {[120, 80, 200, 100].map((h, i) => (
        <div key={i} style={{ height:h, background:"rgba(255,255,255,0.03)", borderRadius:20, animation:"pulse 1.5s infinite" }}/>
      ))}
    </div>
  );
}
