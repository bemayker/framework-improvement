"""Unit tests for the server-time service (BUG-01)."""

from datetime import datetime, timedelta, timezone

from app.services import server_time_service
from app.services.server_time_service import current_utc_time


def test_current_utc_time_returns_aware_utc_datetime():
    """Happy path: an aware datetime with a zero UTC offset."""
    result = current_utc_time()

    assert isinstance(result, datetime)
    assert result.utcoffset() == timedelta(0)


def test_current_utc_time_is_computed_per_call(monkeypatch):
    """Edge case: two calls return the two distinct values the clock produced."""
    first = datetime(2026, 11, 13, 10, 0, 0, tzinfo=timezone.utc)
    second = datetime(2026, 11, 13, 10, 0, 1, tzinfo=timezone.utc)
    ticks = iter([first, second])

    class FakeDatetime:
        @staticmethod
        def now(tz):
            return next(ticks)

    monkeypatch.setattr(server_time_service, "datetime", FakeDatetime)

    assert current_utc_time() == first
    assert current_utc_time() == second


def test_current_utc_time_is_never_naive():
    """Error case: the result never lacks tzinfo."""
    assert current_utc_time().tzinfo is not None
