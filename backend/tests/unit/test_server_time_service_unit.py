"""Unit tests for the server-time service and schema (FEAT-1, BUG-01)."""

from datetime import datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.schemas.server_time import ServerTimeResponse
from app.services import server_time_service
from app.services.server_time_service import UTC_TIMEZONE_NAME, get_current_utc_time


def test_get_current_utc_time_returns_aware_utc_datetime():
    """Happy path: the value is timezone-aware with a zero UTC offset."""
    now = get_current_utc_time()

    assert now.tzinfo is not None
    assert now.utcoffset() == timedelta(0)


def test_get_current_utc_time_returns_new_value_per_call(monkeypatch):
    """Edge case: the clock is read per call, so two calls follow the clock."""
    instants = iter(
        [
            datetime(2026, 11, 17, 2, 0, 0, tzinfo=timezone.utc),
            datetime(2026, 11, 17, 2, 0, 1, tzinfo=timezone.utc),
        ]
    )

    class FakeDatetime:
        @staticmethod
        def now(tz):
            return next(instants)

    monkeypatch.setattr(server_time_service, "datetime", FakeDatetime)

    assert get_current_utc_time() != get_current_utc_time()


def test_server_time_response_rejects_naive_datetime():
    """Error case: a naive datetime cannot be built into the response."""
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=datetime(2026, 11, 17, 2, 0, 0), timezone=UTC_TIMEZONE_NAME)
