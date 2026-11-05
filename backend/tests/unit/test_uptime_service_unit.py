"""Unit tests for the uptime service (backend/app/services/uptime_service.py)."""

from datetime import UTC, datetime

from app.services import uptime_service
from app.services.uptime_service import ProcessStart, capture_process_start, elapsed_seconds

FIXED_INSTANT = datetime(2026, 11, 5, 9, 30, 2, tzinfo=UTC)


class _FrozenDatetime:
    """Stand-in for the `datetime` class whose now() returns a fixed instant."""

    @staticmethod
    def now(tz=None):
        return FIXED_INSTANT


def test_capture_process_start_returns_patched_clock_readings(monkeypatch):
    monkeypatch.setattr(uptime_service, "datetime", _FrozenDatetime)
    monkeypatch.setattr(uptime_service.time, "monotonic", lambda: 100.0)

    process_start = capture_process_start()

    assert process_start.started_at == FIXED_INSTANT
    assert process_start.monotonic_start == 100.0


def test_elapsed_seconds_returns_difference_of_monotonic_readings(monkeypatch):
    monkeypatch.setattr(uptime_service.time, "monotonic", lambda: 142.5)

    result = elapsed_seconds(ProcessStart(started_at=FIXED_INSTANT, monotonic_start=100.0))

    assert result == 42.5


def test_elapsed_seconds_is_zero_when_no_time_has_passed(monkeypatch):
    monkeypatch.setattr(uptime_service.time, "monotonic", lambda: 100.0)

    result = elapsed_seconds(ProcessStart(started_at=FIXED_INSTANT, monotonic_start=100.0))

    assert result == 0.0
