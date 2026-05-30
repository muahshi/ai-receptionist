"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Send, MessageCircle, X, MapPin, Star, Wifi, Car, Coffee, ShieldCheck, ChevronRight, Navigation, Phone } from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   DEMO HOTELS
══════════════════════════════════════════════════════════════ */
const DEMOS = [
  { id:"cherry-bhopal",  name:"Hotel Cherry",        location:"Peer Gate, Bhopal, MP",   totalRooms:20,  ownerPhone:"919009109108", emoji:"🍒", standardRate:1200, deluxeRate:2000, suiteRate:3800 },
  { id:"hotel-cherry",   name:"Hotel Cherry",        location:"Peer Gate, Bhopal, MP",   totalRooms:20,  ownerPhone:"919009109108", emoji:"🍒", standardRate:1200, deluxeRate:2000, suiteRate:3800 },
  { id:"sunrise-jaipur", name:"Hotel Sunrise Palace",location:"Jaipur, Rajasthan",       totalRooms:40,  ownerPhone:"919876543210", emoji:"🌅", standardRate:1500, deluxeRate:2500, suiteRate:5000 },
  { id:"grand-mumbai",   name:"The Grand Inn",       location:"Mumbai, Maharashtra",     totalRooms:120, ownerPhone:"919876543211", emoji:"🏩", standardRate:2000, deluxeRate:3500, suiteRate:7000 },
  { id:"amardeep-palace",name:"Hotel Amardeep Palace",location:"Bhopal, Madhya Pradesh", totalRooms:20,  ownerPhone:"919009109108", emoji:"🏨", standardRate:1200, deluxeRate:2000, suiteRate:3800 },
];

async function fetchHotel(hotelId) {
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (sbUrl && sbKey && sbUrl !== "undefined") {
    try {
      const res = await fetch(
        `${sbUrl}/rest/v1/hotels?id=eq.${encodeURIComponent(hotelId)}&select=*`,
        { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data?.length > 0) {
          const h = data[0];
          return { id:h.id, name:h.name, location:h.location, totalRooms:h.total_rooms||20,
            ownerPhone:h.owner_phone||"", emoji:h.emoji||"🏨",
            standardRate:h.standard_rate||1200, deluxeRate:h.deluxe_rate||2000, suiteRate:h.suite_rate||3800,
            checkoutTime:h.checkout_time||"11:00 AM" };
        }
      }
    } catch {}
  }
  // localStorage fallback
  try {
    const cfg = JSON.parse(localStorage.getItem(`air_${hotelId}_config`) || "{}");
    if (cfg.name) return { id:hotelId, name:cfg.name, location:cfg.location||"", totalRooms:cfg.totalRooms||20,
      ownerPhone:cfg.ownerPhone||"", emoji:cfg.emoji||"🏨",
      standardRate:cfg.standardRate||1200, deluxeRate:cfg.deluxeRate||2000, suiteRate:cfg.suiteRate||3800 };
  } catch {}
  const slug = hotelId.toLowerCase().replace(/-/g,"");
  return DEMOS.find(h=>h.id===hotelId) || DEMOS.find(h=>h.id.replace(/-/g,"")===slug) || null;
}

