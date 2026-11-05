"""Unit tests for the echo schema (backend/app/schemas/echo.py)."""

import pytest
from pydantic import ValidationError

from app.schemas.echo import MAX_ECHO_LENGTH, EchoResponse


def test_echo_response_serialises_to_echo_key():
    """Happy path: the model dumps to the documented body."""
    assert EchoResponse(echo="hello").model_dump() == {"echo": "hello"}


def test_echo_response_accepts_empty_string():
    """Edge case: an empty string is a valid echo."""
    assert EchoResponse(echo="").model_dump() == {"echo": ""}


def test_echo_response_without_echo_raises_validation_error():
    """Error case: the echo field is required."""
    with pytest.raises(ValidationError):
        EchoResponse()


def test_max_echo_length_is_200():
    """The bound the endpoint declares is 200 characters."""
    assert MAX_ECHO_LENGTH == 200
