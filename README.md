# MCC — Capability Intelligence Platform · Phase 2 Pitch

Bilingual (English · Arabic) pitch site for the Monitoring &amp; Control Center
(MCC) Phase 2 proposal. Hosts as a static site, with the AI assistant
powered by a Vercel Edge Function that holds the Anthropic API key
server-side.

## Deploy on Vercel (5 clicks, all browser — no CLI)

1. Go to <https://vercel.com/new>.
2. **Import Git Repository** → pick `mcc-caps-pitch`.
3. Leave the "Framework Preset" as **Other**. Don't change any paths.
4. Expand **Environment Variables** and add:
   - Name: `ANTHROPIC_API_KEY`
   - Value: paste your Anthropic key (starts `sk-ant-`)
5. Click **Deploy**. Vercel gives you a URL like
   `https://mcc-caps-pitch.vercel.app` (or a custom domain you configure).

The AI assistant will go LIVE automatically — the site and the
`/api/chat` endpoint are on the same origin, so there's no CORS to
configure.

## Iterate

Every `git push` to `main` redeploys Vercel automatically. No CLI needed.

## Rotate the key

Vercel dashboard → Project → **Settings** → **Environment Variables** →
edit `ANTHROPIC_API_KEY` → save → **Deployments** → redeploy latest.

## Structure

```
index.html     — the pitch site (single file, English + Arabic)
api/chat.js    — Vercel Edge Function proxying to Claude
vercel.json    — Vercel config (clean URLs)
mcc-logo.svg   — official MCC wordmark
visuals/       — scenario imagery, diagrams, UI mockups
```

## Access

The pitch is gated by a session password (stored as a SHA-256 hash in
`index.html`).

## Local preview

```bash
python3 -m http.server 8082
```

Then open <http://localhost:8082>. The AI assistant will run in
"GROUNDED" (scripted-fallback) mode locally — the answers are still
grounded in the same source data, they just don't reason live. To get
live Claude locally, run `vercel dev` in this directory after installing
the Vercel CLI (`npm i -g vercel`).
