"""Unit tests for the echo schema and handler (TEST-06)."""

from app.routers.echo import get_echo
from app.schemas.echo import ECHO_MSG_MAX_LENGTH, EchoResponse


def test_echo_response_serializes_to_echo_field():
    """Criterion 4: the schema serializes to exactly one `echo` field."""
    assert EchoResponse(echo="hello").model_dump() == {"echo": "hello"}


def test_get_echo_returns_echo_response_instance():
    """Criterion 4: the handler returns the schema, not a bare dict."""
    result = get_echo("hello")

    assert isinstance(result, EchoResponse)
    assert result.echo == "hello"


def test_get_echo_returns_empty_text_unchanged():
    """Edge case: an empty string is a valid, present value (plan assumption)."""
    assert get_echo("").echo == ""


def test_echo_msg_max_length_is_200():
    """The bound named by the acceptance criteria lives in the schema module."""
    assert ECHO_MSG_MAX_LENGTH == 200
