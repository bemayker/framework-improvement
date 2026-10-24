"""Unit tests for the uptime service (TEST-07)."""

from datetime import UTC, datetime, timedelta

from app.services import uptime_service
from app.services.uptime_service import (
    ProcessStart,
    capture_process_start,
    get_uptime_seconds,
)


def test_capture_process_start_returns_utc_aware_datetime():
    started = capture_process_start()

    assert started.started_at.tzinfo is not None
    assert started.started_at.utcoffset() == timedelta(0)


def test_capture_process_start_reads_the_patched_clocks(monkeypatch):
    fixed = datetime(2026, 10, 24, 4, 24, 56, tzinfo=UTC)
    monkeypatch.setattr(uptime_service, "_utc_now", lambda: fixed)
    monkeypatch.setattr(uptime_service.time, "monotonic", lambda: 123.5)

    started = capture_process_start()

    assert started == ProcessStart(started_at=fixed, monotonic_start=123.5)


def test_get_uptime_seconds_is_non_negative_for_a_fresh_capture():
    assert get_uptime_seconds(capture_process_start()) >= 0.0


def test_get_uptime_seconds_grows_by_one_second_when_clock_advances(monkeypatch):
    started = ProcessStart(
        started_at=datetime(2026, 10, 24, tzinfo=UTC), monotonic_start=100.0
    )
    monkeypatch.setattr(uptime_service.time, "monotonic", lambda: 110.0)
    first = get_uptime_seconds(started)
    monkeypatch.setattr(uptime_service.time, "monotonic", lambda: 111.0)
    second = get_uptime_seconds(started)

    assert first == 10.0
    assert second - first == 1.0


def test_get_uptime_seconds_clamps_to_zero_for_future_monotonic_start(monkeypatch):
    started = ProcessStart(
        started_at=datetime(2026, 10, 24, tzinfo=UTC), monotonic_start=500.0
    )
    monkeypatch.setattr(uptime_service.time, "monotonic", lambda: 100.0)

    assert get_uptime_seconds(started) == 0.0
