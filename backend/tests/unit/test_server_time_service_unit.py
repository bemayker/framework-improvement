"""Unit tests for the server time service and schema (FEAT-1, BUG-01)."""

from datetime import datetime, timedelta, timezone
from unittest.mock import patch

import pytest
from pydantic import ValidationError

from app.schemas.server_time import ServerTimeResponse
from app.services import server_time_service
from app.services.server_time_service import get_server_time


def test_get_server_time_returns_utc_aware_datetime():
    """Happy path: the value is timezone-aware with a zero UTC offset."""
    value = get_server_time()

    assert value.tzinfo is not None
    assert value.utcoffset() == timedelta(0)


def test_get_server_time_returns_fresh_value_per_call():
    """Edge case: two calls return the two clock readings, so nothing is cached."""
    first = datetime(2026, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
    second = datetime(2026, 1, 1, 0, 0, 1, tzinfo=timezone.utc)

    with patch.object(server_time_service, "datetime") as fake_datetime:
        fake_datetime.now.side_effect = [first, second]
        results = [get_server_time(), get_server_time()]

    assert results == [first, second]


def test_server_time_response_serialises_explicit_utc_offset():
    """Happy path: the serialised `now` ends in an explicit UTC offset."""
    body = ServerTimeResponse(
        now=datetime(2026, 11, 27, 17, 45, 12, 345678, tzinfo=timezone.utc),
        timezone="UTC",
    )

    assert body.model_dump(mode="json") == {
        "now": "2026-11-27T17:45:12.345678Z",
        "timezone": "UTC",
    }


def test_server_time_response_rejects_naive_datetime():
    """Error case: a datetime with no offset is refused."""
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=datetime(2026, 11, 27, 17, 45, 12), timezone="UTC")
