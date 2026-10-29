"""Unit tests for the uptime response schema (TEST-07)."""

from datetime import datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.schemas.uptime import UptimeResponse


def test_uptime_response_serialises_started_at_with_utc_offset():
    """Happy path: an aware UTC datetime dumps ending in +00:00, not Z."""
    started_at = datetime(2026, 10, 29, 16, 17, 45, 123456, tzinfo=timezone.utc)

    dumped = UptimeResponse(uptime_seconds=1.5, started_at=started_at).model_dump(
        mode="json"
    )

    assert dumped == {
        "uptime_seconds": 1.5,
        "started_at": "2026-10-29T16:17:45.123456+00:00",
    }


def test_uptime_response_converts_non_utc_offset_to_utc():
    """Edge case: a +02:00 value dumps as the equivalent +00:00 instant."""
    started_at = datetime(
        2026, 10, 29, 18, 0, 0, tzinfo=timezone(timedelta(hours=2))
    )

    dumped = UptimeResponse(uptime_seconds=0, started_at=started_at).model_dump(
        mode="json"
    )

    assert dumped["started_at"] == "2026-10-29T16:00:00+00:00"


def test_uptime_response_rejects_naive_started_at():
    """Error case: a datetime without an offset cannot be serialised."""
    with pytest.raises(ValidationError):
        UptimeResponse(uptime_seconds=1.0, started_at=datetime(2026, 10, 29, 16, 0, 0))


def test_uptime_response_rejects_negative_uptime_seconds():
    """Error case: uptime below zero is invalid."""
    with pytest.raises(ValidationError):
        UptimeResponse(
            uptime_seconds=-0.1,
            started_at=datetime(2026, 10, 29, 16, 0, 0, tzinfo=timezone.utc),
        )
