"""Unit tests for the ping schema and handler (TEST-13)."""

import pytest
from pydantic import ValidationError

from app.routers.ping import get_ping
from app.schemas.ping import PingResponse


def test_ping_response_serialises_to_one_key_boolean_true():
    """Happy path: the schema dumps exactly one key holding boolean True."""
    dumped = PingResponse(pong=True).model_dump()

    assert dumped == {"pong": True}
    assert dumped["pong"] is True


def test_get_ping_returns_ping_response_with_pong_true():
    """Happy path: the handler returns a PingResponse whose pong is True."""
    result = get_ping()

    assert isinstance(result, PingResponse)
    assert result.pong is True


def test_ping_response_without_pong_raises_validation_error():
    """Error case: pong is required."""
    with pytest.raises(ValidationError):
        PingResponse()


def test_ping_response_with_non_boolean_string_raises_validation_error():
    """Edge case: Pydantic does not coerce an arbitrary string to a bool."""
    with pytest.raises(ValidationError):
        PingResponse(pong="not-a-bool")
