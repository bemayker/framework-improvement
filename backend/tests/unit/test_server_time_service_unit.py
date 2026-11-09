"""Unit tests for the server-time service and schema (BUG-01)."""

from datetime import UTC, datetime, timedelta

import pytest
from pydantic import ValidationError

from app.schemas.server_time import ServerTimeResponse
from app.services import server_time_service


def test_get_current_utc_time_returns_aware_utc_datetime():
    """Happy path: the result is timezone-aware with a zero UTC offset."""
    result = server_time_service.get_current_utc_time()

    assert result.tzinfo is not None
    assert result.utcoffset() == timedelta(0)


def test_get_current_utc_time_reads_the_clock_on_every_call(monkeypatch):
    """Edge case: two distinct clock instants both come through (no memoisation)."""
    first = datetime(2026, 11, 9, 20, 48, 23, tzinfo=UTC)
    second = first + timedelta(seconds=1)
    instants = iter([first, second])

    class FakeDatetime:
        @staticmethod
        def now(tz):
            assert tz is UTC
            return next(instants)

    monkeypatch.setattr(server_time_service, "datetime", FakeDatetime)

    assert server_time_service.get_current_utc_time() == first
    assert server_time_service.get_current_utc_time() == second


def test_server_time_response_serialises_explicit_offset():
    """Edge case: the wire format carries +00:00, not a Z suffix."""
    body = ServerTimeResponse(
        now=datetime(2026, 11, 9, 20, 48, 23, 512345, tzinfo=UTC), timezone="UTC"
    )

    assert body.model_dump(mode="json") == {
        "now": "2026-11-09T20:48:23.512345+00:00",
        "timezone": "UTC",
    }


def test_server_time_response_rejects_non_utc_timezone():
    """Error case: only the literal UTC is a valid timezone value."""
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=datetime.now(UTC), timezone="CET")
