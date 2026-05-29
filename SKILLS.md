# 🎯 The GuestInn — Skills & Capabilities Reference

> Complete feature map for developers, hotel owners, and investors.  
> Every capability, how it works, and where it lives in code.

---

## 🧠 AI Skills

### 1. ID Document Scanner
**What it does:** Point phone camera at any Indian ID → AI reads and fills all fields automatically.

| Property | Detail |
|---|---|
| **Model** | Groq `meta-llama/llama-4-scout-17b-16e-instruct` (Vision) |
| **Speed** | ~3 seconds |
| **Accuracy** | ~99% for clear images |
| **Supported IDs** | Aadhaar, PAN, Passport, Driving License, Voter ID |
| **Foreign IDs** | International Passports with Visa details |
| **Scan sides** | Front + Back (both saved as thumbnails) |
| **Fields extracted** | Name, DOB, Gender, Address, ID Number, ID Type |
| **Image storage** | JPEG thumbnail (320×180) stored with booking |
| **Code location** | `components/ScannerView.js` → `captureAndScan()` |
| **API route** | `app/api/groq/route.js` → `type: "id_scan"` |

---

### 2. AI Receptionist (Dashboard)
**What it does:** Analyzes today's hotel stats and gives actionable revenue advice in Hinglish.

| Property | Detail |
|---|---|
| **Model** | Groq `llama-3.3-70b-versatile` |
| **Trigger** | On dashboard load + "View Insights" button |
| **Input** | Occupancy %, revenue, room counts, hotel name, day of week |
| **Output** | 2-sentence actionable tip in Hinglish |
| **Examples** | "Aaj Friday hai — weekend package offer karo ₹5000-₹10000 range mein" |
| **Code location** | `components/DashboardView.js` → `fetchInsight()` |
| **API route** | `app/api/groq/route.js` → `type: "ai_insight"` |

---

### 3. Public AI Chatbot (Booking Page)
**What it does:** Guest-facing conversational AI on the public booking page for queries and bookings.

