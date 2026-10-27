"""Unit tests for the UptimeResponse schema (TEST-07)."""

from datetime import UTC, datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.schemas.uptime import UptimeResponse


def test_started_at_in_utc_serialises_with_plus_zero_offset_never_z():
    """Happy path: UTC renders as +00:00, not Z."""
    response = UptimeResponse(
        uptime_seconds=1.5,
        started_at=datetime(2026, 10, 27, 16, 33, 15, 482913, tzinfo=UTC),
    )

    dumped = response.model_dump(mode="json")

    assert dumped["started_at"] == "2026-10-27T16:33:15.482913+00:00"
    assert not dumped["started_at"].endswith("Z")
    assert dumped["uptime_seconds"] == 1.5


def test_started_at_with_other_offset_is_converted_to_utc():
    """Edge case: +02:00 input renders as the same instant in +00:00."""
    plus_two = timezone(timedelta(hours=2))
    response = UptimeResponse(
        uptime_seconds=0.0,
        started_at=datetime(2026, 10, 27, 18, 33, 15, tzinfo=plus_two),
    )

    assert response.model_dump(mode="json")["started_at"] == "2026-10-27T16:33:15+00:00"


def test_naive_started_at_is_rejected():
    """Error case: a naive datetime raises ValidationError."""
    with pytest.raises(ValidationError):
        UptimeResponse(uptime_seconds=1.0, started_at=datetime(2026, 10, 27, 16, 33, 15))


def test_negative_uptime_seconds_is_rejected():
    """Error case: negative uptime raises ValidationError."""
    with pytest.raises(ValidationError):
        UptimeResponse(uptime_seconds=-0.1, started_at=datetime.now(UTC))
