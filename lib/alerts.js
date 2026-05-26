/**
 * Triple Alert System - WhatsApp Notifications
 * Sends 3 separate alerts: Owner, Customer, Manager
 * Placeholder-safe: missing phone numbers are skipped gracefully
 */

export async function sendBookingAlerts(booking) {
  const results = { owner: null, customer: null, manager: null };

  // 1. OWNER ALERT — Revenue + guest details (anti-theft proof)
  const ownerPhone = process.env.NEXT_PUBLIC_OWNER_PHONE;
  if (ownerPhone && ownerPhone !== "+919999999999") {
    results.owner = await sendWhatsApp(ownerPhone, formatOwnerMessage(booking));
  } else {
    console.log("[ALERT - OWNER]", formatOwnerMessage(booking));
    results.owner = { success: true, mode: "console_log" };
  }

  // 2. CUSTOMER ALERT — Confirmation with locked price (prevents overcharging)
  if (booking.guestPhone && booking.guestPhone.length > 6) {
    results.customer = await sendWhatsApp(
      booking.guestPhone,
      formatCustomerMessage(booking)
    );
  } else {
    console.log("[ALERT - CUSTOMER] No phone provided, skipping.");
    results.customer = { success: true, mode: "skipped_no_phone" };
  }

  // 3. MANAGER ALERT — Success confirmation
  const managerPhone = process.env.NEXT_PUBLIC_MANAGER_PHONE;
  if (managerPhone && managerPhone !== "+918888888888") {
    results.manager = await sendWhatsApp(
      managerPhone,
      formatManagerMessage(booking)
    );
  } else {
    console.log("[ALERT - MANAGER]", formatManagerMessage(booking));
    results.manager = { success: true, mode: "console_log" };
  }

  return results;
}

async function sendWhatsApp(phone, message) {
  try {
    const response = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, message }),
    });
    return await response.json();
  } catch (error) {
    console.error(`[ALERT] Failed to send to ${phone}:`, error);
    return { success: false, error: error.message };
  }
}

function formatOwnerMessage(booking) {
  const hotelName =
    process.env.NEXT_PUBLIC_HOTEL_NAME || "Your Hotel";
  return `🏨 *${hotelName} - NEW CHECK-IN ALERT*

👤 *Guest:* ${booking.guestName || "—"}
📱 *Phone:* ${booking.guestPhone || "N/A"}
🪪 *ID:* ${booking.idType || "—"} - ${booking.idNumber || "—"}
🏠 *Room:* ${booking.roomId} (${booking.roomType || "standard"})
📅 *Check-in:* ${new Date(booking.checkInDate).toLocaleDateString("en-IN")}
📅 *Check-out:* ${booking.checkOutDate ? new Date(booking.checkOutDate).toLocaleDateString("en-IN") : "—"}
🌙 *Nights:* ${booking.nights}

💰 *RATE LOCKED:* ₹${Number(booking.ratePerNight || 0).toLocaleString("en-IN")}/night
💵 *TOTAL AMOUNT:* ₹${Number(booking.totalAmount || 0).toLocaleString("en-IN")}
💳 *Payment Mode:* ${booking.paymentMode || "—"}

⏰ *Time:* ${new Date(booking.createdAt).toLocaleString("en-IN")}
🔒 *Booking ID:* ${booking.id}

_Ye rate ab lock ho gaya hai. Koi change nahi ho sakta._
_— AI Receptionist System_`;
}

function formatCustomerMessage(booking) {
  const hotelName =
    process.env.NEXT_PUBLIC_HOTEL_NAME || "Your Hotel";
  return `🌟 *${hotelName}*
*Aapka Booking Confirm Ho Gaya!*

Namaste ${booking.guestName || "Guest"} Ji! 🙏

🏠 *Room Number:* ${booking.roomId}
📅 *Check-in:* ${new Date(booking.checkInDate).toLocaleDateString("en-IN")}
📅 *Check-out:* ${booking.checkOutDate ? new Date(booking.checkOutDate).toLocaleDateString("en-IN") : "—"}
🌙 *Nights:* ${booking.nights}

💰 *Room Rate:* ₹${Number(booking.ratePerNight || 0).toLocaleString("en-IN")}/night
💵 *TOTAL PAID:* ₹${Number(booking.totalAmount || 0).toLocaleString("en-IN")}
💳 *Payment:* ${booking.paymentMode || "—"}

🔒 *Booking Reference:* ${booking.id}

_Agar aapko koi problem ho ya rate alag bataya jaye, toh is message ko dikhayein._

Thank you for choosing us! 🌹
_— ${hotelName}_`;
}

function formatManagerMessage(booking) {
  return `✅ *Check-in Successful!*

Room ${booking.roomId} — ${booking.guestName || "Guest"}
Amount: ₹${Number(booking.totalAmount || 0).toLocaleString("en-IN")}
Payment: ${booking.paymentMode || "—"}

*IMPORTANT:* Owner aur Guest ko bhi alert bhej diya gaya hai.
Rate ab lock hai — ₹${booking.ratePerNight}/night

Booking ID: ${booking.id}
_— AI Receptionist_`;
}
