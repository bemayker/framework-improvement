"""Unit tests for the uptime response schema (TEST-07)."""

from datetime import datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.schemas.uptime import UptimeResponse


def test_uptime_response_serialises_started_at_with_utc_offset():
    """Criterion 3: started_at carries a literal +00:00, never Z."""
    started_at = datetime(2026, 11, 17, 22, 49, 37, 120394, tzinfo=timezone.utc)

    payload = UptimeResponse(uptime_seconds=1.5, started_at=started_at).model_dump(
        mode="json"
    )

    assert payload["started_at"] == "2026-11-17T22:49:37.120394+00:00"


def test_uptime_response_converts_non_utc_started_at_to_utc():
    """Criterion 3 edge case: a non-UTC aware value is rendered in UTC."""
    plus_one = timezone(timedelta(hours=1))
    started_at = datetime(2026, 11, 17, 23, 49, 37, tzinfo=plus_one)

    payload = UptimeResponse(uptime_seconds=0, started_at=started_at).model_dump(
        mode="json"
    )

    assert payload["started_at"] == "2026-11-17T22:49:37+00:00"


def test_uptime_response_rejects_negative_uptime_seconds():
    """Criterion 2 error case: a negative uptime fails validation."""
    with pytest.raises(ValidationError):
        UptimeResponse(
            uptime_seconds=-0.1, started_at=datetime.now(timezone.utc)
        )
