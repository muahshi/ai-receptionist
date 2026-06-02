"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, Search } from "lucide-react";

// ─── SEARCH PLACEHOLDERS ──────────────────────────────────────────────────
const SEARCH_PLACEHOLDERS = [
  "Bhopal mein bus stand ke paas clean budget stay dikhao below ₹1500...",
  "Jaipur City Center ke paas 4-star hotel with pool chahiye...",
  "Mumbai airport ke paas late night check-in available hotel...",
  "Delhi mein corporate stay with free breakfast below ₹3000...",
  "Indore mein couple-friendly hotel near Sarafa Bazaar...",
  "Hyderabad Hitech City ke paas business hotel...",
];

// ─── FLOOR CONFIG ─────────────────────────────────────────────────────────
const FLOORS = [
  {
    key: "top",
    label: "FLOOR 4 — SUITE LEVEL",
    color: "#22c55e",
    glow: "rgba(34,197,94,0.9)",
    bg: "rgba(34,197,94,0.07)",
    borderColor: "rgba(34,197,94,0.55)",
    height: 88,
    windowRows: 2,
    windowCols: 9,
    borderRadius: "14px 14px 4px 4px",
    roomIcon: "🌿",
    occupancy: 0.82,
  },
  {
    key: "mid",
    label: "FLOOR 3 — DELUXE ROOMS",
    color: "#38bdf8",
    glow: "rgba(56,189,248,0.9)",
    bg: "rgba(56,189,248,0.07)",
    borderColor: "rgba(56,189,248,0.55)",
    height: 90,
    windowRows: 2,
    windowCols: 9,
    borderRadius: "4px",
    roomIcon: "💼",
    occupancy: 0.68,
  },
  {
    key: "lower",
    label: "FLOOR 2 — STANDARD ROOMS",
    color: "#ef4444",
    glow: "rgba(239,68,68,0.9)",
    bg: "rgba(239,68,68,0.07)",
    borderColor: "rgba(239,68,68,0.55)",
    height: 90,
    windowRows: 2,
    windowCols: 9,
    borderRadius: "4px",
    roomIcon: "🛏",
    occupancy: 0.74,
  },
  {
    key: "ground",
    label: "LOBBY & RECEPTION",
    color: "#D4AF37",
    glow: "rgba(212,175,55,0.9)",
    bg: "rgba(212,175,55,0.07)",
    borderColor: "rgba(212,175,55,0.55)",
    height: 72,
    windowRows: 1,
    windowCols: 9,
    borderRadius: "4px 4px 14px 14px",
    roomIcon: "🏛",
    occupancy: 0.95,
  },
];

