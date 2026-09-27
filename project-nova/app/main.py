"""
PROJECT NOVA — main FastAPI application.

Route map mirrors section 8 of the brief. Notes on design choices:
- No server-side session table: the signed cookie IS the session (see auth.py).
- AI coach POST routes render their page directly with the result in
  context, rather than redirect-after-post. Simpler for an 11-hour build;
  the tradeoff is a refresh could resubmit the AI call, which is fine for
  a demo.
- Every route that mutates state that ISN'T an AI call (logging hours,
  sessions, titles, photos) redirects with 303 after success (POST/Redirect/GET).
"""

import os
import uuid
from pathlib import Path

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Request, Form, UploadFile, File, HTTPException
from fastapi.responses import RedirectResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from app import db, xp, ai
from app.auth import (
    hash_password, verify_password,
    create_session_cookie, clear_session_cookie, get_current_user_id,
)

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOADS_DIR = BASE_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

app = FastAPI(title="PROJECT NOVA")
templates = Jinja2Templates(directory=str(BASE_DIR / "app" / "templates"))
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "app" / "static")), name="static")
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")


@app.on_event("startup")
def on_startup():
    db.init_db()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_user(request: Request):
    """Return the logged-in user's row (id, handle, display_name) or None."""
    uid = get_current_user_id(request)
    if uid is None:
        return None
    row = db.fetch_one("SELECT id, handle, display_name FROM users WHERE id = ?", (uid,))
    if row is None:
        return None
    return {"id": row[0], "handle": row[1], "display_name": row[2]}


def _get_stats(user_id: int) -> dict:
    """Return {stat_key: {xp, title, rank, percent, next_threshold}} for a user."""
    rows = db.fetch_all("SELECT stat_key, xp FROM stats WHERE user_id = ?", (user_id,))
    stats = {}
    for stat_key, xp_val in rows:
        prog = xp.progress_in_rank(xp_val)
        stats[stat_key] = {
            "xp": xp_val,
            "title": xp.title_for_stat(stat_key, xp_val),
            **prog,
        }
    return stats


# ---------------------------------------------------------------------------
# Home / Dashboard
# ---------------------------------------------------------------------------

@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    user = _get_user(request)
    if not user:
        return templates.TemplateResponse("landing.html", {"request": request})
    stats = _get_stats(user["id"])
    profile_url = str(request.base_url).rstrip("/") + f"/u/{user['handle']}"
    return templates.TemplateResponse("home.html", {
        "request": request, "user": user, "stats": stats, "profile_url": profile_url,
    })


# ---------------------------------------------------------------------------
# Public profile
# ---------------------------------------------------------------------------

@app.get("/u/{handle}", response_class=HTMLResponse)
def public_profile(request: Request, handle: str):
    row = db.fetch_one(
        "SELECT id, handle, display_name FROM users WHERE handle = ?", (handle,)
    )
    if row is None:
        return templates.TemplateResponse("404.html", {"request": request}, status_code=404)
    profile_user = {"id": row[0], "handle": row[1], "display_name": row[2]}
    stats = _get_stats(profile_user["id"])
    recent_titles = db.fetch_all(
        "SELECT title, category, top_rank FROM media_items "
        "WHERE user_id = ? ORDER BY created_at DESC LIMIT 6",
        (profile_user["id"],),
    )
    photos = db.fetch_all(
        "SELECT image_path, caption FROM memory_photos "
        "WHERE user_id = ? ORDER BY created_at DESC LIMIT 6",
        (profile_user["id"],),
    )
    return templates.TemplateResponse("public_profile.html", {
        "request": request, "profile_user": profile_user, "stats": stats,
        "recent_titles": recent_titles, "photos": photos,
    })


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

@app.get("/register", response_class=HTMLResponse)
def register_form(request: Request):
    if _get_user(request):
        return RedirectResponse("/", status_code=303)
    return templates.TemplateResponse("register.html", {"request": request, "error": None})


