"""Unit tests for the server time service and schema (BUG-01)."""

from datetime import UTC, datetime, timedelta

import pytest
from pydantic import ValidationError

from app.schemas.server_time import ServerTimeResponse
from app.services import server_time_service


def test_get_server_time_returns_utc_aware_datetime():
    """Happy path: the value is timezone-aware with a zero UTC offset."""
    value = server_time_service.get_server_time()

    assert value.tzinfo is not None
    assert value.utcoffset() == timedelta(0)


def test_get_server_time_returns_a_new_value_per_call(monkeypatch):
    """Edge case: nothing is memoised, each call reads the clock again."""
    first = datetime(2026, 11, 25, 8, 0, 0, tzinfo=UTC)
    second = first + timedelta(seconds=1)
    instants = iter([first, second])
    monkeypatch.setattr(server_time_service, "_utc_now", lambda: next(instants))

    assert server_time_service.get_server_time() == first
    assert server_time_service.get_server_time() == second


def test_server_time_response_rejects_naive_datetime():
    """Error case: a naive datetime is a validation error."""
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=datetime(2026, 11, 25, 8, 0, 0), timezone="UTC")
