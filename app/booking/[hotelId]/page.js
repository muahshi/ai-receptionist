"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Send, MessageCircle, X, MapPin, Star, ShieldCheck,
  Navigation, Camera, RefreshCw, CheckCircle, Zap,
  Download, Printer, Crown
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   HOTEL FETCH — Supabase primary, localStorage + demo fallback
═══════════════════════════════════════════════════════════════ */
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
          const mapped = {
            id:            h.id,
            name:          h.name,
            location:      h.location       || "",
            addressLine:   h.address_line   || "",
            distanceTag:   h.distance_tag   || "",
            totalRooms:    h.total_rooms     || 20,
            ownerPhone:    h.owner_phone     || "",
            managerPhone:  h.manager_phone   || "",
            ownerEmail:    h.owner_email     || "",
            emoji:         h.emoji           || "🏨",
            standardRate:  h.standard_rate   || 1200,
            deluxeRate:    h.deluxe_rate     || 2000,
            suiteRate:     h.suite_rate      || 3800,
            minFloorPrice: h.min_floor_price || 800,
            amenities:     h.amenities       || [],
            avgRating:     h.avg_rating      || 4.0,
            totalReviews:  h.total_reviews   || 0,
          };
          try { localStorage.setItem(`air_${hotelId}_config`, JSON.stringify(mapped)); } catch {}
          return mapped;
        }
      }
    } catch {}
  }
  // localStorage cache
  try {
    const cfg = JSON.parse(localStorage.getItem(`air_${hotelId}_config`) || "{}");
    if (cfg.name) return cfg;
  } catch {}
  // Demo hotels
  const DEMOS = [
    { id:"cherry-bhopal",    name:"Hotel Cherry",          location:"Bhopal, Madhya Pradesh",  emoji:"🍒", standardRate:1200, deluxeRate:2000, suiteRate:3800, minFloorPrice:900,  addressLine:"Peer Gate Area, Bhopal - 462001",        distanceTag:"900m from Bus Stand",     amenities:["Free Wi-Fi","AC Rooms","Geyser"],              avgRating:4.5, totalReviews:128, totalRooms:20, ownerPhone:"919009109108" },
    { id:"sunrise-jaipur",   name:"Hotel Sunrise Palace",  location:"Jaipur, Rajasthan",        emoji:"🌅", standardRate:1500, deluxeRate:2500, suiteRate:5000, minFloorPrice:1100, addressLine:"Civil Lines, Jaipur - 302006",           distanceTag:"2.1 km from City Center", amenities:["Free Wi-Fi","Pool Access","AC Rooms","Parking"], avgRating:4.7, totalReviews:312, totalRooms:40, ownerPhone:"919876543210" },
    { id:"midtown-indore",   name:"Hotel Midtown",         location:"Indore, Madhya Pradesh",   emoji:"🏙️", standardRate:1100, deluxeRate:1800, suiteRate:3500, minFloorPrice:850,  addressLine:"MG Road, Indore - 452001",               distanceTag:"900m from Bus Stand",     amenities:["Free Wi-Fi","Early Check-in","AC Rooms"],       avgRating:4.5, totalReviews:89,  totalRooms:35, ownerPhone:"919977665544" },
    { id:"comforts-nagpur",  name:"City Comforts Nagpur",  location:"Nagpur, Maharashtra",      emoji:"🏨", standardRate:1000, deluxeRate:1600, suiteRate:3200, minFloorPrice:800,  addressLine:"Sitabuldi, Nagpur - 440012",             distanceTag:"1.5 km from Bus Stand",   amenities:["Free Wi-Fi","Parking","AC Rooms"],              avgRating:4.4, totalReviews:56,  totalRooms:30, ownerPhone:"919988776655" },
    { id:"grand-mumbai",     name:"The Grand Inn Mumbai",  location:"Mumbai, Maharashtra",      emoji:"🏩", standardRate:2500, deluxeRate:4500, suiteRate:9000, minFloorPrice:2000, addressLine:"Andheri West, Mumbai - 400053",          distanceTag:"1.8 km from Metro Station",amenities:["Free Wi-Fi","Restaurant","Gym","AC Rooms"],     avgRating:4.8, totalReviews:920, totalRooms:120,ownerPhone:"919900001111" },
  ];
  return DEMOS.find(h => h.id === hotelId) || DEMOS.find(h => hotelId?.includes(h.id.split("-")[0])) || null;
}

/* ── Rooms ── */
function getRooms(hotelId, total) {
  try {
    const s = JSON.parse(localStorage.getItem(`air_${hotelId}_rooms`) || "[]");
    if (s.length > 0) return s;
  } catch {}
  return Array.from({ length: total }, (_, i) => ({
    id: `${hotelId}_R${String(i+1).padStart(3,"0")}`, number:i+1,
    floor:Math.ceil((i+1)/5), type:i%10===0?"suite":i%3===0?"deluxe":"standard",
    status:"vacant", currentBookingId:null,
  }));
}

/* ── Save Booking to Supabase + localStorage ── */
async function saveBooking(booking, hotelId) {
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (sbUrl && sbKey && sbUrl !== "undefined") {
    try {
      const row = {
        id:              booking.id,
        hotel_id:        hotelId,
        guest_name:      booking.guestName      || "",
        guest_phone:     booking.guestPhone     || "",
        address:         booking.address        || "",
        id_type:         booking.idType         || "Aadhaar",
        id_number:       "[Aadhaar Redacted]",               // privacy-safe placeholder in DB text field
        id_image_base64: booking.idImageBase64  || null,     // actual Base64 for police records
        gender:          booking.gender         || "",
        dob:             booking.dob            || "",
        room_id:         booking.roomId         || "",
        room_type:       booking.roomType       || "standard",
        check_in_date:   booking.checkInDate    || "",
        check_out_date:  booking.checkOutDate   || "",
        nights:          booking.nights         || 1,
        rate_per_night:  booking.ratePerNight   || 0,
        total_amount:    booking.totalAmount    || 0,
        payment_mode:    booking.paymentMode    || "Cash",
        status:          "reserved",                          // marketplace bookings start as reserved
        rate_locked:     true,
        negotiated:      booking.negotiated     || false,
        negotiated_from: booking.negotiatedFrom || 0,
        source:          "marketplace",
        created_at:      booking.createdAt,
      };
      const res = await fetch(`${sbUrl}/rest/v1/bookings`, {
        method:"POST",
        headers:{ apikey:sbKey, Authorization:`Bearer ${sbKey}`, "Content-Type":"application/json", Prefer:"return=minimal" },
        body:JSON.stringify(row),
      });
      if (res.ok || res.status === 201) return { success:true };
    } catch {}
  }
  try {
    const key  = `air_${hotelId}_bookings`;
    const list = JSON.parse(localStorage.getItem(key) || "[]");
    list.unshift(booking);
    localStorage.setItem(key, JSON.stringify(list));
    return { success:true };
  } catch (e) {
    return { success:false, error:e.message };
  }
}

/* ── Room Keycap ── */
function RoomKeycap({ room, selected, onClick }) {
  const colorMap = { vacant:"#22c55e", reserved:"#D4AF37", occupied:"#ef4444", cleaning:"#818cf8" };
  const c = colorMap[room.status] || "#22c55e";
  const isBlocked = room.status === "occupied";
  return (
    <button
      onClick={() => !isBlocked && onClick(room)}
      title={`Room ${room.number} — ${room.status}`}
      style={{
        aspectRatio:"1/1.05", borderRadius:6,
        background: selected ? `rgba(${c==="#22c55e"?"34,197,94":c==="#D4AF37"?"212,175,55":c==="#ef4444"?"239,68,68":"129,140,248"},0.2)` : "rgba(255,255,255,0.04)",
        border:`1px solid ${selected ? c : "rgba(255,255,255,0.07)"}`,
        cursor: isBlocked ? "not-allowed" : "pointer",
        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:2,
        transition:"all 0.15s ease", outline:"none", padding:2,
        boxShadow: selected ? `0 0 8px ${c}55` : "none",
        opacity: isBlocked ? 0.5 : 1,
      }}
    >
      <div style={{ width:5, height:5, borderRadius:"50%", background:c, boxShadow:`0 0 4px ${c}` }} />
      <span style={{ fontSize:7, color:"rgba(255,255,255,0.5)", fontFamily:"monospace", fontWeight:700 }}>
        {String(room.number).padStart(2,"0")}
      </span>
    </button>
  );
}

