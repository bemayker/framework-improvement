"""Unit tests for the echo schema and router declaration (TEST-06)."""

import pytest
from pydantic import ValidationError

from app.main import create_app
from app.routers.echo import router
from app.schemas.echo import ECHO_MSG_MAX_LENGTH, EchoResponse


def _msg_parameter() -> dict:
    operation = create_app().openapi()["paths"]["/api/echo"]["get"]
    return next(p for p in operation["parameters"] if p["name"] == "msg")


def test_echo_response_dumps_echo_field():
    """Happy path: the schema carries the echoed text."""
    assert EchoResponse(echo="hello").model_dump() == {"echo": "hello"}


def test_echo_response_accepts_empty_string():
    """Edge case: an empty echo is valid, there is no lower bound."""
    assert EchoResponse(echo="").echo == ""


def test_echo_response_without_echo_raises_validation_error():
    """Error case: the echo field is required."""
    with pytest.raises(ValidationError):
        EchoResponse()


def test_echo_max_length_constant_is_200():
    """The bound named by the criteria."""
    assert ECHO_MSG_MAX_LENGTH == 200


def test_echo_route_response_model_is_echo_response():
    """Criterion 4: the body is defined by the Pydantic schema."""
    assert router.routes[0].response_model is EchoResponse


def test_echo_msg_parameter_is_required_and_bounded_by_constant():
    """Criterion 3: the bound is declared on the parameter, resolved from the constant."""
    parameter = _msg_parameter()

    assert parameter["required"] is True
    assert parameter["schema"]["maxLength"] == ECHO_MSG_MAX_LENGTH
