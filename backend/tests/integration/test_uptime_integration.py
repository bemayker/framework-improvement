"""Integration tests for GET /api/uptime (TEST-07), full HTTP request/response cycle."""

import time

from fastapi.testclient import TestClient


def test_get_uptime_returns_200_with_uptime_and_started_at(client: TestClient):
    """Criterion 1: 200 with a numeric uptime_seconds and a string started_at."""
    response = client.get("/api/uptime")

    assert response.status_code == 200
    payload = response.json()
    assert set(payload) == {"uptime_seconds", "started_at"}
    assert isinstance(payload["uptime_seconds"], (int, float))
    assert isinstance(payload["started_at"], str)


def test_get_uptime_seconds_increases_between_calls_a_second_apart(client: TestClient):
    """Criterion 2: non-negative, and larger a second later."""
    first = client.get("/api/uptime").json()["uptime_seconds"]
    time.sleep(1.0)
    second = client.get("/api/uptime").json()["uptime_seconds"]

    assert first >= 0
    assert second > first


def test_get_uptime_started_at_is_identical_across_requests(client: TestClient):
    """Criterion 3: started_at is captured once, not recomputed per request."""
    first = client.get("/api/uptime").json()["started_at"]
    second = client.get("/api/uptime").json()["started_at"]

    assert first == second


def test_get_uptime_started_at_is_utc_with_explicit_offset(client: TestClient):
    """Criterion 3: started_at ends in +00:00, not Z or a local offset."""
    started_at = client.get("/api/uptime").json()["started_at"]

    assert started_at.endswith("+00:00")


def test_get_uptime_openapi_response_schema_is_uptime_response(client: TestClient):
    """Criterion 4: the 200 response is declared by the UptimeResponse schema."""
    document = client.get("/openapi.json").json()

    schema = document["paths"]["/api/uptime"]["get"]["responses"]["200"]["content"][
        "application/json"
    ]["schema"]
    assert schema["$ref"].endswith("/UptimeResponse")


def test_post_uptime_returns_405_method_not_allowed(client: TestClient):
    """Error case: the endpoint is read-only."""
    response = client.post("/api/uptime")

    assert response.status_code == 405
