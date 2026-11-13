"""Unit tests for the server time response schema (FEAT-1)."""

from datetime import UTC, datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.schemas.server_time import ServerTimeResponse


def test_server_time_response_serialises_now_with_plus_zero_offset():
    """Happy path: shape is exactly now and timezone, now ends in +00:00."""
    response = ServerTimeResponse(now=datetime(2026, 11, 13, 14, 57, 56, 123456, tzinfo=UTC))

    assert response.model_dump(mode="json") == {
        "now": "2026-11-13T14:57:56.123456+00:00",
        "timezone": "UTC",
    }


def test_server_time_response_rejects_naive_datetime():
    """Error case: a naive datetime is refused at construction."""
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=datetime(2026, 11, 13, 14, 57, 56))


def test_server_time_response_normalises_non_utc_aware_value_to_utc():
    """Edge case: an aware value in another zone is emitted in UTC."""
    plus_two = timezone(timedelta(hours=2))

    response = ServerTimeResponse(now=datetime(2026, 11, 13, 16, 0, 0, tzinfo=plus_two))

    assert response.model_dump(mode="json")["now"] == "2026-11-13T14:00:00+00:00"
