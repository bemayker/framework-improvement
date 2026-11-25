"""Unit tests for the server time service (FEAT-1, BUG-01)."""

from datetime import datetime, timedelta, timezone

from app.services import server_time_service
from app.services.server_time_service import SERVER_TIMEZONE, get_server_time


def test_get_server_time_returns_iso_string_with_utc_offset():
    """Happy path: an aware ISO 8601 string with a zero offset."""
    value = get_server_time()

    parsed = datetime.fromisoformat(value)
    assert parsed.tzinfo is not None
    assert parsed.utcoffset() == timedelta(0)
    assert value.endswith("+00:00")


def test_get_server_time_returns_fresh_value_per_call(monkeypatch):
    """Edge case: each call reads the clock again, so two calls differ.

    The clock is patched to two fixed instants, so the test cannot hinge on
    the real clock's resolution.
    """
    instants = iter(
        [
            datetime(2026, 11, 25, 13, 0, 0, tzinfo=timezone.utc),
            datetime(2026, 11, 25, 13, 0, 1, tzinfo=timezone.utc),
        ]
    )

    class FakeDatetime:
        """Stand-in for the datetime class that serves the next fixed instant."""

        @staticmethod
        def now(tz=None):
            """Return the next fixed instant."""
            return next(instants)

    monkeypatch.setattr(server_time_service, "datetime", FakeDatetime)

    first = get_server_time()
    second = get_server_time()

    assert first == "2026-11-25T13:00:00+00:00"
    assert second == "2026-11-25T13:00:01+00:00"


def test_server_timezone_constant_is_utc():
    """The label the endpoint reports matches the zone the service computes in."""
    assert SERVER_TIMEZONE == "UTC"
