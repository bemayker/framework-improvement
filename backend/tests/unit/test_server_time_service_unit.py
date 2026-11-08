"""Unit tests for the server time service (BUG-01)."""

from datetime import UTC, datetime, timedelta

from app.services import server_time_service
from app.services.server_time_service import get_current_utc_time


def test_get_current_utc_time_returns_aware_datetime_with_zero_offset():
    """Happy path: the value is timezone-aware and in UTC."""
    result = get_current_utc_time()

    assert result.tzinfo is not None
    assert result.utcoffset() == timedelta(0)


def test_get_current_utc_time_is_computed_on_every_call(monkeypatch):
    """Edge case: two calls with a moving clock return two different values."""
    instants = iter(
        [
            datetime(2026, 11, 8, 2, 30, 15, tzinfo=UTC),
            datetime(2026, 11, 8, 2, 30, 16, tzinfo=UTC),
        ]
    )

    class FakeDatetime:
        @staticmethod
        def now(tz):
            assert tz is UTC
            return next(instants)

    monkeypatch.setattr(server_time_service, "datetime", FakeDatetime)

    first = get_current_utc_time()
    second = get_current_utc_time()

    assert first != second
    assert second - first == timedelta(seconds=1)


def test_get_current_utc_time_never_returns_naive_datetime():
    """Error case guard: a naive value would serialise without an offset."""
    assert get_current_utc_time().tzinfo is not None
