/**
 * app/api/push/route.js
 * Push notification API — subscribe / unsubscribe / send
 * Uses 'web-push' npm package for proper VAPID + encrypted payload
 *
 * ENV variables (Vercel dashboard mein add karo):
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY   — public VAPID key
 *   VAPID_PRIVATE_KEY              — private VAPID key (secret)
 *   VAPID_SUBJECT                  — mailto:you@domain.com
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

export const dynamic = "force-dynamic";

import webpush from "web-push";

const VAPID_PUBLIC  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY  || "";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY             || "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT                 || "mailto:admin@theguestinn.com";
const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL      || "";
const SUPABASE_KEY  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Configure web-push once
if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
}

// ── Supabase REST helpers (no SDK needed) ────────────────────────
const sbH = () => ({
  "Content-Type":  "application/json",
  "apikey":        SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
});

async function sbSelect(table, qs = "") {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${qs}`, { headers: sbH() });
  if (!res.ok) return [];
  return res.json();
}

async function sbUpsert(table, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method:  "POST",
    headers: { ...sbH(), "Prefer": "resolution=merge-duplicates" },
    body:    JSON.stringify(body),
  });
  return res.ok;
}

async function sbDelete(table, qs) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${qs}`, {
    method:  "DELETE",
    headers: sbH(),
  });
  return res.ok;
}

// ── POST handler ─────────────────────────────────────────────────
export async function POST(request) {
  try {
    const body   = await request.json();
    const { action } = body;

    // ── SUBSCRIBE ─────────────────────────────────────────────
    if (action === "subscribe") {
      const { hotelId, role, subscription } = body;
      if (!hotelId || !subscription?.endpoint) {
        return Response.json({ ok: false, error: "Missing hotelId or subscription" });
      }
      await sbUpsert("push_subscriptions", {
        hotel_id:     hotelId,
        role:         role || "staff",
        endpoint:     subscription.endpoint,
        p256dh:       subscription.keys?.p256dh || "",
        auth:         subscription.keys?.auth   || "",
        subscription: JSON.stringify(subscription),
        created_at:   new Date().toISOString(),
      });
      return Response.json({ ok: true, action: "subscribed" });
    }

    // ── UNSUBSCRIBE ───────────────────────────────────────────
    if (action === "unsubscribe") {
      const { hotelId, endpoint } = body;
      await sbDelete(
        "push_subscriptions",
        `hotel_id=eq.${hotelId}&endpoint=eq.${encodeURIComponent(endpoint)}`
      );
      return Response.json({ ok: true, action: "unsubscribed" });
    }

    // ── SEND ──────────────────────────────────────────────────
    if (action === "send") {
      const { hotelId, payload } = body;
      if (!hotelId || !payload) {
        return Response.json({ ok: false, error: "Missing hotelId or payload" });
      }
      if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
        console.warn("[PUSH] VAPID keys missing — set env vars in Vercel");
        return Response.json({ ok: false, error: "VAPID keys not configured" });
      }

      const rows = await sbSelect("push_subscriptions", `hotel_id=eq.${hotelId}`);
      if (!rows.length) {
        return Response.json({ ok: true, sent: 0, note: "No subscribers for this hotel" });
      }

      const results = await Promise.allSettled(
        rows.map(async (row) => {
          let sub;
          try { sub = JSON.parse(row.subscription); } catch { return; }

          try {
            await webpush.sendNotification(sub, JSON.stringify(payload), {
              TTL: 86400,
              urgency: "high",
            });
            return { ok: true };
          } catch (err) {
            // 410 / 404 = subscription expired, clean up
            if (err.statusCode === 410 || err.statusCode === 404) {
              await sbDelete("push_subscriptions", `endpoint=eq.${encodeURIComponent(row.endpoint)}`);
            }
            console.warn("[PUSH] sendNotification failed:", err.statusCode, err.message);
            return { ok: false, status: err.statusCode };
          }
        })
      );

      const sent = results.filter((r) => r.status === "fulfilled" && r.value?.ok).length;
      return Response.json({ ok: true, sent, total: rows.length });
    }

    return Response.json({ ok: false, error: "Unknown action" });

  } catch (err) {
    console.error("[PUSH API] Error:", err.message);
    return Response.json({ ok: false, error: err.message });
  }
}
