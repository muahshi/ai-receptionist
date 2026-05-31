// CRITICAL FIX: force-dynamic prevents build-time execution
export const dynamic = "force-dynamic";

import Groq from "groq-sdk";

function getGroqClient() {
  const apiKey = process.env.MY_GROQ_KEY;
  if (!apiKey) throw new Error("MY_GROQ_KEY is not set in Vercel Environment Variables");
  return new Groq({ apiKey });
}

// ── Supabase direct fetch (no SDK dependency) ───────────────────
async function fetchHotelFromDB(hotelId) {
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!sbUrl || !sbKey || sbUrl === "undefined") return null;
  try {
    const res = await fetch(
      `${sbUrl}/rest/v1/hotels?id=eq.${encodeURIComponent(hotelId)}&select=id,name,location,min_floor_price,standard_rate,deluxe_rate,suite_rate`,
      { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` }, cache: "no-store" }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    return rows?.[0] || null;
  } catch {
    return null;
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { imageBase64, type, stats, hotelId, messages: chatHistory, hotelConfig } = body;
    const groq = getGroqClient();

    // ── ID SCAN ────────────────────────────────────────────────
    if (type === "id_scan") {
      if (!imageBase64) return Response.json({ error: "Image required" }, { status: 400 });
      const response = await groq.chat.completions.create({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        max_tokens: 600,
        temperature: 0.1,
        messages: [{
          role: "user",
          content: [
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
            {
              type: "text",
              text: `You are an expert OCR for Indian ID documents (Aadhaar, PAN, Passport, DL, Voter ID).
Extract ALL visible text fields. Return ONLY raw JSON, no markdown:
{"name":"","dob":"","address":"","idNumber":"","idType":"","gender":""}
Rules: name=full name, dob=DD/MM/YYYY, idNumber=exact number on card, idType=one of Aadhaar/PAN/Passport/Driving License/Voter ID, gender=M or F. Empty string if not visible. Do NOT invent data.`
            }
          ]
        }]
      });
      const raw = response.choices[0]?.message?.content?.trim() || "{}";
      let extracted = {};
      try {
        const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
        const m = cleaned.match(/\{[\s\S]*\}/);
        if (m) extracted = JSON.parse(m[0]);
      } catch (e) {
        extracted = { name: "", dob: "", address: "", idNumber: "", idType: "", gender: "" };
      }
      const clean = {};
      for (const k of ["name", "dob", "address", "idNumber", "idType", "gender"])
        clean[k] = typeof extracted[k] === "string" ? extracted[k].trim() : "";
      return Response.json({ success: true, data: clean });
    }

    // ── AI INSIGHT ──────────────────────────────────────────────
    if (type === "ai_insight") {
      const dayName = new Date().toLocaleDateString("en-IN", { weekday: "long" });
      const month   = new Date().toLocaleDateString("en-IN", { month: "long" });
      const res = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        max_tokens: 150,
        messages: [
          { role: "system", content: `You are a hotel revenue AI for Indian hotels. Give short actionable tips in Hinglish (Hindi+English). Max 2 sentences. Use ₹ for currency.` },
          { role: "user",   content: `Stats: ${JSON.stringify(stats || {})}. Today: ${dayName}, ${month}. Give revenue insight.` }
        ]
      });
      return Response.json({ success: true, insight: res.choices[0]?.message?.content || "" });
    }

    // ── GUEST CHATBOT ────────────────────────────────────────────
    if (type === "chat") {
      const systemPrompt = `You are a friendly AI receptionist for "${hotelConfig?.name || "The GuestInn"}" hotel located in ${hotelConfig?.location || "India"}.

Your job: Help guests book rooms, answer questions, collect their details.

RULES:
- Always use ₹ (Indian Rupees), never $
- Respond in same language as guest (Hindi/English/Hinglish)
- Be warm, friendly, concise (max 4 lines per reply)
- Room types available:
  • Standard Room: ₹${hotelConfig?.rates?.standard || hotelConfig?.standardRate || 1500}/night (AC, TV, WiFi, Geyser)
  • Deluxe Room: ₹${hotelConfig?.rates?.deluxe || hotelConfig?.deluxeRate || 2500}/night (AC, TV, WiFi, Mini Bar, Geyser)
  • Suite: ₹${hotelConfig?.rates?.suite || hotelConfig?.suiteRate || 4500}/night (AC, 55" TV, WiFi, Mini Bar, Jacuzzi, Butler)
- For booking: collect Name, Phone number, Check-in date, Check-out date, Room type
- When guest gives their details say: "✅ Booking request submit ho gayi! ${hotelConfig?.name || "Hotel"} team aapko confirm karega. Shukriya! 🙏"
- Answer location questions: hotel is in ${hotelConfig?.location || "India"}
- If asked about facilities: WiFi, parking, 24/7 reception, room service available`;

      const res = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        max_tokens: 300,
        messages: [
          { role: "system", content: systemPrompt },
          ...(chatHistory || [])
        ]
      });
      return Response.json({
        success: true,
        message: res.choices[0]?.message?.content || "Kuch problem aa gayi. Dobara try karo."
      });
    }

    // ── AI NEGOTIATOR ────────────────────────────────────────────
    // Intercepts a guest's discount request, validates against hotel's
    // min_floor_price from DB, and returns a rate-lock confirmation token.
    if (type === "negotiate") {
      const { requestedRate, roomType, bookingContext } = body;

      if (!hotelId) {
        return Response.json({ error: "hotelId is required for negotiate" }, { status: 400 });
      }
      if (typeof requestedRate !== "number" || requestedRate <= 0) {
        return Response.json({ error: "requestedRate must be a positive number" }, { status: 400 });
      }

      // Step 1 — Fetch hotel floor price from DB
      let hotelRow = await fetchHotelFromDB(hotelId);

      // Fallback: use hotelConfig passed in body if DB fetch fails
      if (!hotelRow) {
        hotelRow = {
          id: hotelId,
          name: hotelConfig?.name || "The GuestInn",
          location: hotelConfig?.location || "India",
          min_floor_price: hotelConfig?.minFloorPrice || 800,
          standard_rate: hotelConfig?.standardRate || 1200,
          deluxe_rate:   hotelConfig?.deluxeRate   || 2000,
          suite_rate:    hotelConfig?.suiteRate     || 3800,
        };
      }

      const floorPrice     = hotelRow.min_floor_price || 800;
      const standardRate   = hotelRow.standard_rate   || 1200;
      const deluxeRate     = hotelRow.deluxe_rate     || 2000;
      const suiteRate      = hotelRow.suite_rate      || 3800;

      // Step 2 — Determine base rate for the requested room type
      const baseRateMap = { standard: standardRate, deluxe: deluxeRate, suite: suiteRate };
      const baseRate    = baseRateMap[roomType?.toLowerCase()] || standardRate;

      // Step 3 — Safety check: requested rate vs floor price
      const isAboveFloor  = requestedRate >= floorPrice;
      const discountPct   = Math.round(((baseRate - requestedRate) / baseRate) * 100);
      const isReasonable  = discountPct <= 30; // max 30% discount via AI negotiator
      const approved      = isAboveFloor && isReasonable;

      // Step 4 — Build rate-lock token (deterministic, no crypto dependency needed at this layer)
      const timestamp   = Date.now();
      const tokenSuffix = `${hotelId.slice(0, 4).toUpperCase()}-${timestamp.toString(36).toUpperCase()}`;
      const rateLockToken = approved ? `RLT-${tokenSuffix}` : null;

      // Step 5 — Generate AI response message in Hinglish
      const negotiateSystemPrompt = `You are the AI Negotiator for "${hotelRow.name}" hotel. You handle guest discount requests.
RULES:
- Always respond in Hinglish (mix of Hindi and English)
- Be warm but firm about pricing
- Use ₹ symbol always
- Keep response under 3 sentences
- If rate approved: celebrate, confirm the rate, mention it's locked
- If rate rejected: politely decline, offer the minimum acceptable floor price instead`;

      const negotiateUserPrompt = approved
        ? `Guest requested ₹${requestedRate}/night for a ${roomType || "standard"} room. Original rate: ₹${baseRate}. Discount: ${discountPct}%. APPROVED. Confirm the locked rate of ₹${requestedRate} and tell guest it's confirmed.`
        : `Guest requested ₹${requestedRate}/night for a ${roomType || "standard"} room. Original rate: ₹${baseRate}. This is ${isAboveFloor ? `too high a discount (${discountPct}%)` : "below our minimum floor price"}. REJECTED. Politely say we can offer ₹${floorPrice} as the best possible rate.`;

      const aiRes = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        max_tokens: 150,
        messages: [
          { role: "system", content: negotiateSystemPrompt },
          { role: "user",   content: negotiateUserPrompt }
        ]
      });

      const aiMessage = aiRes.choices[0]?.message?.content || (
        approved
          ? `✅ Rate lock confirmed! ₹${requestedRate}/night — aapka special rate lock ho gaya!`
          : `Sorry, ₹${requestedRate} available nahi hai. Hamare liye best rate ₹${floorPrice}/night hai.`
      );

      return Response.json({
        success:        true,
        approved,
        requestedRate,
        finalRate:      approved ? requestedRate : floorPrice,
        baseRate,
        floorPrice,
        discountPct:    approved ? discountPct : 0,
        rateLockToken,
        message:        aiMessage,
        hotelName:      hotelRow.name,
        roomType:       roomType || "standard",
        // Booking context echo-back so frontend can auto-fill
        bookingContext: bookingContext || null,
      });
    }

    return Response.json({ error: "Invalid type" }, { status: 400 });

  } catch (error) {
    console.error("Groq API Error:", error.message);
    return Response.json(
      { error: error.message },
      { status: error.message.includes("MY_GROQ_KEY") ? 500 : 502 }
    );
  }
}