@app.post("/register", response_class=HTMLResponse)
def register_submit(
    request: Request,
    handle: str = Form(...),
    display_name: str = Form(...),
    password: str = Form(...),
):
    handle = handle.strip().lower()
    if not handle.replace("-", "").replace("_", "").isalnum():
        return templates.TemplateResponse("register.html", {
            "request": request,
            "error": "Handle must be URL-safe: letters, numbers, - or _ only.",
        }, status_code=400)

    existing = db.fetch_one("SELECT id FROM users WHERE handle = ?", (handle,))
    if existing:
        return templates.TemplateResponse("register.html", {
            "request": request, "error": "That handle is already taken.",
        }, status_code=400)

    db.execute(
        "INSERT INTO users (handle, display_name, password_hash) VALUES (?, ?, ?)",
        (handle, display_name.strip(), hash_password(password)),
    )
    user_row = db.fetch_one("SELECT id FROM users WHERE handle = ?", (handle,))
    db.seed_stats_for_user(user_row[0])

    response = RedirectResponse("/", status_code=303)
    create_session_cookie(response, user_row[0])
    return response


@app.get("/login", response_class=HTMLResponse)
def login_form(request: Request):
    if _get_user(request):
        return RedirectResponse("/", status_code=303)
    return templates.TemplateResponse("login.html", {"request": request, "error": None})


@app.post("/login", response_class=HTMLResponse)
def login_submit(request: Request, handle: str = Form(...), password: str = Form(...)):
    handle = handle.strip().lower()
    row = db.fetch_one(
        "SELECT id, password_hash FROM users WHERE handle = ?", (handle,)
    )
    if row is None or not verify_password(password, row[1]):
        return templates.TemplateResponse("login.html", {
            "request": request, "error": "Wrong handle or password.",
        }, status_code=400)

    response = RedirectResponse("/", status_code=303)
    create_session_cookie(response, row[0])
    return response


@app.get("/logout")
def logout():
    response = RedirectResponse("/", status_code=303)
    clear_session_cookie(response)
    return response


# ---------------------------------------------------------------------------
# Universal log handler (Academics hours, Vitality sessions)
# ---------------------------------------------------------------------------

@app.post("/log/{stat_key}")
def log_action(request: Request, stat_key: str, units: int = Form(1)):
    user = _get_user(request)
    if not user:
        return RedirectResponse("/login", status_code=303)
    if stat_key not in xp.XP_PER_ACTION:
        raise HTTPException(status_code=404, detail="Unknown stat")

    units = max(1, min(units, 20))  # sanity clamp
    result = xp.award_xp(user["id"], stat_key, units)

    destination = {"academics": "/study", "vitality": "/sports",
                   "culture": "/culture", "memories": "/memories"}.get(stat_key, "/")
    if result["rank_up"]:
        destination += f"?rankup={stat_key}:{result['new_rank']}"
    return RedirectResponse(destination, status_code=303)


# ---------------------------------------------------------------------------
# Academics
# ---------------------------------------------------------------------------

@app.get("/study", response_class=HTMLResponse)
def study_page(request: Request):
    user = _get_user(request)
    if not user:
        return RedirectResponse("/login", status_code=303)
    resources = db.fetch_all(
        "SELECT id, title, content FROM academic_resources WHERE user_id = ? ORDER BY created_at DESC",
        (user["id"],),
    )
    stats = _get_stats(user["id"])
    return templates.TemplateResponse("study.html", {
        "request": request, "user": user, "resources": resources,
        "stats": stats, "ai_result": None, "subject": "", "question": "",
    })


@app.post("/study/resource")
def study_add_resource(request: Request, title: str = Form(...), content: str = Form(...)):
    user = _get_user(request)
    if not user:
        return RedirectResponse("/login", status_code=303)
    db.execute(
        "INSERT INTO academic_resources (user_id, title, content) VALUES (?, ?, ?)",
        (user["id"], title.strip(), content.strip()),
    )
    return RedirectResponse("/study", status_code=303)


