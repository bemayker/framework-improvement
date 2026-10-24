"""Unit tests for the UptimeResponse schema (TEST-07)."""

from datetime import UTC, datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.schemas.uptime import UptimeResponse

INSTANT = datetime(2026, 10, 24, 4, 24, 56, 123456, tzinfo=UTC)


def test_started_at_serialises_with_plus_zero_offset_and_round_trips():
    payload = UptimeResponse(uptime_seconds=1.5, started_at=INSTANT).model_dump(
        mode="json"
    )

    assert payload["started_at"].endswith("+00:00")
    assert datetime.fromisoformat(payload["started_at"]) == INSTANT
    assert payload["uptime_seconds"] == 1.5


def test_non_utc_aware_input_is_normalised_to_utc():
    plus_two = timezone(timedelta(hours=2))
    local = INSTANT.astimezone(plus_two)

    payload = UptimeResponse(uptime_seconds=0, started_at=local).model_dump(
        mode="json"
    )

    assert payload["started_at"].endswith("+00:00")
    assert datetime.fromisoformat(payload["started_at"]) == INSTANT


def test_naive_datetime_is_rejected():
    with pytest.raises(ValidationError):
        UptimeResponse(uptime_seconds=1.0, started_at=datetime(2026, 10, 24))


def test_negative_uptime_is_rejected():
    with pytest.raises(ValidationError):
        UptimeResponse(uptime_seconds=-0.1, started_at=INSTANT)


def test_zero_uptime_is_accepted():
    assert UptimeResponse(uptime_seconds=0, started_at=INSTANT).uptime_seconds == 0
