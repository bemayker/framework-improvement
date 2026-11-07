"""Unit tests for the echo router and schema (TEST-06)."""

import pytest
from pydantic import ValidationError

from app.main import create_app
from app.routers.echo import get_echo
from app.schemas.echo import ECHO_MSG_MAX_LENGTH, EchoResponse


def test_get_echo_returns_echo_response_with_given_text():
    """Happy path: the handler returns an EchoResponse carrying the text."""
    result = get_echo(msg="hello")

    assert isinstance(result, EchoResponse)
    assert result.model_dump() == {"echo": "hello"}


def test_get_echo_returns_empty_echo_for_empty_msg():
    """Edge case: an empty msg is echoed as an empty string."""
    assert get_echo(msg="") == EchoResponse(echo="")


def test_echo_msg_max_length_is_200():
    """Boundary: the bound the router declares is 200."""
    assert ECHO_MSG_MAX_LENGTH == 200


def test_openapi_declares_msg_as_required_with_max_length_200():
    """The bound and required-ness are declared, not checked in the handler."""
    parameters = create_app().openapi()["paths"]["/api/echo"]["get"]["parameters"]

    msg_parameter = next(p for p in parameters if p["name"] == "msg")

    assert msg_parameter["in"] == "query"
    assert msg_parameter["required"] is True
    assert msg_parameter["schema"]["maxLength"] == 200


def test_openapi_declares_echo_response_as_200_body():
    """The 200 body is the EchoResponse schema, not a bare dict."""
    operation = create_app().openapi()["paths"]["/api/echo"]["get"]

    ref = operation["responses"]["200"]["content"]["application/json"]["schema"]["$ref"]

    assert ref.endswith("/EchoResponse")


def test_echo_response_rejects_missing_echo_field():
    """Error case: the schema requires the echo field."""
    with pytest.raises(ValidationError):
        EchoResponse()
