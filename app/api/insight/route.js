export const dynamic = "force-dynamic";

import Groq from "groq-sdk";

function getGroqClient() {
  const apiKey = process.env.MY_GROQ_KEY;
  if (!apiKey) throw new Error("MY_GROQ_KEY not set");
  return new Groq({ apiKey });
}

export async function POST(request) {
  try {
    const { type, stats } = await request.json();
    const groq = getGroqClient();

    if (type === "ai_insight") {
      const dayName = new Date().toLocaleDateString("en-IN", { weekday: "long" });
      const res = await groq.chat.completions.create({
        model: "llama3-8b-8192",
        max_tokens: 120,
        messages: [
          {
            role: "system",
            content: "Hotel revenue AI. Short Hinglish tips. Use ₹ not $. Max 2 sentences.",
          },
          {
            role: "user",
            content: `Today: ${dayName}. Stats: ${JSON.stringify(stats || {})}. Give insight.`,
          },
        ],
      });
      return Response.json({ success: true, insight: res.choices[0]?.message?.content || "" });
    }

    return Response.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
