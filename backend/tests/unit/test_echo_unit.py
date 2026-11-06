"""Unit tests for the echo schema and the echo route's declared contract (TEST-06).

No HTTP and no database: the route is inspected, never called.
"""

import pytest
from annotated_types import MaxLen
from pydantic import ValidationError

from app.routers.echo import router
from app.schemas.echo import ECHO_MSG_MAX_LENGTH, EchoResponse


def _echo_route():
    matches = [route for route in router.routes if route.path == "/api/echo"]
    assert len(matches) == 1
    return matches[0]


def test_echo_response_serializes_to_echo_key():
    """Happy path: the schema dumps to {"echo": ...}."""
    assert EchoResponse(echo="hello").model_dump() == {"echo": "hello"}


@pytest.mark.parametrize("message", ["", "a" * ECHO_MSG_MAX_LENGTH])
def test_echo_response_keeps_edge_values_unchanged(message: str):
    """Edge case: an empty and a maximum-length message serialize verbatim."""
    assert EchoResponse(echo=message).echo == message


def test_echo_response_without_echo_raises_validation_error():
    """Error case: echo is a required field."""
    with pytest.raises(ValidationError):
        EchoResponse()


def test_echo_msg_max_length_is_200():
    """The declared bound is the 200 the acceptance criteria state."""
    assert ECHO_MSG_MAX_LENGTH == 200


def test_echo_route_response_model_is_echo_response():
    """Criterion 4: the body is defined by the Pydantic schema, not a dict."""
    assert _echo_route().response_model is EchoResponse


def test_echo_route_msg_is_required_query_parameter():
    """Criterion 2: msg has no default, so FastAPI answers 422 when absent."""
    query_params = {p.name: p for p in _echo_route().dependant.query_params}

    assert query_params["msg"].field_info.is_required()


def test_echo_route_msg_declares_max_length_200():
    """Criterion 3: the bound is declared on the parameter, not hand-checked."""
    query_params = {p.name: p for p in _echo_route().dependant.query_params}
    metadata = query_params["msg"].field_info.metadata

    assert MaxLen(ECHO_MSG_MAX_LENGTH) in metadata
