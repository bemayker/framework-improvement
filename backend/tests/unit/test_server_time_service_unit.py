"""Unit tests for the server time service (FEAT-1, BUG-01)."""

from datetime import datetime, timedelta, timezone

from app.services import server_time_service


def test_get_current_utc_time_returns_aware_utc_datetime():
    """Happy path: the result is timezone-aware with a zero UTC offset."""
    result = server_time_service.get_current_utc_time()

    assert result.utcoffset() == timedelta(0)


def test_get_current_utc_time_is_computed_per_call(monkeypatch):
    """Edge case: two calls return two different instants, so nothing is cached."""
    first = datetime(2026, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
    second = datetime(2026, 1, 1, 0, 0, 1, tzinfo=timezone.utc)
    instants = iter([first, second])

    class FakeDatetime:
        @staticmethod
        def now(tz):
            return next(instants)

    monkeypatch.setattr(server_time_service, "datetime", FakeDatetime)

    assert server_time_service.get_current_utc_time() == first
    assert server_time_service.get_current_utc_time() == second


def test_get_current_utc_time_is_never_naive():
    """Robustness case: the result always carries tzinfo."""
    assert server_time_service.get_current_utc_time().tzinfo is not None
