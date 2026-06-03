# 🍒 AI Receptionist — Hotel Management System

> **AI-powered hotel management PWA** — multi-hotel support, guest check-in with ID scanner, real-time room tracking, GST billing, push notifications, and an in-room guest companion. Built with Next.js 14, Supabase, and Groq AI.

---

## 📸 Screenshots

| Booking Page | Dashboard | In-Room Companion |
|---|---|---|
| Visual room allocator + AI ID scanner | Live revenue + room occupancy grid | Room service, food order, Sandy AI |

---

## ✨ Features

### 🏨 Multi-Hotel Architecture
- Each hotel gets a unique login link: `/h/[hotelId]`
- Owner + Manager roles with PIN-based auth
- Per-hotel isolated data (localStorage + Supabase RLS)
- Hotel registry with plan tiers: Free / Starter / Pro / Enterprise

### 📋 Booking Flow
- **Public booking page** (`/booking/[hotelId]`) — guests book directly from hotel's shareable link
- **Manager booking** (ScannerView) — staff scans Aadhaar/PAN/Passport, form auto-fills via Groq Vision
- Both flows use the same `createBooking()` — consistent localStorage + Supabase sync
- Visual Room Allocator — tap to select room, live availability color coding

### 🤖 AI Features
- **Sandy** — AI Concierge chatbot on booking page (Groq `llama-3.3-70b-versatile`)
- **AI ID Scanner** — camera scan of Aadhaar/PAN/Passport → auto-fill guest form
- **AI Insight** — operational analytics and demand forecasting (`/api/insight`)
- **NegotiatorOrb** — Sandy can negotiate room rates with guests

### 📊 Dashboard (Manager/Owner)
- Live revenue card with daily comparison
- Room occupancy grid with status colors (Occupied / Reserved / Vacant / Out of Order)
- Guest check-in queue, maintenance alerts, housekeeping status
- Real-time sync via `BroadcastChannel` — instant update across all open tabs

### 👥 Guests Page
- All active + checked-out guests in one view
- One-tap checkout with confirmation
- Filters: All / Active / Checked Out

### 📈 Reports Page
- 7-day revenue chart
- Total revenue, total nights, average rate
- CSV export

### 🛎️ In-Room Companion (`/booking/[hotelId]` post-booking)
- Tabs: Sandy (AI chat), Food Order, Room Service, Front Desk
- Room service requests → push notification to staff dashboard
- Wi-Fi password display, wake-up call, DND, bill request

### 🔔 Push Notifications
- Web Push via VAPID (uses `web-push` library)
- Staff gets notified: new booking, room service requests
- Service requests logged to Supabase `service_requests` table

---

## 🗂️ Project Structure

```
ai-receptionist/
├── app/
│   ├── page.js                        # Landing page (marketplace + hero search)
│   ├── layout.js                      # Root layout, PWA meta
│   ├── dashboard/
│   │   └── page.js                    # Main manager/owner dashboard shell
│   ├── booking/
│   │   └── [hotelId]/page.js          # Public guest booking page
│   ├── h/
│   │   └── [hotelId]/page.js          # Direct hotel login (staff link)
│   └── api/
│       ├── groq/route.js              # Groq AI proxy (chat + ID scan)
│       ├── push/route.js              # Web push: subscribe / send / service logs
│       ├── alerts/route.js            # Booking alert emails (Resend)
│       ├── insight/route.js           # AI operational insights
│       └── marketplace/search/route.js # Hotel search API
│
├── components/
│   ├── DashboardView.js               # Home tab — revenue, rooms, quick actions
│   ├── ScannerView.js                 # Bookings tab — new booking + ID scan
│   ├── GuestsView.js                  # Guests tab — active/checked-out list
│   ├── ReportsView.js                 # Reports tab — revenue charts + CSV
│   ├── SettingsView.js                # Settings tab — hotel config, VAPID setup
│   ├── LoginScreen.js                 # Hotel selection + PIN auth
│   ├── MarketplaceHotels.js           # Landing page hotel cards
│   ├── HeroSearchSection.js           # Landing page AI search bar
│   ├── AdvantageGrid.js               # Landing page feature highlights
│   └── NegotiatorOrb.js              # Sandy AI rate negotiator (booking page)
│
├── lib/
│   ├── db.js                          # Primary data layer (localStorage + Supabase hybrid)
│   ├── db.supabase.js                 # Pure Supabase drop-in replacement for db.js
│   ├── hotelConfig.js                 # Hotel config helpers and defaults
│   ├── alerts.js                      # Booking alert dispatch (push + email)
│   └── usePushNotifications.js        # React hook for push subscription
│
├── public/
│   ├── manifest.json                  # PWA manifest
│   ├── sw.js                          # Service worker (next-pwa generated)
│   └── icons/                         # PWA icons (192, 512, apple-touch)
│
├── vercel.json                        # Vercel config (region: bom1 — Mumbai)
└── package.json
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| UI | React 18, Tailwind CSS, Lucide React |
| Charts | Recharts |
| Database | Supabase (PostgreSQL + RLS) |
| AI | Groq API (`llama-3.3-70b-versatile`) |
| Push | Web Push (VAPID) via `web-push` |
| Email | Resend API |
| PWA | `next-pwa` |
| Hosting | Vercel (Mumbai region) |
| Local cache | localStorage (offline-first, syncs to Supabase) |

---

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/muahshi/ai-receptionist.git
cd ai-receptionist
npm install
```

