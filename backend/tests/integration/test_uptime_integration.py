"""Integration tests for GET /api/uptime (TEST-07), full HTTP request/response cycle.

The endpoint needs no database, so no database fixture is used.
"""

from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient

from app.services import uptime_service


def test_get_uptime_returns_200_with_uptime_seconds_and_started_at(client: TestClient):
    response = client.get("/api/uptime")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"uptime_seconds", "started_at"}
    assert isinstance(body["uptime_seconds"], int | float)
    assert body["uptime_seconds"] >= 0
    assert isinstance(body["started_at"], str)


def test_get_uptime_seconds_increases_between_two_calls_a_second_apart(
    client: TestClient, monkeypatch
):
    start = client.app.state.startup.started_monotonic

    monkeypatch.setattr(uptime_service, "monotonic", lambda: start + 1.0)
    first = client.get("/api/uptime").json()["uptime_seconds"]
    monkeypatch.setattr(uptime_service, "monotonic", lambda: start + 2.0)
    second = client.get("/api/uptime").json()["uptime_seconds"]

    assert first == 1.0
    assert second == 2.0
    assert second > first


def test_get_uptime_started_at_is_identical_across_requests(client: TestClient):
    first = client.get("/api/uptime").json()["started_at"]
    second = client.get("/api/uptime").json()["started_at"]

    assert first == second


def test_get_uptime_started_at_is_utc_with_explicit_offset(client: TestClient):
    started_at = client.get("/api/uptime").json()["started_at"]

    assert started_at.endswith("+00:00")
    assert datetime.fromisoformat(started_at).utcoffset() == timedelta(0)
    assert datetime.fromisoformat(started_at) <= datetime.now(UTC)


def test_get_uptime_openapi_response_references_uptime_response_schema(client: TestClient):
    spec = client.get("/openapi.json").json()

    schema = spec["paths"]["/api/uptime"]["get"]["responses"]["200"]["content"][
        "application/json"
    ]["schema"]
    assert schema == {"$ref": "#/components/schemas/UptimeResponse"}


def test_post_uptime_returns_405_method_not_allowed(client: TestClient):
    response = client.post("/api/uptime")

    assert response.status_code == 405
