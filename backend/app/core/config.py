"""Application settings.

Reads configuration from the environment: the database connection string used
by the notes feature, the browser origin the frontend is served from, and app
metadata.
"""

import os
from dataclasses import dataclass, field

DEFAULT_FRONTEND_ORIGIN = "http://localhost:5173"


@dataclass(frozen=True)
class Settings:
    app_title: str = "Task Notes API"
    # No credential-shaped default: docker-compose.yml and .env.example supply
    # the real value. Absent means the app still starts and DB-backed routes
    # fail loudly with a logged 500 (see app/core/db.py).
    database_url: str | None = field(default_factory=lambda: os.environ.get("DATABASE_URL"))
    # The Vite dev server (5173) calls the API (8000) cross-origin, so the
    # browser needs an explicit CORS allowance for that origin.
    frontend_origin: str = field(
        default_factory=lambda: os.environ.get("FRONTEND_ORIGIN", DEFAULT_FRONTEND_ORIGIN)
    )


def get_settings() -> Settings:
    """Return the application settings, read fresh from the environment."""
    return Settings()
