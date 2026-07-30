"""Shared pytest fixtures for the backend test suite.

Three groups:

- `client`: the session-scoped DB-free FastAPI TestClient (TEST-01).
- `db_engine` / `db_session`: a real PostgreSQL engine and session, added by
  TEST-03 now that there is a persistence layer to exercise. Integration tests
  never mock the database (`testing_standards.md` Section 5), so these connect
  for real and fail loudly when they cannot: a skip here would turn a broken
  database service into a green CI run.
- `db_client`: a TestClient whose request-scoped session comes from
  `db_engine`, so router tests run the real HTTP cycle against real rows
  without touching the process-wide engine.
"""

import os
from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import Engine, create_engine, delete
from sqlalchemy.orm import Session, sessionmaker

from app.core.db import Base, get_session, normalize_database_url
from app.main import create_app
from app.models.note import Note

# Fallback for a local or CI run that does not export DATABASE_URL: the
# docker-compose `db` service, which `docker compose up -d` starts in
# .github/workflows/pr-tests.yml before the integration step. Override with
# DATABASE_URL to point the suite at any other instance (for example a
# per-work-item scratch container on a host-assigned port).
DEFAULT_TEST_DATABASE_URL = "postgresql://tasknotes:tasknotes@localhost:5432/tasknotes"


def _test_database_url() -> str:
    return normalize_database_url(os.environ.get("DATABASE_URL") or DEFAULT_TEST_DATABASE_URL)


def _delete_all_notes(engine: Engine) -> None:
    """Remove every note row, so tests are order-independent."""
    with engine.begin() as connection:
        connection.execute(delete(Note))


@pytest.fixture(scope="session")
def client() -> Iterator[TestClient]:
    """Session-scoped test client against the FastAPI app."""
    app = create_app()
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="module")
def db_engine() -> Iterator[Engine]:
    """Module-scoped engine against a real PostgreSQL instance."""
    engine = create_engine(_test_database_url(), pool_pre_ping=True)
    Base.metadata.create_all(bind=engine)
    try:
        yield engine
    finally:
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.fixture
def db_session(db_engine: Engine) -> Iterator[Session]:
    """A session for one test, with the notes table emptied afterwards."""
    factory = sessionmaker(bind=db_engine, expire_on_commit=False)
    session = factory()
    try:
        yield session
    finally:
        session.rollback()
        session.close()
        _delete_all_notes(db_engine)


@pytest.fixture
def db_client(db_engine: Engine) -> Iterator[TestClient]:
    """TestClient whose requests get sessions from the test engine.

    Only the session *provider* is redirected; the session, the SQL and the
    rows are real. The per-request commit mirrors `app.core.db.get_session`, so
    a POST is durable for the GET that follows it.
    """
    factory = sessionmaker(bind=db_engine, expire_on_commit=False)

    def override_get_session() -> Iterator[Session]:
        session = factory()
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()

    app = create_app()
    app.dependency_overrides[get_session] = override_get_session
    try:
        with TestClient(app) as test_client:
            yield test_client
    finally:
        app.dependency_overrides.clear()
        _delete_all_notes(db_engine)
