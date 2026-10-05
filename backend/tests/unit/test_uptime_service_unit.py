"""Unit tests for the uptime service (TEST-07), with monkeypatched clocks."""

from datetime import datetime, timedelta, timezone

import pytest

from app.services import uptime_service
from app.services.uptime_service import ProcessStart


class FakeClock:
    def __init__(self, value: float) -> None:
        self.value = value

    def __call__(self) -> float:
        return self.value


def test_capture_process_start_returns_aware_utc_and_monotonic_reading(monkeypatch):
    fixed = datetime(2026, 10, 5, 9, 14, 2, tzinfo=timezone.utc)

    class FakeDatetime:
        @staticmethod
        def now(tz):
            assert tz is timezone.utc
            return fixed

    monkeypatch.setattr(uptime_service, "datetime", FakeDatetime)
    monkeypatch.setattr(uptime_service.time, "monotonic", FakeClock(123.5))

    result = uptime_service.capture_process_start()

    assert result.started_at == fixed
    assert result.started_at.utcoffset() == timedelta(0)
    assert result.monotonic_start == 123.5


def test_capture_process_start_reads_wall_clock_exactly_once(monkeypatch):
    calls: list[object] = []

    class CountingDatetime:
        @staticmethod
        def now(tz):
            calls.append(tz)
            return datetime(2026, 1, 1, tzinfo=timezone.utc)

    monkeypatch.setattr(uptime_service, "datetime", CountingDatetime)

    uptime_service.capture_process_start()

    assert len(calls) == 1


def test_get_uptime_seconds_equals_monotonic_delta(monkeypatch):
    clock = FakeClock(100.0)
    monkeypatch.setattr(uptime_service.time, "monotonic", clock)
    start = ProcessStart(datetime(2026, 1, 1, tzinfo=timezone.utc), 100.0)

    first = uptime_service.get_uptime_seconds(start)
    clock.value += 1.0
    second = uptime_service.get_uptime_seconds(start)

    assert second - first == pytest.approx(1.0)


def test_get_uptime_seconds_with_zero_elapsed_returns_zero(monkeypatch):
    monkeypatch.setattr(uptime_service.time, "monotonic", FakeClock(50.0))
    start = ProcessStart(datetime(2026, 1, 1, tzinfo=timezone.utc), 50.0)

    assert uptime_service.get_uptime_seconds(start) == 0.0
