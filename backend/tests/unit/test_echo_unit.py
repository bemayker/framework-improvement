"""Unit tests for the echo response schema (backend/app/schemas/echo.py)."""

import pytest
from pydantic import ValidationError

from app.schemas.echo import ECHO_MESSAGE_MAX_LENGTH, EchoResponse


def test_echo_response_serialises_to_echo_key():
    """Happy path: the model dumps to the documented body shape."""
    assert EchoResponse(echo="hello").model_dump() == {"echo": "hello"}


@pytest.mark.parametrize("text", ["", "héllo wörld ✓"])
def test_echo_response_round_trips_empty_and_non_ascii_text(text: str):
    """Edge case: empty and non-ASCII strings pass through unchanged."""
    assert EchoResponse(echo=text).echo == text


@pytest.mark.parametrize("value", [None, 123])
def test_echo_response_rejects_non_string_echo(value):
    """Error case: a non-string echo is a validation error."""
    with pytest.raises(ValidationError):
        EchoResponse(echo=value)


def test_echo_response_requires_echo_field():
    """Error case: constructing without echo raises a validation error."""
    with pytest.raises(ValidationError):
        EchoResponse()


def test_echo_message_max_length_is_200():
    """The bound named by the acceptance criteria lives in the schema module."""
    assert ECHO_MESSAGE_MAX_LENGTH == 200
