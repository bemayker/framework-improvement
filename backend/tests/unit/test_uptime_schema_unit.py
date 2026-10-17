"""Unit tests for the uptime response schema (TEST-07)."""

from datetime import datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.schemas.uptime import UptimeResponse

UTC_INSTANT = datetime(2026, 10, 17, 9, 15, 2, 123456, tzinfo=timezone.utc)


def test_uptime_response_serialises_started_at_with_utc_offset():
    """Happy path: JSON output carries the explicit +00:00 offset."""
    body = UptimeResponse(uptime_seconds=1.5, started_at=UTC_INSTANT).model_dump(
        mode="json"
    )

    assert body == {
        "uptime_seconds": 1.5,
        "started_at": "2026-10-17T09:15:02.123456+00:00",
    }


def test_uptime_response_normalises_non_utc_aware_started_at_to_utc():
    """Edge case: a +02:00 input is emitted as the same instant in UTC."""
    plus_two = timezone(timedelta(hours=2))
    started_at = datetime(2026, 10, 17, 11, 15, 2, 123456, tzinfo=plus_two)

    body = UptimeResponse(uptime_seconds=0, started_at=started_at).model_dump(
        mode="json"
    )

    assert body["started_at"] == "2026-10-17T09:15:02.123456+00:00"


def test_uptime_response_rejects_naive_started_at():
    """Error case: a naive datetime is not a timestamp with an offset."""
    with pytest.raises(ValidationError):
        UptimeResponse(uptime_seconds=1.0, started_at=datetime(2026, 10, 17, 9, 0, 0))


def test_uptime_response_rejects_negative_uptime_seconds():
    """Error case: a negative uptime can never be serialised."""
    with pytest.raises(ValidationError):
        UptimeResponse(uptime_seconds=-0.1, started_at=UTC_INSTANT)
