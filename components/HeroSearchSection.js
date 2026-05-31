"use client";
import { useState, useEffect, useRef } from "react";
import { Mic, MapPin, Zap } from "lucide-react";

const SEARCH_PLACEHOLDERS = [
  "Bhopal mein bus stand ke paas clean budget stay dikhao below ₹1500...",
  "Jaipur City Center ke paas 4-star hotel with pool chahiye...",
  "Mumbai airport ke paas late night check-in available hotel...",
  "Delhi mein corporate stay with free breakfast below ₹3000...",
  "Indore mein couple-friendly hotel near Sarafa Bazaar...",
  "Hyderabad Hitech City ke paas business hotel...",
];

// Window grid for isometric building floors
const FLOOR_COLORS = {
  top:    { active: "#22c55e", glow: "rgba(34,197,94,0.8)",   bg: "rgba(34,197,94,0.15)"  },
  mid:    { active: "#008cff", glow: "rgba(0,140,255,0.8)",   bg: "rgba(0,140,255,0.12)"  },
  lower:  { active: "#ef4444", glow: "rgba(239,68,68,0.8)",   bg: "rgba(239,68,68,0.12)"  },
  ground: { active: "#D4AF37", glow: "rgba(212,175,55,0.8)",  bg: "rgba(212,175,55,0.12)" },
};

