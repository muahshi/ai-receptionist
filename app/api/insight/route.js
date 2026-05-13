import Groq from "groq-sdk";

// ─── KEY FIX: Using MY_GROQ_KEY ───────────────────────────────────────────────
const groq = new Groq({ apiKey: process.env.MY_GROQ_KEY });

export async function POST(request) {
  try {
    const body = await request.json();
    const { type, stats } = body;

    if (!process.env.MY_GROQ_KEY) {
      return Response.json(
        { error: "MY_GROQ_KEY not set" },
        { status: 500 }
      );
    }

    if (type === "ai_insight") {
      const today = new Date();
      const dayName = today.toLocaleDateString("en-IN", { weekday: "long" });

      const response = await groq.chat.completions.create({
        model: "llama3-8b-8192",
        max_tokens: 120,
        messages: [
          {
            role: "system",
            content: `You are a hotel revenue AI for Indian hotels. Give short actionable tips in Hinglish (Hindi + English mix). Max 1-2 sentences. Be specific with numbers. Positive and motivating tone.`,
          },
          {
            role: "user",
            content: `Today is ${dayName}. Stats: ${JSON.stringify(stats || {})}. Give revenue insight.`,
          },
        ],
      });

      return Response.json({
        success: true,
        insight: response.choices[0]?.message?.content || "",
      });
    }

    return Response.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
