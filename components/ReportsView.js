"use client";

import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { Download, FileText, TrendingUp, Calendar } from "lucide-react";
import {
  getWeeklyRevenue, getTodayBookings, getBookings,
  exportCSV, exportAllData
} from "../lib/db";

export default function ReportsView({ user }) {
  const [weeklyData, setWeeklyData] = useState([]);
  const [todayBookings, setTodayBookings] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [view, setView] = useState("weekly");

  useEffect(() => {
    setWeeklyData(getWeeklyRevenue());
    setTodayBookings(getTodayBookings());
    setAllBookings(getBookings());
  }, []);

  const totalRevenue = allBookings.reduce(
    (s, b) => s + (b.totalAmount || 0), 0
  );
  const totalNights = allBookings.reduce((s, b) => s + (b.nights || 0), 0);
  const avgRate =
    allBookings.length > 0
      ? Math.round(
          allBookings.reduce((s, b) => s + (b.ratePerNight || 0), 0) /
          allBookings.length
        )
      : 0;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div className="glass-card px-3 py-2 rounded-xl text-xs">
          <p className="text-gray-400">{label}</p>
          <p className="text-gold-400 font-bold">₹{payload[0].value.toLocaleString("en-IN")}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-full flex flex-col gap-3 overflow-hidden">
      <div className="flex items-center justify-between flex-shrink-0">
        <h2 className="font-display text-gold-400 text-xl">Revenue Reports</h2>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="glass-card px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs text-gray-400 active:scale-95"
          >
            <FileText size={14} />
            CSV
          </button>
          {user?.role === "owner" && (
            <button
              onClick={exportAllData}
              className="btn-gold px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs"
            >
              <Download size={14} />
              Export
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2 flex-shrink-0">
        <SummaryCard
          label="Total Revenue"
          value={`₹${(totalRevenue / 1000).toFixed(1)}K`}
          icon="💰"
        />
        <SummaryCard
          label="Total Nights"
          value={totalNights}
          icon="🌙"
        />
        <SummaryCard
          label="Avg Rate"
          value={`₹${avgRate}`}
          icon="📊"
        />
      </div>

      {/* Chart */}
      <div className="glass-card rounded-2xl p-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <p className="text-gray-400 text-xs uppercase tracking-widest">
            7 Din Ki Kamayi
          </p>
          <TrendingUp size={14} className="text-gold-400" />
        </div>
        <ResponsiveContainer width="100%" height={130}>
          <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="date"
              tick={{ fill: "#6b7280", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#6b7280", fontSize: 9 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => v > 0 ? `${(v/1000).toFixed(0)}K` : "0"}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(212,175,55,0.05)" }} />
            <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
              {weeklyData.map((entry, idx) => (
                <Cell
                  key={idx}
                  fill={
                    idx === weeklyData.length - 1
                      ? "#D4AF37"
                      : "rgba(212,175,55,0.3)"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Bookings */}
      <div className="glass-card rounded-2xl flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="flex items-center justify-between p-4 border-b border-white/5 flex-shrink-0">
          <p className="text-gray-400 text-xs uppercase tracking-widest">
            Recent Bookings
          </p>
          <span className="text-gold-500 text-xs">{allBookings.length} total</span>
        </div>
        <div className="flex-1 scroll-area">
          {allBookings.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-600 text-sm">Abhi koi booking nahi hai</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {[...allBookings].reverse().map((booking) => (
                <div key={booking.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium">{booking.guestName}</p>
                    <p className="text-gray-500 text-xs">
                      Room {booking.roomId} •{" "}
                      {new Date(booking.createdAt).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-gold-400 font-semibold text-sm">
                      ₹{booking.totalAmount?.toLocaleString("en-IN")}
                    </p>
                    <p className="text-gray-600 text-xs">{booking.paymentMode}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon }) {
  return (
    <div className="glass-card rounded-2xl p-3 text-center">
      <p className="text-xl mb-1">{icon}</p>
      <p className="text-white font-bold text-base">{value}</p>
      <p className="text-gray-500 text-xs leading-tight">{label}</p>
    </div>
  );
}
