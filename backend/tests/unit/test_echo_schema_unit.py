"""Unit tests for the echo schema and its bound (TEST-06)."""

import pytest
from pydantic import ValidationError

from app.schemas.echo import ECHO_MSG_MAX_LENGTH, EchoResponse


def test_echo_response_serializes_to_echo_key():
    """Happy path: the body shape comes from the schema."""
    assert EchoResponse(echo="hello").model_dump() == {"echo": "hello"}


def test_echo_response_accepts_empty_string():
    """Edge case: an empty message is a valid echo."""
    assert EchoResponse(echo="").model_dump() == {"echo": ""}


def test_echo_response_without_echo_raises_validation_error():
    """Error case: the echo field is required."""
    with pytest.raises(ValidationError):
        EchoResponse()


def test_echo_msg_max_length_is_200():
    """The bound the acceptance criteria require is stated in the schema module."""
    assert ECHO_MSG_MAX_LENGTH == 200
