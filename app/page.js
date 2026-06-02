"use client";
/**
 * app/page.js — The GuestInn Network: Marketplace Homepage
 * ═══════════════════════════════════════════════════════════════
 * Guest Discovery flow:
 *   1. User types query OR uses Voice Search
 *   2. Triggers /api/marketplace/search with query
 *   3. Renders matching property cards dynamically
 *   4. "View Hotel" → /booking/[hotelId]
 * ═══════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search, Mic, MicOff, MapPin, Star, Wifi, Car,
  X, ChevronRight, Zap, Crown, ShieldCheck, ArrowRight
} from "lucide-react";

// ── Amenity icon map ─────────────────────────────────────────
const AMENITY_ICON = {
  "free wi-fi":  "📶",
  "wi-fi":       "📶",
  "wifi":        "📶",
  "parking":     "🅿️",
  "ac rooms":    "❄️",
  "restaurant":  "🍽️",
  "pool":        "🏊",
  "gym":         "💪",
  "geyser":      "🚿",
  "café":        "☕",
  "bar":         "🍻",
  "lake view":   "🌊",
  "rooftop café":"☕",
  "butler":      "🤵",
};
function amenityIcon(a) { return AMENITY_ICON[a.toLowerCase()] || "✨"; }

// ── Skeleton card ────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:20, padding:16, overflow:"hidden", position:"relative" }}>
      <div style={{ position:"absolute", inset:0, background:"linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.03) 50%,transparent 100%)", backgroundSize:"200% 100%", animation:"shimmer 1.5s infinite" }} />
      <div style={{ height:14, background:"rgba(255,255,255,0.06)", borderRadius:8, marginBottom:8, width:"65%" }} />
      <div style={{ height:10, background:"rgba(255,255,255,0.04)", borderRadius:6, marginBottom:16, width:"45%" }} />
      <div style={{ display:"flex", gap:6, marginBottom:16 }}>
        {[60,80,70].map((w,i) => <div key={i} style={{ height:22, width:w, background:"rgba(255,255,255,0.04)", borderRadius:8 }} />)}
      </div>
      <div style={{ height:44, background:"rgba(255,255,255,0.04)", borderRadius:12 }} />
    </div>
  );
}

// ── Hotel card ───────────────────────────────────────────────
function HotelCard({ hotel, onBook }) {
  const [hovered, setHovered] = useState(false);
  const planBadge = hotel.plan === "enterprise" ? { label:"Enterprise", color:"#818cf8" }
                  : hotel.plan === "pro"        ? { label:"Pro",        color:"#D4AF37" }
                  : null;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered
          ? "linear-gradient(135deg,rgba(212,175,55,0.07),rgba(0,0,0,0.4))"
          : "rgba(255,255,255,0.025)",
        border:       `1px solid ${hovered?"rgba(212,175,55,0.3)":"rgba(255,255,255,0.06)"}`,
        borderRadius: 20,
        padding:      16,
        transition:   "all 0.2s ease",
        animation:    "fadeUp 0.35s ease",
        cursor:       "pointer",
      }}
      onClick={() => onBook(hotel.id)}
    >
      {/* Top row */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:44, height:44, borderRadius:12, background:"rgba(212,175,55,0.08)", border:"1px solid rgba(212,175,55,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>
            {hotel.emoji}
          </div>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <h3 style={{ fontSize:14, fontWeight:900, color:"#fff", lineHeight:1.2 }}>{hotel.name}</h3>
              {planBadge && (
                <span style={{ fontSize:8, padding:"2px 6px", borderRadius:5, background:`${planBadge.color}18`, border:`1px solid ${planBadge.color}44`, color:planBadge.color, fontWeight:800 }}>
                  {planBadge.label}
                </span>
              )}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:2 }}>
              <MapPin size={9} style={{ color:"#D4AF37", flexShrink:0 }} />
              <span style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>{hotel.location}</span>
            </div>
            {hotel.distanceTag && (
              <p style={{ fontSize:9, color:"rgba(255,255,255,0.25)", marginTop:1 }}>📍 {hotel.distanceTag}</p>
            )}
          </div>
        </div>
        <div style={{ textAlign:"right", flexShrink:0 }}>
          <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)" }}>from</p>
          <p style={{ fontSize:18, fontWeight:900, color:"#D4AF37", lineHeight:1 }}>
            ₹{(hotel.standardRate||1200).toLocaleString("en-IN")}
          </p>
          <p style={{ fontSize:8, color:"rgba(255,255,255,0.3)" }}>/raat</p>
        </div>
      </div>

      {/* Rating */}
      {hotel.avgRating > 0 && (
        <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:10 }}>
          {[1,2,3,4,5].map(s => (
            <Star key={s} size={10} fill={s <= Math.round(hotel.avgRating)?"#D4AF37":"transparent"} color="#D4AF37" />
          ))}
          <span style={{ fontSize:10, color:"rgba(255,255,255,0.5)", fontWeight:700 }}>{hotel.avgRating}</span>
          {hotel.totalReviews > 0 && (
            <span style={{ fontSize:9, color:"rgba(255,255,255,0.25)" }}>({hotel.totalReviews} reviews)</span>
          )}
        </div>
      )}

      {/* Amenities */}
      {hotel.amenities?.length > 0 && (
        <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:12 }}>
          {hotel.amenities.slice(0,5).map(a => (
            <span key={a} style={{ fontSize:10, padding:"3px 8px", borderRadius:7, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", color:"rgba(255,255,255,0.5)" }}>
              {amenityIcon(a)} {a}
            </span>
          ))}
        </div>
      )}

      {/* Room rates strip */}
      <div style={{ display:"flex", gap:6, marginBottom:12, overflowX:"auto", paddingBottom:2 }}>
        {[
          { label:"Standard", rate:hotel.standardRate||1200 },
          { label:"Deluxe",   rate:hotel.deluxeRate  ||2000 },
          { label:"Suite",    rate:hotel.suiteRate   ||3800 },
        ].map(rt => (
          <div key={rt.label} style={{ flexShrink:0, padding:"6px 10px", borderRadius:9, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", textAlign:"center" }}>
            <p style={{ fontSize:8, color:"rgba(255,255,255,0.3)", marginBottom:2 }}>{rt.label}</p>
            <p style={{ fontSize:11, fontWeight:800, color:"rgba(255,255,255,0.75)" }}>₹{rt.rate.toLocaleString("en-IN")}</p>
          </div>
        ))}
      </div>

      {/* Feature badges */}
      <div style={{ display:"flex", gap:6, marginBottom:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:4, padding:"4px 9px", borderRadius:7, background:"rgba(34,197,94,0.06)", border:"1px solid rgba(34,197,94,0.15)" }}>
          <ShieldCheck size={9} style={{ color:"#22c55e" }} />
          <span style={{ fontSize:9, color:"#22c55e", fontWeight:700 }}>0% Commission</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:4, padding:"4px 9px", borderRadius:7, background:"rgba(212,175,55,0.06)", border:"1px solid rgba(212,175,55,0.15)" }}>
          <Zap size={9} style={{ color:"#D4AF37" }} />
          <span style={{ fontSize:9, color:"#D4AF37", fontWeight:700 }}>AI Negotiate</span>
        </div>
        {hotel.totalRooms && (
          <div style={{ display:"flex", alignItems:"center", gap:4, padding:"4px 9px", borderRadius:7, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ fontSize:9, color:"rgba(255,255,255,0.4)", fontWeight:600 }}>{hotel.totalRooms} Rooms</span>
          </div>
        )}
      </div>

      {/* CTA */}
      <button
        onClick={e => { e.stopPropagation(); onBook(hotel.id); }}
        style={{
          width:     "100%",
          padding:   "12px",
          borderRadius:13,
          background:hovered
            ? "linear-gradient(135deg,#b8960c,#D4AF37,#F5C842)"
            : "rgba(212,175,55,0.1)",
          border:    `1px solid rgba(212,175,55,${hovered?0.8:0.25})`,
          color:     hovered ? "#000" : "#D4AF37",
          fontWeight:900, fontSize:13, cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center", gap:7,
          transition:"all 0.2s ease",
          boxShadow: hovered ? "0 4px 20px rgba(212,175,55,0.3)" : "none",
        }}
      >
        Hotel Dekho & Book Karo <ArrowRight size={14} />
      </button>
    </div>
  );
}

