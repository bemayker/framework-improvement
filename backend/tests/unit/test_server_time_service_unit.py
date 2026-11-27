"""Unit tests for the server-time service and schema (BUG-01)."""

from datetime import datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.schemas.server_time import ServerTimeResponse
from app.services import server_time_service
from app.services.server_time_service import SERVER_TIMEZONE, get_server_time


def test_get_server_time_returns_aware_utc_value():
    """Happy path: the value is timezone-aware with a zero UTC offset."""
    value = get_server_time()

    assert value.tzinfo is not None
    assert value.utcoffset() == timedelta(0)


def test_get_server_time_returns_new_value_per_call(monkeypatch):
    """Edge case: each call reads the clock, so a later instant is returned."""
    instants = iter(
        [
            datetime(2026, 11, 27, 16, 0, 0, tzinfo=timezone.utc),
            datetime(2026, 11, 27, 16, 0, 1, tzinfo=timezone.utc),
        ]
    )
    monkeypatch.setattr(server_time_service, "_utc_now", lambda: next(instants))

    first = get_server_time()
    second = get_server_time()

    assert second - first == timedelta(seconds=1)


def test_server_time_response_refuses_a_naive_datetime():
    """Error case: a datetime with no offset is rejected by the schema."""
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=datetime(2026, 11, 27, 16, 0, 0), timezone=SERVER_TIMEZONE)


def test_server_time_response_serialises_now_with_explicit_offset():
    """Edge case: the JSON carries `+00:00`, not Pydantic's default `Z`."""
    response = ServerTimeResponse(
        now=datetime(2026, 11, 27, 16, 0, 0, 123456, tzinfo=timezone.utc),
        timezone=SERVER_TIMEZONE,
    )

    assert response.model_dump(mode="json") == {
        "now": "2026-11-27T16:00:00.123456+00:00",
        "timezone": "UTC",
    }
