"""Integration tests for GET /api/uptime (TEST-07).

The endpoint needs no database, so these tests deliberately do not request the
`database_url` fixture. The shared `client` fixture enters TestClient as a
context manager, which runs the lifespan that captures the process start.
"""

import time
from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient


def test_get_uptime_returns_200_with_exactly_the_two_keys(client: TestClient):
    response = client.get("/api/uptime")

    assert response.status_code == 200
    assert set(response.json()) == {"uptime_seconds", "started_at"}


def test_get_uptime_returns_a_non_negative_number(client: TestClient):
    body = client.get("/api/uptime").json()

    assert isinstance(body["uptime_seconds"], (int, float))
    assert not isinstance(body["uptime_seconds"], bool)
    assert body["uptime_seconds"] >= 0


def test_get_uptime_increases_between_calls_a_second_apart(client: TestClient):
    first = client.get("/api/uptime").json()
    time.sleep(1)
    second = client.get("/api/uptime").json()

    assert second["uptime_seconds"] - first["uptime_seconds"] >= 0.9


def test_get_uptime_started_at_is_captured_once_in_utc(client: TestClient):
    first = client.get("/api/uptime").json()
    time.sleep(0.05)
    second = client.get("/api/uptime").json()

    assert first["started_at"] == second["started_at"]
    assert first["started_at"].endswith("Z")
    parsed = datetime.fromisoformat(first["started_at"])
    assert parsed.utcoffset() == timedelta(0)
    assert parsed <= datetime.now(timezone.utc)


def test_openapi_documents_the_uptime_response_schema(client: TestClient):
    spec = client.get("/openapi.json").json()

    ref = spec["paths"]["/api/uptime"]["get"]["responses"]["200"]["content"][
        "application/json"
    ]["schema"]["$ref"]
    assert ref.endswith("/UptimeResponse")
    started_at = spec["components"]["schemas"]["UptimeResponse"]["properties"][
        "started_at"
    ]
    assert started_at["format"] == "date-time"


def test_post_uptime_returns_405(client: TestClient):
    response = client.post("/api/uptime")

    assert response.status_code == 405
