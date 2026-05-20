/**
 * app/booking/[hotelId]/page.js
 *
 * PUBLIC-FACING AI BOOKING PAGE
 * ─────────────────────────────────────────────────────────────
 * URL: yourapp.vercel.app/booking/[hotelId]
 * 
 * This page is shown to GUESTS (not staff).
 * Hotel owners share this link on GMB, WhatsApp, Instagram etc.
 *
 * Features:
 * ✅ Luxury hotel showcase (name, location, room types, rates)
 * ✅ Groq-powered AI chat agent (Hinglish, collects booking details)
 * ✅ Lead capture → stores to Supabase + notifies owner
 * ✅ No login required for guests
 * ✅ Staff login link hidden at bottom
 */

"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Send, MessageCircle, X, ChevronDown, MapPin, Phone, Star, Wifi, Car, Coffee, Shield } from "lucide-react";

/* ─── All known demo/alias IDs ──────────────────────────────── */
const DEMOS = [
  { id:"sunrise-jaipur",    name:"Hotel Sunrise",   location:"Jaipur, Rajasthan",      totalRooms:40,  plan:"pro",        emoji:"🏨" },
  { id:"hotel-sunrise",     name:"Hotel Sunrise",   location:"Jaipur, Rajasthan",      totalRooms:40,  plan:"pro",        emoji:"🏨" },
  { id:"grand-mumbai",      name:"The Grand Inn",   location:"Mumbai, Maharashtra",    totalRooms:120, plan:"enterprise", emoji:"🏩" },
  { id:"the-grand-inn",     name:"The Grand Inn",   location:"Mumbai, Maharashtra",    totalRooms:120, plan:"enterprise", emoji:"🏩" },
  { id:"saffron-ahmedabad", name:"Saffron Stays",   location:"Ahmedabad, Gujarat",     totalRooms:25,  plan:"free",       emoji:"🏪" },
  { id:"saffron-stays",     name:"Saffron Stays",   location:"Ahmedabad, Gujarat",     totalRooms:25,  plan:"free",       emoji:"🏪" },
  { id:"cherry-bhopal",     name:"Hotel Cherry",    location:"Bhopal, Madhya Pradesh", totalRooms:20,  plan:"pro",        emoji:"🍒" },
  { id:"hotel-cherry",      name:"Hotel Cherry",    location:"Bhopal, Madhya Pradesh", totalRooms:20,  plan:"pro",        emoji:"🍒" },
];

/* ─── Supabase direct fetch ──────────────────────────────────── */
async function fetchHotel(hotelId) {
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const mapRow = h => ({
    id: h.id, name: h.name, location: h.location,
    totalRooms: h.total_rooms || h.totalRooms || 20,
    plan: h.plan || "starter", emoji: h.emoji || "🏨",
    ownerPhone: h.owner_phone || "",
  });

  // 1. Supabase — exact ID match
  if (sbUrl && sbKey && sbUrl !== "undefined") {
    try {
      const res = await fetch(
        `${sbUrl}/rest/v1/hotels?id=eq.${encodeURIComponent(hotelId)}&select=id,name,location,total_rooms,plan,emoji,owner_phone`,
        { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data?.length > 0) return mapRow(data[0]);
      }
    } catch {}

    // 1b. Supabase — search by name (fuzzy: "hotel-cherry" → "Hotel Cherry")
    try {
      const nameGuess = hotelId
        .replace(/-/g, " ")
        .replace(/\b\w/g, c => c.toUpperCase());
      const res2 = await fetch(
        `${sbUrl}/rest/v1/hotels?name=ilike.*${encodeURIComponent(nameGuess.split(" ").pop())}*&select=id,name,location,total_rooms,plan,emoji,owner_phone`,
        { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } }
      );
      if (res2.ok) {
        const data2 = await res2.json();
        if (data2?.length > 0) return mapRow(data2[0]);
      }
    } catch {}

    // 1c. Supabase — fetch ALL and match name loosely
    try {
      const res3 = await fetch(
        `${sbUrl}/rest/v1/hotels?select=id,name,location,total_rooms,plan,emoji,owner_phone`,
        { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } }
      );
      if (res3.ok) {
        const all = await res3.json();
        if (all?.length > 0) {
          // Match: hotelId slug matches any word in hotel name
          const slug = hotelId.toLowerCase().replace(/-/g, "");
          const found = all.find(h => {
            const nameSlug = h.name.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "");
            const idSlug   = h.id.toLowerCase().replace(/-/g, "");
            return nameSlug.includes(slug) || idSlug.includes(slug) || slug.includes(idSlug.slice(0,6));
          });
          if (found) return mapRow(found);
        }
      }
    } catch {}
  }

  // 2. localStorage — exact
  try {
    const cached = localStorage.getItem(`air_${hotelId}_config`);
    if (cached) return JSON.parse(cached);
  } catch {}

  // 3. localStorage registry — fuzzy match
  try {
    const registry = JSON.parse(localStorage.getItem("gi_hotel_registry") || "[]");
    const cache    = JSON.parse(localStorage.getItem("gi_hotel_registry_cache") || "[]");
    const slug = hotelId.toLowerCase().replace(/-/g, "");
    const allLocal = [...registry, ...cache];
    const found = allLocal.find(h => {
      const idSlug   = (h.id   ||"").toLowerCase().replace(/-/g,"");
      const nameSlug = (h.name ||"").toLowerCase().replace(/\s+/g,"");
      return idSlug === slug || nameSlug.includes(slug) || slug.includes(idSlug.slice(0,6));
    });
    if (found) return found;
  } catch {}

  // 4. Demo list — exact then fuzzy
  const slug = hotelId.toLowerCase().replace(/-/g, "");
  return DEMOS.find(h => h.id === hotelId)
      || DEMOS.find(h => h.id.replace(/-/g,"") === slug)
      || DEMOS.find(h => h.name.toLowerCase().replace(/\s+/g,"").includes(slug))
      || null;
}

