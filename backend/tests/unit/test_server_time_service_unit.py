"""Unit tests for the server time service (FEAT-1, BUG-01)."""

from datetime import datetime, timedelta, timezone

from app.services import server_time_service
from app.services.server_time_service import (
    UTC_TIMEZONE_NAME,
    get_current_utc_time,
)


def test_get_current_utc_time_returns_aware_utc_datetime():
    """Happy path: the value is timezone-aware with a zero UTC offset."""
    now = get_current_utc_time()

    assert now.tzinfo is not None
    assert now.utcoffset() == timedelta(0)


def test_get_current_utc_time_returns_new_value_per_call(monkeypatch):
    """Edge case: the clock is read per call, not captured once at import."""
    ticks = iter(
        [
            datetime(2026, 11, 17, 19, 0, 0, tzinfo=timezone.utc),
            datetime(2026, 11, 17, 19, 0, 1, tzinfo=timezone.utc),
        ]
    )

    class FakeDatetime:
        """Stand-in for the module's `datetime` returning scripted instants."""

        @staticmethod
        def now(tz):
            """Return the next scripted instant."""
            assert tz is timezone.utc
            return next(ticks)

    monkeypatch.setattr(server_time_service, "datetime", FakeDatetime)

    assert get_current_utc_time() != get_current_utc_time()


def test_utc_timezone_name_is_utc():
    """The advertised timezone label is the literal UTC."""
    assert UTC_TIMEZONE_NAME == "UTC"
