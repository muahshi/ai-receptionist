/**
 * WhatsApp Alert API Route
 * Supports WATI (recommended for India) and Twilio
 */

export async function POST(request) {
  try {
    const { phone, message } = await request.json();

    if (!phone || !message) {
      return Response.json(
        { error: "Phone and message required" },
        { status: 400 }
      );
    }

    // Clean phone number
    const cleanPhone = phone.replace(/[^+\d]/g, "");

    // ─── WATI (Recommended for India) ────────────────────────────────────────
    if (process.env.WATI_API_TOKEN && process.env.WATI_API_ENDPOINT) {
      const result = await sendViaWATI(cleanPhone, message);
      return Response.json(result);
    }

    // ─── TWILIO FALLBACK ──────────────────────────────────────────────────────
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      const result = await sendViaTwilio(cleanPhone, message);
      return Response.json(result);
    }

    // ─── DEMO MODE (No API configured) ───────────────────────────────────────
    console.log(`[DEMO] WhatsApp to ${cleanPhone}:\n${message}\n`);
    return Response.json({
      success: true,
      mode: "demo",
      message: "Alert logged (configure WATI or Twilio for real sending)",
    });
  } catch (error) {
    console.error("Alert API Error:", error);
    return Response.json(
      { error: "Failed to send alert", details: error.message },
      { status: 500 }
    );
  }
}

async function sendViaWATI(phone, message) {
  const endpoint = process.env.WATI_API_ENDPOINT;
  const token = process.env.WATI_API_TOKEN;

  // Remove + from phone for WATI
  const watiPhone = phone.startsWith("+") ? phone.slice(1) : phone;

  const response = await fetch(
    `${endpoint}/api/v1/sendSessionMessage/${watiPhone}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messageText: message }),
    }
  );

  const data = await response.json();
  return { success: response.ok, provider: "WATI", data };
}

async function sendViaTwilio(phone, message) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";

  const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: from,
        To: `whatsapp:${phone}`,
        Body: message,
      }),
    }
  );

  const data = await response.json();
  return { success: response.ok, provider: "Twilio", sid: data.sid };
}
