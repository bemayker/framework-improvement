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

from app.core import db as db_module
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
    """Function-scoped session bound to a transaction rolled back after the test.

    Isolation relies on SQLAlchemy 2.0's ``join_transaction_mode`` on the
    `Session` bound to this already-begun `Connection`. It is pinned here
    explicitly (rather than left to the library default) because the exact
    mode matters for correctness: with no SAVEPOINT open at bind time (we
    call `connection.begin()`, not `connection.begin_nested()`),
    `"conditional_savepoint"` resolves to `"rollback_only"` — the Session's
    `.commit()` (called by `NoteService.create_note()` on every successful
    write) flushes to the connection but does NOT propagate a commit to this
    outer transaction. Only `.rollback()` propagates. So the final
    `transaction.rollback()` below always undoes everything written during
    the test, including rows the service layer "committed" from its own
    point of view. See `test_db_session_isolation_integration.py` for a
    regression test that fails loudly if this guarantee ever breaks (e.g. if
    a future change binds a Connection that already holds a SAVEPOINT, which
    would flip this mode to `"create_savepoint"` and change commit semantics).
    """
    connection = db_engine.connect()
    transaction = connection.begin()
    session_factory = sessionmaker(
        bind=connection,
        autoflush=False,
        autocommit=False,
        future=True,
        join_transaction_mode="conditional_savepoint",
    )
    session = session_factory()

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture()
def client(db_session: Session, db_engine: Engine, monkeypatch: pytest.MonkeyPatch) -> TestClient:
    """Function-scoped test client whose `get_db` dependency reuses `db_session`.

    `TestClient(app)` runs the app's `lifespan`, which calls `init_db()` ->
    `get_engine()`. Left alone, `get_engine()` would build its own engine from
    `get_settings().database_url` (i.e. the `DATABASE_URL` env var) and raise
    if that variable is not set in the process environment — a real
    possibility in CI, where the test step sets no such variable even though
    `docker compose up` (started by an earlier CI step) already published a
    real PostgreSQL on the same host/port `db_engine` above already resolved
    and connected to. Rather than requiring the CI workflow and this fixture's
    default to agree on a URL by convention, point the app's engine singleton
    directly at the already-connected `db_engine` before the app starts, so
    `init_db()` never consults `DATABASE_URL` at all. `Base.metadata.create_all`
    is idempotent, so re-running it here against tables `db_engine` already
    created is a safe no-op.
    """
    monkeypatch.setattr(db_module, "_engine", db_engine)
    app = create_app()
    app.dependency_overrides[get_db] = lambda: db_session
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
