"""Unit tests for the uptime response schema (backend/app/schemas/uptime.py)."""

from datetime import UTC, datetime

import pytest
from pydantic import ValidationError

from app.schemas.uptime import UptimeResponse

STARTED_AT = datetime(2026, 11, 5, 9, 30, 2, 118734, tzinfo=UTC)


def test_uptime_response_json_renders_started_at_with_plus_zero_offset():
    response = UptimeResponse(uptime_seconds=12.84, started_at=STARTED_AT)

    dumped = response.model_dump(mode="json")

    assert dumped == {"uptime_seconds": 12.84, "started_at": "2026-11-05T09:30:02.118734+00:00"}
    assert dumped["started_at"].endswith("+00:00")


def test_uptime_response_accepts_zero_uptime():
    response = UptimeResponse(uptime_seconds=0, started_at=STARTED_AT)

    assert response.uptime_seconds == 0


def test_uptime_response_rejects_naive_started_at():
    with pytest.raises(ValidationError):
        UptimeResponse(uptime_seconds=1.0, started_at=datetime(2026, 11, 5, 9, 30, 2))


def test_uptime_response_rejects_negative_uptime_seconds():
    with pytest.raises(ValidationError):
        UptimeResponse(uptime_seconds=-0.1, started_at=STARTED_AT)
