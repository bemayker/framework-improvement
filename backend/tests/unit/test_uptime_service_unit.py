"""Unit tests for the uptime service (TEST-07). The clock is patched, never slept on."""

import logging
from datetime import UTC, datetime, timedelta

from app.services import uptime_service
from app.services.uptime_service import StartupRecord, capture_startup, get_uptime_seconds


def test_capture_startup_records_utc_aware_started_at(monkeypatch):
    monkeypatch.setattr(uptime_service, "monotonic", lambda: 100.0)
    before = datetime.now(UTC)

    record = capture_startup()

    assert record.started_at.utcoffset() == timedelta(0)
    assert before <= record.started_at <= datetime.now(UTC)
    assert record.started_monotonic == 100.0


def test_get_uptime_seconds_returns_elapsed_monotonic_time(monkeypatch):
    record = StartupRecord(started_at=datetime.now(UTC), started_monotonic=10.0)
    monkeypatch.setattr(uptime_service, "monotonic", lambda: 12.5)

    assert get_uptime_seconds(record) == 2.5


def test_get_uptime_seconds_increases_as_the_clock_advances(monkeypatch):
    record = StartupRecord(started_at=datetime.now(UTC), started_monotonic=10.0)

    monkeypatch.setattr(uptime_service, "monotonic", lambda: 11.0)
    first = get_uptime_seconds(record)
    monkeypatch.setattr(uptime_service, "monotonic", lambda: 12.0)
    second = get_uptime_seconds(record)

    assert second - first == 1.0


def test_get_uptime_seconds_clamps_to_zero_when_clock_reads_before_start(monkeypatch, caplog):
    record = StartupRecord(started_at=datetime.now(UTC), started_monotonic=10.0)
    monkeypatch.setattr(uptime_service, "monotonic", lambda: 9.0)

    with caplog.at_level(logging.WARNING, logger="app.services.uptime_service"):
        result = get_uptime_seconds(record)

    assert result == 0.0
    assert "clamping uptime to 0" in caplog.text
