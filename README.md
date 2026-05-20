# 🏨 The GuestInn — AI-Powered Hotel Management SaaS

<div align="center">

![Version](https://img.shields.io/badge/version-1.2.0-gold?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase)
![Groq](https://img.shields.io/badge/Groq-AI-orange?style=for-the-badge)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?style=for-the-badge&logo=vercel)
![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=for-the-badge)

**An AI-first operating system for hotels, resorts, lodges, and serviced apartments.**

*Premium dark UI · Mobile PWA · Multi-tenant SaaS · Real-time AI insights*

</div>

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Live Demo](#-live-demo)
- [Screenshots](#-screenshots)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Database Setup](#-database-setup)
- [Demo Hotels](#-demo-hotels)
- [Multi-Tenant Architecture](#-multi-tenant-architecture)
- [Room Status System](#-room-status-system)
- [AI Features](#-ai-features)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)

---

## 🌟 Overview

**The GuestInn** is not a simple hotel dashboard — it is a full-featured **AI Hotel Operating System** that replaces traditional PMS (Property Management Systems) with a modern, mobile-first, AI-native platform.

Built for:
- 🏨 Hotels & Motels
- 🌴 Resorts & Villas
- 🛏️ Lodges & B&Bs
- 🏢 Serviced Apartments
- 🎒 Hostels

### What makes it different?

| Traditional PMS | The GuestInn |
|---|---|
| Desktop-only, heavy software | Mobile-first PWA |
| No AI features | AI Receptionist + Insights |
| Expensive per-seat licensing | SaaS multi-tenant |
| Complex UI | Premium dark UI, zero learning curve |
| Offline-only or cloud-only | Hybrid (localStorage + Supabase) |

---

## 🔗 Live Demo

```
https://ai-receptionist-sandy-six.vercel.app
```

**Demo Hotel Credentials:**

| Hotel | Hotel ID | Owner PIN | Manager PIN |
|---|---|---|---|
| Hotel Sunrise | `sunrise-jaipur` | `1234` | `5678` |
| The Grand Inn | `grand-mumbai` | `2345` | `6789` |
| Saffron Stays | `saffron-ahmedabad` | `3456` | `7890` |
| Hotel Cherry | `cherry-bhopal` | `4567` | `8901` |

---

## ✨ Features

### 🎛️ Dashboard
- **Live Revenue Counter** — real-time today's revenue with glowing gold sparkline chart
- **3D Isometric Room Grid** — futuristic room blocks with depth, glow, and status colors
- **Dynamic Grid Sizing** — auto-adjusts box size based on total rooms (5–120+)
- **AI SCAN Reactor** — holographic center button that triggers AI analysis
- **Quick Stats** — Guest Check-ins, Housekeeping, Maintenance, Reviews at a glance
- **AI Insights Card** — Groq-powered analysis with hologram building animation
- **Today's Check-ins** — live list of active bookings

### 🛏️ Room Management
- **5 Room Statuses**: Vacant · Occupied · Reserved · Cleaning · Out of Order
- **3D Block UI** — each room is an isometric 3D block with:
  - Person silhouette badge (SVG)
  - Status-colored glow
  - Glass sheen effect
  - Ambient underlight
- **Room Detail Modal** — full bottom sheet with:
  - Image gallery (supports multiple photos)
  - Room info (type, floor, rate, capacity)
  - Active guest details
  - Check-out / New Booking actions
- **Future-ready** — `room.images[]` support already built in

### 📋 Bookings
- New booking form with guest info, room selection, dates, payment mode
- Auto check-out with revenue tracking
- Booking history per hotel

### 📊 Reports
- 7-day revenue chart
- Occupancy trends
- Revenue by room type

### 🔐 Authentication
- PIN-based login (Owner PIN / Manager PIN)
- Role-based access (owner sees more than manager)
- Multi-hotel support — one account, multiple properties

### 📱 PWA (Progressive Web App)
- Install on iPhone / Android home screen
- Works offline (localStorage fallback)
- No app store needed

### 🤖 AI Receptionist
- Animated avatar with spinning gradient ring
- Audio visualizer bars (live status indicator)
- Groq AI-powered contextual insights
- Refreshes on demand via AI SCAN button

---

## 🛠️ Tech Stack

```
Frontend        → Next.js 14 (App Router) + React 18
Styling         → TailwindCSS + Inline CSS (premium dark theme)
Charts          → Recharts (AreaChart with custom glow)
Icons           → Lucide React
AI              → Groq SDK (llama3-70b-8192)
Database        → Supabase (PostgreSQL) + localStorage fallback
Auth            → PIN-based (custom, no OAuth)
Hosting         → Vercel
PWA             → next-pwa
```

---

## 📁 Project Structure

```
ai-receptionist/
├── app/
│   ├── api/
│   │   ├── groq/route.js          # AI insights API (Groq)
│   │   ├── insight/route.js       # Hotel insight endpoint
│   │   └── alerts/route.js        # Alert system
│   ├── booking/[hotelId]/page.js  # Guest-facing booking page
│   ├── h/[hotelId]/page.js        # Hotel-specific entry
│   ├── globals.css                # Global styles + all animations
│   ├── layout.js                  # Root layout with PWA metadata
│   └── page.js                    # Main app shell (header + nav + routing)
│
├── components/
│   ├── DashboardView.js           # ⭐ Main dashboard (3D grid, AI scan, charts)
│   ├── LoginScreen.js             # Hotel selector + PIN login
│   ├── ScannerView.js             # New booking form / OCR scanner
│   ├── ReportsView.js             # Analytics and reports
│   └── SettingsView.js            # Hotel settings
│
├── lib/
│   ├── db.js                      # Supabase + localStorage hybrid DB
│   ├── db.supabase.js             # Pure Supabase client
│   ├── hotelConfig.js             # Multi-tenant hotel config system
│   └── alerts.js                  # Alert/notification helpers
│
├── public/
│   ├── manifest.json              # PWA manifest
│   └── landing.html               # Static landing page
│
├── supabase_schema.sql            # Full database schema (run in Supabase)
├── next.config.js                 # Next.js + PWA config
├── tailwind.config.js
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (free tier works)
- Groq API key (free at console.groq.com)
- Vercel account (for deployment)

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/ai-receptionist.git
cd ai-receptionist
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env.local
# Then fill in your keys (see Environment Variables section)
```

### 4. Run the database schema

Go to your Supabase project → SQL Editor → paste and run `supabase_schema.sql`

### 5. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

> **Note:** Without Supabase keys, the app runs fully on localStorage. All demo hotels work offline out of the box.

---

## 🔑 Environment Variables

Create a `.env.local` file in the root:

```env
# Supabase (optional — app works without it via localStorage)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Groq AI (optional — fallback insight used without it)
GROQ_API_KEY=gsk_your_groq_api_key_here
```

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Optional | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional | Supabase anon/public key |
| `GROQ_API_KEY` | Optional | Groq API key for AI insights |

> Without any env vars, the app uses localStorage for all data and local fallback for AI insights.

---

## 🗄️ Database Setup

Run `supabase_schema.sql` in your Supabase SQL editor. It creates:

```sql
-- Core tables
hotels          -- Hotel registry (id, name, location, rooms, pins)
bookings        -- All booking records per hotel
rooms           -- Room inventory per hotel

-- Security
Row Level Security (RLS) enabled on all tables
Public read/write policies (replace with auth-based policies for production)
```

### Multi-device sync

Once Supabase is connected:
- All hotels and bookings sync across devices in real-time
- localStorage acts as cache/fallback when offline
- No additional setup needed — `lib/db.js` handles the hybrid automatically

---

## 🏨 Demo Hotels

Four demo hotels are pre-loaded and work fully offline:

```js
{ id: "sunrise-jaipur",    name: "Hotel Sunrise",  rooms: 40,  plan: "pro"        }
{ id: "grand-mumbai",      name: "The Grand Inn",  rooms: 120, plan: "enterprise" }
{ id: "saffron-ahmedabad", name: "Saffron Stays",  rooms: 25,  plan: "free"       }
{ id: "cherry-bhopal",     name: "Hotel Cherry",   rooms: 20,  plan: "pro"        }
```

To add a real hotel — use the registration flow in the app or insert directly into the `hotels` Supabase table.

---

## 🏗️ Multi-Tenant Architecture

Every hotel's data is completely isolated:

```
localStorage keys:   air_{hotelId}_{collection}
Supabase queries:    WHERE hotel_id = '{hotelId}'
```

This means:
- Hotel A can never see Hotel B's data
- Same codebase serves unlimited hotels
- Adding a new hotel = inserting one row in the `hotels` table

### Plans

| Plan | Rooms | Features |
|---|---|---|
| `free` | Up to 20 | Basic dashboard, bookings |
| `pro` | Up to 100 | + Reports, AI insights |
| `enterprise` | Unlimited | + All features, priority support |

---

## 🎨 Room Status System

Each room can be in one of 5 states:

| Status | Color | Meaning |
|---|---|---|
| `vacant` | 🟢 Green | Room is empty and ready |
| `occupied` | 🟢 Bright Green | Guest is currently staying |
| `reserved` | 🟡 Gold | Booking confirmed, guest not checked in |
| `cleaning` | 🟣 Purple/Indigo | Housekeeping in progress |
| `out_of_order` | ⚫ Grey | Under maintenance |

### Room Grid — Dynamic Sizing

The room grid auto-scales based on total rooms:

| Total Rooms | Columns | Box Size |
|---|---|---|
| ≤ 10 | 5 cols | Large |
| ≤ 20 | 5 cols | Medium-large |
| ≤ 32 | 8 cols | Medium |
| ≤ 48 | 8 cols | Small-medium |
| ≤ 64 | 10 cols | Small |
| 80+ | 10 cols | Compact |

Grid always fills 100% width — no black gaps.

### Adding Room Images (Future)

Room images are already supported in the data model. To add images to a room:

```js
// In your room data / Supabase rooms table:
{
  id: "room-101",
  number: "101",
  status: "vacant",
  imageUrl: "https://your-storage.com/room-101.jpg",   // single image
  images: [                                              // or multiple
    "https://your-storage.com/room-101-a.jpg",
    "https://your-storage.com/room-101-b.jpg",
  ]
}
```

The Room Detail Modal will automatically display them in a scrollable gallery.

---

## 🤖 AI Features

### AI Receptionist
- Appears at the top of the dashboard
- Animated Indian female avatar with:
  - Spinning conic-gradient ring (gold + neon blue)
  - Animated audio visualizer bars
  - Live status dot (blue pulse)

### AI SCAN Button
- Central holographic reactor button
- Triggers fresh AI insight generation via Groq API
- Haptic feedback on mobile (`navigator.vibrate`)

### AI Insights
- Powered by `llama3-70b-8192` via Groq
- Analyzes: occupancy %, revenue, check-ins, room status
- Displays contextual suggestions (pricing, promotions, operations)
- Refreshes every 30 seconds automatically

### Fallback Logic
If Groq API is unavailable, local rule-based insights are shown:
```
occupancy > 80%  → "Consider dynamic pricing!"
occupancy > 50%  → "Promote online listings"
occupancy < 50%  → "Weekend package consider karo"
```

---

## 🗺️ Roadmap

### v1.3 (Next)
- [ ] Room image upload via Supabase Storage
- [ ] WhatsApp booking confirmation (Twilio / Meta API)
- [ ] Guest ID photo capture + OCR (Aadhaar/Passport)
- [ ] Multi-floor / Tower view toggle

### v1.4
- [ ] Booking.com / OTA channel sync
- [ ] Dynamic pricing engine (AI-suggested rates)
- [ ] Staff management module
- [ ] Housekeeping task assignments

### v2.0
- [ ] Voice AI receptionist (Web Speech API + Groq)
- [ ] Guest self check-in kiosk mode
- [ ] Revenue analytics with forecasting
- [ ] Multi-currency support

---

## 🤝 Contributing

```bash
# Fork the repo
# Create your feature branch
git checkout -b feature/your-feature-name

# Commit changes
git commit -m "feat: add your feature"

# Push and create a Pull Request
git push origin feature/your-feature-name
```

### Code Style
- All components in `/components/` as `.js` files (not `.tsx`)
- No TypeScript (intentional — faster iteration)
- Inline styles preferred for dynamic/animated UI
- TailwindCSS for utility classes
- All DB calls go through `lib/db.js` — never call Supabase directly from components

---

## 📄 License

MIT License — free to use, modify, and deploy.

---

<div align="center">

**Built with ❤️ for Indian hoteliers**

*The GuestInn — Har hotel ka AI receptionist*

</div>
