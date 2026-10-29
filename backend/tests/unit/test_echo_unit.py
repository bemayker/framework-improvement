"""Unit tests for the echo schema and its declared bound (TEST-06)."""

import pytest
from pydantic import ValidationError

from app.main import create_app
from app.schemas.echo import MAX_ECHO_MESSAGE_LENGTH, EchoResponse


def test_echo_response_serializes_given_text():
    """Happy path: the model carries the text under the `echo` key."""
    assert EchoResponse(echo="hello").model_dump() == {"echo": "hello"}


def test_echo_response_accepts_empty_string():
    """Edge case: an empty string is a valid echo."""
    assert EchoResponse(echo="").model_dump() == {"echo": ""}


def test_echo_response_without_echo_raises_validation_error():
    """Error case: the `echo` field is required."""
    with pytest.raises(ValidationError):
        EchoResponse()


def test_openapi_declares_msg_as_required_query_with_max_length():
    """Criterion 3: the bound is declared in the schema, not hand-checked."""
    spec = create_app().openapi()

    parameters = spec["paths"]["/api/echo"]["get"]["parameters"]
    msg = next(p for p in parameters if p["name"] == "msg")

    assert MAX_ECHO_MESSAGE_LENGTH == 200
    assert msg["in"] == "query"
    assert msg["required"] is True
    assert msg["schema"]["maxLength"] == MAX_ECHO_MESSAGE_LENGTH
