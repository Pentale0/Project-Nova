"""
XP / Rank engine for PROJECT NOVA.

Five ranks (I-V), thresholds fixed for the demo. Each stat has its own
title ladder. AI actions never award XP -- only logging/uploading does.
"""

from app.db import execute, fetch_one

RANK_THRESHOLDS = [
    (1, 0),
    (2, 12),
    (3, 30),
    (4, 55),
    (5, 90),
]
MAX_XP_FOR_BAR = 90  # demo cap; bar fills fully at rank V

XP_PER_ACTION = {
    "academics": 4,   # per 0.5h study logged
    "vitality": 6,    # per logged session
    "culture": 4,     # per logged title
    "memories": 3,    # per uploaded photo
}

TITLES = {
    "academics": ["Slacker", "Average", "Diligent", "Honor Student", "Genius"],
    "vitality": ["Resting", "Warming Up", "Active", "Athletic", "Radiant"],
    "culture": ["Unplugged", "Curious", "Well-Read", "Connoisseur", "Polymath"],
    "memories": ["Blank Film", "Snapshots", "Album", "Chronicle", "Legacy"],
}


def rank_for_xp(xp: int) -> int:
    """Return the rank (1-5) reached by the given XP total."""
    rank = 1
    for r, threshold in RANK_THRESHOLDS:
        if xp >= threshold:
            rank = r
    return rank


def title_for_stat(stat_key: str, xp: int) -> str:
    rank = rank_for_xp(xp)
    return TITLES[stat_key][rank - 1]


def progress_in_rank(xp: int) -> dict:
    """
    Return how far xp is between the current rank's threshold and the
    next one, for drawing a progress bar. At rank V, returns full (100%).
    """
    rank = rank_for_xp(xp)
    current_threshold = dict(RANK_THRESHOLDS)[rank]
    if rank == 5:
        return {"rank": rank, "percent": 100, "current_xp": xp, "next_threshold": None}
    next_threshold = dict(RANK_THRESHOLDS)[rank + 1]
    span = next_threshold - current_threshold
    percent = int(((xp - current_threshold) / span) * 100) if span else 100
    return {
        "rank": rank,
        "percent": max(0, min(percent, 100)),
        "current_xp": xp,
        "next_threshold": next_threshold,
    }


def award_xp(user_id: int, stat_key: str, units: int = 1) -> dict:
    """
    Grant XP for a logging action (NOT for AI calls).
    `units` lets one call represent e.g. multiple 0.5h study blocks.
    Returns before/after rank info so the caller can trigger a RANK UP flash.
    """
    if stat_key not in XP_PER_ACTION:
        raise ValueError(f"Unknown stat_key: {stat_key}")

    row = fetch_one(
        "SELECT xp FROM stats WHERE user_id = ? AND stat_key = ?",
        (user_id, stat_key),
    )
    old_xp = row[0] if row else 0
    old_rank = rank_for_xp(old_xp)

    gained = XP_PER_ACTION[stat_key] * units
    new_xp = min(old_xp + gained, MAX_XP_FOR_BAR)  # demo cap
    new_rank = rank_for_xp(new_xp)

    execute(
        "UPDATE stats SET xp = ? WHERE user_id = ? AND stat_key = ?",
        (new_xp, user_id, stat_key),
    )

    return {
        "stat_key": stat_key,
        "old_xp": old_xp,
        "new_xp": new_xp,
        "gained": gained,
        "old_rank": old_rank,
        "new_rank": new_rank,
        "rank_up": new_rank > old_rank,
        "title": title_for_stat(stat_key, new_xp),
    }
