"""Unit tests for the server time service (backend/app/services/server_time_service.py)."""

from datetime import datetime, timedelta, timezone

from app.services import server_time_service


def test_get_server_now_returns_aware_utc_iso_string_with_explicit_offset():
    """Happy path: parses as ISO 8601, is aware, zero offset, spelled +00:00."""
    value = server_time_service.get_server_now()

    parsed = datetime.fromisoformat(value)
    assert parsed.tzinfo is not None
    assert parsed.utcoffset() == timedelta(0)
    assert value.endswith("+00:00")


def test_get_server_now_reads_the_clock_on_every_call(monkeypatch):
    """Edge case: two calls yield two different values (no import-time caching)."""
    instants = iter(
        [
            datetime(2026, 11, 2, 21, 30, 5, tzinfo=timezone.utc),
            datetime(2026, 11, 2, 21, 30, 6, tzinfo=timezone.utc),
        ]
    )

    class FakeDatetime:
        @staticmethod
        def now(tz=None):
            return next(instants)

    monkeypatch.setattr(server_time_service, "datetime", FakeDatetime)

    first = server_time_service.get_server_now()
    second = server_time_service.get_server_now()

    assert first == "2026-11-02T21:30:05+00:00"
    assert second == "2026-11-02T21:30:06+00:00"
    assert first != second


def test_get_server_now_asks_the_clock_for_utc_never_naive_time(monkeypatch):
    """Error case guard: a naive now() would silently report local time."""
    received: list[object] = []

    class FakeDatetime:
        @staticmethod
        def now(tz=None):
            received.append(tz)
            return datetime(2026, 11, 2, tzinfo=timezone.utc)

    monkeypatch.setattr(server_time_service, "datetime", FakeDatetime)

    server_time_service.get_server_now()

    assert received == [timezone.utc]
