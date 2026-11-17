"""Unit tests for the server time response schema (FEAT-1)."""

from datetime import datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.schemas.server_time import ServerTimeResponse


def test_server_time_response_serialises_now_with_plus_00_00_suffix():
    """Criteria 3 and 4: the offset is exactly +00:00, fixed width, never Z."""
    instant = datetime(2026, 11, 17, 0, 30, 43, 120000, tzinfo=timezone.utc)

    dumped = ServerTimeResponse(now=instant).model_dump(mode="json")

    assert dumped["now"] == "2026-11-17T00:30:43.120000+00:00"
    assert not dumped["now"].endswith("Z")


def test_server_time_response_serialises_zero_microseconds_fixed_width():
    """Edge case: a zero microsecond still prints six fractional digits."""
    instant = datetime(2026, 11, 17, 0, 30, 43, tzinfo=timezone.utc)

    dumped = ServerTimeResponse(now=instant).model_dump(mode="json")

    assert dumped["now"] == "2026-11-17T00:30:43.000000+00:00"


def test_server_time_response_rejects_naive_datetime():
    """Criterion 2: a naive datetime is refused at construction."""
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=datetime(2026, 11, 17, 0, 30, 43))


def test_server_time_response_converts_non_utc_offset_to_utc():
    """Criterion 2: an aware +02:00 value serialises as the same instant in UTC."""
    plus_two = timezone(timedelta(hours=2))
    instant = datetime(2026, 11, 17, 2, 30, 43, 5, tzinfo=plus_two)

    dumped = ServerTimeResponse(now=instant).model_dump(mode="json")

    assert dumped["now"] == "2026-11-17T00:30:43.000005+00:00"


def test_server_time_response_timezone_is_utc():
    """Criterion 3: timezone defaults to and dumps as the literal UTC."""
    instant = datetime(2026, 11, 17, tzinfo=timezone.utc)

    assert ServerTimeResponse(now=instant).model_dump(mode="json")["timezone"] == "UTC"
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=instant, timezone="CET")
