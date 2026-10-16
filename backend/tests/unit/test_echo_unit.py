"""Unit tests for the echo schema and the declared msg bound (TEST-06)."""

import pytest
from pydantic import ValidationError

from app.main import create_app
from app.schemas.echo import MAX_ECHO_MSG_LENGTH, EchoResponse


def test_echo_response_serializes_message_under_echo_key():
    """Happy path: the schema carries the message under the echo key."""
    assert EchoResponse(echo="hello").model_dump() == {"echo": "hello"}


def test_echo_response_without_echo_raises_validation_error():
    """Error case: echo is required."""
    with pytest.raises(ValidationError):
        EchoResponse()


def test_openapi_declares_msg_as_required_query_with_max_length_200():
    """Edge case: the bound is declared in the schema, not hand-checked."""
    parameters = create_app().openapi()["paths"]["/api/echo"]["get"]["parameters"]

    msg = next(p for p in parameters if p["name"] == "msg")

    assert MAX_ECHO_MSG_LENGTH == 200
    assert msg["in"] == "query"
    assert msg["required"] is True
    assert msg["schema"]["maxLength"] == MAX_ECHO_MSG_LENGTH
