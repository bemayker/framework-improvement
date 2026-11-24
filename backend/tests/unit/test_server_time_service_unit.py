"""Unit tests for the server time service and schema (FEAT-1, BUG-01)."""

from datetime import UTC, datetime, timedelta

import pytest
from pydantic import ValidationError

from app.schemas.server_time import ServerTimeResponse
from app.services import server_time_service


def test_get_server_time_returns_aware_utc_datetime():
    """Happy path: the value is timezone-aware with a zero UTC offset."""
    value = server_time_service.get_server_time()

    assert value.tzinfo is not None
    assert value.utcoffset() == timedelta(0)


def test_get_server_time_returns_fresh_value_per_call(monkeypatch):
    """Edge case: the clock is read on each call, not cached at import."""
    ticks = iter(
        [
            datetime(2026, 11, 24, 20, 0, 0, tzinfo=UTC),
            datetime(2026, 11, 24, 20, 0, 1, tzinfo=UTC),
        ]
    )

    class FakeDatetime:
        """Stand-in for the datetime class that serves the next tick."""

        @staticmethod
        def now(tz):
            """Return the next scripted instant."""
            return next(ticks)

    monkeypatch.setattr(server_time_service, "datetime", FakeDatetime)

    first = server_time_service.get_server_time()
    second = server_time_service.get_server_time()

    assert first != second


def test_server_time_response_rejects_naive_datetime():
    """Error case: a naive datetime fails schema validation."""
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=datetime(2026, 11, 24, 20, 0, 0), timezone="UTC")
