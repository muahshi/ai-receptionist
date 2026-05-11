import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request) {
  try {
    const { imageBase64, type } = await request.json();

    if (!imageBase64) {
      return Response.json({ error: "Image data required" }, { status: 400 });
    }

    // ─── ID DOCUMENT EXTRACTION ───────────────────────────────────────────────
    if (type === "id_scan") {
      const response = await groq.chat.completions.create({
        model: "llava-v1.5-7b-4096-preview", // LLaVA for vision
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                },
              },
              {
                type: "text",
                text: `You are an ID document scanner for an Indian hotel check-in system.
                
Extract the following information from this ID document (Aadhaar Card, PAN Card, Passport, or Driving License):

1. Full Name
2. Date of Birth (in DD/MM/YYYY format)
3. Address (full address)
4. ID Number (Aadhaar number, PAN number, Passport number, or DL number)
5. Document Type (Aadhaar/PAN/Passport/Driving License)
6. Gender (if visible)

Return ONLY a valid JSON object with these exact keys:
{
  "name": "",
  "dob": "",
  "address": "",
  "idNumber": "",
  "idType": "",
  "gender": ""
}

If a field is not visible or readable, use an empty string.
Return ONLY the JSON, no other text.`,
              },
            ],
          },
        ],
      });

      const content = response.choices[0]?.message?.content || "{}";

      // Clean and parse JSON
      let extracted = {};
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          extracted = JSON.parse(jsonMatch[0]);
        }
      } catch {
        // Fallback: try to extract manually
        extracted = {
          name: extractField(content, "name"),
          dob: extractField(content, "dob"),
          address: extractField(content, "address"),
          idNumber: extractField(content, "idNumber"),
          idType: extractField(content, "idType"),
          gender: extractField(content, "gender"),
        };
      }

      return Response.json({ success: true, data: extracted });
    }

    // ─── AI INSIGHT GENERATION ─────────────────────────────────────────────────
    if (type === "ai_insight") {
      const { stats } = await request.json().catch(() => ({ stats: {} }));

      const today = new Date();
      const dayName = today.toLocaleDateString("en-IN", { weekday: "long" });
      const month = today.toLocaleDateString("en-IN", { month: "long" });

      const insightResponse = await groq.chat.completions.create({
        model: "llama3-8b-8192",
        max_tokens: 150,
        messages: [
          {
            role: "system",
            content: `You are a hotel revenue management AI for an Indian hotel. 
Give short, actionable insights in Hinglish (mix of Hindi and English). 
Keep it under 2 sentences. Be specific and helpful.`,
          },
          {
            role: "user",
            content: `Hotel stats: ${JSON.stringify(stats)}. Today is ${dayName}, ${month}.
Give a revenue insight or recommendation in Hinglish.`,
          },
        ],
      });

      return Response.json({
        success: true,
        insight: insightResponse.choices[0]?.message?.content || "",
      });
    }

    return Response.json({ error: "Invalid request type" }, { status: 400 });
  } catch (error) {
    console.error("Groq API Error:", error);
    return Response.json(
      { error: "AI processing failed", details: error.message },
      { status: 500 }
    );
  }
}

function extractField(text, field) {
  const regex = new RegExp(`"${field}"\\s*:\\s*"([^"]*)"`, "i");
  const match = text.match(regex);
  return match ? match[1] : "";
}
