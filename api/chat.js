// ─── Vercel edge function · Claude proxy for the MCC CAPS AI assistant ──
// The Anthropic key lives as a Vercel environment variable
// (`ANTHROPIC_API_KEY`) and never touches the browser.
//
// Same-origin deploy → no CORS config needed.
//
// Protections: payload size cap, whitelisted forwarded fields, key held
// server-side only. Set a monthly spend cap on the Anthropic console as
// your ultimate safety net.
// ────────────────────────────────────────────────────────────────────────

export const config = { runtime: 'edge' };

const MAX_BODY_BYTES = 8 * 1024;

export default async function handler(request) {
  // Cross-origin requests (e.g. a Vercel deploy being called from elsewhere)
  // still get generous CORS — tighten if you ever host the frontend separately.
  const origin = request.headers.get('origin') || '';
  const cors = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
  if (origin) cors['Access-Control-Allow-Origin'] = origin;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405, cors);
  }

  const len = parseInt(request.headers.get('content-length') || '0', 10);
  if (len > MAX_BODY_BYTES) {
    return json({ error: 'Payload too large' }, 413, cors);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return json(
      { error: 'Server not configured — set ANTHROPIC_API_KEY in Vercel project settings' },
      500,
      cors,
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400, cors);
  }

  // Only forward the fields we support — never pass through arbitrary headers/fields.
  const forward = {
    model: body.model || 'claude-haiku-4-5-20251001',
    max_tokens: Math.min(body.max_tokens || 900, 1500),
    system: body.system,
    messages: body.messages || [],
  };

  let upstream;
  try {
    upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(forward),
    });
  } catch (err) {
    return json({ error: 'Upstream fetch failed', detail: String(err) }, 502, cors);
  }

  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: {
      ...cors,
      'Content-Type': upstream.headers.get('Content-Type') || 'application/json',
    },
  });
}

function json(obj, status, extra) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...(extra || {}) },
  });
}
