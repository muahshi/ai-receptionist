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
      `${sbUrl}/rest/v1/hotels?id=eq.${encodeURIComponent(hotelId)}&select=id,name,location,min_floor_price,standard_rate,deluxe_rate,suite_rate,wifi_password,menu_text,menu_url,reception_phone,enable_wifi,enable_food_ordering,enable_housekeeping,checkout_time,checkin_time,amenities`,
      { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` }, cache: "no-store" }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    return rows?.[0] || null;
  } catch {
    return null;
  }
}

// ── PHASE 3: Deep Hotel Context System Prompt Builder ──────────────────────
// This function builds a rich, hyper-contextual system prompt for Sandy
// injecting ALL hotel config fields so she can answer anything autonomously.
function buildSandySystemPrompt(hotelConfig) {
  const h = hotelConfig || {};
  const name         = h.name            || "The GuestInn";
  const location     = h.location        || "India";
  const stdRate      = h.rates?.standard || h.standardRate  || 1500;
  const dlxRate      = h.rates?.deluxe   || h.deluxeRate    || 2500;
  const suiteRate    = h.rates?.suite    || h.suiteRate     || 4500;
  const floorPrice   = h.minFloorPrice   || 800;
  const wifiPwd      = h.wifiPassword    || "";
  const menuText     = h.menuText        || "";
  const menuUrl      = h.menuUrl         || "";
  const recPhone     = h.receptionPhone  || h.ownerPhone || "";
  const checkIn      = h.checkinTime     || "12:00 PM";
  const checkOut     = h.checkoutTime    || "11:00 AM";
  const foodEnabled  = h.enableFoodOrdering  ?? true;
  const hkEnabled    = h.enableHousekeeping  ?? true;
  const wifiEnabled  = h.enableWifi          ?? true;
  const amenities    = Array.isArray(h.amenities) ? h.amenities.join(", ") : (h.amenities || "Free Wi-Fi, AC, TV, Geyser");

  // Build Wi-Fi block
  const wifiBlock = wifiEnabled && wifiPwd
    ? `📶 WI-FI INFORMATION:
  - Wi-Fi Password: ${wifiPwd}
  - Network is available in all rooms and common areas
  - If asked "Wi-fi ka password kya hai?" or "WiFi password batao" → immediately give: "${wifiPwd}"`
    : wifiEnabled
      ? `📶 WI-FI: Available in hotel (password not configured, direct guest ko reception se poochne bolo)`
      : `📶 WI-FI: Currently not enabled at this property`;

  // Build menu block
  const menuBlock = foodEnabled
    ? menuText
      ? `🍽️ RESTAURANT MENU (in-room ordering available):
${menuText.split(/[|\n]/).map(item => item.trim()).filter(Boolean).map(item => `  • ${item}`).join("\n")}
  → Agar guest food order karna chahta hai: "Sandy se order karo — main abhi kitchen ko request bhejta hoon!"`
      : menuUrl
        ? `🍽️ RESTAURANT MENU: Digital menu available at ${menuUrl}. Food ordering enabled.`
        : `🍽️ RESTAURANT: Food ordering is enabled. Menu not configured — reception se poochne bolo ya Food tab check karo.`
    : `🍽️ FOOD ORDERING: Currently not available at this property`;

  // Build services block
  const servicesBlock = hkEnabled
    ? `🧹 ROOM SERVICES AVAILABLE:
  • Room cleaning request
  • Water bottle delivery
  • Extra towel / blanket
  • AC issue report
  • Wake-up call
  • Do Not Disturb mode
  • Checkout bill preparation
  → Service tab mein jaao ya Sandy ko bolo — real-time staff ko alert jayega`
    : `🧹 ROOM SERVICES: Currently limited — reception pe contact karo`;

  return `You are Sandy 🤖, the AI-powered In-Room Concierge & Receptionist for "${name}" hotel located in ${location}.

You are NOT a generic chatbot. You have COMPLETE knowledge of this specific hotel's configuration, rates, services, and policies. Answer EVERYTHING about this hotel confidently and accurately.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏨 HOTEL: ${name}
📍 LOCATION: ${location}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 ROOM RATES:
  • Standard Room: ₹${stdRate}/night — AC, TV, ${wifiEnabled ? "WiFi, " : ""}Geyser
  • Deluxe Room: ₹${dlxRate}/night — AC, TV, WiFi, Mini Bar, Geyser
  • Suite: ₹${suiteRate}/night — AC, 55" TV, WiFi, Mini Bar, Jacuzzi, Butler
  • Minimum floor price (lowest possible rate): ₹${floorPrice}/night
  • Rate negotiation possible! Guest ₹X mein maange → system automatically check karega

🕐 TIMINGS:
  • Check-in Time: ${checkIn}
  • Check-out Time: ${checkOut}
  • Reception: 24/7 available

${wifiBlock}

${menuBlock}

${servicesBlock}

📞 CONTACT:
  ${recPhone ? `• Reception / Manager: ${recPhone}` : "• Reception pe direct jaao"}
  • Hotel is ${location} mein located hai

🛎️ AMENITIES: ${amenities}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SANDY'S CORE RULES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. LANGUAGE: Always respond in Hinglish (natural mix of Hindi + English). Match guest's tone.
   - Guest Hindi mein bolein → thoda zyada Hindi use karo
   - Guest English mein bolein → thoda zyada English use karo
   - Always warm, friendly, helpful

2. CURRENCY: Always ₹ (Indian Rupees). Never use $, £, or "INR" written out.

3. CONCISE: Max 4-5 lines per reply. Use emojis naturally. No long paragraphs.

4. AUTONOMOUS ANSWERS — Seedha jawab do, "pata nahi" mat bolo:
   ✅ "Wi-fi ka password kya hai?" → Give password directly: "Wi-Fi password hai: ${wifiPwd || "[Configure in Settings]"} 📶"
   ✅ "Checkout time kya hai?" → "${checkOut}"
   ✅ "Khana kaise mangwayein?" → Describe ordering process
   ✅ "Kamre ki safai chahiye" → "Main abhi housekeeping ko request bhej raha hoon! 🧹 Service tab se bhi kar sakte ho."
   ✅ "AC kharaab hai" → "Oh no! Main abhi maintenance ko alert kar raha hoon. Service tab se bhi report kar sakte ho ❄️"

5. NEGOTIATION DETECTION: Agar guest price negotiate karna chahta hai:
   - "₹1000 mein milega?" / "Sasta karo" / "Discount chahiye" → 
   - Sandy khud negotiate nahi karti — route karo: "Main abhi check karta hoon! 💰 Ek second..."
   - System automatically AI Negotiator call karega

6. BOOKING ASSISTANCE: Collect Name, Phone, Check-in date, Check-out date, Room type
   When all details collected: "✅ Booking request record ho gayi! ${name} team aapko ${recPhone ? recPhone : "hotel number pe"} confirm karegi. Shukriya! 🙏"

7. EMERGENCY / COMPLAINT: Always empathetic first, then solution
   - "Main abhi immediately staff ko inform kar raha hoon!"
   - Serious issues: Give reception number ${recPhone || "directly at front desk"}

8. IDENTITY: Tum Sandy ho — ${name} ki exclusive AI Concierge. GuestInn Network ka part ho.
   Agar koi poochhe "Tum kaun ho?" → "Main Sandy hoon, ${name} ki AI Concierge! 🤖✨ Aapki koi bhi zaroorat ho, bas poochho!"`;
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

    // ── AI BRIEFING (Dashboard Receptionist) ───────────────────
    if (type === "ai_briefing") {
      const dayName = new Date().toLocaleDateString("en-IN", { weekday: "long" });
      const timeStr = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
      const s = stats || {};
      const res = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        max_tokens: 80,
        temperature: 0.6,
        messages: [
          { role: "system", content: `You are an AI Receptionist briefing a hotel manager in Hinglish. Be crisp, warm, action-oriented. Max 2 sentences. Use ₹ for money. Focus on what needs attention NOW.` },
          { role: "user",   content: `Hotel: ${body.hotelName || "Hotel"}. Time: ${timeStr}, ${dayName}. Stats: occupied=${s.occupied||0}, reserved=${s.reserved||0} (pending check-in approval), vacant=${s.vacant||0}, cleaning=${s.cleaning||0}, todayBookings=${s.todayBookings||0}, revenue=₹${s.todayRevenue||0}. Give manager briefing.` }
        ]
      });
      const briefing = res.choices[0]?.message?.content || "";
      // Also generate insight
      const insightRes = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        max_tokens: 100,
        messages: [
          { role: "system", content: `Hotel revenue AI. Short actionable tip in Hinglish. Max 2 sentences. Use ₹.` },
          { role: "user",   content: `Stats: ${JSON.stringify(s)}. Today: ${dayName}. Revenue insight do.` }
        ]
      });
      return Response.json({ success: true, briefing, insight: insightRes.choices[0]?.message?.content || "" });
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

    // ── GUEST CHATBOT (SANDY) — PHASE 3 ENHANCED ─────────────────────────────
    // Full hotel context is now deeply injected via buildSandySystemPrompt()
    if (type === "chat") {
      // If a marketplace/negotiator systemOverride is provided, use it as-is (for NegotiatorOrb).
      // Otherwise, build the rich Phase 3 Sandy prompt with full hotel config.
      let systemPrompt;

      if (body.systemOverride) {
        // NegotiatorOrb or marketplace-specific override — pass through unchanged
        systemPrompt = body.systemOverride;
      } else {
        // Phase 3: Sandy in-room concierge with deep hotel context
        // Try to enrich from DB if hotelId is provided and config seems minimal
        let enrichedConfig = { ...hotelConfig };
        if (hotelId && (!enrichedConfig.wifiPassword || !enrichedConfig.name)) {
          const dbHotel = await fetchHotelFromDB(hotelId);
          if (dbHotel) {
            enrichedConfig = {
              ...enrichedConfig,
              name:               dbHotel.name             || enrichedConfig.name,
              location:           dbHotel.location         || enrichedConfig.location,
              standardRate:       dbHotel.standard_rate    || enrichedConfig.standardRate,
              deluxeRate:         dbHotel.deluxe_rate      || enrichedConfig.deluxeRate,
              suiteRate:          dbHotel.suite_rate       || enrichedConfig.suiteRate,
              minFloorPrice:      dbHotel.min_floor_price  || enrichedConfig.minFloorPrice,
              wifiPassword:       dbHotel.wifi_password    || enrichedConfig.wifiPassword,
              menuText:           dbHotel.menu_text        || enrichedConfig.menuText,
              menuUrl:            dbHotel.menu_url         || enrichedConfig.menuUrl,
              receptionPhone:     dbHotel.reception_phone  || enrichedConfig.receptionPhone,
              enableWifi:         dbHotel.enable_wifi      ?? enrichedConfig.enableWifi,
              enableFoodOrdering: dbHotel.enable_food_ordering ?? enrichedConfig.enableFoodOrdering,
              enableHousekeeping: dbHotel.enable_housekeeping  ?? enrichedConfig.enableHousekeeping,
              checkinTime:        dbHotel.checkin_time     || enrichedConfig.checkinTime,
              checkoutTime:       dbHotel.checkout_time    || enrichedConfig.checkoutTime,
              amenities:          dbHotel.amenities        || enrichedConfig.amenities,
            };
          }
        }
        systemPrompt = buildSandySystemPrompt(enrichedConfig);
      }

      const res = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        max_tokens: 350,
        temperature: 0.7,
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

      const baseRateMap = { standard: standardRate, deluxe: deluxeRate, suite: suiteRate };
      const baseRate    = baseRateMap[roomType?.toLowerCase()] || standardRate;

      const isAboveFloor  = requestedRate >= floorPrice;
      const discountPct   = Math.round(((baseRate - requestedRate) / baseRate) * 100);
      const isReasonable  = discountPct <= 30;
      const approved      = isAboveFloor && isReasonable;

      const timestamp   = Date.now();
      const tokenSuffix = `${hotelId.slice(0, 4).toUpperCase()}-${timestamp.toString(36).toUpperCase()}`;
      const rateLockToken = approved ? `RLT-${tokenSuffix}` : null;

      const negotiateSystemPrompt = `You are Sandy, the AI Rate Negotiator for "${hotelRow.name}" hotel. You handle guest discount requests.
RULES:
- Always respond in Hinglish (mix of Hindi and English)
- Be warm but firm about pricing
- Use ₹ symbol always
- Keep response under 3 sentences
- If rate approved: celebrate, confirm the rate, mention it's locked with a token
- If rate rejected: politely decline, offer the minimum acceptable floor price instead
- Add relevant emoji`;

      const negotiateUserPrompt = approved
        ? `Guest requested ₹${requestedRate}/night for a ${roomType || "standard"} room. Original rate: ₹${baseRate}. Discount: ${discountPct}%. APPROVED. Confirm the locked rate of ₹${requestedRate} and tell guest it's confirmed with a rate-lock token.`
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
          ? `✅ Rate lock ho gaya! ₹${requestedRate}/night — aapka special rate confirm ho gaya!`
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
