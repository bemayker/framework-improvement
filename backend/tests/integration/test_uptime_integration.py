"""Integration tests for GET /api/uptime (TEST-07).

The endpoint needs no database; the lifespan skips schema set-up when
DATABASE_URL is unset, so these tests need no backing service.
"""

import time
from datetime import datetime, timedelta

from fastapi.testclient import TestClient

from app.main import create_app


def test_get_uptime_returns_200_with_exactly_the_two_fields(client: TestClient):
    response = client.get("/api/uptime")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"uptime_seconds", "started_at"}
    assert isinstance(body["uptime_seconds"], (int, float))
    assert isinstance(body["started_at"], str)


def test_get_uptime_is_non_negative_and_increases_between_calls(client: TestClient):
    first = client.get("/api/uptime").json()["uptime_seconds"]
    time.sleep(0.05)
    second = client.get("/api/uptime").json()["uptime_seconds"]

    assert first >= 0
    assert second > first


def test_get_uptime_started_at_is_stable_and_utc_with_explicit_offset(
    client: TestClient,
):
    first = client.get("/api/uptime").json()["started_at"]
    second = client.get("/api/uptime").json()["started_at"]

    assert first == second
    assert first.endswith("+00:00")
    assert datetime.fromisoformat(first).utcoffset() == timedelta(0)


def test_get_uptime_started_at_is_captured_per_startup():
    with TestClient(create_app()) as first_app:
        first = first_app.get("/api/uptime").json()["started_at"]
    time.sleep(0.01)
    with TestClient(create_app()) as second_app:
        second = second_app.get("/api/uptime").json()["started_at"]

    assert datetime.fromisoformat(second) > datetime.fromisoformat(first)


def test_get_uptime_response_is_the_uptime_response_schema(client: TestClient):
    schema = client.get("/openapi.json").json()
    ok = schema["paths"]["/api/uptime"]["get"]["responses"]["200"]

    ref = ok["content"]["application/json"]["schema"]["$ref"]
    assert ref == "#/components/schemas/UptimeResponse"


def test_post_uptime_returns_405(client: TestClient):
    assert client.post("/api/uptime").status_code == 405
