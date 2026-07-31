"""Unit tests for the database helpers (backend/app/core/db.py).

No database is involved: `psycopg.connect` and `connect` are stubbed, so this
file runs in the unit tier with DATABASE_URL unset (testing_standards.md
Section 1.1).
"""

import pytest

from app.core import db


class FakeConnection:
    """Records the lifecycle calls `get_connection` makes, in order."""

    def __init__(self) -> None:
        self.calls: list[str] = []

    def rollback(self) -> None:
        self.calls.append("rollback")

    def close(self) -> None:
        self.calls.append("close")


def test_connect_opens_a_connection_to_the_configured_url(monkeypatch):
    """Happy path: the configured URL is handed to psycopg unchanged."""
    monkeypatch.setenv("DATABASE_URL", "postgresql://user:pass@localhost:5432/notes")
    opened: list[str] = []
    sentinel = FakeConnection()

    def fake_connect(url: str) -> FakeConnection:
        opened.append(url)
        return sentinel

    monkeypatch.setattr(db.psycopg, "connect", fake_connect)

    assert db.connect() is sentinel
    assert opened == ["postgresql://user:pass@localhost:5432/notes"]


def test_connect_raises_when_database_url_is_unset(monkeypatch):
    """Error case: an unset DATABASE_URL fails loudly instead of returning None.

    A silently absent connection would let a DB-backed route answer with no
    data; the RuntimeError surfaces as a logged 500 instead.
    """
    monkeypatch.delenv("DATABASE_URL", raising=False)

    with pytest.raises(RuntimeError, match="DATABASE_URL is not configured"):
        db.connect()


def test_connect_raises_when_database_url_is_empty(monkeypatch):
    """Edge case: an empty string is treated as unset, not as a valid URL."""
    monkeypatch.setenv("DATABASE_URL", "")

    with pytest.raises(RuntimeError, match="DATABASE_URL is not configured"):
        db.connect()


def test_get_connection_yields_the_connection_and_closes_it_without_rolling_back(monkeypatch):
    """Happy path: a request that completes closes the connection and does not roll back."""
    connection = FakeConnection()
    monkeypatch.setattr(db, "connect", lambda: connection)

    dependency = db.get_connection()
    assert next(dependency) is connection

    with pytest.raises(StopIteration):
        next(dependency)

    assert connection.calls == ["close"]


def test_get_connection_rolls_back_before_closing_when_the_request_raises(monkeypatch):
    """Error case: an escaping exception rolls the transaction back, then closes.

    The ordering is the point: closing first would discard the open
    transaction's outcome without an explicit rollback.
    """
    connection = FakeConnection()
    monkeypatch.setattr(db, "connect", lambda: connection)

    dependency = db.get_connection()
    next(dependency)

    with pytest.raises(RuntimeError, match="request failed"):
        dependency.throw(RuntimeError("request failed"))

    assert connection.calls == ["rollback", "close"]
