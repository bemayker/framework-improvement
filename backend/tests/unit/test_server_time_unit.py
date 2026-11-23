"""Unit tests for the ServerTimeResponse schema (FEAT-1)."""

from datetime import UTC, datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.schemas.server_time import ServerTimeResponse


def test_server_time_response_dumps_now_and_timezone_fields():
    """Happy path: the dump has exactly the `now` and `timezone` keys."""
    instant = datetime(2026, 11, 23, 10, 14, 34, 123456, tzinfo=UTC)

    dumped = ServerTimeResponse(now=instant).model_dump(mode="json")

    assert dumped == {"now": "2026-11-23T10:14:34.123456+00:00", "timezone": "UTC"}


def test_server_time_response_serialises_now_with_plus_00_00_suffix():
    """The offset is pinned to `+00:00`, never `Z`."""
    instant = datetime(2026, 11, 23, 10, 14, 34, tzinfo=UTC)

    serialised = ServerTimeResponse(now=instant).model_dump(mode="json")["now"]

    assert serialised.endswith("+00:00")
    assert "Z" not in serialised
    assert serialised == "2026-11-23T10:14:34.000000+00:00"


def test_server_time_response_converts_non_utc_aware_datetime_to_utc():
    """Edge case: an aware non-UTC input becomes the same instant in UTC."""
    plus_two = timezone(timedelta(hours=2))
    instant = datetime(2026, 11, 23, 12, 0, 0, tzinfo=plus_two)

    serialised = ServerTimeResponse(now=instant).model_dump(mode="json")["now"]

    assert serialised == "2026-11-23T10:00:00.000000+00:00"


def test_server_time_response_rejects_naive_datetime():
    """Error case: a naive datetime raises ValidationError."""
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=datetime(2026, 11, 23, 10, 0, 0))
