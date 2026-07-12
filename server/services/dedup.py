"""Content-addressed deduplication engine.

Files are stored once per unique SHA-256 body and reference-counted. Storing a
duplicate writes nothing to disk and returns ``was_deduplicated=True`` along
with the number of bytes saved. This is the honest version of the storage win:
the data is always physically present, it is simply never stored twice.
"""

import hashlib

from sqlalchemy.orm import Session

from server.core.config import get_settings
from server.models import BackupItem, Blob

settings = get_settings()


def sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def store_file(
    db: Session,
    *,
    user_id: str,
    filename: str,
    data: bytes,
    device_id: str | None = None,
) -> BackupItem:
    """Store a file body (deduplicated) and record a logical backup item."""
    digest = sha256_hex(data)
    size = len(data)

    blob = db.get(Blob, digest)
    was_deduplicated = blob is not None

    if blob is None:
        # First time we've seen this body: persist it to the content store.
        path = settings.storage_dir / digest
        path.write_bytes(data)
        blob = Blob(hash=digest, size=size, ref_count=1, storage_path=str(path))
        db.add(blob)
    else:
        blob.ref_count += 1

    item = BackupItem(
        user_id=user_id,
        device_id=device_id,
        filename=filename,
        blob_hash=digest,
        size=size,
        was_deduplicated=was_deduplicated,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item
