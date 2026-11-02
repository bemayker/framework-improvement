"""Unit tests for the server time service (BUG-01)."""

from datetime import datetime, timedelta, timezone

from app.services import server_time_service
from app.services.server_time_service import get_server_now


def test_get_server_now_returns_aware_datetime():
    """Happy path and naive-value guard: the result carries tzinfo."""
    now = get_server_now()

    assert isinstance(now, datetime)
    assert now.tzinfo is not None


def test_get_server_now_has_zero_utc_offset():
    """Edge case: the offset is exactly UTC."""
    assert get_server_now().utcoffset() == timedelta(0)


def test_get_server_now_is_evaluated_on_each_call(monkeypatch):
    """Edge case: an advancing clock yields different values, nothing is cached."""
    instants = iter(
        [
            datetime(2026, 11, 2, 22, 40, 1, tzinfo=timezone.utc),
            datetime(2026, 11, 2, 22, 40, 2, tzinfo=timezone.utc),
        ]
    )

    class FakeDatetime:
        @staticmethod
        def now(tz):
            assert tz is timezone.utc
            return next(instants)

    monkeypatch.setattr(server_time_service, "datetime", FakeDatetime)

    first = get_server_now()
    second = get_server_now()

    assert first != second
    assert second - first == timedelta(seconds=1)
