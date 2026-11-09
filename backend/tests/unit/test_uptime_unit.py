"""Unit tests for the uptime service and schema (TEST-07)."""

from datetime import UTC, datetime, timedelta

import pytest
from pydantic import ValidationError

from app.schemas.uptime import UptimeResponse
from app.services import uptime_service
from app.services.uptime_service import (
    ProcessStart,
    capture_process_start,
    get_uptime_seconds,
)


def test_capture_process_start_returns_aware_utc_datetime(monkeypatch):
    monkeypatch.setattr(uptime_service, "monotonic", lambda: 42.0)

    start = capture_process_start()

    assert start.started_at.utcoffset() == timedelta(0)
    assert start.monotonic_start == 42.0


def test_get_uptime_seconds_returns_elapsed_monotonic_seconds(monkeypatch):
    monkeypatch.setattr(uptime_service, "monotonic", lambda: 112.5)
    start = ProcessStart(started_at=datetime.now(UTC), monotonic_start=100.0)

    assert get_uptime_seconds(start) == 12.5


def test_get_uptime_seconds_increases_as_clock_advances(monkeypatch):
    start = ProcessStart(started_at=datetime.now(UTC), monotonic_start=100.0)

    monkeypatch.setattr(uptime_service, "monotonic", lambda: 101.0)
    first = get_uptime_seconds(start)
    monkeypatch.setattr(uptime_service, "monotonic", lambda: 102.0)
    second = get_uptime_seconds(start)

    assert second > first


def test_get_uptime_seconds_is_zero_at_capture(monkeypatch):
    monkeypatch.setattr(uptime_service, "monotonic", lambda: 100.0)
    start = ProcessStart(started_at=datetime.now(UTC), monotonic_start=100.0)

    assert get_uptime_seconds(start) == 0.0


def test_get_uptime_seconds_clamps_to_zero_when_clock_is_behind_start(monkeypatch):
    monkeypatch.setattr(uptime_service, "monotonic", lambda: 90.0)
    start = ProcessStart(started_at=datetime.now(UTC), monotonic_start=100.0)

    assert get_uptime_seconds(start) == 0.0


def test_uptime_response_rejects_negative_uptime():
    with pytest.raises(ValidationError):
        UptimeResponse(uptime_seconds=-1.0, started_at=datetime.now(UTC))


def test_uptime_response_rejects_naive_started_at():
    with pytest.raises(ValidationError):
        UptimeResponse(uptime_seconds=1.0, started_at=datetime(2026, 1, 1))


def test_uptime_response_serialises_started_at_in_utc_with_z():
    response = UptimeResponse(
        uptime_seconds=1.0, started_at=datetime(2026, 1, 1, 12, 0, tzinfo=UTC)
    )

    assert response.model_dump(mode="json")["started_at"].endswith("Z")
