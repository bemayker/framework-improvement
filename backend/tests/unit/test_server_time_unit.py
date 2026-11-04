"""Unit tests for the server time schema and handler (FEAT-1)."""

from datetime import UTC, datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.routers import server_time
from app.schemas.server_time import UTC_OFFSET_SUFFIX, ServerTimeResponse


def test_response_dumps_utc_value_with_plus_zero_offset():
    """Happy path: shape is exactly now and timezone, ending in +00:00."""
    instant = datetime(2026, 11, 4, 19, 5, 12, 345678, tzinfo=UTC)

    dumped = ServerTimeResponse(now=instant, timezone="UTC").model_dump(mode="json")

    assert dumped == {"now": "2026-11-04T19:05:12.345678+00:00", "timezone": "UTC"}
    assert dumped["now"].endswith(UTC_OFFSET_SUFFIX)
    assert not dumped["now"].endswith("Z")


def test_response_converts_non_utc_input_to_utc():
    """Edge case: a +02:00 input is dumped as the same instant in UTC."""
    instant = datetime(2026, 11, 4, 21, 0, 0, tzinfo=timezone(timedelta(hours=2)))

    dumped = ServerTimeResponse(now=instant, timezone="UTC").model_dump(mode="json")

    assert dumped["now"] == "2026-11-04T19:00:00+00:00"


def test_response_rejects_naive_datetime():
    """Error case: a naive datetime is never accepted."""
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=datetime(2026, 11, 4, 19, 0, 0), timezone="UTC")


def test_response_rejects_timezone_other_than_utc():
    """Error case: timezone is the literal UTC."""
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=datetime(2026, 11, 4, tzinfo=UTC), timezone="CET")


def test_utc_now_returns_aware_value_with_zero_offset():
    """Happy path: the clock seam yields an aware UTC value."""
    value = server_time.utc_now()

    assert value.utcoffset() == timedelta(0)


def test_get_server_time_reads_the_clock_on_every_call(monkeypatch):
    """Freshness: two calls return the two instants the clock supplied."""
    first = datetime(2026, 11, 4, 19, 0, 0, tzinfo=UTC)
    second = first + timedelta(seconds=1)
    instants = iter([first, second])
    monkeypatch.setattr(server_time, "utc_now", lambda: next(instants))

    first_response = server_time.get_server_time()
    second_response = server_time.get_server_time()

    assert first_response.now == first
    assert second_response.now == second
    assert first_response.timezone == "UTC"
