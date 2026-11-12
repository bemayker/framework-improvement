"""Integration tests for GET /api/uptime (TEST-07), full HTTP request/response cycle."""

import time

from fastapi.testclient import TestClient

from app.schemas.uptime import UptimeResponse


def test_get_uptime_returns_200_with_uptime_and_started_at(client: TestClient):
    response = client.get("/api/uptime")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"uptime_seconds", "started_at"}
    assert isinstance(body["uptime_seconds"], (int, float))
    assert body["started_at"].endswith("+00:00")
    UptimeResponse.model_validate(body)


def test_get_uptime_increases_between_calls_a_second_apart(client: TestClient):
    first = client.get("/api/uptime").json()["uptime_seconds"]
    time.sleep(1)
    second = client.get("/api/uptime").json()["uptime_seconds"]

    assert first >= 0
    assert second >= first + 1


def test_get_uptime_returns_same_started_at_across_requests(client: TestClient):
    first = client.get("/api/uptime").json()["started_at"]
    second = client.get("/api/uptime").json()["started_at"]

    assert first == second


def test_post_uptime_returns_405_method_not_allowed(client: TestClient):
    response = client.post("/api/uptime")

    assert response.status_code == 405
