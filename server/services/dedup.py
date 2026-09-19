"""Content-addressed deduplication engine.

Files are stored once per unique SHA-256 body and reference-counted. Storing a
duplicate writes nothing to disk and returns ``was_deduplicated=True`` along
with the number of bytes saved. This is the honest version of the storage win:
the data is always physically present, it is simply never stored twice.
"""

from __future__ import annotations

import hashlib
import sqlite3
import uuid
from datetime import datetime, timezone

from server.core.config import Settings, get_settings


def sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def store_file(
    conn: sqlite3.Connection,
    *,
    settings: Settings | None = None,
    user_id: str,
    filename: str,
    data: bytes,
    device_id: str | None = None,
) -> dict:
    """Store a file body (deduplicated) and record a logical backup item.

    Returns a dict with ``id``, ``blob_hash``, ``size``, ``was_deduplicated``.
    """
    settings = settings or get_settings()
    digest = sha256_hex(data)
    size = len(data)

    blob = conn.execute("SELECT hash FROM blobs WHERE hash = ?", (digest,)).fetchone()
    was_deduplicated = blob is not None

    if blob is None:
        # First time we've seen this body: persist it to the content store.
        path = settings.storage_dir / digest
        path.write_bytes(data)
        conn.execute(
            "INSERT INTO blobs (hash, size, ref_count, storage_path, created_at) "
            "VALUES (?, ?, 1, ?, ?)",
            (digest, size, str(path), _now_iso()),
        )
    else:
        conn.execute("UPDATE blobs SET ref_count = ref_count + 1 WHERE hash = ?", (digest,))

    item_id = str(uuid.uuid4())
    conn.execute(
        """
        INSERT INTO backup_items
            (id, user_id, device_id, filename, blob_hash, size, was_deduplicated, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (item_id, user_id, device_id, filename, digest, size, int(was_deduplicated), _now_iso()),
    )
    conn.commit()

    return {
        "id": item_id,
        "blob_hash": digest,
        "size": size,
        "was_deduplicated": was_deduplicated,
    }
