"""Unit tests for the uptime service (TEST-07); clocks are injected, no I/O."""

from datetime import datetime, timedelta, timezone

from app.services import uptime_service
from app.services.uptime_service import (
    ProcessStart,
    capture_process_start,
    uptime_seconds,
)

STARTED_AT = datetime(2026, 11, 10, 10, 0, 0, tzinfo=timezone.utc)


def test_uptime_seconds_returns_difference_for_later_reading():
    """Happy path: elapsed time is the monotonic difference."""
    start = ProcessStart(started_at=STARTED_AT, monotonic_start=100.0)

    assert uptime_seconds(start, now_monotonic=142.5) == 42.5


def test_uptime_seconds_returns_zero_for_equal_reading():
    """Edge case: no time elapsed yields exactly zero."""
    start = ProcessStart(started_at=STARTED_AT, monotonic_start=100.0)

    assert uptime_seconds(start, now_monotonic=100.0) == 0.0


def test_uptime_seconds_clamps_to_zero_for_earlier_reading():
    """Error case: a reading before the start never produces a negative value."""
    start = ProcessStart(started_at=STARTED_AT, monotonic_start=100.0)

    assert uptime_seconds(start, now_monotonic=99.0) == 0.0


def test_uptime_seconds_defaults_to_current_monotonic_clock(monkeypatch):
    """Default: with no reading passed, time.monotonic() is consulted."""
    monkeypatch.setattr(uptime_service.time, "monotonic", lambda: 250.0)
    start = ProcessStart(started_at=STARTED_AT, monotonic_start=200.0)

    assert uptime_seconds(start) == 50.0


def test_capture_process_start_returns_utc_aware_datetime_and_monotonic_reading(
    monkeypatch,
):
    """Happy path: both clocks are read once and the wall clock is UTC-aware."""
    monkeypatch.setattr(uptime_service.time, "monotonic", lambda: 123.0)

    start = capture_process_start()

    assert start.monotonic_start == 123.0
    assert start.started_at.utcoffset() == timedelta(0)
