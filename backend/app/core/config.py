"""Application settings.

Reads configuration from the environment. Connection details are never
hardcoded: the database URL comes from DATABASE_URL (docker-compose.yml and
.env.example supply it) and the CORS allow-list from CORS_ORIGINS.
"""

import os
from dataclasses import dataclass, field

# The frontend dev server. The browser loads the app from :5173 and calls the
# API on :8000, which is cross-origin, so the API must allow that origin.
DEFAULT_CORS_ORIGINS: tuple[str, ...] = ("http://localhost:5173",)

# .env.example and docker-compose.yml ship a plain "postgresql://" URL, whose
# SQLAlchemy default driver is psycopg2. This project installs psycopg 3, so the
# scheme is normalised here rather than requiring every deployment to spell out
# the driver.
_PLAIN_POSTGRES_SCHEME = "postgresql://"
_PSYCOPG_SCHEME = "postgresql+psycopg://"


def _read_cors_origins() -> tuple[str, ...]:
    """Parse CORS_ORIGINS (comma-separated) or fall back to the dev default."""
    raw = os.environ.get("CORS_ORIGINS")
    if not raw:
        return DEFAULT_CORS_ORIGINS
    origins = tuple(origin.strip() for origin in raw.split(",") if origin.strip())
    return origins or DEFAULT_CORS_ORIGINS


@dataclass(frozen=True)
class Settings:
    app_title: str = "Task Notes API"
    # default_factory, not a plain default: a dataclass field default is
    # evaluated once at class-creation time, which would freeze the environment
    # as it looked at import and break get_settings()'s "read fresh" contract.
    database_url: str | None = field(default_factory=lambda: os.environ.get("DATABASE_URL"))
    cors_origins: tuple[str, ...] = field(default_factory=_read_cors_origins)

    @property
    def sqlalchemy_url(self) -> str | None:
        """The database URL with an explicit driver, or None when unconfigured."""
        if not self.database_url:
            return None
        if self.database_url.startswith(_PLAIN_POSTGRES_SCHEME):
            return _PSYCOPG_SCHEME + self.database_url[len(_PLAIN_POSTGRES_SCHEME) :]
        return self.database_url


def get_settings() -> Settings:
    """Return the application settings, read fresh from the environment."""
    return Settings()
