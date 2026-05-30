# 🎯 The GuestInn v2.0 — SKILLS.md
> **Claude ke liye:** Yeh file poore project ka complete technical reference hai. Koi bhi feature implement karne ya bug fix karne se pehle yeh file padho.

---

## 🗂️ 1. PROJECT MAP

```
app/
  page.js                    ← Staff app shell. Tab nav. Body ko "app-locked" class deta hai.
  layout.js                  ← Root layout. apple-touch-icon, fonts, metadata.
  globals.css                ← Global CSS. html/body scroll — NO overflow:hidden globally.
                               Staff app: body.app-locked class se scroll lock hota hai.
  booking/[hotelId]/page.js  ← Public booking page. Standalone. db.js import nahi karta.
                               savePublicBooking() function internally define hai.
  h/[hotelId]/page.js        ← Staff direct login shortcut URL.
  api/
    groq/route.js            ← type: "id_scan" | "ai_insight" | "chat"
    alerts/route.js          ← Email via Resend. POST {emails[], subject, html}
    push/route.js            ← action: "subscribe" | "send" | "unsubscribe". Uses web-push npm.

components/
  DashboardView.js           ← Main dashboard. Rooms, revenue, AI insight, hologram, push bell.
  ScannerView.js             ← Staff ID scanner. Camera → Groq → form fill → saveBooking()
  GuestsView.js              ← Guest list table + GRC print HTML generation.
  ReportsView.js             ← Revenue charts (Recharts AreaChart) + booking history.
  SettingsView.js            ← Settings form. Rate slider + manual input + presets.
  LoginScreen.js             ← Hotel selector + PIN login. Logo from /branding/logo-main.png.

lib/
  db.js                      ← SINGLE SOURCE OF TRUTH. Read this before any data work.
  alerts.js                  ← sendBookingAlerts(booking). WhatsApp + Email + Push.
  usePushNotifications.js    ← React hook. subscribe/unsubscribe + hotel bell sound (Web Audio).

public/
  sw-push.js                 ← Service Worker. Push event → showNotification → vibrate.
  branding/logo-main.png     ← 1200×400. Used in LoginScreen + landing.html (navbar + footer).
  icons/
    apple-touch-icon.png     ← 180×180. layout.js <link rel="apple-touch-icon">
    icon-192.png             ← 192×192. manifest.json
    icon-512.png             ← 512×512. manifest.json
  manifest.json              ← PWA. icon paths MUST match actual filenames exactly.
  sw-push.js                 ← Service Worker for push.
```

---

## 💾 2. DATA LAYER — lib/db.js

### Key Pattern
```js
air_[hotelId]_config     // hotel settings
air_[hotelId]_rooms      // room array with status
air_[hotelId]_bookings   // booking records
gi_hotel_registry        // all hotels list
air_current_user         // current session
```

### Critical Functions

#### `getHotelConfig(hotelId)`
Config load karta hai aur **dono rate formats normalize karta hai:**
```js
// Output mein dono hain:
cfg.rates.standard   // Settings use karta hai
cfg.standardRate     // Booking page + rooms use karte hain
cfg.deluxeRate
cfg.suiteRate
```
⚠️ Agar sirf ek format save karo to dusra missing rahega. `saveHotelConfig()` automatically dono save karta hai.

#### `saveHotelConfig(hotelId, data)`
Dono formats normalize karke save karta hai. Always yeh use karo — direct `localStorage.setItem` mat karo config ke liye.

#### `getRooms(hotelId)`
```js
// Latest config se rates sync karta hai har baar
// rooms[n].baseRate = cfg.rates.standard/deluxe/suite based on room.type
```

#### `saveBooking(hotelId, bookingData)`
```js
// bookingData.isPublicBooking = true → room status "reserved"
// bookingData.isPublicBooking = false/undefined → room status "occupied"
// Supabase + localStorage dono mein save hota hai
```

#### `updateRoomStatus(hotelId, roomId, status, bookingId, guestName)`
```js
// status values: "vacant" | "occupied" | "reserved" | "cleaning" | "out_of_order"
// "reserved" = public booking page se book hua, staff ne approve nahi kiya
// "occupied" = staff ne check-in approve kar diya
```

#### `exportCSV(hotelId)` / `exportAllData(hotelId)`
```js
exportCSV()       // CSV file download — Excel compatible
exportAllData()   // JSON download — config + bookings + rooms
// Dono browser download trigger karte hain
```

### Supabase Sync Pattern
```js
// Write: localStorage pehle (instant) → Supabase background mein
// Read: Supabase try karo → fail ho to localStorage fallback
// Supabase down ho to bhi app kaam karta hai (offline-first)
```

---

## 🤖 3. AI — Groq API

### Route: `POST /api/groq`

#### ID Scan
```js
{ type: "id_scan", imageBase64: "..." }
// Model: meta-llama/llama-4-scout-17b-16e-instruct (Vision)
// Returns: { success:true, data:{ name, dob, address, idNumber, idType, gender } }
// idType: "Aadhaar" | "PAN" | "Passport" | "Driving License" | "Voter ID"
// gender: "M" or "F" (component mein "Male"/"Female" convert karo)
```

