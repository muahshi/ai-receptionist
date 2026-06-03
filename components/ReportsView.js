"use client";
import { useState, useEffect, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Download, FileText, TrendingUp } from "lucide-react";
import { getWeeklyRevenue, getBookings, getBookingsSync, exportCSV, exportAllData, onHotelUpdate } from "../lib/db";

export default function ReportsView({ hotelId, hotel, user }) {
  const [weekly,   setWeekly]   = useState([]);
  const [all,      setAll]      = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [dbStatus, setDbStatus] = useState(null);

  const refresh = useCallback(async () => {
    if (!hotelId) {
      setLoading(false);
      return;
    }

    // 1. Show localStorage cache INSTANTLY — always paint from cache first
    const cached = getBookingsSync(hotelId);
    setAll(cached);
    setWeekly(getWeeklyRevenue(hotelId));
    setLoading(false);

    // 2. Fetch fresh from Supabase — never downgrade to empty if cache has data
    try {
      const data = await getBookings(hotelId);
      if (data.length > 0 || cached.length === 0) {
        setAll(data);
        setWeekly(getWeeklyRevenue(hotelId));
        setDbStatus(data.length > 0 ? "supabase" : "empty");
      } else {
        // Supabase empty but localStorage has bookings — keep showing them
        const stillCached = getBookingsSync(hotelId);
        setAll(stillCached);
        setWeekly(getWeeklyRevenue(hotelId));
        setDbStatus("cache");
      }
    } catch (e) {
      console.warn("[ReportsView] Supabase fetch failed:", e.message);
      setDbStatus("offline");
      setAll(getBookingsSync(hotelId));
      setWeekly(getWeeklyRevenue(hotelId));
    }
  }, [hotelId]);

  useEffect(() => {
    refresh();
    const iv = setInterval(refresh, 20000);
    return () => clearInterval(iv);
  }, [refresh]);

  // Reload on BroadcastChannel update (same+other tabs) or focus
  useEffect(() => {
    const unsub = onHotelUpdate((msg) => {
      if (!msg.hotelId || msg.hotelId === hotelId) refresh();
    });
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      unsub();
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh, hotelId]);

  const total   = all.reduce((s, b) => s + (b.totalAmount || 0), 0);
  const nights  = all.reduce((s, b) => s + (b.nights || 0), 0);
  const avgRate = all.length ? Math.round(all.reduce((s, b) => s + (b.ratePerNight || 0), 0) / all.length) : 0;

  const Tip = ({ active, payload, label }) => active && payload?.length ? (
    <div style={{ background:"#1a1a2e", border:"1px solid rgba(212,175,55,0.3)",
      borderRadius:10, padding:"8px 12px" }}>
      <p style={{ color:"#D4AF37", fontSize:11 }}>{label}</p>
      <p style={{ color:"#fff", fontWeight:700, fontSize:12 }}>₹{payload[0].value.toLocaleString("en-IN")}</p>
    </div>
  ) : null;

  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column", gap:12,
      padding:"8px 12px", overflow:"hidden", background:"#0A0A0A" }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
        <h2 style={{ fontWeight:900, fontSize:22, color:"#D4AF37",
          textShadow:"0 0 20px rgba(212,175,55,0.3)", letterSpacing:"-0.02em" }}>
          Reports
        </h2>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={() => exportCSV(hotelId)}
            style={{ padding:"6px 12px", borderRadius:10, border:"none", cursor:"pointer",
              background:"rgba(255,255,255,0.05)", color:"rgba(255,255,255,0.5)",
              display:"flex", alignItems:"center", gap:5, fontSize:12 }}>
            <FileText size={13}/> CSV
          </button>
          {user?.role === "owner" && (
            <button onClick={() => exportAllData(hotelId)}
              style={{ padding:"6px 12px", borderRadius:10, border:"none", cursor:"pointer",
                background:"linear-gradient(135deg,#b8960c,#D4AF37)", color:"#000",
                display:"flex", alignItems:"center", gap:5, fontSize:12, fontWeight:700 }}>
              <Download size={13}/> Export
            </button>
          )}
        </div>
      </div>

      {/* DB status warning — only when no data */}
      {!loading && all.length === 0 && dbStatus && (
        <div style={{ padding:"8px 12px", borderRadius:10,
          background:"rgba(255,100,100,0.07)", border:"1px solid rgba(255,100,100,0.15)",
          flexShrink:0 }}>
          <p style={{ fontSize:11, color:"rgba(255,130,130,0.7)" }}>
            {dbStatus === "offline"
              ? "⚠️ Supabase se connect nahi hua. Check karo env vars: NEXT_PUBLIC_SUPABASE_URL"
              : "ℹ️ Koi booking nahi mili — Hotel ID: " + hotelId}
          </p>
        </div>
      )}

      {/* Summary cards */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, flexShrink:0 }}>
        {[
          { label:"Total Revenue", value:`₹${(total/1000).toFixed(1)}K`, icon:"💰" },
          { label:"Total Nights",  value: nights,                         icon:"🌙" },
          { label:"Avg Rate",      value:`₹${avgRate}`,                  icon:"📊" },
        ].map(c => (
          <div key={c.label} style={{ background:"rgba(255,255,255,0.03)",
            border:"1px solid rgba(255,255,255,0.07)", borderRadius:16,
            padding:12, textAlign:"center" }}>
            <p style={{ fontSize:22, marginBottom:4 }}>{c.icon}</p>
            <p style={{ color:"#fff", fontWeight:900, fontSize:18 }}>{c.value}</p>
            <p style={{ color:"rgba(255,255,255,0.3)", fontSize:11 }}>{c.label}</p>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)",
        borderRadius:16, padding:14, flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
          <p style={{ color:"rgba(255,255,255,0.3)", fontSize:11, letterSpacing:"0.1em",
            textTransform:"uppercase" }}>7 Din Ki Kamayi</p>
          <TrendingUp size={14} style={{ color:"#D4AF37" }}/>
        </div>
        <ResponsiveContainer width="100%" height={110}>
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
      <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)",
        borderRadius:16, flex:1, overflow:"hidden", display:"flex", flexDirection:"column", minHeight:0 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"12px 16px", borderBottom:"1px solid rgba(255,255,255,0.05)", flexShrink:0 }}>
          <p style={{ color:"rgba(255,255,255,0.3)", fontSize:11, letterSpacing:"0.1em",
            textTransform:"uppercase" }}>Recent Bookings</p>
          <span style={{ fontSize:12, color:"#D4AF37", fontWeight:700 }}>{all.length} total</span>
        </div>

        <div style={{ flex:1, overflowY:"auto" }}>
          {loading ? (
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
              height:"100%", padding:32 }}>
              <div style={{ width:24, height:24, borderRadius:"50%",
                border:"2px solid rgba(212,175,55,0.2)", borderTopColor:"#D4AF37",
                animation:"spin 1s linear infinite" }}/>
            </div>
          ) : all.length === 0 ? (
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100%" }}>
              <div style={{ textAlign:"center" }}>
                <p style={{ fontSize:28, marginBottom:8 }}>📋</p>
                <p style={{ color:"rgba(255,255,255,0.2)", fontSize:13 }}>Koi booking nahi hai abhi</p>
              </div>
            </div>
          ) : (
            [...all].slice(0, 50).map(b => (
              <div key={b.id} style={{ padding:"12px 16px", display:"flex",
                alignItems:"center", justifyContent:"space-between",
                borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ flex:1, minWidth:0, marginRight:12 }}>
                  <p style={{ color:"#fff", fontSize:13, fontWeight:600,
                    overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {b.guestName}
                  </p>
                  <p style={{ color:"rgba(255,255,255,0.3)", fontSize:11, marginTop:2 }}>
                    Room {b.roomId} • {new Date(b.createdAt).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <p style={{ fontWeight:700, fontSize:13, color:"#D4AF37" }}>
                    ₹{Number(b.totalAmount||0).toLocaleString("en-IN")}
                  </p>
                  <span style={{ fontSize:10, padding:"2px 6px", borderRadius:8,
                    ...(b.status === "active"
                      ? { background:"rgba(34,197,94,0.12)", color:"#22c55e" }
                      : { background:"rgba(255,255,255,0.05)", color:"rgba(255,255,255,0.3)" }) }}>
                    {b.status === "active" ? "Active" : "Checked Out"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
