"""Unit tests for the uptime service (TEST-07); clocks are patched."""

from dataclasses import FrozenInstanceError
from datetime import UTC, datetime

import pytest

from app.services import uptime_service
from app.services.uptime_service import ProcessClock, start_clock, uptime_seconds


def test_start_clock_returns_aware_utc_start_between_two_readings(monkeypatch):
    """Happy path: started_at is UTC-aware and the monotonic value is recorded."""
    monkeypatch.setattr(uptime_service, "monotonic", lambda: 123.5)

    before = datetime.now(UTC)
    clock = start_clock()
    after = datetime.now(UTC)

    assert clock.started_at.utcoffset().total_seconds() == 0
    assert before <= clock.started_at <= after
    assert clock.started_monotonic == 123.5


def test_uptime_seconds_returns_patched_difference(monkeypatch):
    """Happy path: uptime is the monotonic difference."""
    clock = ProcessClock(started_at=datetime.now(UTC), started_monotonic=100.0)
    monkeypatch.setattr(uptime_service, "monotonic", lambda: 142.5)

    assert uptime_seconds(clock) == pytest.approx(42.5)


def test_uptime_seconds_is_zero_when_no_time_has_elapsed(monkeypatch):
    """Edge case: boundary of the non-negative rule."""
    clock = ProcessClock(started_at=datetime.now(UTC), started_monotonic=100.0)
    monkeypatch.setattr(uptime_service, "monotonic", lambda: 100.0)

    assert uptime_seconds(clock) == 0.0


def test_uptime_seconds_increases_when_monotonic_clock_advances(monkeypatch):
    """Criterion 2: a later reading yields a larger uptime, no sleep needed."""
    clock = ProcessClock(started_at=datetime.now(UTC), started_monotonic=100.0)
    monkeypatch.setattr(uptime_service, "monotonic", lambda: 105.0)
    first = uptime_seconds(clock)
    monkeypatch.setattr(uptime_service, "monotonic", lambda: 106.0)
    second = uptime_seconds(clock)

    assert second - first == pytest.approx(1.0)


def test_process_clock_is_frozen():
    """Error case: the captured start cannot be mutated per request."""
    clock = ProcessClock(started_at=datetime.now(UTC), started_monotonic=1.0)

    with pytest.raises(FrozenInstanceError):
        clock.started_at = datetime.now(UTC)  # type: ignore[misc]
