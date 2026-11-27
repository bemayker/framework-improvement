"""Unit tests for the uptime response schema (TEST-07)."""

from datetime import datetime, timedelta, timezone

import pytest
from pydantic import BaseModel, ValidationError

from app.schemas.uptime import UptimeResponse


def test_uptime_response_serialises_started_at_with_explicit_utc_offset():
    """Criterion 3: the JSON dump ends in +00:00, not Z."""
    response = UptimeResponse(
        uptime_seconds=1.5,
        started_at=datetime(2026, 11, 27, 12, 58, 10, 123456, tzinfo=timezone.utc),
    )

    dumped = response.model_dump(mode="json")

    assert dumped["started_at"] == "2026-11-27T12:58:10.123456+00:00"


def test_uptime_response_normalises_other_offsets_to_utc():
    """Edge case: a non-UTC aware datetime is written in UTC."""
    plus_one = timezone(timedelta(hours=1))
    response = UptimeResponse(
        uptime_seconds=0,
        started_at=datetime(2026, 11, 27, 13, 0, 0, tzinfo=plus_one),
    )

    assert response.model_dump(mode="json")["started_at"] == "2026-11-27T12:00:00+00:00"


def test_uptime_response_rejects_naive_started_at():
    """Error case: a datetime with no offset is refused."""
    with pytest.raises(ValidationError):
        UptimeResponse(uptime_seconds=1.0, started_at=datetime(2026, 11, 27, 12, 0, 0))


def test_uptime_response_rejects_negative_uptime_seconds():
    """Error case: uptime below zero is refused."""
    with pytest.raises(ValidationError):
        UptimeResponse(uptime_seconds=-0.1, started_at=datetime.now(timezone.utc))


def test_uptime_response_lives_in_app_schemas():
    """Criterion 4: the body is a Pydantic model defined in app.schemas."""
    assert issubclass(UptimeResponse, BaseModel)
    assert UptimeResponse.__module__ == "app.schemas.uptime"
