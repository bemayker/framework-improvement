"""Unit tests for the server time service (backend/app/services/server_time_service.py)."""

from datetime import datetime, timedelta, timezone

from app.services import server_time_service


def test_get_server_time_returns_timezone_aware_utc():
    """Happy path: the result carries tzinfo with a zero UTC offset."""
    result = server_time_service.get_server_time()

    assert result.tzinfo is not None
    assert result.utcoffset() == timedelta(0)


def test_get_server_time_computes_a_new_value_per_call(monkeypatch):
    """Edge case: two calls return two distinct clock readings, in order.

    The clock is patched to hand out two instants, so a memoised value would
    return the first one twice and fail.
    """
    first = datetime(2026, 11, 23, 15, 0, 0, tzinfo=timezone.utc)
    second = datetime(2026, 11, 23, 15, 0, 1, tzinfo=timezone.utc)
    readings = iter([first, second])

    class FakeDatetime:
        """Stand-in for the datetime class exposing only a patched now()."""

        @staticmethod
        def now(tz):
            """Return the next prepared reading."""
            return next(readings)

    monkeypatch.setattr(server_time_service, "datetime", FakeDatetime)

    assert server_time_service.get_server_time() == first
    assert server_time_service.get_server_time() == second


def test_get_server_time_never_returns_naive_datetime():
    """Error case: a naive result would serialise without an offset."""
    result = server_time_service.get_server_time()

    assert result.utcoffset() is not None
