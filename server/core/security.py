"""Password hashing and JWT helpers — stdlib only.

Password hashing: PBKDF2-HMAC-SHA256 via :func:`hashlib.pbkdf2_hmac` with a
random 16-byte salt and a high iteration count. Unlike bcrypt, PBKDF2 has no
72-byte input limit, so no pre-hashing workaround is needed here.

JWT: a minimal hand-rolled HS256 implementation (header.payload.signature,
base64url-encoded, HMAC-SHA256 signed) — just enough to support this
application's ``{"sub": user_id, "exp": ...}`` payloads.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import sqlite3
import time

from server.core.config import Settings, get_settings

_PBKDF2_ALGORITHM = "pbkdf2_sha256"
_PBKDF2_ITERATIONS = 260_000
_SALT_BYTES = 16


class InvalidTokenError(Exception):
    """Raised when a bearer token is malformed, forged, or expired."""


# ---- Password hashing ----


def hash_password(password: str) -> str:
    salt = os.urandom(_SALT_BYTES)
    derived = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, _PBKDF2_ITERATIONS)
    return f"{_PBKDF2_ALGORITHM}${_PBKDF2_ITERATIONS}${salt.hex()}${derived.hex()}"


def verify_password(plain: str, hashed: str) -> bool:
    try:
        algorithm, iterations_s, salt_hex, hash_hex = hashed.split("$")
        if algorithm != _PBKDF2_ALGORITHM:
            return False
        iterations = int(iterations_s)
        salt = bytes.fromhex(salt_hex)
        expected = bytes.fromhex(hash_hex)
    except (ValueError, AttributeError):
        return False
    derived = hashlib.pbkdf2_hmac("sha256", plain.encode("utf-8"), salt, iterations)
    return hmac.compare_digest(derived, expected)


# ---- JWT (HS256 only) ----


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def create_access_token(subject: str, settings: Settings | None = None) -> str:
    settings = settings or get_settings()
    header = {"alg": "HS256", "typ": "JWT"}
    expire = int(time.time()) + settings.access_token_expire_minutes * 60
    payload = {"sub": subject, "exp": expire}
    header_b64 = _b64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_b64 = _b64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
    signature = hmac.new(settings.secret_key.encode("utf-8"), signing_input, hashlib.sha256).digest()
    return f"{header_b64}.{payload_b64}.{_b64url_encode(signature)}"


def decode_access_token(token: str, settings: Settings | None = None) -> dict:
    settings = settings or get_settings()
    try:
        header_b64, payload_b64, signature_b64 = token.split(".")
    except ValueError as exc:
        raise InvalidTokenError("Malformed token") from exc

    signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
    expected_sig = hmac.new(settings.secret_key.encode("utf-8"), signing_input, hashlib.sha256).digest()
    try:
        actual_sig = _b64url_decode(signature_b64)
    except Exception as exc:  # noqa: BLE001 - any decode failure means an invalid token
        raise InvalidTokenError("Malformed signature") from exc
    if not hmac.compare_digest(expected_sig, actual_sig):
        raise InvalidTokenError("Signature mismatch")

    try:
        payload = json.loads(_b64url_decode(payload_b64))
    except Exception as exc:  # noqa: BLE001
        raise InvalidTokenError("Malformed payload") from exc

    exp = payload.get("exp")
    if exp is not None and exp < time.time():
        raise InvalidTokenError("Token expired")
    return payload


def get_current_user(
    headers,
    conn: sqlite3.Connection,
    settings: Settings | None = None,
) -> sqlite3.Row | None:
    """Resolve the bearer token in ``headers`` to a ``users`` row, or ``None``.

    ``headers`` only needs to support case-insensitive ``.get(name)`` lookup
    (``http.client.HTTPMessage`` / ``email.message.Message`` both do).
    """
    auth_header = headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header[len("Bearer "):].strip()
    if not token:
        return None
    try:
        payload = decode_access_token(token, settings)
    except InvalidTokenError:
        return None
    user_id = payload.get("sub")
    if user_id is None:
        return None
    return conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
