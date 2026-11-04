"""Unit tests for the server-time service (BUG-01)."""

from datetime import datetime, timedelta, timezone

from app.services import server_time_service
from app.services.server_time_service import get_current_utc_time


def test_get_current_utc_time_returns_aware_utc_with_zero_offset():
    """Happy path: the value is timezone-aware and its offset is zero."""
    result = get_current_utc_time()

    assert result.tzinfo is not None
    assert result.utcoffset() == timedelta(0)


def test_get_current_utc_time_returns_fresh_value_per_call(monkeypatch):
    """Edge case: successive clock instants yield different results (no caching)."""
    instants = iter(
        [
            datetime(2026, 11, 4, 20, 0, 0, tzinfo=timezone.utc),
            datetime(2026, 11, 4, 20, 0, 1, tzinfo=timezone.utc),
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
    assert second - first == timedelta(seconds=1)


def test_get_current_utc_time_isoformat_ends_with_explicit_offset():
    """Error-shape case: the serialised value is never naive and never uses Z."""
    result = get_current_utc_time().isoformat()

    assert result.endswith("+00:00")
    assert datetime.fromisoformat(result).tzinfo is not None
