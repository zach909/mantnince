"""Database access: raw ``sqlite3``, no ORM.

Each caller gets its own connection (opened and closed per request), which is
safe to use across threads without extra locking since no connection is ever
shared between threads. Queries are always parameterized — user input is never
formatted into SQL strings.
"""

from __future__ import annotations

import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

from .config import Settings, get_settings

_SQLITE_PREFIX = "sqlite:///"


def _db_path(database_url: str) -> str:
    """Extract a filesystem path from a ``sqlite:///...`` URL.

    ``sqlite:///:memory:`` and bare paths are also accepted for flexibility.
    """
    if database_url.startswith(_SQLITE_PREFIX):
        return database_url[len(_SQLITE_PREFIX):]
    return database_url


def get_connection(settings: Settings | None = None) -> sqlite3.Connection:
    settings = settings or get_settings()
    path = _db_path(settings.database_url)
    if path != ":memory:":
        Path(path).parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path, check_same_thread=False, timeout=10)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


@contextmanager
def get_db(settings: Settings | None = None) -> Iterator[sqlite3.Connection]:
    conn = get_connection(settings)
    try:
        yield conn
    finally:
        conn.close()


_SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    hashed_password TEXT NOT NULL,
    created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_users_username ON users(username);
CREATE INDEX IF NOT EXISTS ix_users_email ON users(email);

CREATE TABLE IF NOT EXISTS devices (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    platform TEXT NOT NULL DEFAULT '',
    os_version TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'offline',
    created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_devices_user_id ON devices(user_id);

CREATE TABLE IF NOT EXISTS cloud_connections (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    provider TEXT NOT NULL,
    connected INTEGER NOT NULL DEFAULT 0,
    last_sync TEXT,
    created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_cloud_connections_user_id ON cloud_connections(user_id);

CREATE TABLE IF NOT EXISTS blobs (
    hash TEXT PRIMARY KEY,
    size INTEGER NOT NULL,
    ref_count INTEGER NOT NULL DEFAULT 0,
    storage_path TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS backup_items (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    device_id TEXT REFERENCES devices(id),
    filename TEXT NOT NULL,
    blob_hash TEXT NOT NULL REFERENCES blobs(hash),
    size INTEGER NOT NULL,
    was_deduplicated INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_backup_items_user_id ON backup_items(user_id);

CREATE TABLE IF NOT EXISTS ad_views (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    ad_id TEXT NOT NULL,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    was_clicked INTEGER NOT NULL DEFAULT 0,
    earnings REAL NOT NULL DEFAULT 0.0,
    created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_ad_views_user_id ON ad_views(user_id);
"""

_DROP_SCHEMA = """
DROP TABLE IF EXISTS ad_views;
DROP TABLE IF EXISTS backup_items;
DROP TABLE IF EXISTS blobs;
DROP TABLE IF EXISTS cloud_connections;
DROP TABLE IF EXISTS devices;
DROP TABLE IF EXISTS users;
"""


def init_db(settings: Settings | None = None) -> None:
    settings = settings or get_settings()
    with get_db(settings) as conn:
        conn.executescript(_SCHEMA)
        conn.commit()


def drop_db(settings: Settings | None = None) -> None:
    """Drop all tables. Used to reset state between tests."""
    settings = settings or get_settings()
    with get_db(settings) as conn:
        conn.executescript(_DROP_SCHEMA)
        conn.commit()
