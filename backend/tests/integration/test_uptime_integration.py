"""Integration tests for GET /api/uptime (TEST-07), full HTTP request/response cycle."""

import time
from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from app.main import create_app


def test_get_uptime_returns_200_with_uptime_and_started_at(client: TestClient):
    """Criteria 1 and 4: 200, exactly the two schema keys, typed values."""
    response = client.get("/api/uptime")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"uptime_seconds", "started_at"}
    assert isinstance(body["uptime_seconds"], (int, float))
    started_at = datetime.fromisoformat(body["started_at"])
    assert started_at.utcoffset() == timedelta(0)


def test_get_uptime_seconds_is_non_negative_and_increases_a_second_apart(
    client: TestClient,
):
    """Criterion 2: non-negative, and grows by at least the one-second gap."""
    first = client.get("/api/uptime").json()["uptime_seconds"]
    time.sleep(1.0)
    second = client.get("/api/uptime").json()["uptime_seconds"]

    assert first >= 0
    assert second >= 0
    assert second - first >= 1.0


def test_get_uptime_started_at_is_stable_across_requests(client: TestClient):
    """Criterion 3: started_at is identical on every call and ends in +00:00."""
    first = client.get("/api/uptime").json()["started_at"]
    second = client.get("/api/uptime").json()["started_at"]

    assert first == second
    assert first.endswith("+00:00")


def test_get_uptime_started_at_is_captured_at_startup():
    """Criterion 3: started_at is the lifespan-captured value, not request time."""
    with TestClient(create_app()) as fresh_client:
        after_startup = datetime.now(timezone.utc)
        response = fresh_client.get("/api/uptime")
        captured = fresh_client.app.state.process_start.started_at

    assert response.json()["started_at"] == captured.isoformat()
    assert captured <= after_startup


def test_openapi_declares_uptime_response_schema(client: TestClient):
    """Criteria 2 to 4: the published schema names UptimeResponse and its fields."""
    document = client.get("/openapi.json").json()

    ok_response = document["paths"]["/api/uptime"]["get"]["responses"]["200"]
    schema = document["components"]["schemas"]["UptimeResponse"]

    assert ok_response["content"]["application/json"]["schema"] == {
        "$ref": "#/components/schemas/UptimeResponse"
    }
    assert schema["properties"]["uptime_seconds"]["type"] == "number"
    assert schema["properties"]["uptime_seconds"]["minimum"] == 0
    assert schema["properties"]["started_at"]["type"] == "string"
    assert schema["properties"]["started_at"]["format"] == "date-time"
    assert set(schema["required"]) == {"uptime_seconds", "started_at"}


def test_post_uptime_returns_405_method_not_allowed(client: TestClient):
    """Only reachable error case: the endpoint is read-only."""
    response = client.post("/api/uptime")

    assert response.status_code == 405
