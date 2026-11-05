"""Unit tests for the server time service (BUG-01)."""

from datetime import datetime, timedelta, timezone

from app.services import server_time_service
from app.services.server_time_service import get_current_utc_time


def test_get_current_utc_time_returns_aware_utc_datetime():
    """Happy path: the result is timezone-aware with a zero UTC offset."""
    result = get_current_utc_time()

    assert result.tzinfo is not None
    assert result.utcoffset() == timedelta(0)


def test_get_current_utc_time_is_computed_per_call(monkeypatch):
    """Edge case: each call reads the clock again instead of reusing a value."""
    instants = iter(
        [
            datetime(2026, 11, 5, 13, 0, 0, tzinfo=timezone.utc),
            datetime(2026, 11, 5, 13, 0, 1, tzinfo=timezone.utc),
        ]
    )

    class FakeDatetime:
        @staticmethod
        def now(tz):
            assert tz is timezone.utc
            return next(instants)

    monkeypatch.setattr(server_time_service, "datetime", FakeDatetime)

    first = get_current_utc_time()
    second = get_current_utc_time()

    assert first != second
    assert second > first


def test_get_current_utc_time_successive_calls_are_non_decreasing():
    """Error-guard case: real clock calls never move backwards."""
    first = get_current_utc_time()
    second = get_current_utc_time()

    assert second >= first
