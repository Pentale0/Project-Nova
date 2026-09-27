"""
Database layer for PROJECT NOVA.

Uses libsql_experimental, a sync sqlite3-style driver that talks to Turso.
One connection is opened at startup and reused (libsql_experimental
connections are safe to share across a single-process app like this).
"""

import libsql_client
import os

url = os.getenv("TURSO_DATABASE_URL")
token = os.getenv("TURSO_AUTH_TOKEN")

# libsql-client uses pure HTTP/WebSockets which work reliably on Vercel
client = libsql_client.create_client_sync(url=url, auth_token=token)

STAT_KEYS = ("academics", "vitality", "culture", "memories")

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    handle TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stats (
    user_id INTEGER,
    stat_key TEXT CHECK(stat_key IN ('academics', 'vitality', 'culture', 'memories')),
    xp INTEGER DEFAULT 0,
    PRIMARY KEY (user_id, stat_key)
);

CREATE TABLE IF NOT EXISTS academic_resources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS media_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    category TEXT CHECK(category IN ('movie', 'series', 'anime', 'book', 'manga', 'game')),
    title TEXT NOT NULL,
    top_rank INTEGER NULL CHECK(top_rank BETWEEN 1 AND 10),
    status TEXT DEFAULT 'done',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS memory_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    caption TEXT,
    image_path TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS likes (
    from_user_id INTEGER NOT NULL,
    to_user_id INTEGER NOT NULL,
    PRIMARY KEY (from_user_id, to_user_id)
);

CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_a INTEGER NOT NULL,
    user_b INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""

_conn = None


def get_conn():
    """Return the single shared libsql connection, opening it on first use."""
    global _conn
    if _conn is None:
        url = os.environ.get("TURSO_DATABASE_URL")
        token = os.environ.get("TURSO_AUTH_TOKEN")
        if url:
            # Embedded replica: local file synced with the remote Turso DB.
            _conn = libsql.connect("nova-local.db", sync_url=url, auth_token=token)
            _conn.sync()
        else:
            # Fallback for local dev with no Turso credentials set yet.
            _conn = libsql.connect("nova-local.db")
    return _conn


def init_db():
    """Create all tables if they don't already exist. Call once at startup."""
    conn = get_conn()
    for statement in SCHEMA.strip().split(";"):
        statement = statement.strip()
        if statement:
            conn.execute(statement)
    conn.commit()


def seed_stats_for_user(user_id: int):
    """Give a freshly registered user all four stats at 0 XP."""
    conn = get_conn()
    for key in STAT_KEYS:
        conn.execute(
            "INSERT OR IGNORE INTO stats (user_id, stat_key, xp) VALUES (?, ?, 0)",
            (user_id, key),
        )
    conn.commit()


def fetch_one(query: str, params: tuple = ()):
    conn = get_conn()
    rows = conn.execute(query, params).fetchall()
    return rows[0] if rows else None


def fetch_all(query: str, params: tuple = ()):
    conn = get_conn()
    return conn.execute(query, params).fetchall()


def execute(query: str, params: tuple = ()):
    conn = get_conn()
    conn.execute(query, params)
    conn.commit()
