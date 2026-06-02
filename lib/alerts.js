/**
 * lib/alerts.js — The GuestInn Network: Notification Engine
 * ═══════════════════════════════════════════════════════════════
 * sendBookingAlerts(booking) fires three channels simultaneously:
 *   1. Browser Push Notification (via /api/push) — with sound
 *   2. WhatsApp Template Message (transparent / non-promotional)
 *      — via WhatsApp Cloud API
 *   3. Console log fallback when env vars are missing
 *
 * Status-aware messaging:
 *   reserved  → "New Reservation Pending Approval (Gold)"
 *   occupied  → "Booking Confirmed — Guest Checked In (Red)"
 *   checked_out → "Guest Checked Out — Room Available"
 * ═══════════════════════════════════════════════════════════════
 */

// ── Push sound (Web Audio API — no external file needed) ─────
function playAlertTone(type = "booking") {
  if (typeof window === "undefined" || !window.AudioContext) return;
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const notes = type === "approved"
      ? [523.25, 659.25, 783.99]   // C5-E5-G5 chord (confirm)
      : type === "checkout"
      ? [440, 392]                  // A4-G4 descending (checkout)
      : [659.25, 783.99, 1046.50]; // E5-G5-C6 ascending (new booking)

    notes.forEach((freq, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type   = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0,         ctx.currentTime + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + i * 0.12 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.12 + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.4);
    });
    setTimeout(() => ctx.state !== "closed" && ctx.close(), 2000);
  } catch {}
}

// ── Browser push via Service Worker ──────────────────────────
async function sendBrowserPush(booking) {
  if (typeof window === "undefined") return { sent:false, reason:"server-side" };
  try {
    // Check notification permission
    if (!("Notification" in window)) return { sent:false, reason:"not-supported" };
    let perm = Notification.permission;
    if (perm === "default") perm = await Notification.requestPermission();
    if (perm !== "granted")  return { sent:false, reason:"permission-denied" };

    const statusEmoji = booking.status === "reserved"   ? "⭐" :
                        booking.status === "occupied"   ? "🔴" :
                        booking.status === "checked_out"? "✅" : "📋";
    const statusText  = booking.status === "reserved"   ? "NEW RESERVATION (Gold)"  :
                        booking.status === "occupied"   ? "CHECKED IN — OCCUPIED"   :
                        booking.status === "checked_out"? "CHECKED OUT"              : "BOOKING UPDATE";

    // Via /api/push (server-side web push)
    try {
      const res = await fetch("/api/push", {
        method:  "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({
          action:  "send",
          hotelId: booking.hotelId,
          payload: {
            title: `${statusEmoji} ${statusText}`,
            body:  `${booking.guestName} · Room ${booking.roomId} · ₹${Number(booking.totalAmount||0).toLocaleString("en-IN")}`,
            tag:   `booking-${booking.id}`,
            icon:  "/icons/icon-192.png",
            badge: "/icons/badge-72.png",
            sound: true,
            data: {
              url:       `/app?hotel=${booking.hotelId}&tab=dashboard`,
              bookingId: booking.id,
              status:    booking.status,
            },
          },
        }),
      });
      if (res.ok) {
        playAlertTone(booking.status === "occupied" ? "approved" : "booking");
        return { sent:true, channel:"service-worker" };
      }
    } catch {}

    // Fallback: direct browser Notification (when SW not available)
    const notif = new Notification(`${statusEmoji} ${statusText}`, {
      body:  `${booking.guestName} · Room ${booking.roomId} · ₹${Number(booking.totalAmount||0).toLocaleString("en-IN")}`,
      icon:  "/icons/icon-192.png",
      tag:   `gi-${booking.id}`,
    });
    notif.onclick = () => window.focus();
    playAlertTone(booking.status === "occupied" ? "approved" : "booking");
    return { sent:true, channel:"direct" };

  } catch (e) {
    console.warn("[Alerts] Browser push failed:", e.message);
    return { sent:false, reason:e.message };
  }
}

