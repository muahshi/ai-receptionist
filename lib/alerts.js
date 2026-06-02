/**
 * lib/alerts.js — Triple Alert System (v3 — Phase 5: Welcome Kit)
 * WhatsApp (wa.me links) + Email (via /api/alerts) + Push (PWA)
 * Phase 5: sendWelcomeKit() — auto-sends digital companion link + Wi-Fi + room info to guest
 *
 * KEY CHANGES v3:
 * - sendWelcomeKit() added — triggers on check-in, sends Room No + Web App URL + Wi-Fi password
 * - WhatsApp welcome message (wa.me deep link) with companion URL
 * - Email welcome kit via /api/alerts with type="welcome-kit"
 */

import { getHotelConfig } from "./db";

/* ═══════════════════════════════════════════════════════════════
   PHONE SANITIZER
   Enforces standard Indian mobile format: 91XXXXXXXXXX (12 digits)
   Accepts: +91-98765-43210, 9876543210, 0098765, 91-98765-43210, etc.
   Returns null if number cannot be resolved to a valid Indian mobile.
═══════════════════════════════════════════════════════════════ */
function sanitizeIndianNumber(raw) {
  if (!raw) return null;

  // Strip everything except digits
  const digits = String(raw).replace(/\D/g, "");

  if (!digits) return null;

  // Already 12 digits starting with 91 — validate 10-digit portion starts with 6-9
  if (digits.length === 12 && digits.startsWith("91")) {
    const mobile = digits.slice(2);
    if (/^[6-9]\d{9}$/.test(mobile)) return digits;
    return null;
  }

  // 10 digit Indian mobile number
  if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) {
    return "91" + digits;
  }

  // 11 digits starting with 0 (e.g. 09876543210)
  if (digits.length === 11 && digits.startsWith("0")) {
    const mobile = digits.slice(1);
    if (/^[6-9]\d{9}$/.test(mobile)) return "91" + mobile;
    return null;
  }

  // 13 digits starting with 091
  if (digits.length === 13 && digits.startsWith("091")) {
    const mobile = digits.slice(3);
    if (/^[6-9]\d{9}$/.test(mobile)) return "91" + mobile;
    return null;
  }

  // If it has country code but also extra digits — try last 10
  if (digits.length > 10) {
    const last10 = digits.slice(-10);
    if (/^[6-9]\d{9}$/.test(last10)) return "91" + last10;
  }

  return null; // Could not resolve to valid Indian number
}

