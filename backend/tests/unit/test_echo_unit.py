"""Unit tests for the echo schemas (TEST-06)."""

import pytest
from pydantic import ValidationError

from app.schemas.echo import MAX_ECHO_MESSAGE_LENGTH, EchoQuery, EchoResponse


def test_echo_query_accepts_msg_of_exactly_200_characters():
    """Boundary: exactly the maximum length is accepted."""
    query = EchoQuery(msg="a" * MAX_ECHO_MESSAGE_LENGTH)

    assert len(query.msg) == MAX_ECHO_MESSAGE_LENGTH


def test_echo_query_rejects_msg_longer_than_200_characters():
    """Error: one character over the bound is a string_too_long error."""
    with pytest.raises(ValidationError) as exc_info:
        EchoQuery(msg="a" * (MAX_ECHO_MESSAGE_LENGTH + 1))

    assert exc_info.value.errors()[0]["type"] == "string_too_long"


def test_echo_query_rejects_missing_msg():
    """Error: msg is required."""
    with pytest.raises(ValidationError) as exc_info:
        EchoQuery()

    assert exc_info.value.errors()[0]["type"] == "missing"


def test_echo_response_serializes_echo_field():
    """Happy path: the response model dumps to the contract body."""
    assert EchoResponse(echo="hello").model_dump() == {"echo": "hello"}
