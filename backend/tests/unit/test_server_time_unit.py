"""Unit tests for the server time schema and clock dependency (FEAT-1)."""

from datetime import UTC, datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.routers.server_time import utc_now
from app.schemas.server_time import UTC_OFFSET_SUFFIX, ServerTimeResponse


def test_serialize_utc_value_ends_with_exact_plus_zero_offset():
    """Happy path: the pinned suffix is +00:00, never Z."""
    response = ServerTimeResponse(now=datetime(2026, 11, 2, 15, 50, 5, 123456, tzinfo=UTC))

    payload = response.model_dump(mode="json")

    assert payload["now"] == "2026-11-02T15:50:05.123456+00:00"
    assert payload["now"].endswith(UTC_OFFSET_SUFFIX)
    assert not payload["now"].endswith("Z")
    assert payload["timezone"] == "UTC"


def test_serialize_non_utc_value_converts_to_same_instant_in_utc():
    """Edge case: an aware +02:00 value is emitted in UTC, same instant."""
    plus_two = timezone(timedelta(hours=2))
    response = ServerTimeResponse(now=datetime(2026, 11, 2, 17, 50, 5, tzinfo=plus_two))

    assert response.model_dump(mode="json")["now"] == "2026-11-02T15:50:05+00:00"


def test_serialize_zero_microseconds_still_carries_offset():
    """Edge case: a whole-second value keeps the explicit offset."""
    response = ServerTimeResponse(now=datetime(2026, 11, 2, 15, 50, 5, tzinfo=UTC))

    assert response.model_dump(mode="json")["now"].endswith(UTC_OFFSET_SUFFIX)


def test_construct_with_naive_datetime_raises_validation_error():
    """Error case: a naive datetime is rejected, so it can never reach the wire."""
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=datetime(2026, 11, 2, 15, 50, 5))


def test_construct_with_other_timezone_literal_raises_validation_error():
    """Error case: the timezone field only accepts the literal UTC."""
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=datetime.now(UTC), timezone="CET")


def test_utc_now_returns_aware_utc_datetime():
    """utc_now reads a timezone-aware clock with a zero offset."""
    value = utc_now()

    assert value.utcoffset() == timedelta(0)