#### AI Insight
```js
{ type: "ai_insight", stats:{occupancy,revenue,...}, hotelName:"..." }
// Model: llama-3.3-70b-versatile
// Returns: { success:true, insight: "Hinglish tip..." }
```

#### Chat
```js
{ type: "chat", messages:[{role,content}], hotelConfig:{name,location,rates} }
// Model: llama-3.3-70b-versatile
// Returns: { success:true, message: "Hinglish response..." }
```

---

## 🔔 4. PUSH NOTIFICATIONS

### Flow
```
User → Header Bell Click → usePushNotifications.subscribe()
  → navigator.serviceWorker.register('/sw-push.js')
  → pushManager.subscribe({VAPID key})
  → POST /api/push {action:"subscribe", hotelId, subscription}
  → Supabase push_subscriptions table mein save

Room book ho → sendBookingAlerts(booking) → POST /api/push {action:"send"}
  → Supabase se sab subscriptions fetch
  → web-push.sendNotification() → browser push server
  → sw-push.js "push" event → showNotification() + vibrate
  → User ke phone pe notification + chime sound
```

### Sound — Web Audio API (usePushNotifications.js)
```js
// playNotificationSound() — no external audio file needed
// 3-note hotel bell: D5 (587Hz) → G5 (784Hz) → B5 (987Hz)
// AudioContext create → oscillator → exponential ramp
```

### VAPID Keys
```
NEXT_PUBLIC_VAPID_PUBLIC_KEY  — browser ko dete hain (safe to expose)
VAPID_PRIVATE_KEY             — server only (secret, never in client code)
VAPID_SUBJECT                 — mailto:admin@yourhotel.com
```
Keys ek baar generate karo, kabhi change mat karo (subscribers expire ho jaate hain).

---

## ⚙️ 5. SETTINGS — Rate Sync

### Problem Jo Pehle Tha
Settings `rates.standard` save karta tha → Booking page `standardRate` dhundta tha → **mismatch → rates galat dikhte the**

### Current Fix (db.js mein)
```js
// saveHotelConfig() automatically dono save karta hai:
{
  rates: { standard:1200, deluxe:2000, suite:3800 },  // Settings read karta hai
  standardRate: 1200,   // Booking page + fetchHotel() read karta hai
  deluxeRate:   2000,
  suiteRate:    3800,
}

// getRooms() har call pe rooms[n].baseRate sync karta hai from config
// Isliye dashboard ka "Base Rate" bhi Settings se match karta hai
```

### SettingsView.js — Rate Input
```
Har rate (Standard/Deluxe/Suite) ke liye 3 ways:
1. Slider (range input) — gold fill, draggable
2. Number input — manually type karo
3. Preset buttons — quick select (600, 800, 1K, 1.5K...)
Teeno sync hain — ek change karo baaki reflect hota hai
```

---

## 🌐 6. PUBLIC BOOKING PAGE

### File: `app/booking/[hotelId]/page.js`

⚠️ **Standalone file hai** — `lib/db.js` import nahi karta kyunki server components se conflict hota. Apne functions internally define hain:
- `fetchHotel()` — Supabase → localStorage → DEMOS fallback
- `savePublicBooking()` — mirrors db.js saveBooking, `isPublicBooking:true`
- `getRooms()` — local function, localStorage se

### Booking Save Flow
```js
savePublicBooking(hotelId, bookingData)
  // 1. localStorage bookings array mein prepend
  // 2. localStorage rooms mein room.status = "reserved"
  // 3. Supabase bookings POST
  // 4. Supabase rooms PATCH {status:"reserved"}
  // WhatsApp deep link → owner ke number pe
```

### Room Statuses on Booking Page
```
vacant    → Green keycap → ONLY clickable state
reserved  → Gold/amber keycap → 📌 badge (already booked via this page)
occupied  → Red keycap → staff ne check-in kar liya
cleaning  → Indigo keycap
other     → Gray
```

---

## 🎨 7. DESIGN SYSTEM

### Colors
```css
--bg-primary:    #07090E   /* Deep space black */
--gold:          #D4AF37   /* Liquid gold — primary accent */
--gold-warm:     #C9A84C   /* Landing page gold */
--blue-cyber:    #008cff   /* Neon cyber blue */
--blue-soft:     #60b8ff   /* Soft blue text */
--emerald:       #22c55e   /* Success / available rooms */
--red:           #ef4444   /* Occupied rooms */
--amber:         #f59e0b   /* Reserved rooms */
--indigo:        #818cf8   /* Cleaning rooms */
```

### Glow Effects
```css
/* Blue glow: */
filter: drop-shadow(0 0 16px #008cff) drop-shadow(0 0 32px rgba(0,140,255,0.35))

/* Gold glow: */
filter: drop-shadow(0 0 12px rgba(212,175,55,0.4))

/* Box shadow pattern: */
box-shadow: 0 4px 28px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.03)
```

