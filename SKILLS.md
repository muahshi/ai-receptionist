# 🎯 The GuestInn Network v2.0 — SKILLS.md
> **Claude ke liye complete technical reference.**
> Koi bhi feature implement karne ya bug fix karne se pehle yeh file padho.
> Yeh file project ka single source of truth hai.

---

## 🗂️ 1. PROJECT MAP

```
app/
  page.js                    ← Marketplace shell. NeuralCanvas + HeroSearchSection +
                               AdvantageGrid + MarketplaceHotels + NegotiatorOrb.
                               pendingSearchQuery state yahan hai — HeroSearch → Orb bridge.
  layout.js                  ← Root layout. apple-touch-icon, fonts, PWA meta.
  globals.css                ← Global CSS. NO overflow:hidden globally.
                               Staff app: body.app-locked class se lock hota hai.
  dashboard/page.js          ← Staff hotel management app. Tab nav.
  booking/[hotelId]/page.js  ← Public guest booking. Standalone — db.js import nahi.
  h/[hotelId]/page.js        ← Staff direct login shortcut URL.
  api/
    groq/route.js            ← type: "id_scan"|"ai_insight"|"chat"|"negotiate"
                               "chat" mein body.systemOverride support hai.
    alerts/route.js          ← Email via Resend. POST {emails[], subject, html}
    push/route.js            ← action: "subscribe"|"send"|"unsubscribe". web-push npm.

components/
  HeroSearchSection.js       ← Marketplace hero. LiveNetworkCanvas + voice search + input.
                               Props: onSearch(queryString) — lifts to page.js.
  NegotiatorOrb.js           ← Floating AI chat. Groq via /api/groq.
                               Props: pendingQuery, forceOpen, onQueryConsumed.
                               consumedRef.current prevents double-fire.
  MarketplaceHotels.js       ← Hotel cards. useRouter → /booking/[hotelId].
  AdvantageGrid.js           ← Feature benefits cards section.
  DashboardView.js           ← Staff dashboard. Room grid, revenue, AI insight, push bell.
  ScannerView.js             ← AI ID scanner + booking form.
  GuestsView.js              ← Guest list + GRC print HTML generation.
  ReportsView.js             ← Revenue charts (Recharts) + history.
  SettingsView.js            ← Settings form. Rate slider + manual input + presets.
  LoginScreen.js             ← Hotel selector + PIN login.

lib/
  db.js                      ← SINGLE SOURCE OF TRUTH for data. Read before any data work.
  db.supabase.js             ← Supabase-specific functions.
  hotelConfig.js             ← Hotel config helpers.
  alerts.js                  ← sendBookingAlerts(). WhatsApp + Email + Push.
  usePushNotifications.js    ← React hook. subscribe/unsubscribe + Web Audio bell.
```

---

## 🔗 2. CRITICAL STATE SYNC — Hero → Orb

Yeh sabse important architecture hai. Galat samjho to "Kaunsi city?" bug wapas aata hai.

### page.js mein (bridge state)
```js
const [pendingSearchQuery, setPendingSearchQuery] = useState(null);
const [orbForceOpen, setOrbForceOpen]             = useState(false);

const handleHeroSearch = useCallback((queryText) => {
  setPendingSearchQuery(queryText);  // query set karo
  setOrbForceOpen(true);             // orb kholo
}, []);

const clearPendingQuery = useCallback(() => {
  setPendingSearchQuery(null);
  setOrbForceOpen(false);
}, []);
```

```jsx
<HeroSearchSection onSearch={handleHeroSearch} />
<NegotiatorOrb
  pendingQuery={pendingSearchQuery}
  forceOpen={orbForceOpen}
  onQueryConsumed={clearPendingQuery}
/>
```

### HeroSearchSection.js mein (sender)
```js
// onSearch prop milta hai page.js se
const handleSubmit = useCallback(() => {
  const query = userInput.trim();
  if (!query) return;
  if (onSearch) onSearch(query);   // ← yeh page.js ko query deta hai
  setUserInput("");
}, [userInput, onSearch]);
```

