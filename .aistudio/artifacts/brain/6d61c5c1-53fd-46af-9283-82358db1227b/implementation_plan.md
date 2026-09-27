# PROJECT NOVA — Hackathon Implementation Plan

> **Product**: `PROJECT NOVA`  
> **Tagline**: *Level the life you actually live.*  
> **Aesthetic Direction**: High-energy game HUD inspired by the reference screenshot (electric cyan, deep aquatic ocean blue `#0B1C33` / `#1269CC` / `#51EEFC`, dynamic tilted kinetic typography, submerged caustics, and crisp angular glass panels) — with **100% original content**: zero Atlus lore, zero Japanese characters, zero moon phases, and zero game factions.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Key Pivot Confirmed**: 
> 1. **Lore Scrubbed**: Persona lore (SEES, Tartarus, Dark Hour, Gekkoukan High, Mitsuru, Akihiko, Tarot Arcana, Moon Cycles) and Japanese script are completely removed.
> 2. **Aesthetic Maintained & Aligned**: The visual presentation directly mirrors the reference screenshot—underwater azure depth, floating fluid cords/particles, dramatic slanted kinetic typography menus, high-contrast cyan/white highlights, and angular glass HUD frames.
> 3. **Hackathon Scope Locked**: Accounts & `/u/{handle}` sharing, 4 stats with exact rank curve, 3 specialized AI coaches, category Top-10 culture lists, photo memories, and Culture Interest Matching with real-time chat.

---

## 1. Overview & Core Concept

**Project Nova** is a gamified self-actualization platform that turns real-life daily discipline into an interactive, visually stunning game experience. Users log real study hours, athletic sessions, cultural media, and life memories to earn XP, level up through 5 ranks, receive personalized coaching from 3 specialized AI mentors, and discover fellow users with overlapping cultural taste.

### Key Capabilities
- **Four Core Stats Engine**: Academics, Vitality, Culture, and Memories with strict XP rules and animated `RANK UP` stamps.
- **Academics with Custom Syllabus Grounding**: Users upload/paste their own study materials. The AI operates as a private teacher reading *exclusively* from those resources to produce structured notes, conceptual diagrams, and 5-question comprehension quizzes.
- **Vitality & Holistic Health Coach**: Logs physical workouts while the coach answers questions on athletic training, sleep science, recovery windows, and active rest.
- **Culture Deck with Top-10 Lists**: Dedicated Top 10 leaderboards for Movies, Games, Series, Anime, Books, and Manga + a 5-item AI taste recommender.
- **Memories Photo Archive**: Visual timeline of life snapshots awarding 3 XP per photograph.
- **Culture Interest Matching & Chat**: Hobby-centric discovery deck with `PASS` and `CONNECT` actions, mutual `LINKED` animations, and live messaging with seeded demo accounts for instant judging evaluation.
- **Public Profile Dossier (`/u/{handle}`)**: Clean, shareable public page that displays user stats, Top-10 media, and memory photos without exposing private study notes or chats.

---

## 2. User Experience & Visual Design

### UI Layout & Reference Screenshot Alignment
The UI translates the reference screenshot directly into a modern, responsive web application:
- **Left Hero Canvas**: Deep oceanic abyss with electric blue caustics, subtle floating air cords/particles, and a stylish monochrome-and-cyan character silhouette reflecting the player's current title.
- **Center Kinetic Slanted Menu**: Bold, angled typography (`transform: skewX(-12deg)`, heavy uppercase display font) featuring the active command highlighted in a crisp white/red angled ribbon, with inactive options in glowing electric cyan:
  - `OVERVIEW` (Command 1)
  - `ACADEMICS` (Command 2)
  - `VITALITY` (Command 3)
  - `CULTURE` (Command 4)
  - `MEMORIES` (Command 5)
  - `INTEREST DECK` (Command 6)
  - `CHAT` (Command 7)
  - `PROFILE & SHARE` (Command 8)