@app.post("/study/ai", response_class=HTMLResponse)
def study_ai(request: Request, subject: str = Form(...), question: str = Form(...)):
    user = _get_user(request)
    if not user:
        return RedirectResponse("/login", status_code=303)
    resource_rows = db.fetch_all(
        "SELECT content FROM academic_resources WHERE user_id = ? AND title = ?",
        (user["id"], subject.strip()),
    )
    resources = [r[0] for r in resource_rows]
    result = ai.study_coach(subject.strip(), question.strip(), resources)

    resources_all = db.fetch_all(
        "SELECT id, title, content FROM academic_resources WHERE user_id = ? ORDER BY created_at DESC",
        (user["id"],),
    )
    stats = _get_stats(user["id"])
    return templates.TemplateResponse("study.html", {
        "request": request, "user": user, "resources": resources_all,
        "stats": stats, "ai_result": result, "subject": subject, "question": question,
    })


# ---------------------------------------------------------------------------
# Vitality
# ---------------------------------------------------------------------------

@app.get("/sports", response_class=HTMLResponse)
def sports_page(request: Request):
    user = _get_user(request)
    if not user:
        return RedirectResponse("/login", status_code=303)
    stats = _get_stats(user["id"])
    return templates.TemplateResponse("sports.html", {
        "request": request, "user": user, "stats": stats,
        "ai_result": None, "sport_or_goal": "", "question": "",
    })


@app.post("/sports/ai", response_class=HTMLResponse)
def sports_ai(request: Request, sport_or_goal: str = Form(...), question: str = Form(...)):
    user = _get_user(request)
    if not user:
        return RedirectResponse("/login", status_code=303)
    result = ai.sports_coach(sport_or_goal.strip(), question.strip())
    stats = _get_stats(user["id"])
    return templates.TemplateResponse("sports.html", {
        "request": request, "user": user, "stats": stats,
        "ai_result": result, "sport_or_goal": sport_or_goal, "question": question,
    })


# ---------------------------------------------------------------------------
# Culture
# ---------------------------------------------------------------------------

CATEGORIES = ("movie", "series", "anime", "book", "manga", "game")


@app.get("/culture", response_class=HTMLResponse)
def culture_page(request: Request):
    user = _get_user(request)
    if not user:
        return RedirectResponse("/login", status_code=303)
    items = db.fetch_all(
        "SELECT id, category, title, top_rank FROM media_items "
        "WHERE user_id = ? ORDER BY category, top_rank",
        (user["id"],),
    )
    by_category = {c: [] for c in CATEGORIES}
    for _id, category, title, top_rank in items:
        by_category.setdefault(category, []).append({"title": title, "top_rank": top_rank})
    stats = _get_stats(user["id"])
    return templates.TemplateResponse("culture.html", {
        "request": request, "user": user, "stats": stats,
        "by_category": by_category, "categories": CATEGORIES, "recommendations": None,
    })


@app.post("/culture/top10")
def culture_add_top10(
    request: Request,
    category: str = Form(...),
    title: str = Form(...),
    top_rank: int = Form(None),
):
    user = _get_user(request)
    if not user:
        return RedirectResponse("/login", status_code=303)
    if category not in CATEGORIES:
        raise HTTPException(status_code=400, detail="Unknown category")

    db.execute(
        "INSERT INTO media_items (user_id, category, title, top_rank) VALUES (?, ?, ?, ?)",
        (user["id"], category, title.strip(), top_rank),
    )
    result = xp.award_xp(user["id"], "culture", 1)
    destination = "/culture"
    if result["rank_up"]:
        destination += f"?rankup=culture:{result['new_rank']}"
    return RedirectResponse(destination, status_code=303)


