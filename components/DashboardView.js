"use client";
import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw, ExternalLink, Check, Brain, Wrench, Star, Users, Home,
  Menu, Bell, Bed, Calendar, UserCircle, Settings, BarChart3, ChevronDown
} from "lucide-react";
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
  const [stats, setStats] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [insight, setInsight] = useState("Aaj ki demand analysis ho rahi hai...");
  const [iLoad, setILoad] = useState(false);
  const [selRoom, setSelRoom] = useState(null);
  const [revData, setRevData] = useState([]);
  const [refreshing, setRefresh] = useState(false);
  const [copied, setCopied] = useState(false);
  const [aiScan, setAiScan] = useState(false);

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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "ai_insight", stats: s, hotelName: hotel?.name }),
      });
      const d = await r.json();
      setInsight(d.insight || localInsight(s));
    } catch {
      setInsight(localInsight(getTodayStats(hotelId)));
    }
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
    if (navigator.vibrate) navigator.vibrate([30, 20, 30]);
    await fetchInsight();
    setTimeout(() => setAiScan(false), 2000);
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

  // Status config - matching 2nd image
  const roomConfig = (r) => {
    if (r.status === "occupied")
      return {
        bg: "linear-gradient(145deg, #1a5a1a, #0d3a0d)",
        border: "rgba(34,197,94,0.7)",
        text: "#4ade80",
        glow: "rgba(34,197,94,0.35)",
        hasIcon: true,
        label: "Occupied"
      };
    if (r.status === "reserved")
      return {
        bg: "linear-gradient(145deg, #5a4510, #3a2d08)",
        border: "rgba(212,175,55,0.7)",
        text: "#fbbf24",
        glow: "rgba(212,175,55,0.3)",
        hasIcon: false,
        label: "Reserved"
      };
    if (r.status === "cleaning")
      return {
        bg: "linear-gradient(145deg, #1a1a5a, #0d0d3a)",
        border: "rgba(99,102,241,0.7)",
        text: "#818cf8",
        glow: "rgba(99,102,241,0.3)",
        hasIcon: false,
        label: "Cleaning"
      };
    if (r.status === "out_of_order")
      return {
        bg: "linear-gradient(145deg, #2a2a2a, #1a1a1a)",
        border: "rgba(75,85,99,0.5)",
        text: "#9ca3af",
        glow: "transparent",
        hasIcon: true,
        label: "Out of Order"
      };
    return {
      bg: "linear-gradient(145deg, #5a1a1a, #3a0d0d)",
      border: "rgba(239,68,68,0.6)",
      text: "#f87171",
      glow: "rgba(239,68,68,0.2)",
      hasIcon: false,
      label: "Vacant"
    };
  };

  const occupied = rooms.filter(r => r.status === "occupied").length;
  const vacant = rooms.filter(r => r.status === "vacant").length;
  const reserved = rooms.filter(r => r.status === "reserved").length;
  const cleaning = rooms.filter(r => r.status === "cleaning").length;
  const outOfOrder = rooms.filter(r => r.status === "out_of_order").length;
  const total = rooms.length || 1;

  const occupancyPercent = Math.round((occupied / total) * 100);
  const reservedPercent = Math.round((reserved / total) * 100);
  const vacantPercent = Math.round((vacant / total) * 100);
  const outOfOrderPercent = Math.round((outOfOrder / total) * 100);

  const Tip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    return (
      <div style={{
        background: "rgba(0,0,0,0.9)",
        border: "1px solid rgba(212,175,55,0.4)",
        borderRadius: 10,
        padding: "8px 12px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.5)"
      }}>
        <p style={{ color: "#D4AF37", fontSize: 12, fontWeight: 800 }}>
          ₹{payload[0].value.toLocaleString("en-IN")}
        </p>
      </div>
    );
  };

  const todayBookings = getTodayBookings(hotelId);
  const pendingCheckIns = todayBookings.filter(b => b.status === "active").length;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden", background: "#080808" }}>
      <div className="scroll-y" style={{ flex: 1, paddingBottom: 90 }}>

        {/* TOP NAV BAR */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          background: "linear-gradient(180deg, rgba(212,175,55,0.06) 0%, transparent 100%)"
        }}>
          <button style={{
            width: 40, height: 40, borderRadius: 12,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer"
          }}>
            <Menu size={20} color="rgba(255,255,255,0.6)" />
          </button>

          <div style={{ textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <div style={{
                width: 28, height: 28,
                background: "linear-gradient(135deg, #D4AF37, #F5C842)",
                borderRadius: 6,
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <Home size={16} color="#000" />
              </div>
              <div>
                <p style={{
                  fontSize: 16, fontWeight: 800, color: "#D4AF37",
                  letterSpacing: "0.02em", lineHeight: 1.2
                }}>
                  {hotel?.name || "Hotel"}
                </p>
                <p style={{
                  fontSize: 8, fontWeight: 600, color: "rgba(212,175,55,0.5)",
                  letterSpacing: "0.15em", textTransform: "uppercase"
                }}>
                  AI-POWERED HOTEL MANAGEMENT
                </p>
              </div>
            </div>
          </div>

          <button style={{
            width: 40, height: 40, borderRadius: 12,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative",
            cursor: "pointer"
          }}>
            <Bell size={20} color="rgba(255,255,255,0.6)" />
            <div style={{
              position: "absolute", top: 8, right: 8,
              width: 8, height: 8, borderRadius: "50%",
              background: "#ef4444",
              border: "2px solid #080808"
            }} />
          </button>
        </div>

        {/* AI RECEPTIONIST CARD */}
        <div style={{ padding: "0 16px", marginBottom: 14 }}>
          <div style={{
            background: "linear-gradient(135deg, rgba(20,20,20,0.95), rgba(12,12,12,0.95))",
            border: "1px solid rgba(212,175,55,0.15)",
            borderRadius: 20,
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: 14
          }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{
                width: 52, height: 52, borderRadius: "50%",
                background: "linear-gradient(135deg, #1a1200, #2e2000)",
                border: "2px solid rgba(212,175,55,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center",
                overflow: "hidden",
                boxShadow: "0 0 20px rgba(212,175,55,0.15)"
              }}>
                <UserCircle size={32} color="#D4AF37" />
              </div>
              <div style={{
                position: "absolute", bottom: -2, right: -2,
                width: 20, height: 20, borderRadius: "50%",
                background: "linear-gradient(135deg, #0070F3, #60a5fa)",
                border: "2px solid #080808",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 1, height: 8 }}>
                  <div style={{ width: 2, height: 4, borderRadius: 1, background: "#fff" }} />
                  <div style={{ width: 2, height: 8, borderRadius: 1, background: "#fff" }} />
                  <div style={{ width: 2, height: 5, borderRadius: 1, background: "#fff" }} />
                </div>
              </div>
              <div style={{
                position: "absolute", top: 0, right: 0,
                width: 12, height: 12, borderRadius: "50%",
                background: "#22c55e",
                border: "2px solid #080808",
                boxShadow: "0 0 6px #22c55e"
              }} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: "#D4AF37", fontWeight: 800, fontSize: 15, marginBottom: 2 }}>
                AI Receptionist
              </p>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, lineHeight: 1.4 }}>
                {greeting()}, {user?.role === "owner" ? "Owner" : "Manager"} 👋
              </p>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 2 }}>
                Here&apos;s your operational overview.
              </p>
            </div>

            <button onClick={handleRefresh} disabled={refreshing}
              style={{
                width: 36, height: 36,
                background: "rgba(212,175,55,0.1)",
                border: "1px solid rgba(212,175,55,0.2)",
                borderRadius: 10,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
                cursor: "pointer"
              }}>
              <RefreshCw size={14} style={{ color: "#D4AF37" }} className={refreshing ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* BOOKING LINK */}
        <div style={{ padding: "0 16px", marginBottom: 14 }}>
          <button onClick={copyLink} style={{
            width: "100%",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12,
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ExternalLink size={12} style={{ color: "#D4AF37" }} />
              <span style={{ fontSize: 11, fontFamily: "monospace", color: "rgba(255,255,255,0.3)" }}>
                /booking/{hotelId}
              </span>
            </div>
            <span style={{
              fontSize: 11, fontWeight: 700, color: "#D4AF37",
              display: "flex", alignItems: "center", gap: 4
            }}>
              {copied ? <><Check size={10} /> Copied!</> : "Share Link"}
            </span>
          </button>
        </div>

        <div style={{ padding: "0 14px" }}>

          {/* LIVE REVENUE CARD */}
          <div style={{
            margin: "14px 0",
            background: "linear-gradient(135deg, rgba(18,14,0,0.95), rgba(8,6,0,0.95))",
            border: "1px solid rgba(212,175,55,0.25)",
            borderRadius: 24,
            padding: "20px 20px 16px",
            position: "relative",
            overflow: "hidden"
          }}>
            <div style={{
              position: "absolute", top: -50, right: -30,
              width: 200, height: 200,
              background: "radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)",
              pointerEvents: "none"
            }} />
            <p style={{
              fontSize: 10, letterSpacing: "0.15em",
              color: "rgba(212,175,55,0.5)",
              textTransform: "uppercase", marginBottom: 8,
              fontWeight: 700
            }}>
              LIVE REVENUE
            </p>
            <p style={{
              fontSize: 34, fontWeight: 900, color: "#D4AF37",
              letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: 4,
              textShadow: "0 0 30px rgba(212,175,55,0.3)"
            }}>
              ₹{stats.todayRevenue.toLocaleString("en-IN")}.00
            </p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 10 }}>
              Today&apos;s Total Revenue
            </p>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              background: "rgba(34,197,94,0.12)",
              border: "1px solid rgba(34,197,94,0.25)",
              borderRadius: 8, padding: "4px 10px"
            }}>
              <span style={{ color: "#4ade80", fontSize: 11, fontWeight: 800 }}>
                ↑ {pct}% vs yesterday
              </span>
            </div>
            <div style={{ marginTop: 14, height: 60, position: "relative" }}>
              <ResponsiveContainer width="100%" height={60}>
                <AreaChart data={revData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rg2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Tooltip content={<Tip />} cursor={false} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#D4AF37"
                    strokeWidth={2.5}
                    fill="url(#rg2)"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
              {revData.length > 0 && (
                <div style={{
                  position: "absolute",
                  right: 0, top: "20%",
                  width: 10, height: 10, borderRadius: "50%",
                  background: "#D4AF37",
                  boxShadow: "0 0 12px #D4AF37, 0 0 24px rgba(212,175,55,0.5)",
                  transform: "translate(50%, -50%)"
                }} />
              )}
            </div>
          </div>

          {/* ROOM OCCUPANCY GRID */}
          <div style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 24,
            padding: "18px 14px",
            marginBottom: 14
          }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 14
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Bed size={16} color="rgba(255,255,255,0.5)" />
                <p style={{
                  fontSize: 11, fontWeight: 800, letterSpacing: "0.1em",
                  color: "rgba(255,255,255,0.5)", textTransform: "uppercase"
                }}>
                  Room Occupancy
                </p>
              </div>
              <div style={{
                display: "flex", alignItems: "center", gap: 4,
                fontSize: 10, color: "rgba(255,255,255,0.3)",
                background: "rgba(255,255,255,0.03)",
                padding: "4px 10px", borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.06)"
              }}>
                <span>Tower A</span>
                <ChevronDown size={12} />
              </div>
            </div>

            <div style={{
              display: "flex", flexWrap: "wrap", gap: "8px 16px",
              marginBottom: 16, justifyContent: "center"
            }}>
              {[
                { c: "#22c55e", l: `Occupied (${occupancyPercent}%)` },
                { c: "#fbbf24", l: `Reserved (${reservedPercent}%)` },
                { c: "#ef4444", l: `Vacant (${vacantPercent}%)` },
                { c: "#6b7280", l: `Out of Order (${outOfOrderPercent}%)` },
              ].map(x => (
                <div key={x.l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: x.c,
                    boxShadow: `0 0 6px ${x.c}`
                  }} />
                  <span style={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }}>{x.l}</span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {floors.map(fl => (
                <div key={fl} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{
                    fontSize: 9, color: "rgba(255,255,255,0.25)",
                    width: 20, textAlign: "right",
                    fontWeight: 700, letterSpacing: "0.04em", flexShrink: 0
                  }}>
                    {String(fl).padStart(2, "0")}
                  </span>
                  <div style={{ display: "flex", gap: 5, flex: 1, flexWrap: "wrap" }}>
                    {byFloor[fl].map(room => {
                      const c = roomConfig(room);
                      return (
                        <button
                          key={room.id}
                          onClick={() => handleRoomClick(room)}
                          style={{
                            flex: "1 1 0",
                            minWidth: 36,
                            maxWidth: 52,
                            aspectRatio: "1 / 1",
                            borderRadius: 10,
                            background: c.bg,
                            border: `1.5px solid ${c.border}`,
                            boxShadow: `0 2px 8px ${c.glow}, inset 0 1px 0 rgba(255,255,255,0.08)`,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 2,
                            cursor: "pointer",
                            transition: "all 0.15s",
                            padding: "3px 2px"
                          }}
                        >
                          {c.hasIcon && (
                            <UserCircle size={12} color={c.text} />
                          )}
                          <span style={{
                            fontSize: 8, color: c.text,
                            fontWeight: 800, letterSpacing: "0.02em"
                          }}>
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

          {/* STATS GRID WITH CENTER AI SCAN */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 130px 1fr",
            gridTemplateRows: "1fr 1fr",
            gap: 10,
            marginBottom: 14,
            alignItems: "center"
          }}>
            {/* Top Left - Guest Check-in */}
            <div style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 18,
              padding: "14px 12px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <Users size={14} style={{ color: "#D4AF37" }} />
                <p style={{
                  fontSize: 9, color: "rgba(255,255,255,0.4)",
                  letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700
                }}>
                  Guest Check-in
                </p>
              </div>
              <p style={{ fontSize: 28, fontWeight: 900, color: "#fff", lineHeight: 1 }}>
                {pendingCheckIns}
              </p>
              <p style={{
                fontSize: 11, color: "#60a5fa", fontWeight: 700, marginTop: 4
              }}>
                {pendingCheckIns > 0 ? "Pending" : "All Done"}
              </p>
            </div>

            {/* Center - AI SCAN */}
            <div style={{
              gridRow: "1 / 3",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <button onClick={handleAiScan}
                style={{
                  width: 120, height: 120, borderRadius: "50%",
                  position: "relative",
                  background: aiScan
                    ? "radial-gradient(circle, rgba(0,112,243,0.4) 0%, rgba(0,0,0,0.95) 70%)"
                    : "radial-gradient(circle, rgba(0,60,120,0.6) 0%, rgba(0,0,0,0.95) 70%)",
                  border: "2px solid rgba(0,112,243,0.5)",
                  boxShadow: aiScan
                    ? "0 0 50px rgba(0,112,243,0.6), 0 0 100px rgba(0,112,243,0.3), inset 0 0 30px rgba(0,112,243,0.2)"
                    : "0 0 30px rgba(0,112,243,0.3), inset 0 0 20px rgba(0,112,243,0.1)",
                  cursor: "pointer",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", gap: 6,
                  transition: "all 0.4s"
                }}>
                <div style={{
                  position: "absolute", inset: -12, borderRadius: "50%",
                  border: "2px solid transparent",
                  borderTopColor: "rgba(0,112,243,0.6)",
                  borderRightColor: "rgba(0,112,243,0.2)"
                }} className="spin-slow" />
                <div style={{
                  position: "absolute", inset: -6, borderRadius: "50%",
                  border: "1px solid transparent",
                  borderBottomColor: "rgba(212,175,55,0.4)",
                  borderLeftColor: "rgba(212,175,55,0.15)"
                }} className="spin-reverse" />
                <div style={{
                  position: "absolute", inset: 4, borderRadius: "50%",
                  border: "1px dashed rgba(0,112,243,0.3)"
                }} className="spin-slower" />
                <Brain size={24} style={{ color: "#60a5fa" }} />
                <span style={{
                  fontSize: 11, fontWeight: 900, color: "#60a5fa",
                  letterSpacing: "0.12em"
                }}>
                  {aiScan ? "SCANNING" : "AI SCAN"}
                </span>
              </button>
            </div>

            {/* Top Right - Maintenance */}
            <div style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 18,
              padding: "14px 12px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <Wrench size={14} style={{ color: "#f87171" }} />
                <p style={{
                  fontSize: 9, color: "rgba(255,255,255,0.4)",
                  letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700
                }}>
                  Maintenance
                </p>
              </div>
              <p style={{ fontSize: 28, fontWeight: 900, color: "#fff", lineHeight: 1 }}>
                {outOfOrder}
              </p>
              <p style={{
                fontSize: 11, color: "#60a5fa", fontWeight: 700, marginTop: 4
              }}>
                Pending
              </p>
            </div>

            {/* Bottom Left - Housekeeping */}
            <div style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 18,
              padding: "14px 12px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: 14 }}>🧹</span>
                <p style={{
                  fontSize: 9, color: "rgba(255,255,255,0.4)",
                  letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700
                }}>
                  Housekeeping
                </p>
              </div>
              <p style={{ fontSize: 28, fontWeight: 900, color: "#fff", lineHeight: 1 }}>
                {cleaning}
              </p>
              <p style={{
                fontSize: 11, color: "#60a5fa", fontWeight: 700, marginTop: 4
              }}>
                Rooms
              </p>
            </div>

            {/* Bottom Right - Reviews */}
            <div style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 18,
              padding: "14px 12px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <Star size={14} style={{ color: "#D4AF37" }} />
                <p style={{
                  fontSize: 9, color: "rgba(255,255,255,0.4)",
                  letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700
                }}>
                  Reviews
                </p>
              </div>
              <p style={{ fontSize: 28, fontWeight: 900, color: "#fff", lineHeight: 1 }}>
                4.8
              </p>
              <p style={{
                fontSize: 11, color: "#60a5fa", fontWeight: 700, marginTop: 4
              }}>
                Rating
              </p>
            </div>
          </div>

          {/* AI INSIGHTS */}
          <div style={{
            background: "linear-gradient(135deg, rgba(0,30,80,0.3), rgba(0,15,40,0.2))",
            border: "1px solid rgba(0,112,243,0.2)",
            borderRadius: 24,
            padding: "18px",
            marginBottom: 14,
            position: "relative",
            overflow: "hidden",
            display: "flex",
            gap: 16
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: "rgba(0,112,243,0.15)",
                  border: "1px solid rgba(0,112,243,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <Brain size={14} style={{ color: "#60a5fa" }} />
                </div>
                <p style={{
                  fontSize: 11, fontWeight: 800, color: "#60a5fa",
                  letterSpacing: "0.12em"
                }}>
                  AI INSIGHTS
                </p>
              </div>
              {iLoad ? (
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#60a5fa" }} />
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#60a5fa" }} />
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#60a5fa" }} />
                </div>
              ) : (
                <p style={{
                  fontSize: 13, color: "rgba(255,255,255,0.7)",
                  lineHeight: 1.6
                }}>
                  {insight}
                </p>
              )}
              <button style={{
                marginTop: 14, padding: "8px 16px", borderRadius: 12,
                background: "linear-gradient(135deg, #b8960c, #D4AF37)",
                color: "#000", fontSize: 11, fontWeight: 800,
                cursor: "pointer", border: "none",
                boxShadow: "0 4px 16px rgba(212,175,55,0.3)"
              }} onClick={fetchInsight}>
                View Insights
              </button>
            </div>

            {/* 3D Building illustration */}
            <div style={{
              width: 100, height: 100,
              flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              position: "relative"
            }}>
              <div style={{
                width: 60, height: 80,
                position: "relative",
                transform: "perspective(100px) rotateY(-15deg) rotateX(5deg)"
              }}>
                <div style={{
                  position: "absolute", bottom: 0, left: 5,
                  width: 50, height: 70,
                  border: "1px solid rgba(0,112,243,0.4)",
                  background: "linear-gradient(180deg, rgba(0,112,243,0.1), rgba(0,112,243,0.02))",
                  borderRadius: 2
                }}>
                  <div style={{
                    position: "absolute", top: "10%", left: "15%",
                    width: "25%", height: "8%",
                    background: "rgba(0,112,243,0.3)",
                    borderRadius: 1
                  }} />
                  <div style={{
                    position: "absolute", top: "25%", left: "15%",
                    width: "25%", height: "8%",
                    background: "rgba(0,112,243,0.3)",
                    borderRadius: 1
                  }} />
                  <div style={{
                    position: "absolute", top: "40%", left: "15%",
                    width: "25%", height: "8%",
                    background: "rgba(0,112,243,0.3)",
                    borderRadius: 1
                  }} />
                  <div style={{
                    position: "absolute", top: "55%", left: "15%",
                    width: "25%", height: "8%",
                    background: "rgba(0,112,243,0.3)",
                    borderRadius: 1
                  }} />
                  <div style={{
                    position: "absolute", top: "10%", right: "15%",
                    width: "25%", height: "8%",
                    background: "rgba(0,112,243,0.3)",
                    borderRadius: 1
                  }} />
                  <div style={{
                    position: "absolute", top: "25%", right: "15%",
                    width: "25%", height: "8%",
                    background: "rgba(0,112,243,0.3)",
                    borderRadius: 1
                  }} />
                  <div style={{
                    position: "absolute", top: "40%", right: "15%",
                    width: "25%", height: "8%",
                    background: "rgba(0,112,243,0.3)",
                    borderRadius: 1
                  }} />
                  <div style={{
                    position: "absolute", top: "55%", right: "15%",
                    width: "25%", height: "8%",
                    background: "rgba(0,112,243,0.3)",
                    borderRadius: 1
                  }} />
                </div>
                <div style={{
                  position: "absolute", top: 0, left: 15,
                  width: 30, height: 25,
                  border: "1px solid rgba(0,112,243,0.4)",
                  background: "linear-gradient(180deg, rgba(0,112,243,0.15), rgba(0,112,243,0.05))",
                  borderRadius: 2
                }}>
                  <div style={{
                    position: "absolute", top: "20%", left: "25%",
                    width: "50%", height: "15%",
                    background: "rgba(0,112,243,0.4)",
                    borderRadius: 1
                  }} />
                </div>
                <div style={{
                  position: "absolute", bottom: -10, left: "50%",
                  transform: "translateX(-50%)",
                  width: 80, height: 20,
                  border: "1px solid rgba(212,175,55,0.3)",
                  borderRadius: "50%",
                  background: "radial-gradient(ellipse, rgba(212,175,55,0.1), transparent)"
                }} />
              </div>
            </div>
          </div>

          {/* TODAY'S CHECK-INS */}
          <div style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 24,
            overflow: "hidden",
            marginBottom: 14
          }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 16px",
              borderBottom: "1px solid rgba(255,255,255,0.05)"
            }}>
              <p style={{
                fontSize: 11, fontWeight: 800, letterSpacing: "0.1em",
                color: "rgba(255,255,255,0.4)", textTransform: "uppercase"
              }}>
                Aaj Ke Check-ins
              </p>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#D4AF37" }}>
                {todayBookings.filter(b => b.status === "active").length} active
              </span>
            </div>
            {todayBookings.length === 0 ? (
              <div style={{ padding: "28px 16px", textAlign: "center" }}>
                <p style={{ fontSize: 32, marginBottom: 10 }}>🌙</p>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }}>
                  Aaj koi check-in nahi hua
                </p>
              </div>
            ) : todayBookings.slice(0, 5).map((b, idx) => (
              <div key={b.id} style={{
                padding: "13px 16px",
                borderBottom: idx < Math.min(4, todayBookings.length - 1)
                  ? "1px solid rgba(255,255,255,0.04)" : "none",
                display: "flex", alignItems: "center", justifyContent: "space-between"
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: 13, color: "#fff", fontWeight: 700, marginBottom: 2
                  }}>
                    {b.guestName}
                  </p>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
                    Room {b.roomId} · {b.nights} raat · {b.paymentMode}
                  </p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 800, color: "#D4AF37" }}>
                    ₹{Number(b.totalAmount || 0).toLocaleString("en-IN")}
                  </p>
                  <span style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: "0.06em",
                    color: b.status === "active" ? "#4ade80" : "#6b7280",
                    background: b.status === "active"
                      ? "rgba(34,197,94,0.1)" : "rgba(107,114,128,0.1)",
                    padding: "2px 6px", borderRadius: 4
                  }}>
                    {b.status?.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* BOTTOM NAVIGATION */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "linear-gradient(180deg, transparent, rgba(8,8,8,0.95) 20%, #080808)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "8px 0 20px",
        zIndex: 40,
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center"
      }}>
        {[
          { icon: Home, label: "Dashboard", active: true },
          { icon: Calendar, label: "Bookings", active: false },
          { icon: Users, label: "Guests", active: false },
          { icon: Settings, label: "Operations", active: false },
          { icon: BarChart3, label: "Reports", active: false },
        ].map(item => (
          <button
            key={item.label}
            onClick={() => item.active ? null : onNavigate?.(item.label.toLowerCase())}
            style={{
              display: "flex", flexDirection: "column",
              alignItems: "center", gap: 3,
              background: "none", border: "none",
              cursor: item.active ? "default" : "pointer",
              padding: "4px 8px"
            }}
          >
            <div style={{
              width: item.active ? 36 : 28,
              height: item.active ? 36 : 28,
              borderRadius: item.active ? "50%" : 8,
              background: item.active
                ? "linear-gradient(135deg, #D4AF37, #F5C842)"
                : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s",
              boxShadow: item.active
                ? "0 0 16px rgba(212,175,55,0.4)" : "none"
            }}>
              <item.icon
                size={item.active ? 18 : 20}
                color={item.active ? "#000" : "rgba(255,255,255,0.4)"}
              />
            </div>
            <span style={{
              fontSize: 9, fontWeight: item.active ? 700 : 500,
              color: item.active ? "#D4AF37" : "rgba(255,255,255,0.35)",
              letterSpacing: "0.02em"
            }}>
              {item.label}
            </span>
          </button>
        ))}
      </div>

      {/* ROOM DETAIL MODAL */}
      {selRoom && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 50,
            display: "flex", alignItems: "flex-end",
            background: "rgba(0,0,0,0.8)",
            backdropFilter: "blur(8px)"
          }}
          onClick={() => setSelRoom(null)}
        >
          <div
            style={{
              width: "100%",
              background: "linear-gradient(180deg, #161616, #0d0d0d)",
              borderRadius: "28px 28px 0 0",
              padding: 24,
              border: "1px solid rgba(255,255,255,0.08)",
              borderBottom: "none"
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              width: 40, height: 4,
              background: "rgba(255,255,255,0.15)",
              borderRadius: 4, margin: "0 auto 24px"
            }} />
            <div style={{
              display: "flex", alignItems: "center", gap: 16, marginBottom: 20
            }}>
              <div style={{
                width: 60, height: 60, borderRadius: 18,
                background: roomConfig(selRoom).bg,
                border: `2px solid ${roomConfig(selRoom).border}`,
                boxShadow: `0 0 20px ${roomConfig(selRoom).glow}`,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 2
              }}>
                {roomConfig(selRoom).hasIcon && (
                  <UserCircle size={16} color={roomConfig(selRoom).text} />
                )}
                <span style={{
                  fontSize: 12, color: roomConfig(selRoom).text, fontWeight: 800
                }}>
                  {selRoom.number}
                </span>
              </div>
              <div>
                <p style={{
                  fontSize: 20, fontWeight: 900, color: "#fff",
                  letterSpacing: "-0.02em"
                }}>
                  Room {selRoom.number}
                </p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                  {selRoom.type || "Standard"} · Floor {selRoom.floor} ·
                  <span style={{ color: roomConfig(selRoom).text }}>
                    {" "}{roomConfig(selRoom).label}
                  </span>
                </p>
              </div>
            </div>

            {selRoom.booking ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 18, padding: 18
                }}>
                  <p style={{
                    fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 4
                  }}>
                    {selRoom.booking.guestName}
                  </p>
                  <p style={{
                    fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 12
                  }}>
                    {selRoom.booking.guestPhone}
                  </p>
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center"
                  }}>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                      {selRoom.booking.nights} raatein
                    </span>
                    <span style={{ fontSize: 16, fontWeight: 800, color: "#D4AF37" }}>
                      ₹{Number(selRoom.booking.totalAmount || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
                <button onClick={() => handleCheckout(selRoom.booking.id)} style={{
                  width: "100%", padding: "16px", borderRadius: 18,
                  fontWeight: 800, fontSize: 14,
                  background: "linear-gradient(135deg, #b8960c, #D4AF37, #F5C842)",
                  color: "#000", border: "none", cursor: "pointer",
                  boxShadow: "0 4px 24px rgba(212,175,55,0.4)"
                }}>
                  ✓ Check-out Karo
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 18, padding: 18, textAlign: "center"
                }}>
                  <p style={{
                    fontSize: 13, color: "rgba(255,255,255,0.4)",
                    textTransform: "capitalize"
                  }}>
                    {selRoom.status?.replace("_", " ")}
                  </p>
                  <p style={{
                    fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 4
                  }}>
                    Base Rate: ₹{selRoom.baseRate}/raat
                  </p>
                </div>
                {selRoom.status === "vacant" && (
                  <button onClick={() => {
                    setSelRoom(null);
                    onNewBooking && onNewBooking(selRoom);
                  }} style={{
                    width: "100%", padding: "16px", borderRadius: 18,
                    fontWeight: 800, fontSize: 14,
                    background: "linear-gradient(135deg, #b8960c, #D4AF37, #F5C842)",
                    color: "#000", border: "none", cursor: "pointer",
                    boxShadow: "0 4px 24px rgba(212,175,55,0.4)"
                  }}>
                    + Nayi Booking Karo
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulseDot {
          0%,100% { box-shadow: 0 0 4px #22c55e; }
          50%      { box-shadow: 0 0 10px #22c55e, 0 0 20px rgba(34,197,94,0.4); }
        }
        .spin-slow { animation: spinRing 3s linear infinite; }
        .spin-reverse { animation: spinRing 4s linear infinite reverse; }
        .spin-slower { animation: spinRing 8s linear infinite; }
        @keyframes spinRing {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function localInsight(s) {
  if (s.occupancyPercent > 80)
    return `Aaj occupancy ${s.occupancyPercent}% hai — bohot acha! Peak demand mein dynamic pricing try karo.`;
  if (s.occupancyPercent > 50)
    return `${s.vacantRooms} rooms khali hain — online listing promote karo ya walk-in offers do.`;
  return `Occupancy kam hai. Weekend package ya local business se tie-up consider karo.`;
}

function Skeleton() {
  return (
    <div style={{
      height: "100%", padding: "16px 14px",
      display: "flex", flexDirection: "column", gap: 12,
      background: "#080808"
    }}>
      {[120, 80, 200, 100].map((h, i) => (
        <div key={i} style={{
          height: h,
          background: "rgba(255,255,255,0.03)",
          borderRadius: 20,
          animation: "pulse 1.5s infinite"
        }} />
      ))}
    </div>
  );
}
