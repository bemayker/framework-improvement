"""Unit tests for the echo schemas (TEST-06)."""

import pytest
from pydantic import ValidationError

from app.schemas.echo import ECHO_MSG_MAX_LENGTH, EchoQuery, EchoResponse


def test_echo_query_without_msg_raises_validation_error():
    """Criterion 2: msg is required."""
    with pytest.raises(ValidationError) as exc_info:
        EchoQuery()

    error = exc_info.value.errors()[0]
    assert error["type"] == "missing"
    assert error["loc"] == ("msg",)


def test_echo_query_with_msg_of_exactly_200_characters_is_valid():
    """Criterion 3 boundary: 200 characters is accepted."""
    msg = "a" * ECHO_MSG_MAX_LENGTH

    assert EchoQuery(msg=msg).msg == msg


def test_echo_query_with_msg_over_200_characters_raises_validation_error():
    """Criterion 3: the bound is on the schema, 201 characters is rejected."""
    with pytest.raises(ValidationError) as exc_info:
        EchoQuery(msg="a" * (ECHO_MSG_MAX_LENGTH + 1))

    assert exc_info.value.errors()[0]["type"] == "string_too_long"


def test_echo_response_serializes_to_echo_key():
    """Criterion 4: the response model dumps to the echo key."""
    assert EchoResponse(echo="hello").model_dump() == {"echo": "hello"}
