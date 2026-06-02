// app/api/marketplace/search/route.js — The GuestInn Network
// ═══════════════════════════════════════════════════════════════
// Marketplace search endpoint.
// Guest types a query → this API queries Supabase hotels table +
// falls back to demo hotel list → returns matching property cards.
//
// Query flow:
//   1. Parse intent from natural language query (city, budget, amenities)
//   2. Query Supabase hotels table with matching filters
//   3. If Supabase unavailable, serve DEMO_HOTELS filtered dataset
//   4. Return structured hotel card array for frontend rendering
// ═══════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

// Demo hotels — always available offline
const DEMO_HOTELS = [
  {
    id:            "cherry-bhopal",
    name:          "Hotel Cherry",
    location:      "Bhopal, Madhya Pradesh",
    city:          "Bhopal",
    state:         "Madhya Pradesh",
    city_slug:     "bhopal",
    address_line:  "Peer Gate Area, Bhopal - 462001",
    distance_tag:  "900m from Bus Stand",
    emoji:         "🍒",
    total_rooms:   20,
    plan:          "pro",
    standard_rate: 1200,
    deluxe_rate:   2000,
    suite_rate:    3800,
    min_floor_price:900,
    amenities:     ["Free Wi-Fi","AC Rooms","Geyser","Parking"],
    avg_rating:    4.5,
    total_reviews: 128,
    is_featured:   true,
    cover_image_url:"",
    owner_phone:   "919009109108",
  },
  {
    id:            "sunrise-jaipur",
    name:          "Hotel Sunrise Palace",
    location:      "Jaipur, Rajasthan",
    city:          "Jaipur",
    state:         "Rajasthan",
    city_slug:     "jaipur",
    address_line:  "Civil Lines, Jaipur - 302006",
    distance_tag:  "2.1 km from City Center",
    emoji:         "🌅",
    total_rooms:   40,
    plan:          "enterprise",
    standard_rate: 1500,
    deluxe_rate:   2500,
    suite_rate:    5000,
    min_floor_price:1100,
    amenities:     ["Free Wi-Fi","Pool Access","AC Rooms","Parking","Restaurant"],
    avg_rating:    4.7,
    total_reviews: 312,
    is_featured:   true,
    cover_image_url:"",
    owner_phone:   "919876543210",
  },
  {
    id:            "midtown-indore",
    name:          "Hotel Midtown",
    location:      "Indore, Madhya Pradesh",
    city:          "Indore",
    state:         "Madhya Pradesh",
    city_slug:     "indore",
    address_line:  "MG Road, Indore - 452001",
    distance_tag:  "900m from Bus Stand",
    emoji:         "🏙️",
    total_rooms:   35,
    plan:          "pro",
    standard_rate: 1100,
    deluxe_rate:   1800,
    suite_rate:    3500,
    min_floor_price:850,
    amenities:     ["Free Wi-Fi","Early Check-in","AC Rooms","Café"],
    avg_rating:    4.5,
    total_reviews: 89,
    is_featured:   false,
    cover_image_url:"",
    owner_phone:   "919977665544",
  },
  {
    id:            "comforts-nagpur",
    name:          "City Comforts Nagpur",
    location:      "Nagpur, Maharashtra",
    city:          "Nagpur",
    state:         "Maharashtra",
    city_slug:     "nagpur",
    address_line:  "Sitabuldi, Nagpur - 440012",
    distance_tag:  "1.5 km from Bus Stand",
    emoji:         "🏨",
    total_rooms:   30,
    plan:          "starter",
    standard_rate: 1000,
    deluxe_rate:   1600,
    suite_rate:    3200,
    min_floor_price:800,
    amenities:     ["Free Wi-Fi","Parking","AC Rooms"],
    avg_rating:    4.4,
    total_reviews: 56,
    is_featured:   false,
    cover_image_url:"",
    owner_phone:   "919988776655",
  },
  {
    id:            "grand-mumbai",
    name:          "The Grand Inn Mumbai",
    location:      "Mumbai, Maharashtra",
    city:          "Mumbai",
    state:         "Maharashtra",
    city_slug:     "mumbai",
    address_line:  "Andheri West, Mumbai - 400053",
    distance_tag:  "1.8 km from Metro Station",
    emoji:         "🏩",
    total_rooms:   120,
    plan:          "enterprise",
    standard_rate: 2500,
    deluxe_rate:   4500,
    suite_rate:    9000,
    min_floor_price:2000,
    amenities:     ["Free Wi-Fi","Restaurant","Gym","AC Rooms","Pool","Bar"],
    avg_rating:    4.8,
    total_reviews: 920,
    is_featured:   true,
    cover_image_url:"",
    owner_phone:   "919900001111",
  },
  {
    id:            "palace-udaipur",
    name:          "Palace View Inn",
    location:      "Udaipur, Rajasthan",
    city:          "Udaipur",
    state:         "Rajasthan",
    city_slug:     "udaipur",
    address_line:  "Lake Pichola Road, Udaipur - 313001",
    distance_tag:  "500m from Lake Pichola",
    emoji:         "🏰",
    total_rooms:   25,
    plan:          "pro",
    standard_rate: 1800,
    deluxe_rate:   3000,
    suite_rate:    6000,
    min_floor_price:1400,
    amenities:     ["Free Wi-Fi","Lake View","AC Rooms","Rooftop Café"],
    avg_rating:    4.6,
    total_reviews: 203,
    is_featured:   true,
    cover_image_url:"",
    owner_phone:   "919988001122",
  },
];

