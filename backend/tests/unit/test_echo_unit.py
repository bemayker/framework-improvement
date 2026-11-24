"""Unit tests for the echo schema and its OpenAPI declaration (TEST-06)."""

import pytest
from pydantic import ValidationError

from app.main import create_app
from app.schemas.echo import MAX_ECHO_MSG_LENGTH, EchoResponse


def _echo_operation() -> dict:
    """Return the OpenAPI operation object for GET /api/echo."""
    return create_app().openapi()["paths"]["/api/echo"]["get"]


def test_echo_response_serializes_message_under_echo_key():
    """Happy path: the model dumps to the documented body shape."""
    assert EchoResponse(echo="hello").model_dump() == {"echo": "hello"}


def test_echo_response_rejects_missing_echo():
    """Error case: the echo field is required."""
    with pytest.raises(ValidationError):
        EchoResponse()


def test_echo_route_declares_msg_max_length_in_openapi():
    """Criterion 3: the bound is declared on a required query parameter."""
    parameters = {p["name"]: p for p in _echo_operation()["parameters"]}
    msg = parameters["msg"]

    assert msg["in"] == "query"
    assert msg["required"] is True
    assert msg["schema"]["maxLength"] == MAX_ECHO_MSG_LENGTH == 200


def test_echo_route_response_model_is_echo_response():
    """Criterion 4: the 200 response is the EchoResponse schema, not a bare dict."""
    schema = _echo_operation()["responses"]["200"]["content"]["application/json"]["schema"]

    assert schema == {"$ref": "#/components/schemas/EchoResponse"}