/* ═══════════════════════════════════════════════════════════════
   PHASE 5 — sendWelcomeKit
   Sends the Digital Companion welcome message to the guest
   immediately after check-in via WhatsApp + Email.

   booking   — booking object (hotelId, roomId, guestName,
                guestPhone, email are used)
   cfgOverride — optional pre-loaded hotelConfig (SSR-safe)
═══════════════════════════════════════════════════════════════ */
export async function sendWelcomeKit(booking, cfgOverride) {
  const hid = booking.hotelId;
  if (!hid) {
    console.error("[WELCOME-KIT] hotelId missing — aborted");
    return { error: "hotelId_missing" };
  }

  // ── Resolve config strictly per hotelId ───────────────────────
  let cfg;
  if (cfgOverride && typeof cfgOverride === "object" && cfgOverride.name) {
    cfg = cfgOverride;
  } else {
    cfg = typeof window !== "undefined" ? getHotelConfig(hid) : {};
  }

  const hotelName      = cfg?.name           || "The GuestInn";
  const wifiPassword   = cfg?.wifiPassword   || "";
  const receptionPhone = cfg?.receptionPhone || cfg?.managerPhone || cfg?.ownerPhone || "";
  const rawGuestPhone  = booking.guestPhone  || "";
  const guestEmail     = booking.email       || "";
  const roomId         = booking.roomId      || "—";
  const guestName      = booking.guestName   || "Guest";
  const checkInDate    = booking.checkInDate || new Date().toISOString().split("T")[0];
  const checkOutDate   = booking.checkOutDate || "";

  // ── Build companion URL (guest digital companion page) ────────
  // URL: /booking/<hotelId>?room=<roomId>
  const baseUrl = typeof window !== "undefined"
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_APP_URL || "https://theguestinn.com");
  const companionUrl = `${baseUrl}/booking/${hid}?room=${encodeURIComponent(roomId)}`;

  const guestPhone = sanitizeIndianNumber(rawGuestPhone);

  const results = { whatsapp: null, email: null };

  // ── 1. WhatsApp Welcome Kit ────────────────────────────────────
  if (guestPhone) {
    const waMsg = welcomeKitMsg({
      guestName, roomId, hotelName, companionUrl,
      wifiPassword, receptionPhone, checkInDate, checkOutDate,
      checkoutTime: cfg?.checkoutTime || "11:00",
    });
    results.whatsapp = sendWA(guestPhone, waMsg);
    console.log(`[WELCOME-KIT][${hid}] WhatsApp sent to ${guestPhone}`);
  } else {
    console.log(`[WELCOME-KIT][${hid}] No valid guest phone — WhatsApp skipped`);
    results.whatsapp = { mode: "skipped", reason: "invalid_or_missing_phone" };
  }

  // ── 2. Email Welcome Kit ───────────────────────────────────────
  if (guestEmail) {
    try {
      const emailRes = await fetch("/api/alerts", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type:    "welcome-kit",
          to:      [guestEmail],
          subject: `🏨 ${hotelName} — Aapka Digital Room Companion Ready Hai!`,
          booking: {
            ...booking,
            hotelName,
            companionUrl,
            wifiPassword,
            receptionPhone,
            checkoutTime: cfg?.checkoutTime || "11:00",
            enableWifi:          cfg?.enableWifi          ?? true,
            enableFoodOrdering:  cfg?.enableFoodOrdering  ?? true,
            enableHousekeeping:  cfg?.enableHousekeeping  ?? true,
            enableCallDesk:      cfg?.enableCallDesk       ?? true,
          },
        }),
      });
      results.email = { sent: emailRes.ok, to: guestEmail };
      if (!emailRes.ok) {
        const txt = await emailRes.text();
        console.warn(`[WELCOME-KIT][${hid}] Email API error:`, txt);
      }
    } catch (e) {
      console.warn(`[WELCOME-KIT][${hid}] Email fetch failed:`, e.message);
      results.email = { sent: false, error: e.message };
    }
  } else {
    console.log(`[WELCOME-KIT][${hid}] No guest email — email skipped`);
    results.email = { sent: false, reason: "no_guest_email" };
  }

  console.log(`[WELCOME-KIT][${hid}] Results:`, results);
  return results;
}

