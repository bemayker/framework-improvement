"""Application settings.

Reads configuration from the environment. Only the database connection
string and app metadata are defined here; TEST-01 (the scaffold feature)
opens no database connection itself — that lands with TEST-02.
"""

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    app_title: str = "Task Notes API"
    # Dev-only, unused until TEST-02 (no DB engine/session is opened by this
    # feature). No credential-shaped default: docker-compose.yml and
    # .env.example supply the real value via DATABASE_URL.
    database_url: str | None = os.environ.get("DATABASE_URL")


def get_settings() -> Settings:
    """Return the application settings, read fresh from the environment."""
    return Settings()