// ── Intent parser ─────────────────────────────────────────────
function parseSearchIntent(q) {
  const ql = q.toLowerCase().trim();

  // City detection
  const CITIES = [
    "bhopal","jaipur","indore","nagpur","mumbai","delhi","bangalore",
    "bengaluru","hyderabad","pune","kolkata","chennai","ahmedabad",
    "surat","udaipur","jodhpur","agra","varanasi","lucknow","chandigarh",
    "goa","patna","ranchi","bhubaneswar","kochi","coimbatore",
  ];
  let city = null;
  for (const c of CITIES) {
    if (ql.includes(c)) { city = c; break; }
  }

  // State detection
  const STATES = {
    "madhya pradesh":["bhopal","indore","gwalior"],
    "rajasthan":     ["jaipur","udaipur","jodhpur"],
    "maharashtra":   ["mumbai","nagpur","pune"],
    "karnataka":     ["bangalore","bengaluru"],
    "telangana":     ["hyderabad"],
    "gujarat":       ["ahmedabad","surat"],
    "goa":           ["goa","panaji"],
  };
  let state = null;
  for (const [s, cities] of Object.entries(STATES)) {
    if (ql.includes(s)) { state = s; if (!city && cities[0]) city = cities[0]; break; }
  }

  // Budget detection
  const budgetPatterns = [
    { re:/under\s*₹?\s*(\d+)/i,   fn:m => ({ max:parseInt(m[1]) }) },
    { re:/below\s*₹?\s*(\d+)/i,   fn:m => ({ max:parseInt(m[1]) }) },
    { re:/₹?\s*(\d+)\s*se\s*kam/i,fn:m => ({ max:parseInt(m[1]) }) },
    { re:/cheap|budget|sasta|low cost/i, fn:() => ({ max:1500 }) },
    { re:/₹?\s*(\d{3,5})\s*to\s*₹?\s*(\d{3,5})/i,fn:m=>({min:parseInt(m[1]),max:parseInt(m[2])})},
    { re:/₹?\s*(\d{3,5})\s*[-–]\s*₹?\s*(\d{3,5})/i,fn:m=>({min:parseInt(m[1]),max:parseInt(m[2])})},
  ];
  let budget = null;
  for (const p of budgetPatterns) {
    const m = ql.match(p.re);
    if (m) { budget = p.fn(m); break; }
  }

  // Amenity detection
  const AMENITY_MAP = {
    "wifi":["wi-fi","wifi","internet"],
    "pool":["pool","swimming"],
    "parking":["parking","car park"],
    "restaurant":["restaurant","food","dining"],
    "gym":["gym","fitness"],
    "ac":["ac","air condition"],
  };
  const amenities = [];
  for (const [key, patterns] of Object.entries(AMENITY_MAP)) {
    if (patterns.some(p => ql.includes(p))) amenities.push(key);
  }

  // Sort intent
  let sort = "featured";
  if (/(lowest|cheapest|sasta|kam rate)/i.test(ql)) sort = "price_asc";
  if (/(best rated|top rated|highest rating)/i.test(ql)) sort = "rating_desc";
  if (/newest|new hotel/i.test(ql)) sort = "newest";

  return { city, state, budget, amenities, sort, rawQuery:q };
}

// ── Filter + score hotels ─────────────────────────────────────
function filterAndScore(hotels, intent) {
  let results = hotels.map(h => ({ ...h, _score:0 }));

  // City filter
  if (intent.city) {
    const c = intent.city.toLowerCase();
    results = results.filter(h =>
      (h.city_slug||h.city||h.location||"").toLowerCase().includes(c) ||
      (h.location||"").toLowerCase().includes(c)
    );
  }

  // State filter (if no city match, try state)
  if (!intent.city && intent.state) {
    const s = intent.state.toLowerCase();
    results = results.filter(h => (h.state||h.location||"").toLowerCase().includes(s));
  }

  // Budget filter
  if (intent.budget) {
    results = results.filter(h => {
      const r = h.standard_rate || 1000;
      if (intent.budget.max && r > intent.budget.max) return false;
      if (intent.budget.min && r < intent.budget.min) return false;
      return true;
    });
  }

  // Score
  results = results.map(h => {
    let score = 0;
    if (h.is_featured)         score += 20;
    if (h.plan === "enterprise")score += 10;
    if (h.plan === "pro")       score += 5;
    score += Math.round((h.avg_rating || 0) * 4);
    score += Math.min(Math.round((h.total_reviews || 0) / 50), 10);
    // Amenity match bonus
    const hAmenities = (h.amenities || []).map(a => a.toLowerCase());
    for (const reqA of intent.amenities) {
      if (hAmenities.some(a => a.includes(reqA))) score += 8;
    }
    return { ...h, _score:score };
  });

  // Sort
  if (intent.sort === "price_asc")   results.sort((a,b) => (a.standard_rate||0) - (b.standard_rate||0));
  else if (intent.sort === "rating_desc") results.sort((a,b) => (b.avg_rating||0) - (a.avg_rating||0));
  else results.sort((a,b) => b._score - a._score);

  return results;
}

