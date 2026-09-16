"""Unit tests for the time router and schema (backend/app/routers/time.py,
backend/app/schemas/time.py).
"""

from datetime import UTC, datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.routers import time as time_router
from app.schemas.time import TimeResponse


def test_get_time_returns_timezone_aware_utc_value():
    """Happy path: the handler returns a TimeResponse with an aware UTC now."""
    response = time_router.get_time()

    assert isinstance(response, TimeResponse)
    assert response.now.tzinfo is not None
    assert response.now.utcoffset() == timedelta(0)
    assert response.timezone == "UTC"


def test_get_time_computes_now_per_request(monkeypatch):
    """Edge case: two calls a second apart return different, increasing values.

    The clock is monkeypatched to a deterministic fake so the case does not
    depend on real clock resolution.
    """
    fake_values = iter(
        [
            datetime(2026, 1, 2, 3, 4, 5, tzinfo=UTC),
            datetime(2026, 1, 2, 3, 4, 6, tzinfo=UTC),
        ]
    )

    class FakeDatetime(datetime):
        @classmethod
        def now(cls, tz=None):
            return next(fake_values)

    monkeypatch.setattr(time_router, "datetime", FakeDatetime)

    first = time_router.get_time()
    second = time_router.get_time()

    assert first.now != second.now
    assert second.now > first.now


def test_time_route_declares_response_model():
    """Structural case: the route declares response_model=TimeResponse rather
    than returning a bare dict (acceptance criterion 3)."""
    matching_routes = [
        route
        for route in time_router.router.routes
        if getattr(route, "path", None) == "/api/time"
    ]

    assert len(matching_routes) == 1
    assert matching_routes[0].response_model is TimeResponse


def test_time_response_serialises_now_with_explicit_utc_offset():
    """The schema pins the wire format to the exact +00:00 suffix, never Z."""
    instant = datetime(2026, 1, 2, 3, 4, 5, tzinfo=UTC)

    body = TimeResponse(now=instant).model_dump(mode="json")

    assert body["now"] == "2026-01-02T03:04:05+00:00"
    assert not body["now"].endswith("Z")


def test_time_response_normalises_non_utc_aware_input():
    """Edge case: a non-UTC aware instant is still reported in UTC."""
    instant = datetime(2026, 1, 2, 5, 4, 5, tzinfo=timezone(timedelta(hours=2)))

    body = TimeResponse(now=instant).model_dump(mode="json")

    assert body["now"] == "2026-01-02T03:04:05+00:00"


def test_time_response_rejects_naive_datetime():
    """Error case: a naive datetime is a validation error, never silently
    accepted (the "never naive" half of acceptance criterion 2)."""
    naive_instant = datetime(2026, 1, 2, 3, 4, 5)

    with pytest.raises(ValidationError):
        TimeResponse(now=naive_instant)
