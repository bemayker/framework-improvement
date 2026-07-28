"""Shared pytest fixtures for the backend test suite.

Unit tests never request the fixtures below (they call `create_app()`
directly) and stay database-free. Integration tests request `client` (or
`db_session` directly), which need a reachable PostgreSQL via `DATABASE_URL`
(`CLAUDE.md` Test Configuration).
"""

from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from app.core import db
from app.main import create_app


@pytest.fixture(scope="module")
def db_engine() -> Engine:
    """Module-scoped real database engine; ensures the schema once per module."""
    engine = db.get_engine()
    db.init_db()
    return engine


@pytest.fixture()
def db_session(db_engine: Engine) -> Generator[Session, None, None]:
    """Per-test session whose changes are always rolled back after the test.

    Binds the session to a single connection wrapped in an outer transaction;
    `join_transaction_mode="create_savepoint"` makes the service layer's own
    `session.commit()` release a SAVEPOINT instead of the outer transaction,
    so the final rollback below always undoes everything the test did,
    regardless of test execution order (`coding_standards.md` Section 2.5).
    """
    connection = db_engine.connect()
    outer_transaction = connection.begin()
    session_factory = sessionmaker(
        bind=connection,
        autoflush=False,
        expire_on_commit=False,
        join_transaction_mode="create_savepoint",
    )
    session = session_factory()
    try:
        yield session
    finally:
        session.close()
        outer_transaction.rollback()
        connection.close()


@pytest.fixture()
def client(db_session: Session) -> Generator[TestClient, None, None]:
    """Function-scoped test client with `get_session` overridden to the rolled-back session."""

    def _override_get_session() -> Generator[Session, None, None]:
        yield db_session

    app = create_app()
    app.dependency_overrides[db.get_session] = _override_get_session
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
