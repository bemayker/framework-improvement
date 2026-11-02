"""Integration tests for GET /api/uptime (TEST-07), full HTTP request/response cycle."""

import time
from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient

from app.main import create_app
from app.schemas.uptime import UptimeResponse


def test_get_uptime_returns_200_with_uptime_seconds_and_started_at(client: TestClient):
    """Criterion 1: 200 with exactly the two documented keys."""
    response = client.get("/api/uptime")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"uptime_seconds", "started_at"}
    assert isinstance(body["uptime_seconds"], (int, float))
    assert body["uptime_seconds"] >= 0


def test_get_uptime_seconds_increases_between_calls_a_second_apart(client: TestClient):
    """Criterion 2: uptime grows by about the time that passed."""
    first = client.get("/api/uptime").json()["uptime_seconds"]
    time.sleep(1.0)
    second = client.get("/api/uptime").json()["uptime_seconds"]

    assert second > first
    assert second - first >= 0.9


def test_get_uptime_started_at_is_stable_across_calls(client: TestClient):
    """Criterion 3: started_at is not recomputed per request."""
    first = client.get("/api/uptime").json()["started_at"]
    second = client.get("/api/uptime").json()["started_at"]

    assert first == second


def test_get_uptime_started_at_is_captured_at_startup_not_import(client: TestClient):
    """Criterion 3: a fresh app instance reports its own, later, startup time."""
    shared_started_at = datetime.fromisoformat(client.get("/api/uptime").json()["started_at"])
    time.sleep(0.05)

    before = datetime.now(UTC)
    with TestClient(create_app()) as fresh_client:
        fresh_started_at = datetime.fromisoformat(fresh_client.get("/api/uptime").json()["started_at"])
    after = datetime.now(UTC)

    assert fresh_started_at > shared_started_at
    assert before <= fresh_started_at <= after


def test_get_uptime_started_at_is_utc_with_explicit_offset(client: TestClient):
    """Criterion 3: the wire value ends in +00:00 and parses as aware UTC."""
    started_at = client.get("/api/uptime").json()["started_at"]

    assert started_at.endswith("+00:00")
    assert datetime.fromisoformat(started_at).utcoffset() == timedelta(0)


def test_get_uptime_body_matches_the_uptime_response_schema(client: TestClient):
    """Criterion 4: body validates against UptimeResponse, which OpenAPI names."""
    UptimeResponse.model_validate(client.get("/api/uptime").json())

    openapi = client.get("/openapi.json").json()
    ok_schema = openapi["paths"]["/api/uptime"]["get"]["responses"]["200"]["content"]["application/json"]["schema"]
    assert ok_schema["$ref"].endswith("/UptimeResponse")
    assert set(openapi["components"]["schemas"]["UptimeResponse"]["properties"]) == {
        "uptime_seconds",
        "started_at",
    }


def test_post_uptime_returns_405_method_not_allowed(client: TestClient):
    """Only reachable error case: the endpoint is read-only."""
    response = client.post("/api/uptime")

    assert response.status_code == 405
