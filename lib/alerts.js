/**
 * Triple Alert System - WhatsApp Notifications
 * Sends 3 separate alerts: Owner, Customer, Manager
 */

export async function sendBookingAlerts(booking) {
  const results = { owner: null, customer: null, manager: null };

  try {
    // 1. OWNER ALERT - Revenue + Guest Details (Anti-theft proof)
    const ownerMessage = formatOwnerMessage(booking);
    results.owner = await sendWhatsApp(
      process.env.NEXT_PUBLIC_OWNER_PHONE,
      ownerMessage
    );

    // 2. CUSTOMER ALERT - Confirmation with EXACT price (Prevents overcharging)
    if (booking.guestPhone) {
      const customerMessage = formatCustomerMessage(booking);
      results.customer = await sendWhatsApp(booking.guestPhone, customerMessage);
    }

    // 3. MANAGER ALERT - Success confirmation
    const managerMessage = formatManagerMessage(booking);
    results.manager = await sendWhatsApp(
      process.env.NEXT_PUBLIC_MANAGER_PHONE,
      managerMessage
    );
  } catch (error) {
    console.error("Alert sending failed:", error);
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
    console.error(`Failed to send to ${phone}:`, error);
    return { success: false, error: error.message };
  }
}

function formatOwnerMessage(booking) {
  const hotelName = process.env.NEXT_PUBLIC_HOTEL_NAME || "Your Hotel";
  return `🏨 *${hotelName} - NEW CHECK-IN ALERT*

👤 *Guest:* ${booking.guestName}
📱 *Phone:* ${booking.guestPhone || "N/A"}
🪪 *ID:* ${booking.idType} - ${booking.idNumber}
🏠 *Room:* ${booking.roomId} (${booking.roomType})
📅 *Check-in:* ${new Date(booking.checkInDate).toLocaleDateString("en-IN")}
📅 *Check-out:* ${new Date(booking.checkOutDate).toLocaleDateString("en-IN")}
🌙 *Nights:* ${booking.nights}

💰 *RATE LOCKED:* ₹${booking.ratePerNight.toLocaleString("en-IN")}/night
💵 *TOTAL AMOUNT:* ₹${booking.totalAmount.toLocaleString("en-IN")}
💳 *Payment Mode:* ${booking.paymentMode}

⏰ *Time:* ${new Date(booking.createdAt).toLocaleString("en-IN")}
🔒 *Booking ID:* ${booking.id}

_Ye rate ab lock ho gaya hai. Koi change nahi ho sakta._
_— AI Receptionist System_`;
}

function formatCustomerMessage(booking) {
  const hotelName = process.env.NEXT_PUBLIC_HOTEL_NAME || "Your Hotel";
  return `🌟 *${hotelName}*
*Aapka Booking Confirm Ho Gaya!*

Namaste ${booking.guestName} Ji! 🙏

Aapki booking ki poori details:

🏠 *Room Number:* ${booking.roomId}
📅 *Check-in:* ${new Date(booking.checkInDate).toLocaleDateString("en-IN")}
📅 *Check-out:* ${new Date(booking.checkOutDate).toLocaleDateString("en-IN")}
🌙 *Nights:* ${booking.nights}

💰 *Room Rate:* ₹${booking.ratePerNight.toLocaleString("en-IN")}/night
💵 *TOTAL PAID:* ₹${booking.totalAmount.toLocaleString("en-IN")}
💳 *Payment:* ${booking.paymentMode}

🔒 *Booking Reference:* ${booking.id}

_Agar aapko koi problem ho ya rate alag bataya jaye, toh is message ko dikhayein._

Thank you for choosing us! 🌹
_— ${hotelName}_`;
}

function formatManagerMessage(booking) {
  return `✅ *Check-in Successful!*

Room ${booking.roomId} - ${booking.guestName}
Amount: ₹${booking.totalAmount.toLocaleString("en-IN")}
Payment: ${booking.paymentMode}

*IMPORTANT:* Owner aur Guest ko bhi alert bhej diya gaya hai.
Rate ab lock hai - ₹${booking.ratePerNight}/night

Booking ID: ${booking.id}
_— AI Receptionist_`;
}
