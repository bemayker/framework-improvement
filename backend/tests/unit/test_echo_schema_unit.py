"""Unit tests for the echo schemas (backend/app/schemas/echo.py)."""

import pytest
from pydantic import ValidationError

from app.schemas.echo import MAX_ECHO_LENGTH, EchoQuery, EchoResponse


def test_echo_query_accepts_message():
    """Happy path: a short message is accepted unchanged."""
    assert EchoQuery(msg="hello").msg == "hello"


def test_echo_query_accepts_exactly_200_characters():
    """Boundary: exactly the maximum length is accepted."""
    message = "a" * MAX_ECHO_LENGTH

    assert EchoQuery(msg=message).msg == message


def test_echo_query_accepts_empty_string():
    """Edge case: an empty message is accepted, only an upper bound is set."""
    assert EchoQuery(msg="").msg == ""


def test_echo_query_with_201_characters_raises_string_too_long():
    """Error case: one character over the bound is rejected by the schema."""
    with pytest.raises(ValidationError) as exc_info:
        EchoQuery(msg="a" * (MAX_ECHO_LENGTH + 1))

    assert exc_info.value.errors()[0]["type"] == "string_too_long"


def test_echo_query_without_msg_raises_missing_error():
    """Error case: msg is required."""
    with pytest.raises(ValidationError) as exc_info:
        EchoQuery()

    assert exc_info.value.errors()[0]["type"] == "missing"


def test_echo_response_serialises_echo_field():
    """The response schema serialises to the documented body shape."""
    assert EchoResponse(echo="hello").model_dump() == {"echo": "hello"}
