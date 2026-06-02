"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Mic, Sparkles } from "lucide-react";

// ── Hotel catalog (mirrors MarketplaceHotels data) ────────────────────────
const HOTEL_CATALOG = [
  {
    id: "hotel-cherry-bhopal",
    name: "Hotel Cherry, Bhopal",
    city: "Bhopal", state: "Madhya Pradesh",
    distance: "1.2 km from Bus Stand",
    rating: 4.6, minPrice: 1200,
    amenities: ["Free Wi-Fi", "Complimentary Breakfast"],
  },
  {
    id: "boutique-stays-jaipur",
    name: "Boutique Stays, Jaipur",
    city: "Jaipur", state: "Rajasthan",
    distance: "2.1 km from City Center",
    rating: 4.7, minPrice: 1150,
    amenities: ["Free Wi-Fi", "Pool Access"],
  },
  {
    id: "hotel-midtown-indore",
    name: "Hotel Midtown, Indore",
    city: "Indore", state: "Madhya Pradesh",
    distance: "900 m from Bus Stand",
    rating: 4.5, minPrice: 1100,
    amenities: ["Free Wi-Fi", "Early Check-in"],
  },
  {
    id: "city-comforts-nagpur",
    name: "City Comforts, Nagpur",
    city: "Nagpur", state: "Maharashtra",
    distance: "1.5 km from Bus Stand",
    rating: 4.4, minPrice: 1000,
    amenities: ["Free Wi-Fi", "Parking"],
  },
];

// System prompt injected into every Groq chat call
const MARKETPLACE_SYSTEM = `You are an AI Hotel Negotiator for The GuestInn Network — India ka smart hotel booking platform.
Friendly Hinglish mein baat karo (Hindi + English mix). Har reply max 3-4 lines.

Available Hotels in Network:
${HOTEL_CATALOG.map(h =>
  `• ${h.name} (${h.city}, ${h.state}) — ₹${h.minPrice}/night min, Rating: ${h.rating}/5, ${h.amenities.join(", ")}, ${h.distance}`
).join("\n")}

Rules:
1. Agar user ne city/area mention kiya hai, SEEDHA wahan ke hotels dikhao — "Kaunsi city?" mat poochho.
2. Price always ₹ mein batao.
3. Har hotel ka mention karo: name, price, rating, ek special feature.
4. Booking ke liye: "View Hotel button click karein" — hotel name ke saath.
5. 0% OTA commission aur AI Rate Lock ka faayda batao.
6. Warm, helpful, actionable rehna.`;

let msgIdCounter = 10;

