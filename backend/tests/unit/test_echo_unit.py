"""Unit tests for the echo schema and router function (TEST-06)."""

import pytest
from pydantic import ValidationError

from app.routers.echo import get_echo
from app.schemas.echo import EchoResponse


def test_echo_response_serialises_the_echo_field():
    """Happy path: the schema dumps to the documented body."""
    assert EchoResponse(echo="hello").model_dump() == {"echo": "hello"}


def test_echo_response_serialises_an_empty_string():
    """Edge case: an empty echo is a valid value."""
    assert EchoResponse(echo="").model_dump() == {"echo": ""}


def test_echo_response_without_echo_raises_validation_error():
    """Error case: the echo field is required."""
    with pytest.raises(ValidationError):
        EchoResponse()


def test_get_echo_returns_the_schema_not_a_dict():
    """The router function returns EchoResponse carrying the given text."""
    result = get_echo("hello")

    assert isinstance(result, EchoResponse)
    assert result.echo == "hello"
