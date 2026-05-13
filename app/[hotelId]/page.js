"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Bot, User, Zap, Phone, Calendar, Star, ChevronRight, Home } from "lucide-react";

// Quick reply suggestions for the chatbot
const QUICK_REPLIES = [
  { label: "🏷️ Room Rates?", msg: "Room rates kya hain?" },
  { label: "📅 Check Availability", msg: "Kya rooms available hain aaj ke liye?" },
  { label: "📍 Location?", msg: "Hotel kahan hai?" },
  { label: "✅ Book a Room", msg: "Mujhe ek room book karna hai" },
  { label: "🛎️ Amenities?", msg: "Hotel mein kya-kya facilities hain?" },
  { label: "⏰ Check-out Time?", msg: "Check-out time kya hai?" },
];

const TYPING_DELAY = 900;

export default function GuestBookingPage({ params }) {
  const hotelId = params?.hotelId || "default";
  const [hotelConfig, setHotelConfig] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [leadCaptured, setLeadCaptured] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    // Load hotel config
    try {
      const raw = localStorage.getItem(`air_hotel_${hotelId}`);
      const config = raw ? JSON.parse(raw) : buildDefaultConfig(hotelId);
      setHotelConfig(config);

      // Welcome message
      setMessages([
        {
          role: "assistant",
          content: `Namaste! 🙏 Main *${config.name}* ka AI Receptionist hoon.\n\nMujhe aap kuch bhi pooch sakte hain — room rates, availability, ya booking. Main aapki poori madad karunga!\n\n_Aaj special offer: ${config.rates?.standard ? `Standard rooms sirf ₹${config.rates.standard}/night` : "Great deals available!"}_ ✨`,
          time: new Date(),
        },
      ]);
    } catch {
      const config = buildDefaultConfig(hotelId);
      setHotelConfig(config);
    }
  }, [hotelId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;

    setInput("");
    setShowQuickReplies(false);
    setLoading(true);

    const userMsg = { role: "user", content: userText, time: new Date() };
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);

    // Detect lead — if user shares phone number
    if (/\d{10}/.test(userText) && !leadCaptured) {
      setLeadCaptured(true);
    }

    try {
      await new Promise((r) => setTimeout(r, TYPING_DELAY));

      const chatHistory = updatedHistory.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/groq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "chat",
          messages: chatHistory,
          hotelConfig,
          hotelId,
        }),
      });

      const data = await res.json();
      const aiMsg = {
        role: "assistant",
        content: data.message || "Kuch problem aa gayi. Dobara try karein.",
        time: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Maafi chahta hoon, abhi connection mein problem hai. Thodi der mein dobara try karein.", time: new Date() },
      ]);
    }

    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  if (!hotelConfig) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex flex-col" style={{ height: "100dvh" }}>
      {/* Header */}
      <header className="flex-shrink-0 border-b border-white/10 px-4 py-3"
        style={{ background: "rgba(13,13,13,0.95)", backdropFilter: "blur(12px)" }}>
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl"
            style={{ background: "linear-gradient(135deg, #D4AF37, #f5c842)" }}>
            🏨
          </div>
          <div className="flex-1">
            <h1 className="text-white font-bold text-base leading-tight">{hotelConfig.name}</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400 text-xs">AI Receptionist Online</span>
            </div>
          </div>
          <div className="flex gap-1">
            {[1,2,3,4,5].map(s => (
              <Star key={s} size={10} className="fill-[#D4AF37] text-[#D4AF37]" />
            ))}
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto px-4 py-4 max-w-2xl mx-auto w-full">
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <ChatBubble key={i} msg={msg} hotelName={hotelConfig.name} />
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="flex items-end gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #D4AF37, #f5c842)" }}>
                <Bot size={16} className="text-black" />
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-bl-sm"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
                <div className="flex gap-1.5 items-center h-4">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-2 h-2 rounded-full bg-[#D4AF37]"
                      style={{ animation: `bounce 1.2s ease-in-out ${i*0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Quick Replies */}
          {showQuickReplies && !loading && messages.length === 1 && (
            <div className="mt-2">
              <p className="text-gray-600 text-xs mb-2 text-center">Yahan se pooch sakte hain:</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_REPLIES.map((qr) => (
                  <button key={qr.label} onClick={() => sendMessage(qr.msg)}
                    className="px-3 py-2 rounded-xl text-xs font-medium text-[#D4AF37] transition-all active:scale-95"
                    style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.3)" }}>
                    {qr.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </main>

      {/* Hotel Info Strip */}
      <div className="flex-shrink-0 max-w-2xl mx-auto w-full px-4 py-2">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { icon: "🛏️", label: "Standard", price: `₹${hotelConfig.rates?.standard || 1500}` },
            { icon: "🌟", label: "Deluxe", price: `₹${hotelConfig.rates?.deluxe || 2500}` },
            { icon: "👑", label: "Suite", price: `₹${hotelConfig.rates?.suite || 4500}` },
          ].map((room) => (
            <div key={room.label} className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <span className="text-base">{room.icon}</span>
              <div>
                <p className="text-white text-xs font-medium">{room.label}</p>
                <p className="text-[#D4AF37] text-xs font-bold">{room.price}/night</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Input Bar */}
      <div className="flex-shrink-0 px-4 pb-4 max-w-2xl mx-auto w-full">
        <div className="flex gap-2 items-center px-4 py-2 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)" }}>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Kuch bhi poochein..."
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-600"
          />
          <button onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 disabled:opacity-40"
            style={{ background: input.trim() ? "linear-gradient(135deg, #D4AF37, #f5c842)" : "rgba(255,255,255,0.1)" }}>
            <Send size={16} className={input.trim() ? "text-black" : "text-gray-500"} />
          </button>
        </div>
        <p className="text-center text-gray-700 text-xs mt-2">
          Powered by The GuestInn AI • Groq Llama 3
        </p>
      </div>

      <style jsx>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        .scrollbar-none::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}

function ChatBubble({ msg, hotelName }) {
  const isUser = msg.role === "user";
  const timeStr = msg.time
    ? new Date(msg.time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    : "";

  // Parse bold (*text*) and line breaks
  const formatText = (text) => {
    return text.split("\n").map((line, i) => {
      const parts = line.split(/\*([^*]+)\*/g);
      return (
        <span key={i}>
          {parts.map((p, j) => j % 2 === 1 ? <strong key={j} className="text-[#D4AF37]">{p}</strong> : p)}
          {i < text.split("\n").length - 1 && <br />}
        </span>
      );
    });
  };

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%]">
          <div className="px-4 py-3 rounded-2xl rounded-br-sm text-white text-sm"
            style={{ background: "linear-gradient(135deg, #0070F3, #0051aa)" }}>
            {msg.content}
          </div>
          <p className="text-gray-700 text-xs text-right mt-1">{timeStr}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2">
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: "linear-gradient(135deg, #D4AF37, #f5c842)" }}>
        <Bot size={16} className="text-black" />
      </div>
      <div className="max-w-[82%]">
        <div className="px-4 py-3 rounded-2xl rounded-bl-sm text-gray-100 text-sm leading-relaxed"
          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
          {formatText(msg.content)}
        </div>
        <p className="text-gray-700 text-xs mt-1">{timeStr}</p>
      </div>
    </div>
  );
}

function buildDefaultConfig(hotelId) {
  return {
    id: hotelId,
    name: "The GuestInn",
    location: "India",
    rates: { standard: 1500, deluxe: 2500, suite: 4500 },
    amenities: ["WiFi", "AC", "Parking", "Restaurant"],
    totalRooms: 20,
    gstPercent: 12,
  };
}
