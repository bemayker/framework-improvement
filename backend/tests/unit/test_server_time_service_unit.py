"""Unit tests for the server time service (FEAT-1, BUG-01)."""

from datetime import datetime, timedelta, timezone

import pytest

from app.services import server_time_service


def test_get_server_time_returns_aware_utc():
    """Happy path: the value is timezone-aware with a zero UTC offset."""
    result = server_time_service.get_server_time()

    assert result.tzinfo is not None
    assert result.utcoffset() == timedelta(0)


def test_get_server_time_reads_the_clock_on_every_call(monkeypatch):
    """Edge case: two clock values give two different results (never cached)."""
    first = datetime(2026, 11, 4, 1, 0, 0, tzinfo=timezone.utc)
    second = datetime(2026, 11, 4, 1, 0, 1, tzinfo=timezone.utc)
    clock_values = iter([first, second])
    monkeypatch.setattr(server_time_service, "_utc_now", lambda: next(clock_values))

    assert server_time_service.get_server_time() == first
    assert server_time_service.get_server_time() == second


def test_get_server_time_propagates_a_clock_failure(monkeypatch):
    """Error case: a failing clock surfaces unchanged."""

    def broken_clock() -> datetime:
        raise RuntimeError("clock unavailable")

    monkeypatch.setattr(server_time_service, "_utc_now", broken_clock)

    with pytest.raises(RuntimeError, match="clock unavailable"):
        server_time_service.get_server_time()