@app.post("/culture/ai", response_class=HTMLResponse)
def culture_ai(request: Request):
    user = _get_user(request)
    if not user:
        return RedirectResponse("/login", status_code=303)
    items = db.fetch_all(
        "SELECT category, title, top_rank FROM media_items WHERE user_id = ?",
        (user["id"],),
    )
    logged = [{"category": c, "title": t, "top_rank": r} for c, t, r in items]
    recommendations = ai.culture_recommender(logged)

    items_all = db.fetch_all(
        "SELECT id, category, title, top_rank FROM media_items "
        "WHERE user_id = ? ORDER BY category, top_rank",
        (user["id"],),
    )
    by_category = {c: [] for c in CATEGORIES}
    for _id, category, title, top_rank in items_all:
        by_category.setdefault(category, []).append({"title": title, "top_rank": top_rank})
    stats = _get_stats(user["id"])
    return templates.TemplateResponse("culture.html", {
        "request": request, "user": user, "stats": stats,
        "by_category": by_category, "categories": CATEGORIES, "recommendations": recommendations,
    })


# ---------------------------------------------------------------------------
# Social: Interest Deck + Matches + Chat
# ---------------------------------------------------------------------------

@app.get("/people", response_class=HTMLResponse)
def people_page(request: Request):
    user = _get_user(request)
    if not user:
        return RedirectResponse("/login", status_code=303)

    # Users who share at least one logged title with the current user,
    # excluding the user themselves and anyone already liked.
    candidates = db.fetch_all(
        """
        SELECT DISTINCT u.id, u.handle, u.display_name
        FROM users u
        JOIN media_items m2 ON m2.user_id = u.id
        JOIN media_items m1 ON m1.title = m2.title AND m1.user_id = ?
        WHERE u.id != ?
          AND u.id NOT IN (SELECT to_user_id FROM likes WHERE from_user_id = ?)
        """,
        (user["id"], user["id"], user["id"]),
    )
    people = [{"id": c[0], "handle": c[1], "display_name": c[2]} for c in candidates]
    return templates.TemplateResponse("people.html", {
        "request": request, "user": user, "people": people,
    })


@app.post("/people/{handle}/connect")
def people_connect(request: Request, handle: str):
    user = _get_user(request)
    if not user:
        return RedirectResponse("/login", status_code=303)

    target = db.fetch_one("SELECT id FROM users WHERE handle = ?", (handle,))
    if target is None:
        raise HTTPException(status_code=404, detail="User not found")
    target_id = target[0]

    db.execute(
        "INSERT OR IGNORE INTO likes (from_user_id, to_user_id) VALUES (?, ?)",
        (user["id"], target_id),
    )

    mutual = db.fetch_one(
        "SELECT 1 FROM likes WHERE from_user_id = ? AND to_user_id = ?",
        (target_id, user["id"]),
    )
    if mutual:
        existing_match = db.fetch_one(
            "SELECT id FROM matches WHERE (user_a = ? AND user_b = ?) OR (user_a = ? AND user_b = ?)",
            (user["id"], target_id, target_id, user["id"]),
        )
        if not existing_match:
            db.execute(
                "INSERT INTO matches (user_a, user_b) VALUES (?, ?)",
                (user["id"], target_id),
            )
        return RedirectResponse("/matches?linked=1", status_code=303)

    return RedirectResponse("/people", status_code=303)


@app.get("/matches", response_class=HTMLResponse)
def matches_page(request: Request, linked: int = 0):
    user = _get_user(request)
    if not user:
        return RedirectResponse("/login", status_code=303)

    rows = db.fetch_all(
        """
        SELECT m.id,
               CASE WHEN m.user_a = ? THEN m.user_b ELSE m.user_a END AS other_id
        FROM matches m
        WHERE m.user_a = ? OR m.user_b = ?
        """,
        (user["id"], user["id"], user["id"]),
    )
    match_list = []
    for match_id, other_id in rows:
        other = db.fetch_one("SELECT handle, display_name FROM users WHERE id = ?", (other_id,))
        if other:
            match_list.append({"match_id": match_id, "handle": other[0], "display_name": other[1]})

    return templates.TemplateResponse("matches.html", {
        "request": request, "user": user, "matches": match_list, "just_linked": bool(linked),
    })


