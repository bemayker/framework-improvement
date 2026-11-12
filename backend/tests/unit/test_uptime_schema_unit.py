"""Unit tests for the UptimeResponse schema (TEST-07)."""

from datetime import datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.schemas.uptime import UptimeResponse


def test_uptime_response_serialises_started_at_with_utc_offset():
    response = UptimeResponse(
        uptime_seconds=1.5,
        started_at=datetime(2026, 11, 12, 21, 36, 19, 123456, tzinfo=timezone.utc),
    )

    assert response.model_dump(mode="json") == {
        "uptime_seconds": 1.5,
        "started_at": "2026-11-12T21:36:19.123456+00:00",
    }


def test_uptime_response_converts_non_utc_started_at_to_utc():
    plus_two = timezone(timedelta(hours=2))
    response = UptimeResponse(
        uptime_seconds=0,
        started_at=datetime(2026, 11, 12, 12, 0, 0, tzinfo=plus_two),
    )

    assert response.model_dump(mode="json")["started_at"] == "2026-11-12T10:00:00+00:00"


def test_uptime_response_rejects_naive_started_at():
    with pytest.raises(ValidationError):
        UptimeResponse(uptime_seconds=1.0, started_at=datetime(2026, 1, 1))


def test_uptime_response_rejects_negative_uptime_seconds():
    with pytest.raises(ValidationError):
        UptimeResponse(
            uptime_seconds=-0.1,
            started_at=datetime(2026, 1, 1, tzinfo=timezone.utc),
        )
