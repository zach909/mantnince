"""Device registration and listing."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from server.core.http import ApiError, Request
from server.core.security import get_current_user
from server.schemas import parse_device_register_request


def _require_user(request: Request):
    user = get_current_user(request.headers, request.db, request.settings)
    if user is None:
        raise ApiError(401, "Could not validate credentials", {"WWW-Authenticate": "Bearer"})
    return user


def register_device(request: Request):
    user = _require_user(request)
    info = parse_device_register_request(request.json())

    device_id = str(uuid.uuid4())
    request.db.execute(
        """
        INSERT INTO devices (id, user_id, name, type, platform, os_version, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 'online', ?)
        """,
        (
            device_id,
            user["id"],
            info.name,
            info.type,
            info.platform,
            info.os_version,
            datetime.now(timezone.utc).isoformat(),
        ),
    )
    request.db.commit()
    return 201, {"device_id": device_id, "message": "Device registered"}


def list_devices(request: Request):
    user = _require_user(request)
    rows = request.db.execute(
        "SELECT id, name, type, status FROM devices WHERE user_id = ?",
        (user["id"],),
    ).fetchall()
    devices = [{"id": r["id"], "name": r["name"], "type": r["type"], "status": r["status"]} for r in rows]
    return 200, {"devices": devices}


ROUTES = {
    ("POST", "/api/devices/register"): register_device,
    ("GET", "/api/devices"): list_devices,
}
