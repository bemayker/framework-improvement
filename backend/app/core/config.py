"""Application settings.

Reads configuration from the environment. Only the database connection
string and app metadata are defined here; no module in this package opens a
database connection yet — the first feature to need one brings that layer
with it.
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
