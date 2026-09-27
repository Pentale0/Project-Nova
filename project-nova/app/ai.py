"""
Gemini integrations for PROJECT NOVA's three AI coaches.

Design choice: every prompt asks Gemini to return ONLY raw JSON (no markdown
fences, no prose) matching a described shape. This lets templates render
structured pieces (quiz toggles, Mermaid blocks, workout sections) instead
of dumping raw model text. If parsing fails, we return a safe fallback
dict so a flaky response never 500s the route.

Reminder from the brief: AI actions never grant XP. Only the logging
routes in main.py call xp.award_xp().
"""

import os
import json
import re
import google.generativeai as genai

_model = None


def _get_model():
    global _model
    if _model is None:
        api_key = os.environ.get("GEMINI_API_KEY")
        genai.configure(api_key=api_key)
        _model = genai.GenerativeModel("gemini-1.5-flash")
    return _model


def _ask_for_json(prompt: str) -> dict:
    """Call Gemini, strip any stray markdown fences, and parse JSON."""
    model = _get_model()
    response = model.generate_content(prompt)
    text = response.text.strip()
    # Strip ```json ... ``` fences if the model adds them despite instructions.
    text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text.strip())
    return json.loads(text)


# ---------------------------------------------------------------------------
# Academics coach
# ---------------------------------------------------------------------------

def study_coach(subject: str, question: str, resources: list[str]) -> dict:
    """
    resources: list of content strings pulled from academic_resources for
    this user+subject (the "custom resource grounding" from the brief).
    """
    grounding = "\n\n---\n\n".join(resources) if resources else "(no resources provided yet)"
    prompt = f"""You are NOVA's Academics Coach, a calm and precise study mentor.

The student's subject is: {subject}
Their question/request: {question}

Ground your answer ONLY in the resources below. Do not invent facts absent
from them; if the resources are insufficient, say so within "notes".

RESOURCES:
{grounding}

Return ONLY raw JSON (no markdown fences) with exactly this shape:
{{
  "notes": "structured study notes, 150-300 words, plain text with \\n for paragraphs",
  "takeaways": ["key takeaway 1", "key takeaway 2", "key takeaway 3"],
  "quiz": [
    {{"question": "...", "answer": "..."}},
    {{"question": "...", "answer": "..."}},
    {{"question": "...", "answer": "..."}},
    {{"question": "...", "answer": "..."}},
    {{"question": "...", "answer": "..."}}
  ],
  "mermaid": "graph TD\\nA[Start] --> B[...]"
}}
The quiz must have exactly 5 questions, each answerable from the resources.
The mermaid field must be valid Mermaid flowchart syntax starting with "graph TD".
"""
    try:
        return _ask_for_json(prompt)
    except Exception:
        return {
            "notes": "The coach couldn't reach Gemini or returned an unreadable response. Try again.",
            "takeaways": [],
            "quiz": [],
            "mermaid": "graph TD\nA[No diagram available]",
        }


# ---------------------------------------------------------------------------
# Vitality coach
# ---------------------------------------------------------------------------

def sports_coach(sport_or_goal: str, question: str) -> dict:
    prompt = f"""You are NOVA's Sports & Health Coach: practical, encouraging, and safe.

Focus/sport: {sport_or_goal}
Question: {question}

Give generic, safe guidance suitable for a healthy adult or teen doing
recreational training. Do NOT give medical diagnoses or clinical claims;
if the question sounds medical, recommend seeing a professional within "tips".

Return ONLY raw JSON (no markdown fences) with exactly this shape:
{{
  "tips": ["practical tip 1", "practical tip 2", "practical tip 3"],
  "workout": {{
    "warmup": ["item 1", "item 2"],
    "main_sets": ["item 1", "item 2", "item 3"],
    "cooldown": ["item 1", "item 2"]
  }},
  "recovery": "2-3 sentences of sleep/recovery/nutrition guidance, plain text"
}}
"""
    try:
        return _ask_for_json(prompt)
    except Exception:
        return {
            "tips": ["The coach couldn't reach Gemini right now. Try again shortly."],
            "workout": {"warmup": [], "main_sets": [], "cooldown": []},
            "recovery": "",
        }


# ---------------------------------------------------------------------------
# Culture recommender
# ---------------------------------------------------------------------------

def culture_recommender(logged_titles: list[dict]) -> list[dict]:
    """
    logged_titles: [{"category": "anime", "title": "...", "top_rank": 3}, ...]
    """
    titles_str = "\n".join(
        f"- {t['title']} ({t['category']}, ranked #{t['top_rank']})" if t.get("top_rank")
        else f"- {t['title']} ({t['category']})"
        for t in logged_titles
    ) or "(no titles logged yet)"

    prompt = f"""You are NOVA's Culture Recommender.

This user has logged the following media:
{titles_str}

Recommend 5 FRESH titles they have not already logged, spanning any of:
movie, series, anime, book, manga, game. Base each rationale on genuine
similarity to their logged taste (theme, tone, genre, creator).

Return ONLY raw JSON (no markdown fences) as a JSON array of exactly 5 objects:
[
  {{"title": "...", "type": "movie|series|anime|book|manga|game", "rationale": "1-2 sentences"}}
]
"""
    try:
        result = _ask_for_json(prompt)
        return result if isinstance(result, list) else []
    except Exception:
        return []
