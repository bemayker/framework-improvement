"""Unit tests for the health service's connectivity probe (TEST-02).

`psycopg.connect` is stubbed throughout: the probe's behaviour is what is under
test here, and the real-database path is covered by the integration tier.
"""

import logging

import psycopg
import pytest

from app.services import health_service

PROBE_URL = "postgresql://probe@127.0.0.1:5432/probe"


class _FakeCursor:
    def __init__(self, executed: list[str]) -> None:
        self._executed = executed

    def __enter__(self) -> "_FakeCursor":
        return self

    def __exit__(self, *exc_info: object) -> bool:
        return False

    def execute(self, statement: str) -> None:
        self._executed.append(statement)


class _FakeConnection:
    def __init__(self, executed: list[str]) -> None:
        self._executed = executed

    def __enter__(self) -> "_FakeConnection":
        return self

    def __exit__(self, *exc_info: object) -> bool:
        return False

    def cursor(self) -> _FakeCursor:
        return _FakeCursor(self._executed)


def test_check_database_connectivity_returns_true_when_probe_query_succeeds(
    monkeypatch: pytest.MonkeyPatch,
):
    """Happy path: a reachable database that answers SELECT 1 reports connected."""
    monkeypatch.setenv("DATABASE_URL", PROBE_URL)
    executed: list[str] = []
    calls: list[tuple[tuple, dict]] = []

    def fake_connect(*args, **kwargs) -> _FakeConnection:
        calls.append((args, kwargs))
        return _FakeConnection(executed)

    monkeypatch.setattr(health_service.psycopg, "connect", fake_connect)

    assert health_service.check_database_connectivity() is True
    assert executed == [health_service.PROBE_SQL]
    assert calls[0][0] == (PROBE_URL,)
    assert calls[0][1] == {
        "connect_timeout": health_service.CONNECT_TIMEOUT_SECONDS
    }


def test_check_database_connectivity_returns_false_when_database_url_is_unset(
    monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture
):
    """Edge case: unconfigured means unverifiable, and no connection is attempted."""
    monkeypatch.delenv("DATABASE_URL", raising=False)

    def forbidden_connect(*args, **kwargs):
        raise AssertionError("connect must not be called without a DATABASE_URL")

    monkeypatch.setattr(health_service.psycopg, "connect", forbidden_connect)

    with caplog.at_level(logging.WARNING):
        assert health_service.check_database_connectivity() is False

    assert "DATABASE_URL is not configured" in caplog.text


def test_check_database_connectivity_returns_false_when_connect_raises_psycopg_error(
    monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture
):
    """Error case: a refused connection is absorbed and logged, never raised."""
    monkeypatch.setenv("DATABASE_URL", PROBE_URL)

    def refusing_connect(*args, **kwargs):
        raise psycopg.OperationalError("connection refused")

    monkeypatch.setattr(health_service.psycopg, "connect", refusing_connect)

    with caplog.at_level(logging.WARNING):
        assert health_service.check_database_connectivity() is False

    assert "OperationalError" in caplog.text
    assert "connection refused" in caplog.text


def test_check_database_connectivity_returns_false_when_connect_raises_os_error(
    monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture
):
    """Error case: name-resolution failures surface as OSError, not psycopg.Error."""
    monkeypatch.setenv("DATABASE_URL", PROBE_URL)

    def unresolvable_connect(*args, **kwargs):
        raise OSError("Name or service not known")

    monkeypatch.setattr(health_service.psycopg, "connect", unresolvable_connect)

    with caplog.at_level(logging.WARNING):
        assert health_service.check_database_connectivity() is False

    assert "Name or service not known" in caplog.text
