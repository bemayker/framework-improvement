"""Application settings.

Reads configuration from the environment on every `get_settings()` call.
"""

import os
from dataclasses import dataclass, field

DEFAULT_CORS_ORIGINS = ("http://localhost:5173",)


def _read_database_url() -> str | None:
    """Return the configured database URL, or None when unset.

    No credential-shaped default: docker-compose.yml and .env.example supply the
    real value via DATABASE_URL. When it is unset the app still starts and the
    DB-free endpoints still answer (see the lifespan in `app.main`).
    """
    return os.environ.get("DATABASE_URL")


def _read_cors_origins() -> tuple[str, ...]:
    """Return the browser origins allowed to call this API.

    The frontend (`http://localhost:5173`) calls the backend
    (`http://localhost:8000`) directly, which is cross-origin, so an explicit
    allow-list is required. Configured as a comma-separated CORS_ORIGINS.
    """
    raw = os.environ.get("CORS_ORIGINS")
    if not raw:
        return DEFAULT_CORS_ORIGINS
    origins = tuple(origin.strip() for origin in raw.split(",") if origin.strip())
    return origins or DEFAULT_CORS_ORIGINS


@dataclass(frozen=True)
class Settings:
    app_title: str = "Task Notes API"
    # default_factory, not a plain default: a plain default is evaluated once at
    # import time, which would freeze the environment as it looked when the
    # module was first imported and make get_settings()'s contract a lie.
    database_url: str | None = field(default_factory=_read_database_url)
    cors_origins: tuple[str, ...] = field(default_factory=_read_cors_origins)


def get_settings() -> Settings:
    """Return the application settings, read fresh from the environment."""
    return Settings()
