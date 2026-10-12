"""Unit tests for the uptime response schema (backend/app/schemas/uptime.py)."""

from datetime import datetime, timezone

import pytest
from pydantic import ValidationError

from app.schemas.uptime import UptimeResponse

UTC_START = datetime(2026, 10, 13, 8, 0, 0, tzinfo=timezone.utc)


def test_uptime_response_serialises_utc_started_at_with_z_offset():
    """Happy path: a UTC started_at is emitted as ISO 8601 with a Z offset."""
    response = UptimeResponse(uptime_seconds=12.5, started_at=UTC_START)

    assert response.model_dump(mode="json") == {
        "uptime_seconds": 12.5,
        "started_at": "2026-10-13T08:00:00Z",
    }


def test_uptime_response_accepts_zero_uptime_seconds():
    """Edge case: zero is the boundary of the non-negative rule."""
    response = UptimeResponse(uptime_seconds=0, started_at=UTC_START)

    assert response.uptime_seconds == 0


def test_uptime_response_rejects_negative_uptime_seconds():
    """Error case: a negative duration is invalid."""
    with pytest.raises(ValidationError):
        UptimeResponse(uptime_seconds=-0.001, started_at=UTC_START)


def test_uptime_response_rejects_naive_started_at():
    """Error case: a timestamp without an offset is invalid."""
    with pytest.raises(ValidationError):
        UptimeResponse(uptime_seconds=1.0, started_at=datetime(2026, 10, 13, 8, 0, 0))
