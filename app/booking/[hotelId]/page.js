/**
 * app/booking/[hotelId]/page.js
 * PUBLIC GUEST BOOKING PAGE — Premium UI matching reference image
 * Working: Room booking, Calendar picker, AI chatbot, Lead capture, Supabase sync
 */
"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { ChevronLeft, ChevronRight, ChevronDown, Users, Bed, Wifi, X, Send, Check } from "lucide-react";

/* ════════════════════════════════════════════════════════════
   HOTEL FETCH (Supabase + localStorage + demo fallback)
════════════════════════════════════════════════════════════ */
const DEMOS = [
  { id:"sunrise-jaipur",    name:"Hotel Sunrise",   subtitle:"HERITAGE COMFORT. PINK CITY MAGIC.",      location:"Jaipur, Rajasthan",      totalRooms:40,  emoji:"🏨", phone:"+91 98111 11111" },
  { id:"hotel-sunrise",     name:"Hotel Sunrise",   subtitle:"HERITAGE COMFORT. PINK CITY MAGIC.",      location:"Jaipur, Rajasthan",      totalRooms:40,  emoji:"🏨", phone:"+91 98111 11111" },
  { id:"grand-mumbai",      name:"The Grand Inn",   subtitle:"URBAN LUXURY. BUSINESS EXCELLENCE.",      location:"Mumbai, Maharashtra",    totalRooms:120, emoji:"🏩", phone:"+91 98222 22222" },
  { id:"the-grand-inn",     name:"The Grand Inn",   subtitle:"URBAN LUXURY. BUSINESS EXCELLENCE.",      location:"Mumbai, Maharashtra",    totalRooms:120, emoji:"🏩", phone:"+91 98222 22222" },
  { id:"saffron-ahmedabad", name:"Saffron Stays",   subtitle:"AFFORDABLE COMFORT. WARM HOSPITALITY.",   location:"Ahmedabad, Gujarat",     totalRooms:25,  emoji:"🏪", phone:"+91 98333 33333" },
  { id:"saffron-stays",     name:"Saffron Stays",   subtitle:"AFFORDABLE COMFORT. WARM HOSPITALITY.",   location:"Ahmedabad, Gujarat",     totalRooms:25,  emoji:"🏪", phone:"+91 98333 33333" },
  { id:"cherry-bhopal",     name:"Hotel Cherry",    subtitle:"BOUTIQUE COMFORT. TIMELESS HOSPITALITY.", location:"Bhopal, Madhya Pradesh", totalRooms:20,  emoji:"🍒", phone:"+91 98444 44444" },
  { id:"hotel-cherry",      name:"Hotel Cherry",    subtitle:"BOUTIQUE COMFORT. TIMELESS HOSPITALITY.", location:"Bhopal, Madhya Pradesh", totalRooms:20,  emoji:"🍒", phone:"+91 98444 44444" },
];

async function fetchHotel(hotelId) {
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const mapRow = h => ({ id:h.id, name:h.name, subtitle:h.subtitle||"AI-POWERED HOTEL.",
    location:h.location, totalRooms:h.total_rooms||h.totalRooms||20,
    emoji:h.emoji||"🏨", phone:h.owner_phone||h.phone||"" });

  if (sbUrl && sbKey && sbUrl !== "undefined") {
    try {
      const r = await fetch(`${sbUrl}/rest/v1/hotels?id=eq.${encodeURIComponent(hotelId)}&select=*`,
        { headers:{ apikey:sbKey, Authorization:`Bearer ${sbKey}` } });
      if (r.ok) { const d = await r.json(); if (d?.length) return mapRow(d[0]); }
      const r2 = await fetch(`${sbUrl}/rest/v1/hotels?select=*`,
        { headers:{ apikey:sbKey, Authorization:`Bearer ${sbKey}` } });
      if (r2.ok) {
        const all = await r2.json();
        const slug = hotelId.toLowerCase().replace(/-/g,"");
        const found = all?.find(h => {
          const ns = h.name.toLowerCase().replace(/\s+/g,"").replace(/[^a-z0-9]/g,"");
          const is = h.id.toLowerCase().replace(/-/g,"");
          return ns.includes(slug)||is.includes(slug)||slug.includes(ns.slice(0,5));
        });
        if (found) return mapRow(found);
      }
    } catch {}
  }
  try {
    const c = localStorage.getItem(`air_${hotelId}_config`);
    if (c) return JSON.parse(c);
    const reg = JSON.parse(localStorage.getItem("gi_hotel_registry")||"[]");
    const slug = hotelId.toLowerCase().replace(/-/g,"");
    const found = reg.find(h=>(h.id||"").toLowerCase().replace(/-/g,"")===slug || (h.name||"").toLowerCase().replace(/\s+/g,"").includes(slug));
    if (found) return found;
  } catch {}
  const slug = hotelId.toLowerCase().replace(/-/g,"");
  return DEMOS.find(h=>h.id===hotelId) || DEMOS.find(h=>h.id.replace(/-/g,"")===slug) ||
    DEMOS.find(h=>h.name.toLowerCase().replace(/\s+/g,"").includes(slug)) || null;
}

