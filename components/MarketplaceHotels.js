"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Wifi, Coffee, Star, ArrowRight, Shield, Plus } from "lucide-react";

// ── STATIC DEMO HOTELS — IDs match db.js DEMO_HOTELS exactly ────────────────
// CRITICAL: These IDs must match lib/db.js DEMO_HOTELS IDs so bookings save correctly
const STATIC_HOTELS = [
  {
    id: "cherry-bhopal",           // ← matches db.js DEMO_HOTELS id exactly
    name: "Hotel Cherry, Bhopal",
    city: "Bhopal, Madhya Pradesh",
    distance: "900m from Bus Stand",
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80",
    amenities: ["Free Wi-Fi", "AC Rooms", "Geyser"],
    rooms: [
      { type: "Standard", price: 1200, count: 10, available: true  },
      { type: "Deluxe",   price: 2000, count: 6,  available: true  },
      { type: "Suite",    price: 3800, count: 2,  available: true  },
    ],
    defaultRoom: 0,
    emoji: "🍒",
  },
  {
    id: "sunrise-jaipur",          // ← matches db.js DEMO_HOTELS id exactly
    name: "Hotel Sunrise Palace, Jaipur",
    city: "Jaipur, Rajasthan",
    distance: "2.1 km from City Center",
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&q=80",
    amenities: ["Free Wi-Fi", "Pool Access"],
    rooms: [
      { type: "Standard", price: 1500, count: 20, available: true  },
      { type: "Deluxe",   price: 2500, count: 10, available: true  },
      { type: "Suite",    price: 5000, count: 4,  available: true  },
    ],
    defaultRoom: 0,
    emoji: "🏨",
  },
  {
    id: "grand-mumbai",            // ← matches db.js DEMO_HOTELS id exactly
    name: "The Grand Inn, Mumbai",
    city: "Mumbai, Maharashtra",
    distance: "1.8 km from Metro Station",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&q=80",
    amenities: ["Free Wi-Fi", "Restaurant", "Gym"],
    rooms: [
      { type: "Standard", price: 2500, count: 60, available: true  },
      { type: "Deluxe",   price: 4500, count: 30, available: true  },
      { type: "Suite",    price: 9000, count: 10, available: true  },
    ],
    defaultRoom: 0,
    emoji: "🏩",
  },
  {
    id: "saffron-ahmedabad",       // ← matches db.js DEMO_HOTELS id exactly
    name: "Saffron Stays, Ahmedabad",
    city: "Ahmedabad, Gujarat",
    distance: "1.5 km from Manek Chowk",
    rating: 4.4,
    image: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400&q=80",
    amenities: ["Free Wi-Fi", "Parking"],
    rooms: [
      { type: "Standard", price: 1000, count: 15, available: true  },
      { type: "Deluxe",   price: 1600, count: 6,  available: true  },
      { type: "Suite",    price: 3200, count: 2,  available: true  },
    ],
    defaultRoom: 0,
    emoji: "🏪",
  },
];

