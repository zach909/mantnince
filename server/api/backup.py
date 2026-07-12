"""Backup endpoints: file upload with deduplication, and status."""

from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from server.core.database import get_db
from server.core.security import get_current_user
from server.models import BackupItem, User
from server.schemas import BackupStatusResponse, UploadResponse
from server.services.dedup import store_file

router = APIRouter(prefix="/api/backup", tags=["backup"])

_BYTES_PER_GB = 1024**3


@router.post("/upload", response_model=UploadResponse)
async def upload(
    file: UploadFile = File(...),
    device_id: str | None = Form(default=None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UploadResponse:
    """Upload a file to back up.

    The body is content-hashed; if an identical body already exists it is not
    stored again (``was_deduplicated=True``), which is where storage is saved.
    """
    data = await file.read()
    item = store_file(
        db,
        user_id=user.id,
        filename=file.filename or "unnamed",
        data=data,
        device_id=device_id,
    )
    return UploadResponse(
        item_id=item.id,
        blob_hash=item.blob_hash,
        was_deduplicated=item.was_deduplicated,
        storage_saved_bytes=item.size if item.was_deduplicated else 0,
    )


@router.get("/status", response_model=BackupStatusResponse)
def status(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BackupStatusResponse:
    items = db.scalars(select(BackupItem).where(BackupItem.user_id == user.id)).all()

    total_backups = len(items)
    logical_bytes = sum(i.size for i in items)
    saved_bytes = sum(i.size for i in items if i.was_deduplicated)
    last_backup = max((i.created_at for i in items), default=None)

    return BackupStatusResponse(
        total_backups=total_backups,
        total_size_gb=round(logical_bytes / _BYTES_PER_GB, 4),
        storage_saved_gb=round(saved_bytes / _BYTES_PER_GB, 4),
        last_backup=last_backup,
    )
