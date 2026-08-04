"""Shared pytest fixtures for the backend test suite.

Session-scoped FastAPI TestClient fixture used by unit and integration tests,
plus the real-database fixtures TEST-03 introduces (the first feature with a
database layer to connect to). The database fixtures skip rather than fail
when DATABASE_URL is unset, so the unit tier stays runnable with no services.
"""

import os

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


@pytest.fixture(scope="module")
def database_url() -> str:
    """The connection string for the integration tier's real database."""
    url = os.environ.get("DATABASE_URL")
    if not url:
        pytest.skip(
            "DATABASE_URL is not set; the integration tier needs a real "
            "PostgreSQL instance (see docs/DEVELOPMENT.md)."
        )
    return url


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
