"""Unit tests for the uptime service (TEST-07)."""

from datetime import datetime, timedelta, timezone

import pytest

from app.services.uptime_service import (
    ProcessStart,
    capture_process_start,
    get_uptime_seconds,
)

START = ProcessStart(
    started_at=datetime(2026, 11, 1, 4, 0, 0, tzinfo=timezone.utc),
    started_monotonic=100.0,
)


def test_capture_process_start_returns_utc_aware_datetime():
    start = capture_process_start()

    assert start.started_at.tzinfo is not None
    assert start.started_at.utcoffset() == timedelta(0)


def test_get_uptime_seconds_returns_elapsed_difference():
    assert get_uptime_seconds(START, now_monotonic=142.5) == pytest.approx(42.5)


def test_get_uptime_seconds_increases_for_a_later_reading():
    first = get_uptime_seconds(START, now_monotonic=101.0)
    second = get_uptime_seconds(START, now_monotonic=102.0)

    assert second > first
    assert second - first == pytest.approx(1.0)


def test_get_uptime_seconds_clamps_to_zero_when_reading_precedes_start():
    assert get_uptime_seconds(START, now_monotonic=50.0) == 0.0


def test_get_uptime_seconds_defaults_to_the_live_monotonic_clock():
    start = capture_process_start()

    assert get_uptime_seconds(start) >= 0.0
