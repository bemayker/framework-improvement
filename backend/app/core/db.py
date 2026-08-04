"""Database connectivity for the notes feature (TEST-03).

The project runs no migration framework, so the single table this feature
needs is created idempotently at application startup via `ensure_schema`
(called from the app lifespan in app/main.py). Connections are opened per
request through the `get_connection` FastAPI dependency; a connection pool
would be a second new dependency that sandbox-scale traffic does not justify.
"""

import logging
from collections.abc import Iterator

import psycopg

from app.core.config import get_settings

logger = logging.getLogger(__name__)

# The CHECK keeps the "no blank note" rule in the database as well as in the
# request schema, so a future writer that bypasses the API cannot store one.
SCHEMA_DDL = """
CREATE TABLE IF NOT EXISTS notes (
    id   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    text TEXT NOT NULL CHECK (btrim(text) <> '')
);
"""


def ensure_schema(target: psycopg.Connection | str) -> None:
    """Create the `notes` table if it does not exist.

    Accepts either an open connection (reused by the test fixtures) or a
    connection string (used at application startup). Idempotent: safe to run
    on every boot.
    """
    if isinstance(target, str):
        with psycopg.connect(target) as connection:
            _apply_schema(connection)
        return
    _apply_schema(target)


def _apply_schema(connection: psycopg.Connection) -> None:
    with connection.cursor() as cursor:
        cursor.execute(SCHEMA_DDL)
    connection.commit()


def get_connection() -> Iterator[psycopg.Connection]:
    """Yield a per-request database connection, committed on success.

    Raises when no `DATABASE_URL` is configured: the notes endpoints cannot
    answer without a database, and a misconfigured deployment should fail
    loudly with a logged reason rather than return an empty list.
    """
    settings = get_settings()
    if settings.database_url is None:
        logger.error(
            "DATABASE_URL is not configured; the notes endpoints require a database."
        )
        raise RuntimeError("DATABASE_URL is not configured")

    connection = psycopg.connect(settings.database_url)
    try:
        yield connection
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()