### NegotiatorOrb.js mein (receiver)
```js
const consumedRef = useRef(null); // prevent double-fire

useEffect(() => {
  if (!pendingQuery || pendingQuery === consumedRef.current) return;
  consumedRef.current = pendingQuery;   // mark as consumed

  setOpen(true);
  setPulse(false);

  const userMsg = { id: msgIdCounter++, role:"user", text:pendingQuery, time:"Just now" };
  setMessages([userMsg]);
  setThinking(true);

  // SEEDHA Groq call — koi greeting nahi, koi "kaunsi city" nahi
  callGroq([{ role:"user", content:pendingQuery }]).then(reply => {
    setMessages(prev => [...prev, { id:msgIdCounter++, role:"ai", text:reply, time:"Now" }]);
    setThinking(false);
  });

  if (onQueryConsumed) onQueryConsumed();
}, [pendingQuery]);
```

**Rule:** `consumedRef` check karo pehle — warna React strict mode double-fire karta hai aur 2 messages aa jaate hain.

---

## 🎨 3. LIVE NETWORK CANVAS

File: `components/HeroSearchSection.js` → `LiveNetworkCanvas()` function

### Canvas Setup
```js
const dpr = window.devicePixelRatio || 1;
canvas.width  = canvas.offsetWidth  * dpr;
canvas.height = canvas.offsetHeight * dpr;
ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
// → Retina/HiDPI displays pe sharp rendering
```

### Node Types
```js
const TYPES = {
  person: { color:"#22c55e", emoji:"👤", label:"GUEST",    size:22, glowR:38 },
  hotel:  { color:"#D4AF37", emoji:"🏨", label:"HOTEL",    size:26, glowR:46 },
  ai:     { color:"#38bdf8", emoji:"⬡",  label:"AI·AGENT", size:20, glowR:34 },
};
```

### Connection Logic
```js
const CD = Math.min(W() * 0.40, 260); // connect distance
// Nodes jo CD se closer hain unke beech line draw hoti hai
// Animated dashed line: ctx.setLineDash([5,9]) + lineDashOffset -= frame*0.9
// Gradient: node A ka color → node B ka color
```

### Particle Flow
```js
// particle = { fx,fy, tx,ty, t:0, speed, color, r, tail:[] }
// t: 0→1 travel karta hai, Math.sin(t*PI) = fade in/out
// tail array = last 10 positions = glowing trail effect
// spawn: frame%50 === (i*j)%50 && Math.random()>0.45
```

### Ping Rings
```js
// Har node pe random intervals pe ping ring animate hoti hai
if (frame % 80 === (i*5)%80) n.pingT = 0;
if (n.pingT >= 0) n.pingT += 0.045;
// Ring radius badhti hai: (r+6) + n.pingT*32
// Opacity ghatti hai: (1-pingT)*200
```

### Vignette (canvas wrapper div ke andar)
```js
// Left side heavy vignette (text readable) → right-bottom light (nodes visible)
background: `
  radial-gradient(ellipse 55% 90% at 28% 50%, rgba(7,9,14,0.72) 0%, rgba(7,9,14,0.15) 100%),
  radial-gradient(ellipse 40% 80% at 85% 50%, rgba(7,9,14,0.5) 0%, rgba(7,9,14,0.1) 100%)
`
// Agar nodes visible nahi → is vignette ko aur light karo (0.72 → 0.5)
// Agar text readable nahi → heavy karo (0.72 → 0.85)
```

---

## 🎤 4. VOICE SEARCH

File: `components/HeroSearchSection.js`

### Implementation
```js
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const recog = new SR();
recog.lang = "hi-IN";         // Hindi + English dono
recog.continuous = false;
recog.interimResults = true;  // real-time transcript

recog.onresult = (event) => {
  const transcript = Array.from(event.results).map(r => r[0].transcript).join("");
  setUserInput(transcript);    // input mein live dikhao

  if (event.results[event.results.length-1].isFinal) {
    // Final result → auto submit to NegotiatorOrb
    if (transcript.trim() && onSearch) {
      setTimeout(() => { onSearch(transcript.trim()); setUserInput(""); }, 400);
    }
  }
};
```

