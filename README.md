# 🏨 The GuestInn — AI-Powered Hotel Management SaaS

> **Smart automation. Happier guests. Higher revenue.**  
> Built for Indian hoteliers. Powered by Groq AI.

![Version](https://img.shields.io/badge/version-2.0.0-gold)
![Stack](https://img.shields.io/badge/stack-Next.js%2014-black)
![AI](https://img.shields.io/badge/AI-Groq%20Llama%204-blue)
![Database](https://img.shields.io/badge/database-Supabase-green)

---

## 📱 Live Demo

```
App:          https://ai-receptionist-sandy-six.vercel.app
Demo Hotels:  /booking/hotel-cherry
              /booking/hotel-sunrise
              /booking/sunrise-jaipur
```

---

## 🚀 Features

### 🤖 AI Receptionist
- Groq AI powered (Llama 4 Scout + Llama 3.3 70B)
- 24/7 guest query handling
- Hinglish (Hindi + English) responses
- Real-time operational insights
- Dynamic revenue suggestions

### 🏨 Multi-Hotel SaaS
- Unlimited hotels on single deployment
- Each hotel gets unique URL: `/booking/[hotelId]`
- Per-hotel dashboard, rooms, bookings, settings
- Supabase database — all devices synced
- localStorage cache for offline use

### 📋 Guest Registration (India Compliance)
- Full GRC (Guest Registration Card) form
- Fields matching Indian hotel regulations:
  - Name, DOB, Gender, Nationality
  - Address, Mobile, Email
  - ID Type (Aadhaar/Passport/DL/Voter ID/PAN)
  - Company Name, GST No.
  - Arrival From, Proceeding To
  - Purpose of Visit
  - Passport/Visa details (foreign guests)
- Up to 8 guests per booking
- Each guest's ID stored separately

### 📸 AI ID Scanner
- Camera-based ID scanning (front + back)
- Groq Vision AI extracts all fields automatically
- Supports: Aadhaar, Passport, PAN, DL, Voter ID
- ID image thumbnail saved with record
- 99% accuracy, ~3 second scan time
- Foreign passport + visa support

### 🛏 Room Management
- Visual room grid with 3D key-cap design
- Color codes:
  - 🟢 Green = Occupied
  - 🔴 Red = Vacant  
  - 🟡 Gold = Reserved
  - ⚫ Gray = Out of Order
- Click any room → details + actions
- Actions: Check-in, Check-out, AI Scan, Out of Order, Mark Vacant

### 💰 Rate Lock System
- Rate set at check-in is permanently locked
- Cannot be changed after lock
- WhatsApp proof sent to guest
- Anti-theft protection for hotel owners
- Rate slider + manual input (₹100 to ₹99,999)

### 🌐 Public Booking Page
- Each hotel gets: `yourapp.vercel.app/booking/[hotelId]`
- Share on Google My Business, WhatsApp, Instagram
- No commission (replaces Booking.com/Agoda)
- AI chatbot for guest queries + room booking
- Visual calendar date picker
- Room type cards with photos
- Direct call button
- FAQ section
- Guest lead capture → Supabase

### 📱 WhatsApp Alerts (Triple System)
1. **Owner** — Booking details + locked rate
2. **Manager** — Quick check-in confirmation  
3. **Guest** — Booking confirmation with rate proof

### 📧 Email Notifications
- Powered by Resend (free tier: 100/day)
- HTML email with hotel branding
- Same data as WhatsApp alert
- Owner + Manager both receive

### 🖨️ GRC Print
- One-click printable Guest Registration Card
- Hotel branding in header
- All guest details + ID images
- Foreign guest passport/visa section
- Terms & conditions
- Signature lines
- Auto-print on open

### 📊 Reports & Export
- 7-day revenue chart
- Today's stats: revenue, occupancy, check-ins
- CSV export — GRC-format with all fields
- JSON export — complete backup with ID images
- Extra guests expanded as separate rows

### 👥 Guests Tab
- All guests listed (primary + extra guests)
- Filter: All / Active / Checked Out
- Guest 2/3 badge for multi-guest bookings
- ID photo preview (front + back)
- One-tap call
- Print GRC from guest record
- CSV + JSON export buttons

### ⚙️ Settings (All Working)
- Hotel name, location, address, phone
- Total rooms (auto-reinitializes grid)
- GST percentage
- Room rates: Standard / Deluxe / Suite
  - Quick presets: 600, 800, 1K, 1.2K, 1.5K, 2K...
  - Manual type + slider
- Checkout time: 10:00 / 11:00 / 12:00 / 13:00
- Owner + Manager phone (WhatsApp alerts)
- Owner + Manager email
- Test WhatsApp + Test Email buttons
- Login PINs change
- Booking page link + copy
- Data export (CSV + JSON)
- Danger zone: clear booking data

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 App Router |
| Styling | Tailwind CSS |
| AI | Groq (Llama 4 Scout Vision + Llama 3.3 70B) |
| Database | Supabase (PostgreSQL) |
| Cache | localStorage (offline-first) |
| Email | Resend API |
| Charts | Recharts |
| Icons | Lucide React |
| Deployment | Vercel |
| PWA | next-pwa |

---

## 📦 Installation

```bash
git clone https://github.com/your-username/guestinn.git
cd guestinn
npm install
```

### Environment Variables

Create `.env.local`:

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxx...
MY_GROQ_KEY=gsk_xxxx...

# Push Notifications (VAPID keys — generate once, never change)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BD5bPQrz...   # Public — safe to expose
VAPID_PRIVATE_KEY=5UwETRnu...              # SECRET — server only
VAPID_SUBJECT=mailto:you@yourdomain.com    # Contact email

# Optional
RESEND_API_KEY=re_xxxx...          # Email alerts
```

### Supabase Setup

Run `supabase_schema.sql` in Supabase SQL Editor:

```sql
-- Creates: hotels, bookings, leads tables
-- With full RLS policies
-- Includes demo hotel data
```

```bash
npm run dev
```

---

## 🗄️ Database Schema

### hotels
```
id, name, location, total_rooms, plan, emoji,
owner_pin, manager_pin, owner_phone, created_at
```

### bookings
```
id, hotel_id, guest_name, guest_phone, address,
id_type, id_number, gender, dob, room_id, room_type,
check_in_date, check_out_date, nights,
rate_per_night, total_amount, payment_mode,
status, rate_locked, total_guests,
extra_guests (JSON), id_image_front, id_image_back,
created_at
```

### leads (from public booking page)
```
id, hotel_id, guest_name, guest_phone,
check_in_date, check_out_date, room_type,
message, status, created_at
```

---

## 🔗 URL Structure

```
/                           → Hotel selector / Login
/booking/[hotelId]          → Public guest booking page
/h/[hotelId]                → Staff direct login
```

---

## 👤 User Roles

| Role | Access |
|---|---|
| **Owner** | All features + settings + danger zone |
| **Manager** | Dashboard, bookings, scanner, guests, reports |

PIN-based login — 4 digits, set in Settings.

---

## 📱 Mobile First

- PWA installable (Add to Home Screen)
- Optimized for phone screens
- Touch-friendly UI
- Vibration feedback
- Camera access for ID scanning

---

## 🔒 Security

- Rate lock — prevents staff fraud
- Triple WhatsApp alerts as proof
- Per-hotel data isolation
- Supabase RLS policies
- PIN-based authentication

---

## 🗺️ Roadmap

- [ ] UPI payment integration
- [ ] Digital signature on GRC
- [ ] Bulk WhatsApp messaging
- [ ] Revenue forecasting AI
- [ ] Multi-property dashboard
- [ ] Mobile app (React Native)
- [ ] Police C-Form auto-generation
- [ ] OTA channel manager integration

---

## 📄 License

MIT © 2025 The GuestInn

---

*Powered by Groq AI • Built with ❤️ for Indian Hospitality*
