/**
 * lib/usePushNotifications.js
 * React hook — subscribe/unsubscribe from push notifications
 * Saves subscription to Supabase via /api/push
 */

"use client";
import { useState, useEffect, useCallback } from "react";

// ── VAPID public key — paste from .env.local ──
// In production: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw     = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function usePushNotifications(hotelId, userRole) {
  const [supported,    setSupported]    = useState(false);
  const [permission,   setPermission]   = useState("default");
  const [subscribed,   setSubscribed]   = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [swReg,        setSwReg]        = useState(null);

  // ── Check support & existing subscription on mount ────────────
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    setSupported(true);
    setPermission(Notification.permission);

    navigator.serviceWorker.register("/sw-push.js").then((reg) => {
      setSwReg(reg);
      reg.pushManager.getSubscription().then((sub) => {
        setSubscribed(!!sub);
      });
    }).catch((err) => {
      console.warn("[Push] SW registration failed:", err);
    });
  }, []);

  // ── Listen for messages from SW (booking clicked) ─────────────
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const handler = (e) => {
      if (e.data?.type === "BOOKING_NOTIFICATION_CLICKED") {
        // Could trigger a state update in the app here
        console.log("[Push] Notification clicked, data:", e.data);
      }
    };
    navigator.serviceWorker.addEventListener("message", handler);
    return () => navigator.serviceWorker.removeEventListener("message", handler);
  }, []);

  // ── Subscribe ─────────────────────────────────────────────────
  const subscribe = useCallback(async () => {
    if (!swReg || !VAPID_PUBLIC_KEY) {
      alert("Push notifications set up nahi hain. VAPID key missing hai.");
      return false;
    }
    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        alert("Notifications allow karo browser settings mein.");
        return false;
      }

      const sub = await swReg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      // Save subscription to Supabase via API
      await fetch("/api/push", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action:       "subscribe",
          hotelId,
          role:         userRole || "staff",
          subscription: sub.toJSON(),
        }),
      });

      setSubscribed(true);
      playNotificationSound(); // Test sound on subscribe
      return true;
    } catch (err) {
      console.error("[Push] Subscribe failed:", err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [swReg, hotelId, userRole]);

  // ── Unsubscribe ───────────────────────────────────────────────
  const unsubscribe = useCallback(async () => {
    if (!swReg) return;
    setLoading(true);
    try {
      const sub = await swReg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        await fetch("/api/push", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action:   "unsubscribe",
            hotelId,
            endpoint: sub.endpoint,
          }),
        });
      }
      setSubscribed(false);
    } catch (err) {
      console.error("[Push] Unsubscribe failed:", err);
    } finally {
      setLoading(false);
    }
  }, [swReg, hotelId]);

  return { supported, permission, subscribed, loading, subscribe, unsubscribe };
}

// ── Play notification sound (called from main thread too) ────────
export function playNotificationSound() {
  try {
    // Create a short "ding" using Web Audio API — no external file needed
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    
    const playTone = (freq, startTime, duration, gainVal) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type            = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(gainVal, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    // Hotel-bell style: three-note chime D-G-B
    const now = ctx.currentTime;
    playTone(587.3, now,        0.4, 0.5);  // D5
    playTone(784.0, now + 0.2,  0.4, 0.4);  // G5
    playTone(987.8, now + 0.4,  0.7, 0.6);  // B5

    // Close context after sound finishes
    setTimeout(() => ctx.close(), 1500);
  } catch (e) {
    console.warn("[Push] Sound failed:", e);
  }
}
