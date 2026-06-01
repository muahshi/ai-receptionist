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

// ─── FLOOR COLORS ─────────────────────────────────────────────────────────
const FLOOR_COLORS = {
  top:    { active: "#22c55e", glow: "rgba(34,197,94,0.8)",  bg: "rgba(34,197,94,0.15)"  },
  mid:    { active: "#008cff", glow: "rgba(0,140,255,0.8)",  bg: "rgba(0,140,255,0.12)"  },
  lower:  { active: "#ef4444", glow: "rgba(239,68,68,0.8)",  bg: "rgba(239,68,68,0.12)"  },
  ground: { active: "#D4AF37", glow: "rgba(212,175,55,0.8)", bg: "rgba(212,175,55,0.12)" },
};

// ─── LIVE NETWORK CANVAS ──────────────────────────────────────────────────
// Full-section animated network showing GUEST (👤 green) ↔ AI-AGENT (⬡ blue)
// ↔ HOTEL (🏨 gold) nodes drifting and connecting with glowing dashed lines.
// Data packets flow between nodes showing real-time booking activity.
function LiveNetworkCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    const setSize = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      canvas.width  = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    setSize();
    window.addEventListener("resize", setSize);

    const W = () => canvas.offsetWidth;
    const H = () => canvas.offsetHeight;

    const TYPES = {
      person: { color:"#22c55e", glow:"#22c55e", emoji:"👤", label:"GUEST",    size:22, glowR:38 },
      hotel:  { color:"#D4AF37", glow:"#D4AF37", emoji:"🏨", label:"HOTEL",    size:26, glowR:46 },
      ai:     { color:"#38bdf8", glow:"#38bdf8", emoji:"⬡",  label:"AI·AGENT", size:20, glowR:34 },
    };

    // 15 nodes: repeating pattern person-hotel-ai
    const TYPE_SEQ = ["person","hotel","ai","person","hotel","person","ai","hotel","person","ai","hotel","person","hotel","ai","person"];

    const makeNodes = () => TYPE_SEQ.map((type, i) => ({
      id:i, type,
      x: 50 + Math.random() * (W() - 100),
      y: 50 + Math.random() * (H() - 100),
      vx: (Math.random()-0.5) * 0.55,
      vy: (Math.random()-0.5) * 0.55,
      pulse: Math.random() * Math.PI * 2,
      pingT: -1,
    }));

    let nodes = makeNodes();
    const particles = [];

    const spawn = (a, b) => {
      if (particles.length > 55) return;
      const rev = Math.random() > 0.5;
      const [f, t] = rev ? [b, a] : [a, b];
      particles.push({ fx:f.x,fy:f.y, tx:t.x,ty:t.y, color:TYPES[f.type].color, t:0, speed:0.007+Math.random()*0.009, r:2.8+Math.random()*1.8, tail:[] });
    };

    let frame = 0, animId;

    const draw = () => {
      frame++;
      const w = W(), h = H();
      ctx.clearRect(0, 0, w, h);

      const CD = Math.min(w * 0.40, 260);

      // Move nodes
      nodes.forEach((n,i) => {
        n.x += n.vx; n.y += n.vy;
        n.pulse += 0.028;
        if (n.x < 35 || n.x > w-35) n.vx *= -1;
        if (n.y < 35 || n.y > h-35) n.vy *= -1;
        if (frame % 80 === (i*5)%80) n.pingT = 0;
        if (n.pingT >= 0) n.pingT += 0.045;
        if (n.pingT > 1) n.pingT = -1;
      });

      // ── EDGES ──
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i+1; j < nodes.length; j++) {
          const a=nodes[i], b=nodes[j];
          const dx=a.x-b.x, dy=a.y-b.y;
          const dist=Math.sqrt(dx*dx+dy*dy);
          if (dist > CD) continue;
          const str = 1 - dist/CD;

          // Dashed animated line
          ctx.save();
          ctx.setLineDash([5,9]);
          ctx.lineDashOffset = -frame * 0.9;
          const g = ctx.createLinearGradient(a.x,a.y,b.x,b.y);
          const aHex = Math.round(str*150).toString(16).padStart(2,"0");
          g.addColorStop(0, TYPES[a.type].color+aHex);
          g.addColorStop(1, TYPES[b.type].color+aHex);
          ctx.beginPath();
          ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y);
          ctx.strokeStyle=g; ctx.lineWidth=0.9+str*1.6;
          ctx.stroke();
          ctx.restore();

          // Spawn packet
          if (frame%(50) === (i*j)%50 && Math.random()>0.45) spawn(a,b);
        }
      }

      // ── PARTICLES ──
      for (let i = particles.length-1; i>=0; i--) {
        const p = particles[i];
        p.t += p.speed;
        if (p.t>=1){ particles.splice(i,1); continue; }
        const px = p.fx+(p.tx-p.fx)*p.t;
        const py = p.fy+(p.ty-p.fy)*p.t;
        const fade = Math.sin(p.t*Math.PI);
        p.tail.push({x:px,y:py});
        if(p.tail.length>10) p.tail.shift();

        // Tail
        for(let k=0;k<p.tail.length-1;k++){
          const tf=(k/p.tail.length)*fade;
          ctx.beginPath();
          ctx.moveTo(p.tail[k].x,p.tail[k].y);
          ctx.lineTo(p.tail[k+1].x,p.tail[k+1].y);
          ctx.strokeStyle=p.color+Math.round(tf*200).toString(16).padStart(2,"0");
          ctx.lineWidth=p.r*(k/p.tail.length)*1.2;
          ctx.stroke();
        }
        // Glow halo
        const grd=ctx.createRadialGradient(px,py,0,px,py,p.r*4);
        grd.addColorStop(0, p.color+Math.round(fade*180).toString(16).padStart(2,"0"));
        grd.addColorStop(1, p.color+"00");
        ctx.beginPath(); ctx.arc(px,py,p.r*4,0,Math.PI*2); ctx.fillStyle=grd; ctx.fill();
        // Core
        ctx.beginPath(); ctx.arc(px,py,p.r,0,Math.PI*2); ctx.fillStyle=p.color+"ff"; ctx.fill();
      }

      // ── NODES ──
      nodes.forEach(n => {
        const T = TYPES[n.type];
        const pulse = Math.sin(n.pulse)*0.22+0.78;
        const r = T.size*0.52;

        // Multi-layer glow
        [2.2,1.4,0.8].forEach((k,ki) => {
          const gr=ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,T.glowR*k*pulse);
          const a=[20,35,60][ki];
          gr.addColorStop(0, T.glow+a.toString(16).padStart(2,"0"));
          gr.addColorStop(1, T.glow+"00");
          ctx.beginPath(); ctx.arc(n.x,n.y,T.glowR*k*pulse,0,Math.PI*2); ctx.fillStyle=gr; ctx.fill();
        });

        // Pulsing outer ring
        ctx.beginPath();
        ctx.arc(n.x,n.y, r+4+Math.sin(n.pulse)*2.5, 0,Math.PI*2);
        ctx.strokeStyle=T.color+"66"; ctx.lineWidth=1.5; ctx.stroke();

        // Dark bg circle
        ctx.beginPath(); ctx.arc(n.x,n.y,r+2,0,Math.PI*2);
        ctx.fillStyle="#080d18"; ctx.fill();

        // Colored border
        ctx.beginPath(); ctx.arc(n.x,n.y,r+2,0,Math.PI*2);
        ctx.strokeStyle=T.color+"dd"; ctx.lineWidth=1.8; ctx.stroke();

        // Emoji icon
        ctx.font=`${Math.round(r*1.15)}px serif`;
        ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillStyle="#fff";
        ctx.fillText(T.emoji,n.x,n.y);

        // Ping ring
        if(n.pingT>=0){
          const pr=(r+6)+n.pingT*32;
          ctx.beginPath(); ctx.arc(n.x,n.y,pr,0,Math.PI*2);
          ctx.strokeStyle=T.color+Math.round((1-n.pingT)*200).toString(16).padStart(2,"0");
          ctx.lineWidth=2.5; ctx.stroke();
        }

        // Label
        ctx.font="bold 8.5px monospace";
        ctx.textAlign="center"; ctx.textBaseline="top";
        ctx.fillStyle=T.color+"bb";
        ctx.fillText(T.label, n.x, n.y+r+7);
      });

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize",setSize); };
  }, []);

  return (
    <canvas ref={canvasRef} style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none", display:"block" }}/>
  );
}
// ─── ISOMETRIC BUILDING ───────────────────────────────────────────────────
function IsometricBuilding() {
  const [windows, setWindows] = useState(() =>
    Array.from({ length: 4 }, (_, f) =>
      Array.from({ length: 8 }, (_, w) => ({
        lit: Math.random() > 0.35,
        flicker: false,
        id: `${f}-${w}`,
      }))
    )
  );

  useEffect(() => {
    const iv = setInterval(() => {
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
    return () => clearInterval(iv);
  }, []);

  const floors = [
    { key: "top",    label: "Floor 4", color: FLOOR_COLORS.top,    height: 70 },
    { key: "mid",    label: "Floor 3", color: FLOOR_COLORS.mid,    height: 75 },
    { key: "lower",  label: "Floor 2", color: FLOOR_COLORS.lower,  height: 75 },
    { key: "ground", label: "Lobby",   color: FLOOR_COLORS.ground, height: 80 },
  ];

  return (
    <div style={{ width: "100%", maxWidth: 420, position: "relative" }}>
      <div style={{ position: "absolute", bottom: -20, left: "50%", transform: "translateX(-50%)", width: 320, height: 40, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(212,175,55,0.25) 0%, transparent 70%)", filter: "blur(12px)" }}/>
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 3 }}>
        {floors.map((floor, fi) => (
          <div key={floor.key} style={{
            position: "relative",
            background: "linear-gradient(180deg, rgba(8,12,22,0.95) 0%, rgba(5,8,15,0.98) 100%)",
            border: `1.5px solid ${floor.color.active}22`,
            borderRadius: fi === 0 ? "12px 12px 4px 4px" : fi === 3 ? "4px 4px 12px 12px" : "4px",
            padding: "10px 14px",
            boxShadow: `0 0 20px ${floor.color.bg}, inset 0 0 30px rgba(0,0,0,0.5)`,
            height: floor.height, overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${floor.color.active}, transparent)`, opacity: 0.8 }}/>
            <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: floor.color.active, opacity: 0.7, textTransform: "uppercase" }}>
              {floor.label}
            </div>
            <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 4 }}>
              {windows[fi]?.map(win => (
                <div key={win.id} style={{
                  width: 12, height: 16, borderRadius: 2,
                  background: win.lit ? (win.flicker ? floor.color.active + "aa" : floor.color.active + "dd") : "rgba(255,255,255,0.04)",
                  boxShadow: win.lit ? `0 0 6px ${floor.color.glow}` : "none",
                  border: win.lit ? `1px solid ${floor.color.active}55` : "1px solid rgba(255,255,255,0.06)",
                  transition: "all 0.3s ease",
                }}/>
              ))}
            </div>
            <div style={{ position: "absolute", bottom: 8, left: 12, display: "flex", gap: 2 }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} style={{ width: 6, height: 6, borderRadius: 1, background: i < (fi === 0 ? 4 : fi === 1 ? 5 : fi === 2 ? 3 : 5) ? floor.color.active : "rgba(255,255,255,0.08)", opacity: 0.7 }}/>
              ))}
            </div>
          </div>
        ))}
        <div style={{ textAlign: "center", fontSize: 10, fontWeight: 800, letterSpacing: "0.25em", color: "rgba(212,175,55,0.5)", marginTop: 6, textTransform: "uppercase" }}>
          ◆ THE GUESTINN ◆
        </div>
      </div>
      <div style={{ position: "absolute", right: -140, top: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        {[
          { label: "VACANT ROOMS", value: "128", sub: "Live Availability", color: "#22c55e" },
          { label: "AI RECEPTIONIST SESSIONS", value: "24", sub: "Active Now", color: "#008cff" },
          { label: "LOCKED REVENUE", value: "₹2.45L", sub: "Protected", color: "#ef4444" },
        ].map(stat => (
          <div key={stat.label} style={{ background: "rgba(5,8,15,0.95)", border: `1px solid ${stat.color}22`, borderRadius: 10, padding: "10px 14px", minWidth: 130, boxShadow: "0 4px 20px rgba(0,0,0,0.5)" }}>
            <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: "0.12em", color: stat.color, opacity: 0.7, marginBottom: 4, textTransform: "uppercase" }}>{stat.label}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: stat.color, lineHeight: 1, textShadow: `0 0 20px ${stat.color}` }}>{stat.value}</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", marginTop: 3 }}>⊙ {stat.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────
export default function HeroSearchSection({ onSearch }) {
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [displayText, setDisplayText]       = useState("");
  const [userInput, setUserInput]           = useState("");
  const [isFocused, setIsFocused]           = useState(false);
  const [voiceActive, setVoiceActive]       = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceError, setVoiceError]         = useState("");
  const typeRef    = useRef(null);
  const deleteRef  = useRef(null);
  const inputRef   = useRef(null);
  const recognRef  = useRef(null);

  // Check voice support
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      setVoiceSupported(!!SR);
    }
  }, []);

  // Typewriter effect — pauses when user is typing
  useEffect(() => {
    if (isFocused) return;
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
          }, 30);
        }, 2500);
      }
    }, 45);
    return () => { clearInterval(typeRef.current); clearInterval(deleteRef.current); };
  }, [placeholderIdx, isFocused]);

  // ── SUBMIT ──────────────────────────────────────────────────
  const handleSubmit = useCallback(() => {
    const query = userInput.trim();
    if (!query) return;
    if (onSearch) onSearch(query);
    setUserInput("");
    inputRef.current?.blur();
  }, [userInput, onSearch]);

  // ── VOICE SEARCH via Web Speech API ─────────────────────────
  const toggleVoice = useCallback(() => {
    if (!voiceSupported) {
      setVoiceError("Voice search is not supported in this browser");
      setTimeout(() => setVoiceError(""), 3000);
      return;
    }
    if (voiceActive) {
      recognRef.current?.stop();
      setVoiceActive(false);
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recog = new SR();
    recognRef.current = recog;
    recog.lang = "hi-IN"; // Hinglish — Hindi + English
    recog.continuous = false;
    recog.interimResults = true;

    recog.onstart = () => { setVoiceActive(true); setVoiceError(""); };
    recog.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(r => r[0].transcript).join("");
      setUserInput(transcript);
      // Final result — auto submit
      if (event.results[event.results.length - 1].isFinal) {
        const final = transcript.trim();
        if (final && onSearch) {
          setTimeout(() => {
            onSearch(final);
            setUserInput("");
          }, 400);
        }
      }
    };
    recog.onerror = (e) => {
      setVoiceActive(false);
      if (e.error === "not-allowed") setVoiceError("Mic permission denied — please allow mic access");
      else if (e.error === "no-speech") setVoiceError("Kuch suna nahi — dobara try karein");
      else setVoiceError("Voice error: " + e.error);
      setTimeout(() => setVoiceError(""), 4000);
    };
    recog.onend = () => setVoiceActive(false);
    recog.start();
  }, [voiceActive, voiceSupported, onSearch]);

  // Cleanup on unmount
  useEffect(() => () => recognRef.current?.stop(), []);

  return (
    <section style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      padding: "80px 20px 40px", position: "relative", overflow: "hidden",
    }}>

      {/* ── LIVE NETWORK ANIMATION BACKGROUND ── */}
      {/* Full-section canvas showing AI agents, humans, hotels connecting */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 0,
        overflow: "hidden",
      }}>
        <LiveNetworkCanvas />
        {/* Dark radial vignette so text stays readable */}
        <div style={{
          position: "absolute", inset: 0,
          background: `
            radial-gradient(ellipse 55% 90% at 28% 50%, rgba(7,9,14,0.72) 0%, rgba(7,9,14,0.15) 100%),
            radial-gradient(ellipse 40% 80% at 85% 50%, rgba(7,9,14,0.5) 0%, rgba(7,9,14,0.1) 100%)
          `,
        }}/>
      </div>

      <div style={{
        maxWidth: 1280, margin: "0 auto", width: "100%",
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center",
        position: "relative", zIndex: 2,
      }} className="hero-grid">

        {/* ── LEFT COLUMN ── */}
        <div>
          {/* NETWORK ONLINE badge — wired into live animation context */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            background: "rgba(34,197,94,0.06)",
            border: "1px solid rgba(34,197,94,0.3)",
            borderRadius: 100, padding: "7px 16px", marginBottom: 24,
            boxShadow: "0 0 20px rgba(34,197,94,0.08)",
            backdropFilter: "blur(8px)",
          }}>
            {/* Animated triple-ring pulse */}
            <div style={{ position: "relative", width: 12, height: 12, flexShrink: 0 }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e", animation: "netPulse 1.8s ease-out infinite" }}/>
              <div style={{ position: "absolute", inset: -4, borderRadius: "50%", border: "1px solid rgba(34,197,94,0.4)", animation: "netRing1 1.8s ease-out infinite" }}/>
              <div style={{ position: "absolute", inset: -8, borderRadius: "50%", border: "1px solid rgba(34,197,94,0.2)", animation: "netRing2 1.8s ease-out 0.3s infinite" }}/>
            </div>
            <div>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#22c55e", letterSpacing: "0.12em", display: "block" }}>
                NETWORK ONLINE
              </span>
              <span style={{ fontSize: 9, color: "rgba(34,197,94,0.6)", letterSpacing: "0.06em", fontWeight: 500 }}>
                24 AI agents · 128 hotels · live now
              </span>
            </div>
          </div>

          {/* Headline */}
          <h1 style={{ marginBottom: 8 }}>
            <span style={{ display: "block", fontSize: "clamp(26px,4vw,42px)", fontWeight: 400, color: "rgba(255,255,255,0.85)", letterSpacing: "-0.01em", lineHeight: 1.2 }}>
              India ka
            </span>
            <span style={{
              display: "block", fontSize: "clamp(34px,5.5vw,58px)", fontWeight: 900,
              background: "linear-gradient(135deg, #b8960c 0%, #D4AF37 40%, #F5C842 70%, #D4AF37 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              letterSpacing: "-0.03em", lineHeight: 1.1,
              filter: "drop-shadow(0 0 30px rgba(212,175,55,0.4))",
            }}>
              Smart Hotel Network
            </span>
          </h1>

          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.45)", marginBottom: 28, fontWeight: 400, letterSpacing: "0.02em" }}>
            AI Powered. Secure. Commission Free.
          </p>

          {/* Stats row */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 36, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
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

          {/* ── SEARCH BOX ── */}
          <div style={{
            position: "relative",
            background: isFocused ? "rgba(6,9,18,0.97)" : "rgba(4,6,12,0.88)",
            border: `1px solid rgba(212,175,55,${isFocused ? "0.55" : "0.3"})`,
            borderRadius: 20, padding: "16px 20px",
            boxShadow: isFocused
              ? "0 0 0 3px rgba(212,175,55,0.08), 0 20px 60px rgba(0,0,0,0.6), 0 0 80px rgba(212,175,55,0.12)"
              : "0 0 0 1px rgba(212,175,55,0.08), 0 20px 60px rgba(0,0,0,0.6)",
            overflow: "hidden", transition: "all 0.25s",
            backdropFilter: "blur(16px)",
          }}>
            <div style={{ position: "absolute", bottom: -30, right: -30, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)", pointerEvents: "none" }}/>

            {/* Input row */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 60 }}>
              <input
                ref={inputRef}
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleSubmit(); } }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={isFocused ? "Hotel dhundo — city, area, budget likhein..." : ""}
                style={{
                  flex: 1, background: "none", border: "none", outline: "none",
                  fontSize: "clamp(13px,2vw,15px)", color: "#fff",
                  caretColor: "#D4AF37", fontWeight: 400, lineHeight: 1.6, minHeight: 52,
                }}
              />
              {userInput.trim() && (
                <button onClick={handleSubmit} style={{
                  padding: "8px 16px", borderRadius: 10, cursor: "pointer",
                  background: "linear-gradient(135deg, #b8960c, #D4AF37)",
                  border: "none", fontSize: 12, fontWeight: 800, color: "#000",
                  display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
                  boxShadow: "0 4px 16px rgba(212,175,55,0.4)",
                }}>
                  <Search size={13}/>
                  Dhundo
                </button>
              )}
            </div>

            {/* Typewriter placeholder */}
            {!isFocused && !userInput && (
              <div style={{
                position: "absolute", top: 16, left: 20, right: 80,
                fontSize: "clamp(13px,2vw,15px)", color: "rgba(255,255,255,0.5)",
                lineHeight: 1.6, pointerEvents: "none",
              }}>
                {displayText}
                <span style={{ display: "inline-block", width: 2, height: "1em", background: "#D4AF37", marginLeft: 2, verticalAlign: "middle", animation: "cursorBlink 1s infinite" }}/>
              </div>
            )}

            {/* Mic button */}
            <button
              onClick={toggleVoice}
              title={voiceSupported ? (voiceActive ? "Stop voice" : "Bolke search karein") : "Voice not supported"}
              style={{
                position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)",
                width: 48, height: 48, borderRadius: "50%",
                background: voiceActive
                  ? "radial-gradient(circle, rgba(239,68,68,0.35) 0%, rgba(239,68,68,0.12) 100%)"
                  : "rgba(212,175,55,0.06)",
                border: `2px solid ${voiceActive ? "rgba(239,68,68,0.7)" : "rgba(212,175,55,0.2)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
                boxShadow: voiceActive ? "0 0 24px rgba(239,68,68,0.4)" : "none",
                transition: "all 0.3s",
              }}
            >
              {voiceActive
                ? <MicOff size={18} style={{ color: "#ef4444" }}/>
                : <Mic size={18} style={{ color: "#D4AF37" }}/>
              }
              {voiceActive && (
                <div style={{ position: "absolute", inset: -6, borderRadius: "50%", border: "1px solid rgba(239,68,68,0.3)", animation: "voicePing 1.2s ease-out infinite" }}/>
              )}
            </button>

            {/* Status bar */}
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} style={{
                    width: 3, borderRadius: 2,
                    height: voiceActive ? `${8 + Math.sin(i * 1.2) * 8}px` : "4px",
                    background: voiceActive ? "#ef4444" : "rgba(255,255,255,0.15)",
                    animation: voiceActive ? `voiceBar 0.8s ease-in-out ${i * 0.1}s infinite alternate` : "none",
                    transition: "all 0.3s",
                  }}/>
                ))}
              </div>
              <span style={{ fontSize: 10, color: voiceError ? "#ef4444" : "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: "0.06em" }}>
                {voiceError || (voiceActive ? "Bol raha hoon... sun raha hoon 👂" : isFocused ? "Enter dabao ya Dhundo click karo" : "Tap mic to activate")}
              </span>
              <span style={{ fontSize: 10, color: "#D4AF37", fontWeight: 700, marginLeft: "auto", letterSpacing: "0.05em" }}>
                Hinglish AI Search
              </span>
            </div>
          </div>

          {/* Trust stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 20 }}>
            {[
              { icon: "🛡", label: "AI Verified Hotels", value: "100%" },
              { icon: "🔒", label: "Secure Stays",       value: "Bank Grade" },
              { icon: "😊", label: "Happy Guests",       value: "4.8/5 Avg" },
              { icon: "🔄", label: "Repeat Bookings",    value: "76%" },
            ].map(s => (
              <div key={s.label} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 8px", textAlign: "center", backdropFilter: "blur(8px)" }}>
                <div style={{ fontSize: 16, marginBottom: 4 }}>{s.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", marginBottom: 2 }}>{s.value}</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", lineHeight: 1.3 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", position: "relative", paddingRight: 160 }}>
          <IsometricBuilding />
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) { .hero-grid { grid-template-columns: 1fr !important; } }
        @keyframes cursorBlink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes voicePing   { 0%{transform:scale(1);opacity:0.7} 100%{transform:scale(1.8);opacity:0} }
        @keyframes voiceBar    { from{height:4px} to{height:18px} }
        @keyframes netPulse    { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.7;transform:scale(1.2)} }
        @keyframes netRing1    { 0%{transform:scale(1);opacity:0.5} 100%{transform:scale(2.2);opacity:0} }
        @keyframes netRing2    { 0%{transform:scale(1);opacity:0.3} 100%{transform:scale(2.8);opacity:0} }
      `}</style>
    </section>
  );
}
