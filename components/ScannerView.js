"use client";
import { useState, useRef, useEffect } from "react";
import {
  ChevronLeft, Camera, Loader, Check, Lock,
  User, Phone, MapPin, CreditCard, Moon,
  Plus, Minus, RefreshCw, Users, ArrowRight, Edit3
} from "lucide-react";
import { createBooking, getRooms } from "../lib/db";
import { sendBookingAlerts } from "../lib/alerts";

/* ─── STEPS ─────────────────────────────────────────────────── */
const S = {
  GUEST_COUNT : "guest_count",
  SCAN_FRONT  : "scan_front",
  SCAN_BACK   : "scan_back",
  REVIEW      : "review",
  BOOKING     : "booking",
  SUCCESS     : "success",
};

const blankGuest = () => ({
  guestName:"", guestPhone:"", address:"",
  idType:"Aadhaar", idNumber:"", gender:"", dob:"",
  frontScanned:false, backScanned:false,
});

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function ScannerView({ hotelId, hotel, user, onSuccess, onBack }) {
  const [step,       setStep]    = useState(S.GUEST_COUNT);
  const [guestCount, setCount]   = useState(1);
  const [guests,     setGuests]  = useState([blankGuest()]);
  const [curGuest,   setCurGuest]= useState(0);
  const [scanning,   setScanning]= useState(false);
  const [scanPct,    setScanPct] = useState(0);
  const [camErr,     setCamErr]  = useState("");
  const [facingMode, setFacing]  = useState("environment");
  const [rateLocked, setLocked]  = useState(false);
  const [lockAnim,   setLockAnim]= useState(false);
  const [submitting, setSub]     = useState(false);
  const [vacantRooms,setVacant]  = useState([]);
  const [booking,    setBooking] = useState({
    roomId:"", checkInDate:new Date().toISOString().split("T")[0],
    checkOutDate:"", nights:1, ratePerNight:1500,
    totalAmount:1500, paymentMode:"Cash",
  });

  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    setVacant(getRooms(hotelId).filter(r => r.status === "vacant"));
    return () => stopCam();
  }, []);

  useEffect(() => {
    if (step === S.SCAN_FRONT || step === S.SCAN_BACK) startCam();
    else stopCam();
  }, [step, facingMode]);

  /* ── camera ── */
  const startCam = async () => {
    stopCam();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video:{ facingMode, width:{ideal:1280}, height:{ideal:720} }
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCamErr("");
    } catch {
      setCamErr("Camera nahi mila.");
      setStep(S.REVIEW);
    }
  };
  const stopCam = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  /* ── scan ── */
  const captureAndScan = async () => {
    if (!videoRef.current || scanning) return;
    setScanning(true); setScanPct(0);
    if (navigator.vibrate) navigator.vibrate(30);
    const piv = setInterval(() =>
      setScanPct(p => p >= 88 ? (clearInterval(piv),88) : p + Math.random()*14)
    , 180);
    try {
      const canvas = canvasRef.current;
      canvas.width  = videoRef.current.videoWidth  || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
      const base64 = canvas.toDataURL("image/jpeg", 0.85).split(",")[1];
      const res  = await fetch("/api/groq", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ imageBase64:base64, type:"id_scan" }),
      });
      const data = await res.json();
      clearInterval(piv); setScanPct(100);

      // Debug log — visible in browser console
      console.log("[Scanner] API response:", data);

      if (data.success && data.data) {
        const d = data.data;
        console.log("[Scanner] Extracted fields:", d);

        // Only update fields that are non-empty strings
        updateGuest(curGuest, prev => ({
          ...prev,
          guestName : (d.name    && d.name.trim())    ? d.name.trim()    : prev.guestName,
          address   : (d.address && d.address.trim())  ? d.address.trim() : prev.address,
          idNumber  : (d.idNumber&& d.idNumber.trim()) ? d.idNumber.trim(): prev.idNumber,
          idType    : (d.idType  && d.idType.trim())   ? d.idType.trim()  : prev.idType,
          gender    : (d.gender  && d.gender.trim())   ? d.gender.trim()  : prev.gender,
          dob       : (d.dob     && d.dob.trim())      ? d.dob.trim()     : prev.dob,
          frontScanned: step === S.SCAN_FRONT ? true : prev.frontScanned,
          backScanned : step === S.SCAN_BACK  ? true : prev.backScanned,
        }));
        if (navigator.vibrate) navigator.vibrate([50,30,100]);
      } else {
        console.warn("[Scanner] No data extracted. Error:", data.error);
      }

      setTimeout(() => {
        setScanning(false); setScanPct(0);
        setStep(step === S.SCAN_FRONT ? S.SCAN_BACK : S.REVIEW);
      }, 400);
    } catch(err) {
      console.error("[Scanner] Network/parse error:", err);
      clearInterval(piv); setScanning(false); setScanPct(0); setStep(S.REVIEW);
    }
  };

  /* ── helpers ── */
  const updateGuest = (idx, fn) =>
    setGuests(prev => { const n=[...prev]; n[idx]=fn(n[idx]); return n; });
  const updG = (f,v) => updateGuest(curGuest, g => ({...g,[f]:v}));

  const updB = (k,v) => setBooking(b => {
    const u = {...b,[k]:v};
    if (k==="checkInDate"||k==="checkOutDate") {
      if (u.checkInDate&&u.checkOutDate) {
        const n = Math.max(1,Math.ceil((new Date(u.checkOutDate)-new Date(u.checkInDate))/86400000));
        u.nights=n; u.totalAmount=n*u.ratePerNight;
      }
    }
    if (k==="ratePerNight"||k==="nights") u.totalAmount=u.nights*u.ratePerNight;
    return u;
  });

  const lockRate = () => {
    if (rateLocked) return;
    setLockAnim(true);
    if (navigator.vibrate) navigator.vibrate([30,20,30,20,100]);
    setTimeout(() => { setLocked(true); setLockAnim(false); }, 700);
  };

  const handleSubmit = async () => {
    if (!booking.roomId || !guests[0].guestName || !rateLocked) return;
    setSub(true);
    if (navigator.vibrate) navigator.vibrate([50,30,50,30,200]);
    try {
      const b = createBooking(hotelId, {
        ...guests[0], ...booking, status:"active",
        extraGuests: guests.length>1 ? guests.slice(1) : undefined,
        roomType: vacantRooms.find(r=>r.id===booking.roomId)?.type||"standard",
      });
      sendBookingAlerts(b).catch(console.error);
      setStep(S.SUCCESS);
      setTimeout(onSuccess, 3000);
    } catch(e){ console.error(e); setSub(false); }
  };

  /* ══════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════ */

  /* SUCCESS */
  if (step===S.SUCCESS) return (
    <div className="h-full flex flex-col items-center justify-center text-center px-6 gap-5">
      <div className="w-24 h-24 rounded-3xl flex items-center justify-center lock-seal"
        style={{background:"rgba(34,197,94,0.15)",border:"2px solid rgba(34,197,94,0.4)"}}>
        <span className="text-5xl">✅</span>
      </div>
      <div>
        <h2 className="font-black text-3xl text-white mb-1">Check-in Ho Gaya!</h2>
        <p className="text-gray-400 text-sm">{guests[0].guestName}</p>
        {guests.length>1 && <p className="text-gray-600 text-xs">+{guests.length-1} aur guest</p>}
        <p className="text-gray-600 text-xs">Room {booking.roomId}</p>
      </div>
      <div className="card-gold rounded-2xl px-8 py-4">
        <p className="text-gray-500 text-xs mb-1">Total Amount</p>
        <p className="font-black text-3xl" style={{color:"#D4AF37"}}>
          ₹{booking.totalAmount.toLocaleString("en-IN")}
        </p>
      </div>
      <p className="text-gray-700 text-xs">📱 WhatsApp alerts bhej diye gaye</p>
    </div>
  );

  /* ── STEP 0: GUEST COUNT ── */
  if (step===S.GUEST_COUNT) return (
    <div className="h-full flex flex-col px-4 py-4">
      <div className="flex items-center gap-3 mb-6 flex-shrink-0">
        <button onClick={onBack} className="w-9 h-9 card rounded-xl flex items-center justify-center">
          <ChevronLeft size={18} className="text-gray-400"/>
        </button>
        <h2 className="font-bold text-lg" style={{color:"#D4AF37"}}>Nayi Booking</h2>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
          style={{background:"rgba(212,175,55,0.1)",border:"1px solid rgba(212,175,55,0.2)"}}>
          <Users size={36} style={{color:"#D4AF37"}}/>
        </div>
        <div className="text-center">
          <h3 className="font-bold text-xl text-white mb-1">Kitne Guests Hain?</h3>
          <p className="text-gray-500 text-sm">Har guest ka ID scan hoga</p>
        </div>

        {/* Counter */}
        <div className="flex items-center gap-8">
          <button onClick={()=>setCount(c=>Math.max(1,c-1))}
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)"}}>
            <Minus size={22} className="text-white"/>
          </button>
          <div className="text-center">
            <span className="font-black text-6xl text-white">{guestCount}</span>
            <p className="text-gray-500 text-xs mt-1">{guestCount===1?"Akela Guest":"Guests"}</p>
          </div>
          <button onClick={()=>setCount(c=>Math.min(8,c+1))}
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)"}}>
            <Plus size={22} className="text-white"/>
          </button>
        </div>

        {/* Quick select */}
        <div className="flex gap-2">
          {[1,2,3,4].map(n=>(
            <button key={n} onClick={()=>setCount(n)}
              className="w-12 h-10 rounded-xl text-sm font-bold transition-all"
              style={guestCount===n
                ?{background:"linear-gradient(135deg,#b8960c,#D4AF37)",color:"#000"}
                :{background:"rgba(255,255,255,0.05)",color:"#666",border:"1px solid rgba(255,255,255,0.08)"}}>
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-shrink-0 pt-4">
        <button onClick={()=>{
          setGuests(Array.from({length:guestCount},()=>blankGuest()));
          setCurGuest(0); setStep(S.SCAN_FRONT);
        }}
          className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2"
          style={{background:"linear-gradient(135deg,#b8960c,#D4AF37,#F5C842)",color:"#000",boxShadow:"0 4px 20px rgba(212,175,55,0.35)"}}>
          <Camera size={20}/>ID Scan Shuru Karo<ArrowRight size={18}/>
        </button>
      </div>
    </div>
  );

  /* ── SCAN SCREEN (FRONT + BACK shared) ── */
  if (step===S.SCAN_FRONT || step===S.SCAN_BACK) {
    const isFront = step===S.SCAN_FRONT;
    const gLabel  = guestCount>1 ? ` — Guest ${curGuest+1}/${guestCount}` : "";
    return (
      <div className="h-full flex flex-col px-3 py-2">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2 flex-shrink-0">
          <button onClick={()=>{
            if(isFront&&curGuest===0) setStep(S.GUEST_COUNT);
            else if(isFront) setStep(S.REVIEW);
            else setStep(S.SCAN_FRONT);
          }} className="w-9 h-9 card rounded-xl flex items-center justify-center flex-shrink-0">
            <ChevronLeft size={18} className="text-gray-400"/>
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-base truncate" style={{color:"#D4AF37"}}>
              {isFront?"ID Ka Aagla (Front)":"ID Ka Peechla (Back)"}{gLabel}
            </h2>
            <p className="text-gray-600 text-xs">
              {isFront?"Aadhaar/Passport front side":"Peeche wali side scan karo"}
            </p>
          </div>
          {/* Flip camera toggle */}
          <button onClick={()=>setFacing(f=>f==="environment"?"user":"environment")}
            className="w-9 h-9 card rounded-xl flex items-center justify-center flex-shrink-0">
            <RefreshCw size={15} className="text-gray-400"/>
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1 mb-2 flex-shrink-0">
          {[
            {label:"Front", active:isFront,  done:guests[curGuest].frontScanned&&!isFront},
            {label:"Back",  active:!isFront, done:guests[curGuest].backScanned},
            {label:"Details",active:false,   done:false},
          ].map((s,i)=>(
            <div key={i} className="flex items-center gap-1">
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                style={s.active
                  ?{background:"rgba(212,175,55,0.2)",color:"#D4AF37",border:"1px solid rgba(212,175,55,0.4)"}
                  :s.done
                    ?{background:"rgba(34,197,94,0.1)",color:"#22c55e"}
                    :{background:"rgba(255,255,255,0.04)",color:"#444"}}>
                {s.done?"✓ ":""}{s.label}
              </span>
              {i<2&&<div className="w-2 h-px bg-white/10"/>}
            </div>
          ))}
        </div>

        {/* Camera */}
        <div className="flex-1 scan-frame relative rounded-2xl overflow-hidden min-h-0">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"/>
          {scanning && <div className="scan-line"/>}
          {!scanning && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {/* Corner guide brackets */}
              <div className="w-4/5 h-1/2 relative">
                {["top-0 left-0 border-t-2 border-l-2 rounded-tl-xl",
                  "top-0 right-0 border-t-2 border-r-2 rounded-tr-xl",
                  "bottom-0 left-0 border-b-2 border-l-2 rounded-bl-xl",
                  "bottom-0 right-0 border-b-2 border-r-2 rounded-br-xl",
                ].map((c,i)=>(
                  <div key={i} className={`absolute w-8 h-8 ${c}`}
                    style={{borderColor:"rgba(212,175,55,0.8)"}}/>
                ))}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center px-4 py-2 rounded-xl"
                    style={{background:"rgba(0,0,0,0.65)",backdropFilter:"blur(8px)"}}>
                    <p className="text-xs font-semibold" style={{color:"#D4AF37"}}>
                      {isFront?"ID — Aagla Hissa":"ID — Peechla Hissa"}
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5">Frame ke andar rakho</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          {scanning && (
            <div className="absolute bottom-0 left-0 right-0 h-1.5" style={{background:"rgba(0,0,0,0.5)"}}>
              <div className="h-full transition-all duration-200"
                style={{width:`${scanPct}%`,background:"linear-gradient(90deg,#b8960c,#D4AF37,#F5C842)"}}/>
            </div>
          )}
        </div>
        <canvas ref={canvasRef} className="hidden"/>

        {/* Buttons */}
        <div className="flex-shrink-0 mt-3 space-y-2">
          <button onClick={captureAndScan} disabled={scanning}
            className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all"
            style={scanning
              ?{background:"rgba(212,175,55,0.15)",color:"#D4AF37"}
              :{background:"linear-gradient(135deg,#b8960c,#D4AF37,#F5C842)",color:"#000",boxShadow:"0 4px 20px rgba(212,175,55,0.35)"}}>
            {scanning
              ?<><Loader size={20} className="animate-spin"/>Scan Kar Raha Hai... {Math.round(scanPct)}%</>
              :<><Camera size={20}/>{isFront?"Aagla Hissa Scan Karo":"Peechla Hissa Scan Karo"}</>}
          </button>

          {!isFront && (
            <button onClick={()=>setStep(S.REVIEW)}
              className="w-full py-3 rounded-2xl card text-gray-500 text-sm font-medium">
              Skip — Seedha Details Bharo
            </button>
          )}
          {isFront && (
            <button onClick={()=>setStep(S.REVIEW)}
              className="w-full py-3 rounded-2xl card text-gray-500 text-sm font-medium">
              Manual Fill Karo
            </button>
          )}
        </div>
      </div>
    );
  }

  /* ── REVIEW / EDIT DETAILS ── */
  if (step===S.REVIEW) {
    const g = guests[curGuest];
    const isLast = curGuest===guests.length-1;
    const gLabel = guestCount>1 ? `Guest ${curGuest+1} Details` : "Guest Details";
    return (
      <div className="h-full flex flex-col px-3 py-2">
        <div className="flex items-center gap-3 mb-2 flex-shrink-0">
          <button onClick={()=>setStep(S.SCAN_BACK)}
            className="w-9 h-9 card rounded-xl flex items-center justify-center">
            <ChevronLeft size={18} className="text-gray-400"/>
          </button>
          <h2 className="font-bold text-lg" style={{color:"#D4AF37"}}>{gLabel}</h2>
          {(g.frontScanned||g.backScanned)&&(
            <span className="ml-auto text-xs px-2 py-1 rounded-full font-semibold"
              style={{background:"rgba(34,197,94,0.12)",color:"#22c55e"}}>
              ✓ AI Filled
            </span>
          )}
        </div>

        {/* Scan status + rescan */}
        <div className="flex gap-2 mb-3 flex-shrink-0">
          {[
            {label:"Front",done:g.frontScanned,step:S.SCAN_FRONT},
            {label:"Back", done:g.backScanned,  step:S.SCAN_BACK},
          ].map((b,i)=>(
            <button key={i} onClick={()=>setStep(b.step)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={b.done
                ?{background:"rgba(34,197,94,0.12)",border:"1px solid rgba(34,197,94,0.3)",color:"#22c55e"}
                :{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",color:"#555"}}>
              {b.done?<Check size={10}/>:<Camera size={10}/>}
              {b.label} {b.done?"✓":"Scan"}
            </button>
          ))}
        </div>

        <div className="flex-1 scroll-y space-y-3 pb-4">
          <Section title="👤 Guest Info">
            <FI icon={<User size={13}/>}   label="Naam *"  value={g.guestName}  onChange={v=>updG("guestName",v)}  ph="Guest ka naam"/>
            <FI icon={<Phone size={13}/>}  label="Mobile *" value={g.guestPhone} onChange={v=>updG("guestPhone",v)} ph="+91 9999999999" type="tel"/>
            <FI icon={<MapPin size={13}/>} label="Address" value={g.address}    onChange={v=>updG("address",v)}    ph="Ghar ka address"/>
          </Section>

          <Section title="🪪 ID Details">
            <div>
              <label className="text-gray-600 text-xs mb-1.5 block">ID Type</label>
              <div className="grid grid-cols-3 gap-1.5">
                {["Aadhaar","Passport","DL"].map(t=>(
                  <button key={t} onClick={()=>updG("idType",t==="DL"?"Driving License":t)}
                    className="py-2 rounded-xl text-xs font-semibold transition-all"
                    style={g.idType===(t==="DL"?"Driving License":t)
                      ?{background:"linear-gradient(135deg,#b8960c,#D4AF37)",color:"#000"}
                      :{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",color:"#666"}}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <FI icon={<CreditCard size={13}/>} label="ID Number" value={g.idNumber} onChange={v=>updG("idNumber",v)} ph="ID number"/>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-gray-600 text-xs mb-1 block">Gender</label>
                <div className="flex gap-1">
                  {["M","F","Other"].map(gn=>(
                    <button key={gn} onClick={()=>updG("gender",gn)}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold"
                      style={g.gender===gn
                        ?{background:"linear-gradient(135deg,#b8960c,#D4AF37)",color:"#000"}
                        :{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",color:"#555"}}>
                      {gn}
                    </button>
                  ))}
                </div>
              </div>
              <FI label="DOB" value={g.dob} onChange={v=>updG("dob",v)} ph="DD/MM/YYYY"/>
            </div>
          </Section>

          <div className="flex gap-2">
            <button onClick={()=>setStep(S.SCAN_FRONT)}
              className="flex-1 py-2.5 rounded-xl card text-xs font-semibold text-gray-400 flex items-center justify-center gap-1.5">
              <RefreshCw size={12}/> Front Rescan
            </button>
            <button onClick={()=>setStep(S.SCAN_BACK)}
              className="flex-1 py-2.5 rounded-xl card text-xs font-semibold text-gray-400 flex items-center justify-center gap-1.5">
              <RefreshCw size={12}/> Back Rescan
            </button>
          </div>
        </div>

        <div className="flex-shrink-0 pt-2 space-y-2">
          {!g.guestName&&(
            <p className="text-center text-red-400 text-xs">⚠ Naam zaroori hai</p>
          )}
          {!isLast ? (
            <button onClick={()=>{setCurGuest(curGuest+1);setStep(S.SCAN_FRONT);}}
              disabled={!g.guestName}
              className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all"
              style={g.guestName
                ?{background:"linear-gradient(135deg,#b8960c,#D4AF37,#F5C842)",color:"#000",boxShadow:"0 4px 20px rgba(212,175,55,0.35)"}
                :{background:"rgba(255,255,255,0.05)",color:"#444"}}>
              <Camera size={18}/>Guest {curGuest+2} Scan Karo<ArrowRight size={18}/>
            </button>
          ) : (
            <button onClick={()=>setStep(S.BOOKING)}
              disabled={!g.guestName}
              className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all"
              style={g.guestName
                ?{background:"linear-gradient(135deg,#b8960c,#D4AF37,#F5C842)",color:"#000",boxShadow:"0 4px 20px rgba(212,175,55,0.35)"}
                :{background:"rgba(255,255,255,0.05)",color:"#444"}}>
              <Check size={18}/>Room Booking Karo<ArrowRight size={18}/>
            </button>
          )}
        </div>
      </div>
    );
  }

  /* ── BOOKING ── */
  if (step===S.BOOKING) return (
    <div className="h-full flex flex-col px-3 py-2">
      <div className="flex items-center gap-3 mb-2 flex-shrink-0">
        <button onClick={()=>{setCurGuest(guests.length-1);setStep(S.REVIEW);}}
          className="w-9 h-9 card rounded-xl flex items-center justify-center">
          <ChevronLeft size={18} className="text-gray-400"/>
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-lg" style={{color:"#D4AF37"}}>Room Booking</h2>
          <p className="text-gray-600 text-xs truncate">
            {guests.map(g=>g.guestName||"Guest").join(", ")}
          </p>
        </div>
      </div>

      {/* Guest edit chips */}
      <div className="flex gap-1.5 mb-2 flex-wrap flex-shrink-0">
        {guests.map((g,i)=>(
          <button key={i} onClick={()=>{setCurGuest(i);setStep(S.REVIEW);}}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
            style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",color:"#888"}}>
            <User size={9}/>{g.guestName||`Guest ${i+1}`}
            <Edit3 size={8} className="text-gray-600"/>
          </button>
        ))}
      </div>

      <div className="flex-1 scroll-y space-y-3 pb-4">
        {/* Room */}
        <Section title="🛏 Room Chuniye">
          {vacantRooms.length===0
            ?<p className="text-gray-500 text-sm text-center py-2">Koi vacant room nahi</p>
            :<div className="grid grid-cols-5 gap-1.5">
              {vacantRooms.slice(0,25).map(room=>(
                <button key={room.id} onClick={()=>updB("roomId",room.id)}
                  className="py-2.5 rounded-xl text-xs font-mono font-bold transition-all"
                  style={booking.roomId===room.id
                    ?{background:"linear-gradient(135deg,#b8960c,#D4AF37)",color:"#000"}
                    :{background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.25)",color:"#22c55e"}}>
                  {room.number}
                </button>
              ))}
            </div>
          }
        </Section>

        {/* Dates */}
        <Section title="📅 Dates">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-gray-600 text-xs mb-1 block">Check-in</label>
              <input type="date" value={booking.checkInDate}
                onChange={e=>updB("checkInDate",e.target.value)}
                className="inp w-full px-3 py-2.5 text-sm" style={{colorScheme:"dark"}}/>
            </div>
            <div>
              <label className="text-gray-600 text-xs mb-1 block">Check-out</label>
              <input type="date" value={booking.checkOutDate}
                onChange={e=>updB("checkOutDate",e.target.value)}
                className="inp w-full px-3 py-2.5 text-sm" style={{colorScheme:"dark"}}/>
            </div>
          </div>
          <div className="flex items-center justify-between card rounded-xl px-4 py-3">
            <div className="flex items-center gap-2">
              <Moon size={14} className="text-gray-500"/>
              <span className="text-gray-400 text-sm">Raatein</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={()=>updB("nights",Math.max(1,booking.nights-1))}
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{background:"rgba(255,255,255,0.08)"}}>
                <Minus size={12} className="text-white"/>
              </button>
              <span className="text-white font-bold w-5 text-center">{booking.nights}</span>
              <button onClick={()=>updB("nights",booking.nights+1)}
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{background:"rgba(255,255,255,0.08)"}}>
                <Plus size={12} className="text-white"/>
              </button>
            </div>
          </div>
        </Section>

        {/* Rate Lock */}
        <div className="rounded-2xl p-4 space-y-3 transition-all"
          style={rateLocked
            ?{background:"rgba(212,175,55,0.08)",border:"1px solid rgba(212,175,55,0.3)"}
            :{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)"}}>
          <div className="flex items-center justify-between">
            <p className="text-gray-500 text-xs uppercase tracking-widest font-semibold">💰 Rate Tay Karo</p>
            {rateLocked&&(
              <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full"
                style={{background:"rgba(212,175,55,0.15)",color:"#D4AF37"}}>
                <Lock size={10}/> Locked
              </span>
            )}
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>₹500</span>
              <span className="font-black text-xl" style={{color:"#D4AF37"}}>
                ₹{booking.ratePerNight.toLocaleString("en-IN")}
              </span>
              <span>₹10,000</span>
            </div>
            <input type="range" min="500" max="10000" step="100"
              value={booking.ratePerNight} disabled={rateLocked}
              onChange={e=>updB("ratePerNight",Number(e.target.value))}
              className="w-full disabled:opacity-40" style={{accentColor:"#D4AF37"}}/>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {["Cash","UPI","Card"].map(m=>(
              <button key={m} onClick={()=>!rateLocked&&updB("paymentMode",m)}
                disabled={rateLocked}
                className="py-2 rounded-xl text-xs font-semibold transition-all"
                style={booking.paymentMode===m
                  ?{background:"linear-gradient(135deg,#b8960c,#D4AF37)",color:"#000"}
                  :{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",color:"#555"}}>
                {m==="Cash"?"💵 Cash":m==="UPI"?"📱 UPI":"💳 Card"}
              </button>
            ))}
          </div>
          <div className="flex justify-between items-center py-2 border-t border-white/10">
            <span className="text-gray-400 text-sm">Total</span>
            <span className="font-black text-2xl text-white">
              ₹{booking.totalAmount.toLocaleString("en-IN")}
            </span>
          </div>
          {!rateLocked?(
            <button onClick={lockRate} disabled={lockAnim}
              className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
              style={lockAnim
                ?{background:"rgba(212,175,55,0.1)",color:"#D4AF37"}
                :{background:"linear-gradient(135deg,#b8960c,#D4AF37,#F5C842)",color:"#000",boxShadow:"0 4px 20px rgba(212,175,55,0.35)"}}>
              {lockAnim
                ?<><div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"/>Lock Ho Raha Hai...</>
                :<><Lock size={16}/>Rate Lock Karo ✓</>}
            </button>
          ):(
            <div className="w-full py-3 rounded-xl text-center"
              style={{background:"rgba(212,175,55,0.08)",border:"1px solid rgba(212,175,55,0.3)"}}>
              <p className="font-bold text-sm flex items-center justify-center gap-2" style={{color:"#D4AF37"}}>
                🔐 Rate Lock Ho Gaya
              </p>
              <p className="text-gray-600 text-xs mt-0.5">Ab ye change nahi ho sakta</p>
            </div>
          )}
        </div>
      </div>

      {/* Final submit */}
      <div className="flex-shrink-0 pt-2">
        {(!booking.roomId||!rateLocked)&&(
          <p className="text-center text-xs text-gray-600 mb-2">
            {!booking.roomId?"⚠ Room select karo":"⚠ Pehle rate lock karo"}
          </p>
        )}
        <button onClick={handleSubmit}
          disabled={!booking.roomId||!guests[0].guestName||!rateLocked||submitting}
          className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all"
          style={booking.roomId&&guests[0].guestName&&rateLocked&&!submitting
            ?{background:"linear-gradient(135deg,#b8960c,#D4AF37,#F5C842)",color:"#000",boxShadow:"0 4px 20px rgba(212,175,55,0.35)"}
            :{background:"rgba(255,255,255,0.05)",color:"#444"}}>
          {submitting
            ?<><Loader size={20} className="animate-spin"/>Check-in Ho Raha Hai...</>
            :<><Check size={20}/>{guests.length>1?`${guests.length} Guests Check-in Karo ✓`:"Guest Check-in Karo ✓"}</>}
        </button>
      </div>
    </div>
  );

  return null;
}

/* ─── SHARED SUB-COMPONENTS ────────────────────────────────── */
function Section({ title, children }) {
  return (
    <div className="card rounded-2xl p-4 space-y-3">
      <p className="text-gray-600 text-xs uppercase tracking-widest font-semibold">{title}</p>
      {children}
    </div>
  );
}

function FI({ icon, label, value, onChange, ph, type="text" }) {
  return (
    <div>
      <label className="flex items-center gap-1 text-gray-600 text-xs mb-1">
        {icon&&<span className="text-gray-700">{icon}</span>}{label}
      </label>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)}
        placeholder={ph} className="inp w-full px-3 py-2.5 text-sm"/>
    </div>
  );
}
