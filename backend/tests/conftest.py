"""Shared pytest fixtures for the backend test suite.

`db_engine` (module-scoped) points at a real PostgreSQL instance and creates
the schema once; `db_session` (function-scoped) wraps each test in a
connection-level transaction that is rolled back afterwards, so integration
tests never depend on each other's data or execution order. `client` is
function-scoped and overrides the `get_db` dependency to reuse that same
per-test session, so router integration tests observe exactly what the
test set up before the request.
"""

import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.db import get_db, normalize_database_url
from app.main import create_app

# Falls back to the dev default already published in `.env.example` so both
# a developer machine and the CI step (which sets no env var of its own)
# work against `docker compose up` (Assumption A9 in the plan).
_DEFAULT_TEST_DATABASE_URL = "postgresql://tasknotes:tasknotes@localhost:5432/tasknotes"


@pytest.fixture(scope="module")
def db_engine() -> Engine:
    """Module-scoped engine against a real PostgreSQL instance; creates the schema once."""
    from app.models.base import Base
    from app.models import note  # noqa: F401  (registers Note on Base)

    database_url = os.environ.get("DATABASE_URL", _DEFAULT_TEST_DATABASE_URL)
    engine = create_engine(normalize_database_url(database_url), future=True)
    Base.metadata.create_all(bind=engine)
    yield engine
    engine.dispose()


@pytest.fixture()
def db_session(db_engine: Engine) -> Session:
    """Function-scoped session bound to a transaction rolled back after the test."""
    connection = db_engine.connect()
    transaction = connection.begin()
    session_factory = sessionmaker(bind=connection, autoflush=False, autocommit=False, future=True)
    session = session_factory()

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture()
def client(db_session: Session) -> TestClient:
    """Function-scoped test client whose `get_db` dependency reuses `db_session`."""
    app = create_app()
    app.dependency_overrides[get_db] = lambda: db_session
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
