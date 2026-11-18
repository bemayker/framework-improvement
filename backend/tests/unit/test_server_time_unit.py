"""Unit tests for the ServerTimeResponse schema (FEAT-1), fixed datetimes only."""

from datetime import UTC, datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.schemas.server_time import ServerTimeResponse

FIXED_UTC_INSTANT = datetime(2026, 11, 18, 0, 48, 50, 123456, tzinfo=UTC)


def test_server_time_response_dumps_now_and_timezone_only():
    """Shape: the JSON body has exactly the keys now and timezone, timezone UTC."""
    payload = ServerTimeResponse(now=FIXED_UTC_INSTANT).model_dump(mode="json")

    assert set(payload) == {"now", "timezone"}
    assert payload["timezone"] == "UTC"


def test_server_time_response_serialises_now_with_plus_zero_offset():
    """Offset: now ends in the literal +00:00 suffix, never Z."""
    payload = ServerTimeResponse(now=FIXED_UTC_INSTANT).model_dump(mode="json")

    assert payload["now"] == "2026-11-18T00:48:50.123456+00:00"
    assert payload["now"].endswith("+00:00")
    assert not payload["now"].endswith("Z")


def test_server_time_response_rejects_naive_datetime():
    """Error case: a naive datetime is rejected at construction."""
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=datetime(2026, 11, 18, 0, 48, 50))


def test_server_time_response_converts_non_utc_offset_to_utc():
    """Edge case: an aware non-UTC value serialises as the same instant in UTC."""
    plus_two = timezone(timedelta(hours=2))
    response = ServerTimeResponse(now=datetime(2026, 11, 18, 2, 0, 0, tzinfo=plus_two))

    assert response.model_dump(mode="json")["now"] == "2026-11-18T00:00:00+00:00"


def test_server_time_response_rejects_non_utc_timezone_literal():
    """Error case: the timezone field only accepts the literal UTC."""
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=FIXED_UTC_INSTANT, timezone="CET")