### Animations (globals.css + inline)
```css
@keyframes holoPulse   /* Hologram building glow */
@keyframes spinRingCW  /* AI reactor rings */
@keyframes laserPulse  /* AI reactor laser */
@keyframes audioBar    /* Scanning bars */
@keyframes fadeUp      /* Section entry */
@keyframes slideUp     /* Chat panel */
@keyframes dotBounce   /* Chat typing indicator */
```

### Components Copy Karo (DashboardView.js → Booking page mein bhi same)
- `HologramBuilding()` — exact SVG same hai dono mein
- `RoomKeycap()` — 3D keycap button, status-based colors
- `AiReactor` / `AiScanReactor` — spinning rings + laser emitters

---

## 📜 8. SCROLL ARCHITECTURE

### Problem History
`globals.css` mein `overflow:hidden` tha → **poori app ka scroll band**

### Current Solution
```css
/* globals.css */
html { overflow-x: hidden; }
body { overflow-x: hidden; -webkit-overflow-scrolling: touch; }
body.app-locked { overflow: hidden; overscroll-behavior: none; }
```

```js
// app/page.js (staff app) — mount pe lock, unmount pe unlock:
useEffect(() => {
  document.body.classList.add("app-locked");
  return () => document.body.classList.remove("app-locked");
}, []);

// booking/page.js — koi class nahi lagata → body naturally scrolls
```

**Rule:** Booking page pe `overflow:hidden` kuch bhi mat lagao — body natural scroll kare.

---

## 🔐 9. PWA / ICONS

### Manifest.json — Critical Rule
```json
// SAHI filenames (actual files jo exist karti hain):
{ "src": "/icons/apple-touch-icon.png", "sizes": "180x180" }
{ "src": "/icons/icon-192.png",         "sizes": "192x192" }
{ "src": "/icons/icon-512.png",         "sizes": "512x512" }

// ❌ GALAT (yeh files exist nahi karti):
// icon-192x192.png, icon-96x96.png, icon-144x144.png
```

### layout.js apple-touch-icon
```html
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
```

### Logo Usage
```
/public/branding/logo-main.png (1200×400)
  → components/LoginScreen.js  header mein <img src="/branding/logo-main.png">
  → public/landing.html        navbar + footer dono mein (SVG replace ho gaya)
```

---

## 📦 10. ENV VARIABLES — COMPLETE LIST

| Variable | Required | Where Used |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | db.js, push route, booking page |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | db.js, push route, booking page |
| `MY_GROQ_KEY` | ✅ | api/groq/route.js |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Push ke liye | usePushNotifications.js |
| `VAPID_PRIVATE_KEY` | Push ke liye | api/push/route.js (server only) |
| `VAPID_SUBJECT` | Push ke liye | api/push/route.js |
| `RESEND_API_KEY` | Email ke liye | api/alerts/route.js |

---

## 🐛 11. KNOWN BUGS & FIXES

| Bug | File | Fix |
|---|---|---|
| `useState` inside `.reduce()` | booking/page.js | FAQ ko alag `FaqSection` component banao |
| `Module not found: web-push` | package.json | `"web-push": "^3.6.7"` add karo + npm install |
| Rates Settings se sync nahi | db.js | `normalizeConfig()` dono formats save karta hai |
| JSON export kaam nahi karta | db.js | `exportAllData()` function add hua |
| 2 bell icons dashboard pe | DashboardView.js | Dashboard wala bell hatao, sirf page.js wala rakho |
| Room baseRate Settings se match nahi | db.js | `getRooms()` ab config se rates sync karta hai |
| Booking page scroll band | globals.css | `overflow:hidden` hatao, `app-locked` class use karo |
| Push notification nahi aati | api/push/route.js | `web-push` npm use karo, manual VAPID nahi |

---

## 🚀 12. DEPLOYMENT CHECKLIST

```
□ .env.local mein sab vars set hain
□ supabase_schema.sql run ho gaya (hotels + bookings + push_subscriptions)
□ Vercel mein environment variables add ki hain
□ package.json mein web-push: "^3.6.7" hai
□ manifest.json mein correct icon filenames hain
□ layout.js mein apple-touch-icon sahi path hai
□ globals.css mein overflow:hidden nahi hai (sirf body.app-locked mein)
□ VAPID keys generate ho gayi hain
```

---

## 📊 13. SUPABASE TABLES QUICK REF

```sql
-- Hotels
hotels: id(PK), name, location, total_rooms, plan, emoji,
        owner_pin, manager_pin, owner_phone, created_at, updated_at

-- Bookings  
bookings: id(PK), hotel_id(FK), guest_name, guest_phone, address,
          id_type, id_number, gender, dob, room_id, room_type,
          check_in_date, check_out_date, nights, rate_per_night,
          total_amount, payment_mode, status, rate_locked, created_at

-- Push Subscriptions
push_subscriptions: id(PK), hotel_id, role, endpoint(UNIQUE),
                    p256dh, auth, subscription(JSON), created_at
```

All tables: **RLS enabled**, open policies (app handles auth via PIN).

---

*The GuestInn v2.0 — Last updated: May 2026*
