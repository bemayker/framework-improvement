"""Unit tests for the echo schema and its published bound (TEST-06)."""

import pytest
from pydantic import ValidationError

from app.main import create_app
from app.schemas.echo import ECHO_MSG_MAX_LENGTH, EchoResponse


def test_echo_response_serialises_to_echo_field():
    """Happy path: the model dumps to the documented body shape."""
    assert EchoResponse(echo="hello").model_dump() == {"echo": "hello"}


def test_echo_response_rejects_missing_echo_field():
    """Error case: the echo field is required."""
    with pytest.raises(ValidationError):
        EchoResponse()


def test_echo_msg_max_length_is_200():
    """Edge case: the bound has the value the criteria state."""
    assert ECHO_MSG_MAX_LENGTH == 200


def test_echo_route_publishes_msg_max_length_in_openapi():
    """The bound is declared on the parameter, not checked in the handler."""
    operation = create_app().openapi()["paths"]["/api/echo"]["get"]

    msg_parameter = next(p for p in operation["parameters"] if p["name"] == "msg")

    assert msg_parameter["in"] == "query"
    assert msg_parameter["required"] is True
    assert msg_parameter["schema"]["maxLength"] == ECHO_MSG_MAX_LENGTH
