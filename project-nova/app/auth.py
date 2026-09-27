"""
Auth for PROJECT NOVA: bcrypt password hashing + a signed session cookie.

The cookie holds just the user id, signed with SECRET_KEY so it can't be
forged or edited client-side. No server-side session table needed.
"""

import os
import bcrypt
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from fastapi import Request, Response

SESSION_COOKIE_NAME = "nova_session"
SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14  # 14 days

_serializer = None


def _get_serializer() -> URLSafeTimedSerializer:
    global _serializer
    if _serializer is None:
        secret = os.environ.get("SECRET_KEY", "dev-insecure-secret-change-me")
        _serializer = URLSafeTimedSerializer(secret, salt="nova-session")
    return _serializer


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except ValueError:
        return False


def create_session_cookie(response: Response, user_id: int):
    token = _get_serializer().dumps({"uid": user_id})
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=token,
        max_age=SESSION_MAX_AGE_SECONDS,
        httponly=True,
        samesite="lax",
    )


def clear_session_cookie(response: Response):
    response.delete_cookie(SESSION_COOKIE_NAME)


def get_current_user_id(request: Request):
    """Return the logged-in user's id, or None if not logged in / bad cookie."""
    token = request.cookies.get(SESSION_COOKIE_NAME)
    if not token:
        return None
    try:
        data = _get_serializer().loads(token, max_age=SESSION_MAX_AGE_SECONDS)
        return data.get("uid")
    except (BadSignature, SignatureExpired):
        return None
