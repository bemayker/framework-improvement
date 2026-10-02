"""Unit tests for the server time schema and handler (FEAT-1)."""

from datetime import UTC, datetime, timedelta, timezone

import pytest
from fastapi import Response
from pydantic import ValidationError

from app.routers.server_time import NO_STORE, get_time
from app.schemas.server_time import ServerTimeResponse


def test_server_time_response_dumps_exact_shape_with_plus_zero_suffix():
    now = datetime(2026, 10, 2, 10, 42, 41, 123456, tzinfo=UTC)

    dumped = ServerTimeResponse(now=now).model_dump(mode="json")

    assert dumped == {"now": "2026-10-02T10:42:41.123456+00:00", "timezone": "UTC"}
    assert dumped["now"].endswith("+00:00")


def test_server_time_response_converts_non_utc_input_to_utc():
    plus_two = timezone(timedelta(hours=2))
    now = datetime(2026, 10, 2, 12, 42, 41, 123456, tzinfo=plus_two)

    dumped = ServerTimeResponse(now=now).model_dump(mode="json")

    assert dumped["now"] == "2026-10-02T10:42:41.123456+00:00"


def test_server_time_response_rejects_naive_datetime():
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=datetime(2026, 10, 2, 10, 42, 41))


def test_server_time_response_rejects_non_utc_timezone_label():
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=datetime.now(UTC), timezone="Europe/Brussels")


def test_get_time_returns_now_within_call_window_and_increases():
    before_first = datetime.now(UTC)
    first = get_time(Response())
    after_first = datetime.now(UTC)
    before_second = datetime.now(UTC)
    second = get_time(Response())
    after_second = datetime.now(UTC)

    assert before_first <= first.now <= after_first
    assert before_second <= second.now <= after_second
    assert second.now > first.now
    assert first.now.utcoffset() == timedelta(0)


def test_get_time_sets_cache_control_no_store_on_response():
    response = Response()

    get_time(response)

    assert NO_STORE == "no-store"
    assert response.headers["cache-control"] == NO_STORE
