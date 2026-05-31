"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Crown, LayoutDashboard, Menu, X } from "lucide-react";

const HeroSearchSection = dynamic(() => import("../components/HeroSearchSection"), { ssr: false });
const AdvantageGrid     = dynamic(() => import("../components/AdvantageGrid"),     { ssr: false });
const MarketplaceHotels = dynamic(() => import("../components/MarketplaceHotels"), { ssr: false });
const NegotiatorOrb     = dynamic(() => import("../components/NegotiatorOrb"),     { ssr: false });

// ── Neural Particle Canvas ─────────────────────────────────────────────────
function NeuralCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const PARTICLE_COUNT = 70;
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x:   Math.random() * canvas.width,
      y:   Math.random() * canvas.height,
      vx:  (Math.random() - 0.5) * 0.4,
      vy:  (Math.random() - 0.5) * 0.4,
      r:   Math.random() * 1.8 + 0.4,
      alpha: Math.random() * 0.5 + 0.1,
      color: Math.random() > 0.7 ? "#D4AF37" : Math.random() > 0.5 ? "#008cff" : "#ffffff",
    }));

    let animId;
    const CONNECT_DIST = 120;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      });
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECT_DIST) {
            const opacity = (1 - dist / CONNECT_DIST) * 0.15;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(212,175,55,${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color === "#D4AF37"
          ? `rgba(212,175,55,${p.alpha})`
          : p.color === "#008cff"
          ? `rgba(0,140,255,${p.alpha * 0.6})`
          : `rgba(255,255,255,${p.alpha * 0.3})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed", inset: 0, zIndex: 0,
        pointerEvents: "none", opacity: 0.7,
      }}
    />
  );
}

// ── Top Navigation Bar ─────────────────────────────────────────────────────
function TopNav() {
  const [menuOpen, setMenuOpen] = useState(false);

  const NAV_LINKS = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Bookings",  href: "#bookings"  },
    { label: "Hotels",    href: "#hotels"    },
    { label: "AI Concierge", href: "#ai"     },
    { label: "More",      href: "#more"      },
  ];

  return (
    <header style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: "rgba(5,7,14,0.92)", backdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(212,175,55,0.1)",
      boxShadow: "0 4px 30px rgba(0,0,0,0.5)",
    }}>
      <div style={{
        maxWidth: 1280, margin: "0 auto",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 20px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Crown size={20} style={{ color: "#D4AF37", filter: "drop-shadow(0 0 8px rgba(212,175,55,0.6))" }}/>
          <div>
            <span style={{
              fontSize: 22, fontWeight: 900, color: "#D4AF37",
              letterSpacing: "-0.02em",
              textShadow: "0 0 20px rgba(212,175,55,0.4)",
              fontFamily: "serif",
            }}>
              The GuestInn
            </span>
            <div style={{
              fontSize: 8, letterSpacing: "0.3em", color: "rgba(212,175,55,0.5)",
              textTransform: "uppercase", fontWeight: 700, textAlign: "center",
            }}>
              NETWORK
            </div>
          </div>
        </div>

        <nav style={{ display: "flex", alignItems: "center", gap: 4 }} className="desktop-nav">
          {NAV_LINKS.map(link => (
            <a key={link.label} href={link.href} style={{
              fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.55)",
              padding: "8px 14px", borderRadius: 8, textDecoration: "none",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.55)"; e.currentTarget.style.background = "transparent"; }}
            >
              {link.label}
              {link.label === "More" && <span style={{ marginLeft: 4, fontSize: 9 }}>▾</span>}
            </a>
          ))}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <a href="/dashboard" style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.25)",
            borderRadius: 10, padding: "7px 14px",
            fontSize: 12, fontWeight: 700, color: "#D4AF37",
            textDecoration: "none", transition: "all 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(212,175,55,0.15)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(212,175,55,0.08)"; }}
          >
            <LayoutDashboard size={13}/>
            <span className="nav-dash-label">Hotel Login</span>
          </a>

          <button
            className="mobile-menu-btn"
            onClick={() => setMenuOpen(true)}
            style={{
              display: "none", width: 38, height: 38, borderRadius: 10,
              background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.18)",
              alignItems: "center", justifyContent: "center", cursor: "pointer",
            }}
          >
            <Menu size={17} style={{ color: "#D4AF37" }}/>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200 }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)" }} onClick={() => setMenuOpen(false)}/>
          <div style={{
            position: "absolute", top: 0, right: 0, bottom: 0, width: 260,
            background: "linear-gradient(180deg, #0c0f1a, #07090e)",
            borderLeft: "1px solid rgba(212,175,55,0.12)",
            padding: 20, display: "flex", flexDirection: "column", gap: 8,
          }}>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
              <button onClick={() => setMenuOpen(false)} style={{
                width: 32, height: 32, borderRadius: 8,
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
              }}>
                <X size={14} style={{ color: "rgba(255,255,255,0.4)" }}/>
              </button>
            </div>
            {NAV_LINKS.map(link => (
              <a key={link.label} href={link.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.7)",
                  padding: "12px 16px", borderRadius: 12, textDecoration: "none",
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                }}>
                {link.label}
              </a>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
          .nav-dash-label { display: none; }
        }
      `}</style>
    </header>
  );
}