// ── Fetch registered hotels from Supabase (non-demo, user-added hotels) ──────
async function fetchRegisteredHotels() {
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!sbUrl || !sbKey || sbUrl === "undefined") return [];
  try {
    const res = await fetch(
      `${sbUrl}/rest/v1/hotels?select=id,name,location,total_rooms,plan,emoji,standard_rate,deluxe_rate,suite_rate,avg_rating,amenities&order=created_at.desc`,
      { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    // Filter out DEMO hotels (already shown from STATIC_HOTELS)
    const staticIds = new Set(STATIC_HOTELS.map(h => h.id));
    return (data || []).filter(h => !staticIds.has(h.id)).map(h => ({
      id:          h.id,
      name:        h.name,
      city:        h.location || "",
      distance:    "",
      rating:      h.avg_rating || 4.0,
      image:       "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80",
      amenities:   Array.isArray(h.amenities) ? h.amenities : ["Free Wi-Fi"],
      rooms: [
        { type: "Standard", price: h.standard_rate || 1200, count: Math.floor((h.total_rooms || 20) * 0.6), available: true },
        { type: "Deluxe",   price: h.deluxe_rate   || 2000, count: Math.floor((h.total_rooms || 20) * 0.3), available: true },
        { type: "Suite",    price: h.suite_rate     || 3800, count: Math.max(1, Math.floor((h.total_rooms || 20) * 0.1)), available: true },
      ],
      defaultRoom: 0,
      emoji:       h.emoji || "🏨",
      isRegistered: true, // flag to show "Registered" badge
    }));
  } catch (e) {
    console.warn("[MarketplaceHotels] Supabase fetch failed:", e.message);
    return [];
  }
}

function HotelCard({ hotel }) {
  const [selectedRoom, setSelectedRoom] = useState(hotel.defaultRoom);
  const router = useRouter();
  const activeRoom = hotel.rooms[selectedRoom];

  return (
    <div style={{
      background: "rgba(5,8,15,0.97)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 20,
      overflow: "hidden",
      transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
      cursor: "pointer",
    }}
    onMouseEnter={e => {
      e.currentTarget.style.transform = "translateY(-4px)";
      e.currentTarget.style.borderColor = "rgba(212,175,55,0.3)";
      e.currentTarget.style.boxShadow = "0 20px 60px rgba(0,0,0,0.6), 0 0 30px rgba(212,175,55,0.06)";
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
      e.currentTarget.style.boxShadow = "none";
    }}
    >
      {/* Hotel image */}
      <div style={{ position: "relative", height: 180, overflow: "hidden" }}>
        <img
          src={hotel.image}
          alt={hotel.name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={e => { e.target.style.background = "rgba(20,25,40,1)"; e.target.style.display = "none"; }}
        />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.6) 100%)",
        }}/>

        {/* Rating badge */}
        <div style={{
          position: "absolute", top: 12, left: 12,
          background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: 8, padding: "4px 10px",
          display: "flex", alignItems: "center", gap: 4,
        }}>
          <Star size={11} style={{ color: "#D4AF37", fill: "#D4AF37" }}/>
          <span style={{ fontSize: 12, fontWeight: 800, color: "#fff" }}>{hotel.rating}</span>
        </div>

        {/* Badge: AI Verified or Registered */}
        <div style={{
          position: "absolute", top: 12, right: 12,
          background: hotel.isRegistered ? "rgba(34,197,94,0.15)" : "rgba(212,175,55,0.15)",
          backdropFilter: "blur(8px)",
          border: `1px solid ${hotel.isRegistered ? "rgba(34,197,94,0.35)" : "rgba(212,175,55,0.35)"}`,
          borderRadius: 8, padding: "4px 10px",
          display: "flex", alignItems: "center", gap: 4,
        }}>
          <Shield size={10} style={{ color: hotel.isRegistered ? "#22c55e" : "#D4AF37" }}/>
          <span style={{
            fontSize: 9, fontWeight: 800,
            color: hotel.isRegistered ? "#22c55e" : "#D4AF37",
            letterSpacing: "0.06em"
          }}>
            {hotel.isRegistered ? "REGISTERED" : "AI VERIFIED"}
          </span>
        </div>

        {/* Emoji pill */}
        <div style={{
          position: "absolute", bottom: 12, left: 12,
          fontSize: 24, lineHeight: 1,
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.8))",
        }}>
          {hotel.emoji}
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: "16px 18px 18px" }}>
        <h3 style={{
          fontSize: 16, fontWeight: 800, color: "#fff",
          marginBottom: 6, letterSpacing: "-0.01em",
        }}>
          {hotel.name}
        </h3>

        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
          <MapPin size={11} style={{ color: "#D4AF37", flexShrink: 0 }}/>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{hotel.city}</span>
        </div>
        {hotel.distance && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 12 }}>
            <MapPin size={11} style={{ color: "rgba(255,255,255,0.2)", flexShrink: 0 }}/>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>⊙ {hotel.distance}</span>
          </div>
        )}

        {/* Amenities */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
          {hotel.amenities.slice(0, 3).map(a => (
            <span key={a} style={{
              fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.45)",
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 6, padding: "3px 8px",
              display: "flex", alignItems: "center", gap: 4,
            }}>
              {a.includes("Wi-Fi") ? <Wifi size={8}/> : a.includes("Breakfast") || a.includes("Restaurant") ? <Coffee size={8}/> : null}
              {a}
            </span>
          ))}
        </div>

        {/* Price */}
        <div style={{
          display: "flex", alignItems: "baseline", gap: 6, marginBottom: 12,
        }}>
          <span style={{
            fontSize: 24, fontWeight: 900, color: "#D4AF37",
            textShadow: "0 0 20px rgba(212,175,55,0.4)",
            transition: "all 0.2s",
          }}>
            ₹{activeRoom.price.toLocaleString("en-IN")}
          </span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>/night</span>
          <span style={{
            marginLeft: "auto", fontSize: 9, fontWeight: 700,
            color: "#22c55e", letterSpacing: "0.06em",
          }}>
            ⊙ AI Rate Locked
          </span>
        </div>

        {/* Room type selector */}
        <div style={{
          display: "grid", gridTemplateColumns: `repeat(${hotel.rooms.length}, 1fr)`, gap: 6, marginBottom: 14,
        }}>
          {hotel.rooms.map((room, idx) => {
            const isSelected = selectedRoom === idx;
            return (
              <button
                key={room.type}
                onClick={() => setSelectedRoom(idx)}
                style={{
                  padding: "8px 4px",
                  borderRadius: 10,
                  background: isSelected ? "rgba(212,175,55,0.12)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${isSelected ? "rgba(212,175,55,0.5)" : "rgba(255,255,255,0.08)"}`,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  textAlign: "center",
                  opacity: room.available ? 1 : 0.4,
                }}
              >
                <div style={{
                  fontSize: 10, fontWeight: 800,
                  color: isSelected ? "#D4AF37" : "rgba(255,255,255,0.6)",
                  letterSpacing: "0.03em",
                  marginBottom: 3,
                }}>
                  {room.type}
                </div>
                <div style={{
                  fontSize: 11, fontWeight: 700,
                  color: isSelected ? "#D4AF37" : "rgba(255,255,255,0.4)",
                }}>
                  ₹{room.price.toLocaleString("en-IN")}
                </div>
                <div style={{
                  fontSize: 9, color: "rgba(255,255,255,0.25)", marginTop: 2,
                }}>
                  {room.count} room{room.count !== 1 ? "s" : ""}
                </div>
              </button>
            );
          })}
        </div>

        {/* CTA — uses hotel.id directly which matches db.js DEMO_HOTELS */}
        <button
        onClick={() => router.push(`/booking/${hotel.id}`)}
        style={{
          width: "100%", padding: "12px 20px",
          background: "linear-gradient(135deg, #b8960c 0%, #D4AF37 50%, #F5C842 100%)",
          border: "none", borderRadius: 12, cursor: "pointer",
          fontSize: 13, fontWeight: 800, color: "#000",
          letterSpacing: "0.04em",
          boxShadow: "0 4px 22px rgba(212,175,55,0.35)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          transition: "all 0.2s",
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.01)"; e.currentTarget.style.boxShadow = "0 6px 30px rgba(212,175,55,0.5)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 4px 22px rgba(212,175,55,0.35)"; }}
        >
          Book Now
          <ArrowRight size={14}/>
        </button>
      </div>
    </div>
  );
}

