"""Unit tests for the server time service (backend/app/services/server_time_service.py)."""

from datetime import datetime, timedelta, timezone

from app.services import server_time_service


def test_get_server_time_returns_timezone_aware_utc_datetime():
    """Happy path: the instant is aware and carries a zero UTC offset."""
    result = server_time_service.get_server_time()

    assert result.tzinfo is not None
    assert result.utcoffset() == timedelta(0)


def test_get_server_time_reads_clock_on_every_call(monkeypatch):
    """Edge case: two calls with distinct clock readings return distinct values."""
    instants = iter(
        [
            datetime(2026, 11, 27, 17, 0, 0, tzinfo=timezone.utc),
            datetime(2026, 11, 27, 17, 0, 1, tzinfo=timezone.utc),
        ]
    )
    monkeypatch.setattr(server_time_service, "_utc_now", lambda: next(instants))

    first = server_time_service.get_server_time()
    second = server_time_service.get_server_time()

    assert first != second
    assert second - first == timedelta(seconds=1)


def test_get_server_time_declares_utc_timezone_constant():
    """Error-guard case: the advertised timezone label stays UTC."""
    assert server_time_service.SERVER_TIMEZONE == "UTC"
