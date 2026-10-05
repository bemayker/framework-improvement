"""Unit tests for the echo schema and handler (TEST-06)."""

import pytest
from pydantic import ValidationError

from app.routers.echo import get_echo
from app.schemas.echo import MAX_ECHO_MESSAGE_LENGTH, EchoResponse


def test_echo_response_serialises_to_echo_key():
    """Happy path: the schema dumps to the `echo` key."""
    assert EchoResponse(echo="hello").model_dump() == {"echo": "hello"}


def test_max_echo_message_length_is_200():
    """The bound is the one the criteria state."""
    assert MAX_ECHO_MESSAGE_LENGTH == 200


def test_get_echo_returns_echo_response_with_input_unchanged():
    """Happy path: the handler returns the schema with the text verbatim."""
    result = get_echo(msg="  hello world ")

    assert isinstance(result, EchoResponse)
    assert result.echo == "  hello world "


def test_get_echo_with_empty_string_returns_empty_echo():
    """Edge case: an empty string is a present value and echoes back."""
    assert get_echo(msg="").echo == ""


def test_echo_response_without_echo_raises_validation_error():
    """Error case: the response schema requires `echo`."""
    with pytest.raises(ValidationError):
        EchoResponse()
