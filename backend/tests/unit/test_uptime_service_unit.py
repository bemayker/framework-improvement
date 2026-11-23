"""Unit tests for the uptime service and response schema (TEST-07)."""

from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock

import pytest
from pydantic import ValidationError

from app.schemas.uptime import UptimeResponse
from app.services import uptime_service
from app.services.uptime_service import StartupStamp, capture_startup, uptime_seconds

FIXED_START = datetime(2026, 11, 22, 17, 27, 30, 123456, tzinfo=timezone.utc)


def test_capture_startup_returns_utc_aware_started_at(monkeypatch):
    """The stamp reads both clocks once and keeps started_at timezone-aware UTC."""
    fake_datetime = MagicMock()
    fake_datetime.now.return_value = FIXED_START
    monkeypatch.setattr(uptime_service, "datetime", fake_datetime)
    monkeypatch.setattr(uptime_service, "monotonic", lambda: 100.0)

    stamp = capture_startup()

    fake_datetime.now.assert_called_once_with(timezone.utc)
    assert stamp.started_at == FIXED_START
    assert stamp.started_at.utcoffset() == timedelta(0)
    assert stamp.started_monotonic == 100.0


def test_uptime_seconds_increases_between_two_reads(monkeypatch):
    """Criterion 2: a later read reports a larger value, one second apart."""
    stamp = StartupStamp(started_at=FIXED_START, started_monotonic=100.0)
    readings = iter([105.0, 106.0])
    monkeypatch.setattr(uptime_service, "monotonic", lambda: next(readings))

    first = uptime_seconds(stamp)
    second = uptime_seconds(stamp)

    assert first == 5.0
    assert second == 6.0
    assert second > first


def test_uptime_seconds_is_never_negative(monkeypatch):
    """Edge case: a clock reading before the stamp is clamped to zero."""
    stamp = StartupStamp(started_at=FIXED_START, started_monotonic=100.0)
    monkeypatch.setattr(uptime_service, "monotonic", lambda: 99.0)

    assert uptime_seconds(stamp) == 0.0


def test_uptime_response_serialises_started_at_with_utc_offset():
    """Criterion 3: JSON output carries an explicit +00:00 offset, not Z."""
    body = UptimeResponse(uptime_seconds=1.5, started_at=FIXED_START)

    assert body.model_dump(mode="json") == {
        "uptime_seconds": 1.5,
        "started_at": "2026-11-22T17:27:30.123456+00:00",
    }


def test_uptime_response_converts_non_utc_started_at_to_utc():
    """Edge case: an offset-aware non-UTC input is written in UTC."""
    plus_two = timezone(timedelta(hours=2))
    body = UptimeResponse(
        uptime_seconds=0, started_at=FIXED_START.astimezone(plus_two)
    )

    assert body.model_dump(mode="json")["started_at"].endswith("+00:00")


def test_uptime_response_rejects_negative_uptime():
    """Error case: the schema refuses a negative uptime."""
    with pytest.raises(ValidationError):
        UptimeResponse(uptime_seconds=-1, started_at=FIXED_START)


def test_uptime_response_rejects_naive_started_at():
    """Error case: a datetime with no offset is not accepted."""
    with pytest.raises(ValidationError):
        UptimeResponse(uptime_seconds=1, started_at=datetime(2026, 1, 1))