function IsometricBuilding() {
  const [windows, setWindows] = useState(() =>
    Array.from({ length: 4 }, (_, f) =>
      Array.from({ length: 8 }, (_, w) => ({ lit: Math.random() > 0.35, flicker: false, id: `${f}-${w}` }))
    )
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setWindows(prev =>
        prev.map(floor =>
          floor.map(win => ({
            ...win,
            lit: Math.random() > 0.1 ? win.lit : !win.lit,
            flicker: Math.random() > 0.92,
          }))
        )
      );
    }, 800);
    return () => clearInterval(interval);
  }, []);

  const floors = [
    { key: "top",    label: "Floor 4", color: FLOOR_COLORS.top,    height: 70  },
    { key: "mid",    label: "Floor 3", color: FLOOR_COLORS.mid,    height: 75  },
    { key: "lower",  label: "Floor 2", color: FLOOR_COLORS.lower,  height: 75  },
    { key: "ground", label: "Lobby",   color: FLOOR_COLORS.ground, height: 80  },
  ];

  return (
    <div className="relative flex flex-col items-center select-none" style={{ width: "100%", maxWidth: 420 }}>
      {/* Ambient glow base */}
      <div style={{
        position: "absolute", bottom: -20, left: "50%", transform: "translateX(-50%)",
        width: 320, height: 40, borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(212,175,55,0.25) 0%, transparent 70%)",
        filter: "blur(12px)",
      }}/>

      {/* Building floors stack */}
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 3 }}>
        {floors.map((floor, fi) => (
          <div key={floor.key} style={{
            position: "relative",
            background: `linear-gradient(180deg, rgba(8,12,22,0.95) 0%, rgba(5,8,15,0.98) 100%)`,
            border: `1.5px solid ${floor.color.active}22`,
            borderRadius: fi === 0 ? "12px 12px 4px 4px" : fi === 3 ? "4px 4px 12px 12px" : "4px",
            padding: "10px 14px",
            boxShadow: `0 0 20px ${floor.color.bg}, inset 0 0 30px rgba(0,0,0,0.5)`,
            height: floor.height,
            overflow: "hidden",
          }}>
            {/* Floor color accent strip */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 2,
              background: `linear-gradient(90deg, transparent, ${floor.color.active}, transparent)`,
              opacity: 0.8,
            }}/>

            {/* Floor label */}
            <div style={{
              position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
              fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
              color: floor.color.active, opacity: 0.7, textTransform: "uppercase",
            }}>
              {floor.label}
            </div>

            {/* Windows grid */}
            <div style={{
              position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
              display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 4,
            }}>
              {windows[fi]?.map((win) => (
                <div key={win.id} style={{
                  width: 12, height: 16, borderRadius: 2,
                  background: win.lit
                    ? (win.flicker ? floor.color.active + "aa" : floor.color.active + "dd")
                    : "rgba(255,255,255,0.04)",
                  boxShadow: win.lit ? `0 0 6px ${floor.color.glow}` : "none",
                  border: win.lit ? `1px solid ${floor.color.active}55` : "1px solid rgba(255,255,255,0.06)",
                  transition: "all 0.3s ease",
                }}/>
              ))}
            </div>

            {/* Room occupancy mini-bar */}
            <div style={{
              position: "absolute", bottom: 8, left: 12,
              display: "flex", gap: 2, alignItems: "center",
            }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: 1,
                  background: i < (fi === 0 ? 4 : fi === 1 ? 5 : fi === 2 ? 3 : 5) ? floor.color.active : "rgba(255,255,255,0.08)",
                  opacity: 0.7,
                }}/>
              ))}
            </div>
          </div>
        ))}

        {/* Ground label */}
        <div style={{
          textAlign: "center", fontSize: 10, fontWeight: 800,
          letterSpacing: "0.25em", color: "rgba(212,175,55,0.5)",
          marginTop: 6, textTransform: "uppercase",
        }}>
          ◆ THE GUESTINN ◆
        </div>
      </div>

      {/* Stat widgets on right side */}
      <div style={{
        position: "absolute", right: -140, top: 0,
        display: "flex", flexDirection: "column", gap: 8,
      }}>
        {[
          { label: "VACANT ROOMS", value: "128", sub: "Live Availability", color: "#22c55e" },
          { label: "AI RECEPTIONIST SESSIONS", value: "24", sub: "Active Now", color: "#008cff" },
          { label: "LOCKED REVENUE", value: "₹2.45L", sub: "Protected", color: "#ef4444" },
        ].map((stat) => (
          <div key={stat.label} style={{
            background: "rgba(5,8,15,0.95)", border: `1px solid ${stat.color}22`,
            borderRadius: 10, padding: "10px 14px", minWidth: 130,
            boxShadow: `0 4px 20px rgba(0,0,0,0.5)`,
          }}>
            <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: "0.12em", color: stat.color, opacity: 0.7, marginBottom: 4, textTransform: "uppercase" }}>
              {stat.label}
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: stat.color, lineHeight: 1, textShadow: `0 0 20px ${stat.color}` }}>
              {stat.value}
            </div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", marginTop: 3 }}>
              ⊙ {stat.sub}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HeroSearchSection() {
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [displayText, setDisplayText]       = useState("");
  const [isTyping, setIsTyping]             = useState(true);
  const [voiceActive, setVoiceActive]       = useState(true);
  const typeRef = useRef(null);
  const deleteRef = useRef(null);

  // Typewriter effect
  useEffect(() => {
    const target = SEARCH_PLACEHOLDERS[placeholderIdx];
    let charIdx = 0;
    setIsTyping(true);

    typeRef.current = setInterval(() => {
      charIdx++;
      setDisplayText(target.slice(0, charIdx));
      if (charIdx >= target.length) {
        clearInterval(typeRef.current);
        setTimeout(() => {
          // Delete phase
          let delIdx = target.length;
          deleteRef.current = setInterval(() => {
            delIdx -= 2;
            setDisplayText(target.slice(0, Math.max(0, delIdx)));
            if (delIdx <= 0) {
              clearInterval(deleteRef.current);
              setPlaceholderIdx(i => (i + 1) % SEARCH_PLACEHOLDERS.length);
            }
          }, 30);
        }, 2500);
      }
    }, 45);

    return () => {
      clearInterval(typeRef.current);
      clearInterval(deleteRef.current);
    };
  }, [placeholderIdx]);

  return (
    <section style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      padding: "80px 20px 40px", position: "relative", overflow: "hidden",
    }}>
      <div style={{
        maxWidth: 1280, margin: "0 auto", width: "100%",
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center",
      }} className="hero-grid">

        {/* ── LEFT COLUMN ── */}
        <div style={{ position: "relative", zIndex: 2 }}>
          {/* Network status pill */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)",
            borderRadius: 100, padding: "6px 14px", marginBottom: 24,
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%", background: "#22c55e",
              boxShadow: "0 0 8px #22c55e", animation: "livePulse 2s infinite",
            }}/>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#22c55e", letterSpacing: "0.1em" }}>
              NETWORK ONLINE
            </span>
          </div>

          {/* Main headline */}
          <h1 style={{ marginBottom: 8 }}>
            <span style={{
              display: "block", fontSize: "clamp(26px,4vw,42px)", fontWeight: 400,
              color: "rgba(255,255,255,0.85)", letterSpacing: "-0.01em", lineHeight: 1.2,
            }}>
              India ka
            </span>
            <span style={{
              display: "block", fontSize: "clamp(34px,5.5vw,58px)", fontWeight: 900,
              background: "linear-gradient(135deg, #b8960c 0%, #D4AF37 40%, #F5C842 70%, #D4AF37 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              letterSpacing: "-0.03em", lineHeight: 1.1,
              textShadow: "none", filter: "drop-shadow(0 0 30px rgba(212,175,55,0.4))",
            }}>
              Smart Hotel Network
            </span>
          </h1>

          <p style={{
            fontSize: 15, color: "rgba(255,255,255,0.45)", marginBottom: 28,
            fontWeight: 400, letterSpacing: "0.02em",
          }}>
            AI Powered. Secure. Commission Free.
          </p>

          {/* Stats row */}
          <div style={{
            display: "flex", alignItems: "center", gap: 16, marginBottom: 36,
            padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}>
            {[
              { icon: "⊙", text: "93,748+ Rooms Live", color: "#22c55e" },
              { icon: "◈", text: "1,256 Cities" },
              { icon: "◉", text: "Pan India" },
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {i > 0 && <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 12 }}>·</span>}
                <span style={{ fontSize: 11, color: s.color || "rgba(255,255,255,0.5)", fontWeight: 600 }}>
                  <span style={{ color: s.color || "#D4AF37", marginRight: 4 }}>{s.icon}</span>
                  {s.text}
                </span>
              </div>
            ))}
          </div>

          {/* Voice Search Box */}
          <div style={{
            position: "relative",
            background: "rgba(4,6,12,0.9)",
            border: "1px solid rgba(212,175,55,0.3)",
            borderRadius: 20,
            padding: "20px 24px",
            boxShadow: `
              0 0 0 1px rgba(212,175,55,0.08),
              0 20px 60px rgba(0,0,0,0.6),
              0 0 80px rgba(212,175,55,0.06)
            `,
            overflow: "hidden",
          }}>
            {/* Ambient glow rings */}
            <div style={{
              position: "absolute", bottom: -30, right: -30,
              width: 200, height: 200, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)",
            }}/>

            {/* Typewriter text */}
            <div style={{
              fontSize: "clamp(13px,2vw,15px)", color: "rgba(255,255,255,0.75)",
              lineHeight: 1.6, minHeight: 52, marginRight: 60,
              fontWeight: 400,
            }}>
              {displayText}
              <span style={{
                display: "inline-block", width: 2, height: "1em",
                background: "#D4AF37", marginLeft: 2, verticalAlign: "middle",
                animation: "cursorBlink 1s infinite",
              }}/>
            </div>

            {/* Mic button */}
            <button
              onClick={() => setVoiceActive(v => !v)}
              style={{
                position: "absolute", right: 20, top: "50%", transform: "translateY(-50%)",
                width: 52, height: 52, borderRadius: "50%",
                background: voiceActive
                  ? "radial-gradient(circle, rgba(212,175,55,0.3) 0%, rgba(212,175,55,0.1) 100%)"
                  : "rgba(212,175,55,0.06)",
                border: `2px solid rgba(212,175,55,${voiceActive ? "0.6" : "0.2"})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
                boxShadow: voiceActive ? "0 0 24px rgba(212,175,55,0.4), 0 0 50px rgba(212,175,55,0.15)" : "none",
                transition: "all 0.3s",
              }}
            >
              <Mic size={20} style={{ color: "#D4AF37" }}/>
              {voiceActive && (
                <div style={{
                  position: "absolute", inset: -6, borderRadius: "50%",
                  border: "1px solid rgba(212,175,55,0.25)",
                  animation: "voicePing 1.5s ease-out infinite",
                }}/>
              )}
            </button>

            {/* Voice status bar */}
            <div style={{
              marginTop: 12, display: "flex", alignItems: "center", gap: 8,
              paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)",
            }}>
              <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} style={{
                    width: 3, borderRadius: 2,
                    height: voiceActive ? `${8 + Math.sin(i * 1.2) * 8}px` : "4px",
                    background: voiceActive ? "#D4AF37" : "rgba(255,255,255,0.15)",
                    animation: voiceActive ? `voiceBar 0.8s ease-in-out ${i * 0.1}s infinite alternate` : "none",
                    transition: "all 0.3s",
                  }}/>
                ))}
              </div>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: "0.08em" }}>
                {voiceActive ? "Voice Search Active" : "Tap mic to activate"}
              </span>
              <span style={{
                fontSize: 10, color: "#D4AF37", fontWeight: 700,
                marginLeft: "auto", letterSpacing: "0.05em",
              }}>
                Hinglish AI Search
              </span>
            </div>
          </div>

          {/* Trust micro-stats */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 20,
          }}>
            {[
              { icon: "🛡", label: "AI Verified Hotels", value: "100%" },
              { icon: "🔒", label: "Secure Stays", value: "Bank Grade" },
              { icon: "😊", label: "Happy Guests", value: "4.8/5 Avg" },
              { icon: "🔄", label: "Repeat Bookings", value: "76%" },
            ].map((s) => (
              <div key={s.label} style={{
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 10, padding: "10px 8px", textAlign: "center",
              }}>
                <div style={{ fontSize: 16, marginBottom: 4 }}>{s.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", marginBottom: 2 }}>{s.value}</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", lineHeight: 1.3 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT COLUMN — Isometric Building ── */}
        <div style={{
          display: "flex", justifyContent: "center", alignItems: "center",
          position: "relative", paddingRight: 160,
        }}>
          <IsometricBuilding />
        </div>
      </div>

      {/* Responsive grid fix */}
      <style>{`
        @media (max-width: 900px) {
          .hero-grid { grid-template-columns: 1fr !important; }
        }
        @keyframes cursorBlink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes voicePing { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(1.6);opacity:0} }
        @keyframes voiceBar { from{height:4px} to{height:18px} }
        @keyframes livePulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.3)} }
      `}</style>
    </section>
  );
}