async function saveLead(hotelId, lead) {
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!sbUrl||!sbKey||sbUrl==="undefined") return;
  try {
    await fetch(`${sbUrl}/rest/v1/leads`,{
      method:"POST",
      headers:{ apikey:sbKey, Authorization:`Bearer ${sbKey}`, "Content-Type":"application/json", Prefer:"return=minimal" },
      body:JSON.stringify({ hotel_id:hotelId, guest_name:lead.name||"", guest_phone:lead.phone||"",
        check_in_date:lead.checkIn||"", check_out_date:lead.checkOut||"", room_type:lead.roomType||"",
        message:lead.message||"", status:"new", created_at:new Date().toISOString() }),
    });
  } catch {}
}

async function saveBookingToSupabase(hotelId, booking) {
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!sbUrl||!sbKey||sbUrl==="undefined") return null;
  try {
    const id = `pub_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
    const nights = booking.checkIn && booking.checkOut
      ? Math.max(1, Math.ceil((new Date(booking.checkOut)-new Date(booking.checkIn))/86400000))
      : 1;
    const res = await fetch(`${sbUrl}/rest/v1/bookings`,{
      method:"POST",
      headers:{ apikey:sbKey, Authorization:`Bearer ${sbKey}`, "Content-Type":"application/json", Prefer:"return=minimal" },
      body:JSON.stringify({
        id, hotel_id:hotelId,
        guest_name:booking.name||"", guest_phone:booking.phone||"",
        room_type:booking.roomType||"standard",
        check_in_date:booking.checkIn||"", check_out_date:booking.checkOut||"",
        nights, rate_per_night:booking.rate||1500,
        total_amount:(booking.rate||1500)*nights,
        payment_mode:"Pay at Hotel", status:"reserved",
        rate_locked:true, created_at:new Date().toISOString(),
      }),
    });
    return res.ok ? id : null;
  } catch { return null; }
}

/* ════════════════════════════════════════════════════════════
   ROOM TYPES CONFIG
════════════════════════════════════════════════════════════ */
const ROOM_TYPES = [
  { type:"Deluxe",   slug:"deluxe",   rate:1999, guests:2, bed:"1 King Bed",  desc:"Elegant comfort for a relaxed stay.",     img:"https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&q=80" },
  { type:"Premium",  slug:"premium",  rate:2499, guests:2, bed:"1 King Bed",  desc:"Extra space. Elevated experience.",        img:"https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400&q=80" },
  { type:"Executive Suite", slug:"suite", rate:3499, guests:2, bed:"1 King Bed", desc:"Separate living area. Pure luxury.",   img:"https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=400&q=80" },
  { type:"Family",   slug:"family",   rate:2799, guests:4, bed:"2 Queen Beds",desc:"Perfect for families. Stay together.",    img:"https://images.unsplash.com/photo-1631049552057-403cdb8f0658?w=400&q=80" },
];

const FAQS = [
  { q:"What is the check-in and check-out time?", a:"Check-in: 12:00 PM onwards. Check-out: 11:00 AM. Early check-in/late check-out available on request." },
  { q:"Is breakfast included in the room rate?",  a:"Complimentary breakfast is included with Deluxe and above rooms. Standard rooms can add breakfast for ₹299/person." },
  { q:"What is your cancellation policy?",        a:"Free cancellation up to 24 hours before check-in. After that, 1 night charge applies. No-show: full booking amount." },
  { q:"Do you offer airport pick-up services?",   a:"Yes! Airport transfers are available at extra cost. Please contact us 24 hours in advance to arrange pickup." },
];

/* ════════════════════════════════════════════════════════════
   CALENDAR HELPERS
════════════════════════════════════════════════════════════ */
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS   = ["SUN","MON","TUE","WED","THU","FRI","SAT"];

function getDaysInMonth(y, m) { return new Date(y, m+1, 0).getDate(); }
function getFirstDay(y, m)    { return new Date(y, m, 1).getDay(); }
function dateStr(y, m, d)     { return `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`; }
function formatDisplay(str)   {
  if (!str) return "";
  const [y,m,d] = str.split("-");
  return `${d} ${MONTHS[parseInt(m)-1]?.slice(0,3)} ${y}`;
}

/* ════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════ */
export default function PublicBookingPage() {
  const { hotelId } = useParams();
  const [hotel,       setHotel]      = useState(null);
  const [loading,     setLoading]    = useState(true);
  const [chatOpen,    setChatOpen]   = useState(false);
  const [messages,    setMessages]   = useState([]);
  const [inputVal,    setInputVal]   = useState("");
  const [chatBusy,    setChatBusy]   = useState(false);
  const [lead,        setLead]       = useState({});
  const [leadSaved,   setLeadSaved]  = useState(false);
  const [selRoom,     setSelRoom]    = useState(null);
  const [openFaq,     setOpenFaq]    = useState(null);
  const [bookingDone, setBookingDone]= useState(null);

  // Calendar state
  const today = new Date();
  const [calYear,  setCalYear]  = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [checkIn,  setCheckIn]  = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [picking,  setPicking]  = useState("in"); // "in" | "out"

  const chatEndRef = useRef(null);
  const inputRef   = useRef(null);

  useEffect(() => {
    fetchHotel(hotelId).then(h => { setHotel(h); setLoading(false); });
  }, [hotelId]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  useEffect(() => {
    if (chatOpen && messages.length === 0 && hotel) {
      const roomLine = selRoom ? `\n\nAap **${selRoom.type} Room (₹${selRoom.rate.toLocaleString("en-IN")}/night)** mein interested hain? Booking ke liye apna naam, phone aur dates batayein! 😊` : "";
      setMessages([{ role:"assistant", time:new Date(), content:
        `Namaste! 🙏 **${hotel.name}** mein aapka swagat hai!\n\nMain aapka AI receptionist hoon. Main aapki help kar sakta hoon:\n🛏 Room booking\n💰 Rates & availability\n📅 Date selection\n❓ Koi bhi sawaal${roomLine}` }]);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [chatOpen, hotel]);

  const send = useCallback(async (text) => {
    const t = text?.trim();
    if (!t || chatBusy || !hotel) return;
    setInputVal("");
    const userMsg = { role:"user", content:t, time:new Date() };
    const history = [...messages, userMsg];
    setMessages(history);
    setChatBusy(true);

    try {
      const res = await fetch("/api/groq", {
        method:"POST", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          type: "chat",
          hotelConfig: {
            name: hotel.name, location: hotel.location,
            rates: { standard:1999, deluxe:1999, premium:2499, suite:3499, family:2799 },
          },
          messages: history.map(m => ({ role:m.role, content:m.content })),
        }),
      });
      const data  = await res.json();
      const reply = data.message || "Dobara try karo.";
      setMessages(prev => [...prev, { role:"assistant", content:reply, time:new Date() }]);

      // Lead extraction
      const newLead = { ...lead };
      const phoneM = t.match(/[6-9]\d{9}/); if (phoneM) newLead.phone = phoneM[0];
      const nameM  = t.match(/(?:naam|name)\s+(?:hai\s+)?([A-Za-z\s]{2,20})/i); if (nameM) newLead.name = nameM[1].trim();
      if (t.toLowerCase().includes("suite"))   newLead.roomType = "Suite";
      if (t.toLowerCase().includes("deluxe"))  newLead.roomType = "Deluxe";
      if (t.toLowerCase().includes("family"))  newLead.roomType = "Family";
      if (t.toLowerCase().includes("premium")) newLead.roomType = "Premium";
      if (selRoom && !newLead.roomType) newLead.roomType = selRoom.type;
      if (checkIn)  newLead.checkIn  = checkIn;
      if (checkOut) newLead.checkOut = checkOut;
      newLead.message = t;
      setLead(newLead);

      if (newLead.name && newLead.phone && !leadSaved) {
        saveLead(hotelId, newLead);
        setLeadSaved(true);
        // Auto-confirm booking if we have enough details
        if (newLead.roomType && (newLead.checkIn || checkIn)) {
          const bookId = await saveBookingToSupabase(hotelId, {
            ...newLead, rate: selRoom?.rate || 1999,
          });
          if (bookId) setBookingDone(bookId);
        }
      }
    } catch {
      setMessages(prev => [...prev, { role:"assistant", content:"Network issue. Thodi der baad try karo ya call karein. 🙏", time:new Date() }]);
    }
    setChatBusy(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [messages, chatBusy, hotel, lead, leadSaved, hotelId, selRoom, checkIn, checkOut]);

  // Calendar day click
  const handleDayClick = (y, m, d) => {
    const ds = dateStr(y, m, d);
    if (picking === "in") { setCheckIn(ds); setCheckOut(""); setPicking("out"); }
    else {
      if (ds <= checkIn) { setCheckIn(ds); setCheckOut(""); setPicking("out"); }
      else { setCheckOut(ds); setPicking("in"); }
    }
  };

  const handleBookRoom = (room) => {
    setSelRoom(room);
    setChatOpen(true);
    // Pre-fill message
    setTimeout(() => send(`${room.type} room book karna hai. Dates: ${checkIn ? formatDisplay(checkIn) : "date batata hoon"} se ${checkOut ? formatDisplay(checkOut) : "checkout date batata hoon"}.`), 500);
  };

  const nights = checkIn && checkOut
    ? Math.max(0, Math.ceil((new Date(checkOut) - new Date(checkIn)) / 86400000))
    : 0;

  if (loading) return <Loader />;
  if (!hotel)  return <NotFound hotelId={hotelId} />;

  const daysInMonth  = getDaysInMonth(calYear, calMonth);
  const firstDay     = getFirstDay(calYear, calMonth);
  const prevMonth    = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y-1); } else setCalMonth(m => m-1); };
  const nextMonth    = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y+1); } else setCalMonth(m => m+1); };

  return (
    <div style={{ background:"#0A0A08", minHeight:"100vh", color:"#fff",
      fontFamily:"'Georgia',system-ui,sans-serif", paddingBottom:120,
      overflowY:"auto", overflowX:"hidden", WebkitOverflowScrolling:"touch" }}>
      <style>{CSS}</style>

      {/* ══ HEADER ══ */}
      <div style={{
        background:"linear-gradient(180deg,#0f0e08,#0A0A08)",
        padding:"20px 18px 16px",
        borderBottom:"1px solid rgba(212,175,55,0.12)",
        position:"sticky", top:0, zIndex:40,
        backdropFilter:"blur(20px)",
      }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            {/* Logo circle */}
            <div style={{
              width:56, height:56, borderRadius:"50%",
              background:"linear-gradient(135deg,#1a1500,#2d2200)",
              border:"2px solid rgba(212,175,55,0.5)",
              boxShadow:"0 0 20px rgba(212,175,55,0.2)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:28,
            }}>{hotel.emoji}</div>
            <div>
              <h1 style={{
                fontSize:22, fontWeight:700, color:"#D4AF37",
                letterSpacing:"-0.01em", lineHeight:1.1,
                fontFamily:"Georgia,serif",
              }}>{hotel.name}</h1>
              <p style={{ fontSize:9, color:"rgba(212,175,55,0.5)", letterSpacing:"0.14em",
                textTransform:"uppercase", marginTop:3 }}>
                {hotel.subtitle || "AI-POWERED HOSPITALITY."}
              </p>
            </div>
          </div>
          {/* System Active badge */}
          <div style={{
            display:"flex", alignItems:"center", gap:6,
            padding:"6px 12px", borderRadius:20,
            background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.35)",
          }}>
            <div style={{ width:7, height:7, borderRadius:"50%", background:"#22c55e",
              boxShadow:"0 0 6px #22c55e", animation:"pulse 2s infinite" }}/>
            <span style={{ fontSize:9, fontWeight:800, color:"#22c55e", letterSpacing:"0.08em" }}>SYSTEM ACTIVE</span>
          </div>
        </div>
      </div>

      {/* ══ ROOM INVENTORY ══ */}
      <div style={{ padding:"20px 16px 0" }}>
        <div style={{
          display:"flex", alignItems:"center", gap:10, marginBottom:6,
          padding:"12px 16px", borderRadius:14,
          background:"rgba(212,175,55,0.06)", border:"1px solid rgba(212,175,55,0.15)",
        }}>
          <span style={{ fontSize:18 }}>💎</span>
          <div>
            <p style={{ fontWeight:700, fontSize:14, color:"#D4AF37" }}>Curated Inventory Matrix</p>
            <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:1 }}>
              Handpicked rooms for a premium stay experience.
            </p>
          </div>
        </div>

        {/* Room cards */}
        <div style={{ marginTop:12, display:"flex", flexDirection:"column", gap:10 }}>
          {ROOM_TYPES.map(room => (
            <div key={room.type} style={{
              borderRadius:16, overflow:"hidden",
              background:"rgba(255,255,255,0.03)",
              border:"1px solid rgba(255,255,255,0.08)",
              display:"flex", alignItems:"stretch",
            }}>
              {/* Room image */}
              <div style={{ width:130, flexShrink:0, position:"relative", overflow:"hidden" }}>
                <img src={room.img} alt={room.type}
                  style={{ width:"100%", height:"100%", objectFit:"cover",
                    display:"block", filter:"brightness(0.85)" }}
                  onError={e => { e.target.style.display="none"; e.target.parentElement.style.background="rgba(212,175,55,0.08)"; }}/>
              </div>
              {/* Room info */}
              <div style={{ flex:1, padding:"12px 14px", display:"flex", flexDirection:"column", justifyContent:"space-between" }}>
                <div>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:5 }}>
                    <p style={{ fontWeight:700, fontSize:15, color:"#D4AF37", fontFamily:"Georgia,serif" }}>
                      {room.type} Room
                    </p>
                    <div style={{ textAlign:"right" }}>
                      <p style={{ fontWeight:900, fontSize:16, color:"#D4AF37", letterSpacing:"-0.02em", lineHeight:1 }}>
                        ₹{room.rate.toLocaleString("en-IN")}
                      </p>
                      <p style={{ fontSize:9, color:"rgba(255,255,255,0.35)" }}>/night</p>
                    </div>
                  </div>
                  {/* Meta row */}
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:5 }}>
                    <span style={{ display:"flex",alignItems:"center",gap:3,fontSize:10,color:"rgba(255,255,255,0.45)" }}>
                      <Users size={10}/> {room.guests} Guests
                    </span>
                    <span style={{ display:"flex",alignItems:"center",gap:3,fontSize:10,color:"rgba(255,255,255,0.45)" }}>
                      <Bed size={10}/> {room.bed}
                    </span>
                    <span style={{ display:"flex",alignItems:"center",gap:3,fontSize:10,color:"rgba(255,255,255,0.45)" }}>
                      <Wifi size={10}/> Wi-Fi
                    </span>
                  </div>
                  <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", lineHeight:1.4 }}>{room.desc}</p>
                  {/* Nights total */}
                  {nights > 0 && (
                    <p style={{ fontSize:11, color:"#22c55e", marginTop:4, fontWeight:600 }}>
                      {nights} nights = ₹{(room.rate * nights).toLocaleString("en-IN")} total
                    </p>
                  )}
                </div>
                <button onClick={() => handleBookRoom(room)} style={{
                  marginTop:10, padding:"8px 0", borderRadius:8, border:"none",
                  background:"linear-gradient(135deg,#b8960c,#D4AF37,#F5C842)",
                  fontFamily:"Georgia,serif", fontWeight:700, fontSize:12, color:"#000",
                  cursor:"pointer", letterSpacing:"0.02em",
                  boxShadow:"0 4px 14px rgba(212,175,55,0.25)",
                  transition:"transform .15s, box-shadow .15s",
                }} onMouseDown={e=>e.currentTarget.style.transform="scale(.97)"}
                   onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}>
                  Book Room
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ VISUAL CALENDAR ══ */}
      <div style={{ padding:"24px 16px 0" }}>
        <div style={{
          borderRadius:16, overflow:"hidden",
          background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)",
        }}>
          {/* Calendar header */}
          <div style={{ padding:"14px 16px 10px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
              <span style={{ fontSize:16 }}>📅</span>
              <p style={{ fontWeight:700, fontSize:14, color:"#fff" }}>Visual Calendar Allocator</p>
            </div>
            <p style={{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>Select your stay dates. Live availability at a glance.</p>
          </div>

          {/* Date range display */}
          <div style={{ padding:"12px 16px", display:"flex", alignItems:"center", gap:10 }}>
            <div onClick={() => setPicking("in")} style={{
              flex:1, padding:"10px 12px", borderRadius:10, cursor:"pointer",
              background: picking==="in" ? "rgba(212,175,55,0.15)" : "rgba(255,255,255,0.04)",
              border: picking==="in" ? "1px solid rgba(212,175,55,0.5)" : "1px solid rgba(255,255,255,0.08)",
            }}>
              <p style={{ fontSize:9, color:"rgba(255,255,255,0.35)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:3 }}>Check-In</p>
              <p style={{ fontSize:13, fontWeight:700, color: checkIn ? "#D4AF37" : "rgba(255,255,255,0.25)" }}>
                {checkIn ? formatDisplay(checkIn) : "Select date"}
              </p>
            </div>
            <span style={{ color:"rgba(255,255,255,0.2)", fontSize:16 }}>→</span>
            <div onClick={() => setPicking("out")} style={{
              flex:1, padding:"10px 12px", borderRadius:10, cursor:"pointer",
              background: picking==="out" ? "rgba(212,175,55,0.15)" : "rgba(255,255,255,0.04)",
              border: picking==="out" ? "1px solid rgba(212,175,55,0.5)" : "1px solid rgba(255,255,255,0.08)",
            }}>
              <p style={{ fontSize:9, color:"rgba(255,255,255,0.35)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:3 }}>Check-Out</p>
              <p style={{ fontSize:13, fontWeight:700, color: checkOut ? "#D4AF37" : "rgba(255,255,255,0.25)" }}>
                {checkOut ? formatDisplay(checkOut) : "Select date"}
              </p>
            </div>
          </div>

          {/* Month navigation */}
          <div style={{ padding:"0 16px", display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
            <button onClick={prevMonth} style={{ width:32, height:32, borderRadius:8, border:"none",
              background:"rgba(255,255,255,0.06)", color:"rgba(255,255,255,0.6)", cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              <ChevronLeft size={16}/>
            </button>
            <p style={{ fontWeight:700, fontSize:15, color:"#D4AF37", fontFamily:"Georgia,serif" }}>
              {MONTHS[calMonth]} {calYear}
            </p>
            <button onClick={nextMonth} style={{ width:32, height:32, borderRadius:8, border:"none",
              background:"rgba(255,255,255,0.06)", color:"rgba(255,255,255,0.6)", cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              <ChevronRight size={16}/>
            </button>
          </div>

          {/* Day headers */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", padding:"0 16px 4px" }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign:"center", fontSize:9, fontWeight:700,
                color:"rgba(255,255,255,0.3)", letterSpacing:"0.05em", paddingBottom:4 }}>
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", padding:"0 16px 16px", gap:2 }}>
            {/* Empty cells */}
            {Array.from({ length:firstDay }).map((_,i) => <div key={`e${i}`}/>)}
            {/* Day cells */}
            {Array.from({ length:daysInMonth }, (_,i) => {
              const d  = i + 1;
              const ds = dateStr(calYear, calMonth, d);
              const isCheckIn  = ds === checkIn;
              const isCheckOut = ds === checkOut;
              const isInRange  = checkIn && checkOut && ds > checkIn && ds < checkOut;
              const isPast     = ds < dateStr(today.getFullYear(), today.getMonth(), today.getDate());
              return (
                <div key={d} onClick={() => !isPast && handleDayClick(calYear, calMonth, d)}
                  style={{
                    height:36, borderRadius:8,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:12, fontWeight: isCheckIn||isCheckOut ? 800 : 500,
                    cursor: isPast ? "default" : "pointer",
                    background: isCheckIn||isCheckOut
                      ? "linear-gradient(135deg,#b8960c,#D4AF37)"
                      : isInRange ? "rgba(212,175,55,0.15)" : "transparent",
                    color: isCheckIn||isCheckOut ? "#000"
                      : isPast ? "rgba(255,255,255,0.18)"
                      : isInRange ? "#D4AF37" : "rgba(255,255,255,0.75)",
                    border: isCheckIn||isCheckOut
                      ? "1px solid #D4AF37"
                      : isInRange ? "1px solid rgba(212,175,55,0.3)" : "1px solid transparent",
                    boxShadow: isCheckIn||isCheckOut ? "0 0 10px rgba(212,175,55,0.4)" : "none",
                    transition:"all .15s",
                  }}>
                  {d}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display:"flex", gap:16, padding:"0 16px 14px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:5 }}>
              <div style={{ width:20, height:8, borderRadius:4, background:"linear-gradient(90deg,#b8960c,#D4AF37)" }}/>
              <span style={{ fontSize:10, color:"rgba(255,255,255,0.35)" }}>Selected Range</span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:5 }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:"#22c55e",
                boxShadow:"0 0 5px #22c55e" }}/>
              <span style={{ fontSize:10, color:"rgba(255,255,255,0.35)" }}>Available</span>
            </div>
          </div>

          {/* Nights summary */}
          {nights > 0 && (
            <div style={{ margin:"0 16px 14px", padding:"10px 14px", borderRadius:10,
              background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.25)" }}>
              <p style={{ fontSize:12, color:"#22c55e", fontWeight:700 }}>
                ✓ {nights} night{nights>1?"s":""} selected —{" "}
                {formatDisplay(checkIn)} → {formatDisplay(checkOut)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ══ FAQ ══ */}
      <div style={{ padding:"24px 16px 0" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
          <span style={{ fontSize:18 }}>❓</span>
          <p style={{ fontWeight:700, fontSize:16, color:"#fff" }}>FAQs</p>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:0,
          borderRadius:14, overflow:"hidden",
          border:"1px solid rgba(255,255,255,0.08)",
          background:"rgba(255,255,255,0.025)" }}>
          {FAQS.map((faq, i) => (
            <div key={i} onClick={() => setOpenFaq(openFaq===i ? null : i)}
              style={{ borderBottom: i<FAQS.length-1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                padding:"14px 16px", cursor:"pointer" }}>
                <p style={{ fontSize:13, color:"rgba(255,255,255,0.75)", fontWeight:500, paddingRight:10 }}>
                  {faq.q}
                </p>
                <ChevronDown size={16} style={{ color:"rgba(255,255,255,0.35)", flexShrink:0,
                  transform: openFaq===i ? "rotate(180deg)" : "none",
                  transition:"transform .25s" }}/>
              </div>
              {openFaq === i && (
                <div style={{ padding:"0 16px 14px" }}>
                  <p style={{ fontSize:12, color:"rgba(255,255,255,0.45)", lineHeight:1.6 }}>{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ══ SECURE FOOTER ══ */}
      <div style={{ padding:"20px 16px 0", textAlign:"center" }}>
        <div style={{ padding:"12px", borderRadius:12,
          background:"rgba(212,175,55,0.05)", border:"1px solid rgba(212,175,55,0.12)" }}>
          <p style={{ fontSize:10, color:"rgba(212,175,55,0.5)", letterSpacing:"0.06em" }}>
            🛡 Secured by The GuestInn AI • 100% AI-Powered Reservation System
          </p>
        </div>
        <a href={`/h/${hotelId}`} style={{ display:"block", marginTop:8,
          fontSize:9, color:"rgba(255,255,255,0.1)", textDecoration:"none" }}>
          Staff Login →
        </a>
      </div>

      {/* ══ AI RECEPTIONIST FLOATING BUTTON ══ */}
      {!chatOpen && (
        <div style={{ position:"fixed", bottom:24, right:16, zIndex:50, display:"flex", flexDirection:"column", alignItems:"center", gap:0 }}>
          {/* Circular avatar with neon ring */}
          <button onClick={() => setChatOpen(true)} style={{
            width:70, height:70, borderRadius:"50%", border:"none",
            background:"linear-gradient(135deg,#0a0f20,#060810)",
            boxShadow:[
              "0 0 0 3px rgba(0,112,243,0.5)",
              "0 0 0 8px rgba(0,112,243,0.12)",
              "0 0 30px rgba(0,112,243,0.5)",
              "0 0 60px rgba(0,112,243,0.2)",
            ].join(","),
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:34, cursor:"pointer",
            animation:"aiFloat 3s ease-in-out infinite",
            position:"relative", overflow:"visible",
          }}>
            {/* Rotating ring */}
            <div style={{ position:"absolute", inset:-4, borderRadius:"50%",
              border:"1.5px solid rgba(0,112,243,0.4)",
              animation:"rotateRing 6s linear infinite" }}/>
            <div style={{ position:"absolute", inset:-8, borderRadius:"50%",
              border:"1px dashed rgba(0,112,243,0.2)",
              animation:"rotateRing 10s linear infinite reverse" }}/>
            👩‍💼
          </button>
          {/* Label bubble */}
          <div style={{
            marginTop:-6, padding:"5px 12px", borderRadius:20,
            background:"linear-gradient(135deg,#b8960c,#D4AF37)",
            border:"1px solid rgba(212,175,55,0.5)",
            boxShadow:"0 4px 14px rgba(212,175,55,0.3)",
            textAlign:"center",
          }}>
            <p style={{ fontSize:9, fontWeight:800, color:"#000", letterSpacing:"0.04em" }}>AI Receptionist</p>
            <p style={{ fontSize:8, color:"rgba(0,0,0,0.65)" }}>Ask me anything!</p>
          </div>
        </div>
      )}

      {/* ══ CHAT PANEL ══ */}
      {chatOpen && (
        <div style={{
          position:"fixed", bottom:0, left:0, right:0, zIndex:50,
          height:"78vh",
          background:"linear-gradient(180deg,#0b0f1e,#07090a)",
          border:"1px solid rgba(0,112,243,0.25)", borderBottom:"none",
          borderRadius:"24px 24px 0 0",
          display:"flex", flexDirection:"column",
          boxShadow:"0 -8px 60px rgba(0,0,0,0.85)",
          animation:"slideUp .3s ease",
        }}>
          {/* Chat header */}
          <div style={{ display:"flex", alignItems:"center", gap:12,
            padding:"14px 16px", borderBottom:"1px solid rgba(255,255,255,0.06)", flexShrink:0 }}>
            <div style={{
              width:42, height:42, borderRadius:"50%", fontSize:22,
              display:"flex", alignItems:"center", justifyContent:"center",
              background:"linear-gradient(135deg,#001030,#001a4a)",
              border:"2px solid rgba(0,112,243,0.5)",
              boxShadow:"0 0 14px rgba(0,112,243,0.3)",
            }}>👩‍💼</div>
            <div style={{ flex:1 }}>
              <p style={{ fontWeight:800, fontSize:14, color:"#fff", lineHeight:1 }}>AI Receptionist</p>
              <p style={{ fontSize:11, color:"#22c55e", marginTop:2, display:"flex", alignItems:"center", gap:4 }}>
                <span style={{ display:"inline-block", width:6, height:6, borderRadius:"50%",
                  background:"#22c55e", animation:"pulse 1.5s infinite" }}/>
                Online — {hotel.name}
              </p>
            </div>
            <button onClick={() => setChatOpen(false)} style={{
              width:32, height:32, borderRadius:10, border:"none",
              background:"rgba(255,255,255,0.07)", color:"rgba(255,255,255,0.5)",
              display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer",
            }}><X size={16}/></button>
          </div>

          {/* Booking confirmed banner */}
          {bookingDone && (
            <div style={{ margin:"8px 12px 0", padding:"10px 14px", borderRadius:10,
              background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.3)",
              display:"flex", alignItems:"center", gap:8 }}>
              <Check size={16} style={{ color:"#22c55e", flexShrink:0 }}/>
              <p style={{ fontSize:12, color:"#22c55e", fontWeight:600 }}>
                Booking confirmed! Hotel team aapko jald contact karegi. ✓
              </p>
            </div>
          )}

          {/* Messages */}
          <div style={{ flex:1, overflowY:"auto", padding:"12px 14px", display:"flex", flexDirection:"column", gap:10 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start" }}>
                <div style={{
                  maxWidth:"86%", padding:"11px 14px",
                  borderRadius: m.role==="user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  background: m.role==="user"
                    ? "linear-gradient(135deg,#b8960c,#D4AF37,#F5C842)"
                    : "rgba(255,255,255,0.07)",
                  border: m.role==="assistant" ? "1px solid rgba(255,255,255,0.08)" : "none",
                  color: m.role==="user" ? "#000" : "#fff",
                  fontSize:13, lineHeight:1.6,
                  fontWeight: m.role==="user" ? 600 : 400,
                  boxShadow: m.role==="user" ? "0 4px 14px rgba(212,175,55,0.2)" : "none",
                }}>
                  {m.content.split("\n").map((line, j, arr) => (
                    <span key={j}>
                      {line.split("**").map((p, k) => k%2===1 ? <strong key={k}>{p}</strong> : <span key={k}>{p}</span>)}
                      {j < arr.length-1 && <br/>}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            {chatBusy && (
              <div style={{ display:"flex", gap:5, padding:"10px 14px",
                background:"rgba(255,255,255,0.05)", borderRadius:18, width:"fit-content",
                border:"1px solid rgba(255,255,255,0.08)" }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width:7, height:7, borderRadius:"50%",
                    background:"rgba(0,112,243,0.7)",
                    animation:`typingDot 1s ease ${i*.2}s infinite` }}/>
                ))}
              </div>
            )}
            <div ref={chatEndRef}/>
          </div>

          {/* Quick replies */}
          {messages.length <= 1 && !chatBusy && (
            <div style={{ display:"flex", gap:7, padding:"0 14px 10px", overflowX:"auto", flexShrink:0 }}>
              {[
                selRoom ? `${selRoom.type} room chahiye` : "Room book karna hai",
                "Rates kya hain?",
                "Check-in time kya hai?",
                "Breakfast milega?",
                "Location batao",
              ].map(q => (
                <button key={q} onClick={() => send(q)} style={{
                  flexShrink:0, padding:"7px 14px", borderRadius:20, border:"none",
                  background:"rgba(0,112,243,0.1)", outline:"1px solid rgba(0,112,243,0.3)",
                  color:"#60a5fa", fontSize:11, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap",
                }}>{q}</button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ display:"flex", gap:8, padding:"10px 12px 16px",
            borderTop:"1px solid rgba(255,255,255,0.06)", flexShrink:0 }}>
            <input ref={inputRef} value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); send(inputVal); } }}
              placeholder="Message likhein..."
              disabled={chatBusy}
              style={{ flex:1, padding:"12px 15px", borderRadius:14,
                border:"1px solid rgba(255,255,255,0.1)",
                background:"rgba(255,255,255,0.06)", color:"#fff", fontSize:13, outline:"none",
                opacity:chatBusy?0.6:1 }}/>
            <button onClick={() => send(inputVal)} disabled={!inputVal.trim()||chatBusy}
              style={{
                width:46, height:46, borderRadius:13, border:"none", flexShrink:0,
                background: inputVal.trim()&&!chatBusy
                  ? "linear-gradient(135deg,#0050c8,#0070F3)" : "rgba(255,255,255,0.05)",
                display:"flex", alignItems:"center", justifyContent:"center",
                cursor: inputVal.trim()&&!chatBusy ? "pointer" : "default",
                boxShadow: inputVal.trim() ? "0 0 16px rgba(0,112,243,0.4)" : "none",
                transition:"all .2s",
              }}>
              <Send size={18} color={inputVal.trim()&&!chatBusy ? "#fff" : "#333"}/>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Loader() {
  return (
    <div style={{ height:"100vh", display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", gap:14, background:"#0A0A08" }}>
      <div style={{ width:40, height:40, borderRadius:"50%",
        border:"2px solid rgba(212,175,55,0.15)", borderTopColor:"#D4AF37",
        animation:"spin 1s linear infinite" }}/>
      <p style={{ fontSize:13, color:"rgba(255,255,255,0.35)" }}>Loading hotel...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function NotFound({ hotelId }) {
  return (
    <div style={{ height:"100vh", display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", gap:10, padding:"0 28px",
      background:"#0A0A08", textAlign:"center" }}>
      <span style={{ fontSize:48 }}>🏚️</span>
      <h2 style={{ fontSize:22, fontWeight:700, color:"#fff", margin:0, fontFamily:"Georgia,serif" }}>Hotel Nahi Mila</h2>
      <p style={{ fontSize:13, color:"rgba(255,255,255,0.38)" }}>Yeh link sahi nahi hai.</p>
      <code style={{ fontSize:11, padding:"5px 14px", borderRadius:8,
        background:"rgba(255,255,255,0.05)", color:"rgba(255,255,255,0.3)", fontFamily:"monospace" }}>
        {hotelId}
      </code>
      <a href="/" style={{ marginTop:8, padding:"11px 28px", borderRadius:14,
        background:"linear-gradient(135deg,#b8960c,#D4AF37)", color:"#000",
        fontWeight:800, fontSize:13, textDecoration:"none" }}>Home Pe Jaao</a>
    </div>
  );
}

const CSS = `
  * { box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
  html, body { height:auto !important; overflow:auto !important; min-height:100%; }
  ::-webkit-scrollbar { width:3px; height:3px; }
  ::-webkit-scrollbar-thumb { background:rgba(212,175,55,0.2); border-radius:3px; }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.7)} }
  @keyframes aiFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  @keyframes rotateRing { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes typingDot { 0%,60%,100%{transform:translateY(0);opacity:.4} 30%{transform:translateY(-5px);opacity:1} }
  @keyframes slideUp { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
`;
