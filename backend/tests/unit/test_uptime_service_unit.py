"""Unit tests for the uptime service (TEST-07), clocks monkeypatched."""

from datetime import datetime, timedelta, timezone

from app.services import uptime_service
from app.services.uptime_service import (
    ProcessStart,
    capture_process_start,
    get_uptime_seconds,
)

STARTED_AT = datetime(2026, 10, 29, 16, 0, 0, tzinfo=timezone.utc)


def _start_at(monotonic: float) -> ProcessStart:
    return ProcessStart(started_at=STARTED_AT, started_monotonic=monotonic)


def test_capture_process_start_returns_utc_aware_datetime():
    """Happy path: the captured wall-clock start carries a UTC offset."""
    process_start = capture_process_start()

    assert process_start.started_at.tzinfo is not None
    assert process_start.started_at.utcoffset() == timedelta(0)


def test_get_uptime_seconds_returns_elapsed_monotonic_seconds(monkeypatch):
    """Happy path: uptime is the monotonic difference."""
    monkeypatch.setattr(uptime_service.time, "monotonic", lambda: 105.5)

    assert get_uptime_seconds(_start_at(100.0)) == 5.5


def test_get_uptime_seconds_returns_zero_at_the_start_instant(monkeypatch):
    """Edge case: the instant of startup reports exactly zero."""
    monkeypatch.setattr(uptime_service.time, "monotonic", lambda: 100.0)

    assert get_uptime_seconds(_start_at(100.0)) == 0.0


def test_get_uptime_seconds_never_negative_when_clock_reads_earlier(monkeypatch):
    """Error case: a clock reading below the start is clamped to zero."""
    monkeypatch.setattr(uptime_service.time, "monotonic", lambda: 99.0)

    assert get_uptime_seconds(_start_at(100.0)) == 0.0


def test_get_uptime_seconds_increases_as_the_clock_advances(monkeypatch):
    """Two reads one second apart: the second is larger."""
    process_start = _start_at(100.0)

    monkeypatch.setattr(uptime_service.time, "monotonic", lambda: 101.0)
    first = get_uptime_seconds(process_start)
    monkeypatch.setattr(uptime_service.time, "monotonic", lambda: 102.0)
    second = get_uptime_seconds(process_start)

    assert second > first