- **Top Metric HUD**: Clean date, weekday, and time-of-day strip (`APR 11 WED // AFTERNOON`) alongside cumulative Nova XP and current rank.
- **Right Status Cards**: Stacked diagonal operative cards displaying stat levels, XP gauges with electric cyan liquid fill, and quick progress metrics.
- **Bottom Command Helper**: Clean retro console prompt: `Select Module / [1-8] Quick Access / Confirm / Back`.

### Color Palette Tokens
- **Canvas Base**: `#020B18` (Deep Midnight Blue)
- **Abyssal Gradient**: `#0B1C33` to `#1269CC` (Aquatic Trench to Mid-Water)
- **Primary Energy**: `#51EEFC` (Vivid Electric Cyan)
- **Accent Ribbon**: `#E23B3B` (Kinetic Rank/Active Coral Red)
- **Surface Glass**: `rgba(18, 105, 204, 0.15)` with `1px solid rgba(81, 238, 252, 0.3)` and `backdrop-filter: blur(12px)`
- **Typography**: `#EAF6FF` (Ice White) and `#8FA6BF` (Muted Steel Gray)

---

## 3. Detailed Feature Specifications

### A. Authentication & Profiles
- In-memory and persistent user session store.
- **Register**: Handle (unique slug), Display Name, Password. Seeds all 4 stats at 0 XP.
- **Public Profile (`/u/{handle}`)**: Accessible without authentication. Displays player name, handle, 4 rank badges, XP progress bars, Top-10 culture highlights, and public memory photos. Includes a prominent **COPY PROFILE LINK** button.
- **Demo Switcher**: Instant one-click switch between the active user and demo accounts (`nova_demo_a`, `nova_demo_b`) for quick evaluation.

### B. The Four Stats & Rank Curve
Uniform progression curve across all four stats:
- **Rank 1**: 0 XP
- **Rank 2**: 12 XP
- **Rank 3**: 30 XP
- **Rank 4**: 55 XP
- **Rank 5**: 90 XP (Mastery Cap)
- Crossing thresholds fires the celebratory **RANK UP** full-screen kinetic stamp with audio fanfare and glass burst.

#### 1. ACADEMICS
- **Earning Rule**: 4 XP per study hour (logged in 0.5h increments).
- **Titles**: *Slacker* (R1) → *Average* (R2) → *Diligent* (R3) → *Honor Student* (R4) → *Genius* (R5).
- **Custom Syllabus Vault**: Users enter or paste subject notes and lecture text.
- **Grounded Study Coach**: AI operates strictly on provided syllabus materials, outputting:
  1. Key concept summary notes
  2. Structured bullet outline
  3. Conceptual ASCII structural diagram
  4. 5 interactive comprehension questions with answer reveal toggles

#### 2. VITALITY
- **Earning Rule**: 6 XP per logged training session.
- **Titles**: *Resting* (R1) → *Warming Up* (R2) → *Active* (R3) → *Athletic* (R4) → *Radiant* (R5).
- **Health & Athletic Coach**: Answers queries regarding:
  - Custom workout programs (Warmup, Core Routine, Cooldown)
  - Sleep optimization & circadian rhythm guidance
  - Muscle recovery, hydration, and injury prevention

#### 3. CULTURE
- **Earning Rule**: 4 XP per logged title.
- **Titles**: *Unplugged* (R1) → *Curious* (R2) → *Well-Read* (R3) → *Connoisseur* (R4) → *Polymath* (R5).
- **Top 10 Categorized Rankings**: Dedicated #1 through #10 ranking slots for:
  - *Movies*, *Games*, *Anime*, *Series*, *Books*, *Manga*
- **Culture Recommender**: Analyzes the user's logged canon and outputs 5 distinct recommendations with title, medium, and rationale.

