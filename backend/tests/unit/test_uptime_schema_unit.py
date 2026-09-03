"""Unit tests for the uptime schema (backend/app/schemas/uptime.py).

Also covers the route's binding to it, and the serialization-mode JSON schema
the field serializer must not destroy, asserted as structure properties rather
than over HTTP.
"""

from datetime import datetime, timedelta, timezone

import pytest
from pydantic import BaseModel, ValidationError

from app.routers.uptime import router as uptime_router
from app.schemas.uptime import UptimeResponse

UPTIME_ROUTE_PATH = "/api/uptime"


def _uptime_route():
    """Return the /api/uptime route object off the uptime router."""
    return next(
        route
        for route in uptime_router.routes
        if getattr(route, "path", None) == UPTIME_ROUTE_PATH
    )


def test_uptime_response_serializes_started_at_with_an_explicit_utc_offset():
    """Happy path, criterion 3: the offset is `+00:00`, not the `Z` designator."""
    model = UptimeResponse(
        uptime_seconds=1.5,
        started_at=datetime(2026, 9, 3, 12, 0, tzinfo=timezone.utc),
    )

    assert model.model_dump(mode="json") == {
        "uptime_seconds": 1.5,
        "started_at": "2026-09-03T12:00:00+00:00",
    }


def test_uptime_response_normalises_a_non_utc_aware_started_at():
    """Edge case: an aware input in another zone is reported in UTC."""
    model = UptimeResponse(
        uptime_seconds=0.0,
        started_at=datetime(2026, 9, 3, 12, 0, tzinfo=timezone(timedelta(hours=2))),
    )

    assert model.model_dump(mode="json")["started_at"] == "2026-09-03T10:00:00+00:00"


def test_started_at_serialization_schema_keeps_the_date_time_format():
    """Regression pin: the serializer must not replace the field's JSON schema.

    FastAPI documents a response in Pydantic's *serialization* mode, in which a
    field serializer's return annotation replaces the field's schema. So an
    innocuous-looking `-> str` on serialize_started_at silently drops
    `format: "date-time"` from /openapi.json while every value-level assertion
    stays green. Asserted here in the mode the document is built from, so the
    unit tier catches it without an HTTP cycle.
    """
    started_at = UptimeResponse.model_json_schema(mode="serialization")["properties"][
        "started_at"
    ]

    assert started_at["type"] == "string"
    assert started_at["format"] == "date-time"


def test_uptime_route_declares_pydantic_schema_from_schemas_package():
    """Criterion 4: the response body is a Pydantic model in app/schemas/.

    Asserted as a structure property rather than over HTTP: the model is a
    BaseModel living in app.schemas.uptime, and it is the route's declared
    response_model, so the router cannot be answering with a bare dict.
    """
    assert issubclass(UptimeResponse, BaseModel)
    assert UptimeResponse.__module__ == "app.schemas.uptime"
    assert _uptime_route().response_model is UptimeResponse


def test_uptime_response_with_negative_uptime_seconds_raises_validation_error():
    """Error case, criterion 2: the non-negative bound is enforced by the model."""
    with pytest.raises(ValidationError):
        UptimeResponse(
            uptime_seconds=-0.001,
            started_at=datetime(2026, 9, 3, 12, 0, tzinfo=timezone.utc),
        )


def test_uptime_response_with_naive_started_at_raises_validation_error():
    """Error case, criterion 3: a timestamp carrying no offset is rejected."""
    with pytest.raises(ValidationError):
        UptimeResponse(uptime_seconds=1.0, started_at=datetime(2026, 9, 3, 12, 0))


def test_uptime_response_without_fields_raises_validation_error():
    """Error case: both fields are required, so an empty construction fails."""
    with pytest.raises(ValidationError):
        UptimeResponse()