// ─── ISOMETRIC BUILDING COMPONENT ─────────────────────────────────────────
function IsometricBuilding() {
  const [winState, setWinState] = useState(() =>
    FLOORS.map(f => ({
      key: f.key,
      windows: Array.from({ length: f.windowRows * f.windowCols }, (_, i) => ({
        id: i,
        lit: Math.random() < f.occupancy,
        flicker: false,
        intensity: 0.6 + Math.random() * 0.4,
      })),
    }))
  );

  const [scanLine, setScanLine] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => {
      setWinState(prev =>
        prev.map((floorState, fi) => ({
          ...floorState,
          windows: floorState.windows.map(win => ({
            ...win,
            lit: Math.random() > 0.06 ? win.lit : !win.lit,
            flicker: Math.random() > 0.93,
            intensity: win.flicker ? 0.3 + Math.random() * 0.4 : win.intensity,
          })),
        }))
      );
    }, 900);

    const scanIv = setInterval(() => {
      setScanLine(v => (v + 1) % 100);
    }, 50);

    return () => { clearInterval(iv); clearInterval(scanIv); };
  }, []);

  return (
    <div style={{ position: "relative", width: "100%" }}>
      {/* Ground glow / shadow */}
      <div style={{
        position: "absolute", bottom: -16, left: "50%",
        transform: "translateX(-50%)",
        width: "85%", height: 32,
        borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(212,175,55,0.28) 0%, transparent 70%)",
        filter: "blur(14px)",
        zIndex: 0,
      }} />

      {/* BUILDING STACK */}
      <div style={{ display: "flex", flexDirection: "column", gap: 3, position: "relative", zIndex: 1 }}>
        {FLOORS.map((floor, fi) => {
          const fState = winState[fi];
          return (
            <div
              key={floor.key}
              style={{
                position: "relative",
                height: floor.height,
                background: `linear-gradient(180deg, ${floor.bg} 0%, rgba(6,8,16,0.97) 100%)`,
                border: `1.5px solid ${floor.borderColor}`,
                borderRadius: floor.borderRadius,
                overflow: "hidden",
                boxShadow: `
                  0 0 0 1px rgba(0,0,0,0.8),
                  0 0 24px ${floor.bg},
                  inset 0 0 40px rgba(0,0,0,0.65),
                  inset 0 1px 0 ${floor.color}22
                `,
              }}
            >
              {/* Top neon accent line */}
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 2,
                background: `linear-gradient(90deg, transparent 0%, ${floor.color} 30%, ${floor.color} 70%, transparent 100%)`,
                opacity: 0.9,
                filter: `drop-shadow(0 0 6px ${floor.color})`,
              }} />

              {/* Left neon accent line */}
              <div style={{
                position: "absolute", top: 0, left: 0, bottom: 0, width: 2,
                background: `linear-gradient(180deg, ${floor.color} 0%, transparent 100%)`,
                opacity: 0.5,
              }} />

              {/* Right neon accent line */}
              <div style={{
                position: "absolute", top: 0, right: 0, bottom: 0, width: 2,
                background: `linear-gradient(180deg, ${floor.color} 0%, transparent 100%)`,
                opacity: 0.5,
              }} />

              {/* Scan line effect */}
              <div style={{
                position: "absolute", left: 0, right: 0,
                top: `${scanLine}%`,
                height: 1,
                background: `linear-gradient(90deg, transparent, ${floor.color}40, transparent)`,
                pointerEvents: "none",
              }} />

              {/* Subtle inner grid lines */}
              <div style={{
                position: "absolute", inset: 0,
                backgroundImage: `
                  linear-gradient(${floor.color}06 1px, transparent 1px),
                  linear-gradient(90deg, ${floor.color}06 1px, transparent 1px)
                `,
                backgroundSize: "24px 24px",
              }} />

              {/* Floor label — left */}
              <div style={{
                position: "absolute", left: 14, top: "50%",
                transform: "translateY(-50%)",
                display: "flex", flexDirection: "column", gap: 2,
              }}>
                <span style={{
                  fontSize: 7, fontWeight: 800, letterSpacing: "0.14em",
                  color: floor.color, opacity: 0.8,
                  textTransform: "uppercase",
                  fontFamily: "monospace",
                }}>
                  {floor.label}
                </span>
                <span style={{ fontSize: 8, color: "rgba(255,255,255,0.2)" }}>
                  {floor.roomIcon} {Math.round(floor.occupancy * 100)}% Occupied
                </span>
              </div>

              {/* WINDOWS GRID — right side */}
              <div style={{
                position: "absolute", right: 14, top: "50%",
                transform: "translateY(-50%)",
                display: "grid",
                gridTemplateColumns: `repeat(${floor.windowCols}, 1fr)`,
                gridTemplateRows: `repeat(${floor.windowRows}, 1fr)`,
                gap: floor.windowRows > 1 ? "5px 4px" : "4px",
              }}>
                {fState?.windows.map(win => (
                  <div
                    key={win.id}
                    style={{
                      width: 10,
                      height: floor.windowRows > 1 ? 14 : 18,
                      borderRadius: 2,
                      background: win.lit
                        ? `rgba(${win.flicker ? "255,200,80" : floor.color.startsWith("#22") ? "34,197,94" : floor.color.startsWith("#38") ? "56,189,248" : floor.color.startsWith("#ef") ? "239,68,68" : "212,175,55"},${win.intensity})`
                        : "rgba(255,255,255,0.04)",
                      border: win.lit
                        ? `1px solid ${floor.color}55`
                        : "1px solid rgba(255,255,255,0.05)",
                      boxShadow: win.lit
                        ? `0 0 8px ${floor.glow}, inset 0 0 4px rgba(255,230,100,0.3)`
                        : "none",
                      transition: "all 0.4s ease",
                    }}
                  />
                ))}
              </div>

              {/* Bottom status dots */}
              <div style={{
                position: "absolute", bottom: 7, left: 14,
                display: "flex", gap: 3, alignItems: "center",
              }}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} style={{
                    width: 5, height: 5, borderRadius: 1,
                    background: i < Math.round(floor.occupancy * 6)
                      ? floor.color
                      : "rgba(255,255,255,0.06)",
                    boxShadow: i < Math.round(floor.occupancy * 6)
                      ? `0 0 4px ${floor.glow}`
                      : "none",
                  }} />
                ))}
                <span style={{ fontSize: 7, color: "rgba(255,255,255,0.2)", marginLeft: 4, fontFamily: "monospace" }}>
                  AI RATE LOCKED
                </span>
              </div>

              {/* Corner badge for top floor — TOTAL CONTROL */}
              {fi === 0 && (
                <div style={{
                  position: "absolute", top: 10, right: 14,
                  background: "rgba(34,197,94,0.1)",
                  border: "1px solid rgba(34,197,94,0.35)",
                  borderRadius: 6, padding: "3px 8px",
                  fontSize: 7, fontWeight: 800, color: "#22c55e",
                  letterSpacing: "0.1em",
                }}>
                  ◆ LIVE AI MANAGED
                </div>
              )}
            </div>
          );
        })}

        {/* Ground label */}
        <div style={{
          textAlign: "center", marginTop: 8,
          fontSize: 9, fontWeight: 800, letterSpacing: "0.3em",
          color: "rgba(212,175,55,0.45)",
          textTransform: "uppercase", fontFamily: "monospace",
        }}>
          ◆ THE GUESTINN ◆
        </div>
      </div>

      {/* RIGHT SIDEBAR STATS — absolutely positioned outside the building */}
      <div style={{
        position: "absolute", right: -156, top: 0,
        display: "flex", flexDirection: "column", gap: 10,
        zIndex: 10,
      }}>
        {[
          {
            label: "VACANT\nROOMS",
            value: "128",
            sub: "Live Availability",
            color: "#22c55e",
            glow: "rgba(34,197,94,0.25)",
            dot: "⊙",
          },
          {
            label: "AI RECEPTIONIST\nSESSIONS",
            value: "24",
            sub: "Active Now",
            color: "#38bdf8",
            glow: "rgba(56,189,248,0.25)",
            dot: "⊙",
          },
          {
            label: "LOCKED\nREVENUE",
            value: "₹2.45L",
            sub: "Protected",
            color: "#ef4444",
            glow: "rgba(239,68,68,0.25)",
            dot: "🔒",
          },
        ].map(stat => (
          <div
            key={stat.label}
            style={{
              background: "rgba(5,8,15,0.95)",
              border: `1px solid ${stat.color}22`,
              borderLeft: `2px solid ${stat.color}`,
              borderRadius: 10,
              padding: "12px 14px",
              minWidth: 138,
              backdropFilter: "blur(20px)",
              boxShadow: `0 4px 24px rgba(0,0,0,0.6), 0 0 0 1px ${stat.color}0a, inset 0 0 20px ${stat.glow}`,
              position: "relative", overflow: "hidden",
            }}
          >
            {/* Glow background */}
            <div style={{
              position: "absolute", top: -20, right: -20,
              width: 80, height: 80, borderRadius: "50%",
              background: `radial-gradient(circle, ${stat.glow} 0%, transparent 70%)`,
              pointerEvents: "none",
            }} />

            <div style={{
              fontSize: 7.5, fontWeight: 800, letterSpacing: "0.13em",
              color: stat.color, opacity: 0.75,
              marginBottom: 5, textTransform: "uppercase",
              lineHeight: 1.4, whiteSpace: "pre",
            }}>
              {stat.label}
            </div>
            <div style={{
              fontSize: stat.value.startsWith("₹") ? 20 : 26,
              fontWeight: 900, color: stat.color, lineHeight: 1,
              textShadow: `0 0 24px ${stat.color}, 0 0 48px ${stat.glow}`,
              fontFamily: "monospace",
              letterSpacing: "-0.02em",
            }}>
              {stat.value}
            </div>
            <div style={{
              fontSize: 9, color: "rgba(255,255,255,0.3)",
              marginTop: 5, display: "flex", alignItems: "center", gap: 4,
            }}>
              <span style={{ color: stat.color, opacity: 0.6 }}>{stat.dot}</span>
              {stat.sub}
            </div>
          </div>
        ))}

        {/* Total Control Badge */}
        <div style={{
          background: "rgba(212,175,55,0.06)",
          border: "1px solid rgba(212,175,55,0.25)",
          borderRadius: 10, padding: "10px 14px",
          minWidth: 138,
          backdropFilter: "blur(16px)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
        }}>
          <div style={{ fontSize: 14 }}>👑</div>
          <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.14em", color: "#D4AF37", textTransform: "uppercase" }}>
            TOTAL CONTROL
          </div>
          <div style={{ fontSize: 8, color: "rgba(212,175,55,0.5)", letterSpacing: "0.08em" }}>REAL TIME</div>
        </div>
      </div>
    </div>
  );
}

