/**
 * app/api/push/route.js
 * Push notification API — subscribe / unsubscribe / send + service request log
 *
 * PHASE 4 ADDITIONS:
 *   - POST action:"send"  → triggers web-push to hotel staff + logs to service_requests table
 *   - service_requests Supabase table mein har guest request save hoti hai
 *   - DashboardView isse poll karta hai live alerts ke liye
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

// ── Supabase REST helpers ────────────────────────────────────────
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

async function sbInsert(table, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method:  "POST",
    headers: { ...sbH(), "Prefer": "return=representation" },
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

    // ── SEND (Phase 4 — Guest Service Request) ────────────────
    // Called from: /api/push/send (booking page ServiceTab)
    // OR action:"send" from any source
    if (action === "send") {
      const { hotelId, payload, type, title, body: msgBody,
              actionId, roomNumber, guestName, timestamp } = body;

      // Normalize: booking page sends flat fields, not a nested payload
      const normalizedPayload = payload || {
        type:       type       || "room_service",
        title:      title      || "🔔 Room Service Request",
        body:       msgBody    || "Guest ne service maangi hai",
        actionId:   actionId   || "general",
        roomNumber: roomNumber || null,
        guestName:  guestName  || "Guest",
        timestamp:  timestamp  || new Date().toISOString(),
      };

      if (!hotelId) {
        return Response.json({ ok: false, error: "Missing hotelId" });
      }

      // ── Log to Supabase service_requests table ─────────────
      await sbInsert("service_requests", {
        hotel_id:    hotelId,
        room_number: normalizedPayload.roomNumber || roomNumber || null,
        guest_name:  normalizedPayload.guestName  || guestName  || "Guest",
        action_id:   normalizedPayload.actionId   || actionId   || "general",
        title:       normalizedPayload.title       || title      || "Service Request",
        message:     normalizedPayload.body        || msgBody    || "",
        status:      "pending",
        created_at:  new Date().toISOString(),
      }).catch(() => {}); // Non-blocking — don't fail push if DB insert fails

      // ── Send web-push to all hotel staff subscribers ────────
      if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
        console.warn("[PUSH] VAPID keys missing — push skipped, DB log saved");
        return Response.json({ ok: true, sent: 0, note: "Push skipped — VAPID not configured, request logged to DB" });
      }

      const rows = await sbSelect("push_subscriptions", `hotel_id=eq.${hotelId}`);
      if (!rows.length) {
        return Response.json({ ok: true, sent: 0, note: "No push subscribers — request logged to DB" });
      }

      const results = await Promise.allSettled(
        rows.map(async (row) => {
          let sub;
          try { sub = JSON.parse(row.subscription); } catch { return; }
          try {
            await webpush.sendNotification(sub, JSON.stringify(normalizedPayload), {
              TTL:     86400,
              urgency: "high",
            });
            return { ok: true };
          } catch (err) {
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

// ── GET — Poll latest pending service_requests for a hotel ───────
// DashboardView isko poll karta hai har 10s pe live alerts ke liye
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const hotelId = searchParams.get("hotelId");
    const since   = searchParams.get("since"); // ISO timestamp — only newer requests

    if (!hotelId) {
      return Response.json({ ok: false, error: "hotelId required" });
    }

    let qs = `hotel_id=eq.${hotelId}&status=eq.pending&order=created_at.desc&limit=20`;
    if (since) {
      qs += `&created_at=gt.${encodeURIComponent(since)}`;
    }

    const rows = await sbSelect("service_requests", qs);
    return Response.json({ ok: true, requests: rows });
  } catch (err) {
    console.error("[PUSH GET] Error:", err.message);
    return Response.json({ ok: false, requests: [] });
  }
}

// ── PATCH — Mark a service_request as resolved ───────────────────
export async function PATCH(request) {
  try {
    const { id } = await request.json();
    if (!id) return Response.json({ ok: false, error: "id required" });

    const res = await fetch(`${SUPABASE_URL}/rest/v1/service_requests?id=eq.${id}`, {
      method:  "PATCH",
      headers: { ...sbH(), "Prefer": "return=representation" },
      body:    JSON.stringify({ status: "resolved", resolved_at: new Date().toISOString() }),
    });
    return Response.json({ ok: res.ok });
  } catch (err) {
    return Response.json({ ok: false, error: err.message });
  }
}
