// CRITICAL FIX: force-dynamic prevents build-time execution
export const dynamic = "force-dynamic";

import Groq from "groq-sdk";

function getGroqClient() {
  const apiKey = process.env.MY_GROQ_KEY;
  if (!apiKey) throw new Error("MY_GROQ_KEY is not set in Vercel Environment Variables");
  return new Groq({ apiKey });
}

export async function POST(request) {
  try {
    const body    = await request.json();
    const { imageBase64, type, stats, hotelId } = body;
    const groq    = getGroqClient();

    // ── ID SCAN ──────────────────────────────────────────────
    if (type === "id_scan") {
      if (!imageBase64) return Response.json({ error:"Image required" }, { status:400 });
      const response = await groq.chat.completions.create({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        max_tokens: 600, temperature: 0.1,
        messages: [{
          role: "user",
          content: [
            { type:"image_url", image_url:{ url:`data:image/jpeg;base64,${imageBase64}` } },
            { type:"text", text:`You are an expert OCR for Indian ID documents (Aadhaar, PAN, Passport, DL, Voter ID).
Extract ALL visible text fields. Return ONLY raw JSON, no markdown:
{"name":"","dob":"","address":"","idNumber":"","idType":"","gender":""}
Rules: name=full name, dob=DD/MM/YYYY, idNumber=exact number on card, idType=one of Aadhaar/PAN/Passport/Driving License/Voter ID, gender=M or F. Empty string if not visible. Do NOT invent data.` }
          ]
        }]
      });
      const raw = response.choices[0]?.message?.content?.trim() || "{}";
      let extracted = {};
      try {
        const cleaned = raw.replace(/^```json\s*/i,"").replace(/^```\s*/i,"").replace(/```\s*$/i,"").trim();
        const m = cleaned.match(/\{[\s\S]*\}/);
        if (m) extracted = JSON.parse(m[0]);
      } catch(e) { extracted = { name:"",dob:"",address:"",idNumber:"",idType:"",gender:"" }; }
      const clean = {};
      for (const k of ["name","dob","address","idNumber","idType","gender"])
        clean[k] = typeof extracted[k]==="string" ? extracted[k].trim() : "";
      return Response.json({ success:true, data:clean });
    }

    // ── AI INSIGHT ───────────────────────────────────────────
    if (type === "ai_insight") {
      const dayName = new Date().toLocaleDateString("en-IN",{weekday:"long"});
      const month   = new Date().toLocaleDateString("en-IN",{month:"long"});
      const res = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        max_tokens: 150,
        messages: [
          { role:"system", content:`You are a hotel revenue AI for Indian hotels. Give short actionable tips in Hinglish (Hindi+English). Max 2 sentences. Use ₹ for currency.` },
          { role:"user",   content:`Stats: ${JSON.stringify(stats||{})}. Today: ${dayName}, ${month}. Give revenue insight.` }
        ]
      });
      return Response.json({ success:true, insight: res.choices[0]?.message?.content || "" });
    }

    // ── GUEST CHATBOT ────────────────────────────────────────
    if (type === "chat") {
      const { messages: chatHistory, hotelConfig } = body;
      const systemPrompt = `You are a friendly AI receptionist for "${hotelConfig?.name || "The GuestInn"}" hotel located in ${hotelConfig?.location || "India"}.

Your job: Help guests book rooms, answer questions, collect their details.

RULES:
- Always use ₹ (Indian Rupees), never $
- Respond in same language as guest (Hindi/English/Hinglish)  
- Be warm, friendly, concise (max 4 lines per reply)
- Room types available:
  • Standard Room: ₹${hotelConfig?.rates?.standard || 1500}/night (AC, TV, WiFi, Geyser)
  • Deluxe Room: ₹${hotelConfig?.rates?.deluxe || 2500}/night (AC, TV, WiFi, Mini Bar, Geyser)
  • Suite: ₹${hotelConfig?.rates?.suite || 4500}/night (AC, 55" TV, WiFi, Mini Bar, Jacuzzi, Butler)
- For booking: collect Name, Phone number, Check-in date, Check-out date, Room type
- When guest gives their details say: "✅ Booking request submit ho gayi! [Hotel Name] team aapko [phone] par confirm karega. Shukriya! 🙏"
- Answer location questions: hotel is in ${hotelConfig?.location || "India"}
- If asked about facilities: WiFi, parking, 24/7 reception, room service available`;

      const res = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        max_tokens: 300,
        messages: [
          { role:"system", content:systemPrompt },
          ...(chatHistory || [])
        ]
      });
      return Response.json({
        success: true,
        message: res.choices[0]?.message?.content || "Kuch problem aa gayi. Dobara try karo."
      });
    }

    return Response.json({ error:"Invalid type" }, { status:400 });

  } catch(error) {
    console.error("Groq API Error:", error.message);
    return Response.json(
      { error: error.message },
      { status: error.message.includes("MY_GROQ_KEY") ? 500 : 502 }
    );
  }
}
