"""SQLAlchemy ORM models.

Design notes
------------
Deduplication is content-addressed: every distinct file body is stored once as
a ``Blob`` keyed by its SHA-256 hash and reference-counted. A ``BackupItem`` is
a logical file (name, owning device, size) that points at a blob. Uploading a
file whose bytes already exist stores nothing new and simply bumps the blob's
``ref_count`` — that is where the real storage saving comes from, without ever
re-fetching a URL or keeping a fragile external reference in place of the data.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from server.core.database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    username: Mapped[str] = mapped_column(String, unique=True, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    devices: Mapped[list["Device"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Device(Base):
    __tablename__ = "devices"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    name: Mapped[str] = mapped_column(String)
    type: Mapped[str] = mapped_column(String)  # iphone|android|windows_pc|mac|linux|chrome_os
    platform: Mapped[str] = mapped_column(String, default="")
    os_version: Mapped[str] = mapped_column(String, default="")
    status: Mapped[str] = mapped_column(String, default="offline")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    user: Mapped[User] = relationship(back_populates="devices")


class CloudConnection(Base):
    __tablename__ = "cloud_connections"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    provider: Mapped[str] = mapped_column(String)  # google|microsoft
    connected: Mapped[bool] = mapped_column(default=False)
    last_sync: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class Blob(Base):
    """A unique file body, stored once and reference-counted."""

    __tablename__ = "blobs"

    hash: Mapped[str] = mapped_column(String, primary_key=True)  # sha256 hex
    size: Mapped[int] = mapped_column(Integer)
    ref_count: Mapped[int] = mapped_column(Integer, default=0)
    storage_path: Mapped[str] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class BackupItem(Base):
    """A logical backed-up file that points at a deduplicated blob."""

    __tablename__ = "backup_items"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    device_id: Mapped[str | None] = mapped_column(ForeignKey("devices.id"), nullable=True)
    filename: Mapped[str] = mapped_column(String)
    blob_hash: Mapped[str] = mapped_column(ForeignKey("blobs.hash"))
    size: Mapped[int] = mapped_column(Integer)
    was_deduplicated: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class BackupJob(Base):
    __tablename__ = "backup_jobs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    device_id: Mapped[str | None] = mapped_column(ForeignKey("devices.id"), nullable=True)
    data_types: Mapped[str] = mapped_column(String, default="")  # comma-separated
    status: Mapped[str] = mapped_column(String, default="started")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class AdView(Base):
    """Mock ad-view ledger entry. No real ad network or payout is wired up."""

    __tablename__ = "ad_views"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    ad_id: Mapped[str] = mapped_column(String)
    duration_seconds: Mapped[int] = mapped_column(Integer, default=0)
    was_clicked: Mapped[bool] = mapped_column(default=False)
    earnings: Mapped[float] = mapped_column(default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
