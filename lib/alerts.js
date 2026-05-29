/**
 * lib/alerts.js — Triple Alert System
 * WhatsApp (wa.me links) + Email (mailto)
 * Uses hotel config phones/emails — no hardcoded env vars needed
 */
import { getHotelConfig } from "./db";

export async function sendBookingAlerts(booking) {
  const hid = booking.hotelId;
  const cfg = typeof window !== "undefined" ? getHotelConfig(hid) : {};

  const ownerPhone   = cfg?.ownerPhone   || process.env.NEXT_PUBLIC_OWNER_PHONE   || "";
  const managerPhone = cfg?.managerPhone || process.env.NEXT_PUBLIC_MANAGER_PHONE || "";
  const ownerEmail   = cfg?.ownerEmail   || "";
  const managerEmail = cfg?.managerEmail || "";
  const hotelName    = cfg?.name         || process.env.NEXT_PUBLIC_HOTEL_NAME    || "The GuestInn";

  const results = { owner:null, customer:null, manager:null, email:null };

  // ── 1. Owner WhatsApp alert ──────────────────────────────
  if (ownerPhone && ownerPhone.replace(/\D/g,"").length >= 10) {
    results.owner = sendWA(ownerPhone, ownerMsg(booking, hotelName));
  } else {
    console.log("[ALERT-OWNER]", ownerMsg(booking, hotelName));
    results.owner = { mode:"console" };
  }

  // ── 2. Guest WhatsApp confirmation ───────────────────────
  if (booking.guestPhone && booking.guestPhone.replace(/\D/g,"").length >= 10) {
    results.customer = sendWA(booking.guestPhone, guestMsg(booking, hotelName));
  }

  // ── 3. Manager WhatsApp alert ─────────────────────────────
  if (managerPhone && managerPhone.replace(/\D/g,"").length >= 10) {
    results.manager = sendWA(managerPhone, managerMsg(booking));
  }

  // ── 4. Push Notification (PWA devices) ─────────────────────
  try {
    const pushPayload = {
      title: `🏨 ${hotelName} — Naya Booking!`,
      body:  `Room ${booking.roomId} • ${booking.guestName || "Guest"} • ₹${Number(booking.totalAmount||0).toLocaleString("en-IN")}`,
      tag:   `booking-${booking.id}`,
      icon:  "/icons/icon-192.png",
      badge: "/icons/apple-touch-icon.png",
      url:   "/",
      sound: true,
    };
    await fetch("/api/push", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send", hotelId: hid, payload: pushPayload }),
    });
    results.push = { sent: true };
  } catch (e) {
    console.warn("[ALERT-PUSH] Failed:", e.message);
  }

  // ── 5. Owner Email (via API route) ────────────────────────
  if (ownerEmail || managerEmail) {
    try {
      const emails = [ownerEmail, managerEmail].filter(Boolean);
      await fetch("/api/alerts", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          type: "email",
          to:   emails,
          subject: `[${hotelName}] New Check-in — ${booking.guestName} — Room ${booking.roomId}`,
          text: ownerMsg(booking, hotelName),
          booking,
        }),
      });
      results.email = { sent:true, to:emails };
    } catch(e) {
      console.warn("[ALERT-EMAIL] Failed:", e.message);
    }
  }

  return results;
}

// Open WhatsApp link (client-side only, non-blocking)
function sendWA(phone, message) {
  if (typeof window === "undefined") return { mode:"ssr_skip" };
  try {
    const num = phone.replace(/\D/g,"");
    const url = `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
    // Open silently — don't block user flow
    const a = document.createElement("a");
    a.href = url; a.target = "_blank"; a.rel = "noopener";
    document.body.appendChild(a); a.click();
    setTimeout(() => document.body.removeChild(a), 500);
    return { mode:"whatsapp", phone:num };
  } catch(e) {
    return { mode:"error", error:e.message };
  }
}

function ownerMsg(b, hotelName) {
  const extras = (() => {
    try {
      const eg = typeof b.extraGuests === "string" ? JSON.parse(b.extraGuests) : b.extraGuests;
      return eg?.length ? `\n👥 *Extra Guests:* ${eg.map(g=>g.guestName||"—").join(", ")}` : "";
    } catch { return ""; }
  })();
  return `🏨 *${hotelName} — NEW CHECK-IN*

👤 *Guest:* ${b.guestName||"—"}
📱 *Phone:* ${b.guestPhone||"N/A"}
🪪 *ID:* ${b.idType||"—"} — ${b.idNumber||"—"}
🏠 *Room:* ${b.roomId} (${b.roomType||"standard"})
📅 *Check-in:* ${fmt(b.checkInDate)}
📅 *Check-out:* ${b.checkOutDate?fmt(b.checkOutDate):"—"}
🌙 *Nights:* ${b.nights||1}${extras}

💰 *RATE LOCKED:* ₹${num(b.ratePerNight)}/night
💵 *TOTAL:* ₹${num(b.totalAmount)}
💳 *Payment:* ${b.paymentMode||"—"}

⏰ ${new Date().toLocaleString("en-IN")}
🔒 ID: ${b.id?.slice(-8)||"—"}
_Rate lock active — koi change nahi ho sakta._`;
}

function guestMsg(b, hotelName) {
  return `🌟 *${hotelName}*
*Aapka Booking Confirm Ho Gaya!* ✅

Namaste ${b.guestName||"Guest"} Ji! 🙏

🏠 *Room:* ${b.roomId}
📅 *Check-in:* ${fmt(b.checkInDate)}
📅 *Check-out:* ${b.checkOutDate?fmt(b.checkOutDate):"—"}
🌙 *Nights:* ${b.nights||1}

💰 *Rate:* ₹${num(b.ratePerNight)}/night
💵 *Total:* ₹${num(b.totalAmount)}
💳 *Payment:* ${b.paymentMode||"—"}
🔒 *Ref:* ${b.id?.slice(-8)||"—"}

_Agar rate alag bataya jaye — is message ko dikhayein._
Thank you! 🙏 — ${hotelName}`;
}

function managerMsg(b) {
  return `✅ *Check-in Complete!*
Room ${b.roomId} — ${b.guestName||"Guest"}
Amount: ₹${num(b.totalAmount)} (${b.paymentMode||"—"})
Rate locked: ₹${num(b.ratePerNight)}/night
ID: ${b.id?.slice(-8)||"—"}
_Owner + Guest ko bhi alert bheja._`;
}

const fmt = (d) => { try { return new Date(d).toLocaleDateString("en-IN"); } catch { return d||"—"; } };
const num = (v) => Number(v||0).toLocaleString("en-IN");
