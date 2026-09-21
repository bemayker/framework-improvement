"""Unit tests for the time schema and route contract (FEAT-1).

The route's declared contract is read off the app `create_app()` builds, in
the shape `test_echo_unit.py` already uses (recursing through the
`include_router` wrapper's `original_router`): the `/api/time` route's
`response_model` is `TimeResponse`, which is criterion 3's "defined by a
Pydantic schema, not a bare dict" stated as an assertion no status code could
distinguish.
"""

from datetime import datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.main import create_app
from app.routers.time import get_time
from app.schemas.time import TimeResponse


def test_time_response_serializes_with_exact_plus_zero_offset_suffix():
    """Happy path: an aware UTC value serializes with the pinned +00:00 suffix."""
    response = TimeResponse(
        now=datetime(2026, 1, 2, 3, 4, 5, 678901, tzinfo=timezone.utc)
    )

    assert response.model_dump(mode="json") == {
        "now": "2026-01-02T03:04:05.678901+00:00",
        "timezone": "UTC",
    }


def test_time_response_timezone_defaults_to_utc():
    """Happy path: `timezone` defaults to UTC when not supplied."""
    response = TimeResponse(now=datetime(2026, 1, 2, tzinfo=timezone.utc))

    assert response.timezone == "UTC"


def test_time_response_rejects_a_non_utc_timezone_literal():
    """Edge case: `timezone` accepts nothing but the literal `UTC`."""
    with pytest.raises(ValidationError):
        TimeResponse(now=datetime(2026, 1, 2, tzinfo=timezone.utc), timezone="CET")


def test_time_response_serializes_a_non_zero_offset_as_its_own_offset():
    """Edge case: a non-UTC aware value serializes with its own offset.

    The schema does not relabel an arbitrary aware instant as UTC; it is the
    router's job to always pass a UTC-aware value in the first place.
    """
    non_utc = datetime(2026, 1, 2, 5, 0, 0, tzinfo=timezone(timedelta(hours=2)))

    response = TimeResponse(now=non_utc)

    assert response.model_dump(mode="json")["now"] == "2026-01-02T05:00:00+02:00"


def test_time_response_raises_validation_error_when_now_is_missing():
    """Error case: constructing without the required field raises."""
    with pytest.raises(ValidationError):
        TimeResponse()


def _find_route(routes, path: str):
    """Locate a route by path, recursing through `include_router` wrappers."""
    for route in routes:
        if getattr(route, "path", None) == path:
            return route
        original_router = getattr(route, "original_router", None)
        if original_router is not None:
            found = _find_route(original_router.routes, path)
            if found is not None:
                return found
    return None


def test_get_time_route_uses_time_response_as_response_model():
    """Criterion 3: the route's declared response model is TimeResponse."""
    app = create_app()

    time_route = _find_route(app.routes, "/api/time")

    assert time_route is not None
    assert time_route.response_model is TimeResponse


def test_get_time_called_twice_returns_two_different_aware_instants():
    """Criterion 2: the router function is computed per call, never naive."""
    first = get_time()
    second = get_time()

    assert first.now.tzinfo is not None
    assert second.now.tzinfo is not None
    assert first.now.utcoffset() == timedelta(0)
    assert second.now.utcoffset() == timedelta(0)
    assert second.now != first.now
