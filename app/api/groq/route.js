// app/api/groq/route.js — The GuestInn Network: AI Engine
// ═══════════════════════════════════════════════════════════════
// Handles: id_scan, ai_insight, chat, negotiate
// id_scan returns both extracted fields AND signals to store Base64
// negotiate cross-checks hotel's min_floor_price from Supabase DB
// ═══════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import Groq from "groq-sdk";

function getGroqClient() {
  const apiKey = process.env.MY_GROQ_KEY;
  if (!apiKey) throw new Error("MY_GROQ_KEY is not set in Vercel Environment Variables");
  return new Groq({ apiKey });
}

// ── Supabase direct fetch (no SDK needed server-side) ─────────
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

// ── Store id_image_base64 in Supabase bookings row ────────────
// Called after a scan completes when a bookingId is provided.
// Stores the absolute Base64 data string for police records compliance.
async function storeIdImageInDB(bookingId, idImageBase64) {
  if (!bookingId || !idImageBase64) return;
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!sbUrl || !sbKey || sbUrl === "undefined") return;
  try {
    await fetch(`${sbUrl}/rest/v1/bookings?id=eq.${encodeURIComponent(bookingId)}`, {
      method:  "PATCH",
      headers: {
        apikey:            sbKey,
        Authorization:     `Bearer ${sbKey}`,
        "Content-Type":    "application/json",
        Prefer:            "return=minimal",
      },
      body: JSON.stringify({ id_image_base64: idImageBase64 }),
    });
    console.log("[Groq] id_image_base64 stored in Supabase for booking:", bookingId);
  } catch (e) {
    console.warn("[Groq] id_image_base64 store failed:", e.message);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { type, imageBase64, stats, hotelId, messages: chatHistory, hotelConfig } = body;
    const groq = getGroqClient();

    // ══════════════════════════════════════════════════════════
    // ID SCAN
    // Extracts fields from an Indian ID document image.
    // The absolute Base64 string (id_image_base64) is passed back
    // to the client and also optionally stored in Supabase if
    // bookingId is provided — required for police records compliance.
    // ══════════════════════════════════════════════════════════
    if (type === "id_scan") {
      if (!imageBase64) return Response.json({ error: "Image required" }, { status: 400 });

      const response = await groq.chat.completions.create({
        model:       "meta-llama/llama-4-scout-17b-16e-instruct",
        max_tokens:  700,
        temperature: 0.05,
        messages: [{
          role:    "user",
          content: [
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
            {
              type: "text",
              text: `You are an expert OCR system for Indian ID documents (Aadhaar, PAN Card, Passport, Driving License, Voter ID).
Extract ALL visible text fields from this ID document image.
Return ONLY a raw JSON object — no markdown, no backticks, no explanation:
{"name":"","dob":"","address":"","idNumber":"","idType":"","gender":"","fatherName":"","placeOfBirth":""}

Field rules:
- name: Full name exactly as printed
- dob: Format as DD/MM/YYYY
- idNumber: Exact number sequence printed on card (Aadhaar: 12 digits; PAN: 10 chars; Passport: 8 chars)
- idType: One of exactly: Aadhaar, PAN, Passport, Driving License, Voter ID
- gender: M or F only
- address: Complete address including pin code if visible
- fatherName: Father's / husband's name if visible, else empty string
- placeOfBirth: Place of birth if visible (Passport), else empty string
- Use empty string "" for any field not visible — do NOT invent or guess data`,
            }
          ],
        }],
      });

      const raw = response.choices[0]?.message?.content?.trim() || "{}";
      let extracted = {};
      try {
        const cleaned = raw
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/```\s*$/i, "")
          .trim();
        const m = cleaned.match(/\{[\s\S]*\}/);
        if (m) extracted = JSON.parse(m[0]);
      } catch {
        extracted = {};
      }

      // Sanitize all extracted fields — only keep non-empty strings
      const clean = {};
      for (const k of ["name","dob","address","idNumber","idType","gender","fatherName","placeOfBirth"]) {
        clean[k] = typeof extracted[k] === "string" ? extracted[k].trim() : "";
      }

      // If bookingId was passed, store Base64 in DB for police records compliance
      const { bookingId } = body;
      if (bookingId) {
        await storeIdImageInDB(bookingId, imageBase64);
      }

      return Response.json({
        success: true,
        data:    clean,
        // Echo back Base64 so client can save it to localStorage/booking object
        // Client must store this as id_image_base64 in the booking record
        idImageBase64: imageBase64,
      });
    }

    // ══════════════════════════════════════════════════════════
    // AI INSIGHT — Hinglish revenue tip for dashboard
    // ══════════════════════════════════════════════════════════
    if (type === "ai_insight") {
      const dayName = new Date().toLocaleDateString("en-IN", { weekday:"long" });
      const month   = new Date().toLocaleDateString("en-IN", { month:"long" });
      const res = await groq.chat.completions.create({
        model:      "llama-3.3-70b-versatile",
        max_tokens: 150,
        messages: [
          { role:"system", content:`You are a hotel revenue AI for Indian budget hotels. Give short actionable tips in Hinglish (Hindi+English). Max 2 sentences. Use ₹ for currency. Be specific and data-driven.` },
          { role:"user",   content:`Hotel stats: ${JSON.stringify(stats || {})}. Hotel: ${body.hotelName || "The GuestInn"}. Today: ${dayName}, ${month}. Give one revenue insight.` },
        ],
      });
      return Response.json({
        success: true,
        insight: res.choices[0]?.message?.content || "",
      });
    }

    // ══════════════════════════════════════════════════════════
    // GUEST CHATBOT — Hinglish AI receptionist
    // Supports marketplace system override via systemOverride field
    // ══════════════════════════════════════════════════════════
    if (type === "chat") {
      const systemPrompt = body.systemOverride ||
        `You are a friendly AI receptionist for "${hotelConfig?.name || "The GuestInn"}" hotel located in ${hotelConfig?.location || "India"}.

Your job: Help guests book rooms, answer questions, negotiate rates politely.

RULES:
- Always use ₹ (Indian Rupees), never $
- Respond in same language as guest (Hindi/English/Hinglish preferred)
- Be warm, friendly, concise (max 4 lines per reply)
- Room types available:
  • Standard Room: ₹${hotelConfig?.rates?.standard || hotelConfig?.standardRate || 1500}/night (AC, TV, WiFi, Geyser)
  • Deluxe Room: ₹${hotelConfig?.rates?.deluxe || hotelConfig?.deluxeRate || 2500}/night (AC, TV, WiFi, Mini Bar, Geyser)
  • Suite: ₹${hotelConfig?.rates?.suite || hotelConfig?.suiteRate || 4500}/night (AC, 55" TV, WiFi, Mini Bar, Jacuzzi, Butler)
- Min floor price: ₹${hotelConfig?.minFloorPrice || 800}/night — negotiated rates cannot go below this
- For booking: collect Name, Phone, Check-in date, Check-out date, Room type
- When guest confirms booking: "✅ Booking request submit ho gayi! ${hotelConfig?.name || "Hotel"} team aapko confirm karega. Shukriya! 🙏"
- If asked about rate negotiation: explain AI Negotiator feature — guest can type "₹1000 mein milega?" to negotiate`;

      const res = await groq.chat.completions.create({
        model:      "llama-3.3-70b-versatile",
        max_tokens: 300,
        messages: [
          { role:"system", content:systemPrompt },
          ...(chatHistory || []),
        ],
      });
      return Response.json({
        success: true,
        message: res.choices[0]?.message?.content || "Kuch problem aa gayi. Dobara try karo.",
      });
    }

    // ══════════════════════════════════════════════════════════
    // AI NEGOTIATOR
    // Intercepts guest discount requests, validates against hotel's
    // min_floor_price from Supabase DB, generates rate-lock token.
    //
    // Logic:
    //  1. Fetch hotel's min_floor_price from DB (authoritative)
    //  2. Check requested rate >= floor price AND discount <= 30%
    //  3. If approved: generate RLT-XXXX rate lock token
    //  4. Generate Hinglish AI response message
    //  5. Return approved/rejected with finalRate + token
    // ══════════════════════════════════════════════════════════
    if (type === "negotiate") {
      const { requestedRate, roomType, bookingContext } = body;

      if (!hotelId) {
        return Response.json({ error: "hotelId is required for negotiate" }, { status: 400 });
      }
      if (typeof requestedRate !== "number" || requestedRate <= 0) {
        return Response.json({ error: "requestedRate must be a positive number" }, { status: 400 });
      }

      // Step 1 — Fetch hotel floor price from DB (authoritative source)
      let hotelRow = await fetchHotelFromDB(hotelId);

      // Fallback to hotelConfig passed in body if DB unavailable
      if (!hotelRow) {
        hotelRow = {
          id:              hotelId,
          name:            hotelConfig?.name         || "The GuestInn",
          location:        hotelConfig?.location     || "India",
          min_floor_price: hotelConfig?.minFloorPrice|| 800,
          standard_rate:   hotelConfig?.standardRate || 1200,
          deluxe_rate:     hotelConfig?.deluxeRate   || 2000,
          suite_rate:      hotelConfig?.suiteRate    || 3800,
        };
      }

      const floorPrice   = hotelRow.min_floor_price || 800;
      const standardRate = hotelRow.standard_rate   || 1200;
      const deluxeRate   = hotelRow.deluxe_rate     || 2000;
      const suiteRate    = hotelRow.suite_rate      || 3800;

      // Step 2 — Determine base rate for room type
      const baseRateMap = { standard:standardRate, deluxe:deluxeRate, suite:suiteRate };
      const baseRate    = baseRateMap[roomType?.toLowerCase()] || standardRate;

      // Step 3 — Approval logic
      const isAboveFloor = requestedRate >= floorPrice;
      const discountPct  = Math.round(((baseRate - requestedRate) / baseRate) * 100);
      const isReasonable = discountPct <= 30;  // max 30% discount via AI negotiator
      const approved     = isAboveFloor && isReasonable && requestedRate > 0;

      // Step 4 — Rate lock token (deterministic, audit-traceable)
      const timestamp   = Date.now();
      const tokenSuffix = `${hotelId.slice(0,4).toUpperCase()}-${timestamp.toString(36).toUpperCase()}`;
      const rateLockToken = approved ? `RLT-${tokenSuffix}` : null;

      // Step 5 — Generate AI response in Hinglish
      const negotiateSystemPrompt =
        `You are the AI Rate Negotiator for "${hotelRow.name}" hotel in ${hotelRow.location}.
You handle guest discount requests on behalf of hotel management.
RULES:
- Always respond in Hinglish (natural Hindi + English mix)
- Be warm but professionally firm about pricing
- Use ₹ symbol always
- Keep response under 3 sentences
- If APPROVED: celebrate warmly, confirm the locked rate clearly, mention rate is now locked until checkout
- If REJECTED: apologize politely, offer the best available floor rate instead`;

      const negotiateUserPrompt = approved
        ? `Guest requested ₹${requestedRate}/night for ${roomType || "standard"} room. Original rate: ₹${baseRate}/night. Discount: ${discountPct}%. Decision: APPROVED. Confirm rate ₹${requestedRate} is locked. Be warm and celebratory.`
        : `Guest requested ₹${requestedRate}/night for ${roomType || "standard"} room. Original rate: ₹${baseRate}/night. Reason for rejection: ${!isAboveFloor ? `below our minimum floor price of ₹${floorPrice}` : `discount of ${discountPct}% is too high (max 30% allowed)`}. Decision: REJECTED. Politely decline. Offer best rate of ₹${floorPrice}/night instead.`;

      const aiRes = await groq.chat.completions.create({
        model:      "llama-3.3-70b-versatile",
        max_tokens: 160,
        messages: [
          { role:"system", content:negotiateSystemPrompt },
          { role:"user",   content:negotiateUserPrompt },
        ],
      });

      const aiMessage = aiRes.choices[0]?.message?.content || (
        approved
          ? `✅ Bilkul! ₹${requestedRate}/night lock ho gaya aapke liye — special rate confirmed! 🎉`
          : `Sorry, ₹${requestedRate} available nahi hai abhi. Hamare liye best rate ₹${floorPrice}/night hai — yahi best kar sakte hain! 🙏`
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
        bookingContext: bookingContext || null,
      });
    }

    return Response.json({ error: "Invalid type. Valid types: id_scan, ai_insight, chat, negotiate" }, { status: 400 });

  } catch (error) {
    console.error("[Groq API] Error:", error.message);
    return Response.json(
      { error: error.message },
      { status: error.message.includes("MY_GROQ_KEY") ? 500 : 502 }
    );
  }
}
