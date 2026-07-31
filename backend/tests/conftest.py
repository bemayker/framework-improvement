"""Shared pytest fixtures for the backend test suite.

Session-scoped FastAPI TestClient fixture used by unit and integration tests,
plus the module-scoped real-database fixture and schema runner the integration
tier needs (coding_standards.md Section 2.5). The database fixtures skip
themselves when DATABASE_URL is unset, so the unit tier never needs a
database.
"""

import os
from collections.abc import Iterator

import psycopg
import pytest
from fastapi.testclient import TestClient

from app.core.db import ensure_schema
from app.main import create_app

TRUNCATE_NOTES = "TRUNCATE TABLE notes RESTART IDENTITY"


@pytest.fixture(scope="session")
def client() -> TestClient:
    """Session-scoped test client against the FastAPI app."""
    app = create_app()
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="module")
def database_connection() -> Iterator[psycopg.Connection]:
    """Module-scoped connection to the real PostgreSQL instance.

    Doubles as the migration runner: `ensure_schema` is the project's whole
    schema definition (see app/core/db.py).
    """
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        pytest.skip("DATABASE_URL is not set; integration tests need a real PostgreSQL.")
    with psycopg.connect(database_url) as connection:
        ensure_schema(connection)
        yield connection


@pytest.fixture
def notes_table(database_connection: psycopg.Connection) -> Iterator[psycopg.Connection]:
    """Function-scoped isolation: an empty `notes` table before every test.

    Truncating rather than rolling back keeps the state visible to the
    separate connection the app opens per HTTP request, so router tests and
    repository tests can share this fixture.
    """
    with database_connection.cursor() as cursor:
        cursor.execute(TRUNCATE_NOTES)
    database_connection.commit()
    yield database_connection
