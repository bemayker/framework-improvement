"""Integration tests for GET /api/uptime (TEST-07), full HTTP request/response cycle."""

import time
from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from app.main import create_app
from app.schemas.uptime import UptimeResponse


def test_get_uptime_returns_200_with_uptime_and_started_at(client: TestClient):
    """Criterion 1: 200 with exactly the two documented keys."""
    response = client.get("/api/uptime")

    body = response.json()
    assert response.status_code == 200
    assert set(body) == {"uptime_seconds", "started_at"}
    assert isinstance(body["uptime_seconds"], (int, float))
    assert not isinstance(body["uptime_seconds"], bool)
    datetime.fromisoformat(body["started_at"])


def test_get_uptime_is_non_negative_and_increases_a_second_apart(client: TestClient):
    """Criterion 2: both readings are at least 0 and grow by about a second."""
    first = client.get("/api/uptime").json()["uptime_seconds"]
    time.sleep(1)
    second = client.get("/api/uptime").json()["uptime_seconds"]

    assert first >= 0
    assert second - first >= 0.9


def test_get_uptime_started_at_is_constant_across_requests(client: TestClient):
    """Criterion 3: started_at is not recomputed per request."""
    first = client.get("/api/uptime").json()["started_at"]
    second = client.get("/api/uptime").json()["started_at"]

    assert first == second


def test_get_uptime_started_at_is_captured_at_startup_in_utc():
    """Criterion 3: a fresh app's started_at is UTC and lies within its startup."""
    app = create_app()
    before = datetime.now(timezone.utc)
    with TestClient(app) as fresh_client:
        after = datetime.now(timezone.utc)
        started_at = datetime.fromisoformat(
            fresh_client.get("/api/uptime").json()["started_at"]
        )

    assert started_at.utcoffset() == timedelta(0)
    assert before <= started_at <= after


def test_get_uptime_response_is_defined_by_uptime_response_schema(client: TestClient):
    """Criterion 4: the body validates against, and OpenAPI references, the schema."""
    response = client.get("/api/uptime")

    UptimeResponse.model_validate(response.json())
    operation = client.get("/openapi.json").json()["paths"]["/api/uptime"]["get"]
    schema_ref = operation["responses"]["200"]["content"]["application/json"]["schema"]
    assert schema_ref["$ref"].endswith("/UptimeResponse")


def test_post_uptime_returns_405_method_not_allowed(client: TestClient):
    """Error case: the endpoint is read-only."""
    response = client.post("/api/uptime")

    assert response.status_code == 405
