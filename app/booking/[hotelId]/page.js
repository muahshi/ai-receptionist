/**
 * app/booking/[hotelId]/page.js
 *
 * THE GUESTINN — FULL ENTERPRISE PUBLIC-FACING DIRECT RESERVATION SYSTEM
 * ───────────────────────────────────────────────────────────────────────
 * Optimized UI with Embedded Calendar Engine, Hinglish AI Chat Matrix, 
 * Google Maps integration pipelines, and fully dynamic settings sync.
 */

"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { 
  Send, MessageCircle, X, MapPin, Star, Wifi, 
  Car, Coffee, ShieldCheck, Sparkles, Calendar, 
  ChevronRight, HelpCircle, Navigation 
} from "lucide-react";

/* ─── All known demo/alias IDs ──────────────────────────────── */
const DEMOS = [
  { id:"sunrise-jaipur",    name:"Hotel Sunrise",   location:"Jaipur, Rajasthan",      totalRooms:40,  plan:"pro",        emoji:"🏨" },
  { id:"hotel-sunrise",     name:"Hotel Sunrise",   location:"Jaipur, Rajasthan",      totalRooms:40,  plan:"pro",        emoji:"🏨" },
  { id:"grand-mumbai",      name:"The Grand Inn",   location:"Mumbai, Maharashtra",    totalRooms:120, plan:"enterprise", emoji:"🏩" },
  { id:"the-grand-inn",     name:"The Grand Inn",   location:"Mumbai, Maharashtra",    totalRooms:120, plan:"enterprise", emoji:"🏩" },
  { id:"saffron-ahmedabad", name:"Saffron Stays",   location:"Ahmedabad, Gujarat",     totalRooms:25,  plan:"free",       emoji:"🏪" },
  { id:"saffron-stays",     name:"Saffron Stays",   location:"Ahmedabad, Gujarat",     totalRooms:25,  plan:"free",       emoji:"🏪" },
  { id:"cherry-bhopal",     name:"Hotel Cherry",    location:"Bhopal, Madhya Pradesh", totalRooms:20,  plan:"pro",        emoji:"🍒" },
  { id:"hotel-cherry",      name:"Hotel Cherry",    location:"Bhopal, Madhya Pradesh", totalRooms:20,  plan:"pro",        emoji:"🍒" },
];

const ROOM_TYPES = [
  { 
    type:"Standard Room", 
    image:"https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=600&q=80&auto=format&fit=crop", 
    price:999, 
    desc:"Cozy room with all absolute essential parameters.",
    amenities:["AC", "WiFi", "TV"] 
  },
  { 
    type:"Deluxe Room", 
    image:"https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=600&q=80&auto=format&fit=crop", 
    price:1999, 
    desc:"Spacious structural room featuring premium city views.",
    amenities:["AC", "WiFi", "TV", "Mini Bar"] 
  },
  { 
    type:"Suite Room", 
    image:"https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&q=80&auto=format&fit=crop", 
    price:2999, 
    desc:"Elite luxury configurations with separate sitting lounges.",
    amenities:["AC", "WiFi", "55\" TV", "Mini Bar", "Jacuzzi"] 
  },
];

const FAQS = [
  { q: "Check-in aur Check-out ka exact time kya hai?", a: "Standard check-in time 12:00 PM aur check-out time 11:00 AM hai. Early availability live counter tracking matrix aur loads par depend karti hai." },
  { q: "Kya registration process safe aur encrypted hai?", a: "Yes, data inputs completely lock ho jate hain hamare multi-tenant secure backend routing systems par. Data transparency absolute maintain rehti hai." }
];

