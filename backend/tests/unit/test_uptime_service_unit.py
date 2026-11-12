"""Unit tests for the uptime service (TEST-07)."""

from datetime import datetime, timedelta, timezone

from app.services.uptime_service import (
    StartupStamp,
    capture_startup,
    compute_uptime_seconds,
)


def _stamp(started_monotonic: float) -> StartupStamp:
    return StartupStamp(
        started_at=datetime(2026, 1, 1, tzinfo=timezone.utc),
        started_monotonic=started_monotonic,
    )


def test_capture_startup_returns_utc_aware_started_at():
    stamp = capture_startup()

    assert stamp.started_at.tzinfo is not None
    assert stamp.started_at.utcoffset() == timedelta(0)


def test_compute_uptime_seconds_returns_elapsed_monotonic_time():
    assert compute_uptime_seconds(_stamp(100.0), now_monotonic=142.5) == 42.5


def test_compute_uptime_seconds_grows_with_the_clock():
    stamp = _stamp(10.0)

    first = compute_uptime_seconds(stamp, now_monotonic=11.0)
    second = compute_uptime_seconds(stamp, now_monotonic=12.0)

    assert second > first


def test_compute_uptime_seconds_clamps_negative_difference_to_zero():
    assert compute_uptime_seconds(_stamp(100.0), now_monotonic=90.0) == 0.0


def test_compute_uptime_seconds_defaults_to_the_real_clock():
    assert compute_uptime_seconds(capture_startup()) >= 0.0
