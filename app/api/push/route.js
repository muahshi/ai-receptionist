// app/api/push/route.js — The GuestInn Network: Push Notification Server
// ═══════════════════════════════════════════════════════════════
// Handles:
//   POST { action:"subscribe",   hotelId, subscription }  → save subscription
//   POST { action:"send",        hotelId, payload }        → fire push to all hotel subscribers
//   POST { action:"unsubscribe", hotelId, endpoint }       → remove subscription
//   GET  { hotelId }                                        → return VAPID public key
// ═══════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

// Web-push is optional (graceful degradation if not installed)
let webpush = null;
try {
  webpush = require("web-push");
  const pubKey  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privKey = process.env.VAPID_PRIVATE_KEY;
  const email   = process.env.VAPID_EMAIL || "mailto:admin@theguestinn.network";
  if (pubKey && privKey && pubKey !== "undefined") {
    webpush.setVapidDetails(email, pubKey, privKey);
  } else {
    webpush = null; // VAPID not configured — degrade gracefully
  }
} catch {
  webpush = null;
}

// In-memory subscription store (replace with DB in production)
// Keyed by hotelId → array of subscription objects
const subscriptions = new Map();

function getSubscriptions(hotelId) {
  return subscriptions.get(hotelId) || [];
}

function saveSubscription(hotelId, subscription) {
  const existing = getSubscriptions(hotelId);
  const filtered = existing.filter(s => s.endpoint !== subscription.endpoint);
  subscriptions.set(hotelId, [...filtered, subscription]);
}

function removeSubscription(hotelId, endpoint) {
  const existing = getSubscriptions(hotelId);
  subscriptions.set(hotelId, existing.filter(s => s.endpoint !== endpoint));
}

// ── Notification payload builder ─────────────────────────────
function buildPayload(payload, hotelId) {
  const status = payload.status || "";
  const emoji  = status === "reserved"    ? "⭐" :
                 status === "occupied"    ? "🔴" :
                 status === "checked_out" ? "✅" : "🏨";

  return JSON.stringify({
    title:   payload.title || `${emoji} GuestInn Network — ${hotelId}`,
    body:    payload.body  || "Naya booking alert!",
    icon:    payload.icon  || "/icons/icon-192.png",
    badge:   payload.badge || "/icons/badge-72.png",
    tag:     payload.tag   || `gi-${Date.now()}`,
    sound:   payload.sound ?? true,
    vibrate: [200, 100, 200],
    data: {
      url:       payload.data?.url || `/app?hotel=${hotelId}&tab=dashboard`,
      bookingId: payload.data?.bookingId || null,
      status:    payload.data?.status    || status,
      timestamp: Date.now(),
    },
    actions: status === "reserved" ? [
      { action:"approve", title:"✅ Approve Karo" },
      { action:"view",    title:"👁 View Karo" },
    ] : status === "occupied" ? [
      { action:"checkout", title:"Checkout" },
      { action:"view",     title:"View" },
    ] : [],
  });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const hotelId = searchParams.get("hotelId") || "default";
  return Response.json({
    success:   true,
    vapidKey:  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null,
    supported: !!webpush,
    hotelId,
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, hotelId, subscription, payload, endpoint } = body;

    if (!hotelId) return Response.json({ error:"hotelId required" }, { status:400 });

    // ── SUBSCRIBE ──
    if (action === "subscribe") {
      if (!subscription?.endpoint) {
        return Response.json({ error:"Valid subscription object required" }, { status:400 });
      }
      saveSubscription(hotelId, subscription);
      const count = getSubscriptions(hotelId).length;
      console.log(`[Push] New subscription for hotel ${hotelId} — total: ${count}`);
      return Response.json({ success:true, action:"subscribed", count });
    }

    // ── UNSUBSCRIBE ──
    if (action === "unsubscribe") {
      if (endpoint) removeSubscription(hotelId, endpoint);
      return Response.json({ success:true, action:"unsubscribed" });
    }

    // ── SEND ──
    if (action === "send") {
      const subs = getSubscriptions(hotelId);

      if (!webpush) {
        // Graceful degradation — acknowledge receipt without sending
        console.log(`[Push] webpush not configured — simulating notification for hotel: ${hotelId}`);
        console.log(`[Push] Payload:`, payload);
        return Response.json({
          success:   true,
          sent:      0,
          simulated: true,
          message:   "VAPID keys not set — notification simulated. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY in Vercel env vars.",
          hotelId,
        });
      }

      if (subs.length === 0) {
        return Response.json({
          success: true,
          sent:    0,
          message: "Koi active subscriber nahi — notification queued",
          hotelId,
        });
      }

      const notifPayload = buildPayload(payload || {}, hotelId);
      let sent = 0; let failed = 0;
      const stale = [];

      for (const sub of subs) {
        try {
          await webpush.sendNotification(sub, notifPayload);
          sent++;
        } catch (e) {
          if (e.statusCode === 410 || e.statusCode === 404) {
            // Expired subscription
            stale.push(sub.endpoint);
          }
          failed++;
          console.warn("[Push] Send failed:", e.message);
        }
      }

      // Clean up stale subscriptions
      stale.forEach(ep => removeSubscription(hotelId, ep));

      console.log(`[Push] Sent ${sent}/${subs.length} for hotel ${hotelId} — ${stale.length} stale removed`);
      return Response.json({ success:true, sent, failed, stale:stale.length, hotelId });
    }

    return Response.json({ error:"Invalid action. Valid: subscribe, unsubscribe, send" }, { status:400 });

  } catch (e) {
    console.error("[Push] Error:", e.message);
    return Response.json({ error:e.message }, { status:500 });
  }
}
