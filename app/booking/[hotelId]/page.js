/**
 * app/booking/[hotelId]/page.js — PUBLIC GUEST BOOKING PAGE
 * Premium luxury UI + Working Groq AI chatbot
 */
"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { Send, MessageCircle, X, MapPin, Star, Wifi, Car, Coffee, Shield, Phone } from "lucide-react";

/* ─── Demo hotels with aliases ──────────────────────────────── */
const DEMOS = [
  { id:"sunrise-jaipur",    name:"Hotel Sunrise",   location:"Jaipur, Rajasthan",      totalRooms:40,  plan:"pro",        emoji:"🏨", phone:"+91 98765 11111", desc:"Premium heritage property in the heart of Pink City" },
  { id:"hotel-sunrise",     name:"Hotel Sunrise",   location:"Jaipur, Rajasthan",      totalRooms:40,  plan:"pro",        emoji:"🏨", phone:"+91 98765 11111", desc:"Premium heritage property in the heart of Pink City" },
  { id:"grand-mumbai",      name:"The Grand Inn",   location:"Mumbai, Maharashtra",    totalRooms:120, plan:"enterprise", emoji:"🏩", phone:"+91 98765 22222", desc:"Luxury business hotel in Mumbai's financial district" },
  { id:"the-grand-inn",     name:"The Grand Inn",   location:"Mumbai, Maharashtra",    totalRooms:120, plan:"enterprise", emoji:"🏩", phone:"+91 98765 22222", desc:"Luxury business hotel in Mumbai's financial district" },
  { id:"saffron-ahmedabad", name:"Saffron Stays",   location:"Ahmedabad, Gujarat",     totalRooms:25,  plan:"free",       emoji:"🏪", phone:"+91 98765 33333", desc:"Comfortable and affordable stay near business hub" },
  { id:"saffron-stays",     name:"Saffron Stays",   location:"Ahmedabad, Gujarat",     totalRooms:25,  plan:"free",       emoji:"🏪", phone:"+91 98765 33333", desc:"Comfortable and affordable stay near business hub" },
  { id:"cherry-bhopal",     name:"Hotel Cherry",    location:"Bhopal, Madhya Pradesh", totalRooms:20,  plan:"pro",        emoji:"🍒", phone:"+91 98765 44444", desc:"Boutique property with modern amenities in Bhopal" },
  { id:"hotel-cherry",      name:"Hotel Cherry",    location:"Bhopal, Madhya Pradesh", totalRooms:20,  plan:"pro",        emoji:"🍒", phone:"+91 98765 44444", desc:"Boutique property with modern amenities in Bhopal" },
];

/* ─── Fetch hotel ────────────────────────────────────────────── */
async function fetchHotel(hotelId) {
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const mapRow = h => ({
    id:h.id, name:h.name, location:h.location,
    totalRooms:h.total_rooms||h.totalRooms||20,
    plan:h.plan||"starter", emoji:h.emoji||"🏨",
    phone:h.owner_phone||h.phone||"", desc:h.desc||"",
  });

  if (sbUrl && sbKey && sbUrl !== "undefined") {
    try {
      // Exact match
      const r1 = await fetch(`${sbUrl}/rest/v1/hotels?id=eq.${encodeURIComponent(hotelId)}&select=*`,
        { headers:{ apikey:sbKey, Authorization:`Bearer ${sbKey}` } });
      if (r1.ok) { const d = await r1.json(); if (d?.length) return mapRow(d[0]); }
      // Fetch all + fuzzy
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
    const cac = JSON.parse(localStorage.getItem("gi_hotel_registry_cache")||"[]");
    const slug = hotelId.toLowerCase().replace(/-/g,"");
    const found = [...reg,...cac].find(h=>{
      const ns=(h.name||"").toLowerCase().replace(/\s+/g,"");
      const is=(h.id||"").toLowerCase().replace(/-/g,"");
      return is===slug||ns.includes(slug)||slug.includes(is.slice(0,5));
    });
    if (found) return found;
  } catch {}
  const slug = hotelId.toLowerCase().replace(/-/g,"");
  return DEMOS.find(h=>h.id===hotelId)
    ||DEMOS.find(h=>h.id.replace(/-/g,"")===slug)
    ||DEMOS.find(h=>h.name.toLowerCase().replace(/\s+/g,"").includes(slug))
    ||null;
}

/* ─── Save lead ──────────────────────────────────────────────── */
async function saveLead(hotelId, lead) {
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!sbUrl||!sbKey||sbUrl==="undefined") return;
  try {
    await fetch(`${sbUrl}/rest/v1/leads`,{
      method:"POST",
      headers:{ apikey:sbKey, Authorization:`Bearer ${sbKey}`,
        "Content-Type":"application/json", Prefer:"return=minimal" },
      body:JSON.stringify({
        hotel_id:hotelId, guest_name:lead.name||"",
        guest_phone:lead.phone||"", check_in_date:lead.checkIn||"",
        check_out_date:lead.checkOut||"", room_type:lead.roomType||"",
        message:lead.message||"", status:"new",
        created_at:new Date().toISOString(),
      }),
    });
  } catch {}
}

