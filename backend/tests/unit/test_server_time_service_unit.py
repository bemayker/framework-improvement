"""Unit tests for the server time service (FEAT-1)."""

from datetime import UTC, datetime, timedelta

from app.services import server_time_service


def test_get_server_time_returns_timezone_aware_utc():
    """Happy path: the value is aware and its offset is zero."""
    value = server_time_service.get_server_time()

    assert value.tzinfo is not None
    assert value.utcoffset() == timedelta(0)


def test_get_server_time_returns_a_fresh_value_per_call(monkeypatch):
    """Edge case: each call reads the clock again, nothing is cached."""
    first = datetime(2026, 1, 1, 12, 0, 0, tzinfo=UTC)
    second = first + timedelta(seconds=1)
    clock = iter([first, second])
    monkeypatch.setattr(server_time_service, "_utc_now", lambda: next(clock))

    assert server_time_service.get_server_time() == first
    assert server_time_service.get_server_time() == second