// ── Footer ─────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{
      background: "rgba(3,5,10,0.98)",
      borderTop: "1px solid rgba(212,175,55,0.08)",
      padding: "20px",
    }}>
      <div style={{
        maxWidth: 1280, margin: "0 auto",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 12,
      }}>
        {[
          { icon: "🛡", text: "Network Security: Military Grade" },
          { icon: "🔒", text: "Payment Security: 100% Secure" },
          { icon: "🔐", text: "Data Protection: Encrypted" },
          { icon: "⊙", text: "Uptime: 99.99%", color: "#22c55e" },
        ].map(f => (
          <div key={f.text} style={{
            display: "flex", alignItems: "center", gap: 6,
            fontSize: 10, color: f.color || "rgba(255,255,255,0.3)", fontWeight: 500,
          }}>
            <span>{f.icon}</span>
            <span>{f.text}</span>
          </div>
        ))}
      </div>
    </footer>
  );
}

// ── Root Page ──────────────────────────────────────────────────────────────
export default function MarketplacePage() {
  // ── SHARED SEARCH STATE ──────────────────────────────────────
  // This is the bridge between HeroSearchSection and NegotiatorOrb.
  // When a user submits a search query from the Hero, it gets stored here,
  // NegotiatorOrb reads it on open and fires immediately without asking
  // generic questions.
  const [pendingSearchQuery, setPendingSearchQuery] = useState(null);
  const [orbForceOpen, setOrbForceOpen] = useState(false);

  // Called by HeroSearchSection when user submits a real query
  const handleHeroSearch = useCallback((queryText) => {
    setPendingSearchQuery(queryText);
    setOrbForceOpen(true);
  }, []);

  // Called by NegotiatorOrb once it has consumed the pending query
  const clearPendingQuery = useCallback(() => {
    setPendingSearchQuery(null);
    setOrbForceOpen(false);
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#07090E",
      color: "#fff",
      position: "relative",
      overflowX: "hidden",
    }}>
      {/* Layer 0: Neural particle canvas */}
      <NeuralCanvas />

      {/* Layer 1: Radial gradient overlays */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none",
        background: `
          radial-gradient(ellipse 80% 50% at 20% 20%, rgba(212,175,55,0.06) 0%, transparent 60%),
          radial-gradient(ellipse 60% 40% at 80% 80%, rgba(0,140,255,0.04) 0%, transparent 60%)
        `,
      }}/>

      {/* Layer 2: Content */}
      <div style={{ position: "relative", zIndex: 2 }}>
        <TopNav />
        <div style={{ paddingTop: 64 }}>
          {/* Pass the search handler down so HeroSearchSection can trigger the orb */}
          <HeroSearchSection onSearch={handleHeroSearch} />
          <AdvantageGrid />
          <MarketplaceHotels />
        </div>
        <Footer />
      </div>

      {/* Layer 3: Floating AI Negotiator orb — receives pending query */}
      <NegotiatorOrb
        pendingQuery={pendingSearchQuery}
        forceOpen={orbForceOpen}
        onQueryConsumed={clearPendingQuery}
      />
    </div>
  );
}