// ─── GOLD AURA WAVE (behind search card) ──────────────────────────────────
function AuraWave() {
  return (
    <svg
      viewBox="0 0 420 220"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      preserveAspectRatio="none"
    >
      <defs>
        <filter id="aura-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="18" />
        </filter>
        <radialGradient id="aura-gold" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.22" />
          <stop offset="60%" stopColor="#D4AF37" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="200" cy="110" rx="195" ry="100" fill="url(#aura-gold)" filter="url(#aura-blur)" />
      {/* Animated outer ring */}
      <ellipse cx="200" cy="110" rx="192" ry="97"
        fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeOpacity="0.18"
        strokeDasharray="8 14"
        style={{ animation: "auraRotate 18s linear infinite" }}
      />
      <ellipse cx="200" cy="110" rx="175" ry="85"
        fill="none" stroke="#D4AF37" strokeWidth="0.8" strokeOpacity="0.10"
        strokeDasharray="4 20"
        style={{ animation: "auraRotate 28s linear infinite reverse" }}
      />
    </svg>
  );
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────
export default function HeroSearchSection({ onSearch }) {
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [userInput, setUserInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [micPulse, setMicPulse] = useState(false);

  const typeRef = useRef(null);
  const deleteRef = useRef(null);
  const inputRef = useRef(null);
  const recognRef = useRef(null);

  // ── Voice support check ──
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      setVoiceSupported(!!SR);
    }
  }, []);

  // ── Typewriter effect ──
  useEffect(() => {
    if (isFocused || userInput) return;
    const target = SEARCH_PLACEHOLDERS[placeholderIdx];
    let charIdx = 0;
    typeRef.current = setInterval(() => {
      charIdx++;
      setDisplayText(target.slice(0, charIdx));
      if (charIdx >= target.length) {
        clearInterval(typeRef.current);
        setTimeout(() => {
          let delIdx = target.length;
          deleteRef.current = setInterval(() => {
            delIdx -= 2;
            setDisplayText(target.slice(0, Math.max(0, delIdx)));
            if (delIdx <= 0) {
              clearInterval(deleteRef.current);
              setPlaceholderIdx(i => (i + 1) % SEARCH_PLACEHOLDERS.length);
            }
          }, 28);
        }, 2800);
      }
    }, 42);
    return () => { clearInterval(typeRef.current); clearInterval(deleteRef.current); };
  }, [placeholderIdx, isFocused, userInput]);

  // ── Mic pulse loop ──
  useEffect(() => {
    const iv = setInterval(() => setMicPulse(p => !p), 1400);
    return () => clearInterval(iv);
  }, []);

  // ── Submit ──
  const handleSubmit = useCallback(() => {
    const query = userInput.trim();
    if (!query) return;
    if (onSearch) onSearch(query);
    setUserInput("");
    inputRef.current?.blur();
  }, [userInput, onSearch]);

  // ── Voice ──
  const toggleVoice = useCallback(() => {
    if (!voiceSupported) {
      setVoiceError("Voice not supported in this browser");
      setTimeout(() => setVoiceError(""), 3000);
      return;
    }
    if (voiceActive) { recognRef.current?.stop(); setVoiceActive(false); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recog = new SR();
    recognRef.current = recog;
    recog.lang = "hi-IN";
    recog.continuous = false;
    recog.interimResults = true;
    recog.onstart = () => { setVoiceActive(true); setVoiceError(""); };
    recog.onresult = (event) => {
      const transcript = Array.from(event.results).map(r => r[0].transcript).join("");
      setUserInput(transcript);
      if (event.results[event.results.length - 1].isFinal) {
        const final = transcript.trim();
        if (final && onSearch) setTimeout(() => { onSearch(final); setUserInput(""); }, 400);
      }
    };
    recog.onerror = (e) => {
      setVoiceActive(false);
      if (e.error === "not-allowed") setVoiceError("Mic permission denied");
      else if (e.error === "no-speech") setVoiceError("Kuch suna nahi — dobara try karein");
      else setVoiceError("Voice error: " + e.error);
      setTimeout(() => setVoiceError(""), 4000);
    };
    recog.onend = () => setVoiceActive(false);
    recog.start();
  }, [voiceActive, voiceSupported, onSearch]);

  useEffect(() => () => recognRef.current?.stop(), []);

  return (
    <section style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      padding: "80px 24px 48px",
      position: "relative",
      overflow: "hidden",
      background: "linear-gradient(180deg, #07090E 0%, #060810 60%, #07090E 100%)",
    }}>

      {/* ── AMBIENT GLOW AURAS ── */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        {/* Gold aura behind left search panel */}
        <div style={{
          position: "absolute", top: "30%", left: "5%",
          width: 480, height: 320, borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(212,175,55,0.12) 0%, transparent 70%)",
          filter: "blur(60px)",
        }} />
        {/* Blue aura behind building */}
        <div style={{
          position: "absolute", top: "20%", right: "18%",
          width: 420, height: 380, borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(56,189,248,0.08) 0%, transparent 70%)",
          filter: "blur(80px)",
        }} />
        {/* Green subtle top right */}
        <div style={{
          position: "absolute", top: "10%", right: "30%",
          width: 280, height: 200, borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(34,197,94,0.06) 0%, transparent 70%)",
          filter: "blur(50px)",
        }} />
        {/* Red lower */}
        <div style={{
          position: "absolute", bottom: "20%", right: "25%",
          width: 260, height: 200, borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(239,68,68,0.06) 0%, transparent 70%)",
          filter: "blur(50px)",
        }} />
        {/* Subtle gold particle dots */}
        {[...Array(18)].map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            width: i % 3 === 0 ? 2 : 1.5,
            height: i % 3 === 0 ? 2 : 1.5,
            borderRadius: "50%",
            background: i % 4 === 0 ? "#D4AF37" : i % 4 === 1 ? "#38bdf8" : i % 4 === 2 ? "#22c55e" : "rgba(255,255,255,0.3)",
            opacity: 0.25 + (i % 5) * 0.08,
            left: `${(i * 37 + 5) % 90}%`,
            top: `${(i * 23 + 10) % 80}%`,
            animation: `particleFloat ${4 + (i % 4)}s ease-in-out ${i * 0.3}s infinite alternate`,
          }} />
        ))}
      </div>

      {/* ── MAIN HERO GRID ── */}
      <div style={{
        maxWidth: 1320, margin: "0 auto", width: "100%",
        display: "grid",
        gridTemplateColumns: "1fr 1.05fr",
        gap: 64,
        alignItems: "center",
        position: "relative", zIndex: 2,
      }} className="hero-grid">

        {/* ════ LEFT COLUMN ════ */}
        <div>

          {/* Headline */}
          <h1 style={{ margin: "0 0 10px 0", lineHeight: 1.1 }}>
            <span style={{
              display: "block",
              fontSize: "clamp(24px,3.5vw,40px)",
              fontWeight: 300,
              color: "rgba(255,255,255,0.88)",
              letterSpacing: "-0.01em",
              fontFamily: "Georgia, serif",
            }}>
              India ka
            </span>
            <span style={{
              display: "block",
              fontSize: "clamp(36px,5.5vw,62px)",
              fontWeight: 900,
              background: "linear-gradient(135deg, #9a7a0a 0%, #D4AF37 35%, #F7D558 60%, #D4AF37 80%, #b8960c 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
              filter: "drop-shadow(0 0 28px rgba(212,175,55,0.35))",
              fontFamily: "Georgia, 'Times New Roman', serif",
            }}>
              Smart Hotel Network
            </span>
          </h1>

          <p style={{
            fontSize: 14, color: "rgba(255,255,255,0.40)",
            marginBottom: 26, fontWeight: 400, letterSpacing: "0.04em",
          }}>
            AI Powered. Secure. Commission Free.
          </p>

          {/* Live stats row */}
          <div style={{
            display: "flex", alignItems: "center", gap: 0,
            marginBottom: 32,
            padding: "11px 0",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}>
            {[
              { dot: true, dotColor: "#22c55e", text: "93,748+ Rooms Live" },
              { sep: true },
              { text: "1,256 Cities" },
              { sep: true },
              { text: "Pan India" },
            ].map((s, i) =>
              s.sep ? (
                <span key={i} style={{ margin: "0 12px", color: "rgba(255,255,255,0.12)", fontSize: 14 }}>·</span>
              ) : (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {s.dot && (
                    <div style={{
                      width: 7, height: 7, borderRadius: "50%",
                      background: s.dotColor,
                      boxShadow: `0 0 8px ${s.dotColor}`,
                      animation: "pulseDot 1.8s ease-out infinite",
                    }} />
                  )}
                  <span style={{
                    fontSize: 11.5, color: "rgba(255,255,255,0.5)",
                    fontWeight: 600, letterSpacing: "0.02em",
                  }}>
                    {s.text}
                  </span>
                </div>
              )
            )}
          </div>

          {/* ── GLASSMORPHIC SEARCH CARD ── */}
          <div style={{ position: "relative" }}>
            {/* Aura behind card */}
            <div style={{
              position: "absolute", inset: -24,
              borderRadius: 32, zIndex: -1,
              overflow: "hidden",
            }}>
              <AuraWave />
            </div>

            {/* Card container with gradient border */}
            <div style={{
              position: "relative",
              padding: 1.5,
              borderRadius: 22,
              background: isFocused
                ? "linear-gradient(135deg, rgba(212,175,55,0.7) 0%, rgba(212,175,55,0.2) 40%, rgba(212,175,55,0.6) 100%)"
                : "linear-gradient(135deg, rgba(212,175,55,0.4) 0%, rgba(212,175,55,0.08) 50%, rgba(212,175,55,0.35) 100%)",
              boxShadow: isFocused
                ? "0 0 0 3px rgba(212,175,55,0.12), 0 24px 80px rgba(0,0,0,0.7), 0 0 100px rgba(212,175,55,0.15)"
                : "0 0 0 1px rgba(212,175,55,0.06), 0 20px 70px rgba(0,0,0,0.65)",
              transition: "all 0.3s ease",
            }}>
              <div style={{
                background: "rgba(6,8,16,0.88)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                borderRadius: 21,
                padding: "20px 20px 16px 22px",
                position: "relative", overflow: "hidden",
              }}>
                {/* Inner glow corner */}
                <div style={{
                  position: "absolute", bottom: -40, right: -40,
                  width: 220, height: 220, borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%)",
                  pointerEvents: "none",
                }} />
                <div style={{
                  position: "absolute", top: -30, left: -30,
                  width: 160, height: 160, borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(212,175,55,0.04) 0%, transparent 70%)",
                  pointerEvents: "none",
                }} />

                {/* Text input area */}
                <div style={{
                  display: "flex", alignItems: "flex-start", gap: 12,
                  minHeight: 62, paddingRight: 56,
                  position: "relative",
                }}>
                  <div style={{ flex: 1, position: "relative" }}>
                    <input
                      ref={inputRef}
                      value={userInput}
                      onChange={e => setUserInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleSubmit(); } }}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      placeholder={isFocused ? "Hotel dhundo — city, area, budget likhein..." : ""}
                      style={{
                        width: "100%", background: "none", border: "none", outline: "none",
                        fontSize: "clamp(13px,1.8vw,15.5px)",
                        color: "#fff", caretColor: "#D4AF37",
                        fontWeight: 400, lineHeight: 1.65,
                        minHeight: 52, resize: "none",
                        fontFamily: "inherit",
                      }}
                    />
                    {/* Typewriter placeholder overlay */}
                    {!isFocused && !userInput && (
                      <div style={{
                        position: "absolute", top: 0, left: 0, right: 0,
                        fontSize: "clamp(13px,1.8vw,15.5px)",
                        color: "rgba(255,255,255,0.52)",
                        lineHeight: 1.65, pointerEvents: "none",
                        minHeight: 52,
                      }}>
                        {displayText}
                        <span style={{
                          display: "inline-block", width: 2, height: "1em",
                          background: "#D4AF37", marginLeft: 2,
                          verticalAlign: "middle",
                          animation: "cursorBlink 1s steps(1) infinite",
                        }} />
                      </div>
                    )}
                  </div>

                  {/* Search button — appears on input */}
                  {userInput.trim() && (
                    <button
                      onClick={handleSubmit}
                      style={{
                        flexShrink: 0, marginTop: 4,
                        padding: "8px 16px", borderRadius: 10, cursor: "pointer",
                        background: "linear-gradient(135deg, #b8960c 0%, #D4AF37 100%)",
                        border: "none", fontSize: 12, fontWeight: 800, color: "#000",
                        display: "flex", alignItems: "center", gap: 5,
                        boxShadow: "0 4px 20px rgba(212,175,55,0.45)",
                        transition: "all 0.2s",
                      }}
                    >
                      <Search size={12} />
                      Dhundo
                    </button>
                  )}
                </div>

                {/* ── MIC BUTTON ── */}
                <div
                  onClick={toggleVoice}
                  title={voiceSupported ? (voiceActive ? "Stop voice" : "Bolke search karein") : "Voice not supported"}
                  style={{
                    position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)",
                    width: 52, height: 52, borderRadius: "50%",
                    background: voiceActive
                      ? "radial-gradient(circle, rgba(239,68,68,0.25) 0%, rgba(239,68,68,0.08) 100%)"
                      : `radial-gradient(circle, rgba(212,175,55,${micPulse ? "0.14" : "0.08"}) 0%, rgba(212,175,55,0.04) 100%)`,
                    border: `2px solid ${voiceActive ? "rgba(239,68,68,0.65)" : "rgba(212,175,55,0.35)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer",
                    boxShadow: voiceActive
                      ? "0 0 0 1px rgba(239,68,68,0.2), 0 0 28px rgba(239,68,68,0.35)"
                      : `0 0 0 1px rgba(212,175,55,0.08), 0 0 ${micPulse ? "20px" : "12px"} rgba(212,175,55,0.15)`,
                    transition: "all 0.4s ease",
                    zIndex: 5,
                  }}
                >
                  {voiceActive
                    ? <MicOff size={19} style={{ color: "#ef4444" }} />
                    : <Mic size={19} style={{ color: "#D4AF37" }} />
                  }
                  {/* Pulsing aura rings */}
                  {voiceActive && (
                    <>
                      <div style={{ position: "absolute", inset: -7, borderRadius: "50%", border: "1px solid rgba(239,68,68,0.35)", animation: "voicePing 1.1s ease-out infinite" }} />
                      <div style={{ position: "absolute", inset: -14, borderRadius: "50%", border: "1px solid rgba(239,68,68,0.18)", animation: "voicePing 1.1s ease-out 0.25s infinite" }} />
                    </>
                  )}
                  {!voiceActive && (
                    <div style={{
                      position: "absolute", inset: -5, borderRadius: "50%",
                      border: "1px solid rgba(212,175,55,0.2)",
                      animation: "micGlow 2.5s ease-in-out infinite",
                    }} />
                  )}
                </div>

                {/* ── STATUS BAR ── */}
                <div style={{
                  marginTop: 12,
                  paddingTop: 11,
                  borderTop: "1px solid rgba(255,255,255,0.05)",
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  {/* Voice bars */}
                  <div style={{ display: "flex", gap: 2.5, alignItems: "flex-end", height: 16 }}>
                    {[...Array(6)].map((_, i) => (
                      <div key={i} style={{
                        width: 2.5, borderRadius: 2,
                        height: voiceActive ? `${6 + Math.abs(Math.sin(i * 1.1)) * 10}px` : "4px",
                        background: voiceActive ? "#ef4444" : "rgba(255,255,255,0.14)",
                        animation: voiceActive ? `voiceBar 0.7s ease-in-out ${i * 0.09}s infinite alternate` : "none",
                        transition: "height 0.3s",
                        alignSelf: "flex-end",
                      }} />
                    ))}
                  </div>

                  {/* Mic icon label */}
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <Mic size={9} style={{ color: voiceActive ? "#ef4444" : "#D4AF37", opacity: 0.7 }} />
                    <span style={{
                      fontSize: 9.5, color: voiceError ? "#ef4444" : "rgba(255,255,255,0.38)",
                      fontWeight: 600, letterSpacing: "0.05em",
                    }}>
                      {voiceError || (voiceActive ? "Bol raha hoon... sun raha hoon 👂" : "Voice Search Active")}
                    </span>
                  </div>

                  <span style={{
                    fontSize: 9.5, color: "rgba(255,255,255,0.22)",
                    marginLeft: 2,
                  }}>•</span>

                  <span style={{
                    fontSize: 9.5, fontWeight: 700, color: "#D4AF37",
                    letterSpacing: "0.06em", opacity: 0.8,
                  }}>
                    Hinglish AI Search
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── TRUST STATS ROW ── */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
            gap: 10, marginTop: 22,
          }}>
            {[
              { icon: "🛡", label: "AI Verified Hotels", value: "100%" },
              { icon: "🔒", label: "Secure Stays",       value: "Bank Grade" },
              { icon: "😊", label: "Happy Guests",       value: "4.8/5 Avg" },
              { icon: "🔄", label: "Repeat Bookings",    value: "76%" },
            ].map(s => (
              <div
                key={s.label}
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 11,
                  padding: "11px 8px",
                  textAlign: "center",
                  backdropFilter: "blur(8px)",
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(212,175,55,0.04)"; e.currentTarget.style.borderColor = "rgba(212,175,55,0.15)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
              >
                <div style={{ fontSize: 17, marginBottom: 5 }}>{s.icon}</div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: "#fff", marginBottom: 3 }}>{s.value}</div>
                <div style={{ fontSize: 8.5, color: "rgba(255,255,255,0.28)", lineHeight: 1.3 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ════ RIGHT COLUMN ════ */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
          paddingRight: 168,
        }}>
          <div style={{ width: "100%", maxWidth: 430 }}>
            <IsometricBuilding />
          </div>
        </div>

      </div>

      {/* ── GLOBAL STYLES ── */}
      <style>{`
        @media (max-width: 960px) {
          .hero-grid { grid-template-columns: 1fr !important; }
        }

        @keyframes cursorBlink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        @keyframes voicePing {
          0% { transform: scale(1); opacity: 0.7; }
          100% { transform: scale(1.9); opacity: 0; }
        }
        @keyframes voiceBar {
          from { height: 3px; }
          to { height: 16px; }
        }
        @keyframes micGlow {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.08); }
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 1; box-shadow: 0 0 8px currentColor; }
          50% { opacity: 0.6; box-shadow: 0 0 14px currentColor; }
        }
        @keyframes particleFloat {
          from { transform: translateY(0px); opacity: 0.2; }
          to { transform: translateY(-14px); opacity: 0.45; }
        }
        @keyframes auraRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  );
}
