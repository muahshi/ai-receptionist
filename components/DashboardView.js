"use client";

import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp, Users, DollarSign, Zap, RefreshCw,
  ChevronRight, Eye
} from "lucide-react";
import {
  getTodayStats, getRooms, getTodayBookings, getBookingById,
  initializeRooms, checkoutBooking
} from "../lib/db";

export default function DashboardView({ user, onNavigate, onNewBooking }) {
  const [stats, setStats] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [aiInsight, setAiInsight] = useState("");
  const [insightLoading, setInsightLoading] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(() => {
    initializeRooms(parseInt(process.env.NEXT_PUBLIC_HOTEL_TOTAL_ROOMS || "20"));
    setStats(getTodayStats());
    setRooms(getRooms());
  }, []);

  useEffect(() => {
    loadData();
    fetchAiInsight();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
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
      if (data.insight) setAiInsight(data.insight);
      else setAiInsight(generateLocalInsight(currentStats));
    } catch {
      setAiInsight(generateLocalInsight(stats));
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
    if (room.status === "occupied" && room.currentBookingId) {
      const booking = getBookingById(room.currentBookingId);
      setSelectedRoom({ ...room, booking });
    } else {
      setSelectedRoom(room);
    }
  };

  const handleCheckout = (bookingId, roomId) => {
    checkoutBooking(bookingId);
    loadData();
    setSelectedRoom(null);
    if (navigator.vibrate) navigator.vibrate(50);
  };

  if (!stats) return <LoadingSkeleton />;

  return (
    <div className="h-full flex flex-col gap-2 overflow-hidden">
      {/* ── Stats Row ──────────────────────────────────────────────────── */}
      <div className="flex gap-2 flex-shrink-0">
        <StatCard
          icon={<DollarSign size={16} />}
          label="Aaj Ki Kamayi"
          value={`₹${stats.todayRevenue.toLocaleString("en-IN")}`}
          color="gold"
        />
        <StatCard
          icon={<Users size={16} />}
          label="Rooms Bhare"
          value={`${stats.occupiedRooms}/${stats.totalRooms}`}
          subValue={`${stats.occupancyPercent}%`}
          color="green"
          progress={stats.occupancyPercent}
        />
        <StatCard
          icon={<TrendingUp size={16} />}
          label="Check-ins"
          value={stats.todayCheckIns}
          color="blue"
        />
      </div>

      {/* ── AI Insight ─────────────────────────────────────────────────── */}
      <div className="glass-card-gold px-4 py-3 rounded-2xl flex-shrink-0">
        <div className="flex items-start gap-2">
          <div className="w-6 h-6 rounded-lg bg-gold-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Zap size={12} className="text-gold-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-gold-400 text-xs font-semibold uppercase tracking-widest mb-0.5">
              AI Insight
            </p>
            {insightLoading ? (
              <div className="flex gap-1 items-center py-1">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-gold-500/60 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            ) : (
              <p className="text-gray-300 text-xs leading-relaxed line-clamp-2">
                {aiInsight || "Revenue data analyze ho raha hai..."}
              </p>
            )}
          </div>
          <button onClick={handleRefresh} className="p-1.5 rounded-lg glass-card">
            <RefreshCw size={12} className={`text-gray-400 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* ── Check-in CTA ───────────────────────────────────────────────── */}
      <button
        onClick={() => onNavigate("scanner")}
        className="flex-shrink-0 glass-card-gold rounded-2xl px-4 py-4 flex items-center justify-between active:scale-99 transition-all duration-200 group"
        style={{ boxShadow: "0 4px 20px rgba(212,175,55,0.15)" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl btn-gold flex items-center justify-center">
            <span className="text-xl">📷</span>
          </div>
          <div className="text-left">
            <p className="text-white font-semibold text-sm">Guest Check-in Karo</p>
            <p className="text-gray-500 text-xs">AI ID Scanner • Rate Lock</p>
          </div>
        </div>
        <ChevronRight size={18} className="text-gold-500 group-active:translate-x-1 transition-transform" />
      </button>

      {/* ── Room Grid ──────────────────────────────────────────────────── */}
      <div className="flex-1 glass-card rounded-2xl p-3 overflow-hidden flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-2 flex-shrink-0">
          <p className="text-gray-400 text-xs uppercase tracking-widest font-semibold">
            Live Room Map
          </p>
          <div className="flex gap-2 text-xs">
            <LegendDot color="green" label="Khali" />
            <LegendDot color="red" label="Bhara" />
            <LegendDot color="yellow" label="Cleaning" />
          </div>
        </div>
        <div className="scroll-area flex-1">
          <div className="grid grid-cols-5 gap-1.5">
            {rooms.map((room) => (
              <RoomSquare
                key={room.id}
                room={room}
                onClick={() => handleRoomClick(room)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Room Detail Modal ──────────────────────────────────────────── */}
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

function StatCard({ icon, label, value, subValue, color, progress }) {
  const colors = {
    gold: "text-gold-400",
    green: "text-green-400",
    blue: "text-blue-400",
  };

  return (
    <div className="flex-1 glass-card rounded-2xl px-3 py-3">
      <div className={`${colors[color]} mb-1`}>{icon}</div>
      <p className="text-gray-500 text-xs leading-tight mb-1">{label}</p>
      <p className="text-white font-bold text-base leading-tight">{value}</p>
      {subValue && (
        <p className={`text-xs ${colors[color]} font-semibold`}>{subValue}</p>
      )}
      {progress !== undefined && (
        <div className="mt-1.5 h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-400 rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

function RoomSquare({ room, onClick }) {
  const statusClass = {
    vacant: "room-vacant border",
    occupied: "room-occupied border",
    cleaning: "room-cleaning border",
    maintenance: "room-maintenance border",
  }[room.status] || "room-vacant border";

  const statusEmoji = {
    vacant: "",
    occupied: "●",
    cleaning: "⟳",
    maintenance: "⚠",
  }[room.status] || "";

  return (
    <button
      onClick={onClick}
      className={`${statusClass} rounded-lg aspect-square flex flex-col items-center justify-center transition-all duration-200 active:scale-90`}
    >
      <span className="text-white/80 text-xs font-mono font-semibold">
        {room.number}
      </span>
      {statusEmoji && (
        <span className="text-xs opacity-70">{statusEmoji}</span>
      )}
    </button>
  );
}

function LegendDot({ color, label }) {
  const bg = { green: "bg-green-400", red: "bg-red-400", yellow: "bg-yellow-400" }[color];
  return (
    <div className="flex items-center gap-1">
      <div className={`w-2 h-2 rounded-full ${bg}`} />
      <span className="text-gray-600">{label}</span>
    </div>
  );
}

function RoomDetailModal({ room, onClose, onCheckout, user }) {
  const { booking } = room;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full glass-card rounded-t-3xl p-5 slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />

        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-gold-400 text-xl">
            Room {room.number}
          </h3>
          <span
            className={`text-xs px-2 py-1 rounded-full font-medium ${
              room.status === "occupied"
                ? "bg-red-500/20 text-red-400"
                : room.status === "cleaning"
                ? "bg-yellow-500/20 text-yellow-400"
                : "bg-green-500/20 text-green-400"
            }`}
          >
            {room.status === "occupied"
              ? "Bhara Hua"
              : room.status === "cleaning"
              ? "Cleaning"
              : "Khali"}
          </span>
        </div>

        {booking ? (
          <div className="space-y-3">
            <InfoRow label="Guest Name" value={booking.guestName} />
            <InfoRow label="Phone" value={booking.guestPhone || "—"} />
            <InfoRow label="ID" value={`${booking.idType} • ${booking.idNumber}`} />
            <InfoRow
              label="Check-in"
              value={new Date(booking.checkInDate).toLocaleDateString("en-IN")}
            />
            <InfoRow label="Nights" value={booking.nights} />
            <div className="glass-card-gold rounded-xl px-4 py-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">🔒 Locked Rate</span>
                <span className="text-gold-400 font-bold">
                  ₹{booking.ratePerNight?.toLocaleString("en-IN")}/night
                </span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-gray-400 text-sm">Total</span>
                <span className="text-white font-bold text-lg">
                  ₹{booking.totalAmount?.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {user?.role === "owner" && (
              <button
                onClick={() => onCheckout(booking.id, room.id)}
                className="w-full py-3 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 font-semibold text-sm active:scale-95 transition-all"
              >
                Check-out Karo
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm">Ye room khali hai</p>
            <p className="text-gray-600 text-xs mt-1">
              Type: {room.type} • Base Rate: ₹{room.baseRate}/night
            </p>
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
        <div key={i} className="glass-card rounded-2xl h-16 animate-pulse" />
      ))}
    </div>
  );
}

function generateLocalInsight(stats) {
  if (!stats) return "Data load ho raha hai...";
  const day = new Date().toLocaleDateString("en-IN", { weekday: "long" });
  const occ = stats.occupancyPercent || 0;

  if (occ > 80)
    return `${day} ko ${occ}% occupancy hai! Aaj rates 15% badha sakte ho. 🔥`;
  if (occ < 30)
    return `Aaj occupancy sirf ${occ}% hai. Discount offer karo — "Walk-in Special" try karo!`;
  return `${day} — ${occ}% rooms bhare hain. Normal din hai, premium rooms promote karo! 💡`;
}
