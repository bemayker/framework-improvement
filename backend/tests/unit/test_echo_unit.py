"""Unit tests for the echo response schema (TEST-06)."""

import pytest
from pydantic import ValidationError

from app.schemas.echo import ECHO_MSG_MAX_LENGTH, EchoResponse


def test_echo_response_serializes_message_under_echo_key():
    """Happy path: the message is serialized under the `echo` key."""
    assert EchoResponse(echo="hello").model_dump() == {"echo": "hello"}


def test_echo_response_accepts_message_at_max_length():
    """Edge case: a message of exactly the bound is valid."""
    message = "a" * ECHO_MSG_MAX_LENGTH

    assert EchoResponse(echo=message).echo == message


def test_echo_response_rejects_message_over_max_length():
    """Error case: a message one character over the bound is rejected."""
    with pytest.raises(ValidationError):
        EchoResponse(echo="a" * (ECHO_MSG_MAX_LENGTH + 1))


def test_echo_msg_max_length_is_200():
    """The bound is the 200 characters the acceptance criteria state."""
    assert ECHO_MSG_MAX_LENGTH == 200
