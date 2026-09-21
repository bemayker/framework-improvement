"""Unit tests for the uptime schema and the route's declared contract
(backend/app/schemas/uptime.py, backend/app/routers/uptime.py).
"""

from datetime import datetime, timezone

import pytest
from pydantic import ValidationError

from app.main import create_app
from app.schemas.uptime import UptimeResponse


def _find_route(routes, path):
    """Recurse through FastAPI's `_IncludedRouter` wrappers to find the
    real `APIRoute` for `path` (mirrors test_main_unit.py's route walk: the
    installed FastAPI represents `app.include_router(...)` as a wrapper
    object with no `.path` of its own, holding an `original_router` whose
    own `.routes` carry the real paths).
    """
    for route in routes:
        if getattr(route, "path", None) == path:
            return route
        original_router = getattr(route, "original_router", None)
        if original_router is not None:
            found = _find_route(original_router.routes, path)
            if found is not None:
                return found
    return None


def test_uptime_response_serialises_started_at_with_explicit_utc_offset():
    """Happy path: started_at renders with the explicit +00:00 offset, not a
    bare Z suffix.
    """
    response = UptimeResponse(
        uptime_seconds=12.345,
        started_at=datetime(2026, 9, 20, 9, 14, 2, 481293, tzinfo=timezone.utc),
    )

    payload = response.model_dump(mode="json")

    assert payload["started_at"] == "2026-09-20T09:14:02.481293+00:00"


def test_uptime_response_rejects_naive_datetime():
    """Edge case: a naive started_at is rejected at validation time, so a
    caller cannot construct a response body missing the offset.
    """
    with pytest.raises(ValidationError):
        UptimeResponse(uptime_seconds=1.0, started_at=datetime(2026, 9, 20, 9, 14, 2))


def test_uptime_route_declares_uptime_response_model():
    """Criterion 4: the route built by create_app() declares
    response_model=UptimeResponse, with format: date-time on started_at in
    the generated serialisation-mode schema.
    """
    app = create_app()

    uptime_route = _find_route(app.routes, "/api/uptime")

    assert uptime_route is not None, "GET /api/uptime is not registered"
    assert uptime_route.response_model is UptimeResponse

    schema = UptimeResponse.model_json_schema(mode="serialization")
    assert schema["properties"]["started_at"]["format"] == "date-time"


def test_openapi_document_declares_started_at_format_date_time():
    """Criterion 4, against the artifact the plan's manual verification
    script and the tracker comment are actually about: the generated
    OpenAPI document (`/openapi.json`), not the model schema one step
    removed from it. A prior run reported the model schema carrying
    `format: date-time` while the served document still showed a bare
    `{"type": "string"}` for this field; this asserts the document itself.
    """
    app = create_app()

    openapi_schema = app.openapi()["components"]["schemas"]["UptimeResponse"]
    started_at_property = openapi_schema["properties"]["started_at"]

    assert started_at_property["format"] == "date-time"
