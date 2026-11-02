"""Unit tests for the uptime service (TEST-07). Clocks are injected, no app."""

from datetime import timedelta

from app.services import uptime_service
from app.services.uptime_service import (
    ProcessStart,
    capture_process_start,
    get_uptime_seconds,
)


def _start(monotonic: float) -> ProcessStart:
    return ProcessStart(started_at=capture_process_start().started_at, started_monotonic=monotonic)


def test_get_uptime_seconds_returns_elapsed_since_start():
    assert get_uptime_seconds(_start(100.0), now_monotonic=142.5) == 42.5


def test_get_uptime_seconds_returns_zero_when_no_time_has_passed():
    assert get_uptime_seconds(_start(100.0), now_monotonic=100.0) == 0.0


def test_get_uptime_seconds_clamps_to_zero_when_now_precedes_start():
    assert get_uptime_seconds(_start(100.0), now_monotonic=90.0) == 0.0


def test_get_uptime_seconds_uses_the_monotonic_clock_by_default(monkeypatch):
    monkeypatch.setattr(uptime_service.time, "monotonic", lambda: 160.0)

    assert get_uptime_seconds(_start(100.0)) == 60.0


def test_capture_process_start_returns_an_aware_utc_datetime():
    process_start = capture_process_start()

    assert process_start.started_at.utcoffset() == timedelta(0)
