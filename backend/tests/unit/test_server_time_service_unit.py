"""Unit tests for the server time service (FEAT-1, BUG-01)."""

from datetime import datetime, timedelta, timezone

from app.services import server_time_service
from app.services.server_time_service import get_server_time


def test_get_server_time_returns_aware_datetime_with_zero_utc_offset():
    """Happy path: an aware datetime whose offset is UTC."""
    result = get_server_time()

    assert result.tzinfo is not None
    assert result.utcoffset() == timedelta(0)


def test_get_server_time_returns_distinct_values_when_clock_advances(monkeypatch):
    """Edge case: the value is computed per call, not captured once."""
    ticks = iter(
        [
            datetime(2026, 11, 4, 19, 40, 0, tzinfo=timezone.utc),
            datetime(2026, 11, 4, 19, 40, 1, tzinfo=timezone.utc),
        ]
    )

    class FakeDatetime:
        @staticmethod
        def now(tz):
            return next(ticks)

    monkeypatch.setattr(server_time_service, "datetime", FakeDatetime)

    assert get_server_time() != get_server_time()


def test_get_server_time_never_returns_naive_datetime():
    """Robustness case: isoformat of the result always carries an explicit offset."""
    assert get_server_time().isoformat().endswith("+00:00")