// ── NegotiatorOrb ─────────────────────────────────────────────────────────
// Props:
//   pendingQuery    — string | null — query from HeroSearchSection
//   forceOpen       — bool          — open panel immediately  
//   onQueryConsumed — fn()          — tell page.js to clear pending query
export default function NegotiatorOrb({ pendingQuery, forceOpen, onQueryConsumed }) {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState("");
  const [thinking, setThinking] = useState(false);
  const [pulse, setPulse]       = useState(true);
  const scrollRef   = useRef(null);
  const consumedRef = useRef(null); // tracks last consumed query to avoid double-fire

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, thinking]);

  // ── KEY FIX: consume pending query from HeroSearchSection ─────
  // When user types in hero search and hits Enter/Dhundo button,
  // page.js sets pendingQuery. We read it here, open the panel,
  // inject it as the first user message, and fire Groq IMMEDIATELY
  // — no generic greeting, no "kaunsi city" question.
  useEffect(() => {
    if (!pendingQuery || pendingQuery === consumedRef.current) return;
    consumedRef.current = pendingQuery;

    setOpen(true);
    setPulse(false);

    const userMsg = {
      id: msgIdCounter++,
      role: "user",
      text: pendingQuery,
      time: "Just now",
    };
    setMessages([userMsg]);
    setThinking(true);

    // Call Groq API via our own backend route
    callGroq([{ role: "user", content: pendingQuery }]).then(reply => {
      setMessages(prev => [...prev, {
        id: msgIdCounter++,
        role: "ai",
        text: reply,
        time: "Now",
      }]);
      setThinking(false);
    });

    if (onQueryConsumed) onQueryConsumed();
  }, [pendingQuery]);

  // Force-open from page.js
  useEffect(() => {
    if (forceOpen) { setOpen(true); setPulse(false); }
  }, [forceOpen]);

  // ── GROQ API CALL via /api/groq ───────────────────────────────
  // Uses MY_GROQ_KEY set in Vercel env — no Anthropic, no hardcoded keys.
  const callGroq = async (conversationHistory) => {
    try {
      const res = await fetch("/api/groq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "chat",
          // Inject marketplace system prompt via hotelConfig
          hotelConfig: {
            name: "The GuestInn Network",
            location: "Pan India",
            rates: { standard: 1100, deluxe: 1500, suite: 2700 },
          },
          // Pass custom system override for marketplace context
          systemOverride: MARKETPLACE_SYSTEM,
          messages: conversationHistory,
        }),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      return data.message || "Kuch issue aa gaya, dobara try karo 🙏";
    } catch (err) {
      console.error("Groq call failed:", err);
      return "Network issue — please dobara try karein. 🙏";
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

    // Full conversation history for context continuity
    const history = [...messages, userMsg].map(m => ({
      role: m.role === "ai" ? "assistant" : "user",
      content: m.text,
    }));

    const reply = await callGroq(history);
    setMessages(prev => [...prev, {
      id: msgIdCounter++,
      role: "ai",
      text: reply,
      time: "Now",
    }]);
    setThinking(false);
  }, [input, thinking, messages]);

  // Manual open (from floating orb tap) — shows greeting only if fresh session
  const handleManualOpen = () => {
    setOpen(o => {
      const next = !o;
      if (next && messages.length === 0) {
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
    "Jaipur 4-star pool hotel",
    "Indore couple-friendly hotel",
    "Nagpur bus stand ke paas",
  ];

  return (
    <>
      {/* ── PANEL ── */}
      <div style={{
        position: "fixed", bottom: 20,
        right: open ? 20 : -420,
        width: 380, maxHeight: "calc(100vh - 100px)",
        zIndex: 999, display: "flex", flexDirection: "column",
        background: "linear-gradient(180deg, rgba(8,12,22,0.98) 0%, rgba(4,6,12,0.99) 100%)",
        border: "1px solid rgba(212,175,55,0.25)", borderRadius: 24,
        boxShadow: "0 24px 80px rgba(0,0,0,0.7), 0 0 40px rgba(212,175,55,0.08)",
        transition: "right 0.4s cubic-bezier(0.4,0,0.2,1)",
        overflow: "hidden",
      }}>

        {/* Header */}
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
              <p style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>AI Negotiator</p>
              <p style={{ fontSize: 10, color: "#22c55e", fontWeight: 600 }}>⊙ Always Active — Getting Best Rates</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} style={{
            width: 32, height: 32, borderRadius: 10,
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          }}>
            <X size={14} style={{ color: "rgba(255,255,255,0.5)" }}/>
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} style={{
          flex: 1, overflowY: "auto", padding: "16px 16px 8px",
          scrollbarWidth: "none",
        }}>
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

          {/* Thinking dots */}
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
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "14px 14px 14px 4px", padding: "12px 16px",
                display: "flex", alignItems: "center", gap: 4,
              }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{
                    width: 6, height: 6, borderRadius: "50%", background: "#008cff",
                    animation: `thinkDot 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }}/>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick replies — only on fresh session */}
        {messages.length <= 1 && !thinking && (
          <div style={{ padding: "0 16px 8px", display: "flex", gap: 6, flexWrap: "wrap" }}>
            {QUICK_REPLIES.map(qr => (
              <button key={qr} onClick={() => sendMessage(qr)} style={{
                fontSize: 10, fontWeight: 600, color: "#D4AF37",
                background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)",
                borderRadius: 8, padding: "5px 10px", cursor: "pointer",
              }}>
                {qr}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={{
          padding: "10px 14px 16px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex", gap: 8, alignItems: "flex-end", flexShrink: 0,
        }}>
          <div style={{
            flex: 1, background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 14, padding: "10px 14px",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <Mic size={14} style={{ color: "rgba(255,255,255,0.2)", flexShrink: 0 }}/>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
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
              background: input.trim() && !thinking ? "linear-gradient(135deg, #b8960c, #D4AF37)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${input.trim() && !thinking ? "rgba(212,175,55,0.5)" : "rgba(255,255,255,0.08)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: input.trim() && !thinking ? "pointer" : "default",
              transition: "all 0.2s",
            }}
          >
            <Send size={14} style={{ color: input.trim() && !thinking ? "#000" : "rgba(255,255,255,0.2)" }}/>
          </button>
        </div>
      </div>

      {/* ── FLOATING ORB ── */}
      <div style={{
        position: "fixed", bottom: 20,
        right: open ? 416 : 20, zIndex: 1000,
        transition: "right 0.4s cubic-bezier(0.4,0,0.2,1)",
      }}>
        <button onClick={handleManualOpen} style={{
          width: 68, height: 68, borderRadius: "50%",
          background: "radial-gradient(circle at 35% 35%, rgba(0,160,255,0.9) 0%, rgba(0,80,200,0.7) 50%, rgba(0,30,100,0.8) 100%)",
          border: "2px solid rgba(0,140,255,0.6)",
          boxShadow: "0 8px 32px rgba(0,140,255,0.5), 0 0 60px rgba(0,140,255,0.2)",
          cursor: "pointer", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: 2, position: "relative", transition: "transform 0.2s",
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.08)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          {pulse && [1,2,3].map(i => (
            <div key={i} style={{
              position: "absolute", inset: -(i * 10), borderRadius: "50%",
              border: `1px solid rgba(0,140,255,${0.3 / i})`,
              animation: `orbRing 2s ease-out ${i * 0.4}s infinite`,
            }}/>
          ))}
          <Sparkles size={22} style={{ color: "#fff" }}/>
          <span style={{ fontSize: 8, fontWeight: 800, color: "rgba(255,255,255,0.8)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
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
        @keyframes thinkDot { 0%,80%,100%{transform:scale(0.6);opacity:0.4} 40%{transform:scale(1.2);opacity:1} }
        @keyframes orbRing { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(1.5);opacity:0} }
        @keyframes voicePing { 0%{transform:scale(1);opacity:0.5} 100%{transform:scale(1.8);opacity:0} }
      `}</style>
    </>
  );
}
