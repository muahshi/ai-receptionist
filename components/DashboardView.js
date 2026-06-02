"use client";
/**
 * components/DashboardView.js — The GuestInn Network
 * ═══════════════════════════════════════════════════════════════
 * Frontdesk Terminal — Real-time Room Grid Interceptor
 *
 * Features:
 * • Floor-by-floor room matrix with correct color tokens:
 *     VACANT  → #22c55e (Green)
 *     RESERVED → #D4AF37 (Gold) ← Marketplace pending bookings
 *     OCCUPIED → #ef4444 (Red)
 *     CLEANING → #818cf8 (Purple)
 * • Gold (Reserved) bookings show Approve button → transitions to Occupied
 * • GRC Print Modal — single click to print full populated GRC form
 * • Comprehensive CSV export via lib/db.js exportComprehensiveCSV()
 * • Realtime Supabase subscription for live updates
 * ═══════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Users, TrendingUp, BedDouble, Coffee, Download,
  RefreshCw, Printer, CheckCircle, X, Eye, ChevronDown,
  ChevronUp, AlertTriangle, Zap, Crown
} from "lucide-react";
import {
  getHotelConfig, getRooms, getTodayStats, getTodayBookings,
  getBookingsSync, checkoutBooking, updateRoomStatus,
  approveReservation, getBookingsByStatus, exportCSV,
  exportComprehensiveCSV, getActiveHotelId,
} from "../lib/db";

// ── Color tokens ─────────────────────────────────────────────
const STATUS_COLOR = {
  vacant:   "#22c55e",
  reserved: "#D4AF37",   // Gold — marketplace pending approval
  occupied: "#ef4444",
  cleaning: "#818cf8",
};
const STATUS_LABEL = {
  vacant:   "Vacant",
  reserved: "Reserved",
  occupied: "Occupied",
  cleaning: "Cleaning",
};
const STATUS_BG = {
  vacant:   "rgba(34,197,94,0.08)",
  reserved: "rgba(212,175,55,0.1)",
  occupied: "rgba(239,68,68,0.08)",
  cleaning: "rgba(129,140,248,0.08)",
};

// ══════════════════════════════════════════════════════════════
// GRC PRINT MODAL
// Full populated GRC (Guest Registration Card) layout.
// All sensitive ID fields show [Aadhaar Redacted] placeholder.
// ══════════════════════════════════════════════════════════════
function GRCPrintModal({ booking, hotel, onClose }) {
  const printRef = useRef(null);
  if (!booking) return null;

  const bid        = booking.id?.slice(-10).toUpperCase();
  const checkInFmt = booking.checkInDate  ? new Date(booking.checkInDate).toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"}) : "—";
  const checkOutFmt= booking.checkOutDate ? new Date(booking.checkOutDate).toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"}) : "—";
  const today      = new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"});

  const handlePrint = () => {
    if (!printRef.current) return;
    const w = window.open("","_blank","width=794,height=1123");
    if (!w) return;
    w.document.write(`
<!DOCTYPE html>
<html>
<head>
  <title>GRC — ${hotel?.name} — ${booking.guestName}</title>
  <style>
    * { box-sizing:border-box; margin:0; padding:0; }
    body { font-family:"Times New Roman",serif; font-size:11pt; color:#000; background:#fff; padding:20px; }
    .page { width:754px; min-height:1063px; border:1px solid #999; padding:20px; }
    .header { text-align:center; border-bottom:2px solid #000; padding-bottom:12px; margin-bottom:14px; }
    .hotel-name { font-size:20pt; font-weight:bold; text-transform:uppercase; letter-spacing:1px; }
    .hotel-sub  { font-size:10pt; color:#555; margin-top:4px; }
    .grc-title  { font-size:14pt; font-weight:bold; text-transform:uppercase; letter-spacing:3px; margin:10px 0; border:1px solid #000; padding:5px; display:inline-block; }
    .ref-row    { display:flex; justify-content:space-between; font-size:9pt; color:#333; margin-bottom:10px; }
    .section    { margin-bottom:12px; }
    .sec-title  { font-size:9pt; font-weight:bold; text-transform:uppercase; letter-spacing:1px; color:#333; border-bottom:1px solid #ddd; padding-bottom:3px; margin-bottom:8px; }
    .field-grid { display:grid; grid-template-columns:1fr 1fr; gap:0; }
    .field-grid-3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:0; }
    .field      { border:1px solid #ccc; padding:5px 8px; min-height:30px; }
    .field-label{ font-size:7pt; color:#777; text-transform:uppercase; letter-spacing:0.5px; display:block; margin-bottom:2px; }
    .field-val  { font-size:10pt; font-weight:600; color:#000; min-height:14px; }
    .id-section { border:1px dashed #999; padding:10px; margin-bottom:12px; }
    .id-note    { font-size:8pt; color:#888; font-style:italic; }
    .photo-box  { width:100px; height:80px; border:1px solid #ccc; display:flex; align-items:center; justify-content:center; font-size:8pt; color:#999; text-align:center; }
    .fin-grid   { display:grid; grid-template-columns:1fr 1fr 1fr; }
    .total-row  { border-top:2px solid #000; display:flex; justify-content:space-between; padding:6px 8px; font-weight:bold; font-size:12pt; }
    .sig-section{ display:grid; grid-template-columns:1fr 1fr; gap:30px; margin-top:20px; }
    .sig-box    { border-top:1px solid #000; padding-top:5px; text-align:center; font-size:8pt; color:#555; }
    .footer     { margin-top:16px; padding-top:8px; border-top:1px solid #ddd; display:flex; justify-content:space-between; font-size:8pt; color:#888; }
    .badge      { display:inline-block; padding:2px 8px; border:1px solid; font-size:8pt; font-weight:bold; text-transform:uppercase; border-radius:3px; }
    .badge-reserved { color:#7a6200; border-color:#D4AF37; background:#fffbea; }
    .badge-occupied { color:#7f0000; border-color:#ef4444; background:#fff0f0; }
    .badge-active   { color:#005a0e; border-color:#22c55e; background:#f0fff4; }
    @media print {
      body { padding:0; }
      .page { border:none; }
    }
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="hotel-name">${hotel?.emoji || "🏨"} ${hotel?.name || "Hotel"}</div>
    <div class="hotel-sub">${hotel?.addressLine || hotel?.location || ""}</div>
    ${hotel?.ownerPhone ? `<div class="hotel-sub">📞 ${hotel.ownerPhone}</div>` : ""}
    <div class="grc-title">Guest Registration Card</div>
  </div>

  <div class="ref-row">
    <span><strong>GRC No:</strong> GRC-${bid}</span>
    <span><strong>Status:</strong>
      <span class="badge ${booking.status === "reserved" ? "badge-reserved" : booking.status === "occupied" ? "badge-occupied" : "badge-active"}">
        ${booking.status?.toUpperCase()}
      </span>
    </span>
    <span><strong>Date:</strong> ${today}</span>
  </div>

  <!-- GUEST DETAILS -->
  <div class="section">
    <div class="sec-title">📋 Guest Personal Information</div>
    <div class="field-grid">
      <div class="field"><span class="field-label">Full Name</span><div class="field-val">${booking.guestName || "—"}</div></div>
      <div class="field"><span class="field-label">Mobile Number</span><div class="field-val">${booking.guestPhone || "—"}</div></div>
      <div class="field"><span class="field-label">Gender</span><div class="field-val">${booking.gender || "—"}</div></div>
      <div class="field"><span class="field-label">Date of Birth</span><div class="field-val">${booking.dob ? new Date(booking.dob).toLocaleDateString("en-IN") : "—"}</div></div>
      <div class="field"><span class="field-label">Nationality</span><div class="field-val">${booking.nationality || "Indian"}</div></div>
      <div class="field"><span class="field-label">Email</span><div class="field-val">${booking.email || "—"}</div></div>
    </div>
    <div class="field"><span class="field-label">Complete Address</span><div class="field-val" style="min-height:20px">${booking.address || "—"}</div></div>
  </div>

  <!-- TRAVEL DETAILS -->
  <div class="section">
    <div class="sec-title">✈️ Travel Information</div>
    <div class="field-grid">
      <div class="field"><span class="field-label">Arrival From</span><div class="field-val">${booking.arrivalFrom || "—"}</div></div>
      <div class="field"><span class="field-label">Proceeding To</span><div class="field-val">${booking.proceedingTo || "—"}</div></div>
      <div class="field"><span class="field-label">Purpose of Visit</span><div class="field-val">${booking.purposeOfVisit || "—"}</div></div>
      <div class="field"><span class="field-label">Total Guests</span><div class="field-val">${booking.totalGuests || 1}</div></div>
    </div>
  </div>

  <!-- ID DOCUMENT -->
  <div class="section">
    <div class="sec-title">🪪 Identity Document (Police Records Compliance)</div>
    <div class="id-section">
      <div class="field-grid">
        <div>
          <div class="field"><span class="field-label">ID Type</span><div class="field-val">${booking.idType || "Aadhaar"}</div></div>
          <div class="field"><span class="field-label">ID Number</span><div class="field-val">[Aadhaar Redacted]</div></div>
          <div class="id-note">⚠ Sensitive identification data is redacted per privacy policy. Original data stored securely in encrypted format for authorized police access only.</div>
        </div>
        <div style="display:flex;align-items:center;justify-content:center">
          ${booking.idImageBase64
            ? `<img src="data:image/jpeg;base64,${booking.idImageBase64}" style="max-width:180px;max-height:100px;border:1px solid #ccc;border-radius:4px" alt="ID Document" />`
            : '<div class="photo-box">📷 ID Image<br/>(Not Available)</div>'
          }
        </div>
      </div>
      ${booking.companyName ? `<div class="field-grid" style="margin-top:6px"><div class="field"><span class="field-label">Company Name</span><div class="field-val">${booking.companyName}</div></div><div class="field"><span class="field-label">GST Number</span><div class="field-val">${booking.gstNo || "—"}</div></div></div>` : ""}
    </div>
  </div>

  <!-- ROOM & STAY -->
  <div class="section">
    <div class="sec-title">🛏 Room & Stay Details</div>
    <div class="field-grid-3">
      <div class="field"><span class="field-label">Room Number</span><div class="field-val" style="font-size:14pt;color:#000">${booking.roomId || "—"}</div></div>
      <div class="field"><span class="field-label">Room Type</span><div class="field-val">${(booking.roomType||"Standard").charAt(0).toUpperCase()+(booking.roomType||"Standard").slice(1)}</div></div>
      <div class="field"><span class="field-label">No. of Nights</span><div class="field-val" style="font-size:14pt">${booking.nights || 1}</div></div>
      <div class="field"><span class="field-label">Check-In Date</span><div class="field-val">${checkInFmt}</div></div>
      <div class="field"><span class="field-label">Check-Out Date</span><div class="field-val">${checkOutFmt}</div></div>
      <div class="field"><span class="field-label">Payment Mode</span><div class="field-val">${booking.paymentMode || "Cash"}</div></div>
    </div>
  </div>

  <!-- FINANCIALS -->
  <div class="section">
    <div class="sec-title">💰 Financial Summary</div>
    <div class="fin-grid">
      <div class="field"><span class="field-label">Rate / Night</span><div class="field-val">₹${Number(booking.ratePerNight||0).toLocaleString("en-IN")}</div></div>
      <div class="field"><span class="field-label">AI Negotiated</span><div class="field-val">${booking.negotiated ? `Yes (from ₹${Number(booking.negotiatedFrom||0).toLocaleString("en-IN")})` : "No"}</div></div>
      <div class="field"><span class="field-label">Rate Lock Token</span><div class="field-val" style="font-size:8pt;font-family:monospace">${booking.rateLockToken || "—"}</div></div>
    </div>
    <div class="total-row">
      <span>TOTAL AMOUNT</span>
      <span>₹${Number(booking.totalAmount||0).toLocaleString("en-IN")}</span>
    </div>
  </div>

  <!-- SIGNATURES -->
  <div class="sig-section">
    <div>
      <div style="height:50px"></div>
      <div class="sig-box">Guest Signature & Date</div>
    </div>
    <div>
      <div style="height:50px"></div>
      <div class="sig-box">Authorised Staff Signature</div>
    </div>
  </div>

  <div class="footer">
    <span>GRC-${bid} • ${hotel?.name} • The GuestInn Network</span>
    <span>Printed: ${today} • Commission-Free Booking Platform</span>
  </div>
</div>
</body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); }, 500);
  };

  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ position:"fixed", inset:0, zIndex:100, background:"rgba(0,0,0,0.88)", display:"flex", alignItems:"center", justifyContent:"center", padding:16, overflowY:"auto" }}>
      <div style={{ background:"#0d0f1a", border:"1px solid rgba(255,255,255,0.1)", borderRadius:20, width:"100%", maxWidth:520, maxHeight:"92vh", overflowY:"auto" }}>
        {/* Modal header */}
        <div style={{ padding:"14px 16px", borderBottom:"1px solid rgba(255,255,255,0.07)", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, background:"#0d0f1a", zIndex:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <Printer size={15} style={{ color:"#D4AF37" }} />
            <div>
              <p style={{ fontSize:12, fontWeight:800, color:"#D4AF37" }}>GRC Print — {booking.guestName}</p>
              <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)" }}>Room {booking.roomId} · {bid}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width:28, height:28, borderRadius:7, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.4)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <X size={13} />
          </button>
        </div>

        {/* Preview card (compact) */}
        <div ref={printRef} style={{ padding:16 }}>
          <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12, padding:"14px", marginBottom:14 }}>
            <p style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.25)", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:10, textAlign:"center" }}>GRC Preview</p>

            {/* Hotel + status */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12, paddingBottom:10, borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
              <p style={{ fontSize:13, fontWeight:800, color:"#fff" }}>{hotel?.name}</p>
              <StatusBadge status={booking.status} />
            </div>

            {/* Fields grid */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {[
                ["GRC Ref",       `GRC-${bid}`],
                ["Guest",         booking.guestName],
                ["Phone",         booking.guestPhone],
                ["Gender",        booking.gender || "—"],
                ["Room",          booking.roomId || "—"],
                ["Room Type",     (booking.roomType||"standard").charAt(0).toUpperCase()+(booking.roomType||"standard").slice(1)],
                ["Check-In",      booking.checkInDate ? new Date(booking.checkInDate).toLocaleDateString("en-IN") : "—"],
                ["Check-Out",     booking.checkOutDate ? new Date(booking.checkOutDate).toLocaleDateString("en-IN") : "—"],
                ["Nights",        String(booking.nights||1)],
                ["Rate/Night",    `₹${Number(booking.ratePerNight||0).toLocaleString("en-IN")}`],
                ["ID Type",       booking.idType || "Aadhaar"],
                ["ID Number",     "[Aadhaar Redacted]"],  // privacy placeholder
              ].map(([label, val]) => (
                <div key={label} style={{ padding:"7px 9px", background:"rgba(255,255,255,0.03)", borderRadius:6, border:"1px solid rgba(255,255,255,0.05)" }}>
                  <p style={{ fontSize:8, color:"rgba(255,255,255,0.25)", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:2 }}>{label}</p>
                  <p style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.8)", fontFamily:label==="GRC Ref"||label==="ID Number"?"monospace":"inherit" }}>{val || "—"}</p>
                </div>
              ))}
            </div>

            {/* Address */}
            {booking.address && (
              <div style={{ padding:"8px 9px", background:"rgba(255,255,255,0.03)", borderRadius:6, border:"1px solid rgba(255,255,255,0.05)", marginTop:8 }}>
                <p style={{ fontSize:8, color:"rgba(255,255,255,0.25)", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:2 }}>Address</p>
                <p style={{ fontSize:11, color:"rgba(255,255,255,0.7)" }}>{booking.address}</p>
              </div>
            )}

            {/* Total */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:10, paddingTop:10, borderTop:"1px solid rgba(255,255,255,0.08)" }}>
              <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>Total Amount</p>
              <p style={{ fontSize:20, fontWeight:900, color:"#D4AF37" }}>₹{Number(booking.totalAmount||0).toLocaleString("en-IN")}</p>
            </div>

            {/* ID image indicator */}
            {booking.idImageBase64 && (
              <div style={{ marginTop:8, padding:"6px 9px", borderRadius:6, background:"rgba(34,197,94,0.06)", border:"1px solid rgba(34,197,94,0.15)", display:"flex", alignItems:"center", gap:6 }}>
                <div style={{ width:5, height:5, borderRadius:"50%", background:"#22c55e" }} />
                <p style={{ fontSize:9, color:"rgba(34,197,94,0.7)" }}>ID image (Base64) — will print in full GRC</p>
              </div>
            )}
          </div>

          {/* Print button */}
          <button onClick={handlePrint}
            style={{ width:"100%", padding:"13px", borderRadius:12, background:"linear-gradient(135deg,#b8960c,#D4AF37,#F5C842)", color:"#000", border:"none", cursor:"pointer", fontWeight:900, fontSize:13, display:"flex", alignItems:"center", justifyContent:"center", gap:8, boxShadow:"0 4px 20px rgba(212,175,55,0.3)" }}>
            <Printer size={15} /> Full GRC Print / Download Karo
          </button>
          <p style={{ fontSize:9, color:"rgba(255,255,255,0.2)", textAlign:"center", marginTop:6 }}>
            Print dialog mein "Save as PDF" select karo digital copy ke liye
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Status badge ─────────────────────────────────────────────
function StatusBadge({ status }) {
  const c = STATUS_COLOR[status] || "#888";
  const l = STATUS_LABEL[status] || status;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:20, background:`${c}18`, border:`1px solid ${c}44`, fontSize:10, fontWeight:800, color:c, letterSpacing:"0.06em" }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:c, display:"inline-block" }} />
      {l.toUpperCase()}
    </span>
  );
}

