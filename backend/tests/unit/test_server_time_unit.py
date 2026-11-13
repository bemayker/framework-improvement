"""Unit tests for the server time schema and clock (FEAT-1)."""

from datetime import UTC, datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.routers.server_time import utc_now
from app.schemas.server_time import UTC_OFFSET_SUFFIX, ServerTimeResponse


def test_server_time_response_serializes_now_with_plus_zero_offset():
    response = ServerTimeResponse(now=datetime(2026, 1, 1, 12, 0, 0, tzinfo=UTC))

    now = response.model_dump(mode="json")["now"]

    assert now == "2026-01-01T12:00:00.000000+00:00"
    assert now.endswith(UTC_OFFSET_SUFFIX)
    assert UTC_OFFSET_SUFFIX == "+00:00"
    assert "Z" not in now


def test_server_time_response_converts_aware_datetime_to_utc():
    plus_two = timezone(timedelta(hours=2))
    response = ServerTimeResponse(now=datetime(2026, 1, 1, 14, 0, 0, tzinfo=plus_two))

    assert response.model_dump(mode="json")["now"] == "2026-01-01T12:00:00.000000+00:00"


def test_server_time_response_rejects_naive_datetime():
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=datetime(2026, 1, 1, 12, 0, 0))


def test_server_time_response_timezone_is_utc():
    response = ServerTimeResponse(now=datetime(2026, 1, 1, tzinfo=UTC))

    assert response.timezone == "UTC"
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=datetime(2026, 1, 1, tzinfo=UTC), timezone="CET")


def test_utc_now_returns_aware_utc_datetime():
    value = utc_now()

    assert value.tzinfo is not None
    assert value.utcoffset() == timedelta(0)
