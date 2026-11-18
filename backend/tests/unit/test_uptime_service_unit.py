"""Unit tests for the uptime service (TEST-07)."""

from datetime import datetime, timedelta, timezone

from app.services.uptime_service import (
    ProcessStart,
    capture_process_start,
    uptime_seconds,
)


def _start(monotonic_start: float) -> ProcessStart:
    return ProcessStart(
        started_at=datetime(2026, 1, 1, tzinfo=timezone.utc),
        monotonic_start=monotonic_start,
    )


def test_capture_process_start_records_utc_aware_started_at():
    """Criterion 3: the start marker is a UTC-aware wall-clock reading."""
    fixed = datetime(2026, 11, 18, 22, 5, 34, tzinfo=timezone.utc)

    marker = capture_process_start(wall_clock=lambda: fixed, monotonic_clock=lambda: 7.5)

    assert marker.started_at == fixed
    assert marker.started_at.utcoffset() == timedelta(0)
    assert marker.monotonic_start == 7.5


def test_capture_process_start_defaults_to_aware_utc_now():
    """Edge case: with the real clocks the marker is still timezone-aware."""
    marker = capture_process_start()

    assert marker.started_at.utcoffset() == timedelta(0)


def test_uptime_seconds_returns_elapsed_monotonic_time():
    """Criterion 2: uptime is the monotonic difference, and grows with the clock."""
    marker = _start(100.0)

    first = uptime_seconds(marker, monotonic_clock=lambda: 101.5)
    second = uptime_seconds(marker, monotonic_clock=lambda: 102.5)

    assert first == 1.5
    assert second == 2.5
    assert second > first


def test_uptime_seconds_clamps_to_zero_when_clock_reads_before_start():
    """Criterion 2 edge case: a clock reading before start never goes negative."""
    marker = _start(100.0)

    assert uptime_seconds(marker, monotonic_clock=lambda: 99.0) == 0.0
