"""Unit tests for the echo response schema (backend/app/schemas/echo.py)."""

import pytest
from pydantic import ValidationError

from app.schemas.echo import MAX_ECHO_MESSAGE_LENGTH, EchoResponse


def test_echo_response_accepts_short_message():
    """Happy path: a short string is carried unchanged."""
    assert EchoResponse(echo="hello").echo == "hello"


def test_echo_response_accepts_exactly_max_length():
    """Edge case: the bound is inclusive, 200 characters is valid."""
    message = "a" * MAX_ECHO_MESSAGE_LENGTH

    assert EchoResponse(echo=message).echo == message


def test_echo_response_accepts_empty_string():
    """Edge case: an empty string is valid, no minimum length is declared."""
    assert EchoResponse(echo="").echo == ""


def test_echo_response_rejects_over_max_length():
    """Error case: one character past the bound raises a ValidationError."""
    with pytest.raises(ValidationError):
        EchoResponse(echo="a" * (MAX_ECHO_MESSAGE_LENGTH + 1))


def test_max_echo_message_length_is_200():
    """The documented bound is 200 characters."""
    assert MAX_ECHO_MESSAGE_LENGTH == 200
