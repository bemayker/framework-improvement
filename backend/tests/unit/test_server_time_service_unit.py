"""Unit tests for the server-time service and schema (FEAT-1, BUG-01)."""

from datetime import datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.schemas.server_time import ServerTimeResponse
from app.services import server_time_service


def test_get_current_utc_time_returns_timezone_aware_utc():
    """Happy path: the clock value is aware and at offset zero."""
    now = server_time_service.get_current_utc_time()

    assert now.tzinfo is not None
    assert now.utcoffset() == timedelta(0)


def test_get_current_utc_time_returns_fresh_value_per_call(monkeypatch):
    """Edge case: the value is read per call, never cached at import."""
    first = datetime(2026, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
    second = first + timedelta(seconds=1)
    values = iter([first, second])

    class FakeDatetime(datetime):
        @classmethod
        def now(cls, tz=None):
            return next(values)

    monkeypatch.setattr(server_time_service, "datetime", FakeDatetime)

    assert server_time_service.get_current_utc_time() == first
    assert server_time_service.get_current_utc_time() == second


def test_server_time_response_rejects_naive_datetime():
    """Error case: a naive datetime cannot build a response."""
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=datetime(2026, 1, 1, 0, 0, 0), timezone="UTC")
