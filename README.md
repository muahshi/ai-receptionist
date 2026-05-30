<div align="center">

# 🏨 The GuestInn — AI Hotel Management System

**India ka sabse smart hotel operations platform**  
Anti-theft · AI ID Scanner · Push Notifications · Direct Booking Engine

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=nextdotjs)](https://nextjs.org)
[![Groq AI](https://img.shields.io/badge/Groq-Llama_4_Vision-orange)](https://groq.com)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?logo=supabase)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com)
[![PWA](https://img.shields.io/badge/PWA-Installable-blue)](https://web.dev/progressive-web-apps)

[Live Demo](https://ai-receptionist-sandy-six.vercel.app) · [Booking Page](https://ai-receptionist-sandy-six.vercel.app/booking/cherry-bhopal) · [Staff Login](https://ai-receptionist-sandy-six.vercel.app)

</div>

---

## ✨ Kya Hai Yeh?

The GuestInn ek **offline-first PWA** hai jo chote aur mid-size Indian hotels ke liye banaya gaya hai. Ek hi app mein:

- 📱 **Staff Dashboard** — real-time room grid, revenue tracking
- 🤖 **AI ID Scanner** — Aadhaar/PAN/Passport camera se scan, auto form-fill
- 🌐 **Public Booking Page** — guest seedha book kare, OTA commission bachao
- 🔔 **Push Notifications** — room book hote hi sound ke saath alert
- 📊 **GRC Compliance** — Indian police records ke liye complete forms

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
# ── Required ────────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxx...
MY_GROQ_KEY=gsk_xxxx...

# ── Push Notifications (VAPID) ──────────────────────────────────
# Generate once: node -e "const c=require('crypto');const e=c.createECDH('prime256v1');e.generateKeys();console.log('PUBLIC='+e.getPublicKey('base64url'));console.log('PRIVATE='+e.getPrivateKey('base64url'))"
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BD5bPQrz...
VAPID_PRIVATE_KEY=5UwETRnu...
VAPID_SUBJECT=mailto:admin@yourhotel.com

# ── Optional ────────────────────────────────────────────────────
RESEND_API_KEY=re_xxxx...       # Email alerts (free: 100/day)
```

### 3. Supabase Setup

Supabase dashboard → SQL Editor → `supabase_schema.sql` ka poora content paste karo → Run.

Yeh tables banengi:
- `hotels` — hotel registry
- `bookings` — GRC records
- `push_subscriptions` — PWA notification subscribers

### 4. Local Run

```bash
npm run dev
# http://localhost:3000
```

### 5. Vercel Deploy

```bash
# Vercel CLI se
npm i -g vercel
vercel --prod

# Ya GitHub se auto-deploy:
# Vercel Dashboard → New Project → Import GitHub repo
# Environment variables Vercel dashboard mein add karo
```

---

## 📁 Project Structure

```
ai-receptionist/
├── app/
│   ├── page.js                      # Staff app shell + tab navigation
│   ├── layout.js                    # Root layout — fonts, PWA meta, apple-touch-icon
│   ├── globals.css                  # Global styles — scroll behavior, animations
│   ├── booking/[hotelId]/page.js    # 🌐 Public guest booking page
│   ├── h/[hotelId]/page.js          # Staff direct login shortcut
│   └── api/
│       ├── groq/route.js            # AI: id_scan | ai_insight | chat
│       ├── alerts/route.js          # Email via Resend
│       └── push/route.js            # Push notification: subscribe | send
│
├── components/
│   ├── DashboardView.js             # Main dashboard — room grid, revenue, AI insight
│   ├── ScannerView.js               # AI ID scanner + booking form (staff)
│   ├── GuestsView.js                # Guest list + GRC print
│   ├── ReportsView.js               # Revenue charts + booking history
│   ├── SettingsView.js              # All hotel settings + rates slider
│   └── LoginScreen.js               # Hotel selector + PIN login
│
├── lib/
│   ├── db.js                        # Data layer: Supabase + localStorage hybrid
│   ├── alerts.js                    # WhatsApp + Email + Push alert system
│   └── usePushNotifications.js      # React hook — push subscribe/unsubscribe
│
├── public/
│   ├── branding/logo-main.png       # 1200×400 — brand logo
│   ├── icons/
│   │   ├── apple-touch-icon.png     # 180×180 — iOS home screen
│   │   ├── icon-192.png             # 192×192 — Android PWA
│   │   └── icon-512.png             # 512×512 — PWA splash
│   ├── sw-push.js                   # Service Worker — push handler + sound
│   ├── manifest.json                # PWA manifest
│   └── landing.html                 # Public marketing page
│
├── supabase_schema.sql              # Database setup — run in SQL Editor
├── vercel.json                      # Vercel config — Mumbai region (bom1)
├── next.config.js                   # Next.js + PWA config
└── tailwind.config.js               # Tailwind CSS config
```

---

## 🎯 Features — Complete List

### 🤖 AI Features

| Feature | Tech | Details |
|---|---|---|
| **ID Scanner** | Groq Llama 4 Vision | Camera → auto-fill Name, DOB, Address, ID Number, Gender |
| **AI Receptionist** | Groq llama-3.3-70b | Dashboard pe Hinglish revenue tips |
| **Guest Chatbot** | Groq llama-3.3-70b | Booking page pe Hinglish conversation |

**Supported IDs:** Aadhaar · PAN · Passport · Driving License · Voter ID · Foreign Passports

---

### 🏗️ Staff Dashboard

- **3D Isometric Room Grid** — floor-by-floor, color-coded status (Occupied/Reserved/Vacant/Cleaning/OOO)
- **Live Revenue Widget** — today's total + 7-day sparkline chart
- **AI Insight Card** — personalized revenue tip daily
- **Room Click Modal** — guest details, checkout, approve check-in
- **Hologram Building** — animated SVG visual
- **Push Bell Button** — header mein — gold glow jab subscribed

---

### 📱 Public Booking Page (`/booking/[hotelId]`)

- **Room Grid** — same 3D keycap design, sirf green (available) rooms clickable
- **AI ID Scanner** — real camera, Groq Vision scan, form auto-fill
- **Complete GRC Form** — Name, Phone, Check-in/out, ID Type/Number, Gender, DOB, Address, Nationality
- **Live Bill Calculator** — nights × rate = real-time total
- **Booking Save** → localStorage + Supabase → room **Reserved** ho jaata hai dashboard pe
- **WhatsApp Alert** → owner ko booking details automatically
- **Hinglish Chatbot** → floating button
- **Google Maps link** → hotel location

---

### 🔔 Push Notifications

- **Service Worker** (`sw-push.js`) — background push handle karta hai
- **Hotel Bell Sound** — Web Audio API se 3-note D-G-B chime (no external file)
- **Vibration Pattern** — `[200, 100, 200, 100, 400]`
- **Action Buttons** — "Details Dekho" · "Dismiss"
- **Auto cleanup** — expired subscriptions (410/404) automatic remove

**Setup:** Header bell tap → "Allow" → Gold + Green dot = active ✅

---

### ⚙️ Settings — Sab Kuch Configurable

| Setting | Effect |
|---|---|
| Hotel Name, Location | Dashboard, booking page, alerts, GRC |
| Total Rooms | Room grid reinitialize |
| GST % | Billing calculations |
| Standard / Deluxe / Suite Rates | **Slider + manual input + presets** — booking page, scanner, dashboard |
| Checkout Time | Policy display |
| Owner / Manager Phone | WhatsApp alert destination |
| Owner / Manager Email | Email alert destination |
| Owner / Manager PIN | Login authentication |

**Rate sync:** Settings mein save karo → `standardRate`, `deluxeRate`, `suiteRate` dono formats mein save hota hai → poori app consistent rahati hai.

---

### 💾 Data Layer — Offline First

```
Write: localStorage (instant) → Supabase (background sync)
Read:  Supabase (fresh) → localStorage cache (fallback)
```

**localStorage keys:**
```
air_[hotelId]_config     — hotel settings
air_[hotelId]_rooms      — room statuses + current guest
air_[hotelId]_bookings   — all booking records
gi_hotel_registry        — all hotels list
air_current_user         — logged in user session
```

---

### 📋 GRC Compliance & Export

**GRC Form fields:** Guest Name · Phone · Company/GST · ID Type · ID Number · Address · Nationality · Check-in/out · Room · Rate · Payment Mode · Arrival From · Proceeding To · Purpose · Signature

**Export options:**
- **CSV** — Excel compatible, 36 columns, extra guests as separate rows
- **JSON** — Full data dump: hotel config + all bookings + rooms (with ID images base64)

---

### 🔐 Security

- PIN-based login (4 digit, Owner + Manager separate)
- Rate Lock — locked rate checkout tak change nahi hota
- Triple WhatsApp alerts — owner notified every check-in
- AI scan at check-in — ID document verified
- Supabase RLS (Row Level Security) enabled on all tables

---

## 🗂️ API Routes

| Route | Method | Body | Purpose |
|---|---|---|---|
| `/api/groq` | POST | `{type:"id_scan", imageBase64}` | ID document scan |
| `/api/groq` | POST | `{type:"ai_insight", stats}` | Revenue insight |
| `/api/groq` | POST | `{type:"chat", messages, hotelConfig}` | Guest chatbot |
| `/api/alerts` | POST | `{emails[], subject, html}` | Send email via Resend |
| `/api/push` | POST | `{action:"subscribe", hotelId, subscription}` | Save push subscription |
| `/api/push` | POST | `{action:"send", hotelId, payload}` | Send push to all subscribers |
| `/api/push` | POST | `{action:"unsubscribe", hotelId, endpoint}` | Remove subscription |

---

## 🗃️ Supabase Schema Summary

```sql
hotels (id, name, location, total_rooms, plan, emoji, owner_pin, manager_pin, owner_phone, ...)
bookings (id, hotel_id, guest_name, guest_phone, id_type, id_number, room_id, check_in_date, ...)
push_subscriptions (id, hotel_id, role, endpoint, p256dh, auth, subscription, created_at)
```

All tables have **Row Level Security** enabled with open policies (hotel handles auth via PIN).

---

## 📱 PWA Installation

**Android (Chrome):**
1. Site kholo
2. Browser menu → "Add to Home Screen"
3. "Install" tap karo

**iOS (Safari):**
1. Site kholo
2. Share button → "Add to Home Screen"
3. "Add" tap karo

**Icon files:**
```
/public/icons/apple-touch-icon.png   → 180×180 (iOS)
/public/icons/icon-192.png           → 192×192 (Android)
/public/icons/icon-512.png           → 512×512 (Splash)
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| UI | React 18 + Tailwind CSS + Inline styles |
| AI | Groq SDK — Llama 4 Scout Vision + llama-3.3-70b |
| Database | Supabase (PostgreSQL + REST API) |
| Offline | localStorage hybrid cache |
| Charts | Recharts (AreaChart) |
| Icons | Lucide React |
| Push | web-push (VAPID) + Service Worker |
| Email | Resend API |
| PWA | next-pwa |
| Deploy | Vercel (bom1 — Mumbai region) |

---

## 🐛 Common Issues & Fixes

| Error | Cause | Fix |
|---|---|---|
| `Module not found: web-push` | package.json mein add nahi tha | `npm install` dobara run karo |
| `VAPID keys missing` | Env vars set nahi | Vercel dashboard mein add karo |
| Push notification nahi aayi | `web-push` encryption | Route.js ka latest version use karo |
| Booking page scroll nahi hoti | `globals.css` mein `overflow:hidden` tha | Latest `globals.css` use karo |
| Dashboard mein rates Settings se match nahi | `standardRate` vs `rates.standard` mismatch | Latest `db.js` use karo |
| JSON export nahi hoti | `exportAllData` missing tha | Latest `db.js` use karo |
| `Application error` booking page | `useState` inside `.reduce()` | Latest `booking/page.js` use karo |
| PWA icon nahi dikh raha | manifest.json mein wrong filenames | `icon-192.png` (not `icon-192x192.png`) |

---

## 📞 Support

**Hotel:** Hotel Amardeep Palace, Bhopal MP  
**Stack:** The GuestInn v2.0  
**Powered by:** Groq AI · Supabase · Vercel · Next.js

---

<div align="center">
<strong>Made with ❤️ for Independent Indian Hotels</strong><br/>
<em>No OTA commission. No monthly fees. Your hotel, your data.</em>
</div>
