"use client";

import { useState } from "react";
import { Eye, EyeOff, Hotel, Shield } from "lucide-react";

export default function LoginScreen({ onLogin }) {
  const [role, setRole] = useState("manager");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!pin) return;
    setLoading(true);
    setError("");

    await new Promise((r) => setTimeout(r, 600)); // Simulate auth

    const validPin =
      role === "owner"
        ? process.env.NEXT_PUBLIC_OWNER_PIN || "1234"
        : process.env.NEXT_PUBLIC_MANAGER_PIN || "5678";

    if (pin === validPin) {
      const user = { role, loginAt: new Date().toISOString() };
      localStorage.setItem("air_current_user", JSON.stringify(user));
      if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
      onLogin(user);
    } else {
      setError("Galat PIN hai! Dobara try karo.");
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      setPin("");
    }
    setLoading(false);
  };

  const addDigit = (d) => {
    if (pin.length < 6) setPin((p) => p + d);
  };

  const removeDigit = () => setPin((p) => p.slice(0, -1));

  return (
    <div
      className="h-full flex flex-col items-center justify-center px-6"
      style={{ height: "100dvh" }}
    >
      {/* Logo */}
      <div className="mb-8 text-center fade-in">
        <div className="w-20 h-20 rounded-3xl glass-card-gold flex items-center justify-center mx-auto mb-4">
          <Hotel size={40} className="text-gold-500" />
        </div>
        <h1 className="font-display text-3xl text-gold-500 gold-glow">
          AI Receptionist
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {process.env.NEXT_PUBLIC_HOTEL_NAME || "Smart Hotel Management"}
        </p>
      </div>

      {/* Role Selector */}
      <div className="w-full max-w-sm glass-card p-1 rounded-2xl flex mb-6 fade-in">
        {["manager", "owner"].map((r) => (
          <button
            key={r}
            onClick={() => { setRole(r); setPin(""); setError(""); }}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200 capitalize ${
              role === r
                ? "btn-gold"
                : "text-gray-400"
            }`}
          >
            {r === "owner" ? "👑 Owner" : "🔑 Manager"}
          </button>
        ))}
      </div>

      {/* PIN Display */}
      <div className="w-full max-w-sm mb-4 fade-in">
        <div className="glass-card p-4 rounded-2xl">
          <p className="text-gray-500 text-xs text-center mb-3 uppercase tracking-widest">
            PIN Enter Karo
          </p>
          <div className="flex justify-center gap-3 mb-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all duration-200 ${
                  i < pin.length
                    ? "border-gold-500 bg-gold-500/20"
                    : "border-white/20 bg-white/5"
                }`}
              >
                {i < pin.length && (
                  <div className="w-3 h-3 rounded-full bg-gold-500" />
                )}
              </div>
            ))}
          </div>
          {error && (
            <p className="text-red-400 text-xs text-center mt-2 fade-in">{error}</p>
          )}
        </div>
      </div>

      {/* Keypad */}
      <div className="w-full max-w-sm grid grid-cols-3 gap-3 fade-in">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
          <button
            key={d}
            onClick={() => addDigit(String(d))}
            className="glass-card py-4 rounded-2xl text-xl font-semibold text-white active:scale-95 transition-all duration-150 active:bg-gold-500/20"
          >
            {d}
          </button>
        ))}
        <button
          onClick={removeDigit}
          className="glass-card py-4 rounded-2xl text-gray-400 active:scale-95 transition-all duration-150 flex items-center justify-center"
        >
          ⌫
        </button>
        <button
          onClick={() => addDigit("0")}
          className="glass-card py-4 rounded-2xl text-xl font-semibold text-white active:scale-95 transition-all duration-150 active:bg-gold-500/20"
        >
          0
        </button>
        <button
          onClick={handleLogin}
          disabled={pin.length < 4 || loading}
          className={`py-4 rounded-2xl text-sm font-bold flex items-center justify-center transition-all duration-200 ${
            pin.length >= 4 && !loading
              ? "btn-gold"
              : "bg-white/10 text-gray-600"
          }`}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
          ) : (
            "Login"
          )}
        </button>
      </div>

      <p className="text-gray-700 text-xs mt-8 text-center">
        AI Receptionist v1.0 • Powered by Groq AI
      </p>
    </div>
  );
}
