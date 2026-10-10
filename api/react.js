// Vercel Serverless Function — API key remains server-side.
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ status: false, error: "Method not allowed" });
  }

  const apiKey = process.env.SASA_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      status: false,
      error: "Backend is not configured",
      message: "Set SASA_API_KEY in Vercel Project Settings → Environment Variables."
    });
  }

  const body = req.body || {};
  const url = typeof body.url === "string" ? body.url.trim() : "";
  const mode = body.mode === "normal" ? "normal" : "pro";
  const emojis = Array.isArray(body.emojis)
    ? body.emojis.filter(e => typeof e === "string").join("")
    : (typeof body.emojis === "string" ? body.emojis : "");

  let parsed;
  try { parsed = new URL(url); } catch {
    return res.status(400).json({ status: false, error: "Invalid URL" });
  }
  if (!["https:", "http:"].includes(parsed.protocol) ||
      !/(^|\.)whatsapp\.com$|(^|\.)whatsapp\.net$/i.test(parsed.hostname)) {
    return res.status(400).json({ status: false, error: "Please provide a valid WhatsApp URL" });
  }
  if (!emojis || emojis.length > 80) {
    return res.status(400).json({ status: false, error: "Choose at least one emoji" });
  }

  // The normal endpoint has reported scheduled maintenance. Default to Pro;
  // normal remains available as a manual alternative if the provider restores it.
  const endpoint = mode === "normal" ? "wa-channel-reacts" : "wa-channel-reacts-pro";
  const target = new URL(`https://sasa-dev-api.xyz/api/${endpoint}`);
  target.searchParams.set("apikey", apiKey);
  target.searchParams.set("url", url);
  target.searchParams.set("emojis", emojis);

  try {
    const upstream = await fetch(target.toString(), {
      method: "GET",
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(20000)
    });
    const raw = await upstream.text();
    let data;
    try { data = JSON.parse(raw); } catch { data = { raw }; }

    // Preserve provider status so the frontend can display maintenance/failure accurately.
    const providerFailed = !upstream.ok || data?.status === false || data?.maintenance === true;
    return res.status(providerFailed ? (upstream.ok ? 502 : upstream.status) : 200).json({
      status: !providerFailed,
      mode,
      providerHttpStatus: upstream.status,
      endpoint: `/${endpoint}`,
      result: data
    });
  } catch (error) {
    return res.status(502).json({
      status: false,
      error: "Could not reach SASA DEV API",
      message: error?.name === "TimeoutError" ? "Provider request timed out" : "Provider may be unavailable; check again later."
    });
  }
}