/* ─── Save lead to Supabase ──────────────────────────────────── */
async function saveLead(hotelId, lead) {
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!sbUrl || !sbKey || sbUrl === "undefined") return;
  try {
    await fetch(`${sbUrl}/rest/v1/leads`, {
      method: "POST",
      headers: {
        apikey: sbKey, Authorization: `Bearer ${sbKey}`,
        "Content-Type": "application/json", Prefer: "return=minimal",
      },
      body: JSON.stringify({
        hotel_id:       hotelId,
        guest_name:     lead.name     || "",
        guest_phone:    lead.phone    || "",
        check_in_date:  lead.checkIn  || "",
        check_out_date: lead.checkOut || "",
        room_type:      lead.roomType || "",
        message:        lead.message  || "",
        created_at:     new Date().toISOString(),
        status:         "new",
      }),
    });
  } catch {}
}

const ROOM_TYPES = [
  { type:"Standard", icon:"🛏",  price:1500, desc:"Cozy room with all essentials",    amenities:["AC","TV","WiFi","Geyser"] },
  { type:"Deluxe",   icon:"🛎",  price:2500, desc:"Spacious room with premium view",  amenities:["AC","TV","WiFi","Mini Bar","Geyser"] },
  { type:"Suite",    icon:"👑",  price:4500, desc:"Luxury suite with sitting lounge", amenities:["AC","55\" TV","WiFi","Mini Bar","Jacuzzi","Butler"] },
];

