"""Unit tests for the echo schemas (TEST-06), in memory with no HTTP."""

import pytest
from pydantic import ValidationError

from app.schemas.echo import ECHO_MSG_MAX_LENGTH, EchoQuery, EchoResponse


def test_echo_query_accepts_msg_at_max_length():
    """Edge case: exactly 200 characters is within the bound."""
    query = EchoQuery(msg="a" * ECHO_MSG_MAX_LENGTH)

    assert len(query.msg) == 200


def test_echo_query_rejects_msg_over_max_length():
    """Error case: 201 characters fails with a string_too_long error."""
    with pytest.raises(ValidationError) as exc_info:
        EchoQuery(msg="a" * (ECHO_MSG_MAX_LENGTH + 1))

    assert exc_info.value.errors()[0]["type"] == "string_too_long"


def test_echo_query_rejects_missing_msg():
    """Error case: msg is required."""
    with pytest.raises(ValidationError) as exc_info:
        EchoQuery()

    assert exc_info.value.errors()[0]["type"] == "missing"


def test_echo_response_serializes_to_echo_field():
    """Happy path: the response model dumps to the contract shape."""
    assert EchoResponse(echo="hello").model_dump() == {"echo": "hello"}
