"""Unit tests for the server time schema and router (FEAT-1)."""

from datetime import datetime, timedelta, timezone
from unittest.mock import patch

import pytest
from fastapi import Response
from pydantic import ValidationError

from app.routers import server_time
from app.schemas.server_time import ServerTimeResponse

FIXED_INSTANT = datetime(2026, 10, 19, 9, 15, 3, 123456, tzinfo=timezone.utc)


def test_schema_dump_has_exactly_now_and_timezone():
    """Happy path: the JSON shape is exactly the two documented fields."""
    body = ServerTimeResponse(now=FIXED_INSTANT, timezone="UTC").model_dump(mode="json")

    assert set(body) == {"now", "timezone"}
    assert body["timezone"] == "UTC"


def test_schema_serialises_now_with_exact_plus_zero_offset():
    """Happy path: the exact string for a fixed instant ends `+00:00`, not `Z`."""
    body = ServerTimeResponse(now=FIXED_INSTANT, timezone="UTC").model_dump(mode="json")

    assert body["now"] == "2026-10-19T09:15:03.123456+00:00"


def test_schema_converts_non_utc_aware_input_to_same_instant_in_utc():
    """Edge case: a +02:00 input serialises as the same instant ending `+00:00`."""
    local = FIXED_INSTANT.astimezone(timezone(timedelta(hours=2)))

    body = ServerTimeResponse(now=local, timezone="UTC").model_dump(mode="json")

    assert body["now"] == "2026-10-19T09:15:03.123456+00:00"


def test_schema_rejects_naive_now():
    """Error case: a naive datetime is rejected."""
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=datetime(2026, 10, 19, 9, 15, 3), timezone="UTC")


def test_schema_rejects_timezone_other_than_utc():
    """Error case: only the literal UTC is accepted for timezone."""
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=FIXED_INSTANT, timezone="CET")


def test_route_is_declared_once_with_schema_response_model():
    """Happy path: one /api/time route whose response_model is the schema."""
    routes = [route for route in server_time.router.routes if route.path == "/api/time"]

    assert len(routes) == 1
    assert routes[0].response_model is ServerTimeResponse


def test_handler_reads_clock_on_every_call():
    """Edge case: two calls with a patched clock return two different readings."""
    first = FIXED_INSTANT
    second = FIXED_INSTANT + timedelta(seconds=1)

    with patch.object(server_time, "datetime") as fake_datetime:
        fake_datetime.now.side_effect = [first, second]
        first_response = server_time.get_server_time(Response())
        second_response = server_time.get_server_time(Response())

    assert first_response.now == first
    assert second_response.now == second
    assert first_response.timezone == "UTC"


def test_handler_sets_cache_control_no_store_on_the_response():
    """Happy path (BUG-01): the handler marks the response uncacheable."""
    response = Response()

    server_time.get_server_time(response)

    assert response.headers["Cache-Control"] == "no-store"
