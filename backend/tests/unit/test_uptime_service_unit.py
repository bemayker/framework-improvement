"""Unit tests for the uptime service (TEST-07), with the clocks pinned."""

from datetime import datetime, timedelta, timezone

import pytest
from starlette.datastructures import State

from app.services import uptime_service
from app.services.uptime_service import StartMark, UptimeNotRecordedError


def test_capture_start_returns_utc_aware_started_at():
    """Happy path: started_at is aware, zero-offset and taken during the call."""
    before = datetime.now(timezone.utc)
    start = uptime_service.capture_start()
    after = datetime.now(timezone.utc)

    assert start.started_at.utcoffset() == timedelta(0)
    assert before <= start.started_at <= after


def test_capture_start_pairs_started_at_with_the_monotonic_reading(monkeypatch):
    """Edge case: monotonic_at is the monotonic clock's reading at capture."""
    monkeypatch.setattr(uptime_service, "monotonic", lambda: 100.0)

    assert uptime_service.capture_start().monotonic_at == 100.0


def test_uptime_seconds_returns_elapsed_monotonic_time(monkeypatch):
    """Happy path: elapsed time is the clock reading minus the mark."""
    start = StartMark(started_at=datetime.now(timezone.utc), monotonic_at=100.0)
    monkeypatch.setattr(uptime_service, "monotonic", lambda: 101.5)

    assert uptime_service.uptime_seconds(start) == 1.5


def test_uptime_seconds_is_zero_at_the_start_instant(monkeypatch):
    """Edge case: the non-negative boundary of criterion 2."""
    start = StartMark(started_at=datetime.now(timezone.utc), monotonic_at=100.0)
    monkeypatch.setattr(uptime_service, "monotonic", lambda: 100.0)

    assert uptime_service.uptime_seconds(start) == 0.0


def test_uptime_seconds_increases_as_the_monotonic_clock_advances(monkeypatch):
    """Criterion 2 pinned: a later clock reading gives a strictly larger value."""
    start = StartMark(started_at=datetime.now(timezone.utc), monotonic_at=50.0)
    monkeypatch.setattr(uptime_service, "monotonic", lambda: 100.0)
    first = uptime_service.uptime_seconds(start)
    monkeypatch.setattr(uptime_service, "monotonic", lambda: 101.0)
    second = uptime_service.uptime_seconds(start)

    assert second > first


def test_get_start_mark_returns_the_recorded_mark():
    """Happy path: the mark on the state is returned as is."""
    start = StartMark(started_at=datetime.now(timezone.utc), monotonic_at=1.0)
    state = State()
    state.uptime_start = start

    assert uptime_service.get_start_mark(state) is start


def test_get_start_mark_raises_when_startup_recorded_none():
    """Error case: an empty state means the lifespan never ran."""
    with pytest.raises(UptimeNotRecordedError):
        uptime_service.get_start_mark(State())