// ── Voice search hook ────────────────────────────────────────
function useVoiceSearch(onResult) {
  const [listening,  setListening]  = useState(false);
  const [supported,  setSupported]  = useState(false);
  const [transcript, setTranscript] = useState("");
  const srRef = useRef(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      setSupported(true);
      srRef.current = new SR();
      srRef.current.continuous   = false;
      srRef.current.interimResults= true;
      srRef.current.lang         = "hi-IN";
      srRef.current.onresult = e => {
        let interim = ""; let final = "";
        for (const r of e.results) {
          if (r.isFinal) final += r[0].transcript;
          else interim += r[0].transcript;
        }
        setTranscript(final || interim);
        if (final) { onResult(final); setListening(false); }
      };
      srRef.current.onend = () => setListening(false);
      srRef.current.onerror= () => setListening(false);
    }
  }, [onResult]);

  const toggle = useCallback(() => {
    if (!srRef.current) return;
    if (listening) { srRef.current.stop(); setListening(false); }
    else {
      setTranscript("");
      srRef.current.start();
      setListening(true);
    }
  }, [listening]);

  return { listening, supported, transcript, toggle };
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════
export default function HomePage() {
  const [query,         setQuery]        = useState("");
  const [hotels,        setHotels]       = useState([]);
  const [loading,       setLoading]      = useState(false);
  const [searched,      setSearched]     = useState(false);
  const [searchIntent,  setSearchIntent] = useState(null);
  const [activeCity,    setActiveCity]   = useState(null);
  const [showAll,       setShowAll]      = useState(false);
  const inputRef = useRef(null);

  const navigate = useCallback((path) => {
    window.location.href = path;
  }, []);

  // ── Search ───────────────────────────────────────────────
  const doSearch = useCallback(async (q) => {
    const searchQ = (q || query).trim();
    setLoading(true);
    setSearched(true);
    setShowAll(false);
    try {
      const res  = await fetch(`/api/marketplace/search?q=${encodeURIComponent(searchQ)}&limit=20`);
      const data = await res.json();
      if (data.success) {
        setHotels(data.results || []);
        setSearchIntent(data.intent || null);
      } else {
        setHotels([]);
      }
    } catch {
      setHotels([]);
    }
    setLoading(false);
  }, [query]);

  // ── Voice search ─────────────────────────────────────────
  const { listening, supported, transcript, toggle } = useVoiceSearch(useCallback((text) => {
    setQuery(text);
    doSearch(text);
  }, [doSearch]));

  useEffect(() => {
    if (transcript) setQuery(transcript);
  }, [transcript]);

  // ── Initial load — show featured hotels ──────────────────
  useEffect(() => { doSearch(""); }, []);

  // ── City quick filter ─────────────────────────────────────
  const filterByCity = useCallback((city) => {
    setActiveCity(city === activeCity ? null : city);
    setQuery(city === activeCity ? "" : city);
    doSearch(city === activeCity ? "" : city);
  }, [activeCity, doSearch]);

  const CITIES = ["Bhopal","Indore","Jaipur","Nagpur","Mumbai","Udaipur"];

  const visibleHotels = showAll ? hotels : hotels.slice(0, 6);

  return (
    <div style={{
      minHeight:   "100vh",
      background:  "#07090E",
      color:       "#fff",
      fontFamily:  "system-ui,-apple-system,sans-serif",
      paddingBottom:60,
    }}>
      <style>{`
        @keyframes fadeUp    { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer   { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes micPulse  { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.5)} 50%{box-shadow:0 0 0 12px rgba(239,68,68,0)} }
        @keyframes goldFlow  { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        input::placeholder   { color:rgba(255,255,255,0.25); }
        input:focus          { outline:none; border-color:rgba(212,175,55,0.5)!important; }
        ::-webkit-scrollbar  { height:3px; width:3px; }
        ::-webkit-scrollbar-thumb { background:rgba(212,175,55,0.15); border-radius:3px; }
      `}</style>

      {/* NAV */}
      <nav style={{
        position:    "sticky", top:0, zIndex:40,
        background:  "rgba(7,9,14,0.95)", backdropFilter:"blur(20px)",
        borderBottom:"1px solid rgba(255,255,255,0.05)",
        padding:     "12px 16px",
        display:     "flex", alignItems:"center", justifyContent:"space-between",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:9 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,#1a1400,#2d2200)", border:"1px solid rgba(212,175,55,0.3)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Crown size={16} style={{ color:"#D4AF37" }} />
          </div>
          <div>
            <p style={{ fontSize:14, fontWeight:900, color:"#fff", letterSpacing:"0.02em" }}>
              The GuestInn <span style={{ color:"#D4AF37" }}>Network</span>
            </p>
            <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)", letterSpacing:"0.08em" }}>PAN-INDIA · COMMISSION FREE</p>
          </div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <a href="/app" style={{ padding:"7px 13px", borderRadius:9, background:"rgba(212,175,55,0.08)", border:"1px solid rgba(212,175,55,0.2)", color:"#D4AF37", fontSize:11, fontWeight:700, textDecoration:"none" }}>
            Hotel Login
          </a>
        </div>
      </nav>

      {/* HERO */}
      <div style={{
        padding:    "32px 16px 20px",
        background: "linear-gradient(180deg,rgba(212,175,55,0.04) 0%,transparent 100%)",
        textAlign:  "center",
        borderBottom:"1px solid rgba(255,255,255,0.04)",
        marginBottom:20,
      }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"5px 12px", borderRadius:20, background:"rgba(212,175,55,0.08)", border:"1px solid rgba(212,175,55,0.2)", marginBottom:14 }}>
          <ShieldCheck size={11} style={{ color:"#22c55e" }} />
          <span style={{ fontSize:10, color:"#D4AF37", fontWeight:700, letterSpacing:"0.05em" }}>ZERO OTA COMMISSION · DIRECT BOOKING · AI RATE NEGOTIATION</span>
        </div>
        <h1 style={{ fontSize:26, fontWeight:900, color:"#fff", lineHeight:1.2, marginBottom:8, letterSpacing:"-0.02em" }}>
          Budget Hotels<br/>
          <span style={{
            background:    "linear-gradient(135deg,#D4AF37,#F5C842,#D4AF37)",
            backgroundSize:"200% 200%",
            WebkitBackgroundClip:"text",
            WebkitTextFillColor:"transparent",
            animation:     "goldFlow 4s ease-in-out infinite",
          }}>Sirf Best Rates</span>
        </h1>
        <p style={{ fontSize:12, color:"rgba(255,255,255,0.4)", lineHeight:1.6, maxWidth:320, margin:"0 auto 20px" }}>
          Directly book with verified hotels — no middleman charges, AI se negotiate karo aur rate lock karo.
        </p>

        {/* SEARCH BOX */}
        <div style={{ maxWidth:480, margin:"0 auto" }}>
          <div style={{
            display:     "flex",
            background:  "rgba(255,255,255,0.04)",
            border:      `1px solid ${listening?"rgba(239,68,68,0.5)":"rgba(255,255,255,0.1)"}`,
            borderRadius:16,
            overflow:    "hidden",
            transition:  "border-color 0.2s, box-shadow 0.2s",
            boxShadow:   listening ? "0 0 0 2px rgba(239,68,68,0.2)" : "none",
          }}>
            <div style={{ padding:"0 0 0 14px", display:"flex", alignItems:"center" }}>
              <Search size={15} style={{ color:"rgba(255,255,255,0.3)" }} />
            </div>
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && doSearch()}
              placeholder="City ya hotel dhundho... (Bhopal, Jaipur, Mumbai)"
              style={{
                flex:1, background:"transparent", border:"none",
                padding:"14px 12px", fontSize:13, color:"#fff",
                outline:"none", colorScheme:"dark",
              }}
            />
            {query && (
              <button onClick={() => { setQuery(""); doSearch(""); }}
                style={{ padding:"0 10px", background:"transparent", border:"none", color:"rgba(255,255,255,0.3)", cursor:"pointer" }}>
                <X size={13} />
              </button>
            )}
            {supported && (
              <button onClick={toggle}
                title={listening ? "Voice band karo" : "Voice se search karo"}
                style={{
                  padding:"0 12px",
                  background: listening ? "rgba(239,68,68,0.15)" : "transparent",
                  border:"none",
                  color:      listening ? "#ef4444" : "rgba(255,255,255,0.4)",
                  cursor:"pointer",
                  animation:  listening ? "micPulse 1.5s ease-in-out infinite" : "none",
                  transition: "all 0.2s",
                }}>
                {listening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
            )}
            <button
              onClick={() => doSearch()}
              disabled={loading}
              style={{
                padding:    "0 16px",
                background: "linear-gradient(135deg,#b8960c,#D4AF37)",
                border:     "none",
                color:      "#000",
                fontWeight: 800,
                fontSize:   12,
                cursor:     loading ? "not-allowed" : "pointer",
                opacity:    loading ? 0.7 : 1,
                transition: "opacity 0.2s",
              }}
            >
              {loading ? "..." : "Search"}
            </button>
          </div>

          {/* Voice transcript */}
          {listening && (
            <div style={{ marginTop:8, padding:"8px 12px", borderRadius:10, background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.2)", display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:7, height:7, borderRadius:"50%", background:"#ef4444", animation:"micPulse 1s infinite" }} />
              <span style={{ fontSize:11, color:"#ef9494" }}>
                {transcript || "Bol raha hoon... (Hindi/English)"}
              </span>
            </div>
          )}
        </div>

        {/* City quick filters */}
        <div style={{ display:"flex", gap:7, justifyContent:"center", flexWrap:"wrap", marginTop:14 }}>
          {CITIES.map(city => (
            <button key={city}
              onClick={() => filterByCity(city)}
              style={{
                padding:    "7px 13px",
                borderRadius:20,
                background: activeCity === city ? "rgba(212,175,55,0.15)" : "rgba(255,255,255,0.04)",
                border:     `1px solid ${activeCity===city?"rgba(212,175,55,0.4)":"rgba(255,255,255,0.08)"}`,
                color:      activeCity === city ? "#D4AF37" : "rgba(255,255,255,0.5)",
                fontSize:   11,
                fontWeight: 700,
                cursor:     "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      {/* RESULTS */}
      <div style={{ maxWidth:480, margin:"0 auto", padding:"0 16px" }}>

        {/* Intent context bar */}
        {searched && searchIntent && (
          <div style={{ padding:"8px 12px", borderRadius:10, background:"rgba(0,140,255,0.05)", border:"1px solid rgba(0,140,255,0.12)", marginBottom:12, display:"flex", alignItems:"center", gap:8, animation:"fadeUp 0.3s ease" }}>
            <span style={{ fontSize:18 }}>🧠</span>
            <div>
              <p style={{ fontSize:10, fontWeight:700, color:"#60b8ff" }}>AI Search Intent Detected</p>
              <p style={{ fontSize:9, color:"rgba(255,255,255,0.35)" }}>
                {[
                  searchIntent.city    && `City: ${searchIntent.city}`,
                  searchIntent.budget?.max && `Budget: ₹${searchIntent.budget.max}`,
                  searchIntent.amenities?.length > 0 && `Amenities: ${searchIntent.amenities.join(", ")}`,
                ].filter(Boolean).join(" · ") || "All hotels"}
              </p>
            </div>
          </div>
        )}

        {/* Results header */}
        {!loading && hotels.length > 0 && (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12, animation:"fadeUp 0.3s ease" }}>
            <p style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.35)", letterSpacing:"0.08em", textTransform:"uppercase" }}>
              {hotels.length} Hotels Milein
            </p>
            <p style={{ fontSize:9, color:"rgba(255,255,255,0.2)" }}>Direct booking · No commission</p>
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {[1,2,3].map(i => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* No results */}
        {!loading && searched && hotels.length === 0 && (
          <div style={{ textAlign:"center", padding:"40px 20px", animation:"fadeUp 0.3s ease" }}>
            <p style={{ fontSize:36, marginBottom:12 }}>🔍</p>
            <p style={{ fontSize:14, fontWeight:700, color:"rgba(255,255,255,0.5)", marginBottom:6 }}>Koi hotel nahi mila</p>
            <p style={{ fontSize:11, color:"rgba(255,255,255,0.25)", lineHeight:1.6 }}>
              Alag city ya query try karo — "Bhopal hotels", "Mumbai under ₹2000"
            </p>
            <button onClick={() => { setQuery(""); doSearch(""); }}
              style={{ marginTop:14, padding:"10px 18px", borderRadius:10, background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.25)", color:"#D4AF37", fontSize:12, fontWeight:700, cursor:"pointer" }}>
              Sab Hotels Dekho
            </button>
          </div>
        )}

        {/* Hotel cards */}
        {!loading && (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {visibleHotels.map(hotel => (
              <HotelCard key={hotel.id} hotel={hotel} onBook={id => navigate(`/booking/${id}`)} />
            ))}
          </div>
        )}

        {/* Show more */}
        {!loading && hotels.length > 6 && !showAll && (
          <button onClick={() => setShowAll(true)}
            style={{ width:"100%", marginTop:12, padding:"13px", borderRadius:14, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.5)", fontSize:12, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
            Aur {hotels.length - 6} Hotels Dekho <ChevronRight size={14} />
          </button>
        )}
      </div>

      {/* WHY GUESTINN */}
      <div style={{ maxWidth:480, margin:"28px auto 0", padding:"0 16px" }}>
        <p style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.25)", letterSpacing:"0.12em", textTransform:"uppercase", textAlign:"center", marginBottom:14 }}>Kyun GuestInn Network?</p>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
          {[
            { icon:"🏷️", title:"Rate Lock",         sub:"AI negotiate karo, rate lock ho jata hai" },
            { icon:"🚫", title:"Zero Commission",   sub:"Seedha hotel se baat, koi OTA fee nahi" },
            { icon:"⭐", title:"Reserved (Gold)",   sub:"Pending approval status — real-time alert" },
            { icon:"📱", title:"WhatsApp Alert",    sub:"Instant booking notification hotel ko" },
          ].map(f => (
            <div key={f.title} style={{ padding:"13px", borderRadius:14, background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.05)" }}>
              <span style={{ fontSize:20, display:"block", marginBottom:7 }}>{f.icon}</span>
              <p style={{ fontSize:11, fontWeight:800, color:"rgba(255,255,255,0.75)", marginBottom:3 }}>{f.title}</p>
              <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)", lineHeight:1.5 }}>{f.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ maxWidth:480, margin:"24px auto 0", padding:"14px 16px", borderTop:"1px solid rgba(255,255,255,0.04)", textAlign:"center" }}>
        <p style={{ fontSize:9, color:"rgba(255,255,255,0.18)", lineHeight:1.6 }}>
          The GuestInn Network · Pan-India Commission-Free Hotel Platform<br/>
          Direct bookings only · AI-powered rate negotiation · GRC compliance
        </p>
      </div>
    </div>
  );
}
