const ok = (body) => ({
  statusCode: 200,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  },
  body: JSON.stringify(body),
});

const err = (code, msg) => ({
  statusCode: code,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  },
  body: JSON.stringify({ error: msg }),
});

exports.handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return err(405, "Method not allowed");
  }

  const WEBHOOK_URL = "https://discord.com/api/webhooks/1415993093806620763/RA9b6h0Wt6l2a2LRrhQEoKzgdYh6DHMFAUYJrZoN-iPP4la88bTz8CdcP8BDSn-gAT4Q";
  if (!WEBHOOK_URL) return err(500, "Server not configured");

  let data;
  try {
    data = JSON.parse(event.body || "{}");
  } catch {
    return err(400, "Invalid JSON");
  }

  // Honeypot + basic validation
  const { name = "", email = "", message = "", website = "" } = data;
  if (website) return err(400, "Bot detected"); // honeypot filled
  if (!name || !email || !message) return err(400, "Missing fields");

  // Build Discord payload
  const now = new Date().toISOString();
  const embeds = [{
    title: "📨 New Contact Form Submission",
    color: 0x6a3df0, // dark purple
    fields: [
      { name: "Name", value: name, inline: true },
      { name: "Email", value: email, inline: true },
      { name: "Message", value: message || "—" },
    ],
    timestamp: now,
  }];

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "Portfolio Bot", embeds }),
    });

    if (!res.ok) {
      const text = await res.text();
      return err(res.status, `Discord error: ${text}`);
    }
    return ok({ status: "sent" });
  } catch (e) {
    return err(502, "Failed to reach Discord");
  }
};
