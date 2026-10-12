"""Unit tests for the uptime service (backend/app/services/uptime_service.py)."""

from dataclasses import FrozenInstanceError
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

import pytest

from app.services import uptime_service
from app.services.uptime_service import ProcessStart, capture_process_start, seconds_since


def _patch_monotonic(monkeypatch: pytest.MonkeyPatch, readings: list[float]) -> None:
    """Make the service's monotonic clock return `readings` in order, no sleeping."""
    values = iter(readings)
    monkeypatch.setattr(
        uptime_service, "time", SimpleNamespace(monotonic=lambda: next(values))
    )


def test_capture_process_start_returns_utc_aware_timestamp_and_monotonic_reading(
    monkeypatch,
):
    """Happy path: both readings are taken, the timestamp is UTC-aware."""
    _patch_monotonic(monkeypatch, [123.5])
    before = datetime.now(timezone.utc)

    start = capture_process_start()

    after = datetime.now(timezone.utc)
    assert start.monotonic_start == 123.5
    assert start.started_at.utcoffset() == timedelta(0)
    assert before <= start.started_at <= after


def test_capture_process_start_reads_each_clock_once(monkeypatch):
    """Edge case: one monotonic reading per capture, so the value is taken once."""
    readings = iter([1.0])
    calls = []

    def fake_monotonic() -> float:
        calls.append(1)
        return next(readings)

    monkeypatch.setattr(uptime_service, "time", SimpleNamespace(monotonic=fake_monotonic))

    capture_process_start()

    assert len(calls) == 1


def test_process_start_is_immutable():
    """Error case: the captured start cannot be reassigned after startup."""
    start = ProcessStart(started_at=datetime.now(timezone.utc), monotonic_start=1.0)

    with pytest.raises(FrozenInstanceError):
        start.monotonic_start = 2.0  # type: ignore[misc]


def test_seconds_since_returns_elapsed_from_patched_clock(monkeypatch):
    """Happy path: elapsed seconds are the monotonic difference."""
    start = ProcessStart(started_at=datetime.now(timezone.utc), monotonic_start=100.0)
    _patch_monotonic(monkeypatch, [112.25])

    assert seconds_since(start) == 12.25


def test_seconds_since_is_zero_at_the_start_instant(monkeypatch):
    """Edge case: reading the clock at the start instant gives exactly zero."""
    start = ProcessStart(started_at=datetime.now(timezone.utc), monotonic_start=100.0)
    _patch_monotonic(monkeypatch, [100.0])

    assert seconds_since(start) == 0.0


def test_seconds_since_increases_as_the_clock_advances(monkeypatch):
    """Edge case: a later reading never gives a smaller duration."""
    start = ProcessStart(started_at=datetime.now(timezone.utc), monotonic_start=100.0)
    _patch_monotonic(monkeypatch, [101.0, 102.0])

    first = seconds_since(start)
    second = seconds_since(start)

    assert second > first >= 0