### Error Messages (Hinglish)
```js
"not-allowed" → "Mic permission denied — please allow mic access"
"no-speech"   → "Kuch suna nahi — dobara try karein"
default       → "Voice error: " + e.error
```

### Browser Support
- Chrome: ✅ Full support
- Safari iOS: ✅ (webkitSpeechRecognition)
- Firefox: ❌ Not supported
- `voiceSupported` state se mic button conditionally render karo

---

## 🤖 5. GROQ API — /api/groq/route.js

### Type: chat (Marketplace use karta hai)
```js
// systemOverride support — yeh NegotiatorOrb se aata hai
const systemPrompt = body.systemOverride || `default hotel receptionist prompt...`;

const res = await groq.chat.completions.create({
  model: "llama-3.3-70b-versatile",
  max_tokens: 300,
  messages: [
    { role: "system", content: systemPrompt },
    ...(body.messages || [])
  ]
});
```

### NegotiatorOrb ka systemOverride
```js
const MARKETPLACE_SYSTEM = `You are AI Hotel Negotiator for The GuestInn Network...
Hinglish mein baat karo. Max 3-4 lines.

Available Hotels:
• Hotel Cherry, Bhopal — ₹1200/night, Rating 4.6, ...
• Boutique Stays, Jaipur — ₹1150/night, Rating 4.7, ...
• Hotel Midtown, Indore — ...
• City Comforts, Nagpur — ...

Rules:
1. City mention hai → SEEDHA hotels dikhao, mat poochho "kaunsi city"
2. Price ₹ mein
3. View Hotel button mention karo for booking
4. AI Rate Lock + 0% commission batao`;
```

### Type: id_scan
```js
{ type:"id_scan", imageBase64:"..." }
// Model: meta-llama/llama-4-scout-17b-16e-instruct (Vision)
// Returns: { name, dob, address, idNumber, idType, gender }
// gender: "M" | "F"  (component mein "Male"/"Female" convert karo)
```

### Type: negotiate
```js
{ type:"negotiate", requestedRate, roomType, bookingContext }
// Rate lock logic yahan hai
```

---

## 💾 6. DATA LAYER — lib/db.js

### Rate Format — CRITICAL
```js
// saveHotelConfig() dono formats save karta hai:
{
  rates: { standard:1200, deluxe:2000, suite:3800 },  // Settings padhta hai
  standardRate: 1200,   // booking/[hotelId]/page.js + rooms padhte hain
  deluxeRate:   2000,
  suiteRate:    3800,
}
// KABHI direct localStorage.setItem mat karo config ke liye
// Hamesha saveHotelConfig() use karo
```

### Key Functions
```js
getHotelConfig(hotelId)         // Config + rate normalization
saveHotelConfig(hotelId, data)  // Dono formats + Supabase sync
getRooms(hotelId)               // Rooms + baseRate sync from config
saveBooking(hotelId, booking)   // localStorage + Supabase
updateRoomStatus(hotelId, roomId, status, bookingId, guestName)
exportCSV(hotelId)              // Browser download trigger
exportAllData(hotelId)          // JSON dump — config + bookings + rooms
```

### Room Status Values
```
"vacant"       → Green — clickable on booking page
"reserved"     → Gold — public booking se aaya, staff approve nahi kiya
"occupied"     → Red — staff ne check-in kar diya
"cleaning"     → Indigo
"out_of_order" → Gray
```

### Offline-First
```
Write: localStorage (instant) → Supabase (background async)
Read:  Supabase try → fail → localStorage fallback
Result: App works even when Supabase is down
```

---

## 🏨 7. PUBLIC BOOKING PAGE — booking/[hotelId]/page.js

⚠️ **Standalone file** — `lib/db.js` import nahi karta (server/client mismatch avoid)