export default function MarketplaceHotels() {
  const [allHotels, setAllHotels] = useState(STATIC_HOTELS);
  const [loading, setLoading]     = useState(true);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const registered = await fetchRegisteredHotels();
        // Registered hotels aage dikho (latest first), phir static demos
        setAllHotels([...registered, ...STATIC_HOTELS]);
      } catch {
        setAllHotels(STATIC_HOTELS);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <section style={{ padding: "40px 20px 80px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        {/* Section header */}
        <div style={{
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          marginBottom: 32, flexWrap: "wrap", gap: 12,
        }}>
          <div>
            <div style={{
              display: "flex", alignItems: "center", gap: 8, marginBottom: 6,
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%", background: "#22c55e",
                boxShadow: "0 0 8px #22c55e", animation: "livePulse 2s infinite",
              }}/>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>
                Live Properties — GuestInn Network
              </span>
            </div>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
              Real Time Pricing · AI Rate Locked · Instant Confirmation
            </p>
          </div>

          {/* Register hotel CTA */}
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.2)",
              borderRadius: 10, padding: "8px 16px", cursor: "pointer",
              fontSize: 12, fontWeight: 700, color: "#D4AF37",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(212,175,55,0.12)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(212,175,55,0.06)"; }}
          >
            <Plus size={13}/>
            Register Your Hotel
          </button>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 20,
          }} className="hotels-grid">
            {[1,2,3,4].map(i => (
              <div key={i} style={{
                height: 420, borderRadius: 20,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                animation: "shimmer 1.5s infinite",
              }}/>
            ))}
          </div>
        )}

        {/* Hotel card grid */}
        {!loading && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 20,
          }} className="hotels-grid">
            {allHotels.map(hotel => (
              <HotelCard key={hotel.id} hotel={hotel}/>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 1100px) { .hotels-grid { grid-template-columns: repeat(2,1fr) !important; } }
        @media (max-width: 640px)  { .hotels-grid { grid-template-columns: 1fr !important; } }
        @keyframes livePulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.4)} }
        @keyframes shimmer { 0%{opacity:0.5} 50%{opacity:1} 100%{opacity:0.5} }
      `}</style>
    </section>
  );
}