| Property | Detail |
|---|---|
| **Model** | Groq `llama-3.3-70b-versatile` |
| **Language** | Hinglish (matches guest's language) |
| **Context** | Hotel name, location, room rates injected |
| **Capabilities** | Answer questions, collect booking details, quote rates |
| **Lead capture** | Auto-extracts name + phone from conversation |
| **Booking flow** | Collects: Name → Phone → Room type → Dates → Confirms |
| **Code location** | `app/booking/[hotelId]/page.js` → `send()` function |
| **API route** | `app/api/groq/route.js` → `type: "chat"` |

---

## 🏗️ Core System Skills

### 4. Multi-Hotel Architecture
**What it does:** Single deployment handles unlimited hotels, each completely isolated.

| Property | Detail |
|---|---|
| **Hotel identification** | Unique slug ID (e.g., `hotel-cherry-bhopal`) |
| **Data isolation** | Each hotel's data in separate localStorage keys |
| **Sync** | Supabase as source of truth for all devices |
| **Hotel registration** | Settings screen → saves to Supabase + localStorage |
| **URL routing** | `/booking/[hotelId]` — public, `/h/[hotelId]` — staff |
| **Demo hotels** | 4 pre-loaded (Jaipur, Mumbai, Ahmedabad, Bhopal) |
| **Code location** | `lib/db.js` → `getAllHotels()`, `saveHotelToRegistry()` |

---

### 5. Offline-First Data Layer
**What it does:** App works without internet, syncs when connected.

| Property | Detail |
|---|---|
| **Primary cache** | `localStorage` — instant reads/writes |
| **Sync layer** | Supabase PostgreSQL — cross-device |
| **Strategy** | Write localStorage first → Supabase in background |
| **Read strategy** | Show cache instantly → fetch fresh → update UI |
| **Key format** | `air_[hotelId]_[collection]` |
| **Collections** | `config`, `rooms`, `bookings` |
| **Code location** | `lib/db.js` |

---

### 6. Rate Lock System
**What it does:** Rate agreed at check-in is cryptographically locked — cannot be changed by staff.

| Property | Detail |
|---|---|
| **Lock trigger** | "Rate Lock Karo" button in ScannerView |
| **Lock storage** | `rateLocked: true` + `lockedAt` timestamp in booking |
| **UI indicator** | Gold lock badge on booking |
| **WhatsApp proof** | Rate sent to guest + owner at time of lock |
| **Fraud prevention** | Staff cannot edit rate after lock |
| **Code location** | `components/ScannerView.js` → `lockRate()` |

---

## 👥 Guest Management Skills

### 7. Multi-Guest Check-in
**What it does:** Check in 1–8 guests simultaneously, each with own ID scan and record.

| Property | Detail |
|---|---|
| **Max guests** | 8 per booking |
| **Primary guest** | Full booking record |
| **Extra guests** | Stored as JSON array in `extraGuests` field |
| **Per-guest data** | Name, phone, ID type, ID number, ID images, gender, DOB, nationality, address, travel details |
| **Guests tab** | Each guest shown as separate row |
| **Display** | "Guest 2/3" badge for context |
| **Code location** | `components/ScannerView.js` → `blankGuest()`, `handleSubmit()` |

---

### 8. Guest Registration Card (GRC)
**What it does:** Generate and print official hotel registration form matching Indian regulations.

| Fields included | |
|---|---|
| Guest names (1–4) | Mobile + Email |
| Company + GST | ID type + number |
| Passport/Visa details | Address + Nationality |
| Room + Tariff | Check-in/out dates |
| Arrival From | Proceeding To |
| Purpose of Visit | Payment mode |
| ID document images | Terms & conditions |
| Signature lines | GRC number |

| Property | Detail |
|---|---|
| **Format** | HTML → browser print dialog |
| **Branding** | Hotel name + location in header |
| **GRC number** | Auto-generated from booking ID |
| **Print trigger** | Guests tab → guest → "🖨️ Print GRC Form" |
| **ID images** | Embedded inline (base64) |
| **Code location** | `lib/db.js` → `generateGRCHTML()` |

---

### 9. Data Export

#### CSV Export
| Property | Detail |
|---|---|
| **Format** | RFC 4180 compliant CSV |
| **Fields** | 36 columns including all GRC fields |
| **Extra guests** | Each guest = separate row |
| **Opens in** | Excel, Google Sheets |
| **Filename** | `[HotelName]_GRC_[date].csv` |

#### JSON Export
| Property | Detail |
|---|---|
| **Format** | Pretty-printed JSON |
| **Contents** | Hotel config + all bookings + expanded guests |
| **ID images** | Base64 encoded, included |
| **Use case** | Police records, full backup, data migration |
| **Filename** | `[HotelName]_fulldata_[date].json` |

**Code location:** `lib/db.js` → `exportCSV()`, `exportAllData()`

---

## 🔔 Alert & Notification Skills

### 10. WhatsApp Alerts
**What it does:** Send booking notifications via WhatsApp to owner, manager, and guest.

| Alert | Recipient | Trigger | Content |
|---|---|---|---|
| Owner Alert | Hotel owner | Every check-in | Guest details + locked rate + ID info |
| Manager Alert | Hotel manager | Every check-in | Quick summary |
| Guest Confirmation | Guest | Every check-in | Booking proof + rate lock confirmation |

| Property | Detail |
|---|---|
| **Method** | `wa.me` deep link (no API cost) |
| **Phone source** | Settings → Owner/Manager Phone |
| **Language** | Hindi/Hinglish |
| **Fraud proof** | Rate locked amount in message |
| **Code location** | `lib/alerts.js` → `sendBookingAlerts()` |

---

### 11. Email Notifications
**What it does:** Send HTML email alerts to owner and manager on each check-in.

| Property | Detail |
|---|---|
| **Provider** | Resend (free: 100 emails/day) |
| **Setup** | Add `RESEND_API_KEY` in Vercel env |
| **Template** | Branded HTML with hotel name |
| **Recipients** | Owner email + Manager email |
| **Content** | Same as WhatsApp but formatted HTML |
| **Fallback** | Console log if no API key (app still works) |
| **API route** | `app/api/alerts/route.js` |
| **Test button** | Settings → "📧 Test Email Bhejo" |

---

## 🌐 Public Booking Page Skills

### 12. Hotel Showcase Page
**What it does:** Each hotel gets a branded public page for direct bookings.

| Section | Description |
|---|---|
| Header | Hotel name, emoji, location, "SYSTEM ACTIVE" badge |
| Room cards | Deluxe/Premium/Suite/Family with photos, rates, amenities |
| Calendar picker | Visual date selection with range highlight |
| Direct booking benefits | No commission, free breakfast, flexible checkout |
| FAQ accordion | Check-in time, breakfast, cancellation policy, pickup |
| AI Chatbot | Floating button → slide-up chat panel |
| Location | Google Maps link |
| Staff login | Hidden footer link |

| Property | Detail |
|---|---|
| **URL format** | `/booking/[hotelId]` |
| **Hotel lookup** | Supabase → localStorage → demo fallback → fuzzy name match |
| **Lead storage** | Supabase `leads` table |
| **Code location** | `app/booking/[hotelId]/page.js` |

---

## ⚙️ Settings & Configuration Skills

### 13. Hotel Settings
**What it does:** One screen to control all hotel parameters, reflected everywhere instantly.

| Setting | Effect |
|---|---|
| Hotel Name | Updates dashboard, booking page, alerts, GRC |
| Location | Booking page, Google Maps link |
| Total Rooms | Re-initializes room grid |
| GST % | GRC and billing |
| Room Rates (Standard/Deluxe/Suite) | Scanner default rate, booking page prices |
| Checkout Time | Policy display |
| Owner Phone | WhatsApp alert destination |
| Manager Phone | WhatsApp alert destination |
| Owner Email | Email alert destination |
| Manager Email | Email alert destination |
| Owner PIN | Login authentication |
| Manager PIN | Login authentication |

| Property | Detail |
|---|---|
| **Save destinations** | localStorage + Supabase + registry cache |
| **Rate presets** | Quick buttons: 600/800/1K/1.2K/1.5K/2K etc. |
| **Test WhatsApp** | Opens wa.me with test message |
| **Test Email** | Opens mailto with pre-filled content |
| **Code location** | `components/SettingsView.js` |

---

## 📊 Dashboard Skills

### 14. Live Dashboard
**What it does:** Real-time hotel operations overview.

| Widget | Data source |
|---|---|
| AI Receptionist card | Groq insight |
| Live Revenue | Today's bookings sum |
| Revenue sparkline | 7-day chart (Recharts AreaChart) |
| Room occupancy grid | localStorage rooms |
| Guest Check-in counter | Active bookings today |
| AI SCAN button | Opens ScannerView |
| Maintenance counter | Out-of-order rooms |
| Housekeeping counter | Rooms in cleaning status |
| Reviews | Static 4.8 (future: real reviews) |
| AI Insights | Groq LLM analysis |
| Hologram building | Animated SVG |

| Property | Detail |
|---|---|
| **Auto-refresh** | Every 30 seconds |
| **Room modal** | Click room → guest details + actions |
| **Room actions** | Check-out, AI Scan check-in, Out of Order, Mark Vacant |
| **Share link** | Copy booking page URL |
| **Code location** | `components/DashboardView.js` |

---

## 🔐 Authentication Skills

### 15. PIN-Based Login
**What it does:** Simple 4-digit PIN login, no passwords or email verification needed.

| Flow | Steps |
|---|---|
| Select hotel | Browse list or use direct URL `/booking/[hotelId]` |
| Choose role | Owner (👑) or Manager (🔑) |
| Enter PIN | 4 digits → auto-submit |
| Session | Stored in localStorage |
| Logout | Settings → Hotel Switch / Logout |

| Property | Detail |
|---|---|
| **Storage** | `air_current_user` in localStorage |
| **PIN location** | Hotel config (localStorage + Supabase) |
| **Code location** | `components/LoginScreen.js`, `app/booking/[hotelId]/page.js` |

---

## 📱 PWA Skills

### 16. Progressive Web App
**What it does:** Installable on phone like a native app, works offline.

| Property | Detail |
|---|---|
| **Install** | Browser → Share → Add to Home Screen |
| **Offline** | localStorage cache serves all data |
| **Icons** | `/public/icons/icon-192.png` (192×192), `/public/icons/icon-512.png` (512×512) |
| **Apple Touch Icon** | `/public/icons/apple-touch-icon.png` (180×180) |
| **Manifest** | `/public/manifest.json` — references actual filenames |
| **PWA lib** | `next-pwa` (disabled in development) |
| **Theme color** | `#D4AF37` (gold) |
| **Background** | `#0A0A0A` (near black) |

> ⚠️ **Icon naming rule:** Actual files in `/public/icons/` are:
> - `apple-touch-icon.png` (180×180) — used in `layout.js` as `<link rel="apple-touch-icon">`
> - `icon-192.png` (192×192) — used in `manifest.json`
> - `icon-512.png` (512×512) — used in `manifest.json`
>
> Do NOT reference `icon-192x192.png` or `icon-96x96.png` — those files don't exist.

---

## 🖼️ Branding & Assets

### 17. Logo & Visual Identity

| Asset | Path | Size | Usage |
|---|---|---|---|
| Main Logo | `/public/branding/logo-main.png` | 1200×400 px | LoginScreen header, landing.html navbar + footer |
| App Icon 192 | `/public/icons/icon-192.png` | 192×192 px | PWA manifest, Android home screen |
| App Icon 512 | `/public/icons/icon-512.png` | 512×512 px | PWA manifest, splash screen |
| Apple Touch Icon | `/public/icons/apple-touch-icon.png` | 180×180 px | iOS home screen (`<link rel="apple-touch-icon">`) |

**Where logo-main.png is used:**
- `components/LoginScreen.js` — hotel selector screen header (`<img src="/branding/logo-main.png">`)
- `public/landing.html` — navbar logo + footer logo (both replaced from SVG to `<img>`)

**Correct `layout.js` apple-touch-icon tag:**
```html
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
```

**Correct `manifest.json` icon entries:**
```json
{ "src": "/icons/apple-touch-icon.png", "sizes": "180x180" },
{ "src": "/icons/icon-192.png", "sizes": "192x192" },
{ "src": "/icons/icon-512.png", "sizes": "512x512" }
```

**Brand colors:**
| Color | Hex | Usage |
|---|---|---|
| Gold primary | `#D4AF37` | Theme color, accents, buttons |
| Gold warm | `#C9A84C` | Landing page gold |
| Dark background | `#0A0A0A` | App background |
| Charcoal | `#121212` | PWA background_color |

---

## 🗺️ File Structure

```
├── app/
│   ├── page.js                    # Main app shell + tab navigation
│   ├── layout.js                  # Root layout — fonts, apple-touch-icon, metadata
│   ├── booking/[hotelId]/page.js  # Public guest booking page
│   ├── h/[hotelId]/page.js        # Staff direct login
│   └── api/
│       ├── groq/route.js          # AI: id_scan, ai_insight, chat
│       └── alerts/route.js        # Email via Resend
│
├── components/
│   ├── DashboardView.js           # Main dashboard
│   ├── ScannerView.js             # AI ID scanner + booking form
│   ├── GuestsView.js              # Guest list + GRC print
│   ├── ReportsView.js             # Revenue charts + booking history
│   ├── SettingsView.js            # All hotel settings
│   └── LoginScreen.js             # Hotel selector + PIN login (logo here)
│
├── lib/
│   ├── db.js                      # Data layer: Supabase + localStorage
│   └── alerts.js                  # WhatsApp + email notifications
│
├── public/
│   ├── branding/
│   │   └── logo-main.png          # 1200×400 — main brand logo (used in app + landing)
│   ├── icons/
│   │   ├── apple-touch-icon.png   # 180×180 — iOS home screen
│   │   ├── icon-192.png           # 192×192 — Android PWA icon
│   │   └── icon-512.png           # 512×512 — PWA splash / store
│   ├── manifest.json              # PWA manifest (icon paths must match actual files)
│   └── landing.html               # Public marketing page (logo in nav + footer)
│
└── supabase_schema.sql            # Database setup
```

---

## 🔢 Quick Reference — API Routes

| Route | Method | Types | Purpose |
|---|---|---|---|
| `/api/groq` | POST | `id_scan` | Scan ID document image |
| `/api/groq` | POST | `ai_insight` | Generate revenue insight |
| `/api/groq` | POST | `chat` | Guest chatbot reply |
| `/api/alerts` | POST | `email` | Send email notification |

---

## 🏷️ Supported ID Documents

| Document | Country | Fields |
|---|---|---|
| Aadhaar Card | India | Name, DOB, Gender, Address, 12-digit number |
| PAN Card | India | Name, DOB, PAN number |
| Driving License | India | Name, DOB, DL number, Address |
| Voter ID | India | Name, Address, EPIC number |
| Passport | All | Name, DOB, Passport no., Expiry, Nationality |
| Foreign Passport | International | + Visa details for India entry |

---

## 🛠️ Common Bugs & Their Fixes

| Bug | Root Cause | Fix |
|---|---|---|
| PWA icon not showing on Android | `manifest.json` referenced `icon-192x192.png` (wrong name) | Changed to `icon-192.png` |
| iOS home screen icon broken | `layout.js` had `href="/icons/icon-192x192.png"` | Changed to `href="/icons/apple-touch-icon.png"` |
| Login screen shows emoji 🏨 instead of logo | `logo-main.png` was not wired to LoginScreen | Replaced emoji div with `<img src="/branding/logo-main.png">` |
| Landing page uses SVG placeholder logo | `logo-main.png` existed but wasn't used in landing.html | Replaced both SVG logo-marks with `<img src="/branding/logo-main.png">` |

---

*Last updated: May 2026 | The GuestInn v2.0*
