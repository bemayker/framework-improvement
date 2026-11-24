"""Unit tests for the uptime service (TEST-07), with a faked monotonic clock."""

from datetime import timedelta

from app.services import uptime_service
from app.services.uptime_service import ProcessStart


def test_capture_process_start_returns_utc_aware_started_at():
    """Happy path: the captured wall-clock start is timezone-aware UTC."""
    start = uptime_service.capture_process_start()

    assert start.started_at.tzinfo is not None
    assert start.started_at.utcoffset() == timedelta(0)


def test_uptime_seconds_returns_elapsed_monotonic_seconds(monkeypatch):
    """Happy path: uptime is the monotonic difference, unrounded."""
    monkeypatch.setattr(uptime_service, "monotonic", lambda: 112.5)
    start = ProcessStart(
        started_at=uptime_service.datetime.now(uptime_service.timezone.utc),
        started_monotonic=100.0,
    )

    assert uptime_service.uptime_seconds(start) == 12.5


def test_uptime_seconds_is_zero_when_monotonic_reading_is_behind_start(monkeypatch):
    """Edge/error guard: a reading below the start clamps to 0.0, never negative."""
    monkeypatch.setattr(uptime_service, "monotonic", lambda: 90.0)
    start = ProcessStart(
        started_at=uptime_service.datetime.now(uptime_service.timezone.utc),
        started_monotonic=100.0,
    )

    assert uptime_service.uptime_seconds(start) == 0.0
