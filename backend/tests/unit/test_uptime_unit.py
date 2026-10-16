"""Unit tests for the uptime response schema (TEST-07)."""

from datetime import datetime, timezone

import pytest
from pydantic import ValidationError

from app.main import create_app
from app.schemas.uptime import UptimeResponse


def test_uptime_response_serialises_utc_started_at_with_z_offset():
    """Criterion 3: an aware UTC datetime is written with the Z designator."""
    response = UptimeResponse(
        uptime_seconds=1.5,
        started_at=datetime(2026, 10, 16, 3, 33, 49, tzinfo=timezone.utc),
    )

    assert "2026-10-16T03:33:49Z" in response.model_dump_json()


def test_uptime_response_rejects_naive_started_at():
    """Error case: a timestamp with no offset is refused."""
    with pytest.raises(ValidationError):
        UptimeResponse(uptime_seconds=1.0, started_at=datetime(2026, 10, 16, 3, 33, 49))


def test_uptime_response_rejects_negative_uptime_seconds():
    """Error case: uptime cannot be negative."""
    with pytest.raises(ValidationError):
        UptimeResponse(
            uptime_seconds=-1.0,
            started_at=datetime(2026, 10, 16, 3, 33, 49, tzinfo=timezone.utc),
        )


def test_openapi_declares_uptime_response_schema():
    """Criterion 4: the OpenAPI document names UptimeResponse with typed fields."""
    document = create_app().openapi()

    ref = document["paths"]["/api/uptime"]["get"]["responses"]["200"]["content"][
        "application/json"
    ]["schema"]["$ref"]
    assert ref.endswith("/UptimeResponse")

    schema = document["components"]["schemas"]["UptimeResponse"]
    assert schema["properties"]["uptime_seconds"]["type"] == "number"
    assert schema["properties"]["uptime_seconds"]["minimum"] == 0
    assert schema["properties"]["started_at"]["type"] == "string"
    assert schema["properties"]["started_at"]["format"] == "date-time"
    assert set(schema["required"]) == {"uptime_seconds", "started_at"}
