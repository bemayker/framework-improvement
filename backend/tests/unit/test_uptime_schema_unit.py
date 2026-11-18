"""Unit tests for the UptimeResponse schema (TEST-07)."""

from datetime import datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.schemas.uptime import UptimeResponse


def test_uptime_response_serialises_started_at_with_utc_offset():
    """Criteria 3 and 4: the Pydantic schema emits a literal +00:00 offset."""
    started = datetime(2026, 11, 18, 22, 5, 34, 123456, tzinfo=timezone.utc)

    body = UptimeResponse(uptime_seconds=1.5, started_at=started).model_dump(mode="json")

    assert body == {
        "uptime_seconds": 1.5,
        "started_at": "2026-11-18T22:05:34.123456+00:00",
    }


def test_uptime_response_converts_non_utc_started_at_to_utc():
    """Edge case: an aware non-UTC value is converted, not emitted with its offset."""
    plus_one = timezone(timedelta(hours=1))
    started = datetime(2026, 11, 18, 23, 5, 34, tzinfo=plus_one)

    body = UptimeResponse(uptime_seconds=0, started_at=started).model_dump(mode="json")

    assert body["started_at"] == "2026-11-18T22:05:34+00:00"


def test_uptime_response_rejects_naive_started_at():
    """Error case: a naive datetime is rejected so the offset is never guessed."""
    with pytest.raises(ValidationError):
        UptimeResponse(uptime_seconds=1.0, started_at=datetime(2026, 1, 1))


def test_uptime_response_rejects_negative_uptime():
    """Criterion 2 error case: negative uptime is invalid."""
    with pytest.raises(ValidationError):
        UptimeResponse(
            uptime_seconds=-0.1, started_at=datetime(2026, 1, 1, tzinfo=timezone.utc)
        )
