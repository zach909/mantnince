"""Backup endpoints: file upload with deduplication, and status."""

from __future__ import annotations

from server.core.http import ApiError, Request, ValidationError
from server.core.security import get_current_user
from server.services.dedup import store_file

_BYTES_PER_GB = 1024**3


def _require_user(request: Request):
    user = get_current_user(request.headers, request.db, request.settings)
    if user is None:
        raise ApiError(401, "Could not validate credentials", {"WWW-Authenticate": "Bearer"})
    return user


def upload(request: Request):
    """Upload a file to back up.

    The body is content-hashed; if an identical body already exists it is not
    stored again (``was_deduplicated=True``), which is where storage is saved.
    """
    user = _require_user(request)
    fields, files = request.multipart()

    file_field = files.get("file")
    if file_field is None:
        raise ValidationError("'file' is required")
    device_id = fields.get("device_id") or None

    item = store_file(
        request.db,
        settings=request.settings,
        user_id=user["id"],
        filename=file_field["filename"] or "unnamed",
        data=file_field["content"],
        device_id=device_id,
    )
    return 200, {
        "item_id": item["id"],
        "blob_hash": item["blob_hash"],
        "was_deduplicated": item["was_deduplicated"],
        "storage_saved_bytes": item["size"] if item["was_deduplicated"] else 0,
    }


def status(request: Request):
    user = _require_user(request)
    rows = request.db.execute(
        "SELECT size, was_deduplicated, created_at FROM backup_items WHERE user_id = ?",
        (user["id"],),
    ).fetchall()

    total_backups = len(rows)
    logical_bytes = sum(r["size"] for r in rows)
    saved_bytes = sum(r["size"] for r in rows if r["was_deduplicated"])
    last_backup = max((r["created_at"] for r in rows), default=None)

    return 200, {
        "total_backups": total_backups,
        "total_size_gb": round(logical_bytes / _BYTES_PER_GB, 4),
        "storage_saved_gb": round(saved_bytes / _BYTES_PER_GB, 4),
        "last_backup": last_backup,
    }


ROUTES = {
    ("POST", "/api/backup/upload"): upload,
    ("GET", "/api/backup/status"): status,
}
