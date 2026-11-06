"""Unit tests for the server time schema and handler (FEAT-1)."""

from datetime import UTC, datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.routers import server_time
from app.schemas.server_time import ServerTimeResponse


def test_server_time_response_serializes_now_with_plus_00_00_suffix():
    """Happy path: a UTC instant dumps with the exact `+00:00` offset, not `Z`."""
    instant = datetime(2026, 11, 6, 10, 38, 10, 123456, tzinfo=UTC)

    dumped = ServerTimeResponse(now=instant, timezone="UTC").model_dump(mode="json")

    assert dumped == {"now": "2026-11-06T10:38:10.123456+00:00", "timezone": "UTC"}
    assert dumped["now"].endswith("+00:00")
    assert not dumped["now"].endswith("Z")


def test_server_time_response_normalises_non_utc_offset_to_utc():
    """Edge case: an aware +02:00 input is reported as the same instant in UTC."""
    instant = datetime(2026, 11, 6, 12, 0, 0, tzinfo=timezone(timedelta(hours=2)))

    dumped = ServerTimeResponse(now=instant, timezone="UTC").model_dump(mode="json")

    assert dumped["now"] == "2026-11-06T10:00:00+00:00"


def test_server_time_response_rejects_naive_datetime():
    """Error case: a naive datetime cannot be reported."""
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=datetime(2026, 11, 6, 10, 0, 0), timezone="UTC")


def test_server_time_response_rejects_non_utc_timezone_label():
    """Error case: the timezone label is always the literal UTC."""
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=datetime(2026, 11, 6, tzinfo=UTC), timezone="Europe/Brussels")


def test_get_server_time_reads_the_clock_per_call(monkeypatch):
    """Freshness: each call reads the clock again rather than caching a value."""
    first = datetime(2026, 11, 6, 10, 0, 0, tzinfo=UTC)
    instants = iter([first, first + timedelta(seconds=1)])
    monkeypatch.setattr(server_time, "utc_now", lambda: next(instants))

    one = server_time.get_server_time()
    two = server_time.get_server_time()

    assert two.now - one.now == timedelta(seconds=1)
    assert one.timezone == "UTC"
    assert two.timezone == "UTC"
