"""Unit tests for the uptime service (TEST-07), with fixed fake clocks."""

from datetime import datetime, timedelta, timezone

from app.services.uptime_service import StartMark, capture_start, get_uptime

STARTED_AT = datetime(2026, 11, 6, 9, 0, tzinfo=timezone.utc)


def test_capture_start_records_utc_wall_clock_and_monotonic_reading():
    mark = capture_start(wall_clock=lambda: STARTED_AT, monotonic_clock=lambda: 100.0)

    assert mark == StartMark(started_at=STARTED_AT, monotonic_start=100.0)


def test_capture_start_default_wall_clock_is_timezone_aware_utc():
    mark = capture_start()

    assert mark.started_at.utcoffset() == timedelta(0)


def test_get_uptime_at_capture_instant_returns_zero():
    mark = capture_start(wall_clock=lambda: STARTED_AT, monotonic_clock=lambda: 100.0)

    report = get_uptime(mark, monotonic_clock=lambda: 100.0)

    assert report.uptime_seconds == 0.0


def test_get_uptime_one_second_later_increases_by_one_second():
    mark = capture_start(wall_clock=lambda: STARTED_AT, monotonic_clock=lambda: 100.0)

    first = get_uptime(mark, monotonic_clock=lambda: 101.0)
    later = get_uptime(mark, monotonic_clock=lambda: 102.5)

    assert first.uptime_seconds == 1.0
    assert later.uptime_seconds == 2.5


def test_get_uptime_returns_the_captured_started_at_unchanged():
    mark = capture_start(wall_clock=lambda: STARTED_AT, monotonic_clock=lambda: 100.0)

    first = get_uptime(mark, monotonic_clock=lambda: 101.0)
    second = get_uptime(mark, monotonic_clock=lambda: 105.0)

    assert first.started_at is STARTED_AT
    assert second.started_at is STARTED_AT
