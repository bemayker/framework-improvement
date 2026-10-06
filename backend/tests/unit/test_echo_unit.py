"""Unit tests for the echo schema and handler (TEST-06, TEST-11)."""

from inspect import signature
from typing import get_args

import pytest
from pydantic import ValidationError
from pydantic.fields import FieldInfo

from app.routers.echo import get_echo
from app.schemas.echo import MAX_ECHO_MESSAGE_LENGTH, EchoResponse


def test_echo_response_serialises_to_echo_key():
    """Happy path: the schema dumps to the `echo` key."""
    assert EchoResponse(echo="hello").model_dump() == {"echo": "hello"}


def test_max_echo_message_length_is_200():
    """The bound is the one the criteria state."""
    assert MAX_ECHO_MESSAGE_LENGTH == 200


def test_get_echo_with_surrounding_spaces_returns_trimmed_message():
    """Criterion 1: surrounding spaces are removed from the echo."""
    result = get_echo(msg="  hello  ")

    assert isinstance(result, EchoResponse)
    assert result.echo == "hello"


@pytest.mark.parametrize("message", ["   ", " \t\n "])
def test_get_echo_with_only_whitespace_returns_empty_echo(message):
    """Criterion 2: a whitespace-only message echoes the empty string."""
    assert get_echo(msg=message).echo == ""


def test_get_echo_keeps_interior_whitespace():
    """Edge case: only surrounding whitespace is removed."""
    assert get_echo(msg="  hello world  ").echo == "hello world"


def test_get_echo_msg_bound_is_declared_on_the_parameter():
    """Criterion 3: the max length sits on the parameter, so it is checked on
    the value as sent, before the handler trims."""
    metadata = get_args(signature(get_echo).parameters["msg"].annotation)[1:]
    query = next(item for item in metadata if isinstance(item, FieldInfo))

    assert any(
        getattr(constraint, "max_length", None) == MAX_ECHO_MESSAGE_LENGTH
        for constraint in query.metadata
    )


def test_get_echo_with_empty_string_returns_empty_echo():
    """Edge case: an empty string is a present value and echoes back."""
    assert get_echo(msg="").echo == ""


def test_echo_response_without_echo_raises_validation_error():
    """Error case: the response schema requires `echo`."""
    with pytest.raises(ValidationError):
        EchoResponse()
