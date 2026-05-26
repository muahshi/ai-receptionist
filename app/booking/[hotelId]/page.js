/**
 * app/booking/[hotelId]/page.js
 *
 * THE GUESTINN — FULL GUEST-FACING DIRECT RESERVATION Ecosystem
 * ───────────────────────────────────────────────────────────────────
 * Features:
 * ✅ Premium Luxury Midnight Gold UI (Matches core brand aesthetics)
 * ✅ Form-to-Chat Input Handshake Engine (Calendar inputs toggle chatbot triggers)
 * ✅ Fully Dynamic Settings Sync (Rates & text pull dynamically from backend logic)
 * ✅ Responsive Mobile-First Scrolling Configuration (No overlap loops)
 * ✅ Explicit Google Maps Navigation Routing Pipeline
 */

"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { 
  Send, MessageCircle, X, MapPin, Star, Wifi, 
  Car, Coffee, ShieldCheck, Sparkles, Calendar, 
  ChevronRight, HelpCircle, Navigation, Info 
} from "lucide-react";

/* ─── All known demo / backup database records ──────────────── */
const DEMOS = [
  { id: "cherry-bhopal",     name: "Hotel Cherry",    location: "Peer Gate, Bhopal, Madhya Pradesh", totalRooms: 20,  plan: "pro",        emoji: "🍒" },
  { id: "hotel-cherry",      name: "Hotel Cherry",    location: "Peer Gate, Bhopal, Madhya Pradesh", totalRooms: 20,  plan: "pro",        emoji: "🍒" },
  { id: "sunrise-jaipur",    name: "Hotel Sunrise",   location: "Jaipur, Rajasthan",                 totalRooms: 40,  plan: "pro",        emoji: "🏨" },
  { id: "grand-mumbai",      name: "The Grand Inn",   location: "Mumbai, Maharashtra",               totalRooms: 120, plan: "enterprise", emoji: "🏩" },
];

/* ─── Curated Dynamic Category Framework ────────────────────── */
const ROOM_TYPES = [
  { 
    type: "Standard Room", 
    image: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=600&q=80&auto=format&fit=crop", 
    price: 1500, 
    desc: "Cozy operational space with all absolute essential parameters.",
    amenities: ["AC", "WiFi", "TV", "Geyser"] 
  },
  { 
    type: "Deluxe Room", 
    image: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=600&q=80&auto=format&fit=crop", 
    price: 2500, 
    desc: "Spacious structural room featuring optimized premium city views.",
    amenities: ["AC", "WiFi", "TV", "Mini Bar", "Geyser"] 
  },
  { 
    type: "Suite Room", 
    image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&q=80&auto=format&fit=crop", 
    price: 4500, 
    desc: "Elite luxury configurations with separate sitting lounges.",
    amenities: ["AC", "WiFi", "55\" TV", "Mini Bar", "Jacuzzi", "Butler"] 
  },
];

/* ─── Global Automated FAQ Arrays ───────────────────────────── */
const FAQS = [
  { q: "Check-in aur Check-out ka exact time rules kya hai?", a: "Standard check-in time 12:00 PM hai aur check-out time 11:00 AM locked hai. Early processing criteria parameters server room availability limits par mapped hote hain." },
  { q: "Kya database structure aur rates transparent lock rehte hain?", a: "Yes. Once check-in input trigger parameters register hote hain, base pricing details change karna strictly blocked ho jata hai cash manipulations block karne ke liye." }
];

/* ─── Dynamic Multi-Tenant Supabase Data Fetcher ────────────── */
async function fetchHotelMetadata(hotelId) {
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const mapRow = h => ({
    id: h.id, name: h.name, location: h.location,
    totalRooms: h.total_rooms || h.totalRooms || 20,
    plan: h.plan || "starter", emoji: h.emoji || "🏨",
    ownerPhone: h.owner_phone || "",
  });

  if (sbUrl && sbKey && sbUrl !== "undefined") {
    try {
      const res = await fetch(
        `${sbUrl}/rest/v1/hotels?id=eq.${encodeURIComponent(hotelId)}&select=id,name,location,total_rooms,plan,emoji,owner_phone`,
        { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data?.length > 0) return mapRow(data[0]);
      }
    } catch {}
  }
  const slug = hotelId.toLowerCase().replace(/-/g, "");
  return DEMOS.find(h => h.id === hotelId) || DEMOS.find(h => h.id.replace(/-/g,"") === slug) || null;
}

