"""Unit tests for the uptime service (TEST-07), with fake clocks and no sleeping."""

from datetime import datetime, timedelta, timezone

import pytest

from app.services.uptime_service import StartMark, capture_start, elapsed_seconds

UTC_MOMENT = datetime(2026, 10, 19, 9, 15, 3, tzinfo=timezone.utc)


class FakeClock:
    """A monotonic clock the test advances by hand."""

    def __init__(self, now: float) -> None:
        self.now = now

    def __call__(self) -> float:
        return self.now


def test_capture_start_with_aware_utc_clock_returns_both_readings():
    mark = capture_start(lambda: UTC_MOMENT, FakeClock(100.0))

    assert mark == StartMark(started_at=UTC_MOMENT, monotonic_start=100.0)


def test_capture_start_with_offset_datetime_normalises_to_utc():
    plus_two = timezone(timedelta(hours=2))
    local_moment = datetime(2026, 10, 19, 11, 15, 3, tzinfo=plus_two)

    mark = capture_start(lambda: local_moment, FakeClock(0.0))

    assert mark.started_at == UTC_MOMENT
    assert mark.started_at.utcoffset() == timedelta(0)


def test_capture_start_with_naive_datetime_raises_value_error():
    with pytest.raises(ValueError):
        capture_start(lambda: datetime(2026, 10, 19, 9, 15, 3), FakeClock(0.0))


def test_elapsed_seconds_returns_difference_of_readings():
    mark = StartMark(started_at=UTC_MOMENT, monotonic_start=100.0)

    assert elapsed_seconds(mark, FakeClock(105.5)) == 5.5


def test_elapsed_seconds_at_the_mark_returns_zero():
    mark = StartMark(started_at=UTC_MOMENT, monotonic_start=100.0)

    assert elapsed_seconds(mark, FakeClock(100.0)) == 0.0


def test_elapsed_seconds_with_clock_before_mark_clamps_to_zero():
    mark = StartMark(started_at=UTC_MOMENT, monotonic_start=100.0)

    assert elapsed_seconds(mark, FakeClock(99.0)) == 0.0


def test_elapsed_seconds_grows_by_the_clock_advance_between_calls():
    mark = StartMark(started_at=UTC_MOMENT, monotonic_start=100.0)
    clock = FakeClock(110.0)

    first = elapsed_seconds(mark, clock)
    clock.now += 1.0
    second = elapsed_seconds(mark, clock)

    assert second == first + 1.0


def test_elapsed_seconds_leaves_started_at_unchanged():
    mark = StartMark(started_at=UTC_MOMENT, monotonic_start=100.0)
    clock = FakeClock(110.0)

    elapsed_seconds(mark, clock)
    clock.now += 5.0
    elapsed_seconds(mark, clock)

    assert mark.started_at == UTC_MOMENT
