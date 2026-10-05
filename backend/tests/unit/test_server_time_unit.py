"""Unit tests for the server time schema and handler (FEAT-1)."""

import time
from datetime import UTC, datetime, timedelta, timezone

import pytest
from fastapi import Response
from pydantic import ValidationError

from app.routers.server_time import get_server_time
from app.schemas.server_time import UTC_OFFSET_SUFFIX, ServerTimeResponse


def test_schema_dump_has_exactly_now_and_timezone():
    """Happy path: the serialised body has the two contract keys."""
    body = ServerTimeResponse(now=datetime(2026, 10, 5, 14, 0, tzinfo=UTC)).model_dump(
        mode="json"
    )

    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"


def test_schema_serialises_now_with_exact_plus_zero_offset_suffix():
    """Edge case: the suffix is exactly `+00:00`, never `Z`."""
    body = ServerTimeResponse(
        now=datetime(2026, 10, 5, 14, 0, 1, 123456, tzinfo=UTC)
    ).model_dump(mode="json")

    assert body["now"] == "2026-10-05T14:00:01.123456+00:00"
    assert body["now"].endswith(UTC_OFFSET_SUFFIX)
    assert "Z" not in body["now"]


def test_schema_converts_non_utc_input_to_utc():
    """Edge case: a +02:00 input is serialised as the same instant in UTC."""
    plus_two = timezone(timedelta(hours=2))

    body = ServerTimeResponse(
        now=datetime(2026, 10, 5, 16, 0, tzinfo=plus_two)
    ).model_dump(mode="json")

    assert body["now"] == "2026-10-05T14:00:00+00:00"


def test_schema_rejects_naive_datetime():
    """Error case: a naive `now` is refused at construction."""
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=datetime(2026, 10, 5, 14, 0))


def test_schema_rejects_timezone_other_than_utc():
    """Error case: `timezone` is fixed to the literal UTC."""
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=datetime(2026, 10, 5, tzinfo=UTC), timezone="CET")


def test_handler_returns_schema_with_aware_utc_now():
    """Criterion 3: the handler returns the Pydantic schema, aware and in UTC."""
    result = get_server_time(Response())

    assert isinstance(result, ServerTimeResponse)
    assert result.now.utcoffset() == timedelta(0)
    assert result.timezone == "UTC"


def test_handler_computes_now_per_call():
    """Criterion 2: two calls give a strictly later second `now`."""
    first = get_server_time(Response())
    time.sleep(0.01)
    second = get_server_time(Response())

    assert second.now > first.now


def test_handler_sets_cache_control_no_store_on_response():
    """BUG-01 criterion 1: the handler marks its response uncacheable."""
    response = Response()

    get_server_time(response)

    assert response.headers["cache-control"] == "no-store"
