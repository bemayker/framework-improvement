"""Unit tests for the server time schema and router handler (FEAT-1)."""

import json
from datetime import UTC, datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.routers import server_time as server_time_router
from app.schemas.server_time import UTC_OFFSET_SUFFIX, ServerTimeResponse

FIXED_NOW = datetime(2026, 11, 10, 12, 0, 0, 123456, tzinfo=UTC)


def test_server_time_response_serialises_now_with_plus_zero_offset_suffix():
    body = ServerTimeResponse(now=FIXED_NOW)

    dumped = body.model_dump(mode="json")["now"]
    dumped_json = json.loads(body.model_dump_json())["now"]

    assert UTC_OFFSET_SUFFIX == "+00:00"
    assert dumped.endswith("+00:00") and not dumped.endswith("Z")
    assert dumped_json.endswith("+00:00") and not dumped_json.endswith("Z")


def test_server_time_response_shape_has_now_and_utc_timezone():
    dumped = ServerTimeResponse(now=FIXED_NOW).model_dump(mode="json")

    assert set(dumped) == {"now", "timezone"}
    assert dumped["timezone"] == "UTC"


def test_server_time_response_normalises_non_utc_offset_to_utc():
    plus_two = timezone(timedelta(hours=2))
    body = ServerTimeResponse(now=datetime(2026, 11, 10, 12, 0, 0, tzinfo=plus_two))

    assert body.model_dump(mode="json")["now"] == "2026-11-10T10:00:00+00:00"


def test_server_time_response_with_naive_datetime_raises_validation_error():
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=datetime(2026, 11, 10, 12, 0, 0))


def test_server_time_response_with_non_utc_timezone_label_raises_validation_error():
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=FIXED_NOW, timezone="Europe/Brussels")


def test_current_utc_time_returns_aware_utc_datetime():
    value = server_time_router.current_utc_time()

    assert value.tzinfo is not None
    assert value.utcoffset() == timedelta(0)


def test_get_server_time_reads_clock_on_every_call(monkeypatch):
    readings = iter([FIXED_NOW, FIXED_NOW + timedelta(seconds=1)])
    monkeypatch.setattr(server_time_router, "current_utc_time", lambda: next(readings))

    first = server_time_router.get_server_time()
    second = server_time_router.get_server_time()

    assert first.now == FIXED_NOW
    assert second.now == FIXED_NOW + timedelta(seconds=1)
    assert first.now != second.now
