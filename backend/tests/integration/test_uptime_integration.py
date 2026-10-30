"""Integration tests for GET /api/uptime (TEST-07), full HTTP request/response cycle."""

from datetime import UTC, datetime

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from app.schemas.uptime import UptimeResponse
from app.services import uptime_service


def test_get_uptime_returns_200_with_uptime_seconds_and_started_at(client: TestClient):
    """Criteria 1 and 2 (non-negative): status, exact keys, value types."""
    response = client.get("/api/uptime")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"uptime_seconds", "started_at"}
    assert isinstance(body["uptime_seconds"], (int, float))
    assert not isinstance(body["uptime_seconds"], bool)
    assert body["uptime_seconds"] >= 0
    datetime.fromisoformat(body["started_at"])


def test_get_uptime_increases_between_two_calls_a_second_apart(monkeypatch):
    """Criterion 2: the second call reads a monotonic clock 1.0 later."""
    readings = iter([1000.0, 1000.5, 1001.5])
    monkeypatch.setattr(uptime_service, "monotonic", lambda: next(readings))

    app = create_app()  # consumes the first reading as the start
    with TestClient(app) as fresh_client:
        first = fresh_client.get("/api/uptime").json()["uptime_seconds"]
        second = fresh_client.get("/api/uptime").json()["uptime_seconds"]

    assert second > first
    assert second - first == pytest.approx(1.0)


def test_get_uptime_started_at_is_stable_across_requests_and_utc():
    """Criterion 3: captured once at startup, UTC with an explicit offset."""
    app = create_app()
    with TestClient(app) as fresh_client:
        first = fresh_client.get("/api/uptime").json()["started_at"]
        second = fresh_client.get("/api/uptime").json()["started_at"]
    after = datetime.now(UTC)

    assert first == second
    assert first.endswith("+00:00")
    parsed = datetime.fromisoformat(first)
    assert parsed.utcoffset().total_seconds() == 0
    assert parsed <= after
    assert first == app.state.process_clock.started_at.isoformat()


def test_get_uptime_started_at_differs_for_a_new_app_instance():
    """Criterion 3: a simulated restart reports its own, not earlier, start."""
    first_app = create_app()
    second_app = create_app()
    with TestClient(first_app) as first_client, TestClient(second_app) as second_client:
        first = first_client.get("/api/uptime").json()["started_at"]
        second = second_client.get("/api/uptime").json()["started_at"]

    assert first == first_app.state.process_clock.started_at.isoformat()
    assert second == second_app.state.process_clock.started_at.isoformat()
    assert datetime.fromisoformat(second) >= datetime.fromisoformat(first)


def test_get_uptime_response_schema_is_uptime_response(client: TestClient):
    """Criterion 4: OpenAPI names UptimeResponse and the body validates against it."""
    openapi = client.get("/openapi.json").json()
    schema = openapi["paths"]["/api/uptime"]["get"]["responses"]["200"]["content"][
        "application/json"
    ]["schema"]

    assert schema == {"$ref": "#/components/schemas/UptimeResponse"}
    UptimeResponse.model_validate(client.get("/api/uptime").json())


def test_post_uptime_returns_405_method_not_allowed(client: TestClient):
    """Only error case: the endpoint is read-only."""
    response = client.post("/api/uptime")

    assert response.status_code == 405
