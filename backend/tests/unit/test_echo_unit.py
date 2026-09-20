"""Unit tests for the echo schema and route contract (TEST-06).

The route's declared contract is read off the app `create_app()` builds,
which is what lets the `msg` bound live in the schema (`Query(max_length=200)`)
rather than in a hand-rolled check the router body would need — the exact
shape acceptance criterion 3 requires and no status-code assertion could
distinguish from a hand-rolled 422.
"""

import pytest
from pydantic import ValidationError

from app.main import create_app
from app.schemas.echo import EchoResponse


def test_echo_response_constructs_and_serializes_happy_path():
    """Happy path: a normal string round-trips through the schema."""
    response = EchoResponse(echo="hello")

    assert response.model_dump() == {"echo": "hello"}


def test_echo_response_accepts_empty_string():
    """Edge case: an empty string is a valid value and round-trips."""
    response = EchoResponse(echo="")

    assert response.model_dump() == {"echo": ""}


def test_echo_response_raises_validation_error_when_echo_is_missing():
    """Error case: constructing without the required field raises."""
    with pytest.raises(ValidationError):
        EchoResponse()


def _find_route(routes, path: str):
    """Locate a route by path, recursing through `include_router` wrappers.

    The installed FastAPI represents `app.include_router(...)` as a wrapper
    object (no `.path` of its own) holding an `original_router` whose own
    `.routes` carry the real routes, rather than flattening included routes
    directly onto `app.routes` (mirrors `test_main_unit.py`'s
    `_collect_route_paths`, which needs the same recursion for paths alone).
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


def test_get_echo_route_uses_echo_response_as_response_model():
    """Criterion 4: the route's declared response model is EchoResponse."""
    app = create_app()

    echo_route = _find_route(app.routes, "/api/echo")

    assert echo_route is not None
    assert echo_route.response_model is EchoResponse


def test_get_echo_msg_parameter_declares_required_max_length_200_in_schema():
    """Criterion 3: the bound is stated in the generated schema.

    A hand-rolled `if len(msg) > 200` check in the handler body would produce
    the same 422 at the HTTP layer but would leave no `maxLength` here, so
    this is the assertion that distinguishes a declared bound from one.
    """
    app = create_app()

    openapi_schema = app.openapi()
    msg_parameter = next(
        parameter
        for parameter in openapi_schema["paths"]["/api/echo"]["get"]["parameters"]
        if parameter["name"] == "msg"
    )

    assert msg_parameter["required"] is True
    assert msg_parameter["schema"]["maxLength"] == 200
