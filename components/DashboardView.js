"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Menu,
  BedDouble,
  Sparkles,
  Wrench,
  Star,
  Users,
  BarChart3,
  Building2,
  ClipboardCheck,
} from "lucide-react";

import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const revenueData = [
  { value: 20000 },
  { value: 26000 },
  { value: 25000 },
  { value: 31000 },
  { value: 34000 },
  { value: 42000 },
  { value: 58000 },
];

const rooms = [
  ["501", "occupied"],
  ["502", "occupied"],
  ["503", "vacant"],
  ["504", "occupied"],
  ["505", "occupied"],
  ["506", "occupied"],
  ["507", "vacant"],
  ["508", "occupied"],

  ["401", "occupied"],
  ["402", "occupied"],
  ["403", "occupied"],
  ["404", "occupied"],
  ["405", "occupied"],
  ["406", "vacant"],
  ["407", "occupied"],
  ["408", "occupied"],

  ["301", "occupied"],
  ["302", "occupied"],
  ["303", "vacant"],
  ["304", "occupied"],
  ["305", "vacant"],
  ["306", "occupied"],
  ["307", "occupied"],
  ["308", "occupied"],

  ["201", "occupied"],
  ["202", "occupied"],
  ["203", "occupied"],
  ["204", "maintenance"],
  ["205", "occupied"],
  ["206", "occupied"],
  ["207", "occupied"],
  ["208", "maintenance"],

  ["101", "occupied"],
  ["102", "maintenance"],
  ["103", "occupied"],
  ["104", "occupied"],
  ["105", "occupied"],
  ["106", "occupied"],
  ["107", "occupied"],
  ["108", "maintenance"],
];