/* ═══════════════════════════════════════════════════════════════
   MAIN EXPORT — sendBookingAlerts (unchanged from v2)
   booking   — booking object (hotelId is mandatory)
   cfgOverride — optional pre-loaded hotelConfig (for server contexts
                 where localStorage is unavailable)
═══════════════════════════════════════════════════════════════ */
export async function sendBookingAlerts(booking, cfgOverride) {
  const hid = booking.hotelId;

  if (!hid) {
    console.error("[ALERT] hotelId missing in booking object — alerts aborted");
    return { error: "hotelId_missing" };
  }

  // ── Resolve config strictly per hotelId — no cross-routing ────
  let cfg;
  if (cfgOverride && typeof cfgOverride === "object" && cfgOverride.name) {
    cfg = cfgOverride;
  } else {
    cfg = typeof window !== "undefined" ? getHotelConfig(hid) : {};
  }

  // All contact details resolved from THIS hotel's config only
  const rawOwnerPhone   = cfg?.ownerPhone   || "";
  const rawManagerPhone = cfg?.managerPhone || "";
  const rawGuestPhone   = booking.guestPhone || "";
  const ownerEmail      = cfg?.ownerEmail   || "";
  const managerEmail    = cfg?.managerEmail || "";
  const hotelName       = cfg?.name         || "The GuestInn";

  // Sanitize all phone numbers to 91XXXXXXXXXX format
  const ownerPhone   = sanitizeIndianNumber(rawOwnerPhone);
  const managerPhone = sanitizeIndianNumber(rawManagerPhone);
  const guestPhone   = sanitizeIndianNumber(rawGuestPhone);

  const results = { owner: null, customer: null, manager: null, email: null, push: null };

  // ── 1. Owner WhatsApp alert ────────────────────────────────────
  if (ownerPhone) {
    results.owner = sendWA(ownerPhone, ownerMsg(booking, hotelName));
  } else {
    console.log(`[ALERT-OWNER][${hid}] No valid owner phone. Console fallback:\n`, ownerMsg(booking, hotelName));
    results.owner = { mode: "console", hotelId: hid };
  }

  // ── 2. Guest WhatsApp confirmation ─────────────────────────────
  if (guestPhone) {
    results.customer = sendWA(guestPhone, guestMsg(booking, hotelName));
  } else {
    console.log(`[ALERT-GUEST][${hid}] No valid guest phone.`);
    results.customer = { mode: "skipped", reason: "invalid_number" };
  }

  // ── 3. Manager WhatsApp alert ──────────────────────────────────
  if (managerPhone && managerPhone !== ownerPhone) {
    results.manager = sendWA(managerPhone, managerMsg(booking, hotelName));
  } else if (managerPhone === ownerPhone) {
    results.manager = { mode: "skipped", reason: "same_as_owner" };
  } else {
    results.manager = { mode: "skipped", reason: "no_manager_phone" };
  }

  // ── 4. Push Notification (PWA) ─────────────────────────────────
  try {
    const pushPayload = {
      title: `🏨 ${hotelName} — Naya Booking!`,
      body:  `Room ${booking.roomId} • ${booking.guestName || "Guest"} • ₹${Number(booking.totalAmount || 0).toLocaleString("en-IN")}`,
      tag:   `booking-${booking.id}`,
      icon:  "/icons/icon-192.png",
      badge: "/icons/apple-touch-icon.png",
      url:   "/",
      sound: true,
    };
    const pushRes = await fetch("/api/push", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send", hotelId: hid, payload: pushPayload }),
    });
    results.push = { sent: pushRes.ok };
  } catch (e) {
    console.warn(`[ALERT-PUSH][${hid}] Failed:`, e.message);
    results.push = { sent: false, error: e.message };
  }

  // ── 5. Owner + Manager Email ───────────────────────────────────
  const emails = [ownerEmail, managerEmail].filter(Boolean);
  if (emails.length > 0) {
    try {
      const emailRes = await fetch("/api/alerts", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type:    "email",
          to:      emails,
          subject: `[${hotelName}] New Check-in — ${booking.guestName} — Room ${booking.roomId}`,
          text:    ownerMsg(booking, hotelName),
          booking: {
            ...booking,
            // Mask sensitive ID before emailing
            idNumber: booking.idNumber ? "[ID Omitted for Privacy]" : "[ID Omitted for Privacy]",
          },
        }),
      });
      results.email = { sent: emailRes.ok, to: emails };
    } catch (e) {
      console.warn(`[ALERT-EMAIL][${hid}] Failed:`, e.message);
      results.email = { sent: false, error: e.message };
    }
  } else {
    results.email = { sent: false, reason: "no_emails_configured" };
  }

  return results;
}

/* ═══════════════════════════════════════════════════════════════
   WHATSAPP SENDER (client-side only, non-blocking)
   Receives pre-sanitized number in 91XXXXXXXXXX format.
═══════════════════════════════════════════════════════════════ */
function sendWA(sanitizedNumber, message) {
  if (typeof window === "undefined") return { mode: "ssr_skip" };
  if (!sanitizedNumber) return { mode: "error", error: "empty_number" };

  try {
    const url = `https://wa.me/${sanitizedNumber}?text=${encodeURIComponent(message)}`;
    const a   = document.createElement("a");
    a.href    = url;
    a.target  = "_blank";
    a.rel     = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { try { document.body.removeChild(a); } catch {} }, 500);
    return { mode: "whatsapp", phone: sanitizedNumber };
  } catch (e) {
    return { mode: "error", error: e.message };
  }
}

/* ═══════════════════════════════════════════════════════════════
   MESSAGE TEMPLATES
═══════════════════════════════════════════════════════════════ */

// ── Phase 5: Welcome Kit WhatsApp message (to guest) ──────────
function welcomeKitMsg({ guestName, roomId, hotelName, companionUrl, wifiPassword, receptionPhone, checkInDate, checkOutDate, checkoutTime }) {
  const wifiLine = wifiPassword
    ? `\n📶 *Wi-Fi Password:* \`${wifiPassword}\``
    : "";
  const checkoutLine = checkOutDate
    ? `📅 *Check-out:* ${fmt(checkOutDate)} (${checkoutTime || "11:00"} tak)`
    : `⏰ *Checkout Time:* ${checkoutTime || "11:00"} AM`;
  const callLine = receptionPhone
    ? `\n📞 *Reception:* ${receptionPhone}`
    : "";

  return `🌟 *${hotelName} — Welcome!* 🙏

Namaste *${guestName}* Ji! Aapka swagat hai. ✅

━━━━━━━━━━━━━━━━━━━━━━
🏠 *Room:* ${roomId}
📅 *Check-in:* ${fmt(checkInDate)}
${checkoutLine}${wifiLine}${callLine}
━━━━━━━━━━━━━━━━━━━━━━

📱 *Aapka Digital Room Companion:*
${companionUrl}

Is link se aap ye sab kar sakte hain:
🤖 Sandy AI se baat karein
🍽️ Room Service / Khana order karein
🧹 Housekeeping request karein
📞 Reception ko call karein

_Koi bhi problem ho — Sandy se poochein! 🤝_
— ${hotelName} Team`;
}

