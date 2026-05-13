// CRITICAL FIX: force-dynamic prevents build-time execution
// Without this, Next.js tries to pre-render this route at build time
// and crashes because MY_GROQ_KEY is not available during build
export const dynamic = "force-dynamic";

import Groq from "groq-sdk";

// LAZY INITIALIZATION — Groq client is created inside the handler,
// NOT at module level. This is the key fix for the Vercel build error.
function getGroqClient() {
  const apiKey = process.env.MY_GROQ_KEY;
  if (!apiKey) {
    throw new Error("MY_GROQ_KEY is not set in Vercel Environment Variables");
  }
  return new Groq({ apiKey });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { imageBase64, type, stats, hotelId } = body;

    const groq = getGroqClient(); // lazy — only runs at request time

    // ── ID DOCUMENT SCAN ────────────────────────────────────────────────────
    if (type === "id_scan") {
      if (!imageBase64) {
        return Response.json({ error: "Image data required" }, { status: 400 });
      }

      const response = await groq.chat.completions.create({
        model: "llava-v1.5-7b-4096-preview",
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
              },
              {
                type: "text",
                text: `You are an ID document scanner for an Indian hotel.
Extract from this ID (Aadhaar/PAN/Passport/DL):
Return ONLY valid JSON — no extra text:
{
  "name": "",
  "dob": "",
  "address": "",
  "idNumber": "",
  "idType": "",
  "gender": ""
}
Empty string if field not visible.`,
              },
            ],
          },
        ],
      });

      const content = response.choices[0]?.message?.content || "{}";
      let extracted = {};
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) extracted = JSON.parse(jsonMatch[0]);
      } catch {
        extracted = { name: "", dob: "", address: "", idNumber: "", idType: "", gender: "" };
      }

      return Response.json({ success: true, data: extracted });
    }

    // ── AI INSIGHT ──────────────────────────────────────────────────────────
    if (type === "ai_insight") {
      const dayName = new Date().toLocaleDateString("en-IN", { weekday: "long" });
      const month = new Date().toLocaleDateString("en-IN", { month: "long" });

      const res = await groq.chat.completions.create({
        model: "llama3-8b-8192",
        max_tokens: 150,
        messages: [
          {
            role: "system",
            content: `You are a hotel revenue AI for Indian hotels. 
Give short actionable tips in Hinglish (Hindi+English). Max 2 sentences. Use ₹ symbol for Indian Rupees, not $.`,
          },
          {
            role: "user",
            content: `Stats: ${JSON.stringify(stats || {})}. Today: ${dayName}, ${month}. Give insight.`,
          },
        ],
      });

      return Response.json({
        success: true,
        insight: res.choices[0]?.message?.content || "",
      });
    }

    // ── GUEST CHATBOT ───────────────────────────────────────────────────────
    if (type === "chat") {
      const { messages: chatHistory, hotelConfig } = body;

      const systemPrompt = `You are a friendly AI receptionist for "${hotelConfig?.name || "The GuestInn"}".
You help guests with room bookings, rates, and queries.
Rules:
- Always use Indian Rupees (₹), never dollars ($)
- Be warm, helpful, and concise
- Respond in the same language the guest uses (Hindi/English/Hinglish)
- For bookings, collect: name, phone, check-in date, check-out date, room preference
- Room types: Standard (₹${hotelConfig?.rates?.standard || 1500}/night), Deluxe (₹${hotelConfig?.rates?.deluxe || 2500}/night), Suite (₹${hotelConfig?.rates?.suite || 4500}/night)
- If guest wants to book, say: "Main aapki details manager ko bhej raha hoon. Confirmation aapke phone par aayega."
- Hotel: ${hotelConfig?.name}, Location: ${hotelConfig?.location || "India"}`;

      const res = await groq.chat.completions.create({
        model: "llama3-8b-8192",
        max_tokens: 300,
        messages: [
          { role: "system", content: systemPrompt },
          ...(chatHistory || []),
        ],
      });

      return Response.json({
        success: true,
        message: res.choices[0]?.message?.content || "Kuch problem aa gayi. Dobara try karo.",
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
