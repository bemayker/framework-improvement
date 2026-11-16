"""Unit tests for the echo schemas (TEST-06)."""

import pytest
from pydantic import ValidationError

from app.schemas.echo import ECHO_MSG_MAX_LENGTH, EchoQuery, EchoResponse


def test_echo_query_accepts_msg_of_exactly_200_chars():
    """Boundary: exactly 200 characters is accepted."""
    msg = "a" * ECHO_MSG_MAX_LENGTH

    assert EchoQuery(msg=msg).msg == msg


def test_echo_query_rejects_msg_longer_than_200_chars():
    """Error case: 201 characters fails with string_too_long."""
    with pytest.raises(ValidationError) as exc_info:
        EchoQuery(msg="a" * (ECHO_MSG_MAX_LENGTH + 1))

    assert exc_info.value.errors()[0]["type"] == "string_too_long"


def test_echo_query_rejects_missing_msg():
    """Error case: msg is required."""
    with pytest.raises(ValidationError) as exc_info:
        EchoQuery()

    error = exc_info.value.errors()[0]
    assert error["type"] == "missing"
    assert error["loc"] == ("msg",)


def test_echo_response_serializes_to_echo_field():
    """Happy path: the response body is a single echo field."""
    assert EchoResponse(echo="hello").model_dump() == {"echo": "hello"}
