"""Unit tests for the ServerTimeResponse schema (FEAT-1)."""

from datetime import datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.schemas.server_time import ServerTimeResponse


def test_server_time_response_serializes_now_with_plus_zero_offset_suffix():
    """Happy path: a UTC value serialises with the exact +00:00 suffix, not Z."""
    response = ServerTimeResponse(now=datetime(2026, 11, 19, 10, 0, 0, 123456, tzinfo=timezone.utc))

    body = response.model_dump(mode="json")

    assert body["now"] == "2026-11-19T10:00:00.123456+00:00"


def test_server_time_response_normalises_aware_non_utc_to_utc():
    """Edge case: an aware non-UTC value is converted to UTC before output."""
    plus_two = timezone(timedelta(hours=2))
    response = ServerTimeResponse(now=datetime(2026, 11, 19, 12, 0, 0, tzinfo=plus_two))

    body = response.model_dump(mode="json")

    assert body["now"] == "2026-11-19T10:00:00+00:00"


def test_server_time_response_rejects_naive_datetime():
    """Error case: a naive datetime raises ValidationError."""
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=datetime(2026, 11, 19, 10, 0, 0))


def test_server_time_response_timezone_is_fixed_utc():
    """Happy path: timezone defaults to UTC and no other value is accepted."""
    now = datetime(2026, 11, 19, 10, 0, 0, tzinfo=timezone.utc)

    assert ServerTimeResponse(now=now).timezone == "UTC"
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=now, timezone="CET")
