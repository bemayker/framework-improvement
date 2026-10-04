"""Unit tests for the echo schema and router handler (TEST-06, TEST-11)."""

import pytest
from pydantic import ValidationError

from app.routers.echo import get_echo
from app.schemas.echo import ECHO_MSG_MAX_LENGTH, EchoResponse


@pytest.mark.parametrize(
    ("message", "expected"),
    [
        ("  hello  ", "hello"),
        ("   ", ""),
        ("\t\n ", ""),
        ("\t hello  world \n", "hello  world"),
        ("hello", "hello"),
    ],
)
def test_get_echo_trims_surrounding_whitespace(message: str, expected: str):
    """TEST-11 criteria 1 and 2: surrounding whitespace goes, inner whitespace stays."""
    assert get_echo(message).echo == expected


def test_echo_response_serialises_to_echo_key():
    """Happy path: the model dumps to a body with the single `echo` key."""
    assert EchoResponse(echo="hello").model_dump() == {"echo": "hello"}


def test_echo_response_accepts_empty_string():
    """Edge case: an empty echo is a valid value."""
    assert EchoResponse(echo="").echo == ""


def test_echo_response_rejects_missing_echo_field():
    """Error case: the `echo` field is required."""
    with pytest.raises(ValidationError):
        EchoResponse()


def test_echo_msg_max_length_is_200():
    """The declared bound matches the acceptance criterion."""
    assert ECHO_MSG_MAX_LENGTH == 200
