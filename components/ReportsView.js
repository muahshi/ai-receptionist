"use client";
import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Download, FileText, TrendingUp } from "lucide-react";
import { getWeeklyRevenue, getTodayBookings, getBookings, exportCSV, exportAllData } from "../lib/db";

export default function ReportsView({ user }) {
  const [weekly, setWeekly] = useState([]);
  const [all, setAll]       = useState([]);

  useEffect(() => {
    setWeekly(getWeeklyRevenue());
    setAll(getBookings());
  }, []);

  const total   = all.reduce((s,b) => s+(b.totalAmount||0), 0);
  const nights  = all.reduce((s,b) => s+(b.nights||0), 0);
  const avgRate = all.length ? Math.round(all.reduce((s,b) => s+(b.ratePerNight||0),0)/all.length) : 0;

  const Tip = ({ active, payload, label }) => active && payload?.length ? (
    <div className="card px-3 py-2 rounded-xl text-xs">
      <p style={{ color:"#D4AF37" }}>{label}</p>
      <p className="text-white font-bold">₹{payload[0].value.toLocaleString("en-IN")}</p>
    </div>
  ) : null;

  return (
    <div className="h-full flex flex-col gap-3 px-3 py-2 overflow-hidden">
      <div className="flex items-center justify-between flex-shrink-0">
        <h2 className="font-black text-xl" style={{ color:"#D4AF37" }}>Reports</h2>
        <div className="flex gap-2">
          <button onClick={exportCSV}
            className="card px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs text-gray-400 active:scale-95">
            <FileText size={13}/> CSV
          </button>
          {user?.role === "owner" && (
            <button onClick={exportAllData}
              className="px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs font-bold active:scale-95"
              style={{ background:"linear-gradient(135deg,#b8960c,#D4AF37)", color:"#000" }}>
              <Download size={13}/> Export
            </button>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 flex-shrink-0">
        {[
          { label:"Total Revenue", value:`₹${(total/1000).toFixed(1)}K`, icon:"💰" },
          { label:"Total Nights",  value:nights,                          icon:"🌙" },
          { label:"Avg Rate",      value:`₹${avgRate}`,                   icon:"📊" },
        ].map(c => (
          <div key={c.label} className="card rounded-2xl p-3 text-center">
            <p className="text-2xl mb-1">{c.icon}</p>
            <p className="text-white font-black text-lg">{c.value}</p>
            <p className="text-gray-600 text-xs">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="card rounded-2xl p-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <p className="text-gray-500 text-xs uppercase tracking-widest">7 Din Ki Kamayi</p>
          <TrendingUp size={14} style={{ color:"#D4AF37" }}/>
        </div>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={weekly} margin={{ top:0, right:0, left:-22, bottom:0 }}>
            <XAxis dataKey="date" tick={{ fill:"#555", fontSize:10 }} axisLine={false} tickLine={false}/>
            <YAxis tick={{ fill:"#555", fontSize:9 }} axisLine={false} tickLine={false}
              tickFormatter={v => v > 0 ? `${(v/1000).toFixed(0)}K` : "0"}/>
            <Tooltip content={<Tip/>} cursor={{ fill:"rgba(212,175,55,0.04)" }}/>
            <Bar dataKey="revenue" radius={[4,4,0,0]}>
              {weekly.map((_, i) => (
                <Cell key={i} fill={i === weekly.length-1 ? "#D4AF37" : "rgba(212,175,55,0.25)"}/>
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Bookings list */}
      <div className="card rounded-2xl flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 flex-shrink-0">
          <p className="text-gray-500 text-xs uppercase tracking-widest">Recent Bookings</p>
          <span className="text-xs" style={{ color:"#D4AF37" }}>{all.length} total</span>
        </div>
        <div className="flex-1 scroll-y divide-y divide-white/5">
          {all.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-700 text-sm">Koi booking nahi hai abhi</p>
            </div>
          ) : [...all].reverse().map(b => (
            <div key={b.id} className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-semibold">{b.guestName}</p>
                <p className="text-gray-600 text-xs">Room {b.roomId} • {new Date(b.createdAt).toLocaleDateString("en-IN")}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm" style={{ color:"#D4AF37" }}>₹{b.totalAmount?.toLocaleString("en-IN")}</p>
                <p className="text-gray-700 text-xs">{b.paymentMode}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
