"""Unit tests for the server time schema and router (FEAT-1)."""

from datetime import UTC, datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.main import create_app
from app.schemas.server_time import ServerTimeResponse


def test_server_time_response_serialises_now_with_z_suffix():
    """Happy path, offset: exactly two keys, now ends in Z."""
    response = ServerTimeResponse(
        now=datetime(2026, 10, 16, 3, 33, 49, tzinfo=UTC), timezone="UTC"
    )

    assert response.model_dump(mode="json") == {
        "now": "2026-10-16T03:33:49Z",
        "timezone": "UTC",
    }


def test_server_time_response_normalises_non_utc_offset_to_z():
    """Edge case: the Z suffix is a schema property, not caller discipline."""
    plus_two = timezone(timedelta(hours=2))
    response = ServerTimeResponse(
        now=datetime(2026, 10, 16, 5, 33, 49, tzinfo=plus_two), timezone="UTC"
    )

    assert response.model_dump(mode="json")["now"] == "2026-10-16T03:33:49Z"


def test_server_time_response_rejects_naive_now():
    """Error case: a naive datetime is refused."""
    with pytest.raises(ValidationError):
        ServerTimeResponse(now=datetime(2026, 10, 16, 3, 33, 49), timezone="UTC")


def test_server_time_response_rejects_timezone_other_than_utc():
    """Error case: timezone is restricted to the single value UTC."""
    with pytest.raises(ValidationError):
        ServerTimeResponse(
            now=datetime(2026, 10, 16, 3, 33, 49, tzinfo=UTC), timezone="Europe/Brussels"
        )


def test_get_server_time_reads_the_clock_on_every_request(monkeypatch):
    """Freshness: a stubbed clock advancing one second shows a per-request read."""
    readings = iter(
        [
            datetime(2026, 10, 16, 3, 33, 49, tzinfo=UTC),
            datetime(2026, 10, 16, 3, 33, 50, tzinfo=UTC),
        ]
    )

    class StubDatetime:
        @staticmethod
        def now(tz):
            assert tz is UTC
            return next(readings)

    monkeypatch.setattr("app.routers.server_time.datetime", StubDatetime)
    client = TestClient(create_app())

    first = client.get("/api/time").json()["now"]
    second = client.get("/api/time").json()["now"]

    assert first == "2026-10-16T03:33:49Z"
    assert second == "2026-10-16T03:33:50Z"


def test_openapi_declares_server_time_response_schema():
    """Criterion 3: the 200 response references ServerTimeResponse."""
    openapi = create_app().openapi()
    ok = openapi["paths"]["/api/time"]["get"]["responses"]["200"]
    schema = openapi["components"]["schemas"]["ServerTimeResponse"]

    assert ok["content"]["application/json"]["schema"]["$ref"].endswith(
        "/ServerTimeResponse"
    )
    assert schema["properties"]["now"]["type"] == "string"
    assert schema["properties"]["now"]["format"] == "date-time"
    assert schema["properties"]["timezone"]["type"] == "string"
    assert schema["properties"]["timezone"]["const"] == "UTC"
    assert set(schema["required"]) == {"now", "timezone"}
