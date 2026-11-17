"""Unit tests for the server-time service and schema (BUG-01)."""

from datetime import datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.schemas.server_time import ServerTimeResponse
from app.services.server_time_service import get_server_time


def test_get_server_time_returns_aware_utc_datetime():
    """Happy path: the value is timezone-aware with a zero UTC offset."""
    value = get_server_time()

    assert value.tzinfo is not None
    assert value.utcoffset() == timedelta(0)


def test_get_server_time_returns_a_new_value_per_call():
    """Edge case: the time is computed per call, never reused."""
    first = get_server_time()
    second = get_server_time()

    assert second >= first
    assert first is not second


def test_server_time_response_rejects_naive_datetime():
    """Error case: a naive datetime is not a valid `now`."""
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=datetime(2026, 11, 17, 1, 23, 45), timezone="UTC")


def test_server_time_response_serialises_now_with_explicit_offset():
    """Edge case: the serialised `now` ends in an explicit UTC offset."""
    body = ServerTimeResponse(
        now=datetime(2026, 11, 17, 1, 23, 45, tzinfo=timezone.utc), timezone="UTC"
    ).model_dump_json()

    assert '"now":"2026-11-17T01:23:45Z"' in body
