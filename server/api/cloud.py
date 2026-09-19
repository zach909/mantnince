"""Cloud connection endpoints.

Connecting a cloud provider records the user's *intent* to connect and returns
the connector's declared OAuth scopes. The live OAuth token exchange is left as
a marked TODO in each connector rather than faked, so nothing here accesses a
user's cloud data without a real, user-approved consent flow being wired up.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from server.core.http import ApiError, Request
from server.core.security import get_current_user
from server.schemas import parse_cloud_connect_request
from server.services.cloud_connectors import get_connector


def _require_user(request: Request):
    user = get_current_user(request.headers, request.db, request.settings)
    if user is None:
        raise ApiError(401, "Could not validate credentials", {"WWW-Authenticate": "Bearer"})
    return user


def connect(request: Request):
    user = _require_user(request)
    provider = parse_cloud_connect_request(request.json())

    connector = get_connector(provider)
    if connector is None:
        raise ApiError(400, f"Unsupported provider: {provider}")

    conn = request.db
    existing = conn.execute(
        "SELECT id FROM cloud_connections WHERE user_id = ? AND provider = ?",
        (user["id"], provider),
    ).fetchone()
    if existing is None:
        conn.execute(
            """
            INSERT INTO cloud_connections (id, user_id, provider, connected, last_sync, created_at)
            VALUES (?, ?, ?, 0, NULL, ?)
            """,
            (str(uuid.uuid4()), user["id"], provider, datetime.now(timezone.utc).isoformat()),
        )
    # We record intent, not a live token. connected stays False until a real
    # OAuth exchange is implemented and completed.
    conn.commit()

    described = connector.describe()
    note = (
        f"To connect {described['display_name']}, complete the OAuth consent flow "
        f"(scopes: {', '.join(connector.scopes)}). Token exchange is not yet "
        "implemented, so no cloud data is accessed."
    )
    return 200, {"connected": False, "provider": provider, "note": note}


def cloud_status(request: Request):
    user = _require_user(request)
    rows = request.db.execute(
        "SELECT * FROM cloud_connections WHERE user_id = ?",
        (user["id"],),
    ).fetchall()
    by_provider = {r["provider"]: r for r in rows}

    providers: dict[str, dict] = {}
    for provider in ("google", "microsoft"):
        c = by_provider.get(provider)
        providers[provider] = {
            "connected": bool(c and c["connected"]),
            "last_sync": c["last_sync"] if c and c["last_sync"] else None,
        }
    return 200, {"providers": providers}


ROUTES = {
    ("POST", "/api/cloud/connect"): connect,
    ("GET", "/api/cloud/status"): cloud_status,
}
