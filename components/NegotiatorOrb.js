"use client";
/**
 * components/NegotiatorOrb.js — The GuestInn Network
 * ═══════════════════════════════════════════════════════════════
 * Floating AI Negotiator Orb.
 *
 * Syncs with:
 *  • selectedRoom (from parent booking page)
 *  • roomType (standard/deluxe/suite)
 *  • checkIn / checkOut dates
 *  • hotel's min_floor_price (from hotelConfig prop)
 *
 * On negotiation:
 *  1. Validates requested rate >= hotel.minFloorPrice
 *  2. Checks discount <= 30% of base rate
 *  3. If approved → fires onRateLocked(finalRate, token)
 *  4. Plays Web Audio confirmation tone
 *
 * Props:
 *  hotelConfig    { id, name, standardRate, deluxeRate, suiteRate, minFloorPrice }
 *  selectedRoom   { id, number, type, baseRate, floor }
 *  roomType       "standard" | "deluxe" | "suite"
 *  checkIn        "YYYY-MM-DD"
 *  checkOut       "YYYY-MM-DD"
 *  nights         number
 *  onRateLocked   (finalRate, token, message) => void
 *  onClose        () => void
 * ═══════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Zap, Send, ChevronDown, ChevronUp } from "lucide-react";

// ── Web Audio tone ────────────────────────────────────────────
function playTone(type = "success") {
  if (typeof window === "undefined") return;
  try {
    const ctx    = new (window.AudioContext || window.webkitAudioContext)();
    const notes  = type === "success"
      ? [523.25, 659.25, 783.99, 1046.5]
      : type === "reject"
      ? [440, 392, 330]
      : [659.25, 783.99];
    notes.forEach((freq, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type   = type === "success" ? "sine" : "triangle";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0,         ctx.currentTime + i*0.1);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + i*0.1 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i*0.1 + 0.35);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i*0.1);
      osc.stop(ctx.currentTime + i*0.1 + 0.4);
    });
    setTimeout(() => ctx.state !== "closed" && ctx.close(), 2500);
  } catch {}
}

// ── Detect negotiation intent in text ────────────────────────
function detectNegotiation(text) {
  const numMatch  = text.replace(/,/g,"").match(/(\d{3,6})/);
  const hasIntent = /(₹|discount|kam|less|sasta|negotiate|mein\s*milega|kar\s*do|dedo|reduce|concession)/i.test(text);
  return {
    isNegotiation: hasIntent || !!numMatch,
    requestedRate: numMatch ? parseInt(numMatch[1]) : null,
  };
}

// ── Typing indicator ─────────────────────────────────────────
function TypingDots({ color = "#D4AF37" }) {
  return (
    <div style={{ display:"flex", gap:4, alignItems:"center", padding:"4px 2px" }}>
      {[0,1,2].map(i => (
        <div key={i} style={{
          width:6, height:6, borderRadius:"50%", background:color,
          animation:"dotBounce 1.2s infinite",
          animationDelay:`${i*0.2}s`,
          opacity:0.7,
        }} />
      ))}
    </div>
  );
}

// ── Message bubble ────────────────────────────────────────────
function Bubble({ msg }) {
  const isUser  = msg.role === "user";
  const isLock  = msg.rateLocked;
  const bg      = isUser
    ? "linear-gradient(135deg,#91711e,#D4AF37)"
    : isLock
    ? "rgba(34,197,94,0.1)"
    : "rgba(255,255,255,0.05)";
  const border  = isUser ? "none"
    : isLock ? "1px solid rgba(34,197,94,0.3)"
    : "1px solid rgba(255,255,255,0.07)";

  return (
    <div style={{
      display:"flex", justifyContent:isUser?"flex-end":"flex-start",
      animation:"fadeUp 0.2s ease",
    }}>
      <div style={{
        maxWidth:"88%", padding:"9px 12px",
        borderRadius:isUser?"13px 13px 3px 13px":"13px 13px 13px 3px",
        background:bg, border, fontSize:12, lineHeight:1.55,
        color:isUser?"#000":"rgba(255,255,255,0.85)",
        fontWeight:isUser?700:400,
      }}>
        {msg.content.split("\n").map((l,i,arr) => (
          <span key={i}>{l}{i<arr.length-1&&<br/>}</span>
        ))}
        {isLock && msg.token && (
          <div style={{ marginTop:7, padding:"5px 8px", borderRadius:7, background:"rgba(34,197,94,0.12)", border:"1px solid rgba(34,197,94,0.2)" }}>
            <p style={{ fontSize:9, color:"#22c55e", fontFamily:"monospace" }}>
              🔒 Rate Lock: {msg.token}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
export default function NegotiatorOrb({
  hotelConfig    = null,
  selectedRoom   = null,
  roomType       = "standard",
  checkIn        = "",
  checkOut       = "",
  nights         = 0,
  onRateLocked   = null,
  onClose        = null,
}) {
  const [open,          setOpen]         = useState(false);
  const [minimized,     setMinimized]    = useState(false);
  const [messages,      setMessages]     = useState([]);
  const [input,         setInput]        = useState("");
  const [loading,       setLoading]      = useState(false);
  const [rateLocked,    setRateLocked]   = useState(false);
  const [lockedRate,    setLockedRate]   = useState(null);
  const [lockedToken,   setLockedToken]  = useState(null);
  const [orbPulse,      setOrbPulse]     = useState(false);
  const [contextSummary,setContextSummary] = useState("");
  const endRef  = useRef(null);

  // Derived values
  const activeRoomType = selectedRoom?.type || roomType || "standard";
  const baseRate = (() => {
    if (selectedRoom?.baseRate) return selectedRoom.baseRate;
    if (!hotelConfig) return 1500;
    if (activeRoomType === "suite")  return hotelConfig.suiteRate  || 3800;
    if (activeRoomType === "deluxe") return hotelConfig.deluxeRate || 2000;
    return hotelConfig.standardRate || 1200;
  })();
  const currentRate = lockedRate || baseRate;
  const totalAmount = currentRate * (nights || 0);

  // Build context summary string
  useEffect(() => {
    if (!hotelConfig) return;
    const parts = [];
    if (selectedRoom) parts.push(`Room ${selectedRoom.number} (Floor ${selectedRoom.floor})`);
    else parts.push(`${activeRoomType.charAt(0).toUpperCase()+activeRoomType.slice(1)} Room`);
    if (checkIn)  parts.push(`Check-in: ${new Date(checkIn).toLocaleDateString("en-IN",{day:"2-digit",month:"short"})}`);
    if (checkOut) parts.push(`${nights} raat`);
    parts.push(`₹${currentRate.toLocaleString("en-IN")}/raat`);
    setContextSummary(parts.join(" · "));
  }, [selectedRoom, activeRoomType, checkIn, checkOut, nights, currentRate, hotelConfig]);

  // Welcome message when opened first time
  useEffect(() => {
    if (open && messages.length === 0 && hotelConfig) {
      setMessages([{
        role:    "assistant",
        content: `Namaste! 🙏 Main aapka AI Rate Negotiator hoon.\n\nMujhe batao — kya rate chahiye?\n\nMerely paas ${hotelConfig.name} ki poori pricing authority hai.\n\nBas type karo: "₹1200 mein milega?" 💬`,
      }]);
    }
  }, [open, hotelConfig]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages, loading]);

  // Pulse orb when context changes
  useEffect(() => {
    if (selectedRoom || (checkIn && checkOut)) {
      setOrbPulse(true);
      const t = setTimeout(() => setOrbPulse(false), 1800);
      return () => clearTimeout(t);
    }
  }, [selectedRoom, checkIn, checkOut, roomType]);

  // ── Send message / negotiate ─────────────────────────────
  const send = useCallback(async (overrideText) => {
    const text = (overrideText || input).trim();
    if (!text || loading) return;
    if (!overrideText) setInput("");

    const newMsgs = [...messages, { role:"user", content:text }];
    setMessages(newMsgs);
    setLoading(true);

    const { isNegotiation, requestedRate } = detectNegotiation(text);

    // ── NEGOTIATE ──
    if (isNegotiation && requestedRate && hotelConfig) {
      try {
        const res = await fetch("/api/groq", {
          method:  "POST",
          headers: { "Content-Type":"application/json" },
          body: JSON.stringify({
            type:        "negotiate",
            hotelId:     hotelConfig.id,
            requestedRate,
            roomType:    activeRoomType,
            hotelConfig: {
              name:          hotelConfig.name,
              location:      hotelConfig.location    || "",
              standardRate:  hotelConfig.standardRate|| 1200,
              deluxeRate:    hotelConfig.deluxeRate   || 2000,
              suiteRate:     hotelConfig.suiteRate    || 3800,
              minFloorPrice: hotelConfig.minFloorPrice|| 800,
            },
            bookingContext: {
              checkIn, checkOut, nights,
              roomType:     activeRoomType,
              selectedRoom: selectedRoom
                ? { id:selectedRoom.id, number:selectedRoom.number }
                : null,
            },
          }),
        });
        const data = await res.json();
        if (data.success) {
          const approved   = data.approved;
          const finalRate  = data.finalRate;
          const token      = data.rateLockToken;
          const aiMsg      = data.message || (approved
            ? `✅ ₹${finalRate.toLocaleString("en-IN")}/raat lock ho gayi! Mubarak! 🎉`
            : `Maafi, ₹${requestedRate} nahi ho sakta. ₹${finalRate?.toLocaleString("en-IN")}/raat best offer hai! 🙏`
          );

          setMessages(p => [...p, {
            role:        "assistant",
            content:     aiMsg,
            rateLocked:  approved,
            token:       approved ? token : null,
            approved,
            finalRate,
          }]);

          if (approved) {
            setRateLocked(true);
            setLockedRate(finalRate);
            setLockedToken(token);
            playTone("success");
            if (onRateLocked) onRateLocked(finalRate, token, aiMsg);
          } else {
            playTone("reject");
          }
        } else {
          throw new Error(data.error || "Negotiate API failed");
        }
      } catch (e) {
        setMessages(p => [...p, { role:"assistant", content:`Sorry, thodi problem aayi. Dobara try karo 🙏\n(${e.message})` }]);
      }
      setLoading(false);
      return;
    }

    // ── GENERAL CHAT ──
    try {
      const ctxBlock = contextSummary
        ? `\n\n[CURRENT CONTEXT: ${contextSummary}${rateLocked ? ` · RATE LOCKED: ₹${lockedRate}/raat · Token: ${lockedToken}` : ""}]`
        : "";
      const res = await fetch("/api/groq", {
        method:  "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({
          type: "chat",
          hotelConfig,
          messages: [
            ...newMsgs.slice(0,-1).map(m => ({ role:m.role, content:m.content })),
            { role:"user", content:text + ctxBlock },
          ],
        }),
      });
      const data = await res.json();
      setMessages(p => [...p, { role:"assistant", content:data.message || "Dobara try karo 🙏" }]);
    } catch {
      setMessages(p => [...p, { role:"assistant", content:"Connection problem. Dobara try karo 🙏" }]);
    }
    setLoading(false);
  }, [
    input, loading, messages, hotelConfig, activeRoomType,
    selectedRoom, checkIn, checkOut, nights,
    contextSummary, rateLocked, lockedRate, lockedToken, onRateLocked,
  ]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const quickChips = [
    `₹${Math.round(baseRate*0.85)} mein milega?`,
    "Best rate kya hai?",
    "Discount available?",
    "Weekend rate?",
    "Long stay offer?",
  ];

  // ── ORB BUTTON ───────────────────────────────────────────
  if (!open) return (
    <>
      <style>{`
        @keyframes orbFloat  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes orbPulse  { 0%,100%{box-shadow:0 0 0 0 rgba(212,175,55,0.5)} 50%{box-shadow:0 0 0 16px rgba(212,175,55,0)} }
        @keyframes lockPulse { 0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0.5)} 50%{box-shadow:0 0 0 14px rgba(34,197,94,0)} }
      `}</style>
      <button
        onClick={() => setOpen(true)}
        title="AI Rate Negotiator"
        style={{
          position:     "fixed",
          bottom:       80,
          right:        18,
          zIndex:       60,
          width:        54,
          height:       54,
          borderRadius: "50%",
          border:       rateLocked ? "2px solid #22c55e" : "2px solid rgba(212,175,55,0.6)",
          background:   rateLocked
            ? "linear-gradient(135deg,#052210,#0a3a1a)"
            : "linear-gradient(135deg,#1a1400,#2d2200)",
          cursor:       "pointer",
          display:      "flex",
          alignItems:   "center",
          justifyContent:"center",
          animation:    `orbFloat 3s ease-in-out infinite${orbPulse ? `, ${rateLocked?"lockPulse":"orbPulse"} 0.8s ease-in-out 2` : ""}`,
          boxShadow:    rateLocked
            ? "0 4px 20px rgba(34,197,94,0.4)"
            : "0 4px 20px rgba(212,175,55,0.25)",
          transition:   "all 0.3s ease",
        }}
      >
        {rateLocked
          ? <span style={{ fontSize:22 }}>🔒</span>
          : <span style={{ fontSize:22 }}>🤖</span>
        }
        {rateLocked && (
          <div style={{ position:"absolute", top:2, right:2, width:12, height:12, borderRadius:"50%", background:"#22c55e", border:"2px solid #07090E", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ fontSize:6, color:"#000", fontWeight:900 }}>✓</span>
          </div>
        )}
        {!rateLocked && (
          <div style={{ position:"absolute", top:2, right:2, width:10, height:10, borderRadius:"50%", background:"#D4AF37", border:"2px solid #07090E" }} />
        )}
      </button>
    </>
  );

  // ── EXPANDED PANEL ───────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes slideUp  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes dotBounce{ 0%,80%,100%{transform:scale(0.4);opacity:0.3} 40%{transform:scale(1);opacity:1} }
        @keyframes goldGlow { 0%,100%{text-shadow:0 0 8px rgba(212,175,55,0.4)} 50%{text-shadow:0 0 20px rgba(212,175,55,0.9)} }
        ::-webkit-scrollbar{width:2px} ::-webkit-scrollbar-thumb{background:rgba(212,175,55,0.15);border-radius:2px}
      `}</style>

      <div style={{
        position:    "fixed",
        bottom:      16,
        right:       14,
        zIndex:      60,
        width:       320,
        maxHeight:   minimized ? 56 : 480,
        borderRadius:20,
        overflow:    "hidden",
        background:  "linear-gradient(180deg,#0d1022,#070910)",
        border:      rateLocked
          ? "1px solid rgba(34,197,94,0.35)"
          : "1px solid rgba(212,175,55,0.25)",
        boxShadow:   rateLocked
          ? "0 8px 40px rgba(34,197,94,0.15), 0 0 0 1px rgba(34,197,94,0.08)"
          : "0 8px 40px rgba(212,175,55,0.12), 0 0 0 1px rgba(212,175,55,0.06)",
        display:     "flex",
        flexDirection:"column",
        animation:   "slideUp 0.35s cubic-bezier(0.16,1,0.3,1) forwards",
        transition:  "max-height 0.3s cubic-bezier(0.16,1,0.3,1)",
        fontFamily:  "system-ui,-apple-system,sans-serif",
      }}>

        {/* HEADER */}
        <div style={{
          padding:      "11px 13px",
          borderBottom: minimized ? "none" : "1px solid rgba(255,255,255,0.05)",
          background:   rateLocked ? "rgba(34,197,94,0.06)" : "rgba(212,175,55,0.04)",
          display:      "flex",
          alignItems:   "center",
          justifyContent:"space-between",
          flexShrink:   0,
          cursor:       "pointer",
        }} onClick={() => setMinimized(p => !p)}>
          <div style={{ display:"flex", alignItems:"center", gap:9 }}>
            <div style={{
              width:30, height:30, borderRadius:"50%",
              background: rateLocked ? "rgba(34,197,94,0.12)" : "rgba(212,175,55,0.1)",
              border:`1px solid ${rateLocked?"rgba(34,197,94,0.3)":"rgba(212,175,55,0.3)"}`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:14, flexShrink:0,
            }}>
              {rateLocked ? "🔒" : "🤖"}
            </div>
            <div>
              <p style={{ fontSize:11, fontWeight:800, color:rateLocked?"#22c55e":"#D4AF37",
                animation:rateLocked?"none":"goldGlow 3s ease-in-out infinite" }}>
                AI Negotiator {rateLocked ? "— Rate Locked ✓" : "— Online"}
              </p>
              {contextSummary && (
                <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)", marginTop:1 }}>{contextSummary}</p>
              )}
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <button onClick={e => { e.stopPropagation(); setMinimized(p => !p); }}
              style={{ width:22, height:22, borderRadius:6, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", color:"rgba(255,255,255,0.4)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
              {minimized ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>
            <button onClick={e => { e.stopPropagation(); setOpen(false); if(onClose) onClose(); }}
              style={{ width:22, height:22, borderRadius:6, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", color:"rgba(255,255,255,0.4)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <X size={11} />
            </button>
          </div>
        </div>

        {!minimized && (
          <>
            {/* RATE LOCK BANNER */}
            {rateLocked && (
              <div style={{ padding:"9px 13px", background:"rgba(34,197,94,0.06)", borderBottom:"1px solid rgba(34,197,94,0.12)", display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                <Zap size={12} style={{ color:"#22c55e", flexShrink:0 }} />
                <div>
                  <p style={{ fontSize:11, fontWeight:800, color:"#22c55e" }}>
                    ₹{lockedRate?.toLocaleString("en-IN")}/raat — Rate Locked!
                  </p>
                  {lockedToken && (
                    <p style={{ fontSize:8, color:"rgba(34,197,94,0.6)", fontFamily:"monospace" }}>
                      {lockedToken}
                    </p>
                  )}
                </div>
                {nights > 0 && (
                  <p style={{ fontSize:13, fontWeight:900, color:"#22c55e", marginLeft:"auto" }}>
                    ₹{(lockedRate * nights).toLocaleString("en-IN")}
                  </p>
                )}
              </div>
            )}

            {/* CONTEXT BAR */}
            {(selectedRoom || checkIn) && (
              <div style={{ padding:"6px 13px", background:"rgba(212,175,55,0.03)", borderBottom:"1px solid rgba(212,175,55,0.08)", display:"flex", gap:8, flexWrap:"wrap", flexShrink:0 }}>
                {selectedRoom && (
                  <span style={{ fontSize:9, color:"rgba(212,175,55,0.65)", background:"rgba(212,175,55,0.08)", padding:"2px 7px", borderRadius:5 }}>
                    🛏 Room {selectedRoom.number}
                  </span>
                )}
                {checkIn && (
                  <span style={{ fontSize:9, color:"rgba(212,175,55,0.65)", background:"rgba(212,175,55,0.08)", padding:"2px 7px", borderRadius:5 }}>
                    📅 {nights} raat
                  </span>
                )}
                <span style={{ fontSize:9, color:"rgba(212,175,55,0.65)", background:"rgba(212,175,55,0.08)", padding:"2px 7px", borderRadius:5 }}>
                  ₹{baseRate.toLocaleString("en-IN")}/raat base
                </span>
                {hotelConfig?.minFloorPrice && (
                  <span style={{ fontSize:9, color:"rgba(255,255,255,0.25)", background:"rgba(255,255,255,0.04)", padding:"2px 7px", borderRadius:5 }}>
                    Floor ₹{hotelConfig.minFloorPrice.toLocaleString("en-IN")}
                  </span>
                )}
              </div>
            )}

            {/* MESSAGES */}
            <div style={{ flex:1, overflowY:"auto", padding:"10px 12px", display:"flex", flexDirection:"column", gap:8, minHeight:0, WebkitOverflowScrolling:"touch" }}>
              {messages.map((msg, i) => <Bubble key={i} msg={msg} />)}
              {loading && (
                <div style={{ display:"flex", justifyContent:"flex-start" }}>
                  <div style={{ padding:"8px 12px", borderRadius:"12px 12px 12px 3px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)" }}>
                    <TypingDots />
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* QUICK CHIPS */}
            {!rateLocked && messages.length < 3 && (
              <div style={{ padding:"0 10px 6px", display:"flex", gap:5, flexWrap:"wrap", flexShrink:0 }}>
                {quickChips.slice(0, 3).map(q => (
                  <button key={q} onClick={() => send(q)}
                    style={{ fontSize:9, padding:"5px 9px", borderRadius:7, background:"rgba(212,175,55,0.07)", border:"1px solid rgba(212,175,55,0.2)", color:"#D4AF37", cursor:"pointer", fontWeight:600, whiteSpace:"nowrap" }}>
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* INPUT */}
            <div style={{ padding:"8px 10px 10px", borderTop:"1px solid rgba(255,255,255,0.05)", display:"flex", gap:7, alignItems:"center", flexShrink:0, background:"rgba(0,0,0,0.2)" }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={rateLocked ? "Rate lock ho gaya! Koi aur sawaal?" : "₹1200 mein milega? / discount do"}
                style={{
                  flex:1, background:"rgba(255,255,255,0.04)",
                  border:"1px solid rgba(255,255,255,0.08)",
                  borderRadius:10, padding:"9px 12px",
                  fontSize:11, color:"#fff", outline:"none",
                  colorScheme:"dark",
                }}
              />
              <button onClick={() => send()} disabled={!input.trim() || loading}
                style={{
                  width:36, height:36, borderRadius:9, border:"none",
                  background: rateLocked
                    ? "linear-gradient(135deg,#052210,#0a3a1a)"
                    : "linear-gradient(135deg,#b8960c,#D4AF37)",
                  cursor:!input.trim()||loading?"not-allowed":"pointer",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  opacity:(!input.trim()||loading)?0.4:1,
                  flexShrink:0,
                }}>
                <Send size={13} style={{ color:rateLocked?"#22c55e":"#000" }} />
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
