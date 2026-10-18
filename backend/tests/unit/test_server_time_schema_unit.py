"""Unit tests for ServerTimeResponse (FEAT-1)."""

from datetime import datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.schemas.server_time import ServerTimeResponse


def test_server_time_response_serialises_now_with_plus_00_00_suffix():
    response = ServerTimeResponse(now=datetime(2026, 10, 18, 20, 41, 7, 512834, tzinfo=timezone.utc))

    body = response.model_dump(mode="json")

    assert body == {"now": "2026-10-18T20:41:07.512834+00:00", "timezone": "UTC"}
    assert body["now"].endswith("+00:00")
    assert "Z" not in body["now"]


def test_server_time_response_normalises_non_utc_input_to_utc():
    plus_two = timezone(timedelta(hours=2))

    response = ServerTimeResponse(now=datetime(2026, 10, 18, 22, 0, 0, tzinfo=plus_two))

    assert response.model_dump(mode="json")["now"] == "2026-10-18T20:00:00+00:00"


def test_server_time_response_rejects_naive_datetime():
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=datetime(2026, 10, 18, 20, 0, 0))


def test_server_time_response_rejects_non_utc_timezone_value():
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=datetime.now(timezone.utc), timezone="CET")


def test_server_time_response_defaults_timezone_to_utc():
    response = ServerTimeResponse(now=datetime.now(timezone.utc))

    assert response.timezone == "UTC"
