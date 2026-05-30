"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Send, MessageCircle, X, MapPin, Star, ShieldCheck, Navigation, Camera, RefreshCw, CheckCircle } from "lucide-react";

/* ═══════════════════════════════════════════
   HOTEL FETCH
═══════════════════════════════════════════ */
async function fetchHotel(hotelId) {
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (sbUrl && sbKey && sbUrl !== "undefined") {
    try {
      const res = await fetch(`${sbUrl}/rest/v1/hotels?id=eq.${encodeURIComponent(hotelId)}&select=*`,
        { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } });
      if (res.ok) {
        const data = await res.json();
        if (data?.length > 0) {
          const h = data[0];
          return { id:h.id, name:h.name, location:h.location||"", totalRooms:h.total_rooms||20,
            ownerPhone:h.owner_phone||"", emoji:h.emoji||"🏨",
            standardRate:h.standard_rate||1200, deluxeRate:h.deluxe_rate||2000, suiteRate:h.suite_rate||3800,
            ownerEmail:h.owner_email||"", managerPhone:h.manager_phone||"" };
        }
      }
    } catch {}
  }
  try {
    const cfg = JSON.parse(localStorage.getItem(`air_${hotelId}_config`) || "{}");
    if (cfg.name) return { id:hotelId, name:cfg.name, location:cfg.location||"", totalRooms:cfg.totalRooms||20,
      ownerPhone:cfg.ownerPhone||"", emoji:cfg.emoji||"🏨",
      standardRate:cfg.standardRate||1200, deluxeRate:cfg.deluxeRate||2000, suiteRate:cfg.suiteRate||3800,
      managerPhone:cfg.managerPhone||"" };
  } catch {}
  const DEMOS = [
    { id:"cherry-bhopal",   name:"Hotel Cherry",         location:"Peer Gate, Bhopal, MP",   totalRooms:20, ownerPhone:"919009109108", emoji:"🍒", standardRate:1200, deluxeRate:2000, suiteRate:3800 },
    { id:"hotel-cherry",    name:"Hotel Cherry",         location:"Peer Gate, Bhopal, MP",   totalRooms:20, ownerPhone:"919009109108", emoji:"🍒", standardRate:1200, deluxeRate:2000, suiteRate:3800 },
    { id:"amardeep-palace", name:"Hotel Amardeep Palace",location:"Bhopal, Madhya Pradesh",  totalRooms:20, ownerPhone:"919009109108", emoji:"🏨", standardRate:1200, deluxeRate:2000, suiteRate:3800 },
    { id:"sunrise-jaipur",  name:"Hotel Sunrise Palace", location:"Jaipur, Rajasthan",       totalRooms:40, ownerPhone:"919876543210", emoji:"🌅", standardRate:1500, deluxeRate:2500, suiteRate:5000 },
  ];
  return DEMOS.find(h=>h.id===hotelId) || DEMOS.find(h=>hotelId.includes(h.id.split("-")[0])) || null;
}

/* ═══════════════════════════════════════════
   ROOMS from localStorage
═══════════════════════════════════════════ */
function getRooms(hotelId, total) {
  try {
    const s = JSON.parse(localStorage.getItem(`air_${hotelId}_rooms`) || "[]");
    if (s.length > 0) return s;
  } catch {}
  return Array.from({ length: total }, (_, i) => ({
    id:`${hotelId}_R${String(i+1).padStart(3,"0")}`, number:i+1,
    floor:Math.ceil((i+1)/5), type:i%10===0?"suite":i%3===0?"deluxe":"standard",
    status:"vacant", currentBookingId:null, baseRate:i%10===0?3800:i%3===0?2000:1200,
  }));
}

