"""PostgreSQL connectivity for the notes feature (TEST-03).

Provides the per-request connection dependency and the single schema
statement this project needs. No migration tool is involved: one table with
two queries does not justify one (see the plan's Technology Selection).
"""

import logging
from collections.abc import Iterator

import psycopg

from app.core.config import get_settings

logger = logging.getLogger(__name__)

CREATE_NOTES_TABLE = """
CREATE TABLE IF NOT EXISTS notes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
)
"""


def connect() -> psycopg.Connection:
    """Open a connection to the configured database.

    Raises RuntimeError when DATABASE_URL is unset, so a DB-backed route fails
    loudly with a logged 500 rather than silently answering with no data.
    """
    database_url = get_settings().database_url
    if not database_url:
        logger.error("DATABASE_URL is not configured; cannot open a database connection.")
        raise RuntimeError("DATABASE_URL is not configured.")
    return psycopg.connect(database_url)


def get_connection() -> Iterator[psycopg.Connection]:
    """FastAPI dependency yielding one connection per request.

    The connection is not in autocommit mode, so a transaction is open for the
    duration of the request; the service layer owns the commit
    (coding_standards.md Section 2.2). Anything that escapes the request is
    rolled back before the connection is closed.
    """
    connection = connect()
    try:
        yield connection
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def ensure_schema(connection: psycopg.Connection) -> None:
    """Create the `notes` table if it does not exist yet. Idempotent."""
    with connection.cursor() as cursor:
        cursor.execute(CREATE_NOTES_TABLE)
    connection.commit()
