"""Shared pytest fixtures for the backend test suite.

Two tiers are served here:

* Unit tests need no database. The session-scoped `client` fixture instantiates
  the app, which tolerates a missing DATABASE_URL.
* Integration tests run against the real PostgreSQL from docker-compose.yml.
  They reach it through `DATABASE_URL` (never a hardcoded connection string) and
  are skipped when that variable is unset, so `uv run pytest` stays usable on a
  machine with no database. A DATABASE_URL that is set but unreachable is an
  error, not a skip: that is a broken environment, not an absent one.

Each integration test runs inside an outer transaction that is rolled back
afterwards, so the tests are order-independent and leave the database untouched.
"""

from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.db import get_session, init_db
from app.main import create_app


@pytest.fixture(scope="session")
def client() -> Iterator[TestClient]:
    """Session-scoped test client against the FastAPI app."""
    app = create_app()
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="module")
def db_engine() -> Iterator[Engine]:
    """Module-scoped engine bound to the real database named by DATABASE_URL."""
    settings = get_settings()
    url = settings.sqlalchemy_url
    if url is None:
        pytest.skip(
            "DATABASE_URL is not set, so the integration tier has no database to "
            "run against. Start one (`docker compose up -d --wait db`) and export "
            "DATABASE_URL, as .env.example documents."
        )

    engine = create_engine(url, pool_pre_ping=True)
    try:
        yield engine
    finally:
        engine.dispose()


@pytest.fixture(scope="module")
def migrated_db(db_engine: Engine) -> Engine:
    """Migration runner: ensure the schema exists before any test queries it."""
    init_db(db_engine)
    return db_engine


@pytest.fixture
def db_session(migrated_db: Engine) -> Iterator[Session]:
    """A session inside an outer transaction that is rolled back after the test.

    `join_transaction_mode="create_savepoint"` makes the session's own commits
    (the service layer commits on every create) release a savepoint instead of
    ending the outer transaction, so the rollback below still undoes everything.
    """
    connection = migrated_db.connect()
    transaction = connection.begin()
    session = Session(
        bind=connection, join_transaction_mode="create_savepoint", expire_on_commit=False
    )
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture
def api_client(db_session: Session) -> Iterator[TestClient]:
    """Test client whose requests run on the rolled-back `db_session`."""
    app = create_app()
    app.dependency_overrides[get_session] = lambda: db_session
    try:
        with TestClient(app) as test_client:
            yield test_client
    finally:
        app.dependency_overrides.clear()
