<div align="center">

# 🏨 The GuestInn Network
### India ka Smart Hotel Network

**AI Powered · Secure · Commission Free**

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=nextdotjs)](https://nextjs.org)
[![Groq AI](https://img.shields.io/badge/Groq-Llama_3.3_70b-orange)](https://groq.com)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?logo=supabase)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com)
[![PWA](https://img.shields.io/badge/PWA-Installable-blue)](https://web.dev/progressive-web-apps)

[Live Demo](https://ai-receptionist-sandy-six.vercel.app) · [Booking Page](https://ai-receptionist-sandy-six.vercel.app/booking/cherry-bhopal) · [Staff Login](https://ai-receptionist-sandy-six.vercel.app)

</div>

---

## ✨ Kya Hai Yeh?

The GuestInn Network India ka **commission-free smart hotel platform** hai — do layers mein:

### 🌐 Marketplace Layer (Guest-facing)
Koi bhi guest aake hotels search kar sakta hai, AI Negotiator se baat kar sakta hai, aur seedha book kar sakta hai — koi OTA nahi, koi commission nahi.

### 🏨 Hotel Management Layer (Staff-facing)
Har registered hotel ko milta hai — AI ID Scanner, Room Grid Dashboard, Push Notifications, GRC Compliance, Revenue Tracking.

---

## 🗂️ Project Structure

```
ai-receptionist/
├── app/
│   ├── page.js                      # Marketplace homepage — hero, hotels, AI orb
│   ├── layout.js                    # Root layout — PWA meta, fonts, apple-touch-icon
│   ├── globals.css                  # Global styles — scroll architecture, animations
│   ├── booking/[hotelId]/page.js    # Public guest booking page (standalone)
│   ├── h/[hotelId]/page.js          # Staff direct login shortcut
│   ├── dashboard/page.js            # Hotel staff dashboard
│   └── api/
│       ├── groq/route.js            # AI: id_scan | ai_insight | chat | negotiate
│       ├── alerts/route.js          # Email via Resend
│       └── push/route.js            # Push: subscribe | send | unsubscribe
│
├── components/
│   ├── HeroSearchSection.js         # Marketplace hero — live network canvas, voice search
│   ├── NegotiatorOrb.js             # Floating AI chat panel — Groq powered, Hinglish
│   ├── MarketplaceHotels.js         # Hotel cards grid with room type selector
│   ├── AdvantageGrid.js             # Feature benefits cards
│   ├── DashboardView.js             # Staff dashboard — room grid, revenue, AI insight
│   ├── ScannerView.js               # AI ID scanner + booking form
│   ├── GuestsView.js                # Guest list + GRC print
│   ├── ReportsView.js               # Revenue charts + booking history
│   ├── SettingsView.js              # Hotel settings + rates slider
│   └── LoginScreen.js               # Hotel selector + PIN login
│
├── lib/
│   ├── db.js                        # Data layer: Supabase + localStorage hybrid
│   ├── db.supabase.js               # Supabase-only data functions
│   ├── hotelConfig.js               # Hotel config helpers
│   ├── alerts.js                    # WhatsApp + Email + Push alert system
│   └── usePushNotifications.js      # React hook — push subscribe/unsubscribe
│
├── public/
│   ├── branding/logo-main.png       # 1200×400 brand logo
│   ├── icons/
│   │   ├── apple-touch-icon.png     # 180×180 — iOS home screen
│   │   ├── icon-192.png             # 192×192 — Android PWA
│   │   └── icon-512.png             # 512×512 — PWA splash
│   ├── sw-push.js                   # Service Worker — push handler + sound
│   ├── manifest.json                # PWA manifest
│   ├── sitemap.xml                  # SEO sitemap
│   ├── contact.html                 # Contact page
│   ├── landing.html                 # Marketing landing page
│   └── blogs/                      # Blog HTML files
│
├── supabase_schema.sql              # Database setup — run in SQL Editor
├── vercel.json                      # Vercel config — Mumbai region (bom1)
├── next.config.js                   # Next.js + PWA config
├── tailwind.config.js               # Tailwind CSS config
└── package.json                     # Dependencies
```

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/ai-receptionist.git
cd ai-receptionist
npm install
```

### 2. Environment Variables

`.env.local` file banao project root mein:

```env
# ── Required ─────────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxx...
MY_GROQ_KEY=gsk_xxxx...

# ── Push Notifications (VAPID) ───────────────────────────────────
# Generate once:
# node -e "const c=require('crypto');const e=c.createECDH('prime256v1');e.generateKeys();console.log('PUBLIC='+e.getPublicKey('base64url'));console.log('PRIVATE='+e.getPrivateKey('base64url'))"
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BD5bPQrz...
VAPID_PRIVATE_KEY=5UwETRnu...
VAPID_SUBJECT=mailto:admin@yourhotel.com

# ── Optional ─────────────────────────────────────────────────────
RESEND_API_KEY=re_xxxx...       # Email alerts (free tier: 100/day)
```

### 3. Supabase Setup

Supabase dashboard → SQL Editor → `supabase_schema.sql` ka content paste → Run.

Tables banti hain:
- `hotels` — hotel registry
- `bookings` — GRC records
- `push_subscriptions` — PWA notification subscribers

### 4. Local Dev

```bash
npm run dev
# → http://localhost:3000
```

### 5. Deploy to Vercel

```bash
npm i -g vercel
vercel --prod
# Ya GitHub connect karo → auto-deploy on push
```

Environment variables Vercel dashboard → Project → Settings → Environment Variables mein add karo.

---

## 🌐 Marketplace Features

### Live Network Canvas (HeroSearchSection.js)
Hero section ka pura background ek animated canvas hai jo real-time network activity dikhata hai:

- **👤 GUEST nodes** — green, slow drift, ping rings
- **🏨 HOTEL nodes** — gold, steady movement
- **⬡ AI·AGENT nodes** — blue, fast activity
- Nodes ke beech **animated dashed lines** — color-coded by type
- **Data packets** flow karte hain lines pe — glowing dot + tail trail
- **Ping rings** — random intervals pe nodes se pulse, connection simulation
- Retina-ready: `devicePixelRatio` aware canvas rendering

### Hinglish AI Search (HeroSearchSection.js)
```
Typewriter placeholder → user kuch type kare → Enter ya "Dhundo" → NegotiatorOrb opens instantly
```
- Real `<input>` — focusable, keyboard navigable
- Placeholder typewriter rotate karta hai jab user type nahi kar raha
- Submit karne pe query seedha NegotiatorOrb mein inject hoti hai

### Voice Search — Web Speech API (HeroSearchSection.js)
```js
// lang: "hi-IN" — Hindi + English dono samajhta hai
// interimResults: true — real-time transcript dikhta hai input mein
// isFinal → auto-submit to NegotiatorOrb
```
- 🎙️ Mic button tap → `SpeechRecognition` start
- Bolte waqt text real-time dikhta hai search box mein
- Bol ke band karo → automatic search trigger
- Error handling: mic denied, no-speech, browser unsupported — sab Hinglish mein

### AI Negotiator Orb (NegotiatorOrb.js)

**State-Sync Architecture:**
```
HeroSearchSection
    ↓ onSearch(queryString)
page.js (pendingSearchQuery state)
    ↓ prop: pendingQuery + forceOpen
NegotiatorOrb
    ↓ consumedRef.current check (no double-fire)
    ↓ setMessages([userMsg]) + callGroq() immediately
    → AI responds with matching hotels, NO generic questions
```

**Groq Integration:**
```js
POST /api/groq
{
  type: "chat",
  systemOverride: MARKETPLACE_SYSTEM,   // Custom hotel catalog + Hinglish rules
  messages: conversationHistory          // Full context maintained per session
}
```

- Hotel catalog inject hai system prompt mein — AI jaanta hai kaunse hotels hain
- Agar user ne city mention ki → seedha wahan ke hotels suggest karta hai
- Quick reply chips — fresh session pe common queries
- Thinking dots animation — jab AI process kar raha ho
- Full conversation history — multi-turn context maintained

### Hotel Cards (MarketplaceHotels.js)
- Room type selector per card (Standard/Deluxe/Premium/Suite)
- AI Verified badge
- AI Rate Locked pricing
- **"View Hotel" button** → `/booking/[hotelId]` pe navigate karta hai (`useRouter`)

---

## 🏨 Hotel Management Features

### Staff Dashboard (DashboardView.js)
- **Floor-by-floor room grid** — color-coded: Vacant (green), Occupied (red), Reserved (gold), Cleaning (indigo), OOO (gray)
- **Live Revenue Widget** — aaj ka total + 7-day sparkline
- **AI Insight Card** — Groq se Hinglish revenue tip
- **Room click modal** — guest details, check-out, approve check-in
- **Push notification bell** — header mein, gold glow jab subscribed

### AI ID Scanner (ScannerView.js)
```
Camera → Base64 → POST /api/groq {type:"id_scan"} → Groq Llama 4 Vision
→ { name, dob, address, idNumber, idType, gender } → Auto-fill form
```

**Supported IDs:** Aadhaar · PAN · Passport · Driving License · Voter ID · Foreign Passports

### Push Notifications
- Service Worker (`sw-push.js`) — background push
- Hotel bell chime — Web Audio API (D5→G5→B5, no external file)
- Vibration: `[200, 100, 200, 100, 400]`
- Action buttons: "Details Dekho" · "Dismiss"

### Settings — Sab Configurable
| Setting | Effect |
|---|---|
| Hotel Name, Location | Dashboard, booking page, alerts |
| Total Rooms | Room grid reinitialize |
| GST % | Billing calculations |
| Standard / Deluxe / Suite Rates | Slider + manual input + presets |
| Checkout Time | Policy display |
| Owner / Manager Phone | WhatsApp alert destination |
| Owner / Manager PIN | Login authentication |

---

## 🤖 AI / API Routes

| Route | Type | Input | Output |
|---|---|---|---|
| `POST /api/groq` | `id_scan` | `imageBase64` | Name, DOB, Address, ID details |
| `POST /api/groq` | `ai_insight` | `stats, hotelName` | Hinglish revenue tip |
| `POST /api/groq` | `chat` | `messages[], hotelConfig, systemOverride?` | Hinglish conversation |
| `POST /api/groq` | `negotiate` | `requestedRate, roomType` | Rate-lock confirmation |
| `POST /api/alerts` | — | `emails[], subject, html` | Email via Resend |
| `POST /api/push` | `subscribe` | `hotelId, subscription` | Save subscription |
| `POST /api/push` | `send` | `hotelId, payload` | Push to all subscribers |
| `POST /api/push` | `unsubscribe` | `hotelId, endpoint` | Remove subscription |

### `systemOverride` in Chat
NegotiatorOrb marketplace-specific system prompt bhejta hai:
```js
{
  type: "chat",
  systemOverride: "You are AI Negotiator for The GuestInn Network...\nHotel Catalog:\n• Hotel Cherry...",
  messages: [...]
}
```
Route.js mein: `const systemPrompt = body.systemOverride || defaultHotelPrompt`

---

## 💾 Data Layer

### localStorage Keys
```
air_[hotelId]_config     → hotel settings (rates dono formats mein)
air_[hotelId]_rooms      → room array with status + guest info
air_[hotelId]_bookings   → all booking records
gi_hotel_registry        → registered hotels list
air_current_user         → active session
```

### Rate Format Normalization (db.js)
```js
// saveHotelConfig() dono save karta hai — KABHI manual setItem mat karo:
{
  rates: { standard: 1200, deluxe: 2000, suite: 3800 },
  standardRate: 1200,   // booking page + rooms read karte hain
  deluxeRate: 2000,
  suiteRate: 3800,
}
```

### Offline-First Pattern
```
Write: localStorage (instant) → Supabase (background)
Read:  Supabase (fresh) → localStorage fallback
→ App works even when Supabase is down
```

---

## 🗃️ Supabase Schema

```sql
hotels (
  id, name, location, total_rooms, plan, emoji,
  owner_pin, manager_pin, owner_phone, created_at, updated_at
)

bookings (
  id, hotel_id, guest_name, guest_phone, address,
  id_type, id_number, gender, dob, room_id, room_type,
  check_in_date, check_out_date, nights, rate_per_night,
  total_amount, payment_mode, status, rate_locked, created_at
)

push_subscriptions (
  id, hotel_id, role, endpoint UNIQUE,
  p256dh, auth, subscription JSONB, created_at
)
```

All tables: RLS enabled, open policies (app PIN se authenticate karta hai).

---

## 🎨 Design System

### Colors
```css
--bg:          #07090E   /* Deep space black */
--gold:        #D4AF37   /* Liquid gold — primary accent */
--blue:        #008cff   /* Neon cyber blue */
--blue-soft:   #38bdf8   /* AI agent nodes */
--green:       #22c55e   /* Network online / vacant */
--red:         #ef4444   /* Occupied / error */
--amber:       #f59e0b   /* Reserved */
--indigo:      #818cf8   /* Cleaning */
```

### Canvas Node Colors
```
👤 GUEST    → #22c55e  (green)
🏨 HOTEL    → #D4AF37  (gold)
⬡ AI·AGENT → #38bdf8  (sky blue)
```

---

## 📱 PWA Installation

**Android (Chrome):** Browser menu → "Add to Home Screen" → Install

**iOS (Safari):** Share → "Add to Home Screen" → Add

**Icon files (exact filenames — manifest.json se match karna zaroori):**
```
/public/icons/apple-touch-icon.png  → 180×180
/public/icons/icon-192.png          → 192×192
/public/icons/icon-512.png          → 512×512
```

---

## 🛠️ Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14.2 (App Router) |
| UI | React 18 + Tailwind CSS + inline styles |
| AI Chat | Groq SDK — llama-3.3-70b-versatile |
| AI Vision | Groq — meta-llama/llama-4-scout-17b (ID scan) |
| Database | Supabase (PostgreSQL) |
| Offline | localStorage hybrid |
| Charts | Recharts (AreaChart) |
| Icons | Lucide React |
| Push | web-push (VAPID) + Service Worker |
| Email | Resend API |
| Voice | Web Speech API (hi-IN) |
| Canvas | HTML5 Canvas 2D (live network animation) |
| PWA | next-pwa |
| Deploy | Vercel — bom1 (Mumbai) |

---

## 🐛 Common Issues

| Error | Fix |
|---|---|
| AI chat "Network issue" | `MY_GROQ_KEY` Vercel mein set karo |
| Voice search kaam nahi karta | Chrome use karo + mic permission allow karo |
| Hotel cards kuch nahi dikhte | `MarketplaceHotels.js` ka latest version use karo |
| "View Hotel" page nahi khulta | `MarketplaceHotels.js` mein `useRouter` + `hotel.id` check karo |
| NegotiatorOrb "Kaunsi city?" poochhta hai | `page.js` ka latest version — `pendingSearchQuery` state |
| Rates Settings se match nahi | `db.js` — `normalizeConfig()` dono formats save karta hai |
| Push notification nahi aati | `web-push` npm + VAPID keys in Vercel |
| Booking page scroll nahi hoti | `globals.css` — `app-locked` class pattern follow karo |
| `Module not found: web-push` | `npm install` dobara run karo |
| PWA icon nahi dikh raha | `manifest.json` mein exact filenames check karo |

---

## 🚀 Deployment Checklist

```
□ .env.local — sab required vars set hain
□ supabase_schema.sql — SQL Editor mein run ho gaya
□ Vercel — environment variables add ki hain
□ package.json — web-push: "^3.6.7" hai
□ manifest.json — correct icon filenames
□ layout.js — apple-touch-icon sahi path
□ globals.css — overflow:hidden nahi, sirf body.app-locked mein
□ VAPID keys — generate ho gayi, Vercel mein set hain
```

---

## 📞 Support

**Platform:** The GuestInn Network v2.0
**Stack:** Groq AI · Supabase · Vercel · Next.js
**Deploy Region:** bom1 (Mumbai)

---

<div align="center">
<strong>Made with ❤️ for Independent Indian Hotels</strong><br/>
<em>No OTA commission. No monthly fees. Your hotel, your data.</em>
</div>
