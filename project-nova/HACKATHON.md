# PROJECT NOVA — Hackathon Submission

**Tagline:** Level the life you actually live.

## The Pitch

Self-improvement apps are either a boring checklist or a game with no
connection to your actual life. NOVA borrows the thing that makes JRPGs
like Persona addictive — visible stats, ranks, and titles that go up when
you do things — and points it at four real areas of your life: Academics,
Vitality, Culture, and Memories. Three AI coaches sit inside those stats,
grounded in your own material, and a social layer connects you with people
who share your taste in games, anime, movies, and books.

## What's Actually Built (Demo Scope)

- **Accounts & public profile** — register, login, and a shareable
  `/u/{handle}` page showing your four stat bars, recent Culture titles,
  and memory photos, with a one-tap copy-link button on the dashboard.
- **XP engine** — five ranks (I–V) at fixed thresholds, each stat with
  its own title ladder. AI calls never grant XP; only logging actions do.
- **Academics Coach** — paste your own notes/textbook passages as
  "resources"; the coach answers *only* from what you gave it, and
  returns structured notes, key takeaways, a 5-question quiz with
  answers behind a toggle, and a live-rendered Mermaid concept diagram.
- **Vitality Coach** — a sport/goal + question in, a practical tip list,
  a warmup/main-set/cooldown workout plan, and safe recovery guidance
  out. No medical claims.
- **Culture module** — Top 10 lists across six media categories, an AI
  recommender that reads your logged titles and suggests five fresh
  ones with rationale, and an Interest Deck that surfaces people who
  share at least one logged title. Mutual Connect triggers an
  in-theme LINKED overlay and opens a simple chat thread.
- **Memories** — photo upload with captions, building a gallery shown
  on both the dashboard and the public profile.
- **The look** — an original Persona 3 Reload–inspired HUD: seaside
  navy background, cyan glow, glassmorphic clipped-corner cards, stat
  bars, and a RANK UP flash animation on level-up. No borrowed assets.
- **PWA** — responsive single codebase works as the phone and PC
  client; installable via `manifest.webmanifest`.

## Demo Path (~3 minutes)

1. Register a handle, land on the HUD — four stats at 0 XP.
2. Log 2 hours of study time on **Academics** → watch the bar move,
   copy the public profile link.
3. Add a saved resource (a paragraph of notes), ask the Study Coach a
   question grounded in it → structured notes, quiz, Mermaid diagram.
4. Log a workout session on **Vitality**, ask the Sports Coach for a
   training week.
5. Add 3 Culture titles to hit Rank II (RANK UP flash), hit "Get
   Recommendations."
6. Open **People**, Connect with the seeded demo account that shares a
   title → instant LINKED match → send a chat message.
7. Upload a photo on **Memories**, then open the public `/u/{handle}`
   link in an incognito tab to show it's visible with no login.

## Architecture Notes

Python + FastAPI + Jinja2 kept the surface area small enough for a
solo 11-hour build: server-rendered HTML with light vanilla JS (no
frontend build step, no bundler). Turso via `libsql_experimental` gives
a sqlite3-shaped sync API so route handlers stay simple `def`s that
FastAPI runs in its threadpool — no async/await complexity for a demo
this size. Gemini calls are prompted to return raw JSON so the
templates can render structured pieces (quiz toggles, diagrams,
workout sections) instead of dumping model prose, with a fallback
dict on any parse failure so a flaky AI response never 500s a page.

## What We'd Build Next

- Replace client-side "Pass" with a real `dislikes` table.
- WebSocket or polling for live chat instead of refresh-to-see.
- Push notifications for RANK UP and new matches (PWA supports this;
  out of scope for the demo window).
- Real icon set for the PWA install prompt.
