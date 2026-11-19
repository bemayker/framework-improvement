"""Unit tests for the server time service and schema (FEAT-1, BUG-01)."""

from datetime import datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.schemas.server_time import ServerTimeResponse
from app.services import server_time_service
from app.services.server_time_service import get_server_time


def test_get_server_time_returns_aware_utc_datetime():
    """Happy path: the value is timezone-aware with a zero UTC offset."""
    now = get_server_time()

    assert now.tzinfo is not None
    assert now.utcoffset() == timedelta(0)


def test_get_server_time_computes_a_new_value_per_call(monkeypatch):
    """Edge case: two calls return the two clock readings, so nothing is cached."""
    readings = iter(
        [
            datetime(2026, 11, 19, 0, 0, 0, tzinfo=timezone.utc),
            datetime(2026, 11, 19, 0, 0, 1, tzinfo=timezone.utc),
        ]
    )

    class FakeDatetime:
        @staticmethod
        def now(tz):
            return next(readings)

    monkeypatch.setattr(server_time_service, "datetime", FakeDatetime)

    first = get_server_time()
    second = get_server_time()

    assert first != second
    assert second - first == timedelta(seconds=1)


def test_server_time_response_rejects_naive_datetime():
    """Error case: a datetime with no offset fails schema validation."""
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=datetime(2026, 11, 19, 0, 0, 0), timezone="UTC")
