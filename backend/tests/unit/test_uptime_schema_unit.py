"""Unit tests for the uptime response schema and route model (TEST-07)."""

from datetime import datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.routers.uptime import router as uptime_router
from app.schemas.uptime import UptimeResponse


def test_uptime_response_serialises_started_at_with_explicit_utc_offset():
    """Happy path: the JSON form ends in +00:00, not Z."""
    started_at = datetime(2026, 11, 25, 1, 45, 47, 123456, tzinfo=timezone.utc)

    body = UptimeResponse(uptime_seconds=1.5, started_at=started_at).model_dump(mode="json")

    assert body == {
        "uptime_seconds": 1.5,
        "started_at": "2026-11-25T01:45:47.123456+00:00",
    }


def test_uptime_response_converts_non_utc_started_at_to_utc():
    """Edge case: an aware value in another zone is normalised to UTC."""
    plus_two = timezone(timedelta(hours=2))
    started_at = datetime(2026, 11, 25, 3, 45, 47, tzinfo=plus_two)

    body = UptimeResponse(uptime_seconds=0, started_at=started_at).model_dump(mode="json")

    assert body["started_at"] == "2026-11-25T01:45:47+00:00"


def test_uptime_response_rejects_naive_started_at():
    """Error case: a naive datetime has no offset and is refused."""
    with pytest.raises(ValidationError):
        UptimeResponse(uptime_seconds=1.0, started_at=datetime(2026, 11, 25, 1, 45, 47))


def test_uptime_route_declares_uptime_response_schema():
    """The route's declared response model is the schema in app.schemas.uptime."""
    route = next(
        route for route in uptime_router.routes if route.path == "/api/uptime"
    )

    assert route.response_model is UptimeResponse
