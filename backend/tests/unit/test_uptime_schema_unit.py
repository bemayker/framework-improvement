"""Unit tests for UptimeResponse (TEST-07)."""

import json
from datetime import UTC, datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.schemas.uptime import UptimeResponse


def test_utc_started_at_serialises_with_plus_zero_offset():
    """Happy path: both dump paths emit +00:00 and round-trip to the same instant."""
    started = datetime(2026, 10, 30, 15, 3, 13, 482911, tzinfo=UTC)
    model = UptimeResponse(uptime_seconds=1.5, started_at=started)

    dumped = model.model_dump(mode="json")["started_at"]
    from_json = json.loads(model.model_dump_json())["started_at"]

    assert dumped.endswith("+00:00")
    assert from_json == dumped
    assert datetime.fromisoformat(dumped) == started


def test_non_utc_aware_started_at_keeps_its_own_offset():
    """Edge case: the serializer never drops the offset."""
    started = datetime(2026, 10, 30, 17, 0, 0, tzinfo=timezone(timedelta(hours=2)))
    model = UptimeResponse(uptime_seconds=0, started_at=started)

    assert model.model_dump(mode="json")["started_at"].endswith("+02:00")


def test_naive_started_at_is_rejected():
    """Error case: a naive datetime cannot be an explicit-offset timestamp."""
    with pytest.raises(ValidationError):
        UptimeResponse(uptime_seconds=1.0, started_at=datetime(2026, 10, 30, 15, 0, 0))


@pytest.mark.parametrize("bad_value", [-0.5, "abc"])
def test_invalid_uptime_seconds_is_rejected(bad_value):
    """Error cases: the ge=0 bound and the number type."""
    with pytest.raises(ValidationError):
        UptimeResponse(uptime_seconds=bad_value, started_at=datetime.now(UTC))