/* ─── Room types ─────────────────────────────────────────────── */
const ROOMS = [
  { type:"Standard", emoji:"🛏",  price:1500, desc:"Cozy & comfortable stay",
    amenities:["❄️ AC","📺 TV","📶 WiFi","🚿 Geyser"],
    color:"rgba(59,130,246,0.12)", border:"rgba(59,130,246,0.25)" },
  { type:"Deluxe",   emoji:"🛎",  price:2500, desc:"Premium room with city view",
    amenities:["❄️ AC","📺 TV","📶 WiFi","🍹 Mini Bar","🚿 Geyser","☕ Kettle"],
    color:"rgba(212,175,55,0.1)", border:"rgba(212,175,55,0.3)" },
  { type:"Suite",    emoji:"👑",  price:4500, desc:"Luxury suite with private lounge",
    amenities:["❄️ AC","📺 55\" TV","📶 WiFi","🍹 Mini Bar","🛁 Jacuzzi","🤵 Butler","🍳 Breakfast"],
    color:"rgba(168,85,247,0.1)", border:"rgba(168,85,247,0.3)" },
];

/* ═══════════════════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════════════════ */
export default function PublicBookingPage() {
  const { hotelId } = useParams();
  const [hotel,       setHotel]     = useState(null);
  const [loading,     setLoading]   = useState(true);
  const [chatOpen,    setChatOpen]  = useState(false);
  const [messages,    setMessages]  = useState([]);
  const [inputVal,    setInputVal]  = useState("");
  const [chatBusy,    setChatBusy]  = useState(false);
  const [lead,        setLead]      = useState({});
  const [leadSaved,   setLeadSaved] = useState(false);
  const [selRoom,     setSelRoom]   = useState(null);
  const chatEnd = useRef(null);
  const inputRef = useRef(null);

  useEffect(()=>{ fetchHotel(hotelId).then(h=>{ setHotel(h); setLoading(false); }); },[hotelId]);

  // Welcome message
  useEffect(()=>{
    if(chatOpen && messages.length===0 && hotel){
      setMessages([{ role:"assistant", time:new Date(), content:
        `Namaste! 🙏 **${hotel.name}** mein aapka swagat hai!\n\nMain aapka AI receptionist hoon. Main aapki madad kar sakta hoon:\n🛏 Room booking\n💰 Rates & availability\n📍 Location & directions\n❓ Koi bhi sawaal\n\n${selRoom?`Aap **${selRoom.type} Room (₹${selRoom.price.toLocaleString("en-IN")}/night)** mein interested hain?\n\nBook karne ke liye apna naam aur phone number batayein.`:"Aap kya janana chahte hain?"}` }]);
      setTimeout(()=>inputRef.current?.focus(),300);
    }
  },[chatOpen,hotel]);

  useEffect(()=>{ chatEnd.current?.scrollIntoView({behavior:"smooth"}); },[messages]);

  // Core send function — takes text directly, not from state
  const send = useCallback(async (text) => {
    const t = text?.trim();
    if (!t || chatBusy || !hotel) return;
    setInputVal("");
    const userMsg = { role:"user", content:t, time:new Date() };
    const history = [...messages, userMsg];
    setMessages(history);
    setChatBusy(true);

    try {
      const res = await fetch("/api/groq",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          type:"chat",
          hotelConfig:{
            name:hotel.name,
            location:hotel.location,
            rates:{ standard:1500, deluxe:2500, suite:4500 },
          },
          messages: history.map(m=>({ role:m.role, content:m.content })),
        }),
      });
      const data = await res.json();
      const reply = data.message || data.error || "Dobara try karo.";
      setMessages(prev=>[...prev,{ role:"assistant", content:reply, time:new Date() }]);

      // Extract lead
      const newLead = {...lead};
      const phoneM = t.match(/[6-9]\d{9}/); if(phoneM) newLead.phone=phoneM[0];
      const nameM  = t.match(/(?:naam|name)\s+(?:hai\s+)?([A-Za-z\s]{2,20})/i); if(nameM) newLead.name=nameM[1].trim();
      if(t.toLowerCase().includes("suite"))   newLead.roomType="Suite";
      if(t.toLowerCase().includes("deluxe"))  newLead.roomType="Deluxe";
      if(t.toLowerCase().includes("standard"))newLead.roomType="Standard";
      if(selRoom&&!newLead.roomType) newLead.roomType=selRoom.type;
      newLead.message=t;
      setLead(newLead);
      if(newLead.name&&newLead.phone&&!leadSaved){
        saveLead(hotelId,newLead);
        setLeadSaved(true);
      }
    } catch(e){
      setMessages(prev=>[...prev,{ role:"assistant",
        content:"Network problem. Thodi der baad try karo ya call karein. 🙏", time:new Date() }]);
    }
    setChatBusy(false);
    setTimeout(()=>inputRef.current?.focus(),100);
  },[messages, chatBusy, hotel, lead, leadSaved, hotelId, selRoom]);

  const handleBook = (room) => { setSelRoom(room); setChatOpen(true); };

  if(loading) return <Loader/>;
  if(!hotel)  return <NotFound hotelId={hotelId}/>;

  // Gradient for hero based on emoji
  const heroGrad = hotel.emoji==="🍒"
    ?"linear-gradient(135deg,#1a0010,#0d0008,#07090E)"
    :hotel.emoji==="🏩"
    ?"linear-gradient(135deg,#000f2a,#000814,#07090E)"
    :"linear-gradient(135deg,#1a0a00,#0d0500,#07090E)";

  return(
    <div style={{background:"#07090E",minHeight:"100vh",color:"#fff",fontFamily:"system-ui,sans-serif",paddingBottom:100}}>
      <style>{CSS}</style>

      {/* ══ HERO ══ */}
      <div style={{background:heroGrad,padding:"0 16px 20px",position:"relative",overflow:"hidden"}}>
        {/* Background circles */}
        <div style={{position:"absolute",top:-60,right:-60,width:200,height:200,borderRadius:"50%",
          background:"radial-gradient(circle,rgba(212,175,55,0.08),transparent 70%)",pointerEvents:"none"}}/>
        <div style={{position:"absolute",bottom:-40,left:-40,width:160,height:160,borderRadius:"50%",
          background:"radial-gradient(circle,rgba(59,130,246,0.06),transparent 70%)",pointerEvents:"none"}}/>

        {/* Top bar */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 0 16px"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{
              width:52,height:52,borderRadius:16,fontSize:28,
              display:"flex",alignItems:"center",justifyContent:"center",
              background:"rgba(255,255,255,0.06)",
              border:"1px solid rgba(255,255,255,0.12)",
              boxShadow:"0 0 20px rgba(212,175,55,0.1)",
            }}>{hotel.emoji}</div>
            <div>
              <h1 style={{fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-0.02em",lineHeight:1.1}}>{hotel.name}</h1>
              <p style={{fontSize:11,color:"rgba(255,255,255,0.45)",marginTop:3,display:"flex",alignItems:"center",gap:3}}>
                <MapPin size={9} style={{color:"#D4AF37"}}/>{hotel.location}
              </p>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:20,
            background:"rgba(34,197,94,0.12)",border:"1px solid rgba(34,197,94,0.3)"}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:"#22c55e",animation:"pulse 2s infinite"}}/>
            <span style={{fontSize:9,fontWeight:800,color:"#22c55e",letterSpacing:"0.06em"}}>AVAILABLE</span>
          </div>
        </div>

        {/* Hotel description */}
        {hotel.desc&&(
          <p style={{fontSize:12,color:"rgba(255,255,255,0.5)",marginBottom:14,lineHeight:1.5}}>
            ✨ {hotel.desc}
          </p>
        )}

        {/* Rating + Amenities strip */}
        <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:2}}>
          {[
            {icon:"⭐",text:"4.8 Rating"},
            {icon:"📶",text:"Free WiFi"},
            {icon:"🚗",text:"Parking"},
            {icon:"☕",text:"Breakfast"},
            {icon:"🔒",text:"Safe Stay"},
            {icon:"📺",text:"Smart TV"},
          ].map(a=>(
            <div key={a.text} style={{
              display:"flex",alignItems:"center",gap:5,flexShrink:0,
              padding:"6px 12px",borderRadius:20,
              background:"rgba(255,255,255,0.05)",
              border:"1px solid rgba(255,255,255,0.1)",
              color:"rgba(255,255,255,0.65)",fontSize:11,fontWeight:500,
            }}>
              {a.icon} {a.text}
            </div>
          ))}
        </div>
      </div>

      {/* ══ QUICK STATS ══ */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:1,margin:"0 0 2px"}}>
        {[
          {num:hotel.totalRooms,label:"Total Rooms"},
          {num:"24/7",label:"Open"},
          {num:"100%",label:"Verified"},
        ].map(s=>(
          <div key={s.label} style={{padding:"12px 8px",textAlign:"center",
            background:"rgba(255,255,255,0.025)",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
            <p style={{fontSize:18,fontWeight:900,color:"#D4AF37",letterSpacing:"-0.02em",lineHeight:1}}>{s.num}</p>
            <p style={{fontSize:9,color:"rgba(255,255,255,0.3)",marginTop:2,textTransform:"uppercase",letterSpacing:"0.06em"}}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* ══ ROOM CARDS ══ */}
      <div style={{padding:"20px 14px 0"}}>
        <p style={{fontSize:10,fontWeight:800,letterSpacing:"0.14em",color:"rgba(255,255,255,0.3)",
          textTransform:"uppercase",marginBottom:12}}>Available Rooms</p>

        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {ROOMS.map(room=>(
            <div key={room.type} style={{
              borderRadius:20,overflow:"hidden",
              background:room.color,
              border:`1px solid ${room.border}`,
              transition:"transform .15s ease",
            }}>
              {/* Room header */}
              <div style={{padding:"16px 16px 12px",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div style={{display:"flex",gap:12,alignItems:"center"}}>
                  <div style={{
                    width:48,height:48,borderRadius:14,fontSize:24,
                    display:"flex",alignItems:"center",justifyContent:"center",
                    background:"rgba(255,255,255,0.07)",
                    border:"1px solid rgba(255,255,255,0.12)",
                  }}>{room.emoji}</div>
                  <div>
                    <p style={{fontWeight:800,fontSize:16,color:"#fff"}}>{room.type} Room</p>
                    <p style={{fontSize:11,color:"rgba(255,255,255,0.45)",marginTop:1}}>{room.desc}</p>
                  </div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <p style={{
                    fontWeight:900,fontSize:20,letterSpacing:"-0.03em",
                    background:"linear-gradient(135deg,#C9A84C,#F5D688)",
                    WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
                  }}>₹{room.price.toLocaleString("en-IN")}</p>
                  <p style={{fontSize:9,color:"rgba(255,255,255,0.3)"}}>per night</p>
                </div>
              </div>

              {/* Amenities */}
              <div style={{padding:"0 16px 12px",display:"flex",gap:6,flexWrap:"wrap"}}>
                {room.amenities.map(a=>(
                  <span key={a} style={{
                    fontSize:10,padding:"3px 9px",borderRadius:20,
                    background:"rgba(255,255,255,0.06)",
                    border:"1px solid rgba(255,255,255,0.1)",
                    color:"rgba(255,255,255,0.55)",
                  }}>{a}</span>
                ))}
              </div>

              {/* CTA */}
              <button onClick={()=>handleBook(room)} style={{
                display:"block",width:"100%",padding:"13px",border:"none",
                background:"linear-gradient(135deg,#b8960c,#D4AF37,#F5C842)",
                fontWeight:800,fontSize:13,color:"#000",cursor:"pointer",
                letterSpacing:"0.02em",transition:"filter .15s",
              }}>
                💬 Chat to Book →
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ══ WHY BOOK DIRECT ══ */}
      <div style={{margin:"20px 14px 0",padding:"16px",borderRadius:20,
        background:"rgba(34,197,94,0.05)",border:"1px solid rgba(34,197,94,0.2)"}}>
        <p style={{fontSize:11,fontWeight:800,color:"#22c55e",marginBottom:10,letterSpacing:"0.06em"}}>
          ✅ DIRECT BOOKING BENEFITS
        </p>
        {[
          "🏷️ Best price — no commission markup",
          "🎁 Free breakfast on direct booking",
          "🕐 Flexible check-in/checkout",
          "📞 Direct contact with hotel",
        ].map(b=>(
          <p key={b} style={{fontSize:12,color:"rgba(255,255,255,0.55)",marginBottom:6,lineHeight:1.4}}>{b}</p>
        ))}
      </div>

      {/* ══ CONTACT ══ */}
      {hotel.phone&&(
        <div style={{margin:"12px 14px 0",padding:"14px 16px",borderRadius:20,
          background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",
          display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <p style={{fontSize:11,color:"rgba(255,255,255,0.35)",marginBottom:2}}>Direct Call</p>
            <p style={{fontSize:15,fontWeight:700,color:"#fff"}}>{hotel.phone}</p>
          </div>
          <a href={`tel:${hotel.phone}`} style={{
            padding:"9px 16px",borderRadius:12,textDecoration:"none",
            background:"rgba(34,197,94,0.12)",border:"1px solid rgba(34,197,94,0.3)",
            color:"#22c55e",fontSize:12,fontWeight:700,
          }}>📞 Call Now</a>
        </div>
      )}

      {/* ══ LOCATION ══ */}
      <div style={{margin:"12px 14px 0",padding:"14px 16px",borderRadius:20,
        background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
          <MapPin size={14} style={{color:"#D4AF37"}}/>
          <span style={{fontWeight:700,fontSize:13,color:"#fff"}}>Location</span>
        </div>
        <p style={{fontSize:12,color:"rgba(255,255,255,0.45)",marginBottom:10}}>📍 {hotel.location}</p>
        <a href={`https://www.google.com/maps/search/${encodeURIComponent(hotel.name+" "+hotel.location)}`}
          target="_blank" rel="noopener noreferrer" style={{
            display:"block",textAlign:"center",padding:"10px",borderRadius:12,
            background:"rgba(0,112,243,0.1)",border:"1px solid rgba(0,112,243,0.25)",
            color:"#60a5fa",fontSize:12,fontWeight:700,textDecoration:"none",
          }}>📍 Google Maps pe Dekho</a>
      </div>

      {/* ══ FOOTER ══ */}
      <div style={{padding:"20px 14px 10px",textAlign:"center"}}>
        <p style={{fontSize:9,color:"rgba(255,255,255,0.12)",letterSpacing:"0.08em"}}>
          POWERED BY THE GUESTINN AI
        </p>
        <a href={`/h/${hotelId}`} style={{fontSize:9,color:"rgba(255,255,255,0.1)",textDecoration:"none"}}>
          Staff Login →
        </a>
      </div>

      {/* ══ FLOATING CHAT BTN ══ */}
      {!chatOpen&&(
        <button onClick={()=>setChatOpen(true)} style={{
          position:"fixed",bottom:24,right:18,zIndex:50,
          width:58,height:58,borderRadius:"50%",border:"none",
          background:"linear-gradient(135deg,#0050c8,#0070F3,#00a0ff)",
          boxShadow:"0 0 0 8px rgba(0,112,243,0.1),0 0 30px rgba(0,112,243,0.5),0 6px 20px rgba(0,0,0,0.4)",
          display:"flex",alignItems:"center",justifyContent:"center",
          cursor:"pointer",animation:"chatPulse 3s ease infinite",
        }}>
          <MessageCircle size={24} color="#fff" fill="rgba(255,255,255,0.15)"/>
          {/* Unread badge */}
          <div style={{
            position:"absolute",top:-2,right:-2,
            width:18,height:18,borderRadius:"50%",
            background:"#ef4444",border:"2px solid #07090E",
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:9,fontWeight:900,color:"#fff",
          }}>1</div>
        </button>
      )}

      {/* ══ CHAT PANEL ══ */}
      {chatOpen&&(
        <div style={{
          position:"fixed",bottom:0,left:0,right:0,zIndex:50,
          height:"78vh",
          background:"linear-gradient(180deg,#0b0f1e,#080a14)",
          border:"1px solid rgba(0,112,243,0.2)",borderBottom:"none",
          borderRadius:"24px 24px 0 0",
          display:"flex",flexDirection:"column",
          boxShadow:"0 -8px 60px rgba(0,0,0,0.8)",
          animation:"slideUp .3s ease",
        }}>
          {/* Header */}
          <div style={{
            display:"flex",alignItems:"center",gap:12,
            padding:"14px 16px",
            borderBottom:"1px solid rgba(255,255,255,0.06)",
            flexShrink:0,
          }}>
            <div style={{
              width:42,height:42,borderRadius:"50%",fontSize:22,
              display:"flex",alignItems:"center",justifyContent:"center",
              background:"linear-gradient(135deg,#001030,#001a4a)",
              border:"2px solid rgba(0,112,243,0.5)",
              boxShadow:"0 0 14px rgba(0,112,243,0.3)",
            }}>👩‍💼</div>
            <div style={{flex:1}}>
              <p style={{fontWeight:800,fontSize:14,color:"#fff",lineHeight:1}}>AI Receptionist</p>
              <p style={{fontSize:11,color:"#22c55e",marginTop:2,display:"flex",alignItems:"center",gap:4}}>
                <span style={{display:"inline-block",width:6,height:6,borderRadius:"50%",
                  background:"#22c55e",animation:"pulse 1.5s infinite"}}/>
                Online — {hotel.name}
              </p>
            </div>
            <button onClick={()=>setChatOpen(false)} style={{
              width:32,height:32,borderRadius:10,border:"none",
              background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.5)",
              display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",
            }}><X size={16}/></button>
          </div>

          {/* Messages */}
          <div style={{flex:1,overflowY:"auto",padding:"14px",display:"flex",flexDirection:"column",gap:10}}>
            {messages.map((m,i)=>(
              <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
                <div style={{
                  maxWidth:"85%",padding:"11px 14px",
                  borderRadius:m.role==="user"?"18px 18px 4px 18px":"18px 18px 18px 4px",
                  background:m.role==="user"
                    ?"linear-gradient(135deg,#b8960c,#D4AF37,#F5C842)"
                    :"rgba(255,255,255,0.07)",
                  border:m.role==="assistant"?"1px solid rgba(255,255,255,0.08)":"none",
                  color:m.role==="user"?"#000":"#fff",
                  fontSize:13,lineHeight:1.6,fontWeight:m.role==="user"?600:400,
                  boxShadow:m.role==="user"?"0 4px 14px rgba(212,175,55,0.2)":"none",
                }}>
                  {m.content.split("\n").map((line,j)=>(
                    <span key={j}>
                      {line.split("**").map((part,k)=>
                        k%2===1?<strong key={k}>{part}</strong>:<span key={k}>{part}</span>
                      )}
                      {j<m.content.split("\n").length-1&&<br/>}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            {chatBusy&&(
              <div style={{display:"flex",gap:5,padding:"8px 12px",
                background:"rgba(255,255,255,0.05)",borderRadius:18,width:"fit-content",
                border:"1px solid rgba(255,255,255,0.08)"}}>
                {[0,1,2].map(i=>(
                  <div key={i} style={{width:7,height:7,borderRadius:"50%",
                    background:"rgba(0,112,243,0.7)",
                    animation:`typingDot 1s ease ${i*0.2}s infinite`}}/>
                ))}
              </div>
            )}
            <div ref={chatEnd}/>
          </div>

          {/* Quick replies */}
          {messages.length<=1&&!chatBusy&&(
            <div style={{display:"flex",gap:7,padding:"0 14px 10px",overflowX:"auto",flexShrink:0}}>
              {[
                selRoom?`${selRoom.type} room book karna hai`:"Room book karna hai",
                "Rates kya hain?",
                "Check-in time kya hai?",
                "Location batao",
                "Breakfast milega?",
              ].map(q=>(
                <button key={q} onClick={()=>send(q)} style={{
                  flexShrink:0,padding:"7px 14px",borderRadius:20,border:"none",
                  background:"rgba(0,112,243,0.1)",
                  outline:"1px solid rgba(0,112,243,0.3)",
                  color:"#60a5fa",fontSize:11,fontWeight:600,cursor:"pointer",
                  whiteSpace:"nowrap",
                }}>{q}</button>
              ))}
            </div>
          )}

          {/* Input row */}
          <div style={{
            display:"flex",gap:8,padding:"10px 12px 16px",
            borderTop:"1px solid rgba(255,255,255,0.06)",flexShrink:0,
          }}>
            <input ref={inputRef}
              value={inputVal}
              onChange={e=>setInputVal(e.target.value)}
              onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); send(inputVal); } }}
              placeholder="Message likhein..."
              disabled={chatBusy}
              style={{
                flex:1,padding:"12px 15px",borderRadius:14,
                border:"1px solid rgba(255,255,255,0.1)",
                background:"rgba(255,255,255,0.06)",
                color:"#fff",fontSize:13,outline:"none",
                opacity:chatBusy?0.6:1,
              }}
            />
            <button onClick={()=>send(inputVal)}
              disabled={!inputVal.trim()||chatBusy}
              style={{
                width:46,height:46,borderRadius:13,border:"none",flexShrink:0,
                background:inputVal.trim()&&!chatBusy
                  ?"linear-gradient(135deg,#0050c8,#0070F3)"
                  :"rgba(255,255,255,0.05)",
                display:"flex",alignItems:"center",justifyContent:"center",
                cursor:inputVal.trim()&&!chatBusy?"pointer":"default",
                boxShadow:inputVal.trim()?"0 0 16px rgba(0,112,243,0.4)":"none",
                transition:"all .2s",
              }}>
              <Send size={18} color={inputVal.trim()&&!chatBusy?"#fff":"#333"}/>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Loader(){
  return(
    <div style={{height:"100vh",display:"flex",flexDirection:"column",
      alignItems:"center",justifyContent:"center",gap:14,background:"#07090E"}}>
      <div style={{width:40,height:40,borderRadius:"50%",
        border:"2px solid rgba(212,175,55,0.15)",borderTopColor:"#D4AF37",
        animation:"spin 1s linear infinite"}}/>
      <p style={{fontSize:13,color:"rgba(255,255,255,0.35)"}}>Hotel load ho raha hai...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function NotFound({hotelId}){
  return(
    <div style={{height:"100vh",display:"flex",flexDirection:"column",
      alignItems:"center",justifyContent:"center",gap:10,padding:"0 28px",
      background:"#07090E",textAlign:"center"}}>
      <span style={{fontSize:48}}>🏚️</span>
      <h2 style={{fontSize:22,fontWeight:900,color:"#fff",margin:0}}>Hotel Nahi Mila</h2>
      <p style={{fontSize:13,color:"rgba(255,255,255,0.38)"}}>Yeh link sahi nahi hai.</p>
      <code style={{fontSize:11,padding:"5px 14px",borderRadius:8,
        background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.3)",fontFamily:"monospace"}}>
        {hotelId}
      </code>
      <a href="/" style={{marginTop:8,padding:"11px 28px",borderRadius:14,
        background:"linear-gradient(135deg,#b8960c,#D4AF37)",color:"#000",
        fontWeight:800,fontSize:13,textDecoration:"none"}}>Home Pe Jaao</a>
    </div>
  );
}

const CSS=`
  *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
  ::-webkit-scrollbar{width:3px;height:3px}
  ::-webkit-scrollbar-thumb{background:rgba(212,175,55,0.2);border-radius:3px}
  @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.75)}}
  @keyframes chatPulse{
    0%,100%{box-shadow:0 0 0 8px rgba(0,112,243,0.1),0 0 30px rgba(0,112,243,0.5),0 6px 20px rgba(0,0,0,0.4)}
    50%{box-shadow:0 0 0 12px rgba(0,112,243,0.05),0 0 50px rgba(0,112,243,0.7),0 6px 20px rgba(0,0,0,0.4)}
  }
  @keyframes typingDot{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-5px);opacity:1}}
  @keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
`;