async function fetchHotel(hotelId) {
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
  
  // Visual Date States
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [targetRoom, setTargetRoom] = useState("Deluxe Room");

  const chatEndRef = useRef(null);

  useEffect(() => {
    if (!hotelId) { setLoading(false); return; }
    fetchHotel(hotelId).then(h => { setHotel(h); setLoading(false); });
  }, [hotelId]);

  useEffect(() => {
    if (messages.length === 0 && hotel) {
      setMessages([{
        role: "assistant",
        content: `Namaste! 🙏 Welcome to **${hotel.name}**.\n\nMai aapka virtual AI Receptionist Desk assistant hoon. Aap mujhse real-time tariff matrix, amenities rules ya details ke baare mein casual Hinglish mein updates le sakte hain.\n\nAapko kis date se kis date tak ke liye room check availability chahiye?`,
        time: new Date(),
      }]);
    }
  }, [hotel]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (customValueText) => {
    const text = (customValueText || input).trim();
    if (!text || chatLoading) return;
    if (!customValueText) setInput("");

    const userMsg = { role: "user", content: text, time: new Date() };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setChatLoading(true);

    try {
      const hotelConfig = {
        name: hotel?.name || "The GuestInn Node",
        location: hotel?.location || "India",
        rates: { standard: 999, deluxe: 1999, suite: 2999 },
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
      setMessages(prev => [...prev, { role: "assistant", content: data.message || "Logic confirmation error. Please check parameters again.", time: new Date() }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "System connection timeline timeout. Ek baar dobara test kijiye. 🙏", time: new Date() }]);
    }
    setChatLoading(false);
  };

  const processFormSelection = () => {
    if (!checkIn || !checkOut) {
      alert("Please enter both target dates first!");
      return;
    }
    setChatOpen(true);
    const triggerString = `Mera allocation structure process karo. Mujhe Check-in: ${checkIn} aur Check-out: ${checkOut} tak ke liye ${targetRoom} secure booking parameters chahiye. Lock the target matrix.`;
    handleSendMessage(triggerString);
  };

  if (loading) return <div className="min-h-screen bg-[#0A0A09] flex items-center justify-center text-gray-500 font-sans">Syncing active node files...</div>;
  if (!hotel) return <div className="min-h-screen bg-[#0A0A09] flex items-center justify-center text-gray-500 font-sans">Hotel dynamic entry mapping failed.</div>;

  return (
    <div className="min-h-screen bg-[#0A0A09] text-[#FAFAF8] font-sans antialiased overflow-y-auto selection:bg-[#C9A84C] selection:text-black">
      
      {/* ── HIGH-END HEADER NAV BRANDING ── */}
      <nav className="sticky top-0 z-40 border-b border-white/5 bg-[#0A0A09]/90 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#1F1905] to-[#3B2E07] border border-white/10 flex items-center justify-center text-[#C9A84C] text-lg font-bold shadow-xl shadow-black/50">
            {hotel.emoji || "🏨"}
          </div>
          <div>
            <h1 className="font-display text-xl font-bold tracking-tight text-white">{hotel.name}</h1>
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><MapPin size={11} className="text-[#C9A84C]"/> {hotel.location}</p>
          </div>
        </div>
        <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold tracking-wider flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> MESH STABLE
        </div>
      </nav>

      {/* ── RESPONISVE DESK SCREEN PARTITION VIEW ── */}
      <main className="max-w-7xl mx-auto p-4 md:p-8 grid lg:grid-cols-12 gap-8 items-start mb-24">
        
        {/* LEFT PORTION LAYOUT (7 Columns) */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Headline Display Block */}
          <div className="p-6 rounded-2xl bg-white/[0.01] border border-white/5 backdrop-blur-xl space-y-4">
            <div className="flex gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => <Star key={i} size={13} fill="currentColor"/>)}
            </div>
            <h2 className="font-display font-light text-3xl md:text-4xl text-white leading-tight">Experience Absolute Operational Protection</h2>
            <p className="text-sm text-gray-400 leading-relaxed font-light">
              Hamare pure room structures direct cryptographic validation keys par chalte hain. <span className="text-white font-medium">{hotel.name}</span> par aapko direct 24/7 AI tracking support milega jisse manually processing failures risk absolute block ho jata hai.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 flex items-center gap-1.5"><Wifi size={12}/> High-Speed WiFi</span>
              <span className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 flex items-center gap-1.5"><Car size={12}/> Secured Parking Logs</span>
              <span className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 flex items-center gap-1.5"><Coffee size={12}/> Breakfast Included</span>
            </div>
          </div>

          {/* Curated Rooms Catalog Items Loop */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold tracking-widest text-gray-500 uppercase flex items-center gap-2">Properties Matrix Configuration</h3>
            
            <div className="grid gap-4">
              {ROOM_TYPES.map((room) => (
                <div key={room.type} className="group rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden hover:border-[#C9A84C]/30 transition-all duration-300 flex flex-col sm:flex-row">
                  <div className="sm:w-44 h-40 sm:h-auto relative overflow-hidden bg-gray-900 flex-shrink-0">
                    <img src={room.image} alt={room.type} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500 opacity-75" />
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
                          <span key={a} className="text-[9px] px-2 py-0.5 rounded bg-white/5 text-gray-400 font-medium">{a}</span>
                        ))}
                      </div>
                      <button 
                        onClick={() => { setTargetRoom(room.type); setChatOpen(true); }}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#C9A84C] text-black hover:bg-[#E8C76B] transition-colors flex items-center gap-1"
                      >
                        Book Room <ChevronRight size={12}/>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Connected Location Verification Card */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold tracking-widest text-gray-500 uppercase">Verified Location Pipeline</h3>
            <div className="p-5 rounded-xl border border-white/5 bg-white/[0.01] space-y-4">
              <div className="flex gap-3 items-start">
                <MapPin className="text-[#C9A84C] mt-0.5" size={16}/>
                <div>
                  <p className="text-sm font-medium text-white">{hotel.name} Endpoint</p>
                  <p className="text-xs text-gray-500 font-light mt-0.5">{hotel.location}</p>
                </div>
              </div>
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotel.name + " " + hotel.location)}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full py-2.5 rounded-lg font-bold text-xs bg-blue-500/10 border border-blue-500/20 text-[#60a5fa] flex items-center justify-center gap-2 hover:bg-blue-500/20 transition-all text-decoration-none"
              >
                <Navigation size={12}/> View Route on Google Maps
              </a>
            </div>
          </div>

          {/* Accordion FAQs Frame */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold tracking-widest text-gray-500 uppercase flex items-center gap-2"><HelpCircle size={12}/> Frequently Asked Parameters</h3>
            <div className="rounded-xl border border-white/5 overflow-hidden bg-white/[0.01]">
              {FAQS.map((faq, idx) => (
                <div key={idx} className="border-b border-white/5 last:border-none">
                  <button 
                    onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                    className="w-full px-5 py-4 text-left text-sm font-medium text-gray-300 flex justify-between items-center hover:bg-white/[0.01] transition-colors"
                  >
                    <span>{faq.q}</span>
                    <span className={`text-[#C9A84C] text-lg transition-transform duration-200 ${activeFaq === idx ? "rotate-45" : ""}`}>+</span>
                  </button>
                  {activeFaq === idx && (
                    <div className="px-5 pb-4 text-xs text-gray-400 font-light leading-relaxed bg-[#0F0F0D]/50">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT CALENDAR SYSTEM PORTION (5 Columns) */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          
          <div className="p-6 rounded-2xl bg-[#0F0F0D] border border-white/5 shadow-2xl shadow-black/90 space-y-5">
            <div className="flex items-center gap-2 text-[#E8C76B]">
              <Calendar size={14}/>
              <h3 className="text-xs font-bold tracking-widest uppercase">Visual Calendar Allocator</h3>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">Check-In</label>
                  <input 
                    type="date" 
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#C9A84C]/40" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">Check-Out</label>
                  <input 
                    type="date" 
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#C9A84C]/40" 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">Target Room Suite</label>
                <select 
                  value={targetRoom}
                  onChange={(e) => setTargetRoom(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#C9A84C]/40 appearance-none"
                >
                  <option value="Standard Room">Standard Room (₹999 / Night)</option>
                  <option value="Deluxe Room">Deluxe Room (₹1,999 / Night)</option>
                  <option value="Suite Room">Suite Room (₹2,999 / Night)</option>
                </select>
              </div>

              <button 
                onClick={processFormSelection}
                className="w-full py-3 rounded-xl font-bold tracking-wide text-xs bg-gradient-to-r from-[#91711E] to-[#C9A84C] text-black shadow-lg shadow-[#C9A84C]/10 hover:scale-[1.01] transition-transform duration-200"
              >
                Confirm Booking Layout →
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.01] border border-white/5 text-[11px] font-light text-gray-500 flex gap-2.5 items-start">
            <ShieldCheck size={14} className="text-[#C9A84C] flex-shrink-0 mt-0.5"/>
            <p>Every dynamic reservation parameter triggers an unalterable rate locking summary inside the multi-tenant SaaS ledger structure.</p>
          </div>

        </div>
      </main>

      {/* ── PERSISTENT SYSTEM EMBEDDED FOOTER ── */}
      <footer className="w-full text-center py-4 bg-[#050504] border-t border-white/5 text-[11px] text-gray-600 tracking-wide mt-12">
        Powered by <span className="text-gray-400 font-semibold">The GuestInn</span> Core OS Matrix • Security Layer Active
      </footer>

      {/* ── SLIDE CHATBOT POP-UP SLOT VIEWPORT ── */}
      {!chatOpen && (
        <button 
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-[#0050c8] to-[#0070F3] flex items-center justify-center text-white shadow-2xl shadow-blue-500/40 hover:scale-105 transition-transform"
        >
          <MessageCircle size={22} />
        </button>
      )}

      {/* ── FLOATING PANEL INTERACT DESK LAYER ── */}
      {chatOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[440px] bg-gradient-to-b from-[#0D1020] to-[#080A14] border-l border-white/10 shadow-2xl shadow-black flex flex-col animate-slideLeft">
          
          {/* Header Context Bar */}
          <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#1a1500] to-[#2d2200] border border-[#C9A84C]/40 flex items-center justify-center text-sm">
                👩‍💼
              </div>
              <div>
                <h4 className="text-xs font-bold tracking-wider uppercase text-[#E8C76B]">AI Receptionist Core</h4>
                <p className="text-[10px] text-emerald-400 font-medium">● Connection Standard Stable</p>
              </div>
            </div>
            <button 
              onClick={() => setChatOpen(false)}
              className="p-1.5 rounded-lg bg-white/5 border border-white/5 text-gray-500 hover:text-white transition-colors"
            >
              <X size={16}/>
            </button>
          </div>

          {/* Dialog Log Scroll Grid */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scroll">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-r from-[#91711E] to-[#C9A84C] text-black font-medium rounded-tr-none' 
                    : 'bg-white/5 border border-white/5 text-gray-200 rounded-tl-none'
                }`}>
                  {msg.content.split("**").map((part, i) => i % 2 === 1 ? <strong key={i} className="font-bold">{part}</strong> : part)}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex gap-1.5 p-2 items-center">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Interactive Core Input Block */}
          <div className="p-4 border-t border-white/5 bg-black/40 flex gap-2 items-center">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Type your query in Hinglish or English..." 
              className="flex-1 bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#C9A84C]/40 text-white placeholder:text-gray-600"
            />
            <button 
              onClick={() => handleSendMessage()}
              disabled={!input.trim() || chatLoading}
              className="w-11 h-11 rounded-xl bg-gradient-to-r from-[#0050c8] to-[#0070F3] text-white font-bold flex items-center justify-center disabled:opacity-40"
            >
              <Send size={14}/>
            </button>
          </div>

        </div>
      )}

      {/* CSS Layout Scopes */}
      <style jsx global>{`
        .custom-scroll::-webkit-scrollbar { width: 3px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.15); border-radius: 2px; }
        @keyframes slideLeft { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .animate-slideLeft { animation: slideLeft 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>

    </div>
  );
}
