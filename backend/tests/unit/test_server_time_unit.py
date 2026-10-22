"""Unit tests for the server time schema, clock function and contract (FEAT-1)."""

from datetime import UTC, datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.main import create_app
from app.routers.server_time import current_utc_time
from app.schemas.server_time import ServerTimeResponse


def test_server_time_response_serializes_now_with_z_suffix():
    """Happy path: now dumps with the pinned 'Z' designator, never +00:00."""
    response = ServerTimeResponse(now=datetime(2026, 10, 22, 17, 29, 35, tzinfo=UTC))

    dumped = response.model_dump(mode="json")

    assert dumped == {"now": "2026-10-22T17:29:35Z", "timezone": "UTC"}
    assert dumped["now"].endswith("Z")
    assert "+00:00" not in dumped["now"]
    assert datetime.fromisoformat(dumped["now"]).utcoffset() == timedelta(0)


def test_server_time_response_keeps_microseconds_before_z():
    """Edge case: non-zero microseconds are kept ahead of the suffix."""
    response = ServerTimeResponse(
        now=datetime(2026, 10, 22, 17, 29, 35, 123456, tzinfo=UTC)
    )

    assert response.model_dump(mode="json")["now"] == "2026-10-22T17:29:35.123456Z"


def test_server_time_response_normalises_non_utc_offset_to_z():
    """Edge case: a +02:00 input is dumped as the equivalent UTC instant."""
    plus_two = timezone(timedelta(hours=2))
    response = ServerTimeResponse(now=datetime(2026, 10, 22, 19, 29, 35, tzinfo=plus_two))

    assert response.model_dump(mode="json")["now"] == "2026-10-22T17:29:35Z"


def test_server_time_response_with_naive_now_raises_validation_error():
    """Error case: now must carry an explicit offset."""
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=datetime(2026, 10, 22, 17, 29, 35))


def test_server_time_response_with_other_timezone_raises_validation_error():
    """Error case: timezone is the constant 'UTC'."""
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=datetime.now(UTC), timezone="Europe/Brussels")


def test_current_utc_time_returns_aware_utc_now():
    """Happy path: the clock reading is aware UTC and lies between two readings."""
    before = datetime.now(UTC)
    reading = current_utc_time()
    after = datetime.now(UTC)

    assert reading.tzinfo is not None
    assert reading.utcoffset() == timedelta(0)
    assert before <= reading <= after


def test_openapi_declares_server_time_response_fields():
    """The response is declared by the schema: date-time string, constant timezone."""
    schema = create_app().openapi()

    ref = schema["paths"]["/api/time"]["get"]["responses"]["200"]["content"][
        "application/json"
    ]["schema"]["$ref"]
    component = schema["components"]["schemas"][ref.rsplit("/", 1)[-1]]
    properties = component["properties"]

    assert properties["now"]["type"] == "string"
    assert properties["now"]["format"] == "date-time"
    assert "timezone" in properties
    timezone_schema = properties["timezone"]
    assert timezone_schema.get("const") == "UTC" or timezone_schema.get("enum") == ["UTC"]
    assert "now" in component["required"]
