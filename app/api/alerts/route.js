/**
 * app/api/alerts/route.js
 * Email alerts via Resend (free: 100 emails/day)
 * Setup: resend.com signup → API key → Vercel env: RESEND_API_KEY
 */
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const { type, to, subject, text, booking } = await request.json();
    if (type !== "email") return Response.json({ ok:false, error:"Unknown type" });

    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      console.log("[EMAIL] No RESEND_API_KEY. Would send to:", to, "| Subject:", subject);
      return Response.json({ ok:true, mode:"logged_only",
        note:"Add RESEND_API_KEY in Vercel env to enable emails" });
    }

    const b = booking || {};
    const fmtNum = v => Number(v||0).toLocaleString("en-IN");
    const fmtDate = d => { try { return new Date(d).toLocaleDateString("en-IN"); } catch { return d||"—"; } };

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
        <div class="hn">${b.hotelName||"The GuestInn"}</div>
        <div class="hs">AI-POWERED HOTEL MANAGEMENT</div>
      </div>
      <div class="badge">✓ NEW CHECK-IN</div>
      ${[
        ["Guest",     b.guestName||"—"],
        ["Phone",     b.guestPhone||"—"],
        ["ID",        `${b.idType||"—"} · ${b.idNumber||"—"}`],
        ["Room",      `${b.roomId||"—"} (${b.roomType||"standard"})`],
        ["Check-in",  fmtDate(b.checkInDate)],
        ["Check-out", fmtDate(b.checkOutDate)],
        ["Nights",    String(b.nights||1)],
        ["Rate/Night",`₹${fmtNum(b.ratePerNight)}`],
        ["Payment",   b.paymentMode||"—"],
        ["Booking ID",b.id?.slice(-8)||"—"],
      ].map(([l,v])=>`<div class="row"><span class="lbl">${l}</span><span class="val">${v}</span></div>`).join("")}
      <div class="tot">
        <div style="font-size:11px;color:#888;margin-bottom:4px">TOTAL AMOUNT</div>
        <div class="amt">₹${fmtNum(b.totalAmount)}</div>
        <div style="font-size:11px;color:#888;margin-top:4px">🔒 Rate Locked</div>
      </div>
      <div class="ft">The GuestInn AI • ${new Date().toLocaleString("en-IN")}</div>
    </div></body></html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method:"POST",
      headers:{ "Authorization":`Bearer ${apiKey}`, "Content-Type":"application/json" },
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
      return Response.json({ ok:false, error:err });
    }
    const data = await res.json();
    return Response.json({ ok:true, id:data.id });

  } catch(e) {
    console.error("[EMAIL] Error:", e.message);
    return Response.json({ ok:false, error:e.message });
  }
}
