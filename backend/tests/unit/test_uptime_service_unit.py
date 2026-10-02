"""Unit tests for the uptime service (TEST-07)."""

from datetime import UTC, datetime, timedelta, timezone

import pytest

from app.services.uptime_service import (
    ProcessStart,
    capture_process_start,
    compute_uptime_seconds,
)

START = ProcessStart(
    started_at=datetime(2026, 10, 2, 10, 0, 0, tzinfo=UTC), started_monotonic=100.0
)


def test_compute_uptime_seconds_returns_elapsed_monotonic_delta():
    assert compute_uptime_seconds(START, now_monotonic=112.5) == 12.5


def test_compute_uptime_seconds_increases_by_one_a_second_later():
    first = compute_uptime_seconds(START, now_monotonic=110.0)
    second = compute_uptime_seconds(START, now_monotonic=111.0)

    assert second - first == 1.0


def test_compute_uptime_seconds_is_zero_at_the_start_instant():
    assert compute_uptime_seconds(START, now_monotonic=100.0) == 0.0


def test_compute_uptime_seconds_clamps_an_earlier_reading_to_zero():
    assert compute_uptime_seconds(START, now_monotonic=99.0) == 0.0


def test_compute_uptime_seconds_defaults_to_the_real_clock():
    assert compute_uptime_seconds(capture_process_start()) >= 0.0


def test_capture_process_start_returns_utc_and_monotonic_reading():
    wall = datetime(2026, 10, 2, 10, 0, tzinfo=UTC)

    start = capture_process_start(lambda: wall, lambda: 42.0)

    assert start.started_at == wall
    assert start.started_at.utcoffset() == timedelta(0)
    assert start.started_monotonic == 42.0


def test_capture_process_start_converts_other_offsets_to_utc():
    wall = datetime(2026, 10, 2, 12, 0, tzinfo=timezone(timedelta(hours=2)))

    start = capture_process_start(lambda: wall, lambda: 1.0)

    assert start.started_at == datetime(2026, 10, 2, 10, 0, tzinfo=UTC)
    assert start.started_at.utcoffset() == timedelta(0)


def test_capture_process_start_rejects_a_naive_wall_clock():
    with pytest.raises(ValueError):
        capture_process_start(lambda: datetime(2026, 10, 2, 10, 0), lambda: 1.0)
