"""Unit tests for the uptime service (TEST-07), with injected fake clocks."""

from datetime import datetime, timedelta, timezone

from app.services.uptime_service import ProcessClock, start_clock, uptime_seconds

START_INSTANT = datetime(2026, 11, 17, 12, 0, 0, tzinfo=timezone.utc)


def test_start_clock_records_utc_start_and_monotonic_reading():
    """Happy path: the clock carries exactly the injected instants, in UTC."""
    clock = start_clock(now=lambda: START_INSTANT, monotonic=lambda: 100.0)

    assert clock.started_at == START_INSTANT
    assert clock.started_at.utcoffset() == timedelta(0)
    assert clock.started_monotonic == 100.0


def test_uptime_seconds_returns_elapsed_monotonic_time():
    """Happy path: elapsed time is the monotonic difference."""
    clock = ProcessClock(started_at=START_INSTANT, started_monotonic=100.0)

    assert uptime_seconds(clock, monotonic=lambda: 103.5) == 3.5


def test_uptime_seconds_increases_as_monotonic_clock_advances():
    """Two readings one second apart differ by one second."""
    clock = ProcessClock(started_at=START_INSTANT, started_monotonic=100.0)

    first = uptime_seconds(clock, monotonic=lambda: 110.0)
    second = uptime_seconds(clock, monotonic=lambda: 111.0)

    assert second - first == 1.0


def test_uptime_seconds_returns_zero_at_startup_instant():
    """Edge case: a reading at the start instant is exactly zero."""
    clock = ProcessClock(started_at=START_INSTANT, started_monotonic=100.0)

    assert uptime_seconds(clock, monotonic=lambda: 100.0) == 0.0


def test_uptime_seconds_never_negative_when_clock_reads_earlier():
    """Guard case: a reading before the start is clamped to zero."""
    clock = ProcessClock(started_at=START_INSTANT, started_monotonic=100.0)

    assert uptime_seconds(clock, monotonic=lambda: 90.0) == 0.0
