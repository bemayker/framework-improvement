"""Unit tests for the server time service (BUG-01)."""

from datetime import datetime, timedelta, timezone

from app.services import server_time_service
from app.services.server_time_service import get_current_utc_time


def test_get_current_utc_time_returns_aware_datetime():
    result = get_current_utc_time()

    assert isinstance(result, datetime)
    assert result.tzinfo is not None


def test_get_current_utc_time_has_zero_utc_offset():
    assert get_current_utc_time().utcoffset() == timedelta(0)


def test_get_current_utc_time_is_computed_per_call(monkeypatch):
    first = datetime(2026, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
    second = datetime(2026, 1, 1, 12, 0, 1, tzinfo=timezone.utc)
    values = iter([first, second])

    class FakeDatetime:
        @staticmethod
        def now(tz):
            assert tz is timezone.utc
            return next(values)

    monkeypatch.setattr(server_time_service, "datetime", FakeDatetime)

    assert get_current_utc_time() == first
    assert get_current_utc_time() == second
