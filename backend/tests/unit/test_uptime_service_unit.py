"""Unit tests for the uptime service (TEST-07), with injected clocks."""

from datetime import UTC, datetime, timedelta, timezone

import pytest

from app.services import uptime_service
from app.services.uptime_service import (
    ProcessStart,
    capture_process_start,
    get_uptime_seconds,
)


def test_capture_process_start_returns_injected_wall_clock_and_monotonic():
    wall = datetime(2026, 11, 7, 16, 30, tzinfo=UTC)

    start = capture_process_start(lambda: wall, lambda: 100.0)

    assert start == ProcessStart(started_at=wall, monotonic_start=100.0)


def test_capture_process_start_normalises_non_utc_input_to_utc():
    plus_two = timezone(timedelta(hours=2))
    wall = datetime(2026, 11, 7, 18, 30, tzinfo=plus_two)

    start = capture_process_start(lambda: wall, lambda: 1.0)

    assert start.started_at.utcoffset() == timedelta(0)
    assert start.started_at == datetime(2026, 11, 7, 16, 30, tzinfo=UTC)


def test_capture_process_start_defaults_produce_aware_utc_time():
    start = capture_process_start()

    assert start.started_at.utcoffset() == timedelta(0)


def test_get_uptime_seconds_returns_elapsed_for_injected_now():
    start = ProcessStart(datetime(2026, 1, 1, tzinfo=UTC), 100.0)

    assert get_uptime_seconds(start, now_monotonic=142.5) == pytest.approx(42.5)


def test_get_uptime_seconds_is_zero_when_now_equals_start():
    start = ProcessStart(datetime(2026, 1, 1, tzinfo=UTC), 100.0)

    assert get_uptime_seconds(start, now_monotonic=100.0) == 0.0


def test_get_uptime_seconds_clamps_to_zero_when_now_is_before_start():
    start = ProcessStart(datetime(2026, 1, 1, tzinfo=UTC), 100.0)

    assert get_uptime_seconds(start, now_monotonic=99.0) == 0.0


def test_get_uptime_seconds_defaults_to_the_monotonic_clock(monkeypatch):
    monkeypatch.setattr(uptime_service.time, "monotonic", lambda: 130.0)
    start = ProcessStart(datetime(2026, 1, 1, tzinfo=UTC), 100.0)

    assert get_uptime_seconds(start) == pytest.approx(30.0)
