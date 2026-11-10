"""Unit tests for the uptime response schema (TEST-07)."""

from datetime import datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.schemas.uptime import UptimeResponse


def test_uptime_response_serialises_utc_datetime_with_numeric_offset():
    """Happy path: started_at ends in +00:00, not Z."""
    started_at = datetime(2026, 11, 10, 10, 26, 35, 123456, tzinfo=timezone.utc)

    body = UptimeResponse(uptime_seconds=1.5, started_at=started_at).model_dump(
        mode="json"
    )

    assert body == {
        "uptime_seconds": 1.5,
        "started_at": "2026-11-10T10:26:35.123456+00:00",
    }


def test_uptime_response_converts_non_utc_aware_datetime_to_utc():
    """Edge case: an aware datetime in another zone is emitted as UTC."""
    plus_two = timezone(timedelta(hours=2))
    started_at = datetime(2026, 11, 10, 12, 0, 0, tzinfo=plus_two)

    body = UptimeResponse(uptime_seconds=0, started_at=started_at).model_dump(
        mode="json"
    )

    assert body["started_at"] == "2026-11-10T10:00:00+00:00"


def test_uptime_response_rejects_naive_datetime():
    """Error case: a datetime with no offset is not accepted."""
    with pytest.raises(ValidationError):
        UptimeResponse(uptime_seconds=1.0, started_at=datetime(2026, 11, 10, 10, 0, 0))


def test_uptime_response_rejects_negative_uptime():
    """Error case: uptime_seconds must be non-negative."""
    with pytest.raises(ValidationError):
        UptimeResponse(
            uptime_seconds=-1,
            started_at=datetime(2026, 11, 10, 10, 0, 0, tzinfo=timezone.utc),
        )