/* ── Detect Negotiation Intent ── */
function detectNegotiationIntent(text) {
  const patterns = [
    /([\d,]+)\s*(mein|me|pe|par|kar\s*do|chahiye|milega|dedo|de\s*do)/i,
    /discount|kam\s*karo|less\s*karo|reduce|negotiate|sasta|cheap|concession/i,
    /₹\s*([\d,]+)/,
    /([\d,]+)\s*(rupee|rs|inr)/i,
  ];
  for (const p of patterns) {
    if (text.match(p)) {
      const numMatch = text.replace(/,/g,"").match(/(\d{3,6})/);
      return { isNegotiation:true, requestedRate: numMatch ? parseInt(numMatch[1]) : null };
    }
  }
  return { isNegotiation:false, requestedRate:null };
}

/* ═══════════════════════════════════════════════════════════════
   PREMIUM BOOKING PASS CARD
   Shown after successful booking submission.
═══════════════════════════════════════════════════════════════ */
function BookingPassCard({ booking, hotel, onDownload }) {
  const passRef = useRef(null);
  const bid = booking.id?.slice(-10).toUpperCase();
  const checkInFmt  = booking.checkInDate  ? new Date(booking.checkInDate).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}) : "—";
  const checkOutFmt = booking.checkOutDate ? new Date(booking.checkOutDate).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}) : "—";

  const handleDownload = useCallback(() => {
    if (!passRef.current) return;
    // Use browser print dialog scoped to pass element
    const printContents = passRef.current.innerHTML;
    const printStyles = `
      body { background:#07090E; font-family:system-ui,sans-serif; margin:0; padding:16px; }
      * { box-sizing:border-box; }
    `;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Booking Pass — ${hotel.name}</title><style>${printStyles}</style></head><body>${printContents}</body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 400);
    if (onDownload) onDownload();
  }, [hotel.name, onDownload]);

  return (
    <div style={{ animation:"fadeUp 0.5s ease" }}>
      {/* THE PASS CARD */}
      <div ref={passRef} style={{
        background:"linear-gradient(135deg,#0c0800,#1a1000,#0c0800)",
        border:"1px solid rgba(212,175,55,0.4)",
        borderRadius:20, overflow:"hidden",
        boxShadow:"0 8px 48px rgba(212,175,55,0.12), 0 0 0 1px rgba(212,175,55,0.08)",
        marginBottom:12,
      }}>
        {/* Header band */}
        <div style={{
          background:"linear-gradient(135deg,#b8960c,#D4AF37,#F5C842,#D4AF37,#b8960c)",
          padding:"14px 18px",
          display:"flex", justifyContent:"space-between", alignItems:"center",
        }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <Crown size={16} style={{ color:"#000" }} />
              <span style={{ fontSize:13, fontWeight:900, color:"#000", letterSpacing:"0.06em" }}>THE GUESTINN NETWORK</span>
            </div>
            <div style={{ fontSize:8, color:"rgba(0,0,0,0.6)", letterSpacing:"0.25em", textTransform:"uppercase", marginTop:2 }}>
              CONFIRMED BOOKING PASS
            </div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:9, color:"rgba(0,0,0,0.5)", letterSpacing:"0.15em" }}>BOOKING REF</div>
            <div style={{ fontSize:14, fontWeight:900, color:"#000", fontFamily:"monospace", letterSpacing:"0.08em" }}>#{bid}</div>
          </div>
        </div>

        {/* Hotel name */}
        <div style={{ padding:"14px 18px 0", borderBottom:"1px solid rgba(212,175,55,0.1)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, paddingBottom:12 }}>
            <div style={{ width:44, height:44, borderRadius:12, background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.25)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>
              {hotel.emoji}
            </div>
            <div>
              <div style={{ fontSize:16, fontWeight:900, color:"#fff", lineHeight:1.2 }}>{hotel.name}</div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", display:"flex", alignItems:"center", gap:4, marginTop:2 }}>
                <MapPin size={9} />{hotel.addressLine || hotel.location}
              </div>
            </div>
          </div>
        </div>

        {/* Guest info */}
        <div style={{ padding:"12px 18px", borderBottom:"1px solid rgba(255,255,255,0.05)", display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <PassField label="Guest Name"  value={booking.guestName} />
          <PassField label="Mobile"      value={booking.guestPhone} />
          <PassField label="Room No."    value={booking.roomId || "—"} highlight />
          <PassField label="Room Type"   value={capitalize(booking.roomType || "Standard")} />
        </div>

        {/* Dates */}
        <div style={{ padding:"12px 18px", borderBottom:"1px solid rgba(255,255,255,0.05)", display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
          <PassField label="Check-In"   value={checkInFmt} />
          <PassField label="Check-Out"  value={checkOutFmt} />
          <PassField label="Nights"     value={String(booking.nights || 1)} highlight />
        </div>

        {/* Amount */}
        <div style={{ padding:"12px 18px 0", borderBottom:"1px solid rgba(212,175,55,0.12)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingBottom:12 }}>
            <div>
              <div style={{ fontSize:9, color:"rgba(255,255,255,0.35)", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:2 }}>Total Amount</div>
              <div style={{ fontSize:28, fontWeight:900, color:"#D4AF37", textShadow:"0 0 20px rgba(212,175,55,0.4)", lineHeight:1 }}>
                ₹{Number(booking.totalAmount||0).toLocaleString("en-IN")}
              </div>
              <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", marginTop:2 }}>
                ₹{Number(booking.ratePerNight||0).toLocaleString("en-IN")}/night × {booking.nights || 1} night{booking.nights>1?"s":""}
              </div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:9, color:"rgba(255,255,255,0.35)", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>Payment</div>
              <div style={{ fontSize:13, fontWeight:700, color:"#fff" }}>{booking.paymentMode || "Cash"}</div>
              {booking.rateLocked && (
                <div style={{ display:"flex", alignItems:"center", gap:4, justifyContent:"flex-end", marginTop:4 }}>
                  <div style={{ width:5, height:5, borderRadius:"50%", background:"#22c55e" }} />
                  <span style={{ fontSize:8, color:"#22c55e", fontWeight:700 }}>RATE LOCKED</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Negotiated rate badge */}
        {booking.negotiated && (
          <div style={{ padding:"8px 18px", background:"rgba(34,197,94,0.06)", borderBottom:"1px solid rgba(34,197,94,0.12)", display:"flex", alignItems:"center", gap:8 }}>
            <Zap size={11} style={{ color:"#22c55e", flexShrink:0 }} />
            <span style={{ fontSize:10, color:"#22c55e", fontWeight:700 }}>AI Negotiated Rate Applied</span>
            {booking.rateLockToken && (
              <span style={{ fontSize:9, color:"rgba(34,197,94,0.6)", fontFamily:"monospace", marginLeft:"auto" }}>
                Token: {booking.rateLockToken.slice(-12)}
              </span>
            )}
          </div>
        )}

        {/* Status bar */}
        <div style={{ padding:"12px 18px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", borderRadius:20, background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.25)" }}>
            <div style={{ width:7, height:7, borderRadius:"50%", background:"#D4AF37", animation:"goldPulse 2s ease-in-out infinite" }} />
            <span style={{ fontSize:10, fontWeight:800, color:"#D4AF37", letterSpacing:"0.06em" }}>RESERVATION PENDING APPROVAL</span>
          </div>
          <div style={{ fontSize:9, color:"rgba(255,255,255,0.2)" }}>
            {new Date(booking.createdAt).toLocaleDateString("en-IN")}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:"8px 18px 14px", background:"rgba(0,0,0,0.3)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ fontSize:8, color:"rgba(255,255,255,0.18)", letterSpacing:"0.1em" }}>theguestinn.network • Commission-Free Booking</div>
          <ShieldCheck size={11} style={{ color:"rgba(212,175,55,0.3)" }} />
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display:"flex", gap:8 }}>
        <button
          onClick={handleDownload}
          style={{
            flex:1, padding:"13px", borderRadius:13, display:"flex", alignItems:"center", justifyContent:"center", gap:7,
            background:"linear-gradient(135deg,#b8960c,#D4AF37,#F5C842)", color:"#000",
            border:"none", cursor:"pointer", fontWeight:800, fontSize:13,
            boxShadow:"0 4px 20px rgba(212,175,55,0.35)",
          }}
        >
          <Printer size={15} />Print / Download
        </button>
        <button
          onClick={() => {
            const text = `🏨 *${hotel.name}*\nBooking Confirmed!\n\nGuest: ${booking.guestName}\nRoom: ${booking.roomId}\nCheck-in: ${checkInFmt}\nTotal: ₹${Number(booking.totalAmount).toLocaleString("en-IN")}\nRef: #${bid}\n\nPowered by The GuestInn Network`;
            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
          }}
          style={{
            flex:1, padding:"13px", borderRadius:13, display:"flex", alignItems:"center", justifyContent:"center", gap:7,
            background:"rgba(37,211,102,0.12)", border:"1px solid rgba(37,211,102,0.3)", color:"#25d366",
            cursor:"pointer", fontWeight:700, fontSize:13,
          }}
        >
          📱 Share on WhatsApp
        </button>
      </div>

      <div style={{ marginTop:10, padding:"10px 12px", borderRadius:10, background:"rgba(212,175,55,0.04)", border:"1px solid rgba(212,175,55,0.1)", textAlign:"center" }}>
        <p style={{ fontSize:10, color:"rgba(255,255,255,0.3)", lineHeight:1.5 }}>
          🏨 Hotel team aapki booking review karegi aur <strong style={{ color:"rgba(255,255,255,0.5)" }}>{booking.guestPhone}</strong> par confirmation karegi.
          <br/>Room automatically <span style={{ color:"#D4AF37" }}>GOLD (Reserved)</span> status mein switch ho gaya hai.
        </p>
      </div>
    </div>
  );
}

function PassField({ label, value, highlight }) {
  return (
    <div>
      <div style={{ fontSize:8, color:"rgba(255,255,255,0.28)", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:2 }}>{label}</div>
      <div style={{ fontSize:highlight?16:13, fontWeight:highlight?900:700, color:highlight?"#D4AF37":"#fff", textShadow:highlight?"0 0 10px rgba(212,175,55,0.3)":"none" }}>{value || "—"}</div>
    </div>
  );
}

function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════ */
export default function BookingPage() {
  const params  = useParams();
  const hotelId = params?.hotelId;

  const [hotel,         setHotel]        = useState(null);
  const [rooms,         setRooms]        = useState([]);
  const [pageLoading,   setPageLoading]  = useState(true);
  const [selectedRoom,  setSelectedRoom] = useState(null);

  // Form state
  const [guestName,    setGuestName]    = useState("");
  const [guestPhone,   setGuestPhone]   = useState("");
  const [checkIn,      setCheckIn]      = useState("");
  const [checkOut,     setCheckOut]     = useState("");
  const [address,      setAddress]      = useState("");
  const [idType,       setIdType]       = useState("Aadhaar");
  const [idNumber,     setIdNumber]     = useState("");
  const [gender,       setGender]       = useState("");
  const [dob,          setDob]          = useState("");
  const [nationality,  setNationality]  = useState("Indian");
  const [roomType,     setRoomType]     = useState("Deluxe Room");
  const [paymentMode,  setPaymentMode]  = useState("Cash");

  // ID Scanner
  const [scanStep,     setScanStep]     = useState("idle");
  const [scanSide,     setScanSide]     = useState("front");
  const [scanProgress, setScanProgress] = useState(0);
  const [idImageFront, setIdImageFront] = useState(null);
  const [idImageBack,  setIdImageBack]  = useState(null);
  const [idImageBase64,setIdImageBase64]= useState(null); // Full Base64 for DB
  const [scanError,    setScanError]    = useState("");
  const videoRef   = useRef(null);
  const canvasRef  = useRef(null);
  const streamRef  = useRef(null);

  // Booking
  const [submitting,    setSubmitting]   = useState(false);
  const [submitted,     setSubmitted]    = useState(false);
  const [bookingResult, setBookingResult]= useState(null);
  const [formError,     setFormError]    = useState("");

  // Negotiator state (synced with NegotiatorOrb via postMessage)
  const [negotiatedRate,   setNegotiatedRate]   = useState(null);
  const [rateLockToken,    setRateLockToken]     = useState(null);
  const [negotiating,      setNegotiating]       = useState(false);

  // Chat
  const [chatOpen,     setChatOpen]     = useState(false);
  const [messages,     setMessages]     = useState([]);
  const [chatInput,    setChatInput]    = useState("");
  const [chatLoading,  setChatLoading]  = useState(false);
  const chatEndRef = useRef(null);
  const [faqOpen,  setFaqOpen]  = useState(null);

  // Derived values
  const nights = (() => {
    if (!checkIn || !checkOut) return 0;
    const diff = (new Date(checkOut) - new Date(checkIn)) / 86400000;
    return diff > 0 ? diff : 0;
  })();

  const activeRoomTypeKey = (() => {
    if (selectedRoom) return selectedRoom.type || "standard";
    if (roomType.toLowerCase().includes("suite"))  return "suite";
    if (roomType.toLowerCase().includes("deluxe")) return "deluxe";
    return "standard";
  })();

  const roomRate = (() => {
    if (negotiatedRate) return negotiatedRate;
    if (selectedRoom)   return selectedRoom.baseRate || hotel?.standardRate || 1200;
    if (!hotel) return 0;
    if (activeRoomTypeKey === "suite")  return hotel.suiteRate  || 3800;
    if (activeRoomTypeKey === "deluxe") return hotel.deluxeRate || 2000;
    return hotel.standardRate || 1200;
  })();

  const total = roomRate * nights;

  // Load hotel + rooms
  useEffect(() => {
    if (!hotelId) { setPageLoading(false); return; }
    fetchHotel(hotelId).then(h => {
      setHotel(h);
      if (h) setRooms(getRooms(hotelId, h.totalRooms));
      setPageLoading(false);
    });
  }, [hotelId]);

  // Welcome message
  useEffect(() => {
    if (hotel && messages.length === 0) {
      setMessages([{
        role:"assistant",
        content:`Namaste! 🙏 Main ${hotel.name} ka AI Receptionist hoon.\n\nMujhse puchho:\n• Room rates & availability\n• Discount negotiate karna\n• Booking mein help\n\nKya main aapki help kar sakta hoon? 😊`,
      }]);
    }
  }, [hotel]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  // Camera utils
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:"environment" }, audio:false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setScanStep("camera");
    } catch (e) {
      setScanError("Camera access nahi mila: " + e.message);
      setScanStep("error");
    }
  };
  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  const captureAndScan = async () => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    // Full quality Base64 for police records compliance
    const base64Full = canvas.toDataURL("image/jpeg", 0.9).split(",")[1];
    // Compressed thumbnail for display
    const thumbCanvas = document.createElement("canvas");
    thumbCanvas.width = 320; thumbCanvas.height = 180;
    thumbCanvas.getContext("2d").drawImage(canvas, 0, 0, 320, 180);
    const thumbDataUrl = thumbCanvas.toDataURL("image/jpeg", 0.65);

    stopCamera();
    setScanStep("scanning");
    setScanProgress(0);

    // Save images
    if (scanSide === "front") {
      setIdImageFront(thumbDataUrl);
      setIdImageBase64(base64Full); // Full Base64 stored for DB
    } else {
      setIdImageBack(thumbDataUrl);
    }

    const prog = setInterval(() => setScanProgress(p => p >= 90 ? 90 : p + 12), 250);
    try {
      const res  = await fetch("/api/groq", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ type:"id_scan", imageBase64:base64Full }) });
      const data = await res.json();
      clearInterval(prog);
      setScanProgress(100);
      if (data.success && data.data) {
        const d = data.data;
        if (d.name)    setGuestName(d.name);
        if (d.dob)     setDob(d.dob.replace(/(\d{2})\/(\d{2})\/(\d{4})/,"$3-$2-$1"));
        if (d.address) setAddress(d.address);
        if (d.idNumber)setIdNumber(d.idNumber);
        if (d.idType)  setIdType(d.idType);
        if (d.gender)  setGender(d.gender==="M"?"Male":d.gender==="F"?"Female":d.gender);
        setTimeout(() => setScanStep("done"), 400);
      } else {
        setScanError(data.error || "ID data extract nahi hua.");
        setScanStep("error");
      }
    } catch (e) {
      clearInterval(prog);
      setScanError("Network error: " + e.message);
      setScanStep("error");
    }
  };

  const resetScan = () => {
    setScanStep("idle"); setScanProgress(0); setScanError("");
    setIdImageFront(null); setIdImageBack(null); setIdImageBase64(null); stopCamera();
  };

  // Booking submit
  const handleBook = async () => {
    setFormError("");
    if (!guestName.trim())  return setFormError("Guest ka naam likhna zaroori hai.");
    if (!guestPhone.trim()) return setFormError("Phone number likhna zaroori hai.");
    if (!checkIn)           return setFormError("Check-in date select karo.");
    if (!checkOut)          return setFormError("Check-out date select karo.");
    if (nights <= 0)        return setFormError("Check-out, check-in ke baad honi chahiye.");
    setSubmitting(true);

    const bid       = `BK${Date.now().toString(36).toUpperCase()}`;
    const roomId    = selectedRoom?.id || `${hotelId}_AUTO`;
    const roomNum   = selectedRoom?.number || "—";

    const booking = {
      id:             bid,
      hotelId,
      guestName:      guestName.trim(),
      guestPhone:     guestPhone.trim(),
      address:        address.trim(),
      idType,
      idNumber:       idNumber.trim() || "",
      idImageBase64,                               // Full Base64 scan for police records
      idImageFront:   idImageFront   || null,
      idImageBack:    idImageBack    || null,
      gender,
      dob,
      nationality,
      roomId,
      roomNumber:     roomNum,
      roomType:       activeRoomTypeKey,
      checkInDate:    checkIn,
      checkOutDate:   checkOut,
      nights,
      ratePerNight:   roomRate,
      totalAmount:    total,
      paymentMode,
      rateLocked:     true,
      negotiated:     !!negotiatedRate,
      negotiatedFrom: negotiatedRate ? (selectedRoom?.baseRate || hotel?.standardRate || 0) : 0,
      rateLockToken:  rateLockToken  || null,
      source:         "marketplace",
      isPublicBooking: true,   // → status = "reserved" (Gold) on hotel's frontdesk
      createdAt:      new Date().toISOString(),
    };

    await saveBooking(booking, hotelId);

    // Update room to reserved in localStorage
    if (selectedRoom) {
      setRooms(prev => prev.map(r => r.id === selectedRoom.id
        ? { ...r, status:"reserved", currentBookingId:bid }
        : r
      ));
      try {
        const key  = `air_${hotelId}_rooms`;
        const rms  = JSON.parse(localStorage.getItem(key) || "[]");
        const updated = rms.map(r => r.id === selectedRoom.id ? { ...r, status:"reserved", currentBookingId:bid } : r);
        localStorage.setItem(key, JSON.stringify(updated));
      } catch {}
    }

    // Fire push notification + WhatsApp alerts
    try {
      // Browser push notification
      await fetch("/api/push", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          action:"send", hotelId,
          payload:{
            title:`🏨 ${hotel.name} — Naya Reservation!`,
            body:`Room ${roomId} • ${guestName} • ₹${total.toLocaleString("en-IN")} — RESERVED (Gold)`,
            tag:`booking-${bid}`, icon:"/icons/icon-192.png", sound:true,
          },
        }),
      });
    } catch {}
    try {
      const { sendBookingAlerts } = await import("../../../lib/alerts");
      await sendBookingAlerts({ ...booking, status:"reserved" });
    } catch {}

    setBookingResult({ ...booking, roomNumber:roomNum });
    setSubmitted(true);
    setSubmitting(false);
  };

  // Chat + Negotiator
  const sendChat = async (override) => {
    const text = (override || chatInput).trim();
    if (!text || chatLoading) return;
    if (!override) setChatInput("");
    const newMsgs = [...messages, { role:"user", content:text }];
    setMessages(newMsgs);
    setChatLoading(true);

    const { isNegotiation, requestedRate } = detectNegotiationIntent(text);
    if (isNegotiation && requestedRate && hotel) {
      setNegotiating(true);
      try {
        const res = await fetch("/api/groq", {
          method:"POST", headers:{"Content-Type":"application/json"},
          body:JSON.stringify({
            type:"negotiate", hotelId, requestedRate,
            roomType:activeRoomTypeKey,
            hotelConfig:{
              name:          hotel.name,
              location:      hotel.location,
              standardRate:  hotel.standardRate,
              deluxeRate:    hotel.deluxeRate,
              suiteRate:     hotel.suiteRate,
              minFloorPrice: hotel.minFloorPrice,
            },
            bookingContext:{ checkIn, checkOut, nights, roomType:activeRoomTypeKey,
              selectedRoom: selectedRoom ? { id:selectedRoom.id, number:selectedRoom.number } : null },
          }),
        });
        const data = await res.json();
        if (data.success) {
          if (data.approved) { setNegotiatedRate(data.finalRate); setRateLockToken(data.rateLockToken); }
          setMessages(p => [...p, {
            role:"assistant", content:data.message, isNegotiationResult:true,
            approved:data.approved, finalRate:data.finalRate, token:data.rateLockToken,
          }]);
        } else throw new Error(data.error);
      } catch {
        setMessages(p => [...p, { role:"assistant", content:"Rate negotiation mein problem aayi. Dobara try karo 🙏" }]);
      }
      setNegotiating(false); setChatLoading(false);
      return;
    }

    const ctxBlock = (checkIn || selectedRoom)
      ? `\n\n[BOOKING CONTEXT: Check-in: ${checkIn||"not set"}, Check-out: ${checkOut||"not set"}, Nights: ${nights||0}, Room: ${selectedRoom?`Room ${selectedRoom.number} (${activeRoomTypeKey})`:roomType}, Rate: ₹${roomRate}/night${negotiatedRate?`, NEGOTIATED RATE LOCKED: ₹${negotiatedRate}`:""}]`
      : "";

    try {
      const res = await fetch("/api/groq", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          type:"chat",
          hotelConfig:{
            name:hotel?.name, location:hotel?.location,
            standardRate:hotel?.standardRate, deluxeRate:hotel?.deluxeRate,
            suiteRate:hotel?.suiteRate, minFloorPrice:hotel?.minFloorPrice,
            rates:{ standard:hotel?.standardRate, deluxe:hotel?.deluxeRate, suite:hotel?.suiteRate },
          },
          messages:[
            ...newMsgs.slice(0,-1).map(m => ({ role:m.role, content:m.content })),
            { role:"user", content:text + ctxBlock },
          ],
        }),
      });
      const data = await res.json();
      setMessages(p => [...p, { role:"assistant", content:data.message || "Thodi der baad try karo 🙏" }]);
    } catch {
      setMessages(p => [...p, { role:"assistant", content:"Connection issue. Dobara try karo 🙏" }]);
    }
    setChatLoading(false);
  };

  // Loading / not found guards
  if (pageLoading) return (
    <div style={{ minHeight:"100vh", background:"#07090E", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ width:50, height:50, borderRadius:"50%", border:"2px solid rgba(0,140,255,0.3)", borderTop:"2px solid #008cff", animation:"spinRingCW 1s linear infinite" }} />
      <style>{`@keyframes spinRingCW{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if (!hotel) return (
    <div style={{ minHeight:"100vh", background:"#07090E", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:12 }}>
      <p style={{ color:"rgba(255,255,255,0.3)", fontSize:14 }}>Hotel not found</p>
      <a href="/" style={{ color:"#D4AF37", fontSize:12, textDecoration:"none" }}>← Back to GuestInn Network</a>
    </div>
  );

  const inpStyle   = { width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"11px 13px", fontSize:13, color:"#fff", outline:"none", boxSizing:"border-box", colorScheme:"dark" };
  const labelStyle = { fontSize:9, fontWeight:700, color:"rgba(255,255,255,0.35)", letterSpacing:"0.1em", textTransform:"uppercase", display:"block", marginBottom:5 };
  const vacantN    = rooms.filter(r => r.status === "vacant").length;
  const byFloor    = rooms.reduce((acc,r) => { (acc[r.floor]=acc[r.floor]||[]).push(r); return acc; }, {});
  const floors     = Object.keys(byFloor).map(Number).sort((a,b) => a-b);

  return (
    <div style={{ minHeight:"100vh", background:"#07090E", color:"#fff", fontFamily:"system-ui,-apple-system,sans-serif", paddingBottom:90 }}>
      <style>{`
        @keyframes spinRingCW  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes fadeUp      { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideUp     { from{transform:translateY(100%)} to{transform:translateY(0)} }
        @keyframes dotBounce   { 0%,80%,100%{transform:scale(0.4);opacity:0.3} 40%{transform:scale(1);opacity:1} }
        @keyframes goldPulse   { 0%,100%{box-shadow:0 0 0 0 rgba(212,175,55,0.5)} 50%{box-shadow:0 0 0 8px rgba(212,175,55,0)} }
        input:focus,select:focus,textarea:focus { border-color:rgba(212,175,55,0.5)!important; background:rgba(212,175,55,0.04)!important; }
        input::placeholder,textarea::placeholder { color:rgba(255,255,255,0.2); }
        ::-webkit-scrollbar { width:3px } ::-webkit-scrollbar-thumb { background:rgba(212,175,55,0.15);border-radius:3px }
      `}</style>

      {/* NAV */}
      <nav style={{ position:"sticky", top:0, zIndex:40, background:"rgba(7,9,14,0.94)", backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(255,255,255,0.05)", padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,#1a1400,#2d2200)", border:"1px solid rgba(212,175,55,0.25)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>{hotel.emoji}</div>
          <div>
            <p style={{ fontSize:13, fontWeight:800, color:"#fff" }}>{hotel.name}</p>
            <p style={{ fontSize:10, color:"rgba(255,255,255,0.35)" }}>{hotel.location}</p>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {hotel.avgRating > 0 && (
            <div style={{ display:"flex", alignItems:"center", gap:4, padding:"5px 10px", borderRadius:8, background:"rgba(212,175,55,0.08)", border:"1px solid rgba(212,175,55,0.2)" }}>
              <Star size={11} fill="#D4AF37" color="#D4AF37" />
              <span style={{ fontSize:12, fontWeight:700, color:"#D4AF37" }}>{hotel.avgRating}</span>
            </div>
          )}
          <a href="/" style={{ fontSize:11, color:"rgba(255,255,255,0.35)", textDecoration:"none", padding:"6px 10px", borderRadius:8, border:"1px solid rgba(255,255,255,0.07)" }}>← Back</a>
        </div>
      </nav>

      <div style={{ maxWidth:480, margin:"0 auto", padding:"16px 16px 0" }}>

        {/* HOTEL HERO */}
        <div style={{ background:"linear-gradient(135deg,rgba(212,175,55,0.07),rgba(0,0,0,0.3))", border:"1px solid rgba(212,175,55,0.18)", borderRadius:20, padding:"18px", marginBottom:12 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
            <div>
              <h1 style={{ fontSize:18, fontWeight:900, color:"#fff", marginBottom:4 }}>{hotel.name}</h1>
              <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                <MapPin size={11} style={{ color:"#D4AF37" }} />
                <span style={{ fontSize:11, color:"rgba(255,255,255,0.5)" }}>{hotel.addressLine || hotel.location}</span>
              </div>
              {hotel.distanceTag && <p style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginTop:3 }}>📍 {hotel.distanceTag}</p>}
            </div>
            <div style={{ textAlign:"right" }}>
              <p style={{ fontSize:10, color:"rgba(255,255,255,0.3)" }}>Starts from</p>
              <p style={{ fontSize:20, fontWeight:900, color:"#D4AF37" }}>₹{(hotel.standardRate||1200).toLocaleString("en-IN")}</p>
              <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)" }}>per night</p>
            </div>
          </div>
          {negotiatedRate && (
            <div style={{ padding:"10px 12px", borderRadius:10, background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.3)", display:"flex", alignItems:"center", gap:8, animation:"fadeUp 0.3s ease", marginTop:8 }}>
              <Zap size={14} style={{ color:"#22c55e", flexShrink:0 }} />
              <div>
                <p style={{ fontSize:12, fontWeight:800, color:"#22c55e" }}>AI Rate Lock Active ✓</p>
                <p style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>₹{negotiatedRate.toLocaleString("en-IN")}/night · Token: {rateLockToken?.slice(-8)}</p>
              </div>
            </div>
          )}
          {hotel.amenities?.length > 0 && (
            <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginTop:10 }}>
              {hotel.amenities.map(a => (
                <span key={a} style={{ fontSize:10, padding:"4px 9px", borderRadius:8, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.5)" }}>{a}</span>
              ))}
            </div>
          )}
        </div>

        {/* ROOM ALLOCATOR */}
        <div style={{ background:"linear-gradient(135deg,rgba(5,15,8,0.9),rgba(2,10,4,0.95))", border:"1px solid rgba(34,197,94,0.15)", borderRadius:20, padding:"16px", marginBottom:12 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
            <p style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.45)", letterSpacing:"0.1em", textTransform:"uppercase" }}>Visual Room Allocator</p>
            <div style={{ display:"flex", alignItems:"center", gap:4 }}>
              <div style={{ width:5, height:5, borderRadius:"50%", background:"#22c55e" }} />
              <span style={{ fontSize:9, color:"#22c55e", fontWeight:700 }}>{vacantN} Available</span>
            </div>
          </div>
          {floors.map(floor => {
            const fr  = byFloor[floor]; const cols = 5;
            const padded = [...fr]; while (padded.length % cols !== 0) padded.push(null);
            const rowArr = []; for (let i=0; i<padded.length; i+=cols) rowArr.push(padded.slice(i,i+cols));
            return (
              <div key={floor} style={{ marginBottom:4 }}>
                {rowArr.map((row, ri) => (
                  <div key={ri} style={{ display:"flex", alignItems:"flex-end", gap:4, marginBottom:4 }}>
                    <span style={{ fontSize:7, color:"rgba(255,255,255,0.18)", width:14, textAlign:"right", flexShrink:0, fontWeight:700, paddingBottom:4, fontFamily:"monospace" }}>{ri===0?String(floor).padStart(2,"0"):""}</span>
                    <div style={{ flex:1, display:"grid", gridTemplateColumns:`repeat(${cols},1fr)`, gap:4 }}>
                      {row.map((room,ci) => room
                        ? <RoomKeycap key={room.id} room={room} selected={selectedRoom?.id===room.id} onClick={r => setSelectedRoom(prev => prev?.id===r.id?null:r)} />
                        : <div key={`ph${ci}`} style={{ aspectRatio:"1/1.05", borderRadius:6, background:"rgba(255,255,255,0.008)", border:"1px dashed rgba(255,255,255,0.03)" }} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
          <div style={{ display:"flex", flexWrap:"wrap", gap:"4px 12px", marginTop:10, paddingTop:8, borderTop:"1px solid rgba(255,255,255,0.05)" }}>
            {[{c:"#22c55e",l:"Available"},{c:"#D4AF37",l:"Reserved"},{c:"#ef4444",l:"Occupied"},{c:"#818cf8",l:"Cleaning"}].map(x => (
              <div key={x.l} style={{ display:"flex", alignItems:"center", gap:4 }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:x.c, boxShadow:`0 0 4px ${x.c}` }} />
                <span style={{ fontSize:9, color:"rgba(255,255,255,0.3)" }}>{x.l}</span>
              </div>
            ))}
          </div>
          {selectedRoom && (
            <div style={{ marginTop:10, padding:"10px 12px", borderRadius:12, background:"rgba(212,175,55,0.08)", border:"1px solid rgba(212,175,55,0.3)", display:"flex", alignItems:"center", justifyContent:"space-between", animation:"fadeUp 0.3s ease" }}>
              <div>
                <p style={{ fontSize:12, fontWeight:800, color:"#D4AF37" }}>Room {selectedRoom.number} selected ✓</p>
                <p style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>Floor {selectedRoom.floor} · {selectedRoom.type} · ₹{(negotiatedRate||selectedRoom.baseRate)?.toLocaleString("en-IN")}/raat</p>
              </div>
              <button onClick={() => setSelectedRoom(null)} style={{ width:24, height:24, borderRadius:6, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.4)", fontSize:12, cursor:"pointer" }}>✕</button>
            </div>
          )}
        </div>

        {/* AI ID SCANNER */}
        <div style={{ background:"linear-gradient(135deg,rgba(0,18,45,0.55),rgba(0,8,22,0.65))", border:"1px solid rgba(0,140,255,0.18)", borderRadius:20, padding:"16px", marginBottom:12, position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", inset:0, opacity:0.025, backgroundImage:"linear-gradient(rgba(0,140,255,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(0,140,255,0.8) 1px,transparent 1px)", backgroundSize:"22px 22px", pointerEvents:"none" }} />
          <p style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.45)", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:12 }}>📷 AI ID Scanner</p>

          {scanStep === "camera" && (
            <div style={{ borderRadius:16, overflow:"hidden", background:"#000", position:"relative", marginBottom:12, border:"1px solid rgba(0,140,255,0.3)" }}>
              <video ref={videoRef} autoPlay playsInline muted style={{ width:"100%", maxHeight:220, objectFit:"cover", display:"block" }} />
              <canvas ref={canvasRef} style={{ display:"none" }} />
              <div style={{ position:"absolute", inset:0, border:"2px solid rgba(0,140,255,0.5)", borderRadius:16, pointerEvents:"none" }} />
              <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"10px 12px", background:"linear-gradient(transparent,rgba(0,0,0,0.8))", display:"flex", gap:8, justifyContent:"center" }}>
                <button onClick={captureAndScan} style={{ flex:1, padding:"11px", borderRadius:12, background:"linear-gradient(135deg,#0050c8,#008cff)", border:"none", color:"#fff", fontWeight:800, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                  <Camera size={15} /> Scan Karo
                </button>
                <button onClick={() => { stopCamera(); setScanStep("idle"); }} style={{ padding:"11px 14px", borderRadius:12, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.5)", cursor:"pointer" }}>✕</button>
              </div>
              <div style={{ position:"absolute", top:10, left:0, right:0, textAlign:"center" }}>
                <span style={{ fontSize:11, padding:"4px 12px", borderRadius:10, background:"rgba(0,0,0,0.7)", color:"#60b8ff", fontWeight:600 }}>
                  {scanSide === "front" ? "ID ka Front Side" : "ID ka Back Side"} frame mein rakho
                </span>
              </div>
            </div>
          )}

          <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:scanStep==="camera"?0:14 }}>
            <div style={{ width:54, height:54, borderRadius:"50%", background:"linear-gradient(135deg,#0d1a2e,#0a1020)", border:`2px solid ${scanStep==="scanning"?"rgba(0,140,255,0.7)":"rgba(0,140,255,0.25)"}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:scanStep==="scanning"?"0 0 20px rgba(0,140,255,0.4)":"none" }}>
              {scanStep === "scanning"
                ? <div style={{ width:28, height:28, borderRadius:"50%", border:"2px solid transparent", borderTop:"2px solid #008cff", animation:"spinRingCW 0.8s linear infinite" }} />
                : <span style={{ fontSize:22 }}>🤖</span>
              }
            </div>
            <div style={{ flex:1 }}>
              {scanStep === "idle" && (
                <>
                  <p style={{ fontSize:13, fontWeight:800, color:"#60b8ff", marginBottom:4 }}>Aadhaar / PAN / Passport</p>
                  <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", lineHeight:1.5, marginBottom:8 }}>Camera se scan karo — form auto-fill ho jayega</p>
                  <button onClick={() => { setScanSide("front"); startCamera(); }} style={{ padding:"9px 14px", borderRadius:10, background:"rgba(0,140,255,0.12)", border:"1px solid rgba(0,140,255,0.3)", color:"#60b8ff", fontSize:11, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
                    <Camera size={13} /> Camera Kholo
                  </button>
                </>
              )}
              {scanStep === "scanning" && (
                <div style={{ animation:"fadeUp 0.3s ease" }}>
                  <p style={{ fontSize:13, fontWeight:800, color:"#60b8ff", marginBottom:4 }}>AI Scan ho raha hai...</p>
                  <div style={{ height:4, background:"rgba(0,140,255,0.15)", borderRadius:4, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${scanProgress}%`, background:"linear-gradient(90deg,#008cff,#60b8ff)", borderRadius:4, transition:"width 0.3s ease" }} />
                  </div>
                  <p style={{ fontSize:10, color:"rgba(0,140,255,0.6)", marginTop:4 }}>Base64 ID saving for police compliance...</p>
                </div>
              )}
              {scanStep === "done" && (
                <div style={{ animation:"fadeUp 0.3s ease" }}>
                  <p style={{ fontSize:13, fontWeight:800, color:"#22c55e", marginBottom:3 }}>✓ ID Scan Successful!</p>
                  <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginBottom:6 }}>{guestName} · {idType} · 📸 Base64 saved</p>
                  {!idImageBack && (
                    <button onClick={() => { setScanSide("back"); startCamera(); setScanStep("camera"); }} style={{ padding:"7px 12px", borderRadius:8, background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.3)", color:"#D4AF37", fontSize:10, fontWeight:700, cursor:"pointer", marginRight:6 }}>
                      📷 Back Side Bhi Scan Karo
                    </button>
                  )}
                  <button onClick={resetScan} style={{ padding:"7px 12px", borderRadius:8, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.4)", fontSize:10, cursor:"pointer" }}>
                    <RefreshCw size={10} style={{ display:"inline", marginRight:4 }} />Reset
                  </button>
                </div>
              )}
              {scanStep === "error" && (
                <div style={{ animation:"fadeUp 0.3s ease" }}>
                  <p style={{ fontSize:12, color:"#ef4444", marginBottom:6 }}>{scanError || "Scan nahi hua."}</p>
                  <button onClick={() => { setScanStep("camera"); startCamera(); }} style={{ padding:"7px 12px", borderRadius:8, background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", color:"#ef4444", fontSize:10, cursor:"pointer", marginRight:6 }}>
                    Dobara Try Karo
                  </button>
                  <button onClick={resetScan} style={{ padding:"7px 12px", borderRadius:8, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.4)", fontSize:10, cursor:"pointer" }}>Skip</button>
                </div>
              )}
            </div>
          </div>

          {/* ID image thumbnails */}
          {(idImageFront || idImageBack) && (
            <div style={{ display:"flex", gap:8, marginBottom:14 }}>
              {idImageFront && (
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)", marginBottom:4, textAlign:"center" }}>Front</p>
                  <img src={idImageFront} alt="ID Front" style={{ width:"100%", height:70, objectFit:"cover", borderRadius:8, border:"1px solid rgba(34,197,94,0.3)" }} />
                </div>
              )}
              {idImageBack && (
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)", marginBottom:4, textAlign:"center" }}>Back</p>
                  <img src={idImageBack} alt="ID Back" style={{ width:"100%", height:70, objectFit:"cover", borderRadius:8, border:"1px solid rgba(212,175,55,0.3)" }} />
                </div>
              )}
            </div>
          )}

          {/* GRC Form Fields */}
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <div><label style={labelStyle}>Guest Name *</label><input value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="Suresh Kumar" style={inpStyle} /></div>
              <div><label style={labelStyle}>Phone *</label><input value={guestPhone} onChange={e => setGuestPhone(e.target.value)} placeholder="9876543210" type="tel" style={inpStyle} /></div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <div><label style={labelStyle}>Check-In *</label><input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} min={new Date().toISOString().split("T")[0]} style={inpStyle} /></div>
              <div><label style={labelStyle}>Check-Out *</label><input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} min={checkIn||new Date().toISOString().split("T")[0]} style={inpStyle} /></div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <div><label style={labelStyle}>ID Type</label>
                <select value={idType} onChange={e => setIdType(e.target.value)} style={inpStyle}>
                  {["Aadhaar","PAN","Passport","Driving License","Voter ID"].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div><label style={labelStyle}>ID Number</label><input value={idNumber} onChange={e => setIdNumber(e.target.value)} placeholder="XXXX XXXX XXXX" style={inpStyle} /></div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <div><label style={labelStyle}>Gender</label>
                <select value={gender} onChange={e => setGender(e.target.value)} style={inpStyle}>
                  <option value="">Select</option><option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
              <div><label style={labelStyle}>Date of Birth</label><input type="date" value={dob} onChange={e => setDob(e.target.value)} style={inpStyle} /></div>
            </div>
            <div><label style={labelStyle}>Address</label><textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="Full address..." rows={2} style={{ ...inpStyle, resize:"none", lineHeight:1.5 }} /></div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {!selectedRoom && (
                <div><label style={labelStyle}>Room Type</label>
                  <select value={roomType} onChange={e => setRoomType(e.target.value)} style={inpStyle}>
                    <option value="Standard Room">Standard — ₹{(hotel.standardRate||1200).toLocaleString("en-IN")}/raat</option>
                    <option value="Deluxe Room">Deluxe — ₹{(hotel.deluxeRate||2000).toLocaleString("en-IN")}/raat</option>
                    <option value="Suite Room">Suite — ₹{(hotel.suiteRate||3800).toLocaleString("en-IN")}/raat</option>
                  </select>
                </div>
              )}
              <div><label style={labelStyle}>Payment Mode</label>
                <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)} style={inpStyle}>
                  <option>Cash</option><option>UPI</option><option>Card</option><option>Online</option>
                </select>
              </div>
            </div>

            {/* Bill summary */}
            {nights > 0 && (
              <div style={{ background:"rgba(212,175,55,0.06)", border:"1px solid rgba(212,175,55,0.2)", borderRadius:12, padding:"12px 14px", animation:"fadeUp 0.3s ease" }}>
                {negotiatedRate && (
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                    <span style={{ fontSize:10, color:"#22c55e" }}>🔒 AI Negotiated Rate</span>
                    <span style={{ fontSize:10, color:"#22c55e" }}>₹{negotiatedRate.toLocaleString("en-IN")}/night</span>
                  </div>
                )}
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                  <span style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>{selectedRoom?`Room ${selectedRoom.number}`:roomType} × {nights} raat</span>
                  <span style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>₹{roomRate.toLocaleString("en-IN")} × {nights}</span>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontSize:14, fontWeight:800, color:"#D4AF37" }}>Total</span>
                  <span style={{ fontSize:20, fontWeight:900, color:"#D4AF37", textShadow:"0 0 16px rgba(212,175,55,0.4)" }}>₹{total.toLocaleString("en-IN")}</span>
                </div>
              </div>
            )}

            {formError && (
              <div style={{ padding:"10px 12px", borderRadius:10, background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.25)", color:"#ef4444", fontSize:12, animation:"fadeUp 0.2s ease" }}>⚠️ {formError}</div>
            )}

            {/* SUBMITTED → Show Premium Booking Pass */}
            {submitted ? (
              <BookingPassCard
                booking={bookingResult}
                hotel={hotel}
                onDownload={() => console.log("[BookingPass] Downloaded")}
              />
            ) : (
              <button onClick={handleBook} disabled={submitting} style={{ width:"100%", padding:"15px", borderRadius:14, fontWeight:900, fontSize:14, background:submitting?"rgba(212,175,55,0.3)":"linear-gradient(135deg,#b8960c,#D4AF37,#F5C842)", color:"#000", border:"none", cursor:submitting?"not-allowed":"pointer", boxShadow:"0 4px 24px rgba(212,175,55,0.35)", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                {submitting ? <><div style={{ width:16, height:16, borderRadius:"50%", border:"2px solid rgba(0,0,0,0.3)", borderTop:"2px solid #000", animation:"spinRingCW 0.8s linear infinite" }} /> Saving...</> : "📱 Reserve Karo — Hotel Ko Alert Jayega"}
              </button>
            )}

            <div style={{ display:"flex", gap:8, padding:"10px 12px", borderRadius:10, background:"rgba(0,140,255,0.04)", border:"1px solid rgba(0,140,255,0.1)" }}>
              <ShieldCheck size={13} style={{ color:"#60b8ff", flexShrink:0, marginTop:1 }} />
              <p style={{ fontSize:10, color:"rgba(255,255,255,0.3)", lineHeight:1.5 }}>Direct booking se <strong style={{ color:"rgba(255,255,255,0.5)" }}>rate lock</strong> hota hai — 0% OTA commission. Room <strong style={{ color:"#D4AF37" }}>GOLD (Reserved)</strong> status mein switch hoga jab tak staff approve na kare.</p>
            </div>
          </div>
        </div>

        {/* LOCATION */}
        <div style={{ background:"rgba(6,8,15,0.98)", border:"1px solid rgba(255,255,255,0.055)", borderRadius:16, padding:"14px", marginBottom:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:"rgba(0,140,255,0.1)", border:"1px solid rgba(0,140,255,0.2)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <MapPin size={15} style={{ color:"#60b8ff" }} />
            </div>
            <div>
              <p style={{ fontSize:13, fontWeight:700, color:"#fff" }}>{hotel.name}</p>
              <p style={{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>{hotel.addressLine || hotel.location}</p>
            </div>
          </div>
          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotel.name+" "+hotel.location)}`} target="_blank" rel="noopener noreferrer" style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, width:"100%", padding:"10px", borderRadius:10, background:"rgba(0,140,255,0.08)", border:"1px solid rgba(0,140,255,0.2)", color:"#60b8ff", fontSize:11, fontWeight:700, textDecoration:"none" }}>
            <Navigation size={11} /> Google Maps Pe Dekho
          </a>
        </div>

        {/* FAQ */}
        <FaqSection faqOpen={faqOpen} setFaqOpen={setFaqOpen} />
      </div>

      {/* CHAT BUTTON */}
      {!chatOpen && (
        <button onClick={() => setChatOpen(true)} style={{ position:"fixed", bottom:20, right:18, zIndex:50, width:52, height:52, borderRadius:"50%", background:"linear-gradient(135deg,#0050c8,#0080ff)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 20px rgba(0,140,255,0.4)" }}>
          <MessageCircle size={20} style={{ color:"#fff" }} />
          <div style={{ position:"absolute", top:3, right:3, width:10, height:10, borderRadius:"50%", background:"#22c55e", border:"2px solid #07090E" }} />
        </button>
      )}

      {/* AI NEGOTIATOR CHAT PANEL */}
      {chatOpen && (
        <div style={{ position:"fixed", inset:0, zIndex:50, display:"flex", flexDirection:"column", background:"linear-gradient(180deg,#0d111e,#060810)", animation:"slideUp 0.3s cubic-bezier(0.16,1,0.3,1) forwards" }}>
          <div style={{ padding:"14px 16px", borderBottom:"1px solid rgba(255,255,255,0.05)", display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(0,0,0,0.3)", flexShrink:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:36, height:36, borderRadius:"50%", background:"linear-gradient(135deg,#14172a,#1e293b)", border:"1px solid rgba(212,175,55,0.4)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>🤖</div>
              <div>
                <p style={{ fontSize:12, fontWeight:800, color:"#D4AF37" }}>AI Negotiator & Concierge</p>
                <p style={{ fontSize:9, color:"#22c55e" }}>● Online · Discount negotiate kar sakte ho</p>
              </div>
            </div>
            <button onClick={() => setChatOpen(false)} style={{ width:32, height:32, borderRadius:8, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", color:"rgba(255,255,255,0.4)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <X size={15} />
            </button>
          </div>

          {(checkIn || selectedRoom) && (
            <div style={{ padding:"8px 14px", background:"rgba(212,175,55,0.05)", borderBottom:"1px solid rgba(212,175,55,0.1)", display:"flex", gap:12, flexWrap:"wrap" }}>
              {checkIn && <span style={{ fontSize:9, color:"rgba(212,175,55,0.7)", background:"rgba(212,175,55,0.08)", padding:"3px 8px", borderRadius:6 }}>📅 {checkIn} → {checkOut||"?"}</span>}
              {selectedRoom && <span style={{ fontSize:9, color:"rgba(212,175,55,0.7)", background:"rgba(212,175,55,0.08)", padding:"3px 8px", borderRadius:6 }}>🏠 Room {selectedRoom.number}</span>}
              {negotiatedRate && <span style={{ fontSize:9, color:"#22c55e", background:"rgba(34,197,94,0.1)", padding:"3px 8px", borderRadius:6 }}>🔒 ₹{negotiatedRate}/night locked</span>}
            </div>
          )}

          <div style={{ flex:1, padding:"14px", overflowY:"auto", display:"flex", flexDirection:"column", gap:10, WebkitOverflowScrolling:"touch" }}>
            {messages.map((msg,i) => (
              <div key={i} style={{ display:"flex", justifyContent:msg.role==="user"?"flex-end":"flex-start", animation:"fadeUp 0.25s ease" }}>
                <div style={{
                  maxWidth:"85%", padding:"10px 13px",
                  borderRadius:msg.role==="user"?"14px 14px 4px 14px":"14px 14px 14px 4px",
                  fontSize:12, lineHeight:1.6,
                  background:msg.role==="user"?"linear-gradient(135deg,#91711e,#D4AF37)":msg.isNegotiationResult?msg.approved?"rgba(34,197,94,0.1)":"rgba(239,68,68,0.08)":"rgba(255,255,255,0.05)",
                  color:msg.role==="user"?"#000":"rgba(255,255,255,0.85)",
                  border:msg.role==="user"?"none":msg.isNegotiationResult?`1px solid ${msg.approved?"rgba(34,197,94,0.3)":"rgba(239,68,68,0.25)"}` :"1px solid rgba(255,255,255,0.06)",
                  fontWeight:msg.role==="user"?700:400,
                }}>
                  {msg.content.split("\n").map((line,j) => <span key={j}>{line}{j<msg.content.split("\n").length-1&&<br/>}</span>)}
                  {msg.isNegotiationResult&&msg.approved&&msg.token&&(
                    <div style={{ marginTop:8, padding:"6px 8px", borderRadius:6, background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.2)" }}>
                      <p style={{ fontSize:9, color:"#22c55e", fontFamily:"monospace" }}>🔒 Rate Lock Token: {msg.token}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {(chatLoading||negotiating) && (
              <div style={{ display:"flex", gap:5, padding:"8px 4px", alignItems:"center" }}>
                {negotiating && <span style={{ fontSize:10, color:"#D4AF37", marginRight:4 }}>Negotiating...</span>}
                {[0,1,2].map(i => <div key={i} style={{ width:7, height:7, borderRadius:"50%", background:negotiating?"#D4AF37":"#008cff", animation:"dotBounce 1.2s infinite", animationDelay:`${i*0.2}s` }} />)}
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div style={{ padding:"8px 14px 0", display:"flex", gap:6, flexWrap:"wrap", flexShrink:0 }}>
            {["Rates kya hain?","₹1000 mein milega?","Discount do","Book karna hai","Check-in time?"].map(q => (
              <button key={q} onClick={() => sendChat(q)} style={{ fontSize:10, padding:"6px 10px", borderRadius:8, background:"rgba(212,175,55,0.08)", border:"1px solid rgba(212,175,55,0.2)", color:"#D4AF37", cursor:"pointer", fontWeight:600, whiteSpace:"nowrap" }}>{q}</button>
            ))}
          </div>

          <div style={{ padding:"10px 14px 16px", borderTop:"1px solid rgba(255,255,255,0.05)", background:"rgba(0,0,0,0.3)", display:"flex", gap:8, alignItems:"center", flexShrink:0 }}>
            <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key==="Enter" && sendChat()} placeholder="Hinglish mein puchho ya negotiate karo..." style={{ flex:1, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:12, padding:"11px 14px", fontSize:12, color:"#fff", outline:"none" }} />
            <button onClick={() => sendChat()} disabled={!chatInput.trim()||chatLoading} style={{ width:42, height:42, borderRadius:11, background:"linear-gradient(135deg,#0050c8,#0080ff)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", opacity:(!chatInput.trim()||chatLoading)?0.4:1 }}>
              <Send size={14} style={{ color:"#fff" }} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FaqSection({ faqOpen, setFaqOpen }) {
  const faqs = [
    { q:"Check-in / Check-out time?",    a:"Check-in: 12:00 PM | Check-out: 11:00 AM. Early check-in availability pe depend karta hai." },
    { q:"Direct booking ka fayda?",       a:"Rate lock hota hai — 0% OTA commission (18% savings), aur checkout tak rate change nahi hoga." },
    { q:"AI Negotiator kya hota hai?",    a:"AI Negotiator se aap directly discount negotiate kar sakte ho. Agar requested rate hotel ke floor price se upar hai aur 30% se kam discount hai, toh automatically approve ho jata hai aur rate lock token milta hai." },
    { q:"Reserved (Gold) status kya hai?",a:"Jab aap marketplace se book karte ho, room automatically GOLD (Reserved) ho jata hai. Hotel staff approve karne ke baad RED (Occupied) ho jata hai. Tab aapko WhatsApp confirmation milegi." },
    { q:"Payment kab?",                   a:"Check-in ke time hotel reception pe — Cash ya UPI accepted hai." },
    { q:"Cancellation policy?",           a:"24 ghante pehle cancellation bilkul free hai. Uske baad ek raat ka charge lagega." },
  ];
  return (
    <div style={{ background:"rgba(6,8,15,0.98)", border:"1px solid rgba(255,255,255,0.055)", borderRadius:16, overflow:"hidden", marginBottom:14 }}>
      <div style={{ padding:"12px 14px", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
        <p style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.3)", letterSpacing:"0.12em", textTransform:"uppercase" }}>Aksar Puche Sawal</p>
      </div>
      {faqs.map((f,i) => (
        <div key={i} style={{ borderBottom:i<faqs.length-1?"1px solid rgba(255,255,255,0.04)":"none" }}>
          <button onClick={() => setFaqOpen(faqOpen===i?null:i)} style={{ width:"100%", padding:"13px 14px", display:"flex", justifyContent:"space-between", alignItems:"center", background:"transparent", border:"none", cursor:"pointer", textAlign:"left" }}>
            <span style={{ fontSize:12, color:"rgba(255,255,255,0.6)", fontWeight:600, flex:1, paddingRight:12 }}>{f.q}</span>
            <span style={{ fontSize:16, color:"#D4AF37", transition:"transform 0.2s", transform:faqOpen===i?"rotate(45deg)":"none", flexShrink:0, display:"inline-block" }}>+</span>
          </button>
          {faqOpen===i && <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", lineHeight:1.6, padding:"0 14px 13px", animation:"fadeUp 0.2s ease" }}>{f.a}</p>}
        </div>
      ))}
    </div>
  );
}
