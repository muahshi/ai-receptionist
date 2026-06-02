"use client";
import { useState, useEffect } from "react";
import { Phone, User, CreditCard, BedDouble, Calendar, RefreshCw } from "lucide-react";
import { getBookings, getBookingsSync, checkoutBooking } from "../lib/db";

export default function GuestsView({ hotelId, hotel, user }) {
  const [guests,     setGuests]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState("all"); // all | active | checked_out
  const [refreshing, setRefreshing] = useState(false);
  const [selGuest,   setSelGuest]   = useState(null);

  const load = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    // 1. Show cached instantly
    const cached = getBookingsSync(hotelId);
    if (cached.length > 0) setGuests(cached);
    // 2. Fetch fresh from Supabase
    try {
      const fresh = await getBookings(hotelId);
      setGuests(fresh);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    load();
    // Auto-refresh every 20s so marketplace bookings appear without manual refresh
    const iv = setInterval(() => load(), 20000);
    return () => clearInterval(iv);
  }, [hotelId]);

  const filtered = guests.filter(g =>
    filter === "all" ? true :
    filter === "active" ? g.status === "active" :
    g.status === "checked_out"
  ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const handleCheckout = async (bookingId) => {
    await checkoutBooking(hotelId, bookingId);
    setSelGuest(null);
    load();
  };

  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column",
      background:"#0A0A0A", overflow:"hidden" }}>

      {/* Header */}
      <div style={{ padding:"16px 14px 10px", flexShrink:0,
        borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
          <h2 style={{ fontWeight:900, fontSize:22, color:"#D4AF37",
            textShadow:"0 0 20px rgba(212,175,55,0.3)", letterSpacing:"-0.02em" }}>
            Guests
          </h2>
          <button onClick={() => load(true)} disabled={refreshing}
            style={{ width:34, height:34, borderRadius:10, border:"none",
              background:"rgba(255,255,255,0.05)", cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center" }}>
            <RefreshCw size={15} style={{ color:"#D4AF37",
              animation: refreshing ? "spin 1s linear infinite" : "none" }}/>
          </button>
        </div>

        {/* Filter tabs */}
        <div style={{ display:"flex", gap:6 }}>
          {[
            { id:"all",         label:`All (${guests.length})` },
            { id:"active",      label:`Active (${guests.filter(g=>g.status==="active").length})` },
            { id:"checked_out", label:`Checked Out (${guests.filter(g=>g.status==="checked_out").length})` },
          ].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{
              padding:"6px 12px", borderRadius:20, border:"none", cursor:"pointer",
              fontSize:11, fontWeight:700,
              background: filter === f.id
                ? "linear-gradient(135deg,#b8960c,#D4AF37)" : "rgba(255,255,255,0.05)",
              color: filter === f.id ? "#000" : "rgba(255,255,255,0.4)",
              transition:"all .2s",
            }}>{f.label}</button>
          ))}
        </div>
      </div>

      {/* Guest list */}
      <div style={{ flex:1, overflowY:"auto", padding:"8px 14px" }}>
        {loading ? (
          <div style={{ display:"flex", justifyContent:"center", paddingTop:40 }}>
            <div style={{ width:32, height:32, borderRadius:"50%",
              border:"2px solid rgba(212,175,55,0.2)", borderTopColor:"#D4AF37",
              animation:"spin 1s linear infinite" }}/>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:"center", paddingTop:50 }}>
            <p style={{ fontSize:32, marginBottom:10 }}>👥</p>
            <p style={{ fontSize:14, color:"rgba(255,255,255,0.25)" }}>
              {filter === "active" ? "Koi active guest nahi" :
               filter === "checked_out" ? "Koi checkout nahi hua" :
               "Abhi koi guest nahi hai"}
            </p>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:8, paddingBottom:16 }}>
            {filtered.map(g => (
              <button key={g.id} onClick={() => setSelGuest(g)} style={{
                width:"100%", textAlign:"left", padding:"14px",
                borderRadius:16, border:"none", cursor:"pointer",
                background: g.status === "active"
                  ? "rgba(34,197,94,0.05)" : "rgba(255,255,255,0.025)",
                borderLeft: `3px solid ${g.status==="active" ? "#22c55e" :
                  g.status==="checked_out" ? "#6b7280" : "#D4AF37"}`,
                transition:"all .2s",
              }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                      <p style={{ fontWeight:800, fontSize:14, color:"#fff",
                        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {g.guestName || "—"}
                      </p>
                      <span style={{
                        padding:"2px 8px", borderRadius:20, fontSize:9, fontWeight:700, flexShrink:0,
                        background: g.status === "active"
                          ? "rgba(34,197,94,0.15)" : "rgba(107,114,128,0.15)",
                        color: g.status === "active" ? "#22c55e" : "#9ca3af",
                      }}>
                        {g.status === "active" ? "ACTIVE" :
                         g.status === "checked_out" ? "OUT" : g.status?.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                      {g.guestPhone && (
                        <span style={{ fontSize:11, color:"rgba(255,255,255,0.4)",
                          display:"flex", alignItems:"center", gap:3 }}>
                          <Phone size={9}/> {g.guestPhone}
                        </span>
                      )}
                      <span style={{ fontSize:11, color:"rgba(255,255,255,0.4)",
                        display:"flex", alignItems:"center", gap:3 }}>
                        <BedDouble size={9}/> Room {g.roomId?.split("_R")?.[1] || g.roomId || "—"}
                      </span>
                      <span style={{ fontSize:11, color:"rgba(255,255,255,0.4)",
                        display:"flex", alignItems:"center", gap:3 }}>
                        <Calendar size={9}/>
                        {g.checkInDate ? new Date(g.checkInDate).toLocaleDateString("en-IN",
                          {day:"numeric",month:"short"}) : "—"}
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign:"right", flexShrink:0, marginLeft:8 }}>
                    <p style={{ fontWeight:800, fontSize:15, color:"#D4AF37" }}>
                      ₹{Number(g.totalAmount||0).toLocaleString("en-IN")}
                    </p>
                    <p style={{ fontSize:10, color:"rgba(255,255,255,0.25)", marginTop:1 }}>
                      {g.nights} raat
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Guest detail modal */}
      {selGuest && (
        <div style={{ position:"fixed", inset:0, zIndex:50, display:"flex", alignItems:"flex-end",
          background:"rgba(0,0,0,0.75)", backdropFilter:"blur(12px)" }}
          onClick={() => setSelGuest(null)}>
          <div style={{ width:"100%", background:"linear-gradient(160deg,#0f1020,#07090a)",
            border:"1px solid rgba(255,255,255,0.1)", borderBottom:"none",
            borderRadius:"24px 24px 0 0", padding:"20px 18px 32px",
            maxHeight:"85vh", overflowY:"auto" }}
            onClick={e => e.stopPropagation()}>

            <div style={{ width:40, height:4, borderRadius:2, background:"rgba(255,255,255,0.15)",
              margin:"0 auto 18px" }}/>

            {/* Guest name + status */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <h3 style={{ fontWeight:900, fontSize:20, color:"#fff" }}>{selGuest.guestName || "Guest"}</h3>
              <span style={{
                padding:"4px 12px", borderRadius:20, fontSize:11, fontWeight:700,
                background: selGuest.status === "active"
                  ? "rgba(34,197,94,0.15)" : "rgba(107,114,128,0.12)",
                color: selGuest.status === "active" ? "#22c55e" : "#9ca3af",
              }}>
                {selGuest.status === "active" ? "● Active" : "Checked Out"}
              </span>
            </div>

            {/* Details grid */}
            <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)",
              borderRadius:16, padding:14, marginBottom:12, display:"flex", flexDirection:"column", gap:0 }}>
              {[
                ["📱 Phone",    selGuest.guestPhone || "—"],
                ["🪪 ID Type",  `${selGuest.idType || "—"} · ${selGuest.idNumber || "—"}`],
                ["🛏 Room",     selGuest.roomId || "—"],
                ["📅 Check-in", selGuest.checkInDate
                  ? new Date(selGuest.checkInDate).toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"}) : "—"],
                ["📅 Checkout", selGuest.checkOutDate
                  ? new Date(selGuest.checkOutDate).toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"}) : "—"],
                ["🌙 Nights",   `${selGuest.nights || 1} raat`],
                ["💳 Payment",  selGuest.paymentMode || "—"],
                ["📍 Address",  selGuest.address || "—"],
              ].map(([l, v]) => (
                <div key={l} style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start",
                  padding:"9px 0", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ fontSize:11, color:"rgba(255,255,255,0.35)", flexShrink:0, marginRight:10 }}>{l}</span>
                  <span style={{ fontSize:12, fontWeight:600, color:"#fff", textAlign:"right",
                    wordBreak:"break-all" }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Rate badge */}
            <div style={{ background:"rgba(212,175,55,0.07)", border:"1px solid rgba(212,175,55,0.2)",
              borderRadius:14, padding:"12px 14px", marginBottom:14,
              display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <p style={{ fontSize:10, color:"rgba(212,175,55,0.6)", fontWeight:700,
                  letterSpacing:"0.08em", marginBottom:3 }}>TOTAL AMOUNT</p>
                <p style={{ fontSize:24, fontWeight:900, color:"#D4AF37",
                  letterSpacing:"-0.03em" }}>
                  ₹{Number(selGuest.totalAmount||0).toLocaleString("en-IN")}
                </p>
              </div>
              <div style={{ textAlign:"right" }}>
                <p style={{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>
                  ₹{Number(selGuest.ratePerNight||0).toLocaleString("en-IN")}/raat
                </p>
                <p style={{ fontSize:10, color:"rgba(255,255,255,0.25)", marginTop:2 }}>
                  {selGuest.paymentMode}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {selGuest.status === "active" && (
                <button onClick={() => handleCheckout(selGuest.id)} style={{
                  width:"100%", padding:14, borderRadius:14, border:"none",
                  fontWeight:800, fontSize:14, color:"#000", cursor:"pointer",
                  background:"linear-gradient(135deg,#b8960c,#D4AF37,#F5C842)",
                  boxShadow:"0 4px 20px rgba(212,175,55,0.3)",
                }}>
                  ✓ Check-out Karo
                </button>
              )}
              {selGuest.guestPhone && (
                <a href={`tel:${selGuest.guestPhone}`} style={{
                  display:"block", textAlign:"center", padding:"12px",
                  borderRadius:14, textDecoration:"none",
                  background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.25)",
                  fontWeight:700, fontSize:13, color:"#22c55e",
                }}>
                  📞 Call Guest
                </a>
              )}
              <button onClick={() => setSelGuest(null)} style={{
                width:"100%", padding:12, borderRadius:14, border:"1px solid rgba(255,255,255,0.08)",
                fontWeight:600, fontSize:13, color:"rgba(255,255,255,0.3)",
                background:"transparent", cursor:"pointer",
              }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
