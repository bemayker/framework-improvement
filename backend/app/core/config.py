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
    database_url: str = os.environ.get(
        "DATABASE_URL", "postgresql://tasknotes:tasknotes@localhost:5432/tasknotes"
    )


def get_settings() -> Settings:
    """Return the application settings, read fresh from the environment."""
    return Settings()
