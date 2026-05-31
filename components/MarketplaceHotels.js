"use client";
import { useState } from "react";
import { MapPin, Wifi, Coffee, Star, ArrowRight, Shield } from "lucide-react";

const HOTELS = [
  {
    id: "hotel-cherry-bhopal",
    name: "Hotel Cherry, Bhopal",
    city: "Bhopal, Madhya Pradesh",
    distance: "1.2 km from Bus Stand",
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80",
    amenities: ["Free Wi-Fi", "Complimentary Breakfast"],
    rooms: [
      { type: "Standard", price: 1200, count: 2,  available: true  },
      { type: "Deluxe",   price: 1500, count: 3,  available: true  },
      { type: "Premium",  price: 1800, count: 2,  available: true  },
      { type: "Suite",    price: 2400, count: 1,  available: false },
    ],
    defaultRoom: 1,
  },
  {
    id: "boutique-stays-jaipur",
    name: "Boutique Stays, Jaipur",
    city: "Jaipur, Rajasthan",
    distance: "2.1 km from City Center",
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&q=80",
    amenities: ["Free Wi-Fi", "Pool Access"],
    rooms: [
      { type: "Standard", price: 1150, count: 4,  available: true  },
      { type: "Deluxe",   price: 1450, count: 5,  available: true  },
      { type: "Premium",  price: 1950, count: 3,  available: true  },
      { type: "Suite",    price: 2700, count: 1,  available: false },
    ],
    defaultRoom: 1,
  },
  {
    id: "hotel-midtown-indore",
    name: "Hotel Midtown, Indore",
    city: "Indore, Madhya Pradesh",
    distance: "900 m from Bus Stand",
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&q=80",
    amenities: ["Free Wi-Fi", "Early Check-in"],
    rooms: [
      { type: "Standard", price: 1100, count: 3,  available: true  },
      { type: "Deluxe",   price: 1400, count: 2,  available: true  },
      { type: "Premium",  price: 1700, count: 2,  available: true  },
      { type: "Suite",    price: 2300, count: 1,  available: false },
    ],
    defaultRoom: 1,
  },
  {
    id: "city-comforts-nagpur",
    name: "City Comforts, Nagpur",
    city: "Nagpur, Maharashtra",
    distance: "1.5 km from Bus Stand",
    rating: 4.4,
    image: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400&q=80",
    amenities: ["Free Wi-Fi", "Parking"],
    rooms: [
      { type: "Standard", price: 1000, count: 5,  available: true  },
      { type: "Deluxe",   price: 1300, count: 4,  available: true  },
      { type: "Premium",  price: 1300, count: 3,  available: false },
      { type: "Suite",    price: 1900, count: 1,  available: false },
    ],
    defaultRoom: 1,
  },
];

function HotelCard({ hotel }) {
  const [selectedRoom, setSelectedRoom] = useState(hotel.defaultRoom);
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
        {/* Dark overlay */}
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

        {/* AI Verified badge */}
        <div style={{
          position: "absolute", top: 12, right: 12,
          background: "rgba(212,175,55,0.15)", backdropFilter: "blur(8px)",
          border: "1px solid rgba(212,175,55,0.35)",
          borderRadius: 8, padding: "4px 10px",
          display: "flex", alignItems: "center", gap: 4,
        }}>
          <Shield size={10} style={{ color: "#D4AF37" }}/>
          <span style={{ fontSize: 9, fontWeight: 800, color: "#D4AF37", letterSpacing: "0.06em" }}>AI VERIFIED</span>
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: "16px 18px 18px" }}>
        {/* Hotel name & location */}
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
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 12 }}>
          <MapPin size={11} style={{ color: "rgba(255,255,255,0.2)", flexShrink: 0 }}/>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>⊙ {hotel.distance}</span>
        </div>

        {/* Amenities */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
          {hotel.amenities.map(a => (
            <span key={a} style={{
              fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.45)",
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 6, padding: "3px 8px",
              display: "flex", alignItems: "center", gap: 4,
            }}>
              {a.includes("Wi-Fi") ? <Wifi size={8}/> : a.includes("Breakfast") ? <Coffee size={8}/> : null}
              {a}
            </span>
          ))}
        </div>

        {/* Active price display */}
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
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 14,
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
                  background: isSelected
                    ? "rgba(212,175,55,0.12)"
                    : "rgba(255,255,255,0.03)",
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
                  {room.count} Room{room.count !== 1 ? "s" : ""}
                </div>
              </button>
            );
          })}
        </div>

        {/* CTA */}
        <button style={{
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
          View Hotel
          <ArrowRight size={14}/>
        </button>
      </div>
    </div>
  );
}

export default function MarketplaceHotels() {
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
                Live Properties Near You
              </span>
            </div>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
              Real Time Pricing · AI Rate Locked · Instant Confirmation
            </p>
          </div>

          <button style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.2)",
            borderRadius: 10, padding: "8px 16px", cursor: "pointer",
            fontSize: 12, fontWeight: 700, color: "#D4AF37",
            transition: "all 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(212,175,55,0.12)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(212,175,55,0.06)"; }}
          >
            View All Properties
            <ArrowRight size={13}/>
          </button>
        </div>

        {/* Hotel card grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 20,
        }} className="hotels-grid">
          {HOTELS.map(hotel => (
            <HotelCard key={hotel.id} hotel={hotel}/>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 1100px) { .hotels-grid { grid-template-columns: repeat(2,1fr) !important; } }
        @media (max-width: 640px)  { .hotels-grid { grid-template-columns: 1fr !important; } }
        @keyframes livePulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.4)} }
      `}</style>
    </section>
  );
}
