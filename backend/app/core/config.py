"""Application settings.

Reads configuration from the environment. Database connectivity (the
SQLAlchemy engine/session) lives in `app.core.db`; this module only exposes
the raw and normalised connection string, CORS origins, and app metadata.
"""

import os
from dataclasses import dataclass


def _normalize_sqlalchemy_url(url: str | None) -> str | None:
    """Normalise a bare `postgresql://` URL to the psycopg 3 driver form.

    `.env.example` and `docker-compose.yml` ship `postgresql://...`, whose
    SQLAlchemy default driver is psycopg2 (not a dependency of this project).
    This project uses psycopg 3, so the scheme is rewritten to
    `postgresql+psycopg://` without requiring either file to change.
    """
    if url is None:
        return None
    prefix = "postgresql://"
    if url.startswith(prefix):
        return "postgresql+psycopg://" + url[len(prefix) :]
    return url


def _parse_cors_origins(raw: str | None) -> tuple[str, ...]:
    if not raw:
        return ("http://localhost:5173",)
    return tuple(origin.strip() for origin in raw.split(",") if origin.strip())


@dataclass(frozen=True)
class Settings:
    app_title: str = "Task Notes API"
    # Connection details come exclusively from DATABASE_URL; nothing is
    # hardcoded. None when unset, so unit tests stay database-free.
    database_url: str | None = os.environ.get("DATABASE_URL")
    # Allow-listed browser origins for CORSMiddleware. The frontend dev server
    # (http://localhost:5173) and the backend API (http://localhost:8000) are
    # different origins, so CORS is functionally required, not optional.
    cors_origins: tuple[str, ...] = _parse_cors_origins(os.environ.get("CORS_ORIGINS"))

    @property
    def sqlalchemy_url(self) -> str | None:
        """`database_url` normalised for SQLAlchemy's psycopg 3 driver."""
        return _normalize_sqlalchemy_url(self.database_url)


def get_settings() -> Settings:
    """Return the application settings, read fresh from the environment."""
    return Settings()
