"""Unit tests for the uptime service (TEST-07), with a fake monotonic clock."""

import dataclasses
from datetime import datetime, timedelta, timezone

import pytest

from app.services import uptime_service
from app.services.uptime_service import StartupClock, capture_startup, compute_uptime


class FakeMonotonic:
    """Stand-in for time.monotonic whose reading the test sets directly."""

    def __init__(self, now: float) -> None:
        self.now = now

    def __call__(self) -> float:
        """Return the reading the test last set."""
        return self.now


def test_capture_startup_returns_utc_aware_started_at():
    """Happy path: started_at is timezone-aware with a zero UTC offset."""
    clock = capture_startup()

    assert clock.started_at.tzinfo is not None
    assert clock.started_at.utcoffset() == timedelta(0)
    assert clock.started_at <= datetime.now(timezone.utc)


def test_compute_uptime_returns_elapsed_monotonic_seconds(monkeypatch):
    """Happy path: uptime is the monotonic difference since capture."""
    fake = FakeMonotonic(100.0)
    monkeypatch.setattr(uptime_service.time, "monotonic", fake)
    clock = capture_startup()

    fake.now = 142.5

    assert compute_uptime(clock) == 42.5


def test_compute_uptime_increases_as_monotonic_clock_advances(monkeypatch):
    """Criterion 2: a later reading yields a strictly larger uptime."""
    fake = FakeMonotonic(100.0)
    monkeypatch.setattr(uptime_service.time, "monotonic", fake)
    clock = capture_startup()

    fake.now = 110.0
    first = compute_uptime(clock)
    fake.now = 111.0
    second = compute_uptime(clock)

    assert second > first
    assert second - first == 1.0


def test_compute_uptime_is_zero_at_the_capture_instant(monkeypatch):
    """Edge case: the same monotonic reading gives 0.0, never negative."""
    fake = FakeMonotonic(100.0)
    monkeypatch.setattr(uptime_service.time, "monotonic", fake)
    clock = capture_startup()

    assert compute_uptime(clock) == 0.0


def test_startup_clock_is_immutable():
    """Error case: the captured clock cannot be reassigned after creation."""
    clock = StartupClock(started_at=datetime.now(timezone.utc), started_monotonic=1.0)

    with pytest.raises(dataclasses.FrozenInstanceError):
        clock.started_monotonic = 2.0  # type: ignore[misc]
