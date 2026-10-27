"""Unit tests for the uptime service (TEST-07), clocks injected or patched."""

from datetime import UTC, datetime

from app.services import uptime_service
from app.services.uptime_service import (
    ProcessStart,
    capture_process_start,
    compute_uptime_seconds,
)


def test_capture_process_start_returns_utc_aware_time_and_monotonic_reading(monkeypatch):
    """Happy path: both clocks are read once, started_at is timezone-aware UTC."""
    monkeypatch.setattr(uptime_service.time, "monotonic", lambda: 123.5)

    process_start = capture_process_start()

    assert process_start.started_monotonic == 123.5
    assert process_start.started_at.tzinfo is not None
    assert process_start.started_at.utcoffset().total_seconds() == 0


def test_capture_process_start_started_at_is_close_to_now():
    """Edge case: started_at is the wall-clock moment of the call."""
    before = datetime.now(UTC)
    process_start = capture_process_start()
    after = datetime.now(UTC)

    assert before <= process_start.started_at <= after


def test_compute_uptime_seconds_returns_elapsed_time():
    """Happy path: start 100.0, now 142.5 gives 42.5."""
    process_start = ProcessStart(started_at=datetime.now(UTC), started_monotonic=100.0)

    assert compute_uptime_seconds(process_start, now_monotonic=142.5) == 42.5


def test_compute_uptime_seconds_is_zero_when_now_equals_start():
    """Edge case: no time elapsed gives exactly 0.0."""
    process_start = ProcessStart(started_at=datetime.now(UTC), started_monotonic=100.0)

    assert compute_uptime_seconds(process_start, now_monotonic=100.0) == 0.0


def test_compute_uptime_seconds_never_negative_when_now_before_start():
    """Error case: a clock reading earlier than start is clamped to 0.0."""
    process_start = ProcessStart(started_at=datetime.now(UTC), started_monotonic=100.0)

    assert compute_uptime_seconds(process_start, now_monotonic=90.0) == 0.0


def test_compute_uptime_seconds_defaults_to_monotonic_clock(monkeypatch):
    """Default path: with no injected clock it reads time.monotonic()."""
    monkeypatch.setattr(uptime_service.time, "monotonic", lambda: 160.0)
    process_start = ProcessStart(started_at=datetime.now(UTC), started_monotonic=100.0)

    assert compute_uptime_seconds(process_start) == 60.0
