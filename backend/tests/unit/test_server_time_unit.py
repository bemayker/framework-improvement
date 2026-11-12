"""Unit tests for the server time schema and clock (FEAT-1)."""

from datetime import datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.routers.server_time import utc_now
from app.schemas.server_time import ServerTimeResponse

FIXED_UTC = datetime(2026, 11, 12, 22, 28, 59, tzinfo=timezone.utc)


def test_server_time_response_serializes_now_with_plus_zero_offset_suffix():
    """Happy path: the offset is the numeric +00:00, never Z."""
    payload = ServerTimeResponse(now=FIXED_UTC).model_dump(mode="json")

    assert payload["now"] == "2026-11-12T22:28:59+00:00"
    assert payload["now"].endswith("+00:00")
    assert not payload["now"].endswith("Z")


def test_server_time_response_has_now_and_timezone_utc_fields():
    """Shape: exactly the two contract keys, timezone fixed to UTC."""
    payload = ServerTimeResponse(now=FIXED_UTC).model_dump(mode="json")

    assert set(payload) == {"now", "timezone"}
    assert payload["timezone"] == "UTC"


def test_server_time_response_converts_non_utc_aware_datetime_to_utc():
    """Edge case: a +02:00 input is the same instant serialized in UTC."""
    plus_two = timezone(timedelta(hours=2))
    local = datetime(2026, 11, 13, 0, 28, 59, tzinfo=plus_two)

    payload = ServerTimeResponse(now=local).model_dump(mode="json")

    assert payload["now"] == "2026-11-12T22:28:59+00:00"


def test_server_time_response_rejects_naive_datetime():
    """Error case: a naive datetime cannot build the response."""
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=datetime(2026, 11, 12, 22, 28, 59))


def test_utc_now_returns_timezone_aware_utc_datetime():
    """The clock returns an aware datetime with a zero UTC offset."""
    value = utc_now()

    assert value.tzinfo is not None
    assert value.utcoffset() == timedelta(0)
