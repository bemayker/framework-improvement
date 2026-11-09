"""Unit tests for the server time response schema (FEAT-1)."""

from datetime import UTC, datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.schemas.server_time import ServerTimeResponse


def test_server_time_response_serialises_now_with_explicit_utc_offset():
    """Happy path: exact key set, +00:00 offset, parseable as aware."""
    instant = datetime(2026, 11, 9, 16, 53, 24, 123456, tzinfo=UTC)

    body = ServerTimeResponse(now=instant, timezone="UTC").model_dump(mode="json")

    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"
    assert body["now"] == "2026-11-09T16:53:24.123456+00:00"
    parsed = datetime.fromisoformat(body["now"])
    assert parsed.utcoffset() == timedelta(0)


def test_server_time_response_normalises_a_non_utc_aware_value_to_utc():
    """Edge case: a +02:00 input is emitted as the same instant at +00:00."""
    plus_two = timezone(timedelta(hours=2))
    instant = datetime(2026, 11, 9, 18, 0, 0, tzinfo=plus_two)

    body = ServerTimeResponse(now=instant, timezone="UTC").model_dump(mode="json")

    assert body["now"] == "2026-11-09T16:00:00+00:00"


def test_server_time_response_rejects_a_naive_datetime():
    """Error case: a naive datetime is refused at construction."""
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=datetime(2026, 11, 9, 16, 0, 0), timezone="UTC")


def test_server_time_response_rejects_a_timezone_other_than_utc():
    """Error case: the timezone field is the literal UTC."""
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=datetime.now(UTC), timezone="Europe/Brussels")
