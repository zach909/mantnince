"""Application configuration.

Values are read from the environment (or a local .env file) so that secrets
never need to live in source control. Sensible development defaults are
provided; override them in any real deployment.
"""

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="UBS_", env_file=".env", extra="ignore")

    # Auth
    secret_key: str = "dev-only-insecure-change-me"
    access_token_expire_minutes: int = 60 * 24
    algorithm: str = "HS256"

    # Storage
    database_url: str = f"sqlite:///{BASE_DIR / 'ubs.db'}"
    storage_dir: Path = BASE_DIR / "storage"

    # OAuth (only used if you wire up real cloud connectors)
    google_client_id: str = ""
    google_client_secret: str = ""
    microsoft_client_id: str = ""
    microsoft_client_secret: str = ""


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.storage_dir.mkdir(parents=True, exist_ok=True)
    return settings