function ownerMsg(b, hotelName) {
  const extras = (() => {
    try {
      const eg = typeof b.extraGuests === "string" ? JSON.parse(b.extraGuests) : b.extraGuests;
      return eg?.length ? `\n👥 *Extra Guests:* ${eg.map(g => g.guestName || "—").join(", ")}` : "";
    } catch { return ""; }
  })();

  const negotiationLine = b.negotiated
    ? `\n🤝 *AI Negotiated:* Yes (Original: ₹${num(b.negotiatedFrom)}/night)\n🔒 *Rate Lock Token:* ${b.rateLockToken || "—"}`
    : "";

  return `🏨 *${hotelName} — NEW CHECK-IN*

👤 *Guest:* ${b.guestName || "—"}
📱 *Phone:* ${b.guestPhone || "N/A"}
🪪 *ID:* ${b.idType || "—"} — [ID Omitted for Privacy]
🏠 *Room:* ${b.roomId} (${b.roomType || "standard"})
📅 *Check-in:* ${fmt(b.checkInDate)}
📅 *Check-out:* ${b.checkOutDate ? fmt(b.checkOutDate) : "—"}
🌙 *Nights:* ${b.nights || 1}${extras}

💰 *RATE LOCKED:* ₹${num(b.ratePerNight)}/night${negotiationLine}
💵 *TOTAL:* ₹${num(b.totalAmount)}
💳 *Payment:* ${b.paymentMode || "—"}
📦 *Source:* ${b.source || "direct"}

⏰ ${new Date().toLocaleString("en-IN")}
🔒 ID: ${b.id?.slice(-8) || "—"}
_Rate lock active — koi change nahi ho sakta._`;
}

function guestMsg(b, hotelName) {
  const negotiationLine = b.negotiated
    ? `\n🤝 *Negotiated Rate Applied*\n🔒 *Lock Token:* ${b.rateLockToken || "—"}`
    : "";

  return `🌟 *${hotelName}*
*Aapka Booking Confirm Ho Gaya!* ✅

Namaste ${b.guestName || "Guest"} Ji! 🙏

🏠 *Room:* ${b.roomId}
📅 *Check-in:* ${fmt(b.checkInDate)}
📅 *Check-out:* ${b.checkOutDate ? fmt(b.checkOutDate) : "—"}
🌙 *Nights:* ${b.nights || 1}

💰 *Rate:* ₹${num(b.ratePerNight)}/night${negotiationLine}
💵 *Total:* ₹${num(b.totalAmount)}
💳 *Payment:* ${b.paymentMode || "—"}
🔒 *Ref:* ${b.id?.slice(-8) || "—"}

_Agar rate alag bataya jaye — is message ko dikhayein._
Thank you! 🙏 — ${hotelName}`;
}

function managerMsg(b, hotelName) {
  return `✅ *Check-in Complete!* — ${hotelName}
Room ${b.roomId} — ${b.guestName || "Guest"}
Amount: ₹${num(b.totalAmount)} (${b.paymentMode || "—"})
Rate locked: ₹${num(b.ratePerNight)}/night${b.negotiated ? " (AI Negotiated)" : ""}
ID: ${b.id?.slice(-8) || "—"}
_Owner + Guest ko bhi alert bheja._`;
}

/* ═══════════════════════════════════════════════════════════════
   UTILS
═══════════════════════════════════════════════════════════════ */
const fmt = (d) => { try { return new Date(d).toLocaleDateString("en-IN"); } catch { return d || "—"; } };
const num = (v) => Number(v || 0).toLocaleString("en-IN");

// Named export for direct use in tests or server contexts
export { sanitizeIndianNumber };
