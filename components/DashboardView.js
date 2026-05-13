"use client";

import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp, Users, DollarSign, Zap, RefreshCw,
  ChevronRight, Lock, Clock, Shield, ExternalLink, Copy, Check
} from "lucide-react";
import {
  getTodayStats, getRooms, getBookingById,
  initializeRooms, checkoutBooking, getTodayBookings
} from "../lib/db";

export default function DashboardView({ user, onNavigate, onNewBooking }) {
  const [stats, setStats] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [aiInsight, setAiInsight] = useState("");
  const [insightLoading, setInsightLoading] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [timeline, setTimeline] = useState([]);
  const [linkCopied, setLinkCopied] = useState(false);

  const loadData = useCallback(() => {
    initializeRooms(parseInt(process.env.NEXT_PUBLIC_HOTEL_TOTAL_ROOMS || "20"));
    setStats(getTodayStats());
    setRooms(getRooms());

    // Build activity timeline from today's bookings
    const bookings = getTodayBookings();
    const events = bookings.flatMap((b) => [
      { time: b.createdAt, text: `Manager ne Room ${b.roomId} check-in kiya`, icon: "🔑", type: "checkin" },
      { time: b.lockedAt, text: `Rate ₹${b.ratePerNight}/night lock hua — Room ${b.roomId}`, icon: "🔒", type: "lock" },
    ]).sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 6);
    setTimeline(events);
  }, []);

  useEffect(() => {
    loadData();
    fetchAiInsight();
    const iv = setInterval(loadData, 30000);
    return () => clearInterval(iv);
  }, [loadData]);

  const fetchAiInsight = async () => {
    setInsightLoading(true);
    try {
      const currentStats = getTodayStats();
      const res = await fetch("/api/groq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "ai_insight", stats: currentStats }),
      });
      const data = await res.json();
      setAiInsight(data.insight || generateLocalInsight(currentStats));
    } catch {
      setAiInsight(generateLocalInsight(getTodayStats()));
    }
    setInsightLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    loadData();
    await fetchAiInsight();
    setRefreshing(false);
  };

  const handleRoomClick = (room) => {
    const booking = room.currentBookingId ? getBookingById(room.currentBookingId) : null;
    setSelectedRoom({ ...room, booking });
  };

  const handleCheckout = (bookingId) => {
    checkoutBooking(bookingId);
    loadData();
    setSelectedRoom(null);
    if (navigator.vibrate) navigator.vibrate(50);
  };

  const copyBookingLink = () => {
    const hotelId = "default";
    const url = `${window.location.origin}/booking/${hotelId}`;
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };

  if (!stats) return <LoadingSkeleton />;

  return (
    <div className="h-full flex flex-col gap-2 overflow-hidden">

      {/* ── Revenue Pulse ──────────────────────────────────────────────── */}
      <div className="flex-shrink-0 rounded-2xl px-4 py-4 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.15), rgba(0,112,243,0.08))", border: "1px solid rgba(212,175,55,0.2)" }}>
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #D4AF37, transparent)", transform: "translate(30%, -30%)" }} />
        <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Live Revenue Pulse</p>
        <div className="flex items-end gap-2">
          <p className="text-4xl font-bold text-white">
            ₹{stats.todayRevenue.toLocaleString("en-IN")}
          </p>
          <span className="text-green-400 text-xs mb-1 font-medium">Today</span>
        </div>
        <p className="text-gray-600 text-xs mt-1 flex items-center gap-1">
          <Shield size={10} className="text-[#D4AF37]" />
          All payments verified by AI
        </p>

        {/* Stats row */}
        <div className="flex gap-4 mt-3">
          <MiniStat label="Occupancy" value={`${stats.occupancyPercent}%`} color="#D4AF37" />
          <MiniStat label="Rooms Bhare" value={`${stats.occupiedRooms}/${stats.totalRooms}`} color="#0070F3" />
          <MiniStat label="Check-ins" value={stats.todayCheckIns} color="#22c55e" />
        </div>
      </div>

      {/* ── AI Insight ─────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 rounded-2xl px-4 py-3"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="flex items-start gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: "rgba(212,175,55,0.2)" }}>
            <Zap size={12} className="text-[#D4AF37]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[#D4AF37] text-xs font-semibold uppercase tracking-widest mb-0.5">AI Insight</p>
            {insightLoading ? (
              <div className="flex gap-1 py-1">
                {[0,1,2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]/60 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            ) : (
              <p className="text-gray-300 text-xs leading-relaxed line-clamp-2">{aiInsight}</p>
            )}
          </div>
          <button onClick={handleRefresh} className="p-1.5 rounded-lg"
            style={{ background: "rgba(255,255,255,0.08)" }}>
            <RefreshCw size={12} className={`text-gray-400 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* ── Middle Row: Check-in CTA + Guest Link ──────────────────────── */}
      <div className="flex gap-2 flex-shrink-0">
        <button onClick={() => onNavigate("scanner")}
          className="flex-1 rounded-2xl px-4 py-3 flex items-center justify-between active:scale-98 transition-all"
          style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.08))", border: "1px solid rgba(212,175,55,0.3)" }}>
          <div className="flex items-center gap-2">
            <span className="text-xl">📷</span>
            <div className="text-left">
              <p className="text-white font-semibold text-sm">Check-in</p>
              <p className="text-gray-500 text-xs">AI Scanner</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-[#D4AF37]" />
        </button>

        <button onClick={copyBookingLink}
          className="rounded-2xl px-3 py-3 flex flex-col items-center justify-center gap-1 transition-all active:scale-95"
          style={{ background: "rgba(0,112,243,0.15)", border: "1px solid rgba(0,112,243,0.3)", minWidth: 70 }}>
          {linkCopied ? <Check size={18} className="text-green-400" /> : <ExternalLink size={18} className="text-[#0070F3]" />}
          <p className="text-xs text-gray-400">{linkCopied ? "Copied!" : "AI Chat"}</p>
        </button>
      </div>

      {/* ── Room Grid + Timeline side by side ──────────────────────────── */}
      <div className="flex gap-2 flex-1 min-h-0 overflow-hidden">

        {/* Room Grid */}
        <div className="flex-1 rounded-2xl p-3 overflow-hidden flex flex-col min-h-0"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center justify-between mb-2 flex-shrink-0">
            <p className="text-gray-500 text-xs uppercase tracking-widest">Floor Map</p>
            <div className="flex gap-2 text-xs">
              <LegendDot color="#22c55e" label="Khali" />
              <LegendDot color="#ef4444" label="Bhara" />
            </div>
          </div>
          <div className="scroll-area flex-1">
            <div className="grid grid-cols-5 gap-1.5">
              {rooms.map((room) => (
                <RoomSquare key={room.id} room={room} onClick={() => handleRoomClick(room)} />
              ))}
            </div>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="w-36 rounded-2xl p-3 overflow-hidden flex flex-col min-h-0"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-gray-500 text-xs uppercase tracking-widest mb-2 flex-shrink-0">Activity</p>
          <div className="scroll-area flex-1">
            {timeline.length === 0 ? (
              <p className="text-gray-700 text-xs">Aaj koi activity nahi</p>
            ) : (
              <div className="space-y-3">
                {timeline.map((ev, i) => (
                  <TimelineItem key={i} event={ev} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Room Detail Modal */}
      {selectedRoom && (
        <RoomDetailModal
          room={selectedRoom}
          onClose={() => setSelectedRoom(null)}
          onCheckout={handleCheckout}
          user={user}
        />
      )}
    </div>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div>
      <p className="text-xs font-bold" style={{ color }}>{value}</p>
      <p className="text-gray-600 text-xs">{label}</p>
    </div>
  );
}

function RoomSquare({ room, onClick }) {
  const styles = {
    vacant: { bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.3)", text: "#22c55e" },
    occupied: { bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.4)", text: "#ef4444" },
    cleaning: { bg: "rgba(234,179,8,0.1)", border: "rgba(234,179,8,0.3)", text: "#eab308" },
    maintenance: { bg: "rgba(99,102,241,0.1)", border: "rgba(99,102,241,0.3)", text: "#818cf8" },
  };
  const s = styles[room.status] || styles.vacant;

  return (
    <button onClick={onClick}
      className="rounded-lg aspect-square flex flex-col items-center justify-center transition-all duration-200 active:scale-90"
      style={{ background: s.bg, border: `1px solid ${s.border}` }}>
      <span className="text-xs font-mono font-bold" style={{ color: s.text }}>{room.number}</span>
      {room.status === "occupied" && <span className="text-xs">●</span>}
    </button>
  );
}

function TimelineItem({ event }) {
  const timeStr = event.time
    ? new Date(event.time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    : "";
  return (
    <div className="flex gap-1.5">
      <span className="text-xs flex-shrink-0 mt-0.5">{event.icon}</span>
      <div>
        <p className="text-gray-400 text-xs leading-tight">{event.text}</p>
        <p className="text-gray-700 text-xs">{timeStr}</p>
      </div>
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <div className="flex items-center gap-1">
      <div className="w-2 h-2 rounded-full" style={{ background: color }} />
      <span className="text-gray-600">{label}</span>
    </div>
  );
}

function RoomDetailModal({ room, onClose, onCheckout, user }) {
  const { booking } = room;
  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70" style={{ backdropFilter: "blur(6px)" }} />
      <div className="relative w-full rounded-t-3xl p-5 max-w-lg mx-auto"
        style={{ background: "rgba(18,18,18,0.98)", border: "1px solid rgba(255,255,255,0.12)", borderBottom: "none" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[#D4AF37] text-xl font-bold">Room {room.number}</h3>
          <span className="text-xs px-2 py-1 rounded-full font-medium"
            style={{
              background: room.status === "occupied" ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)",
              color: room.status === "occupied" ? "#ef4444" : "#22c55e"
            }}>
            {room.status === "occupied" ? "Bhara Hua" : room.status === "cleaning" ? "Cleaning" : "Khali"}
          </span>
        </div>

        {booking ? (
          <div className="space-y-3">
            <InfoRow label="Guest" value={booking.guestName} />
            <InfoRow label="Phone" value={booking.guestPhone || "—"} />
            <InfoRow label="ID" value={`${booking.idType} • ${booking.idNumber}`} />
            <InfoRow label="Check-in" value={new Date(booking.checkInDate).toLocaleDateString("en-IN")} />
            <InfoRow label="Nights" value={booking.nights} />

            {/* Rate Integrity Badge */}
            <div className="rounded-xl px-4 py-3"
              style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.3)" }}>
              <div className="flex items-center gap-2 mb-1">
                <Lock size={12} className="text-[#D4AF37]" />
                <span className="text-[#D4AF37] text-xs font-semibold uppercase tracking-wider">Rate Integrity Badge</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">Locked Rate</span>
                <span className="text-[#D4AF37] font-bold">₹{booking.ratePerNight?.toLocaleString("en-IN")}/night</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-gray-400 text-sm">Total</span>
                <span className="text-white font-bold text-lg">₹{booking.totalAmount?.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {user?.role === "owner" && (
              <button onClick={() => onCheckout(booking.id)}
                className="w-full py-3 rounded-xl font-semibold text-sm transition-all active:scale-95"
                style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}>
                Check-out Karo
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm">Ye room khali hai</p>
            <p className="text-gray-600 text-xs mt-1">Type: {room.type} • Base Rate: ₹{room.baseRate}/night</p>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-white/5">
      <span className="text-gray-500 text-xs">{label}</span>
      <span className="text-white text-sm font-medium">{value}</span>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="h-full flex flex-col gap-2">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-2xl h-16 animate-pulse"
          style={{ background: "rgba(255,255,255,0.05)" }} />
      ))}
    </div>
  );
}

function generateLocalInsight(stats) {
  if (!stats) return "Data load ho raha hai...";
  const day = new Date().toLocaleDateString("en-IN", { weekday: "long" });
  const occ = stats.occupancyPercent || 0;
  if (occ > 80) return `${day} ko ${occ}% occupancy! Aaj rates ₹200 badha sakte ho. 🔥`;
  if (occ < 30) return `Aaj sirf ${occ}% rooms bhare hain. Walk-in discount offer karo! 💡`;
  return `${day} — ${occ}% occupancy. Premium rooms promote karo aaj. ₹ zyada milega!`;
}
