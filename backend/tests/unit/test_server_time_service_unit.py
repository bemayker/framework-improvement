"""Unit tests for the server time service (backend/app/services/server_time_service.py)."""

from datetime import datetime, timedelta, timezone

from app.services import server_time_service


class _FixedClock:
    """Stand-in for the `datetime` class returning queued instants from now()."""

    def __init__(self, instants: list[datetime]):
        self._instants = list(instants)

    def now(self, tz=None) -> datetime:
        return self._instants.pop(0)


def test_current_utc_iso_is_utc_aware_with_explicit_offset():
    """Happy path: parses as an aware UTC datetime and spells the offset +00:00."""
    value = server_time_service.current_utc_iso()

    parsed = datetime.fromisoformat(value)
    assert parsed.utcoffset() == timedelta(0)
    assert value.endswith("+00:00")


def test_current_utc_iso_differs_between_calls(monkeypatch):
    """Edge case: evaluated per call, so distinct instants give distinct values."""
    first = datetime(2026, 11, 10, 13, 0, 0, tzinfo=timezone.utc)
    second = datetime(2026, 11, 10, 13, 0, 1, tzinfo=timezone.utc)
    monkeypatch.setattr(server_time_service, "datetime", _FixedClock([first, second]))

    assert server_time_service.current_utc_iso() != server_time_service.current_utc_iso()


def test_current_utc_iso_returns_exactly_the_clock_isoformat(monkeypatch):
    """Robustness case: no naive value and no caching inside the service."""
    instant = datetime(2026, 11, 10, 13, 14, 33, 512301, tzinfo=timezone.utc)
    monkeypatch.setattr(server_time_service, "datetime", _FixedClock([instant]))

    assert server_time_service.current_utc_iso() == "2026-11-10T13:14:33.512301+00:00"
    assert server_time_service.SERVER_TIMEZONE == "UTC"