```js
// Internal functions defined in file:
fetchHotel()          // Supabase → localStorage → DEMOS fallback
savePublicBooking()   // mirrors db.js, sets isPublicBooking:true
getRooms()            // localStorage se rooms

// isPublicBooking:true → room status "reserved" (not "occupied")
// Staff dashboard pe "reserved" gold color mein dikhta hai
```

---

## 📜 8. SCROLL ARCHITECTURE

### globals.css
```css
html { overflow-x: hidden; }
body { overflow-x: hidden; -webkit-overflow-scrolling: touch; }
body.app-locked { overflow: hidden; overscroll-behavior: none; }
/* NO overflow:hidden on html/body globally */
```

### Staff App (dashboard/page.js)
```js
useEffect(() => {
  document.body.classList.add("app-locked");
  return () => document.body.classList.remove("app-locked");
}, []);
```

### Booking Page + Marketplace
```
// Koi class nahi lagate — body natural scroll kare
// KABHI overflow:hidden mat lagao kisi bhi wrapper pe
```

---

## 🔔 9. PUSH NOTIFICATIONS

### Flow
```
Header Bell → usePushNotifications.subscribe()
  → navigator.serviceWorker.register('/sw-push.js')
  → pushManager.subscribe({ applicationServerKey: VAPID_PUBLIC })
  → POST /api/push { action:"subscribe", hotelId, subscription }
  → Supabase push_subscriptions mein save

Room Book → sendBookingAlerts(booking)
  → POST /api/push { action:"send", hotelId, payload }
  → Supabase se sab subscriptions fetch
  → web-push.sendNotification() → browser push server
  → sw-push.js "push" event → showNotification() + vibrate
```

### Sound (Web Audio — no file needed)
```js
// playNotificationSound() in usePushNotifications.js
// 3-note: D5(587Hz) → G5(784Hz) → B5(987Hz)
// OscillatorNode + exponentialRampToValueAtTime
```

### VAPID Rule
```
NEVER change VAPID keys after deployment
→ existing subscribers expire hote hain aur unsubscribe ho jaate hain
→ Keys generate once, store securely, kabhi rotate mat karo
```

---

## 🎨 10. DESIGN TOKENS

### Colors
```css
--bg-primary:  #07090E   /* Deep space */
--gold:        #D4AF37   /* Primary accent */
--gold-warm:   #b8960c   /* Darker gold for gradients */
--blue-cyber:  #008cff   /* Neon blue */
--blue-soft:   #38bdf8   /* AI node color */
--green:       #22c55e   /* Network online / guest nodes */
--red:         #ef4444   /* Error / occupied */
--amber:       #f59e0b   /* Reserved / warning */
--indigo:      #818cf8   /* Cleaning */
```

### Glow Patterns
```css
/* Gold glow (buttons, accents) */
box-shadow: 0 4px 16px rgba(212,175,55,0.4);
filter: drop-shadow(0 0 12px rgba(212,175,55,0.4));

/* Blue glow (AI elements) */
box-shadow: 0 0 16px rgba(0,140,255,0.4);
filter: drop-shadow(0 0 16px #008cff);

/* Green glow (network online) */
box-shadow: 0 0 8px #22c55e;
```

### Animation Keyframes
```css
@keyframes netPulse   /* Network Online badge dot */
@keyframes netRing1   /* Badge pulse ring 1 */
@keyframes netRing2   /* Badge pulse ring 2 — offset 0.3s */
@keyframes cursorBlink /* Search input caret */
@keyframes voicePing  /* Mic active ring */
@keyframes voiceBar   /* Waveform bars */
@keyframes thinkDot   /* NegotiatorOrb typing indicator */
@keyframes orbRing    /* Floating orb pulse rings */
```

---

## 📦 11. ENV VARIABLES

| Variable | Required | Where |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | db.js, push route, booking page |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | db.js, push route, booking page |
| `MY_GROQ_KEY` | ✅ | api/groq/route.js |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Push | usePushNotifications.js |
| `VAPID_PRIVATE_KEY` | Push | api/push/route.js (server only) |
| `VAPID_SUBJECT` | Push | api/push/route.js |
| `RESEND_API_KEY` | Email | api/alerts/route.js |

