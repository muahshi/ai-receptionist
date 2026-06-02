"use client";
/**
 * components/ScannerView.js — The GuestInn Network
 * ═══════════════════════════════════════════════════════════════
 * Staff-facing ID scanner portal.
 * - Opens device camera (preferably rear-facing)
 * - Captures frame → sends to /api/groq (id_scan)
 * - Stores absolute Base64 string as id_image_base64 in booking
 *   record — required for police records compliance (Form C / GRC)
 * - Extracted fields auto-populate parent form via onScanComplete()
 * - Supports both camera capture and file upload fallback
 * ═══════════════════════════════════════════════════════════════
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { Camera, Upload, RefreshCw, CheckCircle, X, ZoomIn } from "lucide-react";

// ── Schema that must be returned to parent ───────────────────
// Matches bookings table columns exactly:
// guestName, dob, address, idType, idNumber, idImageBase64,
// gender, fatherName, placeOfBirth
const EMPTY_SCHEMA = {
  guestName:     "",
  dob:           "",
  address:       "",
  idType:        "Aadhaar",
  idNumber:      "",
  idImageBase64: null,   // Absolute Base64 string — stored in DB for police records
  idImageFront:  null,   // Data URL thumbnail for display only
  idImageBack:   null,
  gender:        "",
  fatherName:    "",
  placeOfBirth:  "",
};

export default function ScannerView({
  onScanComplete,      // (schemaObj) => void — called with matched schema
  bookingId = null,    // If provided, API will store Base64 in DB immediately
  compact = false,     // Compact mode for inline use inside booking form
  onClose = null,      // Called when user closes the scanner modal
}) {
  const videoRef    = useRef(null);
  const canvasRef   = useRef(null);
  const streamRef   = useRef(null);
  const fileRef     = useRef(null);

  const [step,        setStep]        = useState("idle");     // idle|camera|scanning|done|error
  const [scanSide,    setScanSide]    = useState("front");    // front|back
  const [progress,    setProgress]    = useState(0);
  const [error,       setError]       = useState("");
  const [extracted,   setExtracted]   = useState(EMPTY_SCHEMA);
  const [frontThumb,  setFrontThumb]  = useState(null);       // Display thumbnail
  const [backThumb,   setBackThumb]   = useState(null);
  const [base64Front, setBase64Front] = useState(null);       // Full Base64 for DB
  const [base64Back,  setBase64Back]  = useState(null);
  const [previewImg,  setPreviewImg]  = useState(null);       // Full-res preview modal
  const [cameraFacing,setCameraFacing]= useState("environment"); // environment|user

  // ── Start camera ─────────────────────────────────────────
  const startCamera = useCallback(async (facing = "environment") => {
    stopCamera();
    setError("");
    try {
      const constraints = {
        video: {
          facingMode: { ideal: facing },
          width:  { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraFacing(facing);
      setStep("camera");
    } catch (e) {
      setError(`Camera access nahi mila: ${e.message}. File upload use karo.`);
      setStep("error");
    }
  }, []);

  // ── Stop camera ──────────────────────────────────────────
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  // ── Capture frame from video ─────────────────────────────
  const captureFrame = useCallback(() => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;

    // Full resolution capture
    canvas.width  = video.videoWidth  || 1280;
    canvas.height = video.videoHeight || 720;
    canvas.getContext("2d").drawImage(video, 0, 0);

    // Full-quality JPEG Base64 for police records
    const fullBase64 = canvas.toDataURL("image/jpeg", 0.92).split(",")[1];

    // Compressed thumbnail (320px) for display only
    const thumb = document.createElement("canvas");
    thumb.width = 320; thumb.height = Math.round(320 * canvas.height / canvas.width);
    thumb.getContext("2d").drawImage(canvas, 0, 0, thumb.width, thumb.height);
    const thumbDataUrl = thumb.toDataURL("image/jpeg", 0.7);

    return { fullBase64, thumbDataUrl };
  }, []);

  // ── File upload → Base64 ─────────────────────────────────
  const fileToBase64 = useCallback((file) => new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload  = e => {
      const dataUrl    = e.target.result;
      const base64Full = dataUrl.split(",")[1];
      // Compressed thumb
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width  = 320;
        c.height = Math.round(320 * img.height / img.width);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        res({ fullBase64:base64Full, thumbDataUrl:c.toDataURL("image/jpeg", 0.7) });
      };
      img.onerror = rej;
      img.src = dataUrl;
    };
    reader.onerror = rej;
    reader.readAsDataURL(file);
  }), []);

  // ── Core scan logic (shared by camera + file upload) ────
  const runScan = useCallback(async ({ fullBase64, thumbDataUrl }) => {
    stopCamera();
    setStep("scanning");
    setProgress(0);
    setError("");

    // Save images by side
    if (scanSide === "front") {
      setFrontThumb(thumbDataUrl);
      setBase64Front(fullBase64);
    } else {
      setBackThumb(thumbDataUrl);
      setBase64Back(fullBase64);
    }

    // Progress animation
    const prog = setInterval(() =>
      setProgress(p => p >= 88 ? 88 : p + Math.floor(Math.random() * 15) + 8), 280
    );

    try {
      const res  = await fetch("/api/groq", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          type:        "id_scan",
          imageBase64: fullBase64,
          bookingId,   // API will store Base64 in Supabase if bookingId present
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      clearInterval(prog);
      setProgress(100);

      if (!data.success) throw new Error(data.error || "Scan failed");

      const d = data.data || {};

      // Merge with previous extraction (back side may add missing fields)
      setExtracted(prev => {
        const merged = {
          guestName:     d.name        || prev.guestName     || "",
          dob:           d.dob
            ? d.dob.replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$3-$2-$1")
            : prev.dob || "",
          address:       d.address     || prev.address       || "",
          idType:        d.idType      || prev.idType        || "Aadhaar",
          idNumber:      d.idNumber    || prev.idNumber      || "",
          gender:        d.gender === "M" ? "Male"
                       : d.gender === "F" ? "Female"
                       : d.gender        || prev.gender      || "",
          fatherName:    d.fatherName  || prev.fatherName    || "",
          placeOfBirth:  d.placeOfBirth|| prev.placeOfBirth  || "",
          // id_image_base64: always the FRONT side scan (police requirement)
          idImageBase64: scanSide === "front"
            ? fullBase64
            : prev.idImageBase64 || fullBase64,
          idImageFront: scanSide === "front" ? thumbDataUrl : prev.idImageFront,
          idImageBack:  scanSide === "back"  ? thumbDataUrl : prev.idImageBack,
        };
        return merged;
      });

      setTimeout(() => setStep("done"), 350);

    } catch (e) {
      clearInterval(prog);
      setError(e.message || "Scan process fail ho gaya.");
      setStep("error");
    }
  }, [scanSide, bookingId, stopCamera]);

  // ── Camera capture handler ───────────────────────────────
  const handleCapture = useCallback(async () => {
    const result = captureFrame();
    if (!result) { setError("Frame capture failed."); setStep("error"); return; }
    await runScan(result);
  }, [captureFrame, runScan]);

  // ── File upload handler ──────────────────────────────────
  const handleFileUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Sirf image file allowed hai."); return; }
    try {
      const result = await fileToBase64(file);
      await runScan(result);
    } catch (e2) {
      setError("File read nahi hua: " + e2.message);
      setStep("error");
    }
  }, [fileToBase64, runScan]);

  // ── Confirm & fire onScanComplete ────────────────────────
  const handleConfirm = useCallback(() => {
    if (onScanComplete) onScanComplete({ ...extracted });
    if (onClose)        onClose();
  }, [extracted, onScanComplete, onClose]);

  // ── Reset ────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    stopCamera();
    setStep("idle"); setProgress(0); setError("");
    setExtracted(EMPTY_SCHEMA);
    setFrontThumb(null); setBackThumb(null);
    setBase64Front(null); setBase64Back(null);
    setScanSide("front");
  }, [stopCamera]);

  // ── Styles ───────────────────────────────────────────────
  const S = {
    container: {
      background: compact ? "transparent" : "rgba(0,8,20,0.97)",
      border:     compact ? "none" : "1px solid rgba(0,140,255,0.2)",
      borderRadius: 20,
      overflow: "hidden",
      position: "relative",
      fontFamily: "system-ui,-apple-system,sans-serif",
    },
    header: {
      padding: "14px 16px",
      borderBottom: "1px solid rgba(0,140,255,0.12)",
      background: "rgba(0,18,45,0.6)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    },
    body: { padding: "16px" },
    label: {
      display: "block", fontSize: 9, fontWeight: 700,
      color: "rgba(255,255,255,0.3)", letterSpacing: "0.12em",
      textTransform: "uppercase", marginBottom: 4,
    },
    inp: {
      width: "100%", background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
      padding: "9px 12px", fontSize: 12, color: "#fff",
      outline: "none", boxSizing: "border-box", colorScheme: "dark",
    },
    btn: (bg, color = "#fff", border = "none") => ({
      padding: "10px 14px", borderRadius: 10, border,
      background: bg, color, fontSize: 12, fontWeight: 700,
      cursor: "pointer", display: "flex", alignItems: "center",
      justifyContent: "center", gap: 6,
    }),
  };

  const gridTwo = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 };

  return (
    <div style={S.container}>
      <style>{`
        @keyframes scanLine { 0%{top:5%} 100%{top:90%} }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes spin     { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>

      {/* HEADER */}
      <div style={S.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width:32, height:32, borderRadius:8, background:"rgba(0,140,255,0.12)", border:"1px solid rgba(0,140,255,0.25)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Camera size={15} style={{ color:"#60b8ff" }} />
          </div>
          <div>
            <p style={{ fontSize:12, fontWeight:800, color:"#60b8ff" }}>AI ID Scanner</p>
            <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)" }}>Aadhaar • PAN • Passport • DL</p>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {/* Side toggle */}
          {(step === "idle" || step === "done") && (
            <div style={{ display:"flex", background:"rgba(255,255,255,0.04)", borderRadius:8, overflow:"hidden", border:"1px solid rgba(255,255,255,0.08)" }}>
              {["front","back"].map(s => (
                <button key={s} onClick={() => { setScanSide(s); if(step==="done") setStep("idle"); }}
                  style={{ padding:"5px 10px", background:scanSide===s?"rgba(0,140,255,0.2)":"transparent", border:"none", color:scanSide===s?"#60b8ff":"rgba(255,255,255,0.3)", fontSize:10, fontWeight:700, cursor:"pointer", textTransform:"capitalize" }}>
                  {s}
                </button>
              ))}
            </div>
          )}
          {onClose && (
            <button onClick={() => { stopCamera(); onClose(); }}
              style={{ width:28, height:28, borderRadius:6, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.4)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      <div style={S.body}>

        {/* ── IDLE ── */}
        {step === "idle" && (
          <div style={{ animation:"fadeUp 0.3s ease" }}>
            <div style={{ textAlign:"center", padding:"20px 0 16px" }}>
              <div style={{ width:64, height:64, borderRadius:"50%", background:"rgba(0,140,255,0.08)", border:"1px solid rgba(0,140,255,0.2)", margin:"0 auto 12px", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Camera size={26} style={{ color:"#60b8ff" }} />
              </div>
              <p style={{ fontSize:13, fontWeight:700, color:"#fff", marginBottom:4 }}>
                {scanSide === "front" ? "ID Ka Front Side Scan Karo" : "ID Ka Back Side Scan Karo"}
              </p>
              <p style={{ fontSize:11, color:"rgba(255,255,255,0.35)", lineHeight:1.5 }}>
                Camera se scan karo ya file upload karo.<br/>
                Base64 image DB mein save hogi (police records compliance).
              </p>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <button onClick={() => startCamera("environment")} style={S.btn("linear-gradient(135deg,#0050c8,#0080ff)")}>
                <Camera size={14} /> Camera Se Scan Karo
              </button>
              <button onClick={() => fileRef.current?.click()} style={S.btn("rgba(255,255,255,0.05)","rgba(255,255,255,0.7)","1px solid rgba(255,255,255,0.1)")}>
                <Upload size={14} /> File Upload Karo
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFileUpload} style={{ display:"none" }} />
            </div>
            {/* Side guidance */}
            <div style={{ marginTop:12, padding:"10px 12px", borderRadius:10, background:"rgba(0,140,255,0.04)", border:"1px solid rgba(0,140,255,0.1)" }}>
              <p style={{ fontSize:10, color:"rgba(0,140,255,0.6)", lineHeight:1.6 }}>
                {scanSide === "front"
                  ? "📋 Front scan se: Naam, DOB, Address, ID Number, Gender automatically fill hoga."
                  : "📋 Back scan se: Father's name, Address (Aadhaar), Place of Birth (Passport) fill hoga."}
              </p>
            </div>
          </div>
        )}

        {/* ── CAMERA LIVE VIEW ── */}
        {step === "camera" && (
          <div style={{ animation:"fadeUp 0.25s ease" }}>
            {/* Video frame */}
            <div style={{ position:"relative", borderRadius:14, overflow:"hidden", background:"#000", marginBottom:12, border:"1px solid rgba(0,140,255,0.3)" }}>
              <video ref={videoRef} autoPlay playsInline muted
                style={{ width:"100%", maxHeight:240, objectFit:"cover", display:"block" }} />
              <canvas ref={canvasRef} style={{ display:"none" }} />

              {/* Corner brackets */}
              {["tl","tr","bl","br"].map(pos => (
                <div key={pos} style={{
                  position:"absolute", width:22, height:22,
                  top:    pos.includes("t") ? 10 : "auto",
                  bottom: pos.includes("b") ? 10 : "auto",
                  left:   pos.includes("l") ? 10 : "auto",
                  right:  pos.includes("r") ? 10 : "auto",
                  borderTop:    pos.includes("t") ? "2px solid #60b8ff" : "none",
                  borderBottom: pos.includes("b") ? "2px solid #60b8ff" : "none",
                  borderLeft:   pos.includes("l") ? "2px solid #60b8ff" : "none",
                  borderRight:  pos.includes("r") ? "2px solid #60b8ff" : "none",
                }} />
              ))}

              {/* Scan line animation */}
              <div style={{
                position:"absolute", left:"5%", right:"5%", height:2,
                background:"linear-gradient(90deg,transparent,rgba(0,140,255,0.8),transparent)",
                animation:"scanLine 2s ease-in-out infinite alternate",
                pointerEvents:"none",
              }} />

              {/* Instructions overlay */}
              <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"8px 12px", background:"linear-gradient(transparent,rgba(0,0,0,0.85))" }}>
                <p style={{ fontSize:10, color:"#60b8ff", textAlign:"center", fontWeight:600, animation:"pulse 2s ease-in-out infinite" }}>
                  ID ko frame ke andar rakho — ache light mein
                </p>
              </div>
            </div>

            {/* Camera controls */}
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={handleCapture}
                style={{ ...S.btn("linear-gradient(135deg,#0050c8,#0080ff)"), flex:1, padding:"12px" }}>
                <Camera size={15} /> Scan Karo
              </button>
              <button onClick={() => startCamera(cameraFacing === "environment" ? "user" : "environment")}
                style={{ ...S.btn("rgba(255,255,255,0.06)","rgba(255,255,255,0.5)","1px solid rgba(255,255,255,0.1)"), width:44, padding:"12px 0" }}
                title="Camera flip">
                🔄
              </button>
              <button onClick={() => { stopCamera(); setStep("idle"); }}
                style={{ ...S.btn("rgba(239,68,68,0.08)","#ef4444","1px solid rgba(239,68,68,0.2)"), width:44, padding:"12px 0" }}>
                <X size={14} />
              </button>
            </div>
            <button onClick={() => { stopCamera(); fileRef.current?.click(); }}
              style={{ ...S.btn("rgba(255,255,255,0.03)","rgba(255,255,255,0.35)","1px solid rgba(255,255,255,0.07)"), width:"100%", marginTop:6, fontSize:11 }}>
              <Upload size={11} /> File Upload Use Karo
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileUpload} style={{ display:"none" }} />
          </div>
        )}

        {/* ── SCANNING ── */}
        {step === "scanning" && (
          <div style={{ animation:"fadeUp 0.3s ease", textAlign:"center", padding:"20px 0" }}>
            <div style={{ width:64, height:64, borderRadius:"50%", margin:"0 auto 14px", border:"2px solid rgba(0,140,255,0.2)", borderTop:"2px solid #008cff", animation:"spin 0.9s linear infinite" }} />
            <p style={{ fontSize:14, fontWeight:800, color:"#60b8ff", marginBottom:6 }}>AI Scan Ho Raha Hai...</p>
            <p style={{ fontSize:10, color:"rgba(255,255,255,0.35)", marginBottom:16 }}>
              {scanSide === "front"
                ? "Naam, DOB, ID Number extract kiya ja raha hai..."
                : "Back side process ho raha hai..."}
            </p>
            <div style={{ height:5, background:"rgba(0,140,255,0.1)", borderRadius:5, overflow:"hidden", maxWidth:220, margin:"0 auto" }}>
              <div style={{ height:"100%", width:`${progress}%`, background:"linear-gradient(90deg,#008cff,#60b8ff)", borderRadius:5, transition:"width 0.35s ease" }} />
            </div>
            <p style={{ fontSize:9, color:"rgba(0,140,255,0.45)", marginTop:8 }}>
              Base64 ID image police compliance ke liye save ho rahi hai...
            </p>
          </div>
        )}

        {/* ── DONE ── */}
        {step === "done" && (
          <div style={{ animation:"fadeUp 0.3s ease" }}>
            {/* Success banner */}
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px", borderRadius:12, background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.25)", marginBottom:14 }}>
              <CheckCircle size={18} style={{ color:"#22c55e", flexShrink:0 }} />
              <div>
                <p style={{ fontSize:12, fontWeight:800, color:"#22c55e" }}>ID Scan Successful ✓</p>
                <p style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>
                  {scanSide === "front" ? "Front" : "Back"} scan done · Base64 saved{bookingId ? " in DB" : " locally"}
                </p>
              </div>
            </div>

            {/* Thumbnails */}
            <div style={{ display:"flex", gap:8, marginBottom:14 }}>
              {frontThumb && (
                <div style={{ flex:1 }}>
                  <p style={{ ...S.label, textAlign:"center" }}>Front</p>
                  <div style={{ position:"relative", cursor:"pointer" }} onClick={() => setPreviewImg(frontThumb)}>
                    <img src={frontThumb} alt="ID Front" style={{ width:"100%", height:70, objectFit:"cover", borderRadius:8, border:"1px solid rgba(34,197,94,0.3)" }} />
                    <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,0)", borderRadius:8, transition:"background 0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.3)"}
                      onMouseLeave={e => e.currentTarget.style.background = "rgba(0,0,0,0)"}>
                      <ZoomIn size={16} style={{ color:"#fff", opacity:0.7 }} />
                    </div>
                  </div>
                </div>
              )}
              {backThumb && (
                <div style={{ flex:1 }}>
                  <p style={{ ...S.label, textAlign:"center" }}>Back</p>
                  <div style={{ position:"relative", cursor:"pointer" }} onClick={() => setPreviewImg(backThumb)}>
                    <img src={backThumb} alt="ID Back" style={{ width:"100%", height:70, objectFit:"cover", borderRadius:8, border:"1px solid rgba(212,175,55,0.3)" }} />
                    <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,0)", borderRadius:8, transition:"background 0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.3)"}
                      onMouseLeave={e => e.currentTarget.style.background = "rgba(0,0,0,0)"}>
                      <ZoomIn size={16} style={{ color:"#fff", opacity:0.7 }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Extracted fields — editable */}
            <p style={{ ...S.label, marginBottom:10 }}>Extracted Fields (Edit if needed)</p>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <div style={gridTwo}>
                <div>
                  <label style={S.label}>Guest Name</label>
                  <input style={S.inp} value={extracted.guestName} onChange={e => setExtracted(p => ({...p, guestName:e.target.value}))} placeholder="Full Name" />
                </div>
                <div>
                  <label style={S.label}>Date of Birth</label>
                  <input type="date" style={S.inp} value={extracted.dob} onChange={e => setExtracted(p => ({...p, dob:e.target.value}))} />
                </div>
              </div>
              <div style={gridTwo}>
                <div>
                  <label style={S.label}>ID Type</label>
                  <select style={S.inp} value={extracted.idType} onChange={e => setExtracted(p => ({...p, idType:e.target.value}))}>
                    {["Aadhaar","PAN","Passport","Driving License","Voter ID"].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label}>ID Number</label>
                  <input style={S.inp} value={extracted.idNumber} onChange={e => setExtracted(p => ({...p, idNumber:e.target.value}))} placeholder="XXXX XXXX XXXX" />
                </div>
              </div>
              <div style={gridTwo}>
                <div>
                  <label style={S.label}>Gender</label>
                  <select style={S.inp} value={extracted.gender} onChange={e => setExtracted(p => ({...p, gender:e.target.value}))}>
                    <option value="">Select</option><option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
                <div>
                  <label style={S.label}>Father's Name</label>
                  <input style={S.inp} value={extracted.fatherName} onChange={e => setExtracted(p => ({...p, fatherName:e.target.value}))} placeholder="Father's name" />
                </div>
              </div>
              <div>
                <label style={S.label}>Address</label>
                <textarea rows={2} style={{ ...S.inp, resize:"none", lineHeight:1.5 }}
                  value={extracted.address} onChange={e => setExtracted(p => ({...p, address:e.target.value}))}
                  placeholder="Full address..." />
              </div>
            </div>

            {/* DB storage indicator */}
            <div style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 10px", borderRadius:8, background:"rgba(34,197,94,0.04)", border:"1px solid rgba(34,197,94,0.12)", marginTop:10, marginBottom:12 }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:"#22c55e", flexShrink:0 }} />
              <p style={{ fontSize:9, color:"rgba(34,197,94,0.7)", lineHeight:1.4 }}>
                id_image_base64 {bookingId ? `Supabase booking record (#${bookingId?.slice(-6)}) mein save ho gayi` : "booking object mein save hogi when submitted"} — police records compliance ✓
              </p>
            </div>

            {/* Back side prompt */}
            {!backThumb && scanSide === "front" && (
              <button onClick={() => { setScanSide("back"); setStep("idle"); }}
                style={{ ...S.btn("rgba(212,175,55,0.08)","#D4AF37","1px solid rgba(212,175,55,0.25)"), width:"100%", marginBottom:8 }}>
                📷 Back Side Bhi Scan Karo (Recommended)
              </button>
            )}

            {/* Action buttons */}
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={handleConfirm}
                style={{ ...S.btn("linear-gradient(135deg,#b8960c,#D4AF37,#F5C842)","#000"), flex:1 }}>
                <CheckCircle size={14} /> Form Mein Apply Karo ✓
              </button>
              <button onClick={handleReset}
                style={{ ...S.btn("rgba(255,255,255,0.05)","rgba(255,255,255,0.5)","1px solid rgba(255,255,255,0.1)"), padding:"10px 14px" }}>
                <RefreshCw size={13} />
              </button>
            </div>
          </div>
        )}

        {/* ── ERROR ── */}
        {step === "error" && (
          <div style={{ animation:"fadeUp 0.3s ease", textAlign:"center", padding:"16px 0" }}>
            <div style={{ fontSize:36, marginBottom:12 }}>⚠️</div>
            <p style={{ fontSize:13, fontWeight:700, color:"#ef4444", marginBottom:6 }}>Scan Nahi Hua</p>
            <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", lineHeight:1.5, marginBottom:16, maxWidth:260, margin:"0 auto 16px" }}>{error}</p>
            <div style={{ display:"flex", gap:8, justifyContent:"center" }}>
              <button onClick={() => startCamera()} style={S.btn("rgba(0,140,255,0.12)","#60b8ff","1px solid rgba(0,140,255,0.3)")}>
                <Camera size={13} /> Dobara Try Karo
              </button>
              <button onClick={() => { fileRef.current?.click(); setStep("idle"); }}
                style={S.btn("rgba(255,255,255,0.05)","rgba(255,255,255,0.5)","1px solid rgba(255,255,255,0.1)")}>
                <Upload size={13} /> File Upload
              </button>
              <button onClick={handleReset}
                style={S.btn("rgba(255,255,255,0.04)","rgba(255,255,255,0.3)","1px solid rgba(255,255,255,0.08)")}>
                Skip
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileUpload} style={{ display:"none" }} />
          </div>
        )}
      </div>

      {/* IMAGE PREVIEW MODAL */}
      {previewImg && (
        <div onClick={() => setPreviewImg(null)} style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(0,0,0,0.92)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <img src={previewImg} alt="ID Preview" style={{ maxWidth:"100%", maxHeight:"80vh", borderRadius:12, border:"1px solid rgba(255,255,255,0.1)" }} />
          <button onClick={() => setPreviewImg(null)} style={{ position:"absolute", top:20, right:20, width:36, height:36, borderRadius:8, background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.2)", color:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
