// app/api/alerts/route.js — The GuestInn Network: Alerts Proxy
// Server-side WhatsApp Cloud API sender + booking confirmation handler

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, booking } = body;

    if (action === "whatsapp") {
      if (!booking) return Response.json({ error:"booking required" }, { status:400 });

      const token  = process.env.WHATSAPP_ACCESS_TOKEN;
      const fromId = process.env.WHATSAPP_PHONE_NUMBER_ID;
      const phoneRaw = booking.ownerPhone || booking.managerPhone || process.env.NEXT_PUBLIC_HOTEL_OWNER_PHONE;

      if (!token || !fromId || !phoneRaw) {
        return Response.json({
          success: false,
          reason:  "WhatsApp credentials not configured. Set WHATSAPP_ACCESS_TOKEN + WHATSAPP_PHONE_NUMBER_ID in Vercel.",
          simulate: true,
        });
      }

      const phone = phoneRaw.replace(/\D/g,"").replace(/^0/,"").replace(/^(?!91)/,"91");
      const statusText = booking.status === "reserved"   ? "New Reservation — Approval Pending (GOLD)"
                       : booking.status === "occupied"   ? "Guest Checked In — OCCUPIED"
                       : booking.status === "checked_out"? "Guest Checked Out"
                       : "Booking Update";
      const checkInFmt = booking.checkInDate
        ? new Date(booking.checkInDate).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})
        : "—";

      const payload = {
        messaging_product: "whatsapp",
        to:   phone,
        type: "template",
        template: {
          name:     "guestinn_booking_alert",
          language: { code:"en" },
          components: [{
            type:       "body",
            parameters: [
              { type:"text", text:statusText },
              { type:"text", text:booking.guestName   || "—" },
              { type:"text", text:booking.roomId      || "—" },
              { type:"text", text:checkInFmt },
              { type:"text", text:`₹${Number(booking.totalAmount||0).toLocaleString("en-IN")}` },
              { type:"text", text:booking.id?.slice(-10).toUpperCase() || "—" },
            ],
          }],
        },
      };

      const res = await fetch(`https://graph.facebook.com/v20.0/${fromId}/messages`, {
        method:  "POST",
        headers: { Authorization:`Bearer ${token}`, "Content-Type":"application/json" },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) return Response.json({ success:true, messageId:data.messages?.[0]?.id });
      return Response.json({ success:false, error:data?.error?.message || "WA send failed" });
    }

    return Response.json({ error:"Invalid action" }, { status:400 });
  } catch (e) {
    return Response.json({ error:e.message }, { status:500 });
  }
}
