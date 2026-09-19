"""Application configuration.

Values are read from the environment on *every* call to :func:`get_settings`
(no caching), so tests that set ``UBS_``-prefixed environment variables right
before building a server always see fresh values. Sensible development
defaults are provided; override them via environment variables in any real
deployment.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent


def _env(name: str, default: str) -> str:
    return os.environ.get(f"UBS_{name}", default)


@dataclass(frozen=True)
class Settings:
    # Auth
    secret_key: str
    access_token_expire_minutes: int
    algorithm: str

    # Storage
    database_url: str
    storage_dir: Path

    # OAuth (only used if you wire up real cloud connectors)
    google_client_id: str
    google_client_secret: str
    microsoft_client_id: str
    microsoft_client_secret: str


def get_settings() -> Settings:
    storage_dir = Path(_env("STORAGE_DIR", str(BASE_DIR / "storage")))
    settings = Settings(
        secret_key=_env("SECRET_KEY", "dev-only-insecure-change-me"),
        access_token_expire_minutes=int(_env("ACCESS_TOKEN_EXPIRE_MINUTES", str(60 * 24))),
        algorithm=_env("ALGORITHM", "HS256"),
        database_url=_env("DATABASE_URL", f"sqlite:///{BASE_DIR / 'ubs.db'}"),
        storage_dir=storage_dir,
        google_client_id=_env("GOOGLE_CLIENT_ID", ""),
        google_client_secret=_env("GOOGLE_CLIENT_SECRET", ""),
        microsoft_client_id=_env("MICROSOFT_CLIENT_ID", ""),
        microsoft_client_secret=_env("MICROSOFT_CLIENT_SECRET", ""),
    )
    settings.storage_dir.mkdir(parents=True, exist_ok=True)
    return settings
