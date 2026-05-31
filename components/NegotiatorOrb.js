"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Mic, Sparkles } from "lucide-react";

// ── Hotel data (mirrors MarketplaceHotels) ────────────────────────────────
const HOTEL_CATALOG = [
  {
    id: "hotel-cherry-bhopal",
    name: "Hotel Cherry, Bhopal",
    city: "Bhopal", state: "Madhya Pradesh",
    distance: "1.2 km from Bus Stand",
    rating: 4.6,
    minPrice: 1200,
    amenities: ["Free Wi-Fi", "Complimentary Breakfast"],
    tags: ["budget", "business", "bus stand"],
  },
  {
    id: "boutique-stays-jaipur",
    name: "Boutique Stays, Jaipur",
    city: "Jaipur", state: "Rajasthan",
    distance: "2.1 km from City Center",
    rating: 4.7,
    minPrice: 1150,
    amenities: ["Free Wi-Fi", "Pool Access"],
    tags: ["boutique", "pool", "city center", "4-star"],
  },
  {
    id: "hotel-midtown-indore",
    name: "Hotel Midtown, Indore",
    city: "Indore", state: "Madhya Pradesh",
    distance: "900 m from Bus Stand",
    rating: 4.5,
    minPrice: 1100,
    amenities: ["Free Wi-Fi", "Early Check-in"],
    tags: ["budget", "couple", "sarafa", "early check-in"],
  },
  {
    id: "city-comforts-nagpur",
    name: "City Comforts, Nagpur",
    city: "Nagpur", state: "Maharashtra",
    distance: "1.5 km from Bus Stand",
    rating: 4.4,
    minPrice: 1000,
    amenities: ["Free Wi-Fi", "Parking"],
    tags: ["budget", "parking", "bus stand"],
  },
];

// System prompt for the AI Negotiator
const SYSTEM_PROMPT = `You are an AI Hotel Negotiator for The GuestInn Network — India's smart hotel booking platform.
You speak in friendly Hinglish (mix of Hindi and English). Keep responses concise (2-4 sentences max).
You help guests find hotels from our network.

Current Hotel Catalog:
${HOTEL_CATALOG.map(h => `- ${h.name} (${h.city}, ${h.state}) — ₹${h.minPrice}/night, Rating: ${h.rating}, ${h.amenities.join(", ")}, ${h.distance}`).join("\n")}

Rules:
1. When user mentions a city or area, immediately show matching hotels from catalog with prices.
2. NEVER ask "Kaunsi city prefer karoge?" if the city is already mentioned in their query.
3. If no exact match in catalog, suggest nearest available option and mention more properties are available.
4. Always mention AI Rate Lock and 0% commission advantage.
5. For booking, say: "View Hotel button pe click karein" with the hotel name.
6. Keep it warm, helpful, and actionable.
7. Use ₹ for prices, not Rs or INR.`;

let msgIdCounter = 10;

