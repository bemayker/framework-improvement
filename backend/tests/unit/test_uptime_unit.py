"""Unit tests for the UptimeResponse schema (TEST-07)."""

from datetime import UTC, datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.schemas.uptime import UptimeResponse


def test_uptime_response_dumps_exactly_the_two_keys_with_utc_offset():
    started = datetime(2026, 10, 2, 10, 42, 41, 123456, tzinfo=UTC)

    body = UptimeResponse(uptime_seconds=12.5, started_at=started).model_dump(
        mode="json"
    )

    assert body == {
        "uptime_seconds": 12.5,
        "started_at": "2026-10-02T10:42:41.123456+00:00",
    }
    assert datetime.fromisoformat(body["started_at"]) == started


def test_uptime_response_emits_other_offsets_as_the_equivalent_utc_instant():
    started = datetime(2026, 10, 2, 12, 0, tzinfo=timezone(timedelta(hours=2)))

    body = UptimeResponse(uptime_seconds=0, started_at=started).model_dump(mode="json")

    assert body["started_at"] == "2026-10-02T10:00:00+00:00"


def test_uptime_response_rejects_a_naive_datetime():
    with pytest.raises(ValidationError):
        UptimeResponse(uptime_seconds=1.0, started_at=datetime(2026, 10, 2, 10, 0))


def test_uptime_response_rejects_negative_uptime():
    with pytest.raises(ValidationError):
        UptimeResponse(uptime_seconds=-0.1, started_at=datetime.now(UTC))
