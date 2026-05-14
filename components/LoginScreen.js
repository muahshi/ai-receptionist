"use client";
import { useState } from "react";

export default function LoginScreen({ onLogin }) {
  const [role, setRole]       = useState("manager");
  const [pin, setPin]         = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const hotelName = process.env.NEXT_PUBLIC_HOTEL_NAME || "The GuestInn";

  const handleLogin = async () => {
    if (pin.length < 4) return;
    setLoading(true); setError("");
    await new Promise(r => setTimeout(r, 500));
    const validPin = role === "owner"
      ? (process.env.NEXT_PUBLIC_OWNER_PIN   || "1234")
      : (process.env.NEXT_PUBLIC_MANAGER_PIN || "5678");
    if (pin === validPin) {
      const u = { role, loginAt: new Date().toISOString() };
      localStorage.setItem("air_current_user", JSON.stringify(u));
      if (navigator.vibrate) navigator.vibrate([50,30,50]);
      onLogin(u);
    } else {
      setError("Galat PIN! Dobara try karo.");
      if (navigator.vibrate) navigator.vibrate([100,50,100]);
      setPin("");
    }
    setLoading(false);
  };

  const addDigit  = d => pin.length < 4 && setPin(p => p + d);
  const delDigit  = ()  => setPin(p => p.slice(0,-1));

  return (
    <div className="flex flex-col items-center justify-center px-6 safe-top safe-bottom"
      style={{ height:"100dvh", background:"#0A0A0A" }}>

      {/* Logo */}
      <div className="mb-8 text-center fade-up">
        <div className="w-20 h-20 rounded-3xl mx-auto mb-4 flex items-center justify-center text-4xl"
          style={{ background:"linear-gradient(135deg,#1a1200,#2a1f00)", border:"1px solid rgba(212,175,55,0.3)", boxShadow:"0 0 30px rgba(212,175,55,0.15)" }}>
          🏨
        </div>
        <h1 className="font-black text-3xl" style={{ color:"#D4AF37", letterSpacing:"-0.02em" }}>{hotelName}</h1>
        <p className="text-gray-600 text-xs mt-1 tracking-widest uppercase">AI-Powered Hotel Management</p>
      </div>

      {/* Role Toggle */}
      <div className="w-full max-w-xs card p-1 rounded-2xl flex mb-6 fade-up">
        {["manager","owner"].map(r => (
          <button key={r} onClick={() => { setRole(r); setPin(""); setError(""); }}
            className="flex-1 py-3 rounded-xl text-sm font-bold transition-all capitalize"
            style={role === r
              ? { background:"linear-gradient(135deg,#b8960c,#D4AF37,#F5C842)", color:"#000" }
              : { color:"#555" }}>
            {r === "owner" ? "👑 Owner" : "🔑 Manager"}
          </button>
        ))}
      </div>

      {/* PIN dots */}
      <div className="w-full max-w-xs card rounded-2xl p-4 mb-4 fade-up">
        <p className="text-gray-600 text-xs text-center uppercase tracking-widest mb-3">Enter PIN</p>
        <div className="flex justify-center gap-4">
          {[0,1,2,3].map(i => (
            <div key={i} className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all"
              style={i < pin.length
                ? { background:"rgba(212,175,55,0.2)", border:"2px solid #D4AF37" }
                : { background:"rgba(255,255,255,0.04)", border:"2px solid rgba(255,255,255,0.1)" }}>
              {i < pin.length && <div className="w-3 h-3 rounded-full" style={{ background:"#D4AF37" }} />}
            </div>
          ))}
        </div>
        {error && <p className="text-red-400 text-xs text-center mt-3 fade-up">{error}</p>}
      </div>

      {/* Keypad */}
      <div className="w-full max-w-xs grid grid-cols-3 gap-3 fade-up">
        {[1,2,3,4,5,6,7,8,9].map(d => (
          <button key={d} onClick={() => addDigit(String(d))}
            className="card py-4 rounded-2xl text-xl font-bold text-white active:scale-90 transition-all active:bg-white/10">
            {d}
          </button>
        ))}
        <button onClick={delDigit}
          className="card py-4 rounded-2xl text-gray-500 text-xl active:scale-90 transition-all flex items-center justify-center">
          ⌫
        </button>
        <button onClick={() => addDigit("0")}
          className="card py-4 rounded-2xl text-xl font-bold text-white active:scale-90 transition-all active:bg-white/10">
          0
        </button>
        <button onClick={handleLogin} disabled={pin.length < 4 || loading}
          className="py-4 rounded-2xl font-bold text-sm flex items-center justify-center transition-all"
          style={pin.length >= 4 && !loading
            ? { background:"linear-gradient(135deg,#b8960c,#D4AF37,#F5C842)", color:"#000", boxShadow:"0 4px 20px rgba(212,175,55,0.35)" }
            : { background:"rgba(255,255,255,0.06)", color:"#444" }}>
          {loading
            ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"/>
            : "Login"}
        </button>
      </div>

      <p className="text-gray-800 text-xs mt-8">The GuestInn AI v2.0 • Powered by Groq</p>
    </div>
  );
}
