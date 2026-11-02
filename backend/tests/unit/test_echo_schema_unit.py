"""Unit tests for the echo response schema (TEST-06)."""

import pytest
from pydantic import ValidationError

from app.schemas.echo import ECHO_MSG_MAX_LENGTH, EchoResponse


def test_echo_response_serializes_echo_field():
    """Happy path: the model dumps to the contract body."""
    assert EchoResponse(echo="hello").model_dump() == {"echo": "hello"}


def test_echo_response_keeps_empty_string():
    """Edge case: an empty string round-trips unchanged."""
    assert EchoResponse(echo="").echo == ""


def test_echo_response_without_echo_raises_validation_error():
    """Error case: the echo field is required."""
    with pytest.raises(ValidationError):
        EchoResponse()


def test_echo_msg_max_length_is_200():
    """Pins the contract value the endpoint advertises."""
    assert ECHO_MSG_MAX_LENGTH == 200
