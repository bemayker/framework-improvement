"""Unit tests for the uptime response schema (TEST-07)."""

from datetime import datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.main import create_app
from app.schemas.uptime import UptimeResponse


def test_uptime_response_is_defined_in_the_schemas_package():
    assert UptimeResponse.__module__ == "app.schemas.uptime"


def test_uptime_route_uses_uptime_response_as_response_model():
    app = create_app()
    routes = [
        route
        for router_route in app.routes
        for route in getattr(getattr(router_route, "original_router", None), "routes", [router_route])
        if getattr(route, "path", None) == "/api/uptime"
    ]

    assert routes
    assert routes[0].response_model is UptimeResponse


def test_uptime_response_serialises_started_at_with_plus_zero_offset():
    response = UptimeResponse(
        uptime_seconds=1.5,
        started_at=datetime(2026, 11, 1, 4, 11, 13, 482915, tzinfo=timezone.utc),
    )

    assert response.model_dump(mode="json")["started_at"] == "2026-11-01T04:11:13.482915+00:00"


def test_uptime_response_normalises_other_offsets_to_utc():
    local = timezone(timedelta(hours=1))
    response = UptimeResponse(
        uptime_seconds=0.0,
        started_at=datetime(2026, 11, 1, 5, 0, 0, tzinfo=local),
    )

    assert response.model_dump(mode="json")["started_at"] == "2026-11-01T04:00:00+00:00"


def test_uptime_response_rejects_naive_datetime():
    with pytest.raises(ValidationError):
        UptimeResponse(uptime_seconds=1.0, started_at=datetime(2026, 11, 1, 4, 0, 0))


def test_uptime_response_rejects_negative_uptime_seconds():
    with pytest.raises(ValidationError):
        UptimeResponse(
            uptime_seconds=-0.1,
            started_at=datetime(2026, 11, 1, 4, 0, 0, tzinfo=timezone.utc),
        )