// ── NegotiatorOrb ─────────────────────────────────────────────────────────
// Props:
//   pendingQuery   — string | null  — query from HeroSearchSection
//   forceOpen      — bool           — open panel immediately
//   onQueryConsumed — fn()          — tells page.js to clear pending query
export default function NegotiatorOrb({ pendingQuery, forceOpen, onQueryConsumed }) {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState("");
  const [thinking, setThinking] = useState(false);
  const [pulse, setPulse]       = useState(true);
  const scrollRef  = useRef(null);
  const consumedRef = useRef(null); // tracks which query we've already processed

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, thinking]);

  // ── CORE: consume pending query from HeroSearchSection ────────
  // This fires when user submits a search from the hero input.
  // We open the panel and IMMEDIATELY treat the query as the first message —
  // no generic greeting, no "kaunsi city" question.
  useEffect(() => {
    if (!pendingQuery || pendingQuery === consumedRef.current) return;
    consumedRef.current = pendingQuery;

    // Open the panel
    setOpen(true);
    setPulse(false);

    // Seed conversation: show user's query + trigger AI response
    const userMsg = {
      id: msgIdCounter++,
      role: "user",
      text: pendingQuery,
      time: "Just now",
    };
    setMessages([userMsg]);
    setThinking(true);

    // Fire AI with the query immediately
    callAI([{ role: "user", content: pendingQuery }]).then(aiReply => {
      setMessages(prev => [...prev, {
        id: msgIdCounter++,
        role: "ai",
        text: aiReply,
        time: "Now",
      }]);
      setThinking(false);
    });

    // Tell page.js we've consumed it
    if (onQueryConsumed) onQueryConsumed();
  }, [pendingQuery]);

  // Force-open from page.js
  useEffect(() => {
    if (forceOpen) {
      setOpen(true);
      setPulse(false);
    }
  }, [forceOpen]);

  // ── AI API CALL ───────────────────────────────────────────────
  const callAI = async (conversationHistory) => {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: conversationHistory,
        }),
      });
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();
      const text = data.content
        ?.filter(b => b.type === "text")
        .map(b => b.text)
        .join("") || "Kuch technical issue aa gaya. Please dobara try karein.";
      return text;
    } catch (err) {
      console.error("AI call failed:", err);
      return "Network issue hai — please dobara try karein. 🙏";
    }
  };

  // ── SEND MESSAGE ──────────────────────────────────────────────
  const sendMessage = useCallback(async (text) => {
    const userText = (text || input).trim();
    if (!userText || thinking) return;
    setInput("");

    const userMsg = { id: msgIdCounter++, role: "user", text: userText, time: "Now" };
    setMessages(prev => [...prev, userMsg]);
    setThinking(true);

    // Build full history for context
    const history = [...messages, userMsg].map(m => ({
      role: m.role === "ai" ? "assistant" : "user",
      content: m.text,
    }));

    const aiReply = await callAI(history);
    setMessages(prev => [...prev, {
      id: msgIdCounter++,
      role: "ai",
      text: aiReply,
      time: "Now",
    }]);
    setThinking(false);
  }, [input, thinking, messages]);

  // ── INITIAL GREETING (only when opened manually, no pending query) ──
  const handleManualOpen = () => {
    setOpen(o => {
      const next = !o;
      if (next && messages.length === 0) {
        // Show greeting only when opened fresh with no existing query
        setMessages([{
          id: msgIdCounter++,
          role: "ai",
          text: "Namaste! 🏨 Main aapka AI Hotel Negotiator hoon. Kahan jaana hai aur budget kya hai? Best deal dhundh dunga!",
          time: "Just now",
        }]);
      }
      return next;
    });
    setPulse(false);
  };

  const QUICK_REPLIES = [
    "Bhopal budget stay ₹1500",
    "Jaipur 4-star hotel pool",
    "Indore couple-friendly hotel",
    "Nagpur bus stand ke paas",
  ];

  const isFirstMessage = messages.length <= 1;

  return (
    <>
      {/* ── PANEL ── */}
      <div style={{
        position: "fixed",
        bottom: 20,
        right: open ? 20 : -420,
        width: 380,
        maxHeight: "calc(100vh - 100px)",
        zIndex: 999,
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(180deg, rgba(8,12,22,0.98) 0%, rgba(4,6,12,0.99) 100%)",
        border: "1px solid rgba(212,175,55,0.25)",
        borderRadius: 24,
        boxShadow: "0 24px 80px rgba(0,0,0,0.7), 0 0 40px rgba(212,175,55,0.08)",
        transition: "right 0.4s cubic-bezier(0.4,0,0.2,1)",
        overflow: "hidden",
      }}>

        {/* Panel header */}
        <div style={{
          padding: "16px 20px",
          background: "rgba(212,175,55,0.05)",
          borderBottom: "1px solid rgba(212,175,55,0.12)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: "50%",
              background: "radial-gradient(circle at 35% 35%, rgba(0,140,255,0.6) 0%, rgba(0,80,200,0.3) 50%, rgba(0,40,120,0.2) 100%)",
              border: "1.5px solid rgba(0,140,255,0.5)",
              boxShadow: "0 0 16px rgba(0,140,255,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              position: "relative", flexShrink: 0,
            }}>
              <Sparkles size={16} style={{ color: "#fff" }}/>
              <div style={{
                position: "absolute", inset: -3, borderRadius: "50%",
                border: "1px solid rgba(0,140,255,0.2)",
                animation: "voicePing 2s ease-out infinite",
              }}/>
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}>
                AI Negotiator
              </p>
              <p style={{ fontSize: 10, color: "#22c55e", fontWeight: 600 }}>
                ⊙ Always Active — Getting Best Rates
              </p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            style={{
              width: 32, height: 32, borderRadius: 10,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={14} style={{ color: "rgba(255,255,255,0.5)" }}/>
          </button>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          style={{
            flex: 1, overflowY: "auto", padding: "16px 16px 8px",
            scrollbarWidth: "none",
          }}
        >
          {messages.map(msg => (
            <div key={msg.id} style={{
              display: "flex",
              flexDirection: msg.role === "user" ? "row-reverse" : "row",
              gap: 8, marginBottom: 12,
            }}>
              {msg.role === "ai" && (
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                  background: "radial-gradient(circle, rgba(0,140,255,0.5), rgba(0,60,150,0.3))",
                  border: "1px solid rgba(0,140,255,0.4)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Sparkles size={12} style={{ color: "#60a5fa" }}/>
                </div>
              )}
              <div style={{
                maxWidth: "75%",
                background: msg.role === "user"
                  ? "linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.1))"
                  : "rgba(255,255,255,0.04)",
                border: `1px solid ${msg.role === "user" ? "rgba(212,175,55,0.3)" : "rgba(255,255,255,0.08)"}`,
                borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                padding: "10px 14px",
              }}>
                <p style={{
                  fontSize: 12, lineHeight: 1.6, whiteSpace: "pre-wrap",
                  color: msg.role === "user" ? "#D4AF37" : "rgba(255,255,255,0.82)",
                }}>
                  {msg.text}
                </p>
                <p style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", marginTop: 4 }}>
                  {msg.time}
                </p>
              </div>
            </div>
          ))}

          {/* Thinking indicator */}
          {thinking && (
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                background: "radial-gradient(circle, rgba(0,140,255,0.5), rgba(0,60,150,0.3))",
                border: "1px solid rgba(0,140,255,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Sparkles size={12} style={{ color: "#60a5fa" }}/>
              </div>
              <div style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "14px 14px 14px 4px",
                padding: "12px 16px",
                display: "flex", alignItems: "center", gap: 4,
              }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: "#008cff",
                    animation: `thinkDot 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }}/>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick replies — shown on fresh open */}
        {isFirstMessage && !thinking && (
          <div style={{
            padding: "0 16px 8px",
            display: "flex", gap: 6, flexWrap: "wrap",
          }}>
            {QUICK_REPLIES.map(qr => (
              <button
                key={qr}
                onClick={() => sendMessage(qr)}
                style={{
                  fontSize: 10, fontWeight: 600, color: "#D4AF37",
                  background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)",
                  borderRadius: 8, padding: "5px 10px", cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(212,175,55,0.15)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(212,175,55,0.08)"; }}
              >
                {qr}
              </button>
            ))}
          </div>
        )}

        {/* Input area */}
        <div style={{
          padding: "10px 14px 16px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex", gap: 8, alignItems: "flex-end",
          flexShrink: 0,
        }}>
          <div style={{
            flex: 1,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 14, padding: "10px 14px",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <Mic size={14} style={{ color: "rgba(255,255,255,0.2)", flexShrink: 0 }}/>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Hotel dhundo ya poochho..."
              style={{
                flex: 1, background: "none", border: "none", outline: "none",
                fontSize: 12, color: "#fff", caretColor: "#D4AF37",
              }}
            />
          </div>

          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || thinking}
            style={{
              width: 40, height: 40, borderRadius: 12, flexShrink: 0,
              background: input.trim() && !thinking
                ? "linear-gradient(135deg, #b8960c, #D4AF37)"
                : "rgba(255,255,255,0.04)",
              border: `1px solid ${input.trim() && !thinking ? "rgba(212,175,55,0.5)" : "rgba(255,255,255,0.08)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: input.trim() && !thinking ? "pointer" : "default",
              transition: "all 0.2s",
              boxShadow: input.trim() && !thinking ? "0 4px 16px rgba(212,175,55,0.3)" : "none",
            }}
          >
            <Send size={14} style={{ color: input.trim() && !thinking ? "#000" : "rgba(255,255,255,0.2)" }}/>
          </button>
        </div>
      </div>

      {/* ── FLOATING ORB TRIGGER ── */}
      <div style={{
        position: "fixed",
        bottom: 20,
        right: open ? 416 : 20,
        zIndex: 1000,
        transition: "right 0.4s cubic-bezier(0.4,0,0.2,1)",
      }}>
        <button
          onClick={handleManualOpen}
          style={{
            width: 68, height: 68, borderRadius: "50%",
            background: "radial-gradient(circle at 35% 35%, rgba(0,160,255,0.9) 0%, rgba(0,80,200,0.7) 50%, rgba(0,30,100,0.8) 100%)",
            border: "2px solid rgba(0,140,255,0.6)",
            boxShadow: "0 8px 32px rgba(0,140,255,0.5), 0 0 60px rgba(0,140,255,0.2)",
            cursor: "pointer",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: 2, position: "relative",
            transition: "transform 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.08)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          {pulse && [1,2,3].map(i => (
            <div key={i} style={{
              position: "absolute", inset: -(i * 10),
              borderRadius: "50%",
              border: `1px solid rgba(0,140,255,${0.3 / i})`,
              animation: `orbRing 2s ease-out ${i * 0.4}s infinite`,
            }}/>
          ))}
          <Sparkles size={22} style={{ color: "#fff" }}/>
          <span style={{
            fontSize: 8, fontWeight: 800, color: "rgba(255,255,255,0.8)",
            letterSpacing: "0.08em", textTransform: "uppercase",
          }}>
            AI
          </span>
        </button>

        {!open && (
          <div style={{
            position: "absolute", bottom: -22, left: "50%", transform: "translateX(-50%)",
            fontSize: 8, fontWeight: 700, color: "rgba(0,140,255,0.8)",
            letterSpacing: "0.1em", textTransform: "uppercase", whiteSpace: "nowrap",
          }}>
            Tap to Speak
          </div>
        )}
      </div>

      <style>{`
        @keyframes thinkDot {
          0%,80%,100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1.2); opacity: 1; }
        }
        @keyframes orbRing {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes voicePing {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>
    </>
  );
}
