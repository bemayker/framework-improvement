"""Unit tests for the UptimeResponse schema (TEST-07)."""

from datetime import UTC, datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.schemas.uptime import UptimeResponse


def test_uptime_response_serialises_utc_started_at_with_plus_zero_offset():
    response = UptimeResponse(
        uptime_seconds=1.5,
        started_at=datetime(2026, 11, 7, 16, 30, 0, 123456, tzinfo=UTC),
    )

    assert response.model_dump(mode="json") == {
        "uptime_seconds": 1.5,
        "started_at": "2026-11-07T16:30:00.123456+00:00",
    }


def test_uptime_response_converts_non_utc_started_at_to_utc():
    response = UptimeResponse(
        uptime_seconds=0,
        started_at=datetime(2026, 11, 7, 18, 30, tzinfo=timezone(timedelta(hours=2))),
    )

    assert response.model_dump(mode="json")["started_at"] == "2026-11-07T16:30:00+00:00"


def test_uptime_response_rejects_naive_started_at():
    with pytest.raises(ValidationError):
        UptimeResponse(uptime_seconds=1.0, started_at=datetime(2026, 11, 7, 16, 30))


def test_uptime_response_rejects_negative_uptime_seconds():
    with pytest.raises(ValidationError):
        UptimeResponse(uptime_seconds=-0.1, started_at=datetime(2026, 11, 7, tzinfo=UTC))
