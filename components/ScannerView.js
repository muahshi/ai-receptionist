"use client";
import { useState, useRef, useEffect } from "react";
import { ChevronLeft, Camera, Loader, Check, Lock, User, Phone, MapPin, CreditCard, Moon, Plus, Minus } from "lucide-react";
import { createBooking, getRooms, getHotelConfig } from "../lib/db";
import { sendBookingAlerts } from "../lib/alerts";

const STEPS = { CAM:"cam", FORM:"form", SUCCESS:"success" };

export default function ScannerView({ user, onSuccess, onBack }) {
  const [step, setStep]           = useState(STEPS.CAM);
  const [scanning, setScanning]   = useState(false);
  const [scanPct, setScanPct]     = useState(0);
  const [cameraErr, setCameraErr] = useState("");
  const [extracted, setExtracted] = useState({});
  const [rateLocked, setLocked]   = useState(false);
  const [lockAnim, setLockAnim]   = useState(false);
  const [submitting, setSub]      = useState(false);
  const [vacantRooms, setVacant]  = useState([]);
  const [form, setForm]           = useState({
    guestName:"", guestPhone:"", address:"",
    idType:"Aadhaar", idNumber:"", gender:"",
    roomId:"", checkInDate: new Date().toISOString().split("T")[0],
    checkOutDate:"", nights:1, ratePerNight:1500,
    totalAmount:1500, paymentMode:"Cash",
  });

  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    setVacant(getRooms().filter(r => r.status === "vacant"));
    return () => stopCam();
  }, []);

  useEffect(() => {
    if (step === STEPS.CAM) startCam();
    else stopCam();
  }, [step]);

  const startCam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode:"environment", width:{ ideal:1280 }, height:{ ideal:720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraErr("");
    } catch {
      setCameraErr("Camera access nahi mila.");
      setStep(STEPS.FORM);
    }
  };
  const stopCam = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  const captureAndScan = async () => {
    if (!videoRef.current || scanning) return;
    setScanning(true); setScanPct(0);
    if (navigator.vibrate) navigator.vibrate(30);
    const piv = setInterval(() => setScanPct(p => p >= 88 ? (clearInterval(piv), 88) : p + Math.random()*15), 200);
    try {
      const canvas = canvasRef.current;
      canvas.width  = videoRef.current.videoWidth  || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
      const base64 = canvas.toDataURL("image/jpeg", 0.85).split(",")[1];
      const res    = await fetch("/api/groq", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ imageBase64: base64, type:"id_scan" }),
      });
      const data = await res.json();
      clearInterval(piv); setScanPct(100);
      if (data.success && data.data) {
        const d = data.data;
        setExtracted(d);
        setForm(f => ({ ...f, guestName: d.name||"", address: d.address||"", idNumber: d.idNumber||"", idType: d.idType||"Aadhaar", gender: d.gender||"" }));
        if (navigator.vibrate) navigator.vibrate([50,30,100]);
      }
      setTimeout(() => { setStep(STEPS.FORM); setScanning(false); }, 400);
    } catch {
      clearInterval(piv); setScanning(false); setScanPct(0); setStep(STEPS.FORM);
    }
  };

  const upd = (k, v) => setForm(f => {
    const u = { ...f, [k]: v };
    if (k === "checkInDate" || k === "checkOutDate") {
      if (u.checkInDate && u.checkOutDate) {
        const n = Math.max(1, Math.ceil((new Date(u.checkOutDate)-new Date(u.checkInDate))/(86400000)));
        u.nights = n; u.totalAmount = n * u.ratePerNight;
      }
    }
    if (k === "ratePerNight" || k === "nights") u.totalAmount = u.nights * u.ratePerNight;
    return u;
  });

  const lockRate = () => {
    if (rateLocked) return;
    setLockAnim(true);
    if (navigator.vibrate) navigator.vibrate([30,20,30,20,100]);
    setTimeout(() => { setLocked(true); setLockAnim(false); }, 700);
  };

  const handleSubmit = async () => {
    if (!form.roomId || !form.guestName || !rateLocked) return;
    setSub(true);
    if (navigator.vibrate) navigator.vibrate([50,30,50,30,200]);
    try {
      const booking = createBooking({ ...form, status:"active",
        roomType: vacantRooms.find(r => r.id === form.roomId)?.type || "standard" });
      sendBookingAlerts(booking).catch(console.error);
      setStep(STEPS.SUCCESS);
      setTimeout(onSuccess, 2500);
    } catch(e) { console.error(e); }
    setSub(false);
  };

  /* ── SUCCESS ─────────────────────────────────────────────── */
  if (step === STEPS.SUCCESS) return (
    <div className="h-full flex flex-col items-center justify-center text-center px-6">
      <div className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6 lock-seal"
        style={{ background:"rgba(34,197,94,0.15)", border:"2px solid rgba(34,197,94,0.4)" }}>
        <span className="text-5xl">✅</span>
      </div>
      <h2 className="font-black text-3xl text-white mb-1">Check-in Ho Gaya!</h2>
      <p className="text-gray-400 text-sm">{form.guestName}</p>
      <p className="text-gray-600 text-xs mt-0.5 mb-5">Room {form.roomId}</p>
      <div className="card-gold rounded-2xl px-8 py-4 text-center">
        <p className="text-gray-500 text-xs mb-1">Total Amount</p>
        <p className="font-black text-3xl" style={{ color:"#D4AF37" }}>₹{form.totalAmount.toLocaleString("en-IN")}</p>
      </div>
      <p className="text-gray-700 text-xs mt-5">3 WhatsApp alerts bhej diye gaye 📱</p>
    </div>
  );

  /* ── CAMERA ──────────────────────────────────────────────── */
  if (step === STEPS.CAM) return (
    <div className="h-full flex flex-col px-3 py-2">
      <div className="flex items-center gap-3 mb-3 flex-shrink-0">
        <button onClick={onBack} className="w-9 h-9 card rounded-xl flex items-center justify-center">
          <ChevronLeft size={18} className="text-gray-400"/>
        </button>
        <h2 className="font-bold text-lg" style={{ color:"#D4AF37" }}>ID Scan Karo</h2>
      </div>

      <div className="flex-1 scan-frame relative rounded-2xl overflow-hidden">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"/>
        {scanning && <div className="scan-line"/>}
        {!scanning && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center px-5 py-3 rounded-2xl" style={{ background:"rgba(0,0,0,0.6)", backdropFilter:"blur(8px)" }}>
              <p className="font-semibold text-sm" style={{ color:"#D4AF37" }}>Aadhaar / Passport</p>
              <p className="text-gray-400 text-xs mt-0.5">Frame mein rakh ke scan karo</p>
            </div>
          </div>
        )}
        {scanning && (
          <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background:"rgba(0,0,0,0.5)" }}>
            <div className="h-full transition-all duration-300" style={{ width:`${scanPct}%`, background:"#D4AF37" }}/>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden"/>

      <div className="flex-shrink-0 mt-3 space-y-2">
        <button onClick={captureAndScan} disabled={scanning}
          className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all"
          style={scanning
            ? { background:"rgba(212,175,55,0.2)", color:"#D4AF37" }
            : { background:"linear-gradient(135deg,#b8960c,#D4AF37,#F5C842)", color:"#000", boxShadow:"0 4px 20px rgba(212,175,55,0.35)" }}>
          {scanning ? <><Loader size={20} className="animate-spin"/>AI Scan Kar Raha Hai...</> : <><Camera size={20}/>ID Scan Karo</>}
        </button>
        <button onClick={() => setStep(STEPS.FORM)}
          className="w-full py-3 rounded-2xl card text-gray-500 text-sm">
          Skip — Manual Fill Karo
        </button>
      </div>
    </div>
  );

  /* ── FORM ────────────────────────────────────────────────── */
  return (
    <div className="h-full flex flex-col px-3 py-2">
      <div className="flex items-center gap-3 mb-3 flex-shrink-0">
        <button onClick={() => setStep(STEPS.CAM)} className="w-9 h-9 card rounded-xl flex items-center justify-center">
          <ChevronLeft size={18} className="text-gray-400"/>
        </button>
        <h2 className="font-bold text-lg" style={{ color:"#D4AF37" }}>Check-in Details</h2>
        {Object.keys(extracted).length > 0 && (
          <span className="ml-auto text-xs px-2 py-1 rounded-full font-semibold"
            style={{ background:"rgba(34,197,94,0.15)", color:"#22c55e" }}>AI ✓ Filled</span>
        )}
      </div>

      <div className="flex-1 scroll-y space-y-3 pb-4">

        {/* Guest Info */}
        <Section title="Guest Info">
          <FI icon={<User size={13}/>}    label="Naam"    value={form.guestName}  onChange={v => upd("guestName",v)}  ph="Guest ka naam"/>
          <FI icon={<Phone size={13}/>}   label="Phone"   value={form.guestPhone} onChange={v => upd("guestPhone",v)} ph="+91 9999999999" type="tel"/>
          <FI icon={<MapPin size={13}/>}  label="Address" value={form.address}    onChange={v => upd("address",v)}    ph="Full address"/>
        </Section>

        {/* ID */}
        <Section title="ID Details">
          <div>
            <label className="text-gray-600 text-xs mb-1.5 block">ID Type</label>
            <div className="grid grid-cols-3 gap-1.5">
              {["Aadhaar","Passport","Driving License"].map(t => (
                <button key={t} onClick={() => upd("idType",t)}
                  className="py-2 rounded-xl text-xs font-semibold transition-all"
                  style={form.idType === t
                    ? { background:"linear-gradient(135deg,#b8960c,#D4AF37)", color:"#000" }
                    : { background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:"#666" }}>
                  {t === "Driving License" ? "DL" : t}
                </button>
              ))}
            </div>
          </div>
          <FI icon={<CreditCard size={13}/>} label="ID Number" value={form.idNumber} onChange={v => upd("idNumber",v)} ph="ID number"/>
        </Section>

        {/* Room & Dates */}
        <Section title="Room & Dates">
          <div>
            <label className="text-gray-600 text-xs mb-1.5 block">Room Select Karo</label>
            <div className="grid grid-cols-5 gap-1.5">
              {vacantRooms.slice(0,20).map(room => (
                <button key={room.id} onClick={() => upd("roomId", room.id)}
                  className="py-2.5 rounded-xl text-xs font-mono font-bold transition-all"
                  style={form.roomId === room.id
                    ? { background:"linear-gradient(135deg,#b8960c,#D4AF37)", color:"#000" }
                    : { background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.25)", color:"#22c55e" }}>
                  {room.number}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-gray-600 text-xs mb-1 block">Check-in</label>
              <input type="date" value={form.checkInDate}
                onChange={e => upd("checkInDate", e.target.value)}
                className="inp w-full px-3 py-2.5 text-sm" style={{ colorScheme:"dark" }}/>
            </div>
            <div>
              <label className="text-gray-600 text-xs mb-1 block">Check-out</label>
              <input type="date" value={form.checkOutDate}
                onChange={e => upd("checkOutDate", e.target.value)}
                className="inp w-full px-3 py-2.5 text-sm" style={{ colorScheme:"dark" }}/>
            </div>
          </div>
          <div className="flex items-center justify-between card rounded-xl px-4 py-3">
            <div className="flex items-center gap-2">
              <Moon size={14} className="text-gray-500"/>
              <span className="text-gray-400 text-sm">Nights</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => upd("nights", Math.max(1, form.nights-1))}
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background:"rgba(255,255,255,0.08)" }}><Minus size={12} className="text-white"/></button>
              <span className="text-white font-bold w-4 text-center">{form.nights}</span>
              <button onClick={() => upd("nights", form.nights+1)}
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background:"rgba(255,255,255,0.08)" }}><Plus size={12} className="text-white"/></button>
            </div>
          </div>
        </Section>

        {/* Rate Lock */}
        <div className="rounded-2xl p-4 space-y-3 transition-all"
          style={rateLocked
            ? { background:"rgba(212,175,55,0.08)", border:"1px solid rgba(212,175,55,0.3)" }
            : { background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center justify-between">
            <p className="text-gray-500 text-xs uppercase tracking-widest font-semibold">💰 Rate Tay Karo</p>
            {rateLocked && (
              <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background:"rgba(212,175,55,0.15)", color:"#D4AF37" }}>
                <Lock size={10}/> Locked
              </span>
            )}
          </div>

          <div>
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>₹500</span>
              <span className="font-black text-xl" style={{ color:"#D4AF37" }}>₹{form.ratePerNight.toLocaleString("en-IN")}</span>
              <span>₹10,000</span>
            </div>
            <input type="range" min="500" max="10000" step="100"
              value={form.ratePerNight} disabled={rateLocked}
              onChange={e => upd("ratePerNight", Number(e.target.value))}
              className="w-full disabled:opacity-40" style={{ accentColor:"#D4AF37" }}/>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {["Cash","UPI","Card"].map(m => (
              <button key={m} onClick={() => !rateLocked && upd("paymentMode",m)}
                disabled={rateLocked}
                className="py-2 rounded-xl text-xs font-semibold transition-all"
                style={form.paymentMode === m
                  ? { background:"linear-gradient(135deg,#b8960c,#D4AF37)", color:"#000" }
                  : { background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:"#555" }}>
                {m==="Cash"?"💵 Cash":m==="UPI"?"📱 UPI":"💳 Card"}
              </button>
            ))}
          </div>

          <div className="flex justify-between items-center py-2 border-t border-white/10">
            <span className="text-gray-400 text-sm">Total Amount</span>
            <span className="font-black text-2xl text-white">₹{form.totalAmount.toLocaleString("en-IN")}</span>
          </div>

          {!rateLocked ? (
            <button onClick={lockRate} disabled={lockAnim}
              className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
              style={lockAnim
                ? { background:"rgba(212,175,55,0.1)", color:"#D4AF37" }
                : { background:"linear-gradient(135deg,#b8960c,#D4AF37,#F5C842)", color:"#000", boxShadow:"0 4px 20px rgba(212,175,55,0.35)" }}>
              {lockAnim
                ? <><div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"/>Rate Lock Ho Raha Hai...</>
                : <><Lock size={16}/>Rate Lock Karo ✓</>}
            </button>
          ) : (
            <div className="w-full py-3 rounded-xl text-center"
              style={{ background:"rgba(212,175,55,0.08)", border:"1px solid rgba(212,175,55,0.3)" }}>
              <p className="font-bold text-sm flex items-center justify-center gap-2" style={{ color:"#D4AF37" }}>
                🔐 Rate Permanently Locked
              </p>
              <p className="text-gray-600 text-xs mt-0.5">Ab ye change nahi ho sakta</p>
            </div>
          )}
        </div>
      </div>

      {/* Submit */}
      <div className="flex-shrink-0 pt-2">
        <button onClick={handleSubmit}
          disabled={!form.roomId || !form.guestName || !rateLocked || submitting}
          className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all"
          style={form.roomId && form.guestName && rateLocked && !submitting
            ? { background:"linear-gradient(135deg,#b8960c,#D4AF37,#F5C842)", color:"#000", boxShadow:"0 4px 20px rgba(212,175,55,0.35)" }
            : { background:"rgba(255,255,255,0.05)", color:"#444" }}>
          {submitting
            ? <><Loader size={20} className="animate-spin"/>Check-in Ho Raha Hai...</>
            : <><Check size={20}/>Guest Check-in Karo ✓</>}
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="card rounded-2xl p-4 space-y-3">
      <p className="text-gray-600 text-xs uppercase tracking-widest">{title}</p>
      {children}
    </div>
  );
}

function FI({ icon, label, value, onChange, ph, type="text" }) {
  return (
    <div>
      <label className="flex items-center gap-1 text-gray-600 text-xs mb-1">
        <span className="text-gray-700">{icon}</span>{label}
      </label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={ph} className="inp w-full px-3 py-2.5 text-sm"/>
    </div>
  );
}
