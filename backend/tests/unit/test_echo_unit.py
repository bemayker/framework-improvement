"""Unit tests for the echo schema (TEST-06)."""

import pytest
from pydantic import ValidationError

from app.schemas.echo import ECHO_MSG_MAX_LENGTH, EchoResponse


def test_echo_response_serializes_echo_field():
    """Happy path: the schema serializes to {"echo": ...}."""
    assert EchoResponse(echo="hello").model_dump() == {"echo": "hello"}


def test_echo_response_rejects_missing_echo_field():
    """Error case: the echo field is required."""
    with pytest.raises(ValidationError):
        EchoResponse()


def test_echo_msg_max_length_is_200():
    """Boundary: the declared bound is the 200 the acceptance criteria state."""
    assert ECHO_MSG_MAX_LENGTH == 200
