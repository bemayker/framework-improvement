"""Unit tests for the uptime service (TEST-07)."""

from datetime import datetime, timedelta, timezone

from app.services import uptime_service
from app.services.uptime_service import (
    ProcessStart,
    capture_process_start,
    get_uptime_seconds,
)


def _start_with_origin(origin: float) -> ProcessStart:
    return ProcessStart(
        started_at=datetime(2026, 10, 17, tzinfo=timezone.utc),
        monotonic_origin=origin,
    )


def test_capture_process_start_returns_utc_aware_start():
    """Happy path: the start is timezone-aware UTC with a float monotonic origin."""
    process_start = capture_process_start()

    assert process_start.started_at.utcoffset() == timedelta(0)
    assert process_start.started_at.tzinfo == timezone.utc
    assert isinstance(process_start.monotonic_origin, float)


def test_get_uptime_seconds_returns_elapsed_monotonic_time():
    """Happy path: elapsed time is now minus origin."""
    assert get_uptime_seconds(_start_with_origin(100.0), now_monotonic=142.5) == 42.5


def test_get_uptime_seconds_at_origin_returns_zero():
    """Edge case: now equal to the origin gives exactly zero."""
    assert get_uptime_seconds(_start_with_origin(100.0), now_monotonic=100.0) == 0.0


def test_get_uptime_seconds_with_clock_before_origin_returns_zero():
    """Error case: a clock earlier than the origin is clamped, never negative."""
    assert get_uptime_seconds(_start_with_origin(100.0), now_monotonic=99.0) == 0.0


def test_get_uptime_seconds_defaults_to_current_monotonic_clock(monkeypatch):
    """The default clock is time.monotonic, read at call time."""
    monkeypatch.setattr(uptime_service.time, "monotonic", lambda: 130.0)

    assert get_uptime_seconds(_start_with_origin(100.0)) == 30.0