// ── Map DB row → card ─────────────────────────────────────────
function toCard(h) {
  return {
    id:            h.id,
    name:          h.name,
    location:      h.location      || `${h.city||""}, ${h.state||""}`.replace(/^, |, $/,""),
    addressLine:   h.address_line  || "",
    distanceTag:   h.distance_tag  || "",
    emoji:         h.emoji         || "🏨",
    totalRooms:    h.total_rooms   || 20,
    plan:          h.plan          || "starter",
    standardRate:  h.standard_rate || 1200,
    deluxeRate:    h.deluxe_rate   || 2000,
    suiteRate:     h.suite_rate    || 3800,
    minFloorPrice: h.min_floor_price|| 800,
    amenities:     Array.isArray(h.amenities) ? h.amenities : (h.amenities ? JSON.parse(h.amenities) : []),
    avgRating:     h.avg_rating    || 4.0,
    totalReviews:  h.total_reviews || 0,
    isFeatured:    h.is_featured   || false,
    citySlug:      h.city_slug     || "",
    ownerPhone:    h.owner_phone   || "",
    coverImageUrl: h.cover_image_url|| "",
  };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q     = searchParams.get("q")    || "";
  const city  = searchParams.get("city") || "";
  const limit = Math.min(parseInt(searchParams.get("limit")||"20"), 50);

  const queryStr = q || city;
  const intent   = parseSearchIntent(queryStr);
  if (!intent.city && city) intent.city = city.toLowerCase();

  // ── Try Supabase ──
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (sbUrl && sbKey && sbUrl !== "undefined") {
    try {
      let url = `${sbUrl}/rest/v1/hotels?select=*&order=is_featured.desc,avg_rating.desc&limit=${limit}`;
      if (intent.city) {
        url += `&or=(city_slug.ilike.*${encodeURIComponent(intent.city)}*,location.ilike.*${encodeURIComponent(intent.city)}*)`;
      }
      const res = await fetch(url, {
        headers: { apikey:sbKey, Authorization:`Bearer ${sbKey}` },
        next:    { revalidate:60 },
      });
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) {
          const scored  = filterAndScore(rows, intent);
          const cards   = scored.slice(0, limit).map(toCard);
          return Response.json({ success:true, results:cards, total:cards.length, source:"supabase", intent });
        }
      }
    } catch (e) {
      console.warn("[Search] Supabase query failed:", e.message);
    }
  }

  // ── Fallback: demo hotels ──
  const scored = filterAndScore(DEMO_HOTELS, intent);
  const cards  = scored.slice(0, limit).map(toCard);

  return Response.json({
    success: true,
    results: cards,
    total:   cards.length,
    source:  "demo",
    intent,
    notice:  "Supabase se live data fetch nahi hua — demo hotels dikh rahe hain",
  });
}

export async function POST(request) {
  try {
    const body  = await request.json();
    const q     = body.query || body.q || "";
    const limit = Math.min(parseInt(body.limit||"20"), 50);
    const intent = parseSearchIntent(q);
    if (body.city) intent.city = body.city.toLowerCase();

    const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (sbUrl && sbKey && sbUrl !== "undefined") {
      try {
        let url = `${sbUrl}/rest/v1/hotels?select=*&order=is_featured.desc,avg_rating.desc&limit=${limit}`;
        if (intent.city) {
          url += `&or=(city_slug.ilike.*${encodeURIComponent(intent.city)}*,location.ilike.*${encodeURIComponent(intent.city)}*)`;
        }
        const res = await fetch(url, {
          headers: { apikey:sbKey, Authorization:`Bearer ${sbKey}` },
          cache:   "no-store",
        });
        if (res.ok) {
          const rows = await res.json();
          if (Array.isArray(rows) && rows.length > 0) {
            const scored = filterAndScore(rows, intent);
            return Response.json({ success:true, results:scored.slice(0,limit).map(toCard), total:scored.length, source:"supabase", intent });
          }
        }
      } catch (e) {
        console.warn("[Search] POST Supabase failed:", e.message);
      }
    }

    const scored = filterAndScore(DEMO_HOTELS, intent);
    return Response.json({ success:true, results:scored.slice(0,limit).map(toCard), total:scored.length, source:"demo", intent });

  } catch (e) {
    return Response.json({ error:e.message }, { status:500 });
  }
}