// ── Room cell ─────────────────────────────────────────────────
function RoomCell({ room, onClick, isSelected }) {
  const c = STATUS_COLOR[room.status] || "#888";
  return (
    <button onClick={() => onClick(room)}
      style={{
        aspectRatio: "1/1.15", borderRadius: 6, cursor: "pointer",
        background:  isSelected ? `${c}22` : "rgba(255,255,255,0.03)",
        border:      `1px solid ${isSelected ? c : "rgba(255,255,255,0.07)"}`,
        display:     "flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:2,
        transition:  "all 0.15s ease", outline:"none", padding:2,
        boxShadow:   isSelected ? `0 0 10px ${c}44` : "none",
        // Gold pulse animation for reserved rooms
        animation:   room.status === "reserved" ? "goldCellPulse 2.5s ease-in-out infinite" : "none",
      }}
    >
      <div style={{ width:5, height:5, borderRadius:"50%", background:c, boxShadow:`0 0 4px ${c}` }} />
      <span style={{ fontSize:7, color:"rgba(255,255,255,0.45)", fontFamily:"monospace", fontWeight:700 }}>
        {String(room.number).padStart(2,"0")}
      </span>
    </button>
  );
}

// ── Booking detail panel ──────────────────────────────────────
function BookingPanel({ booking, hotel, onApprove, onCheckout, onPrint, onClose }) {
  if (!booking) return null;
  const bid        = booking.id?.slice(-10).toUpperCase();
  const checkInFmt = booking.checkInDate  ? new Date(booking.checkInDate).toLocaleDateString("en-IN")  : "—";
  const checkOutFmt= booking.checkOutDate ? new Date(booking.checkOutDate).toLocaleDateString("en-IN") : "—";

  return (
    <div style={{ background:"rgba(7,9,14,0.98)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, overflow:"hidden", animation:"fadeUp 0.25s ease" }}>
      {/* Panel header */}
      <div style={{ padding:"12px 14px", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", justifyContent:"space-between", alignItems:"center", background:STATUS_BG[booking.status] }}>
        <div>
          <p style={{ fontSize:12, fontWeight:800, color:STATUS_COLOR[booking.status] || "#fff" }}>
            {booking.guestName}
          </p>
          <p style={{ fontSize:9, color:"rgba(255,255,255,0.4)" }}>GRC-{bid} · Room {booking.roomId}</p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <StatusBadge status={booking.status} />
          <button onClick={onClose} style={{ width:24, height:24, borderRadius:6, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.4)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <X size={11} />
          </button>
        </div>
      </div>

      <div style={{ padding:"12px 14px" }}>
        {/* Reserved alert */}
        {booking.status === "reserved" && (
          <div style={{ padding:"10px 12px", borderRadius:10, background:"rgba(212,175,55,0.06)", border:"1px solid rgba(212,175,55,0.25)", marginBottom:10, display:"flex", gap:8, animation:"fadeUp 0.3s ease" }}>
            <AlertTriangle size={14} style={{ color:"#D4AF37", flexShrink:0, marginTop:1 }} />
            <div>
              <p style={{ fontSize:11, fontWeight:800, color:"#D4AF37", marginBottom:2 }}>Marketplace Reservation — Approval Pending</p>
              <p style={{ fontSize:10, color:"rgba(255,255,255,0.45)", lineHeight:1.4 }}>Guest ne online book kiya hai. Approve karo toh room OCCUPIED (Red) ho jaega.</p>
            </div>
          </div>
        )}

        {/* Fields */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
          {[
            ["Phone",     booking.guestPhone],
            ["Room Type", (booking.roomType||"standard").charAt(0).toUpperCase()+(booking.roomType||"standard").slice(1)],
            ["Check-In",  checkInFmt],
            ["Check-Out", checkOutFmt],
            ["Nights",    String(booking.nights||1)],
            ["Payment",   booking.paymentMode || "Cash"],
          ].map(([l,v]) => (
            <div key={l} style={{ padding:"7px 9px", background:"rgba(255,255,255,0.03)", borderRadius:7, border:"1px solid rgba(255,255,255,0.05)" }}>
              <p style={{ fontSize:8, color:"rgba(255,255,255,0.25)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:1 }}>{l}</p>
              <p style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.8)" }}>{v||"—"}</p>
            </div>
          ))}
        </div>

        {/* Total */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 10px", borderRadius:8, background:"rgba(212,175,55,0.06)", border:"1px solid rgba(212,175,55,0.12)", marginBottom:10 }}>
          <span style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>Total · ₹{Number(booking.ratePerNight||0).toLocaleString("en-IN")}/raat</span>
          <span style={{ fontSize:18, fontWeight:900, color:"#D4AF37" }}>₹{Number(booking.totalAmount||0).toLocaleString("en-IN")}</span>
        </div>

        {/* Rate lock */}
        {booking.rateLocked && (
          <div style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 9px", borderRadius:7, background:"rgba(34,197,94,0.05)", border:"1px solid rgba(34,197,94,0.12)", marginBottom:10 }}>
            <Zap size={10} style={{ color:"#22c55e", flexShrink:0 }} />
            <p style={{ fontSize:9, color:"rgba(34,197,94,0.7)" }}>Rate Locked{booking.rateLockToken ? ` · ${booking.rateLockToken.slice(-10)}` : ""}</p>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
          {/* APPROVE — only for reserved */}
          {booking.status === "reserved" && (
            <button onClick={() => onApprove(booking)}
              style={{ width:"100%", padding:"12px", borderRadius:11, background:"linear-gradient(135deg,#b8960c,#D4AF37,#F5C842)", color:"#000", border:"none", cursor:"pointer", fontWeight:900, fontSize:13, display:"flex", alignItems:"center", justifyContent:"center", gap:7, boxShadow:"0 4px 16px rgba(212,175,55,0.3)" }}>
              <CheckCircle size={14} /> Reservation Approve Karo → Occupied
            </button>
          )}

          {/* CHECKOUT — only for occupied/active */}
          {(booking.status === "occupied" || booking.status === "active") && (
            <button onClick={() => onCheckout(booking)}
              style={{ width:"100%", padding:"11px", borderRadius:11, background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", color:"#ef4444", cursor:"pointer", fontWeight:700, fontSize:12, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
              Checkout Karo
            </button>
          )}

          {/* PRINT GRC — always available */}
          <button onClick={() => onPrint(booking)}
            style={{ width:"100%", padding:"11px", borderRadius:11, background:"rgba(212,175,55,0.06)", border:"1px solid rgba(212,175,55,0.2)", color:"#D4AF37", cursor:"pointer", fontWeight:700, fontSize:12, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
            <Printer size={13} /> GRC Print Karo (Full Form)
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// STAT CARD
// ══════════════════════════════════════════════════════════════
function StatCard({ label, value, sub, color = "#D4AF37", icon: Icon }) {
  return (
    <div style={{ padding:"13px", background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:14 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
        <p style={{ fontSize:9, fontWeight:700, color:"rgba(255,255,255,0.3)", letterSpacing:"0.1em", textTransform:"uppercase" }}>{label}</p>
        {Icon && <Icon size={13} style={{ color:"rgba(255,255,255,0.2)" }} />}
      </div>
      <p style={{ fontSize:22, fontWeight:900, color, lineHeight:1, marginBottom:4 }}>{value}</p>
      {sub && <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)", lineHeight:1.4 }}>{sub}</p>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN DASHBOARD VIEW
// ══════════════════════════════════════════════════════════════
export default function DashboardView({ hotelId: propHotelId }) {
  const hotelId = propHotelId || getActiveHotelId();

  const [config,       setConfig]       = useState(null);
  const [rooms,        setRooms]        = useState([]);
  const [stats,        setStats]        = useState(null);
  const [todayBks,     setTodayBks]     = useState([]);
  const [allBks,       setAllBks]       = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedBk,   setSelectedBk]   = useState(null);
  const [printTarget,  setPrintTarget]  = useState(null);
  const [aiInsight,    setAiInsight]    = useState("");
  const [insightLoading,setInsightLoading] = useState(false);
  const [lastRefresh,  setLastRefresh]  = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [toast,        setToast]        = useState(null);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const loadData = useCallback(() => {
    const cfg  = getHotelConfig(hotelId);
    const rm   = getRooms(hotelId);
    const st   = getTodayStats(hotelId);
    const tbks = getTodayBookings(hotelId);
    const abks = getBookingsSync(hotelId);
    setConfig(cfg);
    setRooms(rm);
    setStats(st);
    setTodayBks(tbks);
    setAllBks(abks);
    setLastRefresh(new Date());
  }, [hotelId]);

  // Initial load
  useEffect(() => { loadData(); }, [loadData]);

  // Supabase realtime subscription
  useEffect(() => {
    let channel = null;
    const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!sbUrl || sbUrl === "undefined") return;
    try {
      const { createClient } = require("@supabase/supabase-js");
      const sb = createClient(sbUrl, sbKey);
      channel = sb.channel(`dashboard_${hotelId}`)
        .on("postgres_changes", {
          event:  "*",
          schema: "public",
          table:  "bookings",
          filter: `hotel_id=eq.${hotelId}`,
        }, () => { loadData(); })
        .subscribe();
    } catch {}
    return () => { if (channel) try { channel.unsubscribe(); } catch {} };
  }, [hotelId, loadData]);

  // Auto-refresh every 45s
  useEffect(() => {
    const t = setInterval(loadData, 45000);
    return () => clearInterval(t);
  }, [loadData]);

  // AI insight
  const fetchInsight = useCallback(async () => {
    if (!stats) return;
    setInsightLoading(true);
    try {
      const res = await fetch("/api/groq", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ type:"ai_insight", stats, hotelName:config?.name }),
      });
      const data = await res.json();
      if (data.success) setAiInsight(data.insight || "");
    } catch {}
    setInsightLoading(false);
  }, [stats, config]);

  // Approve reservation → occupied
  const handleApprove = useCallback(async (booking) => {
    const updated = await approveReservation(hotelId, booking.id);
    if (updated) {
      loadData();
      setSelectedBk(null);
      setSelectedRoom(null);
      showToast(`✅ ${booking.guestName} ka reservation approve ho gaya! Room ${booking.roomId} → OCCUPIED`, "success");
      // Send WhatsApp confirmation
      try {
        const { sendBookingAlerts } = await import("../lib/alerts");
        await sendBookingAlerts({ ...updated, status:"occupied" });
      } catch {}
    }
  }, [hotelId, loadData, showToast]);

  // Checkout
  const handleCheckout = useCallback(async (booking) => {
    if (!window.confirm(`${booking.guestName} ka checkout karna chahte ho?`)) return;
    await checkoutBooking(hotelId, booking.id);
    loadData();
    setSelectedBk(null);
    setSelectedRoom(null);
    showToast(`${booking.guestName} checkout ho gaye. Room cleaning mein gaya.`);
  }, [hotelId, loadData, showToast]);

  // Room click → find active booking
  const handleRoomClick = useCallback((room) => {
    setSelectedRoom(room);
    if (room.currentBookingId) {
      const bk = allBks.find(b => b.id === room.currentBookingId);
      setSelectedBk(bk || null);
    } else {
      setSelectedBk(null);
    }
  }, [allBks]);

  // Filtered bookings
  const filteredBks = activeFilter === "all"      ? allBks
                    : activeFilter === "today"    ? todayBks
                    : getBookingsByStatus(hotelId, activeFilter);

  // Reserved bookings count (for badge)
  const reservedCount = rooms.filter(r => r.status === "reserved").length;

  // Floors
  const byFloor = rooms.reduce((acc, r) => { (acc[r.floor]=acc[r.floor]||[]).push(r); return acc; }, {});
  const floors  = Object.keys(byFloor).map(Number).sort((a,b) => a-b);

  if (!config) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:40 }}>
      <div style={{ width:36, height:36, borderRadius:"50%", border:"2px solid rgba(212,175,55,0.2)", borderTop:"2px solid #D4AF37", animation:"dashSpin 1s linear infinite" }} />
      <style>{`@keyframes dashSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ padding:"0 0 80px", fontFamily:"system-ui,-apple-system,sans-serif" }}>
      <style>{`
        @keyframes fadeUp       { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes goldCellPulse{ 0%,100%{box-shadow:0 0 0 0 rgba(212,175,55,0.4)} 50%{box-shadow:0 0 0 5px rgba(212,175,55,0)} }
        @keyframes dashSpin     { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes slideInToast { from{opacity:0;transform:translateX(100%)} to{opacity:1;transform:translateX(0)} }
        ::-webkit-scrollbar{width:3px} ::-webkit-scrollbar-thumb{background:rgba(212,175,55,0.15);border-radius:3px}
      `}</style>

      {/* TOAST */}
      {toast && (
        <div style={{ position:"fixed", top:16, right:16, zIndex:999, maxWidth:280, padding:"12px 14px", borderRadius:12, background:toast.type==="success"?"rgba(34,197,94,0.12)":"rgba(239,68,68,0.12)", border:`1px solid ${toast.type==="success"?"rgba(34,197,94,0.3)":"rgba(239,68,68,0.3)"}`, color:toast.type==="success"?"#22c55e":"#ef4444", fontSize:11, fontWeight:600, animation:"slideInToast 0.3s ease", boxShadow:"0 4px 20px rgba(0,0,0,0.5)" }}>
          {toast.msg}
        </div>
      )}

      {/* HEADER */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
        <div>
          <p style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginBottom:2 }}>
            {new Date().toLocaleDateString("en-IN",{weekday:"long",day:"2-digit",month:"long"})}
          </p>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <h2 style={{ fontSize:18, fontWeight:900, color:"#fff" }}>{config.name}</h2>
            {reservedCount > 0 && (
              <div style={{ display:"flex", alignItems:"center", gap:4, padding:"3px 9px", borderRadius:10, background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.3)", animation:"goldCellPulse 2s infinite" }}>
                <span style={{ width:6, height:6, borderRadius:"50%", background:"#D4AF37", display:"inline-block" }} />
                <span style={{ fontSize:9, fontWeight:800, color:"#D4AF37" }}>{reservedCount} RESERVED</span>
              </div>
            )}
          </div>
        </div>
        <div style={{ display:"flex", gap:7 }}>
          <button onClick={loadData} style={{ width:34, height:34, borderRadius:9, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.4)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <RefreshCw size={13} />
          </button>
          <div style={{ position:"relative" }}>
            <button onClick={() => setShowExportMenu(p => !p)} style={{ height:34, padding:"0 12px", borderRadius:9, background:"rgba(212,175,55,0.08)", border:"1px solid rgba(212,175,55,0.2)", color:"#D4AF37", cursor:"pointer", display:"flex", alignItems:"center", gap:5, fontSize:11, fontWeight:700 }}>
              <Download size={13} /> Export {showExportMenu ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>
            {showExportMenu && (
              <div style={{ position:"absolute", top:"calc(100% + 6px)", right:0, background:"#0d0f1a", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, padding:6, minWidth:190, zIndex:30, boxShadow:"0 8px 30px rgba(0,0,0,0.5)", animation:"fadeUp 0.2s ease" }}>
                <button onClick={() => { exportCSV(hotelId); setShowExportMenu(false); }}
                  style={{ width:"100%", padding:"9px 12px", background:"transparent", border:"none", color:"rgba(255,255,255,0.7)", fontSize:11, cursor:"pointer", textAlign:"left", borderRadius:8, display:"flex", alignItems:"center", gap:7 }}>
                  <Download size={12} /> Basic Bookings CSV
                </button>
                <button onClick={() => { exportComprehensiveCSV(hotelId); setShowExportMenu(false); }}
                  style={{ width:"100%", padding:"9px 12px", background:"rgba(212,175,55,0.05)", border:"none", color:"#D4AF37", fontSize:11, cursor:"pointer", textAlign:"left", borderRadius:8, fontWeight:700, display:"flex", alignItems:"center", gap:7 }}>
                  <Crown size={12} /> Full GRC CSV (Sab Fields)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* STATS GRID */}
      {stats && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:8, marginBottom:12, animation:"fadeUp 0.3s ease" }}>
          <StatCard label="Occupied" value={stats.occupiedRooms} sub={`of ${stats.totalRooms} rooms`} color="#ef4444" icon={BedDouble} />
          <StatCard label="Reserved" value={stats.reservedRooms} sub="Pending approval" color="#D4AF37" icon={Users} />
          <StatCard label="Vacant" value={stats.vacantRooms} sub={`${stats.occupancyPercent}% occupancy`} color="#22c55e" icon={BedDouble} />
          <StatCard label="Today Revenue" value={`₹${(stats.todayRevenue||0).toLocaleString("en-IN")}`} sub={`${stats.todayCheckIns} check-ins`} color="#D4AF37" icon={TrendingUp} />
        </div>
      )}

      {/* AI INSIGHT */}
      <div style={{ padding:"12px 14px", borderRadius:14, background:"rgba(212,175,55,0.04)", border:"1px solid rgba(212,175,55,0.12)", marginBottom:12, display:"flex", alignItems:"flex-start", gap:10 }}>
        <div style={{ width:32, height:32, borderRadius:8, background:"rgba(212,175,55,0.08)", border:"1px solid rgba(212,175,55,0.2)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:15 }}>🤖</div>
        <div style={{ flex:1 }}>
          {aiInsight
            ? <p style={{ fontSize:11, color:"rgba(255,255,255,0.65)", lineHeight:1.6, animation:"fadeUp 0.3s ease" }}>{aiInsight}</p>
            : <p style={{ fontSize:11, color:"rgba(255,255,255,0.25)", lineHeight:1.6 }}>
                {insightLoading ? "AI insight generate ho raha hai..." : "AI revenue insight ke liye tap karo →"}
              </p>
          }
        </div>
        <button onClick={fetchInsight} disabled={insightLoading}
          style={{ padding:"6px 10px", borderRadius:8, background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.2)", color:"#D4AF37", fontSize:10, fontWeight:700, cursor:insightLoading?"not-allowed":"pointer", flexShrink:0, opacity:insightLoading?0.5:1 }}>
          {insightLoading ? "..." : "Refresh"}
        </button>
      </div>

      {/* ROOM MATRIX */}
      <div style={{ background:"rgba(6,8,15,0.98)", border:"1px solid rgba(255,255,255,0.055)", borderRadius:20, padding:"14px", marginBottom:12 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
          <p style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.45)", letterSpacing:"0.1em", textTransform:"uppercase" }}>Floor Room Matrix</p>
          <p style={{ fontSize:9, color:"rgba(255,255,255,0.2)" }}>
            Last refresh: {lastRefresh?.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}
          </p>
        </div>

        {/* Legend */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:"6px 14px", marginBottom:12, paddingBottom:10, borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
          {Object.entries(STATUS_COLOR).map(([status, color]) => (
            <div key={status} style={{ display:"flex", alignItems:"center", gap:5 }}>
              <div style={{ width:7, height:7, borderRadius:"50%", background:color, boxShadow:`0 0 5px ${color}` }} />
              <span style={{ fontSize:9, color:"rgba(255,255,255,0.4)", fontWeight:600 }}>
                {STATUS_LABEL[status]} ({rooms.filter(r => r.status === status).length})
              </span>
            </div>
          ))}
        </div>

        {/* Floor rows */}
        {floors.map(floor => {
          const fr   = byFloor[floor];
          const cols = 6;
          const padded = [...fr];
          while (padded.length % cols !== 0) padded.push(null);
          const rowArr = [];
          for (let i = 0; i < padded.length; i += cols) rowArr.push(padded.slice(i, i + cols));

          return (
            <div key={floor} style={{ marginBottom:6 }}>
              {rowArr.map((row, ri) => (
                <div key={ri} style={{ display:"flex", alignItems:"flex-end", gap:4, marginBottom:4 }}>
                  <span style={{ fontSize:7, color:"rgba(255,255,255,0.2)", width:16, textAlign:"right", flexShrink:0, fontFamily:"monospace", fontWeight:700, paddingBottom:4 }}>
                    {ri === 0 ? `F${floor}` : ""}
                  </span>
                  <div style={{ flex:1, display:"grid", gridTemplateColumns:`repeat(${cols},1fr)`, gap:4 }}>
                    {row.map((room, ci) => room
                      ? <RoomCell key={room.id} room={room} isSelected={selectedRoom?.id === room.id} onClick={handleRoomClick} />
                      : <div key={`p${ci}`} style={{ aspectRatio:"1/1.15", borderRadius:6, background:"rgba(255,255,255,0.005)", border:"1px dashed rgba(255,255,255,0.025)" }} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          );
        })}

        {/* Selected room panel */}
        {selectedRoom && (
          <div style={{ marginTop:12, animation:"fadeUp 0.25s ease" }}>
            {selectedBk ? (
              <BookingPanel
                booking={selectedBk}
                hotel={config}
                onApprove={handleApprove}
                onCheckout={handleCheckout}
                onPrint={bk => setPrintTarget(bk)}
                onClose={() => { setSelectedRoom(null); setSelectedBk(null); }}
              />
            ) : (
              <div style={{ padding:"12px 14px", borderRadius:12, background:STATUS_BG[selectedRoom.status], border:`1px solid ${STATUS_COLOR[selectedRoom.status]}33`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <p style={{ fontSize:12, fontWeight:800, color:STATUS_COLOR[selectedRoom.status] }}>
                    Room {selectedRoom.number} — {STATUS_LABEL[selectedRoom.status]}
                  </p>
                  <p style={{ fontSize:10, color:"rgba(255,255,255,0.35)" }}>Floor {selectedRoom.floor} · {selectedRoom.type}</p>
                </div>
                <button onClick={() => setSelectedRoom(null)} style={{ width:26, height:26, borderRadius:6, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.09)", color:"rgba(255,255,255,0.4)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <X size={12} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* BOOKINGS LIST */}
      <div style={{ background:"rgba(6,8,15,0.98)", border:"1px solid rgba(255,255,255,0.055)", borderRadius:20, padding:"14px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
          <p style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.45)", letterSpacing:"0.1em", textTransform:"uppercase" }}>Booking Records</p>
          <p style={{ fontSize:9, color:"rgba(255,255,255,0.2)" }}>{filteredBks.length} records</p>
        </div>

        {/* Filter tabs */}
        <div style={{ display:"flex", gap:6, marginBottom:12, overflowX:"auto", paddingBottom:4 }}>
          {[
            { k:"all",      l:"All" },
            { k:"reserved", l:`Reserved${reservedCount>0?` (${reservedCount})`:""}` },
            { k:"occupied", l:"Occupied" },
            { k:"today",    l:"Today" },
            { k:"checked_out", l:"Checked Out" },
          ].map(({ k, l }) => (
            <button key={k} onClick={() => setActiveFilter(k)}
              style={{ padding:"6px 12px", borderRadius:9, background:activeFilter===k?(k==="reserved"?"rgba(212,175,55,0.15)":"rgba(255,255,255,0.08)"):"rgba(255,255,255,0.03)", border:`1px solid ${activeFilter===k?(k==="reserved"?"rgba(212,175,55,0.4)":"rgba(255,255,255,0.2)"):"rgba(255,255,255,0.06)"}`, color:activeFilter===k?(k==="reserved"?"#D4AF37":"#fff"):"rgba(255,255,255,0.35)", fontSize:10, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap" }}>
              {l}
            </button>
          ))}
        </div>

        {filteredBks.length === 0 ? (
          <div style={{ textAlign:"center", padding:"30px 0" }}>
            <Coffee size={26} style={{ color:"rgba(255,255,255,0.12)", margin:"0 auto 8px", display:"block" }} />
            <p style={{ fontSize:12, color:"rgba(255,255,255,0.2)" }}>Koi booking nahi hai</p>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
            {filteredBks.slice(0, 30).map(bk => (
              <div key={bk.id} onClick={() => {
                const room = rooms.find(r => r.id === bk.roomId);
                setSelectedRoom(room || null);
                setSelectedBk(bk);
                window.scrollTo({ top:0, behavior:"smooth" });
              }}
              style={{
                padding:"11px 12px", borderRadius:12, cursor:"pointer",
                background:STATUS_BG[bk.status] || "rgba(255,255,255,0.025)",
                border:`1px solid ${STATUS_COLOR[bk.status]||"rgba(255,255,255,0.07)"}22`,
                display:"flex", justifyContent:"space-between", alignItems:"center",
                transition:"opacity 0.15s",
                // Gold pulse for reserved rows
                animation: bk.status === "reserved" ? "goldCellPulse 2.5s ease-in-out infinite" : "none",
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:3 }}>
                    <p style={{ fontSize:12, fontWeight:800, color:"#fff", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{bk.guestName}</p>
                    <StatusBadge status={bk.status} />
                  </div>
                  <p style={{ fontSize:10, color:"rgba(255,255,255,0.35)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    Room {bk.roomId} · {bk.checkInDate ? new Date(bk.checkInDate).toLocaleDateString("en-IN") : "—"}
                    {bk.source === "marketplace" ? " · 🌐 Online" : ""}
                  </p>
                </div>
                <div style={{ textAlign:"right", flexShrink:0, marginLeft:8 }}>
                  <p style={{ fontSize:13, fontWeight:900, color:STATUS_COLOR[bk.status] || "#D4AF37" }}>₹{Number(bk.totalAmount||0).toLocaleString("en-IN")}</p>
                  <div style={{ display:"flex", gap:4, justifyContent:"flex-end", marginTop:4 }}>
                    <button onClick={e => { e.stopPropagation(); setPrintTarget(bk); }}
                      style={{ width:24, height:24, borderRadius:6, background:"rgba(212,175,55,0.08)", border:"1px solid rgba(212,175,55,0.2)", color:"#D4AF37", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <Printer size={10} />
                    </button>
                    {bk.status === "reserved" && (
                      <button onClick={async e => { e.stopPropagation(); await handleApprove(bk); }}
                        style={{ width:24, height:24, borderRadius:6, background:"rgba(212,175,55,0.12)", border:"1px solid rgba(212,175,55,0.3)", color:"#D4AF37", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}
                        title="Approve reservation">
                        <CheckCircle size={10} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* GRC PRINT MODAL */}
      {printTarget && (
        <GRCPrintModal
          booking={printTarget}
          hotel={config}
          onClose={() => setPrintTarget(null)}
        />
      )}

      {/* Export menu backdrop */}
      {showExportMenu && (
        <div onClick={() => setShowExportMenu(false)} style={{ position:"fixed", inset:0, zIndex:20 }} />
      )}
    </div>
  );
}
