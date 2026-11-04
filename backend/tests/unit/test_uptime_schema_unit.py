"""Unit tests for the uptime response schema (TEST-07)."""

from datetime import UTC, datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.schemas.uptime import UptimeResponse


def test_started_at_serialises_with_plus_zero_offset():
    """Happy path: UTC value ends in +00:00 (not Z) and round-trips."""
    started = datetime(2026, 11, 4, 18, 18, 0, 123456, tzinfo=UTC)

    dumped = UptimeResponse(uptime_seconds=1.5, started_at=started).model_dump(mode="json")

    assert dumped["started_at"].endswith("+00:00")
    assert datetime.fromisoformat(dumped["started_at"]) == started


def test_started_at_with_other_offset_is_converted_to_utc():
    """Edge case: a +02:00 input is emitted converted to +00:00."""
    started = datetime(2026, 11, 4, 20, 0, 0, tzinfo=timezone(timedelta(hours=2)))

    dumped = UptimeResponse(uptime_seconds=0.0, started_at=started).model_dump(mode="json")

    assert dumped["started_at"] == "2026-11-04T18:00:00+00:00"


def test_zero_uptime_is_accepted():
    """Boundary: zero is non-negative."""
    assert UptimeResponse(uptime_seconds=0.0, started_at=datetime.now(UTC)).uptime_seconds == 0.0


def test_naive_started_at_is_rejected():
    """Error case: a timezone-less datetime can never reach the wire."""
    with pytest.raises(ValidationError):
        UptimeResponse(uptime_seconds=1.0, started_at=datetime(2026, 11, 4, 18, 0, 0))


def test_negative_uptime_is_rejected():
    """Error case: uptime must be non-negative."""
    with pytest.raises(ValidationError):
        UptimeResponse(uptime_seconds=-1.0, started_at=datetime.now(UTC))