/* ═══════════════════════════════════════════════════════════
   HOLOGRAM BUILDING (exact from DashboardView)
══════════════════════════════════════════════════════════════ */
function HologramBuilding() {
  return (
    <svg viewBox="0 0 160 180" style={{width:110,height:130,filter:"drop-shadow(0 0 16px #008cff) drop-shadow(0 0 32px rgba(0,140,255,0.35))",animation:"holoPulse 3s ease-in-out infinite"}}>
      <ellipse cx="80" cy="160" rx="62" ry="10" fill="none" stroke="rgba(212,175,55,0.9)" strokeWidth="1.5"/>
      <ellipse cx="80" cy="160" rx="50" ry="7" fill="none" stroke="rgba(212,175,55,0.55)" strokeWidth="1"/>
      <ellipse cx="80" cy="160" rx="38" ry="5" fill="none" stroke="rgba(212,175,55,0.3)" strokeWidth="0.7"/>
      <ellipse cx="80" cy="160" rx="62" ry="10" fill="rgba(212,175,55,0.05)"/>
      <polygon points="80,18 122,48 122,148 80,168 38,148 38,48" fill="none" stroke="rgba(0,140,255,0.6)" strokeWidth="1.2"/>
      <polygon points="80,18 38,48 38,148 80,168" fill="rgba(0,50,110,0.12)" stroke="rgba(0,140,255,0.55)" strokeWidth="0.8"/>
      <polygon points="80,18 122,48 122,148 80,168" fill="rgba(0,70,140,0.08)" stroke="rgba(0,140,255,0.45)" strokeWidth="0.8"/>
      <polygon points="80,18 122,48 80,78 38,48" fill="rgba(0,90,180,0.18)" stroke="rgba(0,140,255,0.8)" strokeWidth="1.2"/>
      {[70,90,110,130].map(y=>(<line key={`l${y}`} x1="38" y1={y} x2="80" y2={y+20} stroke="rgba(0,140,255,0.25)" strokeWidth="0.5"/>))}
      {[70,90,110,130].map(y=>(<line key={`r${y}`} x1="80" y1={y+20} x2="122" y2={y} stroke="rgba(0,140,255,0.2)" strokeWidth="0.5"/>))}
      {[[48,78],[48,98],[48,118],[60,78],[60,98],[60,118],[72,78],[72,98],[72,118]].map(([x,y],i)=>(
        <rect key={`wl${i}`} x={x-3} y={y-4} width="5" height="7" rx="0.5" fill={i%3===0?"rgba(0,200,255,0.7)":"rgba(0,160,220,0.4)"}/>
      ))}
      {[[88,78],[88,98],[88,118],[100,78],[100,98],[100,118],[112,78],[112,98],[112,118]].map(([x,y],i)=>(
        <rect key={`wr${i}`} x={x-3} y={y-4} width="5" height="7" rx="0.5" fill={i%2===0?"rgba(0,180,255,0.6)":"rgba(0,140,200,0.35)"}/>
      ))}
      <line x1="80" y1="18" x2="80" y2="2" stroke="rgba(0,140,255,0.9)" strokeWidth="1.5"/>
      <circle cx="80" cy="2" r="2.5" fill="#008cff"/>
      <circle cx="80" cy="2" r="4" fill="none" stroke="rgba(0,140,255,0.4)" strokeWidth="0.8"/>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════
   AI SCAN REACTOR (exact from DashboardView, renamed)
══════════════════════════════════════════════════════════════ */
function AiScanReactor({ onClick, scanning }) {
  return (
    <button onClick={onClick} style={{
      position:"relative", width:120, height:120,
      background:"transparent", border:"none", cursor:"pointer",
      display:"flex", alignItems:"center", justifyContent:"center",
      flexShrink:0,
    }}>
      {[{sz:-10,color:"rgba(0,140,255,0.65)",dash:"6,4",spd:"3s",dir:"normal"},
        {sz:4,color:"rgba(212,175,55,0.5)",dash:"4,6",spd:"5s",dir:"reverse"},
        {sz:16,color:"rgba(0,140,255,0.3)",dash:"8,8",spd:"7s",dir:"normal"}].map((r,i)=>(
        <div key={i} style={{
          position:"absolute", inset:r.sz, borderRadius:"50%",
          border:`1.5px dashed ${r.color}`,
          animation:`spinRingCW ${r.spd} linear infinite${r.dir==="reverse"?" reverse":""}`
        }}/>
      ))}
      {[0,45,90,135,180,225,270,315].map(deg=>(
        <div key={deg} style={{
          position:"absolute", width:1, bottom:"50%", left:"50%",
          height:"42%", transformOrigin:"50% 100%",
          transform:`translateX(-50%) rotate(${deg}deg)`,
          background:`linear-gradient(to bottom,rgba(0,140,255,${deg%90===0?0.6:0.2}),transparent)`
        }}/>
      ))}
      <div style={{position:"absolute",left:"50%",top:-14,width:2,height:28,transform:"translateX(-50%)",background:"linear-gradient(to top,rgba(0,140,255,0.9),transparent)",filter:"blur(1.5px)",animation:"laserPulse 2s ease-in-out infinite"}}/>
      <div style={{position:"absolute",left:"50%",bottom:-14,width:2,height:28,transform:"translateX(-50%)",background:"linear-gradient(to bottom,rgba(0,140,255,0.9),transparent)",filter:"blur(1.5px)",animation:"laserPulse 2s ease-in-out infinite 0.6s"}}/>
      <div style={{position:"absolute",bottom:20,left:"50%",transform:"translateX(-50%)",width:70,height:3,background:"linear-gradient(90deg,transparent,rgba(212,175,55,0.9),transparent)",filter:"blur(2px)"}}/>
      <div style={{
        position:"absolute", inset:18, borderRadius:"50%",
        background:"radial-gradient(circle,rgba(0,20,60,0.97) 0%,rgba(0,5,18,0.99) 100%)",
        border:"2px solid rgba(0,140,255,0.55)",
        boxShadow:"0 0 28px rgba(0,140,255,0.5),0 0 55px rgba(0,140,255,0.2),inset 0 0 24px rgba(0,140,255,0.12)"
      }}/>
      <div style={{position:"relative",zIndex:2,textAlign:"center",pointerEvents:"none"}}>
        {scanning ? (
          <div style={{display:"flex",gap:4,alignItems:"flex-end",justifyContent:"center",height:24}}>
            {[0,1,2,3].map(i=>(
              <div key={i} style={{width:3,borderRadius:2,background:"#008cff",animation:"audioBar 0.6s ease-in-out infinite",animationDelay:`${i*0.15}s`}}/>
            ))}
          </div>
        ) : (<>
          <p style={{fontSize:18,fontWeight:900,letterSpacing:"0.08em",color:"#fff",textShadow:"0 0 18px #008cff,0 0 36px rgba(0,140,255,0.7)",lineHeight:1,fontFamily:"'Courier New',monospace"}}>AI</p>
          <p style={{fontSize:8,fontWeight:800,letterSpacing:"0.28em",color:"#60b8ff",textShadow:"0 0 8px #008cff",marginTop:3}}>SCAN ID</p>
        </>)}
      </div>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════
   ROOM KEYCAP (guest-facing: only vacant = clickable/green)
══════════════════════════════════════════════════════════════ */
function getRoomCfg(status, selected) {
  if (selected) return {
    face:"linear-gradient(135deg,#7a5c17,#c9a84c,#f5d688)",
    right:"linear-gradient(180deg,#a07820,#6b4f10)",
    bottom:"#4a3200",
    glow:"#D4AF37", glowA:"rgba(212,175,55,0.9)",
    border:"rgba(212,175,55,1)", badgeC:"#1a1000", numC:"#000",
    label:"Selected",
  };
  const map = {
    vacant:      { face:"linear-gradient(160deg,#072e18,#04180c,#020d07)", right:"linear-gradient(180deg,#04180c,#010804)", bottom:"#010803", glow:"#22c55e", glowA:"rgba(34,197,94,0.7)", border:"rgba(34,197,94,0.8)", badgeC:"#22c55e", numC:"#86efac", label:"Available" },
    occupied:    { face:"linear-gradient(160deg,#1d0d0d,#0d0606,#080303)", right:"linear-gradient(180deg,#0d0606,#050202)", bottom:"#040101", glow:"#ef4444", glowA:"rgba(239,68,68,0.5)", border:"rgba(239,68,68,0.5)", badgeC:"#ef4444", numC:"#fca5a5", label:"Occupied" },
    reserved:    { face:"linear-gradient(160deg,#1a1200,#0d0900,#060500)", right:"linear-gradient(180deg,#0d0900,#040300)", bottom:"#030200", glow:"#f59e0b", glowA:"rgba(245,158,11,0.5)", border:"rgba(245,158,11,0.5)", badgeC:"#f59e0b", numC:"#fde68a", label:"Reserved" },
    cleaning:    { face:"linear-gradient(160deg,#0d0d1a,#06060d,#030306)", right:"linear-gradient(180deg,#06060d,#020204)", bottom:"#010102", glow:"#818cf8", glowA:"rgba(129,140,248,0.5)", border:"rgba(129,140,248,0.5)", badgeC:"#818cf8", numC:"#c7d2fe", label:"Cleaning" },
    out_of_order:{ face:"linear-gradient(160deg,#111113,#090909,#050505)", right:"linear-gradient(180deg,#090909,#030303)", bottom:"#020202", glow:"#4b5563", glowA:"rgba(75,85,99,0.3)",  border:"rgba(75,85,99,0.4)",  badgeC:"#4b5563", numC:"#9ca3af", label:"N/A" },
  };
  return map[status] || map.vacant;
}

function RoomKeycap({ room, selected, onClick }) {
  const cfg = getRoomCfg(room.status, selected);
  const isVacant = room.status === "vacant";
  const depth = 5;

  return (
    <button
      onClick={() => isVacant && onClick(room)}
      title={isVacant ? `Room ${room.number} — Book Karo` : `Room ${room.number} — ${cfg.label}`}
      style={{
        width:"100%", aspectRatio:"1/1.05",
        position:"relative", background:"transparent", WebkitTapHighlightColor:"transparent",
        border:"none", padding:0,
        cursor: isVacant ? "pointer" : "not-allowed",
        transform: selected ? "perspective(400px) rotateX(20deg) scale(1.06)" : "perspective(400px) rotateX(20deg)",
        transformOrigin:"center 90%",
        transition:"transform 0.15s ease, filter 0.15s ease",
        filter:`drop-shadow(0 ${depth+2}px ${depth*2}px rgba(0,0,0,0.7)) drop-shadow(0 0 ${depth*2}px ${cfg.glowA})`,
        opacity: (!isVacant && !selected) ? 0.45 : 1,
      }}
    >
      <div style={{position:"absolute",inset:0,top:`${depth}px`,borderRadius:"5px 5px 7px 7px",background:cfg.bottom,boxShadow:`0 4px 12px rgba(0,0,0,0.9)`}}/>
      <div style={{position:"absolute",top:`${depth}px`,right:0,bottom:0,width:`${depth}px`,background:cfg.right,borderRadius:"0 2px 4px 0",opacity:0.9}}/>
      <div style={{
        position:"absolute", inset:0, bottom:`${depth}px`,
        borderRadius:"6px 6px 4px 4px",
        background: selected ? "linear-gradient(135deg,#7a5c17,#c9a84c,#f5d688)" : cfg.face,
        border:`1.5px solid ${cfg.border}`,
        boxShadow:`inset 0 0 14px rgba(0,0,0,0.6),inset 0 1px 0 rgba(255,255,255,0.12)`,
        overflow:"hidden", display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center", gap:2, padding:"3px 2px",
      }}>
        <div style={{position:"absolute",top:0,left:"6%",right:"6%",height:"35%",background:"linear-gradient(180deg,rgba(255,255,255,0.2) 0%,rgba(255,255,255,0.02) 100%)",borderRadius:"6px 6px 50% 50%",zIndex:2}}/>
        <div style={{position:"absolute",bottom:1,left:"8%",right:"8%",height:2,background:selected?"#000":cfg.badgeC,filter:"blur(3px)",opacity:0.95,zIndex:2}}/>
        <div style={{
          width:11, height:11, borderRadius:"50%",
          background:selected?"rgba(0,0,0,0.6)":`radial-gradient(circle,${cfg.badgeC},${cfg.badgeC}cc)`,
          display:"flex", alignItems:"center", justifyContent:"center",
          boxShadow:selected?"none":`0 0 8px ${cfg.badgeC}`,
          position:"relative", zIndex:3, flexShrink:0,
        }}>
          <svg viewBox="0 0 10 10" style={{width:7,height:7}}>
            <circle cx="5" cy="3.2" r="1.8" fill={selected?"#D4AF37":"white"} opacity="0.95"/>
            <path d="M1.5,9 Q1.5,6.2 5,6.2 Q8.5,6.2 8.5,9Z" fill={selected?"#D4AF37":"white"} opacity="0.95"/>
          </svg>
        </div>
        <span style={{fontSize:8,color:selected?"#000":cfg.numC,fontWeight:900,fontFamily:"'Courier New',monospace",lineHeight:1,position:"relative",zIndex:3,textShadow:selected?"none":`0 0 6px ${cfg.badgeC}`}}>
          {room.number}
        </span>
      </div>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════
   MOCK ROOMS from localStorage or generated
══════════════════════════════════════════════════════════════ */
function getRooms(hotelId, totalRooms) {
  try {
    const stored = JSON.parse(localStorage.getItem(`air_${hotelId}_rooms`) || "[]");
    if (stored.length > 0) return stored;
  } catch {}
  // Generate mock
  const rooms = [];
  const statuses = ["occupied","occupied","occupied","vacant","vacant","vacant","reserved","cleaning"];
  for (let i = 1; i <= totalRooms; i++) {
    const floor = Math.ceil(i / 5);
    rooms.push({ id:`r${i}`, number:i, floor, status: statuses[i % statuses.length] || "vacant", type:"Standard", baseRate:1200 });
  }
  return rooms;
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════ */
export default function PublicBookingPage() {
  const { hotelId } = useParams();
  const [hotel, setHotel]             = useState(null);
  const [loading, setLoading]         = useState(true);
  const [rooms, setRooms]             = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [guestName, setGuestName]     = useState("");
  const [guestPhone, setGuestPhone]   = useState("");
  const [checkIn, setCheckIn]         = useState("");
  const [checkOut, setCheckOut]       = useState("");
  const [roomType, setRoomType]       = useState("Deluxe Room");
  const [chatOpen, setChatOpen]       = useState(false);
  const [messages, setMessages]       = useState([]);
  const [chatInput, setChatInput]     = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [scanning, setScanning]       = useState(false);
  const [scanned, setScanned]         = useState(false);
  const [submitted, setSubmitted]     = useState(false);
  const chatEndRef                    = useRef(null);

  useEffect(() => {
    if (!hotelId) { setLoading(false); return; }
    fetchHotel(hotelId).then(h => {
      setHotel(h);
      if (h) setRooms(getRooms(hotelId, h.totalRooms || 20));
      setLoading(false);
    });
  }, [hotelId]);

  useEffect(() => {
    if (hotel && messages.length === 0) {
      setMessages([{ role:"assistant", content:`Namaste! 🙏 **${hotel.name}** ke Direct Booking Desk par aapka swagat hai!\n\nMain aapka AI Receptionist hoon. Direct booking se aapka **18% OTA commission instantly save** hoga!\n\n💰 **Direct Rates:**\n• Standard Room: ₹${hotel.standardRate?.toLocaleString("en-IN")}/raat\n• Deluxe Room: ₹${hotel.deluxeRate?.toLocaleString("en-IN")}/raat\n• Suite: ₹${hotel.suiteRate?.toLocaleString("en-IN")}/raat\n\nKis date ke liye room book karna hai?`, time: new Date() }]);
    }
  }, [hotel]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  // AI ID Scan mock
  const handleScan = () => {
    if (scanning || scanned) return;
    setScanning(true);
    setTimeout(() => {
      setGuestName("Suresh Kumar");
      setGuestPhone("9009123456");
      setScanning(false);
      setScanned(true);
    }, 3000);
  };

  const nights = (() => {
    if (!checkIn || !checkOut) return 0;
    const d = (new Date(checkOut) - new Date(checkIn)) / 86400000;
    return d > 0 ? d : 0;
  })();

  const rateMap = { "Standard Room": hotel?.standardRate||1200, "Deluxe Room": hotel?.deluxeRate||2000, "Suite Room": hotel?.suiteRate||3800 };
  const nightRate = rateMap[roomType] || 2000;
  const total = nights * nightRate;

  const validate = () => {
    if (!guestName.trim()) return "Guest ka naam likhiye";
    if (!guestPhone.trim() || guestPhone.replace(/\D/g,"").length < 10) return "Valid phone number likhiye";
    if (!checkIn) return "Check-in date select karo";
    if (!checkOut) return "Check-out date select karo";
    if (nights <= 0) return "Check-out, check-in ke baad honi chahiye";
    return null;
  };

  const handleBook = () => {
    const err = validate();
    if (err) { alert(err); return; }
    const roomLabel = selectedRoom ? `Room ${selectedRoom.number}` : roomType;
    const msg = `🏨 *${hotel.name} — Direct Booking Request*\n\n👤 *Guest:* ${guestName}\n📞 *Phone:* ${guestPhone}\n🛏️ *Room:* ${roomLabel}\n📅 *Check-in:* ${checkIn}\n📅 *Check-out:* ${checkOut}\n🌙 *Nights:* ${nights}\n💰 *Total:* ₹${total.toLocaleString("en-IN")}\n\n✅ Direct Booking — No OTA Commission\n_Powered by The GuestInn AI_`;
    const phone = hotel.ownerPhone?.replace(/\D/g,"") || "";
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
    setSubmitted(true);
  };

  const sendChat = async (override) => {
    const text = (override || chatInput).trim();
    if (!text || chatLoading) return;
    if (!override) setChatInput("");
    const newMsgs = [...messages, { role:"user", content:text, time:new Date() }];
    setMessages(newMsgs);
    setChatLoading(true);
    try {
      const res = await fetch("/api/groq", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ type:"chat", hotelConfig:{ name:hotel?.name, location:hotel?.location, rates:rateMap }, messages:newMsgs.map(m=>({role:m.role,content:m.content})) })
      });
      const data = await res.json();
      setMessages(p=>[...p,{role:"assistant",content:data.message||"Thodi der baad try karo 🙏",time:new Date()}]);
    } catch {
      setMessages(p=>[...p,{role:"assistant",content:"Connection issue aa gaya. Thodi der mein dobara try karo. 🙏",time:new Date()}]);
    }
    setChatLoading(false);
  };

  // Room grid by floor
  const byFloor = {};
  rooms.forEach(r => { if(!byFloor[r.floor]) byFloor[r.floor]=[]; byFloor[r.floor].push(r); });
  const floors = Object.keys(byFloor).map(Number).sort((a,b)=>b-a);
  const cols = rooms.length <= 20 ? 5 : rooms.length <= 40 ? 8 : 10;
  const vacantCount = rooms.filter(r=>r.status==="vacant").length;

  if (loading) return (
    <div style={{minHeight:"100vh",background:"#07090E",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{textAlign:"center"}}>
        <div style={{width:60,height:60,margin:"0 auto 16px",borderRadius:"50%",border:"2px solid rgba(0,140,255,0.3)",borderTop:"2px solid #008cff",animation:"spinRingCW 1s linear infinite"}}/>
        <p style={{color:"rgba(255,255,255,0.3)",fontSize:13,letterSpacing:"0.1em"}}>LOADING...</p>
      </div>
    </div>
  );

  if (!hotel) return (
    <div style={{minHeight:"100vh",background:"#07090E",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <p style={{color:"rgba(255,255,255,0.3)",fontSize:14}}>Hotel not found</p>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"#07090E",color:"#fff",fontFamily:"system-ui,-apple-system,sans-serif",paddingBottom:100}}>

      {/* ── GLOBAL STYLES ── */}
      <style>{`
        *,*::before,*::after{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
        html{height:-webkit-fill-available;overflow-x:hidden}
        body{min-height:100vh;min-height:-webkit-fill-available;overflow-x:hidden;overflow-y:auto !important;-webkit-overflow-scrolling:touch;background:#07090E}
        @keyframes spinRingCW  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes laserPulse  { 0%,100%{opacity:0.4;transform:translateX(-50%) scaleY(0.5)} 50%{opacity:1;transform:translateX(-50%) scaleY(1)} }
        @keyframes holoPulse   { 0%,100%{filter:drop-shadow(0 0 12px #008cff) drop-shadow(0 0 28px rgba(0,140,255,0.4))} 50%{filter:drop-shadow(0 0 22px #00aaff) drop-shadow(0 0 55px rgba(0,160,255,0.65))} }
        @keyframes audioBar    { 0%,100%{height:4px} 50%{height:18px} }
        @keyframes dotBounce   { 0%,60%,100%{transform:translateY(0);opacity:.35} 30%{transform:translateY(-6px);opacity:1} }
        @keyframes fadeUp      { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideUp     { from{transform:translateY(100%)} to{transform:translateY(0)} }
        @keyframes goldPulse   { 0%,100%{box-shadow:0 0 0 0 rgba(212,175,55,0.4)} 50%{box-shadow:0 0 0 8px rgba(212,175,55,0)} }
        .booking-scroll::-webkit-scrollbar{width:3px}
        .booking-scroll::-webkit-scrollbar-thumb{background:rgba(212,175,55,0.2);border-radius:3px}
        .room-keycap-hover:hover{filter:brightness(1.15)}
      `}</style>

      {/* ── STICKY NAV ── */}
      <nav style={{
        position:"sticky", top:0, zIndex:40,
        background:"rgba(7,9,14,0.92)", backdropFilter:"blur(20px)",
        borderBottom:"1px solid rgba(255,255,255,0.05)",
        padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between",
        boxShadow:"0 4px 24px rgba(0,0,0,0.5)",
      }}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#1a1400,#2d2200)",border:"1px solid rgba(212,175,55,0.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,boxShadow:"0 0 12px rgba(212,175,55,0.1)"}}>
            {hotel.emoji}
          </div>
          <div>
            <p style={{fontSize:14,fontWeight:800,color:"#fff",letterSpacing:"-0.01em"}}>{hotel.name}</p>
            <p style={{fontSize:10,color:"rgba(255,255,255,0.35)",display:"flex",alignItems:"center",gap:3}}>
              <MapPin size={9} style={{color:"#D4AF37"}}/>{hotel.location}
            </p>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6,background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.2)",borderRadius:20,padding:"5px 10px"}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:"#22c55e",boxShadow:"0 0 6px #22c55e",animation:"goldPulse 2s infinite"}}/>
          <span style={{fontSize:9,fontWeight:700,color:"#22c55e",letterSpacing:"0.1em"}}>BOOKING OPEN</span>
        </div>
      </nav>

      {/* ── HERO ── */}
      <div style={{
        padding:"24px 16px 20px",
        background:"linear-gradient(180deg,rgba(0,18,45,0.4) 0%,transparent 100%)",
        borderBottom:"1px solid rgba(0,140,255,0.08)",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        position:"relative", overflow:"hidden",
      }}>
        <div style={{position:"absolute",inset:0,opacity:0.03,backgroundImage:"linear-gradient(rgba(0,140,255,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(0,140,255,0.8) 1px,transparent 1px)",backgroundSize:"28px 28px",pointerEvents:"none"}}/>
        <div style={{flex:1,animation:"fadeUp 0.6s ease forwards"}}>
          <div style={{display:"flex",gap:4,marginBottom:8}}>
            {[...Array(5)].map((_,i)=>(
              <Star key={i} size={11} style={{color:"#D4AF37",fill:"#D4AF37"}}/>
            ))}
            <span style={{fontSize:10,color:"rgba(212,175,55,0.6)",marginLeft:4}}>Premium Stay</span>
          </div>
          <h1 style={{fontSize:22,fontWeight:900,color:"#fff",letterSpacing:"-0.02em",lineHeight:1.2,marginBottom:6}}>
            {hotel.name}<br/>
            <span style={{background:"linear-gradient(90deg,#D4AF37,#F5C842)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",fontSize:18}}>Direct Booking</span>
          </h1>
          <p style={{fontSize:11,color:"rgba(255,255,255,0.35)",lineHeight:1.5}}>
            OTA ke bina book karo — <span style={{color:"#22c55e",fontWeight:700}}>18% save karo</span>
          </p>
          <div style={{display:"flex",gap:8,marginTop:12,flexWrap:"wrap"}}>
            {[{icon:"📶",label:"Free WiFi"},{icon:"🚗",label:"Parking"},{icon:"☕",label:"Breakfast"},{icon:"❄️",label:"AC Rooms"}].map(a=>(
              <span key={a.label} style={{fontSize:9,padding:"4px 8px",borderRadius:6,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",color:"rgba(255,255,255,0.45)"}}>
                {a.icon} {a.label}
              </span>
            ))}
          </div>
        </div>
        <div style={{flexShrink:0,marginLeft:12}}>
          <HologramBuilding/>
        </div>
      </div>

      <div style={{padding:"0 14px"}}>

        {/* ── ROOM KEYCAP GRID ── */}
        <div style={{
          background:"linear-gradient(135deg,rgba(6,8,16,0.99),rgba(4,5,12,0.99))",
          border:"1px solid rgba(255,255,255,0.065)", borderRadius:20,
          padding:"16px 12px 14px", margin:"14px 0 12px",
          boxShadow:"0 4px 28px rgba(0,0,0,0.6),inset 0 1px 0 rgba(255,255,255,0.03)",
        }}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",gap:7}}>
              <span style={{fontSize:13}}>🛏️</span>
              <p style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.45)",letterSpacing:"0.1em",textTransform:"uppercase"}}>Room Select Karo</p>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:5,background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.2)",borderRadius:8,padding:"3px 8px"}}>
              <div style={{width:5,height:5,borderRadius:"50%",background:"#22c55e"}}/>
              <span style={{fontSize:9,color:"#22c55e",fontWeight:700}}>{vacantCount} Available</span>
            </div>
          </div>

          {floors.map(floor => {
            const floorRooms = byFloor[floor];
            const padded = [...floorRooms];
            while (padded.length % cols !== 0) padded.push(null);
            const rows = [];
            for (let i=0;i<padded.length;i+=cols) rows.push(padded.slice(i,i+cols));
            return (
              <div key={floor} style={{marginBottom:6}}>
                {rows.map((row,ri)=>(
                  <div key={ri} style={{display:"flex",alignItems:"flex-end",gap:4,marginBottom:4}}>
                    <span style={{fontSize:7,color:"rgba(255,255,255,0.18)",width:14,textAlign:"right",flexShrink:0,fontWeight:700,paddingBottom:4,fontFamily:"'Courier New',monospace"}}>
                      {ri===0 ? String(floor).padStart(2,"0") : ""}
                    </span>
                    <div style={{flex:1,display:"grid",gridTemplateColumns:`repeat(${cols},1fr)`,gap:4}}>
                      {row.map((room,ci)=>
                        room
                          ? <RoomKeycap key={room.id} room={room} selected={selectedRoom?.id===room.id} onClick={r=>setSelectedRoom(prev=>prev?.id===r.id?null:r)}/>
                          : <div key={`ph${ci}`} style={{aspectRatio:"1/1.05",borderRadius:6,background:"rgba(255,255,255,0.008)",border:"1px dashed rgba(255,255,255,0.03)"}}/>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}

          {/* Legend */}
          <div style={{display:"flex",flexWrap:"wrap",gap:"5px 12px",marginTop:12,paddingTop:10,borderTop:"1px solid rgba(255,255,255,0.05)"}}>
            {[{c:"#22c55e",l:"Available"},{c:"#ef4444",l:"Occupied"},{c:"#f59e0b",l:"Reserved"},{c:"#818cf8",l:"Cleaning"}].map(x=>(
              <div key={x.l} style={{display:"flex",alignItems:"center",gap:4}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:x.c,boxShadow:`0 0 4px ${x.c}`}}/>
                <span style={{fontSize:9,color:"rgba(255,255,255,0.3)"}}>{x.l}</span>
              </div>
            ))}
          </div>

          {selectedRoom && (
            <div style={{marginTop:10,padding:"10px 12px",borderRadius:12,background:"rgba(212,175,55,0.08)",border:"1px solid rgba(212,175,55,0.3)",display:"flex",alignItems:"center",justifyContent:"space-between",animation:"fadeUp 0.3s ease"}}>
              <div>
                <p style={{fontSize:12,fontWeight:800,color:"#D4AF37"}}>Room {selectedRoom.number} selected ✓</p>
                <p style={{fontSize:10,color:"rgba(255,255,255,0.4)"}}>Floor {selectedRoom.floor} · {selectedRoom.type} · ₹{selectedRoom.baseRate?.toLocaleString("en-IN")}/raat</p>
              </div>
              <button onClick={()=>setSelectedRoom(null)} style={{width:24,height:24,borderRadius:6,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.4)",fontSize:12,cursor:"pointer"}}>✕</button>
            </div>
          )}
        </div>

        {/* ── AI SCAN + BOOKING FORM ── */}
        <div style={{background:"linear-gradient(135deg,rgba(0,18,45,0.55),rgba(0,8,22,0.65))",border:"1px solid rgba(0,140,255,0.18)",borderRadius:20,padding:"16px",marginBottom:12,position:"relative",overflow:"hidden",boxShadow:"0 4px 28px rgba(0,140,255,0.05)"}}>
          <div style={{position:"absolute",inset:0,opacity:0.03,backgroundImage:"linear-gradient(rgba(0,140,255,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(0,140,255,0.8) 1px,transparent 1px)",backgroundSize:"22px 22px",pointerEvents:"none"}}/>

          {/* AI Scan row */}
          <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16,position:"relative"}}>
            <AiScanReactor onClick={handleScan} scanning={scanning}/>
            <div style={{flex:1}}>
              <p style={{fontSize:13,fontWeight:800,color:"#60b8ff",marginBottom:4}}>AI ID Scanner</p>
              {scanning ? (
                <p style={{fontSize:11,color:"rgba(0,140,255,0.7)",animation:"fadeUp 0.3s ease"}}>🔍 ID scan ho raha hai...</p>
              ) : scanned ? (
                <div style={{animation:"fadeUp 0.4s ease"}}>
                  <p style={{fontSize:11,color:"#22c55e",fontWeight:700,marginBottom:2}}>✓ ID Successfully Scanned!</p>
                  <p style={{fontSize:10,color:"rgba(255,255,255,0.4)"}}>Suresh Kumar · Aadhaar · 9012 3409 1102</p>
                </div>
              ) : (
                <>
                  <p style={{fontSize:11,color:"rgba(255,255,255,0.4)",lineHeight:1.5,marginBottom:6}}>Aadhaar / PAN / Passport scan karo — form auto-fill ho jayega</p>
                  <span style={{fontSize:9,padding:"3px 8px",borderRadius:6,background:"rgba(0,140,255,0.1)",border:"1px solid rgba(0,140,255,0.2)",color:"#60b8ff"}}>Llama 4 Vision Powered</span>
                </>
              )}
            </div>
          </div>

          {/* Form fields */}
          <div style={{display:"flex",flexDirection:"column",gap:10,position:"relative"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div>
                <label style={{fontSize:9,fontWeight:700,color:"rgba(255,255,255,0.35)",letterSpacing:"0.1em",textTransform:"uppercase",display:"block",marginBottom:5}}>Guest Name *</label>
                <input
                  value={guestName} onChange={e=>setGuestName(e.target.value)}
                  placeholder="Suresh Kumar"
                  style={{width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,padding:"10px 12px",fontSize:12,color:"#fff",outline:"none",boxSizing:"border-box"}}
                />
              </div>
              <div>
                <label style={{fontSize:9,fontWeight:700,color:"rgba(255,255,255,0.35)",letterSpacing:"0.1em",textTransform:"uppercase",display:"block",marginBottom:5}}>Phone *</label>
                <input
                  value={guestPhone} onChange={e=>setGuestPhone(e.target.value)}
                  placeholder="9876543210" type="tel"
                  style={{width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,padding:"10px 12px",fontSize:12,color:"#fff",outline:"none",boxSizing:"border-box"}}
                />
              </div>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div>
                <label style={{fontSize:9,fontWeight:700,color:"rgba(255,255,255,0.35)",letterSpacing:"0.1em",textTransform:"uppercase",display:"block",marginBottom:5}}>Check-In *</label>
                <input
                  type="date" value={checkIn} onChange={e=>setCheckIn(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  style={{width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,padding:"10px 12px",fontSize:12,color:"#fff",outline:"none",boxSizing:"border-box",colorScheme:"dark"}}
                />
              </div>
              <div>
                <label style={{fontSize:9,fontWeight:700,color:"rgba(255,255,255,0.35)",letterSpacing:"0.1em",textTransform:"uppercase",display:"block",marginBottom:5}}>Check-Out *</label>
                <input
                  type="date" value={checkOut} onChange={e=>setCheckOut(e.target.value)}
                  min={checkIn || new Date().toISOString().split("T")[0]}
                  style={{width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,padding:"10px 12px",fontSize:12,color:"#fff",outline:"none",boxSizing:"border-box",colorScheme:"dark"}}
                />
              </div>
            </div>

            {!selectedRoom && (
              <div>
                <label style={{fontSize:9,fontWeight:700,color:"rgba(255,255,255,0.35)",letterSpacing:"0.1em",textTransform:"uppercase",display:"block",marginBottom:5}}>Room Type</label>
                <select
                  value={roomType} onChange={e=>setRoomType(e.target.value)}
                  style={{width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,padding:"10px 12px",fontSize:12,color:"#fff",outline:"none",boxSizing:"border-box",colorScheme:"dark"}}
                >
                  <option value="Standard Room">Standard Room — ₹{hotel.standardRate?.toLocaleString("en-IN")}/raat</option>
                  <option value="Deluxe Room">Deluxe Room — ₹{hotel.deluxeRate?.toLocaleString("en-IN")}/raat</option>
                  <option value="Suite Room">Suite Room — ₹{hotel.suiteRate?.toLocaleString("en-IN")}/raat</option>
                </select>
              </div>
            )}

            {/* Bill summary */}
            {nights > 0 && (
              <div style={{background:"rgba(212,175,55,0.06)",border:"1px solid rgba(212,175,55,0.2)",borderRadius:12,padding:"12px 14px",animation:"fadeUp 0.3s ease"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <span style={{fontSize:11,color:"rgba(255,255,255,0.45)"}}>
                    {selectedRoom ? `Room ${selectedRoom.number}` : roomType} × {nights} raat
                  </span>
                  <span style={{fontSize:11,color:"rgba(255,255,255,0.45)"}}>₹{nightRate.toLocaleString("en-IN")} × {nights}</span>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:14,fontWeight:800,color:"#D4AF37"}}>Total</span>
                  <span style={{fontSize:18,fontWeight:900,color:"#D4AF37",textShadow:"0 0 16px rgba(212,175,55,0.4)"}}>₹{total.toLocaleString("en-IN")}</span>
                </div>
              </div>
            )}

            {/* Book button */}
            {submitted ? (
              <div style={{textAlign:"center",padding:"16px",borderRadius:14,background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.25)",animation:"fadeUp 0.4s ease"}}>
                <p style={{fontSize:20,marginBottom:4}}>✅</p>
                <p style={{fontSize:13,fontWeight:800,color:"#22c55e"}}>WhatsApp Request Bhej Diya!</p>
                <p style={{fontSize:11,color:"rgba(255,255,255,0.35)",marginTop:4}}>Hotel team jald confirm karegi</p>
              </div>
            ) : (
              <button
                onClick={handleBook}
                style={{
                  width:"100%", padding:"15px",
                  borderRadius:14, fontWeight:900, fontSize:14,
                  background:"linear-gradient(135deg,#b8960c,#D4AF37,#F5C842)",
                  color:"#000", border:"none", cursor:"pointer",
                  boxShadow:"0 4px 24px rgba(212,175,55,0.35)",
                  letterSpacing:"0.02em",
                  transition:"transform 0.15s ease, box-shadow 0.15s ease",
                }}
                onMouseDown={e=>e.currentTarget.style.transform="scale(0.98)"}
                onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}
              >
                📱 WhatsApp Pe Book Karo
              </button>
            )}

            <div style={{display:"flex",alignItems:"flex-start",gap:8,padding:"10px 12px",borderRadius:10,background:"rgba(0,140,255,0.04)",border:"1px solid rgba(0,140,255,0.1)"}}>
              <ShieldCheck size={13} style={{color:"#60b8ff",flexShrink:0,marginTop:1}}/>
              <p style={{fontSize:10,color:"rgba(255,255,255,0.3)",lineHeight:1.5}}>Direct booking se <strong style={{color:"rgba(255,255,255,0.5)"}}>rate lock</strong> hota hai — checkout tak rate change nahi hoga.</p>
            </div>
          </div>
        </div>

        {/* ── ROOM TYPES SHOWCASE ── */}
        <div style={{marginBottom:12}}>
          <p style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.3)",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:10}}>Room Categories</p>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {[
              {type:"Standard Room",img:"https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=400&q=70&auto=format&fit=crop",rate:hotel.standardRate,emoji:"🛏️",amenities:["AC","WiFi","TV","Geyser"]},
              {type:"Deluxe Room",img:"https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400&q=70&auto=format&fit=crop",rate:hotel.deluxeRate,emoji:"✨",amenities:["AC","WiFi","TV","Mini Bar","Geyser"]},
              {type:"Suite Room",img:"https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&q=70&auto=format&fit=crop",rate:hotel.suiteRate,emoji:"👑",amenities:["AC","WiFi","55\" TV","Mini Bar","Jacuzzi"]},
            ].map(r=>(
              <div key={r.type} style={{borderRadius:16,overflow:"hidden",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",display:"flex"}}>
                <div style={{width:90,height:80,flexShrink:0,overflow:"hidden",position:"relative"}}>
                  <img src={r.img} alt={r.type} style={{width:"100%",height:"100%",objectFit:"cover",opacity:0.7}}/>
                </div>
                <div style={{flex:1,padding:"10px 12px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div>
                    <p style={{fontSize:12,fontWeight:700,color:"#fff",marginBottom:3}}>{r.emoji} {r.type}</p>
                    <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
                      {r.amenities.slice(0,3).map(a=>(<span key={a} style={{fontSize:8,padding:"2px 5px",borderRadius:4,background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.35)",border:"1px solid rgba(255,255,255,0.06)"}}>{a}</span>))}
                    </div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0,marginLeft:8}}>
                    <p style={{fontSize:14,fontWeight:900,color:"#D4AF37"}}>₹{r.rate?.toLocaleString("en-IN")}</p>
                    <p style={{fontSize:8,color:"rgba(255,255,255,0.3)"}}>/raat</p>
                    <button
                      onClick={()=>{setRoomType(r.type);setSelectedRoom(null);document.querySelector("input")?.scrollIntoView({behavior:"smooth",block:"center"});}}
                      style={{marginTop:4,fontSize:9,padding:"4px 10px",borderRadius:6,background:"rgba(212,175,55,0.15)",border:"1px solid rgba(212,175,55,0.3)",color:"#D4AF37",cursor:"pointer",fontWeight:700}}
                    >
                      Select
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── LOCATION ── */}
        <div style={{background:"rgba(6,8,15,0.98)",border:"1px solid rgba(255,255,255,0.055)",borderRadius:16,padding:"14px",marginBottom:12}}>
          <p style={{fontSize:9,fontWeight:700,color:"rgba(255,255,255,0.3)",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:10}}>Location</p>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
            <div style={{width:36,height:36,borderRadius:10,background:"rgba(0,140,255,0.1)",border:"1px solid rgba(0,140,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <MapPin size={15} style={{color:"#60b8ff"}}/>
            </div>
            <div>
              <p style={{fontSize:13,fontWeight:700,color:"#fff"}}>{hotel.name}</p>
              <p style={{fontSize:11,color:"rgba(255,255,255,0.35)"}}>{hotel.location}</p>
            </div>
          </div>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotel.name+" "+hotel.location)}`}
            target="_blank" rel="noopener noreferrer"
            style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,width:"100%",padding:"10px",borderRadius:10,background:"rgba(0,140,255,0.08)",border:"1px solid rgba(0,140,255,0.2)",color:"#60b8ff",fontSize:11,fontWeight:700,textDecoration:"none"}}
          >
            <Navigation size={11}/> Google Maps Pe Dekho
          </a>
        </div>

        {/* ── FAQ ── */}


      </div>

      {/* ── FLOATING CHAT BUTTON ── */}
      {!chatOpen && (
        <button
          onClick={()=>setChatOpen(true)}
          style={{
            position:"fixed", bottom:24, right:20, zIndex:50,
            width:52, height:52, borderRadius:"50%",
            background:"linear-gradient(135deg,#0050c8,#0080ff)",
            border:"none", cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:"0 4px 20px rgba(0,140,255,0.4),0 0 0 0 rgba(0,140,255,0.4)",
            animation:"goldPulse 2s infinite",
          }}
        >
          <MessageCircle size={20} style={{color:"#fff"}}/>
          <div style={{position:"absolute",top:3,right:3,width:10,height:10,borderRadius:"50%",background:"#22c55e",border:"2px solid #07090E"}}/>
        </button>
      )}

      {/* ── CHAT PANEL ── */}
      {chatOpen && (
        <div style={{
          position:"fixed", top:0, left:0, right:0, bottom:0,
          zIndex:50,
          display:"flex", flexDirection:"column",
          background:"linear-gradient(180deg,#0d111e,#060810)",
          borderLeft:"1px solid rgba(255,255,255,0.08)",
          animation:"slideUp 0.35s cubic-bezier(0.16,1,0.3,1) forwards",
          height:"100%", maxHeight:"100dvh",
          WebkitOverflowScrolling:"touch",
        }}>
          {/* Chat header */}
          <div style={{padding:"14px 16px",borderBottom:"1px solid rgba(255,255,255,0.05)",display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(0,0,0,0.3)",flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,#14172a,#1e293b)",border:"1px solid rgba(212,175,55,0.4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>👩‍💼</div>
              <div>
                <p style={{fontSize:12,fontWeight:800,color:"#D4AF37",letterSpacing:"0.05em"}}>AI Receptionist</p>
                <p style={{fontSize:9,color:"#22c55e",display:"flex",alignItems:"center",gap:3}}><span style={{width:5,height:5,borderRadius:"50%",background:"#22c55e",display:"inline-block"}}/>Online — Turant jawab deta hoon</p>
              </div>
            </div>
            <button onClick={()=>setChatOpen(false)} style={{width:32,height:32,borderRadius:8,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",color:"rgba(255,255,255,0.4)",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <X size={15}/>
            </button>
          </div>

          {/* Messages */}
          <div className="booking-scroll" style={{flex:1,padding:"14px",overflowY:"auto",display:"flex",flexDirection:"column",gap:10}}>
            {messages.map((msg,i)=>(
              <div key={i} style={{display:"flex",justifyContent:msg.role==="user"?"flex-end":"flex-start",animation:"fadeUp 0.25s ease"}}>
                <div style={{
                  maxWidth:"85%", padding:"10px 13px", borderRadius:14, fontSize:12, lineHeight:1.6,
                  background:msg.role==="user"?"linear-gradient(135deg,#91711e,#D4AF37)":"rgba(255,255,255,0.05)",
                  color:msg.role==="user"?"#000":"rgba(255,255,255,0.8)",
                  border:msg.role==="user"?"none":"1px solid rgba(255,255,255,0.06)",
                  borderRadius:msg.role==="user"?"14px 14px 4px 14px":"14px 14px 14px 4px",
                  fontWeight:msg.role==="user"?700:400,
                }}>
                  {msg.content.split("**").map((p,j)=>j%2===1?<strong key={j}>{p}</strong>:p)}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div style={{display:"flex",gap:5,padding:"8px 4px",alignItems:"center"}}>
                {[0,1,2].map(i=>(<div key={i} style={{width:7,height:7,borderRadius:"50%",background:"#008cff",animation:"dotBounce 1.2s infinite",animationDelay:`${i*0.2}s`}}/>))}
              </div>
            )}
            <div ref={chatEndRef}/>
          </div>

          {/* Quick replies */}
          <div style={{padding:"8px 14px 0",display:"flex",gap:6,flexWrap:"wrap",flexShrink:0}}>
            {["Rates kya hain?","Room available hai?","Check-in time?","Book karna hai"].map(q=>(
              <button key={q} onClick={()=>sendChat(q)} style={{fontSize:10,padding:"6px 10px",borderRadius:8,background:"rgba(212,175,55,0.08)",border:"1px solid rgba(212,175,55,0.2)",color:"#D4AF37",cursor:"pointer",fontWeight:600,whiteSpace:"nowrap"}}>{q}</button>
            ))}
          </div>

          {/* Input */}
          <div style={{padding:"10px 14px 16px",borderTop:"1px solid rgba(255,255,255,0.05)",background:"rgba(0,0,0,0.3)",display:"flex",gap:8,alignItems:"center",flexShrink:0}}>
            <input
              value={chatInput} onChange={e=>setChatInput(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&sendChat()}
              placeholder="Hinglish mein puchho..."
              style={{flex:1,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"11px 14px",fontSize:12,color:"#fff",outline:"none"}}
            />
            <button
              onClick={()=>sendChat()}
              disabled={!chatInput.trim()||chatLoading}
              style={{width:42,height:42,borderRadius:11,background:"linear-gradient(135deg,#0050c8,#0080ff)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",opacity:(!chatInput.trim()||chatLoading)?0.4:1}}
            >
              <Send size={14} style={{color:"#fff"}}/>
            </button>
          </div>
        </div>
      )}

      {/* FAQ Section — at bottom properly */}
      <FaqSection/>
    </div>
  );
}

/* ── FAQ as separate component to use hooks cleanly ── */
function FaqSection() {
  const [open, setOpen] = useState(null);
  const faqs = [
    {q:"Check-in / Check-out time kya hai?",a:"Check-in: 12:00 PM | Check-out: 11:00 AM. Early check-in room availability pe depend karta hai."},
    {q:"Direct booking mein kya benefit hai?",a:"Direct booking mein rate lock hota hai — OTA commission nahi lagta (18% savings), aur rate checkout tak change nahi hoga."},
    {q:"Payment kab karna hoga?",a:"Payment check-in ke time hotel reception par — Cash ya UPI accepted."},
    {q:"Cancellation policy kya hai?",a:"24 ghante pehle cancellation bilkul free hai. Uske baad ek raat ka charge lagega."},
  ];
  return (
    <div style={{margin:"0 14px 14px",background:"rgba(6,8,15,0.98)",border:"1px solid rgba(255,255,255,0.055)",borderRadius:16,overflow:"hidden"}}>
      <div style={{padding:"12px 14px",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
        <p style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.3)",letterSpacing:"0.12em",textTransform:"uppercase"}}>Aksar Puche Sawal</p>
      </div>
      {faqs.map((f,i)=>(
        <div key={i} style={{borderBottom:i<faqs.length-1?"1px solid rgba(255,255,255,0.04)":"none"}}>
          <button onClick={()=>setOpen(open===i?null:i)} style={{width:"100%",padding:"13px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",background:"transparent",border:"none",cursor:"pointer",textAlign:"left"}}>
            <span style={{fontSize:12,color:"rgba(255,255,255,0.6)",fontWeight:600,flex:1,paddingRight:12}}>{f.q}</span>
            <span style={{fontSize:16,color:"#D4AF37",transition:"transform 0.2s",transform:open===i?"rotate(45deg)":"none",flexShrink:0,display:"inline-block"}}>+</span>
          </button>
          {open===i && <p style={{fontSize:11,color:"rgba(255,255,255,0.4)",lineHeight:1.6,padding:"0 14px 13px",animation:"fadeUp 0.2s ease"}}>{f.a}</p>}
        </div>
      ))}
    </div>
  );
}
