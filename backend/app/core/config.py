"""Application settings.

Reads configuration from the environment.
"""

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    app_title: str = "Task Notes API"
    # No credential-shaped default: docker-compose.yml and .env.example
    # supply the real value via DATABASE_URL.
    database_url: str | None = os.environ.get("DATABASE_URL")
    # CORS allowlist for the frontend origin (the browser calls the API on a
    # different port than the Vite dev server serves the app from).
    frontend_origin: str = os.environ.get("FRONTEND_ORIGIN", "http://localhost:5173")


def get_settings() -> Settings:
    """Return the application settings, read fresh from the environment."""
    return Settings()