// ── WhatsApp Cloud API ────────────────────────────────────────
// Sends a transparent, non-promotional message to hotel owner/manager.
// Template: "guestinn_booking_alert" — must be approved in Meta Business Manager.
// Fallback: WhatsApp URL scheme (wa.me link via window.open in browser context).
async function sendWhatsApp(booking) {
  const phoneRaw = booking.ownerPhone || booking.managerPhone || process.env.NEXT_PUBLIC_HOTEL_OWNER_PHONE;
  if (!phoneRaw) return { sent:false, reason:"no-phone" };

  // Normalize to E.164 (91XXXXXXXXXX format for India)
  const phone = phoneRaw.replace(/\D/g,"").replace(/^0/,"").replace(/^(?!91)/,"91");
  if (phone.length < 10) return { sent:false, reason:"invalid-phone" };

  const wabId  = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
  const token  = process.env.WHATSAPP_ACCESS_TOKEN;
  const fromId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  const statusText = booking.status === "reserved"   ? "New Reservation (Approval Pending — GOLD)"  :
                     booking.status === "occupied"   ? "Guest Checked In — Room OCCUPIED"             :
                     booking.status === "checked_out"? "Guest Checked Out — Room Available"           : "Booking Update";

  const checkInFmt = booking.checkInDate
    ? new Date(booking.checkInDate).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})
    : "—";

  // ── Channel 1: WhatsApp Cloud API (if credentials present) ─
  if (wabId && token && fromId) {
    try {
      const payload = {
        messaging_product: "whatsapp",
        to:                phone,
        type:              "template",
        template: {
          name:     "guestinn_booking_alert",
          language: { code:"en" },
          components: [{
            type:       "body",
            parameters: [
              { type:"text", text:statusText },
              { type:"text", text:booking.guestName       || "—" },
              { type:"text", text:booking.roomId           || "—" },
              { type:"text", text:checkInFmt                      },
              { type:"text", text:`₹${Number(booking.totalAmount||0).toLocaleString("en-IN")}` },
              { type:"text", text:booking.id?.slice(-10).toUpperCase() || "—" },
            ],
          }],
        },
      };

      const res = await fetch(
        `https://graph.facebook.com/v20.0/${fromId}/messages`,
        {
          method:  "POST",
          headers: { Authorization:`Bearer ${token}`, "Content-Type":"application/json" },
          body:    JSON.stringify(payload),
        }
      );

      if (res.ok) {
        const data = await res.json();
        console.log("[Alerts] WhatsApp Cloud API sent ✓", data.messages?.[0]?.id);
        return { sent:true, channel:"cloud-api", messageId:data.messages?.[0]?.id };
      }

      const err = await res.json().catch(() => ({}));
      console.warn("[Alerts] WhatsApp Cloud API failed:", err?.error?.message || res.status);
    } catch (e) {
      console.warn("[Alerts] WhatsApp Cloud API error:", e.message);
    }
  }

  // ── Channel 2: wa.me URL fallback (browser-only) ─────────
  if (typeof window !== "undefined") {
    const bid     = booking.id?.slice(-10).toUpperCase();
    const text    = [
      `🏨 *GuestInn Network Alert*`,
      `*${statusText}*`,
      ``,
      `👤 Guest: ${booking.guestName}`,
      `📞 Phone: ${booking.guestPhone || "—"}`,
      `🛏 Room: ${booking.roomId || "—"} (${(booking.roomType||"standard").toUpperCase()})`,
      `📅 Check-in: ${checkInFmt}`,
      `💰 Total: ₹${Number(booking.totalAmount||0).toLocaleString("en-IN")}`,
      `💳 Payment: ${booking.paymentMode || "Cash"}`,
      booking.negotiated ? `🔒 AI Negotiated Rate Applied` : "",
      ``,
      `Ref: #${bid}`,
      ``,
      `_Powered by The GuestInn Network_`,
    ].filter(Boolean).join("\n");

    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    // Only auto-open for reserved (new bookings) — avoid popups on routine updates
    if (booking.status === "reserved") {
      try { window.open(waUrl, "_blank", "noopener,noreferrer"); } catch {}
    }
    return { sent:true, channel:"wa-link", url:waUrl };
  }

  return { sent:false, reason:"no-credentials-and-server-side" };
}

// ── Server-side WhatsApp (via /api/alerts proxy) ──────────────
async function sendWhatsAppViaProxy(booking) {
  if (typeof window !== "undefined") return sendWhatsApp(booking);
  // Node.js environment — call our own /api/alerts route
  try {
    const base = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const res = await fetch(`${base}/api/alerts`, {
      method:  "POST",
      headers: { "Content-Type":"application/json" },
      body:    JSON.stringify({ action:"whatsapp", booking }),
    });
    return res.ok ? await res.json() : { sent:false };
  } catch (e) {
    console.warn("[Alerts] Server-side WA proxy failed:", e.message);
    return { sent:false, reason:e.message };
  }
}

// ══════════════════════════════════════════════════════════════
// MAIN EXPORT: sendBookingAlerts
// ══════════════════════════════════════════════════════════════
export async function sendBookingAlerts(booking) {
  if (!booking) return { push:false, whatsapp:false };

  const results = await Promise.allSettled([
    sendBrowserPush(booking),
    sendWhatsAppViaProxy(booking),
  ]);

  const pushResult = results[0].status === "fulfilled" ? results[0].value : { sent:false };
  const waResult   = results[1].status === "fulfilled" ? results[1].value : { sent:false };

  if (!pushResult.sent && !waResult.sent) {
    console.warn("[Alerts] Both notification channels failed for booking:", booking.id);
  }

  return {
    push:     pushResult.sent,
    whatsapp: waResult.sent,
    pushDetail:  pushResult,
    waDetail:    waResult,
    bookingId:   booking.id,
    status:      booking.status,
  };
}

// ── Named helpers (for direct import) ────────────────────────
export const playSound    = playAlertTone;
export const sendWA       = sendWhatsApp;
export const sendPush     = sendBrowserPush;
