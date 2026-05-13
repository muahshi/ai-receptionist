export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const { phone, message } = await request.json();
    if (!phone || !message) {
      return Response.json({ error: "Phone and message required" }, { status: 400 });
    }
    const cleanPhone = phone.replace(/[^+\d]/g, "");

    // WATI
    if (process.env.WATI_API_TOKEN && process.env.WATI_API_ENDPOINT) {
      const watiPhone = cleanPhone.startsWith("+") ? cleanPhone.slice(1) : cleanPhone;
      const res = await fetch(`${process.env.WATI_API_ENDPOINT}/api/v1/sendSessionMessage/${watiPhone}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.WATI_API_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({ messageText: message }),
      });
      return Response.json({ success: res.ok, provider: "WATI" });
    }

    // Twilio
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64");
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`, {
        method: "POST",
        headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ From: process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886", To: `whatsapp:${cleanPhone}`, Body: message }),
      });
      const data = await res.json();
      return Response.json({ success: res.ok, provider: "Twilio", sid: data.sid });
    }

    // Demo mode
    console.log(`[DEMO ALERT] To: ${cleanPhone}\n${message}`);
    return Response.json({ success: true, mode: "demo" });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