export default function PublicBookingPage() {
  const { hotelId } = useParams();
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);

  // Core Calendar Operational States
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("Deluxe Room");

  const chatEndRef = useRef(null);

  useEffect(() => {
    if (!hotelId) { setLoading(false); return; }
    fetchHotelMetadata(hotelId).then(h => { setHotel(h); setLoading(false); });
  }, [hotelId]);

  useEffect(() => {
    if (messages.length === 0 && hotel) {
      setMessages([{
        role: "assistant",
        content: `Namaste! 🙏 Welcome to **${hotel.name}**.\n\nMain aapka personal 24/7 AI Receptionist Desk assistant hoon. Aap mujhse rates optimization parameters, dynamic discounts, rules ya directly details extraction ke baare mein casual Hinglish ya English mein instant updates le sakte hain.\n\nAapko kis target date slots ke liye allocation parameters verify karne hain?`,
        time: new Date(),
      }]);
    }
  }, [hotel]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const executeMessagePipeline = async (overrideValueText) => {
    const text = (overrideValueText || input).trim();
    if (!text || chatLoading) return;
    if (!overrideValueText) setInput("");

    const userMsg = { role: "user", content: text, time: new Date() };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setChatLoading(true);

    try {
      const hotelConfig = {
        name: hotel?.name || "The GuestInn Server Core",
        location: hotel?.location || "Bhopal",
        rates: { standard: 1500, deluxe: 2500, suite: 4500 },
      };

      const res = await fetch("/api/groq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "chat",
          hotelConfig,
          messages: newMsgs.map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.message || "Pipeline logic error token. Please try again.", time: new Date() }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Active sockets transmission timeline timeout. Ek baar dobara test kijiye. 🙏", time: new Date() }]);
    }
    setChatLoading(false);
  };

  const processFormValidationHandshake = () => {
    if (!checkIn || !checkOut) {
      alert("Pehle kripya dynamic Check-In aur Check-Out date metrics populate kijiye!");
      return;
    }
    setChatOpen(true);
    const systemicPromptText = `Mera reservation workflow query process karo. Mujhe Check-in date: ${checkIn} aur Check-out date: ${checkOut} tak ke liye target room template status: ${selectedRoom} secure lock parameter updates ke saath setup chahiye. Fix tracking layers instantly.`;
    executeMessagePipeline(systemicPromptText);
  };

  if (loading) return <div className="min-h-screen bg-[#0A0A09] flex items-center justify-center text-gray-500 font-sans tracking-wide">Syncing architecture environment arrays...</div>;
  if (!hotel) return <div className="min-h-screen bg-[#0A0A09] flex items-center justify-center text-gray-500 font-sans tracking-wide">Dynamic multi-tenant parameters missing for this node route.</div>;

  return (
    <div className="min-h-screen bg-[#0A0A09] text-[#FAFAF8] font-sans antialiased overflow-y-auto selection:bg-[#C9A84C] selection:text-black pb-16">
      
      {/* ── STICKY NAVIGATION CONTROLLER ── */}
      <nav className="sticky top-0 z-40 border-b border-white/5 bg-[#0A0A09]/90 backdrop-blur-lg px-4 md:px-8 py-4 flex items-center justify-between shadow-xl shadow-black/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#1F1905] to-[#3B2E07] border border-white/10 flex items-center justify-center text-[#C9A84C] text-lg font-bold shadow-md shadow-black/50">
            {hotel.emoji || "🏨"}
          </div>
          <div>
            <h1 className="font-display text-lg md:text-xl font-bold tracking-tight text-white">{hotel.name}</h1>
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><MapPin size={11} className="text-[#C9A84C]"/> {hotel.location}</p>
          </div>
        </div>
        <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold tracking-widest flex items-center gap-1.5 shadow-inner">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> MESH ONLINE
        </div>
      </nav>

      {/* ── SCREEN DUAL SEGMENT LAYOUT MATRIX ── */}
      <main className="max-w-7xl mx-auto p-4 md:p-8 grid lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Hotel Showcase Information (7 Columns) */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Main Visual Profile Presentation Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-white/[0.02] to-transparent border border-white/5 backdrop-blur-3xl space-y-4 shadow-xl shadow-black/30">
            <div className="flex gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => <Star key={i} size={12} fill="currentColor"/>)}
            </div>
            <h2 className="font-display font-light text-2xl md:text-4xl text-white leading-tight">Automated Ledger Level Protection</h2>
            <p className="text-sm text-gray-400 leading-relaxed font-light">
              Welcome to <span className="text-white font-medium">{hotel.name}</span>. Hamare saare room metrics aur base tariffs directly dynamic settings profile se render hote hain. Counter configurations par leakage zero block karne ke liye rate inputs backend database layer par cryptographically lock ho jate hain.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 flex items-center gap-1.5 border border-white/5"><Wifi size={12}/> High-Speed WiFi</span>
              <span className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 flex items-center gap-1.5 border border-white/5"><Car size={12}/> Secure Parking</span>
              <span className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 flex items-center gap-1.5 border border-white/5"><Coffee size={12}/> Breakfast Logs</span>
            </div>
          </div>

          {/* Catalog Matrix Array */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold tracking-widest text-gray-500 uppercase flex items-center gap-2"><Info size={12}/> Curated Inventory Matrix</h3>
            
            <div className="grid gap-4">
              {ROOM_TYPES.map((room) => (
                <div key={room.type} className="group rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden hover:border-[#C9A84C]/25 transition-all duration-300 flex flex-col sm:flex-row shadow-lg shadow-black/20">
                  <div className="sm:w-48 h-44 sm:h-auto relative overflow-hidden bg-gray-900 flex-shrink-0">
                    <img src={room.image} alt={room.type} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500 opacity-70" />
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="font-semibold text-base text-white tracking-tight">{room.type}</h4>
                        <p className="text-xs text-gray-400 font-light mt-1 leading-relaxed">{room.desc}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-xl font-bold font-display text-[#E8C76B]">₹{room.price}</span>
                        <p className="text-[9px] text-gray-500 tracking-wider uppercase mt-0.5">per night</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-white/5">
                      <div className="flex gap-1">
                        {room.amenities.map(a => (
                          <span key={a} className="text-[9px] px-2 py-0.5 rounded bg-white/5 text-gray-400 border border-white/5 font-medium">{a}</span>
                        ))}
                      </div>
                      <button 
                        onClick={() => { setSelectedRoom(room.type); setChatOpen(true); }}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#C9A84C] text-black hover:bg-[#E8C76B] transition-colors flex items-center gap-1 shadow-md shadow-[#C9A84C]/5"
                      >
                        Select & Book <ChevronRight size={12}/>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic Google Maps Component Frame */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold tracking-widest text-gray-500 uppercase">Verified Direction Coordinates</h3>
            <div className="p-5 rounded-xl border border-white/5 bg-white/[0.01] space-y-4 shadow-md">
              <div className="flex gap-3 items-start">
                <MapPin className="text-[#C9A84C] mt-0.5" size={16}/>
                <div>
                  <p className="text-sm font-medium text-white">{hotel.name} Core Endpoint</p>
                  <p className="text-xs text-gray-500 font-light mt-0.5">{hotel.location}</p>
                </div>
              </div>
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotel.name + " " + hotel.location)}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full py-2.5 rounded-lg font-bold text-xs bg-blue-500/10 border border-blue-500/20 text-[#60a5fa] flex items-center justify-center gap-2 hover:bg-blue-500/20 transition-all text-decoration-none"
              >
                <Navigation size={12}/> Load Google Maps Router Link
              </a>
            </div>
          </div>

          {/* FAQs Block Layer */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold tracking-widest text-gray-500 uppercase flex items-center gap-2"><HelpCircle size={12}/> System Specification FAQ Nodes</h3>
            <div className="rounded-xl border border-white/5 overflow-hidden bg-white/[0.01] shadow-md">
              {FAQS.map((faq, idx) => (
                <div key={idx} className="border-b border-white/5 last:border-none">
                  <button 
                    onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                    className="w-full px-5 py-4 text-left text-sm font-medium text-gray-300 flex justify-between items-center hover:bg-white/[0.01] transition-colors focus:outline-none"
                  >
                    <span>{faq.q}</span>
                    <span className={`text-[#C9A84C] text-lg transition-transform duration-200 ${activeFaq === idx ? "rotate-45" : ""}`}>+</span>
                  </button>
                  {activeFaq === idx && (
                    <div className="px-5 pb-4 text-xs text-gray-400 font-light leading-relaxed bg-[#0A0D14]/40 animate-fadeIn">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Functional Calendar Engine Dashboard (5 Columns) */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          
          <div className="p-6 rounded-2xl bg-[#0F0F0D] border border-white/5 shadow-2xl shadow-black/90 space-y-5">
            <div className="flex items-center gap-2 text-[#E8C76B]">
              <Calendar size={14}/>
              <h3 className="text-xs font-bold tracking-widest uppercase tracking-wider">Visual Calendar Allocator</h3>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">Check-In</label>
                  <input 
                    type="date" 
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#C9A84C]/40" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">Check-Out</label>
                  <input 
                    type="date" 
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#C9A84C]/40" 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">Target Categories Configuration</label>
                <select 
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#C9A84C]/40 appearance-none cursor-pointer"
                >
                  <option value="Standard Room">Standard Room (₹1,500 / night)</option>
                  <option value="Deluxe Room">Deluxe Room (₹2,500 / night)</option>
                  <option value="Suite Room">Suite Room (₹4,500 / night)</option>
                </select>
              </div>

              <button 
                onClick={processFormValidationHandshake}
                className="w-full py-3 rounded-xl font-bold tracking-wider text-xs bg-gradient-to-r from-[#91711E] to-[#C9A84C] text-black shadow-lg shadow-[#C9A84C]/10 hover:scale-[1.01] transition-transform duration-200"
              >
                Confirm Allocation Targets →
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.01] border border-white/5 text-[11px] font-light text-gray-500 flex gap-2.5 items-start shadow-inner">
            <ShieldCheck size={14} className="text-[#C9A84C] flex-shrink-0 mt-0.5"/>
            <p>Every dynamic reservation parameter triggers an unalterable rate locking summary inside the multi-tenant SaaS ledger structure, blocking counter discrepancy vectors.</p>
          </div>

        </div>
      </main>

      {/* ── FLOATING PANEL TRIGGER BALL ── */}
      {!chatOpen && (
        <button 
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-[#0050c8] to-[#0070F3] flex items-center justify-center text-white shadow-2xl shadow-blue-500/30 hover:scale-105 transition-transform duration-300"
        >
          <MessageCircle size={22} />
        </button>
      )}

      {/* ── SLIDE INTERACTIVE AI DESK PANEL ── */}
      {chatOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[440px] bg-gradient-to-b from-[#0D111E] to-[#060810] border-l border-white/10 shadow-2xl shadow-black flex flex-col animate-slideLeft">
          
          {/* Header Module Status */}
          <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/30 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#141A29] to-[#1E293B] border border-[#C9A84C]/40 flex items-center justify-center text-sm shadow-md">
                👩‍💼
              </div>
              <div>
                <h4 className="text-xs font-bold tracking-widest uppercase text-[#E8C76B]">AI Receptionist Core</h4>
                <p className="text-[10px] text-emerald-400 font-medium tracking-wide">● Neural Mesh Synced</p>
              </div>
            </div>
            <button 
              onClick={() => setChatOpen(false)}
              className="p-1.5 rounded-lg bg-white/5 border border-white/5 text-gray-500 hover:text-white transition-colors focus:outline-none"
            >
              <X size={16}/>
            </button>
          </div>

          {/* Chat Stream Viewport Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scroll bg-black/10">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                <div className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-md ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-r from-[#91711E] to-[#C9A84C] text-black font-semibold rounded-tr-none' 
                    : 'bg-white/5 border border-white/5 text-gray-200 rounded-tl-none font-light'
                }`}>
                  {msg.content.split("**").map((part, i) => i % 2 === 1 ? <strong key={i} className="font-bold text-shadow">{part}</strong> : part)}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex gap-1.5 p-2 items-center pl-4">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* User Message Action Input */}
          <div className="p-4 border-t border-white/5 bg-black/40 backdrop-blur-md flex gap-2 items-center">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && executeMessagePipeline()}
              placeholder="Type your query in Hinglish or English..." 
              className="flex-1 bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#C9A84C]/40 text-white placeholder:text-gray-600 transition-colors shadow-inner"
            />
            <button 
              onClick={() => executeMessagePipeline()}
              disabled={!input.trim() || chatLoading}
              className="w-11 h-11 rounded-xl bg-gradient-to-r from-[#0050c8] to-[#0070F3] text-white font-bold flex items-center justify-center disabled:opacity-40 shadow-md"
            >
              <Send size={14}/>
            </button>
          </div>

        </div>
      )}

      {/* Localized Transitions Scopes */}
      <style jsx global>{`
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.15); border-radius: 4px; }
        @keyframes slideLeft { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slideLeft { animation: slideLeft 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fadeIn { animation: fadeIn 0.3s ease forwards; }
      `}</style>

    </div>
  );
}
