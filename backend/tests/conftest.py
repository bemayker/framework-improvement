"""Shared pytest fixtures for the backend test suite.

Session-scoped FastAPI TestClient fixture used by unit and integration tests,
plus the real-database fixtures TEST-03 introduces (the first feature with a
database layer to connect to). A missing DATABASE_URL skips on a developer
machine (so the suite stays runnable with no services) but fails in CI, where
the integration tier is enabled and blocking, and a skip would read as a pass
(see `require_database_url`).
"""

import os
from collections.abc import Mapping

import psycopg
import pytest
from fastapi.testclient import TestClient

from app.core.db import ensure_schema
from app.main import create_app

TRUNCATE_NOTES_SQL = "TRUNCATE TABLE notes RESTART IDENTITY"


@pytest.fixture(scope="session")
def client() -> TestClient:
    """Session-scoped test client against the FastAPI app."""
    app = create_app()
    with TestClient(app) as test_client:
        yield test_client


MISSING_DATABASE_URL = (
    "DATABASE_URL is not set; the integration tier needs a real PostgreSQL "
    "instance (see .env.example for the host-side connection string)."
)


def require_database_url(environ: Mapping[str, str]) -> str:
    """Return the integration tier's connection string, or end the test.

    Outside CI a missing value skips: a developer running the suite without a
    database should not see red for an environment they did not ask for.

    In CI the same skip is a silent hole rather than a convenience. The
    integration tier is enabled and blocking (`CLAUDE.md` Feature Toggles),
    but a tier whose every test skips still exits 0, so a pipeline that
    forgets DATABASE_URL reports green while testing nothing. There it is a
    configuration defect and must fail loudly. `CI` is set by GitHub Actions,
    and by every other mainstream CI runner.
    """
    url = environ.get("DATABASE_URL")
    if url:
        return url
    if environ.get("CI"):
        pytest.fail(
            f"{MISSING_DATABASE_URL} The integration tier is enabled and "
            "blocking, so CI must not pass it by skipping.",
            pytrace=False,
        )
    pytest.skip(MISSING_DATABASE_URL)


@pytest.fixture(scope="module")
def database_url() -> str:
    """The connection string for the integration tier's real database."""
    return require_database_url(os.environ)


@pytest.fixture(scope="module")
def db_connection(database_url: str) -> psycopg.Connection:
    """Module-scoped connection to the real database, schema ensured."""
    ensure_schema(database_url)
    with psycopg.connect(database_url) as connection:
        yield connection


@pytest.fixture
def notes_table(db_connection: psycopg.Connection) -> psycopg.Connection:
    """Empty the notes table before each test, so tests are order-independent."""
    with db_connection.cursor() as cursor:
        cursor.execute(TRUNCATE_NOTES_SQL)
    db_connection.commit()
    yield db_connection
    db_connection.rollback()
