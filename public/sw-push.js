/**
 * sw-push.js — GuestInn Push Notification Service Worker
 * Handles incoming push events + plays notification sound
 */

const CACHE = "guestinn-v2";

// ── Install & Activate ──────────────────────────────────────────
self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(self.clients.claim());
});

// ── Push Event ──────────────────────────────────────────────────
self.addEventListener("push", (e) => {
  let data = {};
  try {
    data = e.data?.json() || {};
  } catch {
    data = { title: "GuestInn", body: e.data?.text() || "Naya notification" };
  }

  const title   = data.title   || "🏨 GuestInn";
  const body    = data.body    || "Naya booking hua hai!";
  const tag     = data.tag     || "booking-" + Date.now();
  const icon    = data.icon    || "/icons/icon-192.png";
  const badge   = data.badge   || "/icons/apple-touch-icon.png";
  const url     = data.url     || "/";
  const sound   = data.sound   || true;

  const options = {
    body,
    icon,
    badge,
    tag,
    vibrate:  [200, 100, 200, 100, 400],   // buzz pattern
    requireInteraction: true,               // stay until tapped
    silent: false,
    data: { url, sound, bookingData: data.bookingData || {} },
    actions: [
      { action: "view",    title: "📋 Details Dekho" },
      { action: "dismiss", title: "✕ Dismiss"        },
    ],
  };

  e.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// ── Notification Click ──────────────────────────────────────────
self.addEventListener("notificationclick", (e) => {
  e.notification.close();

  if (e.action === "dismiss") return;

  const url = e.notification.data?.url || "/";

  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.postMessage({ type: "BOOKING_NOTIFICATION_CLICKED", data: e.notification.data });
          return client.focus();
        }
      }
      // Open new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});

// ── Message from main thread ─────────────────────────────────────
self.addEventListener("message", (e) => {
  if (e.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
