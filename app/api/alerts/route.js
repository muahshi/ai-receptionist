/**
 * app/api/alerts/route.js
 * Email alerts via Resend (free: 100 emails/day)
 * Phase 5: Added "welcome-kit" type — sends rich guest onboarding email
 * Setup: resend.com signup → API key → Vercel env: RESEND_API_KEY
 */
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json();
    const { type, to, subject, text, booking } = body;

    if (type === "welcome-kit") {
      return handleWelcomeKit({ to, subject, booking });
    }

    if (type !== "email") return Response.json({ ok: false, error: "Unknown type" });

    // ── Standard check-in alert email (existing logic) ──────────
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      console.log("[EMAIL] No RESEND_API_KEY. Would send to:", to, "| Subject:", subject);
      return Response.json({ ok: true, mode: "logged_only",
        note: "Add RESEND_API_KEY in Vercel env to enable emails" });
    }

    const b = booking || {};
    const fmtNum  = v => Number(v || 0).toLocaleString("en-IN");
    const fmtDate = d => { try { return new Date(d).toLocaleDateString("en-IN"); } catch { return d || "—"; } };

    const html = `<!DOCTYPE html><html><head><style>
      body{font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px}
      .card{background:#fff;border-radius:12px;padding:28px;max-width:520px;margin:0 auto;box-shadow:0 2px 12px rgba(0,0,0,0.08)}
      .hdr{background:linear-gradient(135deg,#1a1200,#D4AF37);padding:20px 24px;border-radius:8px 8px 0 0;margin:-28px -28px 20px}
      .hn{font-size:20px;font-weight:900;color:#000}
      .hs{font-size:10px;color:rgba(0,0,0,0.6);margin-top:2px;letter-spacing:1px}
      .badge{display:inline-block;background:#22c55e;color:#fff;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;margin-bottom:14px}
      .row{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #f0f0f0}
      .lbl{color:#888;font-size:12px}.val{font-size:13px;font-weight:600;color:#111}
      .tot{background:#fdf9e8;border:2px solid #D4AF37;border-radius:10px;padding:14px;margin-top:16px;text-align:center}
      .amt{font-size:28px;font-weight:900;color:#b8960c}
      .ft{text-align:center;margin-top:18px;font-size:10px;color:#bbb}
    </style></head><body><div class="card">
      <div class="hdr">
        <div class="hn">${b.hotelName || "The GuestInn"}</div>
        <div class="hs">AI-POWERED HOTEL MANAGEMENT</div>
      </div>
      <div class="badge">✓ NEW CHECK-IN</div>
      ${[
        ["Guest",     b.guestName || "—"],
        ["Phone",     b.guestPhone || "—"],
        ["ID",        `${b.idType || "—"} · ${b.idNumber || "—"}`],
        ["Room",      `${b.roomId || "—"} (${b.roomType || "standard"})`],
        ["Check-in",  fmtDate(b.checkInDate)],
        ["Check-out", fmtDate(b.checkOutDate)],
        ["Nights",    String(b.nights || 1)],
        ["Rate/Night",`₹${fmtNum(b.ratePerNight)}`],
        ["Payment",   b.paymentMode || "—"],
        ["Booking ID",b.id?.slice(-8) || "—"],
      ].map(([l, v]) => `<div class="row"><span class="lbl">${l}</span><span class="val">${v}</span></div>`).join("")}
      <div class="tot">
        <div style="font-size:11px;color:#888;margin-bottom:4px">TOTAL AMOUNT</div>
        <div class="amt">₹${fmtNum(b.totalAmount)}</div>
        <div style="font-size:11px;color:#888;margin-top:4px">🔒 Rate Locked</div>
      </div>
      <div class="ft">The GuestInn AI • ${new Date().toLocaleString("en-IN")}</div>
    </div></body></html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from:    "The GuestInn <alerts@theguestinn.com>",
        to:      Array.isArray(to) ? to : [to],
        subject: subject || "New Check-in Alert",
        text:    text || "",
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[EMAIL] Resend error:", err);
      return Response.json({ ok: false, error: err });
    }
    const data = await res.json();
    return Response.json({ ok: true, id: data.id });

  } catch (e) {
    console.error("[EMAIL] Error:", e.message);
    return Response.json({ ok: false, error: e.message });
  }
}

/* ═══════════════════════════════════════════════════════════════
   PHASE 5 — Welcome Kit Email Handler
   Sends a premium HTML welcome email to the guest with:
   - Room number + stay dates
   - Digital Companion link (clickable button)
   - Wi-Fi password (if configured)
   - Quick service icons
   - Reception contact
═══════════════════════════════════════════════════════════════ */
async function handleWelcomeKit({ to, subject, booking }) {
  const apiKey = process.env.RESEND_API_KEY;
  const b      = booking || {};

  const fmtDate = d => { try { return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }); } catch { return d || "—"; } };

  const wifiBlock = (b.enableWifi !== false && b.wifiPassword)
    ? `<div style="background:#f0f9ff;border:1.5px solid #bfdbfe;border-radius:10px;padding:14px 18px;margin:16px 0;display:flex;align-items:center;gap:12px;">
        <span style="font-size:24px;">📶</span>
        <div>
          <div style="font-size:11px;color:#64748b;font-weight:600;letter-spacing:.5px;">WI-FI PASSWORD</div>
          <div style="font-size:18px;font-weight:900;color:#1e40af;letter-spacing:2px;font-family:monospace;">${b.wifiPassword}</div>
        </div>
      </div>`
    : "";

  const servicesBlock = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:16px 0;">
      ${b.enableFoodOrdering !== false ? `<div style="background:#fef9ec;border:1px solid #fde68a;border-radius:8px;padding:12px;text-align:center;"><div style="font-size:22px;">🍽️</div><div style="font-size:11px;font-weight:700;color:#92400e;margin-top:4px;">Food Order</div></div>` : ""}
      ${b.enableHousekeeping !== false ? `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;text-align:center;"><div style="font-size:22px;">🧹</div><div style="font-size:11px;font-weight:700;color:#14532d;margin-top:4px;">Housekeeping</div></div>` : ""}
      <div style="background:#fdf4ff;border:1px solid #e9d5ff;border-radius:8px;padding:12px;text-align:center;"><div style="font-size:22px;">🤖</div><div style="font-size:11px;font-weight:700;color:#581c87;margin-top:4px;">Sandy AI</div></div>
      ${b.enableCallDesk !== false && b.receptionPhone ? `<div style="background:#fff1f2;border:1px solid #fecdd3;border-radius:8px;padding:12px;text-align:center;"><div style="font-size:22px;">📞</div><div style="font-size:11px;font-weight:700;color:#9f1239;margin-top:4px;">${b.receptionPhone}</div></div>` : ""}
    </div>`;

  const checkoutLine = b.checkOutDate
    ? `<div class="row"><span class="lbl">Check-out</span><span class="val">${fmtDate(b.checkOutDate)} · ${b.checkoutTime || "11:00"} AM</span></div>`
    : `<div class="row"><span class="lbl">Checkout Time</span><span class="val">${b.checkoutTime || "11:00"} AM</span></div>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<style>
  body{margin:0;padding:20px;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif}
  .outer{max-width:540px;margin:0 auto}
  .card{background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.4)}
  .hdr{background:linear-gradient(135deg,#0f172a 0%,#1e293b 60%,#D4AF37 100%);padding:28px 28px 20px;position:relative}
  .hotel-name{font-size:22px;font-weight:900;color:#D4AF37;letter-spacing:-.3px}
  .hotel-sub{font-size:10px;color:rgba(212,175,55,0.6);letter-spacing:2px;margin-top:2px;text-transform:uppercase}
  .welcome-badge{display:inline-block;background:rgba(34,197,94,0.15);border:1px solid rgba(34,197,94,0.5);color:#22c55e;font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;margin-top:10px;letter-spacing:.5px}
  .body{padding:24px 28px}
  .greeting{font-size:20px;font-weight:800;color:#0f172a;margin-bottom:4px}
  .sub{font-size:13px;color:#64748b;margin-bottom:20px}
  .room-pill{display:inline-flex;align-items:center;gap:8px;background:#fdf9e8;border:2px solid #D4AF37;border-radius:12px;padding:10px 20px;margin-bottom:20px}
  .room-label{font-size:11px;color:#92400e;font-weight:600;letter-spacing:.5px}
  .room-num{font-size:28px;font-weight:900;color:#b8960c}
  .row{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f1f5f9}
  .lbl{color:#94a3b8;font-size:12px;font-weight:500}
  .val{font-size:13px;font-weight:700;color:#0f172a}
  .cta-btn{display:block;background:linear-gradient(135deg,#1e293b,#0f172a);color:#D4AF37 !important;text-decoration:none;text-align:center;font-size:15px;font-weight:800;padding:16px 24px;border-radius:12px;margin:20px 0;letter-spacing:.3px;border:2px solid #D4AF37}
  .cta-url{text-align:center;font-size:10px;color:#94a3b8;word-break:break-all;margin-top:-12px;margin-bottom:16px}
  .ft{background:#f8fafc;padding:16px 28px;text-align:center;font-size:10px;color:#94a3b8;border-top:1px solid #e2e8f0}
</style>
</head>
<body>
<div class="outer">
<div class="card">
  <div class="hdr">
    <div class="hotel-name">${b.hotelName || "The GuestInn"}</div>
    <div class="hotel-sub">AI-Powered Hotel</div>
    <div class="welcome-badge">✓ CHECK-IN CONFIRMED</div>
  </div>
  <div class="body">
    <div class="greeting">Namaste, ${b.guestName || "Guest"} Ji! 🙏</div>
    <div class="sub">Aapka swagat hai. Aapka digital room companion ready hai.</div>
    <div class="room-pill">
      <div>
        <div class="room-label">YOUR ROOM</div>
        <div class="room-num">${b.roomId || "—"}</div>
      </div>
    </div>
    <div style="margin-bottom:16px;">
      <div class="row"><span class="lbl">Check-in</span><span class="val">${fmtDate(b.checkInDate)}</span></div>
      ${checkoutLine}
      <div class="row"><span class="lbl">Room Type</span><span class="val" style="text-transform:capitalize;">${b.roomType || "Standard"}</span></div>
    </div>
    ${wifiBlock}
    <a class="cta-btn" href="${b.companionUrl || "#"}">📱 Open Room Companion →</a>
    <div class="cta-url">${b.companionUrl || ""}</div>
    <div style="font-size:12px;color:#64748b;font-weight:600;margin-bottom:8px;letter-spacing:.5px;">AVAILABLE SERVICES</div>
    ${servicesBlock}
    <div style="background:#f8fafc;border-radius:10px;padding:14px 16px;margin-top:16px;font-size:12px;color:#475569;line-height:1.7;">
      💡 <strong>Sandy AI</strong> se koi bhi sawaal poochein — Wi-Fi, khana, room service, ya checkout — sab kuch link mein.
    </div>
  </div>
  <div class="ft">
    ${b.hotelName || "The GuestInn"} • Powered by The GuestInn AI Network<br/>
    ${new Date().toLocaleString("en-IN")} • Ref: ${b.id?.slice(-8) || "—"}
  </div>
</div>
</div>
</body>
</html>`;

  if (!apiKey) {
    console.log("[WELCOME-KIT EMAIL] No RESEND_API_KEY. Would send to:", to);
    console.log("[WELCOME-KIT EMAIL] Companion URL:", b.companionUrl);
    return Response.json({ ok: true, mode: "logged_only",
      note: "Add RESEND_API_KEY in Vercel env to enable welcome kit emails",
      companionUrl: b.companionUrl });
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method:  "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from:    `${b.hotelName || "The GuestInn"} <welcome@theguestinn.com>`,
        to:      Array.isArray(to) ? to : [to],
        subject: subject || `🏨 ${b.hotelName || "The GuestInn"} — Aapka Digital Companion Ready Hai!`,
        html,
        text: `Namaste ${b.guestName || "Guest"} Ji!\n\nRoom: ${b.roomId}\nCheck-in: ${b.checkInDate}\nWi-Fi Password: ${b.wifiPassword || "N/A"}\n\nDigital Companion: ${b.companionUrl}\n\n— ${b.hotelName || "The GuestInn"}`,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[WELCOME-KIT EMAIL] Resend error:", err);
      return Response.json({ ok: false, error: err });
    }
    const data = await res.json();
    return Response.json({ ok: true, id: data.id, type: "welcome-kit" });

  } catch (e) {
    console.error("[WELCOME-KIT EMAIL] Error:", e.message);
    return Response.json({ ok: false, error: e.message });
  }
}