#### 4. MEMORIES
- **Earning Rule**: 3 XP per uploaded life photo.
- **Titles**: *Blank Film* (R1) → *Snapshots* (R2) → *Album* (R3) → *Chronicle* (R4) → *Legacy* (R5).
- **Photo Grid**: Coastal polaroid presentation with captions, phase tags, and like counters.

### C. Culture Interest Deck & Real-Time Chat
- **Matching Logic**: Calculates shared cultural titles between the current user and other members.
- **Interest Deck Cards**: Displays profile name, Culture rank, shared media titles, and two prominent buttons: `PASS` and `CONNECT`.
- **Pre-Seeded Allies**: `nova_demo_a` ("Kaito") and `nova_demo_b` ("Maya") are pre-configured with overlapping titles and have already pre-liked the user.
- **Mutual LINKED Event**: Clicking `CONNECT` immediately triggers the `LINKED` cinematic stamp and routes straight into the direct message channel.
- **Direct Chat**: Threaded message history with active compose bar and automated realistic conversational responses.

---

## 4. Technical Architecture & System Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PROJECT NOVA CLIENT (Vite)                      │
│                                                                        │
│  ┌────────────────────┐   ┌─────────────────────────────────────────┐  │
│  │  Top HUD Strip     │   │  Water Caustics & Particle Background   │  │
│  │  Date / Time / XP  │   │  Interactive Canvas with Dynamic Waves  │  │
│  └────────────────────┘   └─────────────────────────────────────────┘  │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Kinetic Slanted Navigation Menu (Image Aligned)                 │  │
│  │  [OVERVIEW] [ACADEMICS] [VITALITY] [CULTURE] [MEMORIES] ...      │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Active Viewport Screen                                          │  │
│  │  ├─ Overview: 4 Stat Cards, Parameter Diamond, Quick Action Hub │  │
│  │  ├─ Academics: Syllabus Archive + Strict Grounded AI Teacher     │  │
│  │  ├─ Vitality: Session Logger + Sports, Sleep & Recovery Coach    │  │
│  │  ├─ Culture: Top-10 Category Lists + 5-Item Recommender          │  │
│  │  ├─ Memories: Photo Shards + 3 XP Upload Engine                  │  │
│  │  ├─ Interest Deck: PASS / CONNECT + LINKED Celebration           │  │
│  │  ├─ Chat: Threaded Messaging Channel                             │  │
│  │  └─ Public Profile: /u/{handle} Read-Only Dossier + Copy Link    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  State & Audio Engine                                            │  │
│  │  ├─ LocalStorage & In-Memory Store (Stats, Media, Matches, Chat)│  │
│  │  ├─ XP & Rank-Up Engine (Thresholds: 0, 12, 30, 55, 90)          │  │
│  │  └─ Web Audio Synthesizer (Chirps, Liquid Clicks, Fanfare)       │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Verification Plan

1. **Aesthetic Audit**: Confirm zero Atlus lore, zero Japanese text, zero moon phases, zero tarot arcana, and full visual alignment with the cyan/azure kinetic HUD in the reference screenshot.
2. **XP & Level Progression**: Verify that logging 1h study (+4 XP), 1 workout (+6 XP), 1 culture item (+4 XP), and 1 photo (+3 XP) correctly advance bars and trigger the `RANK UP` stamp at 12, 30, 55, and 90 XP.
3. **Academics Teacher Grounding**: Verify study notes generation, diagram creation, and quiz toggles based exclusively on user-provided syllabus notes.
4. **Vitality Coach**: Verify responses for workout routines, sleep advice, and recovery guidance.
5. **Culture Top-10**: Verify adding/sorting items into Top-10 ranks for all 6 categories + generating recommendations.
6. **Interest Match & Chat**: Verify clicking `CONNECT` on `nova_demo_a` triggers `LINKED` and opens the chat thread.
7. **Public Profile & Link**: Verify `/u/{handle}` displays the read-only card with working clipboard copy functionality.