const AMENITY_ICONS = { "AC":"❄️","TV":"📺","WiFi":"📶","Mini Bar":"🍹","Geyser":"🚿","Jacuzzi":"🛁","Butler":"🤵","55\" TV":"📺" };

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════ */
export default function PublicBookingPage() {
  const { hotelId } = useParams();
  const [hotel,       setHotel]      = useState(null);
  const [loading,     setLoading]    = useState(true);
  const [chatOpen,    setChatOpen]   = useState(false);
  const [messages,    setMessages]   = useState([]);
  const [input,       setInput]      = useState("");
  const [chatLoading, setChatLoading]= useState(false);
  const [lead,        setLead]       = useState({});
  const [leadSaved,   setLeadSaved]  = useState(false);
  const [selRoom,     setSelRoom]    = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (!hotelId) { setLoading(false); return; }
    fetchHotel(hotelId).then(h => { setHotel(h); setLoading(false); });
  }, [hotelId]);

  // Open chat with welcome message
  useEffect(() => {
    if (chatOpen && messages.length === 0 && hotel) {
      setMessages([{
        role: "assistant",
        content: `Namaste! 🙏 Welcome to **${hotel.name}**!\n\nMain aapka AI receptionist hoon. Main aapki help kar sakta hoon:\n• 🛏 Room booking\n• 💰 Rates & availability\n• 📍 Location & directions\n• ❓ Koi bhi sawaal\n\nAap kya janana chahte hain?`,
        time: new Date(),
      }]);
    }
  }, [chatOpen, hotel]);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || chatLoading) return;
    setInput("");

    const userMsg = { role: "user", content: text, time: new Date() };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setChatLoading(true);

    try {
      const hotelConfig = {
        name:     hotel?.name || "The GuestInn",
        location: hotel?.location || "India",
        rates:    { standard: 1500, deluxe: 2500, suite: 4500 },
      };

      const res = await fetch("/api/groq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "chat",
          hotelConfig,
          messages: newMsgs.map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      const reply = data.message || "Kuch problem aa gayi. Dobara try karo.";

      setMessages(prev => [...prev, { role: "assistant", content: reply, time: new Date() }]);

      // Extract lead data from conversation
      const extractedLead = extractLeadFromConversation(text, reply, lead);
      if (Object.keys(extractedLead).length > Object.keys(lead).length) {
        setLead(extractedLead);
        // Save if we have name + phone
        if (extractedLead.name && extractedLead.phone && !leadSaved) {
          saveLead(hotelId, { ...extractedLead, message: text });
          setLeadSaved(true);
        }
      }
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Network problem hai. Thodi der baad try karo. 🙏",
        time: new Date(),
      }]);
    }
    setChatLoading(false);
  };

  if (loading) return <LoadingScreen />;
  if (!hotel)  return <NotFound hotelId={hotelId} />;

  return (
    <div style={{ background:"#07090E", minHeight:"100vh", color:"#fff", fontFamily:"'Outfit', system-ui, sans-serif" }}>
      <style>{CSS}</style>

      {/* ══ HERO HEADER ══ */}
      <div style={{
        background: "linear-gradient(160deg,#0d1525 0%,#07090E 100%)",
        borderBottom: "1px solid rgba(212,175,55,0.15)",
        padding: "0 16px",
      }}>
        {/* Top bar */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 0 10px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:32 }}>{hotel.emoji || "🏨"}</span>
            <div>
              <h1 style={{ fontSize:18, fontWeight:900, color:"#fff", letterSpacing:"-0.02em", lineHeight:1.1 }}>
                {hotel.name}
              </h1>
              <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:2, display:"flex", alignItems:"center", gap:3 }}>
                <MapPin size={9}/> {hotel.location}
              </p>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{
              display:"flex", alignItems:"center", gap:4,
              padding:"4px 8px", borderRadius:20,
              background:"rgba(34,197,94,0.12)", border:"1px solid rgba(34,197,94,0.3)",
            }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:"#22c55e", animation:"pulseDot 1.5s infinite" }}/>
              <span style={{ fontSize:9, fontWeight:700, color:"#22c55e" }}>AVAILABLE</span>
            </div>
          </div>
        </div>

        {/* Rating strip */}
        <div style={{ display:"flex", gap:16, padding:"10px 0 14px", overflowX:"auto" }}>
          {[
            { icon:<Star size={12} fill="#D4AF37"/>,  text:"4.8 Rating" },
            { icon:<Wifi size={12}/>,                  text:"Free WiFi" },
            { icon:<Car size={12}/>,                   text:"Free Parking" },
            { icon:<Coffee size={12}/>,                text:"Breakfast" },
            { icon:<Shield size={12}/>,                text:"Safe Stay" },
          ].map(a => (
            <div key={a.text} style={{
              display:"flex", alignItems:"center", gap:5, flexShrink:0,
              padding:"5px 10px", borderRadius:20,
              background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)",
              color:"rgba(255,255,255,0.6)", fontSize:11, fontWeight:500,
            }}>
              <span style={{ color:"#D4AF37" }}>{a.icon}</span>
              {a.text}
            </div>
          ))}
        </div>
      </div>

      {/* ══ ROOM CARDS ══ */}
      <div style={{ padding:"20px 16px 0" }}>
        <p style={{ fontSize:11, fontWeight:700, letterSpacing:"0.12em", color:"rgba(255,255,255,0.35)", textTransform:"uppercase", marginBottom:12 }}>
          Available Rooms
        </p>

        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {ROOM_TYPES.map(room => (
            <div key={room.type}
              onClick={() => { setSelRoom(room); setChatOpen(true); }}
              style={{
                borderRadius:18, padding:"14px 16px",
                background: selRoom?.type === room.type
                  ? "linear-gradient(135deg,rgba(212,175,55,0.12),rgba(212,175,55,0.05))"
                  : "rgba(255,255,255,0.04)",
                border: selRoom?.type === room.type
                  ? "1px solid rgba(212,175,55,0.4)"
                  : "1px solid rgba(255,255,255,0.08)",
                cursor:"pointer", transition:"all .2s ease",
              }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{
                    width:44, height:44, borderRadius:12,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:22,
                    background:"rgba(255,255,255,0.06)",
                    border:"1px solid rgba(255,255,255,0.1)",
                  }}>{room.icon}</div>
                  <div>
                    <p style={{ fontWeight:800, fontSize:15, color:"#fff" }}>{room.type} Room</p>
                    <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:1 }}>{room.desc}</p>
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <p style={{
                    fontWeight:900, fontSize:18, color:"#D4AF37", letterSpacing:"-0.02em",
                    filter:"drop-shadow(0 0 6px rgba(212,175,55,0.4))",
                  }}>₹{room.price.toLocaleString("en-IN")}</p>
                  <p style={{ fontSize:10, color:"rgba(255,255,255,0.3)" }}>per night</p>
                </div>
              </div>

              {/* Amenities */}
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {room.amenities.map(a => (
                  <span key={a} style={{
                    fontSize:10, padding:"3px 8px", borderRadius:20,
                    background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.08)",
                    color:"rgba(255,255,255,0.5)",
                  }}>
                    {AMENITY_ICONS[a] || "✓"} {a}
                  </span>
                ))}
              </div>

              <div style={{
                marginTop:10, padding:"8px 12px", borderRadius:10,
                background: "linear-gradient(135deg,#b8960c,#D4AF37,#F5C842)",
                textAlign:"center", fontWeight:800, fontSize:12, color:"#000",
              }}>
                Chat to Book →
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ LOCATION ══ */}
      <div style={{ padding:"20px 16px 0" }}>
        <div style={{
          borderRadius:18, padding:"14px 16px",
          background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)",
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
            <MapPin size={14} style={{ color:"#D4AF37" }}/>
            <span style={{ fontWeight:700, fontSize:13, color:"#fff" }}>Location</span>
          </div>
          <p style={{ fontSize:12, color:"rgba(255,255,255,0.5)", marginBottom:10 }}>📍 {hotel.location}</p>
          <a href={`https://www.google.com/maps/search/${encodeURIComponent(hotel.name + " " + hotel.location)}`}
            target="_blank" rel="noopener noreferrer"
            style={{
              display:"block", textAlign:"center", padding:"9px",
              borderRadius:10, fontSize:12, fontWeight:700,
              background:"rgba(0,112,243,0.12)", border:"1px solid rgba(0,112,243,0.3)",
              color:"#60a5fa", textDecoration:"none",
            }}>
            📍 Google Maps pe Dekho
          </a>
        </div>
      </div>

      {/* ══ STAFF LOGIN LINK (hidden at bottom) ══ */}
      <div style={{ padding:"20px 16px 100px", textAlign:"center" }}>
        <p style={{ fontSize:10, color:"rgba(255,255,255,0.15)", marginBottom:4 }}>
          Powered by The GuestInn AI
        </p>
        <a href={`/h/${hotelId}`}
          style={{ fontSize:10, color:"rgba(255,255,255,0.12)", textDecoration:"none" }}>
          Staff Login →
        </a>
      </div>

      {/* ══ FLOATING CHAT BUTTON ══ */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          style={{
            position:"fixed", bottom:24, right:20, zIndex:50,
            width:60, height:60, borderRadius:"50%", border:"none",
            background:"linear-gradient(135deg,#0050c8,#0070F3)",
            boxShadow:"0 0 0 6px rgba(0,112,243,0.12), 0 0 30px rgba(0,112,243,0.5), 0 8px 20px rgba(0,0,0,0.4)",
            display:"flex", alignItems:"center", justifyContent:"center",
            cursor:"pointer", animation:"chatPulse 3s ease infinite",
          }}>
          <MessageCircle size={26} color="#fff" fill="rgba(255,255,255,0.2)"/>
        </button>
      )}

      {/* ══ CHAT PANEL ══ */}
      {chatOpen && (
        <div style={{
          position:"fixed", bottom:0, left:0, right:0, zIndex:50,
          height:"75vh",
          background:"linear-gradient(180deg,#0d1020,#080a14)",
          border:"1px solid rgba(0,112,243,0.2)", borderBottom:"none",
          borderRadius:"24px 24px 0 0",
          display:"flex", flexDirection:"column",
          boxShadow:"0 -10px 60px rgba(0,0,0,0.7)",
        }}>
          {/* Chat header */}
          <div style={{
            display:"flex", alignItems:"center", gap:12,
            padding:"14px 16px", borderBottom:"1px solid rgba(255,255,255,0.07)",
            flexShrink:0,
          }}>
            <div style={{
              width:40, height:40, borderRadius:"50%",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:20,
              background:"linear-gradient(135deg,#001030,#001a4a)",
              border:"2px solid rgba(0,112,243,0.4)",
              boxShadow:"0 0 12px rgba(0,112,243,0.3)",
            }}>👩‍💼</div>
            <div style={{ flex:1 }}>
              <p style={{ fontWeight:800, fontSize:14, color:"#fff", lineHeight:1 }}>AI Receptionist</p>
              <p style={{ fontSize:11, color:"#22c55e", marginTop:2 }}>● Online — {hotel.name}</p>
            </div>
            <button onClick={() => setChatOpen(false)} style={{
              width:32, height:32, borderRadius:10, border:"none",
              background:"rgba(255,255,255,0.07)", color:"rgba(255,255,255,0.5)",
              display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer",
            }}>
              <X size={16}/>
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex:1, overflowY:"auto", padding:"12px 14px", display:"flex", flexDirection:"column", gap:10 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display:"flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              }}>
                <div style={{
                  maxWidth:"82%", padding:"10px 14px", borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  background: msg.role === "user"
                    ? "linear-gradient(135deg,#b8960c,#D4AF37)"
                    : "rgba(255,255,255,0.06)",
                  border: msg.role === "assistant" ? "1px solid rgba(255,255,255,0.08)" : "none",
                  color: msg.role === "user" ? "#000" : "#fff",
                  fontSize:13, lineHeight:1.55, fontWeight: msg.role === "user" ? 600 : 400,
                }}>
                  {/* Render markdown bold */}
                  {msg.content.split("**").map((part, j) =>
                    j % 2 === 1 ? <strong key={j}>{part}</strong> : <span key={j}>{part}</span>
                  )}
                </div>
              </div>
            ))}

            {chatLoading && (
              <div style={{ display:"flex", gap:5, padding:"10px 14px" }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{
                    width:8, height:8, borderRadius:"50%", background:"rgba(0,112,243,0.6)",
                    animation:`typingDot 1.2s ease ${i*0.2}s infinite`,
                  }}/>
                ))}
              </div>
            )}
            <div ref={chatEndRef}/>
          </div>

          {/* Quick reply chips */}
          {messages.length <= 2 && (
            <div style={{ display:"flex", gap:6, padding:"0 14px 8px", overflowX:"auto", flexShrink:0 }}>
              {[
                "Room book karna hai",
                "Rates kya hain?",
                selRoom ? `${selRoom.type} room chahiye` : "Availability check karo",
                "Location bataiye",
              ].map(q => (
                <button key={q} onClick={() => { setInput(q); setTimeout(() => sendMessage(), 10); }}
                  style={{
                    flexShrink:0, padding:"6px 12px", borderRadius:20, border:"none",
                    background:"rgba(0,112,243,0.12)", border:"1px solid rgba(0,112,243,0.3)",
                    color:"#60a5fa", fontSize:11, fontWeight:600, cursor:"pointer",
                  }}>
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{
            display:"flex", gap:8, padding:"10px 14px 14px",
            borderTop:"1px solid rgba(255,255,255,0.06)", flexShrink:0,
          }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder="Message likhein..."
              style={{
                flex:1, padding:"12px 14px", borderRadius:14, border:"1px solid rgba(255,255,255,0.1)",
                background:"rgba(255,255,255,0.06)", color:"#fff", fontSize:13,
                outline:"none",
              }}
            />
            <button onClick={sendMessage} disabled={!input.trim() || chatLoading}
              style={{
                width:44, height:44, borderRadius:12, border:"none", flexShrink:0,
                background: input.trim() && !chatLoading
                  ? "linear-gradient(135deg,#0050c8,#0070F3)"
                  : "rgba(255,255,255,0.05)",
                display:"flex", alignItems:"center", justifyContent:"center",
                cursor: input.trim() ? "pointer" : "default",
                boxShadow: input.trim() ? "0 0 16px rgba(0,112,243,0.4)" : "none",
              }}>
              <Send size={18} color={input.trim() ? "#fff" : "#333"}/>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Extract lead data from conversation ────────────────────── */
function extractLeadFromConversation(userText, aiReply, existing) {
  const lead = { ...existing };
  const text = userText.toLowerCase();

  // Phone number (10 digits)
  const phoneMatch = userText.match(/[6-9]\d{9}/);
  if (phoneMatch) lead.phone = phoneMatch[0];

  // Name hints
  const nameMatch = userText.match(/(?:mera naam|my name is|main|naam)\s+([A-Za-z]+)/i);
  if (nameMatch) lead.name = nameMatch[1];

  // Dates
  const dateMatch = userText.match(/(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/);
  if (dateMatch && !lead.checkIn) lead.checkIn = userText.match(/\d{1,2}[\/\-]\d{1,2}/)?.[0];

  // Room type
  if (text.includes("suite"))    lead.roomType = "Suite";
  if (text.includes("deluxe"))   lead.roomType = "Deluxe";
  if (text.includes("standard")) lead.roomType = "Standard";

  lead.message = userText;
  return lead;
}

/* ─── Sub-components ─────────────────────────────────────────── */
function LoadingScreen() {
  return (
    <div style={{
      height:"100vh", display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", gap:16,
      background:"#07090E",
    }}>
      <div style={{
        width:44, height:44, borderRadius:"50%",
        border:"2px solid rgba(212,175,55,0.2)",
        borderTopColor:"#D4AF37", animation:"spin 1s linear infinite",
      }}/>
      <p style={{ fontSize:13, color:"rgba(255,255,255,0.4)" }}>Hotel load ho raha hai...</p>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function NotFound({ hotelId }) {
  return (
    <div style={{
      height:"100vh", display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", gap:12, padding:"0 24px",
      background:"#07090E", textAlign:"center",
    }}>
      <span style={{ fontSize:48 }}>🏚️</span>
      <h2 style={{ fontSize:22, fontWeight:900, color:"#fff", margin:0 }}>Hotel Nahi Mila</h2>
      <p style={{ fontSize:13, color:"rgba(255,255,255,0.4)" }}>Yeh link sahi nahi hai.</p>
      <code style={{
        fontSize:11, padding:"6px 14px", borderRadius:8,
        background:"rgba(255,255,255,0.05)", color:"rgba(255,255,255,0.3)",
        fontFamily:"monospace",
      }}>{hotelId}</code>
      <a href="/" style={{
        marginTop:8, padding:"11px 24px", borderRadius:14,
        background:"linear-gradient(135deg,#b8960c,#D4AF37)", color:"#000",
        fontWeight:800, fontSize:13, textDecoration:"none",
      }}>Home Pe Jaao</a>
    </div>
  );
}

/* ─── Embedded CSS ───────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  ::-webkit-scrollbar { width: 3px; height: 3px; }
  ::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.2); border-radius: 3px; }

  @keyframes pulseDot {
    0%,100%{opacity:1;transform:scale(1)}
    50%{opacity:.5;transform:scale(.7)}
  }
  @keyframes chatPulse {
    0%,100%{box-shadow:0 0 0 6px rgba(0,112,243,0.12),0 0 30px rgba(0,112,243,0.5),0 8px 20px rgba(0,0,0,0.4)}
    50%{box-shadow:0 0 0 10px rgba(0,112,243,0.06),0 0 50px rgba(0,112,243,0.7),0 8px 20px rgba(0,0,0,0.4)}
  }
  @keyframes typingDot {
    0%,60%,100%{transform:translateY(0);opacity:.4}
    30%{transform:translateY(-6px);opacity:1}
  }
  @keyframes spin {
    from{transform:rotate(0deg)} to{transform:rotate(360deg)}
  }
`;
