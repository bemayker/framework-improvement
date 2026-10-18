"""Unit tests for the echo schemas and route declaration (TEST-06)."""

import pytest
from pydantic import ValidationError

from app.routers.echo import router
from app.schemas.echo import ECHO_MSG_MAX_LENGTH, EchoQuery, EchoResponse


def test_echo_query_with_short_msg_validates():
    """Happy path: a short message is accepted unchanged."""
    assert EchoQuery(msg="hello").msg == "hello"


def test_echo_query_with_empty_msg_validates():
    """Edge case: an empty message is accepted (no minimum length)."""
    assert EchoQuery(msg="").msg == ""


def test_echo_query_with_exactly_max_length_validates():
    """Boundary: exactly 200 characters is accepted."""
    msg = "a" * ECHO_MSG_MAX_LENGTH

    assert EchoQuery(msg=msg).msg == msg


def test_echo_query_over_max_length_raises_string_too_long():
    """Error case: 201 characters is rejected by the schema's own bound."""
    with pytest.raises(ValidationError) as exc_info:
        EchoQuery(msg="a" * (ECHO_MSG_MAX_LENGTH + 1))

    assert exc_info.value.errors()[0]["type"] == "string_too_long"


def test_echo_query_without_msg_raises_missing():
    """Error case: msg is required."""
    with pytest.raises(ValidationError) as exc_info:
        EchoQuery()

    assert exc_info.value.errors()[0]["type"] == "missing"


def test_echo_max_length_constant_is_200():
    """The documented bound is 200 characters."""
    assert ECHO_MSG_MAX_LENGTH == 200


def test_echo_response_dump_has_only_echo_field():
    """The response body carries exactly one field, echo."""
    assert EchoResponse(echo="hello").model_dump() == {"echo": "hello"}


def test_echo_route_declares_echo_response_model():
    """Criterion 4: the route's response model is the EchoResponse schema."""
    echo_routes = [route for route in router.routes if route.path == "/api/echo"]

    assert len(echo_routes) == 1
    assert echo_routes[0].response_model is EchoResponse