---

## 🐛 12. KNOWN BUGS HISTORY & FIXES

| Bug | Root Cause | Fix |
|---|---|---|
| NegotiatorOrb "Kaunsi city?" generic reply | No state sync between Hero and Orb | `pendingSearchQuery` in page.js + consumedRef in Orb |
| AI chat "Network issue" error | Anthropic API call (wrong key) | Use `/api/groq` with `MY_GROQ_KEY` |
| Orb fires twice on query | React StrictMode double-effect | `consumedRef.current` check karo |
| View Hotel button kaam nahi | No onClick on button | `useRouter` + `router.push('/booking/${hotel.id}')` |
| Rates Settings se match nahi | `standardRate` vs `rates.standard` mismatch | `saveHotelConfig` normalize karta hai dono |
| Background animation invisible | Vignette too dark + nodes too small | Nodes size 2x, vignette lighter |
| Voice search submit nahi hota | SpeechRecognition `isFinal` check missing | `isFinal` → `onSearch(transcript)` |
| `useState` inside `.reduce()` | React rules of hooks violation | Move FAQ to separate component |
| Push notification nahi aati | `web-push` package missing | `npm install web-push` |
| Booking page scroll locked | `overflow:hidden` on body globally | `app-locked` class pattern |
| PWA icon 404 | Wrong filenames in manifest | `icon-192.png` not `icon-192x192.png` |
| JSON export kaam nahi | `exportAllData` function missing | Latest db.js use karo |

---

## 🚀 13. DEPLOYMENT CHECKLIST

```
□ .env.local — MY_GROQ_KEY, SUPABASE vars, VAPID keys set hain
□ Vercel environment variables — same sab add ki hain
□ supabase_schema.sql — SQL Editor mein run ho gaya
□ package.json — "web-push": "^3.6.7" hai, npm install chala
□ manifest.json — exact icon filenames: icon-192.png, icon-512.png
□ layout.js — <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
□ globals.css — NO overflow:hidden globally, sirf body.app-locked mein
□ VAPID keys — generate ho gayi, KABHI change mat karna
□ api/groq/route.js — body.systemOverride support hai
□ NegotiatorOrb.js — callGroq() → /api/groq, NOT Anthropic direct
```

---

## 📊 14. SUPABASE SCHEMA

```sql
-- Hotels table
CREATE TABLE hotels (
  id TEXT PRIMARY KEY,
  name TEXT, location TEXT, total_rooms INTEGER,
  plan TEXT DEFAULT 'basic', emoji TEXT,
  owner_pin TEXT, manager_pin TEXT,
  owner_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Bookings table
CREATE TABLE bookings (
  id TEXT PRIMARY KEY,
  hotel_id TEXT REFERENCES hotels(id),
  guest_name TEXT, guest_phone TEXT, address TEXT,
  id_type TEXT, id_number TEXT, gender TEXT, dob TEXT,
  room_id TEXT, room_type TEXT,
  check_in_date TEXT, check_out_date TEXT,
  nights INTEGER, rate_per_night NUMERIC,
  total_amount NUMERIC, payment_mode TEXT,
  status TEXT DEFAULT 'confirmed',
  rate_locked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Push subscriptions
CREATE TABLE push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id TEXT REFERENCES hotels(id),
  role TEXT, endpoint TEXT UNIQUE,
  p256dh TEXT, auth TEXT,
  subscription JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS (Row Level Security)
ALTER TABLE hotels              ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings            ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions  ENABLE ROW LEVEL SECURITY;

-- Open policies (app PIN se authenticate karta hai)
CREATE POLICY "all" ON hotels             FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all" ON bookings           FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all" ON push_subscriptions FOR ALL USING (true) WITH CHECK (true);
```

---

*The GuestInn Network v2.0 — Skills.md last updated: June 2026*
*Marketplace layer added: LiveNetworkCanvas, NegotiatorOrb state-sync, Voice Search, Groq chat integration*
