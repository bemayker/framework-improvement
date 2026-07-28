"""Application settings.

Reads configuration from the environment: app metadata, the database
connection string (used by app.core.db since TEST-03), and the browser origins
allowed to call the API.
"""

import os
from dataclasses import dataclass, field

DEFAULT_CORS_ORIGINS = ("http://localhost:5173",)


def _read_cors_origins() -> list[str]:
    """Read CORS_ORIGINS as a comma-separated list, falling back to the dev origin.

    The Vite dev server's origin is the only one the project ships with; a
    deployment overrides the whole list via the environment.
    """
    raw = os.environ.get("CORS_ORIGINS")
    if raw is None:
        return list(DEFAULT_CORS_ORIGINS)
    origins = [origin.strip() for origin in raw.split(",") if origin.strip()]
    return origins or list(DEFAULT_CORS_ORIGINS)


@dataclass(frozen=True)
class Settings:
    app_title: str = "Task Notes API"
    # No credential-shaped default: docker-compose.yml and .env.example supply
    # the real value via DATABASE_URL.
    database_url: str | None = os.environ.get("DATABASE_URL")
    cors_origins: list[str] = field(default_factory=_read_cors_origins)


def get_settings() -> Settings:
    """Return the application settings, read fresh from the environment."""
    return Settings()
