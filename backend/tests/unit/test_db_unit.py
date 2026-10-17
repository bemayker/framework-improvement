"""Unit tests for the database helpers (backend/app/core/db.py).

`psycopg.connect` is stubbed, so no database is involved
(testing_standards.md Section 1.1). What is covered here is the branching this
module owns: `ensure_schema`'s connection-or-connection-string dispatch, and
`get_connection`'s unset-URL failure plus its commit and rollback paths.
`ensure_schema` against a real PostgreSQL instance (including its idempotency)
belongs to the integration tier, which exercises it through the `db_connection`
fixture.
"""

import logging

import psycopg
import pytest

from app.core import db

URL = "postgresql://tasknotes:tasknotes@localhost:5432/tasknotes"


class FakeCursor:
    """Context-manager cursor that records the statements it was given."""

    def __init__(self, executed: list[str]) -> None:
        self._executed = executed

    def __enter__(self) -> "FakeCursor":
        return self

    def __exit__(self, *exc_info: object) -> bool:
        return False

    def execute(self, sql: str) -> None:
        self._executed.append(sql)


class FakeConnection:
    """In-memory stand-in for a psycopg connection, recording what was called."""

    def __init__(self) -> None:
        self.executed: list[str] = []
        self.commits = 0
        self.rollbacks = 0
        self.closed = False

    def cursor(self) -> FakeCursor:
        return FakeCursor(self.executed)

    def commit(self) -> None:
        self.commits += 1

    def rollback(self) -> None:
        self.rollbacks += 1

    def close(self) -> None:
        self.closed = True

    # `ensure_schema` opens the connection-string case with a `with` block.
    def __enter__(self) -> "FakeConnection":
        return self

    def __exit__(self, *exc_info: object) -> bool:
        return False


def stub_connect(monkeypatch: pytest.MonkeyPatch) -> tuple[FakeConnection, list[str]]:
    """Replace `psycopg.connect` with a stub, returning its connection and calls."""
    connection = FakeConnection()
    calls: list[str] = []

    def fake_connect(conninfo: str) -> FakeConnection:
        calls.append(conninfo)
        return connection

    monkeypatch.setattr(psycopg, "connect", fake_connect)
    return connection, calls


def test_ensure_schema_applies_the_ddl_to_a_provided_connection(
    monkeypatch: pytest.MonkeyPatch,
):
    """Happy path of the connection branch: the caller's connection is reused."""
    _, calls = stub_connect(monkeypatch)
    caller_connection = FakeConnection()

    db.ensure_schema(caller_connection)

    assert caller_connection.executed == [db.SCHEMA_DDL]
    assert caller_connection.commits == 1
    # The dispatch must not open a second connection of its own.
    assert calls == []


def test_ensure_schema_opens_a_connection_when_given_a_connection_string(
    monkeypatch: pytest.MonkeyPatch,
):
    """Edge case of the same dispatch: a string means "open one for me"."""
    connection, calls = stub_connect(monkeypatch)

    db.ensure_schema(URL)

    assert calls == [URL]
    assert connection.executed == [db.SCHEMA_DDL]
    assert connection.commits == 1


def test_get_connection_raises_and_logs_when_database_url_is_not_configured(
    monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture
):
    """Error case: the notes endpoints must fail loudly, not answer emptily."""
    monkeypatch.delenv("DATABASE_URL", raising=False)

    with caplog.at_level(logging.ERROR, logger=db.__name__):
        with pytest.raises(RuntimeError, match="DATABASE_URL is not configured"):
            next(db.get_connection())

    assert "the notes endpoints require a database" in caplog.text


def test_get_connection_commits_and_closes_when_the_request_succeeds(
    monkeypatch: pytest.MonkeyPatch,
):
    """Happy path: the yielded connection is committed once and always closed."""
    monkeypatch.setenv("DATABASE_URL", URL)
    connection, calls = stub_connect(monkeypatch)

    dependency = db.get_connection()
    assert next(dependency) is connection
    with pytest.raises(StopIteration):
        next(dependency)

    assert calls == [URL]
    assert (connection.commits, connection.rollbacks) == (1, 0)
    assert connection.closed is True


def test_get_connection_rolls_back_and_closes_when_the_request_raises(
    monkeypatch: pytest.MonkeyPatch,
):
    """Error case: a failing request rolls the transaction back and re-raises."""
    monkeypatch.setenv("DATABASE_URL", URL)
    connection, _ = stub_connect(monkeypatch)

    dependency = db.get_connection()
    next(dependency)
    with pytest.raises(RuntimeError, match="endpoint blew up"):
        dependency.throw(RuntimeError("endpoint blew up"))

    assert (connection.commits, connection.rollbacks) == (0, 1)
    assert connection.closed is True
