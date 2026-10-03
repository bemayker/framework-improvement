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

# Reported by GET /api/version when BUILD_COMMIT is unset or blank. Declared
# once here so neither the Dockerfile nor compose carries a second default.
DEFAULT_BUILD_COMMIT = "unknown"


def _read_build_commit() -> str:
    """Return BUILD_COMMIT from the environment, or the default when blank."""
    return (os.environ.get("BUILD_COMMIT") or "").strip() or DEFAULT_BUILD_COMMIT


def _read_cors_origins() -> tuple[str, ...]:
    """Return CORS_ORIGINS split on commas, or the default when none are given.

    A trailing slash is dropped from each entry: browsers send `Origin` without
    one, so `http://host/` would otherwise never match.
    """
    entries = (
        entry.strip().rstrip("/")
        for entry in (os.environ.get("CORS_ORIGINS") or "").split(",")
    )
    return tuple(entry for entry in entries if entry) or DEFAULT_CORS_ORIGINS


@dataclass(frozen=True)
class Settings:
    app_title: str = "Task Notes API"
    # No credential-shaped default: docker-compose.yml and .env.example
    # supply the real value via DATABASE_URL.
    database_url: str | None = field(
        default_factory=lambda: os.environ.get("DATABASE_URL")
    )
    # CORS_ORIGINS (comma-separated), read per call; unset or blank uses the default.
    cors_origins: tuple[str, ...] = field(default_factory=_read_cors_origins)
    # Set at image build time (Dockerfile ARG/ENV); read per call like database_url.
    build_commit: str = field(default_factory=_read_build_commit)


def get_settings() -> Settings:
    """Return the application settings, read fresh from the environment."""
    return Settings()
