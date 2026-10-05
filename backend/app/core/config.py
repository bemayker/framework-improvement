"""Application settings.

Reads configuration from the environment. TEST-03 is the first feature to
open a database connection, so `database_url` is now read per call rather
than bound once at import time: a dataclass field default is evaluated when
the class is defined, which would make `get_settings()`'s "read fresh from
the environment" promise false for anything that changes the variable after
import (the version integration test does exactly that).
"""

import os
from dataclasses import dataclass, field

# The browser at :5183 calls the backend at :8010 directly (the
# VITE_API_BASE_URL wiring in docker-compose.yml), which is cross-origin.
DEFAULT_CORS_ORIGINS = ("http://localhost:5183",)


@dataclass(frozen=True)
class Settings:
    app_title: str = "Task Notes API"
    # No credential-shaped default: docker-compose.yml and .env.example
    # supply the real value via DATABASE_URL.
    database_url: str | None = field(
        default_factory=lambda: os.environ.get("DATABASE_URL")
    )
    cors_origins: tuple[str, ...] = DEFAULT_CORS_ORIGINS


def get_settings() -> Settings:
    """Return the application settings, read fresh from the environment."""
    return Settings()
