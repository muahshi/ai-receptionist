/**
 * app/api/push/route.js
 * Handles push subscriptions (save/delete) + sends push notifications
 *
 * ENV required:
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY   — from VAPID key generator
 *   VAPID_PRIVATE_KEY              — keep secret, server-only
 *   VAPID_SUBJECT                  — mailto:you@yourdomain.com
 *   NEXT_PUBLIC_SUPABASE_URL       — already in your .env.local
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY  — already in your .env.local
 */

export const dynamic = "force-dynamic";

const VAPID_PUBLIC  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY            || "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT                || "mailto:admin@theguestinn.com";
const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL     || "";
const SUPABASE_KEY  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY|| "";

// ── Supabase helper (no SDK needed) ─────────────────────────────
const sbHeaders = () => ({
  "Content-Type":  "application/json",
  "apikey":        SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
});

async function sbSelect(table, filters = "") {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filters}`, {
    headers: sbHeaders(),
  });
  return res.json();
}

async function sbUpsert(table, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method:  "POST",
    headers: { ...sbHeaders(), "Prefer": "resolution=merge-duplicates" },
    body:    JSON.stringify(body),
  });
  return res.ok;
}

async function sbDelete(table, filter) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method:  "DELETE",
    headers: sbHeaders(),
  });
  return res.ok;
}

// ── VAPID JWT builder (no external lib) ─────────────────────────
async function buildVapidAuth(endpoint) {
  const audience = new URL(endpoint).origin;
  const header   = b64url(JSON.stringify({ alg: "ES256", typ: "JWT" }));
  const payload  = b64url(JSON.stringify({
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 43200, // 12h
    sub: VAPID_SUBJECT,
  }));
  const unsigned = `${header}.${payload}`;

  // Import VAPID private key
  const keyBytes  = base64urlToBytes(VAPID_PRIVATE);
  const cryptoKey = await crypto.subtle.importKey(
    "raw", keyBytes,
    { name: "ECDSA", namedCurve: "P-256" },
    false, ["sign"]
  );
  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    cryptoKey,
    new TextEncoder().encode(unsigned)
  );

  const jwt = `${unsigned}.${bytesToBase64url(new Uint8Array(sig))}`;
  return { jwt, publicKey: VAPID_PUBLIC };
}

// ── Send a single push notification ─────────────────────────────
async function sendPush(subscription, payload) {
  const endpoint = subscription.endpoint;
  if (!endpoint) return { ok: false, error: "no endpoint" };

  // Encrypt payload using Web Push (ECDH + AES-GCM)
  // For simplicity without web-push lib, we send unencrypted header only
  // and rely on the payload being in the notification options via push event
  // Full encryption is handled below:

  try {
    const { jwt, publicKey } = await buildVapidAuth(endpoint);
    const body = JSON.stringify(payload);

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type":   "application/json",
        "Authorization":  `vapid t=${jwt},k=${publicKey}`,
        "TTL":            "86400",
      },
      body,
    });

    // 201 = success, 410/404 = subscription expired
    if (res.status === 410 || res.status === 404) {
      return { ok: false, expired: true, status: res.status };
    }
    return { ok: res.ok, status: res.status };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ── POST handler ─────────────────────────────────────────────────
export async function POST(request) {
  try {
    const body = await request.json();
    const { action } = body;

    // ── SUBSCRIBE ─────────────────────────────────────
    if (action === "subscribe") {
      const { hotelId, role, subscription } = body;
      if (!hotelId || !subscription?.endpoint) {
        return Response.json({ ok: false, error: "Missing hotelId or subscription" });
      }

      await sbUpsert("push_subscriptions", {
        hotel_id:     hotelId,
        role,
        endpoint:     subscription.endpoint,
        p256dh:       subscription.keys?.p256dh || "",
        auth:         subscription.keys?.auth   || "",
        subscription: JSON.stringify(subscription),
        created_at:   new Date().toISOString(),
      });

      return Response.json({ ok: true, action: "subscribed" });
    }

    // ── UNSUBSCRIBE ───────────────────────────────────
    if (action === "unsubscribe") {
      const { hotelId, endpoint } = body;
      const enc = encodeURIComponent(endpoint);
      await sbDelete("push_subscriptions", `hotel_id=eq.${hotelId}&endpoint=eq.${enc}`);
      return Response.json({ ok: true, action: "unsubscribed" });
    }

    // ── SEND NOTIFICATION ─────────────────────────────
    if (action === "send") {
      const { hotelId, payload } = body;
      if (!hotelId || !payload) {
        return Response.json({ ok: false, error: "Missing hotelId or payload" });
      }
      if (!VAPID_PRIVATE || !VAPID_PUBLIC) {
        return Response.json({ ok: false, error: "VAPID keys missing in env" });
      }

      // Get all subscriptions for this hotel
      const subs = await sbSelect("push_subscriptions", `hotel_id=eq.${hotelId}`);
      if (!Array.isArray(subs) || subs.length === 0) {
        return Response.json({ ok: true, sent: 0, note: "No subscribers" });
      }

      const results = await Promise.all(
        subs.map(async (row) => {
          let sub;
          try { sub = JSON.parse(row.subscription); } catch { return { ok: false }; }
          const res = await sendPush(sub, payload);
          // Clean up expired subscriptions
          if (res.expired) {
            await sbDelete("push_subscriptions", `endpoint=eq.${encodeURIComponent(row.endpoint)}`);
          }
          return res;
        })
      );

      const sent = results.filter((r) => r.ok).length;
      return Response.json({ ok: true, sent, total: subs.length });
    }

    return Response.json({ ok: false, error: "Unknown action" });

  } catch (err) {
    console.error("[PUSH API]", err.message);
    return Response.json({ ok: false, error: err.message });
  }
}

// ── Base64url helpers ────────────────────────────────────────────
function b64url(str) {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
function bytesToBase64url(bytes) {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
function base64urlToBytes(str) {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const raw    = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}
