"""Unit tests for the server time service (BUG-01)."""

from datetime import datetime, timedelta, timezone

from app.services import server_time_service
from app.services.server_time_service import get_current_utc_time


def test_get_current_utc_time_returns_aware_datetime():
    """Happy path: the result is timezone-aware."""
    result = get_current_utc_time()

    assert isinstance(result, datetime)
    assert result.tzinfo is not None


def test_get_current_utc_time_has_zero_utc_offset():
    """Edge case: the offset is exactly UTC."""
    assert get_current_utc_time().utcoffset() == timedelta(0)


def test_get_current_utc_time_reads_clock_on_every_call(monkeypatch):
    """Edge case: freshness, each call reads the clock anew."""
    first = datetime(2026, 11, 5, 18, 0, 0, tzinfo=timezone.utc)
    second = datetime(2026, 11, 5, 18, 0, 1, tzinfo=timezone.utc)
    instants = iter([first, second])

    class FakeDatetime:
        @staticmethod
        def now(tz):
            assert tz is timezone.utc
            return next(instants)

    monkeypatch.setattr(server_time_service, "datetime", FakeDatetime)

    assert get_current_utc_time() == first
    assert get_current_utc_time() == second
