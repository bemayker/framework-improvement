"""Unit tests for the uptime schema, route declaration and start mark (TEST-07)."""

from datetime import datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.main import create_app
from app.routers.uptime import router
from app.schemas.uptime import UptimeResponse
from app.services.uptime_service import StartMark

UTC_MOMENT = datetime(2026, 10, 19, 9, 15, 3, 123456, tzinfo=timezone.utc)


def test_uptime_response_dump_has_exactly_the_two_fields():
    dumped = UptimeResponse(uptime_seconds=1.5, started_at=UTC_MOMENT).model_dump(
        mode="json"
    )

    assert set(dumped) == {"uptime_seconds", "started_at"}


def test_uptime_response_started_at_ends_in_explicit_utc_offset():
    dumped = UptimeResponse(uptime_seconds=1.5, started_at=UTC_MOMENT).model_dump(
        mode="json"
    )

    assert dumped["started_at"] == "2026-10-19T09:15:03.123456+00:00"
    assert datetime.fromisoformat(dumped["started_at"]).utcoffset() == timedelta(0)


def test_uptime_response_converts_offset_input_to_same_instant_in_utc():
    plus_two = timezone(timedelta(hours=2))
    local_moment = UTC_MOMENT.astimezone(plus_two)

    dumped = UptimeResponse(uptime_seconds=0, started_at=local_moment).model_dump(
        mode="json"
    )

    assert dumped["started_at"] == "2026-10-19T09:15:03.123456+00:00"


def test_uptime_response_rejects_naive_started_at():
    with pytest.raises(ValidationError):
        UptimeResponse(uptime_seconds=1.0, started_at=datetime(2026, 10, 19, 9, 15))


def test_uptime_response_rejects_negative_uptime():
    with pytest.raises(ValidationError):
        UptimeResponse(uptime_seconds=-1, started_at=UTC_MOMENT)


def test_uptime_response_accepts_zero_uptime():
    assert UptimeResponse(uptime_seconds=0, started_at=UTC_MOMENT).uptime_seconds == 0


def test_uptime_route_declares_uptime_response_model():
    uptime_routes = [route for route in router.routes if route.path == "/api/uptime"]

    assert len(uptime_routes) == 1
    assert uptime_routes[0].response_model is UptimeResponse


def test_create_app_sets_start_mark_on_app_state():
    app = create_app()

    mark = app.state.uptime_start

    assert isinstance(mark, StartMark)
    assert mark.started_at.utcoffset() == timedelta(0)


def test_create_app_captures_a_distinct_mark_per_instance():
    first_app = create_app()
    second_app = create_app()

    assert first_app.state.uptime_start is not second_app.state.uptime_start
