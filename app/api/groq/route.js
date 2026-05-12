import Groq from "groq-sdk";

// Vercel environment variable issue fix karne ke liye renamed key
const groq = new Groq({
  apiKey: process.env.MY_GROQ_API_KEY, 
});

export async function POST(request) {
  try {
    // Sabse pehle body ko ek hi baar parse karein
    const body = await request.json().catch(() => ({}));
    const { imageBase64, type, stats } = body;

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
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                },
              },
              {
                type: "text",
                text: `You are an ID document scanner for an Indian hotel check-in system.
                
Extract information from this ID (Aadhaar, PAN, Passport, or DL). 
Return ONLY a valid JSON object:
{
  "name": "",
  "dob": "",
  "address": "",
  "idNumber": "",
  "idType": "",
  "gender": ""
}
If Aadhaar is detected, provide the idNumber but do not include spaces.
Return ONLY JSON.`,
              },
            ],
          },
        ],
      });

      const content = response.choices[0]?.message?.content || "{}";

      // Robust JSON Parsing
      let extracted = {};
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        extracted = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
      } catch (e) {
        extracted = {
          name: extractField(content, "name"),
          dob: extractField(content, "dob"),
          idNumber: extractField(content, "idNumber"),
          idType: extractField(content, "idType"),
        };
      }

      return Response.json({ success: true, data: extracted });
    }

    if (type === "ai_insight") {
      const today = new Date();
      const dayName = today.toLocaleDateString("en-IN", { weekday: "long" });
      const month = today.toLocaleDateString("en-IN", { month: "long" });

      const insightResponse = await groq.chat.completions.create({
        model: "llama3-8b-8192",
        max_tokens: 150,
        messages: [
          {
            role: "system",
            content: `You are a hotel revenue management AI for an Indian hotel. Give short, actionable insights in Hinglish. Max 2 sentences.`,
          },
          {
            role: "user",
            content: `Hotel stats: ${JSON.stringify(stats || {})}. Today is ${dayName}, ${month}. Give a revenue recommendation.`,
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