@app.get("/chat/{match_id}", response_class=HTMLResponse)
def chat_page(request: Request, match_id: int):
    user = _get_user(request)
    if not user:
        return RedirectResponse("/login", status_code=303)

    match = db.fetch_one(
        "SELECT user_a, user_b FROM matches WHERE id = ? AND (user_a = ? OR user_b = ?)",
        (match_id, user["id"], user["id"]),
    )
    if match is None:
        raise HTTPException(status_code=404, detail="Match not found")
    other_id = match[1] if match[0] == user["id"] else match[0]
    other = db.fetch_one("SELECT handle, display_name FROM users WHERE id = ?", (other_id,))

    messages = db.fetch_all(
        "SELECT sender_id, body, created_at FROM messages WHERE match_id = ? ORDER BY created_at",
        (match_id,),
    )
    return templates.TemplateResponse("chat.html", {
        "request": request, "user": user, "match_id": match_id,
        "other": {"handle": other[0], "display_name": other[1]},
        "messages": messages,
    })


@app.post("/chat/{match_id}")
def chat_send(request: Request, match_id: int, body: str = Form(...)):
    user = _get_user(request)
    if not user:
        return RedirectResponse("/login", status_code=303)

    match = db.fetch_one(
        "SELECT id FROM matches WHERE id = ? AND (user_a = ? OR user_b = ?)",
        (match_id, user["id"], user["id"]),
    )
    if match is None:
        raise HTTPException(status_code=404, detail="Match not found")

    body = body.strip()
    if body:
        db.execute(
            "INSERT INTO messages (match_id, sender_id, body) VALUES (?, ?, ?)",
            (match_id, user["id"], body),
        )
    return RedirectResponse(f"/chat/{match_id}", status_code=303)


# ---------------------------------------------------------------------------
# Memories
# ---------------------------------------------------------------------------

@app.get("/memories", response_class=HTMLResponse)
def memories_page(request: Request):
    user = _get_user(request)
    if not user:
        return RedirectResponse("/login", status_code=303)
    photos = db.fetch_all(
        "SELECT image_path, caption, created_at FROM memory_photos "
        "WHERE user_id = ? ORDER BY created_at DESC",
        (user["id"],),
    )
    stats = _get_stats(user["id"])
    return templates.TemplateResponse("memories.html", {
        "request": request, "user": user, "photos": photos, "stats": stats,
    })


@app.post("/memories/upload")
async def memories_upload(request: Request, caption: str = Form(""), image: UploadFile = File(...)):
    user = _get_user(request)
    if not user:
        return RedirectResponse("/login", status_code=303)

    ext = Path(image.filename or "").suffix.lower()
    if ext not in (".jpg", ".jpeg", ".png", ".webp", ".gif"):
        raise HTTPException(status_code=400, detail="Unsupported image type")

    filename = f"{user['id']}-{uuid.uuid4().hex}{ext}"
    dest = UPLOADS_DIR / filename
    with open(dest, "wb") as f:
        f.write(await image.read())

    db.execute(
        "INSERT INTO memory_photos (user_id, caption, image_path) VALUES (?, ?, ?)",
        (user["id"], caption.strip(), f"/uploads/{filename}"),
    )
    result = xp.award_xp(user["id"], "memories", 1)
    destination = "/memories"
    if result["rank_up"]:
        destination += f"?rankup=memories:{result['new_rank']}"
    return RedirectResponse(destination, status_code=303)


# ---------------------------------------------------------------------------
# 404
# ---------------------------------------------------------------------------

@app.exception_handler(404)
def not_found(request: Request, exc):
    return templates.TemplateResponse("404.html", {"request": request}, status_code=404)


# ---------------------------------------------------------------------------
# about me
# ---------------------------------------------------------------------------
@app.get("/about")
def about_page(request: Request):
    user = get_current_user(request)
    return templates.TemplateResponse("about.html", {"request": request, "user": user})