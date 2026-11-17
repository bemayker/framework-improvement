"""Unit tests for the server time schema and clock dependency (FEAT-1)."""

from datetime import datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.routers.server_time import current_utc_time
from app.schemas.server_time import ServerTimeResponse


def test_server_time_response_serialises_now_with_plus_zero_offset():
    """Offset is pinned to +00:00, never Z."""
    response = ServerTimeResponse(now=datetime(2026, 1, 1, 12, 30, tzinfo=timezone.utc))

    now = response.model_dump(mode="json")["now"]

    assert now == "2026-01-01T12:30:00+00:00"
    assert now.endswith("+00:00")
    assert not now.endswith("Z")


def test_server_time_response_timezone_is_utc():
    """The timezone field is always the literal UTC."""
    response = ServerTimeResponse(now=datetime(2026, 1, 1, tzinfo=timezone.utc))

    assert response.model_dump(mode="json")["timezone"] == "UTC"


def test_server_time_response_rejects_naive_datetime():
    """A naive datetime is refused at construction."""
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=datetime(2026, 1, 1, 12, 0))


def test_server_time_response_converts_non_utc_time_to_utc():
    """An aware non-UTC input is converted to UTC on the wire."""
    plus_two = timezone(timedelta(hours=2))
    response = ServerTimeResponse(now=datetime(2026, 1, 1, 14, 0, tzinfo=plus_two))

    assert response.model_dump(mode="json")["now"] == "2026-01-01T12:00:00+00:00"


def test_current_utc_time_returns_aware_utc_datetime():
    """The clock dependency yields an aware datetime with a zero UTC offset."""
    now = current_utc_time()

    assert now.tzinfo is not None
    assert now.utcoffset() == timedelta(0)
