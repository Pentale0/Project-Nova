# PROJECT NOVA

**Level the life you actually live.**

A Persona 3 Reload–inspired life-gamification PWA: track Academics, Vitality,
Culture, and Memories as real XP-driven stats, get coached by three grounded
Gemini AI coaches, and connect with people who share your Culture taste.

Original CSS/UI only — no Atlus assets, fonts, or audio.

## Stack

- **Backend:** Python, FastAPI, Jinja2 (server-rendered HTML + light vanilla JS)
- **Database:** Turso (libSQL), via `libsql_experimental` (sync, sqlite3-style API)
- **AI:** Gemini 1.5 Flash, via `google-generativeai`
- **Auth:** bcrypt password hashing + signed session cookie (`itsdangerous`) — no session table
- **PWA:** installable on phone and desktop via `manifest.webmanifest`

## Setup

1. **Clone and enter the repo**
   ```bash
   cd project-nova
   ```

2. **Create a virtual environment and install dependencies**
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate   # Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Fill in:
   - `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` — from `turso db show <name>` and
     `turso db tokens create <name>` (see [turso.tech](https://turso.tech)).
     If left blank, the app falls back to a local `nova-local.db` SQLite file —
     fine for local dev, not for the deployed demo.
   - `GEMINI_API_KEY` — from [Google AI Studio](https://aistudio.google.com/apikey).
   - `SECRET_KEY` — generate with:
     ```bash
     python -c "import secrets; print(secrets.token_hex(32))"
     ```

4. **Run it**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
   Visit `http://localhost:8000`. For phone testing on the same Wi-Fi,
   visit `http://<your-pc-lan-ip>:8000` from your phone browser, then
   "Add to Home Screen" to install as a PWA.

## Project layout

```
project-nova/
  app/
    main.py         # all FastAPI routes
    db.py            # Turso connection + schema + query helpers
    auth.py          # password hashing + signed session cookies
    xp.py            # rank thresholds, titles, XP-award logic
    ai.py            # three Gemini coaches (Study, Sports, Culture)
    templates/       # Jinja2 HTML
    static/
      nova.css       # the whole HUD design system
      manifest.webmanifest
  uploads/           # user-uploaded memory photos (gitignored contents)
```

## How XP works

See `app/xp.py`. Five ranks (I–V) at fixed thresholds (0/12/30/55/90 XP).
Each stat has its own title ladder (e.g. Academics: Slacker → Genius).
**AI coach calls never grant XP** — only logging actions do:
study hours, workout sessions, Top-10 title adds, and photo uploads.

## Known gaps / next steps

- `manifest.webmanifest` ships with an empty `icons` array — add real icon
  files before relying on the install prompt looking polished.
- The Interest Deck's "Pass" button is a client-side dismiss only (no
  `dislikes` table in the schema), so a passed person can reappear on
  next page load. Fine for a demo; add a table if this becomes real.
- Chat is plain form-submit (no polling/websockets) — refresh to see new
  messages from the other side.
- `libsql_experimental`'s embedded-replica mode syncs on connect; for a
  long-running deployed instance you may want a periodic `conn.sync()`
  call so remote writes from elsewhere become visible without a restart.
