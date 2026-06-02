<div align="center">

# 🏨 The GuestInn Network

### India ka AI-Powered, Commission-Free Smart Hotel Operating System

**AI Powered · Offline-First · Commission Free · PWA Ready**

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=nextdotjs)](https://nextjs.org)
[![Groq AI](https://img.shields.io/badge/Groq-Llama_3.3_70b-orange)](https://groq.com)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?logo=supabase)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com)
[![PWA](https://img.shields.io/badge/PWA-Installable-blue)](https://web.dev/progressive-web-apps)
[![License](https://img.shields.io/badge/License-Private-red)](/)

[🌐 Live Demo](https://ai-receptionist-sandy-six.vercel.app) · [📱 Guest Companion](https://ai-receptionist-sandy-six.vercel.app/booking/cherry-bhopal) · [🔐 Staff Login](https://ai-receptionist-sandy-six.vercel.app)

</div>

---

## 📖 Table of Contents

- [Kya Hai Yeh?](#-kya-hai-yeh)
- [Architecture Overview](#-architecture-overview)
- [Feature Phases](#-feature-phases)
- [Project Structure](#-project-structure)
- [Tech Stack](#-tech-stack)
- [Database Schema](#-database-schema)
- [Environment Variables](#-environment-variables)
- [Local Setup](#-local-setup)
- [Deployment (Vercel)](#-deployment-vercel)
- [Data Flow](#-data-flow)
- [API Reference](#-api-reference)
- [Multi-Tenant Architecture](#-multi-tenant-architecture)
- [PWA & Push Notifications](#-pwa--push-notifications)
- [Demo Hotels](#-demo-hotels)

---

## ✨ Kya Hai Yeh?

**The GuestInn Network** ek dual-layer platform hai jo hotels ke liye India-first experience deliver karta hai — bina kisi OTA commission ke.

### 🌐 Layer 1 — Marketplace (Guest-Facing)
Koi bhi traveler hotels browse kar sakta hai, **Sandy AI Negotiator** se rate negotiate kar sakta hai, aur seedha book kar sakta hai. Koi Booking.com nahi, koi MakeMyTrip nahi — hotel apna full revenue rakhta hai.

### 🏨 Layer 2 — Hotel Management System (Staff-Facing)
Har registered hotel ko milta hai ek complete PMS — AI-powered ID scanner, real-time room grid, push notifications, GRC-compliant guest records, revenue analytics, aur ab ek fully automated **Guest Digital Companion**.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                 THE GUESTINN NETWORK                    │
├────────────────────┬────────────────────────────────────┤
│  MARKETPLACE LAYER │      HOTEL MANAGEMENT LAYER        │
│  (Guest-Facing)    │      (Staff-Facing)                │
│                    │                                    │
│  app/page.js       │  app/dashboard/page.js             │
│  ↓                 │  ↓                                 │
│  HeroSearchSection │  LoginScreen → DashboardView       │
│  MarketplaceHotels │  ScannerView (AI ID Scan)          │
│  NegotiatorOrb     │  GuestsView (GRC Records)          │
│  (Sandy AI)        │  SettingsView (Hotel Config)       │
├────────────────────┴────────────────────────────────────┤
│              SHARED INFRASTRUCTURE                      │
│                                                         │
│  lib/db.js          — localStorage + Supabase hybrid   │
│  lib/alerts.js      — WhatsApp + Email + Push           │
│  app/api/groq/      — Groq Llama 3.3 70b               │
│  app/api/push/      — Web Push (VAPID)                  │
│  app/api/alerts/    — Resend Email                      │
├─────────────────────────────────────────────────────────┤
│              GUEST DIGITAL COMPANION                    │
│                                                         │
│  app/booking/[hotelId]/page.js                          │
│  ↓ Tabs: Sandy AI · Food Order · Room Service · Call    │
└─────────────────────────────────────────────────────────┘
```

### Offline-First Hybrid Pattern

```
User Action
    │
    ▼
localStorage (instant, always works)
    │
    ▼ (background, non-blocking)
Supabase PostgreSQL (cloud sync)
```

Data localStorage mein pehle save hota hai — internet nahi hai tab bhi kaam karta hai. Supabase mein background sync hoti hai.

---

## 🚀 Feature Phases

Yeh project 5 phases mein build kiya gaya hai:

### ✅ Phase 1 — Dynamic Hotel Configurations
**`components/SettingsView.js` · `lib/db.js` · `lib/db.supabase.js`**

Hotel owners ab in-app configure kar sakte hain:
- 📶 **Wi-Fi Password** — guests ko automatically share hota hai
- 🍽️ **Digital Menu** — URL ya plain-text menu items
- 📞 **Reception Contact Number** — Call Desk ke liye
- 🔧 **Service Toggles** — Housekeeping, Food Ordering, Call Desk enable/disable

Sab kuch `hotelConfig` object mein store hota hai (`air_[hotelId]_config` localStorage key + Supabase `hotels` table sync).

---

### ✅ Phase 2 — In-Room Guest Digital Companion
**`app/booking/[hotelId]/page.js`**

Guest booking page ab ek premium **In-Room Digital Companion** hai — 4 tabs:

| Tab | Feature |
|-----|---------|
| 🤖 **Sandy** | Groq-powered AI chat — Hinglish mein baat karo |
| 🍽️ **Food** | Restaurant menu browse karo + Sandy se order karo |
| 🧹 **Service** | Quick buttons — Clean Room, Water Bottle, AC Issue, etc. |
| 📞 **Call Desk** | `tel:` link se seedha reception ko call karo |

Wi-Fi password ek tap se copy hota hai. Service requests real-time staff dashboard pe push hote hain.

---

### ✅ Phase 3 — Groq AI System Context Injection
**`app/api/groq/route.js` · `components/NegotiatorOrb.js`**

Sandy ab hotel-specific queries handle karti hai:

- *"Wi-Fi ka password kya hai?"* → Turant answer
- *"Khana kaise order karein?"* → Menu items suggest karta hai
- *"Checkout time kya hai?"* → Hotel policy batata hai
- *"Room clean karwa sakte hain?"* → Service request trigger karta hai

`hotelConfig` (Wi-Fi, menu, rates, policy, amenities) Groq `systemOverride` prompt mein deep-inject hota hai. Sandy natural Hinglish mein respond karti hai.

---

### ✅ Phase 4 — Real-Time Service Alerts & Staff Dashboard
**`components/DashboardView.js` · `app/api/push/route.js`**

Guest koi bhi service request kare — staff ko turant pata chalta hai:

- **Web Push Notification** — staff ke browser/phone pe
- **Audio Chime** — Web Audio API se distinctive alert sound
- **Live Alert Modal** — Dashboard pe flashing "Live Service Alert"
- **Room Grid Color Change** — Indigo (Cleaning) / Amber (Alert) state

Request types: `housekeeping` · `food_order` · `maintenance` · `water` · `ac_issue`

---

### ✅ Phase 5 — Automated Welcome Kit (Current)
**`lib/alerts.js` · `app/api/alerts/route.js` · `components/ScannerView.js`**

Check-in complete hote hi guest ko automatically milta hai:

**WhatsApp Welcome Message** (`wa.me` deep link):
- Room number + stay dates
- Digital Companion direct URL
- Wi-Fi password
- Reception contact

**Email Welcome Kit** (Resend via `/api/alerts`):
- Premium dark-gold HTML design
- Clickable "Open Room Companion →" button
- Wi-Fi password block
- Service icons grid (Food / Housekeeping / Sandy AI / Call Desk)
- Only agar `RESEND_API_KEY` configured ho

**`sendWelcomeKit(booking, cfgOverride)`** — `lib/alerts.js` se export, `ScannerView.js` mein check-in ke baad call hota hai (non-blocking).

---

## 📁 Project Structure

```
ai-receptionist/
│
├── app/
│   ├── page.js                      # Marketplace homepage
│   │                                # HeroSearchSection + MarketplaceHotels + NegotiatorOrb
│   ├── layout.js                    # Root layout — PWA meta, fonts, apple-touch-icon
│   ├── globals.css                  # Global styles — scroll architecture, animations
│   │
│   ├── booking/[hotelId]/page.js    # 🌟 Guest Digital Companion (Phases 2+3+5)
│   │                                # Tabs: Sandy · Food · Service · Call Desk
│   │                                # Standalone — does NOT import lib/db.js
│   │
│   ├── dashboard/page.js            # Staff hotel management app
│   ├── h/[hotelId]/page.js          # Staff direct login shortcut URL
│   │
│   └── api/
│       ├── groq/route.js            # AI Engine — id_scan | chat | negotiate | ai_insight
│       ├── alerts/route.js          # Email via Resend (email + welcome-kit types)
│       ├── push/route.js            # Push notifications — subscribe | send | unsubscribe
│       ├── insight/route.js         # AI revenue insights endpoint
│       └── marketplace/
│           └── search/route.js      # Marketplace hotel search API
│
├── components/
│   ├── NegotiatorOrb.js             # 🤖 Sandy AI floating chat panel (Groq, Hinglish)
│   ├── HeroSearchSection.js         # Marketplace hero — live neural canvas, voice search
│   ├── MarketplaceHotels.js         # Hotel listing cards → /booking/[hotelId]
│   ├── AdvantageGrid.js             # Feature benefits section
│   ├── DashboardView.js             # 📊 Staff dashboard — room grid, revenue, push alerts
│   ├── ScannerView.js               # 📷 AI ID scanner + booking form + welcome kit trigger
│   ├── GuestsView.js                # Guest list + GRC-compliant print records
│   ├── ReportsView.js               # Revenue charts (Recharts) + history
│   ├── SettingsView.js              # Hotel settings — rates, Wi-Fi, menu, toggles
│   └── LoginScreen.js               # Hotel selector + PIN authentication
│
├── lib/
│   ├── db.js                        # 🗄️ SINGLE SOURCE OF TRUTH — all data operations
│   │                                # localStorage primary + Supabase background sync
│   ├── db.supabase.js               # Supabase-specific helpers
│   ├── hotelConfig.js               # Hotel config read/write helpers
│   ├── alerts.js                    # 📢 sendBookingAlerts() + sendWelcomeKit()
│   └── usePushNotifications.js      # React hook — VAPID subscribe/unsubscribe + audio
│
├── public/
│   ├── sw-push.js                   # Service Worker — push event handler
│   ├── manifest.json                # PWA manifest
│   └── icons/                       # PWA icons (192px, 512px, apple-touch)
│
├── supabase_schema.sql              # 🗃️ Complete DB schema — run in Supabase SQL Editor
├── next.config.js                   # Next.js + next-pwa config
├── vercel.json                      # Vercel deployment config (region: bom1)
├── tailwind.config.js
└── package.json
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 14 App Router | Full-stack React framework |
| **Styling** | TailwindCSS 3 | Utility-first CSS |
| **UI Icons** | Lucide React | Consistent icon set |
| **Charts** | Recharts | Revenue visualization |
| **AI** | Groq (Llama 3.3 70b) | Sandy AI — chat, ID scan, negotiation |
| **Database** | Supabase (PostgreSQL) | Cloud persistence + RLS |
| **Local DB** | localStorage | Offline-first primary store |
| **Email** | Resend | Booking alerts + welcome kit |
| **Push** | Web Push (VAPID) + web-push npm | Real-time staff notifications |
| **PWA** | next-pwa | Installable mobile app |
| **Hosting** | Vercel (region: bom1) | Edge deployment, Mumbai region |

---

## 🗃️ Database Schema

Supabase mein 3 tables hain. `supabase_schema.sql` run karo Supabase SQL Editor mein.

### `hotels` Table
```sql
id                TEXT PRIMARY KEY        -- slug: "cherry-bhopal"
name              TEXT                    -- "Hotel Cherry"
location          TEXT                    -- "Bhopal, Madhya Pradesh"
total_rooms       INTEGER DEFAULT 20
plan              TEXT                    -- starter | pro | enterprise
owner_pin         TEXT                    -- staff login PIN
manager_pin       TEXT
owner_phone       TEXT                    -- WhatsApp alerts
manager_phone     TEXT
owner_email       TEXT
standard_rate     INTEGER DEFAULT 1200
deluxe_rate       INTEGER DEFAULT 2000
suite_rate        INTEGER DEFAULT 3800

-- Phase 1: Guest Services fields
wifi_password        TEXT DEFAULT ''
menu_url             TEXT DEFAULT ''
menu_text            TEXT DEFAULT ''
reception_phone      TEXT DEFAULT ''
enable_wifi          BOOLEAN DEFAULT TRUE
enable_food_ordering BOOLEAN DEFAULT TRUE
enable_housekeeping  BOOLEAN DEFAULT TRUE
enable_call_desk     BOOLEAN DEFAULT TRUE

-- Marketplace fields
city_slug         TEXT                    -- "bhopal" — URL routing
min_floor_price   INTEGER DEFAULT 800    -- AI negotiator hard floor
is_featured       BOOLEAN DEFAULT FALSE
address_line      TEXT
distance_tag      TEXT                    -- "900m from Bus Stand"
amenities         TEXT[]
avg_rating        NUMERIC(3,2)
latitude          NUMERIC(10,7)
longitude         NUMERIC(10,7)
is_active         BOOLEAN DEFAULT TRUE
```

### `bookings` Table
```sql
id               TEXT PRIMARY KEY
hotel_id         TEXT → hotels(id)
guest_name       TEXT
guest_phone      TEXT
id_type          TEXT    -- Aadhaar | Passport | DL
id_number        TEXT    -- stored as "[Redacted]" in audit logs
room_id          TEXT
room_type        TEXT    -- standard | deluxe | suite
check_in_date    TEXT
check_out_date   TEXT
nights           INTEGER
rate_per_night   NUMERIC
total_amount     NUMERIC
payment_mode     TEXT    -- Cash | Card | UPI
status           TEXT    -- active | checked_out | cancelled
rate_locked      BOOLEAN DEFAULT TRUE
negotiated       BOOLEAN -- TRUE = Sandy AI ne rate set kiya
negotiated_from  NUMERIC -- original rate before negotiation
extra_guests     JSONB   -- [{guestName, idType, ...}]
source           TEXT    -- direct | marketplace | walkin
```

### `push_subscriptions` Table
```sql
id           BIGSERIAL PRIMARY KEY
hotel_id     TEXT
role         TEXT DEFAULT 'staff'
endpoint     TEXT UNIQUE           -- browser push endpoint
p256dh       TEXT
auth         TEXT
subscription TEXT                  -- full JSON subscription object
```

---

## 🔐 Environment Variables

`.env.local` file create karo project root mein:

```env
# ── Groq AI (Required) ─────────────────────────────────────────
MY_GROQ_KEY=gsk_xxxxxxxxxxxxxxxxxxxx
# Get from: https://console.groq.com

# ── Supabase (Required for cloud sync) ─────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# Get from: Supabase Dashboard → Project Settings → API

# ── Resend Email (Optional — Phase 5 Welcome Kit) ──────────────
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
# Get from: https://resend.com → Free: 100 emails/day
# Without this key: emails are logged to console (app still works)

# ── Web Push / PWA Notifications (Required for Push) ───────────
NEXT_PUBLIC_VAPID_PUBLIC_KEY=Bxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VAPID_PRIVATE_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VAPID_SUBJECT=mailto:admin@theguestinn.com
# Generate VAPID keys: npx web-push generate-vapid-keys

# ── Single-Hotel Mode (Optional) ───────────────────────────────
# Sirf tab use karo agar ek hi hotel hai system mein
NEXT_PUBLIC_HOTEL_NAME=Hotel Cherry
NEXT_PUBLIC_HOTEL_TOTAL_ROOMS=20
NEXT_PUBLIC_OWNER_PHONE=919009109108
NEXT_PUBLIC_OWNER_PIN=4567
NEXT_PUBLIC_MANAGER_PIN=8901
```

> **Note:** `NEXT_PUBLIC_` prefix wale variables browser mein expose hote hain. Secret keys (Groq, Resend, VAPID Private) ko kabhie `NEXT_PUBLIC_` mat karo.

---

## 💻 Local Setup

### Prerequisites
- Node.js 18+
- npm / yarn

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/your-org/ai-receptionist.git
cd ai-receptionist

# 2. Install dependencies
npm install

# 3. Environment setup
cp .env.example .env.local
# .env.local mein apni keys fill karo (above table dekho)

# 4. Supabase schema setup (optional but recommended)
# Supabase Dashboard → SQL Editor → supabase_schema.sql paste karo → Run

# 5. VAPID keys generate karo (agar push notifications chahiye)
npx web-push generate-vapid-keys
# Output ko .env.local mein paste karo

# 6. Dev server start karo
npm run dev
# → http://localhost:3000
```

### Supabase ke Bina (Offline Mode)
Supabase configure nahi hai? App fully functional hai — sab kuch localStorage mein store hota hai. Supabase keys nahi hain to cloud sync disable ho jaata hai, baaki sab kaam karta hai.

---

## 🚀 Deployment (Vercel)

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-org/ai-receptionist)

### Manual Deploy

```bash
# Vercel CLI se deploy
npm i -g vercel
vercel --prod
```

### Vercel Environment Variables

Vercel Dashboard → Project → Settings → Environment Variables mein yeh sab add karo:

| Variable | Required | Notes |
|----------|---------|-------|
| `MY_GROQ_KEY` | ✅ Yes | Sandy AI ke liye |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Yes | Cloud sync |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Yes | Cloud sync |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | ✅ Yes | Push notifications |
| `VAPID_PRIVATE_KEY` | ✅ Yes | Push notifications |
| `VAPID_SUBJECT` | ✅ Yes | Push notifications |
| `RESEND_API_KEY` | ⚡ Optional | Welcome kit emails |

`vercel.json` mein region `bom1` (Mumbai) set hai — Indian users ke liye fastest latency.

---

## 🔄 Data Flow

### Check-In Flow (ScannerView → Alerts)

```
Staff scans Guest ID (Camera → Groq Vision API)
    ↓
Form review + Room selection + Rate lock
    ↓
createBooking() → lib/db.js
    ├── localStorage (instant)
    └── Supabase (background sync)
    ↓
sendBookingAlerts(booking)          ← lib/alerts.js
    ├── Owner WhatsApp (wa.me)
    ├── Manager WhatsApp (wa.me)
    ├── Guest WhatsApp (booking confirmation)
    ├── Push Notification (staff PWA)
    └── Owner + Manager Email (Resend)
    ↓
sendWelcomeKit(booking)             ← Phase 5
    ├── Guest WhatsApp (companion link + Wi-Fi)
    └── Guest Email (HTML welcome kit via Resend)
```

### Guest Service Request Flow (Phase 4)

```
Guest taps "Clean My Room" (booking/[hotelId]/page.js)
    ↓
POST /api/push { action: "send", hotelId, payload }
    ↓
web-push → Staff browser Service Worker
    ↓
DashboardView.js:
    ├── Audio chime (Web Audio API)
    ├── Live Alert Modal flash
    └── Room grid cell → Indigo (cleaning) state
```

### AI Chat Flow (Phase 3)

```
Guest types in Sandy chat (NegotiatorOrb.js)
    ↓
POST /api/groq { type: "chat", messages, systemOverride, hotelId }
    ↓
groq/route.js:
    ├── Fetch hotelConfig (Wi-Fi, menu, policy, rates)
    ├── Build system prompt with hotel context
    └── Groq Llama 3.3 70b → Hinglish response
    ↓
Response rendered in chat UI
```

---

## 📡 API Reference

### `POST /api/groq`

Sandy AI aur ID scan ke liye.

```json
// Chat request
{
  "type": "chat",
  "messages": [{ "role": "user", "content": "Wi-Fi password kya hai?" }],
  "hotelId": "cherry-bhopal",
  "systemOverride": "Optional custom system prompt"
}

// ID Scan request
{
  "type": "id_scan",
  "imageBase64": "data:image/jpeg;base64,...",
  "side": "front"
}

// Rate Negotiation
{
  "type": "negotiate",
  "askingRate": 1500,
  "floorPrice": 900,
  "hotelId": "cherry-bhopal"
}
```

---

### `POST /api/alerts`

Email bhejne ke liye (Resend).

```json
// Standard check-in alert (to staff/owner)
{
  "type": "email",
  "to": ["owner@hotel.com"],
  "subject": "New Check-in Alert",
  "booking": { ...bookingObject }
}

// Phase 5: Welcome Kit (to guest)
{
  "type": "welcome-kit",
  "to": ["guest@email.com"],
  "subject": "Aapka Digital Companion Ready Hai!",
  "booking": {
    "guestName": "Rahul Sharma",
    "roomId": "cherry-bhopal_R001",
    "companionUrl": "https://theguestinn.com/booking/cherry-bhopal?room=cherry-bhopal_R001",
    "wifiPassword": "cherry@2024",
    "receptionPhone": "919009109108",
    "enableWifi": true,
    "enableFoodOrdering": true,
    "enableHousekeeping": true
  }
}
```

---

### `POST /api/push`

PWA push notifications ke liye.

```json
// Subscribe
{ "action": "subscribe", "hotelId": "cherry-bhopal", "role": "staff", "subscription": {...} }

// Send notification
{
  "action": "send",
  "hotelId": "cherry-bhopal",
  "payload": {
    "title": "🧹 Room Service Request",
    "body": "Room 101 — Clean My Room",
    "tag": "service-request-001",
    "sound": true
  }
}

// Unsubscribe
{ "action": "unsubscribe", "hotelId": "cherry-bhopal", "endpoint": "https://..." }
```

---

## 🏢 Multi-Tenant Architecture

Har hotel completely isolated hai:

### localStorage Keys (per hotel)
```
air_{hotelId}_config     → Hotel settings, Wi-Fi, menu, rates
air_{hotelId}_rooms      → Room grid state
air_{hotelId}_bookings   → Booking records
air_hotel_registry       → Registered hotels list
air_active_hotel         → Currently logged-in hotel
```

### Supabase Isolation
- `hotels` table: `id` = hotel slug (primary key)
- `bookings` table: `hotel_id` foreign key — all queries scoped
- `push_subscriptions`: `hotel_id` se filter — sirf apni hotel ke notifications

### Staff Authentication
PIN-based login — `ownerPin` ya `managerPin` from hotel config. Production mein JWT claims se RLS tighten karo.

### `sendBookingAlerts` Safety
```js
// hotelId verify hota hai PEHLE
const cfg = getHotelConfig(hid);  // strictly scoped to hotelId

// Phone numbers validate hote hain — Indian format only
const ownerPhone = sanitizeIndianNumber(cfg?.ownerPhone);
// → 91XXXXXXXXXX format ya null
```

Cross-hotel data routing **impossible** hai by design.

---

## 📱 PWA & Push Notifications

App ek fully installable PWA hai.

### Install Karo (Mobile)
- Android Chrome: "Add to Home Screen" banner automatically aata hai
- iOS Safari: Share → "Add to Home Screen"

### Push Notifications Setup
```bash
# VAPID keys generate karo (ek baar)
npx web-push generate-vapid-keys

# Output:
# Public Key: Bxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# Private Key: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Dono keys .env.local + Vercel environment mein add karo
```

### Service Worker
`public/sw-push.js` — push events handle karta hai. next-pwa automatically register karta hai.

Staff dashboard mein 🔔 bell icon se push subscribe/unsubscribe hota hai.

---

## 🏨 Demo Hotels

In hotels se instantly test kar sakte ho:

| Hotel | ID | Location | Owner PIN | Manager PIN | Wi-Fi Password |
|-------|-----|---------|-----------|-------------|----------------|
| 🍒 Hotel Cherry | `cherry-bhopal` | Bhopal, MP | `4567` | `8901` | `cherry@2024` |
| 🌅 Hotel Sunrise Palace | `sunrise-jaipur` | Jaipur, RJ | `1234` | `5678` | `sunrise#jaipur` |
| 🏙️ Hotel Midtown | `midtown-indore` | Indore, MP | `2233` | `4455` | `midtown@456` |
| 🏨 City Comforts | `comforts-nagpur` | Nagpur, MH | `6677` | `8899` | `comforts2024` |
| 🏩 The Grand Inn | `grand-mumbai` | Mumbai, MH | `2345` | `6789` | `GrandMumbai#9` |

**Guest Companion URLs:**
```
https://ai-receptionist-sandy-six.vercel.app/booking/cherry-bhopal
https://ai-receptionist-sandy-six.vercel.app/booking/sunrise-jaipur
https://ai-receptionist-sandy-six.vercel.app/booking/grand-mumbai
```

**Staff Login Shortcut:**
```
https://ai-receptionist-sandy-six.vercel.app/h/cherry-bhopal
```

---

## 🗺️ Upcoming / Roadmap

- [ ] **Supabase Auth** — JWT-based staff login (PIN replace karo)
- [ ] **WhatsApp Business API** — Official integration (Twilio / Meta)
- [ ] **Multi-language** — Hindi, Gujarati, Marathi UI
- [ ] **Revenue Reports PDF** — Export + share
- [ ] **Marketplace Reviews** — Guest rating system
- [ ] **QR Code Check-in** — Room-specific QR for self check-in

---

## 🤝 Contributing

1. Fork karo
2. Feature branch banao (`git checkout -b feature/new-thing`)
3. Commit karo (`git commit -m 'Add new thing'`)
4. Push karo (`git push origin feature/new-thing`)
5. Pull Request open karo

---

## 📄 License

Private — The GuestInn Network. All rights reserved.

---

<div align="center">

**Built with ❤️ for Indian Hotels**

[The GuestInn Network](https://theguestinn.com) · Powered by Groq AI + Supabase + Next.js

</div>
