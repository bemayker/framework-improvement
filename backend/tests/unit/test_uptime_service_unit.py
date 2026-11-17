"""Unit tests for the uptime service (TEST-07)."""

from datetime import datetime, timedelta, timezone

from app.services.uptime_service import (
    ProcessStart,
    capture_process_start,
    uptime_seconds,
)


def test_capture_process_start_returns_utc_aware_instant():
    """Criterion 3: the captured start is a UTC-aware instant near now."""
    before = datetime.now(timezone.utc)

    start = capture_process_start()

    after = datetime.now(timezone.utc)
    assert start.started_at.utcoffset() == timedelta(0)
    assert before <= start.started_at <= after


def test_uptime_seconds_returns_elapsed_monotonic_seconds():
    """Criterion 2: uptime is the monotonic difference."""
    start = ProcessStart(started_at=datetime.now(timezone.utc), monotonic=100.0)

    assert uptime_seconds(start, 112.5) == 12.5


def test_uptime_seconds_clamps_to_zero_when_now_precedes_start():
    """Criterion 2 edge case: a reading before start never goes negative."""
    start = ProcessStart(started_at=datetime.now(timezone.utc), monotonic=100.0)

    assert uptime_seconds(start, 99.0) == 0.0