### 2. Environment Variables

Create `.env.local` in root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Groq AI
MY_GROQ_KEY=gsk_xxxxxxxxxxxxxxxxxxxx

# Web Push (VAPID) — generate karo: npx web-push generate-vapid-keys
NEXT_PUBLIC_VAPID_PUBLIC_KEY=Bxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VAPID_PRIVATE_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VAPID_SUBJECT=mailto:your@email.com

# Email alerts (optional)
RESEND_API_KEY=re_xxxxxxxxxxxx
```

**VAPID keys generate karo:**
```bash
npx web-push generate-vapid-keys
```

### 3. Supabase Setup

Supabase dashboard mein yeh tables banao:

```sql
-- Hotels table
create table hotels (
  id           text primary key,
  name         text not null,
  location     text,
  total_rooms  int default 20,
  standard_rate int default 1200,
  deluxe_rate  int default 2000,
  suite_rate   int default 3800,
  checkout_time text default '11:00',
  gst_percent  int default 12,
  amenities    text[],
  plan         text default 'free',
  owner_email  text,
  manager_phone text,
  owner_pin    text default '1234',
  manager_pin  text default '0000',
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- Bookings table
create table bookings (
  id              text primary key,
  hotel_id        text references hotels(id),
  guest_name      text,
  guest_phone     text,
  address         text,
  id_type         text default 'Aadhaar',
  id_number       text,
  gender          text,
  dob             text,
  room_id         text,
  room_number     int,
  room_type       text default 'standard',
  check_in_date   text,
  check_out_date  text,
  nights          int default 1,
  rate_per_night  int default 0,
  total_amount    int default 0,
  payment_mode    text default 'Cash',
  status          text default 'active',
  rate_locked     boolean default true,
  negotiated      boolean default false,
  negotiated_from int default 0,
  source          text default 'direct',
  created_at      timestamptz default now()
);

-- Rooms table
create table rooms (
  id                  text primary key,
  hotel_id            text references hotels(id),
  number              int,
  floor               int default 1,
  type                text default 'standard',
  status              text default 'vacant',
  base_rate           int default 1200,
  current_booking_id  text,
  guest_name          text,
  updated_at          timestamptz default now()
);

-- Service requests table (room service + push logs)
create table service_requests (
  id          text primary key default gen_random_uuid()::text,
  hotel_id    text references hotels(id),
  room_number text,
  guest_name  text,
  type        text,
  action_id   text,
  title       text,
  body        text,
  status      text default 'pending',
  created_at  timestamptz default now()
);

-- Push subscriptions table
create table push_subscriptions (
  id         text primary key default gen_random_uuid()::text,
  hotel_id   text references hotels(id),
  endpoint   text unique,
  p256dh     text,
  auth       text,
  created_at timestamptz default now()
);
```

**RLS Policies** (har table pe):
```sql
-- Hotels: anon read allowed (for booking page)
alter table hotels enable row level security;
create policy "public read" on hotels for select using (true);
create policy "anon insert" on hotels for insert with check (true);
create policy "anon update" on hotels for update using (true);

-- Bookings: hotel_id match
alter table bookings enable row level security;
create policy "anon all" on bookings for all using (true) with check (true);

-- Rooms: anon all
alter table rooms enable row level security;
create policy "anon all" on rooms for all using (true) with check (true);

-- Service requests
alter table service_requests enable row level security;
create policy "anon all" on service_requests for all using (true) with check (true);

-- Push subscriptions
alter table push_subscriptions enable row level security;
create policy "anon all" on push_subscriptions for all using (true) with check (true);
```

### 4. Run Locally

```bash
npm run dev
# Open http://localhost:3000
```

---

## 📦 Deploy to Vercel

```bash
# Vercel CLI se
npm i -g vercel
vercel

# Ya GitHub se auto-deploy
# Vercel dashboard → New Project → Import repo
# Environment variables add karo (Settings → Environment Variables)
```

Vercel config (`vercel.json`) already set hai — Mumbai region (`bom1`), security headers included.

---

## 🔑 Key URLs

| URL | Purpose |
|---|---|
| `/` | Landing page — hotel marketplace |
| `/h/[hotelId]` | Direct hotel staff login (share with team) |
| `/booking/[hotelId]` | Public guest booking page |
| `/dashboard` | Manager/Owner dashboard (after login) |

---

## 🏗️ Data Flow

```
Guest books (/booking/[hotelId])
  └── saveBooking()
        ├── localStorage write  (air_${hotelId}_bookings)
        ├── createBooking() from lib/db.js
        │     ├── Supabase insert (bookings table)
        │     └── updateRoomStatus() → rooms table
        └── BroadcastChannel("air_hotel_sync")
              └── Dashboard / Guests / Reports tabs → instant refresh

Manager books (ScannerView)
  └── createBooking() from lib/db.js
        ├── localStorage write
        ├── Supabase insert
        ├── updateRoomStatus()
        └── BroadcastChannel → all tabs refresh

Room Service (In-Room Companion)
  └── POST /api/push { action: "send" }
        ├── Supabase → service_requests table
        └── Web Push → staff browser notification
```

---

## 🧩 lib/db.js — Data Layer

`lib/db.js` is the core data layer — **offline-first** with Supabase background sync:

- All reads check localStorage first (instant), then Supabase (fresh)
- All writes go to localStorage immediately, Supabase in background
- `BroadcastChannel("air_hotel_sync")` — real-time cross-tab sync (same tab + other tabs)
- `onHotelUpdate(cb)` — subscribe to any hotel data change
- `broadcastUpdate(type, hotelId)` — dispatch update event

**Key functions:**

```js
createBooking(hotelId, bookingData)   // New booking — localStorage + Supabase
getBookings(hotelId)                  // Async — Supabase first, localStorage fallback
getBookingsSync(hotelId)              // Sync — localStorage only (instant)
checkoutBooking(hotelId, bookingId)   // Checkout + room status update
updateRoomStatus(hotelId, roomId, status, bookingId, guestName)
getRooms(hotelId, totalRooms)         // Room grid data
getHotelConfig(hotelId)              // Hotel settings
getAllHotels()                        // Hotel registry (for marketplace)
broadcastUpdate(type, hotelId)        // Trigger cross-tab refresh
onHotelUpdate(callback)              // Subscribe to updates
```

---

## 🌐 API Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/groq` | POST | Groq AI proxy — chat + ID scan |
| `/api/push` | POST | Push subscribe / unsubscribe / send notification |
| `/api/alerts` | POST | Booking confirmation email via Resend |
| `/api/insight` | POST | AI-powered operational insights |
| `/api/marketplace/search` | GET | Hotel search for landing page |

---

## 📱 PWA Setup

App is installable as a PWA on Android/iOS:
- `public/manifest.json` — app name, icons, theme
- `next-pwa` handles service worker generation
- Offline support via SW caching
- Add to Home Screen → standalone mode (no browser chrome)

---

## 🔐 Auth Flow

```
/h/[hotelId]  →  Hotel loaded from Supabase
               →  Role select: Manager / Owner
               →  PIN entry (owner_pin / manager_pin from hotels table)
               →  On success: localStorage session + redirect to /dashboard
```

Default PINs (change in Settings after first login):
- Manager: `0000`
- Owner: `1234`

---

## 🤝 Contributing

```bash
# Feature branch banao
git checkout -b feature/your-feature

# Commit
git commit -m "feat: your feature description"

# Push
git push origin feature/your-feature
```

---

## 📄 License

Private — All rights reserved © 2025
