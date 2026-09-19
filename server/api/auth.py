"""Authentication endpoints: register and token issuance."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from server.core.http import ApiError, Request
from server.core.security import create_access_token, hash_password, verify_password
from server.schemas import parse_register_request


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def register(request: Request):
    payload = parse_register_request(request.json())
    conn = request.db

    existing = conn.execute(
        "SELECT id FROM users WHERE username = ? OR email = ?",
        (payload.username, payload.email),
    ).fetchone()
    if existing is not None:
        raise ApiError(409, "Username or email already registered")

    user_id = str(uuid.uuid4())
    conn.execute(
        "INSERT INTO users (id, username, email, hashed_password, created_at) VALUES (?, ?, ?, ?, ?)",
        (user_id, payload.username, payload.email, hash_password(payload.password), _now_iso()),
    )
    conn.commit()
    return 201, {"user_id": user_id, "message": "User registered"}


def token(request: Request):
    """OAuth2 password-grant token endpoint.

    ``username`` may be either the account username or email.
    """
    form = request.form()
    username = form.get("username", "")
    password = form.get("password", "")

    conn = request.db
    user = conn.execute(
        "SELECT * FROM users WHERE username = ? OR email = ?",
        (username, username),
    ).fetchone()
    if user is None or not verify_password(password, user["hashed_password"]):
        raise ApiError(
            401,
            "Incorrect username or password",
            {"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(user["id"], request.settings)
    return 200, {"token": access_token, "user_id": user["id"], "token_type": "bearer"}


ROUTES = {
    ("POST", "/api/auth/register"): register,
    ("POST", "/api/auth/token"): token,
}
