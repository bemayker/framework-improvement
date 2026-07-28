"""Shared pytest fixtures for the backend test suite.

Two tiers are served here:

* The unit tier needs no database. The session-scoped ``client`` fixture
  instantiates the app, which starts with DATABASE_URL absent.
* The integration tier runs against the real PostgreSQL from docker-compose.yml.
  It reads DATABASE_URL and falls back to the compose defaults, which is also
  what CI uses (`docker compose up -d` publishes the ``db`` service on the
  runner's localhost:5432). Point DATABASE_URL elsewhere to use another
  instance; the URL is normalised to the psycopg driver either way.

Every integration test runs inside an outer transaction that is rolled back
afterwards, so the tests are order-independent and leave the database as they
found it.
"""

import os
from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import Engine, create_engine, delete
from sqlalchemy.orm import Session

from app.core.db import create_schema, get_db, to_sqlalchemy_url
from app.main import create_app
from app.models.note import Note

# Matches docker-compose.yml's db service and .env.example; DATABASE_URL wins.
DEFAULT_DATABASE_URL = "postgresql+psycopg://tasknotes:tasknotes@localhost:5432/tasknotes"


@pytest.fixture(scope="session")
def client() -> Iterator[TestClient]:
    """Session-scoped test client against the FastAPI app."""
    app = create_app()
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="module")
def db_engine() -> Iterator[Engine]:
    """Module-scoped engine bound to the real database the tests run against."""
    url = to_sqlalchemy_url(os.environ.get("DATABASE_URL") or DEFAULT_DATABASE_URL)
    engine = create_engine(url, pool_pre_ping=True)
    try:
        yield engine
    finally:
        engine.dispose()


@pytest.fixture(scope="module")
def migrated_db(db_engine: Engine) -> Engine:
    """Migration runner: ensure the schema exists before any test queries it."""
    create_schema(db_engine)
    return db_engine


@pytest.fixture
def db_session(migrated_db: Engine) -> Iterator[Session]:
    """A session in an outer transaction that is rolled back after the test.

    ``join_transaction_mode="create_savepoint"`` makes the session's own commits
    (the request dependency commits on every call) release a savepoint instead of
    ending the outer transaction, so the rollback below still undoes everything.
    Existing rows are deleted inside that same transaction, so tests asserting on
    the full note list are deterministic on a database that already holds data
    and the rollback puts those rows back.
    """
    connection = migrated_db.connect()
    transaction = connection.begin()
    session = Session(
        bind=connection, join_transaction_mode="create_savepoint", expire_on_commit=False
    )
    session.execute(delete(Note))
    session.flush()
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture
def db_client(db_session: Session) -> Iterator[TestClient]:
    """Test client whose requests run on the test's rolled-back session."""
    app = create_app()

    def override_get_db() -> Iterator[Session]:
        yield db_session
        db_session.commit()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
