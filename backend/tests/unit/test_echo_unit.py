"""Unit tests for the echo schema and handler (TEST-06)."""

import pytest
from pydantic import ValidationError

from app.routers.echo import get_echo
from app.schemas.echo import ECHO_MSG_MAX_LENGTH, EchoResponse


def test_echo_response_dumps_to_echo_key():
    """Happy path: the model serialises to the documented body."""
    assert EchoResponse(echo="hello").model_dump() == {"echo": "hello"}


@pytest.mark.parametrize("text", ["", "a" * 200])
def test_echo_response_round_trips_edge_values_unchanged(text):
    """Edge cases: empty and maximum-length strings are kept as given."""
    assert EchoResponse(echo=text).echo == text


def test_echo_response_without_echo_raises_validation_error():
    """Error case: the field is required."""
    with pytest.raises(ValidationError):
        EchoResponse()


def test_echo_msg_max_length_is_200():
    """The bound is the 200 characters the acceptance criteria state."""
    assert ECHO_MSG_MAX_LENGTH == 200


def test_get_echo_returns_echo_response_instance():
    """Criterion 4: the handler returns the schema, not a bare dict."""
    result = get_echo(msg="hello")

    assert isinstance(result, EchoResponse)
    assert result.echo == "hello"