export default function DashboardView() {
  const [time, setTime] = useState(new Date());
  const [scanActive, setScanActive] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const greeting = useMemo(() => {
    const h = time.getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  }, [time]);

  const handleScan = () => {
    setScanActive(true);

    if (navigator.vibrate) {
      navigator.vibrate([80, 40, 120]);
    }

    setTimeout(() => {
      setScanActive(false);
      alert("AI Scan Completed Successfully");
    }, 2200);
  };

  const roomColor = (status) => {
    if (status === "occupied") {
      return "from-green-500/90 to-green-700 border-green-300 shadow-green-500/40";
    }

    if (status === "vacant") {
      return "from-red-500/90 to-red-700 border-red-300 shadow-red-500/40";
    }

    return "from-slate-700 to-slate-900 border-slate-500 shadow-slate-600/30";
  };

  return (
    <div className="min-h-screen bg-[#060606] text-white overflow-hidden">

      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#f4c95d22,transparent_45%)]" />
      </div>

      <div className="max-w-md mx-auto relative pb-32">

        {/* HEADER */}
        <div className="flex items-center justify-between px-5 pt-5">
          <button className="w-14 h-14 rounded-2xl border border-yellow-500/30 bg-black/50 flex items-center justify-center shadow-[0_0_30px_rgba(255,215,0,0.08)]">
            <Menu className="text-yellow-400" />
          </button>

          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <Building2 className="text-yellow-400 w-7 h-7" />
              <h1 className="text-[34px] font-serif text-yellow-50">
                The GuestInn
              </h1>
            </div>

            <p className="text-[11px] tracking-[0.35em] text-yellow-400/80 uppercase mt-1">
              AI Powered Hotel Management
            </p>
          </div>

          <button className="w-14 h-14 rounded-2xl border border-yellow-500/30 bg-black/50 flex items-center justify-center relative shadow-[0_0_30px_rgba(255,215,0,0.08)]">
            <Bell className="text-yellow-400" />
            <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-yellow-300 animate-pulse" />
          </button>
        </div>

        {/* AI RECEPTIONIST */}
        <div className="mx-4 mt-5 rounded-3xl border border-yellow-500/20 bg-[#0a0a0a]/90 backdrop-blur-xl p-4 shadow-[0_0_40px_rgba(255,215,0,0.06)]">
          <div className="flex items-center gap-4">

            <div className="relative">
              <div className="absolute inset-0 rounded-full border border-blue-500/30 animate-spin" />

              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400"
                className="w-20 h-20 rounded-full object-cover border-2 border-yellow-400"
              />

              <div className="absolute -bottom-1 right-0 bg-blue-500 rounded-full p-2 shadow-[0_0_25px_rgba(59,130,246,0.8)]">
                <div className="flex gap-[2px] items-end h-4">
                  <span className="w-[3px] bg-white h-2 animate-pulse rounded-full" />
                  <span className="w-[3px] bg-white h-4 animate-pulse rounded-full" />
                  <span className="w-[3px] bg-white h-3 animate-pulse rounded-full" />
                </div>
              </div>
            </div>

            <div className="flex-1">
              <h2 className="text-yellow-400 font-semibold text-2xl">
                AI Receptionist
              </h2>

              <p className="text-white/90 mt-1 text-lg">
                {greeting}, Manager 👋
              </p>

              <p className="text-white/50 text-sm mt-1">
                Here&apos;s your operational overview.
              </p>
            </div>

            <div className="w-3 h-3 rounded-full bg-sky-400 animate-pulse shadow-[0_0_20px_rgba(56,189,248,1)]" />
          </div>
        </div>

        {/* REVENUE CARD */}
        <div className="mx-4 mt-5 rounded-3xl overflow-hidden border border-yellow-500/20 bg-gradient-to-br from-[#0c0c0c] to-[#050505] relative">

          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top_right,#f4c95d44,transparent_40%)]" />

          <div className="relative p-5">
            <p className="text-white/40 text-sm uppercase tracking-[0.25em]">
              Live Revenue
            </p>

            <h2 className="text-[54px] font-black mt-3 leading-none bg-gradient-to-r from-yellow-300 to-yellow-500 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(255,215,0,0.5)]">
              ₹24,58,000
            </h2>

            <p className="text-white/60 mt-2 text-lg">
              Today&apos;s Total Revenue
            </p>

            <div className="mt-4 inline-flex items-center gap-2 bg-green-500/10 border border-green-400/20 text-green-400 px-4 py-2 rounded-full text-sm font-medium">
              ↑ 18.6% vs yesterday
            </div>
          </div>

          <div className="h-44 pr-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFD700" stopOpacity={0.7} />
                    <stop offset="100%" stopColor="#FFD700" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <Tooltip
                  contentStyle={{
                    background: "#000",
                    border: "1px solid rgba(255,215,0,0.3)",
                    borderRadius: 14,
                    color: "white",
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#FFD700"
                  strokeWidth={4}
                  fill="url(#gold)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ROOM OCCUPANCY */}
        <div className="mx-4 mt-5 rounded-3xl border border-white/10 bg-[#0b0b0b] p-5">

          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2 text-white/90 font-semibold text-lg">
              <BedDouble className="text-yellow-400" />
              Room Occupancy
            </div>

            <div className="text-white/50 text-sm">
              Tower A
            </div>
          </div>

          <div className="grid grid-cols-8 gap-2 perspective-[1000px]">
            {rooms.map(([number, status]) => (
              <button
                key={number}
                onClick={() => setSelectedRoom({ number, status })}
                className={`
                  relative aspect-square rounded-xl border text-xs font-bold
                  bg-gradient-to-br ${roomColor(status)}
                  flex flex-col items-center justify-center
                  transform transition-all duration-200 active:scale-90
                  shadow-xl
                `}
              >
                <Users className="w-3 h-3 mb-1" />
                {number}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-4 mt-6 text-xs">
            <Legend color="bg-green-500" label="Occupied (68%)" />
            <Legend color="bg-yellow-500" label="Reserved (5%)" />
            <Legend color="bg-red-500" label="Vacant (17%)" />
            <Legend color="bg-slate-500" label="Out of Order (10%)" />
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="mx-4 mt-5 grid grid-cols-3 gap-4 items-center">

          <QuickCard
            icon={<ClipboardCheck className="text-yellow-400" />}
            title="Guest Check-In"
            value="12"
            sub="Pending"
          />

          {/* AI SCAN */}
          <button
            onClick={handleScan}
            className={`
              relative h-40 w-40 rounded-full mx-auto
              flex flex-col items-center justify-center
              border border-blue-400/40
              bg-[radial-gradient(circle,#0f2b6a,#020817)]
              shadow-[0_0_50px_rgba(59,130,246,0.5)]
              transition-all duration-300
              ${scanActive ? "scale-110" : "scale-100"}
            `}
          >
            <div className="absolute inset-[-12px] rounded-full border border-blue-500/20 animate-spin" />
            <div className="absolute inset-[-22px] rounded-full border border-blue-500/10 animate-pulse" />

            <div className="text-5xl font-black text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]">
              AI
            </div>

            <div className="text-blue-400 tracking-[0.4em] text-sm font-bold mt-1">
              SCAN
            </div>
          </button>

          <QuickCard
            icon={<Wrench className="text-yellow-400" />}
            title="Maintenance"
            value="5"
            sub="Pending"
          />

          <QuickCard
            icon={<Sparkles className="text-yellow-400" />}
            title="Housekeeping"
            value="8"
            sub="Rooms"
          />

          <div />

          <QuickCard
            icon={<Star className="text-yellow-400" />}
            title="Reviews"
            value="4.8"
            sub="Rating"
          />
        </div>

        {/* AI INSIGHTS */}
        <div className="mx-4 mt-5 rounded-3xl border border-blue-500/20 bg-gradient-to-br from-[#050816] to-[#07101f] p-5 overflow-hidden relative">

          <div className="absolute right-[-40px] top-0 w-56 h-56 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="relative flex items-center gap-4">

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="text-sky-400" />

                <h3 className="text-white font-bold tracking-[0.2em] uppercase text-sm">
                  AI Insights
                </h3>
              </div>

              <p className="text-white/70 text-lg leading-relaxed">
                High demand detected for Deluxe Rooms this weekend.
                Dynamic pricing increase of 12% recommended.
              </p>

              <button className="mt-5 px-5 py-3 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 font-semibold hover:scale-105 transition-all">
                View Insights
              </button>
            </div>

            <div className="w-32 h-32 rounded-3xl border border-blue-500/30 bg-blue-500/5 flex items-center justify-center shadow-[0_0_40px_rgba(59,130,246,0.2)]">
              <Building2 className="w-20 h-20 text-blue-400 opacity-90" />
            </div>
          </div>
        </div>

        {/* BOTTOM NAV */}
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <div className="max-w-md mx-auto px-4 pb-5">
            <div className="rounded-3xl border border-yellow-500/20 bg-black/90 backdrop-blur-xl px-5 py-4 flex items-center justify-between shadow-[0_0_40px_rgba(255,215,0,0.08)]">

              <BottomItem icon={<Building2 />} label="Dashboard" active />
              <BottomItem icon={<ClipboardCheck />} label="Bookings" />
              <BottomItem icon={<Users />} label="Guests" />
              <BottomItem icon={<Sparkles />} label="Operations" />
              <BottomItem icon={<BarChart3 />} label="Reports" />
            </div>
          </div>
        </div>

        {/* ROOM MODAL */}
        {selectedRoom && (
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-end"
            onClick={() => setSelectedRoom(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md mx-auto rounded-t-[40px] bg-[#0c0c0c] border border-white/10 p-6"
            >
              <div className="w-20 h-1 bg-white/20 rounded-full mx-auto mb-6" />

              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold">
                    Room {selectedRoom.number}
                  </h2>

                  <p className="text-white/50 mt-1 capitalize">
                    {selectedRoom.status}
                  </p>
                </div>

                <div className={`px-4 py-2 rounded-full text-sm border ${
                  selectedRoom.status === "occupied"
                    ? "bg-green-500/10 border-green-500/20 text-green-400"
                    : selectedRoom.status === "vacant"
                    ? "bg-red-500/10 border-red-500/20 text-red-400"
                    : "bg-slate-500/10 border-slate-500/20 text-slate-300"
                }`}>
                  {selectedRoom.status}
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <InfoRow label="Guest" value="Rahul Sharma" />
                <InfoRow label="Phone" value="+91 9876543210" />
                <InfoRow label="Check-In" value="22 May 2026" />
                <InfoRow label="Nights" value="2" />
                <InfoRow label="Room Type" value="Deluxe Suite" />
              </div>

              <div className="mt-8 rounded-3xl border border-yellow-500/20 bg-yellow-500/5 p-5">
                <div className="flex justify-between text-white/60 text-sm">
                  <span>Total Bill</span>
                  <span>Locked Price</span>
                </div>

                <div className="flex justify-between items-end mt-2">
                  <h3 className="text-4xl font-black text-yellow-400">
                    ₹14,500
                  </h3>

                  <div className="text-yellow-300 text-sm">
                    ₹7,250/night
                  </div>
                </div>
              </div>

              <button className="w-full mt-8 py-4 rounded-2xl bg-gradient-to-r from-yellow-500 to-yellow-300 text-black font-black text-lg shadow-[0_0_30px_rgba(255,215,0,0.3)]">
                Check-Out Guest
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function QuickCard({ icon, title, value, sub }) {
  return (
    <div className="rounded-3xl border border-yellow-500/10 bg-[#090909] p-4 min-h-[130px] flex flex-col justify-between shadow-[0_0_30px_rgba(255,215,0,0.03)]">
      <div>
        <div className="mb-3">{icon}</div>

        <div className="text-white/70 text-xs uppercase tracking-[0.2em] leading-relaxed">
          {title}
        </div>
      </div>

      <div>
        <div className="text-5xl font-black mt-2">{value}</div>

        <div className="text-blue-400 text-sm mt-1">
          {sub}
        </div>
      </div>
    </div>
  );
}

function BottomItem({ icon, label, active }) {
  return (
    <button className="flex flex-col items-center gap-2 text-xs">
      <div className={`${active ? "text-yellow-400" : "text-white/40"}`}>
        {icon}
      </div>

      <span className={`${active ? "text-yellow-400" : "text-white/40"}`}>
        {label}
      </span>
    </button>
  );
}

function Legend({ color, label }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${color}`} />
      <span className="text-white/50">{label}</span>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 pb-3">
      <span className="text-white/40">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
                  }
