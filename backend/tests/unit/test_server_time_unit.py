"""Unit tests for the server time schema and handler (FEAT-1)."""

from datetime import datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.routers import server_time
from app.schemas.server_time import ServerTimeResponse


def test_server_time_response_serializes_now_with_plus_zero_offset_suffix():
    """Criteria 3 and 4: the JSON form ends in +00:00, with six fractional digits."""
    instant = datetime(2026, 11, 24, 4, 38, 10, 123456, tzinfo=timezone.utc)

    body = ServerTimeResponse(now=instant).model_dump(mode="json")

    assert body["now"] == "2026-11-24T04:38:10.123456+00:00"
    assert body["now"].endswith("+00:00")
    assert not body["now"].endswith("Z")


def test_server_time_response_rejects_naive_datetime():
    """Error case: a naive datetime is not accepted."""
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=datetime(2026, 11, 24, 4, 38, 10))


def test_server_time_response_converts_non_utc_aware_datetime_to_utc():
    """Edge case: an aware non-UTC instant is serialised as the same instant in UTC."""
    plus_two = timezone(timedelta(hours=2))
    instant = datetime(2026, 11, 24, 6, 38, 10, 0, tzinfo=plus_two)

    body = ServerTimeResponse(now=instant).model_dump(mode="json")

    assert body["now"] == "2026-11-24T04:38:10.000000+00:00"


def test_server_time_response_timezone_is_utc():
    """Happy path: timezone defaults to UTC and no other value is accepted."""
    instant = datetime(2026, 11, 24, 4, 38, 10, tzinfo=timezone.utc)

    assert ServerTimeResponse(now=instant).timezone == "UTC"
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=instant, timezone="CET")


def test_get_server_time_computes_now_per_call(monkeypatch):
    """Criterion 4: the handler reads the clock on every call, not once at import."""
    first = datetime(2026, 11, 24, 4, 0, 0, tzinfo=timezone.utc)
    second = first + timedelta(seconds=1)
    instants = iter([first, second])
    monkeypatch.setattr(server_time, "_utc_now", lambda: next(instants))

    first_response = server_time.get_server_time()
    second_response = server_time.get_server_time()

    assert first_response.now == first
    assert second_response.now == second
    assert first_response.now != second_response.now
