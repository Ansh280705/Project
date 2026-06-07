// Shared WhatsApp Cloud API helper.
// Called server-side only — credentials never exposed to the frontend.
// Underscore prefix tells Vercel to NOT expose this as an API route.

export async function sendWhatsApp(to, message) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    throw new Error('WhatsApp credentials not configured. Set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN env vars.');
  }

  // Strip all non-digit characters so "91 98765 43210" becomes "919876543210"
  const cleanPhone = to.replace(/\D/g, '');

  if (cleanPhone.length < 10) {
    throw new Error(`Phone number "${to}" is too short after stripping non-digits. Include country code (e.g. 919876543210).`);
  }

  const res = await fetch(
    `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: cleanPhone,
        type: 'text',
        text: { body: message },
      }),
    }
  );

  if (!res.ok) {
    // Parse Meta's error response and surface a meaningful message
    const err = await res.json().catch(() => ({}));
    const metaMsg = err?.error?.message || 'WhatsApp Cloud API request failed';
    throw new Error(metaMsg);
  }

  return await res.json();
}
