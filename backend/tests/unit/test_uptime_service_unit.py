"""Unit tests for the uptime service and schema (TEST-07)."""

from datetime import datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.schemas.uptime import UptimeResponse
from app.services import uptime_service


def test_get_uptime_seconds_returns_elapsed_since_start(monkeypatch):
    monkeypatch.setattr(
        uptime_service.time, "monotonic", lambda: uptime_service._STARTED_MONOTONIC + 5.0
    )

    assert uptime_service.get_uptime_seconds() == pytest.approx(5.0)


def test_get_uptime_seconds_increases_between_calls(monkeypatch):
    now = {"value": uptime_service._STARTED_MONOTONIC + 2.0}
    monkeypatch.setattr(uptime_service.time, "monotonic", lambda: now["value"])

    first = uptime_service.get_uptime_seconds()
    now["value"] += 1.0
    second = uptime_service.get_uptime_seconds()

    assert second > first
    assert second - first == pytest.approx(1.0)


def test_get_uptime_seconds_never_negative_when_clock_reads_before_start(monkeypatch):
    monkeypatch.setattr(
        uptime_service.time, "monotonic", lambda: uptime_service._STARTED_MONOTONIC - 10.0
    )

    assert uptime_service.get_uptime_seconds() == 0.0


def test_get_started_at_returns_same_value_on_repeated_calls():
    first = uptime_service.get_started_at()
    second = uptime_service.get_started_at()

    assert first is second
    assert first == uptime_service.STARTED_AT


def test_started_at_is_timezone_aware_utc():
    assert uptime_service.STARTED_AT.utcoffset() == timedelta(0)


def test_uptime_response_serialises_started_at_with_explicit_utc_offset():
    instant = datetime(2026, 11, 13, 5, 51, 31, 123456, tzinfo=timezone.utc)

    dumped = UptimeResponse(uptime_seconds=1.5, started_at=instant).model_dump(mode="json")

    assert dumped["started_at"].endswith("+00:00")
    assert datetime.fromisoformat(dumped["started_at"]) == instant


def test_uptime_response_rejects_negative_uptime():
    with pytest.raises(ValidationError):
        UptimeResponse(uptime_seconds=-1, started_at=datetime.now(timezone.utc))
