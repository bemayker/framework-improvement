"""Unit tests for the server time schema and router function (FEAT-1)."""

from datetime import UTC, datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.routers.server_time import get_server_time
from app.schemas.server_time import UTC_OFFSET_SUFFIX, ServerTimeResponse


def test_server_time_response_serializes_now_with_plus_zero_offset_suffix():
    """Happy path: an aware UTC time dumps with `+00:00`, never `Z`."""
    response = ServerTimeResponse(now=datetime(2026, 1, 2, 3, 4, 5, tzinfo=UTC))

    dumped = response.model_dump(mode="json")

    assert dumped == {"now": "2026-01-02T03:04:05+00:00", "timezone": "UTC"}
    assert dumped["now"].endswith(UTC_OFFSET_SUFFIX)
    assert not dumped["now"].endswith("Z")


def test_server_time_response_converts_non_utc_aware_time_to_utc():
    """Edge case: a +02:00 input is converted to UTC on output."""
    plus_two = timezone(timedelta(hours=2))

    response = ServerTimeResponse(now=datetime(2026, 1, 2, 5, 4, 5, tzinfo=plus_two))

    assert response.model_dump(mode="json")["now"] == "2026-01-02T03:04:05+00:00"


def test_server_time_response_rejects_naive_datetime():
    """Error case: a datetime with no tzinfo is refused."""
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=datetime(2026, 1, 2, 3, 4, 5))


def test_server_time_response_timezone_is_utc():
    """Edge case: timezone defaults to UTC and accepts nothing else."""
    now = datetime(2026, 1, 2, 3, 4, 5, tzinfo=UTC)

    assert ServerTimeResponse(now=now).timezone == "UTC"
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=now, timezone="CET")


def test_get_server_time_reads_clock_on_every_call(monkeypatch):
    """Freshness: each call reads the clock again rather than caching."""
    first = datetime(2026, 1, 2, 3, 4, 5, tzinfo=UTC)
    readings = iter([first, first + timedelta(seconds=1)])
    monkeypatch.setattr(
        "app.routers.server_time.current_utc_time", lambda: next(readings)
    )

    first_response = get_server_time()
    second_response = get_server_time()

    assert second_response.now - first_response.now == timedelta(seconds=1)
