"""Unit tests for the echo schemas (backend/app/schemas/echo.py, TEST-06)."""

import pytest
from pydantic import ValidationError

from app.schemas.echo import MAX_ECHO_LENGTH, EchoQuery, EchoResponse


def test_echo_query_with_msg_is_accepted():
    """Happy path: an ordinary message validates and is kept verbatim."""
    query = EchoQuery(msg="hello")

    assert query.msg == "hello"


def test_echo_query_with_200_characters_is_accepted():
    """Edge case: exactly the bound is allowed ("longer than 200" is rejected)."""
    msg = "a" * MAX_ECHO_LENGTH

    assert EchoQuery(msg=msg).msg == msg


def test_echo_query_with_201_characters_raises_validation_error():
    """Error case: one character over the bound is rejected by the schema."""
    with pytest.raises(ValidationError) as exc_info:
        EchoQuery(msg="a" * (MAX_ECHO_LENGTH + 1))

    assert exc_info.value.errors()[0]["type"] == "string_too_long"


def test_echo_query_without_msg_raises_validation_error():
    """Error case: msg is required."""
    with pytest.raises(ValidationError) as exc_info:
        EchoQuery()

    assert exc_info.value.errors()[0]["type"] == "missing"


def test_echo_response_serializes_echo_field():
    """Criterion 4: the response body is the schema's single `echo` field."""
    assert EchoResponse(echo="hello").model_dump() == {"echo": "hello"}
