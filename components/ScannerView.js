"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Camera, X, Check, Lock, ChevronLeft, Loader,
  User, Phone, MapPin, CreditCard, Calendar, Moon
} from "lucide-react";
import { createBooking, getRooms, getHotelConfig } from "../lib/db";
import { sendBookingAlerts } from "../lib/alerts";

const STEPS = { CAMERA: "camera", FORM: "form", RATE: "rate", SUCCESS: "success" };

export default function ScannerView({ user, onSuccess, onBack }) {
  const [step, setStep] = useState(STEPS.CAMERA);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [extractedData, setExtractedData] = useState({});
  const [formData, setFormData] = useState({
    guestName: "", guestPhone: "", address: "",
    idType: "Aadhaar", idNumber: "", gender: "",
    roomId: "", checkInDate: new Date().toISOString().split("T")[0],
    checkOutDate: "", nights: 1, ratePerNight: 1500,
    totalAmount: 1500, paymentMode: "Cash",
  });
  const [rateLocked, setRateLocked] = useState(false);
  const [lockAnimating, setLockAnimating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [vacantRooms, setVacantRooms] = useState([]);
  const [cameraError, setCameraError] = useState("");

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    const rooms = getRooms().filter((r) => r.status === "vacant");
    setVacantRooms(rooms);

    return () => stopCamera();
  }, []);

  useEffect(() => {
    if (step === STEPS.CAMERA) startCamera();
    else stopCamera();
  }, [step]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraError("");
    } catch (err) {
      setCameraError("Camera access denied. Manually form fill karo.");
      setStep(STEPS.FORM);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const captureAndScan = async () => {
    if (!videoRef.current || scanning) return;

    setScanning(true);
    setScanProgress(0);
    if (navigator.vibrate) navigator.vibrate(30);

    // Animate scan progress
    const progressInterval = setInterval(() => {
      setScanProgress((p) => {
        if (p >= 90) { clearInterval(progressInterval); return 90; }
        return p + Math.random() * 15;
      });
    }, 200);

    try {
      // Capture frame
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      ctx.drawImage(videoRef.current, 0, 0);

      // Convert to base64
      const base64 = canvas.toDataURL("image/jpeg", 0.85).split(",")[1];

      // Send to Groq AI
      const res = await fetch("/api/groq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, type: "id_scan" }),
      });

      const data = await res.json();
      clearInterval(progressInterval);
      setScanProgress(100);

      if (data.success && data.data) {
        const extracted = data.data;
        setExtractedData(extracted);
        setFormData((prev) => ({
          ...prev,
          guestName: extracted.name || "",
          address: extracted.address || "",
          idNumber: extracted.idNumber || "",
          idType: extracted.idType || "Aadhaar",
          gender: extracted.gender || "",
        }));
        if (navigator.vibrate) navigator.vibrate([50, 30, 100]);
      }

      setTimeout(() => {
        setStep(STEPS.FORM);
        setScanning(false);
      }, 500);
    } catch (err) {
      clearInterval(progressInterval);
      setScanning(false);
      setScanProgress(0);
      // Still proceed to form
      setStep(STEPS.FORM);
    }
  };

  const updateForm = (key, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [key]: value };

      // Auto-calculate nights and total
      if (key === "checkInDate" || key === "checkOutDate") {
        if (updated.checkInDate && updated.checkOutDate) {
          const nights = Math.max(
            1,
            Math.ceil(
              (new Date(updated.checkOutDate) - new Date(updated.checkInDate)) /
              (1000 * 60 * 60 * 24)
            )
          );
          updated.nights = nights;
          updated.totalAmount = nights * updated.ratePerNight;
        }
      }

      if (key === "ratePerNight" || key === "nights") {
        updated.totalAmount = updated.nights * updated.ratePerNight;
      }

      return updated;
    });
  };

  const lockRate = () => {
    if (rateLocked) return;
    setLockAnimating(true);
    if (navigator.vibrate) navigator.vibrate([30, 20, 30, 20, 100]);
    setTimeout(() => {
      setRateLocked(true);
      setLockAnimating(false);
    }, 800);
  };

  const handleSubmit = async () => {
    if (!formData.roomId || !formData.guestName || !rateLocked) return;

    setSubmitting(true);
    if (navigator.vibrate) navigator.vibrate([50, 30, 50, 30, 200]);

    try {
      const booking = createBooking({
        ...formData,
        status: "active",
        roomType:
          vacantRooms.find((r) => r.id === formData.roomId)?.type || "standard",
      });

      // Fire triple alerts
      sendBookingAlerts(booking).catch(console.error);

      setStep(STEPS.SUCCESS);

      setTimeout(() => {
        onSuccess();
      }, 2500);
    } catch (err) {
      console.error("Booking failed:", err);
    }

    setSubmitting(false);
  };

  // ── CAMERA STEP ────────────────────────────────────────────────────────────
  if (step === STEPS.CAMERA) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-3 mb-3 flex-shrink-0">
          <button onClick={onBack} className="p-2 glass-card rounded-xl">
            <ChevronLeft size={18} className="text-gray-400" />
          </button>
          <h2 className="font-display text-gold-400 text-xl">ID Scan Karo</h2>
        </div>

        <div className="flex-1 relative rounded-2xl overflow-hidden scan-frame">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />

          {/* Corner Markers */}
          <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-gold-400 rounded-tl-lg" />
          <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-gold-400 rounded-tr-lg" />
          <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-gold-400 rounded-bl-lg" />
          <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-gold-400 rounded-br-lg" />

          {/* Scan Line */}
          {scanning && <div className="scan-line" />}

          {/* Overlay Text */}
          {!scanning && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black/50 backdrop-blur-sm rounded-2xl px-5 py-3 text-center">
                <p className="text-gold-400 text-sm font-semibold">Aadhaar / Passport</p>
                <p className="text-gray-400 text-xs mt-1">Frame mein rakhke scan karo</p>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {scanning && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
              <div
                className="h-full bg-gold-400 transition-all duration-300"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        <div className="flex-shrink-0 mt-3 space-y-2">
          <button
            onClick={captureAndScan}
            disabled={scanning}
            className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-200 ${
              scanning ? "bg-gold-500/30 text-gold-600" : "btn-gold"
            }`}
          >
            {scanning ? (
              <>
                <Loader size={20} className="animate-spin" />
                AI Scan Kar Raha Hai...
              </>
            ) : (
              <>
                <Camera size={20} />
                ID Scan Karo
              </>
            )}
          </button>

          <button
            onClick={() => setStep(STEPS.FORM)}
            className="w-full py-3 rounded-2xl glass-card text-gray-400 text-sm"
          >
            Skip — Manual Fill Karo
          </button>
        </div>
      </div>
    );
  }

  // ── SUCCESS STEP ───────────────────────────────────────────────────────────
  if (step === STEPS.SUCCESS) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-6">
        <div className="w-24 h-24 rounded-3xl glass-card-gold flex items-center justify-center mb-6 lock-seal">
          <span className="text-5xl">✅</span>
        </div>
        <h2 className="font-display text-3xl text-gold-400 mb-2">Check-in Ho Gaya!</h2>
        <p className="text-gray-400 text-sm mb-1">{formData.guestName}</p>
        <p className="text-gray-500 text-xs mb-4">Room {formData.roomId}</p>
        <div className="glass-card-gold rounded-2xl px-6 py-3 text-center">
          <p className="text-gray-400 text-xs">Total Amount</p>
          <p className="text-gold-400 font-bold text-2xl">
            ₹{formData.totalAmount.toLocaleString("en-IN")}
          </p>
        </div>
        <p className="text-gray-600 text-xs mt-4">
          3 WhatsApp alerts bhej diye gaye hain 📱
        </p>
      </div>
    );
  }

  // ── FORM STEP ──────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 mb-3 flex-shrink-0">
        <button onClick={() => setStep(STEPS.CAMERA)} className="p-2 glass-card rounded-xl">
          <ChevronLeft size={18} className="text-gray-400" />
        </button>
        <h2 className="font-display text-gold-400 text-xl">Check-in Details</h2>
        {Object.keys(extractedData).length > 0 && (
          <span className="ml-auto text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
            AI ✓ Filled
          </span>
        )}
      </div>

      <div className="flex-1 scroll-area space-y-3 pb-4">
        {/* Guest Info */}
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <p className="text-gray-500 text-xs uppercase tracking-widest">Guest Info</p>

          <FormField
            icon={<User size={14} />}
            label="Naam"
            value={formData.guestName}
            onChange={(v) => updateForm("guestName", v)}
            placeholder="Guest ka naam"
          />
          <FormField
            icon={<Phone size={14} />}
            label="Phone"
            value={formData.guestPhone}
            onChange={(v) => updateForm("guestPhone", v)}
            placeholder="+91 9999999999"
            type="tel"
          />
          <FormField
            icon={<MapPin size={14} />}
            label="Address"
            value={formData.address}
            onChange={(v) => updateForm("address", v)}
            placeholder="Guest ka address"
          />
        </div>

        {/* ID Details */}
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <p className="text-gray-500 text-xs uppercase tracking-widest">ID Details</p>

          <div>
            <label className="text-gray-500 text-xs mb-1.5 block">ID Type</label>
            <div className="grid grid-cols-3 gap-1.5">
              {["Aadhaar", "Passport", "Driving License"].map((t) => (
                <button
                  key={t}
                  onClick={() => updateForm("idType", t)}
                  className={`py-2 rounded-xl text-xs font-medium transition-all ${
                    formData.idType === t
                      ? "btn-gold"
                      : "glass-card text-gray-400"
                  }`}
                >
                  {t === "Driving License" ? "DL" : t}
                </button>
              ))}
            </div>
          </div>

          <FormField
            icon={<CreditCard size={14} />}
            label="ID Number"
            value={formData.idNumber}
            onChange={(v) => updateForm("idNumber", v)}
            placeholder="ID ka number"
          />
        </div>

        {/* Room & Dates */}
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <p className="text-gray-500 text-xs uppercase tracking-widest">Room & Dates</p>

          <div>
            <label className="text-gray-500 text-xs mb-1.5 block">Room Select Karo</label>
            <div className="grid grid-cols-4 gap-1.5 max-h-24 scroll-area">
              {vacantRooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => updateForm("roomId", room.id)}
                  className={`py-2.5 rounded-xl text-xs font-mono font-semibold transition-all ${
                    formData.roomId === room.id
                      ? "btn-gold"
                      : "glass-card text-gray-300 room-vacant border"
                  }`}
                >
                  {room.number}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-gray-500 text-xs mb-1 block">Check-in</label>
              <input
                type="date"
                value={formData.checkInDate}
                onChange={(e) => updateForm("checkInDate", e.target.value)}
                className="input-glass w-full px-3 py-2.5 text-sm"
                style={{ colorScheme: "dark" }}
              />
            </div>
            <div>
              <label className="text-gray-500 text-xs mb-1 block">Check-out</label>
              <input
                type="date"
                value={formData.checkOutDate}
                onChange={(e) => updateForm("checkOutDate", e.target.value)}
                className="input-glass w-full px-3 py-2.5 text-sm"
                style={{ colorScheme: "dark" }}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-gray-500 text-xs mb-1 block">
                <Moon size={10} className="inline mr-1" />
                Nights: {formData.nights}
              </label>
            </div>
          </div>
        </div>

        {/* Rate Lock Section — ANTI-THEFT */}
        <div className={`rounded-2xl p-4 space-y-3 ${rateLocked ? "glass-card-gold" : "glass-card"}`}>
          <div className="flex items-center justify-between">
            <p className="text-gray-400 text-xs uppercase tracking-widest font-semibold">
              💰 Rate Tay Karo
            </p>
            {rateLocked && (
              <span className="text-xs bg-gold-500/20 text-gold-400 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                <Lock size={10} /> Locked
              </span>
            )}
          </div>

          {/* Rate Slider */}
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>₹500</span>
              <span className="text-gold-400 font-bold text-base">
                ₹{formData.ratePerNight.toLocaleString("en-IN")}/night
              </span>
              <span>₹10,000</span>
            </div>
            <input
              type="range"
              min="500"
              max="10000"
              step="100"
              value={formData.ratePerNight}
              disabled={rateLocked}
              onChange={(e) => updateForm("ratePerNight", Number(e.target.value))}
              className="w-full accent-yellow-500 disabled:opacity-50"
            />
          </div>

          {/* Payment Mode */}
          <div>
            <label className="text-gray-500 text-xs mb-1.5 block">Payment Mode</label>
            <div className="grid grid-cols-3 gap-1.5">
              {["Cash", "UPI", "Card"].map((m) => (
                <button
                  key={m}
                  onClick={() => !rateLocked && updateForm("paymentMode", m)}
                  disabled={rateLocked}
                  className={`py-2 rounded-xl text-xs font-medium transition-all ${
                    formData.paymentMode === m
                      ? rateLocked
                        ? "btn-gold opacity-80"
                        : "btn-gold"
                      : "glass-card text-gray-400"
                  }`}
                >
                  {m === "Cash" ? "💵 Cash" : m === "UPI" ? "📱 UPI" : "💳 Card"}
                </button>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center py-2 border-t border-white/10">
            <span className="text-gray-400 text-sm">Total Amount</span>
            <span className="text-white font-bold text-xl">
              ₹{formData.totalAmount.toLocaleString("en-IN")}
            </span>
          </div>

          {/* Lock Button */}
          {!rateLocked ? (
            <button
              onClick={lockRate}
              disabled={lockAnimating}
              className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                lockAnimating ? "glass-card text-gold-400" : "btn-gold"
              }`}
            >
              {lockAnimating ? (
                <>
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Rate Lock Ho Raha Hai...
                </>
              ) : (
                <>
                  <Lock size={16} />
                  Rate Lock Karo ✓
                </>
              )}
            </button>
          ) : (
            <div className="w-full py-3 rounded-xl glass-card-gold border border-gold-500/40 text-center">
              <p className="text-gold-400 text-sm font-bold flex items-center justify-center gap-2">
                🔐 Rate Permanently Locked
              </p>
              <p className="text-gray-500 text-xs mt-0.5">Ab ye change nahi ho sakta</p>
            </div>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex-shrink-0 pt-2">
        <button
          onClick={handleSubmit}
          disabled={
            !formData.roomId || !formData.guestName || !rateLocked || submitting
          }
          className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-200 ${
            formData.roomId && formData.guestName && rateLocked && !submitting
              ? "btn-gold"
              : "glass-card text-gray-600"
          }`}
        >
          {submitting ? (
            <>
              <Loader size={20} className="animate-spin" />
              Check-in Ho Raha Hai...
            </>
          ) : (
            <>
              <Check size={20} />
              Guest Check-in Karo ✓
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function FormField({ icon, label, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      <label className="text-gray-500 text-xs mb-1 flex items-center gap-1">
        <span className="text-gray-600">{icon}</span>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-glass w-full px-3 py-2.5 text-sm"
      />
    </div>
  );
}