/* ═══════════════════════════════════════════
   SAVE BOOKING — mirrors db.js saveBooking
═══════════════════════════════════════════ */
async function savePublicBooking(hotelId, bookingData) {
  const uid = ()=>`${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
  const id  = uid();
  const now = new Date().toISOString();
  const nights = Math.max(1, Math.round((new Date(bookingData.checkOutDate)-new Date(bookingData.checkInDate))/86400000));
  const rate  = Number(bookingData.ratePerNight) || 1200;
  const total = nights * rate;

  const booking = {
    id, hotelId,
    guestName:   bookingData.guestName   || "",
    guestPhone:  bookingData.guestPhone  || "",
    address:     bookingData.address     || "",
    idType:      bookingData.idType      || "Aadhaar",
    idNumber:    bookingData.idNumber    || "",
    gender:      bookingData.gender      || "",
    dob:         bookingData.dob         || "",
    nationality: bookingData.nationality || "Indian",
    roomId:      bookingData.roomId      || "",
    roomNumber:  bookingData.roomNumber  || "",
    roomType:    bookingData.roomType    || "standard",
    checkInDate: bookingData.checkInDate || "",
    checkOutDate:bookingData.checkOutDate|| "",
    nights, ratePerNight:rate, totalAmount:total,
    paymentMode: "Pay at Hotel",
    status:      "active",
    isPublicBooking: true,
    rateLocked:  true, lockedAt:now, createdAt:now,
    frontImage:  bookingData.frontImage  || "",
    backImage:   bookingData.backImage   || "",
  };

  // 1. localStorage bookings
  try {
    const key = `air_${hotelId}_bookings`;
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    localStorage.setItem(key, JSON.stringify([booking, ...existing]));
  } catch {}

  // 2. localStorage room status → reserved
  try {
    const rKey = `air_${hotelId}_rooms`;
    const rooms = JSON.parse(localStorage.getItem(rKey) || "[]");
    const updated = rooms.map(r => r.id === booking.roomId
      ? { ...r, status:"reserved", currentBookingId:id, guestName:booking.guestName }
      : r);
    localStorage.setItem(rKey, JSON.stringify(updated));
  } catch {}

  // 3. Supabase sync
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (sbUrl && sbKey && sbUrl !== "undefined") {
    const headers = { "Content-Type":"application/json", apikey:sbKey, Authorization:`Bearer ${sbKey}`, Prefer:"resolution=merge-duplicates" };
    // Save booking
    fetch(`${sbUrl}/rest/v1/bookings`, { method:"POST", headers, body:JSON.stringify({
      id, hotel_id:hotelId, guest_name:booking.guestName, guest_phone:booking.guestPhone,
      address:booking.address, id_type:booking.idType, id_number:booking.idNumber,
      gender:booking.gender, dob:booking.dob, room_id:booking.roomId,
      room_type:booking.roomType, check_in_date:booking.checkInDate,
      check_out_date:booking.checkOutDate, nights, rate_per_night:rate,
      total_amount:total, payment_mode:"Pay at Hotel", status:"active",
      rate_locked:true, created_at:now, is_public_booking:true,
    })}).catch(()=>{});
    // Update room status → reserved
    fetch(`${sbUrl}/rest/v1/rooms?id=eq.${encodeURIComponent(booking.roomId)}`, {
      method:"PATCH", headers,
      body:JSON.stringify({ status:"reserved", current_booking_id:id, guest_name:booking.guestName, updated_at:now })
    }).catch(()=>{});
  }

  return booking;
}

/* ═══════════════════════════════════════════
   HOLOGRAM BUILDING
═══════════════════════════════════════════ */
function HologramBuilding() {
  return (
    <svg viewBox="0 0 160 180" style={{width:100,height:120,filter:"drop-shadow(0 0 16px #008cff) drop-shadow(0 0 32px rgba(0,140,255,0.35))",animation:"holoPulse 3s ease-in-out infinite",flexShrink:0}}>
      <ellipse cx="80" cy="160" rx="62" ry="10" fill="none" stroke="rgba(212,175,55,0.9)" strokeWidth="1.5"/>
      <ellipse cx="80" cy="160" rx="50" ry="7" fill="none" stroke="rgba(212,175,55,0.55)" strokeWidth="1"/>
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
    </svg>
  );
}

/* ═══════════════════════════════════════════
   ROOM KEYCAP
═══════════════════════════════════════════ */
function RoomKeycap({ room, selected, onClick }) {
  const s = room.status;
  const sel = selected;
  const depth = 5;
  const cfg = sel
    ? { face:"linear-gradient(135deg,#7a5c17,#c9a84c,#f5d688)", border:"rgba(212,175,55,1)", glow:"rgba(212,175,55,0.9)", numC:"#000", bottom:"#4a3200", right:"linear-gradient(180deg,#a07820,#6b4f10)" }
    : s==="vacant"
      ? { face:"linear-gradient(160deg,#072e18,#04180c,#020d07)", border:"rgba(34,197,94,0.8)", glow:"rgba(34,197,94,0.7)", numC:"#86efac", bottom:"#010803", right:"linear-gradient(180deg,#04180c,#010804)" }
    : s==="reserved"
      ? { face:"linear-gradient(160deg,#2a1f00,#1a1200,#0d0900)", border:"rgba(212,175,55,0.7)", glow:"rgba(212,175,55,0.5)", numC:"#fde68a", bottom:"#080600", right:"linear-gradient(180deg,#1a1200,#080600)" }
    : s==="occupied"
      ? { face:"linear-gradient(160deg,#1d0d0d,#0d0606)", border:"rgba(239,68,68,0.5)", glow:"rgba(239,68,68,0.4)", numC:"#fca5a5", bottom:"#040101", right:"linear-gradient(180deg,#0d0606,#040101)" }
    : s==="cleaning"
      ? { face:"linear-gradient(160deg,#0d0d1a,#06060d)", border:"rgba(129,140,248,0.5)", glow:"rgba(129,140,248,0.4)", numC:"#c7d2fe", bottom:"#020204", right:"linear-gradient(180deg,#06060d,#020204)" }
      : { face:"linear-gradient(160deg,#111,#090909)", border:"rgba(75,85,99,0.4)", glow:"rgba(75,85,99,0.3)", numC:"#9ca3af", bottom:"#020202", right:"linear-gradient(180deg,#090909,#030303)" };
  const isVacant = s==="vacant";
  return (
    <button onClick={()=>isVacant&&onClick(room)} title={`Room ${room.number} — ${s}`}
      style={{width:"100%",aspectRatio:"1/1.05",position:"relative",background:"transparent",border:"none",padding:0,
        cursor:isVacant?"pointer":"not-allowed",
        transform:sel?"perspective(400px) rotateX(20deg) scale(1.06)":"perspective(400px) rotateX(20deg)",
        transformOrigin:"center 90%",transition:"transform 0.15s ease, filter 0.15s ease",
        filter:`drop-shadow(0 ${depth+2}px ${depth*2}px rgba(0,0,0,0.7)) drop-shadow(0 0 ${depth*2}px ${cfg.glow})`,
        opacity:(!isVacant&&!sel)?0.45:1,
      }}>
      <div style={{position:"absolute",inset:0,top:`${depth}px`,borderRadius:"5px 5px 7px 7px",background:cfg.bottom,boxShadow:"0 4px 12px rgba(0,0,0,0.9)"}}/>
      <div style={{position:"absolute",top:`${depth}px`,right:0,bottom:0,width:`${depth}px`,background:cfg.right,borderRadius:"0 2px 4px 0"}}/>
      <div style={{position:"absolute",inset:0,bottom:`${depth}px`,borderRadius:"6px 6px 4px 4px",background:cfg.face,
        border:`1.5px solid ${cfg.border}`,boxShadow:"inset 0 0 14px rgba(0,0,0,0.6),inset 0 1px 0 rgba(255,255,255,0.12)",
        overflow:"hidden",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,padding:"3px 2px"}}>
        <div style={{position:"absolute",top:0,left:"6%",right:"6%",height:"35%",background:"linear-gradient(180deg,rgba(255,255,255,0.2),rgba(255,255,255,0.02))",borderRadius:"6px 6px 50% 50%",zIndex:2}}/>
        <div style={{width:11,height:11,borderRadius:"50%",background:`radial-gradient(circle,${cfg.border},${cfg.border}cc)`,
          boxShadow:`0 0 8px ${cfg.border}`,position:"relative",zIndex:3,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <svg viewBox="0 0 10 10" style={{width:7,height:7}}>
            <circle cx="5" cy="3.2" r="1.8" fill="white" opacity="0.95"/>
            <path d="M1.5,9 Q1.5,6.2 5,6.2 Q8.5,6.2 8.5,9Z" fill="white" opacity="0.95"/>
          </svg>
        </div>
        <span style={{fontSize:8,color:sel?"#000":cfg.numC,fontWeight:900,fontFamily:"'Courier New',monospace",lineHeight:1,position:"relative",zIndex:3}}>
          {room.number}
        </span>
        {s==="reserved" && !sel && (
          <span style={{fontSize:6,color:"#fde68a",position:"relative",zIndex:3,lineHeight:1}}>📌</span>
        )}
      </div>
    </button>
  );
}

/* ═══════════════════════════════════════════
   AI SCAN REACTOR
═══════════════════════════════════════════ */
function AiReactor({ scanning, progress }) {
  return (
    <div style={{position:"relative",width:110,height:110,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
      {[{sz:-8,color:"rgba(0,140,255,0.65)",dash:"6,4",spd:"3s"},{sz:4,color:"rgba(212,175,55,0.5)",dash:"4,6",spd:"5s"},{sz:15,color:"rgba(0,140,255,0.3)",dash:"8,8",spd:"7s"}].map((r,i)=>(
        <div key={i} style={{position:"absolute",inset:r.sz,borderRadius:"50%",border:`1.5px dashed ${r.color}`,animation:`spinRingCW ${r.spd} linear infinite${i===1?" reverse":""}`}}/>
      ))}
      {[0,60,120,180,240,300].map(deg=>(
        <div key={deg} style={{position:"absolute",width:1,bottom:"50%",left:"50%",height:"40%",transformOrigin:"50% 100%",transform:`translateX(-50%) rotate(${deg}deg)`,background:`linear-gradient(to bottom,rgba(0,140,255,0.5),transparent)`}}/>
      ))}
      <div style={{position:"absolute",inset:16,borderRadius:"50%",background:"radial-gradient(circle,rgba(0,20,60,0.97),rgba(0,5,18,0.99))",border:"2px solid rgba(0,140,255,0.55)",boxShadow:"0 0 28px rgba(0,140,255,0.5),inset 0 0 24px rgba(0,140,255,0.12)"}}/>
      <div style={{position:"relative",zIndex:2,textAlign:"center"}}>
        {scanning ? (
          <>
            <div style={{display:"flex",gap:3,alignItems:"flex-end",justifyContent:"center",height:18,marginBottom:2}}>
              {[0,1,2,3].map(i=>(
                <div key={i} style={{width:2.5,borderRadius:2,background:"#008cff",animation:"audioBar 0.6s ease-in-out infinite",animationDelay:`${i*0.15}s`}}/>
              ))}
            </div>
            <p style={{fontSize:7,fontWeight:800,letterSpacing:"0.2em",color:"#60b8ff"}}>{progress}%</p>
          </>
        ) : (
          <>
            <p style={{fontSize:16,fontWeight:900,letterSpacing:"0.08em",color:"#fff",textShadow:"0 0 18px #008cff",lineHeight:1,fontFamily:"monospace"}}>AI</p>
            <p style={{fontSize:7,fontWeight:800,letterSpacing:"0.28em",color:"#60b8ff",marginTop:2}}>SCAN ID</p>
          </>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════ */
export default function PublicBookingPage() {
  const { hotelId } = useParams();

  // ── hotel & rooms ──
  const [hotel,       setHotel]       = useState(null);
  const [rooms,       setRooms]       = useState([]);
  const [pageLoading, setPageLoading] = useState(true);

  // ── room selection ──
  const [selectedRoom, setSelectedRoom] = useState(null);

  // ── GRC form fields ──
  const [guestName,   setGuestName]   = useState("");
  const [guestPhone,  setGuestPhone]  = useState("");
  const [checkIn,     setCheckIn]     = useState("");
  const [checkOut,    setCheckOut]    = useState("");
  const [address,     setAddress]     = useState("");
  const [idType,      setIdType]      = useState("Aadhaar");
  const [idNumber,    setIdNumber]    = useState("");
  const [gender,      setGender]      = useState("");
  const [dob,         setDob]         = useState("");
  const [nationality, setNationality] = useState("Indian");
  const [roomType,    setRoomType]    = useState("Deluxe Room");

  // ── AI Scanner ──
  const [scanStep,    setScanStep]    = useState("idle"); // idle | camera | scanning | done | error
  const [scanSide,    setScanSide]    = useState("front"); // front | back
  const [scanProgress,setScanProgress]= useState(0);
  const [frontImage,  setFrontImage]  = useState("");
  const [backImage,   setBackImage]   = useState("");
  const [scanError,   setScanError]   = useState("");
  const videoRef   = useRef(null);
  const canvasRef  = useRef(null);
  const streamRef  = useRef(null);

  // ── booking ──
  const [submitting,  setSubmitting]  = useState(false);
  const [submitted,   setSubmitted]   = useState(false);
  const [bookingResult,setBookingResult] = useState(null);
  const [formError,   setFormError]   = useState("");

  // ── chat ──
  const [chatOpen,    setChatOpen]    = useState(false);
  const [messages,    setMessages]    = useState([]);
  const [chatInput,   setChatInput]   = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // ── faq ──
  const [faqOpen, setFaqOpen] = useState(null);

  /* ── Load hotel ── */
  useEffect(() => {
    if (!hotelId) { setPageLoading(false); return; }
    fetchHotel(hotelId).then(h => {
      setHotel(h);
      if (h) setRooms(getRooms(hotelId, h.totalRooms || 20));
      setPageLoading(false);
    });
  }, [hotelId]);

  /* ── Init chat ── */
  useEffect(() => {
    if (hotel && messages.length === 0) {
      setMessages([{ role:"assistant", content:`Namaste! 🙏 **${hotel.name}** ke Direct Booking Desk par swagat hai!\n\nDirect booking se **18% OTA commission save** hoga.\n\n💰 Rates:\n• Standard: ₹${hotel.standardRate?.toLocaleString("en-IN")}/raat\n• Deluxe: ₹${hotel.deluxeRate?.toLocaleString("en-IN")}/raat\n• Suite: ₹${hotel.suiteRate?.toLocaleString("en-IN")}/raat\n\nKis date ke liye room chahiye?` }]);
    }
  }, [hotel]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  /* ══════════════════════════════════════
     CAMERA / AI SCAN LOGIC
  ══════════════════════════════════════ */
  const startCamera = async () => {
    setScanError("");
    setScanStep("camera");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode:"environment", width:{ideal:1280}, height:{ideal:720} }
      });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
    } catch (e) {
      setScanError("Camera access nahi mila. Browser settings mein allow karo.");
      setScanStep("idle");
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t=>t.stop());
    streamRef.current = null;
  };

  const captureAndScan = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    // Capture frame
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width  = video.videoWidth  || 1280;
    canvas.height = video.videoHeight || 720;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const base64 = canvas.toDataURL("image/jpeg", 0.85).split(",")[1];

    if (scanSide === "front") setFrontImage(base64);
    else setBackImage(base64);

    stopCamera();
    setScanStep("scanning");
    setScanProgress(0);

    // Progress animation
    const prog = setInterval(() => setScanProgress(p => { if(p>=90) { clearInterval(prog); return 90; } return p+15; }), 300);

    try {
      const res  = await fetch("/api/groq", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ type:"id_scan", imageBase64:base64 })
      });
      const data = await res.json();
      clearInterval(prog); setScanProgress(100);

      if (data.success && data.data) {
        const d = data.data;
        if (d.name)    setGuestName(d.name);
        if (d.address) setAddress(d.address);
        if (d.idType)  setIdType(d.idType);
        if (d.idNumber)setIdNumber(d.idNumber);
        if (d.gender)  setGender(d.gender === "M" ? "Male" : d.gender === "F" ? "Female" : d.gender);
        if (d.dob)     setDob(d.dob);
        setScanStep("done");
      } else {
        throw new Error("Scan failed");
      }
    } catch {
      clearInterval(prog);
      setScanError("Scan ho nahi paya. Dobara try karo.");
      setScanStep("error");
    }
  };

  const resetScan = () => { setScanStep("idle"); setScanError(""); setScanProgress(0); setScanSide("front"); setFrontImage(""); setBackImage(""); };

  /* ═══ NIGHTS & RATE ═══ */
  const nights = (() => { if(!checkIn||!checkOut) return 0; const d=(new Date(checkOut)-new Date(checkIn))/86400000; return d>0?Math.round(d):0; })();
  const rateMap = { "Standard Room":hotel?.standardRate||1200, "Deluxe Room":hotel?.deluxeRate||2000, "Suite Room":hotel?.suiteRate||3800 };
  const roomRate = selectedRoom ? (selectedRoom.baseRate || rateMap[roomType]) : rateMap[roomType];
  const total    = nights * roomRate;
  const vacantN  = rooms.filter(r=>r.status==="vacant").length;

  /* ═══ ROOM GRID ═══ */
  const byFloor = {};
  rooms.forEach(r => { if(!byFloor[r.floor]) byFloor[r.floor]=[]; byFloor[r.floor].push(r); });
  const floors  = Object.keys(byFloor).map(Number).sort((a,b)=>b-a);

  /* ═══ VALIDATE ═══ */
  const validate = () => {
    if (!guestName.trim())  return "Guest ka naam likhiye";
    if (!guestPhone.trim() || guestPhone.replace(/\D/g,"").length < 10) return "Valid 10-digit phone likhiye";
    if (!checkIn)           return "Check-in date select karo";
    if (!checkOut)          return "Check-out date select karo";
    if (nights <= 0)        return "Check-out, check-in ke baad honi chahiye";
    if (!selectedRoom && !roomType) return "Room select karo";
    return null;
  };

  /* ═══ BOOK ═══ */
  const handleBook = async () => {
    setFormError("");
    const err = validate();
    if (err) { setFormError(err); return; }
    setSubmitting(true);

    const bookingData = {
      guestName, guestPhone, address, idType, idNumber, gender, dob, nationality,
      roomId:      selectedRoom?.id || `${hotelId}_public`,
      roomNumber:  selectedRoom?.number || "",
      roomType:    selectedRoom ? selectedRoom.type : roomType.split(" ")[0].toLowerCase(),
      checkInDate: checkIn, checkOutDate: checkOut,
      ratePerNight: roomRate, isPublicBooking: true,
      frontImage, backImage,
    };

    try {
      const booking = await savePublicBooking(hotelId, bookingData);
      setBookingResult(booking);
      setSubmitted(true);

      // WhatsApp alert to owner
      const roomLabel = selectedRoom ? `Room ${selectedRoom.number}` : roomType;
      const waMsg = `🏨 *${hotel.name} — Online Booking Request!*\n\n👤 *Guest:* ${guestName}\n📞 *Phone:* ${guestPhone}\n🛏️ *Room:* ${roomLabel}\n📅 *Check-in:* ${checkIn}\n📅 *Check-out:* ${checkOut}\n🌙 *Nights:* ${nights}\n💰 *Rate:* ₹${roomRate.toLocaleString("en-IN")}/raat\n💵 *Total:* ₹${total.toLocaleString("en-IN")}\n\n🪪 *ID:* ${idType} - ${idNumber}\n📍 *Address:* ${address}\n\n⚠️ Room ${selectedRoom?.number||""} RESERVED kar diya hai — Dashboard pe dekho.\n_Powered by The GuestInn AI_`;
      const phone = hotel.ownerPhone?.replace(/\D/g,"") || "";
      if (phone) window.open(`https://wa.me/${phone}?text=${encodeURIComponent(waMsg)}`, "_blank");

      // Refresh local rooms display
      setRooms(getRooms(hotelId, hotel.totalRooms));
    } catch {
      setFormError("Booking save nahi ho payi. Dobara try karo.");
    }
    setSubmitting(false);
  };

  /* ═══ CHAT ═══ */
  const sendChat = async (override) => {
    const text = (override || chatInput).trim();
    if (!text || chatLoading) return;
    if (!override) setChatInput("");
    const newMsgs = [...messages, { role:"user", content:text }];
    setMessages(newMsgs);
    setChatLoading(true);
    try {
      const res  = await fetch("/api/groq", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ type:"chat", hotelConfig:{ name:hotel?.name, location:hotel?.location, rates:{ standard:hotel?.standardRate, deluxe:hotel?.deluxeRate, suite:hotel?.suiteRate } }, messages:newMsgs.map(m=>({role:m.role,content:m.content})) })
      });
      const data = await res.json();
      setMessages(p=>[...p,{ role:"assistant", content:data.message||"Thodi der baad try karo 🙏" }]);
    } catch {
      setMessages(p=>[...p,{ role:"assistant", content:"Connection issue. Dobara try karo 🙏" }]);
    }
    setChatLoading(false);
  };

  /* ══════════════════════════════════════
     RENDER
  ══════════════════════════════════════ */
  if (pageLoading) return (
    <div style={{minHeight:"100vh",background:"#07090E",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{width:50,height:50,borderRadius:"50%",border:"2px solid rgba(0,140,255,0.3)",borderTop:"2px solid #008cff",animation:"spinRingCW 1s linear infinite"}}/>
      <style>{`@keyframes spinRingCW{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if (!hotel) return (
    <div style={{minHeight:"100vh",background:"#07090E",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <p style={{color:"rgba(255,255,255,0.3)"}}>Hotel not found</p>
    </div>
  );

  const inpStyle = { width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,padding:"11px 13px",fontSize:13,color:"#fff",outline:"none",boxSizing:"border-box",colorScheme:"dark" };
  const labelStyle = { fontSize:9,fontWeight:700,color:"rgba(255,255,255,0.35)",letterSpacing:"0.1em",textTransform:"uppercase",display:"block",marginBottom:5 };

  return (
    <div style={{minHeight:"100vh",background:"#07090E",color:"#fff",fontFamily:"system-ui,-apple-system,sans-serif",paddingBottom:90}}>
      <style>{`
        @keyframes spinRingCW  {from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes holoPulse   {0%,100%{filter:drop-shadow(0 0 12px #008cff) drop-shadow(0 0 28px rgba(0,140,255,0.4))}50%{filter:drop-shadow(0 0 22px #00aaff) drop-shadow(0 0 55px rgba(0,160,255,0.65))}}
        @keyframes audioBar    {0%,100%{height:4px}50%{height:16px}}
        @keyframes fadeUp      {from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideUp     {from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes dotBounce   {0%,80%,100%{transform:scale(0.4);opacity:0.3}40%{transform:scale(1);opacity:1}}
        @keyframes greenPulse  {0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0.4)}50%{box-shadow:0 0 0 6px rgba(34,197,94,0)}}
        input:focus,select:focus,textarea:focus{border-color:rgba(212,175,55,0.5)!important;background:rgba(212,175,55,0.04)!important}
        input::placeholder,textarea::placeholder{color:rgba(255,255,255,0.2)}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:rgba(212,175,55,0.15);border-radius:3px}
      `}</style>

      {/* ── NAV ── */}
      <nav style={{position:"sticky",top:0,zIndex:40,background:"rgba(7,9,14,0.94)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,255,255,0.05)",padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#1a1400,#2d2200)",border:"1px solid rgba(212,175,55,0.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{hotel.emoji}</div>
          <div>
            <p style={{fontSize:14,fontWeight:800,color:"#fff"}}>{hotel.name}</p>
            <p style={{fontSize:10,color:"rgba(255,255,255,0.35)",display:"flex",alignItems:"center",gap:3}}><MapPin size={9} style={{color:"#D4AF37"}}/>{hotel.location}</p>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:5,background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.2)",borderRadius:20,padding:"5px 10px",animation:"greenPulse 2s infinite"}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:"#22c55e"}}/>
          <span style={{fontSize:9,fontWeight:700,color:"#22c55e",letterSpacing:"0.08em"}}>LIVE</span>
        </div>
      </nav>

      {/* ── HERO ── */}
      <div style={{padding:"20px 16px 16px",background:"linear-gradient(180deg,rgba(0,18,45,0.4),transparent)",borderBottom:"1px solid rgba(0,140,255,0.06)",display:"flex",alignItems:"center",gap:12,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,opacity:0.025,backgroundImage:"linear-gradient(rgba(0,140,255,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(0,140,255,0.8) 1px,transparent 1px)",backgroundSize:"26px 26px",pointerEvents:"none"}}/>
        <div style={{flex:1}}>
          <div style={{display:"flex",gap:3,marginBottom:7}}>
            {[...Array(5)].map((_,i)=><Star key={i} size={11} style={{color:"#D4AF37",fill:"#D4AF37"}}/>)}
          </div>
          <h1 style={{fontSize:20,fontWeight:900,color:"#fff",lineHeight:1.2,marginBottom:5}}>
            {hotel.name}<br/>
            <span style={{background:"linear-gradient(90deg,#D4AF37,#F5C842)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",fontSize:16}}>Direct Booking</span>
          </h1>
          <p style={{fontSize:11,color:"rgba(255,255,255,0.35)"}}>OTA se book mat karo — <span style={{color:"#22c55e",fontWeight:700}}>18% bachao</span></p>
          <div style={{display:"flex",gap:6,marginTop:10,flexWrap:"wrap"}}>
            {["📶 WiFi","🚗 Parking","☕ Breakfast","❄️ AC"].map(a=>(
              <span key={a} style={{fontSize:9,padding:"3px 7px",borderRadius:5,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",color:"rgba(255,255,255,0.4)"}}>{a}</span>
            ))}
          </div>
        </div>
        <HologramBuilding/>
      </div>

      <div style={{padding:"0 14px"}}>

        {/* ═══ ROOM GRID ═══ */}
        <div style={{background:"linear-gradient(135deg,rgba(6,8,16,0.99),rgba(4,5,12,0.99))",border:"1px solid rgba(255,255,255,0.065)",borderRadius:20,padding:"16px 12px 14px",margin:"14px 0 12px",boxShadow:"0 4px 28px rgba(0,0,0,0.6)"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <p style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.45)",letterSpacing:"0.1em",textTransform:"uppercase"}}>🛏️ Room Select Karo</p>
            <div style={{display:"flex",alignItems:"center",gap:5,background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.2)",borderRadius:8,padding:"3px 8px"}}>
              <div style={{width:5,height:5,borderRadius:"50%",background:"#22c55e"}}/>
              <span style={{fontSize:9,color:"#22c55e",fontWeight:700}}>{vacantN} Available</span>
            </div>
          </div>

          {floors.map(floor=>{
            const fr = byFloor[floor]; const cols = 5;
            const padded = [...fr]; while(padded.length%cols!==0) padded.push(null);
            const rowArr=[]; for(let i=0;i<padded.length;i+=cols) rowArr.push(padded.slice(i,i+cols));
            return (
              <div key={floor} style={{marginBottom:4}}>
                {rowArr.map((row,ri)=>(
                  <div key={ri} style={{display:"flex",alignItems:"flex-end",gap:4,marginBottom:4}}>
                    <span style={{fontSize:7,color:"rgba(255,255,255,0.18)",width:14,textAlign:"right",flexShrink:0,fontWeight:700,paddingBottom:4,fontFamily:"monospace"}}>{ri===0?String(floor).padStart(2,"0"):""}</span>
                    <div style={{flex:1,display:"grid",gridTemplateColumns:`repeat(${cols},1fr)`,gap:4}}>
                      {row.map((room,ci)=> room
                        ? <RoomKeycap key={room.id} room={room} selected={selectedRoom?.id===room.id} onClick={r=>setSelectedRoom(prev=>prev?.id===r.id?null:r)}/>
                        : <div key={`ph${ci}`} style={{aspectRatio:"1/1.05",borderRadius:6,background:"rgba(255,255,255,0.008)",border:"1px dashed rgba(255,255,255,0.03)"}}/>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}

          <div style={{display:"flex",flexWrap:"wrap",gap:"4px 12px",marginTop:10,paddingTop:8,borderTop:"1px solid rgba(255,255,255,0.05)"}}>
            {[{c:"#22c55e",l:"Available"},{c:"#D4AF37",l:"Reserved"},{c:"#ef4444",l:"Occupied"},{c:"#818cf8",l:"Cleaning"}].map(x=>(
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

        {/* ═══ AI SCANNER ═══ */}
        <div style={{background:"linear-gradient(135deg,rgba(0,18,45,0.55),rgba(0,8,22,0.65))",border:"1px solid rgba(0,140,255,0.18)",borderRadius:20,padding:"16px",marginBottom:12,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",inset:0,opacity:0.025,backgroundImage:"linear-gradient(rgba(0,140,255,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(0,140,255,0.8) 1px,transparent 1px)",backgroundSize:"22px 22px",pointerEvents:"none"}}/>

          <p style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.45)",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:12}}>📷 AI ID Scanner</p>

          {/* Camera view */}
          {scanStep === "camera" && (
            <div style={{borderRadius:16,overflow:"hidden",background:"#000",position:"relative",marginBottom:12,border:"1px solid rgba(0,140,255,0.3)"}}>
              <video ref={videoRef} autoPlay playsInline muted style={{width:"100%",maxHeight:220,objectFit:"cover",display:"block"}}/>
              <canvas ref={canvasRef} style={{display:"none"}}/>
              <div style={{position:"absolute",inset:0,border:"2px solid rgba(0,140,255,0.5)",borderRadius:16,pointerEvents:"none"}}/>
              <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"10px 12px",background:"linear-gradient(transparent,rgba(0,0,0,0.8))",display:"flex",gap:8,justifyContent:"center"}}>
                <button onClick={captureAndScan} style={{flex:1,padding:"11px",borderRadius:12,background:"linear-gradient(135deg,#0050c8,#008cff)",border:"none",color:"#fff",fontWeight:800,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                  <Camera size={15}/> Scan Karo
                </button>
                <button onClick={()=>{stopCamera();setScanStep("idle");}} style={{padding:"11px 14px",borderRadius:12,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.5)",cursor:"pointer"}}>✕</button>
              </div>
              <div style={{position:"absolute",top:10,left:0,right:0,textAlign:"center"}}>
                <span style={{fontSize:11,padding:"4px 12px",borderRadius:10,background:"rgba(0,0,0,0.7)",color:"#60b8ff",fontWeight:600}}>
                  {scanSide==="front"?"ID ka Front Side":"ID ka Back Side"} frame mein rakho
                </span>
              </div>
            </div>
          )}

          {/* Reactor row */}
          <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:scanStep==="camera"?0:14}}>
            <AiReactor scanning={scanStep==="scanning"} progress={scanProgress}/>
            <div style={{flex:1}}>
              {scanStep==="idle" && (<>
                <p style={{fontSize:13,fontWeight:800,color:"#60b8ff",marginBottom:4}}>Aadhaar / PAN / Passport</p>
                <p style={{fontSize:11,color:"rgba(255,255,255,0.4)",lineHeight:1.5,marginBottom:8}}>Camera se scan karo — form auto-fill ho jayega</p>
                <button onClick={()=>{setScanSide("front");startCamera();}} style={{padding:"9px 14px",borderRadius:10,background:"rgba(0,140,255,0.12)",border:"1px solid rgba(0,140,255,0.3)",color:"#60b8ff",fontSize:11,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
                  <Camera size={13}/> Camera Kholo
                </button>
              </>)}
              {scanStep==="scanning" && (
                <div style={{animation:"fadeUp 0.3s ease"}}>
                  <p style={{fontSize:13,fontWeight:800,color:"#60b8ff",marginBottom:4}}>AI Scan ho raha hai...</p>
                  <div style={{height:4,background:"rgba(0,140,255,0.15)",borderRadius:4,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${scanProgress}%`,background:"linear-gradient(90deg,#008cff,#60b8ff)",borderRadius:4,transition:"width 0.3s ease"}}/>
                  </div>
                  <p style={{fontSize:10,color:"rgba(0,140,255,0.6)",marginTop:4}}>Llama 4 Vision processing...</p>
                </div>
              )}
              {scanStep==="done" && (
                <div style={{animation:"fadeUp 0.3s ease"}}>
                  <p style={{fontSize:13,fontWeight:800,color:"#22c55e",marginBottom:3}}>✓ ID Scan Successful!</p>
                  <p style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginBottom:6}}>{guestName} · {idType}</p>
                  {!backImage && (
                    <button onClick={()=>{setScanSide("back");startCamera();setScanStep("camera");}} style={{padding:"7px 12px",borderRadius:8,background:"rgba(212,175,55,0.1)",border:"1px solid rgba(212,175,55,0.3)",color:"#D4AF37",fontSize:10,fontWeight:700,cursor:"pointer",marginRight:6}}>
                      📷 Back Side Bhi Scan Karo
                    </button>
                  )}
                  <button onClick={resetScan} style={{padding:"7px 12px",borderRadius:8,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.4)",fontSize:10,cursor:"pointer"}}>
                    <RefreshCw size={10} style={{display:"inline",marginRight:4}}/>Reset
                  </button>
                </div>
              )}
              {scanStep==="error" && (
                <div style={{animation:"fadeUp 0.3s ease"}}>
                  <p style={{fontSize:12,color:"#ef4444",marginBottom:6}}>{scanError || "Scan nahi hua."}</p>
                  <button onClick={()=>{setScanStep("camera");startCamera();}} style={{padding:"7px 12px",borderRadius:8,background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",color:"#ef4444",fontSize:10,cursor:"pointer",marginRight:6}}>
                    Dobara Try Karo
                  </button>
                  <button onClick={resetScan} style={{padding:"7px 12px",borderRadius:8,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.4)",fontSize:10,cursor:"pointer"}}>Skip Karo</button>
                </div>
              )}
            </div>
          </div>

          {/* GRC Form Fields */}
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><label style={labelStyle}>Guest Name *</label><input value={guestName} onChange={e=>setGuestName(e.target.value)} placeholder="Suresh Kumar" style={inpStyle}/></div>
              <div><label style={labelStyle}>Phone *</label><input value={guestPhone} onChange={e=>setGuestPhone(e.target.value)} placeholder="9876543210" type="tel" style={inpStyle}/></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><label style={labelStyle}>Check-In *</label><input type="date" value={checkIn} onChange={e=>setCheckIn(e.target.value)} min={new Date().toISOString().split("T")[0]} style={inpStyle}/></div>
              <div><label style={labelStyle}>Check-Out *</label><input type="date" value={checkOut} onChange={e=>setCheckOut(e.target.value)} min={checkIn||new Date().toISOString().split("T")[0]} style={inpStyle}/></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><label style={labelStyle}>ID Type</label>
                <select value={idType} onChange={e=>setIdType(e.target.value)} style={inpStyle}>
                  {["Aadhaar","PAN","Passport","Driving License","Voter ID"].map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <div><label style={labelStyle}>ID Number</label><input value={idNumber} onChange={e=>setIdNumber(e.target.value)} placeholder="XXXX XXXX XXXX" style={inpStyle}/></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><label style={labelStyle}>Gender</label>
                <select value={gender} onChange={e=>setGender(e.target.value)} style={inpStyle}>
                  <option value="">Select</option><option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
              <div><label style={labelStyle}>Date of Birth</label><input type="date" value={dob} onChange={e=>setDob(e.target.value)} style={inpStyle}/></div>
            </div>
            <div><label style={labelStyle}>Address</label><textarea value={address} onChange={e=>setAddress(e.target.value)} placeholder="Full address..." rows={2} style={{...inpStyle,resize:"none",lineHeight:1.5}}/></div>
            {!selectedRoom && (
              <div><label style={labelStyle}>Room Type</label>
                <select value={roomType} onChange={e=>setRoomType(e.target.value)} style={inpStyle}>
                  <option value="Standard Room">Standard Room — ₹{hotel.standardRate?.toLocaleString("en-IN")}/raat</option>
                  <option value="Deluxe Room">Deluxe Room — ₹{hotel.deluxeRate?.toLocaleString("en-IN")}/raat</option>
                  <option value="Suite Room">Suite Room — ₹{hotel.suiteRate?.toLocaleString("en-IN")}/raat</option>
                </select>
              </div>
            )}

            {/* Bill */}
            {nights > 0 && (
              <div style={{background:"rgba(212,175,55,0.06)",border:"1px solid rgba(212,175,55,0.2)",borderRadius:12,padding:"12px 14px",animation:"fadeUp 0.3s ease"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                  <span style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>{selectedRoom?`Room ${selectedRoom.number}`:roomType} × {nights} raat</span>
                  <span style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>₹{roomRate.toLocaleString("en-IN")} × {nights}</span>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:14,fontWeight:800,color:"#D4AF37"}}>Total</span>
                  <span style={{fontSize:20,fontWeight:900,color:"#D4AF37",textShadow:"0 0 16px rgba(212,175,55,0.4)"}}>₹{total.toLocaleString("en-IN")}</span>
                </div>
              </div>
            )}

            {formError && (
              <div style={{padding:"10px 12px",borderRadius:10,background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.25)",color:"#ef4444",fontSize:12,animation:"fadeUp 0.2s ease"}}>⚠️ {formError}</div>
            )}

            {/* Submit */}
            {submitted ? (
              <div style={{textAlign:"center",padding:"20px",borderRadius:16,background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.25)",animation:"fadeUp 0.4s ease"}}>
                <CheckCircle size={36} style={{color:"#22c55e",margin:"0 auto 10px",display:"block"}}/>
                <p style={{fontSize:15,fontWeight:800,color:"#22c55e",marginBottom:4}}>Booking Confirm Ho Gayi! 🎉</p>
                <p style={{fontSize:12,color:"rgba(255,255,255,0.4)",marginBottom:8}}>Room {bookingResult?.roomNumber || selectedRoom?.number || ""} aapke naam RESERVE ho gaya hai</p>
                <div style={{background:"rgba(0,0,0,0.3)",borderRadius:10,padding:"10px 12px",textAlign:"left"}}>
                  <p style={{fontSize:11,color:"rgba(255,255,255,0.5)",marginBottom:4}}>📋 Booking ID: <span style={{color:"rgba(255,255,255,0.7)",fontFamily:"monospace"}}>{bookingResult?.id?.slice(0,12)}</span></p>
                  <p style={{fontSize:11,color:"rgba(255,255,255,0.5)"}}>🏨 Hotel team aapko <strong style={{color:"#fff"}}>{guestPhone}</strong> par confirm karegi</p>
                </div>
              </div>
            ) : (
              <button onClick={handleBook} disabled={submitting} style={{width:"100%",padding:"15px",borderRadius:14,fontWeight:900,fontSize:14,background:submitting?"rgba(212,175,55,0.3)":"linear-gradient(135deg,#b8960c,#D4AF37,#F5C842)",color:"#000",border:"none",cursor:submitting?"not-allowed":"pointer",boxShadow:"0 4px 24px rgba(212,175,55,0.35)",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                {submitting ? <><div style={{width:16,height:16,borderRadius:"50%",border:"2px solid rgba(0,0,0,0.3)",borderTop:"2px solid #000",animation:"spinRingCW 0.8s linear infinite"}}/> Saving...</> : "📱 Book Karo & Owner Ko Batao"}
              </button>
            )}

            <div style={{display:"flex",gap:8,padding:"10px 12px",borderRadius:10,background:"rgba(0,140,255,0.04)",border:"1px solid rgba(0,140,255,0.1)"}}>
              <ShieldCheck size={13} style={{color:"#60b8ff",flexShrink:0,marginTop:1}}/>
              <p style={{fontSize:10,color:"rgba(255,255,255,0.3)",lineHeight:1.5}}>Direct booking se <strong style={{color:"rgba(255,255,255,0.5)"}}>rate lock</strong> hota hai — checkout tak rate change nahi hoga. Room dashboard pe <strong style={{color:"#D4AF37"}}>Reserved</strong> dikhaega.</p>
            </div>
          </div>
        </div>

        {/* ═══ LOCATION ═══ */}
        <div style={{background:"rgba(6,8,15,0.98)",border:"1px solid rgba(255,255,255,0.055)",borderRadius:16,padding:"14px",marginBottom:12}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
            <div style={{width:36,height:36,borderRadius:10,background:"rgba(0,140,255,0.1)",border:"1px solid rgba(0,140,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <MapPin size={15} style={{color:"#60b8ff"}}/>
            </div>
            <div>
              <p style={{fontSize:13,fontWeight:700,color:"#fff"}}>{hotel.name}</p>
              <p style={{fontSize:11,color:"rgba(255,255,255,0.35)"}}>{hotel.location}</p>
            </div>
          </div>
          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotel.name+" "+hotel.location)}`} target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,width:"100%",padding:"10px",borderRadius:10,background:"rgba(0,140,255,0.08)",border:"1px solid rgba(0,140,255,0.2)",color:"#60b8ff",fontSize:11,fontWeight:700,textDecoration:"none"}}>
            <Navigation size={11}/> Google Maps Pe Dekho
          </a>
        </div>

        {/* ═══ FAQ ═══ */}
        <FaqSection faqOpen={faqOpen} setFaqOpen={setFaqOpen}/>

      </div>

      {/* ── CHAT BUTTON ── */}
      {!chatOpen && (
        <button onClick={()=>setChatOpen(true)} style={{position:"fixed",bottom:20,right:18,zIndex:50,width:52,height:52,borderRadius:"50%",background:"linear-gradient(135deg,#0050c8,#0080ff)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 20px rgba(0,140,255,0.4)"}}>
          <MessageCircle size={20} style={{color:"#fff"}}/>
          <div style={{position:"absolute",top:3,right:3,width:10,height:10,borderRadius:"50%",background:"#22c55e",border:"2px solid #07090E"}}/>
        </button>
      )}

      {/* ── CHAT PANEL ── */}
      {chatOpen && (
        <div style={{position:"fixed",inset:0,zIndex:50,display:"flex",flexDirection:"column",background:"linear-gradient(180deg,#0d111e,#060810)",animation:"slideUp 0.3s cubic-bezier(0.16,1,0.3,1) forwards"}}>
          <div style={{padding:"14px 16px",borderBottom:"1px solid rgba(255,255,255,0.05)",display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(0,0,0,0.3)",flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,#14172a,#1e293b)",border:"1px solid rgba(212,175,55,0.4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>👩‍💼</div>
              <div>
                <p style={{fontSize:12,fontWeight:800,color:"#D4AF37"}}>AI Receptionist</p>
                <p style={{fontSize:9,color:"#22c55e",display:"flex",alignItems:"center",gap:3}}><span style={{width:5,height:5,borderRadius:"50%",background:"#22c55e",display:"inline-block"}}/>Online</p>
              </div>
            </div>
            <button onClick={()=>setChatOpen(false)} style={{width:32,height:32,borderRadius:8,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",color:"rgba(255,255,255,0.4)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <X size={15}/>
            </button>
          </div>
          <div style={{flex:1,padding:"14px",overflowY:"auto",display:"flex",flexDirection:"column",gap:10,WebkitOverflowScrolling:"touch"}}>
            {messages.map((msg,i)=>(
              <div key={i} style={{display:"flex",justifyContent:msg.role==="user"?"flex-end":"flex-start",animation:"fadeUp 0.25s ease"}}>
                <div style={{maxWidth:"85%",padding:"10px 13px",borderRadius:msg.role==="user"?"14px 14px 4px 14px":"14px 14px 14px 4px",fontSize:12,lineHeight:1.6,background:msg.role==="user"?"linear-gradient(135deg,#91711e,#D4AF37)":"rgba(255,255,255,0.05)",color:msg.role==="user"?"#000":"rgba(255,255,255,0.8)",border:msg.role==="user"?"none":"1px solid rgba(255,255,255,0.06)",fontWeight:msg.role==="user"?700:400}}>
                  {msg.content.split("**").map((p,j)=>j%2===1?<strong key={j}>{p}</strong>:p)}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div style={{display:"flex",gap:5,padding:"8px 4px"}}>
                {[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:"50%",background:"#008cff",animation:"dotBounce 1.2s infinite",animationDelay:`${i*0.2}s`}}/>)}
              </div>
            )}
            <div ref={chatEndRef}/>
          </div>
          <div style={{padding:"8px 14px 0",display:"flex",gap:6,flexWrap:"wrap",flexShrink:0}}>
            {["Rates kya hain?","Room available hai?","Check-in time?","Book karna hai"].map(q=>(
              <button key={q} onClick={()=>sendChat(q)} style={{fontSize:10,padding:"6px 10px",borderRadius:8,background:"rgba(212,175,55,0.08)",border:"1px solid rgba(212,175,55,0.2)",color:"#D4AF37",cursor:"pointer",fontWeight:600,whiteSpace:"nowrap"}}>{q}</button>
            ))}
          </div>
          <div style={{padding:"10px 14px 16px",borderTop:"1px solid rgba(255,255,255,0.05)",background:"rgba(0,0,0,0.3)",display:"flex",gap:8,alignItems:"center",flexShrink:0}}>
            <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendChat()} placeholder="Hinglish mein puchho..." style={{flex:1,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"11px 14px",fontSize:12,color:"#fff",outline:"none"}}/>
            <button onClick={()=>sendChat()} disabled={!chatInput.trim()||chatLoading} style={{width:42,height:42,borderRadius:11,background:"linear-gradient(135deg,#0050c8,#0080ff)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",opacity:(!chatInput.trim()||chatLoading)?0.4:1}}>
              <Send size={14} style={{color:"#fff"}}/>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   FAQ COMPONENT
═══════════════════════════════════════════ */
function FaqSection({ faqOpen, setFaqOpen }) {
  const faqs = [
    {q:"Check-in / Check-out time?",a:"Check-in: 12:00 PM | Check-out: 11:00 AM. Early check-in availability pe depend karta hai."},
    {q:"Direct booking ka fayda?",a:"Rate lock hota hai — OTA commission nahi lagta (18% savings), aur checkout tak rate change nahi hoga."},
    {q:"Payment kab?",a:"Check-in ke time hotel reception pe — Cash ya UPI accepted hai."},
    {q:"Cancellation policy?",a:"24 ghante pehle cancellation bilkul free hai. Uske baad ek raat ka charge lagega."},
  ];
  return (
    <div style={{background:"rgba(6,8,15,0.98)",border:"1px solid rgba(255,255,255,0.055)",borderRadius:16,overflow:"hidden",marginBottom:14}}>
      <div style={{padding:"12px 14px",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
        <p style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.3)",letterSpacing:"0.12em",textTransform:"uppercase"}}>Aksar Puche Sawal</p>
      </div>
      {faqs.map((f,i)=>(
        <div key={i} style={{borderBottom:i<faqs.length-1?"1px solid rgba(255,255,255,0.04)":"none"}}>
          <button onClick={()=>setFaqOpen(faqOpen===i?null:i)} style={{width:"100%",padding:"13px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",background:"transparent",border:"none",cursor:"pointer",textAlign:"left"}}>
            <span style={{fontSize:12,color:"rgba(255,255,255,0.6)",fontWeight:600,flex:1,paddingRight:12}}>{f.q}</span>
            <span style={{fontSize:16,color:"#D4AF37",transition:"transform 0.2s",transform:faqOpen===i?"rotate(45deg)":"none",flexShrink:0,display:"inline-block"}}>+</span>
          </button>
          {faqOpen===i && <p style={{fontSize:11,color:"rgba(255,255,255,0.4)",lineHeight:1.6,padding:"0 14px 13px",animation:"fadeUp 0.2s ease"}}>{f.a}</p>}
        </div>
      ))}
    </div>
  );
}
