# 🏨 The GuestInn — Setup Guide

## Problem Jo Fix Hua
- ❌ Pehle: Hotel register karo → sirf usi phone pe dikhta tha (localStorage)
- ✅ Ab: Supabase database → SABHI phones pe dikhai deta hai
- ✅ Ab: Har hotel ka ALAG link milta hai

## Quick Setup (5 minutes)

### Step 1 — Supabase Setup (FREE)
1. https://supabase.com pe jaao → New Project banao
2. SQL Editor mein jaao → `supabase_schema.sql` file ka content paste karo → Run karo
3. Settings → API → Copy karo:
   - `Project URL` → NEXT_PUBLIC_SUPABASE_URL
   - `anon public` key → NEXT_PUBLIC_SUPABASE_ANON_KEY

### Step 2 — Vercel Environment Variables
Vercel Dashboard → Your Project → Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL     = https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJxxxx...
MY_GROQ_KEY                   = gsk_xxxx...
```

### Step 3 — Deploy
```bash
git add -A
git commit -m "fix: multi-device hotel sync + direct hotel links"
git push origin main
```

---

## Har Hotel Ka Alag Link

Jab koi hotel register hota hai, uska link banta hai:
```
https://yourapp.vercel.app/h/hotel-amardeep-xyz123
```

Yeh link share karo hotel ke saare staff ke saath.
Koi bhi is link pe jaake directly PIN enter karke login kar sakta hai.

## Hotel Owner Ko Kya Bhejo

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏨 The GuestInn Access

Hotel: [Hotel Name]
Link:  https://yourapp.vercel.app/h/[hotel-id]

Owner PIN:   XXXX
Manager PIN: YYYY

📱 Phone pe install:
   Link kholo → Share → "Add to Home Screen"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Files Jo Badli Hain

- `lib/db.js` — Supabase hybrid sync
- `components/LoginScreen.js` — Async hotel loading + Supabase sync
- `app/h/[hotelId]/page.js` — NEW: Direct hotel link page
- `supabase_schema.sql` — Updated schema
- `app/api/groq/route.js` — Fixed AI model (llama-4-scout)
