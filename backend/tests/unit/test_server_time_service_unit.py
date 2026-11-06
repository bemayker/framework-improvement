"""Unit tests for the server time service (BUG-01)."""

from datetime import datetime, timedelta, timezone

from app.services import server_time_service
from app.services.server_time_service import get_current_utc_time


def test_get_current_utc_time_returns_aware_datetime():
    """Happy path: the value carries timezone information."""
    value = get_current_utc_time()

    assert isinstance(value, datetime)
    assert value.tzinfo is not None


def test_get_current_utc_time_has_zero_utc_offset():
    """Edge case: the offset is exactly UTC."""
    assert get_current_utc_time().utcoffset() == timedelta(0)


def test_get_current_utc_time_is_computed_fresh_per_call(monkeypatch):
    """Error/regression case: no module-level caching, each call reads the clock."""
    first = datetime(2026, 11, 6, 11, 0, 0, tzinfo=timezone.utc)
    second = first + timedelta(seconds=1)
    values = iter([first, second])

    class FakeDatetime:
        @staticmethod
        def now(tz):
            return next(values)

    monkeypatch.setattr(server_time_service, "datetime", FakeDatetime)

    assert get_current_utc_time() == first
    assert get_current_utc_time() == second
