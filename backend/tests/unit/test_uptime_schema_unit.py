"""Unit tests for the uptime response schema (TEST-07)."""

from datetime import UTC, datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.schemas.uptime import UptimeResponse


def test_uptime_response_serialises_started_at_with_utc_offset():
    response = UptimeResponse(
        uptime_seconds=1.5,
        started_at=datetime(2026, 11, 3, 22, 56, 29, 104512, tzinfo=UTC),
    )

    assert response.model_dump(mode="json") == {
        "uptime_seconds": 1.5,
        "started_at": "2026-11-03T22:56:29.104512+00:00",
    }


def test_uptime_response_converts_non_utc_aware_started_at_to_utc():
    plus_two = timezone(timedelta(hours=2))
    response = UptimeResponse(
        uptime_seconds=0,
        started_at=datetime(2026, 11, 4, 0, 56, 29, tzinfo=plus_two),
    )

    assert response.model_dump(mode="json")["started_at"] == "2026-11-03T22:56:29+00:00"


def test_uptime_response_rejects_naive_started_at():
    with pytest.raises(ValidationError):
        UptimeResponse(uptime_seconds=1.0, started_at=datetime(2026, 11, 3, 22, 0, 0))


def test_uptime_response_rejects_negative_uptime():
    with pytest.raises(ValidationError):
        UptimeResponse(uptime_seconds=-0.1, started_at=datetime.now(UTC))
