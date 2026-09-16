"""Unit tests for the echo router and its response schema (TEST-06).

Documented deviation from `coding_standards.md` Section 2.4's three-case
minimum: the handler has no reachable error case. Both 422 paths (a missing
`msg`, an over-length `msg`) are FastAPI's own request validation, produced
before the function body ever runs, so there is no exception case in this
module to unit-test. Those cases are covered at the integration tier
(`test_echo_integration.py`) instead of being fabricated here.
"""

from pydantic import BaseModel

from app.main import create_app
from app.routers.echo import get_echo, router
from app.schemas.echo import EchoResponse


def test_get_echo_returns_message_verbatim():
    """Happy path: the handler returns the given message unchanged."""
    result = get_echo(msg="hello")

    assert result == EchoResponse(echo="hello")


def test_get_echo_with_empty_string_round_trips_unchanged():
    """Edge case: an empty message is valid and echoes as an empty string."""
    result = get_echo(msg="")

    assert result == EchoResponse(echo="")


def test_echo_query_parameter_declares_max_length_200():
    """Criterion 3: the 200-character bound is declared on the parameter.

    Asserted through FastAPI's own public output, the generated OpenAPI
    document, rather than through `annotated_types`/`fastapi.params`
    introspection of the annotation's internals: the document's
    `maxLength: 200` on the `msg` query parameter of `/api/echo` is what a
    caller of this API actually sees, and it exists only because the bound
    is declared on the parameter rather than checked in the handler body
    (see the module docstring).
    """
    schema = create_app().openapi()
    parameters = schema["paths"]["/api/echo"]["get"]["parameters"]
    msg_parameter = next(p for p in parameters if p["name"] == "msg")

    assert msg_parameter["schema"]["maxLength"] == 200


def test_echo_response_model_is_pydantic_schema_with_one_field():
    """Criterion 4: the response body is a Pydantic schema, not a bare dict."""
    assert issubclass(EchoResponse, BaseModel)
    assert set(EchoResponse.model_fields) == {"echo"}
    assert EchoResponse.model_fields["echo"].annotation is str


def test_echo_route_uses_echo_response_as_response_model():
    """Criterion 4: the route is declared with `response_model=EchoResponse`."""
    echo_route = next(route for route in router.routes if route.path == "/api/echo")

    assert echo_route.response_model is EchoResponse
