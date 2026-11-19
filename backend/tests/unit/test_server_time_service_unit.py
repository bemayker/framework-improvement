"""Unit tests for the server-time service and schema (FEAT-1, recreated by BUG-01)."""

from datetime import datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.schemas.server_time import ServerTimeResponse
from app.services import server_time_service


def test_get_server_time_returns_timezone_aware_utc():
    """Happy path: the time is aware and its UTC offset is zero."""
    value = server_time_service.get_server_time()

    assert value.tzinfo is not None
    assert value.utcoffset() == timedelta(0)


def test_get_server_time_is_computed_per_call(monkeypatch):
    """Edge case: two calls return two instants, nothing is cached."""
    first = datetime(2026, 11, 19, 1, 0, 0, tzinfo=timezone.utc)
    second = datetime(2026, 11, 19, 1, 0, 1, tzinfo=timezone.utc)
    instants = iter([first, second])
    monkeypatch.setattr(server_time_service, "utc_now", lambda: next(instants))

    assert server_time_service.get_server_time() == first
    assert server_time_service.get_server_time() == second


def test_server_time_response_rejects_naive_datetime():
    """Error case: a naive datetime is refused at the schema boundary."""
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=datetime(2026, 11, 19, 1, 0), timezone="UTC")


def test_server_time_response_serializes_explicit_utc_offset():
    """The wire form carries +00:00, not Z."""
    response = ServerTimeResponse(
        now=datetime(2026, 11, 19, 1, 0, tzinfo=timezone.utc), timezone="UTC"
    )

    assert response.model_dump(mode="json")["now"].endswith("+00:00")
