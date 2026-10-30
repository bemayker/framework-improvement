"""Unit tests for ServerTimeResponse (backend/app/schemas/server_time.py)."""

from datetime import timedelta

import pytest
from pydantic import ValidationError

from app.schemas.server_time import ServerTimeResponse


def test_now_utc_returns_aware_utc_datetime_with_utc_timezone():
    """Happy path: the builder yields an aware datetime at offset zero."""
    response = ServerTimeResponse.now_utc()

    assert response.now.tzinfo is not None
    assert response.now.utcoffset() == timedelta(0)
    assert response.timezone == "UTC"


def test_now_utc_serialises_with_explicit_offset():
    """Edge case: the JSON form carries an explicit UTC offset, never a naive time."""
    payload = ServerTimeResponse.now_utc().model_dump(mode="json")

    assert payload["now"].endswith(("Z", "+00:00"))
    assert payload["timezone"] == "UTC"


def test_server_time_response_rejects_non_utc_timezone():
    """Error case: only the literal "UTC" is an accepted timezone."""
    with pytest.raises(ValidationError):
        ServerTimeResponse(now="2026-10-30T17:24:13Z", timezone="Europe/Brussels")
