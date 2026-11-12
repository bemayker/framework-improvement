"""Unit tests for the echo schemas (TEST-06)."""

import pytest
from pydantic import ValidationError

from app.schemas.echo import MAX_ECHO_MESSAGE_LENGTH, EchoQuery, EchoResponse


def test_echo_query_without_msg_raises_validation_error():
    with pytest.raises(ValidationError) as exc_info:
        EchoQuery()

    assert exc_info.value.errors()[0]["type"] == "missing"


def test_echo_query_with_msg_over_200_characters_raises_validation_error():
    with pytest.raises(ValidationError) as exc_info:
        EchoQuery(msg="a" * (MAX_ECHO_MESSAGE_LENGTH + 1))

    assert exc_info.value.errors()[0]["type"] == "string_too_long"


def test_echo_query_with_msg_of_200_characters_is_valid():
    query = EchoQuery(msg="a" * MAX_ECHO_MESSAGE_LENGTH)

    assert len(query.msg) == 200


def test_echo_query_with_empty_msg_is_valid():
    assert EchoQuery(msg="").msg == ""


def test_echo_response_serializes_echo_field():
    assert EchoResponse(echo="hello").model_dump() == {"echo": "hello"}
