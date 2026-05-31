"use client";
import { Ban, Shield, ScanLine, TrendingUp, Cpu, Globe } from "lucide-react";

const ADVANTAGES = [
  {
    Icon: Ban,
    title: "ZERO OTA COMMISSION",
    subtitle: "100% Direct Revenue",
    color: "#22c55e",
    glow: "rgba(34,197,94,0.2)",
    border: "rgba(34,197,94,0.3)",
    dot: "#22c55e",
  },
  {
    Icon: Shield,
    title: "TARIFF GUARD ACTIVE",
    subtitle: "Rate Parity Protected",
    color: "#008cff",
    glow: "rgba(0,140,255,0.2)",
    border: "rgba(0,140,255,0.3)",
    dot: "#008cff",
  },
  {
    Icon: ScanLine,
    title: "3-SEC ID SCAN VERIFICATION",
    subtitle: "Govt. Approved AI Check-in",
    color: "#D4AF37",
    glow: "rgba(212,175,55,0.2)",
    border: "rgba(212,175,55,0.3)",
    dot: "#D4AF37",
  },
  {
    Icon: TrendingUp,
    title: "AI REVENUE SHIELD",
    subtitle: "Anti-Theft Protection",
    color: "#ef4444",
    glow: "rgba(239,68,68,0.2)",
    border: "rgba(239,68,68,0.3)",
    dot: "#ef4444",
  },
  {
    Icon: Cpu,
    title: "SMART PRICING ENGINE",
    subtitle: "Dynamic AI Rate Lock",
    color: "#a855f7",
    glow: "rgba(168,85,247,0.2)",
    border: "rgba(168,85,247,0.3)",
    dot: "#a855f7",
  },
  {
    Icon: Globe,
    title: "PAN INDIA NETWORK",
    subtitle: "1,256+ Cities Connected",
    color: "#f97316",
    glow: "rgba(249,115,22,0.2)",
    border: "rgba(249,115,22,0.3)",
    dot: "#f97316",
  },
];

export default function AdvantageGrid() {
  return (
    <section style={{
      padding: "60px 20px",
      background: "linear-gradient(180deg, transparent 0%, rgba(212,175,55,0.02) 50%, transparent 100%)",
      position: "relative",
    }}>
      {/* Section header */}
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ marginBottom: 40, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Shield size={16} style={{ color: "#D4AF37" }}/>
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 800, color: "#fff", letterSpacing: "0.02em" }}>
              The GuestInn Network Advantage
            </p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
              Built for Hoteliers. Designed for Direct Bookings. Secured by AI.
            </p>
          </div>
        </div>

        {/* 6-chip grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gap: 12,
        }} className="advantage-grid">
          {ADVANTAGES.map(({ Icon, title, subtitle, color, glow, border, dot }) => (
            <div
              key={title}
              className="advantage-card"
              style={{
                position: "relative",
                background: "rgba(5,8,15,0.95)",
                border: `1px solid ${border}`,
                borderRadius: 16,
                padding: "20px 16px",
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
                boxShadow: `0 4px 20px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03)`,
                overflow: "hidden",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = `0 12px 40px rgba(0,0,0,0.6), 0 0 30px ${glow}`;
                e.currentTarget.style.borderColor = color;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = `0 4px 20px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03)`;
                e.currentTarget.style.borderColor = border;
              }}
            >
              {/* Corner deco dots — microchip style */}
              {["tl","tr","bl","br"].map(pos => (
                <div key={pos} style={{
                  position: "absolute",
                  top: pos.startsWith("t") ? 6 : "auto",
                  bottom: pos.startsWith("b") ? 6 : "auto",
                  left: pos.endsWith("l") ? 6 : "auto",
                  right: pos.endsWith("r") ? 6 : "auto",
                  width: 4, height: 4, borderRadius: 1,
                  background: `${color}44`,
                  border: `1px solid ${color}55`,
                }}/>
              ))}

              {/* Circuit trace lines */}
              <div style={{
                position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
                width: 1, height: 12, background: `linear-gradient(180deg, ${color}66, transparent)`,
              }}/>
              <div style={{
                position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)",
                width: 1, height: 12, background: `linear-gradient(0deg, ${color}66, transparent)`,
              }}/>

              {/* Icon */}
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: `${glow}`,
                border: `1px solid ${border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 14,
                boxShadow: `0 4px 16px ${glow}`,
              }}>
                <Icon size={22} style={{ color }}/>
              </div>

              {/* Status dot */}
              <div style={{
                position: "absolute", top: 14, right: 14,
                width: 7, height: 7, borderRadius: "50%",
                background: dot,
                boxShadow: `0 0 8px ${dot}`,
                animation: "livePulse 2s infinite",
              }}/>

              {/* Text */}
              <p style={{
                fontSize: 11, fontWeight: 800, color: "#fff",
                letterSpacing: "0.04em", lineHeight: 1.3, marginBottom: 6,
                textTransform: "uppercase",
              }}>
                {title}
              </p>
              <p style={{
                fontSize: 10, color: color, fontWeight: 600,
                opacity: 0.85,
              }}>
                {subtitle}
              </p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 1100px) { .advantage-grid { grid-template-columns: repeat(3,1fr) !important; } }
        @media (max-width: 640px)  { .advantage-grid { grid-template-columns: repeat(2,1fr) !important; } }
        @keyframes livePulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.4)} }
      `}</style>
    </section>
  );
}
