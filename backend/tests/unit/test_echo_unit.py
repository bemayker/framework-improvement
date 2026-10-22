"""Unit tests for the echo schema and its declared contract (TEST-06)."""

import pytest
from pydantic import ValidationError

from app.main import create_app
from app.schemas.echo import ECHO_MSG_MAX_LENGTH, EchoResponse


def test_echo_response_serializes_echo_field():
    """Happy path: the model dumps to the documented body shape."""
    assert EchoResponse(echo="hello").model_dump() == {"echo": "hello"}


def test_echo_msg_max_length_is_200():
    """Edge case: the documented bound is 200 characters."""
    assert ECHO_MSG_MAX_LENGTH == 200


def test_echo_response_without_echo_raises_validation_error():
    """Error case: the echo field is required."""
    with pytest.raises(ValidationError):
        EchoResponse()


def test_openapi_declares_msg_required_query_with_max_length():
    """The bound is declared on the parameter, not hand-checked in the handler."""
    schema = create_app().openapi()

    parameters = schema["paths"]["/api/echo"]["get"]["parameters"]
    msg = next(p for p in parameters if p["name"] == "msg")

    assert msg["in"] == "query"
    assert msg["required"] is True
    assert msg["schema"]["maxLength"] == 200
